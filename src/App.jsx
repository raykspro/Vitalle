import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import FinanceCashFlow from './pages/FinanceCashFlow'; // Stub for /finance/fluxo-caixa
import FinancePayables from './pages/FinancePayables'; // Stub for contas-pagar
import FinanceReceivables from './pages/FinanceReceivables'; // Stub for contas-receber
import FinanceCommissions from './pages/FinanceCommissions'; // Comissões w/ commission_value_cents
import Products from './pages/Products';
import Stock from './pages/Stock';
import PurchaseOrder from './pages/PurchaseOrder';
import Login from './pages/Login';
import Vendas from './pages/Vendas';
import Clientes from './pages/Clientes';
import Fornecedores from './pages/Fornecedores';
import Configuracoes from './pages/Configuracoes';
import { PWAProvider, usePWA } from './lib/PWAContext';

function AppContent() {
  const { setInstallPrompt } = usePWA();

  useEffect(() => {
    let deferredPrompt;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setInstallPrompt(deferredPrompt);
      console.log('Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setInstallPrompt]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<AuthGuard />}>
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        
        {/* Vendas */}
        <Route path="/vendas" element={<Layout><Vendas /></Layout>} />
        
        {/* Produtos & Estoque */}
        <Route path="/produtos" element={<Layout><Products /></Layout>} />
        <Route path="/estoque" element={<Layout><Stock /></Layout>} />
        
        {/* Financeiro Subtabs */}
        <Route path="/finance/fluxo-caixa" element={<Layout><FinanceCashFlow /></Layout>} />
        <Route path="/finance/contas-pagar" element={<Layout><FinancePayables /></Layout>} />
        <Route path="/finance/contas-receber" element={<Layout><FinanceReceivables /></Layout>} />
        <Route path="/finance/comissoes" element={<Layout><FinanceCommissions /></Layout>} />
        <Route path="/finance" element={<Layout><Finance /></Layout>} />
        
        {/* Contatos */}
        <Route path="/contatos/clientes" element={<Layout><Clientes /></Layout>} />
        <Route path="/contatos/fornecedores" element={<Layout><Fornecedores /></Layout>} />
        
        {/* Ordens & Config */}
        <Route path="/ordens-compra" element={<Layout><PurchaseOrder /></Layout>} />
        <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
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

