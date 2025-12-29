/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      colors: {
        strava: {
          // Using rgb format so opacity modifiers work
          orange: 'rgb(252, 76, 2)',
          'orange-dark': 'rgb(227, 68, 2)',
        },
        surface: {
          primary: '#0a0a0a',
          secondary: '#111111',
          tertiary: '#1a1a1a',
          elevated: '#222222',
        },
      },
      boxShadow: {
        'glow-orange': '0 0 40px -10px rgba(252, 76, 2, 0.4)',
        'glow-orange-sm': '0 0 20px -5px rgba(252, 76, 2, 0.4)',
      },
    },
  },
  plugins: [],
};
