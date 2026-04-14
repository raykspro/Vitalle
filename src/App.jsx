// Vitalle v5.1 - Roteamento Blindado
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import Login from './pages/Login';
import Payments from './pages/Payments';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Settings from './pages/Settings';
import Stock from './pages/Stock';
import StockHistory from './pages/StockHistory';
import Suppliers from './pages/Suppliers';

const clerkPubKey = "pk_test_ZW5oYW5jZWQtc25ha2UtNDguY2xlcmsuYWNjb3VudHMuZGV2JA";

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
<Router>
        <Routes>
          {/* Login */}
          <Route path="/" element={<Login />} />
          
          {/* Protected Routes */}
          <Route element={<AuthGuard />}>
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/finance" element={<Layout><Finance /></Layout>} />
            <Route path="/customers" element={<Layout><Customers /></Layout>} />
            <Route path="/invoices" element={<Layout><Invoices /></Layout>} />
            <Route path="/payments" element={<Layout><Payments /></Layout>} />
            <Route path="/products" element={<Layout><Products /></Layout>} />
            <Route path="/sales" element={<Layout><Sales /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="/stock" element={<Layout><Stock /></Layout>} />
            <Route path="/stockhistory" element={<Layout><StockHistory /></Layout>} />
            <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
            <Route path="*" element={<Layout><Navigate to="/dashboard" replace /></Layout>} />
          </Route>
        </Routes>
      </Router>
    </ClerkProvider>
  );
}

export default App;