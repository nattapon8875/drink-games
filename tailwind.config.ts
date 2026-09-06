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
