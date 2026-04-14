// Vitalle v4.0 - Minimal Clerk Implementation
import { ClerkProvider, SignIn } from '@clerk/clerk-react';

const clerkPubKey = "pk_test_ZW5oYW5jZWQtc25ha2UtNDguY2xlcmsuYWNjb3VudHMuZGV2JA";

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignIn />
    </ClerkProvider>
  );
}

export default App;