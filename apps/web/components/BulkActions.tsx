'use client';

import { useState, useRef } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface BulkActionsProps {
  entity: 'customers' | 'rawMaterials' | 'finance' | 'products';
  onImportSuccess?: () => void;
  hideImport?: boolean;
}

export default function BulkActions({ entity, onImportSuccess, hideImport = false }: BulkActionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetchApi(`/bulk/export/${entity}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Erro ao exportar dados.');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}_export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Falha ao exportar arquivo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Por favor, selecione um arquivo .csv válido.');
      return;
    }

    if (!confirm(`Tem certeza que deseja importar dados do arquivo ${file.name}? Isso pode sobrescrever informações.`)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bulk/import/${entity}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'Importação concluída com sucesso!');
        if (onImportSuccess) onImportSuccess();
      } else {
        alert(result.error || 'Erro na importação.');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Falha crítica ao realizar a importação.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleExport}
        disabled={isExporting || isImporting}
        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50 transition"
      >
        {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2 text-gray-500" />}
        Exportar CSV
      </button>

      {!hideImport && (
        <>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={isExporting || isImporting}
            className="flex items-center px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm font-bold text-indigo-700 hover:bg-indigo-100 shadow-sm disabled:opacity-50 transition"
          >
            {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2 text-indigo-500" />}
            Importar CSV
          </button>
        </>
      )}
    </div>
  );
}
