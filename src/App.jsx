import React, { useEffect } from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
// Import removido: Finance (Arquivo deletado)
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

function AppContent() {
  const { setInstallPrompt } = usePWA();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [setInstallPrompt]);

  return (
    <Routes>
      {/* Rota Pública */}
      <Route path="/login" element={<Login />} />
      
      {/* Redirecionamento Inicial: Direto para o PDV de Elite */}
      <Route path="/" element={<Navigate to="/vendas" replace />} />

      {/* Rotas Protegidas */}
      <Route element={<AuthGuard />}>
        {/* O Layout envolve todas as rotas internas */}
        <Route element={<Layout />}>
          <Route path="/vendas" element={<MobileSales />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          
          {/* Redirecionamento da rota pai de finanças para o Fluxo de Caixa */}
          <Route path="/finance" element={<Navigate to="/finance/cashflow" replace />} />
          
          {/* Sub-rotas Financeiras (Oficiais) */}
          <Route path="/finance/cashflow" element={<FinanceCashFlow />} />
          <Route path="/finance/payables" element={<FinancePayables />} />
          <Route path="/finance/receivables" element={<FinanceReceivables />} />
          <Route path="/finance/commissions" element={<FinanceCommissions />} />
          
          {/* Rota de Ordem de Compra */}
          <Route path="/purchase-orders" element={<PurchaseOrder />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
      </Route>

      {/* Fallback de Segurança */}
      <Route path="*" element={<Navigate to="/vendas" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PWAProvider>
        <AppContent />
      </PWAProvider>
    </BrowserRouter>
  );
}

export default App;