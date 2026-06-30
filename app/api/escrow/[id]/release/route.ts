import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { paystackClient } from '@/lib/payment/paystack';
import { EscrowStage, canTransition } from '@/lib/escrow/state-machine';
import { rateLimit } from '@/lib/rate-limit';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReleaseRequestBody {
  userId: string;
}

interface OrderRow {
  id: string;
  status: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  seller_payout: number | null;
  escrow_fee: number | null;
  escrow_transactions: EscrowTransactionRow[];
  seller: SellerRow | null;
}

interface EscrowTransactionRow {
  id: string;
  status: string;
}

interface SellerRow {
  paystack_recipient_code: string | null;
}

// ─── Route ────────────────────────────────────────────────────────────────────

// POST /api/escrow/[id]/release
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // ── Rate limit: 3 attempts per order per 60 s ─────────────────────────
    const allowed = await rateLimit(`release:${orderId}`, 3, 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait before retrying.' }, { status: 429 });
    }

    // ── Parse body ────────────────────────────────────────────────────────
    let body: ReleaseRequestBody;
    try {
      body = (await req.json()) as ReleaseRequestBody;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // ── 1. Fetch order with related data ──────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        buyer_id,
        seller_id,
        amount,
        seller_payout,
        escrow_fee,
        escrow_transactions ( id, status ),
        seller:seller_id ( paystack_recipient_code )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const typedOrder = order as unknown as OrderRow;

    // ── 2. Authorization: only the buyer can confirm delivery ─────────────
    if (typedOrder.buyer_id !== userId) {
      return NextResponse.json(
        { error: 'Only the buyer can confirm delivery and release funds' },
        { status: 403 }
      );
    }

    // ── 3. State validation: must be DELIVERED to release ─────────────────
    if (!canTransition(typedOrder.status, EscrowStage.COMPLETED)) {
      return NextResponse.json(
        {
          error: `Cannot release from status "${typedOrder.status}". Order must be in "${EscrowStage.DELIVERED}" state.`,
        },
        { status: 400 }
      );
    }

    // ── 4. Verify held escrow funds exist ─────────────────────────────────
    const escrowTx = typedOrder.escrow_transactions?.[0];
    if (!escrowTx || escrowTx.status !== 'held') {
      return NextResponse.json(
        { error: 'No held escrow funds found for this order' },
        { status: 400 }
      );
    }

    // ── 5. Verify seller has a payout recipient ───────────────────────────
    const recipientCode = typedOrder.seller?.paystack_recipient_code;
    if (!recipientCode) {
      return NextResponse.json(
        { error: 'Seller has not set up a bank account for payouts. Contact support.' },
        { status: 422 }
      );
    }

    // ── 6. Calculate payout amount ────────────────────────────────────────
    const sellerPayout =
      typedOrder.seller_payout ??
      typedOrder.amount - (typedOrder.escrow_fee ?? 0);

    if (sellerPayout <= 0) {
      return NextResponse.json({ error: 'Invalid payout amount calculated' }, { status: 422 });
    }

    // ── 7. Execute Paystack transfer to seller's bank ─────────────────────
    const transferRef = `mb_payout_${orderId}_${Date.now()}`;
    const transferResult = await paystackClient.createTransfer({
      recipient: recipientCode,
      amount: Math.round(sellerPayout * 100), // kobo
      reason: `Payout for order #${orderId}`,
      reference: transferRef,
    });

    if (!transferResult.status) {
      return NextResponse.json(
        { error: `Transfer initiation failed: ${transferResult.message}` },
        { status: 502 }
      );
    }

    // ── 8. Update escrow_transaction → releasing ──────────────────────────
    await supabase
      .from('escrow_transactions')
      .update({
        status: 'releasing',
        paystack_transfer_ref: transferResult.data.reference,
        released_at: new Date().toISOString(),
      })
      .eq('id', escrowTx.id);

    // ── 9. Update order → completed ───────────────────────────────────────
    await supabase
      .from('orders')
      .update({
        status: EscrowStage.COMPLETED,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // ── 10. Award MarketCoins (buyer: 1 MC per ₦100, seller: 10 MC) ───────
    await awardMarketCoins(supabase, {
      buyerId: typedOrder.buyer_id,
      sellerId: typedOrder.seller_id,
      amount: typedOrder.amount,
      orderId,
    });

    return NextResponse.json({
      success: true,
      message: 'Delivery confirmed. Funds are being released to the seller.',
      transferReference: transferResult.data.reference,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Release Escrow Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface AwardCoinsParams {
  buyerId: string;
  sellerId: string;
  amount: number;
  orderId: string;
}

async function awardMarketCoins(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  { buyerId, sellerId, amount, orderId }: AwardCoinsParams
): Promise<void> {
  // Buyer: 1 MC per ₦100 spent
  const buyerCoins = Math.floor(amount / 100);
  // Seller: 10 MC per completed sale
  const sellerCoins = 10;

  await Promise.allSettled([
    incrementCoins(supabase, buyerId, buyerCoins, 'purchase', orderId),
    incrementCoins(supabase, sellerId, sellerCoins, 'sale', orderId),
  ]);
}

async function incrementCoins(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  amount: number,
  type: string,
  sourceId: string
): Promise<void> {
  if (!userId || amount <= 0) return;

  const { data: user } = await supabase
    .from('users')
    .select('coins_balance, coins_lifetime_earned')
    .eq('id', userId)
    .single();

  if (!user) return;

  const newBalance = ((user as { coins_balance: number | null }).coins_balance ?? 0) + amount;
  const newLifetime = ((user as { coins_lifetime_earned: number | null }).coins_lifetime_earned ?? 0) + amount;

  await supabase
    .from('users')
    .update({
      coins_balance: newBalance,
      coins_lifetime_earned: newLifetime,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  await supabase.from('coin_transactions').insert({
    user_id: userId,
    amount,
    type,
    source_id: sourceId,
    description: `Earned ${amount} MC from ${type}`,
    created_at: new Date().toISOString(),
  });
}
