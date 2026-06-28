import { Sparkles, Bot, User as UserIcon, Zap, ShieldCheck, TrendingUp } from "lucide-react";

const BENEFITS = [
  { icon: Zap, text: "Generate invoices from plain English in seconds" },
  { icon: TrendingUp, text: "Spot spending trends before they become problems" },
  { icon: ShieldCheck, text: "Focused on real business workflows, not generic chat" },
];

export default function AIDemo() {
  return (
    <section className="section-pad py-28 bg-navy-900/40 border-y border-white/5">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Chat UI */}
        <div className="rounded-2xl border border-white/10 bg-navy-800/60 backdrop-blur-xl shadow-card overflow-hidden order-2 lg:order-1">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-navy-900/60">
            <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Ledger AI</p>
              <p className="text-xs text-primary flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" /> Online
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex justify-end">
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="bg-primary-600 text-navy-950 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm font-medium">
                  How much did I spend on marketing this month?
                </div>
                <div className="size-7 shrink-0 rounded-full bg-navy-700 flex items-center justify-center">
                  <UserIcon className="size-3.5 text-slate-300" />
                </div>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="flex items-start gap-2 max-w-[90%]">
                <div className="size-7 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="size-3.5 text-primary" />
                </div>
                <div className="bg-navy-700/70 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200 space-y-2">
                  <p className="font-semibold text-white">₹42,850</p>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Top categories:</p>
                    <ul className="text-xs text-slate-300 space-y-0.5">
                      <li>• Facebook Ads</li>
                      <li>• Google Ads</li>
                      <li>• Influencer Campaigns</li>
                    </ul>
                  </div>
                  <p className="text-xs text-primary font-medium">12% higher than last month</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="order-1 lg:order-2">
          <span className="text-xs uppercase tracking-[0.35em] text-primary font-semibold">AI Assistant</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4 mb-6">Meet Ledger AI</h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            Ask plain-English questions about your business and get instant, accurate answers —
            or just describe an invoice and let AI build it for you.
          </p>
          <div className="space-y-4">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.text} className="flex items-center gap-3">
                  <div className="size-9 shrink-0 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <p className="text-sm text-slate-300">{b.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
