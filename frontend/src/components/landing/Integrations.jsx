import { Chrome, Mail, Sparkles, CreditCard, Globe, Database, Cloud, Send, ShieldAlert } from "lucide-react";

const INTEGRATIONS = [
  { icon: Chrome, name: "Google", desc: "One-click secure login via OAuth." },
  { icon: Mail, name: "Gmail", desc: "Send invoices straight from your inbox." },
  { icon: Sparkles, name: "OpenRouter", desc: "Powers AI invoicing and insights." },
  { icon: CreditCard, name: "Razorpay", desc: "Accept domestic payments instantly." },
  { icon: Globe, name: "Stripe", desc: "Bill international clients with ease." },
  { icon: Database, name: "MongoDB", desc: "Reliable, scalable data storage." },
  { icon: Cloud, name: "Cloudinary", desc: "Secure document & receipt uploads." },
  { icon: Send, name: "Resend", desc: "Transactional email delivery." },
  { icon: ShieldAlert, name: "Sentry", desc: "Real-time error monitoring." },
];

export default function Integrations() {
  return (
    <section id="integrations" className="section-pad py-28 bg-navy-900/40 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.35em] text-primary font-semibold">Integrations</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4">
            Works with the tools you already use
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INTEGRATIONS.map((i) => {
            const Icon = i.icon;
            return (
              <div
                key={i.name}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-navy-800/40 p-5 hover:border-primary/30 hover:bg-navy-800/70 transition-all duration-300"
              >
                <div className="size-11 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{i.name}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{i.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
