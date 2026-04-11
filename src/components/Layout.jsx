import { Home, Package, Shirt, Users, Truck, ShoppingCart, FileText, Wallet, History, Settings } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigation = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/estoque", label: "Estoque", icon: Shirt },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/fornecedores", label: "Fornecedores", icon: Truck },
  { to: "/vendas", label: "Vendas", icon: ShoppingCart },
  { to: "/notas-fiscais", label: "Notas Fiscais", icon: FileText },
  { to: "/pagamentos", label: "Pagamentos", icon: Wallet },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col lg:flex-row">
        <aside className="border-b border-border bg-card lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-6">
            <h1 className="text-xl font-semibold">Vitalle</h1>
            <p className="text-sm text-muted-foreground">Gestão da loja</p>
          </div>

          <nav className="grid gap-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}