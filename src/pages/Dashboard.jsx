import { useState } from "react";
import { useUser } from '@clerk/clerk-react';

export default function Dashboard() {
  const { user } = useUser();
  const [loading] = useState(false);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FDFBF7] font-black text-[#d946ef]">INICIALIZANDO VITALLE...</div>;

  return (
    <div className="h-screen flex items-center justify-center bg-[#FDFBF7]">
      <h1 className="text-4xl md:text-6xl font-black text-[#d946ef] p-12 text-center tracking-tight">
        TESTE VITALLE - DASHBOARD OK
        <br />
        <span className="text-2xl text-black font-normal mt-4 block">
          User: {user?.username || 'Carregando...'}
        </span>
      </h1>
    </div>
  );
}
