const otpTemplate = (name, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { margin: 0; padding: 0; background: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #4a90e2, #1a5fb4); padding: 36px 30px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 1px; }
    .header p { margin: 6px 0 0; color: #cce0ff; font-size: 13px; }
    .body { padding: 36px 40px; color: #333333; }
    .body p { font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .otp-box { margin: 28px 0; text-align: center; }
    .otp-code { display: inline-block; font-size: 38px; font-weight: 700; letter-spacing: 10px; color: #1a5fb4; background: #eef4ff; border: 2px dashed #4a90e2; border-radius: 8px; padding: 14px 32px; }
    .note { font-size: 13px; color: #888; margin-top: 4px; }
    .divider { border: none; border-top: 1px solid #eeeeee; margin: 28px 0; }
    .footer { background: #f9f9f9; text-align: center; padding: 18px 30px; font-size: 12px; color: #aaaaaa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>&#128274; Verify Your Email</h1>
      <p>One-Time Password</p>
    </div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>Use the OTP below to verify your email address and complete your registration.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p class="note">&#9200; This OTP expires in <strong>10 minutes</strong>.</p>
      </div>
      <hr class="divider" />
      <p>If you did not create an account, you can safely ignore this email.</p>
      <p>Best regards,<br /><strong>The SaaS Team</strong></p>
    </div>
    <div class="footer">&copy; ${new Date().getFullYear()} SaaS Project. All rights reserved.</div>
  </div>
</body>
</html>
`;

const resendOtpTemplate = (name, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { margin: 0; padding: 0; background: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #f5a623, #e07b00); padding: 36px 30px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 1px; }
    .header p { margin: 6px 0 0; color: #fde8c0; font-size: 13px; }
    .body { padding: 36px 40px; color: #333333; }
    .body p { font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .otp-box { margin: 28px 0; text-align: center; }
    .otp-code { display: inline-block; font-size: 38px; font-weight: 700; letter-spacing: 10px; color: #e07b00; background: #fff8ee; border: 2px dashed #f5a623; border-radius: 8px; padding: 14px 32px; }
    .note { font-size: 13px; color: #888; margin-top: 4px; }
    .divider { border: none; border-top: 1px solid #eeeeee; margin: 28px 0; }
    .footer { background: #f9f9f9; text-align: center; padding: 18px 30px; font-size: 12px; color: #aaaaaa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>&#128260; New OTP Requested</h1>
      <p>One-Time Password — Resend</p>
    </div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>You requested a new OTP. Use the code below to verify your email address.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p class="note">&#9200; This OTP expires in <strong>10 minutes</strong>.</p>
      </div>
      <hr class="divider" />
      <p>If you did not request this, please ignore this email or contact support.</p>
      <p>Best regards,<br /><strong>The SaaS Team</strong></p>
    </div>
    <div class="footer">&copy; ${new Date().getFullYear()} SaaS Project. All rights reserved.</div>
  </div>
</body>
</html>
`;

const welcomeTemplate = (name, email, password) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { margin: 0; padding: 0; background: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #34c759, #1a8f3c); padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 28px; letter-spacing: 1px; }
    .header p { margin: 8px 0 0; color: #c8f5d5; font-size: 14px; }
    .body { padding: 36px 40px; color: #333333; }
    .body p { font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .cta { text-align: center; margin: 32px 0; }
    .cta a { background: #34c759; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-size: 15px; font-weight: 600; display: inline-block; }
    .features { background: #f9fafb; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
    .features p { margin: 6px 0; font-size: 14px; color: #555; }
    .divider { border: none; border-top: 1px solid #eeeeee; margin: 28px 0; }
    .footer { background: #f9f9f9; text-align: center; padding: 18px 30px; font-size: 12px; color: #aaaaaa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>&#127881; Welcome Aboard!</h1>
      <p>Your account is ready to go</p>
    </div>
    <div class="body">
      <p>Hi <strong>${name}</strong>,</p>
      <p>Congratulations! Your account has been successfully set up and is now active. We're thrilled to have you with us.</p>
      <div class="features">
        <p>&#10003; &nbsp;Email verified</p>
        <p>&#10003; &nbsp;Password configured</p>
        <p>&#10003; &nbsp;Account activated</p>
      </div>
      <p>You can now log in to your dashboard and start exploring everything we have to offer.</p>
      <div style="background:#f0f7ff;border:1px solid #c8dff7;border-radius:8px;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#1a5fb4;">&#128274; Your Login Credentials</p>
        <p style="margin:4px 0;font-size:14px;color:#444;"><strong>Email:</strong> ${email}</p>
        <p style="margin:4px 0;font-size:14px;color:#444;"><strong>Password:</strong> ${password}</p>
        <p style="margin:12px 0 0;font-size:12px;color:#e07b00;">&#9888; Please keep your credentials safe and do not share them with anyone.</p>
      </div>
      <div class="cta">
        <a href="#">Go to Dashboard</a>
      </div>
      <hr class="divider" />
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Welcome to the family,<br /><strong>The SaaS Team</strong></p>
    </div>
    <div class="footer">&copy; ${new Date().getFullYear()} SaaS Project. All rights reserved.</div>
  </div>
</body>
</html>
`;

module.exports = { otpTemplate, resendOtpTemplate, welcomeTemplate };
