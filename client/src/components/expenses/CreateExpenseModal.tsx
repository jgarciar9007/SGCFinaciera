import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { Plus, Trash, Upload, X } from 'lucide-react';

import type { BudgetAccount } from '../../types';

interface CreateExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface ItemDraft {
    description: string;
    quantity: number;
    unitPrice: number;
}

interface QuotationDraft {
    supplierName: string;
    amount: number;
    file: File | null;
}

export const CreateExpenseModal = ({ isOpen, onClose, onSuccess }: CreateExpenseModalProps) => {
    const [description, setDescription] = useState('');
    const [budgetAccounts, setBudgetAccounts] = useState<BudgetAccount[]>([]);
    const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
    const [items, setItems] = useState<ItemDraft[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
    const [quotations, setQuotations] = useState<QuotationDraft[]>([{ supplierName: '', amount: 0, file: null }]);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            api.get('/budget').then(res => setBudgetAccounts(res.data)).catch(console.error);
        }
    }, [isOpen]);

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof ItemDraft, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addQuotation = () => {
        if (quotations.length < 3) {
            setQuotations([...quotations, { supplierName: '', amount: 0, file: null }]);
        }
    };

    const removeQuotation = (index: number) => {
        setQuotations(quotations.filter((_, i) => i !== index));
    };

    const updateQuotation = (index: number, field: keyof QuotationDraft, value: any) => {
        const newQuotations = [...quotations];
        newQuotations[index] = { ...newQuotations[index], [field]: value };
        setQuotations(newQuotations);
    };

    const handleSubmit = async (status: 'DRAFT' | 'SUBMITTED') => {
        setLoading(true);
        setError('');

        try {
            // 1. Create Request
            const totalAmount = calculateTotal();
            const response = await api.post('/expenses', {
                description,
                totalAmount,
                status,
                items,
                budgetAccountId: selectedBudgetId || null,
                quotations: quotations.map(q => ({
                    supplierName: q.supplierName,
                    amount: q.amount,
                    // valid file path placeholder or empty for now
                }))
            });

            const expenseId = response.data.id;
            const createdQuotations = response.data.quotations || [];

            // 2. Upload Quotation Attachments
            for (let i = 0; i < quotations.length; i++) {
                if (quotations[i].file && createdQuotations[i]) {
                    const qFormData = new FormData();
                    qFormData.append('file', quotations[i].file!);
                    await api.post(`/expenses/quotations/${createdQuotations[i].id}/attachment`, qFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
            }

            // 3. Upload General Attachment if present
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                await api.post(`/expenses/${expenseId}/attachments`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            onSuccess();
            onClose();
            // Reset form
            setDescription('');
            setSelectedBudgetId('');
            setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
            setQuotations([{ supplierName: '', amount: 0, file: null }]);
            setFile(null);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Error al crear la solicitud de gasto');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";
    const labelClasses = "text-sm font-medium text-gray-700 dark:text-gray-200";

    return (
        <Modal title="Nueva Solicitud de Gasto" isOpen={isOpen} onClose={onClose} className="max-w-2xl">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className={labelClasses}>Descripción General</label>
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Compra de materiales para mantenimiento"
                        className={inputClasses}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className={labelClasses}>Partida Presupuestaria (Opcional)</label>
                    <select
                        value={selectedBudgetId}
                        onChange={(e) => setSelectedBudgetId(e.target.value)}
                        className={inputClasses}
                    >
                        <option value="">-- Seleccionar Partida --</option>
                        {budgetAccounts.map(account => (
                            <option key={account.id} value={account.id}>
                                {account.code} - {account.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <label className={labelClasses}>Items Detallados</label>
                        <button type="button" onClick={addItem} className="text-xs flex items-center gap-1 text-primary hover:underline">
                            <Plus className="w-3 h-3" /> Agregar Ítem
                        </button>
                    </div>

                    <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-1">
                            <div className="col-span-6">Descripción</div>
                            <div className="col-span-2 text-right">Cant.</div>
                            <div className="col-span-3 text-right">Precio Unit. (FCFA)</div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-start">
                                    <div className="col-span-6">
                                        <input
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                            placeholder="Descripción del ítem"
                                            className={cn(inputClasses, "w-full")}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                            placeholder="Cant"
                                            className={cn(inputClasses, "w-full text-right")}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            placeholder="Precio"
                                            className={cn(inputClasses, "w-full text-right")}
                                            required
                                        />
                                    </div>

                                    <div className="col-span-1 flex justify-center pt-2">
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-500 hover:bg-red-50 rounded p-1 dark:hover:bg-red-900/30"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end text-sm font-bold border-t pt-2 dark:border-gray-700">
                        <span className="dark:text-white">Total: {calculateTotal().toLocaleString()} FCFA</span>
                    </div>
                </div>

                <div className="space-y-3 border-t pt-4 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <label className={labelClasses}>Cotizaciones / Proformas (Max 3)</label>
                        {quotations.length < 3 && (
                            <button type="button" onClick={addQuotation} className="text-xs flex items-center gap-1 text-primary hover:underline">
                                <Plus className="w-3 h-3" /> Agregar Cotización
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {quotations.map((q, index) => (
                            <div key={index} className="flex gap-2 items-start bg-muted/20 dark:bg-gray-700/50 p-2 rounded-md">
                                <div className="space-y-2 flex-1">
                                    <input
                                        value={q.supplierName}
                                        onChange={(e) => updateQuotation(index, 'supplierName', e.target.value)}
                                        placeholder="Nombre del Proveedor / Tercero"
                                        className="w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                        required={quotations.length > 0 && index === 0}
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={q.amount}
                                            onChange={(e) => updateQuotation(index, 'amount', parseFloat(e.target.value) || 0)}
                                            placeholder="Monto (FCFA)"
                                            className={cn(inputClasses, "w-32")}
                                        />
                                        <label className="flex-1 flex items-center gap-2 text-xs text-muted-foreground p-1 border rounded bg-background dark:bg-gray-700 dark:border-gray-600 cursor-pointer hover:bg-muted dark:hover:bg-gray-600">
                                            <Upload className="w-3 h-3" />
                                            <span className="truncate dark:text-gray-300">
                                                {q.file ? q.file.name : 'Adjuntar PDF (Pendiente)'}
                                            </span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] || null;
                                                    updateQuotation(index, 'file', file);
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                                {quotations.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeQuotation(index)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded mt-1"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className={labelClasses}>Adjuntar Soporte (Opcional)</label>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors text-sm dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200">
                            <Upload className="w-4 h-4" />
                            {file ? 'Cambiar archivo' : 'Seleccionar archivo'}
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </label>
                        {file && (
                            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-400">
                                {file.name}
                                <button type="button" onClick={() => setFile(null)} className="text-gray-500 hover:text-red-500 dark:text-gray-400">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">Formatos permitidos: PDF, Imágenes (Max 10MB)</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit('DRAFT')}
                        disabled={loading}
                        className={cn(
                            "px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
                            loading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        Guardar Borrador
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit('SUBMITTED')}
                        disabled={loading}
                        className={cn(
                            "px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors",
                            loading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {loading ? 'Procesando...' : 'Confirmar Solicitud'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
