import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import type { Invoice, Payment } from '../../types';
import { ChevronDown, ChevronUp, Check, AlertCircle, Plus, CreditCard, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { CreatePaymentModal } from './CreatePaymentModal';

export const BillingList = () => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, payRes] = await Promise.all([
                api.get('/billing/invoices'),
                api.get('/billing/payments')
            ]);
            setInvoices(invRes.data);
            setPayments(payRes.data);
        } catch (err) {
            console.error('Failed to load billing data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'PARTIAL': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-red-100 text-red-800';
        }
    };

    if (loading) return <div>Loading billing data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Facturación y Pagos</h2>
                    <p className="text-muted-foreground">Control de cuentas por pagar y tesorería.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setInvoiceModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800"
                    >
                        <Plus className="w-4 h-4" /> Registrar Factura
                    </button>
                    <button
                        onClick={() => setPaymentModalOpen(true)}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                        <CreditCard className="w-4 h-4" /> Registrar Pago
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b">
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'invoices' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Facturas
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'payments' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Historial de Pagos
                </button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <div className="relative w-full overflow-auto">
                    {activeTab === 'invoices' ? (
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">No. Factura</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Proveedor</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Fecha</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Vencimiento</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Total</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{inv.id}</td>
                                        <td className="p-4 align-middle flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            {inv.number}
                                        </td>
                                        <td className="p-4 align-middle">{inv.supplierName}</td>
                                        <td className="p-4 align-middle">{new Date(inv.date).toLocaleDateString()}</td>
                                        <td className="p-4 align-middle text-red-600">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                                        <td className="p-4 align-middle text-right font-bold">${inv.totalAmount.toLocaleString()}</td>
                                        <td className="p-4 align-middle">
                                            <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", getStatusColor(inv.status))}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                    <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No hay facturas registradas.</td></tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID Pago</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Fecha</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Factura Ref.</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Referencia</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {payments.map((pay) => (
                                    <tr key={pay.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">PAY-{pay.id}</td>
                                        <td className="p-4 align-middle">{new Date(pay.date).toLocaleDateString()}</td>
                                        <td className="p-4 align-middle">ID: {pay.invoiceId}</td>
                                        <td className="p-4 align-middle">{pay.reference || '-'}</td>
                                        <td className="p-4 align-middle text-right font-bold text-green-600">${pay.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No hay pagos registrados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <CreateInvoiceModal
                isOpen={invoiceModalOpen}
                onClose={() => setInvoiceModalOpen(false)}
                onSuccess={fetchData}
            />

            <CreatePaymentModal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                onSuccess={fetchData}
            />
        </div>
    );
};
