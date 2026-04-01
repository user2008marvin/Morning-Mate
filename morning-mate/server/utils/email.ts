import FormData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(FormData);
const mg = process.env.MAILGUN_API_KEY
  ? mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY,
    })
  : null;

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export async function sendEmail({ to, subject, template, data }: EmailOptions) {
  // Skip email sending if Mailgun is not configured (e.g., during tests)
  if (!mg) {
    console.warn(`[Email] Mailgun not configured, skipping email to ${to}`);
    return { success: false };
  }
  const emailTemplates: Record<string, (data: any) => string> = {
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
        <h2>🎉 Welcome to Morning Mate Pro, ${data.userName}!</h2>
        <p>Your subscription is active until <strong>${data.currentPeriodEnd}</strong>.</p>
        <p>Enjoy unlimited challenges, custom routines, and family analytics!</p>
        <a href="${process.env.APP_URL}" style="display: inline-block; padding: 12px 24px; background: #ff5f1f; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Get started →</a>
      </div>
    `,
    "subscription-canceled": (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>😢 We'll miss you, ${data.userName}</h2>
        <p>Your Morning Mate Pro subscription was canceled on <strong>${data.canceledDate}</strong>.</p>
        <p>You can reactivate anytime:</p>
        <a href="${data.reactivateLink}" style="display: inline-block; padding: 12px 24px; background: #ff5f1f; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Reactivate subscription →</a>
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

  const htmlContent = emailTemplates[template]?.(data) || "";

  try {
    const messageData = {
      from: process.env.MAILGUN_FROM_EMAIL || "noreply@morningmate.app",
      to: to,
      subject: subject,
      html: htmlContent,
    };

    const result = await mg.messages.create(
      process.env.MAILGUN_DOMAIN || "",
      messageData
    );

    console.log(`✅ Email sent to ${to}:`, result.id);
    return { success: true };
  } catch (error) {
    console.error(`❌ Mailgun error:`, error);
    throw error;
  }
}
