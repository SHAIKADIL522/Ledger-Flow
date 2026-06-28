
/**
 * @param {object} params
 * @param {Array}  params.items          - [{quantity, unitPrice}]
 * @param {number} params.discountPercent - 0-100
 * @param {number} params.taxPercent      - 0-100 (total GST, split 50/50 CGST/SGST for same-state)
 * @param {string} params.currency        - "INR" | "USD" etc.
 * @param {string} params.placeOfSupply   - if same state as seller → CGST+SGST, else IGST
 * @param {string} params.sellerState     - seller's state code (default "36" = Telangana)
 * @returns {object} full breakdown
 */
function calculateInvoice({
  items = [],
  discountPercent = 0,
  taxPercent = 0,
  currency = "INR",
  placeOfSupply = "36",
  sellerState = "36",
}) {
  const subtotal = items.reduce((sum, i) => {
    return sum + Number(i.quantity) * Number(i.unitPrice);
  }, 0);

  const discountAmount = Number(((subtotal * Number(discountPercent)) / 100).toFixed(2));
  const taxableAmount = Number((subtotal - discountAmount).toFixed(2));

  const totalTax = Number(((taxableAmount * Number(taxPercent)) / 100).toFixed(2));

  // Same state → CGST + SGST (split 50/50), different state → IGST
  const sameState = String(placeOfSupply) === String(sellerState);
  const cgst = sameState ? Number((totalTax / 2).toFixed(2)) : 0;
  const sgst = sameState ? Number((totalTax / 2).toFixed(2)) : 0;
  const igst = sameState ? 0 : totalTax;

  const total = Number((taxableAmount + totalTax).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount,
    taxableAmount,
    taxPercent: Number(taxPercent),
    cgst,
    sgst,
    igst,
    totalTax,
    total,
    currency,
    sameState,
  };
}

module.exports = { calculateInvoice };