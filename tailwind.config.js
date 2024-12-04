/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./client/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        background: '#101010',
        primary: '#1f1f1f',
        secondary: '#64656d',
        accent: '#f2f2f2'
      }
    },
  },
  plugins: [],
}