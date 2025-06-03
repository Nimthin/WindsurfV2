/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'instagram': '#bc2a8d',
        'tiktok': '#000000',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
