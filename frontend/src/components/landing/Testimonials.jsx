import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "LedgerFlow reduced our bookkeeping time by 70%. What used to take a full day now takes twenty minutes.",
    name: "Priya Sharma",
    role: "Small Business Owner",
  },
  {
    quote: "The AI insights helped us identify wasted ad spend within the first week. It paid for itself immediately.",
    name: "Arjun Mehta",
    role: "Startup Founder",
  },
  {
    quote: "Invoicing clients in three currencies used to be a nightmare. Now it's one click and done.",
    name: "Sara Kim",
    role: "Freelance Consultant",
  },
];

export default function Testimonials() {
  return (
    <section className="section-pad py-28 bg-navy-900/40 border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.35em] text-primary font-semibold">Testimonials</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4">
            Loved by founders and freelancers
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-white/10 bg-navy-800/40 p-7">
              <Quote className="size-6 text-primary/50 mb-4" />
              <p className="text-sm text-slate-300 leading-relaxed mb-6">{t.quote}</p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
