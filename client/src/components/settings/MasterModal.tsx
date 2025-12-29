import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import type { Account, ThirdParty, Program, Bank } from '../../types';
import { cn } from '../../lib/utils'; // Assuming this exists or generic class usage

type ModalType = 'ACCOUNT' | 'THIRD_PARTY' | 'PROGRAM' | 'BANK' | 'BUDGET';

interface MasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    type: ModalType;
    initialData?: any;
    accounts?: Account[]; // For parent selection in Account
}

export const MasterModal = ({ isOpen, onClose, onSave, type, initialData, accounts }: MasterModalProps) => {
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            // Defaults
            if (type === 'ACCOUNT') setFormData({ level: 1, nature: 'A', isMovement: false, isActive: true });
            if (type === 'THIRD_PARTY') setFormData({ type: 'PROV', isActive: true });
            if (type === 'PROGRAM') setFormData({ isActive: true });
            if (type === 'BANK') setFormData({ isActive: true });
            if (type === 'BUDGET') setFormData({ year: new Date().getFullYear(), allocatedAmount: 0 });
        }
    }, [initialData, type, isOpen]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const renderAccountForm = () => (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Código</label>
                    <input className="w-full border rounded p-2 text-sm" value={formData.code || ''} onChange={e => handleChange('code', e.target.value)} required />
                </div>
                <div>
                    <label className="text-sm font-medium">Nombre</label>
                    <input className="w-full border rounded p-2 text-sm" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <label className="text-sm font-medium">Nivel</label>
                    <input type="number" className="w-full border rounded p-2 text-sm" value={formData.level || 1} onChange={e => handleChange('level', parseInt(e.target.value))} required />
                </div>
                <div>
                    <label className="text-sm font-medium">Naturaleza</label>
                    <select className="w-full border rounded p-2 text-sm" value={formData.nature || 'A'} onChange={e => handleChange('nature', e.target.value)}>
                        <option value="A">Activo</option>
                        <option value="P">Pasivo</option>
                        <option value="K">Patrimonio</option>
                        <option value="I">Ingresos</option>
                        <option value="G">Gastos</option>
                    </select>
                </div>
            </div>
            <div className="mt-2">
                <label className="text-sm font-medium">Cuenta Padre</label>
                <select className="w-full border rounded p-2 text-sm" value={formData.parentId || ''} onChange={e => handleChange('parentId', e.target.value ? parseInt(e.target.value) : null)}>
                    <option value="">(Raíz)</option>
                    {accounts?.filter(a => a.id !== formData.id).map(a => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                </select>
            </div>
            <div className="mt-2 flex items-center gap-2">
                <input type="checkbox" checked={formData.isMovement || false} onChange={e => handleChange('isMovement', e.target.checked)} />
                <label className="text-sm">Es cuenta de movimiento (detalle)</label>
            </div>
        </>
    );

    const renderThirdPartyForm = () => (
        <>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <select className="w-full border rounded p-2 text-sm" value={formData.type || 'PROV'} onChange={e => handleChange('type', e.target.value)}>
                        <option value="PROV">Proveedor</option>
                        <option value="CLI">Cliente</option>
                        <option value="EMP">Empleado</option>
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="text-sm font-medium">Identificación (RUC/DNI)</label>
                    <input className="w-full border rounded p-2 text-sm" value={formData.identification || ''} onChange={e => handleChange('identification', e.target.value)} />
                </div>
            </div>
            <div className="mt-2">
                <label className="text-sm font-medium">Nombre / Razón Social</label>
                <input className="w-full border rounded p-2 text-sm" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <label className="text-sm font-medium">Email</label>
                    <input type="email" className="w-full border rounded p-2 text-sm" value={formData.email || ''} onChange={e => handleChange('email', e.target.value)} />
                </div>
                <div>
                    <label className="text-sm font-medium">Teléfono</label>
                    <input className="w-full border rounded p-2 text-sm" value={formData.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
                </div>
            </div>
            <div className="mt-2">
                <label className="text-sm font-medium">Dirección</label>
                <input className="w-full border rounded p-2 text-sm" value={formData.address || ''} onChange={e => handleChange('address', e.target.value)} />
            </div>
            <div className="mt-2 flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive ?? true} onChange={e => handleChange('isActive', e.target.checked)} />
                <label className="text-sm">Activo</label>
            </div>
        </>
    );

    const renderProgramForm = () => (
        <>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="text-sm font-medium">Código</label>
                    <input className="w-full border rounded p-2 text-sm" value={formData.code || ''} onChange={e => handleChange('code', e.target.value)} required />
                </div>
                <div className="col-span-2">
                    <label className="text-sm font-medium">Nombre del Programa</label>
                    <input className="w-full border rounded p-2 text-sm" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} required />
                </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive ?? true} onChange={e => handleChange('isActive', e.target.checked)} />
                <label className="text-sm">Activo</label>
            </div>
        </>
    );

    const renderBankForm = () => (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Nombre del Banco</label>
                    <input className="w-full border rounded p-2 text-sm" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} required />
                </div>
                <div>
                    <label className="text-sm font-medium">SWIFT / Código</label>
                    <input className="w-full border rounded p-2 text-sm" value={formData.swift || ''} onChange={e => handleChange('swift', e.target.value)} />
                </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
                <input type="checkbox" checked={formData.isActive ?? true} onChange={e => handleChange('isActive', e.target.checked)} />
                <label className="text-sm">Activo</label>
            </div>
        </>
    );

    const renderBudgetForm = () => (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Código Presupuestal</label>
                    <input className="w-full border rounded p-2 text-sm" value={formData.code || ''} onChange={e => handleChange('code', e.target.value)} required />
                </div>
                <div>
                    <label className="text-sm font-medium">Nombre</label>
                    <input className="w-full border rounded p-2 text-sm" value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} required />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                    <label className="text-sm font-medium">Año Fiscal</label>
                    <input type="number" className="w-full border rounded p-2 text-sm" value={formData.year || new Date().getFullYear()} onChange={e => handleChange('year', parseInt(e.target.value))} required />
                </div>
                <div>
                    <label className="text-sm font-medium">Monto Asignado</label>
                    <input type="number" className="w-full border rounded p-2 text-sm" value={formData.allocatedAmount || 0} onChange={e => handleChange('allocatedAmount', parseFloat(e.target.value))} required />
                </div>
            </div>
        </>
    );

    const getTitle = () => {
        const prefix = initialData ? 'Editar' : 'Nuevo';
        switch (type) {
            case 'ACCOUNT': return `${prefix} Cuenta Contable`;
            case 'THIRD_PARTY': return `${prefix} Tercero`;
            case 'PROGRAM': return `${prefix} Programa`;
            case 'BANK': return `${prefix} Banco`;
            case 'BUDGET': return `${prefix} Rubro Presupuestal`;
            default: return prefix;
        }
    }

    return (
        <Modal title={getTitle()} isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {type === 'ACCOUNT' && renderAccountForm()}
                {type === 'THIRD_PARTY' && renderThirdPartyForm()}
                {type === 'PROGRAM' && renderProgramForm()}
                {type === 'BANK' && renderBankForm()}
                {type === 'BUDGET' && renderBudgetForm()}

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">Cancelar</button>
                    <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
                </div>
            </form>
        </Modal>
    );
};
