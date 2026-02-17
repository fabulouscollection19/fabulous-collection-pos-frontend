import { motion } from 'framer-motion';
import { LogOut, User, Bell } from 'lucide-react';

const Header = ({ onLogout, userName, userRole }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Page Identity - For mobile/tablet */}
        <div className="flex items-center gap-3">
          <div className="md:hidden w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Terminal 01</h1>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{userRole || 'Admin'}</p>
          </div>
        </div>

        {/* Action Center */}
        <div className="flex items-center gap-2 md:gap-4">

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">{userName || 'Admin User'}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-tighter font-medium">Session Active</p>
            </div>
            <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-600">
              <User className="w-5 h-5" />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="ml-2 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all group"
            title="Logout"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default Header;
