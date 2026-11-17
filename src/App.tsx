import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { HomeownerOverviewPage } from './pages/homeowner/HomeownerOverviewPage';
import { ApprovalsDisputesPage } from './pages/homeowner/ApprovalsDisputesPage';
import { ReportsPage } from './pages/homeowner/ReportsPage';
import { ExpensesPage } from './pages/shared/ExpensesPage';
import { PurchasesPage } from './pages/shared/PurchasesPage';
import { PaymentsPage } from './pages/shared/PaymentsPage';
import { ProgressPage } from './pages/shared/ProgressPage';
import { DocumentsPage } from './pages/shared/DocumentsPage';
import { SettingsPage } from './pages/shared/SettingsPage';
import { ContractorDashboardPage } from './pages/contractor/ContractorDashboardPage';
import { ContractorProjectsPage } from './pages/contractor/ContractorProjectsPage';
import { ContractorDeliveriesPage } from './pages/contractor/ContractorDeliveriesPage';
import { ContractorNotificationsPage } from './pages/contractor/ContractorNotificationsPage';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, currentRole } = useApp();

  const homeRedirect =
    currentRole === 'homeowner' ? '/homeowner/overview' : '/contractor/dashboard';

  return (
    <Routes>
      {/* Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Homeowner Routes */}
      <Route
        path="/homeowner/*"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <AppLayout>
              <Routes>
                <Route path="overview" element={<HomeownerOverviewPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="materials" element={<PurchasesPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="approvals" element={<ApprovalsDisputesPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/homeowner/overview" replace />} />
              </Routes>
            </AppLayout>
          )
        }
      />

      {/* Contractor Routes */}
      <Route
        path="/contractor/*"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <AppLayout>
              <Routes>
                <Route path="dashboard" element={<ContractorDashboardPage />} />
                <Route path="projects" element={<ContractorProjectsPage />} />
                <Route path="expenses" element={<ExpensesPage />} />
                <Route path="purchases" element={<PurchasesPage />} />
                <Route path="deliveries" element={<ContractorDeliveriesPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="notifications" element={<ContractorNotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/contractor/dashboard" replace />} />
              </Routes>
            </AppLayout>
          )
        }
      />

      {/* Default Fallback */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? homeRedirect : '/login'} replace />}
      />
    </Routes>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
