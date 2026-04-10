'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, Box, ShieldAlert, List } from 'lucide-react';
import SlideOver from './SlideOver';
import { fetchApi } from '../lib/api';
import BulkActions from './BulkActions';

interface Variation {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
  cost: number | null;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
  description: string;
  variations: Variation[];
}

export default function CatalogView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchCatalog = () => {
    setLoading(true);
    fetchApi('/catalog')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Atenção! Isso excluirá o produto e TODAS as suas variações de SKU. Tem certeza?')) return;
    try {
      const response = await fetchApi(`/catalog/${id}`, { method: 'DELETE' });
      if (response.ok) fetchCatalog();
    } catch (error) {
      console.error(error);
      alert('Erro ao excluir produto');
    }
  };

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <Box className="w-8 h-8 mr-3 text-purple-600" />
            Catálogo & Grade
          </h1>
          <p className="text-gray-500 mt-1">Gerencie matrizes de produtos, variações e fichas técnicas.</p>
        </div>
        <div className="flex items-center gap-4">
          <BulkActions entity="products" hideImport={true} onImportSuccess={fetchCatalog} />
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Grade
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-12 text-gray-500 font-medium">Carregando catálogo...</div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border-2 border-dashed border-gray-200 text-center">
          <Box className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4 text-xl font-medium">Nenhum produto cadastrado no seu catálogo.</p>
          <button onClick={() => setIsCreateOpen(true)} className="text-purple-600 font-bold hover:underline text-lg">
            Criar minha primeira Grade de Produtos
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    {product.name}
                    <span className="ml-3 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      {product.variations.length} SKUs
                    </span>
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm max-w-2xl">{product.description || 'Sem descrição'}</p>
                  <p className="text-gray-900 mt-2 font-medium">
                    Preço Base de Venda: <span className="font-extrabold text-green-600 text-lg">R$ {product.basePrice.toFixed(2)}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="flex items-center text-sm text-blue-700 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition font-bold shadow-sm"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar Produto
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex items-center text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition font-bold shadow-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Cor</th>
                      <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Tamanho</th>
                      <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Estoque Real</th>
                      <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Custo Decriptografado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {product.variations.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-900">{v.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{v.color}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-bold">{v.size}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${v.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {v.stock} un
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 font-extrabold bg-red-50/50 flex items-center">
                          <ShieldAlert className="w-4 h-4 mr-2 text-red-500" />
                          R$ {v.cost?.toFixed(2) || 'Erro Sigilo'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateMatrixSlideOver 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={() => { setIsCreateOpen(false); fetchCatalog(); }} 
      />
      
      {editingProduct && (
        <EditProductSlideOver 
          product={editingProduct} 
          isOpen={!!editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSuccess={() => { setEditingProduct(null); fetchCatalog(); }} 
        />
      )}
    </div>
  );
}

function CreateMatrixSlideOver({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [cost, setCost] = useState('');
  const [colors, setColors] = useState<string[]>(['Preto', 'Branco']);
  const [sizes, setSizes] = useState<string[]>(['P', 'M', 'G', 'GG']);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  
  // Ficha Técnica (BOM)
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);
  const [bom, setBom] = useState<{rawMaterialId: string, quantity: string}[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(''); setDescription(''); setBasePrice(''); setCost('');
      setColors(['Preto', 'Branco']); setSizes(['P', 'M', 'G', 'GG']);
      setBom([]);
      
      // Load raw materials for BOM
      fetchApi('/pcp/materials').then(res => res.json()).then(setAvailableMaterials);
    }
  }, [isOpen]);

  const handleAddColor = () => { if (colorInput && !colors.includes(colorInput)) { setColors([...colors, colorInput]); setColorInput(''); } };
  const handleAddSize = () => { if (sizeInput && !sizes.includes(sizeInput)) { setSizes([...sizes, sizeInput]); setSizeInput(''); } };

  const addBomItem = () => setBom([...bom, { rawMaterialId: '', quantity: '' }]);
  const updateBomItem = (index: number, field: string, value: string) => {
    const newBom = [...bom];
    (newBom[index] as any)[field] = value;
    setBom(newBom);
  };
  const removeBomItem = (index: number) => {
    setBom(bom.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Filter out incomplete BOM items
    const validBom = bom.filter(b => b.rawMaterialId && parseFloat(b.quantity) > 0);

    try {
      const res = await fetchApi('/catalog/matrix', {
        method: 'POST',
        body: JSON.stringify({ 
          name, 
          description, 
          basePrice: parseFloat(basePrice), 
          cost: parseFloat(cost), 
          colors, 
          sizes,
          materials: validBom
        }),
      });
      if (res.ok) onSuccess();
      else alert('Erro ao criar matriz');
    } catch (err) {
      console.error(err);
      alert('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Nova Grade de Produtos" description="Crie matriz e defina a Ficha Técnica (BOM).">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Produto</label>
            <input type="text" required className="w-full rounded-lg border-gray-300 shadow-sm p-3 border focus:ring-purple-500 focus:border-purple-500 bg-gray-50" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Top Fitness" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
            <textarea className="w-full rounded-lg border-gray-300 shadow-sm p-3 border focus:ring-purple-500 focus:border-purple-500 bg-gray-50" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Preço Base Venda</label>
              <input type="number" step="0.01" required className="w-full rounded-lg border-gray-300 shadow-sm p-3 border focus:ring-purple-500 focus:border-purple-500 bg-gray-50 text-lg font-bold" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-bold text-red-600 mb-1">Custo (Criptografado)</label>
              <input type="number" step="0.01" required className="w-full rounded-lg border-red-300 shadow-sm p-3 border focus:ring-red-500 focus:border-red-500 bg-red-50 text-lg font-bold text-red-900" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Ficha Técnica */}
        <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-blue-900 flex items-center"><List className="w-5 h-5 mr-2"/> Ficha Técnica (BOM)</h3>
            <button type="button" onClick={addBomItem} className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md font-bold">+ Insumo</button>
          </div>
          <p className="text-xs text-blue-700 mb-2">Adicione materiais. Eles serão descontados automaticamente ao enviar para Facção.</p>
          
          {bom.map((b, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select className="flex-1 rounded-lg border-gray-300 p-2 border text-sm" value={b.rawMaterialId} onChange={e => updateBomItem(idx, 'rawMaterialId', e.target.value)}>
                <option value="">Selecione a Matéria Prima...</option>
                {availableMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
              </select>
              <input type="number" step="0.001" placeholder="Qtd por peça" className="w-32 rounded-lg border-gray-300 p-2 border text-sm" value={b.quantity} onChange={e => updateBomItem(idx, 'quantity', e.target.value)} />
              <button type="button" onClick={() => removeBomItem(idx)} className="text-red-500 p-2"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Cores</label>
            <div className="flex gap-2 mb-3">
              <input type="text" className="flex-1 rounded-lg border-gray-300 shadow-sm p-2 border" value={colorInput} onChange={e => setColorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddColor())} />
              <button type="button" onClick={handleAddColor} className="bg-gray-800 text-white px-4 rounded-lg font-bold">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <span key={c} className="bg-white border border-gray-300 px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-sm">
                  {c} <button type="button" onClick={() => setColors(colors.filter(x => x !== c))} className="ml-2 text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Tamanhos</label>
            <div className="flex gap-2 mb-3">
              <input type="text" className="flex-1 rounded-lg border-gray-300 shadow-sm p-2 border uppercase" value={sizeInput} onChange={e => setSizeInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSize())} />
              <button type="button" onClick={handleAddSize} className="bg-gray-800 text-white px-4 rounded-lg font-bold">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map(s => (
                <span key={s} className="bg-white border border-gray-300 px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-sm">
                  {s} <button type="button" onClick={() => setSizes(sizes.filter(x => x !== s))} className="ml-2 text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-extrabold py-4 rounded-xl hover:bg-purple-700 shadow-lg disabled:opacity-50">
          {loading ? 'Gerando...' : `Salvar Ficha Técnica e Gerar ${colors.length * sizes.length} SKUs`}
        </button>
      </form>
    </SlideOver>
  );
}

function EditProductSlideOver({ product, isOpen, onClose, onSuccess }: { product: Product, isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || '');
  const [basePrice, setBasePrice] = useState(product.basePrice.toString());
  const [loading, setLoading] = useState(false);

  const [variations, setVariations] = useState<Variation[]>(product.variations);

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchApi(`/catalog/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description, basePrice: parseFloat(basePrice) }),
      });

      for (const v of variations) {
        const original = product.variations.find(ov => ov.id === v.id);
        if (original && (original.stock !== v.stock || original.cost !== v.cost)) {
          await fetchApi(`/catalog/variation/${v.id}`, {
            method: 'PUT',
            body: JSON.stringify({ stock: v.stock, cost: v.cost }),
          });
        }
      }
      
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar produto');
    } finally {
      setLoading(false);
    }
  };

  const updateVariation = (id: string, field: 'stock' | 'cost', value: string) => {
    setVariations(variations.map(v => {
      if (v.id === id) {
        return { ...v, [field]: parseFloat(value) || 0 };
      }
      return v;
    }));
  };

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="Editar Produto" description={`Ajuste dados e estoque de ${product.name}`}>
      <form onSubmit={handleUpdateProduct} className="space-y-6">
        <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-200">
          <h3 className="font-extrabold text-gray-900 border-b pb-2">Dados Principais</h3>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Produto</label>
            <input type="text" required className="w-full rounded-lg border-gray-300 p-2.5 border" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Descrição</label>
            <textarea className="w-full rounded-lg border-gray-300 p-2.5 border" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Preço Base Venda</label>
            <input type="number" step="0.01" required className="w-full rounded-lg border-gray-300 p-2.5 border text-lg font-bold" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-extrabold text-gray-900 border-b pb-2">Ajuste de SKUs (Estoque e Custo)</h3>
          {variations.map(v => (
            <div key={v.id} className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <div className="col-span-4">
                <p className="text-sm font-extrabold text-gray-900">{v.sku}</p>
                <p className="text-xs text-gray-500">{v.color} - {v.size}</p>
              </div>
              <div className="col-span-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Estoque Real</label>
                <input type="number" className="w-full rounded border-gray-300 p-1.5 border text-sm font-bold" value={v.stock} onChange={e => updateVariation(v.id, 'stock', e.target.value)} />
              </div>
              <div className="col-span-4">
                <label className="block text-[10px] font-bold text-red-500 uppercase">Custo Base</label>
                <input type="number" step="0.01" className="w-full rounded border-red-300 bg-red-50 p-1.5 border text-sm font-bold text-red-700" value={v.cost || ''} onChange={e => updateVariation(v.id, 'cost', e.target.value)} />
              </div>
            </div>
          ))}
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-extrabold py-4 rounded-xl hover:bg-blue-700 shadow-lg disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar Todas as Alterações'}
        </button>
      </form>
    </SlideOver>
  );
}
