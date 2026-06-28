"use client";

import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";

export function FinalCTA() {
  return (
    <section className="section-pad py-28">
      <div className="max-w-5xl mx-auto rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-navy-800 to-navy-900 p-12 md:p-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-faint bg-[size:32px_32px] opacity-30" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-72 bg-primary/20 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-5">
            Ready to automate your accounting?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-10">
            Join freelancers and growing businesses who've replaced spreadsheets with an
            intelligent financial dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" icon={ArrowRight}>Get Started</Button>
            </Link>
            <Button variant="secondary" size="lg" icon={PlayCircle}>Book Demo</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLS = [
  { title: "Product", links: ["Features", "Pricing", "Security", "Documentation"] },
  { title: "Legal", links: ["Privacy Policy", "Terms", "Contact"] },
];

export function Footer() {
  return (
    <footer className="section-pad py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        <div className="max-w-xs">
          <Logo size="md" />
          <p className="text-sm text-slate-500 mt-4 leading-relaxed">
            AI-powered accounting for freelancers, agencies, and growing businesses.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-xs text-slate-600">
        Copyright {new Date().getFullYear()} LedgerFlow. All rights reserved.
      </div>
    </footer>
  );
}
