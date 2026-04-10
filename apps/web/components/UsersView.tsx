'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Users, UserPlus } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
}

export default function UsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER'>('USER');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUserRole(user.role);
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingId) {
        const payload: any = { role };
        if (password) payload.password = password;

        const res = await fetchApi(`/users/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          resetForm();
          loadUsers();
        } else {
          const errorData = await res.json();
          setFormError(errorData.error || 'Erro ao atualizar usuário');
        }
      } else {
        const res = await fetchApi('/users', {
          method: 'POST',
          body: JSON.stringify({ email, password, role }),
        });

        if (res.ok) {
          resetForm();
          loadUsers();
        } else {
          const errorData = await res.json();
          setFormError(errorData.error || 'Erro ao criar usuário');
        }
      }
    } catch (error) {
      setFormError('Erro de conexão');
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setEmail(user.email);
    setRole(user.role);
    setPassword(''); // don't show existing password
    setFormError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir permanentemente este usuário?')) return;
    try {
      const res = await fetchApi(`/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadUsers();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Erro ao excluir usuário');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setEmail('');
    setPassword('');
    setRole('USER');
    setFormError('');
  };

  if (currentUserRole !== 'ADMIN') {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 font-bold shadow-sm">
          Acesso Negado: Apenas Administradores podem visualizar e gerenciar os usuários da empresa.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
        <Users className="w-8 h-8 mr-3 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Usuários</h1>
          <p className="text-gray-500 mt-1">Gerencie quem tem acesso ao ERP da sua empresa.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1 h-fit sticky top-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
            {editingId ? <Pencil className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
            {editingId ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold border border-red-100">
                {formError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                disabled={!!editingId}
                className="block w-full rounded-lg border-gray-300 p-2.5 border focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 bg-gray-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {editingId ? 'Nova Senha (Opcional)' : 'Senha Inicial'}
              </label>
              <input
                type="password"
                required={!editingId}
                className="block w-full rounded-lg border-gray-300 p-2.5 border focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nível de Acesso</label>
              <select
                className="block w-full rounded-lg border-gray-300 p-2.5 border focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 font-medium"
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'USER')}
              >
                <option value="USER">Usuário Comum</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            
            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white font-extrabold py-3 px-4 rounded-xl hover:bg-indigo-700 transition shadow-md"
              >
                {editingId ? 'Atualizar Usuário' : 'Cadastrar Usuário'}
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

        {/* Lista de Usuários */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Equipe</h2>
          {loading ? (
            <div className="flex justify-center p-8 text-gray-500 font-medium">Carregando usuários...</div>
          ) : users.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-500">
              Nenhum outro usuário cadastrado.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Nível de Acesso</th>
                    <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Cadastro em</th>
                    <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-100 transition mr-2"
                          title="Editar permissões ou senha"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-100 transition"
                          title="Excluir acesso"
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
