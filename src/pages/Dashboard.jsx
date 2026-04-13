import React from "react";

export default function Dashboard({ userRole, totalContasAPagar }) {
  const hideSensitiveData = userRole === 'vendedor';
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 text-black">
      <div className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-lg shadow-lg">
<h1 className="text-5xl font-extrabold text-center text-black">
          Dashboard
        </h1>
{!hideSensitiveData && (
  <div className="w-full max-w-4xl p-4 bg-blue-100 rounded-lg shadow-md">
    <h2 className="text-2xl font-bold">Total a Pagar</h2>
    <p className="text-lg">R$ {totalContasAPagar.toFixed(2)}</p>
  </div>
)}
        <p className="text-center text-lg text-gray-700">
          Bem-vindo ao painel! Aqui você pode gerenciar suas informações.
        </p>
      </div>
    </div>
  );
}