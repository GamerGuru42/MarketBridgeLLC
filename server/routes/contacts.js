const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { authMiddleware, requireRole } = require('../middleware/auth');

// @route   POST /api/contacts
// @desc    Submit contact form
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        const contact = await Contact.create({
            name,
            email,
            subject,
            message
        });

        res.status(201).json({ message: 'Message sent successfully', contact });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/contacts
// @desc    Get all contact submissions (Admin only)
// @access  Private (Admin)
router.get('/', authMiddleware, requireRole(['admin', 'ceo', 'cofounder']), async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });

        res.json({ contacts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
