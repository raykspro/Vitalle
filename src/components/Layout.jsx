import React, { useState, createContext, useContext } from "react";
import { Home, Package, Shirt, DollarSign, Users, Truck, Settings, LogOut, Menu, Download, ShoppingCart, ChevronDown } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "../lib/utils";
import { SignOutButton } from "@clerk/clerk-react";
import { Sheet, SheetContent } from "../components/ui/sheet";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu";
import { usePWA } from "../lib/PWAContext";

// MESTRE: Exportando o contexto para que MobileSales e outras páginas possam usar
export const LayoutContext = createContext(null);

const navigation = [
  { to: "/dashboard", label: "DASHBOARD", icon: Home },
  { to: "/vendas", label: "VENDAS", icon: ShoppingCart },
  { to: "/products", label: "PRODUTOS", icon: Package },
  { to: "/stock", label: "ESTOQUE", icon: Shirt },
  { 
    id: "financeiro",
    label: "FINANCEIRO", 
    icon: DollarSign,
    children: [
      { to: "/finance/cashflow", label: "Fluxo de Caixa" },
      { to: "/finance/payables", label: "Contas a Pagar" },
      { to: "/finance/receivables", label: "Contas a Receber" },
      { to: "/finance/commissions", label: "Comissões" },
    ]
  },
  { to: "/customers", label: "CLIENTES", icon: Users },
  { to: "/purchase-orders", label: "ORDENS DE COMPRA", icon: Truck }, // CORRIGIDO PARA BATER COM APP.JSX
  { to: "/configuracoes", label: "AJUSTES", icon: Settings },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { installPrompt } = usePWA();

  const NavContent = () => (
    <nav className="flex flex-col gap-1 p-4">
      {navigation.map((item) => (
        <div key={item.label}>
          {item.children ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between hover:bg-slate-50 h-12 px-4 rounded-xl group">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-slate-400 group-hover:text-[#D946EF]" />
                    <span className="font-bold text-xs tracking-widest text-slate-600">{item.label}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 rounded-xl shadow-xl border-slate-100">
                {item.children.map((child) => (
                  <DropdownMenuItem key={child.to} asChild>
                    <NavLink to={child.to} className="w-full font-bold text-[10px] uppercase p-3 cursor-pointer">
                      {child.label}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <NavLink
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 h-12 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-[#D946EF] text-white shadow-lg shadow-pink-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-[#D946EF]"
              )}
            >
              <item.icon className={cn("h-5 w-5", "group-hover:scale-110 transition-transform")} />
              <span className="font-bold text-xs tracking-widest">{item.label}</span>
            </NavLink>
          )}
        </div>
      ))}
      
      <div className="mt-8 pt-8 border-t border-slate-100">
        <SignOutButton>
          <button className="flex items-center gap-3 px-4 h-12 w-full text-red-400 hover:bg-red-50 rounded-xl transition-all font-bold text-xs tracking-widest">
            <LogOut className="h-5 w-5" />
            SAIR DO SISTEMA
          </button>
        </SignOutButton>
      </div>
    </nav>
  );

  return (
    <LayoutContext.Provider value={{ mobileOpen, setMobileOpen }}>
      <div className="flex min-h-screen flex-col lg:flex-row bg-[#FDFBF7]">
        {/* MOBILE OVERLAY MENU */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-80 bg-white border-r-0">
            <div className="p-8 border-b border-slate-50 bg-[#D946EF]/5">
              <h1 className="text-2xl font-black text-[#D946EF] tracking-tighter italic uppercase">VITALLE</h1>
            </div>
            <NavContent />
          </SheetContent>
        </Sheet>

        {/* SIDEBAR DESKTOP */}
        <aside className="hidden lg:flex border-r border-slate-100 bg-white min-h-screen w-72 flex-col sticky top-0">
          <div className="p-10 border-b border-slate-50">
            <h1 className="text-3xl font-black text-[#D946EF] tracking-tighter italic">VITALLE</h1>
            <p className="text-[10px] text-slate-400 font-black tracking-[0.4em] uppercase mt-1">Boutique Luxury</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavContent />
          </div>
        </aside>

        {/* CONTEÚDO PRINCIPAL */}
        <main className="flex-1 relative">
          <Outlet />
        </main>
      </div>
    </LayoutContext.Provider>
  );
}