import React, { useState, useEffect } from 'react';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { StatCard } from '../components/ui/StatCard';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/client';

interface ExpenseStats {
    totalRequests: number;
    pending: number;
    approved: number;
    rejected: number;
}

export const ExpensesPage = () => {
    const [stats, setStats] = useState<ExpenseStats>({
        totalRequests: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/expenses');
                const expenses = response.data;

                setStats({
                    totalRequests: expenses.length,
                    pending: expenses.filter((e: any) => e.status === 'SUBMITTED').length,
                    approved: expenses.filter((e: any) => e.status === 'APPROVED').length,
                    rejected: expenses.filter((e: any) => e.status === 'REJECTED').length
                });
            } catch (error) {
                console.error('Error loading expense stats:', error);
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
                        title="Total Solicitudes"
                        value={stats.totalRequests}
                        icon={<FileText className="w-6 h-6" />}
                        color="blue"
                    />
                    <StatCard
                        title="Pendientes"
                        value={stats.pending}
                        icon={<Clock className="w-6 h-6" />}
                        color="yellow"
                    />
                    <StatCard
                        title="Aprobadas"
                        value={stats.approved}
                        icon={<CheckCircle className="w-6 h-6" />}
                        color="green"
                    />
                    <StatCard
                        title="Rechazadas"
                        value={stats.rejected}
                        icon={<XCircle className="w-6 h-6" />}
                        color="red"
                    />
                </div>
            )}

            {/* Expense List */}
            <ExpenseList />
        </div>
    );
};
