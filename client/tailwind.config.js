/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED', // Purple
          dark: '#6D28D9',
          light: '#8B5CF6',
        },
      },
    },
  },
  plugins: [],
}

