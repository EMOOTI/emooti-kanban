/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#6D28D9',
        'primary-hover': '#5B21B6',
        'secondary': '#1F2937',
        'light-bg': '#F9FAFB',
        'dark-bg': '#111827',
        'light-card': '#FFFFFF',
        'dark-card': '#1F2937',
        'light-border': '#E5E7EB',
        'dark-border': '#374151',
        'light-text': '#111827',
        'dark-text': '#F9FAFB',
        'light-text-secondary': '#6B7280',
        'dark-text-secondary': '#9CA3AF',
      }
    }
  },
  plugins: [],
}
