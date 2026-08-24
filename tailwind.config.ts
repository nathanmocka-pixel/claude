import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#16213E",
        cream: "#F7F7F5",
        border: "#E4E4E0",
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
