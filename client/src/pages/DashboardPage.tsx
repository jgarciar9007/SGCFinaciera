import { useEffect, useState } from 'react';
import api from '../api/client';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/formatters';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Wallet, TrendingUp, AlertCircle, FileText, CheckCircle,
    Building2, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

// Types
interface DashboardData {
    bankAccounts: any[];
    totalCash: number;
    procurement: {
        pendingOrders: number;
        totalInvoices: number;
        paidInvoices: number;
        unpaidInvoices: number;
    };
    pendingInvoices: { count: number; amount: number };
    budget: {
        allocated: number;
        committed: number;
        executed: number;
        percent: number;
    };
    recentActivity: {
        expenses: any[];
        invoices: any[];
    };
    chartData: any[];
}

import { CreateAccountModal } from '../components/treasury/CreateAccountModal';

export const DashboardPage = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await api.get('/dashboard/stats');
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando Dashboard...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Error al cargar datos</div>;

    // ... existing pieData ...
    const pieData = [
        { name: 'Ejecutado', value: data.budget.executed },
        { name: 'Comprometido', value: data.budget.committed },
        { name: 'Disponible', value: Math.max(0, data.budget.allocated - data.budget.executed - data.budget.committed) },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Tesorería"
                    value={formatCurrency(data.totalCash)}
                    icon={<Wallet className="text-blue-600 w-6 h-6" />}
                    trend="+12% vs mes anterior"
                    color="bg-blue-50 border-blue-100"
                />
                <StatCard
                    title="Ejecución Presupuestal"
                    value={`${data.budget.percent.toFixed(1)}%`}
                    icon={<TrendingUp className="text-green-600 w-6 h-6" />}
                    subValue={`De ${formatCurrency(data.budget.allocated)}`}
                    color="bg-green-50 border-green-100"
                />
                <StatCard
                    title="Facturas Pendientes"
                    value={`${data.pendingInvoices.count}`}
                    icon={<AlertCircle className="text-red-600 w-6 h-6" />}
                    subValue={`Total: ${formatCurrency(data.pendingInvoices.amount)}`}
                    color="bg-red-50 border-red-100"
                />
                <StatCard
                    title="Órdenes de Compra"
                    value={`${data.procurement?.pendingOrders || 0}`}
                    icon={<FileText className="text-purple-600 w-6 h-6" />}
                    subValue={`Pendientes/Parciales`}
                    color="bg-purple-50 border-purple-100"
                />
            </div>

            {/* Procurement KPIs */}
            <div>
                <h3 className="text-lg font-bold mb-3 text-gray-700">Compras y Facturación</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Facturas</p>
                                <p className="text-2xl font-bold text-gray-800">{data.procurement?.totalInvoices || 0}</p>
                            </div>
                            <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Facturas Pagadas</p>
                                <p className="text-2xl font-bold text-green-600">{data.procurement?.paidInvoices || 0}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Facturas Sin Pagar</p>
                                <p className="text-2xl font-bold text-red-600">{data.procurement?.unpaidInvoices || 0}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bank Accounts Row */}
            <div>
                <h3 className="text-lg font-bold mb-3 text-gray-700">Cuentas Bancarias</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {data.bankAccounts.map((acc: any) => (
                        <div key={acc.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-1.5 bg-gray-100 rounded text-gray-600"><Building2 className="w-4 h-4" /></div>
                                <span className="text-xs font-mono text-gray-400">*{acc.accountNumber.slice(-4)}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-500 truncate">{acc.bankName}</p>
                            <p className="text-lg font-bold text-gray-800">{formatCurrency(Number(acc.currentBalance))}</p>
                        </div>
                    ))}
                    <div
                        onClick={() => setIsCreateAccountOpen(true)}
                        className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        <span className="text-sm font-medium">+ Agregar Cuenta</span>
                    </div>
                </div>
            </div>

            {/* ... Charts Row ... */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ... existing charts ... */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="font-bold text-gray-700 mb-4">Ejecución Mensual</h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `${val / 1000}k`} />
                                <Tooltip formatter={(val: any) => formatCurrency(val)} />
                                <Bar dataKey="executed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="font-bold text-gray-700 mb-4">Distribución Anual</h3>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#fbbf24', '#e5e7eb'][index]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: any) => formatCurrency(val)} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ... Recent Activity Row ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Expenses */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" /> Últimas Aprobaciones
                        </h3>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="divide-y">
                        {data.recentActivity.expenses.map((exp: any) => (
                            <div key={exp.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-sm text-gray-800">{exp.description}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Por: {exp.requester.fullName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm">{formatCurrency(Number(exp.totalAmount))}</p>
                                    <p className="text-xs text-gray-400">{format(new Date(exp.updatedAt), 'dd MMM')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Invoices */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" /> Facturas Recientes
                        </h3>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="divide-y">
                        {data.recentActivity.invoices.map((inv: any) => (
                            <div key={inv.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-sm text-gray-800">{inv.supplierName} - #{inv.number}</p>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                        inv.status === 'PAID' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    )}>
                                        {inv.status}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm">{formatCurrency(Number(inv.totalAmount))}</p>
                                    <p className="text-xs text-gray-400">{format(new Date(inv.date), 'dd MMM')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <CreateAccountModal
                isOpen={isCreateAccountOpen}
                onClose={() => setIsCreateAccountOpen(false)}
                onSuccess={fetchStats}
            />
        </div>
    );
};

const StatCard = ({ title, value, subValue, icon, trend, color }: any) => (
    <div className={cn("p-6 rounded-xl border transition-all", color || "bg-white")}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className="p-3 bg-white/60 rounded-lg shadow-sm backdrop-blur-sm">
                {icon}
            </div>
        </div>
        {(subValue || trend) && (
            <div className="flex items-center gap-2 mt-2">
                {trend && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">{trend}</span>}
                {subValue && <span className="text-xs text-gray-500 font-medium">{subValue}</span>}
            </div>
        )}
    </div>
);
