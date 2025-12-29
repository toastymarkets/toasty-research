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
        // Apple SF Pro inspired system font stack
        'system': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'rounded': ['SF Pro Rounded', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'mono': ['SF Mono', 'Menlo', 'Monaco', 'monospace'],
        // Legacy fonts (for gradual migration)
        'heading': ['"Ubuntu"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'body': ['"Open Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'numeric': ['"Open Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Apple accent colors
        'apple': {
          'blue': '#007AFF',
          'green': '#30D158',
          'yellow': '#FFD60A',
          'orange': '#FF9F0A',
          'red': '#FF453A',
          'purple': '#BF5AF2',
          'pink': '#FF375F',
          'teal': '#64D2FF',
        },
        // Glass surface colors
        'glass': {
          'white': 'rgba(255, 255, 255, 0.18)',
          'white-hover': 'rgba(255, 255, 255, 0.25)',
          'white-active': 'rgba(255, 255, 255, 0.3)',
          'border': 'rgba(255, 255, 255, 0.25)',
          'border-subtle': 'rgba(255, 255, 255, 0.15)',
        },
        // Glass text colors
        'glass-text': {
          'primary': '#FFFFFF',
          'secondary': 'rgba(255, 255, 255, 0.75)',
          'muted': 'rgba(255, 255, 255, 0.55)',
          'label': 'rgba(255, 255, 255, 0.6)',
        },
        // Legacy colors (for gradual migration)
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
      fontSize: {
        // Apple Weather typography scale
        'hero': ['96px', { lineHeight: '1', fontWeight: '200' }],
        'location': ['34px', { lineHeight: '1.2', fontWeight: '600' }],
        'condition': ['20px', { lineHeight: '1.3', fontWeight: '500' }],
        'widget-title': ['11px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '0.5px' }],
        'body-lg': ['17px', { lineHeight: '1.4', fontWeight: '400' }],
        'body': ['15px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        // Widget sizes
        'widget-sm': '164px',
        'widget-md': '344px',
        'widget-lg': '344px',
        'widget-gap': '12px',
      },
      borderRadius: {
        'glass-sm': '10px',
        'glass-md': '16px',
        'glass-lg': '22px',
        'glass-xl': '28px',
      },
      backdropBlur: {
        'glass': '20px',
        'glass-heavy': '40px',
        'glass-light': '12px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glass-elevated': '0 12px 48px rgba(0, 0, 0, 0.2)',
        'glass-subtle': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'glass-inner': 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
      },
      animation: {
        'fade-in': 'fadeIn 250ms ease-out',
        'scale-in': 'scaleIn 250ms ease-out',
        'slide-up': 'slideUp 400ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
