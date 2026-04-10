'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart, ShoppingBag, User } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface ProductVariation {
  id: string;
  sku: string;
  size: string;
  color: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
  variations: ProductVariation[];
}

interface Customer {
  id: string;
  name: string;
}

export default function PosView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        fetchApi('/catalog'),
        fetchApi('/customers')
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSell = async (sku: string, basePrice: number) => {
    try {
      const response = await fetchApi('/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sku, 
          quantity: 1, 
          totalPrice: basePrice,
          customerId: selectedCustomerId || undefined
        }),
      });
      if (response.ok) {
        fetchData(); 
        alert('Venda registrada com sucesso! (Fluxo de caixa atualizado)');
      } else {
        const error = await response.json();
        alert('Erro ao vender: ' + error.error);
      }
    } catch (error) {
      console.error(error);
      alert('Erro de conexão');
    }
  };

  return (
    <div className="p-8">
      <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <ShoppingBag className="w-8 h-8 mr-3 text-rose-600" />
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Ponto de Venda (PDV)</h1>
            <p className="text-gray-500 mt-1">Vendas rápidas. Estoque e Financeiro atualizados na hora.</p>
          </div>
        </div>
        
        <div className="flex items-center bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
          <User className="w-5 h-5 text-gray-500 mr-2" />
          <select 
            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 w-48"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">Cliente (Consumidor Final)</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center p-12 text-gray-500 font-medium">Carregando PDV...</div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border-2 border-dashed border-gray-200 text-center text-gray-500">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-xl font-medium">Nenhum produto com grade disponível para venda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex-1">
                <h2 className="text-lg font-extrabold text-gray-900 line-clamp-1" title={product.name}>{product.name}</h2>
                <p className="text-rose-600 font-extrabold text-2xl mt-2">R$ {product.basePrice.toFixed(2)}</p>
              </div>
              
              <div className="p-4 max-h-72 overflow-y-auto space-y-3 bg-white">
                {product.variations.map(v => (
                  <div key={v.id} className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 p-3 rounded-xl border border-gray-200 transition">
                    <div>
                      <p className="text-sm font-extrabold text-gray-900">{v.sku}</p>
                      <p className="text-xs text-gray-500 font-medium uppercase mt-0.5">{v.color} • Tam {v.size}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm ${v.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {v.stock} un
                      </span>
                      <button
                        onClick={() => handleSell(v.sku, product.basePrice)}
                        disabled={v.stock <= 0}
                        className="bg-gray-900 text-white p-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                        title="Vender 1 unidade"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
