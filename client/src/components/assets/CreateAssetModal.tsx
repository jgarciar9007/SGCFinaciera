
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Tag, MapPin, DollarSign, FileText } from 'lucide-react';

interface CreateAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateAssetModal = ({ isOpen, onClose, onSuccess }: CreateAssetModalProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        value: 0,
        location: '',
        purchaseOrderId: '', // Optional Linking
        invoiceId: ''        // Optional Linking
    });

    const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Load POs and Invoices for linking
            api.get('/procurement/orders').then(res => setPurchaseOrders(res.data)).catch(console.error);
            api.get('/billing/invoices').then(res => setInvoices(res.data)).catch(console.error);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/assets', {
                ...formData,
                value: Number(formData.value),
                purchaseOrderId: formData.purchaseOrderId ? Number(formData.purchaseOrderId) : null,
                invoiceId: formData.invoiceId ? Number(formData.invoiceId) : null,
                status: 'ACTIVE'
            });
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                code: '', name: '', description: '', purchaseDate: new Date().toISOString().split('T')[0], value: 0, location: '', purchaseOrderId: '', invoiceId: ''
            });
        } catch (error) {
            console.error(error);
            alert('Error al crear activo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nuevo Activo">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Código / Inventario</label>
                        <div className="relative">
                            <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                required
                                type="text"
                                className="w-full pl-9 border rounded-md px-3 py-2"
                                placeholder="Ej. CPU-001"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre</label>
                        <input
                            required
                            type="text"
                            className="w-full border rounded-md px-3 py-2"
                            placeholder="Ej. Laptop HP"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Descripción</label>
                    <textarea
                        className="w-full border rounded-md px-3 py-2"
                        rows={2}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Valor de Compra (FCFA)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                required
                                type="number"
                                min="0"
                                className="w-full pl-9 border rounded-md px-3 py-2"
                                value={formData.value}
                                onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha Compra</label>
                        <input
                            required
                            type="date"
                            className="w-full border rounded-md px-3 py-2"
                            value={formData.purchaseDate}
                            onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Ubicación</label>
                    <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            className="w-full pl-9 border rounded-md px-3 py-2"
                            placeholder="Ej. Oficina Dirección"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>
                </div>

                <div className="border-t pt-4 mt-4">
                    <p className="text-sm font-medium mb-2 text-gray-700">Origen (Opcional)</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Vincular Orden de Compra</label>
                            <select
                                className="w-full border rounded-md px-3 py-2 text-sm"
                                value={formData.purchaseOrderId}
                                onChange={e => setFormData({ ...formData, purchaseOrderId: e.target.value })}
                            >
                                <option value="">-- Seleccionar OC --</option>
                                {purchaseOrders.map(po => (
                                    <option key={po.id} value={po.id}>
                                        #{po.id} - {po.supplierName} ({Number(po.totalAmount).toLocaleString()} FCFA)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Vincular Factura</label>
                            <select
                                className="w-full border rounded-md px-3 py-2 text-sm"
                                value={formData.invoiceId}
                                onChange={e => setFormData({ ...formData, invoiceId: e.target.value })}
                            >
                                <option value="">-- Seleccionar Factura --</option>
                                {invoices.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.number} - {inv.supplierName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Registrar Activo'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
