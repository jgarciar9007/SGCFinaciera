import { useState, useEffect } from 'react';
import api from '../../api/client';
import { Search } from 'lucide-react';

interface LedgerEntry {
    accountCode: string;
    accountName: string;
    thirdPartyName: string;
    debit: number;
    credit: number;
    balance: number;
}

export const ThirdPartyLedger = () => {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        api.get('/accounting/third-party-ledger')
            .then(res => setEntries(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = entries.filter(e =>
        e.accountCode.includes(searchTerm) ||
        e.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.thirdPartyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Cargando Libro Mayor...</div>;

    return (
        <div className="space-y-4">
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Filtrar por Cuenta o Tercero..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <table className="w-full text-sm">
                    <thead className="bg-muted border-b">
                        <tr>
                            <th className="h-10 px-4 text-left font-medium">Cuenta</th>
                            <th className="h-10 px-4 text-left font-medium">Nombre Cuenta</th>
                            <th className="h-10 px-4 text-left font-medium">Tercero</th>
                            <th className="h-10 px-4 text-right font-medium">Débitos</th>
                            <th className="h-10 px-4 text-right font-medium">Créditos</th>
                            <th className="h-10 px-4 text-right font-medium">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((entry, idx) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                                <td className="p-3 font-medium">{entry.accountCode}</td>
                                <td className="p-3">{entry.accountName}</td>
                                <td className="p-3 text-blue-600 font-medium">{entry.thirdPartyName}</td>
                                <td className="p-3 text-right">{entry.debit > 0 ? Number(entry.debit).toLocaleString('fr-FR') : '-'}</td>
                                <td className="p-3 text-right">{entry.credit > 0 ? Number(entry.credit).toLocaleString('fr-FR') : '-'}</td>
                                <td className="p-3 text-right font-bold">{Number(entry.balance).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-muted-foreground">No se encontraron registros.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
