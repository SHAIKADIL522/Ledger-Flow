function verifyEmailTemplate({ name, otp }) {
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

        <!-- Card -->
        <tr><td style="background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 36px">

          <!-- Icon -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-bottom:24px">
              <div style="width:56px;height:56px;background:rgba(34,211,197,0.1);border:1px solid rgba(34,211,197,0.2);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:28px;line-height:56px;text-align:center">
                ✉️
              </div>
            </td></tr>
          </table>

          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;text-align:center">Verify your email</h1>
          <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;text-align:center;line-height:1.6">
            Hi ${name}, enter the code below to activate your LedgerFlow account.
          </p>

          <!-- OTP Box -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-bottom:28px">
              <div style="background:#0a0f1e;border:1px solid rgba(34,211,197,0.3);border-radius:12px;padding:20px 32px;display:inline-block">
                <span style="font-size:40px;font-weight:800;letter-spacing:14px;color:#22D3C5;font-family:'Courier New',monospace">${otp}</span>
              </div>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-align:center">
            This code expires in <strong style="color:#94a3b8">24 hours</strong>.
          </p>
          <p style="margin:0;font-size:13px;color:#64748b;text-align:center">
            If you didn't create a LedgerFlow account, you can safely ignore this email.
          </p>

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

module.exports = { verifyEmailTemplate };