import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";
import { Home, ShoppingCart, Package, Shirt, DollarSign, Users, Truck, Settings, Download, LogOut, PanelLeft } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SignOutButton } from "@clerk/clerk-react"
import { Link, useLocation } from "react-router-dom"

const SidebarContext = React.createContext(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

// NAVEGAÇÃO OFICIAL VITALLE
const vitalleNav = [
  { to: "/dashboard", icon: Home, label: "Dashboard" },
  { to: "/vendas", icon: ShoppingCart, label: "Vendas" },
  { to: "/products", icon: Package, label: "Produtos" },
  { to: "/stock", icon: Shirt, label: "Estoque" },
  { to: "/clientes", icon: Users, label: "Clientes" },
  { to: "/fornecedores", icon: Truck, label: "Fornecedores" },
  { to: "/finance", icon: DollarSign, label: "Financeiro" },
  { to: "/configuracoes", icon: Settings, label: "Ajustes" },
]

const SidebarProvider = React.forwardRef(({ children, ...props }, ref) => {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(true)
  const [openMobile, setOpenMobile] = React.useState(false)

  const toggleSidebar = () => {
    if (isMobile) setOpenMobile(!openMobile)
    else setOpen(!open)
  }

  return (
    <SidebarContext.Provider value={{ open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }}>
      <div ref={ref} className="flex min-h-screen w-full" {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
})

const Sidebar = React.forwardRef(({ className }, ref) => {
  const { isMobile, openMobile, toggleSidebar } = useSidebar()
  const location = useLocation()

  return (
    <aside 
      ref={ref}
      className={cn(
        "bg-white border-r border-slate-100 flex flex-col transition-all duration-300",
        isMobile ? "fixed inset-y-0 left-0 z-50 w-72" : "w-72",
        isMobile && !openMobile && "-translate-x-full",
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-8 border-b border-slate-50 bg-gradient-to-br from-[#D946EF]/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200">
            <Package className="w-6 h-6 text-[#D946EF]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic leading-none">VITALLE</h1>
            <p className="text-[10px] font-bold text-[#D946EF] uppercase tracking-[0.2em]">Boutique Luxury</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
        {vitalleNav.map((item) => {
          const isActive = location.pathname === item.to
          const Icon = item.icon
          return (
            <Link 
              key={item.to} 
              to={item.to}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group",
                isActive 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200 translate-x-2" 
                  : "text-slate-400 hover:bg-[#D946EF]/10 hover:text-[#D946EF]"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-[#D946EF]" : "group-hover:scale-110 transition-transform")} />
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D946EF] animate-pulse" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-50 space-y-3">
        <Button className="w-full bg-[#D946EF] hover:bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl shadow-lg shadow-[#D946EF]/20 transition-all">
          <Download className="w-4 h-4 mr-2" />
          App Vitalle
        </Button>
        <SignOutButton>
          <button className="w-full flex items-center justify-center h-12 text-slate-400 hover:text-red-500 font-bold uppercase text-[10px] tracking-widest transition-colors">
            <LogOut className="w-4 h-4 mr-2" />
            Encerrar Sessão
          </button>
        </SignOutButton>
      </div>
    </aside>
  )
})

const SidebarTrigger = React.forwardRef(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()
  return (
    <Button 
      ref={ref} 
      onClick={toggleSidebar}
      variant="ghost"
      size="icon" 
      className={cn("h-10 w-10 text-slate-900", className)} 
      {...props}
    >
      <PanelLeft className="h-6 w-6" />
    </Button>
  )
})

export { Sidebar, SidebarProvider, SidebarTrigger, useSidebar }