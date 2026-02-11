import React, { useState, useEffect } from 'react';
import { BudgetAccountList } from '../components/budget/BudgetAccountList';
import { StatCard } from '../components/ui/StatCard';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import api from '../api/client';

interface BudgetStats {
    totalAllocated: number;
    totalExecuted: number;
    totalCommitted: number;
    available: number;
    executionPercentage: number;
}

export const BudgetPage = () => {
    const [stats, setStats] = useState<BudgetStats>({
        totalAllocated: 0,
        totalExecuted: 0,
        totalCommitted: 0,
        available: 0,
        executionPercentage: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/budget');
                const budgetAccounts = response.data;

                let totalAllocated = 0;
                let totalExecuted = 0;
                let totalCommitted = 0;

                budgetAccounts.forEach((account: any) => {
                    totalAllocated += Number(account.allocatedAmount || 0);
                    totalExecuted += Number(account.executed || 0);
                    totalCommitted += Number(account.committed || 0);
                });

                const available = totalAllocated - totalExecuted - totalCommitted;
                const executionPercentage = totalAllocated > 0
                    ? Math.round((totalExecuted / totalAllocated) * 100)
                    : 0;

                setStats({
                    totalAllocated,
                    totalExecuted,
                    totalCommitted,
                    available,
                    executionPercentage
                });
            } catch (error) {
                console.error('Error loading budget stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Presupuesto Asignado"
                        value={`$${stats.totalAllocated.toLocaleString()}`}
                        icon={<DollarSign className="w-6 h-6" />}
                        color="blue"
                    />
                    <StatCard
                        title="Ejecutado"
                        value={`$${stats.totalExecuted.toLocaleString()}`}
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="green"
                    />
                    <StatCard
                        title="Comprometido"
                        value={`$${stats.totalCommitted.toLocaleString()}`}
                        icon={<TrendingDown className="w-6 h-6" />}
                        color="yellow"
                    />
                    <StatCard
                        title="Disponible"
                        value={`$${stats.available.toLocaleString()}`}
                        icon={<PieChart className="w-6 h-6" />}
                        color="purple"
                    />
                </div>
            )}

            {/* Execution Percentage */}
            {!loading && (
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Ejecución Presupuestal</span>
                        <span className="text-sm font-bold text-gray-900">{stats.executionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(stats.executionPercentage, 100)}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Budget Account List */}
            <BudgetAccountList />
        </div>
    );
};
