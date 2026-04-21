import React, { useState } from "react";
import { Home, Package, Shirt, DollarSign, Users, Truck, Settings, LogOut, Menu, Download, ShoppingCart, ChevronDown } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/clerk-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePWA } from "@/lib/PWAContext";

// MESTRE: Rotas sincronizadas exatamente com o seu App.jsx
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
      { to: "/finance/commissions", label: "Relatório de Comissões" }
    ]
  },
  { 
    id: "contatos",
    label: "CONTATOS", 
    icon: Users,
    children: [
{ to: "/customers", label: "Customers" },
      { to: "/suppliers", label: "Suppliers" }
    ]
  },
  { to: "/ordens-compra", label: "ORDENS DE COMPRA", icon: Truck },
  { to: "/configuracoes", label: "CONFIGURAÇÕES", icon: Settings },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { promptInstall } = usePWA();

  const NavContent = () => {
    return (
      <nav className="flex flex-col justify-between h-full p-4 bg-white">
        <div className="grid gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            if (item.children) {
              return (
                <div key={item.id} className="group">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all duration-300 tracking-wide cursor-pointer w-full",
                        "text-slate-500 hover:bg-[#D946EF]/5 hover:text-[#D946EF]"
                      )}>
                        <Icon className="h-5 w-5" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 ml-16 border-slate-200 rounded-2xl shadow-xl bg-white z-[100]">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 px-4 py-3 text-sm font-black tracking-wide w-full text-left",
                              isActive
                                ? "bg-[#D946EF] text-white"
                                : "text-slate-500 hover:bg-[#D946EF]/10 hover:text-[#D946EF]"
                            )
                          }
                        >
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all duration-300 tracking-wide",
                    isActive
                      ? "bg-[#D946EF] text-white shadow-lg shadow-[#D946EF]/40"
                      : "text-slate-500 hover:bg-[#D946EF]/5 hover:text-[#D946EF]"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
          <Button
            onClick={promptInstall}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black text-[#D946EF] hover:bg-[#D946EF] hover:text-white transition-all border border-[#D946EF]/30"
            variant="outline"
          >
            <Download className="h-5 w-5" />
            <span>INSTALAR VITALLE</span>
          </Button>
          
          <SignOutButton>
            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
              <LogOut className="h-5 w-5" />
              <span>SAIR</span>
            </button>
          </SignOutButton>
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF]">
      {/* HEADER MOBILE */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b-2 border-slate-100 sticky top-0 z-50">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-[#D946EF] tracking-tighter italic">VITALLE</h1>
          <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase">Luxury Store</p>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[#D946EF]">
              <Menu className="h-7 w-7" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 bg-white">
            <div className="p-8 border-b border-slate-50 bg-[#D946EF]/5">
              <h1 className="text-2xl font-black text-[#D946EF] tracking-tighter italic">VITALLE</h1>
            </div>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden lg:flex border-r-2 border-slate-100 bg-white min-h-screen w-72 flex-col sticky top-0">
          <div className="p-10 border-b border-slate-50">
            <h1 className="text-3xl font-black text-[#D946EF] tracking-tighter italic">VITALLE</h1>
            <p className="text-[10px] text-slate-400 font-black tracking-[0.4em] uppercase mt-1">Boutique Luxury</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavContent />
          </div>
        </aside>

        {/* ÁREA PRINCIPAL */}
        <main className="flex-1 bg-[#FDFDFF] w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}