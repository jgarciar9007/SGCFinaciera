import React, { useState } from 'react';
import api from '../../api/client';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export const ClearData = () => {
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const modules = [
        { id: 'EXPENSES', label: 'Gastos y Aprobaciones', description: 'Elimina solicitudes, aprobaciones y adjuntos.' },
        { id: 'PROCUREMENT', label: 'Compras (Activos e Inventario)', description: 'Elimina órdenes de compra y recepciones.' },
        { id: 'BILLING', label: 'Facturación y Pagos', description: 'Elimina facturas y pagos registrados.' },
        { id: 'TREASURY', label: 'Tesorería (Movimientos)', description: 'Elimina transacciones bancarias y reinicia saldos.' },
        { id: 'ACCOUNTING', label: 'Contabilidad (Asientos)', description: 'Elimina asientos y libros diarios.' },
    ];

    const toggleModule = (id: string) => {
        if (selectedModules.includes(id)) {
            setSelectedModules(selectedModules.filter(m => m !== id));
        } else {
            setSelectedModules([...selectedModules, id]);
        }
    };

    const handleClear = async () => {
        if (selectedModules.length === 0) return;

        if (!confirm('⚠️ ¿ESTÁS SEGURO? \n\nEsta acción es irreversible y eliminará PERMANENTEMENTE todos los datos de prueba de los módulos seleccionados.')) return;
        if (!confirm('CONFIRMACIÓN FINAL: \n\n¿Deseas proceder con la eliminación?')) return;

        setLoading(true);
        setSuccess('');

        try {
            await api.post('/admin/clear-data', { modules: selectedModules });
            setSuccess('Datos eliminados correctamente.');
            setSelectedModules([]);
            // Optional: trigger a global refresh or reload
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error(error);
            alert('Error al eliminar datos. Verifica que tengas permisos de Administrador.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                    <h4 className="font-bold">Zona de Peligro</h4>
                    <p className="text-sm mt-1">
                        Utiliza esta herramienta solo para limpiar datos de prueba.
                        Asegúrate de no borrar información real en producción.
                    </p>
                </div>
            </div>

            <div className="bg-white border rounded-lg shadow-sm divide-y">
                {modules.map(mod => (
                    <div key={mod.id} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                        <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            checked={selectedModules.includes(mod.id)}
                            onChange={() => toggleModule(mod.id)}
                        />
                        <div className="flex-1 cursor-pointer" onClick={() => toggleModule(mod.id)}>
                            <h4 className="font-medium text-gray-900">{mod.label}</h4>
                            <p className="text-sm text-gray-500">{mod.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {success}
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={handleClear}
                    disabled={selectedModules.length === 0 || loading}
                    className={`
                        flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white transition-all
                        ${selectedModules.length === 0 || loading
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg'
                        }
                    `}
                >
                    {loading ? 'Eliminando...' : (
                        <>
                            <Trash2 className="w-4 h-4" /> Eliminar Datos Seleccionados
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
