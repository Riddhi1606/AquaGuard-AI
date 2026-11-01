/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070b14',
          900: '#0b1329',
          850: '#0f172a',
          800: '#152238',
          700: '#1e293b',
          600: '#334155',
        },
        flood: {
          low: '#22c55e',      // Green (0-30)
          moderate: '#eab308', // Yellow (30-60)
          high: '#f97316',     // Orange (60-80)
          critical: '#ef4444', // Red (80-100)
          extreme: '#991b1b',  // Dark Red (>100 / submerged)
        },
        cyan: {
          accent: '#06b6d4',
          glow: '#22d3ee',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
