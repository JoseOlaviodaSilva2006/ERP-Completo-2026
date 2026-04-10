'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardView from '../components/DashboardView';
import CatalogView from '../components/CatalogView';
import PcpView from '../components/PcpView';
import SewingView from '../components/SewingView';
import PosView from '../components/PosView';
import UsersView from '../components/UsersView';
import CustomersView from '../components/CustomersView';
import SuppliersView from '../components/SuppliersView';
import FinanceView from '../components/FinanceView';
import ReportsView from '../components/ReportsView';
import AuditView from '../components/AuditView';

function SpaContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';

  switch (tab) {
    case 'dashboard': return <DashboardView />;
    case 'catalog': return <CatalogView />;
    case 'pcp': return <PcpView />;
    case 'sewing': return <SewingView />;
    case 'pos': return <PosView />;
    case 'users': return <UsersView />;
    case 'customers': return <CustomersView />;
    case 'suppliers': return <SuppliersView />;
    case 'finance': return <FinanceView />;
    case 'reports': return <ReportsView />;
    case 'audit': return <AuditView />;
    default: return <DashboardView />;
  }
}

function MainApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) return <div className="p-12 text-center text-gray-500 font-bold">Verificando segurança...</div>;

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <Sidebar />
      <div className="flex-1 ml-72 overflow-y-auto h-full bg-gray-50">
        <Suspense fallback={<div className="p-12 text-center text-gray-500 font-bold">Carregando ERP...</div>}>
          <SpaContent />
        </Suspense>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500 font-bold">Iniciando aplicação...</div>}>
      <MainApp />
    </Suspense>
  );
}
