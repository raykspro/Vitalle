import React, { useState } from 'react';
import { Truck, UserPlus, X, Phone, Mail, MapPin, Edit3, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSuppliers } from '../hooks/useSuppliers.jsx';

const Fornecedores = () => {
  const { suppliers, loading, addSupplier, updateSupplier } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', cnpj: '', phone: '', email: '', contact_person: '', address: '', notes: '' });

  const resetForm = () => {
    setFormData({ name: '', cnpj: '', phone: '', email: '', contact_person: '', address: '', notes: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      const res = await updateSupplier(editId, formData);
      if (res.error) alert(res.error);
    } else {
      const res = await addSupplier(formData);
      if (res.error) alert(res.error);
    }
    resetForm();
  };

  const handleEdit = (fornecedor) => {
    setFormData({
      name: fornecedor.name || '',
      cnpj: fornecedor.cnpj || '',
      phone: fornecedor.phone || '',
      email: fornecedor.email || '',
      contact_person: fornecedor.contact_person || '',
      address: fornecedor.address || '',
      notes: fornecedor.notes || ''
    });
    setEditId(fornecedor.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <div className="h-1.5 w-20 bg-magenta mb-3 rounded-full" />
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Fornecedores</h1>
          <p className="text-slate-500 font-medium italic">Cadastro e controle de pedidos.</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl font-black shadow-lg">
              <UserPlus className="mr-2 h-4 w-4" /> Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl p-0 rounded-3xl">
            <DialogHeader className="p-8 pb-6">
              <DialogTitle className="text-2xl font-black">
                {editId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-black uppercase mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" /> Nome / Razão Social *
                  </Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12" />
                </div>
                <div>
                  <Label className="text-sm font-black uppercase mb-2 flex items-center gap-2">
                    CNPJ *
                  </Label>
                  <Input value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="h-12" />
                </div>
                <div>
                  <Label className="text-sm font-black uppercase mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Telefone
                  </Label>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12" />
                </div>
                <div>
                  <Label className="text-sm font-black uppercase mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> E-mail
                  </Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12" />
                </div>
                <div>
                  <Label className="text-sm font-black uppercase mb-2 flex items-center gap-2">
                    Pessoa de Contato
                  </Label>
                  <Input value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="h-12" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-black uppercase mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Endereço
                  </Label>
                  <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-12" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-black uppercase mb-2">Observações</Label>
                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full h-24 p-4 border border-slate-200 rounded-2xl resize-vertical" />
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={resetForm} className="flex-1 h-14 font-black rounded-2xl">
                  <X className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <Button type="submit" className="flex-1 h-14 font-black bg-magenta text-white rounded-2xl shadow-lg">
                  {editId ? <Edit3 className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {editId ? 'Atualizar' : 'Criar Fornecedor'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="border-0 shadow-2xl">
        <CardHeader>
          <div className="grid md:grid-cols-4 gap-4 text-sm font-black uppercase tracking-wider text-slate-400">
            <span>Razão Social</span>
            <span>CNPJ</span>
            <span>Telefone</span>
            <span>Ações</span>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {loading ? (
            <p className="p-8 text-center text-slate-400">Carregando...</p>
          ) : suppliers.length === 0 ? (
            <p className="p-20 text-center text-slate-400 italic">Nenhum fornecedor cadastrado.</p>
          ) : (
            suppliers.map((fornecedor) => (
              <div key={fornecedor.id} className="grid md:grid-cols-4 gap-4 items-center py-6 px-2 hover:bg-slate-50 rounded-2xl mx-2">
                <span className="font-semibold">{fornecedor.name}</span>
                <span>{fornecedor.cnpj}</span>
                <span>{fornecedor.phone}</span>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(fornecedor)}>
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

export default Fornecedores;

