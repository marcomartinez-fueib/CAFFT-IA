/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // "* Variable" families come from the self-hosted @fontsource-variable
        // packages imported in index.tsx. The non-variable name is kept as a
        // fallback so the app still renders if a font file fails to load.
        sans: ['Montserrat Variable', 'Montserrat', 'sans-serif'],
        display: ['Space Grotesk Variable', 'Space Grotesk', 'sans-serif'],
        body: ['Inter Variable', 'Inter', 'sans-serif'],
      },
      colors: {
        // WCAG 2.2 AA (fita 6.1): Tailwind's lighter shades, used here for
        // small grey and coloured text, fall below 4.5:1 on white and on the
        // app's light backgrounds. Each is darkened just enough to pass, and
        // the shade above it with it, so hover states still differ.
        slate: { 400: '#5f6c80', 500: '#56637a' },
        gray: { 400: '#5f6c80', 500: '#56637a' },
        sky: { 600: '#0369a1', 700: '#075985' },
        green: { 600: '#15803d', 700: '#166534' },
        emerald: { 600: '#047857', 700: '#065f46' },
        uib: {
          blue: '#00263E', // Pantone 282 (Blau Institucional)
          accent: '#0072CE', // Pantone 2935 (Blau Vibrant)
          red: '#BA0C2F', // PMS 186
          black: '#111111',
          warmGray: '#A7A596', // PMS 402
          lightGray: '#F2F2F2',
          darkGray: '#333333',
        },
      },
    },
  },
  plugins: [],
};
