/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FCFAF4',
          100: '#FAF6ED',
          DEFAULT: '#F7F1DE', // User palette: #F7F1DE
          200: '#EFE6CA',
          300: '#E5D6B0',
        },
        sage: {
          100: '#E5E8DD',
          200: '#CBD1BE',
          DEFAULT: '#B0BA99', // User palette: #B0BA99
          600: '#8A9670',
          700: '#697452',
        },
        caramel: {
          100: '#F4E8DC',
          200: '#E5CBB4',
          DEFAULT: '#9D6638', // User palette: #9D6638
          600: '#84532B',
          700: '#68401F',
        },
        espresso: {
          DEFAULT: '#4E220F', // User palette: #4E220F
          light: '#6B3118',
          dark: '#351608',
        },
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      boxShadow: {
        'tactile-sm': '0 2px 0 #4E220F',
        'tactile': '0 4px 0 #4E220F',
        'tactile-lg': '0 6px 0 #4E220F',
        'tactile-pressed': '0 1px 0 #4E220F',
      }
    },
  },
  plugins: [],
}


