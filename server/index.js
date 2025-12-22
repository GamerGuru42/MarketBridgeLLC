const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { admin, db } = require('./config/firebase');
const { startAutoReleaseWorker } = require('./workers/escrowAutoRelease');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Security Middleware
const { limiter, trackIp } = require('./middleware/security');
// app.use(helmet()); // Helmet might conflict with some dev headers, enable in prod
app.use(trackIp);
app.use('/api/', limiter); // Apply rate limiting to API routes

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'MarketBridge API is running' });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/escrow', require('./routes/escrow'));
app.use('/api/wishlist', require('./routes/wishlist'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start background workers
  startAutoReleaseWorker();
});
