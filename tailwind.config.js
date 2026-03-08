/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B1F3A',  // Deep Navy Blue
          light: '#1A2E49',    // Lighter shade for hover states
          dark: '#061628',     // Darker shade for pressed states
        },
        secondary: {
          DEFAULT: '#C8A14F',  // Gold Accent
          light: '#D5B36C',    // Lighter shade
          dark: '#B89142',     // Darker shade
        },
        background: '#F5F6F7',  // Light Grey
        border: '#D1D5DB',      // Soft Silver Grey
        error: '#B00020',       // Deep Red
        success: '#2ECC71',     // Emerald Green
      },
      borderRadius: {
        'lg': '12px',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        soft: '0px 4px 8px rgba(0, 0, 0, 0.05)',
        'soft-md': '0px 6px 12px rgba(0, 0, 0, 0.08)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        drawLine: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in-left': 'fadeInLeft 0.8s ease-out forwards',
        'fade-in-right': 'fadeInRight 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'draw-line': 'drawLine 1.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};