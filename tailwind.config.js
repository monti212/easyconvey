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
    },
  },
  plugins: [],
};