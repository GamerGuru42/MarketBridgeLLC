const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// IP Tracking Middleware
const trackIp = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req.clientIp = ip;
    // In a real app, we might log this to a database for audit trails
    // console.log(`Request from IP: ${ip}`);
    next();
};

module.exports = {
    limiter,
    helmet,
    trackIp
};
