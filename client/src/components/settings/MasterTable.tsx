import React, { useState } from 'react';
import { Edit, Trash, Plus, Search } from 'lucide-react';

interface Column<T> {
    header: string;
    accessorKey: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface MasterTableProps<T> {
    title: string;
    data: T[];
    columns: Column<T>[];
    onAdd?: () => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    searchPlaceholder?: string;
    filterFunction?: (item: T, query: string) => boolean;
}

export function MasterTable<T extends { id: number }>({
    title,
    data,
    columns,
    onAdd,
    onEdit,
    onDelete,
    searchPlaceholder = "Buscar...",
    filterFunction
}: MasterTableProps<T>) {
    const [query, setQuery] = useState('');

    const filteredData = data.filter(item => {
        if (!query) return true;
        if (filterFunction) return filterFunction(item, query);
        // Default simple string match on all string properties
        return Object.values(item).some(val =>
            String(val).toLowerCase().includes(query.toLowerCase())
        );
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{data.length} registros encontrados</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-9 bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    {onAdd && (
                        <button
                            onClick={onAdd}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
                        >
                            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nuevo</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="rounded-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                {columns.map((col, i) => (
                                    <th key={i} className={`p-3 text-left font-medium text-muted-foreground ${col.className || ''}`}>
                                        {col.header}
                                    </th>
                                ))}
                                {(onEdit || onDelete) && <th className="p-3 text-right">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                                    {columns.map((col, i) => (
                                        <td key={i} className={`p-3 align-middle ${col.className || ''}`}>
                                            {typeof col.accessorKey === 'function'
                                                ? col.accessorKey(item)
                                                : (item[col.accessorKey] as React.ReactNode)
                                            }
                                        </td>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {onEdit && (
                                                    <button
                                                        onClick={() => onEdit(item)}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-blue-600"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => onDelete(item)}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-600"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="p-8 text-center text-muted-foreground">
                                        No se encontraron resultados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
