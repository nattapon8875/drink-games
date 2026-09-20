import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens, defined per theme in globals.css.
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        "bg-deep": "rgb(var(--c-bg-deep) / <alpha-value>)",
        surface2: "rgb(var(--c-surface-2) / <alpha-value>)",
        surface3: "rgb(var(--c-surface-3) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        "line-strong": "rgb(var(--c-line-strong) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--c-ink-soft) / <alpha-value>)",
        "ink-faint": "rgb(var(--c-ink-faint) / <alpha-value>)",
        mint: "rgb(var(--c-mint) / <alpha-value>)",
        "mint-deep": "rgb(var(--c-mint-deep) / <alpha-value>)",
        "mint-soft": "rgb(var(--c-mint-soft) / <alpha-value>)",
        sky2: "rgb(var(--c-sky) / <alpha-value>)",
        "sky-deep": "rgb(var(--c-sky-deep) / <alpha-value>)",
        "sky-soft": "rgb(var(--c-sky-soft) / <alpha-value>)",
        butter: "rgb(var(--c-butter) / <alpha-value>)",
        "butter-deep": "rgb(var(--c-butter-deep) / <alpha-value>)",
        "butter-soft": "rgb(var(--c-butter-soft) / <alpha-value>)",
        berry: "rgb(var(--c-berry) / <alpha-value>)",
        "berry-deep": "rgb(var(--c-berry-deep) / <alpha-value>)",
        "berry-soft": "rgb(var(--c-berry-soft) / <alpha-value>)",
        grape: "rgb(var(--c-grape) / <alpha-value>)",
        "grape-deep": "rgb(var(--c-grape-deep) / <alpha-value>)",

        // The app writes amber everywhere. Point the whole scale at the
        // tokens so every existing amber utility follows the theme.
        amber: {
          50: "rgb(var(--c-amber-50) / <alpha-value>)",
          100: "rgb(var(--c-amber-100) / <alpha-value>)",
          200: "rgb(var(--c-amber-200) / <alpha-value>)",
          300: "rgb(var(--c-amber-300) / <alpha-value>)",
          400: "rgb(var(--c-amber-400) / <alpha-value>)",
          500: "rgb(var(--c-amber-500) / <alpha-value>)",
          600: "rgb(var(--c-amber-600) / <alpha-value>)",
          700: "rgb(var(--c-amber-700) / <alpha-value>)",
          800: "rgb(var(--c-amber-800) / <alpha-value>)",
          900: "rgb(var(--c-amber-900) / <alpha-value>)",
          950: "rgb(var(--c-amber-950) / <alpha-value>)",
        },
        yellow: {
          100: "rgb(var(--c-butter-soft) / <alpha-value>)",
          200: "rgb(var(--c-butter-soft) / <alpha-value>)",
          300: "rgb(var(--c-butter) / <alpha-value>)",
          400: "rgb(var(--c-butter) / <alpha-value>)",
          500: "rgb(var(--c-butter) / <alpha-value>)",
          600: "rgb(var(--c-butter-deep) / <alpha-value>)",
          700: "rgb(var(--c-butter-deep) / <alpha-value>)",
        },

        background: "#0a0a12",
        surface: "#131322",
        "surface-card": "#1c1c32",
        neon: {
          pink: "#ff007f",
          cyan: "#00f0ff",
          purple: "#9d4edd",
          yellow: "#ffea00",
          green: "#00ff88",
        },
      },
      boxShadow: {
        "neon-pink": "0 0 15px rgba(255, 0, 127, 0.6), 0 0 30px rgba(255, 0, 127, 0.3)",
        "neon-cyan": "0 0 15px rgba(0, 240, 255, 0.6), 0 0 30px rgba(0, 240, 255, 0.3)",
        "neon-purple": "0 0 15px rgba(157, 78, 221, 0.6), 0 0 30px rgba(157, 78, 221, 0.3)",
        "neon-yellow": "0 0 15px rgba(255, 234, 0, 0.6), 0 0 30px rgba(255, 234, 0, 0.3)",
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slight": "bounce 1.5s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
