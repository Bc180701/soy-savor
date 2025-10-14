
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Vérification pour déboguer l'erreur React.useState null
console.log('React version:', React.version);
console.log('React is available:', Boolean(React));
console.log('useState is available:', Boolean(React.useState));

// Enregistrement du Service Worker au chargement (CRITIQUE pour iOS push notifications)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      console.log('[SW] Service Worker registered:', reg);
      console.log('[SW] Scope:', reg.scope);
      console.log('[SW] Active state:', reg.active?.state);
    })
    .catch(err => {
      console.error('[SW] Registration error:', err);
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
