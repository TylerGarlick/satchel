import type { Config } from 'tailwindcss'
import { skeleton } from '@skeletonlabs/tw-plugin'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@skeletonlabs/skeleton/**/*.{html,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    skeleton({
      themes: { preset: ['skeleton'] },
    }),
  ],
}

export default config
