import React, { useState } from 'react';
import { Users, UserPlus, X, Phone, Mail, MapPin, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCustomers } from '../hooks/useCustomers.jsx';

const Clientes = () => {
  const { customers, loading, addCustomer, updateCustomer } = useCustomers();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
const [formData, setFormData] = useState({ name: '', email: '', cpf: '', address: '', city: '', state: '', observations: '' });

  const resetForm = () => {
    setFormData({ name: '', email: '', cpf: '', address: '', city: '', state: '', observations: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      const res = await updateCustomer(editId, formData);
      if (res.error) alert(res.error);
    } else {
      const res = await addCustomer(formData);
      if (res.error) alert(res.error);
    }
    resetForm();
  };

  const handleEdit = (cliente) => {
    setFormData({
      name: cliente.name || '',
      email: cliente.email || '',
      cpf: cliente.cpf || '',
      address: cliente.address || '',
      city: cliente.city || '',
      state: cliente.state || '',
      observations: cliente.observations || ''
    });
    setEditId(cliente.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <div className="h-1.5 w-20 bg-magenta mb-3 rounded-full" />
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Clientes</h1>
          <p className="text-slate-500 font-medium italic">Cadastro e histórico.</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl font-black shadow-lg">
              <UserPlus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl p-0 rounded-3xl bg-white z-[9999] shadow-2xl">
            <DialogHeader className="p-8 pb-6">
              <DialogTitle className="text-2xl font-black">
                {editId ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-black uppercase mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Nome *
                  </Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12" />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-sm font-black uppercase mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> E-mail
                  </Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12" />
                </div>
                <div>
                  <Label className="text-sm font-black uppercase mb-2 flex items-center gap-2">
                    CPF *
                  </Label>
                  <Input value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} className="h-12" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-black uppercase mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Endereço
                  </Label>
                  <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-12" />
                </div>
                <div>
                  <Label className="text-sm font-black uppercase mb-2">Cidade</Label>
                  <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="h-12" />
                </div>
                <div>
                  <Label className="text-sm font-black uppercase mb-2">Estado</Label>
                  <Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="h-12" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-black uppercase mb-2">Observações</Label>
<textarea value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} className="w-full h-24 p-4 border border-slate-200 rounded-2xl resize-vertical" />
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 h-14 font-black rounded-2xl">
                  <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button type="submit" className="flex-1 h-14 font-black bg-magenta text-white rounded-2xl shadow-lg">
                  {editId ? <Edit3 className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {editId ? 'Atualizar' : 'Criar Cliente'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="border-0 shadow-2xl">
        <CardHeader>
          <div className="grid md:grid-cols-4 gap-4 text-sm font-black uppercase tracking-wider text-slate-400">
            <span>Nome</span>
            <span>CPF</span>
            <span>Telefone</span>
            <span>Ações</span>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {loading ? (
            <p className="p-8 text-center text-slate-400">Carregando...</p>
          ) : customers.length === 0 ? (
            <p className="p-20 text-center text-slate-400 italic">Nenhum cliente cadastrado.</p>
          ) : (
            customers.map((cliente) => (
              <div key={cliente.id} className="grid md:grid-cols-4 gap-4 items-center py-6 px-2 hover:bg-slate-50 rounded-2xl mx-2">
                <span className="font-semibold">{cliente.name}</span>
                <span>{cliente.cpf}</span>
                <span>{cliente.phone}</span>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(cliente)}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clientes;

