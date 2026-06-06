/**
 * server/mailer.js
 * Nodemailer transporter + OTP email template.
 * Uses Gmail SMTP via App Password (set in .env).
 */
import nodemailer from "nodemailer";

// ── Transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,           // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on startup (logs a warning, doesn't crash)
transporter.verify((err) => {
  if (err) {
    console.warn("⚠️  Email transport not ready:", err.message);
    console.warn("   Check SMTP_USER and SMTP_PASS in your .env file.");
  } else {
    console.log("✅  Email transport ready →", process.env.SMTP_USER);
  }
});

// ── OTP email ─────────────────────────────────────────────────
export const sendOtpEmail = async ({ to, otp, purpose }) => {
  const isLogin  = purpose === "login";
  const subject  = isLogin ? "SmartCare – Your Login OTP" : "SmartCare – Verify Your Email";
  const action   = isLogin ? "sign in to your account" : "complete your registration";
  const headline = isLogin ? "Login Verification Code" : "Email Verification Code";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:40px;height:40px;background:#3b82f6;border-radius:10px;display:inline-block;line-height:40px;text-align:center;">
              <span style="color:white;font-size:20px;">❤</span>
            </div>
            <span style="color:white;font-size:20px;font-weight:700;letter-spacing:0.5px;">SmartCare</span>
          </div>
          <p style="color:#93c5fd;margin:12px 0 0;font-size:14px;">${headline}</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px;">
          <p style="color:#1e293b;font-size:16px;margin:0 0 8px;">Hello,</p>
          <p style="color:#475569;font-size:15px;margin:0 0 32px;line-height:1.6;">
            Use the verification code below to ${action}. This code is valid for <strong>10 minutes</strong>.
          </p>

          <!-- OTP box -->
          <div style="background:#f8fafc;border:2px dashed #3b82f6;border-radius:12px;padding:28px;text-align:center;margin:0 0 32px;">
            <p style="color:#64748b;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your OTP Code</p>
            <p style="color:#1e3a5f;font-size:42px;font-weight:800;letter-spacing:12px;margin:0;font-family:monospace;">${otp}</p>
          </div>

          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
            <p style="color:#92400e;font-size:13px;margin:0;">⚠️ <strong>Do not share this code</strong> with anyone. SmartCare will never ask for your OTP.</p>
          </div>

          <p style="color:#94a3b8;font-size:13px;margin:0;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} SmartCare · Healthcare Appointment Platform</p>
          <p style="color:#cbd5e1;font-size:11px;margin:6px 0 0;">This is an automated message, please do not reply.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from:    process.env.SMTP_FROM || `SmartCare <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text: `Your SmartCare OTP is: ${otp}\n\nThis code expires in 10 minutes.\nDo not share this with anyone.`,
  });
};
