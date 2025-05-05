/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8ec',
          100: '#faefcf',
          200: '#f5dd9f',
          300: '#f0cb6f',
          400: '#eaba3f',
          500: '#d4af37', // base gold
          600: '#b3942e',
          700: '#927225',
          800: '#71551c',
          900: '#503914',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b', // your base color
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}