'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('tenant', JSON.stringify(data.tenant));
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      } else {
        setError(data.error || 'Erro ao registrar');
      }
    } catch (err) {
      setError('Falha na conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-blue-600">
          Criar Empresa (SaaS)
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Comece a usar o Fashion ERP no seu negócio.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-bold">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-gray-700">Nome da Empresa</label>
              <div className="mt-1">
                <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="Confecções Silva" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Email do Admin</label>
              <div className="mt-1">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="admin@empresa.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Senha Segura</label>
              <div className="mt-1">
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50">
                {loading ? 'Criando Conta...' : 'Cadastrar e Acessar ERP'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Já possui uma conta?</span></div>
            </div>

            <div className="mt-6">
              <Link href="/login" className="w-full flex justify-center py-3 px-4 border-2 border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50">
                Voltar para o Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
