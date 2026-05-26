import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, createContext, useContext } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Wallet,
  Truck,
  Menu,
  Shirt,
  Settings,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Produtos", icon: Package },
  { to: "/stock", label: "Estoque", icon: Shirt },
  { to: "/customers", label: "Clientes", icon: Users },
  { to: "/suppliers", label: "Fornecedores", icon: Truck },
  { to: "/vendas", label: "Vendas", icon: ShoppingCart },
  { to: "/finance", label: "Financeiro", icon: Wallet },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export const LayoutContext = createContext(null);

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext deve ser usado dentro de um Layout');
  }
  return context;
};

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <LayoutContext.Provider value={{ mobileOpen, setMobileOpen }}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Overlay Mobile */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="p-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                <Shirt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold">Vitalle Boutique</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Mestre</p>
              </div>
            </div>
            {/* Botão de fechar dentro da sidebar no mobile */}
            <button 
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Conteúdo Principal */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* BOTÃO MENU MOBILE FIXO - Oculto quando a sidebar está aberta para não sobrepor */}
          {!mobileOpen && (
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden fixed top-3 left-4 z-[99] h-10 w-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Header com padding extra na esquerda (pl-16) para mobile, evitando cobrir o título */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center pl-16 lg:pl-8 pr-4 lg:pr-8 shrink-0">
            <h2 className="text-lg font-semibold text-foreground">
              {navItems.find((i) => i.to === location.pathname)?.label || "Sistema"}
            </h2>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}