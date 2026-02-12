import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import type { ExpenseRequest } from '../../types';
import { Plus, Search, FileText, Paperclip, ChevronDown, ChevronUp, Download, CheckCircle, Trash } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CreateExpenseModal } from './CreateExpenseModal';
import { ExpenseApprovalModal } from './ExpenseApprovalModal';
import { translateStatus } from '../../utils/translations';
import { useConfirm } from '../../context/ConfirmContext';
import { showToast } from '../../lib/toast';

export const ExpenseList = () => {
    const { confirm } = useConfirm();
    const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; expense: ExpenseRequest | null }>({ isOpen: false, expense: null });
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/expenses');
            setExpenses(response.data);
            setError('');
        } catch (err: any) {
            console.error(err);
            const status = err.response?.status;
            const msg = err.response?.data?.error || err.message;
            setError(`Error al cargar las solicitudes de gastos: ${status} - ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!await confirm({
            title: 'Eliminar Borrador',
            message: '¿Está seguro de eliminar este borrador?',
            confirmText: 'Eliminar',
            type: 'danger'
        })) return;

        try {
            await api.delete(`/expenses/${id}`);
            fetchExpenses();
            showToast.success('Borrador eliminado');
        } catch (err) {
            showToast.error('Error al eliminar el borrador');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-600 text-white dark:bg-green-600 dark:text-white';
            case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'SUBMITTED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const handleOpenApproval = (e: React.MouseEvent, expense: ExpenseRequest) => {
        e.stopPropagation();
        setApprovalModal({ isOpen: true, expense });
    };



    if (loading) return <div>Cargando solicitudes...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gastos y Solicitudes</h2>
                    <p className="text-muted-foreground">Gestiona las aprobaciones y soportes de gastos.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                >
                    <Plus className="w-4 h-4" /> Nueva Solicitud
                </button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar solicitud..."
                            className="w-full pl-9 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-10"></th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Solicitante</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Descripción</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Estado</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Total</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Fecha</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {expenses.map((expense) => (
                                <React.Fragment key={expense.id}>
                                    <tr className="border-b transition-colors hover:bg-muted/50 cursor-pointer" onClick={() => toggleExpand(expense.id)}>
                                        <td className="p-4 align-middle">
                                            {expandedId === expense.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </td>
                                        <td className="p-4 align-middle font-medium">#{expense.id}</td>
                                        <td className="p-4 align-middle">{expense.requester?.fullName}</td>
                                        <td className="p-4 align-middle">{expense.description}</td>
                                        <td className="p-4 align-middle">
                                            <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", getStatusColor(expense.status))}>
                                                {translateStatus(expense.status)}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-right font-bold">{Number(expense.totalAmount).toLocaleString('fr-FR')} FCFA</td>
                                        <td className="p-4 align-middle">{new Date(expense.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 align-middle flex items-center gap-2">
                                            {expense.status === 'SUBMITTED' && (
                                                <button
                                                    onClick={(e) => handleOpenApproval(e, expense)}
                                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                    title="Aprobar / Gestionar"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                            {expense.status === 'DRAFT' && (
                                                <button
                                                    onClick={(e) => handleDelete(e, expense.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Eliminar Borrador"
                                                >
                                                    <Trash className="w-5 h-5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>

                                    {expandedId === expense.id && (
                                        <tr className="bg-muted/50">
                                            <td colSpan={8} className="p-4">
                                                <div className="space-y-4 pl-10">
                                                    <div>
                                                        <h4 className="font-semibold text-sm mb-2 text-primary">Ítems Detallados</h4>
                                                        <div className="border rounded-md bg-background overflow-hidden">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-muted">
                                                                    <tr>
                                                                        <th className="p-2 text-left">Descripción</th>
                                                                        <th className="p-2 text-right">Cant.</th>
                                                                        <th className="p-2 text-right">Unitario</th>
                                                                        <th className="p-2 text-right">Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {expense.items.map((item) => (
                                                                        <tr key={item.id} className="border-t">
                                                                            <td className="p-2">{item.description}</td>
                                                                            <td className="p-2 text-right">{item.quantity}</td>
                                                                            <td className="p-2 text-right">{Number(item.unitPrice).toLocaleString('fr-FR')} FCFA</td>
                                                                            <td className="p-2 text-right font-medium">{Number(item.totalPrice).toLocaleString('fr-FR')} FCFA</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    {expense.quotations && expense.quotations.length > 0 && (
                                                        <div>
                                                            <h4 className="font-semibold text-sm mb-2 text-primary">Cotizaciones / Proformas</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                {expense.quotations.map((q: any) => (
                                                                    <div key={q.id} className={cn("p-2 border rounded text-xs", q.isSelected ? "border-green-500 bg-green-50" : "bg-background")}>
                                                                        <div className="font-bold">{q.supplierName}</div>
                                                                        <div>${Number(q.amount).toLocaleString()}</div>
                                                                        {q.isSelected && <div className="text-green-600 font-bold mt-1">GANADOR</div>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {expense.attachments.length > 0 && (
                                                        <div>
                                                            <h4 className="font-semibold text-sm mb-2 text-primary flex items-center gap-2">
                                                                <Paperclip className="w-4 h-4" /> Adjuntos
                                                            </h4>
                                                            <div className="flex gap-2">
                                                                {expense.attachments.map(att => (
                                                                    <a
                                                                        key={att.id}
                                                                        href={`http://localhost:3000${att.filePath}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="flex items-center gap-2 p-2 bg-background border rounded-md hover:bg-muted transition-colors text-sm text-blue-600 hover:underline"
                                                                    >
                                                                        <FileText className="w-4 h-4" />
                                                                        {att.fileName}
                                                                    </a >
                                                                ))}
                                                            </div>
                                                        </div >
                                                    )}

                                                    {expense.approvalDocument && (
                                                        <div>
                                                            <h4 className="font-semibold text-sm mb-2 text-primary flex items-center gap-2">
                                                                <CheckCircle className="w-4 h-4" /> Documento de Aprobación
                                                            </h4>
                                                            <a
                                                                href={`http://localhost:3000${expense.approvalDocument}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors text-sm text-green-700 hover:underline"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                                Ver Soporte de Aprobación
                                                            </a >
                                                        </div >
                                                    )}
                                                </div >
                                            </td >
                                        </tr >
                                    )}
                                </React.Fragment >
                            ))}
                            {
                                expenses.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-4 text-center text-muted-foreground">No hay solicitudes registradas.</td>
                                    </tr>
                                )
                            }
                        </tbody >
                    </table >
                </div >
            </div >

            <CreateExpenseModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchExpenses}
            />

            <ExpenseApprovalModal
                isOpen={approvalModal.isOpen}
                onClose={() => setApprovalModal({ isOpen: false, expense: null })}
                onSuccess={fetchExpenses}
                expense={approvalModal.expense}
            />
        </div >
    );
};
