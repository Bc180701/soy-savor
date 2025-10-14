
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Vérification pour déboguer l'erreur React.useState null
console.log('React version:', React.version);
console.log('React is available:', Boolean(React));
console.log('useState is available:', Boolean(React.useState));

// 🔧 Enregistrement du Service Worker au chargement (CRITIQUE pour iOS push notifications)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      console.log('✅ Service Worker enregistré:', reg);
      console.log('📱 Service Worker scope:', reg.scope);
      console.log('📱 Service Worker active:', reg.active?.state);
    })
    .catch(err => {
      console.error('❌ Erreur d'enregistrement du Service Worker:', err);
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
