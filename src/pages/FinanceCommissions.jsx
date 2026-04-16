import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPriceDisplay, parsePriceToCents, addCents } from '@/lib/formatters';
import { useUser } from '@clerk/clerk-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const FinanceCommissions = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'vendedor';
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommissions() {
      try {
        // Fetch sales with commission_value_cents, join products if needed
        const { data } = await supabase
          .from('sales')
          .select(`
            *,
            products (
              commission_value_cents,
              commission_percent
            )
          `)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });
        setCommissions(data || []);
      } catch (error) {
        console.error('Erro Relatório Comissões:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCommissions();
  }, []);

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="h-12 w-12 mb-4 text-magenta" />
        <h2 className="text-2xl font-black uppercase tracking-wider">Acesso Restrito</h2>
      </div>
    );
  }

  const totalCommissions = addCents(...commissions.map(s => BigInt(s.products?.commission_value_cents || s.commission_value_cents || 0)));

  return (
    <div className="space-y-8">
      <header>
        <div className="h-1.5 w-20 bg-magenta mb-3 rounded-full" />
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Relatório de Comissões</h1>
        <p className="text-slate-500 font-medium italic">Soma de commission_value_cents por venda (Pendente/Pago via status).</p>
      </header>

      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-0 shadow-2xl">
        <CardContent className="p-8 pt-6">
          <div className="text-[10px] font-black tracking-widest uppercase text-emerald-700 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Total Comissões
          </div>
          <div className="text-4xl font-black text-slate-900">{formatPriceDisplay(totalCommissions)}</div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-black tracking-widest uppercase text-slate-400 w-48">Venda ID</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase text-slate-400">Cliente</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase text-slate-400 w-32">Comissão (cents)</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase text-slate-400">Data</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase text-slate-400">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="p-12 text-center text-slate-400 h-32">Carregando...</TableCell>
              </TableRow>
            ) : commissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-20 text-center text-slate-400 italic">Nenhuma comissão encontrada.</TableCell>
              </TableRow>
            ) : (
              commissions.map((commission) => {
                const commValue = BigInt(commission.products?.commission_value_cents || commission.commission_value_cents || 0);
                return (
                  <TableRow key={commission.id} className="hover:bg-slate-50/70 border-b border-slate-100">
                    <TableCell className="font-mono text-sm text-slate-700 py-4">#{commission.id.slice(-6)}</TableCell>
                    <TableCell className="font-semibold text-slate-800 py-4">{commission.customer_name}</TableCell>
                    <TableCell className="font-black text-xl text-emerald-600 py-4">{formatPriceDisplay(commValue)}</TableCell>
                    <TableCell className="text-slate-600 py-4">{new Date(commission.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="py-4">
                      <Badge className={cn(
                        "font-black tracking-widest px-3 py-1 text-xs uppercase",
                        commission.status === 'completed' ? "bg-emerald-500" : "bg-slate-200 text-slate-600"
                      )}>
                        {commission.status === 'completed' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default FinanceCommissions;

