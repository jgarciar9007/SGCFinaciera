import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    ShoppingBag,
    Receipt,
    Landmark,
    BookOpen,
    Settings,
    LogOut,
    CreditCard,
    Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Gastos & Aprob.', path: '/expenses' },
    { icon: ShoppingBag, label: 'Compras', path: '/procurement' },
    { icon: CreditCard, label: 'Facturación', path: '/billing' },
    { icon: Landmark, label: 'Tesorería', path: '/treasury' },
    { icon: Briefcase, label: 'Activos', path: '/assets' },
    { icon: BookOpen, label: 'Contabilidad', path: '/accounting' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
];

export const Sidebar = () => {
    const { logout, user } = useAuth();

    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 overflow-y-auto">
            <div className="p-6 flex items-center justify-center border-b border-slate-700">
                <img src="/logo.png" alt="CNDES Logo" className="h-12 w-auto object-contain" />
            </div>

            <div className="flex-1 py-6 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center space-x-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-blue-400",
                            isActive && "bg-slate-800 text-blue-400 border-r-4 border-blue-500"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </div>

            <div className="p-4 border-t border-slate-700">
                <div className="flex items-center space-x-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                        {user?.fullName?.[0] || 'U'}
                    </div>
                    <div className="text-sm">
                        <p className="font-semibold">{user?.fullName}</p>
                        <p className="text-xs text-slate-400">{user?.role}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};
