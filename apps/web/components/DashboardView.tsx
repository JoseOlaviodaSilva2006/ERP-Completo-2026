'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';

export default function DashboardView() {
  const [stats, setStats] = useState({
    products: 0,
    materials: 0,
    orders: 0,
  });

  useEffect(() => {
    Promise.all([
      fetchApi('/catalog').then(res => res.json()),
      fetchApi('/pcp/materials').then(res => res.json()),
      fetchApi('/sewing').then(res => res.json())
    ]).then(([products, materials, orders]) => {
      setStats({
        products: products.length || 0,
        materials: materials.length || 0,
        orders: orders.filter((o: any) => o.status !== 'Concluído').length || 0,
      });
    }).catch(console.error);
  }, []);

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Visão Geral</h1>
        <p className="text-gray-500 mt-1">Acompanhe os indicadores principais da sua fábrica.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Produtos no Catálogo</p>
            <p className="text-4xl font-extrabold text-gray-900 mt-2">{stats.products}</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner">
            P
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Matérias-Primas</p>
            <p className="text-4xl font-extrabold text-gray-900 mt-2">{stats.materials}</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner">
            M
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Ordens em Produção</p>
            <p className="text-4xl font-extrabold text-gray-900 mt-2">{stats.orders}</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-inner">
            O
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-2xl shadow-lg border border-gray-700 text-white">
        <h2 className="text-2xl font-extrabold mb-4">Bem-vindo ao Hub Central SPA!</h2>
        <p className="text-gray-300 text-lg leading-relaxed">
          O sistema ERP foi modernizado. Toda a navegação agora ocorre em uma única página fluída, 
          permitindo respostas mais rápidas e sem recarregamentos (SPA). Utilize o menu lateral para alternar 
          entre os módulos.
        </p>
      </div>
    </div>
  );
}
