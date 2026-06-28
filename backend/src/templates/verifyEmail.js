function verifyEmailTemplate({ name, verifyUrl }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#0f172a">
      <h2>Verify your email</h2>
      <p>Hi ${name},</p>
      <p>Click below to verify your email address.</p>
      <a href="${verifyUrl}"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none">
        Verify Email
      </a>
      <p style="margin-top:24px;color:#64748b">LedgerFlow Team</p>
    </div>
  `;
}

module.exports = { verifyEmailTemplate };