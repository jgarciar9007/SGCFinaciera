import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Plus, Trash } from 'lucide-react';
import type { Account, ThirdParty } from '../../types';
import { cn } from '../../lib/utils';
import api from '../../api/client';

interface CreateJournalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    accounts: Account[];
}

interface LineItem {
    accountId: string;
    description: string;
    debit: string;
    credit: string;
    thirdPartyId: string;
}

export const CreateJournalModal = ({ isOpen, onClose, onSuccess, accounts }: CreateJournalModalProps) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [reference, setReference] = useState('');
    const [lines, setLines] = useState<LineItem[]>([
        { accountId: '', description: '', debit: '0', credit: '0', thirdPartyId: '' },
        { accountId: '', description: '', debit: '0', credit: '0', thirdPartyId: '' }
    ]);
    const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            api.get('/settings/third-parties')
                .then(res => setThirdParties(res.data))
                .catch(console.error);
        }
    }, [isOpen]);

    // Calculations
    const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const handleAddLine = () => {
        setLines([...lines, { accountId: '', description: '', debit: '0', credit: '0', thirdPartyId: '' }]);
    };

    const handleRemoveLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof LineItem, value: string) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isBalanced) {
            setError(`Asiento descuadrado. Diferencia: ${(totalDebit - totalCredit).toFixed(2)}`);
            return;
        }

        if (lines.some(l => !l.accountId)) {
            setError('Todas las líneas deben tener una cuenta seleccionada.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/accounting/entries', {
                date,
                description,
                reference,
                lines: lines.map(l => ({
                    accountId: parseInt(l.accountId),
                    description: l.description || description,
                    debit: parseFloat(l.debit) || 0,
                    credit: parseFloat(l.credit) || 0,
                    thirdPartyId: l.thirdPartyId ? parseInt(l.thirdPartyId) : undefined
                }))
            });
            onSuccess();
            onClose();
            // Reset form
            setDescription('');
            setReference('');
            setLines([
                { accountId: '', description: '', debit: '0', credit: '0', thirdPartyId: '' },
                { accountId: '', description: '', debit: '0', credit: '0', thirdPartyId: '' }
            ]);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Error al guardar el asiento.');
        } finally {
            setLoading(false);
        }
    };

    const sortedAccounts = [...accounts].sort((a, b) => a.code.localeCompare(b.code));

    return (
        <Modal title="Nuevo Asiento Contable" isOpen={isOpen} onClose={onClose} maxWidth="max-w-5xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md">
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha</label>
                        <input
                            type="date"
                            className="w-full border rounded p-2 text-sm"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Descripción General</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2 text-sm"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            required
                            placeholder="e.g. Ajuste mensual de..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Referencia</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2 text-sm"
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            placeholder="Doc. Ref"
                        />
                    </div>
                </div>

                {/* Lines */}
                <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="p-2 text-left w-1/4">Cuenta</th>
                                <th className="p-2 text-left w-1/5">Tercero (Opcional)</th>
                                <th className="p-2 text-left">Detalle</th>
                                <th className="p-2 text-right w-24">Débito</th>
                                <th className="p-2 text-right w-24">Crédito</th>
                                <th className="p-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {lines.map((line, index) => (
                                <tr key={index}>
                                    <td className="p-2">
                                        <select
                                            className="w-full border rounded p-1"
                                            value={line.accountId}
                                            onChange={e => updateLine(index, 'accountId', e.target.value)}
                                            required
                                        >
                                            <option value="">Seleccionar...</option>
                                            {sortedAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.code} - {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <select
                                            className="w-full border rounded p-1"
                                            value={line.thirdPartyId}
                                            onChange={e => updateLine(index, 'thirdPartyId', e.target.value)}
                                        >
                                            <option value="">Ninguno</option>
                                            {thirdParties.map(tp => (
                                                <option key={tp.id} value={tp.id}>
                                                    {tp.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            className="w-full border rounded p-1"
                                            value={line.description}
                                            onChange={e => updateLine(index, 'description', e.target.value)}
                                            placeholder={description}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number" step="0.01"
                                            className="w-full border rounded p-1 text-right"
                                            value={line.debit}
                                            onChange={e => updateLine(index, 'debit', e.target.value)}
                                            onFocus={e => e.target.select()}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number" step="0.01"
                                            className="w-full border rounded p-1 text-right"
                                            value={line.credit}
                                            onChange={e => updateLine(index, 'credit', e.target.value)}
                                            onFocus={e => e.target.select()}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button type="button" onClick={() => handleRemoveLine(index)} className="text-red-500 hover:text-red-700">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-semibold">
                            <tr>
                                <td colSpan={3} className="p-2">
                                    <button type="button" onClick={handleAddLine} className="flex items-center text-blue-600 hover:text-blue-800 text-xs uppercase tracking-wide">
                                        <Plus className="w-4 h-4 mr-1" /> Agregar Línea
                                    </button>
                                </td>
                                <td className="p-2 text-right text-gray-900">{totalDebit.toFixed(2)}</td>
                                <td className="p-2 text-right text-gray-900">{totalCredit.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer/Error */}
                <div className="flex justify-between items-center pt-2">
                    <div className="text-sm">
                        {!isBalanced && (
                            <span className="text-red-600 font-bold block">
                                DIFERENCIA: {(totalDebit - totalCredit).toFixed(2)}
                            </span>
                        )}
                        {error && <span className="text-red-600 block">{error}</span>}
                    </div>

                    <div className="flex gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!isBalanced || loading}
                            className={cn(
                                "px-4 py-2 rounded text-sm text-white transition-colors",
                                isBalanced ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
                            )}
                        >
                            {loading ? 'Guardando...' : 'Registrar Asiento'}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
