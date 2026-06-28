import nodemailer from "nodemailer";

type ResetEmailInput = {
  to: string;
  resetUrl: string;
};

type EarlyAccessEmailInput = {
  to: string;
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

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }: ResetEmailInput) {
  if (!isMailConfigured()) {
    return { sent: false };
  }

  const transporter = createTransporter();

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

export async function sendEarlyAccessAcknowledgement({ to }: EarlyAccessEmailInput) {
  if (!isMailConfigured()) {
    return { sent: false };
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "You are on the LocksAll early-access list",
    text: "Thanks for joining the LocksAll early-access list. We saved your request and will follow up with prototype updates.",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #14211f;">
        <h2>You are on the LocksAll early-access list</h2>
        <p>Thanks for joining. We saved your request and will follow up with prototype updates.</p>
        <p>LocksAll helps people respond quickly when payment cards may be at risk.</p>
      </div>
    `,
  });

  return { sent: true };
}
