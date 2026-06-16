import { useState, useEffect } from 'react';
import { UserProfile, UserRole, Investment, LoanRequest } from '../types';
import { firestoreService } from '../services/firestoreService';
import LendingOrderModal from '../components/LendingOrderModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart as PieIcon, 
  Activity, 
  ChevronRight,
  ArrowUpRight,
  Clock,
  LayoutGrid,
  Zap,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Banknote,
  Plus,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PortfolioProps {
  user: UserProfile;
  onDeposit: () => void;
}

export default function Portfolio({ user, onDeposit }: PortfolioProps) {
  const [activeTab, setActiveTab] = useState<'allocations' | 'history'>('allocations');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [investments, setInvestments] = useState<(Investment & { loan?: LoanRequest })[]>([]);
  const [myLoans, setMyLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const isLender = [UserRole.LENDER, UserRole.INVESTOR, UserRole.BANK].includes(user.role);

  useEffect(() => {
    const loadPortfolio = async () => {
      setLoading(true);
      try {
        if (isLender) {
          const invData = await firestoreService.getInvestments(user.uid);
          const allLoans = await firestoreService.getLoans();
          const enrichedInvestments = invData.map(inv => ({
            ...inv,
            loan: allLoans.find(l => l.id === inv.loanId)
          }));
          setInvestments(enrichedInvestments);
        } else {
          const loanData = await firestoreService.getMyLoans(user.uid);
          setMyLoans(loanData);
        }
      } catch (error) {
        console.error("Failed to load portfolio:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [user.uid, isLender]);

  const totalPrincipal = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalValue = totalPrincipal * 1.05; // Simulate 5% growth for demo but based on actual principal
  const unrealizedGain = totalValue - totalPrincipal;
  const activeItems = isLender ? investments : myLoans;
  const chartBars = [42, 58, 46, 72, 64, 86, 76, 92, 82];
  const riskBands = [
    { label: 'Low Risk (A+)', value: totalValue > 0 ? 64 : 0, color: 'bg-emerald-400' },
    { label: 'Medium Risk (B)', value: totalValue > 0 ? 28 : 0, color: 'bg-guava-orange' },
    { label: 'High Risk (C)', value: totalValue > 0 ? 8 : 0, color: 'bg-red-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="max-w-7xl mx-auto space-y-8"
    >
      <div className="relative overflow-hidden rounded-[28px] bg-slate-950 text-white border border-slate-800 shadow-2xl shadow-slate-300/30">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-guava-orange via-guava-green to-blue-500" />
        <div className="relative p-6 md:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/70">
                  <ShieldCheck className="w-3.5 h-3.5 text-guava-green" />
                  ACX Portfolio Command
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Live Sync
                </div>
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white">
                Investment Portfolio
              </h2>
              <p className="mt-4 max-w-2xl text-sm md:text-base font-medium leading-7 text-slate-300">
                Track deployed capital, available balance, loan exposure, and performance history across your ACX credit activity.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-full lg:min-w-[420px]">
              {[
                { label: 'Available', value: `$${user.balance.toLocaleString()}`, icon: Wallet },
                { label: isLender ? 'Allocated' : 'Loans', value: isLender ? `$${totalPrincipal.toLocaleString()}` : myLoans.length.toString(), icon: Banknote },
                { label: 'Portfolio Value', value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp },
                { label: 'Open Items', value: activeItems.length.toString(), icon: Activity },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <stat.icon className="w-4 h-4 text-guava-orange mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-lg font-black tracking-tight text-white">{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <LendingOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        user={user}
      />

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-950 p-6 md:p-8 rounded-[28px] shadow-xl shadow-slate-300/30 border border-slate-800 flex flex-col justify-between overflow-hidden relative lg:col-span-5"
        >
           <div>
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-guava-orange text-white flex items-center justify-center shadow-lg shadow-guava-orange/20">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Synced
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Total Assets</p>
              <p className="text-4xl md:text-5xl font-black font-mono tracking-tighter text-white">${(user.balance + totalPrincipal).toLocaleString()}</p>
              <p className="mt-3 text-xs font-semibold text-slate-500">Available balance plus deployed principal.</p>
           </div>
           
           <div className="mt-8 space-y-4">
              <button 
                onClick={onDeposit}
                className="w-full py-4 bg-guava-orange text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.01] transition-all shadow-lg shadow-guava-orange/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Deposit Funds
              </button>

              {isLender && (
                <button 
                  onClick={() => setIsOrderModalOpen(true)}
                  className="w-full py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-3 h-3" />
                  Create Lending Order
                </button>
              )}
           </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-6 md:p-8 rounded-[28px] border border-slate-200 shadow-xl shadow-slate-200/50 lg:col-span-5"
        >
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-10">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Portfolio Value</p>
                 <p className="text-4xl md:text-5xl font-black font-mono tracking-tighter text-slate-950">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="sm:text-right rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Unrealized Gain</p>
                 <p className={cn("text-2xl font-black font-mono", unrealizedGain > 0 ? "text-emerald-500" : "text-slate-400")}>
                    {unrealizedGain >= 0 ? '+' : ''}${unrealizedGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </p>
              </div>
           </div>

           <div className="h-56 flex items-end gap-3 px-2 sm:px-4 rounded-3xl bg-slate-50 border border-slate-100 p-5">
              {activeItems.length > 0 ? (
                chartBars.map((h, i) => (
                    <div key={i} className="flex-1 h-full flex items-end group relative">
                       <motion.div
                         initial={{ height: 0 }}
                         animate={{ height: `${h}%` }}
                         transition={{ duration: 0.55, delay: i * 0.04, ease: 'easeOut' }}
                         className="w-full bg-slate-950 rounded-t-xl group-hover:bg-guava-orange transition-colors"
                       />
                       <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-slate-500">
                         {h}%
                       </div>
                    </div>
                ))
              ) : (
                <div className="flex-1 h-full flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-3xl">
                  <Sparkles className="w-7 h-7 text-slate-300 mb-3" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Capital Flow</p>
                </div>
              )}
           </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-6 md:p-8 rounded-[28px] text-slate-950 space-y-8 flex flex-col justify-between border border-slate-200 shadow-xl shadow-slate-200/50 lg:col-span-3"
        >
           <div>
              <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center mb-6 text-white">
                <PieIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black tracking-tight mb-2">Risk Distribution</h3>
              <p className="text-xs font-semibold text-slate-500 mb-6">Current demo mix across rated credit exposure.</p>
              <div className="space-y-4">
                 {riskBands.map((risk, index) => (
                   <div key={risk.label}>
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
                       <span>{risk.label}</span>
                       <span>{risk.value}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <motion.div
                         initial={{ width: 0 }}
                         animate={{ width: `${risk.value}%` }}
                         transition={{ duration: 0.55, delay: index * 0.08 }}
                         className={cn("h-full rounded-full", risk.color)}
                       />
                    </div>
                 </div>
                 ))}
              </div>
           </div>
           
           <button className="w-full py-4 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-950 hover:text-white transition-all">
             Optimize Mix
           </button>
        </motion.div>

      <div className="bg-white dark:bg-[#1E293B] rounded-[28px] border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 overflow-hidden lg:col-span-7">
         <div className="p-5 md:p-8 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex bg-slate-100 dark:bg-black p-1 rounded-2xl w-full sm:w-auto">
               <button 
                 onClick={() => setActiveTab('allocations')}
                 className={cn(
                   "flex-1 sm:flex-none justify-center px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                   activeTab === 'allocations' 
                    ? "bg-white dark:bg-[#1E293B] text-black dark:text-white shadow-sm" 
                    : "text-gray-400 hover:text-gray-600"
                 )}
               >
                 <LayoutGrid className="w-3 h-3" />
                 {isLender ? 'Active Allocations' : 'My Loans'}
               </button>
               <button 
                 onClick={() => setActiveTab('history')}
                 className={cn(
                   "flex-1 sm:flex-none justify-center px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                   activeTab === 'history' 
                    ? "bg-white dark:bg-[#1E293B] text-black dark:text-white shadow-sm" 
                    : "text-gray-400 hover:text-gray-600"
                 )}
               >
                 <Clock className="w-3 h-3" />
                 Event History
               </button>
            </div>
            {activeTab === 'allocations' && (
              <div className="flex gap-4">
                 <button className="text-[10px] font-black uppercase text-gray-400 hover:text-black dark:hover:text-white">All Assets</button>
                 <button className="text-[10px] font-black uppercase text-gray-400 hover:text-black dark:hover:text-white">Equity</button>
                 <button className="text-[10px] font-black uppercase text-gray-400 hover:text-black dark:hover:text-white">Debt</button>
              </div>
            )}
         </div>

         <AnimatePresence mode="wait">
         {activeTab === 'allocations' ? (
           <motion.div
             key="allocations"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -8 }}
             transition={{ duration: 0.25 }}
           >
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/80 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <th className="px-6 md:px-8 py-4">{isLender ? 'Asset ID / Borrower' : 'Loan ID / Purpose'}</th>
                       <th className="px-6 md:px-8 py-4">Principal</th>
                       <th className="px-6 md:px-8 py-4">{isLender ? 'Current Value' : 'Paid Amount'}</th>
                       <th className="px-6 md:px-8 py-4">Rate</th>
                       <th className="px-6 md:px-8 py-4 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {isLender ? (
                      investments.map((inv, i) => (
                        <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                           <td className="px-6 md:px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center font-black text-xs text-guava-dark dark:text-white">
                                    {inv.id.split('_')[1]}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold dark:text-white">{inv.loan?.purpose || 'Credit Asset'}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{inv.loanId}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 md:px-8 py-6">
                              <p className="text-sm font-mono font-bold dark:text-white">${inv.amount.toLocaleString()}</p>
                           </td>
                           <td className="px-6 md:px-8 py-6">
                              <div className="flex items-center gap-1.5">
                                 <p className="text-sm font-mono font-bold text-green-600">${(inv.amount * 1.05).toLocaleString()}</p>
                                 <ArrowUpRight className="w-3 h-3 text-green-500" />
                              </div>
                           </td>
                           <td className="px-6 md:px-8 py-6">
                              <span className="text-[10px] font-black px-2 py-1 bg-slate-950 dark:bg-white dark:text-black text-white rounded-md tracking-tighter">
                                 {inv.loan?.interestRate || '8.5'}%
                              </span>
                           </td>
                           <td className="px-6 md:px-8 py-6 text-right">
                              <button className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-gray-200">
                                 <ChevronRight className="w-4 h-4 dark:text-white" />
                              </button>
                           </td>
                        </tr>
                      ))
                    ) : (
                      myLoans.map((loan, i) => (
                        <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                           <td className="px-6 md:px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-guava-orange/10 flex items-center justify-center font-black text-xs text-guava-orange">
                                    {loan.id.slice(-4)}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold dark:text-white">{loan.purpose}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{loan.status}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 md:px-8 py-6">
                              <p className="text-sm font-mono font-bold dark:text-white">${loan.amount.toLocaleString()}</p>
                           </td>
                           <td className="px-6 md:px-8 py-6">
                              <p className="text-sm font-mono font-bold text-gray-500 dark:text-gray-400">$0.00</p>
                           </td>
                           <td className="px-6 md:px-8 py-6">
                              <span className="text-[10px] font-black px-2 py-1 bg-guava-dark text-white rounded-md tracking-tighter">
                                 {loan.interestRate}%
                              </span>
                           </td>
                           <td className="px-6 md:px-8 py-6 text-right">
                              <button className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-gray-200">
                                 <ChevronRight className="w-4 h-4 dark:text-white" />
                              </button>
                           </td>
                        </tr>
                      ))
                    )}
                    {(isLender ? investments : myLoans).length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-gray-400 text-sm font-bold italic uppercase tracking-widest">
                          No active {isLender ? 'investments' : 'loans'} found in your node.
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
           </motion.div>
         ) : (
           <motion.div
             key="history"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -8 }}
             transition={{ duration: 0.25 }}
             className="p-6 md:p-12 space-y-6"
           >
              {activeItems.length > 0 ? (
                [
                  { type: 'DEPOSIT', desc: 'Capital injection successful', amount: `+ $${user.balance.toLocaleString()}`, date: 'Just now' },
                  { type: 'SYNC', desc: 'Node synchronization key refreshed', amount: null, date: 'recently' }
                ].map((event, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 group hover:border-guava-orange transition-all">
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white dark:bg-black rounded-2xl flex items-center justify-center border border-gray-100 dark:border-white/10 text-gray-400 group-hover:text-guava-orange transition-colors">
                           <Clock className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-sm font-black uppercase tracking-tight dark:text-white">{event.desc}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase">{event.date} • TYPE: {event.type}</p>
                        </div>
                     </div>
                     {event.amount && (
                       <p className={cn(
                         "text-lg font-black font-mono tracking-tighter",
                         event.amount.startsWith('+') ? "text-green-500" : "text-gray-400 dark:text-white"
                       )}>
                         {event.amount}
                       </p>
                     )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-300">
                    <Clock className="w-8 h-8" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No recent audit events in node.</p>
                </div>
              )}
           </motion.div>
         )}
         </AnimatePresence>
      </div>
      </div>
    </motion.div>
  );
}
