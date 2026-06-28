"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-28 section-pad">
      <div className="absolute inset-0 bg-grid-faint bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-primary mb-8 animate-fadeUp">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          AI Accounting, built for modern businesses
        </div>

        <h1
          className="font-display font-bold text-5xl md:text-7xl leading-[1.05] tracking-tight text-white max-w-4xl mx-auto animate-fadeUp"
          style={{ animationDelay: "0.05s" }}
        >
          AI Accounting That Works
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-300 via-primary to-accent">
            While You Sleep
          </span>
        </h1>

        <p
          className="mt-7 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed animate-fadeUp"
          style={{ animationDelay: "0.1s" }}
        >
          Track expenses, generate invoices, manage GST, analyze cash flow, and get AI-powered
          financial insights from one intelligent platform.
        </p>

        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeUp"
          style={{ animationDelay: "0.15s" }}
        >
          <Link href="/signup">
            <Button size="lg" icon={ArrowRight} className="group">
              Start Free
            </Button>
          </Link>
          <Button variant="secondary" size="lg" icon={PlayCircle}>
            Book Demo
          </Button>
        </div>

        {/* Dashboard mockup visual */}
        <div className="mt-20 relative max-w-5xl mx-auto animate-fadeUp" style={{ animationDelay: "0.2s" }}>
          <div className="absolute -inset-x-10 -inset-y-6 bg-primary/10 blur-3xl rounded-[3rem] -z-10" />
          <div className="rounded-2xl border border-white/10 bg-navy-800/60 backdrop-blur-xl shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 bg-navy-900/60">
              <span className="size-2.5 rounded-full bg-rose-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-primary/70" />
              <span className="ml-3 text-xs text-slate-500">app.ledgerflow.ai/dashboard</span>
            </div>
            <div className="p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              {[
                { label: "Revenue", value: "₹1,25,000", trend: "+12%" },
                { label: "Expenses", value: "₹30,000", trend: "-4%" },
                { label: "Profit", value: "₹95,000", trend: "+18%" },
                { label: "Pending Invoices", value: "4", trend: "" },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border border-white/10 bg-navy-900/50 p-4">
                  <p className="text-xs text-slate-500">{card.label}</p>
                  <p className="text-xl font-semibold text-white mt-1">{card.value}</p>
                  {card.trend && (
                    <p className="text-xs text-primary flex items-center gap-1 mt-1">
                      <TrendingUp className="size-3" /> {card.trend}
                    </p>
                  )}
                </div>
              ))}
              <div className="col-span-2 md:col-span-4 rounded-xl border border-white/10 bg-navy-900/50 p-4 h-32 flex items-end gap-2">
                {[40, 65, 50, 80, 60, 95, 75, 110, 90, 130, 100, 145].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-primary-700 to-primary-400"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}