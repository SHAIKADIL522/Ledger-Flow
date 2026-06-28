function invoicePaidTemplate({ invoiceNumber, clientName, total, currency, fromName }) {
  const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(total);

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#0f172a">
      <h2 style="color:#16a34a">Payment Received</h2>
      <p>Hi ${clientName},</p>
      <p>We've received your payment for Invoice #${invoiceNumber}.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0"><strong>Amount Paid</strong></td>
          <td style="padding:8px;border:1px solid #e2e8f0">${formatted}</td>
        </tr>
      </table>
      <p style="margin-top:24px;color:#64748b">Thank you for your business!<br/><strong>${fromName}</strong></p>
    </div>
  `;
}

module.exports = { invoicePaidTemplate };