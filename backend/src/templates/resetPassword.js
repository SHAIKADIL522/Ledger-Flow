function resetPasswordTemplate({ name, resetUrl }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#0f172a">
      <h2>Reset your password</h2>
      <p>Hi ${name},</p>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none">
        Reset Password
      </a>
      <p style="margin-top:24px;color:#64748b">If you didn't request this, ignore this email.</p>
    </div>
  `;
}

module.exports = { resetPasswordTemplate };