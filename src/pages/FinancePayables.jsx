import React from 'react';
import { DollarSign, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPriceDisplay, parsePriceToCents, addCents } from '@/lib/formatters';
import { useUser } from '@clerk/clerk-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useExpenses } from '../hooks/useExpenses.jsx';

const FinancePayables = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'vendedor';
  const { expenses, loading, addExpense, updateExpense } = useExpenses();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ description: '', amount: '', due_date: '', status: 'Pendente' });

  const pendingTotal = addCents(...expenses.filter(r => r.status === 'Pendente').map(r => parsePriceToCents(r.amount)));
  const paidTotal = addCents(...expenses.filter(r => r.status === 'Pago').map(r => parsePriceToCents(r.amount)));

  const resetForm = () => {
    setFormData({ description: '', amount: '', due_date: '', status: 'Pendente' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const expenseData = {
      description: formData.description,
      amount: parseFloat(formData.amount) || 0,
      due_date: formData.due_date,
      status: formData.status
    };
    if (editId) {
      const res = await updateExpense(editId, expenseData);
      if (res.error) alert(res.error);
    } else {
      const res = await addExpense(expenseData);
      if (res.error) alert(res.error);
    }
    resetForm();
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="h-12 w-12 mb-4 text-magenta" />
        <h2 className="text-2xl font-black uppercase tracking-wider">Acesso Restrito</h2>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <div className="h-1.5 w-20 bg-magenta mb-3 rounded-full" />
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Contas a Pagar</h1>
          <p className="text-slate-500 font-medium italic">Controle de obrigações filtradas por status.</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl font-black shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Nova Despesa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Conta a Pagar</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <Label>Valor</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1">Cancelar</Button>
                <Button type="submit" className="flex-1 bg-magenta text-white">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="p-20 text-center text-slate-400 italic">Nenhuma conta a pagar encontrada.</TableCell>
              </TableRow>
            ) : (
              expenses.map((record) => (
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

