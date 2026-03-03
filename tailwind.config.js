/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0a0f',
          panel: '#12121a',
          border: '#1e1e2e',
          neon: {
            cyan: '#00f5ff',
            magenta: '#ff00aa',
            green: '#39ff14',
            blue: '#0066ff',
          },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 20px #00f5ff, 0 0 40px #00f5ff40',
        'neon-magenta': '0 0 20px #ff00aa, 0 0 40px #ff00aa40',
        'neon-green': '0 0 20px #39ff14, 0 0 40px #39ff1440',
        'glow-cyan': '0 0 60px #00f5ff30',
        'glow-magenta': '0 0 60px #ff00aa30',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
