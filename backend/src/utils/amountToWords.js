/**
 * amountToWords.js
 * Converts numeric amount to Indian Rupees words format.
 * Output: "Fifty Seven Thousand Eight Hundred Twenty Rupees Only"
 */

const toWords = require("number-to-words").toWords;

function capitalize(str) {
  return str
    .replace(/-/g, " ")
    .replace(/,/g, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * @param {number} amount  - e.g. 57820.50
 * @param {string} currency - "INR" | "USD" | "EUR" etc.
 * @returns {string} e.g. "Fifty Seven Thousand Eight Hundred Twenty Rupees And Fifty Paise Only"
 */
function amountToWords(amount, currency = "INR") {
  const num = Number(amount);
  if (isNaN(num)) return "";

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  const currencyLabels = {
    INR: { main: "Rupees", sub: "Paise" },
    USD: { main: "Dollars", sub: "Cents" },
    EUR: { main: "Euros", sub: "Cents" },
    GBP: { main: "Pounds", sub: "Pence" },
    AED: { main: "Dirhams", sub: "Fils" },
    CAD: { main: "Canadian Dollars", sub: "Cents" },
  };

  const labels = currencyLabels[currency] || currencyLabels["INR"];

  const mainWords = capitalize(toWords(rupees));
  let result = `${mainWords} ${labels.main}`;

  if (paise > 0) {
    const paiseWords = capitalize(toWords(paise));
    result += ` And ${paiseWords} ${labels.sub}`;
  }

  return result + " Only";
}

module.exports = { amountToWords };