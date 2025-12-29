import React, { useEffect, useState } from 'react';
import { MasterTable } from '../components/settings/MasterTable';
import { MasterModal } from '../components/settings/MasterModal';
import { ClearData } from '../components/settings/ClearData';
import api from '../api/client';
import type { Account, ThirdParty, Program, Bank } from '../types';
import { cn } from '../lib/utils';
import { Users, Layers, Book, Building, PieChart, ShieldAlert } from 'lucide-react';

type Tab = 'ACCOUNTS' | 'THIRD_PARTIES' | 'PROGRAMS' | 'BANKS' | 'BUDGET' | 'MAINTENANCE';

export const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState<Tab>('ACCOUNTS');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);

    // For Accounts specific requirements
    const [allAccounts, setAllAccounts] = useState<Account[]>([]);

    useEffect(() => {
        const checkRole = () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user && user.role === 'ADMIN') {
                        setIsAdmin(true);
                    }
                }
            } catch (e) { console.error(e); }
        };
        checkRole();
    }, []);

    const fetchTabDate = async () => {
        if (activeTab === 'MAINTENANCE') return;

        setLoading(true);
        try {
            let url = '';
            if (activeTab === 'ACCOUNTS') url = '/settings/accounts';
            if (activeTab === 'THIRD_PARTIES') url = '/settings/third-parties';
            if (activeTab === 'PROGRAMS') url = '/settings/programs';
            if (activeTab === 'BANKS') url = '/settings/banks';
            if (activeTab === 'BUDGET') url = '/budget';

            const res = await api.get(url);
            setData(res.data);

            if (activeTab === 'ACCOUNTS') {
                setAllAccounts(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTabDate();
    }, [activeTab]);

    const handleCreate = () => {
        setEditingItem(null);
        setModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleDelete = async (item: any) => {
        if (!confirm('¿Está seguro de eliminar este registro?')) return;
        try {
            let url = '';
            if (activeTab === 'ACCOUNTS') url = `/settings/accounts/${item.id}`;
            if (activeTab === 'THIRD_PARTIES') url = `/settings/third-parties/${item.id}`;
            if (activeTab === 'PROGRAMS') url = `/settings/programs/${item.id}`;
            if (activeTab === 'BANKS') url = `/settings/banks/${item.id}`;
            if (activeTab === 'BUDGET') url = `/budget/${item.id}`;

            await api.delete(url);
            fetchTabDate();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar');
        }
    };

    const handleSave = async (formData: any) => {
        let url = '';
        if (activeTab === 'ACCOUNTS') url = '/settings/accounts';
        if (activeTab === 'THIRD_PARTIES') url = '/settings/third-parties';
        if (activeTab === 'PROGRAMS') url = '/settings/programs';
        if (activeTab === 'BANKS') url = '/settings/banks';
        if (activeTab === 'BUDGET') url = '/budget';

        if (editingItem) {
            await api.put(`${url}/${editingItem.id}`, formData);
        } else {
            await api.post(url, formData);
        }
        fetchTabDate();
    };

    // Columns Definitions
    const accountColumns = [
        { header: 'Código', accessorKey: 'code', className: 'font-mono' },
        { header: 'Nombre', accessorKey: 'name' },
        { header: 'Nivel', accessorKey: 'level', className: 'w-16 text-center' },
        { header: 'Naturaleza', accessorKey: (d: Account) => d.nature },
        { header: 'Tipo', accessorKey: (d: Account) => d.isMovement ? 'Movimiento' : 'Grupo' },
        { header: 'Activo', accessorKey: (d: Account) => d.isActive ? 'Si' : 'No' },
    ];

    const thirdPartyColumns = [
        { header: 'Tipo', accessorKey: 'type' },
        { header: 'ID', accessorKey: 'identification' },
        { header: 'Nombre', accessorKey: 'name' },
        { header: 'Email', accessorKey: 'email' },
        { header: 'Activo', accessorKey: (d: ThirdParty) => d.isActive ? 'Si' : 'No' },
    ];

    const programColumns = [
        { header: 'Código', accessorKey: 'code' },
        { header: 'Nombre', accessorKey: 'name' },
        { header: 'Activo', accessorKey: (d: Program) => d.isActive ? 'Si' : 'No' },
    ];

    const bankColumns = [
        { header: 'Banco', accessorKey: 'name' },
        { header: 'SWIFT', accessorKey: 'swift' },
        { header: 'Activo', accessorKey: (d: Bank) => d.isActive ? 'Si' : 'No' },
    ];

    const budgetColumns = [
        { header: 'Código', accessorKey: 'code', className: 'font-mono' },
        { header: 'Nombre', accessorKey: 'name' },
        { header: 'Asignado', accessorKey: (d: any) => d.allocatedAmount !== undefined && d.allocatedAmount !== null ? `${Number(d.allocatedAmount).toLocaleString('fr-FR')} FCFA` : '0 FCFA' },
        { header: 'Ejercicio', accessorKey: 'year' },
    ];

    const getColumns = () => {
        switch (activeTab) {
            case 'ACCOUNTS': return accountColumns;
            case 'THIRD_PARTIES': return thirdPartyColumns;
            case 'PROGRAMS': return programColumns;
            case 'BANKS': return bankColumns;
            case 'BUDGET': return budgetColumns;
            default: return [];
        }
    };

    const getModalType = () => {
        switch (activeTab) {
            case 'ACCOUNTS': return 'ACCOUNT';
            case 'THIRD_PARTIES': return 'THIRD_PARTY';
            case 'PROGRAMS': return 'PROGRAM';
            case 'BANKS': return 'BANK';
            case 'BUDGET': return 'BUDGET';
        }
        return 'ACCOUNT'; // fallback
    };

    const getTitle = () => {
        switch (activeTab) {
            case 'ACCOUNTS': return 'Plan de Cuentas';
            case 'THIRD_PARTIES': return 'Directorio de Terceros';
            case 'PROGRAMS': return 'Programas Presupuestarios';
            case 'BANKS': return 'Catálogo de Bancos';
            case 'BUDGET': return 'Rubros Presupuestales';
            case 'MAINTENANCE': return 'Mantenimiento del Sistema';
            default: return '';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">Configuración y Maestros</h2>
                <p className="text-muted-foreground">Administración de catálogos y parámetros del sistema.</p>
            </div>

            <div className="flex space-x-1 border-b overflow-x-auto pb-1">
                <TabButton active={activeTab === 'ACCOUNTS'} onClick={() => setActiveTab('ACCOUNTS')} icon={<Book className="w-4 h-4" />} label="Plan Contable" />
                <TabButton active={activeTab === 'THIRD_PARTIES'} onClick={() => setActiveTab('THIRD_PARTIES')} icon={<Users className="w-4 h-4" />} label="Terceros" />
                <TabButton active={activeTab === 'PROGRAMS'} onClick={() => setActiveTab('PROGRAMS')} icon={<Layers className="w-4 h-4" />} label="Programas" />
                <TabButton active={activeTab === 'BANKS'} onClick={() => setActiveTab('BANKS')} icon={<Building className="w-4 h-4" />} label="Bancos" />
                <TabButton active={activeTab === 'BUDGET'} onClick={() => setActiveTab('BUDGET')} icon={<PieChart className="w-4 h-4" />} label="Presupuesto" />
                {isAdmin && (
                    <TabButton active={activeTab === 'MAINTENANCE'} onClick={() => setActiveTab('MAINTENANCE')} icon={<ShieldAlert className="w-4 h-4" />} label="Mantenimiento" />
                )}
            </div>

            <div className="bg-card rounded-md shadow-sm min-h-[400px]">
                {activeTab === 'MAINTENANCE' ? (
                    <div className="p-6">
                        <h3 className="text-lg font-bold mb-4">Limpieza de Datos de Prueba</h3>
                        <ClearData />
                    </div>
                ) : (
                    loading ? (
                        <div className="p-8 text-center text-muted-foreground">Cargando datos...</div>
                    ) : (
                        <div className="p-4">
                            <MasterTable
                                title={getTitle()}
                                data={data}
                                columns={getColumns() as any}
                                onAdd={handleCreate}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </div>
                    )
                )}
            </div>

            <MasterModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                type={getModalType()}
                initialData={editingItem}
                accounts={activeTab === 'ACCOUNTS' ? allAccounts : undefined}
            />
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
            active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
        )}
    >
        {icon}
        {label}
    </button>
);
