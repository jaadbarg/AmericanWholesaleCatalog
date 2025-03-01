import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      container: {
        center: true,
        padding: "1rem",
      },
      colors: {
        'american-red': {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        'american-navy': {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
        },
        'brown': {
          400: '#A47551',
          500: '#8B5E3C'
        }
      },
      animation: {
        "forklift-move": "forklift 15s infinite ease-in-out",
      },
      keyframes: {
        forklift: {
          "0%": { transform: "translateX(10%)" },
          "45%": { transform: "translateX(calc(80vw - 100px))" },
          "50%": { transform: "translateX(calc(80vw - 100px)) rotateY(180deg)" },
          "95%": { transform: "translateX(10%) rotateY(180deg)" },
          "100%": { transform: "translateX(10%) rotateY(0deg)" },
        },
      },
      margin: {
        '38': '9.5rem',
        '25': '6.25rem',
        '18': '4.5rem',
        '15': '3.75rem',
      },
      width: {
        '18': '4.5rem',
        '30': '7.5rem',
      },
      left: {
        '68': '17rem',
        '35': '8.75rem',
        '15': '3.75rem',
      },
    },
  },
  plugins: [],
};
export default config;