import { Home, Package, Shirt, Users, Truck, ShoppingCart, FileText, Wallet, History, Settings, LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/clerk-react";

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

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col lg:flex-row">
        <aside className="border-b border-border bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r shadow-sm">
          <div className="border-b border-magenta/10 p-8 bg-gradient-to-br from-magenta/5 to-transparent">
            <h1 className="text-3xl font-black text-magenta tracking-tighter">VITALLE</h1>
            <p className="text-[10px] text-magenta/60 font-black tracking-[0.4em] uppercase">Boutique Management</p>
          </div>

          <nav className="flex flex-col justify-between h-[calc(100vh-120px)] p-4">
            <div className="grid gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black transition-all duration-300 tracking-wide",
                        isActive
                          ? "bg-magenta text-white shadow-lg shadow-magenta/30 translate-x-1"
                          : "text-slate-500 hover:bg-magenta/5 hover:text-magenta"
                      )
                    }
                  >
                    <Icon className={cn("h-5 w-5")} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-border">
              <SignOutButton>
                <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                  <LogOut className="h-5 w-5" />
                  <span>SAIR DO SISTEMA</span>
                </button>
              </SignOutButton>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6 lg:p-10">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}