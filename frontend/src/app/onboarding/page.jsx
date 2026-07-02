"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Coins, Rocket, Check, ArrowRight, ArrowLeft, UserPlus, FolderPlus, FileText } from "lucide-react";
import Logo from "@/components/ui/Logo";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { CURRENCIES } from "@/lib/format";

const STEPS = [
  { id: 1, title: "Business", icon: Building2 },
  { id: 2, title: "Currency", icon: Coins },
  { id: 3, title: "First Step", icon: Rocket },
];

const BUSINESS_TYPES = [
  { value: "FREELANCER", label: "Freelancer" },
  { value: "AGENCY", label: "Agency" },
  { value: "CONSULTANT", label: "Consultant" },
  { value: "SMALL_BUSINESS", label: "Small Business" },
];

const INDUSTRIES = [
  { value: "DESIGN", label: "Design" },
  { value: "SOFTWARE", label: "Software / IT" },
  { value: "CONSULTING", label: "Consulting" },
  { value: "MARKETING", label: "Marketing & Advertising" },
  { value: "WRITING", label: "Writing & Content" },
  { value: "PHOTOGRAPHY", label: "Photography / Video" },
  { value: "FINANCE", label: "Finance & Accounting" },
  { value: "LEGAL", label: "Legal" },
  { value: "HEALTHCARE", label: "Healthcare" },
  { value: "EDUCATION", label: "Education & Training" },
  { value: "RETAIL", label: "Retail / E-commerce" },
  { value: "CONSTRUCTION", label: "Construction & Real Estate" },
  { value: "OTHER", label: "Other" },
];

const COUNTRIES = [
  { value: "INDIA", label: "India" },
  { value: "UNITED_STATES", label: "United States" },
  { value: "UNITED_KINGDOM", label: "United Kingdom" },
  { value: "CANADA", label: "Canada" },
  { value: "AUSTRALIA", label: "Australia" },
  { value: "UAE", label: "United Arab Emirates" },
  { value: "GERMANY", label: "Germany" },
  { value: "SINGAPORE", label: "Singapore" },
  { value: "OTHER", label: "Other" },
];

const FIRST_ACTIONS = [
  { value: "ADD_CLIENT", label: "Add a Client", icon: UserPlus, redirect: "/dashboard/clients?new=1" },
  { value: "CREATE_PROJECT", label: "Create a Project", icon: FolderPlus, redirect: "/dashboard/projects?new=1" },
  { value: "GENERATE_INVOICE", label: "Generate an Invoice", icon: FileText, redirect: "/dashboard/invoices/new" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    businessName: "",
    industry: "",
    industryOther: "",
    country: "",
    countryOther: "",
    businessType: "FREELANCER",
    defaultCurrency: "INR",
    firstAction: "ADD_CLIENT",
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const industryFinal = form.industry === "OTHER" ? form.industryOther.trim() : form.industry;
  const countryFinal = form.country === "OTHER" ? form.countryOther.trim() : form.country;

  const canProceedStep1 =
    form.businessName.trim() &&
    form.industry &&
    industryFinal &&
    form.country &&
    countryFinal;

  const handleFinish = async () => {
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        businessName: form.businessName,
        industry: industryFinal,
        country: countryFinal,
        businessType: form.businessType,
        defaultCurrency: form.defaultCurrency,
        firstAction: form.firstAction,
      };
      const data = await api.post("/onboarding", payload);
      setUser(data.user);
      const action = FIRST_ACTIONS.find((a) => a.value === form.firstAction);
      router.push(action?.redirect || "/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong saving your details.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center px-4 sm:px-6 py-10 sm:py-12">
      <Logo size="md" className="mb-10 sm:mb-12" />

      {/* Step indicator — FIXED: flex-wrap + shorter connectors on mobile */}
      <div className="flex items-center gap-1.5 sm:gap-3 mb-10 sm:mb-12">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`size-9 sm:size-10 rounded-full flex items-center justify-center border transition-colors ${
                  step > s.id
                    ? "bg-primary border-primary text-navy-950"
                    : step === s.id
                    ? "border-primary text-primary bg-primary/10"
                    : "border-white/10 text-slate-600"
                }`}
              >
                {step > s.id ? <Check className="size-4 sm:size-5" /> : <s.icon className="size-4" />}
              </div>
              <span className="text-xs text-slate-500 hidden sm:block">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-6 sm:w-12 h-px mb-4 sm:mb-0 ${step > s.id ? "bg-primary" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-lg">
        {step === 1 && (
          <div className="space-y-5 animate-fadeUp">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Tell us about your business</h1>
              <p className="text-sm text-slate-400">This helps us tailor LedgerFlow to how you work.</p>
            </div>
            <Input
              label="Business Name"
              required
              value={form.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="Acme Studio"
            />

            <div className="space-y-3">
              <Select
                label="Industry"
                required
                placeholder="Select an industry"
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                options={INDUSTRIES}
              />
              {form.industry === "OTHER" && (
                <Input
                  label="Tell us your industry"
                  required
                  value={form.industryOther}
                  onChange={(e) => update("industryOther", e.target.value)}
                  placeholder="e.g. Architecture"
                />
              )}
            </div>

            <div className="space-y-3">
              <Select
                label="Country"
                required
                placeholder="Select a country"
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                options={COUNTRIES}
              />
              {form.country === "OTHER" && (
                <Input
                  label="Tell us your country"
                  required
                  value={form.countryOther}
                  onChange={(e) => update("countryOther", e.target.value)}
                  placeholder="e.g. Brazil"
                />
              )}
            </div>

            <Select
              label="Business Type"
              required
              value={form.businessType}
              onChange={(e) => update("businessType", e.target.value)}
              options={BUSINESS_TYPES}
            />
            <Button className="w-full" size="lg" disabled={!canProceedStep1} onClick={() => setStep(2)} icon={ArrowRight}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-fadeUp">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">What's your default currency?</h1>
              <p className="text-sm text-slate-400">You can always invoice clients in other currencies later.</p>
            </div>
            {/* FIXED: grid-cols-2 on 320px, 3 on sm+ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update("defaultCurrency", c)}
                  className={`h-14 sm:h-16 rounded-xl border text-sm font-semibold transition-colors cursor-pointer ${
                    form.defaultCurrency === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 text-slate-300 hover:border-white/20"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" size="lg" icon={ArrowLeft} onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" size="lg" onClick={() => setStep(3)} icon={ArrowRight}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 animate-fadeUp">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">What would you like to do first?</h1>
              <p className="text-sm text-slate-400">We'll take you straight there.</p>
            </div>
            <div className="space-y-3">
              {FIRST_ACTIONS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => update("firstAction", a.value)}
                  className={`w-full flex items-center gap-3 sm:gap-4 p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    form.firstAction === a.value
                      ? "border-primary bg-primary/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="size-9 sm:size-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <a.icon className="size-4 sm:size-4.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-white">{a.label}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 text-sm text-rose-400 bg-rose-950/30 border border-rose-900/40 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" icon={ArrowLeft} onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1" size="lg" loading={submitting} onClick={handleFinish}>
                Finish Setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}