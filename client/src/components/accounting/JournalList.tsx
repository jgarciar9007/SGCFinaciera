import React, { useState } from 'react';
import type { JournalEntry } from '../../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface JournalListProps {
    entries: JournalEntry[];
}

export const JournalList = ({ entries }: JournalListProps) => {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3 text-left w-12 text-center">#</th>
                            <th className="p-3 text-left">Fecha</th>
                            <th className="p-3 text-left">Descripción</th>
                            <th className="p-3 text-left">Referencia</th>
                            <th className="p-3 text-right">Total</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {entries.map((entry) => (
                            <React.Fragment key={entry.id}>
                                <tr
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => toggleExpand(entry.id)}
                                >
                                    <td className="p-3 text-center text-gray-500">{entry.id}</td>
                                    <td className="p-3 font-medium whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                                    <td className="p-3">{entry.description}</td>
                                    <td className="p-3 text-gray-500 font-mono text-xs">{entry.reference || '-'}</td>
                                    <td className="p-3 text-right font-medium">
                                        {/* Sum positive lines (debits) roughly represents transaction volume */}
                                        {entry.lines.reduce((sum, l) => sum + Number(l.debit), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-gray-400">
                                        {expandedId === entry.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </td>
                                </tr>
                                {expandedId === entry.id && (
                                    <tr>
                                        <td colSpan={6} className="bg-gray-50 p-4 shadow-inner">
                                            <div className="bg-white border rounded text-xs overflow-hidden">
                                                <div className="grid grid-cols-12 bg-gray-100 font-semibold p-2 border-b">
                                                    <div className="col-span-2">Cuenta</div>
                                                    <div className="col-span-4">Nombre Cuenta</div>
                                                    <div className="col-span-4">Detalle</div>
                                                    <div className="col-span-1 text-right">Débito</div>
                                                    <div className="col-span-1 text-right">Crédito</div>
                                                </div>
                                                {entry.lines.map((line) => (
                                                    <div key={line.id} className="grid grid-cols-12 p-2 border-b last:border-0 hover:bg-gray-50">
                                                        <div className="col-span-2 font-mono text-gray-600">
                                                            {/* Account code not directly on line, needs join or passed prop. 
                                          Ideally backend includes: include: { account: true } 
                                      */}
                                                            {line.account?.code}
                                                        </div>
                                                        <div className="col-span-4 truncate" title={line.account?.name}>
                                                            {line.account?.name}
                                                        </div>
                                                        <div className="col-span-4 text-gray-500 truncate" title={line.description || ''}>
                                                            {line.description}
                                                        </div>
                                                        <div className="col-span-1 text-right font-mono">
                                                            {Number(line.debit) > 0 ? Number(line.debit).toFixed(2) : '-'}
                                                        </div>
                                                        <div className="col-span-1 text-right font-mono">
                                                            {Number(line.credit) > 0 ? Number(line.credit).toFixed(2) : '-'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {entries.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay movimientos registrados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
