/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5a413f',
          50: '#f9f5f4',
          100: '#f0e8e7',
          200: '#e2d4d2',
          300: '#ccb4b1',
          400: '#b08d89',
          500: '#5a413f',
          600: '#4e3735',
          700: '#43302e',
          800: '#3a2927',
          900: '#342523',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E2C97E',
          dark: '#9C7E2A',
        },
        'rose-gold': {
          DEFAULT: '#B76E79',
          light: '#D4A0A8',
          dark: '#8F4F58',
        },
        silver: {
          DEFAULT: '#C0C0C0',
          light: '#E8E8E8',
          dark: '#909090',
        },
        luxury: {
          cream: '#FAF7F2',
          beige: '#F5EDE4',
          blush: '#F2E4E1',
          pearl: '#F8F8F0',
          champagne: '#F7E7CE',
        },
      },
      fontFamily: {
        heading: ['"Futura Std"', '"Futura"', '"Jost"', '"Century Gothic"', '"Trebuchet MS"', 'Arial', 'sans-serif'],
        body: ['"Futura Std"', '"Futura"', '"Jost"', '"Century Gothic"', '"Trebuchet MS"', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.65rem',
        'xs':  ['0.8rem',  { lineHeight: '1.4' }],
        'sm':  ['0.9rem',  { lineHeight: '1.5' }],
        'base':['1rem',    { lineHeight: '1.6' }],
        'lg':  ['1.075rem',{ lineHeight: '1.5' }],
        'xl':  ['1.2rem',  { lineHeight: '1.4' }],
        '2xl': ['1.45rem', { lineHeight: '1.35' }],
        '3xl': ['1.75rem', { lineHeight: '1.25' }],
        '4xl': ['2.1rem',  { lineHeight: '1.2' }],
        '5xl': ['2.6rem',  { lineHeight: '1.15' }],
      },
      maxWidth: {
        container: '1400px',
      },
      borderRadius: {
        DEFAULT: '14px',
        luxury: '14px',
        glass: '20px',
        card: '24px',
        pill: '999px',
      },
      boxShadow: {
        luxury: '0 4px 20px rgba(90, 65, 63, 0.08)',
        'luxury-md': '0 8px 30px rgba(90, 65, 63, 0.12)',
        'luxury-lg': '0 16px 60px rgba(90, 65, 63, 0.15)',
        card: '0 4px 24px rgba(90,65,63,0.07), inset 0 1px 0 rgba(255,255,255,0.80)',
        'card-hover': '0 12px 40px rgba(90,65,63,0.12), inset 0 1px 0 rgba(255,255,255,0.90)',
        gold: '0 4px 20px rgba(201, 168, 76, 0.25)',
        glass: '0 8px 32px rgba(90,65,63,0.09), inset 0 1px 0 rgba(255,255,255,0.75)',
        'glass-lg': '0 16px 48px rgba(90,65,63,0.13), inset 0 1px 0 rgba(255,255,255,0.85)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        'spin-slow': 'spin 8s linear infinite',
        marquee: 'marquee 25s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(20px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { from: { transform: 'translateY(-10px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        shimmer: {
          '0%':   { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      letterSpacing: {
        widest2: '0.3em',
      },
    },
  },
  plugins: [],
};
