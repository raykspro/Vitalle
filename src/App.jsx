// Vitalle v4.0 - Minimal Clerk Implementation
import { ClerkProvider, SignIn } from '@clerk/clerk-react';

const clerkPubKey = "pk_test_ZW5oYW5jZWQtc25ha2UtNDguY2xlcmsuYWNjb3VudHMuZGV2JA";

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
<SignIn
  path="/"
  routing="path"
  signUpUrl="/sign-up"
  afterSignInUrl="/dashboard"
  appearance={{
    elements: {
      formButtonPrimary: 'bg-magenta text-white',
    },
  }}
/>
    </ClerkProvider>
  );
}

export default App;