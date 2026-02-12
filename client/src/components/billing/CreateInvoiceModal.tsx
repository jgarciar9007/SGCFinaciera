import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import type { PurchaseOrder } from '../../types';

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateInvoiceModal = ({ isOpen, onClose, onSuccess }: CreateInvoiceModalProps) => {
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [selectedPO, setSelectedPO] = useState('');
    const [number, setNumber] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Fetch POs
    useEffect(() => {
        if (isOpen) {
            // Note: Ideally query endpoint should return remaining balance or we fetch specific PO details on selection
            api.get('/procurement', {
                params: { status: 'pending_invoice' }
            }).then(res => {
                setPurchaseOrders(res.data);
            });
        }
    }, [isOpen]);

    const handlePOChange = (poId: string) => {
        setSelectedPO(poId);
        if (poId) {
            const po = purchaseOrders.find(p => p.id === Number(poId));
            if (po) {
                setSupplierName(po.supplierName);
                // Ideally default to remaining amount
                setTotalAmount(po.totalAmount.toString());
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let attachmentPath = undefined;

            // 1. Upload File
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await api.post('/billing/invoices/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                attachmentPath = uploadRes.data.filePath;
            }

            // 2. Create Invoice
            await api.post('/billing/invoices', {
                purchaseOrderId: selectedPO || undefined,
                number,
                supplierName,
                date,
                dueDate: dueDate || undefined,
                totalAmount,
                attachmentPath
            });

            onSuccess();
            onClose();
            // Reset
            setNumber('');
            setSupplierName('');
            setTotalAmount('');
            setSelectedPO('');
            setFile(null);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title="Registrar Nueva Factura" isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Vincular Orden de Compra (Opcional)</label>
                    <select
                        value={selectedPO}
                        onChange={(e) => handlePOChange(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                        <option value="">Ninguna / Gasto Directo</option>
                        {purchaseOrders.map(po => (
                            <option key={po.id} value={po.id}>
                                PO-{po.id} - {po.supplierName} ({Number(po.totalAmount).toLocaleString('fr-FR')} FCFA)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">No. Factura</label>
                        <input
                            value={number}
                            onChange={(e) => setNumber(e.target.value)}
                            placeholder="F-00123"
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha Emisión</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Proveedor</label>
                    <input
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        placeholder="Razón Social"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Monto Total</label>
                        <input
                            type="number"
                            step="0.01"
                            value={totalAmount}
                            onChange={(e) => setTotalAmount(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Vencimiento</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Adjuntar PDF Factura (Opcional)</label>
                    <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
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
                        {loading ? 'Guardando...' : 'Guardar Factura'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
