// Vitalle v2.0 - Simplified Routing with Clerk
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
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
              <SignedIn>
                <Dashboard />
              </SignedIn>
            }
          />
          <Route
            path="/login"
            element={
              <SignedOut>
                <Login />
              </SignedOut>
            }
          />
          <Route
            path="*"
            element={<RedirectToSignIn />}
          />
        </Routes>
      </Router>
    </ClerkProvider>
  );
}

export default App;