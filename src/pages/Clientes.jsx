import React, { useState } from 'react';
import { Users, UserPlus, X, Phone, Mail, MapPin, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCustomers } from '../hooks/useCustomers.jsx';

// Máscaras de Precisão
const maskCpf = (value) => {
  if (!value) return "";
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value) => {
  if (!value) return "";
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const Clientes = () => {
  const { customers, loading, addCustomer, updateCustomer } = useCustomers();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    cpf: '', 
    phone: '', 
    address: '', 
    city: '', 
    state: '', 
    observations: '' 
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', cpf: '', phone: '', address: '', city: '', state: '', observations: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = editId 
      ? await updateCustomer(editId, formData) 
      : await addCustomer(formData);
    
    if (res?.error) {
      alert(res.error);
    } else {
      resetForm();
    }
  };

  const handleEdit = (cliente) => {
    setFormData({
      name: cliente.name || '',
      email: cliente.email || '',
      cpf: cliente.cpf || '',
      phone: cliente.phone || '',
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase tracking-tighter">Clientes</h1>
          <p className="text-slate-500 font-medium italic">Gestão de público Vitalle Exclusive.</p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <button className="btn-vitalle flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Novo Cliente
            </button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl p-0 rounded-3xl bg-zinc-950 border-zinc-800 text-white overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <DialogHeader className="p-8 pb-6 border-b border-white/5">
              <DialogTitle className="text-2xl font-black italic uppercase tracking-widest text-magenta">
                {editId ? 'Editar Registro' : 'Novo Registro'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Users className="h-3 w-3" /> Nome Completo *
                  </Label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="bg-white/5 border-white/10 h-12 text-white placeholder:text-slate-600 focus:border-magenta transition-all" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Mail className="h-3 w-3" /> E-mail
                  </Label>
                  <Input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="bg-white/5 border-white/10 h-12 text-white" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">CPF *</Label>
                  <Input 
                    required
                    value={formData.cpf} 
                    onChange={e => setFormData({...formData, cpf: maskCpf(e.target.value)})} 
                    className="bg-white/5 border-white/10 h-12 text-white"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Phone className="h-3 w-3" /> WhatsApp / Telefone
                  </Label>
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} 
                    className="bg-white/5 border-white/10 h-12 text-white font-mono"
                    placeholder="(00) 0 0000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cidade</Label>
                  <Input 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                    className="bg-white/5 border-white/10 h-12 text-white" 
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Endereço</Label>
                  <Input 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    className="bg-white/5 border-white/10 h-12 text-white" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Observações (Gostos, Tamanhos, etc)</Label>
                <textarea 
                  value={formData.observations} 
                  onChange={e => setFormData({...formData, observations: e.target.value})} 
                  className="w-full h-24 p-4 bg-white/5 border border-white/10 rounded-2xl text-white resize-none focus:border-magenta outline-none transition-all" 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="flex-1 h-14 font-black uppercase tracking-widest text-[11px] border border-white/10 rounded-2xl hover:bg-white/5 transition-all"
                >
                  Sair
                </button>
                <button 
                  type="submit" 
                  className="flex-1 h-14 bg-magenta text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {editId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="border-0 shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="grid md:grid-cols-4 gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">
            <span>Cliente</span>
            <span>Documento</span>
            <span>WhatsApp</span>
            <span className="text-right">Ações</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center"><p className="animate-pulse font-black text-slate-300">CARREGANDO BASE VITALLE...</p></div>
          ) : customers.length === 0 ? (
            <p className="p-20 text-center text-slate-300 italic font-medium">Nenhuma cliente cadastrada ainda.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {customers.map((cliente) => (
                <div key={cliente.id} className="grid md:grid-cols-4 gap-4 items-center py-6 px-8 hover:bg-slate-50/80 transition-colors group">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 group-hover:text-magenta transition-colors">{cliente.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium lowercase">{cliente.email || 'sem email'}</span>
                  </div>
                  <span className="text-sm font-mono text-slate-500">{cliente.cpf || '---'}</span>
                  <span className="text-sm font-bold text-slate-700">{cliente.phone || '---'}</span>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleEdit(cliente)}
                      className="p-3 hover:bg-magenta hover:text-white rounded-xl transition-all text-slate-400"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clientes;