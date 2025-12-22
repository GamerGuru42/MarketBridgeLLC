const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const Escrow = require('../models/Escrow');
const flutterwave = require('../config/flutterwave');

// @route   POST /api/escrow/hold
// @desc    Create escrow after successful payment
// @access  Private
router.post('/hold', authMiddleware, async (req, res) => {
    try {
        const {
            orderId,
            paymentReference,
            transactionId,
            amount,
            dealerId,
            paymentMethod,
            metadata
        } = req.body;

        // Verify payment was successful
        const paymentVerification = await flutterwave.verifyPayment(transactionId);

        if (paymentVerification.data.status !== 'successful') {
            return res.status(400).json({ error: 'Payment not successful' });
        }

        // Verify amount matches
        if (paymentVerification.data.amount !== amount) {
            return res.status(400).json({ error: 'Payment amount mismatch' });
        }

        // Create escrow record
        const escrow = await Escrow.createEscrow({
            orderId,
            paymentReference,
            transactionId,
            amount,
            customerId: req.user.id,
            dealerId,
            paymentMethod: paymentVerification.data.payment_type,
            metadata,
        });

        res.status(201).json({
            success: true,
            escrow,
        });
    } catch (error) {
        console.error('Escrow creation error:', error);
        res.status(500).json({ error: error.message || 'Failed to create escrow' });
    }
});

// @route   POST /api/escrow/:id/release
// @desc    Release funds to dealer (customer confirmed delivery)
// @access  Private
router.post('/:id/release', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const escrow = await Escrow.getEscrowById(id);

        if (!escrow) {
            return res.status(404).json({ error: 'Escrow not found' });
        }

        // Only customer can release funds
        if (escrow.customerId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Check escrow status
        if (escrow.status !== 'held') {
            return res.status(400).json({ error: `Cannot release escrow with status: ${escrow.status}` });
        }

        // TODO: Initiate transfer to dealer via Flutterwave
        // This requires dealer's bank account to be set up
        // For now, we just mark as released

        const updatedEscrow = await Escrow.updateEscrowStatus(id, 'released', {
            releasedBy: req.user.id,
        });

        res.json({
            success: true,
            message: 'Funds released to dealer',
            escrow: updatedEscrow,
        });
    } catch (error) {
        console.error('Escrow release error:', error);
        res.status(500).json({ error: error.message || 'Failed to release escrow' });
    }
});

// @route   POST /api/escrow/:id/refund
// @desc    Refund to customer (admin decision after dispute)
// @access  Private (Admin only)
router.post('/:id/refund', authMiddleware, requireRole(['admin', 'ceo', 'cofounder']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const escrow = await Escrow.getEscrowById(id);

        if (!escrow) {
            return res.status(404).json({ error: 'Escrow not found' });
        }

        // Check escrow status
        if (!['held', 'disputed'].includes(escrow.status)) {
            return res.status(400).json({ error: `Cannot refund escrow with status: ${escrow.status}` });
        }

        // Initiate refund via Flutterwave
        const refund = await flutterwave.refundTransaction(
            escrow.transactionId,
            escrow.amount
        );

        if (refund.status !== 'success') {
            return res.status(500).json({ error: 'Refund failed' });
        }

        const updatedEscrow = await Escrow.updateEscrowStatus(id, 'refunded', {
            refundReason: reason,
            refundedBy: req.user.id,
            refundTransactionId: refund.data.id,
        });

        res.json({
            success: true,
            message: 'Refund processed successfully',
            escrow: updatedEscrow,
        });
    } catch (error) {
        console.error('Escrow refund error:', error);
        res.status(500).json({ error: error.message || 'Failed to process refund' });
    }
});

// @route   POST /api/escrow/:id/resolve
// @desc    Resolve dispute by releasing funds to dealer (admin decision)
// @access  Private (Admin only)
router.post('/:id/resolve', authMiddleware, requireRole(['admin', 'ceo', 'cofounder']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const escrow = await Escrow.getEscrowById(id);

        if (!escrow) {
            return res.status(404).json({ error: 'Escrow not found' });
        }

        // Check escrow status
        if (!['held', 'disputed'].includes(escrow.status)) {
            return res.status(400).json({ error: `Cannot resolve escrow with status: ${escrow.status}` });
        }

        // TODO: Initiate transfer to dealer via Flutterwave
        // const transfer = await flutterwave.transferToDealer(escrow.dealerId, escrow.amount);

        const updatedEscrow = await Escrow.updateEscrowStatus(id, 'released', {
            releasedBy: req.user.id,
            resolutionReason: reason,
            disputeStatus: 'resolved',
            resolvedAt: new Date().toISOString(),
            resolutionDecision: 'released_to_dealer'
        });

        res.json({
            success: true,
            message: 'Dispute resolved: Funds released to dealer',
            escrow: updatedEscrow,
        });
    } catch (error) {
        console.error('Escrow resolution error:', error);
        res.status(500).json({ error: error.message || 'Failed to resolve dispute' });
    }
});

// @route   POST /api/escrow/:id/dispute
// @desc    File a dispute
// @access  Private
router.post('/:id/dispute', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, description } = req.body;

        const escrow = await Escrow.getEscrowById(id);

        if (!escrow) {
            return res.status(404).json({ error: 'Escrow not found' });
        }

        // Only customer can dispute
        if (escrow.customerId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Check escrow status
        if (escrow.status !== 'held') {
            return res.status(400).json({ error: 'Can only dispute held escrows' });
        }

        const updatedEscrow = await Escrow.updateDisputeInfo(id, {
            reason,
            description,
            filedBy: req.user.id,
        });

        res.json({
            success: true,
            message: 'Dispute filed successfully. Admin will review.',
            escrow: updatedEscrow,
        });
    } catch (error) {
        console.error('Dispute filing error:', error);
        res.status(500).json({ error: error.message || 'Failed to file dispute' });
    }
});

// @route   GET /api/escrow/order/:orderId
// @desc    Get escrow for an order
// @access  Private
router.get('/order/:orderId', authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.params;

        const escrow = await Escrow.getEscrowByOrderId(orderId);

        if (!escrow) {
            return res.status(404).json({ error: 'Escrow not found for this order' });
        }

        // Check authorization
        if (escrow.customerId !== req.user.id && escrow.dealerId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json({
            success: true,
            escrow,
        });
    } catch (error) {
        console.error('Get escrow error:', error);
        res.status(500).json({ error: error.message || 'Failed to get escrow' });
    }
});

// @route   GET /api/escrow/my-escrows
// @desc    Get all escrows for current user
// @access  Private
router.get('/my-escrows', authMiddleware, async (req, res) => {
    try {
        let escrows;

        if (req.user.role === 'dealer') {
            escrows = await Escrow.getDealerEscrows(req.user.id);
        } else {
            escrows = await Escrow.getCustomerEscrows(req.user.id);
        }

        res.json({
            success: true,
            escrows,
        });
    } catch (error) {
        console.error('Get escrows error:', error);
        res.status(500).json({ error: error.message || 'Failed to get escrows' });
    }
});

// @route   GET /api/escrow/admin/disputes
// @desc    Get all disputed escrows (admin only)
// @access  Private (Admin only)
router.get('/admin/disputes', authMiddleware, requireRole(['admin', 'ceo', 'cofounder']), async (req, res) => {
    try {
        const snapshot = await Escrow.escrowsCollection
            .where('status', '==', 'disputed')
            .orderBy('disputedAt', 'desc')
            .get();

        const disputes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({
            success: true,
            disputes,
        });
    } catch (error) {
        console.error('Get disputes error:', error);
        res.status(500).json({ error: error.message || 'Failed to get disputes' });
    }
});

module.exports = router;
