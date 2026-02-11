import React, { useState } from 'react';
import api from '../../api/client';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import type { BudgetAccount } from '../../types';

interface CreateAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateAccountModal = ({ isOpen, onClose, onSuccess }: CreateAccountModalProps) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        allocatedAmount: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/budget', {
                ...formData,
                allocatedAmount: parseFloat(formData.allocatedAmount),
                year: new Date().getFullYear()
            });
            onSuccess();
            onClose();
            setFormData({ code: '', name: '', allocatedAmount: '' });
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error creating account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="Nueva Cuenta Presupuestal" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Código</label>
                    <input
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="e.g. 2.1.1.04"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre</label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Materiales de Oficina"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Monto Asignado</label>
                    <input
                        name="allocatedAmount"
                        type="number"
                        value={formData.allocatedAmount}
                        onChange={handleChange}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors",
                            loading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {loading ? 'Guardando...' : 'Guardar Cuenta'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
