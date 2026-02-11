import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import type { ExpenseRequest } from '../../types';

interface CreatePOModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreatePOModal = ({ isOpen, onClose, onSuccess }: CreatePOModalProps) => {
    const [approvedExpenses, setApprovedExpenses] = useState<ExpenseRequest[]>([]);
    const [selectedExpenseId, setSelectedExpenseId] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [supplierTaxId, setSupplierTaxId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const inputClasses = "w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white text-gray-900 border-gray-300";
    const labelClasses = "text-sm font-medium text-gray-700";

    // Fetch only APPROVED expenses
    const fetchApprovedExpenses = async () => {
        try {
            const response = await api.get('/expenses');
            // Filter client-side for simplicity, ideally backend filter
            const approved = response.data.filter((e: ExpenseRequest) => e.status === 'APPROVED');
            setApprovedExpenses(approved);
        } catch (err) {
            console.error('Failed to load approved expenses');
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchApprovedExpenses();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/procurement', {
                expenseRequestId: Number(selectedExpenseId),
                supplierName,
                supplierTaxId
            });
            onSuccess();
            onClose();
            setSelectedExpenseId('');
            setSupplierName('');
            setSupplierTaxId('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al generar la Orden de Compra');
        } finally {
            setLoading(false);
        }
    };

    const selectedExpense = approvedExpenses.find(e => e.id === Number(selectedExpenseId));

    return (
        <Modal title="Generar Orden de Compra" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className={labelClasses}>Seleccionar Gasto Aprobado</label>
                    <select
                        value={selectedExpenseId}
                        onChange={(e) => setSelectedExpenseId(e.target.value)}
                        className={inputClasses}
                        required
                    >
                        <option value="">Seleccione...</option>
                        {approvedExpenses.map(e => (
                            <option key={e.id} value={e.id}>
                                #{e.id} - {e.description} ({e.totalAmount.toLocaleString('fr-FR')} FCFA)
                            </option>
                        ))}
                    </select>
                </div>

                {selectedExpense && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm space-y-1 text-gray-700">
                        <p><strong>Solicitante:</strong> {selectedExpense.requester?.fullName}</p>
                        <p><strong>Total:</strong> {selectedExpense.totalAmount.toLocaleString('fr-FR')} FCFA</p>
                        <ul className="list-disc list-inside pl-1 text-gray-500 text-xs mt-2">
                            {selectedExpense.items.map(item => (
                                <li key={item.id}>{item.description} (x{item.quantity})</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="space-y-2">
                    <label className={labelClasses}>Proveedor / Beneficiario</label>
                    <input
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        placeholder="Razón Social"
                        className={inputClasses}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className={labelClasses}>RUC / ID Tributario</label>
                    <input
                        value={supplierTaxId}
                        onChange={(e) => setSupplierTaxId(e.target.value)}
                        placeholder="Número de Identificación"
                        className={inputClasses}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4">
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
                            "px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors",
                            loading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {loading ? 'Generando...' : 'Generar Orden'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
