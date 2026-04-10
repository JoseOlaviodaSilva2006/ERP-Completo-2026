'use client';

import { useEffect, useState } from 'react';
import { BarChart, AlertTriangle } from 'lucide-react';
import { fetchApi } from '../lib/api';

export default function ReportsView() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchApi('/reports/dashboard').then(res => res.json()).then(setData);
  }, []);

  if (!data) return <div className="p-12 text-center text-gray-500 font-bold">Carregando Analytics...</div>;

  return (
    <div className="p-8">
      <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
        <BarChart className="w-8 h-8 mr-3 text-cyan-600" />
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Relatórios & Analytics</h1>
          <p className="text-gray-500 mt-1">Inteligência de negócio e alertas.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4">Alertas de Estoque (SKUs Críticos)</h2>
          {data.lowStock.length === 0 ? (
            <p className="text-green-600 font-bold text-sm bg-green-50 p-4 rounded-lg">Estoque saudável! Nenhum produto acabando.</p>
          ) : (
            <ul className="space-y-3">
              {data.lowStock.map((s: any) => (
                <li key={s.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                    <div>
                      <p className="text-sm font-bold text-red-900">{s.sku}</p>
                      <p className="text-xs text-red-700">{s.product.name} - {s.color}/{s.size}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-red-600 text-lg">{s.stock} un</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
          <h2 className="text-lg font-extrabold text-gray-900 mb-4 text-center">Saúde Financeira (Mês Atual)</h2>
          <div className="flex items-end justify-center space-x-6 h-40">
            <div className="flex flex-col items-center">
              <div className="w-16 bg-green-400 rounded-t-lg transition-all" style={{ height: Math.max((data.financials.revenue / (data.financials.revenue + data.financials.expenses || 1)) * 120, 10) }}></div>
              <p className="text-xs font-bold text-gray-500 mt-2">Receitas</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 bg-red-400 rounded-t-lg transition-all" style={{ height: Math.max((data.financials.expenses / (data.financials.revenue + data.financials.expenses || 1)) * 120, 10) }}></div>
              <p className="text-xs font-bold text-gray-500 mt-2">Despesas</p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-500 font-bold uppercase text-xs">Margem Operacional</p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">{data.financials.revenue > 0 ? ((data.financials.balance / data.financials.revenue) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
