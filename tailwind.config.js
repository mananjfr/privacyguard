/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        pg: {
          bg:       '#09090b',
          surface:  '#111113',
          card:     '#18181b',
          border:   '#27272a',
          muted:    '#52525b',
          text:     '#fafafa',
          sub:      '#a1a1aa',
          cyan:     '#06b6d4',
          'cyan-dim':'#0e7490',
          violet:   '#8b5cf6',
          'violet-dim':'#6d28d9',
          danger:   '#ef4444',
          warn:     '#f59e0b',
          safe:     '#22c55e',
        },
      },
      fontFamily: {
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        display: ['"Orbitron"', '"Exo 2"', 'sans-serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan':   '0 0 16px rgba(6,182,212,0.45), 0 0 40px rgba(6,182,212,0.15)',
        'glow-violet': '0 0 16px rgba(139,92,246,0.45), 0 0 40px rgba(139,92,246,0.15)',
        'glow-danger': '0 0 16px rgba(239,68,68,0.45), 0 0 40px rgba(239,68,68,0.15)',
        'glow-safe':   '0 0 16px rgba(34,197,94,0.45), 0 0 40px rgba(34,197,94,0.15)',
        'glow-warn':   '0 0 16px rgba(245,158,11,0.45), 0 0 40px rgba(245,158,11,0.15)',
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan':       'scan 3s linear infinite',
        'flicker':    'flicker 4s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%,100%': { opacity: '0.8' },
          '50%':     { opacity: '1' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%,95%,100%': { opacity: '1' },
          '96%': { opacity: '0.6' },
          '97%': { opacity: '1' },
          '98%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'grid-lines': `linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
                       linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '40px 40px',
      }
    },
  },
  plugins: [],
}
