"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";

// Loads Razorpay's checkout.js once and caches the promise so repeat clicks
// don't re-fetch the script.
let razorpayScriptPromise = null;
function loadRazorpayScript() {
  if (razorpayScriptPromise) return razorpayScriptPromise;
  razorpayScriptPromise = new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
  return razorpayScriptPromise;
}

// gateway is only "razorpay" | "stripe" from /payments/status — never
// exposes keys/secrets to the client. Invoice status flips to PAID only
// once the backend webhook verifies the payment server-side, so this
// component never marks anything paid itself.
export default function PayInvoiceButton({ invoice, className = "" }) {
  const [status, setStatus] = useState(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api
      .get("/payments/status")
      .then(setStatus)
      .catch(() => setStatus({ razorpay: false, stripe: false }));
  }, []);

  if (invoice.status === "PAID") return null;
  if (!status) return null;

  // Domestic (INR) invoices default to Razorpay, everything else to Stripe —
  // falls back to whichever gateway is actually configured.
  const preferRazorpay = invoice.currency === "INR";
  const gateway = preferRazorpay
    ? status.razorpay
      ? "razorpay"
      : status.stripe
      ? "stripe"
      : null
    : status.stripe
    ? "stripe"
    : status.razorpay
    ? "razorpay"
    : null;

  if (!gateway) return null; // no gateway configured — nothing to show

  async function handlePay() {
    setError("");
    setPaying(true);
    try {
      if (gateway === "razorpay") {
        const [order] = await Promise.all([
          api.post("/payments/razorpay/order", { invoiceId: invoice.id }),
          loadRazorpayScript(),
        ]);
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "LedgerFlow",
          description: `Invoice ${order.invoice.invoiceNumber}`,
          order_id: order.orderId,
          handler: () => setSubmitted(true),
          modal: { ondismiss: () => setPaying(false) },
          theme: { color: "#22D3C5" },
        });
        rzp.on("payment.failed", (resp) => {
          setError(resp?.error?.description || "Payment failed. Please try again.");
          setPaying(false);
        });
        rzp.open();
        return; // paying stays true until modal dismiss/handler
      }

      // Stripe — redirect to hosted checkout, comes back to this page with
      // ?payment=success or ?payment=cancelled via success_url/cancel_url.
      const session = await api.post("/payments/stripe/checkout-session", {
        invoiceId: invoice.id,
      });
      window.location.href = session.url;
    } catch (err) {
      setError(err.message || "Could not start payment.");
      setPaying(false);
    }
  }

  if (submitted) {
    return (
      <span className="text-sm text-primary flex items-center gap-2">
        Payment submitted — status updates once confirmed.
      </span>
    );
  }

  return (
    <div className={className}>
      <Button icon={Wallet} loading={paying} onClick={handlePay} disabled={paying}>
        {paying ? "Processing…" : "Pay Now"}
      </Button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}