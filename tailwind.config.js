/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(231 82% 6% / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
  darkMode: "selector",
};
