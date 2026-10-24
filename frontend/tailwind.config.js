/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5266eb',
          hover: '#4354d0',
          tint: 'rgba(82, 102, 235, 0.1)',
        },
        night: {
          DEFAULT: '#171721', // Base background (ink-violet night)
          raised: '#1e1e2a',  // Cards, panels, bubbles
          card: '#252535',    // Highlighted surface
        },
        ink: {
          DEFAULT: '#28253b',
          secondary: '#554e7b',
        },
        'on-dark': '#ededf3', // Primary text on night surfaces
        fog: '#c3c3cc',       // Secondary muted text
        slate: '#70707d',     // Subtle borders and dividers
        periwinkle: '#9cb4e8',
        lavender: '#edecfb',
      },
      borderRadius: {
        'pill': '40px',
        'xl': '32px',
        'md': '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
