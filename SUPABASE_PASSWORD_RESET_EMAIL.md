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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #18181b; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                    
                    <!-- Orange accent bar -->
                    <tr>
                        <td style="height: 6px; background: linear-gradient(90deg, #FF6600 0%, #FF8A00 100%);"></td>
                    </tr>

                    <!-- Header -->
                    <tr>
                        <td style="padding: 48px 40px 32px; text-align: center; background: #18181b;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center;">
                                        <div style="width: 80px; height: 80px; margin: 0 auto 24px; background: rgba(255,102,0,0.15); border: 2px solid rgba(255,102,0,0.3); border-radius: 20px; line-height: 76px; text-align: center;">
                                            <span style="font-size: 40px; vertical-align: middle;">🔐</span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <h1 style="margin: 0 0 12px; color: #ffffff; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">
                                Password Reset
                            </h1>
                            <p style="margin: 0; color: #a1a1aa; font-size: 14px; font-weight: 500;">
                                Secure credential update protocol
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px; background: #18181b;">
                            <p style="margin: 0 0 28px; color: #d4d4d8; font-size: 15px; line-height: 1.7; font-weight: 400;">
                                We received a request to reset your MarketBridge password. Click the button below to establish new credentials:
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                                <tr>
                                    <td style="text-align: center; padding: 0;">
                                        <a href="{{ .ConfirmationURL }}" 
                                           target="_blank" 
                                           style="display: inline-block; padding: 18px 40px; background: #FF6600; color: #000000; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px;">
                                            Reset Password →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 28px 0 12px; color: #a1a1aa; font-size: 13px; line-height: 1.6;">
                                Or copy and paste this URL into your browser:
                            </p>
                            <p style="margin: 0 0 32px; padding: 14px; background: #27272a; border: 1px solid #3f3f46; border-radius: 10px; color: #FF6600; font-size: 11px; word-break: break-all; font-family: 'Courier New', monospace; line-height: 1.5;">
                                {{ .ConfirmationURL }}
                            </p>

                            <!-- Security Notice -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0 0;">
                                <tr>
                                    <td style="padding: 20px; background: rgba(255,102,0,0.08); border: 1px solid rgba(255,102,0,0.2); border-radius: 12px;">
                                        <p style="margin: 0 0 12px; color: #FF6600; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px;">
                                            ⚠️ Security Notice
                                        </p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="padding: 4px 0; color: #d4d4d8; font-size: 13px; line-height: 1.6;">
                                                    • This link expires in <strong style="color: #ffffff;">60 minutes</strong><br>
                                                    • If you didn't request this, ignore this email<br>
                                                    • Never share this link with anyone
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; background: #0a0a0a; text-align: center; border-top: 1px solid #27272a;">
                            <p style="margin: 0 0 6px; color: #71717a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
                                MarketBridge
                            </p>
                            <p style="margin: 0; color: #52525b; font-size: 10px;">
                                Nigeria's Most Trusted Campus Marketplace
                            </p>
                            <p style="margin: 12px 0 0; color: #3f3f46; font-size: 9px;">
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
