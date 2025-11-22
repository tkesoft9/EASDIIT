import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { BatchManagement } from './pages/BatchManagement';
import { Attendance } from './pages/Attendance';
import { LOCAL_STORAGE_KEYS } from './constants';
import { UserRole } from './types';

// Protected Route Helper
const ProtectedRoute = ({ children, requiredRole }: { children?: React.ReactNode, requiredRole: UserRole }) => {
  const role = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ROLE);
  
  if (!role || role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route element={<Layout />}>
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole={UserRole.ADMIN}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/batches" 
            element={
              <ProtectedRoute requiredRole={UserRole.ADMIN}>
                <BatchManagement />
              </ProtectedRoute>
            } 
          />

          {/* Lecturer Routes */}
          <Route 
            path="/lecturer" 
            element={
              <ProtectedRoute requiredRole={UserRole.LECTURER}>
                <Attendance />
              </ProtectedRoute>
            } 
          />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;