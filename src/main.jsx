import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Mestre, a chave VITE_CLERK_PUBLISHABLE_KEY não foi encontrada no .env");
}

// Registro do Service Worker para o PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Vitalle PWA On: ', registration);
    }).catch(err => {
      console.log('Falha no PWA: ', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* O BrowserRouter deve ficar no nível mais alto, APENAS AQUI */}
    <BrowserRouter>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        signInForceRedirectUrl="/vendas"
        signUpForceRedirectUrl="/vendas"
        afterSignOutUrl="/login"
      >
        <Toaster position="top-center" richColors closeButton />
        <App />
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);