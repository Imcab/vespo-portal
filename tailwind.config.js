/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#02010a',
          secondary: '#57524c',
          tertiary: '#8a8478',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f6f4ef',
          subtle: '#fbfaf7',
        },
        line: {
          DEFAULT: '#e2ddd3',
          soft: '#eeeae1',
        },
        brand: {
          50: '#fffbea',
          100: '#fff3c4',
          200: '#ffe58a',
          300: '#ffe066',
          400: '#ffdb4d',
          500: '#ffd700',
          600: '#e6c200',
          700: '#bfa100',
          800: '#997f00',
          900: '#735f00',
        },
        brown: {
          50: '#f7efe6',
          100: '#eaddc9',
          200: '#d3ba97',
          300: '#b8926a',
          400: '#98703f',
          500: '#6c450e',
          600: '#5a3a0c',
          700: '#472e0a',
          800: '#362307',
          900: '#241705',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '20px',
        control: '14px',
      },
      boxShadow: {
        'soft-xs': '0 1px 2px rgba(0,0,0,0.04)',
        'soft-sm': '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        soft: '0 8px 24px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.04)',
        'soft-lg': '0 20px 50px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
        'soft-xl': '0 30px 70px rgba(0,0,0,0.10), 0 8px 20px rgba(0,0,0,0.05)',
      },
      transitionTimingFunction: {
        emil: 'cubic-bezier(0.32, 0.72, 0, 1)',
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        350: '350ms',
        450: '450ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        'fade-in-up': {
          from: { opacity: 0, transform: 'translateY(18px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.97)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '150% 0' },
          to: { backgroundPosition: '-50% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in-up': 'fade-in-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.45s cubic-bezier(0.32, 0.72, 0, 1) both',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
