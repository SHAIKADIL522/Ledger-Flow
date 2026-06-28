function welcomeTemplate({ name }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#0f172a">
      <h2>Welcome to LedgerFlow, ${name}!</h2>
      <p>Your account is ready. Start by adding your first client and creating an invoice.</p>
      <a href="${process.env.CLIENT_URL}/dashboard"
         style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none">
        Go to Dashboard
      </a>
      <p style="margin-top:24px;color:#64748b">The LedgerFlow Team</p>
    </div>
  `;
}

module.exports = { welcomeTemplate };