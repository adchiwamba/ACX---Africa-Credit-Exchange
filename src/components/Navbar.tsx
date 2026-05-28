import { UserProfile, UserRole } from '../types';
import { Menu, Bell, LogOut, RefreshCw } from 'lucide-react';

interface NavbarProps {
  user: UserProfile;
  onMenuClick: () => void;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
}

export default function Navbar({ user, onMenuClick, onLogout, onSwitchRole }: NavbarProps) {
  return (
    <header className="bg-white dark:bg-[#1E293B] border-b border-[#E5E5E5] dark:border-white/5 h-16 flex items-center justify-between px-6 z-20 shrink-0 shadow-sm transition-colors">
      <div className="flex items-center gap-6">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10 border-2 border-slate-700">
            <span className="text-white font-bold text-xs">ACX</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tighter leading-none text-slate-900 dark:text-white">ACX Terminal</span>
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400">Africa Credit Exchange</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-white/5 rounded-full border border-gray-100 dark:border-white/5">
          <span className="text-[10px] uppercase tracking-widest font-bold opacity-40 dark:text-white/40">Role:</span>
          <select 
            className="text-[10px] font-bold bg-transparent border-none outline-none cursor-pointer uppercase tracking-tight dark:text-white/80"
            value={user.role}
            onChange={(e) => onSwitchRole(e.target.value as UserRole)}
          >
            {Object.values(UserRole).map(role => {
              let label = role as string;
              if (role === UserRole.BORROWER) label = 'Consumer (Borrower)';
              else if (role === UserRole.LENDER) label = 'Business (Lender)';
              else if (role === UserRole.RETAILER) label = 'Business (Retailer)';
              else if (role === UserRole.BANK) label = 'Business (Bank)';
              else if (role === UserRole.INVESTOR) label = 'Business (Investor)';
              else if (role === UserRole.ADMIN) label = 'Administrator';
              return (
                <option key={role} value={role}>{label}</option>
              );
            })}
          </select>
          <RefreshCw className="w-3 h-3 opacity-30" />
        </div>

        <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full relative transition-colors">
          <Bell className="w-5 h-5 dark:text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1E293B]"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-white/5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold dark:text-white">
              {user.borrowerDetails?.profile?.businessName || user.displayName}
            </p>
            <p className="text-[10px] uppercase tracking-wider opacity-40 leading-none dark:text-white/40">
              {user.role === UserRole.BORROWER ? 'Consumer (Borrower)' : 
               user.role === UserRole.LENDER ? 'Business (Lender)' :
               user.role === UserRole.RETAILER ? 'Business (Retailer)' :
               user.role === UserRole.BANK ? 'Business (Bank)' :
               user.role === UserRole.INVESTOR ? 'Business (Investor)' :
               user.role === UserRole.ADMIN ? 'Administrator' : user.role}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-guava-green text-white flex items-center justify-center font-bold text-sm border-2 border-guava-orange shadow-md">
            {(user.borrowerDetails?.profile?.businessName || user.displayName).charAt(0)}
          </div>
          <button 
            onClick={onLogout}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
