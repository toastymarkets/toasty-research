/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'heading': ['"Space Grotesk"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'body': ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'numeric': ['"Inter"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        'research': {
          'bg': 'var(--color-bg)',
          'card': 'var(--color-card-bg)',
          'elevated': 'var(--color-card-elevated)',
          'border': 'var(--color-border)',
          'border-strong': 'var(--color-border-strong)',
        },
        'research-text': {
          'primary': 'var(--color-text-primary)',
          'secondary': 'var(--color-text-secondary)',
          'muted': 'var(--color-text-muted)',
        },
        'research-orange': {
          'main': 'var(--color-orange-main)',
          'hover': 'var(--color-orange-hover)',
          'light': 'var(--color-orange-light)',
        },
        'dark': {
          'base': '#000000',
          'bg': '#0A0A0A',
          'card': '#121212',
          'elevated': '#1A1A1A',
          'hover': '#1F1F1F',
          'border': '#262626',
          'border-strong': '#404040',
        },
        'dark-text': {
          'primary': '#FFFFFF',
          'secondary': '#A3A3A3',
          'muted': '#737373',
        },
      },
    },
  },
  plugins: [],
}
