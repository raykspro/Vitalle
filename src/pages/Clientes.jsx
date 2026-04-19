import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Plus, Search, Trash2, Upload, Edit } from 'lucide-react';
import { useSupabaseClient } from '../hooks/useSupabase';
import { useUser } from '@clerk/clerk-react';

const Clientes = () => {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const { data } = await supabase.from('customers').select('*').order('name');
      setCustomers(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('customers')
          .update({ ...formData })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('customers')
          .insert({ ...formData, created_by: user.id });
        if (error) throw error;
      }
      setFormData({ name: '', phone: '', email: '', notes: '' });
      setEditingId(null);
      loadCustomers();
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setFormData(customer);
  };

  const handleDelete = async (id) => {
    if (confirm('Confirma exclusão?')) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (!error) loadCustomers();
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    
    try {
      setUploadProgress(0);
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `customers/${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('customers')
        .upload(filePath, uploadFile, {
          upsert: true,
          onUploadProgress: (progress) => setUploadProgress(progress)
        });
      
      if (error) throw error;
      alert('Upload concluído!');
      setUploadFile(null);
      setUploadProgress(0);
    } catch (error) {
      alert('Erro no upload: ' + error.message);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-10">
      <header>
        <div className="h-1.5 w-20 bg-[#D946EF] mb-3 rounded-full" />
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Clientes</h1>
        <p className="text-slate-500 font-medium italic">Gerencie sua base de clientes VIP.</p>
      </header>

      {/* Search */}
      <div>
        <Input 
          placeholder="Pesquisar por nome ou telefone..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-[2.5rem] shadow-xl max-w-md"
        />
      </div>

      {/* Upload Image */}
      <Card className="border-0 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="h-5 w-5 text-[#D946EF]" />
            <h3 className="font-black text-lg">Upload Foto Cliente</h3>
          </div>
          <div className="flex gap-3">
            <Input 
              type="file" 
              accept="image/*"
              onChange={(e) => setUploadFile(e.target.files[0])}
              className="rounded-[2.5rem] flex-1"
            />
            <Button onClick={handleUpload} className="rounded-[2.5rem] bg-[#D946EF]" disabled={!uploadFile}>
              {uploadProgress > 0 ? `${uploadProgress}%` : 'Upload'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card className="border-0 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-black uppercase tracking-tight">
            {editingId ? 'Editar Cliente' : 'Novo Cliente'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="rounded-[2.5rem]"
                  required
                />
              </div>
              <div>
                <Label>Telefone/WhatsApp</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="rounded-[2.5rem]"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="rounded-[2.5rem]"
                />
              </div>
              <div>
                <Label>Notas</Label>
                <Input 
                  value={formData.notes} 
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="rounded-[2.5rem]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1 rounded-[2.5rem] bg-[#D946EF] shadow-xl">
                {editingId ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {editingId ? 'Atualizar' : 'Salvar Cliente'}
              </Button>
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {setEditingId(null); setFormData({ name: '', phone: '', email: '', notes: '' });}}
                  className="rounded-[2.5rem]"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-2xl overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-black uppercase tracking-tight">Lista de Clientes ({filteredCustomers.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="text-slate-500">{customer.email || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(customer)}
                        className="rounded-[2.5rem] h-8"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(customer.id)}
                        className="rounded-[2.5rem] h-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredCustomers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clientes;

