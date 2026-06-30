/**
 * MarketBridge Escrow State Machine
 * Defines all valid escrow stages and enforces strict state transitions.
 */

export enum EscrowStage {
  NEGOTIATING = 'negotiating',
  OFFER_ACCEPTED = 'offer_accepted',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAYMENT_HELD = 'payment_held',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * Maps each stage to the set of stages it may legally transition into.
 * Any transition NOT listed here is forbidden.
 */
export const VALID_STAGE_TRANSITIONS: Record<EscrowStage, EscrowStage[]> = {
  [EscrowStage.NEGOTIATING]: [
    EscrowStage.OFFER_ACCEPTED,
    EscrowStage.CANCELLED,
  ],
  [EscrowStage.OFFER_ACCEPTED]: [
    EscrowStage.AWAITING_PAYMENT,
    EscrowStage.CANCELLED,
  ],
  [EscrowStage.AWAITING_PAYMENT]: [
    EscrowStage.PAYMENT_HELD,
    EscrowStage.CANCELLED,
  ],
  [EscrowStage.PAYMENT_HELD]: [
    EscrowStage.IN_TRANSIT,
    EscrowStage.DISPUTED,
    EscrowStage.REFUNDED,
  ],
  [EscrowStage.IN_TRANSIT]: [
    EscrowStage.DELIVERED,
    EscrowStage.DISPUTED,
    EscrowStage.REFUNDED,
  ],
  [EscrowStage.DELIVERED]: [
    EscrowStage.COMPLETED,
    EscrowStage.DISPUTED,
  ],
  [EscrowStage.COMPLETED]: [], // Terminal state
  [EscrowStage.DISPUTED]: [
    EscrowStage.COMPLETED,
    EscrowStage.REFUNDED,
  ],
  [EscrowStage.CANCELLED]: [], // Terminal state
  [EscrowStage.REFUNDED]: [], // Terminal state
};

/**
 * Returns true if moving from `from` to `to` is a legal transition.
 */
export function canTransition(from: string, to: EscrowStage): boolean {
  const allowedNext = VALID_STAGE_TRANSITIONS[from as EscrowStage];
  if (!allowedNext) return false;
  return allowedNext.includes(to);
}

/**
 * Returns all valid next stages from the current stage.
 */
export function getNextStages(current: string): EscrowStage[] {
  return VALID_STAGE_TRANSITIONS[current as EscrowStage] ?? [];
}

/**
 * Returns true if the given string is a valid EscrowStage value.
 */
export function isValidStage(value: string): value is EscrowStage {
  return Object.values(EscrowStage).includes(value as EscrowStage);
}
