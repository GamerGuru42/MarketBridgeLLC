const express = require('express');
const router = express.Router();
const { usersCollection, findUserById } = require('../models/User');
const Listing = require('../models/Listing');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user = await findUserById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Fetch listings for IDs in wishlist
        const wishlistIds = user.wishlist || [];
        if (wishlistIds.length === 0) {
            return res.json({ wishlist: [] });
        }

        const wishlistListings = await Listing.find({
            _id: { $in: wishlistIds }
        }).populate('dealer', 'displayName isVerified storeType location');

        res.json({ wishlist: wishlistListings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/wishlist/:listingId
// @desc    Add listing to wishlist
// @access  Private
router.post('/:listingId', authMiddleware, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.listingId);
        if (!listing) return res.status(404).json({ error: 'Listing not found' });

        const user = await findUserById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check if already in wishlist
        const currentWishlist = user.wishlist || [];
        if (currentWishlist.includes(req.params.listingId)) {
            return res.status(400).json({ error: 'Listing already in wishlist' });
        }

        const newWishlist = [...currentWishlist, req.params.listingId];

        await usersCollection.doc(req.user._id).update({
            wishlist: newWishlist
        });

        res.json({ wishlist: newWishlist });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/wishlist/:listingId
// @desc    Remove listing from wishlist
// @access  Private
router.delete('/:listingId', authMiddleware, async (req, res) => {
    try {
        const user = await findUserById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const currentWishlist = user.wishlist || [];
        const newWishlist = currentWishlist.filter(id => id !== req.params.listingId);

        await usersCollection.doc(req.user._id).update({
            wishlist: newWishlist
        });

        res.json({ wishlist: newWishlist });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
