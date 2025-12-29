import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import type { Invoice } from '../../types';

interface CreatePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreatePaymentModal = ({ isOpen, onClose, onSuccess }: CreatePaymentModalProps) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | ''>('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch Unpaid Invoices
    useEffect(() => {
        if (isOpen) {
            api.get('/billing/invoices').then(res => {
                const unpaid = res.data.filter((i: Invoice) => i.status !== 'PAID');
                setInvoices(unpaid);
            });
        }
    }, [isOpen]);

    const handleInvoiceChange = (invId: string) => {
        setSelectedInvoiceId(invId);
        if (invId) {
            const inv = invoices.find(i => i.id === Number(invId));
            if (inv) {
                // Default to remaining amount?
                const paid = inv.payments.reduce((acc, p) => acc + Number(p.amount), 0);
                const remaining = inv.totalAmount - paid;
                setAmount(remaining.toString());
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/billing/payments', {
                invoiceId: Number(selectedInvoiceId),
                amount,
                reference
            });
            onSuccess();
            onClose();
            // Reset
            setAmount('');
            setReference('');
            setSelectedInvoiceId('');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to register payment');
        } finally {
            setLoading(false);
        }
    };

    const selectedInvoice = invoices.find(i => i.id === Number(selectedInvoiceId));

    return (
        <Modal title="Registrar Pago" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Seleccionar Factura (# - Proveedor)</label>
                    <select
                        value={selectedInvoiceId}
                        onChange={(e) => handleInvoiceChange(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                        required
                    >
                        <option value="">Seleccione Factura Pendiente...</option>
                        {invoices.map(inv => (
                            <option key={inv.id} value={inv.id}>
                                {inv.number} - {inv.supplierName} (Total: ${inv.totalAmount.toLocaleString()})
                            </option>
                        ))}
                    </select>
                </div>

                {selectedInvoice && (
                    <div className="p-3 bg-muted rounded-md text-sm">
                        <div className="flex justify-between">
                            <span>Total Factura:</span>
                            <span className="font-medium">${selectedInvoice.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-yellow-600">
                            <span>Saldo Pendiente:</span>
                            {/* Logic duplicated for display, ideally precise math */}
                            <span className="font-medium">
                                ${(selectedInvoice.totalAmount - selectedInvoice.payments.reduce((a, b) => a + Number(b.amount), 0)).toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Monto a Pagar</label>
                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Referencia / No. Cheque / Nota</label>
                    <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="e.g. Transf. #12345"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none dark:bg-gray-700 dark:border-gray-600"
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
                            "px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors",
                            loading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {loading ? 'Procesando...' : 'Registrar Pago'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
