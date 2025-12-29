
import React, { useState, useEffect } from 'react';
import api from '../api/client';
import type { Asset } from '../types';
import { Plus, Search, Tag, MapPin } from 'lucide-react';
import { CreateAssetModal } from '../components/assets/CreateAssetModal';
import { cn } from '../lib/utils';

export const AssetsPage = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/assets');
            setAssets(res.data);
        } catch (error) {
            console.error('Failed to fetch assets', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Activos Fijos</h2>
                    <p className="text-muted-foreground">Gestión de inventario y activos de la entidad.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                >
                    <Plus className="w-4 h-4" /> Nuevo Activo
                </button>
            </div>

            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>

                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="bg-muted/50 [&_tr]:border-b">
                            <tr>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Código</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Nombre</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Ubicación</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground text-right">Valor</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground text-center">Estado</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Origen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Cargando activos...</td></tr>
                            ) : filteredAssets.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay activos registrados.</td></tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-muted/50">
                                        <td className="p-4 font-mono font-medium">{asset.code}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{asset.name}</span>
                                                <span className="text-xs text-muted-foreground line-clamp-1">{asset.description}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground flex items-center gap-2">
                                            {asset.location && <MapPin className="w-3 h-3" />} {asset.location || '-'}
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            {Number(asset.value).toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-xs font-semibold",
                                                asset.status === 'ACTIVE' ? "bg-green-100 text-green-700" :
                                                    asset.status === 'DISPOSED' ? "bg-red-100 text-red-700" :
                                                        "bg-yellow-100 text-yellow-700"
                                            )}>
                                                {asset.status === 'ACTIVE' ? 'Activo' : asset.status === 'DISPOSED' ? 'Baja' : 'Depreciado'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-muted-foreground">
                                            {asset.purchaseOrderId ? `OC #${asset.purchaseOrderId}` : asset.invoiceId ? `Fact #${asset.invoiceId}` : 'Manual'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CreateAssetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAssets}
            />
        </div>
    );
};
