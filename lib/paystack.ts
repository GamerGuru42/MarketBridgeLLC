/**
 * Paystack Integration Utility
 * Commission: 5.3% fixed split
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export const COMMISSION_RATE = 0.053; // 5.3%

interface SubaccountResponse {
    status: boolean;
    message: string;
    data?: {
        subaccount_code: string;
        business_name: string;
        account_number: string;
        percentage_charge: number;
    };
}

/**
 * Create a Paystack Subaccount for a seller
 */
export async function createPaystackSubaccount(
    businessName: string,
    settlementBank: string,
    accountNumber: string,
    percentageCharge: number = 5.3
): Promise<string | null> {
    try {
        const response = await fetch('https://api.paystack.co/subaccount', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                business_name: businessName,
                settlement_bank: settlementBank,
                account_number: accountNumber,
                percentage_charge: percentageCharge,
            }),
        });

        const data: SubaccountResponse = await response.json();

        if (data.status && data.data) {
            return data.data.subaccount_code;
        } else {
            console.error('Paystack Subaccount Creation Error:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Paystack Subaccount API error:', error);
        return null;
    }
}

/**
 * Calculate split amount for a transaction
 */
export function calculateSplit(totalAmount: number) {
    const commission = totalAmount * COMMISSION_RATE;
    const sellerAmount = totalAmount - commission;
    return {
        totalAmount,
        commission,
        sellerAmount
    };
}
