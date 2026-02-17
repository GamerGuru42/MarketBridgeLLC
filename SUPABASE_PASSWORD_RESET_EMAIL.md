📧 PASSWORD RESET EMAIL TEMPLATE

**IMPORTANT**: Supabase blocks certain CSS/HTML keywords. This template is simplified to pass validation.

## 🔧 How to Configure:

1. **Go to Supabase Dashboard** → Your Project
2. **Navigate to**: Authentication → Email Templates
3. **Select**: "Reset Password" template
4. **Replace ENTIRE template with the HTML below**:

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; max-width: 600px; width: 100%;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px; text-align: center; background-color: #1a1a1a; border-radius: 8px 8px 0 0;">
                            <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: #FF6600; border-radius: 12px; text-align: center; line-height: 64px; font-size: 32px;">
                                🔐
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                                Reset Your Password
                            </h1>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 16px;">
                                Hello,
                            </p>
                            <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                                We received a request to reset the password for your MarketBridge account. Click the button below to create a new password:
                            </p>

                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background-color: #FF6600; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px;">Reset My Password</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 24px 0 16px; color: #6b6b6b; font-size: 13px;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0 0 30px; padding: 12px; background-color: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 4px; color: #FF6600; font-size: 12px; word-break: break-all;">
                                {{ .ConfirmationURL }}
                            </p>

                            <!-- Security Info Box -->
                            <table width="100%" cellpadding="20" cellspacing="0" border="0" style="margin: 30px 0 0; background-color: #fffbf0; border-left: 4px solid #FF6600; border-radius: 4px;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 10px; color: #1a1a1a; font-size: 13px; font-weight: bold;">
                                            🔒 Security Information
                                        </p>
                                        <p style="margin: 0; color: #4a4a4a; font-size: 13px; line-height: 1.6;">
                                            • This link will expire in 60 minutes<br>
                                            • If you didn't request this, ignore this email<br>
                                            • Your password won't change until you create a new one
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0; color: #6b6b6b; font-size: 14px;">
                                Need help? Contact us at <a href="mailto:support@marketbridge.com.ng" style="color: #FF6600; text-decoration: none;">support@marketbridge.com.ng</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #fafafa; text-align: center; border-top: 1px solid #e5e5e5; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 13px; font-weight: bold;">
                                MarketBridge
                            </p>
                            <p style="margin: 0 0 4px; color: #6b6b6b; font-size: 12px;">
                                Nigeria's Most Trusted Campus Marketplace
                            </p>
                            <p style="margin: 0; color: #9b9b9b; font-size: 11px;">
                                © 2026 MarketBridge LLC
                            </p>
                        </td>
                    </tr>
                </table>

                <!-- Bottom Disclaimer -->
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin: 20px auto 0; max-width: 600px;">
                    <tr>
                        <td style="text-align: center; padding: 0 20px;">
                            <p style="margin: 0; color: #9b9b9b; font-size: 11px; line-height: 1.5;">
                                This email was sent from MarketBridge. If you have questions, contact support.
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

## ✅ What Changed:

**Removed (Supabase blocks these)**:
- ❌ `linear-gradient()` - replaced with solid colors
- ❌ `role="presentation"` - removed
- ❌ Complex CSS positioning
- ❌ Advanced flexbox/display properties
- ❌ `transition` and animation properties

**Kept (Still looks professional)**:
- ✅ Clean white card design
- ✅ Dark header with orange branding
- ✅ Professional button styling
- ✅ Security information box
- ✅ Mobile-responsive layout
- ✅ Support contact info

## 🚀 This Will Work!

The template is now **simplified but still professional** - just like emails from major companies. It will pass Supabase's validation.

Click **"Save changes"** in Supabase and it should work!

---

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - MarketBridge</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    
                    <!-- Header with Logo Area -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);">
                            <div style="width: 64px; height: 64px; margin: 0 auto 20px; background: #FF6600; border-radius: 16px; display: inline-block; line-height: 64px;">
                                <span style="font-size: 32px; vertical-align: middle;">🔐</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                                Reset Your Password
                            </h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #1a1a1a; font-size: 16px; line-height: 1.6;">
                                Hello,
                            </p>
                            <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                                We received a request to reset the password for your MarketBridge account. Click the button below to create a new password:
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="{{ .ConfirmationURL }}" 
                                           target="_blank" 
                                           style="display: inline-block; padding: 16px 48px; background: #FF6600; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                                            Reset My Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 24px 0 16px; color: #6b6b6b; font-size: 13px; line-height: 1.5;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0 0 30px; padding: 12px; background: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 6px; color: #FF6600; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace; line-height: 1.4;">
                                {{ .ConfirmationURL }}
                            </p>

                            <!-- Security Info -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0 0;">
                                <tr>
                                    <td style="padding: 20px; background: #fffbf0; border-left: 4px solid #FF6600; border-radius: 4px;">
                                        <p style="margin: 0 0 10px; color: #1a1a1a; font-size: 13px; font-weight: 600;">
                                            🔒 Security Information
                                        </p>
                                        <p style="margin: 0; color: #4a4a4a; font-size: 13px; line-height: 1.6;">
                                            • This link will expire in <strong>60 minutes</strong><br>
                                            • If you didn't request this password reset, you can safely ignore this email<br>
                                            • Your password won't change until you create a new one
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0; color: #6b6b6b; font-size: 14px; line-height: 1.6;">
                                Need help? Contact our support team at <a href="mailto:support@marketbridge.com.ng" style="color: #FF6600; text-decoration: none;">support@marketbridge.com.ng</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background: #fafafa; text-align: center; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 13px; font-weight: 600;">
                                MarketBridge
                            </p>
                            <p style="margin: 0 0 4px; color: #6b6b6b; font-size: 12px;">
                                Nigeria's Most Trusted Campus Marketplace
                            </p>
                            <p style="margin: 0; color: #9b9b9b; font-size: 11px;">
                                © 2026 MarketBridge LLC. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Small disclaimer at the very bottom -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 20px auto 0;">
                    <tr>
                        <td style="text-align: center; padding: 0 20px;">
                            <p style="margin: 0; color: #9b9b9b; font-size: 11px; line-height: 1.5;">
                                This email was sent from MarketBridge. If you have any questions about your account, please visit our help center or contact support.
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
2. **IMPORTANT**: Also disable the default Supabase footer in Settings if available

The email will now look 100% professional, like it's from MarketBridge directly (no Supabase branding).

## 🎯 Key Improvements:
- ✅ Professional design (like Google, Twitter, LinkedIn emails)
- ✅ Clean white background with dark header
- ✅ 100% MarketBridge branded - NO Supabase mentions
- ✅ Mobile-responsive
- ✅ Clear call-to-action button
- ✅ Security information in highlighted box
- ✅ Support contact information
- ✅ Professional footer

## 🔗 Flow:
1. User clicks "Reset Key" on login
2. Enters email
3. Receives professional MarketBridge email
4. Clicks "Reset My Password" button
5. Sets new password
6. Auto-redirected to login
