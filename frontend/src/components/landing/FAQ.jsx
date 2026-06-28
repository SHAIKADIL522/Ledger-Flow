"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  { q: "How secure is LedgerFlow?", a: "LedgerFlow uses Google OAuth, JWT with short-lived access tokens and rotating refresh tokens, encrypted storage, and rate-limited APIs to keep your financial data safe." },
  { q: "Does it support GST?", a: "Yes. You can store your GST number in business settings and apply tax percentages directly on invoices, with GST-ready reports available in the Pro plan." },
  { q: "Can I export reports?", a: "Yes. Revenue, expense, client, and invoice reports can all be generated and exported as PDF or CSV from the Reports section." },
  { q: "How does the AI work?", a: "Ledger AI uses OpenRouter to turn plain-English requests like \"invoice ABC Ltd for ₹50,000\" into structured invoice line items, and to surface short, actionable insights from your real data." },
  { q: "Can teams collaborate?", a: "Team access with role-based permissions is available on the Business plan, so you can invite collaborators with the right level of access." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="section-pad py-28">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs uppercase tracking-[0.35em] text-primary font-semibold">FAQ</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4">Frequently asked questions</h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={item.q} className="rounded-2xl border border-white/10 bg-navy-800/40 overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
                >
                  <span className="text-sm font-medium text-white">{item.q}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm text-slate-400 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
