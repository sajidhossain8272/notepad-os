/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="terminal-green"]'],
  theme: {
    extend: {
      colors: {
        win95: {
          bg: '#c0c0c0',
          header: '#000080',
          headerText: '#ffffff',
          darkBorder: '#808080',
          lightBorder: '#ffffff',
          activeBlue: '#000080',
          selectionBg: '#000080',
          selectionText: '#ffffff',
        },
        winxp: {
          bg: '#ece9d8',
          header: '#0058e6',
          headerText: '#ffffff',
          darkBorder: '#7f9db9',
          lightBorder: '#ffffff',
          accent: '#316ac5',
        },
        terminal: {
          bg: '#0a0e0a',
          card: '#121812',
          text: '#00ff66',
          header: '#003311',
          dim: '#008833',
          border: '#00ff66',
        },
        minimal: {
          bg: '#f8f9fa',
          card: '#ffffff',
          text: '#212529',
          header: '#e9ecef',
          border: '#ced4da',
          accent: '#495057',
        },
      },
      fontFamily: {
        win95: ['"MS Sans Serif"', 'Tahoma', 'Geneva', 'sans-serif'],
        monospace: ['"Courier New"', 'Consolas', 'Monaco', 'monospace'],
        terminal: ['"VT323"', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        'win95-outset': 'inset 1px 1px #fff, inset -1px -1px #808080, inset 2px 2px #dfdfdf, inset -2px -2px #000',
        'win95-inset': 'inset 1px 1px #808080, inset -1px -1px #fff, inset 2px 2px #000, inset -2px -2px #dfdfdf',
        'winxp-card': '0 2px 4px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};
