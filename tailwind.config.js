/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 🎯 기사 대시보드가 있는 경로를 스캔하도록 명시
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
