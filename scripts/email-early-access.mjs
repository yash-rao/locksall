import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const filePath = path.join(process.cwd(), "data", "early-access.json");

// Read stored emails
let emails = [];

if (fs.existsSync(filePath)) {
  const raw = fs.readFileSync(filePath, "utf8");
  emails = JSON.parse(raw || "[]");
}

// If no emails, exit quietly
if (!Array.isArray(emails) || emails.length === 0) {
  console.log("No new early access emails. Nothing sent.");
  process.exit(0);
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Parse recipients safely
const recipients = (process.env.MAIL_TO || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (recipients.length === 0) {
  console.error("MAIL_TO not defined in .env.local");
  process.exit(1);
}

// Format email body
const body = emails.map((e, i) => `${i + 1}. ${e}`).join("\n");

// Send email
await transporter.sendMail({
  from: process.env.MAIL_FROM,
  to: recipients,
  subject: `LocksAll Early Access (${emails.length})`,
  text: body,
});

console.log(`Sent early access digest: ${emails.length}`);

// ✅ CLEAR FILE AFTER SUCCESS
fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf8");

console.log("early-access.json cleared after sending.");
