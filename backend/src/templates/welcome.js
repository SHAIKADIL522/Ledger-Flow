function welcomeTemplate({ name }) {
  const firstName = name?.split(" ")[0] || name;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:32px">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#22D3C5;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle">
                <span style="color:#0a0f1e;font-size:20px;font-weight:900;line-height:36px">L</span>
              </td>
              <td style="padding-left:10px;font-size:22px;font-weight:700;color:#fff">
                Ledger<span style="color:#22D3C5">Flow</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Hero Card -->
        <tr><td style="background:linear-gradient(135deg,#0f2a2a 0%,#0f172a 60%);border:1px solid rgba(34,211,197,0.15);border-radius:16px;padding:40px 36px">

          <!-- Greeting icon -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-bottom:20px">
              <div style="font-size:48px;line-height:1">👋</div>
            </td></tr>
          </table>

          <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#fff;text-align:center">
            Welcome aboard, ${firstName}!
          </h1>
          <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;text-align:center;line-height:1.7">
            Your account is verified and ready. LedgerFlow will handle your invoicing, expenses, and financial reports — so you can focus on what you do best.
          </p>

          <!-- Divider -->
          <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:28px"></div>

          <!-- Next steps -->
          <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#22D3C5;text-transform:uppercase;letter-spacing:0.08em">Complete your setup</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:28px;height:28px;background:rgba(34,211,197,0.1);border-radius:7px;text-align:center;vertical-align:middle;font-size:14px;line-height:28px">🏢</td>
                    <td style="padding-left:12px;font-size:14px;color:#e2e8f0">Add your business details</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:28px;height:28px;background:rgba(34,211,197,0.1);border-radius:7px;text-align:center;vertical-align:middle;font-size:14px;line-height:28px">👤</td>
                    <td style="padding-left:12px;font-size:14px;color:#e2e8f0">Add your first client</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:28px;height:28px;background:rgba(34,211,197,0.1);border-radius:7px;text-align:center;vertical-align:middle;font-size:14px;line-height:28px">🧾</td>
                    <td style="padding-left:12px;font-size:14px;color:#e2e8f0">Generate your first invoice</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/onboarding"
                 style="display:inline-block;background:#22D3C5;color:#0a0f1e;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none">
                Complete Setup →
              </a>
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px">
          <p style="margin:0;font-size:12px;color:#334155">
            © 2026 LedgerFlow · AI-powered invoicing for freelancers & businesses
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `;
}

module.exports = { welcomeTemplate };