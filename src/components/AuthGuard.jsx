import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const AuthGuard = () => {
  const { isLoaded, isSignedIn } = useAuth();

  // Em vez de null (tela branca), entregamos um feedback visual
  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-blue-400 font-medium animate-pulse">Autenticando mestre...</p>
      </div>
    );
  }

  // Se estiver logado, mestre segue para o sistema. Se não, volta ao login.
  if (!isSignedIn) {
    console.warn("Usuário não autenticado. Redirecionando para login...");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AuthGuard;