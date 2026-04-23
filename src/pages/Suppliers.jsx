import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Search, Trash2, Edit, Save, Truck, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import InputMask from 'react-input-mask';
import { toast } from "sonner";

const Suppliers = () => {
  const { user } = useUser();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialForm = { name: '', cnpj: '', phone: '', email: '', contact_person: '', address: '' };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { loadSuppliers(); }, []);

  async function loadSuppliers() {
    setLoading(true);
    const { data } = await supabase.from('suppliers').select('*').order('name');
    setSuppliers(data || []);
    setLoading(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, created_by: user.id }; // Agora com suporte no SQL
      const { error } = editingId 
        ? await supabase.from('suppliers').update(payload).eq('id', editingId)
        : await supabase.from('suppliers').insert([payload]);
      
      if (error) throw error;
      toast.success("Fornecedor cadastrado!");
      setFormData(initialForm);
      setEditingId(null);
      loadSuppliers();
    } catch (error) { 
      toast.error("Erro ao salvar: Verifique a coluna 'created_by' no Supabase.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 px-2">
      <h1 className="text-2xl font-black text-slate-900 uppercase italic">Fornecedores</h1>

      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
        <div className="bg-slate-900 py-3 px-6 flex justify-between items-center">
          <span className="text-white text-[10px] font-bold uppercase tracking-widest italic flex items-center gap-2">
            <Truck size={12} /> {editingId ? 'Editar Parceiro' : 'Novo Parceiro Vitalle'}
          </span>
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">Razão Social / Nome</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400">CNPJ</Label>
                <InputMask mask="99.999.999/9999-99" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})}>
                  {(inputProps) => <Input {...inputProps} className="rounded-xl border-none bg-slate-50 h-10" />}
                </InputMask>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400">Pessoa de Contato</Label>
                <Input value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400">WhatsApp / Fone</Label>
                <InputMask mask="(99) 9 9999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}>
                  {(inputProps) => <Input {...inputProps} className="rounded-xl border-none bg-slate-50 h-10" />}
                </InputMask>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400">E-mail</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400">Endereço Completo</Label>
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" />
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-[#D946EF] hover:bg-[#C026D3] rounded-xl px-10 h-10 font-black uppercase italic text-[11px]">
                <Save className="w-3.5 h-3.5 mr-2" /> Cadastrar Fornecedor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Suppliers;