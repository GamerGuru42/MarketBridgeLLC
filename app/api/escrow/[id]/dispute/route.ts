import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EscrowStage } from '@/lib/escrow/state-machine';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DisputeRequestBody {
  userId: string;
  reason: string;
  description: string;
  evidenceUrls?: string[];
}

const VALID_DISPUTE_STATES: string[] = [
  EscrowStage.PAYMENT_HELD,
  EscrowStage.IN_TRANSIT,
  EscrowStage.DELIVERED,
];

// ─── Route ────────────────────────────────────────────────────────────────────

// POST /api/escrow/[id]/dispute
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // ── Parse body ────────────────────────────────────────────────────────
    let body: DisputeRequestBody;
    try {
      body = (await req.json()) as DisputeRequestBody;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { userId, reason, description, evidenceUrls = [] } = body;

    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    if (!reason) return NextResponse.json({ error: 'reason is required' }, { status: 400 });
    if (!description) return NextResponse.json({ error: 'description is required' }, { status: 400 });

    const supabase = await createServerSupabaseClient();

    // ── 1. Fetch order with escrow transaction ─────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, escrow_transactions(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const typedOrder = order as {
      id: string;
      status: string;
      buyer_id: string;
      seller_id: string;
      escrow_transactions: Array<{ id: string; status: string }>;
    };

    // ── 2. Authorization: only buyer or seller can raise a dispute ─────────
    const isParty =
      typedOrder.buyer_id === userId || typedOrder.seller_id === userId;
    if (!isParty) {
      return NextResponse.json(
        { error: 'Only the buyer or seller can raise a dispute on this order' },
        { status: 403 }
      );
    }

    // ── 3. State validation ───────────────────────────────────────────────
    if (!VALID_DISPUTE_STATES.includes(typedOrder.status)) {
      return NextResponse.json(
        {
          error: `Cannot dispute from status "${typedOrder.status}". Valid states: ${VALID_DISPUTE_STATES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // ── 4. Find least-busy admin to assign ───────────────────────────────
    const assignedAdmin = await findLeastBusyAdmin(supabase);

    // ── 5. Create dispute record ──────────────────────────────────────────
    const disputeDeadline = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(); // 7 days

    const { data: dispute, error: disputeErr } = await supabase
      .from('disputes')
      .insert({
        order_id: orderId,
        raised_by: userId,
        reason,
        description,
        evidence_urls: evidenceUrls,
        status: 'open',
        assigned_admin: assignedAdmin,
        deadline: disputeDeadline,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (disputeErr || !dispute) {
      console.error('Failed to create dispute:', disputeErr);
      return NextResponse.json(
        { error: 'Failed to create dispute record' },
        { status: 500 }
      );
    }

    const typedDispute = dispute as { id: string };

    // ── 6. Freeze escrow funds ────────────────────────────────────────────
    const escrowTx = typedOrder.escrow_transactions?.[0];
    if (escrowTx) {
      await supabase
        .from('escrow_transactions')
        .update({ status: 'frozen' })
        .eq('id', escrowTx.id);
    }

    // ── 7. Update order status ────────────────────────────────────────────
    await supabase
      .from('orders')
      .update({
        status: EscrowStage.DISPUTED,
        dispute_id: typedDispute.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // ── 8. Notify all parties ─────────────────────────────────────────────
    const notifications = [
      {
        user_id: typedOrder.buyer_id,
        type: 'dispute_opened',
        message: `A dispute has been opened for order #${orderId}. An admin will review within 7 days.`,
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        user_id: typedOrder.seller_id,
        type: 'dispute_opened',
        message: `A dispute has been raised on order #${orderId}. Please submit your evidence within 7 days.`,
        read: false,
        created_at: new Date().toISOString(),
      },
    ];

    if (assignedAdmin) {
      notifications.push({
        user_id: assignedAdmin,
        type: 'dispute_assigned',
        message: `New dispute assigned to you: order #${orderId}. Deadline: ${new Date(disputeDeadline).toLocaleDateString()}.`,
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    await supabase.from('notifications').insert(notifications);

    return NextResponse.json({
      success: true,
      message: 'Dispute filed successfully. Funds have been frozen pending review.',
      disputeId: typedDispute.id,
      deadline: disputeDeadline,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Dispute Escrow Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Finds the active admin with the fewest open disputes assigned to them.
 * Returns null if no admins are available.
 */
async function findLeastBusyAdmin(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<string | null> {
  const { data: admins } = await supabase
    .from('users')
    .select('id')
    .in('role', ['admin', 'operations'])
    .eq('active', true);

  if (!admins || admins.length === 0) return null;

  // Count open disputes per admin
  const { data: openDisputes } = await supabase
    .from('disputes')
    .select('assigned_admin')
    .eq('status', 'open')
    .not('assigned_admin', 'is', null);

  const countMap: Record<string, number> = {};
  (openDisputes ?? []).forEach((d: { assigned_admin: string | null }) => {
    if (d.assigned_admin) {
      countMap[d.assigned_admin] = (countMap[d.assigned_admin] ?? 0) + 1;
    }
  });

  let minAdmin = (admins[0] as { id: string }).id;
  let minCount = countMap[minAdmin] ?? 0;

  for (const admin of admins as Array<{ id: string }>) {
    const count = countMap[admin.id] ?? 0;
    if (count < minCount) {
      minCount = count;
      minAdmin = admin.id;
    }
  }

  return minAdmin;
}
