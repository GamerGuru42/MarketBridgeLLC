const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
    },
    lastMessage: {
        type: String,
    },
    lastMessageTimestamp: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Chat', ChatSchema);
