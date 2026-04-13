import React from "react";

export default function Customers() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 text-black">
      <div className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-5xl font-extrabold text-center text-black">
          Clientes
        </h1>
        <p className="text-center text-lg text-gray-700">
          Aqui você pode visualizar e gerenciar seus clientes.
        </p>
      </div>
    </div>
  );
}