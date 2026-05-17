import type { Config } from 'tailwindcss'
import { colors, spacing } from '@athletiqlab/ui'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: colors.brand,
        neutral: colors.neutral,
      },
      spacing: spacing,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
