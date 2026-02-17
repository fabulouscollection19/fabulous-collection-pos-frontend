// App.jsx - Fixed version with proper role-based routing
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BillingPage from './pages/BillingPage';
import StockPage from './pages/StockPage';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminPage from './pages/AdminPage';
import StitchingPage from './pages/StitchingPage';
import TailorStitchingPage from './pages/TailorStitchingPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const savedRole = localStorage.getItem('userRole');
    const savedName = localStorage.getItem('userName');

    if (authStatus === 'true') {
      setIsAuthenticated(true);
      setUserRole(savedRole || 'tailor');
      setUserName(savedName || 'User');
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (role, name) => {
    setIsAuthenticated(true);
    setUserRole(role);
    setUserName(name);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', name);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName('');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  };

  // Protected route component
  const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  // Get default route based on role
   const getDefaultRoute = () => {
      if (userRole === 'tailor') {
        return <Navigate to="/tailor-work" replace />;
      } else if (userRole === 'super-admin') {
        return <Navigate to="/billing" replace />;
      }
      return <Navigate to="/billing" replace />;
    };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Login route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />
          }
        />

        {/* Dashboard layout route */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard onLogout={handleLogout} userRole={userRole} userName={userName} />
            </ProtectedRoute>
          }
        >
          {/* Default route based on role */}
          <Route index element={getDefaultRoute()} />

          {/* Common routes */}
          <Route path="billing" element={<BillingPage />} />

          {/* Admin only routes - Super Admin access */}
          <Route
            path="stock"
            element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <StockPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="transactions"
            element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <TransactionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="analytics"
            element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Stitching management routes */}
          <Route
            path="stitching"
            element={
              <ProtectedRoute allowedRoles={['super-admin']}>
                <StitchingPage />
              </ProtectedRoute>
            }
          />

          {/* Tailor routes */}
          <Route
            path="tailor-work"
            element={
              <ProtectedRoute allowedRoles={['tailor']}>
                <TailorStitchingPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all: redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;