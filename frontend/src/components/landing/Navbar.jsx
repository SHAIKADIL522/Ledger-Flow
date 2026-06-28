"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Button from "@/components/ui/Button";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#integrations", label: "Integrations" },
  { href: "#pricing", label: "Pricing" },
  { href: "#security", label: "Security" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-navy-950/80 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      <nav className="section-pad mx-auto max-w-7xl h-20 flex items-center justify-between">
        <Logo size="md" />

        <div className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-slate-300 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm" className="group">
              Get Started
            </Button>
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="lg:hidden size-11 flex items-center justify-center text-white cursor-pointer"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden bg-navy-900 border-t border-white/10 px-6 py-6 space-y-4 animate-fadeUp">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-slate-200 text-sm">
              {l.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-3">
            <Link href="/login">
              <Button variant="secondary" className="w-full">Login</Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
