const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", ".dark"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07111f"
        },
        brand: {
          50: "#efedff",
          500: "#5b4de8",
          600: "#4738d0"
        },
        canvas: "#f5f7fb",
        surface: "#ffffff",
        line: "#e6e9f0"
      },
      fontFamily: {
        sans: ["Inter", "DM Sans", "Avenir Next", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        panel: "0.9375rem",
        control: "0.5625rem"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 20px 80px rgba(0,0,0,0.35)",
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.03)",
        float: "0 18px 50px rgba(30, 41, 59, 0.08)"
      }
    }
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", "body.light &");
    })
  ]
};
