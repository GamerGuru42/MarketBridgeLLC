const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const { authMiddleware, optionalAuth, requireRole } = require('../middleware/auth');

// @route   GET /api/listings
// @desc    Get all listings (with filters)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { category, search, location, minPrice, maxPrice } = req.query;

        let query = { status: 'active' };

        if (category) query.category = category;
        if (location) query.location = { $regex: location, $options: 'i' };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const listings = await Listing.find(query)
            .populate('dealer', 'displayName isVerified storeType location')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ listings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/listings/:id
// @desc    Get single listing
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('dealer', 'displayName isVerified storeType location photoURL');

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        res.json({ listing });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/listings
// @desc    Create a listing (Dealer only)
// @access  Private (Dealer)
router.post('/', authMiddleware, requireRole(['dealer']), async (req, res) => {
    try {
        const { title, description, price, category, images, location } = req.body;

        const listing = await Listing.create({
            dealer: req.user._id,
            title,
            description,
            price,
            category,
            images,
            location: location || req.user.location,
        });

        res.status(201).json({ listing });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PATCH /api/listings/:id
// @desc    Update a listing
// @access  Private (Owner or Admin)
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Check ownership or admin
        if (listing.dealer.toString() !== req.user._id.toString() &&
            !['admin', 'ceo', 'cofounder'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { title, description, price, category, images, status, location } = req.body;

        if (title) listing.title = title;
        if (description) listing.description = description;
        if (price) listing.price = price;
        if (category) listing.category = category;
        if (images) listing.images = images;
        if (status) listing.status = status;
        if (location) listing.location = location;

        await listing.save();

        res.json({ listing });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/listings/:id
// @desc    Delete a listing
// @access  Private (Owner or Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Check ownership or admin
        if (listing.dealer.toString() !== req.user._id.toString() &&
            !['admin', 'ceo', 'cofounder'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        await listing.deleteOne();

        res.json({ message: 'Listing deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/listings/dealer/:dealerId
// @desc    Get listings by dealer
// @access  Public
router.get('/dealer/:dealerId', async (req, res) => {
    try {
        const listings = await Listing.find({
            dealer: req.params.dealerId,
            status: 'active'
        }).sort({ createdAt: -1 });

        res.json({ listings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
