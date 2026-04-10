'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Users, UserPlus } from 'lucide-react';
import { fetchApi } from '../lib/api';
import BulkActions from './BulkActions';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export default function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/customers');
      if (res.ok) setCustomers(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name, email, phone };
      const url = editingId ? `/customers/${editingId}` : '/customers';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetchApi(url, { method, body: JSON.stringify(payload) });
      if (res.ok) {
        resetForm();
        loadCustomers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (c: Customer) => {
    setEditingId(c.id);
    setName(c.name);
    setEmail(c.email || '');
    setPhone(c.phone || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir cliente?')) return;
    try {
      const res = await fetchApi(`/customers/${id}`, { method: 'DELETE' });
      if (res.ok) loadCustomers();
    } catch (error) { console.error(error); }
  };

  const resetForm = () => { setEditingId(null); setName(''); setEmail(''); setPhone(''); };

  return (
    <div className="p-8">
      <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <Users className="w-8 h-8 mr-3 text-pink-600" />
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Clientes (CRM)</h1>
            <p className="text-gray-500 mt-1">Gerencie sua carteira de clientes e dados de contato.</p>
          </div>
        </div>
        <BulkActions entity="customers" onImportSuccess={loadCustomers} />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1 h-fit sticky top-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
            {editingId ? <Pencil className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
            {editingId ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
              <input type="text" required className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input type="text" className="w-full rounded-lg border-gray-300 p-2.5 border bg-gray-50" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-4">
              <button type="submit" className="flex-1 bg-pink-600 text-white font-extrabold py-3 px-4 rounded-xl hover:bg-pink-700 transition shadow-md">
                {editingId ? 'Salvar' : 'Cadastrar'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-800 font-extrabold py-3 px-4 rounded-xl hover:bg-gray-300 transition">Cancelar</button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lista de Clientes</h2>
          {loading ? (
            <div className="text-center p-8 text-gray-500 font-medium">Carregando...</div>
          ) : customers.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-500">Nenhum cliente cadastrado.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">Contato</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-extrabold text-gray-900">{c.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{c.email || '-'}</div>
                        <div className="font-medium text-gray-500">{c.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(c)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-lg mr-2"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c.id)} className="text-red-600 p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
