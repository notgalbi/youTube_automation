/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#0f0f0f',
          panel: '#1a1a1a',
          border: '#2a2a2a',
          accent: '#6366f1',
          hover: '#2d2d2d',
        },
      },
    },
  },
  plugins: [],
}
