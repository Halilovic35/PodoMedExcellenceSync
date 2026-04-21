import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#D81B60",
          dark: "#AD1457",
          light: "#F48FB1",
          soft: "#FCE4EC",
          muted: "#F8BBD0",
        },
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 40px -12px rgba(216, 27, 96, 0.18)",
        lift: "0 18px 50px -20px rgba(26, 26, 46, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
