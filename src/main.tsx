
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupStorage } from './utils/setupStorage.ts'

// Setup storage buckets and database if needed
setupStorage()
  .then(() => console.log('Storage setup completed'))
  .catch(err => console.error('Error in storage setup:', err));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
