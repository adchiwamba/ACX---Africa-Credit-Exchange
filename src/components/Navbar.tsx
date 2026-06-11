import { UserProfile, UserRole } from '../types';
import { Menu, Bell, LogOut } from 'lucide-react';
import AcxLogo from './AcxLogo';

interface NavbarProps {
  user: UserProfile;
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Navbar({ user, onMenuClick, onLogout }: NavbarProps) {
  return (
    <header className="bg-white dark:bg-[#1E293B] border-b border-[#E5E5E5] dark:border-white/5 h-16 flex items-center justify-between px-6 z-20 shrink-0 shadow-sm transition-colors">
      <div className="flex items-center gap-6">
        <button 
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <div className="flex items-center gap-2 select-none">
          <AcxLogo size="sm" />
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tighter leading-none uppercase">
              <span className="bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent">ACX</span> <span className="text-guava-orange font-black">Terminal</span>
            </span>
            <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Africa Credit Exchange</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {localStorage.getItem('acx_admin_impersonate_backup') && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <span className="text-[9px] font-black uppercase tracking-wider">Impersonation Node Active</span>
            <button 
              onClick={() => {
                const backup = localStorage.getItem('acx_admin_impersonate_backup');
                if (backup) {
                  localStorage.setItem('acx_sandbox_session', backup);
                  localStorage.removeItem('acx_admin_impersonate_backup');
                  window.location.reload();
                }
              }}
              className="text-[9px] font-black uppercase bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded-lg ml-1 font-sans transition-all cursor-pointer"
            >
              Exit
            </button>
          </div>
        )}

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
