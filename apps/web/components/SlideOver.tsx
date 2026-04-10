'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function SlideOver({ isOpen, onClose, title, description, children }: SlideOverProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl transform transition-transform ease-in-out duration-300">
          <div className="flex h-full flex-col bg-white shadow-2xl">
            <div className="px-6 py-6 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
              </div>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Close panel</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="relative flex-1 px-6 py-6 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
