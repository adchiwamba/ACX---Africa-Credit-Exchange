import { useState, useEffect } from 'react';
import { UserProfile, UserRole, Investment, LoanRequest } from '../types';
import { firestoreService } from '../services/firestoreService';
import LendingOrderModal from '../components/LendingOrderModal';
import { 
  PieChart as PieIcon, 
  Activity, 
  ChevronRight,
  ArrowUpRight,
  Clock,
  LayoutGrid,
  Zap
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

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">Investment Portfolio</h2>
          <p className="text-gray-400 text-sm font-medium">Tracking your deployed capital and yield performance.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full border border-green-100 italic font-black text-xs">
          <Activity className="w-3 h-3" />
          ACTIVE PERFORMANCE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-guava-dark p-8 rounded-[32px] shadow-xl shadow-guava-orange/10 flex flex-col justify-between">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Total Assets</p>
              <p className="text-5xl font-black font-mono tracking-tighter text-white">${(user.balance + totalPrincipal).toLocaleString()}</p>
           </div>
           
           <div className="mt-8 space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Portal Node</span>
                    <span className="text-[8px] font-black text-guava-green uppercase tracking-widest flex items-center gap-1">
                       <div className="w-1 h-1 bg-guava-green rounded-full animate-pulse" />
                       Synced
                    </span>
                 </div>
              </div>
              
              <button 
                onClick={onDeposit}
                className="w-full py-4 bg-guava-orange text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-guava-orange/20 mb-3"
              >
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
        </div>

        <LendingOrderModal 
          isOpen={isOrderModalOpen} 
          onClose={() => setIsOrderModalOpen(false)} 
          user={user} 
        />

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm col-span-1 md:col-span-2">
           <div className="flex justify-between items-start mb-10">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Portfolio Value</p>
                 <p className="text-5xl font-black font-mono tracking-tighter">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Unrealized Gain</p>
                 <p className={cn("text-2xl font-black font-mono", unrealizedGain > 0 ? "text-green-500" : "text-gray-400")}>
                    {unrealizedGain >= 0 ? '+' : ''}${unrealizedGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                 </p>
              </div>
           </div>

           <div className="h-48 flex items-end gap-3 px-4">
              {investments.length > 0 ? (
                // If there are real investments, spread them across the chart area
                Array.from({ length: 9 }).map((_, i) => {
                  const h = 5 + Math.random() * 95;
                  return (
                    <div key={i} className="flex-1 bg-gray-100 rounded-t-xl group relative">
                       <div className="absolute inset-0 bg-black scale-y-0 group-hover:scale-y-100 origin-bottom transition-transform duration-500 rounded-t-xl" style={{ height: `${h}%` }} />
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold">
                         {Math.round(h)}%
                       </div>
                    </div>
                  );
                })
              ) : (
                // Empty state for chart
                <div className="flex-1 h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Awaiting Capital Flow</p>
                </div>
              )}
           </div>
        </div>

        <div className="bg-[#1A1A1A] p-8 rounded-[32px] text-white space-y-8 flex flex-col justify-between">
           <div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                <PieIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold tracking-tight mb-4">Risk Distribution</h3>
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase opacity-40 mb-2">
                       <span>Low Risk (A+)</span>
                       <span>{totalValue > 0 ? '64%' : '0%'}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-green-400" style={{ width: totalValue > 0 ? '64%' : '0%' }} />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase opacity-40 mb-2">
                       <span>Medium Risk (B)</span>
                       <span>{totalValue > 0 ? '28%' : '0%'}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-orange-400" style={{ width: totalValue > 0 ? '28%' : '0%' }} />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase opacity-40 mb-2">
                       <span>High Risk (C)</span>
                       <span>{totalValue > 0 ? '8%' : '0%'}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-red-400" style={{ width: totalValue > 0 ? '8%' : '0%' }} />
                    </div>
                 </div>
              </div>
           </div>
           
           <button className="w-full py-4 border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
             Optimize Mix
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-gray-50 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex bg-gray-100 dark:bg-black p-1 rounded-2xl">
               <button 
                 onClick={() => setActiveTab('allocations')}
                 className={cn(
                   "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
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
                   "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
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

         {activeTab === 'allocations' ? (
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-gray-50/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                       <th className="px-8 py-4">{isLender ? 'Asset ID / Borrower' : 'Loan ID / Purpose'}</th>
                       <th className="px-8 py-4">Principal</th>
                       <th className="px-8 py-4">{isLender ? 'Current Value' : 'Paid amount'}</th>
                       <th className="px-8 py-4">Rate</th>
                       <th className="px-8 py-4 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                    {isLender ? (
                      investments.map((inv, i) => (
                        <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center font-black text-xs text-guava-dark dark:text-white">
                                    {inv.id.split('_')[1]}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold dark:text-white">{inv.loan?.purpose || 'Credit Asset'}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{inv.loanId}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-sm font-mono font-bold dark:text-white">${inv.amount.toLocaleString()}</p>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-1.5">
                                 <p className="text-sm font-mono font-bold text-green-600">${(inv.amount * 1.05).toLocaleString()}</p>
                                 <ArrowUpRight className="w-3 h-3 text-green-500" />
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-[10px] font-black px-2 py-1 bg-black dark:bg-white dark:text-black text-white rounded-md tracking-tighter">
                                 {inv.loan?.interestRate || '8.5'}%
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <button className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-gray-200">
                                 <ChevronRight className="w-4 h-4 dark:text-white" />
                              </button>
                           </td>
                        </tr>
                      ))
                    ) : (
                      myLoans.map((loan, i) => (
                        <tr key={i} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                           <td className="px-8 py-6">
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
                           <td className="px-8 py-6">
                              <p className="text-sm font-mono font-bold dark:text-white">${loan.amount.toLocaleString()}</p>
                           </td>
                           <td className="px-8 py-6">
                              <p className="text-sm font-mono font-bold text-gray-500 dark:text-gray-400">$0.00</p>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-[10px] font-black px-2 py-1 bg-guava-dark text-white rounded-md tracking-tighter">
                                 {loan.interestRate}%
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right">
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
         ) : (
           <div className="p-12 space-y-6">
              {(isLender ? investments : myLoans).length > 0 ? (
                [
                  { type: 'DEPOSIT', desc: 'Capital injection successful', amount: `+ $${user.balance.toLocaleString()}`, date: 'Just now' },
                  { type: 'SYNC', desc: 'Node synchronization key refreshed', amount: null, date: 'recently' }
                ].map((event, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 group hover:border-guava-orange transition-all">
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
           </div>
         )}
      </div>
    </div>
  );
}
