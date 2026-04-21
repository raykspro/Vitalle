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
import MobileSales from './pages/MobileSales'; // SUA TELA DE ELITE
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
      <Route path="/login" element={<Login />} />
      
      {/* MESTRE: Sistema inicia em Vendas para agilidade total */}
      <Route path="/" element={<Navigate to="/vendas" replace />} />

      <Route element={<AuthGuard />}>
        <Route element={<Layout />}>
          {/* SINCRONIZADO COM OS LINKS DA SIDEBAR (VITALLE NAV) */}
          <Route path="/vendas" element={<MobileSales />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/stock" element={<Stock />} />
<Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/finance" element={<Finance />} />
          
          {/* SUB-ROTAS FINANCEIRAS */}
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