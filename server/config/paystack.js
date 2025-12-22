const axios = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Helper function to make Paystack API requests
async function paystackRequest(endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method,
            url: `${PAYSTACK_BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Paystack API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Payment gateway error');
    }
}

// Initialize a payment transaction
async function initializePayment({ email, amount, reference, metadata = {} }) {
    const data = {
        email,
        amount: Math.round(amount * 100), // Convert to kobo (smallest currency unit)
        reference,
        metadata,
        callback_url: `${process.env.CLIENT_URL}/payment/callback`,
    };

    return paystackRequest('/transaction/initialize', 'POST', data);
}

// Verify a payment transaction
async function verifyPayment(reference) {
    return paystackRequest(`/transaction/verify/${reference}`);
}

// Get transaction details
async function getTransaction(transactionId) {
    return paystackRequest(`/transaction/${transactionId}`);
}

// Transfer funds to a recipient (for releasing escrow)
async function transferFunds({ recipient_code, amount, reason }) {
    const data = {
        source: 'balance',
        reason,
        amount: Math.round(amount * 100), // Convert to kobo
        recipient: recipient_code,
    };

    return paystackRequest('/transfer', 'POST', data);
}

// Create a transfer recipient (dealer's bank account)
async function createTransferRecipient({ type = 'nuban', name, account_number, bank_code, currency = 'NGN' }) {
    const data = {
        type,
        name,
        account_number,
        bank_code,
        currency,
    };

    return paystackRequest('/transferrecipient', 'POST', data);
}

// List all banks
async function listBanks() {
    return paystackRequest('/bank?currency=NGN');
}

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
    const crypto = require('crypto');
    const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

    return hash === signature;
}

// Initiate refund
async function refundTransaction(transactionRef, amount = null) {
    const data = {
        transaction: transactionRef,
    };

    if (amount) {
        data.amount = Math.round(amount * 100); // Convert to kobo
    }

    return paystackRequest('/refund', 'POST', data);
}

module.exports = {
    initializePayment,
    verifyPayment,
    getTransaction,
    transferFunds,
    createTransferRecipient,
    listBanks,
    verifyWebhookSignature,
    refundTransaction,
};
