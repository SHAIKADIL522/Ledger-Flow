const nodemailer = require("nodemailer");
const { welcomeTemplate } = require("../templates/welcome");
const { resetPasswordTemplate } = require("../templates/resetPassword");
const { verifyEmailTemplate } = require("../templates/verifyEmail");
const { invoiceSentTemplate } = require("../templates/invoiceSent");
const { invoicePaidTemplate } = require("../templates/invoicePaid");
const logger = require("./logger");

const FROM = process.env.EMAIL_FROM || "no-reply@ledgerflow.com";

// Lazily created — lets the server boot even if SMTP env vars are
// missing/incomplete in local dev (DEV_SKIP_EMAIL covers that path anyway).
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS (Brevo) in your .env."
    );
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // true only for port 465, false for 587 (STARTTLS)
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const info = await getTransporter().sendMail({ from: FROM, to, subject, html });
  logger.info({ to, subject, messageId: info.messageId }, "email sent via Brevo SMTP");
  return info;
}

async function sendInvoiceEmail({ to, invoiceNumber, clientName, total, currency, dueDate, fromName }) {
  return sendEmail({
    to,
    subject: `Invoice #${invoiceNumber} from ${fromName}`,
    html: invoiceSentTemplate({ invoiceNumber, clientName, total, currency, dueDate, fromName }),
  });
}

async function sendWelcomeEmail({ to, name }) {
  return sendEmail({
    to,
    subject: "Welcome to LedgerFlow!",
    html: welcomeTemplate({ name }),
  });
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  return sendEmail({
    to,
    subject: "Reset your LedgerFlow password",
    html: resetPasswordTemplate({ name, resetUrl }),
  });
}

async function sendVerifyEmail({ to, name, otp }) {
  return sendEmail({
    to,
    subject: `${otp} is your LedgerFlow verification code`,
    html: verifyEmailTemplate({ name, otp }),
  });
}

async function sendInvoicePaidEmail({ to, invoiceNumber, clientName, total, currency, fromName }) {
  return sendEmail({
    to,
    subject: `Payment received for Invoice #${invoiceNumber}`,
    html: invoicePaidTemplate({ invoiceNumber, clientName, total, currency, fromName }),
  });
}

module.exports = {
  sendInvoiceEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerifyEmail,
  sendInvoicePaidEmail,
};