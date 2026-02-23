import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useResetPassword } from '../../hooks/queries/useUsers';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number | null;
    userName: string;
}

export const ResetPasswordModal = ({ isOpen, onClose, userId, userName }: ResetPasswordModalProps) => {
    const { addToast } = useToast();
    const [password, setPassword] = useState('');
    const resetPasswordMutation = useResetPassword();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;
        try {
            await resetPasswordMutation.mutateAsync({ id: userId, password });
            addToast('Contraseña restablecida correctamente', 'success');
            setPassword('');
            onClose();
        } catch (error: any) {
            addToast(error.response?.data?.error || 'Error al restablecer contraseña', 'error');
        }
    };

    const isPending = resetPasswordMutation.isPending;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Restablecer Contraseña</h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    Ingresa la nueva contraseña para <strong>{userName}</strong>.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="Nueva contraseña"
                            className="w-full p-2 border rounded"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                            {isPending ? 'Restableciendo...' : 'Restablecer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
