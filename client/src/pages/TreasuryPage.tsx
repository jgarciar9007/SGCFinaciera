import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { cn } from '../lib/utils';
import { Plus, ArrowUpRight, ArrowDownLeft, Building2, Trash2 } from 'lucide-react';
import { CreateAccountModal } from '../components/treasury/CreateAccountModal';
import { CreateTransactionModal } from '../components/treasury/CreateTransactionModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useConfirm } from '../context/ConfirmContext';
import { showToast } from '../lib/toast';

interface Transaction {
    id: number;
    type: 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    description: string;
    date: string;
    reference?: string;
}

interface BankAccount {
    id: number;
    name: string;
    bankName: string;
    accountNumber: string;
    currentBalance: number;
    transactions: Transaction[];
}

export const TreasuryPage = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkRole = () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user && user.role === 'ADMIN') {
                        setIsAdmin(true);
                    }
                }
            } catch (e) { console.error(e); }
        };
        checkRole();
    }, []);


    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/treasury/accounts');
            setAccounts(res.data);
            // Auto-select first account if none selected
            if (!selectedAccount && res.data.length > 0) {
                setSelectedAccount(res.data[0]);
            } else if (selectedAccount) {
                // Formatting update
                const updated = res.data.find((a: BankAccount) => a.id === selectedAccount.id);
                if (updated) setSelectedAccount(updated);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleDeleteAccount = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card selection

        if (!await confirm({
            title: 'Eliminar Cuenta',
            message: '¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            type: 'danger'
        })) return;

        try {
            const res = await api.delete(`/treasury/accounts/${id}`);
            showToast.success(res.data.message);
            fetchAccounts();
            if (selectedAccount?.id === id) setSelectedAccount(null);
        } catch (error) {
            console.error(error);
            showToast.error('Error al eliminar la cuenta');
        }
    };

    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const { confirm } = useConfirm();

    useEffect(() => {
        if (selectedAccount) {
            fetchPendingPayments(selectedAccount.id);
        }
    }, [selectedAccount]);

    const fetchPendingPayments = async (accountId: number) => {
        try {
            const res = await api.get('/billing/payments', {
                params: { bankAccountId: accountId, status: 'PENDING' }
            });
            setPendingPayments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleConciliate = async (paymentId: number) => {
        if (!await confirm({
            title: 'Conciliar Pago',
            message: '¿Confirmar conciliación de este pago? Esto afectará la ejecución presupuestal.',
            confirmText: 'Conciliar',
            type: 'warning'
        })) return;

        try {
            await api.post(`/treasury/payments/${paymentId}/conciliate`);
            showToast.success('Pago conciliado correctamente');
            if (selectedAccount) {
                fetchPendingPayments(selectedAccount.id);
                fetchAccounts(); // Refresh to see any updates
            }
        } catch (error: any) {
            console.error(error);
            showToast.error(error.response?.data?.error || 'Error al conciliar pago');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Tesorería</h2>
                    <p className="text-muted-foreground">Gestión de Bancos y Flujo de Caja</p>
                </div>
                <button
                    onClick={() => setIsCreateAccountOpen(true)}
                    className="px-4 py-2 bg-white border rounded shadow-sm text-sm font-medium hover:bg-gray-50"
                >
                    + Nueva Cuenta
                </button>
            </div>

            {/* Account Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accounts.map(account => (
                    <div
                        key={account.id}
                        onClick={() => setSelectedAccount(account)}
                        className={cn(
                            "group cursor-pointer border rounded-lg p-5 transition-all shadow-sm bg-white hover:ring-2 hover:ring-blue-100 relative",
                            selectedAccount?.id === account.id ? "ring-2 ring-blue-500 border-transparent shadow-md" : ""
                        )}
                    >
                        {isAdmin && (
                            <button
                                onClick={(e) => handleDeleteAccount(account.id, e)}
                                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Eliminar cuenta"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-50 rounded text-blue-600">
                                <Building2 className="w-5 h-5" />
                            </div>
                            {selectedAccount?.id === account.id && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Activa</span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{account.bankName}</p>
                            <h3 className="font-bold text-lg">{account.name}</h3>
                            <p className="text-xs text-gray-400 font-mono mt-1">**** {account.accountNumber.slice(-4)}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-sm text-gray-500">Saldo Disponible</p>
                            <p className="text-2xl font-bold text-gray-900">{Number(account.currentBalance).toLocaleString('fr-FR')} FCFA</p>
                        </div>
                    </div>
                ))}
            </div>

            {selectedAccount && (
                <div className="space-y-6">
                    {/* Pending Reconciliation Section */}
                    {pendingPayments.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                Pagos Pendientes de Conciliación ({pendingPayments.length})
                            </h3>
                            <div className="overflow-x-auto bg-white rounded border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b text-gray-500">
                                        <tr>
                                            <th className="p-3 font-medium">Fecha</th>
                                            <th className="p-3 font-medium">Referencia</th>
                                            <th className="p-3 font-medium">Factura</th>
                                            <th className="p-3 font-medium text-right">Monto</th>
                                            <th className="p-3 font-medium text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {pendingPayments.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50">
                                                <td className="p-3">{format(new Date(p.date), 'dd/MM/yyyy')}</td>
                                                <td className="p-3 font-mono text-xs">{p.reference || '-'}</td>
                                                <td className="p-3">
                                                    {p.invoice ? `${p.invoice.number} - ${p.invoice.supplierName}` : 'N/A'}
                                                </td>
                                                <td className="p-3 text-right font-bold">
                                                    {Number(p.amount).toLocaleString('fr-FR')} FCFA
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        onClick={() => handleConciliate(p.id)}
                                                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                                                    >
                                                        Conciliar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Historical Transactions */}
                    <div className="bg-white border rounded-lg shadow-sm min-h-[400px]">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Movimientos Históricos</h3>
                            <button
                                onClick={() => setIsTxModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Registrar Movimiento Manual
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b text-gray-500">
                                    <tr>
                                        <th className="p-4 font-medium">Fecha</th>
                                        <th className="p-4 font-medium">Descripción</th>
                                        <th className="p-4 font-medium">Referencia</th>
                                        <th className="p-4 font-medium text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {selectedAccount.transactions && selectedAccount.transactions.length > 0 ? (
                                        selectedAccount.transactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-gray-50">
                                                <td className="p-4 text-gray-600">
                                                    {format(new Date(tx.date), 'dd MMM yyyy', { locale: es })}
                                                </td>
                                                <td className="p-4 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {tx.type === 'DEPOSIT' ? (
                                                            <ArrowDownLeft className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <ArrowUpRight className="w-4 h-4 text-red-500" />
                                                        )}
                                                        {tx.description}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-500 text-xs font-mono">{tx.reference || '-'}</td>
                                                <td className={cn(
                                                    "p-4 text-right font-bold",
                                                    tx.type === 'DEPOSIT' ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {tx.type === 'DEPOSIT' ? '+' : '-'} {Number(tx.amount).toLocaleString('fr-FR')} FCFA
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-500">
                                                No hay movimientos recientes
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {selectedAccount && (
                <CreateTransactionModal
                    isOpen={isTxModalOpen}
                    onClose={() => setIsTxModalOpen(false)}
                    onSuccess={fetchAccounts}
                    accountId={selectedAccount.id}
                />
            )}

            <CreateAccountModal
                isOpen={isCreateAccountOpen}
                onClose={() => setIsCreateAccountOpen(false)}
                onSuccess={fetchAccounts}
            />
        </div>
    );
};
