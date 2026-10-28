/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        table: '#08140e',
        felt: {
          950: '#060f0a',
          900: '#0b1a13',
          850: '#0e2219',
          800: '#132c20',
          700: '#1b3d2c',
          600: '#25533c'
        },
        brass: {
          300: '#edd8a6',
          400: '#dfba73',
          500: '#c5a059',
          600: '#a37f37',
          700: '#785b20'
        },
        chip: {
          blue: '#1d4ed8',
          red: '#b91c1c',
          black: '#18181b',
          green: '#15803d',
          white: '#f8fafc'
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'felt-inset': 'inset 0 2px 10px rgba(0, 0, 0, 0.4)',
        'chip-drop': '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
      }
    }
  },
  plugins: []
};
