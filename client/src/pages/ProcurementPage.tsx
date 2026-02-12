import React, { useState, useEffect } from 'react';
import { ProcurementList } from '../components/procurement/ProcurementList';
import { StatCard } from '../components/ui/StatCard';
import { ShoppingCart, Package, CheckCircle, Clock } from 'lucide-react';
import api from '../api/client';

interface ProcurementStats {
    totalOrders: number;
    issued: number;
    received: number;
    pending: number;
}

export const ProcurementPage = () => {
    const [stats, setStats] = useState<ProcurementStats>({
        totalOrders: 0,
        issued: 0,
        received: 0,
        pending: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/procurement/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Error loading procurement stats:', error);
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
                        title="Total Órdenes"
                        value={stats.totalOrders}
                        icon={<ShoppingCart className="w-6 h-6" />}
                        color="blue"
                    />
                    <StatCard
                        title="Emitidas"
                        value={stats.issued}
                        icon={<Package className="w-6 h-6" />}
                        color="yellow"
                    />
                    <StatCard
                        title="Recibidas"
                        value={stats.received}
                        icon={<CheckCircle className="w-6 h-6" />}
                        color="green"
                    />
                    <StatCard
                        title="Pendientes"
                        value={stats.pending}
                        icon={<Clock className="w-6 h-6" />}
                        color="red"
                    />
                </div>
            )}

            {/* Procurement List */}
            <ProcurementList />
        </div>
    );
};
