import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initPWA } from './utils';

// Инициализация PWA только в production
if (import.meta.env.PROD) {
  try {
    initPWA();
  } catch (error) {
    console.error('Ошибка инициализации PWA:', error);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

