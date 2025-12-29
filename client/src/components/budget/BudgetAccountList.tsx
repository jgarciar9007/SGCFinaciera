import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import type { BudgetAccount } from '../../types';
import { ChevronRight, ChevronDown, Plus, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CreateAccountModal } from './CreateAccountModal';

export const BudgetAccountList = () => {
    const [accounts, setAccounts] = useState<BudgetAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/budget');
            setAccounts(response.data);
            setError('');
        } catch (err) {
            setError('Failed to load budget accounts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    if (loading) return <div>Loading budget...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Cuentas Presupuestales</h2>
                    <p className="text-muted-foreground">Gestiona y controla la ejecución del presupuesto.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                >
                    <Plus className="w-4 h-4" /> Nueva Cuenta
                </button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar cuenta..."
                            className="w-full pl-9 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Código</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Nombre</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Asignado</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ejecutado</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Disponible</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {accounts.map((account) => (
                                <tr key={account.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">{account.code}</td>
                                    <td className="p-4 align-middle">{account.name}</td>
                                    <td className="p-4 align-middle text-right">${account.allocatedAmount.toLocaleString()}</td>
                                    <td className="p-4 align-middle text-right text-yellow-600">${account.executed.toLocaleString()}</td>
                                    <td className={cn(
                                        "p-4 align-middle text-right font-bold",
                                        account.available < 0 ? "text-red-500" : "text-green-600"
                                    )}>
                                        ${account.available.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {accounts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">No hay cuentas registradas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateAccountModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAccounts}
            />
        </div>
    );
};
