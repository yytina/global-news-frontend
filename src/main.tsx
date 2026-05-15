// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // 확장자 .tsx를 붙이지 마세요.
import './index.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}