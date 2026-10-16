/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fanvil: {
          red: '#E60012',
          darkRed: '#B9000E',
          slate: '#0F172A',
          linkvil: '#0284C7',
          gold: '#D4AF37',
          goldLight: '#F3E5AB',
          bg: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 24px -2px rgba(15, 23, 42, 0.06)',
        'hover': '0 12px 32px -4px rgba(15, 23, 42, 0.12)',
        'gold': '0 4px 20px -2px rgba(212, 175, 55, 0.25)',
      }
    },
  },
  plugins: [],
}
