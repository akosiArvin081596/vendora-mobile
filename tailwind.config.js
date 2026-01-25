/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx}",
    "./src/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        vendora: {
          bg: '#1a1025',
          card: '#2d1f3d',
          'card-hover': '#3d2a52',
          purple: '#9333ea',
          'purple-light': '#a855f7',
          input: '#3d2a52',
          border: '#4a3660',
          text: '#e5e5e5',
          'text-muted': '#9ca3af',
        },
      },
    },
  },
  plugins: [],
};
