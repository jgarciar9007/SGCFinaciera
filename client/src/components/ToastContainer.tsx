import { useToast } from '../context/ToastContext';
import type { ToastType } from '../context/ToastContext';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded shadow-lg min-w-[300px] animate-in slide-in-from-right",
                        toast.type === 'success' && "bg-green-600 text-white",
                        toast.type === 'error' && "bg-red-600 text-white",
                        toast.type === 'warning' && "bg-yellow-500 text-white",
                        toast.type === 'info' && "bg-blue-600 text-white"
                    )}
                >
                    {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                    {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                    {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                    {toast.type === 'info' && <Info className="w-5 h-5" />}

                    <span className="flex-1 text-sm font-medium">{toast.message}</span>

                    <button onClick={() => removeToast(toast.id)} className="hover:opacity-80">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
