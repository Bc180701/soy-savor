
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Vérification pour déboguer l'erreur React.useState null
console.log('React version:', React.version);
console.log('React is available:', Boolean(React));
console.log('useState is available:', Boolean(React.useState));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
