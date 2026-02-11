import React, { useState, useEffect } from 'react';
import { BillingList } from '../components/billing/BillingList';
import { StatCard } from '../components/ui/StatCard';
import { DollarSign, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api/client';

interface BillingStats {
    totalInvoices: number;
    unpaidInvoices: number;
    totalUnpaid: number;
    paidThisMonth: number;
}

export const BillingPage = () => {
    const [stats, setStats] = useState<BillingStats>({
        totalInvoices: 0,
        unpaidInvoices: 0,
        totalUnpaid: 0,
        paidThisMonth: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/billing/invoices');
                const invoices = response.data;

                const unpaid = invoices.filter((inv: any) => inv.status === 'UNPAID');
                const totalUnpaid = unpaid.reduce((sum: number, inv: any) => sum + Number(inv.totalAmount), 0);

                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const paidThisMonth = invoices.filter((inv: any) => {
                    const invDate = new Date(inv.date);
                    return inv.status === 'PAID' &&
                        invDate.getMonth() === currentMonth &&
                        invDate.getFullYear() === currentYear;
                }).length;

                setStats({
                    totalInvoices: invoices.length,
                    unpaidInvoices: unpaid.length,
                    totalUnpaid,
                    paidThisMonth
                });
            } catch (error) {
                console.error('Error loading billing stats:', error);
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
                        title="Total Facturas"
                        value={stats.totalInvoices}
                        icon={<FileText className="w-6 h-6" />}
                        color="blue"
                    />
                    <StatCard
                        title="Facturas Pendientes"
                        value={stats.unpaidInvoices}
                        icon={<AlertCircle className="w-6 h-6" />}
                        color="red"
                    />
                    <StatCard
                        title="Total Pendiente"
                        value={`$${stats.totalUnpaid.toLocaleString()}`}
                        icon={<DollarSign className="w-6 h-6" />}
                        color="yellow"
                    />
                    <StatCard
                        title="Pagadas Este Mes"
                        value={stats.paidThisMonth}
                        icon={<CheckCircle className="w-6 h-6" />}
                        color="green"
                    />
                </div>
            )}

            {/* Billing List */}
            <BillingList />
        </div>
    );
};
