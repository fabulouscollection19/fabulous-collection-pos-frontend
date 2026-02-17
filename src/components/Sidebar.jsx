// Sidebar.jsx - Updated version
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Receipt,
  Package,
  CreditCard,
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
    },
    {
      id: 'stitching',
      label: 'Stitching Management',
      icon: Ruler,
      path: '/stitching',
      color: 'text-indigo-600',
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

    if (userRole === 'tailor') {
      items = [...tailorMenuItems];
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
      animate={{ width: collapsed ? '72px' : '260px' }}
      transition={{ duration: 0.3, ease: 'circOut' }}
      className="bg-slate-900 flex flex-col hidden md:flex h-full border-r border-slate-800 shadow-2xl z-20"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-black text-white whitespace-nowrap tracking-tight">FABULOUS</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">POS Terminal</p>
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors text-slate-400 hover:text-white ${collapsed ? 'mx-auto' : ''}`}
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <motion.button
              key={item.id}
              whileHover={{ x: active ? 0 : 4 }}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <div className={`shrink-0 ${active ? 'text-white' : 'group-hover:text-indigo-400 transition-colors'}`}>
                <Icon className="w-5 h-5" />
              </div>

              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-bold text-sm tracking-tight"
                >
                  {item.label}
                </motion.span>
              )}

              {active && !collapsed && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-5 bg-white rounded-r-full"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="p-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                {userRole?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">{userRole || 'Administrator'}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Server Connected</p>
              </div>
            </div>
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] text-center mt-2">v0.4.5 PRODUCTION</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Sidebar;