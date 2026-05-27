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
  theme: {
    extend: {
      colors: {
        // 원하는 커스텀 이름으로 지정
        sentiment: {
          negative: '#0022FE',
          positive: '#EF0000',
        }
      },
    },
  },
}
