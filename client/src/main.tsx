import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service worker mínimo: permite instalar la web como app (icono del logo
// en la pantalla de inicio) sin cachear, así los despliegues se ven al día.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sin service worker la web sigue funcionando; solo pierde la instalación.
    });
  });
}
