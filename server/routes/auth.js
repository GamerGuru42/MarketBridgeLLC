const express = require('express');
const router = express.Router();
const { createUser, findUserByEmail, comparePassword, generateToken } = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { admin } = require('../config/firebase');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { email, password, displayName, role, location, storeType, businessName } = req.body;

        // Check if user exists
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Determine role based on email
        let userRole = role || 'customer';
        if (email === 'terumah.tech@marketbridge.com') userRole = 'technical_admin';
        else if (email === 'abdultariq.ops@marketbridge.com') userRole = 'operations_admin';
        else if (email === 'adael.marketing@marketbridge.com') userRole = 'marketing_admin';
        else if (email === 'ceo@marketbridge.com') userRole = 'ceo';
        else if (email === 'co-founder@marketbridge.com') userRole = 'cofounder';

        // Create user
        const user = await createUser({
            email,
            password,
            displayName,
            role: userRole,
            location,
            storeType: userRole === 'dealer' ? storeType : undefined,
            businessName: userRole === 'dealer' ? businessName : undefined
        });

        try {
            const { token } = req.body;

            // Verify Firebase ID Token
            const decodedToken = await admin.auth().verifyIdToken(token);
            const { email, name, picture, uid } = decodedToken;

            let user = await findUserByEmail(email);

            if (!user) {
                // Create new user from Google data
                user = await createUser({
                    email,
                    password: Math.random().toString(36).slice(-8), // Random password for Google users
                    displayName: name,
                    role: 'customer', // Default to customer
                    photoURL: picture,
                    googleId: uid,
                    isVerified: true // Google emails are verified
                });
            }

            const jwtToken = generateToken(user.id);
            const { password: _, ...userWithoutPassword } = user;

            res.json({
                success: true,
                token: jwtToken,
                user: userWithoutPassword
            });
        } catch (error) {
            console.error('Google Auth Error:', error);
            res.status(500).json({ error: 'Google authentication failed' });
        }
    });

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide an email and password' });
        }

        // Check for user
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create token
        const token = generateToken(user.id);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
    try {
        res.json({ user: req.user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
