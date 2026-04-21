import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Trash2, Edit, Save, Truck, X } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import InputMask from 'react-input-mask';

const Suppliers = () => {
  const { user } = useUser();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const initialForm = { 
    name: '', cnpj: '', phone: '', email: '', 
    contact_person: '', address: '', notes: '' 
  };
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
      const payload = { ...formData, created_by: user.id };
      const { error } = editingId 
        ? await supabase.from('suppliers').update(payload).eq('id', editingId)
        : await supabase.from('suppliers').insert(payload);
      
      if (error) throw error;
      setFormData(initialForm);
      setEditingId(null);
      loadSuppliers();
    } catch (error) { alert('Error: ' + error.message); }
  };

  if (loading) return <div className="p-12 font-black italic animate-pulse text-[#D946EF] text-center">LOADING PARTNERS...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <header className="flex items-center justify-between px-2">
        <div>
          <div className="h-1 w-8 bg-[#D946EF] mb-2 rounded-full" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic text-magenta">Suppliers</h1>
        </div>
      </header>

      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white border border-slate-100">
        <div className="bg-slate-900 py-3 px-6 flex justify-between items-center">
          <span className="text-white text-[10px] font-bold uppercase tracking-widest italic flex items-center gap-2">
            <Truck size={12} /> {editingId ? 'Edit Supplier' : 'New Partner'}
          </span>
          {editingId && <X className="text-white size-4 cursor-pointer hover:text-red-400" onClick={() => {setEditingId(null); setFormData(initialForm);}} />}
        </div>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Company / Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" required />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">CNPJ</Label>
                <InputMask mask="99.999.999/9999-99" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})}>
                  {(inputProps) => <Input {...inputProps} className="rounded-xl border-none bg-slate-50 h-10" placeholder="00.000.000/0000-00" />}
                </InputMask>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Contact Person</Label>
                <Input value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp / Phone</Label>
                <InputMask mask="(99) 9 9999-9999" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}>
                  {(inputProps) => <Input {...inputProps} className="rounded-xl border-none bg-slate-50 h-10" placeholder="(00) 0 0000-0000" />}
                </InputMask>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" />
              </div>
            </div>

            <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Address</Label>
                <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-xl border-none bg-slate-50 h-10" />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="bg-[#D946EF] hover:bg-[#C026D3] rounded-xl px-10 h-10 font-black uppercase italic text-[11px] shadow-md shadow-purple-100 w-fit">
                <Save className="w-3.5 h-3.5 mr-2" /> {editingId ? 'Update Data' : 'Register Supplier'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden border border-slate-100">
        <div className="p-4 bg-white border-b flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase italic text-slate-400 tracking-widest">Business Partners</h3>
            <div className="relative w-40">
              <Search className="absolute left-3 top-2 text-slate-300" size={12} />
              <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 rounded-full bg-slate-50 border-none text-[10px]" />
            </div>
        </div>
        <Table>
          <TableBody>
            {suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((s) => (
              <TableRow key={s.id} className="hover:bg-slate-50/50 border-slate-50">
                <TableCell className="py-3">
                  <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">{s.contact_person || 'VITALLE PARTNER'}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-slate-500 font-mono">{s.cnpj}</TableCell>
                <TableCell className="text-right py-3">
                  <Button size="icon" variant="ghost" onClick={() => {setEditingId(s.id); setFormData(s); window.scrollTo(0,0);}} className="h-8 w-8 text-slate-300 hover:text-[#D946EF]"><Edit size={14}/></Button>
                  <Button size="icon" variant="ghost" onClick={async () => {if(confirm('Remove supplier?')){await supabase.from('suppliers').delete().eq('id', s.id); loadSuppliers();}}} className="h-8 w-8 text-slate-300 hover:text-red-500"><Trash2 size={14}/></Button>
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
