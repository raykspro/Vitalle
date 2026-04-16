import React from 'react';
import { Settings, Shield, Database, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@clerk/clerk-react';

const Configuracoes = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'vendedor';

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <Shield className="h-12 w-12 mb-4 text-magenta" />
        <h2 className="text-xl font-black tracking-widest uppercase mb-2">Acesso Restrito ao Mestre</h2>
        <p className="text-sm text-center max-w-md">Configurações disponíveis apenas para administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <div className="h-1.5 w-20 bg-magenta mb-3 rounded-full" />
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Configurações</h1>
        <p className="text-slate-500 font-medium italic">Sistema e integrações.</p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-black text-magenta mb-2">
              <Database className="h-8 w-8" />
              Supabase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">Integração ativa com banco de dados.</p>
            <Button className="w-full rounded-xl font-black" variant="outline">Ver Status</Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-black text-magenta mb-2">
              <Globe className="h-8 w-8" />
              PWA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">Instalável</span>
              <Switch defaultChecked />
            </div>
            <Button className="w-full rounded-xl font-black" variant="outline">Configurar Manifest</Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl font-black text-magenta mb-2">
              <Settings className="h-8 w-8" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full rounded-xl font-black bg-magenta text-white hover:bg-magenta/90">Gerenciar Roles</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Configuracoes;

