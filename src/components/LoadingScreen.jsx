import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-white p-8">
      {/* Logo with pulse animation */}
      <img 
        src="/logo-vitalle.png" 
        alt="Vitalle" 
        className="h-24 w-32 md:h-32 md:w-auto mb-8 animate-pulse opacity-0 animate-in fade-in-50 duration-1000"
      />
      
      {/* VITALLE Text - Boutique Luxury style matching Layout.jsx */}
      <h1 className="text-4xl md:text-6xl font-black text-black italic tracking-tighter uppercase leading-none">
        VITALLE
      </h1>
      
      {/* Subtitle */}
      <p className="text-sm md:text-base text-black/50 font-bold uppercase tracking-widest mt-4 animate-in fade-in-70 duration-1000">
        Carregando sistema...
      </p>
    </div>
  );
};

export default LoadingScreen;

