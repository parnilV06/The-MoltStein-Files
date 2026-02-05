import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#e5e7eb',
        muted: '#9ca3af',
        panel: '#0f1115',
        line: '#262a31',
        warning: '#d2b86a'
      }
    }
  },
  plugins: []
}

export default config