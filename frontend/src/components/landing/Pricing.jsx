import { Check, Scan, Atom, Box } from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";

const PLANS = [
  {
    icon: Scan,
    color: "cyan",
    name: "Starter",
    price: "₹0",
    period: "/mo",
    desc: "For freelancers just getting started with structured bookkeeping.",
    cta: "Try for free",
    features: ["100 transactions / month", "Google login", "Basic AI insights"],
  },
  {
    icon: Atom,
    color: "primary",
    name: "Pro",
    price: "₹499",
    period: "/mo",
    desc: "For growing businesses that need automation and reporting.",
    cta: "Start 7-day free trial",
    popular: true,
    features: ["Unlimited transactions", "Invoice automation", "GST reports", "Ledger AI assistant"],
  },
  {
    icon: Box,
    color: "pink",
    name: "Business",
    price: "Custom",
    period: "",
    desc: "For teams that need collaboration, forecasting, and priority support.",
    cta: "Contact sales",
    features: ["Team access", "AI forecasting", "Priority support", "Custom onboarding"],
  },
];

const ACCENTS = {
  cyan: { glow: "bg-cyan-500/10", icon: "text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]", check: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" },
  primary: { glow: "bg-primary/15", icon: "text-primary drop-shadow-[0_0_10px_rgba(34,211,197,0.6)]", check: "bg-primary/15 border-primary/30 text-primary" },
  pink: { glow: "bg-pink-500/10", icon: "text-pink-400 drop-shadow-[0_0_10px_rgba(236,72,153,0.7)]", check: "bg-pink-500/10 border-pink-500/20 text-pink-400" },
};

export default function Pricing() {
  return (
    <section id="pricing" className="section-pad py-28">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.35em] text-primary font-semibold">Pricing</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4">
            Simple, transparent pricing
          </h2>
          <p className="text-slate-400 mt-4">Start free. Upgrade as your business grows.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const a = ACCENTS[plan.color];
            return (
              <div
                key={plan.name}
                className={`group relative flex flex-col rounded-[2.25rem] border bg-navy-800/40 p-8 overflow-hidden transition-transform duration-300 hover:-translate-y-1.5 ${
                  plan.popular ? "border-primary/30 md:-my-4 shadow-glow" : "border-white/10"
                }`}
              >
                <div className={`absolute -top-20 -right-20 size-64 rounded-full blur-[80px] pointer-events-none ${a.glow}`} />

                {plan.popular && (
                  <span className="absolute top-6 right-6 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Most Popular
                  </span>
                )}

                <div className="relative z-10 mb-6">
                  <div className="size-14 rounded-2xl bg-navy-900 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    <Icon className={`size-6 ${a.icon}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{plan.desc}</p>
                </div>

                <div className="relative z-10 mb-8">
                  <span className="text-5xl font-semibold text-white tracking-tight">{plan.price}</span>
                  <span className="text-slate-500 ml-1">{plan.period}</span>
                </div>

                <Link href="/signup" className="relative z-10 mb-8">
                  <Button variant={plan.popular ? "primary" : "secondary"} className="w-full">
                    {plan.cta}
                  </Button>
                </Link>

                <div className="relative z-10 space-y-3.5 mt-auto">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <div className={`size-5 rounded-full border flex items-center justify-center ${a.check}`}>
                        <Check className="size-3" />
                      </div>
                      <span className="text-sm text-slate-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
