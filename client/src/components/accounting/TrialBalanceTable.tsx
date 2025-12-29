import React from 'react';
import type { TrialBalanceItem } from '../../types';

interface TrialBalanceTableProps {
    data: TrialBalanceItem[];
}

export const TrialBalanceTable = ({ data }: TrialBalanceTableProps) => {
    // Totals
    const totalDebit = data.reduce((sum, item) => sum + Number(item.debit), 0);
    const totalCredit = data.reduce((sum, item) => sum + Number(item.credit), 0);
    const date = new Date().toLocaleDateString();

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold">Balance de Comprobación</h3>
                    <p className="text-sm text-gray-500">Al {date}</p>
                </div>
                <button onClick={() => window.print()} className="px-3 py-1 bg-gray-100 text-sm hover:bg-gray-200 rounded">
                    Imprimir
                </button>
            </div>

            <div className="rounded-md border overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="p-3 text-left w-24">Código</th>
                            <th className="p-3 text-left">Cuenta</th>
                            <th className="p-3 text-right w-32">Débito</th>
                            <th className="p-3 text-right w-32">Crédito</th>
                            <th className="p-3 text-right w-32 bg-gray-900">Saldo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {data.map((item) => (
                            <tr key={item.accountId} className="hover:bg-gray-50">
                                <td className="p-3 font-mono font-medium">{item.code}</td>
                                <td className="p-3">{item.name}</td>
                                <td className="p-3 text-right">{Number(item.debit) > 0 ? Number(item.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                <td className="p-3 text-right">{Number(item.credit) > 0 ? Number(item.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                <td className={`p-3 text-right font-bold ${Number(item.balance) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay datos para mostrar.</td></tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                        <tr>
                            <td colSpan={2} className="p-3 text-right">TOTALES</td>
                            <td className="p-3 text-right">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="p-3 text-right">{(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};
