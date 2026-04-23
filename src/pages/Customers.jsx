import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (!error) setCustomers(data || []);
    setLoading(false);
  }

  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({ ...prev, street: data.logradouro }));
          toast.info("Endereço localizado!");
        }
      } catch (err) { console.error("Erro CEP"); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = editingId 
        ? await supabase.from('customers').update(formData).eq('id', editingId)
        : await supabase.from('customers').insert([formData]);
      
      if (error) throw error;
      
      toast.success("Cliente salvo!");
      setFormData(initialForm);
      setEditingId(null);
      setSearchTerm(''); // Limpa busca para mostrar o novo item
      loadCustomers(); // Força recarregamento da lista
    } catch (error) { 
      toast.error("Erro ao salvar no banco.");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf?.includes(searchTerm)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <h1 className="text-2xl font-black text-slate-900 uppercase italic px-2">Clientes</h1>

      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white border border-slate-100">
        <div className="bg-slate-900 py-3 px-6 flex justify-between items-center">
          <span className="text-white text-[10px] font-bold uppercase tracking-widest italic flex items-center gap-2">
            <UserPlus size={12} /> {editingId ? 'Editar Cadastro' : 'Novo Cadastro Vitalle'}
          </span>
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
                <InputMask mask="99999-000" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} onBlur={handleCepBlur}>
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

      {/* BARRA DE BUSCA E TABELA */}
      <div className="px-2">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Buscar por nome ou CPF..." className="pl-10 rounded-2xl border-none bg-white shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-black uppercase text-[9px] italic">Cliente</TableHead>
                <TableHead className="font-black uppercase text-[9px] italic">WhatsApp</TableHead>
                <TableHead className="font-black uppercase text-[9px] italic text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-bold">{c.name}</TableCell>
                  <TableCell className="text-slate-500 text-xs">{c.whatsapp}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => {setEditingId(c.id); setFormData(c);}} className="text-blue-500"><Edit size={16}/></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Customers;