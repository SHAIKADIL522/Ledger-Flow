function invoiceSentTemplate({ invoiceNumber, clientName, total, currency, dueDate, fromName }) {
  const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(total);
  const due = dueDate ? new Date(dueDate).toLocaleDateString("en-IN") : "N/A";

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;color:#0f172a">
      <h2>Invoice #${invoiceNumber}</h2>
      <p>Hi ${clientName},</p>
      <p>Please find your invoice details below:</p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0"><strong>Amount Due</strong></td>
          <td style="padding:8px;border:1px solid #e2e8f0">${formatted}</td>
        </tr>
        <tr>
          <td style="padding:8px;border:1px solid #e2e8f0"><strong>Due Date</strong></td>
          <td style="padding:8px;border:1px solid #e2e8f0">${due}</td>
        </tr>
      </table>
      <p style="margin-top:24px;color:#64748b">Regards,<br/><strong>${fromName}</strong></p>
    </div>
  `;
}

module.exports = { invoiceSentTemplate };