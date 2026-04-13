import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const users = [
    { username: "rayan", password: "0101" },
    { username: "julia", password: "0101" },
  ];

const handleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const user = users.find(
        (u) =>
          u.username.toLowerCase() === email.toLowerCase() &&
          u.password === password
      );
      if (user) {
        navigate("/dashboard", { replace: true });
      } else {
        setError("Usuário ou senha incorretos.");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-black">
      <div className="w-full max-w-md p-8 space-y-6 bg-beige rounded-lg shadow-lg">
        <h1 className="text-5xl font-extrabold text-center text-black">
          Vitalle
        </h1>
        <h2 className="text-2xl font-bold text-center text-magenta">Login</h2>
        <input
          type="text"
          placeholder="Usuário"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-magenta"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 text-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-magenta"
        />
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full px-4 py-2 font-bold text-magenta bg-white border-2 border-magenta rounded hover:bg-magenta hover:text-white focus:ring-4 focus:ring-magenta/50 disabled:opacity-50"
        >
          {loading ? "Carregando..." : "Entrar"}
        </button>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
}