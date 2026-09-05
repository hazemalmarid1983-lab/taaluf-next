import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#2E7D8E",
        ink: "#1F2A37",
        teal: "#2E7D8E",
        gold: "#E5B86E",
        cream: "#F3F5F7",
      },
      fontFamily: {
        sans: ["var(--font-tajawal)", "Tahoma", "sans-serif"],
        heading: ["var(--font-tajawal)", "Tahoma", "sans-serif"],
        body: ["var(--font-amiri)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
