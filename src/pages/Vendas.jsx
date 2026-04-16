import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShoppingCart, FileText, DollarSign } from 'lucide-react';
import { formatPriceDisplay } from '@/lib/formatters';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Vendas = () => {
  const { user } = useUser();
  const [stats, setStats] = useState({ total: 0, lancamentos: 0, comissoes: 0n });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVendas() {
      try {
        const { count: total } = await supabase.from('sales').select('*', { count: 'exact', head: true });
        const { count: lancamentos } = await supabase.from('invoices').select('*', { count: 'exact', head: true }); // Assuming invoices table
        const { data: commData } = await supabase.from('sales').select('commission_value_cents').eq('status', 'completed');
        const totalComissoes = commData?.reduce((sum, s) => sum + BigInt(s.commission_value_cents || 0), 0n) || 0n;
        setStats({ total, lancamentos, comissoes: totalComissoes });
      } catch (error) {
        console.error('Erro ao carregar vendas:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchVendas();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-10">
      <header>
        <div className="h-1.5 w-20 bg-magenta mb-3 rounded-full" />
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Vendas</h1>
        <p className="text-slate-500 font-medium italic">Lançamentos e histórico completo.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader>
            <CardDescription className="text-[10px] font-black tracking-widest uppercase text-slate-400">Total Vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-magenta">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader>
            <CardDescription className="text-[10px] font-black tracking-widest uppercase text-slate-400">Lançamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-magenta">{stats.lancamentos}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader>
            <CardDescription className="text-[10px] font-black tracking-widest uppercase text-slate-400">Comissões Totais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-magenta">{formatPriceDisplay(stats.comissoes)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Button asChild className="h-20 text-lg font-black rounded-3xl shadow-xl hover:shadow-2xl">
          <Link to="/finance/comissoes">→ Ver Relatório de Comissões</Link>
        </Button>
        <Button asChild className="h-20 text-lg font-black rounded-3xl shadow-xl hover:shadow-2xl bg-magenta text-white hover:bg-magenta/90">
          <Link to="/notas-fiscais">Lançamentos / Histórico</Link>
        </Button>
      </div>
    </div>
  );
};

export default Vendas;

