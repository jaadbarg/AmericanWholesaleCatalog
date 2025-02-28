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
      animation: {
        "forklift-move": "forklift 15s infinite ease-in-out",
      },
      keyframes: {
        forklift: {
          "0%": { transform: "translateX(0%)" },
          "45%": { transform: "translateX(calc(100vw - 100px))" },
          "50%": { transform: "translateX(calc(100vw - 100px)) rotateY(180deg)" },
          "95%": { transform: "translateX(0%) rotateY(180deg)" },
          "100%": { transform: "translateX(0%) rotateY(0deg)" },
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