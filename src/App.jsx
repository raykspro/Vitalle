// Vitalle v1.1 - Clerk Auth Integration
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Finance from './pages/Finance';
import { ClerkProvider } from '@clerk/clerk-react';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Sales from './pages/Sales';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import StockHistory from './pages/StockHistory';
import Settings from './pages/Settings';
import ErrorBoundary from './components/ErrorBoundary';

import { useEffect, useState } from 'react';
import { obterTotalContasAPagar } from './api/finance';

const AuthenticatedApp = () => {
const { isLoadingAuth, isAuthenticated, user } = useAuth(); // Clerk substitui autenticação
const userRole = user?.publicMetadata?.role;
const [totalContasAPagar, setTotalContasAPagar] = useState(0);

useEffect(() => {
  async function fetchTotal() {
    const total = await obterTotalContasAPagar();
    setTotalContasAPagar(total);
  }
  fetchTotal();
}, []);

  // Tela de carregamento enquanto o Supabase verifica a sessão
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* CORREÇÃO: Rota Raiz que decide para onde enviar o Senhor mestre logo de cara */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

      {/* Rota de Login: Só acessível se NÃO estiver autenticado */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />

      {/* Rota do Dashboard: Só acessível se ESTIVER autenticado */}
<Route path="/dashboard" element={isAuthenticated && userRole === 'admin' ? <Dashboard totalContasAPagar={totalContasAPagar} /> : <Navigate to="/login" replace />} /> {/* Clerk */}
      
      {/* CORREÇÃO: Outras rotas internas protegidas (Exemplo se o Senhor quiser adicionar mais caminhos diretos) */}
<Route path="/produtos" element={isAuthenticated && userRole === 'admin' ? <Products totalContasAPagar={totalContasAPagar} /> : <Navigate to="/login" replace />} /> {/* Clerk */}

      {/* Se o caminho não existir, cai aqui */}
<Route path="/finance" element={isAuthenticated && userRole === 'admin' ? <Finance /> : <Navigate to="/login" replace />} />
<Route path="/dashboard" element={isAuthenticated ? <Dashboard userRole={userRole} /> : <Navigate to="/login" replace />} />
<Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const clerkPubKey = "pk_test_ZW5oYW5jZWQtc25ha2UtNDguY2xlcmsuYWNjb3VudHMuZGV2JA";

function App() {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={clerkPubKey}>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;