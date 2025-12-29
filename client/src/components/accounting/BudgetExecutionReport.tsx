import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import type { BudgetAccount } from '../../types';
import { cn } from '../../lib/utils';
import { Download, Eye, AlertTriangle } from 'lucide-react';
import { BudgetHistoryModal } from './BudgetHistoryModal';

export const BudgetExecutionReport = () => {
    const [accounts, setAccounts] = useState<BudgetAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState<BudgetAccount | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/budget');
            setAccounts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const calculateTotals = () => {
        return accounts.reduce((acc, curr) => ({
            allocated: acc.allocated + Number(curr.allocatedAmount),
            committed: acc.committed + Number(curr.committed),
            executed: acc.executed + Number(curr.executed),
            currentBalance: acc.currentBalance + Number(curr.currentBalance),
            available: acc.available + Number(curr.available)
        }), { allocated: 0, committed: 0, executed: 0, currentBalance: 0, available: 0 });
    };

    const totals = calculateTotals();
    const executionPercentage = totals.allocated > 0 ? (totals.executed / totals.allocated) * 100 : 0;

    const handleViewHistory = (account: BudgetAccount) => {
        setSelectedAccount(account);
        setHistoryOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold">Estado Presupuestario</h2>
                    <p className="text-sm text-gray-500">Control de Ejecución y Compromisos</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                    <Download className="w-4 h-4" />
                    Exportar / Imprimir
                </button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Presupuesto Asignado</p>
                    <p className="text-xl font-bold">{totals.allocated.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Comprometido</p>
                    <p className="text-xl font-bold text-yellow-600">{totals.committed.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Devengado (Ejecutado)</p>
                    <p className="text-xl font-bold text-blue-600">{totals.executed.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Disponible</p>
                    <p className={cn("text-xl font-bold", totals.available < 0 ? "text-red-600" : "text-green-600")}>
                        {totals.available.toLocaleString('fr-FR')} FCFA
                    </p>
                </div>
                <div className="p-4 bg-white border rounded-lg shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">% Ejecución</p>
                    <p className="text-xl font-bold text-gray-700">{executionPercentage.toFixed(1)}%</p>
                </div>
            </div>

            {/* Detalle */}
            <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3 font-medium">Código</th>
                            <th className="p-3 font-medium">Rubro</th>
                            <th className="p-3 font-medium text-right">Asignado</th>
                            <th className="p-3 font-medium text-right">Comprometido</th>
                            <th className="p-3 font-medium text-right">Devengado</th>
                            <th className="p-3 font-medium text-right">Disponible</th>
                            <th className="p-3 font-medium text-center">%</th>
                            <th className="p-3 font-center w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr><td colSpan={8} className="p-8 text-center text-gray-500">Cargando...</td></tr>
                        ) : accounts.length === 0 ? (
                            <tr><td colSpan={8} className="p-8 text-center text-gray-500">No hay datos presupuestales</td></tr>
                        ) : (
                            accounts.map(account => {
                                const percent = account.allocatedAmount > 0 ? (account.executed / account.allocatedAmount) * 100 : 0;
                                const isLowFunds = account.available < 1000000;
                                const isAlert = account.isAlert;

                                return (
                                    <tr key={account.id} className={cn(
                                        "group hover:bg-gray-50",
                                        isAlert && "bg-red-50 hover:bg-red-100"
                                    )}>
                                        <td className="p-3 font-mono">{account.code}</td>
                                        <td className="p-3 font-medium flex items-center gap-2">
                                            {account.name}
                                            {isAlert && (
                                                <div className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold border border-red-200" title="Compromisos superan saldo actual">
                                                    <AlertTriangle className="w-3 h-3" /> ALERTA
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 text-right text-gray-600">{Number(account.allocatedAmount).toLocaleString('fr-FR')} FCFA</td>
                                        <td className="p-3 text-right font-medium text-yellow-600">{Number(account.committed).toLocaleString('fr-FR')} FCFA</td>
                                        <td className="p-3 text-right font-medium text-blue-600">{Number(account.executed).toLocaleString('fr-FR')} FCFA</td>
                                        <td className={cn("p-3 text-right font-bold", account.available < 0 ? "text-red-600" : "text-green-600")}>
                                            {Number(account.available).toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                                percent > 90 ? "bg-red-100 text-red-700" :
                                                    percent > 70 ? "bg-yellow-100 text-yellow-700" :
                                                        "bg-green-100 text-green-700"
                                            )}>
                                                {percent.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => handleViewHistory(account)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Ver Historial"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t">
                        <tr>
                            <td className="p-3 text-right" colSpan={2}>Totales</td>
                            <td className="p-3 text-right">{totals.allocated.toLocaleString('fr-FR')}</td>
                            <td className="p-3 text-right">{totals.committed.toLocaleString('fr-FR')}</td>
                            <td className="p-3 text-right">{totals.executed.toLocaleString('fr-FR')}</td>
                            <td className="p-3 text-right">{totals.available.toLocaleString('fr-FR')}</td>
                            <td className="p-3 text-center">{executionPercentage.toFixed(1)}%</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <BudgetHistoryModal
                isOpen={historyOpen}
                onClose={() => setHistoryOpen(false)}
                budgeAccountId={selectedAccount?.id || null}
                budgetAccountName={selectedAccount?.name || ''}
            />
        </div>
    );
};
