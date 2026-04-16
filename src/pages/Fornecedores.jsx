import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Truck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const Fornecedores = () => {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFornecedores() {
      const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      setFornecedores(data || []);
      setLoading(false);
    }
    fetchFornecedores();
  }, []);

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <div className="h-1.5 w-20 bg-magenta mb-3 rounded-full" />
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Fornecedores</h1>
          <p className="text-slate-500 font-medium italic">Cadastro e controle de pedidos.</p>
        </div>
        <Button className="rounded-2xl font-black shadow-lg">
          <UserPlus className="mr-2 h-4 w-4" /> Novo Fornecedor
        </Button>
      </header>

      <Card className="border-0 shadow-2xl">
        <CardHeader>
          <div className="grid md:grid-cols-4 gap-4 text-sm font-black uppercase tracking-wider text-slate-400">
            <span>Razão Social</span>
            <span>CNPJ</span>
            <span>Telefone</span>
            <span>Última Ordem</span>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {loading ? (
            <p className="p-8 text-center text-slate-400">Carregando...</p>
          ) : fornecedores.length === 0 ? (
            <p className="p-20 text-center text-slate-400 italic">Nenhum fornecedor cadastrado.</p>
          ) : (
            fornecedores.map((fornecedor) => (
              <div key={fornecedor.id} className="grid md:grid-cols-4 gap-4 items-center py-6 px-2 hover:bg-slate-50 rounded-2xl mx-2">
                <span className="font-semibold">{fornecedor.name}</span>
                <span>{fornecedor.cnpj}</span>
                <span>{fornecedor.phone}</span>
                <span className="text-slate-400 text-sm">{fornecedor.last_order || '—'}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Fornecedores;

