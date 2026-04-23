import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    try {
      const { data, error } = await supabase.from('suppliers').select('*').order('name');
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      toast.error("Erro ao carregar fornecedores.");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Você precisa estar logado.");

    try {
      // Incluímos o created_by apenas na inserção ou se necessário no update
      const payload = { 
        ...formData, 
        created_by: user.id // O ID do Clerk precisa estar mapeado como UUID no Supabase
      };

      const { error } = editingId 
        ? await supabase.from('suppliers').update(payload).eq('id', editingId)
        : await supabase.from('suppliers').insert([payload]);
      
      if (error) throw error;

      toast.success(editingId ? "Fornecedor atualizado!" : "Fornecedor cadastrado!");
      setFormData(initialForm);
      setEditingId(null);
      loadSuppliers();
    } catch (error) { 
      console.error(error);
      toast.error("Erro ao salvar: Verifique a coluna 'created_by' no Supabase.");
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name || '',
      cnpj: supplier.cnpj || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      contact_person: supplier.contact_person || '',
      address: supplier.address || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm("Deseja excluir este fornecedor?")) return;
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      toast.success("Fornecedor removido.");
      loadSuppliers();
    } catch (error) {
      toast.error("Erro ao excluir fornecedor.");
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cnpj?.includes(searchTerm)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 px-2">
      <h1 className="text-2xl font-black text-slate-900 uppercase italic">Fornecedores</h1>

      {/* Formulário */}
      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white border border-slate-100">
        <div className="bg-slate-900 py-3 px-6 flex justify-between items-center">
          <span className="text-white text-[10px] font-bold uppercase tracking-widest italic flex items-center gap-2">
            <Truck size={12} /> {editingId ? 'Editar Parceiro' : 'Novo Parceiro Vitalle'}
          </span>
          {editingId && (
            <X 
              className="text-white size-4 cursor-pointer hover:text-[#D946EF]" 
              onClick={() => {setEditingId(null); setFormData(initialForm);}} 
            />
          )}
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 italic">Razão Social / Nome</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10 font-bold" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 italic">CNPJ</Label>
                <InputMask mask="99.999.999/9999-99" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})}>
                  {(inputProps) => <Input {...inputProps} className="rounded-xl border-none bg-slate-50 h-10" />}
                </InputMask>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400 italic">Contato</Label>
                <Input value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400 italic">WhatsApp</Label>
                <InputMask mask="(99) 9 9999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}>
                  {(inputProps) => <Input {...inputProps} className="rounded-xl border-none bg-slate-50 h-10" />}
                </InputMask>
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400 italic">E-mail</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 italic">Endereço Completo</Label>
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" />
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-[#D946EF] hover:bg-[#C026D3] rounded-xl px-10 h-10 font-black uppercase italic text-[11px] shadow-lg">
                <Save className="w-3.5 h-3.5 mr-2" /> {editingId ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista / Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar fornecedor..." 
          className="pl-10 rounded-2xl border-none shadow-sm bg-white"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-0 shadow-xl rounded-[2rem] overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-black uppercase text-[9px] italic">Nome</TableHead>
              <TableHead className="font-black uppercase text-[9px] italic">CNPJ</TableHead>
              <TableHead className="font-black uppercase text-[9px] italic text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.map((s) => (
              <TableRow key={s.id} className="hover:bg-slate-50">
                <TableCell className="font-bold text-slate-700">{s.name}</TableCell>
                <TableCell className="text-slate-500 text-xs">{s.cnpj || '---'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)} className="text-blue-500"><Edit size={16}/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-red-500"><Trash2 size={16}/></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Suppliers;