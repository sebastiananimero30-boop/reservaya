/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0,0,0,0.3)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'fade-up': 'fadeUp 0.5s ease forwards',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        skeleton: {
          '0%, 100%': { opacity: 1 },
          '50%':       { opacity: 0.4 },
        }
      }
    }
  },
  plugins: []
}
