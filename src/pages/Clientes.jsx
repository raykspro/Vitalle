import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Trash2, Edit, Save, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import InputMask from 'react-input-mask';

const Clientes = () => {
  const { user } = useUser();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialForm = { 
    name: '', cpf: '', phone: '', email: '', 
    cep: '', address_street: '', address_number: '', 
    address_complement: '', neighborhood: '', city: '', notes: '' 
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('name');
    setCustomers(data || []);
    setLoading(false);
  }

  const handleCepBlur = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(p => ({ ...p, address_street: data.logradouro, neighborhood: data.bairro, city: data.localidade }));
      }
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, created_by: user.id };
      const { error } = editingId 
        ? await supabase.from('customers').update(payload).eq('id', editingId)
        : await supabase.from('customers').insert(payload);
      
      if (error) throw error;
      setFormData(initialForm);
      setEditingId(null);
      loadCustomers();
    } catch (error) { alert('Erro ao salvar: ' + error.message); }
  };

  if (loading) return <div className="p-12 font-black italic animate-pulse text-[#D946EF] text-center">SINCRONIZANDO...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <header className="flex items-center justify-between px-2">
        <div>
          <div className="h-1 w-8 bg-[#D946EF] mb-2 rounded-full" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Clientes</h1>
        </div>
      </header>

      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white border border-slate-100">
        <div className="bg-slate-900 py-3 px-6 flex justify-between items-center">
          <span className="text-white text-[10px] font-bold uppercase tracking-widest italic">
            {editingId ? 'Editando Registro' : 'Novo Cadastro'}
          </span>
          {editingId && <X className="text-white size-4 cursor-pointer" onClick={() => {setEditingId(null); setFormData(initialForm);}} />}
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">CPF</Label>
                <InputMask mask="999.999.999-99" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})}>
                  {(inputProps) => <Input {...inputProps} className="rounded-xl border-none bg-slate-50 h-10" placeholder="000.000.000-00" />}
                </InputMask>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp</Label>
                <InputMask mask="(99) 9 9999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}>
                  {(inputProps) => <Input {...inputProps} className="rounded-xl border-none bg-slate-50 h-10" placeholder="(00) 0 0000-0000" />}
                </InputMask>
              </div>
            </div>

            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="md:col-span-1">
                <Label className="text-[9px] font-bold uppercase text-slate-400">CEP</Label>
                <InputMask mask="99999-999" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} onBlur={handleCepBlur}>
                  {(inputProps) => <Input {...inputProps} className="h-9 rounded-lg border-slate-200 bg-white" />}
                </InputMask>
              </div>
              <div className="md:col-span-3">
                <Label className="text-[9px] font-bold uppercase text-slate-400">Rua</Label>
                <Input value={formData.address_street} onChange={e => setFormData({...formData, address_street: e.target.value})} className="h-9 rounded-lg border-slate-200 bg-white" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-[9px] font-bold uppercase text-slate-400">Nº / Comp</Label>
                <Input value={formData.address_number} onChange={e => setFormData({...formData, address_number: e.target.value})} className="h-9 rounded-lg border-slate-200 bg-white" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="bg-[#D946EF] hover:bg-[#C026D3] rounded-xl px-10 h-10 font-black uppercase italic text-[11px] shadow-md shadow-purple-100 w-fit">
                <Save className="w-3.5 h-3.5 mr-2" /> {editingId ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden border border-slate-100">
        <div className="p-4 bg-white border-b flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">Clientes</h3>
            <div className="relative w-40">
              <Search className="absolute left-3 top-2 text-slate-300" size={12} />
              <Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 rounded-full bg-slate-50 border-none text-[10px]" />
            </div>
        </div>
        <Table>
          <TableBody>
            {customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((c) => (
              <TableRow key={c.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="py-3">
                  <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                  <p className="text-[10px] text-[#D946EF] font-medium uppercase italic">{c.phone}</p>
                </TableCell>
                <TableCell className="text-right py-3">
                  <Button size="icon" variant="ghost" onClick={() => {setEditingId(c.id); setFormData(c); window.scrollTo(0,0);}} className="h-8 w-8 text-slate-300 hover:text-[#D946EF]"><Edit size={14}/></Button>
                  <Button size="icon" variant="ghost" onClick={async () => {if(confirm('Remover?')){await supabase.from('customers').delete().eq('id', c.id); loadCustomers();}}} className="h-8 w-8 text-slate-300 hover:text-red-500"><Trash2 size={14}/></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Clientes;