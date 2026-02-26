export const getWaitlistWelcomeTemplate = (email: string, queuePosition: number) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff; padding: 20px; border-radius: 10px;">
  <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #333333;">
    <h1 style="color: #FF6200; font-style: italic; margin: 0; font-weight: 900; letter-spacing: 2px;">MARKETBRIDGE</h1>
  </div>
  <div style="padding: 30px 20px;">
    <h2 style="color: #ffffff; font-size: 24px;">Welcome to the MarketBridge Family! 🚀</h2>
    <p style="font-size: 16px; line-height: 1.5; color: #cccccc;">
      Hi ${email.split('@')[0]},
    </p>
    <p style="font-size: 16px; line-height: 1.5; color: #cccccc;">
      You're in! You are now <strong>#${queuePosition}</strong> in the queue. We'll notify you the moment we open the campus marketplace for buyers.
    </p>
    <div style="background-color: #1a1a1a; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #FF6200;">
      <p style="margin: 0; color: #ff9966; font-weight: bold;">Get ready for Nigeria's smartest & safest campus marketplace.</p>
    </div>
  </div>
  <div style="text-align: center; padding-top: 20px; border-top: 1px solid #333333; font-size: 12px; color: #666666;">
    <p>MarketBridge Africa © ${new Date().getFullYear()}</p>
  </div>
</div>
`;

export const getSellerApplicationTemplate = (name: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff; padding: 20px; border-radius: 10px;">
  <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #333333;">
    <h1 style="color: #FF6200; font-style: italic; margin: 0; font-weight: 900; letter-spacing: 2px;">MARKETBRIDGE</h1>
  </div>
  <div style="padding: 30px 20px;">
    <h2 style="color: #ffffff; font-size: 24px;">Application Received 📝</h2>
    <p style="font-size: 16px; line-height: 1.5; color: #cccccc;">
      Hi ${name},
    </p>
    <p style="font-size: 16px; line-height: 1.5; color: #cccccc;">
      Thank you for applying to join the Campus Crew as a seller! Your application is currently under review by our operations team.
    </p>
    <p style="font-size: 16px; line-height: 1.5; color: #cccccc;">
      We'll reply within 48 hours to let you know the next steps.
    </p>
  </div>
  <div style="text-align: center; padding-top: 20px; border-top: 1px solid #333333; font-size: 12px; color: #666666;">
    <p>MarketBridge Africa © ${new Date().getFullYear()}</p>
  </div>
</div>
`;

export const getSellerApprovedTemplate = (name: string, inviteLink: string) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff; padding: 20px; border-radius: 10px;">
  <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #333333;">
    <h1 style="color: #FF6200; font-style: italic; margin: 0; font-weight: 900; letter-spacing: 2px;">MARKETBRIDGE</h1>
  </div>
  <div style="padding: 30px 20px;">
    <h2 style="color: #ffffff; font-size: 24px;">Application Approved! 🎉</h2>
    <p style="font-size: 16px; line-height: 1.5; color: #cccccc;">
      Congratulations ${name}!
    </p>
    <p style="font-size: 16px; line-height: 1.5; color: #cccccc;">
      Your seller account is ready. You can now access your private seller dashboard and start uploading your real items for sale.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteLink}" style="background-color: #FF6200; color: #000000; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
        Set Up Your Account
      </a>
    </div>
    <p style="font-size: 14px; color: #999999; margin-top: 20px;">
      If the button above does not work, copy and paste this link into your browser: <br/>${inviteLink}
    </p>
  </div>
  <div style="text-align: center; padding-top: 20px; border-top: 1px solid #333333; font-size: 12px; color: #666666;">
    <p>MarketBridge Africa © ${new Date().getFullYear()}</p>
  </div>
</div>
`;
