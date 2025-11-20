/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  // Use class-based dark mode so Tailwind does not emit
  // `@media (prefers-color-scheme: dark)` rules that apply
  // automatically based on OS preferences.
  darkMode: 'class',
  plugins: [],
};
