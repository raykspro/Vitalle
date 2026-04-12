import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

const users = [
  { username: "rayan", password: "0101" },
  { username: "julia", password: "0101" },
];

const handleSignIn = () => {
  setLoading(true);
  const user = users.find(
    (u) =>
      u.username.toLowerCase() === email.toLowerCase() &&
      u.password === password
  );
  if (user) {
    setMessage("Login realizado com sucesso!");
  } else {
    setMessage("Usuário ou senha incorretos.");
  }
  setLoading(false);
};

  return (
    <div className="auth-container">
      <h1>Autenticação</h1>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleSignUp} disabled={loading}>
        {loading ? "Carregando..." : "Cadastrar"}
      </button>
      <button onClick={handleSignIn} disabled={loading}>
        {loading ? "Carregando..." : "Entrar"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}