import React, { createContext, useContext, useState, useCallback } from 'react';
// Remove toast import to avoid dependency issues - use console for now

const PWAContext = createContext();

export function PWAProvider({ children }) {
  const [installPrompt, setInstallPrompt] = useState(null);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return;

    try {
      // Show the install prompt
      await installPrompt.prompt();
      
      // Log user choice
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA successfully installed');
        setInstallPrompt(null); // Clear after successful install
      } else {
        console.log('User cancelled installation');
      }
    } catch (error) {
      console.error('Install prompt error:', error);
    }
  }, [installPrompt]);

  return (
    <PWAContext.Provider value={{ installPrompt, promptInstall, setInstallPrompt }}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within PWAProvider');
  }
  return context;
}

