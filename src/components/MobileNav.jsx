// MobileNav.jsx - Updated version
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X,
  Receipt, 
  Package, 
  CreditCard, 
  BarChart3, 
  Settings,
  Store,
  Ruler,
  Scissors
} from 'lucide-react';

const MobileNav = ({ currentPath, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Base menu items for all users
  const baseMenuItems = [
    {
      id: 'billing',
      label: 'Billing',
      icon: Receipt,
      path: '/billing',
      color: 'text-blue-600',
      roles: ['admin1', 'admin2']
    },
    {
      id: 'stock',
      label: 'Stock',
      icon: Package,
      path: '/stock',
      color: 'text-green-600',
      roles: ['admin1', 'admin2']
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: CreditCard,
      path: '/transactions',
      color: 'text-purple-600',
      roles: ['admin1', 'admin2']
    }
  ];

  // Admin only menu items
  const adminMenuItems = [
    {
      id: 'stitching',
      label: 'Stitching Management',
      icon: Ruler,
      path: '/stitching',
      color: 'text-indigo-600',
      roles: ['admin1', 'admin2']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      color: 'text-orange-600',
      roles: ['admin1']
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      path: '/admin',
      color: 'text-red-600',
      roles: ['admin1']
    }
  ];

  // Tailor only menu items
  const tailorMenuItems = [
    {
      id: 'tailor-work',
      label: 'My Work',
      icon: Scissors,
      path: '/tailor-work',
      color: 'text-green-600',
      roles: ['tailor']
    }
  ];

  // Combine menu items based on user role
  const getMenuItems = () => {
    let items = [...baseMenuItems];
    
    if (userRole === 'admin1' || userRole === 'admin2') {
      items = [...items, ...adminMenuItems];
    }
    
    if (userRole === 'tailor') {
      items = [...items, ...tailorMenuItems];
    }
    
    return items.filter(item => item.roles.includes(userRole));
  };

  const menuItems = getMenuItems();

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path || (path === '/billing' && location.pathname === '/');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            />
            
            {/* Mobile Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 md:hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Fabulous Collection</h2>
                      <p className="text-xs text-gray-500">POS System</p>
                      {userRole && (
                        <p className="text-xs text-blue-600 font-medium capitalize">{userRole}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                        active
                          ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-600' : item.color}`} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 text-center">
                  <p>Version 1.0.0</p>
                  <p className="mt-1">© 2024 Fabulous Collection</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
