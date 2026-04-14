import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

import { clerk } from '@clerk/clerk-react';

console.log('SISTEMA INICIADO');

clerk.signOut();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
