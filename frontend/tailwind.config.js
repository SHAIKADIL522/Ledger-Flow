
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          50: "#EAFFFC",
          100: "#CFFBF6",
          200: "#9FF5EC",
          300: "#67E9DD",
          400: "#3BDCCC",
          500: "rgb(var(--color-primary) / <alpha-value>)",
          600: "#16A89D",
          700: "#13837C",
          800: "#136663",
          900: "#125450",
        },
        accent: {
          DEFAULT: "#00E5B0",
          600: "#00B98D",
        },
        navy: {
          DEFAULT: "rgb(var(--navy-900) / <alpha-value>)",
          50:  "rgb(var(--navy-50)  / <alpha-value>)",
          100: "rgb(var(--navy-100) / <alpha-value>)",
          200: "rgb(var(--navy-200) / <alpha-value>)",
          300: "rgb(var(--navy-300) / <alpha-value>)",
          400: "rgb(var(--navy-400) / <alpha-value>)",
          500: "rgb(var(--navy-500) / <alpha-value>)",
          600: "rgb(var(--navy-600) / <alpha-value>)",
          700: "rgb(var(--navy-700) / <alpha-value>)",
          800: "rgb(var(--navy-800) / <alpha-value>)",
          900: "rgb(var(--navy-900) / <alpha-value>)",
          950: "rgb(var(--navy-950) / <alpha-value>)",
        },
        // Override Tailwind's built-in white so text-white / bg-white/5 / border-white/10 flip with theme
        white: "rgb(var(--ui-white) / <alpha-value>)",
        // Override Tailwind's built-in slate scale used throughout (text-slate-400 etc.)
        slate: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "rgb(var(--ui-slate-200) / <alpha-value>)",
          300: "rgb(var(--ui-slate-300) / <alpha-value>)",
          400: "rgb(var(--ui-slate-400) / <alpha-value>)",
          500: "rgb(var(--ui-slate-500) / <alpha-value>)",
          600: "rgb(var(--ui-slate-600) / <alpha-value>)",
          700: "rgb(var(--ui-slate-700) / <alpha-value>)",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        silver: "#E5E7EB",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(34, 211, 197, 0.45)",
        card: "0 20px 40px -12px rgba(7, 18, 38, 0.45)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        floatY: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s infinite",
        floatY: "floatY 6s ease-in-out infinite",
        fadeUp: "fadeUp 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};