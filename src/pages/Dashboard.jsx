import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Package, Users, ShoppingCart, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import StatCard from "@/components/StatCard";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, customers: 0, sales: [], payments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { data: products },
        { data: customers },
        { data: sales },
        { data: payments }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('payments').select('*').eq('status', 'Pendente').order('due_date', { ascending: false }).limit(50),
      ]);

      setStats({ 
        products: products?.length || 0, 
        customers: customers?.length || 0, 
        sales: sales || [], 
        payments: payments || [] 
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalSales = stats.sales.reduce((sum, s) => sum + (s.final_amount || 0), 0);
  const pendingReceivables = stats.payments
    .filter((p) => p.type === "A Receber")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayables = stats.payments
    .filter((p) => p.type === "A Pagar")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const recentSales = stats.sales.slice(0, 5);
  const urgentPayments = stats.payments
    .filter((p) => {
      if (!p.due_date) return false;
      return new Date(p.due_date) <= new Date(Date.now() + 7 * 86400000);
    })
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Bem-vindo de volta!</h1>
        <p className="text-muted-foreground mt-1">Aqui está o resumo do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Produtos" value={stats.products} icon={Package} />
        <StatCard title="Clientes" value={stats.customers} icon={Users} />
        <StatCard title="Total em Vendas" value={formatCurrency(totalSales)} icon={TrendingUp} />
        <StatCard title="A Receber" value={formatCurrency(pendingReceivables)} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Vendas Recentes</h3>
            <Link to="/vendas" className="text-sm text-primary hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-border">
            {recentSales.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground text-center">Nenhuma venda registrada</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{sale.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(sale.sale_date || sale.created_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(sale.final_amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      sale.status === "Concluída" ? "bg-green-100 text-green-700" :
                      sale.status === "Pendente" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {sale.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Urgent Payments */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent" />
              Pagamentos Urgentes
            </h3>
            <Link to="/pagamentos" className="text-sm text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y divide-border">
            {urgentPayments.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground text-center">Sem pagamentos urgentes</p>
            ) : (
              urgentPayments.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{p.person_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.type} · Vence {formatDate(p.due_date)}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${p.type === "A Pagar" ? "text-destructive" : "text-green-600"}`}>
                    {formatCurrency(p.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-1">Total a Pagar (Fornecedores)</p>
          <p className="text-xl font-bold text-destructive">{formatCurrency(pendingPayables)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground mb-1">Total a Receber (Clientes)</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(pendingReceivables)}</p>
        </div>
      </div>
    </div>
  );
}