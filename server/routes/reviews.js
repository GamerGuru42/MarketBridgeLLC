const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/reviews/dealer/:dealerId
// @desc    Get reviews for a dealer
// @access  Public
router.get('/dealer/:dealerId', async (req, res) => {
    try {
        const reviews = await Review.find({ dealer: req.params.dealerId })
            .populate('reviewer', 'displayName photoURL')
            .populate('listing', 'title')
            .sort({ createdAt: -1 });

        res.json({ reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/reviews
// @desc    Create a review (Customer only, after completed order)
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { dealerId, listingId, rating, comment } = req.body;

        // Check if there's a completed order for this listing
        const completedOrder = await Order.findOne({
            buyer: req.user._id,
            seller: dealerId,
            listing: listingId,
            status: 'completed'
        });

        if (!completedOrder) {
            return res.status(400).json({ error: 'You can only review after a completed order' });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            dealer: dealerId,
            reviewer: req.user._id,
            listing: listingId
        });

        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this dealer for this listing' });
        }

        const review = await Review.create({
            dealer: dealerId,
            reviewer: req.user._id,
            listing: listingId,
            rating,
            comment
        });

        await review.populate(['reviewer', 'listing']);

        res.status(201).json({ review });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
