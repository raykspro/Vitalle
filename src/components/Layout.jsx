import { Home, Package, Shirt, Users, Truck, ShoppingCart, FileText, Wallet, History, Settings } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigation = [
  { to: "/dashboard", label: "DASHBOARD", icon: Home },
  { to: "/products", label: "PRODUTOS", icon: Package },
  { to: "/stock", label: "ESTOQUE", icon: Shirt },
  { to: "/customers", label: "CLIENTES", icon: Users },
  { to: "/suppliers", label: "FORNECEDORES", icon: Truck },
  { to: "/sales", label: "VENDAS", icon: ShoppingCart },
  { to: "/invoices", label: "NOTAS FISCAIS", icon: FileText },
  { to: "/payments", label: "PAGAMENTOS", icon: Wallet },
  { to: "/stockhistory", label: "HISTÓRICO", icon: History },
  { to: "/settings", label: "CONFIGURAÇÕES", icon: Settings },
];

// Adicionamos { children } para aceitar o Dashboard diretamente
export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col lg:flex-row">
        <aside className="border-b border-border bg-card lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <div className="border-b border-magenta/20 p-6 bg-gradient-to-r from-magenta/5 to-boutique-bg/50">
            <h1 className="text-2xl font-black text-magenta tracking-widest">VITALLE</h1>
            <p className="text-xs text-magenta/70 font-bold tracking-[0.3em]">BOUTIQUE MANAGEMENT</p>
          </div>

          <nav className="grid gap-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
                      isActive
                        ? "bg-magenta text-white shadow-magenta/20 shadow-lg"
                        : "text-gray-600 hover:bg-magenta/10 hover:text-magenta hover:shadow-magenta/10 transition-all duration-200 font-black uppercase tracking-widest text-sm"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Prioriza o componente filho, se não houver, usa o Outlet das rotas */}
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}