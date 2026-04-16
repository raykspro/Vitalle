import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { DollarSign, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPriceDisplay, parsePriceToCents, addCents } from '@/lib/formatters';
import { useUser } from '@clerk/clerk-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const FinancePayables = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'vendedor';
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayables() {
      try {
        const { data } = await supabase
          .from('financial_records')
          .select('*')
          .eq('type', 'pagar')
          .or('status.eq.Pendente,status.eq.Pago')
          .order('due_date', { ascending: true });
        setRecords(data || []);
      } catch (error) {
        console.error('Erro Contas a Pagar:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayables();
  }, []);

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="h-12 w-12 mb-4 text-magenta" />
        <h2 className="text-2xl font-black uppercase tracking-wider">Acesso Restrito</h2>
      </div>
    );
  }

  const pendingTotal = addCents(...records.filter(r => r.status === 'Pendente').map(r => parsePriceToCents(r.amount)));
  const paidTotal = addCents(...records.filter(r => r.status === 'Pago').map(r => parsePriceToCents(r.amount)));

  return (
    <div className="space-y-8">
      <header>
        <div className="h-1.5 w-20 bg-magenta mb-3 rounded-full" />
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Contas a Pagar</h1>
        <p className="text-slate-500 font-medium italic">Controle de obrigações filtradas por status.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-2xl">
          <CardContent className="p-8 pt-6">
            <div className="text-[10px] font-black tracking-widest uppercase text-orange-600 mb-3">Pendente</div>
            <div className="text-3xl font-black text-slate-900">{formatPriceDisplay(pendingTotal)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-2xl">
          <CardContent className="p-8 pt-6">
            <div className="text-[10px] font-black tracking-widest uppercase text-green-600 mb-3">Pago</div>
            <div className="text-3xl font-black text-slate-900">{formatPriceDisplay(paidTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-black tracking-widest uppercase text-slate-400 w-56">Descrição</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase text-slate-400">Valor</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase text-slate-400">Vencimento</TableHead>
              <TableHead className="text-xs font-black tracking-widest uppercase text-slate-400">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="p-12 text-center text-slate-400 h-32">Carregando...</TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="p-20 text-center text-slate-400 italic">Nenhuma conta a pagar encontrada.</TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id} className="hover:bg-slate-50/70 border-b border-slate-100">
                  <TableCell className="font-bold text-slate-800 py-5">{record.description}</TableCell>
                  <TableCell className="font-black text-2xl text-magenta py-5">{formatPriceDisplay(parsePriceToCents(record.amount))}</TableCell>
                  <TableCell className="font-medium text-slate-600 py-5">{new Date(record.due_date).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="py-5">
                    <Badge variant={record.status === 'Pago' ? "default" : "secondary"} className={cn(
                      "font-black tracking-widest px-4 py-1.5 text-xs uppercase",
                      record.status === 'Pago' ? "bg-green-500 hover:bg-green-500" : "bg-magenta/20 text-magenta border-magenta/30"
                    )}>
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default FinancePayables;

