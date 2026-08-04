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
