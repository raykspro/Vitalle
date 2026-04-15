import React, { useState } from "react";
import { Home, Package, Shirt, Users, Truck, ShoppingCart, ShoppingBag, Wallet, History, Settings, LogOut, Menu, X } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/clerk-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigation = [
  { to: "/dashboard", label: "DASHBOARD", icon: Home },
  { to: "/products", label: "PRODUTOS", icon: Package },
  { to: "/stock", label: "ESTOQUE", icon: Shirt },
  { to: "/customers", label: "CLIENTES", icon: Users },
  { to: "/suppliers", label: "FORNECEDORES", icon: Truck },
  { to: "/sales", label: "VENDAS", icon: ShoppingCart },
  { to: "/purchase-order", label: "ORDEM DE COMPRA", icon: ShoppingBag }, 
  { to: "/payments", label: "PAGAMENTOS", icon: Wallet },
  { to: "/stockhistory", label: "HISTÓRICO", icon: History },
  { to: "/settings", label: "CONFIGURAÇÕES", icon: Settings },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);

  // Componente de navegação reutilizável
  const NavContent = () => (
    <nav className="flex flex-col justify-between h-full p-4 bg-white">
      <div className="grid gap-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all duration-300 tracking-wide",
                  isActive
                    ? "bg-magenta text-white shadow-lg shadow-magenta/30"
                    : "text-slate-500 hover:bg-magenta/5 hover:text-magenta"
                )
              }
            >
              <Icon className="h-5 w-5" />
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
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* HEADER MOBILE (Aparece apenas em telas pequenas) */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-magenta tracking-tighter">VITALLE</h1>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-magenta">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r-0">
            <div className="p-6 border-b bg-gradient-to-br from-magenta/5 to-transparent">
               <h1 className="text-2xl font-black text-magenta tracking-tighter">VITALLE</h1>
               <p className="text-[9px] text-magenta/60 font-black tracking-[0.3em] uppercase">MENU DE GESTÃO</p>
            </div>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <div className="mx-auto flex min-h-screen max-w-screen-2xl flex-col lg:flex-row">
        {/* SIDEBAR DESKTOP (Escondido no mobile) */}
        <aside className="hidden lg:flex border-r border-border bg-white min-h-screen w-72 flex-col sticky top-0 shadow-sm">
          <div className="border-b border-magenta/10 p-8 bg-gradient-to-br from-magenta/5 to-transparent">
            <h1 className="text-3xl font-black text-magenta tracking-tighter">VITALLE</h1>
            <p className="text-[10px] text-magenta/60 font-black tracking-[0.4em] uppercase">Boutique Management</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavContent />
          </div>
        </aside>

        {/* ÁREA PRINCIPAL */}
        <main className="flex-1 p-4 lg:p-10 w-full overflow-x-hidden">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}