import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fashion ERP',
  description: 'Sistema ERP Integrado para Moda Íntima e Fit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 flex h-screen overflow-hidden text-gray-900 font-sans selection:bg-purple-200 selection:text-purple-900">
        <main className="flex-1 overflow-y-auto h-full relative">
          {children}
        </main>
      </body>
    </html>
  );
}
