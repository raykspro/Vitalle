import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Inicializa o tema buscando o que o Senhor salvou por último, ou define "dark" como padrão
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("vitalle-theme");
      if (savedTheme) return savedTheme;
    }
    return "dark"; // Padrão Luxury
  });

  // Toda vez que o tema mudar, aplica a classe no HTML e salva no navegador
  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    localStorage.setItem("vitalle-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook para o Senhor usar em qualquer tela facilmente
export const useTheme = () => useContext(ThemeContext);