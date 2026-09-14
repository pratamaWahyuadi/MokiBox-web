/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  darkMode: ["class", ".moki-mellow"],
  theme: {
    extend: {
      colors: {
        moki: {
          bg: "rgb(var(--moki-bg) / <alpha-value>)",
          surface: "rgb(var(--moki-surface) / <alpha-value>)",
          line: "rgb(var(--moki-line) / <alpha-value>)",
          text: "rgb(var(--moki-text) / <alpha-value>)",
          mute: "rgb(var(--moki-mute) / <alpha-value>)",
          accent: "rgb(var(--moki-accent) / <alpha-value>)",
          accent2: "rgb(var(--moki-accent2) / <alpha-value>)",
          gold: "rgb(var(--moki-gold) / <alpha-value>)",
          ink: "rgb(var(--moki-ink) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        brand: ['"Nunito"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};