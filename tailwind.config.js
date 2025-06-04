const defaultTheme = require('tailwindcss/defaultTheme');

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
        'nordstrom-navy': {
          DEFAULT: '#0A2342', // Base navy color
          light: '#1E3A5F',   // Lighter shade for hover/accents
          dark: '#051424'     // Darker shade if needed
        },
        'nordstrom-black': '#191919',
        'nordstrom-blue': '#004170', // Added Nordstrom primary blue
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Assuming 'class' strategy is already in use and correct
}