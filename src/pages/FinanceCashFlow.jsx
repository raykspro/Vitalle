import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPriceDisplay, parsePriceToCents } from '@/lib/formatters';
import { useUser } from '@clerk/clerk-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export default function FinanceCashFlow() {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'vendedor';
  const [records, setRecords ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCashFlow();
  }, []);

  async function fetchCashFlow() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const incomeCents = data
        ?.filter(r => r.type === 'receber')
        .reduce((acc, r) => acc + Number(r.value_cents || 0), 0) || 0;
      const expenseCents = data
        ?.filter(r => r.type === 'pagar')
        .reduce((acc, r) => acc + Number(r.value_cents || 0), 0) || 0;

      setStats({
        income: incomeCents / 100,
        expense: expenseCents / 100,
        balance: (incomeCents - expenseCents) / 100
      });
      setRecords(data || []);
    } catch (error) {
      console.error('Erro Fluxo de Caixa:', error);
      toast.error('Erro ao carregar fluxo de caixa');
    } finally {
      setLoading(false);
    }
  }

  const refreshData = () => {
    setRefreshing(true);
    fetchCashFlow();
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] rounded-[2.5rem] bg-white shadow-2xl p-8 text-center">
        <AlertCircle className="h-16 w-16 mb-6 text-slate-900" />
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wider mb-2">Acesso Restrito</h2>
        <p className="text-slate-500">Contate o administrador da Vitalle.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 p-4 lg:p-10 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="h-2 w-24 bg-[#D946EF] mb-4 rounded-full shadow-lg" />
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase">Fluxo de Caixa</h1>
          <p className="text-slate-500 font-medium italic mt-2">Movimentações financeiras consolidadas da Vitalle Boutique.</p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={refreshing}
          className="bg-[#D946EF] hover:bg-[#D946EF]/90 text-white font-black uppercase tracking-widest rounded-[2rem] shadow-2xl px-8 py-4 text-lg h-auto self-start lg:self-auto"
        >
          <Loader2 className={cn("h-5 w-5 mr-2 animate-spin", !refreshing && "hidden")} />
          {refreshing ? "Sincronizando..." : "Atualizar Dados"}
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-3xl transition-all">
          <CardContent className="p-8 pt-6">
            <div className="text-[10px] font-black tracking-widest uppercase text-emerald-600 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Entradas
            </div>
            <div className="text-4xl font-black text-slate-900">{formatPriceDisplay(stats.income)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-3xl transition-all">
          <CardContent className="p-8 pt-6">
            <div className="text-[10px] font-black tracking-widest uppercase text-orange-600 mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" /> Saídas
            </div>
            <div className="text-4xl font-black text-slate-900">{formatPriceDisplay(stats.expense)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-3xl transition-all">
          <CardContent className="p-8 pt-6">
            <div className="text-[10px] font-black tracking-widest uppercase text-blue-600 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Saldo
            </div>
            <div className={cn(
              "text-4xl font-black",
              stats.balance >= 0 ? "text-emerald-600" : "text-orange-600"
            )}>
              {formatPriceDisplay(stats.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card className="rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden bg-white">
        <CardHeader className="p-0">
          <div className="bg-slate-50/50 p-8 border-b border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-wider">Movimentações Recentes</h3>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-left font-black uppercase text-[10px] text-slate-400 tracking-widest w-32">Data</TableHead>
                  <TableHead className="text-left font-black uppercase text-[10px] text-slate-400 tracking-widest">Descrição</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px] text-slate-400 tracking-widest">Valor</TableHead>
                  <TableHead className="text-left font-black uppercase text-[10px] text-slate-400 tracking-widest">Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-16 text-center">
                      <Skeleton className="h-12 w-full mx-auto mb-4" />
                      <Skeleton className="h-12 w-3/4 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-20 text-center text-slate-500 italic font-medium">
                      Nenhuma movimentação financeira encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                      <TableCell className="font-medium text-slate-700">
                        {new Date(record.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 max-w-md truncate">
                        {record.description || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right font-black text-2xl">
                        <span className={cn(
                          record.type === 'receber' ? 'text-emerald-600' : 'text-orange-600'
                        )}>
                          {formatPriceDisplay(record.value_cents)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "font-black uppercase tracking-widest px-4 py-2 text-xs rounded-xl",
                          record.type === 'receber' ? "bg-emerald-500/20 text-emerald-700 border border-emerald-300" : "bg-orange-500/20 text-orange-700 border border-orange-300"
                        )}>
                          {record.type === 'receber' ? 'Receita' : 'Despesa'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

