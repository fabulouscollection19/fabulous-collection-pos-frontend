// Dashboard.jsx - Redesigned version
import { useState, useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MobileNav from '../components/MobileNav';

const Dashboard = ({ onLogout, userRole, userName }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const location = useLocation();

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        currentPath={location.pathname}
        userRole={userRole}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          onLogout={onLogout}
          userName={userName}
          userRole={userRole}
        />

        {/* Mobile Navigation (only visible on small screens) */}
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-2">
          <MobileNav currentPath={location.pathname} userRole={userRole} />
        </div>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4">
          <div className="w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;