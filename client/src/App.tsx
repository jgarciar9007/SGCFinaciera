import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ToastContainer from './components/ToastContainer';
import { RoleGuard } from './components/common/RoleGuard';
import { Role } from './types';
import { ExpensesPage } from './pages/ExpensesPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { BillingPage } from './pages/BillingPage';
import { TreasuryPage } from './pages/TreasuryPage';
import { AccountingPage } from './pages/AccountingPage';
import { SettingsPage } from './pages/SettingsPage';
import { AssetsPage } from './pages/AssetsPage';
import { DashboardPage } from './pages/DashboardPage';
import { BudgetPage } from './pages/BudgetPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="expenses" element={<ExpensesPage />} />

                  <Route path="procurement" element={
                    <RoleGuard allowedRoles={[Role.ADMIN, Role.ACCOUNTANT, Role.DIRECTOR]}>
                      <ProcurementPage />
                    </RoleGuard>
                  } />

                  <Route path="billing" element={
                    <RoleGuard allowedRoles={[Role.ADMIN, Role.ACCOUNTANT, Role.TREASURER, Role.DIRECTOR]}>
                      <BillingPage />
                    </RoleGuard>
                  } />

                  <Route path="treasury" element={
                    <RoleGuard allowedRoles={[Role.ADMIN, Role.TREASURER, Role.ACCOUNTANT, Role.DIRECTOR]}>
                      <TreasuryPage />
                    </RoleGuard>
                  } />

                  <Route path="budget" element={
                    <RoleGuard allowedRoles={[Role.ADMIN, Role.ACCOUNTANT, Role.DIRECTOR, Role.MEMBER]}>
                      <BudgetPage />
                    </RoleGuard>
                  } />

                  <Route path="assets" element={<AssetsPage />} />

                  <Route path="accounting" element={
                    <RoleGuard allowedRoles={[Role.ADMIN, Role.ACCOUNTANT, Role.TREASURER, Role.DIRECTOR]}>
                      <AccountingPage />
                    </RoleGuard>
                  } />

                  <Route path="settings" element={
                    <RoleGuard allowedRoles={[Role.ADMIN]}>
                      <SettingsPage />
                    </RoleGuard>
                  } />
                </Route>
              </Routes>
              <ToastContainer />
            </Router>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
