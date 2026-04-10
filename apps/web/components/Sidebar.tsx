'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, PenTool, Scissors, Box, Settings, LogOut, Users, Truck, DollarSign, BarChart, Shield } from 'lucide-react';
import { Suspense } from 'react';

const navItems = [
  { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
  { name: 'Catálogo & BOM', id: 'catalog', icon: Box },
  { name: 'PCP & Matéria', id: 'pcp', icon: Scissors },
  { name: 'Ordens (Facção)', id: 'sewing', icon: PenTool },
  { name: 'Ponto de Venda', id: 'pos', icon: ShoppingBag },
  { name: 'Clientes (CRM)', id: 'customers', icon: Users },
  { name: 'Fornecedores', id: 'suppliers', icon: Truck },
  { name: 'Financeiro', id: 'finance', icon: DollarSign },
  { name: 'Relatórios', id: 'reports', icon: BarChart },
  { name: 'Usuários', id: 'users', icon: Users },
  { name: 'Auditoria', id: 'audit', icon: Shield },
];

function SidebarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const currentTab = searchParams.get('tab') || 'dashboard';

  const handleTabChange = (tabId: string) => {
    router.push(`${pathname}?tab=${tabId}`);
  };

  return (
    <div className="w-72 bg-gray-900 text-white flex flex-col h-screen fixed top-0 left-0 shadow-2xl z-10">
      <div className="p-8 border-b border-gray-800">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 tracking-tight">
          Fashion ERP
        </h1>
        <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest font-bold">Moda Íntima & Fit</p>
      </div>
      
      <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex items-center w-full px-5 py-4 rounded-xl transition-all duration-200 group text-left ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105 font-bold' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100 font-medium'
              }`}
            >
              <item.icon className={`w-6 h-6 mr-4 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className="text-sm tracking-wide">{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-gray-800">
        <button className="flex items-center text-gray-400 hover:text-white w-full px-5 py-3 rounded-xl hover:bg-gray-800 transition-all group">
          <Settings className="w-6 h-6 mr-4 text-gray-500 group-hover:text-gray-300" />
          <span className="font-bold text-sm tracking-wide">Configurações</span>
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          className="flex items-center text-red-400 hover:text-red-300 w-full px-5 py-3 rounded-xl hover:bg-red-900/20 transition-all group mt-2"
        >
          <LogOut className="w-6 h-6 mr-4 text-red-500/70 group-hover:text-red-400" />
          <span className="font-bold text-sm tracking-wide">Sair</span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<div className="w-72 bg-gray-900 h-screen fixed" />}>
      <SidebarContent />
    </Suspense>
  );
}
