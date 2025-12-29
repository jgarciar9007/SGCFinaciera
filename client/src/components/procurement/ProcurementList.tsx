import { useState, useEffect } from 'react';
import api from '../../api/client';
import type { PurchaseOrder } from '../../types';
import { CheckCircle, Truck, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CreatePOModal } from './CreatePOModal';
import { Modal } from '../ui/Modal';

export const ProcurementList = () => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Reception Modal State
    const [receptionModalOpen, setReceptionModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [receptionNote, setReceptionNote] = useState('');

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/procurement');
            setOrders(response.data);
            setError('');
        } catch (err: any) {
            console.error(err);
            const status = err.response?.status;
            const msg = err.response?.data?.error || err.message;
            setError(`Error al cargar órdenes de compra: ${status} - ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleReception = async () => {
        if (!selectedOrderId) return;
        try {
            await api.post(`/procurement/${selectedOrderId}/reception`, { note: receptionNote });
            setReceptionModalOpen(false);
            setReceptionNote('');
            fetchOrders();
        } catch (err) {
            alert('Error al registrar la recepción');
        }
    };

    const openReceptionModal = (id: number) => {
        setSelectedOrderId(id);
        setReceptionModalOpen(true);
    };

    const translateStatus = (status: string) => {
        switch (status) {
            case 'ISSUED': return 'EMITIDA';
            case 'RECEIVED': return 'RECIBIDA';
            default: return status;
        }
    };

    if (loading) return <div>Cargando órdenes...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Compras y Adquisiciones</h2>
                    <p className="text-muted-foreground">Gestión de Ordenes de Compra y Recepción de bienes/servicios.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" /> Generar Orden
                </button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Fecha</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Proveedor</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Ref. Gasto</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Total</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Estado</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {orders.map((po) => (
                                <tr key={po.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">PO-{po.id}</td>
                                    <td className="p-4 align-middle">{new Date(po.date).toLocaleDateString()}</td>
                                    <td className="p-4 align-middle font-medium">{po.supplierName}</td>
                                    <td className="p-4 align-middle text-muted-foreground">Sol. #{po.expenseRequestId}</td>
                                    <td className="p-4 align-middle font-bold">{Number(po.totalAmount).toLocaleString('fr-FR')} FCFA</td>
                                    <td className="p-4 align-middle">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-semibold",
                                            po.status === 'RECEIVED' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                        )}>
                                            {translateStatus(po.status)}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        {po.status === 'ISSUED' && (
                                            <button
                                                onClick={() => openReceptionModal(po.id)}
                                                className="inline-flex items-center gap-1 text-xs bg-slate-900 text-white px-2 py-1 rounded hover:bg-slate-700"
                                            >
                                                <Truck className="w-3 h-3" /> Recibir
                                            </button>
                                        )}
                                        {po.status === 'RECEIVED' && (
                                            <span className="flex justify-end text-green-600">
                                                <CheckCircle className="w-5 h-5" />
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-4 text-center text-muted-foreground">No hay órdenes registradas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreatePOModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchOrders}
            />

            <Modal title="Registrar Recepción" isOpen={receptionModalOpen} onClose={() => setReceptionModalOpen(false)}>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Confirme que ha recibido los bienes o servicios correspondientes a la Orden de Compra <strong>PO-{selectedOrderId}</strong>.
                    </p>
                    <textarea
                        className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="Nota de recepción (opcional)"
                        value={receptionNote}
                        onChange={(e) => setReceptionNote(e.target.value)}
                        rows={3}
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setReceptionModalOpen(false)} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded">Cancelar</button>
                        <button onClick={handleReception} className="px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded">Confirmar Recepción</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
