import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ToastContainer from './components/ToastContainer';
import { ExpensesPage } from './pages/ExpensesPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { BillingPage } from './pages/BillingPage';
import { TreasuryPage } from './pages/TreasuryPage';
import { AccountingPage } from './pages/AccountingPage';
import { SettingsPage } from './pages/SettingsPage';
import { AssetsPage } from './pages/AssetsPage';
import { DashboardPage } from './pages/DashboardPage';
import { BudgetPage } from './pages/BudgetPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
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
                <Route path="procurement" element={<ProcurementPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="treasury" element={<TreasuryPage />} />
                <Route path="budget" element={<BudgetPage />} />
                <Route path="assets" element={<AssetsPage />} />
                <Route path="accounting" element={<AccountingPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
            <ToastContainer />
          </Router>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
