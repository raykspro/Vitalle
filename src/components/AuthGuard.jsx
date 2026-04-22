import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import LoadingScreen from './LoadingScreen'; // Importando a nova Splash Screen

const AuthGuard = () => {
  const { isLoaded, isSignedIn } = useAuth();

  // MESTRE: Enquanto o Clerk carrega, exibimos a nova identidade visual da Vitalle
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  // Se estiver logado, mestre segue para o sistema. Se não, volta ao login.
  if (!isSignedIn) {
    console.warn("Acesso negado. Redirecionando mestre para o login...");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AuthGuard;