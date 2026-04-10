'use client';

import { useEffect, useState } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react';
import { fetchApi } from '../lib/api';
import BulkActions from './BulkActions';

interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  description: string;
  status: string;
  customer?: { name: string };
  supplier?: { name: string };
}

export default function FinanceView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Manual
  const [type, setType] = useState<'INCOME'|'EXPENSE'>('INCOME');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Pago');

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/finance');
      if (res.ok) setTransactions(await res.json());
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { loadTransactions(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/finance', {
        method: 'POST',
        body: JSON.stringify({ type, amount: parseFloat(amount), description, status })
      });
      if (res.ok) {
        setAmount(''); setDescription(''); loadTransactions();
      }
    } catch (e) { console.error(e); }
  };

  const toggleStatus = async (t: Transaction) => {
    const newStatus = t.status === 'Pago' ? 'Pendente' : 'Pago';
    await fetchApi(`/finance/${t.id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    loadTransactions();
  };

  const totalIncome = transactions.filter(t => t.type === 'INCOME' && t.status === 'Pago').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'Pago').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="p-8">
      <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <DollarSign className="w-8 h-8 mr-3 text-green-600" />
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Financeiro</h1>
            <p className="text-gray-500 mt-1">Fluxo de Caixa, Contas a Pagar e Receber.</p>
          </div>
        </div>
        <BulkActions entity="finance" onImportSuccess={loadTransactions} />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-sm font-bold text-gray-500 uppercase">Receitas (Pagas)</p><p className="text-3xl font-extrabold text-green-600 mt-2">R$ {totalIncome.toFixed(2)}</p></div>
          <ArrowUpCircle className="w-10 h-10 text-green-200" />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div><p className="text-sm font-bold text-gray-500 uppercase">Despesas (Pagas)</p><p className="text-3xl font-extrabold text-red-600 mt-2">R$ {totalExpense.toFixed(2)}</p></div>
          <ArrowDownCircle className="w-10 h-10 text-red-200" />
        </div>
        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 flex items-center justify-between text-white">
          <div><p className="text-sm font-bold text-gray-400 uppercase">Saldo Líquido</p><p className="text-3xl font-extrabold mt-2">R$ {balance.toFixed(2)}</p></div>
          <DollarSign className="w-10 h-10 text-gray-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center"><Plus className="w-5 h-5 mr-2" /> Lançamento Manual</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <select className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50 font-bold" value={type} onChange={e => setType(e.target.value as any)}>
                <option value="INCOME">Receita (+)</option><option value="EXPENSE">Despesa (-)</option>
              </select>
            </div>
            <div><input type="number" step="0.01" required placeholder="Valor (R$)" className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50 font-bold text-lg" value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div><input type="text" required placeholder="Descrição..." className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50" value={description} onChange={e => setDescription(e.target.value)} /></div>
            <div>
              <select className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="Pago">Pago</option><option value="Pendente">Pendente</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-gray-900 text-white font-extrabold py-3 px-4 rounded-xl hover:bg-gray-800 transition">Lançar</button>
          </form>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">Data</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">Descrição</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {t.description}
                    {t.customer && <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Cliente: {t.customer.name}</span>}
                    {t.supplier && <span className="ml-2 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Facção: {t.supplier.name}</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => toggleStatus(t)} className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm transition ${t.status === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {t.status}
                    </button>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-extrabold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
