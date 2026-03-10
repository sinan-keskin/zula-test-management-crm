/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users';
import PerformancePage from './pages/Performance';
import AcademyPage from './pages/Academy';
import RefereesPage from './pages/Referees';
import ReportsPage from './pages/Reports';
import LogsPage from './pages/Logs';
import SettingsPage from './pages/Settings';
import LoginPage from './pages/Login';
import { useStore } from './store/useStore';
import LanguageSelectionOverlay from './components/LanguageSelectionOverlay';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const isDark = useStore(state => state.isDark);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const fetchInitialData = useStore(state => state.fetchInitialData);
  const checkAuth = useStore(state => state.checkAuth);

  React.useEffect(() => {
    const init = async () => {
      await checkAuth();
      // fetchInitialData checkAuth içinde de çağrılıyor ama garantiye alalım
      await fetchInitialData();
    };
    init();
  }, [checkAuth, fetchInitialData]);

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <HashRouter>
      <LanguageSelectionOverlay />
      <Routes>
        {/* Ana sayfa giriş yapmışsa dashboard'a, yapmamışsa login'e yönlendirir */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="performance" element={<PerformancePage />} />
          <Route path="academy" element={<AcademyPage />} />
          <Route path="referees" element={<RefereesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

