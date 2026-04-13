import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const AuthGuard = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <p>Vitalle: Carregando segurança...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user?.publicMetadata?.role || 'vendedor';

  console.log('[Vitalle] Sessão carregada com sucesso');

  return React.cloneElement(children, { userRole });
};

export default AuthGuard;