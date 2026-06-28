"use client";

import { useState, useEffect, useRef } from "react";
import Logo from "@/components/ui/Logo";

function EyeBall({ size = 18, pupilSize = 7, maxDistance = 5, isBlinking, mouseX, mouseY }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), maxDistance);
    const angle = Math.atan2(dy, dx);
    setPos({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
  }, [mouseX, mouseY, maxDistance]);

  return (
    <div
      ref={ref}
      className="rounded-full flex items-center justify-center bg-white transition-all duration-150"
      style={{ width: size, height: isBlinking ? 2 : size, overflow: "hidden" }}
    >
      {!isBlinking && (
        <div
          className="rounded-full bg-navy-950"
          style={{
            width: pupilSize,
            height: pupilSize,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
}

/**
 * Friendly mascot panel: two soft blob "characters" whose eyes follow the cursor.
 * A simplified, LedgerFlow-themed take on the provided animated login design.
 */
export default function AuthVisual({ tagline = "Bank-level security meets effortless bookkeeping." }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const schedule = () => {
      const t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
        schedule();
      }, Math.random() * 4000 + 3000);
      return t;
    };
    const timer = schedule();
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-12 text-navy-950 overflow-hidden">
      <div className="relative z-20">
        <Logo size="md" />
      </div>

      <div className="relative z-20 flex items-end justify-center h-[420px] gap-10">
        <div className="relative w-44 h-72 rounded-t-[100px] bg-navy-900 shadow-2xl">
          <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-6">
            <EyeBall isBlinking={blink} mouseX={mouse.x} mouseY={mouse.y} />
            <EyeBall isBlinking={blink} mouseX={mouse.x} mouseY={mouse.y} />
          </div>
        </div>
        <div className="relative w-56 h-56 rounded-t-full bg-accent shadow-2xl mb-0">
          <div className="absolute top-16 left-1/2 -translate-x-1/2 flex gap-7">
            <EyeBall size={20} pupilSize={8} maxDistance={6} isBlinking={blink} mouseX={mouse.x} mouseY={mouse.y} />
            <EyeBall size={20} pupilSize={8} maxDistance={6} isBlinking={blink} mouseX={mouse.x} mouseY={mouse.y} />
          </div>
        </div>
      </div>

      <div className="relative z-20">
        <p className="text-navy-950/80 text-sm font-medium max-w-xs">{tagline}</p>
        <div className="flex items-center gap-6 text-xs text-navy-950/60 mt-6">
          <a href="#" className="hover:text-navy-950 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-navy-950 transition-colors">Terms</a>
          <a href="#" className="hover:text-navy-950 transition-colors">Contact</a>
        </div>
      </div>

      <div className="absolute inset-0 bg-grid-faint bg-[size:24px_24px] opacity-20" />
      <div className="absolute top-1/4 right-1/4 size-64 bg-white/10 rounded-full blur-3xl animate-floatY" />
    </div>
  );
}
