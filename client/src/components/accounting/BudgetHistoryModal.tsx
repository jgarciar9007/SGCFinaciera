import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistoryItem {
    date: string;
    type: 'ADJUSTMENT' | 'EXECUTION' | 'COMMITMENT';
    description: string;
    amount: number;
    reference?: string;
}

interface BudgetHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    budgeAccountId: number | null;
    budgetAccountName: string;
}

export const BudgetHistoryModal = ({ isOpen, onClose, budgeAccountId, budgetAccountName }: BudgetHistoryModalProps) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && budgeAccountId) {
            setLoading(true);
            api.get(`/budget/${budgeAccountId}/history`)
                .then(res => setHistory(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen, budgeAccountId]);

    return (
        <Modal title={`Historial: ${budgetAccountName}`} isOpen={isOpen} onClose={onClose} className="max-w-4xl">
            <div className="space-y-4">
                <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-3 font-medium">Fecha</th>
                                <th className="p-3 font-medium">Tipo</th>
                                <th className="p-3 font-medium">Descripción</th>
                                <th className="p-3 font-medium">Referencia</th>
                                <th className="p-3 font-medium text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Cargando...</td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay movimientos registrados</td></tr>
                            ) : (
                                history.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-600">
                                            {format(new Date(item.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                                        </td>
                                        <td className="p-3">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-bold",
                                                item.type === 'ADJUSTMENT' ? "bg-gray-100 text-gray-700" :
                                                    item.type === 'COMMITMENT' ? "bg-yellow-100 text-yellow-700" :
                                                        "bg-blue-100 text-blue-700"
                                            )}>
                                                {item.type === 'ADJUSTMENT' ? 'AJUSTE' :
                                                    item.type === 'COMMITMENT' ? 'COMPROMISO' : 'DEVENGADO'}
                                            </span>
                                        </td>
                                        <td className="p-3 font-medium">{item.description}</td>
                                        <td className="p-3 text-gray-500 text-xs">{item.reference || '-'}</td>
                                        <td className="p-3 text-right font-medium">
                                            {item.amount.toLocaleString('fr-FR')} FCFA
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700">
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
};
