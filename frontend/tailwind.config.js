/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F7F7F5",
        navy: {
          50: "#EAF2F8",
          100: "#D4E5F2",
          700: "#174A7E",
          800: "#12395F",
          900: "#0D2743"
        }
      }
    },
  },
  plugins: [],
}
