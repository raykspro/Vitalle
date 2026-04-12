import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(`Erro ao cadastrar: ${error.message}`);
    } else {
      setMessage("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar.");
    }
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(`Erro ao entrar: ${error.message}`);
    } else {
      setMessage("Login realizado com sucesso!");
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