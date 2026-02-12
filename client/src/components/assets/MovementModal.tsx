import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import api from '../../api/client';
import { cn } from '../../lib/utils';
import type { User, Area } from '../../types';
import { showToast } from '../../lib/toast';

interface MovementModalProps {
    asset: { id: number; name: string; code?: string; status: string; quantity: number };
    onClose: () => void;
    onSuccess: () => void;
}

export const MovementModal = ({ asset, onClose, onSuccess }: MovementModalProps) => {
    const [type, setType] = useState('ASSIGNMENT');
    const [quantity, setQuantity] = useState(1);
    const [assignedToUserId, setAssignedToUserId] = useState('');
    const [assignedToAreaId, setAssignedToAreaId] = useState('');
    const [notes, setNotes] = useState('');

    const [users, setUsers] = useState<User[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
        // Reset form
        setType('ASSIGNMENT');
        setQuantity(1);
        setAssignedToUserId('');
        setAssignedToAreaId('');
        setNotes('');
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, areasRes] = await Promise.all([
                api.get('/settings/users'),
                api.get('/settings/areas')
            ]);
            setUsers(usersRes.data);
            setAreas(areasRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!asset) return;
        setLoading(true);

        try {
            await api.post('/inventory/movements', {
                assetId: asset.id,
                type,
                quantity,
                assignedToUserId: assignedToUserId || null,
                areaId: assignedToAreaId || null,
                notes
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            showToast.error('Error al registrar movimiento');
        } finally {
            setLoading(false);
        }
    };

    if (!asset) return null;

    const inputClasses = "w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none";
    const labelClasses = "text-sm font-medium text-gray-700";

    return (
        <Modal title={`Registrar Movimiento - ${asset.name}`} isOpen={true} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className={labelClasses}>Tipo de Movimiento</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className={inputClasses}
                    >
                        <option value="ASSIGNMENT">Asignación / Salida</option>
                        <option value="RETURN">Devolución / Reingreso</option>
                        <option value="DISPOSAL">Baja / Desecho</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className={labelClasses}>Cantidad</label>
                    <input
                        type="number"
                        min="1"
                        max={type === 'ASSIGNMENT' || type === 'DISPOSAL' ? asset.quantity : undefined}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className={inputClasses}
                        required
                    />
                    <p className="text-xs text-gray-500">Disponible: {asset.quantity}</p>
                </div>

                {type === 'ASSIGNMENT' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={labelClasses}>Asignar a Persona</label>
                                <select
                                    value={assignedToUserId}
                                    onChange={(e) => {
                                        setAssignedToUserId(e.target.value);
                                        if (e.target.value) setAssignedToAreaId(''); // Mutually exclusive usually? Or complement? Let's allow both or one.
                                    }}
                                    className={inputClasses}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.fullName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className={labelClasses}>Asignar a Área</label>
                                <select
                                    value={assignedToAreaId}
                                    onChange={(e) => {
                                        setAssignedToAreaId(e.target.value);
                                        // if (e.target.value) setAssignedToUserId(''); 
                                    }}
                                    className={inputClasses}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {areas.map(area => (
                                        <option key={area.id} value={area.id}>{area.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Puede seleccionar Responsable, Área o ambos.</p>
                    </>
                )}

                <div className="space-y-2">
                    <label className={labelClasses}>Notas / Observaciones</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className={inputClasses}
                        rows={3}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors",
                            loading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {loading ? 'Guardando...' : 'Registrar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
