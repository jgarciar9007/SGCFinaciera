import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { Navigate } from 'react-router-dom';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: Role[];
    redirectTo?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles, redirectTo = '/' }) => {
    const { user, hasRole, isAuthenticated } = useAuth();

    if (!isAuthenticated) return <Navigate to="/login" />;

    // If hasRole is not yet available in context (waiting for update), doing manual check
    // But hasRole should be available. 
    // Just to be safe:
    if (!user) return null; // Or spinner?

    if (!hasRole(allowedRoles)) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
};
