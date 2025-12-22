const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', authMiddleware, requireRole(['admin', 'ceo', 'cofounder', 'operations_admin']), async (req, res) => {
    try {
        const { usersCollection } = require('../models/User');
        const snapshot = await usersCollection.orderBy('createdAt', 'desc').limit(100).get();
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/users/search
// @desc    Search users by email (Admin only)
// @access  Private (Admin)
router.get('/search', authMiddleware, requireRole(['admin', 'ceo', 'cofounder']), async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email query required' });
        }

        const { usersCollection } = require('../models/User');
        // Firestore doesn't support regex, so we'll do a simple startsWith query
        const snapshot = await usersCollection
            .where('email', '>=', email)
            .where('email', '<=', email + '\uf8ff')
            .limit(10)
            .get();

        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PATCH /api/users/:id/verify
// @desc    Verify a dealer (Admin only)
// @access  Private (Admin)
router.patch('/:id/verify', authMiddleware, requireRole(['admin', 'ceo', 'cofounder']), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.isVerified = true;
        await user.save();

        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/users/dealers/pending
// @desc    Get dealers pending verification (Admin only)
// @access  Private (Admin)
router.get('/dealers/pending', authMiddleware, requireRole(['admin', 'ceo', 'cofounder']), async (req, res) => {
    try {
        const { usersCollection } = require('../models/User');
        const snapshot = await usersCollection
            .where('role', '==', 'dealer')
            .where('isVerified', '==', false)
            .orderBy('createdAt', 'desc')
            .get();

        const dealers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ dealers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PATCH /api/users/:id
// @desc    Update user profile
// @access  Private
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        // Ensure user can only update their own profile
        if (req.user.id !== req.params.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { displayName, location, businessName, storeType, role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update fields
        if (displayName) user.displayName = displayName;
        if (location) user.location = location;
        if (businessName) user.businessName = businessName;
        if (storeType) user.storeType = storeType;

        // Allow role update only if not set or if upgrading (logic can be adjusted)
        if (role && user.role === 'customer') user.role = role;

        await user.save();

        // Remove password from response
        const userObj = user.toObject();
        delete userObj.password;

        res.json({ user: userObj });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
