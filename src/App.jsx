import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Customers from './pages/Customers';
import PurchaseOrder from './pages/PurchaseOrder';
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
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<AuthGuard />}>
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/finance" element={<Layout><Finance /></Layout>} />
        <Route path="/customers" element={<Layout><Customers /></Layout>} />
        <Route path="/purchase-order" element={<Layout><PurchaseOrder /></Layout>} />
        <Route path="/products" element={<Layout><Products /></Layout>} />
        <Route path="/sales" element={<Layout><Sales /></Layout>} />
        <Route path="/stock" element={<Layout><Stock /></Layout>} />
        <Route path="/stockhistory" element={<Layout><StockHistory /></Layout>} />
        <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
        <Route path="/payments" element={<Layout><Payments /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;