import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import type { ExpenseRequest, ExpenseQuotation } from '../../types';
import api from '../../api/client';
import { Check, X, FileText } from 'lucide-react';

interface ExpenseApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    expense: ExpenseRequest | null;
}

export const ExpenseApprovalModal = ({ isOpen, onClose, onSuccess, expense }: ExpenseApprovalModalProps) => {
    const [selectedQuotationId, setSelectedQuotationId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    if (!expense) return null;

    const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
        setLoading(true);
        try {
            await api.patch(`/expenses/${expense.id}/status`, {
                status,
                selectedQuotationId: status === 'APPROVED' ? selectedQuotationId : undefined
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to update status', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal title={`Aprobar Solicitud #${expense.id}`} isOpen={isOpen} onClose={onClose} className="max-w-3xl">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-bold">{expense.description}</h3>
                    <p className="text-sm text-muted-foreground">Solicitado por: {expense.requester?.fullName} - Total: ${Number(expense.totalAmount).toLocaleString()}</p>
                </div>

                {(expense.quotations?.length || 0) > 0 && (
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Seleccionar Cotización Ganadora (Generará Orden de Compra)</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {expense.quotations?.map((q: any) => (
                                <div
                                    key={q.id}
                                    onClick={() => setSelectedQuotationId(q.id)}
                                    className={cn(
                                        "border rounded-lg p-4 cursor-pointer transition-all relative hover:border-primary",
                                        selectedQuotationId === q.id ? "bg-primary/10 border-primary ring-2 ring-primary" : "bg-card"
                                    )}
                                >
                                    <div className="font-bold text-sm mb-1">{q.supplierName}</div>
                                    <div className="text-lg font-semibold text-primary">${Number(q.amount).toLocaleString()}</div>
                                    {q.filePath && (
                                        <div className="flex items-center gap-1 text-xs text-blue-600 mt-2">
                                            <FileText className="w-3 h-3" /> Ver Adjunto
                                        </div>
                                    )}
                                    {selectedQuotationId === q.id && (
                                        <div className="absolute top-2 right-2 text-primary">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        onClick={() => handleAction('REJECTED')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                        disabled={loading}
                    >
                        <X className="w-4 h-4" /> Rechazar
                    </button>
                    <button
                        onClick={() => handleAction('APPROVED')}
                        disabled={loading || ((expense.quotations?.length || 0) > 0 && !selectedQuotationId)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md",
                            (loading || ((expense.quotations?.length || 0) > 0 && !selectedQuotationId)) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Check className="w-4 h-4" /> Aprobar y Generar Orden
                    </button>
                </div>
            </div>
        </Modal>
    );
};
