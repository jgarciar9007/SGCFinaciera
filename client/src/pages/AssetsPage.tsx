// AssetsPage.tsx - Simplified for Quantity-Based Inventory
import React, { useState, useEffect } from 'react';
import api from '../api/client';
import type { Asset } from '../types';
import { Plus, Search, ArrowRightLeft } from 'lucide-react';
import { CreateAssetModal } from '../components/assets/CreateAssetModal';
import { MovementModal } from '../components/assets/MovementModal';
import { cn } from '../lib/utils';

export const AssetsPage = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/assets');
            // Ensure we always set an array
            const data = res.data;
            if (Array.isArray(data)) {
                setAssets(data);
            } else if (data && Array.isArray(data.data)) {
                setAssets(data.data);
            } else {
                console.error('Invalid assets response:', data);
                setAssets([]);
            }
        } catch (error) {
            console.error('Failed to fetch assets', error);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.code && asset.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Activos Fijos</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Activo
                </button>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-md"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="bg-muted/50 [&_tr]:border-b">
                            <tr>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Código</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Nombre</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground text-center">Cantidad</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Ubicación</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground text-right">Valor Unitario</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground text-center">Estado</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Cargando inventario...</td></tr>
                            ) : filteredAssets.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No hay activos registrados.</td></tr>
                            ) : (
                                filteredAssets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-muted/50">
                                        <td className="p-4 font-mono text-xs">{asset.code || '-'}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{asset.name}</span>
                                                {asset.description && (
                                                    <span className="text-xs text-muted-foreground line-clamp-1">{asset.description}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                                                {asset.quantity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{asset.location || '-'}</td>
                                        <td className="p-4 text-right font-medium">
                                            {Number(asset.unitValue).toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-xs font-semibold",
                                                asset.status === 'ACTIVE' ? "bg-green-100 text-green-700" :
                                                    asset.status === 'IN_USE' ? "bg-blue-100 text-blue-700" :
                                                        asset.status === 'DISPOSED' ? "bg-red-100 text-red-700" :
                                                            "bg-yellow-100 text-yellow-700"
                                            )}>
                                                {asset.status === 'ACTIVE' ? 'Bodega' :
                                                    asset.status === 'IN_USE' ? 'En Uso' :
                                                        asset.status === 'DISPOSED' ? 'Baja' : 'Depreciado'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedAsset(asset);
                                                    setIsMovementModalOpen(true);
                                                }}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                                                title="Registrar Movimiento"
                                                disabled={asset.quantity === 0}
                                            >
                                                <ArrowRightLeft className="w-4 h-4" />
                                                <span className="hidden sm:inline">Mover</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCreateModalOpen && (
                <CreateAssetModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        fetchAssets();
                    }}
                />
            )}

            {isMovementModalOpen && selectedAsset && (
                <MovementModal
                    isOpen={isMovementModalOpen}
                    asset={selectedAsset}
                    onClose={() => {
                        setIsMovementModalOpen(false);
                        setSelectedAsset(null);
                    }}
                    onSuccess={() => {
                        setIsMovementModalOpen(false);
                        setSelectedAsset(null);
                        fetchAssets();
                    }}
                />
            )}
        </div>
    );
};
