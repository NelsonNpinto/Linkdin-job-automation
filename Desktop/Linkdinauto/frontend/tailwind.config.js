/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#000000',
          surface: '#1c1c1e',
          elevated: '#2c2c2e',
          border: '#38383a',
          blue: '#0a84ff',
          green: '#30d158',
          red: '#ff453a',
          orange: '#ff9f0a',
          yellow: '#ffd60a',
          gray: {
            100: '#f5f5f7',
            200: '#e8e8ed',
            300: '#d2d2d7',
            400: '#aeaeb2',
            500: '#8e8e93',
            600: '#636366',
            700: '#48484a',
            800: '#3a3a3c',
            900: '#2c2c2e',
          },
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'apple': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
      },
      boxShadow: {
        'apple': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'apple-lg': '0 8px 32px rgba(0, 0, 0, 0.16)',
        'apple-xl': '0 16px 48px rgba(0, 0, 0, 0.24)',
      },
      backdropBlur: {
        'apple': '20px',
      },
    },
  },
  plugins: [],
};
