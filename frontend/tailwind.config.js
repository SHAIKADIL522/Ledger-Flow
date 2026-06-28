/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#22D3C5",
          50: "#EAFFFC",
          100: "#CFFBF6",
          200: "#9FF5EC",
          300: "#67E9DD",
          400: "#3BDCCC",
          500: "#22D3C5",
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
          DEFAULT: "#071226",
          50: "#EEF1F6",
          100: "#D6DCE8",
          200: "#A9B5CC",
          300: "#7B89AF",
          400: "#4C5C8F",
          500: "#2C3A66",
          600: "#1A2647",
          700: "#101A33",
          800: "#0B1322",
          900: "#071226",
          950: "#040A17",
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
