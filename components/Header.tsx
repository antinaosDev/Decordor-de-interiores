import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          <span className="text-indigo-600">Decor</span>AI
        </h1>
        <p className="text-gray-500">Tu Diseñador de Interiores con IA</p>
      </div>
    </header>
  );
};