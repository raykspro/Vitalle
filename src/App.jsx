import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Customers from './pages/Customers';
// 🗑️ REMOVIDO: import Invoices from './pages/Invoices';
import PurchaseOrder from './pages/PurchaseOrder'; // ✅ ADICIONADO
import Login from './pages/Login';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Settings from './pages/Settings';
import Stock from './pages/Stock';
import StockHistory from './pages/StockHistory';
import Suppliers from './pages/Suppliers';

function App() {
  return (
    <Routes>
      {/* Rota de Login: A única que o deslogado acessa */}
      <Route path="/login" element={<Login />} />
      
      {/* Raiz: Manda direto pro Dashboard. O AuthGuard decide se entra ou vai pro Login */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Rotas Protegidas pelo Escudo */}
      <Route element={<AuthGuard />}>
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/finance" element={<Layout><Finance /></Layout>} />
        <Route path="/customers" element={<Layout><Customers /></Layout>} />
        
        {/* ✅ TROCA REALIZADA: /invoices -> /purchase-order */}
        <Route path="/purchase-order" element={<Layout><PurchaseOrder /></Layout>} />
        
        <Route path="/products" element={<Layout><Products /></Layout>} />
        <Route path="/sales" element={<Layout><Sales /></Layout>} />
        <Route path="/stock" element={<Layout><Stock /></Layout>} />
        <Route path="/stockhistory" element={<Layout><StockHistory /></Layout>} />
        <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
        <Route path="/payments" element={<Layout><Payments /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Route>

      {/* Se o caminho não existir, tenta o Dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;