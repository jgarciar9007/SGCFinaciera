import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import api from '../../api/client';
import { cn } from '../../lib/utils';

interface CreateTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    accountId: number;
}

export const CreateTransactionModal = ({ isOpen, onClose, onSuccess, accountId }: CreateTransactionModalProps) => {
    const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/treasury/transactions', {
                bankAccountId: accountId,
                type,
                amount: parseFloat(amount),
                description,
                reference
            });
            onSuccess();
            onClose();
            // Reset
            setAmount('');
            setDescription('');
            setReference('');
            setType('DEPOSIT');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="Registrar Movimiento Bancario" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => setType('DEPOSIT')}
                        className={cn(
                            "flex-1 py-2 rounded font-medium text-sm border",
                            type === 'DEPOSIT' ? "bg-green-100 text-green-700 border-green-200" : "bg-white text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        Ingreso (Depósito)
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('WITHDRAWAL')}
                        className={cn(
                            "flex-1 py-2 rounded font-medium text-sm border",
                            type === 'WITHDRAWAL' ? "bg-red-100 text-red-700 border-red-200" : "bg-white text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        Egreso (Retiro)
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Monto</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="0.00"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Descripción</label>
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="Ej: Aporte de capital, Pago de servicios..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Referencia (Opcional)</label>
                    <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full border rounded p-2"
                        placeholder="Ej: Cheque #123, Transferencia #ABC"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">Cancelar</button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Guardar Movimiento'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
