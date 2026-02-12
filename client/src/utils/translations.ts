
export const translateStatus = (status: string | undefined): string => {
    if (!status) return 'Desconocido';
    const s = status.toUpperCase();

    const translations: Record<string, string> = {
        // General
        'PENDING': 'Pendiente',
        'APPROVED': 'Aprobado',
        'REJECTED': 'Rechazado',
        'COMPLETED': 'Completado',
        'DRAFT': 'Borrador',
        'CANCELLED': 'Cancelado',
        'ACTIVE': 'Activo',
        'INACTIVE': 'Inactivo',

        // Purchase Orders
        'ISSUED': 'Emitida',
        'PARTIAL': 'Parcial',
        'RECEIVED': 'Recibida',
        'CLOSED': 'Cerrada',

        // Invoices
        'UNPAID': 'No Pagada',
        'PAID': 'Pagada',
        'OVERDUE': 'Vencida',

        // Payments
        'RECONCILED': 'Conciliado',

        // Expense Requests
        'SUBMITTED': 'Enviado',
    };

    return translations[s] || status;
};

export const getStatusColor = (status: string | undefined): string => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const s = status.toUpperCase();

    const colors: Record<string, string> = {
        'PENDING': 'bg-yellow-100 text-yellow-800',
        'ISSUED': 'bg-blue-100 text-blue-800',
        'SUBMITTED': 'bg-blue-100 text-blue-800',
        'APPROVED': 'bg-green-100 text-green-800',
        'COMPLETED': 'bg-green-100 text-green-800',
        'PAID': 'bg-green-100 text-green-800',
        'RECONCILED': 'bg-purple-100 text-purple-800',
        'RECEIVED': 'bg-teal-100 text-teal-800',
        'CLOSED': 'bg-gray-200 text-gray-800',
        'REJECTED': 'bg-red-100 text-red-800',
        'CANCELLED': 'bg-red-100 text-red-800',
        'OVERDUE': 'bg-red-100 text-red-800',
        'UNPAID': 'bg-orange-100 text-orange-800',
        'PARTIAL': 'bg-indigo-100 text-indigo-800',
        'DRAFT': 'bg-gray-100 text-gray-600',
    };

    return colors[s] || 'bg-gray-100 text-gray-800';
};
