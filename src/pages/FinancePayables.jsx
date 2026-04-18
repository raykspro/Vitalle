import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, Plus, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPriceDisplay, parsePriceToCents, addCents } from '@/lib/formatters';
import { useUser } from '@clerk/clerk-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinancePayables() {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'vendedor';
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ description: '', amount: '', due_date: '', status: 'Pendente' });
  const [isMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, suppliers(name)')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao carregar despesas:', error);
        toast.error('Erro ao carregar despesas');
      } else {
        setExpenses(data || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }

  const pendingTotal = addCents(...(expenses?.filter(r => r.status === 'Pendente') || []).map(r => parsePriceToCents(r.amount || '0')));
  const paidTotal = addCents(...(expenses?.filter(r => r.status === 'Pago') || []).map(r => parsePriceToCents(r.amount || '0')));

  const resetForm = () => {
    setFormData({ description: '', amount: '', due_date: '', status: 'Pendente' });
    setEditId(null);
    setShowForm(false);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const expenseData = {
      description: formData.description,
      amount: parseFloat(formData.amount) || 0,
      due_date: formData.due_date,
      status: formData.status
    };
    try {
      let res;
      if (editId) {
        res = await supabase.from('expenses').update(expenseData).eq('id', editId).select().single();
      } else {
        res = await supabase.from('expenses').insert([expenseData]).select().single();
      }
      if (res.error) throw res.error;
      toast.success(editId ? 'Despesa atualizada!' : 'Nova despesa adicionada!');
      resetForm();
      await fetchExpenses(); // Reatividade instantânea
    } catch (error) {
      toast.error('Erro ao salvar despesa');
    }
  }

  const handleEdit = (record) => {
    setFormData({
      description: record?.description || '',
      amount: record?.amount ? record.amount.toString() : '',
      due_date: record?.due_date ? record.due_date.split('T')[0] : '',
      status: record?.status || 'Pendente'
    });
    setEditId(record?.id);
    setShowForm(true);
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
    <div className="space-y-8 p-4 lg:p-10 max-w-7xl mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="h-2 w-24 bg-[#D946EF] mb-4 rounded-full shadow-lg" />
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight uppercase">Contas a Pagar</h1>
          <p className="text-slate-500 font-medium italic mt-2">Controle total das obrigações Vitalle.</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)} 
          className="bg-[#D946EF] hover:bg-[#D946EF]/90 text-white font-black uppercase tracking-widest rounded-[2rem] shadow-2xl px-8 py-4 text-lg h-auto self-start lg:self-auto"
        >
          <Plus className="h-5 w-5 mr-2" /> Nova Despesa
        </Button>
      </header>

      {/* Cards Totais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-3xl transition-all">
          <CardContent className="p-8 pt-6">
            <div className="text-[10px] font-black tracking-widest uppercase text-orange-600 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Pendente
            </div>
            <div className="text-4xl font-black text-slate-900">{formatPriceDisplay(pendingTotal)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-3xl transition-all">
          <CardContent className="p-8 pt-6">
            <div className="text-[10px] font-black tracking-widest uppercase text-emerald-600 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Pago
            </div>
            <div className="text-4xl font-black text-slate-900">{formatPriceDisplay(paidTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <Card className="rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden bg-white">
        <CardHeader className="p-0">
          <div className="bg-slate-50/50 p-6 border-b border-slate-100">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-wider">Obrigações Financeiras</h3>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isMobile ? (
            <div className="p-6 space-y-4">
              {expenses?.map((record) => (
                <Card key={record?.id} className="rounded-[2rem] border-0 shadow-xl hover:shadow-2xl transition-all">
                  <CardContent className="p-6 pt-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-lg">{record?.description || 'N/A'}</h4>
                        <p className="text-sm text-slate-500">{record?.suppliers?.name || 'Fornecedor não identificado'}</p>
                      </div>
                      <div className="font-black text-2xl text-magenta">{formatPriceDisplay(parsePriceToCents(record?.amount || '0'))}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {record?.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
                      <Badge className={cn(
                        "font-black uppercase tracking-widest px-4 py-2 text-xs",
                        record?.status === 'Pago' ? "bg-emerald-500 text-white" : "bg-[#D946EF]/20 text-[#D946EF] border border-[#D946EF]/30"
                      )}>
                        {record?.status || 'Pendente'}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(record)} className="mt-4 w-full font-black uppercase tracking-widest rounded-xl border-slate-200">
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                  </CardContent>
                </Card>
              )) || <p className="p-12 text-center text-slate-500 font-medium">Nenhum registro encontrado</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-6 font-black uppercase text-[10px] text-slate-900 tracking-widest">Descrição</th>
                    <th className="text-left p-6 font-black uppercase text-[10px] text-slate-900 tracking-widest">Fornecedor</th>
                    <th className="text-right p-6 font-black uppercase text-[10px] text-slate-900 tracking-widest">Valor</th>
                    <th className="text-right p-6 font-black uppercase text-[10px] text-slate-900 tracking-widest">Vencimento</th>
                    <th className="text-right p-6 font-black uppercase text-[10px] text-slate-900 tracking-widest">Status</th>
                    <th className="w-20">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center">
                        <Skeleton className="h-64 w-full mx-auto rounded-[2rem]" />
                      </td>
                    </tr>
                  ) : (expenses?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-20 text-center text-slate-500 italic font-medium">Nenhum registro encontrado</td>
                    </tr>
                  ) : (
                    expenses.map((record) => (
                      <tr key={record?.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="p-6 font-bold text-slate-900">{record?.description || 'N/A'}</td>
                        <td className="p-6 text-slate-700 font-medium">{record?.suppliers?.name || 'Fornecedor não identificado'}</td>
                        <td className="p-6 text-right font-black text-2xl text-[#D946EF]">{formatPriceDisplay(parsePriceToCents(record?.amount || '0'))}</td>
                        <td className="p-6 text-right text-slate-600">{record?.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : 'N/A'}</td>
                        <td className="p-6 text-right">
                          <Badge className={cn(
                            "font-black tracking-widest px-4 py-2 text-xs uppercase rounded-xl",
                            record?.status === 'Pago' ? "bg-emerald-500 text-white shadow-md" : "bg-[#D946EF]/20 text-[#D946EF] border border-[#D946EF]/30 shadow-lg"
                          )}>
                            {record?.status || 'Pendente'}
                          </Badge>
                        </td>
                        <td className="p-6">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(record)} className="font-black uppercase tracking-widest rounded-xl text-slate-600 hover:bg-slate-100">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-[2.5rem] max-w-md bg-white shadow-2xl border-none p-0 overflow-hidden">
          <DialogHeader className="bg-[#D946EF] text-white p-8">
            <DialogTitle className="text-2xl font-black uppercase tracking-wider">
              {editId ? 'Editar Despesa' : 'Nova Conta a Pagar'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              <Label className="font-black uppercase tracking-widest text-sm text-slate-900">Descrição *</Label>
              <Input className="rounded-[2rem] h-14 shadow-md border-slate-200" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
            </div>
            <div className="space-y-4">
              <Label className="font-black uppercase tracking-widest text-sm text-slate-900">Valor (R$)</Label>
              <Input type="number" step="0.01" className="rounded-[2rem] h-14 shadow-md border-slate-200 text-right font-black text-lg text-[#D946EF]" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
            </div>
            <div className="space-y-4">
              <Label className="font-black uppercase tracking-widest text-sm text-slate-900">Vencimento</Label>
              <Input type="date" className="rounded-[2rem] h-14 shadow-md border-slate-200" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
            </div>
            <div className="space-y-4">
              <Label className="font-black uppercase tracking-widest text-sm text-slate-900">Status</Label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full h-14 p-4 rounded-[2rem] border border-slate-200 shadow-md font-black text-slate-900 bg-white"
              >
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
              </select>
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1 font-black uppercase tracking-widest rounded-[2rem] border-slate-300 h-14 shadow-lg hover:shadow-xl">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-[#D946EF] hover:bg-[#D946EF]/90 text-white font-black uppercase tracking-widest rounded-[2rem] shadow-2xl h-14 hover:shadow-3xl">
                Salvar Despesa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

