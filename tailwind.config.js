/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tv: {
          bg: '#131722',
          bg2: '#1e222d',
          bg3: '#2B2B43',
          border: '#2B2B43',
          text: '#d1d4dc',
          textMuted: '#787b86',
          green: '#26a69a',
          red: '#ef5350',
          blue: '#2962ff',
          orange: '#ff9800',
          purple: '#9c27b0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
