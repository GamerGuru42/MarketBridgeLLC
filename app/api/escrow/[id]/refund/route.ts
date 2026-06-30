import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { paystackClient } from '@/lib/payment/paystack';
import { EscrowStage } from '@/lib/escrow/state-machine';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefundRequestBody {
  userId: string;
  reason: string;
}

type AdminRole = 'admin' | 'ceo' | 'operations' | 'technical';
const ADMIN_ROLES: AdminRole[] = ['admin', 'ceo', 'operations', 'technical'];

const VALID_REFUND_STATES: string[] = [
  EscrowStage.PAYMENT_HELD,
  EscrowStage.DISPUTED,
  EscrowStage.IN_TRANSIT,
];

// ─── Route ────────────────────────────────────────────────────────────────────

// POST /api/escrow/[id]/refund
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // ── Parse body ────────────────────────────────────────────────────────
    let body: RefundRequestBody;
    try {
      body = (await req.json()) as RefundRequestBody;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { userId, reason } = body;
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    if (!reason) return NextResponse.json({ error: 'reason is required' }, { status: 400 });

    const supabase = await createServerSupabaseClient();

    // ── 1. Fetch caller's role ─────────────────────────────────────────────
    const { data: callerUser, error: userErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userErr || !callerUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isAdmin = ADMIN_ROLES.includes(
      (callerUser as { role: string }).role as AdminRole
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only platform admins can process refunds' },
        { status: 403 }
      );
    }

    // ── 2. Fetch order with escrow transaction ─────────────────────────────
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, escrow_transactions(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ── 3. State validation ───────────────────────────────────────────────
    if (!VALID_REFUND_STATES.includes((order as { status: string }).status)) {
      return NextResponse.json(
        {
          error: `Cannot refund from status "${(order as { status: string }).status}". Valid states: ${VALID_REFUND_STATES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // ── 4. Verify held/frozen escrow funds ────────────────────────────────
    const escrowTxs = (order as { escrow_transactions: Array<{ id: string; status: string; paystack_transaction_id: string | null }> }).escrow_transactions;
    const escrowTx = escrowTxs?.[0];

    if (!escrowTx || !['held', 'frozen'].includes(escrowTx.status)) {
      return NextResponse.json(
        { error: 'No held or frozen escrow funds found for this order' },
        { status: 400 }
      );
    }

    if (!escrowTx.paystack_transaction_id) {
      return NextResponse.json(
        { error: 'No Paystack transaction ID found on escrow record — cannot process refund' },
        { status: 422 }
      );
    }

    // ── 5. Execute Paystack refund ────────────────────────────────────────
    const amountPaid = (order as { amount_paid?: number; amount?: number }).amount_paid
      ?? (order as { amount?: number }).amount
      ?? 0;

    const refundResult = await paystackClient.refund({
      transaction: escrowTx.paystack_transaction_id,
      amount: Math.round(amountPaid * 100), // full refund in kobo
      merchant_note: `Refund for order #${orderId}: ${reason}`,
    });

    if (!refundResult.status) {
      return NextResponse.json(
        { error: `Paystack refund failed: ${refundResult.message}` },
        { status: 502 }
      );
    }

    // ── 6. Update escrow_transaction ──────────────────────────────────────
    await supabase
      .from('escrow_transactions')
      .update({
        status: 'refunded',
        refund_reference: refundResult.data.transaction_reference,
        refunded_at: new Date().toISOString(),
      })
      .eq('id', escrowTx.id);

    // ── 7. Update order ───────────────────────────────────────────────────
    await supabase
      .from('orders')
      .update({
        status: EscrowStage.REFUNDED,
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // ── 8. Notify both parties ────────────────────────────────────────────
    const orderTyped = order as {
      buyer_id: string;
      seller_id: string;
      amount_paid?: number;
      amount?: number;
    };
    const displayAmount = orderTyped.amount_paid ?? orderTyped.amount ?? 0;

    await Promise.allSettled([
      supabase.from('notifications').insert({
        user_id: orderTyped.buyer_id,
        type: 'refund_processed',
        message: `Your refund of ₦${displayAmount.toLocaleString()} for order #${orderId} has been processed.`,
        read: false,
        created_at: new Date().toISOString(),
      }),
      supabase.from('notifications').insert({
        user_id: orderTyped.seller_id,
        type: 'order_refunded',
        message: `Order #${orderId} has been refunded to the buyer. Reason: ${reason}`,
        read: false,
        created_at: new Date().toISOString(),
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      refundReference: refundResult.data.transaction_reference,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Refund Escrow Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
