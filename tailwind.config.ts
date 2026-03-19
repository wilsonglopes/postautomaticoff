import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f0',
          100: '#fae5db',
          200: '#f5c8b4',
          300: '#eda485',
          400: '#e47653',
          500: '#d95530',
          600: '#c94025',
          700: '#a73120',
          800: '#882821',
          900: '#702420',
          950: '#3c100d',
        },
        feltro: {
          rosa: '#e88fa5',
          verde: '#7bbf7e',
          azul: '#7aaed4',
          amarelo: '#f5c842',
          laranja: '#e8844f',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
