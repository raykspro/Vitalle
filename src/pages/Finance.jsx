import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabaseClient';
import { DollarSign, Calendar, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parsePriceToCents,
  formatPriceDisplay,
  addCents
} from "@/lib/formatters";

const Finance = () => {
  const { user } = useUser();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const userRole = user?.publicMetadata?.role || 'vendedor';

  // Busca os lançamentos (incluindo as comissões automáticas)
  useEffect(() => {
    async function fetchFinance() {
      try {
        const { data, error } = await supabase
          .from('financial_records') // Substitua pelo nome real da sua tabela
          .select('*')
          .order('due_date', { ascending: true });

        if (error) throw error;
        setRecords(data || []);
      } catch (err) {
        console.error("Erro financeiro:", err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFinance();
  }, []);

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <AlertCircle className="h-12 w-12 mb-4 text-magenta" />
        <h2 className="text-xl font-black tracking-widest uppercase">Acesso Restrito ao Mestre</h2>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header>
        <div className="h-1.5 w-20 bg-magenta mb-3 rounded-full" />
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Financeiro</h1>
        <p className="text-slate-500 font-medium italic">Controle de comissões e contas a pagar.</p>
      </header>

      {/* Grid de Resumo Financeiro */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl">
          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Total a Pagar</p>
          <h3 className="text-3xl font-black italic">{formatPriceDisplay(addCents(...records.filter(r => r.status === 'Pendente').map(r => parsePriceToCents(r.amount))))}</h3>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="p-6 text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Descrição</th>
              <th className="p-6 text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Valor</th>
              <th className="p-6 text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Vencimento</th>
              <th className="p-6 text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-20 text-center text-slate-400 font-medium italic">
                  Nenhum lançamento pendente encontrado.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-6 font-bold text-slate-700">{record.description}</td>
                  <td className="p-6 font-black text-slate-900 italic">{formatPriceDisplay(parsePriceToCents(record.amount))}</td>
                  <td className="p-6 text-slate-500 font-medium">
                    {new Date(record.due_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-6">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-2 w-fit",
                      record.status === 'Pago' ? "bg-green-100 text-green-600" : "bg-magenta/10 text-magenta"
                    )}>
                      {record.status === 'Pago' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Finance;