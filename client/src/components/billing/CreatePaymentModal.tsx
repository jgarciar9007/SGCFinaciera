import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import type { Invoice } from '../../types';

interface BankAccount {
    id: number;
    name: string;
    accountNumber: string;
    bankName: string;
    currentBalance: number;
    isActive: boolean;
}

interface CreatePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreatePaymentModal = ({ isOpen, onClose, onSuccess }: CreatePaymentModalProps) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | ''>('');
    const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | ''>('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch Unpaid Invoices and Bank Accounts
    useEffect(() => {
        if (isOpen) {
            // Fetch unpaid invoices
            api.get('/billing/invoices').then(res => {
                const unpaid = res.data.filter((i: Invoice) => i.status !== 'PAID');
                setInvoices(unpaid);
            });

            // Fetch active bank accounts
            api.get('/treasury/accounts').then(res => {
                const active = res.data.filter((acc: BankAccount) => acc.isActive);
                setBankAccounts(active);
            }).catch(err => {
                console.error('Error fetching bank accounts:', err);
            });
        }
    }, [isOpen]);

    const handleInvoiceChange = (invId: string) => {
        const val = invId ? Number(invId) : '';
        setSelectedInvoiceId(val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post(`/billing/invoices/${selectedInvoiceId}/pay`, {
                bankAccountId: Number(selectedBankAccountId),
                paymentDate,
                reference,
                notes
            });
            onSuccess();
            onClose();
            // Reset
            setSelectedInvoiceId('');
            setSelectedBankAccountId('');
            setReference('');
            setNotes('');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to register payment');
        } finally {
            setLoading(false);
        }
    };

    const selectedInvoice = invoices.find(i => i.id === Number(selectedInvoiceId));
    const selectedBankAccount = bankAccounts.find(acc => acc.id === Number(selectedBankAccountId));

    return (
        <Modal title="Registrar Pago de Factura" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Factura a Pagar *</label>
                    <select
                        value={selectedInvoiceId}
                        onChange={(e) => handleInvoiceChange(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    >
                        <option value="">Seleccione Factura Pendiente...</option>
                        {invoices.map(inv => (
                            <option key={inv.id} value={inv.id}>
                                {inv.number} - {inv.supplierName} ({inv.totalAmount.toLocaleString()} FCFA)
                            </option>
                        ))}
                    </select>
                </div>

                {selectedInvoice && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm space-y-1">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Factura:</span>
                            <span className="font-semibold">{selectedInvoice.totalAmount.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Proveedor:</span>
                            <span className="font-medium">{selectedInvoice.supplierName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Fecha Factura:</span>
                            <span>{new Date(selectedInvoice.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Cuenta Bancaria *</label>
                    <select
                        value={selectedBankAccountId}
                        onChange={(e) => setSelectedBankAccountId(e.target.value ? Number(e.target.value) : '')}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    >
                        <option value="">Seleccione Cuenta...</option>
                        {bankAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.name} - {acc.bankName} (Saldo: {acc.currentBalance.toLocaleString()} FCFA)
                            </option>
                        ))}
                    </select>
                </div>

                {selectedBankAccount && selectedInvoice && (
                    <div className={cn(
                        "p-3 rounded-md text-sm",
                        selectedBankAccount.currentBalance >= selectedInvoice.totalAmount
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "bg-red-50 border border-red-200 text-red-700"
                    )}>
                        <div className="flex justify-between font-medium">
                            <span>Saldo Disponible:</span>
                            <span>{selectedBankAccount.currentBalance.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between font-medium">
                            <span>Monto a Pagar:</span>
                            <span>{selectedInvoice.totalAmount.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between font-bold mt-1 pt-1 border-t">
                            <span>Saldo Después del Pago:</span>
                            <span>{(selectedBankAccount.currentBalance - selectedInvoice.totalAmount).toLocaleString()} FCFA</span>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha de Pago *</label>
                    <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Referencia (Cheque/Transferencia)</label>
                    <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="e.g. Transferencia #12345"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Notas</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notas adicionales (opcional)"
                        rows={2}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !selectedInvoiceId || !selectedBankAccountId}
                        className={cn(
                            "px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors",
                            (loading || !selectedInvoiceId || !selectedBankAccountId) && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {loading ? 'Procesando Pago...' : 'Registrar Pago'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
