'use client';

import { useEffect, useState } from 'react';
import { Shield, Clock, Search } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  user: { email: string };
}

export default function AuditView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApi('/audit')
      .then(res => {
        if (!res.ok) throw new Error('Acesso Negado: Apenas Administradores podem visualizar auditoria.');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredLogs = logs.filter(log => 
    log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 font-bold shadow-sm flex items-center">
          <Shield className="w-6 h-6 mr-3" /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
          <Shield className="w-8 h-8 mr-3 text-red-600" />
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Logs de Auditoria</h1>
            <p className="text-gray-500 mt-1">Rastreabilidade completa de ações no sistema (Anti-Fraude).</p>
          </div>
        </div>
        <div className="flex bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 items-center">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar usuário, entidade..." 
            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center p-8 text-gray-500 font-medium">Carregando logs de segurança...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed border-gray-200 m-4 rounded-xl text-gray-500">Nenhum registro encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Data / Hora</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Ação</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Módulo (Entidade)</th>
                  <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Detalhes (JSON)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-blue-700">{log.user?.email || 'Sistema'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${
                        log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                        log.action === 'UPDATE' ? 'bg-yellow-100 text-yellow-800' :
                        log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 uppercase">{log.entity}</td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono break-all max-w-xs truncate" title={log.details || ''}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
