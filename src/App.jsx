// Vitalle v1.1 - Clerk Auth Integration
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import Finance from './pages/Finance';
import { ClerkProvider } from '@clerk/clerk-react';
import AuthGuard from './components/AuthGuard';
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

console.log('Verificando Auth...');
const AuthenticatedApp = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<Login />} />
    <Route
      path="/dashboard"
      element={
        <AuthGuard>
          <Dashboard />
        </AuthGuard>
      }
    />
    <Route path="*" element={<PageNotFound />} />
  </Routes>
);

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