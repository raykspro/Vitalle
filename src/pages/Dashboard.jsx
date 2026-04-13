import React from "react";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 text-black">
      <div className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-5xl font-extrabold text-center text-black">
          Dashboard
        </h1>
        <p className="text-center text-lg text-gray-700">
          Bem-vindo ao painel! Aqui você pode gerenciar suas informações.
        </p>
      </div>
    </div>
  );
}