'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Truck, Plus } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface Supplier {
  id: string;
  name: string;
  cnpj: string | null;
  type: 'FABRIC' | 'SEWING' | 'OTHER';
  contact: string | null;
}

export default function SuppliersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [type, setType] = useState<'FABRIC' | 'SEWING' | 'OTHER'>('SEWING');
  const [contact, setContact] = useState('');

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/suppliers');
      if (res.ok) setSuppliers(await res.json());
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { loadSuppliers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name, cnpj, type, contact };
      const url = editingId ? `/suppliers/${editingId}` : '/suppliers';
      const res = await fetchApi(url, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (res.ok) { resetForm(); loadSuppliers(); }
    } catch (error) { console.error(error); }
  };

  const handleEdit = (s: Supplier) => {
    setEditingId(s.id); setName(s.name); setCnpj(s.cnpj || ''); setType(s.type); setContact(s.contact || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir fornecedor?')) return;
    const res = await fetchApi(`/suppliers/${id}`, { method: 'DELETE' });
    if (res.ok) loadSuppliers();
  };

  const resetForm = () => { setEditingId(null); setName(''); setCnpj(''); setType('SEWING'); setContact(''); };

  return (
    <div className="p-8">
      <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
        <Truck className="w-8 h-8 mr-3 text-orange-600" />
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Fornecedores & Facções</h1>
          <p className="text-gray-500 mt-1">Gerencie parceiros, fábricas e confecções.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1 h-fit sticky top-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
            {editingId ? <Pencil className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
              <input type="text" required className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
              <select className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50" value={type} onChange={e => setType(e.target.value as any)}>
                <option value="SEWING">Facção / Costura</option>
                <option value="FABRIC">Fornecedor de Tecido</option>
                <option value="OTHER">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">CNPJ (Opcional)</label>
              <input type="text" className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50" value={cnpj} onChange={e => setCnpj(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Contato</label>
              <input type="text" className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50" value={contact} onChange={e => setContact(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-4">
              <button type="submit" className="flex-1 bg-orange-600 text-white font-extrabold py-3 px-4 rounded-xl hover:bg-orange-700 transition shadow-md">
                {editingId ? 'Salvar' : 'Cadastrar'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-800 font-extrabold py-3 px-4 rounded-xl hover:bg-gray-300 transition">Cancelar</button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          {loading ? (
            <div className="text-center p-8 text-gray-500">Carregando...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">Nome / Tipo</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">Documento / Contato</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-extrabold text-gray-900">{s.name}</div>
                        <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{s.type === 'SEWING' ? 'Facção' : s.type === 'FABRIC' ? 'Tecido' : 'Outro'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{s.cnpj || '-'}</div>
                        <div className="font-medium text-gray-500">{s.contact || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(s)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg mr-2"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(s.id)} className="text-red-600 p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
