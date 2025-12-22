const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/chats
// @desc    Get user's chats
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: req.user._id
        })
            .populate('participants', 'displayName photoURL')
            .populate('listing', 'title images')
            .sort({ lastMessageTimestamp: -1 });

        res.json({ chats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/chats
// @desc    Create or get existing chat
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { otherUserId, listingId } = req.body;

        // Check if chat already exists
        let chat = await Chat.findOne({
            participants: { $all: [req.user._id, otherUserId] },
            listing: listingId
        });

        if (!chat) {
            chat = await Chat.create({
                participants: [req.user._id, otherUserId],
                listing: listingId
            });
        }

        await chat.populate(['participants', 'listing']);

        res.json({ chat });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/chats/:id/messages
// @desc    Get messages for a chat
// @access  Private
router.get('/:id/messages', authMiddleware, async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Check if user is participant
        if (!chat.participants.includes(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const messages = await Message.find({ chat: chat._id })
            .populate('sender', 'displayName photoURL')
            .sort({ createdAt: 1 });

        res.json({ messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/chats/:id/messages
// @desc    Send a message
// @access  Private
router.post('/:id/messages', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;

        const chat = await Chat.findById(req.params.id);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Check if user is participant
        if (!chat.participants.includes(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const message = await Message.create({
            chat: chat._id,
            sender: req.user._id,
            content
        });

        // Update chat's last message
        chat.lastMessage = content;
        chat.lastMessageTimestamp = new Date();
        await chat.save();

        await message.populate('sender', 'displayName photoURL');

        res.status(201).json({ message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/chats/:id/report
// @desc    Report a chat
// @access  Private
router.post('/:id/report', authMiddleware, async (req, res) => {
    try {
        const { reason, description } = req.body;
        const chat = await Chat.findById(req.params.id);

        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Check if user is participant
        if (!chat.participants.includes(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Find the other user
        const reportedUser = chat.participants.find(p => p.toString() !== req.user._id.toString());

        const Report = require('../models/Report');
        const report = await Report.create({
            reporter: req.user._id,
            reportedUser,
            chat: chat._id,
            reason,
            description
        });

        res.status(201).json({ message: 'Report submitted successfully', report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
