import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Search, Trash2, Edit, Save, UserPlus, X } from 'lucide-react';
import InputMask from 'react-input-mask';
import { toast } from "sonner";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialForm = { 
    name: '', cpf: '', whatsapp: '', 
    cep: '', street: '', address_number: '', address_complement: '' 
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('name');
    setCustomers(data || []);
    setLoading(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = editingId 
        ? await supabase.from('customers').update(formData).eq('id', editingId)
        : await supabase.from('customers').insert([formData]);
      
      if (error) throw error;
      toast.success("Cliente salvo com sucesso!");
      setFormData(initialForm);
      setEditingId(null);
      loadCustomers();
    } catch (error) { 
      toast.error("Erro ao salvar: Verifique as colunas de endereço no Supabase.");
    }
  };

  if (loading) return <div className="p-12 font-black italic animate-pulse text-[#D946EF] text-center">CARREGANDO CLIENTES...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <h1 className="text-2xl font-black text-slate-900 uppercase italic px-2">Clientes</h1>

      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white border border-slate-100">
        <div className="bg-slate-900 py-3 px-6 flex justify-between items-center">
          <span className="text-white text-[10px] font-bold uppercase tracking-widest italic flex items-center gap-2">
            <UserPlus size={12} /> {editingId ? 'Editar Cadastro' : 'Novo Cadastro Vitalle'}
          </span>
          {editingId && <X className="text-white size-4 cursor-pointer" onClick={() => {setEditingId(null); setFormData(initialForm);}} />}
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 border-r border-slate-50 pr-4">
                <Label className="text-[10px] font-black uppercase text-slate-400">Nome Completo</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" required />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400">CPF</Label>
                <InputMask mask="999.999.999-99" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})}>
                  {(inputProps) => <Input {...inputProps} className="rounded-xl border-none bg-slate-50 h-10" />}
                </InputMask>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400">WhatsApp</Label>
                <InputMask mask="(99) 9 9999-9999" value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})}>
                  {(inputProps) => <Input {...inputProps} className="rounded-xl border-none bg-slate-50 h-10" />}
                </InputMask>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400">CEP</Label>
                <InputMask mask="99999-000" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})}>
                  {(inputProps) => <Input {...inputProps} className="rounded-xl border-none bg-slate-50 h-10" />}
                </InputMask>
              </div>
              <div className="md:col-span-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Rua / Logradouro</Label>
                <Input value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400">Nº / Complemento</Label>
                <Input value={formData.address_number} onChange={e => setFormData({...formData, address_number: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-[#D946EF] hover:bg-[#C026D3] rounded-xl px-10 h-10 font-black uppercase italic text-[11px]">
                <Save className="w-3.5 h-3.5 mr-2" /> Salvar Cliente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Tabela de clientes omitida para brevidade, mas segue o mesmo padrão */}
    </div>
  );
};

export default Customers;