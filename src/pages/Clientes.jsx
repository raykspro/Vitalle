import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientes() {
      const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      setClientes(data || []);
      setLoading(false);
    }
    fetchClientes();
  }, []);

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <div className="h-1.5 w-20 bg-magenta mb-3 rounded-full" />
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Clientes</h1>
          <p className="text-slate-500 font-medium italic">Cadastro e histórico.</p>
        </div>
        <Button className="rounded-2xl font-black shadow-lg">
          <UserPlus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </header>

      <Card className="border-0 shadow-2xl">
        <CardHeader>
          <div className="grid md:grid-cols-4 gap-4 text-sm font-black uppercase tracking-wider text-slate-400">
            <span>Nome</span>
            <span>CPF/CNPJ</span>
            <span>Telefone</span>
            <span>Última Compra</span>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {loading ? (
            <p className="p-8 text-center text-slate-400">Carregando...</p>
          ) : clientes.length === 0 ? (
            <p className="p-20 text-center text-slate-400 italic">Nenhum cliente cadastrado.</p>
          ) : (
            clientes.map((cliente) => (
              <div key={cliente.id} className="grid md:grid-cols-4 gap-4 items-center py-6 px-2 hover:bg-slate-50 rounded-2xl mx-2">
                <span className="font-semibold">{cliente.name}</span>
                <span>{cliente.document}</span>
                <span>{cliente.phone}</span>
                <span className="text-slate-400 text-sm">{cliente.last_purchase || '—'}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clientes;

