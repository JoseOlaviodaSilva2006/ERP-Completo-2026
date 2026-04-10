'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Scissors } from 'lucide-react';
import { fetchApi } from '../lib/api';
import BulkActions from './BulkActions';

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  stock: number;
}

export default function PcpView() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('metros');
  const [stock, setStock] = useState('');

  const fetchMaterials = () => {
    setLoading(true);
    fetchApi('/pcp/materials')
      .then(res => res.json())
      .then(data => {
        setMaterials(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, unit, stock: parseFloat(stock) };
    
    try {
      const url = editingId 
        ? `/pcp/materials/${editingId}`
        : '/pcp/materials';
        
      const response = await fetchApi(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetForm();
        fetchMaterials();
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar matéria-prima');
    }
  };

  const handleEdit = (mat: RawMaterial) => {
    setEditingId(mat.id);
    setName(mat.name);
    setUnit(mat.unit);
    setStock(mat.stock.toString());
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta matéria-prima?')) return;
    
    try {
      const response = await fetchApi(`/pcp/materials/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchMaterials();
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setUnit('metros');
    setStock('');
  };

  return (
    <div className="p-8">
      <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
        <Scissors className="w-8 h-8 mr-3 text-blue-600" />
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">PCP & Matéria-Prima</h1>
          <p className="text-gray-500 mt-1">Gerencie seu estoque de insumos e matérias-primas.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1 h-fit sticky top-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">
            {editingId ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                required
                className="block w-full rounded-lg border-gray-300 p-2.5 border focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Renda Francesa"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Unidade de Medida</label>
              <select
                className="block w-full rounded-lg border-gray-300 p-2.5 border focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-medium"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="metros">Metros (m)</option>
                <option value="kg">Quilogramas (kg)</option>
                <option value="rolos">Rolos</option>
                <option value="unidades">Unidades (un)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Estoque Atual</label>
              <input
                type="number"
                step="0.01"
                required
                className="block w-full rounded-lg border-gray-300 p-2.5 border focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-bold"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white font-extrabold py-3 px-4 rounded-xl hover:bg-blue-700 transition shadow-md"
              >
                {editingId ? 'Salvar Alterações' : 'Cadastrar'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-800 font-extrabold py-3 px-4 rounded-xl hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Column */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Estoque de Matérias-Primas</h2>
            <BulkActions entity="rawMaterials" onImportSuccess={fetchMaterials} />
          </div>
          {loading ? (
            <div className="flex justify-center p-8 text-gray-500 font-medium">Carregando estoque...</div>
          ) : materials.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-500">
              Nenhum material cadastrado no PCP.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Estoque</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Unidade</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {materials.map(mat => (
                    <tr key={mat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-900">{mat.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-extrabold bg-blue-50/50">
                        {mat.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{mat.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(mat)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-100 transition mr-2"
                          title="Editar"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(mat.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-100 transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
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
