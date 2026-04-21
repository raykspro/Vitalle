import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import FinanceCashFlow from './pages/FinanceCashFlow';
import FinancePayables from './pages/FinancePayables';
import FinanceReceivables from './pages/FinanceReceivables';
import FinanceCommissions from './pages/FinanceCommissions';
import Products from './pages/Products';
import Stock from './pages/Stock';
import PurchaseOrder from './pages/PurchaseOrder'; 
import Login from './pages/Login';
import MobileSales from './pages/MobileSales'; // A NOVA TELA MOBILE DE ELITE
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
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [setInstallPrompt]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* MESTRE: O sistema agora inicia direto em Vendas para agilizar o mobile */}
      <Route path="/" element={<Navigate to="/vendas" replace />} />

      <Route element={<AuthGuard />}>
        {/* Rota Principal: Nova Venda */}
        <Route path="/vendas" element={<Layout><MobileSales /></Layout>} />
        
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/produtos" element={<Layout><Products /></Layout>} />
        <Route path="/estoque" element={<Layout><Stock /></Layout>} />
        
        <Route path="/finance/fluxo-caixa" element={<Layout><FinanceCashFlow /></Layout>} />
        <Route path="/finance/contas-pagar" element={<Layout><FinancePayables /></Layout>} />
        <Route path="/finance/contas-receber" element={<Layout><FinanceReceivables /></Layout>} />
        <Route path="/finance/comissoes" element={<Layout><FinanceCommissions /></Layout>} />
        <Route path="/finance" element={<Layout><Finance /></Layout>} />
        
        <Route path="/contatos/clientes" element={<Layout><Clientes /></Layout>} />
        <Route path="/contatos/fornecedores" element={<Layout><Fornecedores /></Layout>} />
        
        <Route path="/ordens-compra" element={<Layout><PurchaseOrder /></Layout>} />
        
        <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
      </Route>

      <Route path="*" element={<Navigate to="/vendas" replace />} />
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