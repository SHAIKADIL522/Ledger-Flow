import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Integrations from "@/components/landing/Integrations";
import DashboardShowcase from "@/components/landing/DashboardShowcase";
import AIDemo from "@/components/landing/AIDemo";
import Pricing from "@/components/landing/Pricing";
import Security, { Stats } from "@/components/landing/Security";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import { FinalCTA, Footer } from "@/components/landing/FinalCTA";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Integrations />
      <DashboardShowcase />
      <AIDemo />
      <Pricing />
      <Security />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
