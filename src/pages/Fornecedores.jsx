import React, { useState } from 'react';
import { Truck, UserPlus, X, Phone, Mail, MapPin, Edit3, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSuppliers } from '../hooks/useSuppliers.jsx';

// Máscara Blindada de Telefone
const maskPhone = (value) => {
  if (!value) return "";
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const Fornecedores = () => {
  const { suppliers, loading, addSupplier, updateSupplier } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    cnpj: '', 
    phone: '', 
    email: '', 
    contact_person: '', 
    address: '', 
    notes: '' 
  });

  const resetForm = () => {
    setFormData({ name: '', cnpj: '', phone: '', email: '', contact_person: '', address: '', notes: '' });
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = editId 
      ? await updateSupplier(editId, formData) 
      : await addSupplier(formData);
    
    if (res?.error) {
      alert(res.error);
    } else {
      resetForm();
    }
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
          <p className="text-slate-500 font-medium italic">Cadastro e controle de pedidos da Vitalle.</p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <button className="btn-vitalle flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> Novo Fornecedor
            </button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl p-0 rounded-3xl bg-zinc-950 border-zinc-800 text-white overflow-hidden">
            <DialogHeader className="p-8 pb-6 border-b border-white/5">
              <DialogTitle className="text-2xl font-black italic uppercase tracking-widest text-magenta">
                {editId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome / Razão Social *</Label>
                  <Input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="bg-white/5 border-white/10 h-12 text-white placeholder:text-slate-600 focus:border-magenta" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">CNPJ</Label>
                  <Input 
                    value={formData.cnpj} 
                    onChange={e => setFormData({...formData, cnpj: e.target.value})} 
                    className="bg-white/5 border-white/10 h-12 text-white" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Telefone</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} 
                    className="bg-white/5 border-white/10 h-12 text-white"
                    placeholder="(00) 0 0000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">E-mail</Label>
                  <Input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="bg-white/5 border-white/10 h-12 text-white" 
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-blue-400">Endereço Completo</Label>
                  <Input 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    className="bg-white/5 border-white/10 h-12 text-white" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Observações Internas</Label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full h-24 p-4 bg-white/5 border border-white/10 rounded-2xl text-white resize-none focus:outline-none focus:border-magenta transition-colors" 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="flex-1 h-14 font-black uppercase tracking-widest text-[11px] border border-white/10 rounded-2xl hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 h-14 bg-magenta text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-[0_0_20px_rgba(255,0,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {editId ? 'Atualizar Dados' : 'Cadastrar Fornecedor'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="border-0 shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="grid md:grid-cols-4 gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span>Fornecedor</span>
            <span>Documento (CNPJ)</span>
            <span>Contato</span>
            <span className="text-right">Ações</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center"><p className="animate-pulse font-black text-slate-300">SINCRONIZANDO VITALLE...</p></div>
          ) : suppliers.length === 0 ? (
            <p className="p-20 text-center text-slate-300 italic font-medium">Nenhum fornecedor na base de dados.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {suppliers.map((fornecedor) => (
                <div key={fornecedor.id} className="grid md:grid-cols-4 gap-4 items-center py-6 px-8 hover:bg-slate-50/80 transition-colors group">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 group-hover:text-magenta transition-colors">{fornecedor.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{fornecedor.contact_person || 'Sem contato definido'}</span>
                  </div>
                  <span className="text-sm font-mono text-slate-500">{fornecedor.cnpj || '---'}</span>
                  <span className="text-sm font-bold text-slate-700">{fornecedor.phone || '---'}</span>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleEdit(fornecedor)}
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

export default Fornecedores;