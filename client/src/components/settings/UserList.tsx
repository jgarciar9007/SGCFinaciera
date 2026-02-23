import React, { useState } from 'react';
import { Trash2, User as UserIcon, Shield, Edit, Key, Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { UserModal } from './UserModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { useUsers, useDeleteUser } from '../../hooks/queries/useUsers';
import type { User } from '../../types';

const roleTranslations: Record<string, string> = {
    ADMIN: 'Administrador',
    USER: 'Usuario',
    MEMBER: 'Miembro',
    DIRECTOR: 'Director',
    ACCOUNTANT: 'Contador',
    TREASURER: 'Tesorero'
};

export const UserList = () => {
    const { addToast } = useToast();
    const { data: users = [], isLoading: loading } = useUsers();
    const deleteUserMutation = useDeleteUser();

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleDelete = async (id: number) => {
        if (!confirm('¿Está seguro de eliminar este usuario?')) return;
        try {
            await deleteUserMutation.mutateAsync(id);
            addToast('Usuario eliminado', 'success');
        } catch (error) {
            addToast('Error al eliminar usuario', 'error');
        }
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsUserModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setIsUserModalOpen(true);
    };

    const handleResetPassword = (user: User) => {
        setSelectedUser(user);
        setIsResetModalOpen(true);
    };

    if (loading) return <div className="p-4 text-center">Cargando usuarios...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Gestión de Usuarios</h3>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Usuario
                </button>
            </div>

            <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted border-b">
                        <tr>
                            <th className="p-3 font-medium">Nombre</th>
                            <th className="p-3 font-medium">Email</th>
                            <th className="p-3 font-medium">Rol</th>
                            <th className="p-3 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-muted/50">
                                <td className="p-3 flex items-center gap-2">
                                    <div className="bg-slate-100 p-1 rounded-full">
                                        <UserIcon className="w-4 h-4 text-slate-600" />
                                    </div>
                                    {user.fullName}
                                </td>
                                <td className="p-3">{user.email}</td>
                                <td className="p-3">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                                        {roleTranslations[user.role] || user.role}
                                    </span>
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={() => handleResetPassword(user)}
                                            className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                            title="Restablecer contraseña"
                                        >
                                            <Key className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Editar usuario"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            title="Eliminar usuario"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                userToEdit={selectedUser}
            />

            <ResetPasswordModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                userId={selectedUser?.id || null}
                userName={selectedUser?.fullName || ''}
            />
        </div>
    );
};
