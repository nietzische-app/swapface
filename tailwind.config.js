/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "Noto Sans", "Segoe UI", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#0c0b14",
          900: "#100e1a",
          800: "#171528",
          700: "#211c36",
        },
        mist: "#9a95ad",
      },
      boxShadow: {
        glow: "0 10px 30px rgba(109, 77, 255, 0.35)",
      },
    },
  },
  plugins: [],
};
