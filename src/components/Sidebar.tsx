import { NavLink } from 'react-router-dom';
import { UserProfile, UserRole } from '../types';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Settings, 
  ShieldCheck,
  CreditCard,
  X,
  PlusCircle,
  User,
  Ban,
  Zap,
  Database
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
  onDeposit?: () => void;
}

export default function Sidebar({ isOpen, user, onClose, onDeposit }: SidebarProps) {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Zap, label: 'Market Maker', path: '/market-maker', roles: [UserRole.BANK, UserRole.INVESTOR] },
    { icon: User, label: 'Consumer Passport', path: '/profile', roles: [UserRole.BORROWER] },
    { icon: User, label: 'Merchant Passport', path: '/profile', roles: [UserRole.RETAILER] },
    { icon: User, label: 'Business Node', path: '/lender-profile', roles: [UserRole.LENDER, UserRole.INVESTOR, UserRole.BANK] },
    { icon: Briefcase, label: 'Business Portfolio', path: '/portfolio', roles: [UserRole.LENDER, UserRole.INVESTOR, UserRole.BANK] },
    { icon: PlusCircle, label: 'Loan Application', path: '/apply', roles: [UserRole.BORROWER, UserRole.RETAILER] },
    { icon: Briefcase, label: 'Merchant Cabinet', path: '/merchant-ledger', roles: [UserRole.RETAILER] },
    { icon: CreditCard, label: 'Repayments', path: '/repayments', roles: [UserRole.BORROWER] },
    { icon: ShieldCheck, label: 'Admin Terminal', path: '/admin', roles: [UserRole.ADMIN] },
    { icon: Database, label: 'Audit Trail', path: '/admin-audit', roles: [UserRole.ADMIN] },
    { icon: Ban, label: 'Blacklist', path: '/blacklist', roles: [UserRole.ADMIN, UserRole.LENDER, UserRole.INVESTOR, UserRole.BANK] },
    { icon: FileText, label: 'Financial Intel', path: '/reports', roles: [UserRole.ADMIN, UserRole.LENDER, UserRole.INVESTOR, UserRole.BANK] },
    { icon: Settings, label: 'System Config', path: '/settings' },
  ];

  const filteredItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user.role)
  );

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )} 
        onClick={onClose}
      />

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 bg-white dark:bg-[#0F172A] border-r border-gray-100 dark:border-white/5 transform transition-all duration-300 ease-in-out z-30 flex flex-col overflow-hidden",
        isOpen ? "w-64" : "w-0 lg:w-20"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-50 dark:border-white/5 shrink-0 bg-gray-50/50 dark:bg-[#1E293B]">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/40">Menu</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400 dark:text-white/60" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative",
                isActive 
                  ? "bg-guava-orange text-white shadow-lg shadow-guava-orange/20" 
                  : "text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-guava-dark dark:hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0",
                "group-hover:text-guava-orange transition-colors"
              )} />
              <span className={cn(
                "transition-opacity duration-300 whitespace-nowrap",
                !isOpen && "lg:opacity-0"
              )}>{item.label}</span>
              
              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {user.role !== UserRole.ADMIN && (
          <div className="p-4 mt-auto">
            <div className="bg-gray-50/50 dark:bg-[#1E293B] rounded-2xl p-5 text-gray-900 dark:text-white overflow-hidden relative group border border-gray-100 dark:border-white/5">
              <div className="relative z-10 transition-opacity duration-300" style={{ opacity: isOpen ? 1 : 0 }}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-white/30">Total Assets</p>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                </div>
                <p className="text-2xl font-bold font-mono tracking-tighter transition-colors text-guava-dark dark:text-white">${user.balance.toLocaleString()}</p>
                <button 
                  onClick={onDeposit}
                  className="mt-4 w-full py-2.5 bg-white dark:bg-white/5 text-gray-400 dark:text-white/70 rounded-xl text-[10px] uppercase tracking-widest font-black hover:bg-guava-orange hover:text-white transition-all border border-gray-100 dark:border-white/10"
                >
                  Deposit
                </button>
              </div>
              {!isOpen && (
                <div className="flex justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
