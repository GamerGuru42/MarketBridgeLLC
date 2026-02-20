'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
    toasts: Toast[];
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast, toasts, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

function ToastContainer() {
    const context = useContext(ToastContext);
    if (!context) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            {context.toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto min-w-[300px] max-w-sm p-4 rounded-xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-300
                        flex items-start gap-3
                        ${toast.type === 'success' ? 'bg-zinc-950/90 border-[#FF6200]/50 text-white' : ''}
                        ${toast.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-white' : ''}
                        ${toast.type === 'info' ? 'bg-zinc-900/90 border-white/20 text-white' : ''}
                    `}
                >
                    <div className={`mt-0.5 ${toast.type === 'success' ? 'text-[#FF6200]' : toast.type === 'error' ? 'text-red-500' : 'text-zinc-400'}`}>
                        {toast.type === 'success' && <CheckCircle className="h-5 w-5" />}
                        {toast.type === 'error' && <AlertCircle className="h-5 w-5" />}
                        {toast.type === 'info' && <Info className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold uppercase tracking-wide">
                            {toast.type === 'success' ? 'System Success' : toast.type === 'error' ? 'System Error' : 'Notification'}
                        </h4>
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                            {toast.message}
                        </p>
                    </div>
                    <button onClick={() => context.removeToast(toast.id)} className="text-zinc-500 hover:text-white transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}