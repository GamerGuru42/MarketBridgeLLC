const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { authMiddleware } = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Create an order
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { listingId } = req.body;

        const listing = await Listing.findById(listingId).populate('dealer');

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Don't allow buying your own listing
        if (listing.dealer._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ error: 'Cannot order your own listing' });
        }

        const order = await Order.create({
            buyer: req.user._id,
            seller: listing.dealer._id,
            listing: listing._id,
            amount: listing.price,
        });

        await order.populate(['buyer', 'seller', 'listing']);

        res.status(201).json({ order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/orders
// @desc    Get user's orders (buyer or seller)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({
            $or: [{ buyer: req.user._id }, { seller: req.user._id }]
        })
            .populate('buyer', 'displayName email')
            .populate('seller', 'displayName email')
            .populate('listing', 'title price images')
            .sort({ createdAt: -1 });

        res.json({ orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status (Seller only)
// @access  Private
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Only seller can update status
        if (order.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        order.status = status;
        await order.save();

        await order.populate(['buyer', 'seller', 'listing']);

        res.json({ order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
