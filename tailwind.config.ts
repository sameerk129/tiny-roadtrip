import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      colors: {
        ink: "#0b0a14",
        dust: "#e7e2d3",
      },
      boxShadow: {
        glow: "0 0 24px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.06)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "soft-pulse": "softPulse 4s ease-in-out infinite",
        flicker: "flicker 3s steps(8) infinite",
      },
      keyframes: {
        softPulse: {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
        },
        flicker: {
          "0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%": { opacity: "1" },
          "20%, 22%, 24%, 55%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
