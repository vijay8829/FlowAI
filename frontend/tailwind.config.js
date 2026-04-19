/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#07080f',
        surface:  '#0b0c18',
        panel:    '#0f1121',
        card:     '#12141f',
        'card-2': '#161928',
        border:   'rgba(255,255,255,0.07)',
        accent:   '#6366f1',
        'accent-2': '#818cf8',
        trigger:  '#34d399',
        ai:       '#a78bfa',
        action:   '#fbbf24',
        muted:    '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-xs':  '0 0 10px rgba(99,102,241,0.15)',
        'glow-sm':  '0 0 20px rgba(99,102,241,0.2)',
        'glow':     '0 0 32px rgba(99,102,241,0.25)',
        'glow-lg':  '0 0 60px rgba(99,102,241,0.3)',
        'card':     '0 4px 24px rgba(0,0,0,0.5)',
        'node':     '0 4px 20px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grid-dots': 'radial-gradient(circle, #1e2236 1px, transparent 1px)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
