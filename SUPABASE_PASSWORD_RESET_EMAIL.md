📧 SUPABASE EMAIL TEMPLATE FOR PASSWORD RESET

You need to configure the Password Reset email template in Supabase for the password reset feature to work properly.

## 🔧 How to Configure:

1. **Go to Supabase Dashboard** → Your Project
2. **Navigate to**: Authentication → Email Templates
3. **Select**: "Reset Password" template
4. **Replace with the following HTML**:

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - MarketBridge</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-radius: 32px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 48px 48px 32px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: rgba(255,102,0,0.1); border: 2px solid rgba(255,102,0,0.2); border-radius: 24px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 40px;">🔐</span>
                            </div>
                            <h1 style="margin: 0 0 12px; color: #ffffff; font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; font-style: italic;">
                                Password Reset
                            </h1>
                            <p style="margin: 0; color: #71717a; font-size: 14px; font-weight: 500; font-style: italic;">
                                Secure credential update protocol
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 48px;">
                            <p style="margin: 0 0 24px; color: #a1a1aa; font-size: 15px; line-height: 1.6; font-weight: 500;">
                                We received a request to reset your MarketBridge password. Click the button below to establish new credentials:
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="{{ .ConfirmationURL }}" 
                                           target="_blank" 
                                           style="display: inline-block; padding: 20px 48px; background: #FF6600; color: #000000; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 0 30px rgba(255,102,0,0.3); transition: all 0.3s;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 24px 0; color: #71717a; font-size: 13px; line-height: 1.6;">
                                Or copy and paste this URL into your browser:
                            </p>
                            <p style="margin: 0 0 32px; padding: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; color: #FF6600; font-size: 12px; word-break: break-all; font-family: monospace;">
                                {{ .ConfirmationURL }}
                            </p>

                            <!-- Security Notice -->
                            <div style="margin: 32px 0 0; padding: 24px; background: rgba(255,102,0,0.05); border: 1px solid rgba(255,102,0,0.1); border-radius: 16px;">
                                <p style="margin: 0 0 12px; color: #FF6600; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">
                                    ⚠️ Security Protocol
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #a1a1aa; font-size: 13px; line-height: 1.8;">
                                    <li>This link expires in <strong style="color: #ffffff;">60 minutes</strong></li>
                                    <li>If you didn't request this, ignore this email</li>
                                    <li>Never share this link with anyone</li>
                                </ul>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 48px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
                            <p style="margin: 0 0 8px; color: #52525b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
                                MarketBridge - Nigeria's Most Trusted Platform
                            </p>
                            <p style="margin: 0; color: #3f3f46; font-size: 10px;">
                                © 2026 MarketBridge LLC. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## ✅ After Setting the Template:

1. Click **Save** in Supabase
2. The password reset flow will now work:
   - User clicks "Reset Key" on login page
   - Enters their email
   - Receives beautiful branded email
   - Clicks link to reset password
   - Sets new password
   - Redirected to login

## 🎯 Features:
- ✅ Beautiful MarketBridge branding
- ✅ Mobile-responsive design
- ✅ Security warnings included
- ✅ Expires in 60 minutes
- ✅ Dark theme matching the app
- ✅ Professional and secure

## 🔗 Flow Summary:
1. `/login` → Click "Reset Key"
2. `/forgot-password` → Enter email
3. Receive email with reset link
4. `/reset-password` → Set new password
5. Auto-redirect to `/login`
