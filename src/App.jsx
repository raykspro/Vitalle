import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Sales from './pages/Sales';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import StockHistory from './pages/StockHistory';
import Settings from './pages/Settings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      console.error("Erro de autenticação: Redirecionando para login.");
      navigateToLogin();
      return (
        <div className="fixed inset-0 flex items-center justify-center">
          <p>Redirecionando para login...</p>
        </div>
      );
    }
  }

  // Render the main app or redirect to login
  if (!isAuthenticated) {
    return <Auth>
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <h1 className="text-4xl font-bold mb-6">Bem-vindo</h1>
        <div className="bg-white text-black p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Login</h2>
          <input type="text" placeholder="Usuário" className="border p-2 mb-4 w-64 rounded" />
          <input type="password" placeholder="Senha" className="border p-2 mb-4 w-64 rounded" />
          <button className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded transition">Entrar</button>
        </div>
      </div>
    </Auth>;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/produtos" element={<Products />} />
        <Route path="/estoque" element={<Stock />} />
        <Route path="/clientes" element={<Customers />} />
        <Route path="/fornecedores" element={<Suppliers />} />
        <Route path="/vendas" element={<Sales />} />
        <Route path="/notas-fiscais" element={<Invoices />} />
        <Route path="/pagamentos" element={<Payments />} />
        <Route path="/historico" element={<StockHistory />} />
        <Route path="/configuracoes" element={<Settings />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


import ErrorBoundary from './components/ErrorBoundary';

function App() {

  return (
<ErrorBoundary>
  <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
  </AuthProvider>
</ErrorBoundary>
  )
}

export default App