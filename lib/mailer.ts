import nodemailer from "nodemailer";

type ResetEmailInput = {
  to: string;
  resetUrl: string;
};

export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.EMAIL_FROM
  );
}

export async function sendPasswordResetEmail({ to, resetUrl }: ResetEmailInput) {
  if (!isMailConfigured()) {
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Reset your LocksAll password",
    text: `Reset your LocksAll password using this link: ${resetUrl}\n\nThis link expires in 30 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #14211f;">
        <h2>Reset your LocksAll password</h2>
        <p>Use the secure link below to choose a new password. This link expires in 30 minutes.</p>
        <p><a href="${resetUrl}" style="color: #176047; font-weight: 700;">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  return { sent: true };
}
