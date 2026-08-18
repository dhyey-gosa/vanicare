export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '1rem',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04)',
        lift: '0 8px 24px -12px rgba(15, 23, 42, 0.18)',
      },
    },
  },
}
