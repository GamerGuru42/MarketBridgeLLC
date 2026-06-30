/**
 * MarketBridge Paystack Webhook Handler
 * Idempotent — all events are recorded in `processed_webhooks` before processing.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { EscrowStage } from '@/lib/escrow/state-machine';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaystackEventData {
  id: number;
  reference: string;
  amount: number; // kobo
  status: string;
  customer?: { email?: string };
  metadata?: Record<string, unknown>;
  transfer_code?: string;
  recipient?: { metadata?: Record<string, unknown> };
}

interface PaystackEvent {
  event: string;
  data: PaystackEventData;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export class PaystackWebhookHandler {
  /**
   * Entry point: call this from the route after verifying the HMAC signature.
   * Returns silently if the event has already been processed.
   */
  static async handleEvent(event: PaystackEvent): Promise<void> {
    const eventId = String(event.data.id);
    const eventType = event.event;

    // ── Idempotency check ────────────────────────────────────────────────────
    const { error: dupError } = await supabaseAdmin
      .from('processed_webhooks')
      .insert({
        paystack_event_id: eventId,
        event_type: eventType,
        payload: event as unknown as Record<string, unknown>,
      });

    if (dupError) {
      // Unique constraint violation → already processed
      if (dupError.code === '23505') {
        console.log(`[webhook] Skipping duplicate event ${eventId} (${eventType})`);
        return;
      }
      // Any other DB error — log but continue; don't let idempotency block processing
      console.error('[webhook] Failed to record processed_webhook:', dupError);
    }

    console.log(`[webhook] Processing ${eventType} (event_id=${eventId})`);

    try {
      switch (eventType) {
        case 'charge.success':
          await this.handleChargeSuccess(event);
          break;

        case 'transfer.success':
          await this.handleTransferSuccess(event);
          break;

        case 'transfer.failed':
          await this.handleTransferFailed(event);
          break;

        case 'chargeback.created':
          await this.handleChargebackCreated(event);
          break;

        default:
          console.log(`[webhook] Unhandled event type: ${eventType}`);
      }
    } catch (err) {
      console.error(`[webhook] Error handling ${eventType}:`, err);
      throw err; // Let the route return 500 so Paystack retries
    }
  }

  // ─── charge.success ──────────────────────────────────────────────────────

  private static async handleChargeSuccess(event: PaystackEvent): Promise<void> {
    const { reference, amount, metadata } = event.data;
    const orderId = metadata?.order_id as string | undefined;

    if (!orderId) {
      console.warn('[webhook] charge.success has no order_id in metadata — skipping escrow logic');
      return;
    }

    // Fetch the order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, status, buyer_id, seller_id, total_amount, escrow_fee')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      console.error('[webhook] charge.success: order not found', orderId, orderErr);
      return;
    }

    // Only advance if still awaiting payment
    if (order.status !== EscrowStage.AWAITING_PAYMENT) {
      console.warn(`[webhook] charge.success: order ${orderId} already in status ${order.status}`);
      return;
    }

    const amountNaira = amount / 100;

    // Update order → payment_held
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        status: EscrowStage.PAYMENT_HELD,
        paystack_transaction_id: String(event.data.id),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) {
      console.error('[webhook] Failed to update order to payment_held:', updateErr);
      throw updateErr;
    }

    // Create escrow_transactions record
    const { error: escrowErr } = await supabaseAdmin
      .from('escrow_transactions')
      .insert({
        order_id: orderId,
        amount: amountNaira,
        status: 'held',
        paystack_transaction_id: reference,
        held_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    if (escrowErr) {
      console.error('[webhook] Failed to create escrow_transaction:', escrowErr);
      // Don't throw — order status is already updated, partial state is recoverable
    }

    console.log(`[webhook] Order ${orderId} → payment_held (₦${amountNaira})`);
  }

  // ─── transfer.success ─────────────────────────────────────────────────────

  private static async handleTransferSuccess(event: PaystackEvent): Promise<void> {
    const { reference } = event.data;

    // Find the escrow_transaction by the transfer reference we stored
    const { data: escrowTx, error: txErr } = await supabaseAdmin
      .from('escrow_transactions')
      .select('id, order_id, status')
      .eq('paystack_transfer_ref', reference)
      .single();

    if (txErr || !escrowTx) {
      console.warn('[webhook] transfer.success: no escrow_transaction found for ref', reference);
      return;
    }

    // Update escrow → released
    await supabaseAdmin
      .from('escrow_transactions')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
      })
      .eq('id', escrowTx.id);

    // Update order → completed
    await supabaseAdmin
      .from('orders')
      .update({
        status: EscrowStage.COMPLETED,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowTx.order_id);

    console.log(`[webhook] Transfer confirmed — order ${escrowTx.order_id} → completed`);
  }

  // ─── transfer.failed ──────────────────────────────────────────────────────

  private static async handleTransferFailed(event: PaystackEvent): Promise<void> {
    const { reference } = event.data;

    const { data: escrowTx, error: txErr } = await supabaseAdmin
      .from('escrow_transactions')
      .select('id, order_id')
      .eq('paystack_transfer_ref', reference)
      .single();

    if (txErr || !escrowTx) {
      console.warn('[webhook] transfer.failed: no escrow_transaction found for ref', reference);
      return;
    }

    // Revert escrow back to held so admin can retry
    await supabaseAdmin
      .from('escrow_transactions')
      .update({ status: 'held' })
      .eq('id', escrowTx.id);

    // Revert order back to delivered so seller can be re-paid
    await supabaseAdmin
      .from('orders')
      .update({
        status: EscrowStage.DELIVERED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', escrowTx.order_id);

    // Notify admins
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('id')
      .in('role', ['admin', 'ceo', 'operations', 'technical']);

    if (admins && admins.length > 0) {
      const notifications = admins.map((a: { id: string }) => ({
        user_id: a.id,
        type: 'transfer_failed',
        message: `Transfer failed for order ${escrowTx.order_id}. Reference: ${reference}. Manual retry required.`,
        read: false,
        created_at: new Date().toISOString(),
      }));
      await supabaseAdmin.from('notifications').insert(notifications);
    }

    console.error(`[webhook] Transfer FAILED for order ${escrowTx.order_id} — reverted to held`);
  }

  // ─── chargeback.created ───────────────────────────────────────────────────

  private static async handleChargebackCreated(event: PaystackEvent): Promise<void> {
    const { reference } = event.data;

    // Find order by paystack reference
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('paystack_reference', reference)
      .single();

    if (orderErr || !order) {
      console.warn('[webhook] chargeback.created: no order found for ref', reference);
      return;
    }

    // Freeze escrow funds
    await supabaseAdmin
      .from('escrow_transactions')
      .update({ status: 'frozen' })
      .eq('order_id', order.id);

    // Mark order disputed
    await supabaseAdmin
      .from('orders')
      .update({
        status: EscrowStage.DISPUTED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    console.warn(`[webhook] Chargeback raised for order ${order.id} — funds frozen`);
  }
}
