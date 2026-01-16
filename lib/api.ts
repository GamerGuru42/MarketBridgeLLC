const API_BASE = '/api';

export interface EscrowDetails {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const escrowAPI = {
  /**
   * Get escrow details for a specific order
   */
  async getEscrowForOrder(orderId: string): Promise<{ escrow: EscrowDetails }> {
    const response = await fetch(`${API_BASE}/escrow/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch escrow details');
    }
    return response.json();
  },

  /**
   * File a dispute for an escrow transaction
   */
  async disputeEscrow(escrowId: string, reason: string, description: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/escrow/${escrowId}/dispute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason, description }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to file dispute');
    }

    return response.json();
  },

  /**
   * Release escrow funds to seller
   */
  async releaseEscrow(escrowId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/escrow/${escrowId}/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to release escrow');
    }

    return response.json();
  },

  /**
   * Refund escrow funds to buyer
   */
  async refundEscrow(escrowId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/escrow/${escrowId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to refund escrow');
    }

    return response.json();
  },
};

export default escrowAPI;
