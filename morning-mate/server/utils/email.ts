import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "GlowJo <noreply@getglowjo.com>";

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export async function sendEmail({ to, subject, template, data }: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(`[Email] RESEND_API_KEY is not set — cannot send email to ${to}`);
    throw new Error("Email service is not configured (missing RESEND_API_KEY).");
  }
  const resend = new Resend(apiKey);

  const emailTemplates: Record<string, (data: any) => string> = {
    "welcome": (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff8ee; padding: 24px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 56px;">☀️</div>
          <h1 style="font-family: Georgia, serif; color: #ff5f1f; margin: 8px 0; font-size: 28px;">Welcome to GlowJo, ${data.userName}!</h1>
          <p style="color: #7a5c3a; font-size: 16px; margin: 0;">Peaceful mornings start here.</p>
        </div>
        <p style="color: #5a3e28; font-size: 15px; line-height: 1.7;">
          You've just taken the first step to turning chaotic school mornings into something your child actually looks forward to. 🎉
        </p>
        <p style="color: #5a3e28; font-size: 15px; line-height: 1.7;">Here's what to do next:</p>
        <ol style="color: #5a3e28; font-size: 15px; line-height: 2;">
          <li>Set up your child's profile (name, age, wake-up time)</li>
          <li>Choose their morning tasks</li>
          <li>Let Sunny the sun guide them through their first routine!</li>
        </ol>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.appUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #ff9a3c, #ff5f1f); color: white; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 17px;">Start Your First Morning →</a>
        </div>
        <p style="color: #a07850; font-size: 13px; line-height: 1.6;">If you have any questions, just reply to this email — we're a small team and we read every message. 💛</p>
        <p style="color: #a07850; font-size: 13px;">The GlowJo Team</p>
      </div>
    `,
    "signup-verification": (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; border-radius: 10px;">
        <h2 style="color: #ff5f1f;">🎉 Verify Your Email</h2>
        <p>Hi ${data.childName}'s parent!</p>
        <p>Click the link below to verify your email and start the morning routine:</p>
        <a href="${data.verificationLink}" style="display: inline-block; padding: 12px 24px; background: #ff5f1f; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">Verify Email →</a>
        <p style="margin-top: 30px; font-size: 12px; color: #999;">Or copy this link: ${data.verificationLink}</p>
      </div>
    `,
    "subscription-welcome": (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Welcome to GlowJo, ${data.userName}!</h2>
        <p>Your subscription is active until <strong>${data.currentPeriodEnd}</strong>.</p>
        <p>Enjoy happy music every morning, bilingual routines, and Parents' Voice recording!</p>
        <a href="${process.env.APP_URL || "https://getglowjo.com"}" style="display: inline-block; padding: 12px 24px; background: #ff5f1f; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Open GlowJo →</a>
      </div>
    `,
    "subscription-canceled": (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>😢 We'll miss you, ${data.userName}</h2>
        <p>Your GlowJo subscription was canceled on <strong>${data.canceledDate}</strong>.</p>
        <p>You can reactivate anytime:</p>
        <a href="${data.reactivateLink}" style="display: inline-block; padding: 12px 24px; background: #ff5f1f; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Reactivate →</a>
      </div>
    `,
    "password-reset": (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff8ee; padding: 20px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 48px;">🔑</div>
          <h2 style="color: #ff5f1f; margin: 8px 0;">Reset Your Password</h2>
        </div>
        <p>Hi ${data.userName}!</p>
        <p>We received a request to reset your GlowJo password. Click the button below — this link expires in 1 hour.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${data.resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #ff9a3c, #ff5f1f); color: white; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px;">Reset My Password →</a>
        </div>
        <p style="font-size: 13px; color: #999;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #bbb;">Or copy this link: ${data.resetLink}</p>
      </div>
    `,
    "payment-failed": (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>⚠️ Payment Issue, ${data.userName}</h2>
        <p>We couldn't process your payment: <strong>${data.failureReason}</strong></p>
        <p>Update your billing info to keep your subscription active:</p>
        <a href="${data.updateBillingLink}" style="display: inline-block; padding: 12px 24px; background: #ff5f1f; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Update billing →</a>
      </div>
    `,
  };

  const html = emailTemplates[template]?.(data) || "";

  const { data: emailData, error } = await resend.emails.send({ from: FROM, to, subject, html });

  if (error) {
    console.error(`❌ Resend error sending to ${to}:`, error);
    throw new Error(`Resend failed: ${error.message}`);
  }

  console.log(`✅ Email sent to ${to}:`, emailData?.id);
  return { success: true };
}
