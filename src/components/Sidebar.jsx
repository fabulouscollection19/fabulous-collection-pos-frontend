// Sidebar.jsx - Updated version
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Receipt, 
  Package, 
  CreditCard, 
  BarChart3, 
  Settings,
  Store,
  Ruler,
  Scissors
} from 'lucide-react';

const Sidebar = ({ collapsed, onToggle, currentPath, userRole }) => {
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
      roles: ['super-admin']
    },
    {
      id: 'stock',
      label: 'Stock',
      icon: Package,
      path: '/stock',
      color: 'text-green-600',
      roles: ['super-admin']
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: CreditCard,
      path: '/transactions',
      color: 'text-purple-600',
      roles: ['super-admin']
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
      roles: ['super-admin']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      color: 'text-orange-600',
      roles: ['super-admin']
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      path: '/admin',
      color: 'text-red-600',
      roles: ['super-admin']
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
    
    if (userRole === 'super-admin') {
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
  };

  const isActive = (path) => {
    return location.pathname === path || (path === '/billing' && location.pathname === '/');
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? '80px' : '280px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white shadow-lg border-r border-gray-200 flex flex-col hidden md:flex"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Fabulous Collection</h2>
                <p className="text-xs text-gray-500">POS System</p>
                {userRole && (
                  <p className="text-xs text-blue-600 font-medium capitalize mt-1">{userRole}</p>
                )}
              </div>
            </motion.div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-primary-600' : item.color}`} />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 border-t border-gray-200"
        >
          <div className="text-xs text-gray-500 text-center">
            <p>Version beta 0.3 WIP</p>
            <p className="mt-1">© 2025 Fabulous Collection</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Sidebar;