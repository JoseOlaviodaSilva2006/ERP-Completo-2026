'use client';

import { useEffect, useState } from 'react';
import { Trash2, CheckCircle, Clock, PenTool } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface Supplier {
  id: string;
  name: string;
}

interface SewingOrder {
  id: string;
  sku: string;
  quantity: number;
  status: 'Pendente' | 'Em Produção' | 'Concluído';
  supplier: Supplier;
}

export default function SewingView() {
  const [orders, setOrders] = useState<SewingOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordRes, supRes] = await Promise.all([
        fetchApi('/sewing'),
        fetchApi('/suppliers')
      ]);
      if (ordRes.ok) setOrders(await ordRes.json());
      
      if (supRes.ok) {
        const allSups = await supRes.json();
        // Filter to only show sewing suppliers
        setSuppliers(allSups.filter((s: any) => s.type === 'SEWING'));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return alert('Selecione uma Facção');

    try {
      const response = await fetchApi('/sewing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sku, 
          quantity: parseInt(quantity), 
          supplierId,
          estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined
        }),
      });
      if (response.ok) {
        setSku('');
        setQuantity('');
        setSupplierId('');
        setEstimatedCost('');
        fetchData();
        alert('OS Criada! O estoque de Matéria Prima foi deduzido (Ficha Técnica) e a despesa registrada no Financeiro.');
      } else {
        const err = await response.json();
        alert(err.error || 'Erro ao criar OS');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Deseja concluir a OS? Isso adicionará as peças prontas no estoque do catálogo.')) return;
    try {
      const response = await fetchApi(`/sewing/${id}/complete`, { method: 'POST' });
      if (response.ok) {
        fetchData();
      } else {
        alert('Erro ao concluir OS');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir permanentemente esta ordem de serviço?')) return;
    try {
      const response = await fetchApi(`/sewing/${id}`, { method: 'DELETE' });
      if (response.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
        <PenTool className="w-8 h-8 mr-3 text-emerald-600" />
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Ordens de Produção (Costura)</h1>
          <p className="text-gray-500 mt-1">Envie grades, desconte insumos automaticamente (BOM) e gere contas a pagar.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1 h-fit sticky top-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Nova Ordem de Serviço</h2>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">SKU do Produto</label>
              <input type="text" required className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50 uppercase font-bold" value={sku} onChange={e => setSku(e.target.value.toUpperCase())} placeholder="Ex: LEG-PRE-M" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Quantidade</label>
              <input type="number" required min="1" className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50 font-bold" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Facção/Costureira</label>
              <select required className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">Selecione...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Custo Estimado da OS (R$)</label>
              <input type="number" step="0.01" className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} placeholder="Gera Despesa no Financeiro" />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-extrabold py-3 px-4 rounded-xl hover:bg-emerald-700 transition shadow-md">
              Emitir OS
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Acompanhamento de OS</h2>
          {loading ? (
            <div className="text-center p-8 text-gray-500 font-medium">Carregando ordens...</div>
          ) : orders.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-500">Nenhuma OS em andamento.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">SKU & Facção</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">Qtd</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-extrabold text-gray-900">{order.sku}</div>
                        <div className="text-xs text-gray-500 font-medium">{order.supplier?.name || 'Facção Desconhecida'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-extrabold">{order.quantity} un</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 inline-flex items-center text-xs font-bold rounded-full shadow-sm ${
                          order.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                          order.status === 'Em Produção' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'Concluído' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {order.status !== 'Concluído' && (
                          <button onClick={() => handleComplete(order.id)} className="text-emerald-700 bg-emerald-100 px-4 py-2 rounded-lg font-bold mr-2 hover:bg-emerald-200 transition shadow-sm">
                            Baixar Estoque Pronto
                          </button>
                        )}
                        <button onClick={() => handleDelete(order.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50" title="Excluir OS"><Trash2 className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
