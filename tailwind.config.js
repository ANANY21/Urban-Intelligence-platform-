/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          bg: '#080D16',
          surface: '#101827',
          card: '#141F30',
          elevated: '#1A273D',
          border: 'rgba(56, 189, 248, 0.12)',
          borderSubtle: 'rgba(148, 163, 184, 0.12)',
        },
        cyan: {
          accent: '#35D9F5',
          glow: 'rgba(53, 217, 245, 0.25)',
        },
        flood: {
          critical: '#EF4444',
          warning: '#F87171',
          moderate: '#FB923C',
          safe: '#14B8A6',
        },
        rainfall: {
          blue: '#3B82F6',
          light: '#60A5FA',
          deep: '#1D4ED8',
        },
        traffic: {
          free: '#10B981',
          moderate: '#F59E0B',
          heavy: '#F97316',
          severe: '#EF4444',
        },
        status: {
          teal: '#14B8A6',
          amber: '#F59E0B',
          red: '#EF4444',
          blue: '#38BDF8',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px -3px rgba(53, 217, 245, 0.25)',
        'cyan-sm': '0 0 10px -2px rgba(53, 217, 245, 0.3)',
        'red-glow': '0 0 20px -3px rgba(239, 68, 68, 0.25)',
        'hud': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'hud-grid': 'radial-gradient(rgba(53, 217, 245, 0.07) 1px, transparent 1px)',
        'command-gradient': 'linear-gradient(180deg, #101827 0%, #080D16 100%)',
      }
    },
  },
  plugins: [],
}
