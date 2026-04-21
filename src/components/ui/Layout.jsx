import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect, createContext } from "react";
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
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/stock", label: "Stock", icon: Shirt },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/vendas", label: "Sales", icon: ShoppingCart },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/configuracoes", label: "Settings", icon: Settings },
];

const LayoutContext = createContext(null);

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within Layout');
  }
  return context;
};

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    import('@/api/clineClient').then(({ cline }) => {
      cline.entities.Settings.list().then(data => {
        if (data.length > 0) setStoreSettings(data[0]);
      });
    });
  }, []);

  return (
    <LayoutContext.Provider value={{ mobileOpen, setMobileOpen }}>
      <div className="flex h-screen overflow-hidden">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="p-6 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-sidebar-primary flex items-center justify-center overflow-hidden flex-shrink-0">
              {storeSettings?.logo_url
                ? <img src={storeSettings.logo_url} alt="logo" className="h-full w-full object-cover" />
                : <Shirt className="h-5 w-5 text-sidebar-primary-foreground" />}
            </div>
            <div>
              <h1 className="text-base font-semibold text-sidebar-foreground">{storeSettings?.store_name || "Minha Loja"}</h1>
              <p className="text-xs text-sidebar-foreground/50">BOUTIQUE</p>
            </div>
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
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mx-3 mb-4 rounded-xl bg-sidebar-accent/50">
            <p className="text-xs text-sidebar-foreground/50">Sistema de Gestão</p>
            <p className="text-xs text-sidebar-foreground/70 mt-1">v1.0</p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-16 border-b border-border bg-card flex items-center px-4 lg:px-8 gap-4 shrink-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold">
              {navItems.find((i) => i.to === location.pathname)?.label || "Página"}
            </h2>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}

