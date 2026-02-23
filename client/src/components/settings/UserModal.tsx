import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCreateUser, useUpdateUser } from '../../hooks/queries/useUsers';

import type { User } from '../../types';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userToEdit?: User | null;
}

export const UserModal = ({ isOpen, onClose, userToEdit }: UserModalProps) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        role: 'USER',
        password: '',
    });

    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                email: userToEdit.email,
                fullName: userToEdit.fullName,
                role: userToEdit.role,
                password: '', // Password not editable directly here, only on create
            });
        } else {
            setFormData({ email: '', fullName: '', role: 'USER', password: '' });
        }
    }, [userToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (userToEdit) {
                await updateUserMutation.mutateAsync({
                    id: userToEdit.id,
                    email: formData.email,
                    fullName: formData.fullName,
                    role: formData.role,
                });
                addToast('Usuario actualizado correctamente', 'success');
            } else {
                await createUserMutation.mutateAsync(formData);
                addToast('Usuario creado correctamente', 'success');
            }
            onClose();
        } catch (error: any) {
            addToast(error.response?.data?.error || 'Error al guardar usuario', 'error');
        }
    };

    // Use the loading state from mutations
    const isPending = createUserMutation.isPending || updateUserMutation.isPending;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            className="w-full p-2 border rounded"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full p-2 border rounded"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Rol</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="USER">Usuario</option>
                            <option value="MEMBER">Miembro</option>
                            <option value="ACCOUNTANT">Contador</option>
                            <option value="TREASURER">Tesorero</option>
                            <option value="DIRECTOR">Director</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                    </div>
                    {!userToEdit && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Contraseña</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="w-full p-2 border rounded"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isPending} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                            {isPending ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
