const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const flutterwave = require('../config/flutterwave');
const { v4: uuidv4 } = require('uuid');

// @route   POST /api/payments/initialize
// @desc    Initialize a payment transaction
// @access  Private
router.post('/initialize', authMiddleware, async (req, res) => {
    try {
        const { amount, orderId, metadata = {} } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Generate unique payment reference
        const tx_ref = `MB-${uuidv4()}`;

        // Initialize payment with Flutterwave
        const response = await flutterwave.initializePayment({
            email: req.user.email,
            amount,
            tx_ref,
            customer: {
                email: req.user.email,
                name: req.user.displayName,
                phone: req.user.phoneNumber || '',
            },
            redirect_url: `${process.env.CLIENT_URL}/payment/callback?tx_ref=${tx_ref}`,
            metadata: {
                userId: req.user.id,
                orderId,
                ...metadata,
            },
        });

        res.json({
            success: true,
            reference: tx_ref,
            paymentLink: response.data.link,
        });
    } catch (error) {
        console.error('Payment initialization error:', error);
        res.status(500).json({ error: error.message || 'Failed to initialize payment' });
    }
});

// @route   GET /api/payments/verify/:transactionId
// @desc    Verify a payment transaction
// @access  Private
router.get('/verify/:transactionId', authMiddleware, async (req, res) => {
    try {
        const { transactionId } = req.params;

        // Verify payment with Flutterwave
        const response = await flutterwave.verifyPayment(transactionId);

        if (response.data.status === 'successful' && response.data.amount >= response.data.meta?.expectedAmount) {
            res.json({
                success: true,
                data: {
                    transactionId: response.data.id,
                    reference: response.data.tx_ref,
                    amount: response.data.amount,
                    status: response.data.status,
                    currency: response.data.currency,
                    paymentType: response.data.payment_type,
                    paidAt: response.data.created_at,
                    customer: response.data.customer,
                    metadata: response.data.meta,
                },
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Payment verification failed',
                status: response.data.status,
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ error: error.message || 'Failed to verify payment' });
    }
});

// @route   POST /api/payments/webhook
// @desc    Handle Flutterwave webhooks
// @access  Public (but verified via signature)
router.post('/webhook', express.json(), async (req, res) => {
    try {
        const signature = req.headers['verif-hash'];

        // Verify webhook signature
        if (!signature || !flutterwave.verifyWebhookSignature(signature)) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const event = req.body;

        console.log('Flutterwave webhook received:', event.event);

        // Handle different event types
        switch (event.event) {
            case 'charge.completed':
                if (event.data.status === 'successful') {
                    console.log('Payment successful:', event.data.tx_ref);
                    // TODO: Create escrow record
                }
                break;

            case 'transfer.completed':
                console.log('Transfer completed:', event.data.reference);
                // TODO: Update escrow status to released
                break;

            case 'transfer.failed':
                console.log('Transfer failed:', event.data.reference);
                // TODO: Alert admin and retry
                break;

            default:
                console.log('Unhandled webhook event:', event.event);
        }

        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// @route   GET /api/payments/:transactionId
// @desc    Get payment status
// @access  Private
router.get('/:transactionId', authMiddleware, async (req, res) => {
    try {
        const { transactionId } = req.params;

        const response = await flutterwave.verifyPayment(transactionId);

        res.json({
            success: true,
            payment: {
                transactionId: response.data.id,
                reference: response.data.tx_ref,
                amount: response.data.amount,
                currency: response.data.currency,
                status: response.data.status,
                paymentType: response.data.payment_type,
                paidAt: response.data.created_at,
                customer: response.data.customer,
            },
        });
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ error: error.message || 'Failed to get payment' });
    }
});

// @route   GET /api/payments/banks/list
// @desc    Get list of Nigerian banks
// @access  Private
router.get('/banks/list', authMiddleware, async (req, res) => {
    try {
        const response = await flutterwave.listBanks('NG');

        res.json({
            success: true,
            banks: response.data,
        });
    } catch (error) {
        console.error('List banks error:', error);
        res.status(500).json({ error: 'Failed to fetch banks' });
    }
});

// @route   POST /api/payments/verify-account
// @desc    Verify bank account details
// @access  Private
router.post('/verify-account', authMiddleware, async (req, res) => {
    try {
        const { account_number, account_bank } = req.body;

        const response = await flutterwave.verifyBankAccount({
            account_number,
            account_bank,
        });

        res.json({
            success: true,
            accountName: response.data.account_name,
            accountNumber: response.data.account_number,
        });
    } catch (error) {
        console.error('Verify account error:', error);
        res.status(500).json({ error: 'Failed to verify account' });
    }
});

module.exports = router;
