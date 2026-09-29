import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Administration from './pages/Administration';
import Inventory from './pages/Inventory';
import Catalog from './pages/Catalog';
import Calendar from './pages/Calendar';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { type ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="administration" element={<Administration />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="calendar" element={<Calendar />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
