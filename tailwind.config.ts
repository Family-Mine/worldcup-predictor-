import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'fifa-gold': '#D4AF37',
        'fifa-green': '#16A34A',
        'surface': '#0F1117',
        'surface-card': '#1A1D27',
        'surface-border': '#2A2D3A',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
