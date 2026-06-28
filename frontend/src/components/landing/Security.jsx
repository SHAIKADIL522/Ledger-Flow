import { Chrome, KeyRound, ShieldCheck, Lock, Activity, Database } from "lucide-react";

const SECURITY_ITEMS = [
  { icon: Chrome, title: "Google OAuth", desc: "Secure authentication without password risk." },
  { icon: KeyRound, title: "JWT + Refresh Tokens", desc: "Persistent, short-lived sessions you control." },
  { icon: ShieldCheck, title: "Rate Limiting", desc: "API protection against abuse and brute force." },
  { icon: Lock, title: "Encrypted Storage", desc: "Your financial data is encrypted at rest." },
  { icon: Activity, title: "Sentry Monitoring", desc: "Real-time error tracking across the stack." },
  { icon: Database, title: "Role-Based Access", desc: "Granular permissions for growing teams." },
];

const STATS = [
  { value: "80%", label: "Less Manual Data Entry" },
  { value: "5x", label: "Faster Invoice Processing" },
  { value: "24/7", label: "AI Financial Assistant" },
  { value: "100%", label: "Cloud Based" },
];

export function Stats() {
  return (
    <section className="section-pad py-20 border-y border-white/5">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
              {s.value}
            </p>
            <p className="text-sm text-slate-400 mt-2">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Security() {
  return (
    <section id="security" className="section-pad py-28">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.35em] text-primary font-semibold">Security</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4">
            Enterprise grade security
          </h2>
          <p className="text-slate-400 mt-4">Your financial data deserves bank-level protection.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SECURITY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-navy-800/40 p-6 hover:border-primary/30 transition-colors duration-300">
                <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
