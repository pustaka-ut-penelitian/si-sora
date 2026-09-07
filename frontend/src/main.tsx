import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DataScraper } from './pages/DataScraper';
import { DataExplorer } from './pages/DataExplorer';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { JobScheduler } from './pages/JobScheduler';
import { Users } from './pages/Users';
import { ScrollToTop } from './components/ScrollToTop';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="data" element={<DataScraper />} />
          <Route path="explorer" element={<DataExplorer />} />
          <Route path="jobs" element={<JobScheduler />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
