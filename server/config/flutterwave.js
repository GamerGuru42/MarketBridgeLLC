const axios = require('axios');

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

// Helper function to make Flutterwave API requests
async function flutterwaveRequest(endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method,
            url: `${FLUTTERWAVE_BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Flutterwave API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Payment gateway error');
    }
}

// Initialize a payment transaction
async function initializePayment({ email, amount, tx_ref, customer, redirect_url, metadata = {} }) {
    const data = {
        tx_ref,
        amount,
        currency: 'NGN',
        redirect_url,
        customer: {
            email,
            name: customer.name,
            phonenumber: customer.phone || '',
        },
        customizations: {
            title: 'MarketBridge',
            description: metadata.description || 'Purchase from MarketBridge',
            logo: 'https://your-logo-url.com/logo.png',
        },
        meta: metadata,
    };

    return flutterwaveRequest('/payments', 'POST', data);
}

// Verify a payment transaction
async function verifyPayment(transactionId) {
    return flutterwaveRequest(`/transactions/${transactionId}/verify`);
}

// Get transaction details
async function getTransaction(transactionId) {
    return flutterwaveRequest(`/transactions/${transactionId}`);
}

// Transfer funds to a recipient (for releasing escrow)
async function transferFunds({ account_bank, account_number, amount, narration, beneficiary_name }) {
    const data = {
        account_bank,
        account_number,
        amount,
        currency: 'NGN',
        narration,
        beneficiary_name,
        reference: `TRF-${Date.now()}`,
    };

    return flutterwaveRequest('/transfers', 'POST', data);
}

// List all banks
async function listBanks(country = 'NG') {
    return flutterwaveRequest(`/banks/${country}`);
}

// Verify webhook signature
function verifyWebhookSignature(signature) {
    const hash = require('crypto')
        .createHash('sha256')
        .update(process.env.FLUTTERWAVE_WEBHOOK_SECRET)
        .digest('hex');

    return hash === signature;
}

// Initiate refund
async function refundTransaction(transactionId, amount) {
    const data = {
        id: transactionId,
    };

    if (amount) {
        data.amount = amount;
    }

    return flutterwaveRequest('/transactions/refund', 'POST', data);
}

// Create beneficiary for transfers
async function createBeneficiary({ account_number, account_bank, beneficiary_name }) {
    const data = {
        account_number,
        account_bank,
        beneficiary_name,
    };

    return flutterwaveRequest('/beneficiaries', 'POST', data);
}

// Verify bank account
async function verifyBankAccount({ account_number, account_bank }) {
    return flutterwaveRequest('/accounts/resolve', 'POST', {
        account_number,
        account_bank,
    });
}

module.exports = {
    initializePayment,
    verifyPayment,
    getTransaction,
    transferFunds,
    createBeneficiary,
    listBanks,
    verifyWebhookSignature,
    refundTransaction,
    verifyBankAccount,
};
