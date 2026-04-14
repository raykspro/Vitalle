import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useSignIn } from "@clerk/clerk-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const { signIn, setActive } = useSignIn();

// Redirect handled by initial useAuth check

  const handleSignIn = async () => {
    if (!isLoaded || isSignedIn) return;

    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({
        identifier: username,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate("/dashboard");
      } else {
        setError("O Clerk pede mais passos de verificação. Verifique o painel.");
      }
    } catch (err) {
      if (err.errors?.[0]?.code === "already_signed_in" || err.message.includes("already")) {
        navigate("/dashboard", { replace: true });
      } else {
        setError("Usuário ou senha incorretos.");
      }
      console.error("Erro no login:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-50 rounded-lg shadow-xl border border-gray-100">
        <h1 className="text-5xl font-extrabold text-center text-black">Vitalle</h1>
        <h2 className="text-2xl font-bold text-center text-[#d946ef]">Login</h2>
        
        <input
          type="text"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 border rounded focus:ring-2 focus:ring-[#d946ef] outline-none"
        />
        
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border rounded focus:ring-2 focus:ring-[#d946ef] outline-none"
        />
        
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full py-3 font-bold text-white bg-[#d946ef] rounded hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? "Abrindo as portas..." : "ENTRAR"}
        </button>
        
        {error && <p className="text-red-500 text-center font-medium">{error}</p>}
      </div>
    </div>
  );
}