import nodemailer from 'nodemailer';

// Configuration interface for type safety
interface EmailConfig {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
}

// Load configuration from environment variables
const config: EmailConfig = {
    enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    host: process.env.SMTP_HOST || 'smtp.zoho.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'support@marketbridge.com.ng',
        pass: process.env.SMTP_PASS || '',
    },
    from: '"MarketBridge Support" <support@marketbridge.com.ng>',
};

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
        user: config.auth.user,
        pass: config.auth.pass,
    },
});

/**
 * Validates the email configuration and connection.
 * Useful for health checks or startup verification.
 */
export async function verifyConnection(): Promise<boolean> {
    if (!config.enabled) {
        console.log('Email notifications are disabled via ENABLE_EMAIL_NOTIFICATIONS');
        return false;
    }
    try {
        await transporter.verify();
        console.log('Server is ready to take our messages');
        return true;
    } catch (error) {
        console.error('Email connection verification failed:', error);
        return false;
    }
}

/**
 * Sends an email using the configured transporter.
 * @param to Recipient email address
 * @param subject Email subject
 * @param html Email body in HTML format
 * @returns {Promise<boolean>} Success status
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!config.enabled) {
        console.log('Email simulation (disabled):', { to, subject });
        return true; // Simulate success
    }

    try {
        const info = await transporter.sendMail({
            from: config.from,
            to,
            subject,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// --- Future Hook Templates ---

/**
 * Template: New Seller Signup Notification
 * Usage: Call this after a successful seller registration.
 */
// export async function notifyNewSellerSignup(sellerEmail: string, sellerName: string) {
//     const subject = 'Welcome to MarketBridge - Verify Your Account';
//     const html = `<h1>Welcome ${sellerName}!</h1><p>Please click here to verify your email.</p>`;
//     await sendEmail(sellerEmail, subject, html);
//     // Optional: Notify support
//     // await sendEmail('support@marketbridge.com.ng', `New Seller: ${sellerName}`, `<p>Review needed for ${sellerEmail}</p>`);
// }

/**
 * Template: Subscription Expiry Warning
 * Usage: Call this via a cron job or webhook when subscription is ending.
 */
// export async function notifySubscriptionExpiry(userEmail: string, daysLeft: number) {
//     const subject = 'Urgent: Your MarketBridge Subscription is Expiring';
//     const html = `<p>Your subscription expires in ${daysLeft} days. Renew now to keep your listings active.</p>`;
//     await sendEmail(userEmail, subject, html);
// }

/**
 * Template: Payment Failure Notification
 * Usage: Call this when a Paystack webhook reports a failed charge.
 */
// export async function notifyPaymentFailure(userEmail: string, amount: string) {
//     const subject = 'Action Required: Payment Failed';
//     const html = `<p>We could not process your payment of ${amount}. Please update your payment method.</p>`;
//     await sendEmail(userEmail, subject, html);
// }
