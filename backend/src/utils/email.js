const { Resend } = require("resend");
const { welcomeTemplate } = require("../templates/welcome");
const { resetPasswordTemplate } = require("../templates/resetPassword");
const { verifyEmailTemplate } = require("../templates/verifyEmail");
const { invoiceSentTemplate } = require("../templates/invoiceSent");
const { invoicePaidTemplate } = require("../templates/invoicePaid");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(error.message);
  return data;
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