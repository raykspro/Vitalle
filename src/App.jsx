// Vitalle v5.0 - Simplified Routing for Build Success
import { ClerkProvider, SignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

const clerkPubKey = "pk_test_ZW5oYW5jZWQtc25ha2UtNDguY2xlcmsuYWNjb3VudHMuZGV2JA";

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <SignedOut>
                <SignIn />
              </SignedOut>
            }
          />
          <Route
            path="/dashboard"
            element={
              <SignedIn>
                <Dashboard />
              </SignedIn>
            }
          />
        </Routes>
      </Router>
    </ClerkProvider>
  );
}

export default App;