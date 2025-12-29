import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { Building2, CreditCard } from 'lucide-react';

interface CreateAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateAccountModal = ({ isOpen, onClose, onSuccess }: CreateAccountModalProps) => {
    const [name, setName] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [banks, setBanks] = useState<any[]>([]);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const res = await api.get('/settings/banks');
                setBanks(res.data);
            } catch (error) {
                console.error('Error loading banks:', error);
            }
        };
        fetchBanks();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/treasury/accounts', {
                name,
                bankName,
                accountNumber,
                initialBalance: parseFloat(initialBalance) || 0
            });
            onSuccess();
            onClose();
            // Reset
            setName('');
            setBankName('');
            setAccountNumber('');
            setInitialBalance('');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Error al crear la cuenta bancaria');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="Agregar Nueva Cuenta Bancaria" isOpen={isOpen} onClose={onClose} className="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">Nombre de la Cuenta (Alias)</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Cuenta Principal Banesco"
                        className="w-full border rounded-md px-3 py-2 text-sm bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">Banco</label>
                    <div className="relative">
                        <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full pl-9 border rounded-md px-3 py-2 text-sm bg-gray-800 border-gray-700 text-white focus:ring-2 focus:ring-primary focus:outline-none appearance-none"
                            required
                        >
                            <option value="">Seleccione un banco...</option>
                            {banks.map((bank: any) => (
                                <option key={bank.id} value={bank.name} className="bg-gray-800 text-white">
                                    {bank.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">Número de Cuenta</label>
                    <div className="relative">
                        <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="Número de cuenta"
                            className="w-full pl-9 border rounded-md px-3 py-2 text-sm bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-200">Saldo Inicial</label>
                    <input
                        type="number"
                        step="0.01"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(e.target.value)}
                        placeholder="0.00"
                        className="w-full border rounded-md px-3 py-2 text-sm bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-primary focus:outline-none text-right"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors",
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
