import axios from 'axios';

/**
 * OPay Backend Utility (Next.js Server Side)
 * Documentation: https://opayweb.com/docs/
 */

const OPAY_SECRET_KEY = process.env.OPAY_SECRET_KEY;
const OPAY_MERCHANT_ID = process.env.OPAY_MERCHANT_ID;
const OPAY_BASE_URL = 'https://testapi.opayweb.com/api/v1/payment';

export async function opayRequest(endpoint: string, data: Record<string, unknown>) {
    try {
        const response = await axios({
            method: 'POST',
            url: `${OPAY_BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${OPAY_SECRET_KEY}`,
                'MerchantId': OPAY_MERCHANT_ID,
                'Content-Type': 'application/json',
            },
            data
        });
        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error('OPay API Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'OPay gateway error');
        }
        throw error;
    }
}

export async function createOPayPayment({ amount, reference, email, description, returnUrl }: {
    amount: number;
    reference: string;
    email: string;
    description: string;
    returnUrl: string;
}) {
    const data = {
        amount: {
            total: Math.round(amount * 100), // Amount in kobo
            currency: 'NGN'
        },
        reference,
        returnUrl,
        callbackUrl: process.env.OPAY_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'}/api/payments/opay/webhook`,
        user: {
            email
        },
        product: {
            name: 'MarketBridge Purchase',
            description: description || 'Vehicle purchase from MarketBridge'
        }
    };

    return opayRequest('/cashier/create', data);
}

export async function checkOPayPaymentStatus(reference: string, orderId?: string) {
    const data = {
        reference,
        orderId
    };
    return opayRequest('/cashier/status', data);
}
