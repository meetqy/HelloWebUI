/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./components/**/*.vue"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui"), require("@tailwindcss/line-clamp")],
};
