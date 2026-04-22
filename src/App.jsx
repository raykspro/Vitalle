import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import FinanceCashFlow from './pages/FinanceCashFlow';
import FinancePayables from './pages/FinancePayables';
import FinanceReceivables from './pages/FinanceReceivables';
import FinanceCommissions from './pages/FinanceCommissions';
import Products from './pages/Products';
import Stock from './pages/Stock';
import PurchaseOrder from './pages/PurchaseOrder'; 
import Login from './pages/Login';
import MobileSales from './pages/MobileSales'; 
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Configuracoes from './pages/Configuracoes';
import { PWAProvider, usePWA } from './lib/PWAContext';
// IMPORTANTE: Importar o SidebarProvider
import { SidebarProvider } from "./components/Sidebar";

const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-magenta-500 mb-4"></div>
    <p className="text-magenta-400 font-medium animate-pulse uppercase tracking-widest text-xs">Iniciando Vitalle...</p>
  </div>
);

function AppContent() {
  const pwaContext = usePWA();
  const setInstallPrompt = pwaContext?.setInstallPrompt;

  useEffect(() => {
    if (!setInstallPrompt) return;
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [setInstallPrompt]);

  return (
    <Suspense fallback={<PageLoader />}>
      {/* O SidebarProvider deve abraçar as rotas para o menu funcionar */}
      <SidebarProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/vendas" replace />} />

          <Route element={<AuthGuard />}>
            <Route element={<Layout />}>
              <Route path="/vendas" element={<MobileSales />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/suppliers" element={<Suppliers />} />
              
              <Route path="/finance" element={<Navigate to="/finance/cashflow" replace />} />
              <Route path="/finance/cashflow" element={<FinanceCashFlow />} />
              <Route path="/finance/payables" element={<FinancePayables />} />
              <Route path="/finance/receivables" element={<FinanceReceivables />} />
              <Route path="/finance/commissions" element={<FinanceCommissions />} />
              
              <Route path="/purchase-orders" element={<PurchaseOrder />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/vendas" replace />} />
        </Routes>
      </SidebarProvider>
    </Suspense>
  );
}

function App() {
  return (
    <PWAProvider>
      <AppContent />
    </PWAProvider>
  );
}

export default App;
