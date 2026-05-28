import { useState, useEffect } from 'react';
import { UserProfile, AuditEventType, LoanStatus, LoanRequest } from '../types';
import { auditService } from '../lib/audit';
import { firestoreService } from '../services/firestoreService';
import { useFirebase } from '../components/FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  TrendingDown,
  History,
  Zap,
  RefreshCw,
  X,
  Lock,
  Wallet
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RepaymentsProps {
  user: UserProfile;
}

export default function Repayments({ user }: RepaymentsProps) {
    const { updateProfile } = useFirebase();
    const [loans, setLoans] = useState<LoanRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSettling, setIsSettling] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState<{loanId: string, amount: number, asset: string} | null>(null);

    useEffect(() => {
      const fetchData = async () => {
        try {
          const myLoans = await firestoreService.getMyLoans(user.uid);
          setLoans(myLoans.filter(l => l.status === LoanStatus.FUNDED));
        } catch (error) {
          console.error("Failed to fetch repayments data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [user.uid]);

    const totalOutstanding = loans.reduce((sum, l) => sum + l.amount, 0);

    const handleSettle = async (loanId: string, amount: number, asset: string) => {
      setShowConfirmModal({ loanId, amount, asset });
    };

    const confirmSettle = async () => {
      if (!showConfirmModal) return;
      const { loanId, amount, asset } = showConfirmModal;
      
      if (user.balance < amount) {
        alert("Insufficient balance in your portal wallet. Please deposit more funds.");
        setShowConfirmModal(null);
        return;
      }

      setIsSettling(loanId);
      setShowConfirmModal(null);
      
      try {
        // 1. Deduct from balance & reward credit score
        await updateProfile({ 
          balance: user.balance - amount,
          creditScore: Math.min(850, user.creditScore + 50)
        });

        // 2. Mark loan as COMPLETED (or reduce amount if we supported partials)
        await firestoreService.updateLoan(loanId, { status: LoanStatus.COMPLETED });

        // 3. Log Audit
        await auditService.log(
          user,
          AuditEventType.REPAYMENT_MADE,
          `Settlement processed for ${asset}: $${amount}`,
          'CRITICAL',
          { loanId, amount, asset }
        );

        // Update local state
        setLoans(prev => prev.filter(l => l.id !== loanId));
        
        alert(`Successfully settled $${amount} for ${asset}`);
      } catch (error) {
        console.error("Settlement failed:", error);
        alert("Settlement failed. Please try again.");
      } finally {
        setIsSettling(null);
      }
    };

    if (loading) {
      return (
        <div className="h-[400px] flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-guava-orange animate-spin" />
        </div>
      );
    }

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-guava-orange rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">ACX Settlement Engine</span>
           </div>
           <h2 className="text-5xl font-black tracking-tighter italic text-guava-dark dark:text-white">Repayment Terminal</h2>
           <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mt-2">Manage your portal obligations and optimize your credit resonance.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-[32px] border border-gray-100 dark:border-white/5 flex items-center gap-4 shadow-sm transition-colors">
            <div className="w-12 h-12 bg-guava-orange/10 rounded-2xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-guava-orange" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Total Outstanding</p>
              <p className="text-xl font-black text-guava-dark dark:text-white font-mono">${totalOutstanding.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-guava-orange p-6 rounded-[32px] flex items-center gap-4 shadow-xl shadow-guava-orange/10 text-white transition-colors">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-guava-orange" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Next Payment</p>
              <p className="text-xl font-black font-mono">${loans.length > 0 ? (loans[0].amount / 12).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Schedule */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white dark:bg-[#1E293B] rounded-[48px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
              <div className="p-8 border-b border-gray-50 dark:border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <Calendar className="w-5 h-5 text-guava-orange" />
                   <h3 className="text-xl font-black text-guava-dark dark:text-white italic">Active Obligations</h3>
                 </div>
                 <button className="text-[10px] font-black uppercase tracking-widest text-guava-orange hover:underline">Sync Ledger</button>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-white/5">
                {loans.length === 0 ? (
                  <div className="p-20 text-center space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-guava-green mx-auto opacity-20" />
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Active Obligations Detected</p>
                  </div>
                ) : loans.map((loan) => (
                  <div key={loan.id} className="p-8 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm bg-gray-100 dark:bg-white/10">
                        <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-guava-dark dark:group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1">{loan.purpose}</p>
                        <p className="text-lg font-black text-guava-dark dark:text-white">Active Loan #{loan.id.slice(-6)}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Rate: {loan.interestRate}%</span>
                          <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase bg-guava-orange/10 text-guava-orange">
                            FUNDED
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-8">
                       <div>
                          <p className="text-xl font-black font-mono text-guava-dark dark:text-white">${loan.amount.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500">Total Settlement Required</p>
                       </div>
                       <button 
                         onClick={() => handleSettle(loan.id, loan.amount, loan.purpose)}
                         disabled={!!isSettling}
                         className="relative px-6 py-3 bg-guava-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-guava-orange/10 disabled:opacity-50 disabled:cursor-not-allowed group/btn overflow-hidden"
                       >
                         <span className={cn(
                           "transition-transform inline-block",
                           isSettling === loan.id ? "-translate-y-12" : "translate-y-0"
                         )}>
                           Settle Full
                         </span>
                         {isSettling === loan.id && (
                           <div className="absolute inset-0 flex items-center justify-center">
                             <motion.div 
                               animate={{ rotate: 360 }}
                               transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                             >
                               <RefreshCw className="w-4 h-4" />
                             </motion.div>
                           </div>
                         )}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           {/* Early Settlement Incentive */}
           <div className="bg-guava-orange/5 border border-guava-orange/10 rounded-[40px] p-8 relative overflow-hidden group">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-guava-orange/5 group-hover:rotate-12 transition-transform">
                       <Zap className="w-8 h-8 text-guava-orange" />
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-guava-dark italic">Optimization Bonus</h4>
                       <p className="text-gray-500 text-sm max-w-md">Settle obligations early from your portal wallet to increase your ACX resonance score by up to 12%.</p>
                    </div>
                 </div>
                 <button className="px-8 py-4 bg-white border border-guava-orange/20 text-guava-dark rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-guava-orange hover:text-white transition-all shadow-sm">
                   View Score Impact
                 </button>
              </div>
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-guava-orange/5 rounded-full blur-3xl" />
           </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
           <div className="bg-guava-orange rounded-[48px] p-8 text-white relative overflow-hidden shadow-2xl">
              <h3 className="text-xl font-black italic mb-6">Settlement Wallet</h3>
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                 <div className="flex justify-between items-center text-xs font-bold text-white/40">
                   <span>PORTAL NODE BALANCE</span>
                   <Wallet className="w-4 h-4" />
                 </div>
                 <div className="flex items-center gap-4">
                    <div>
                       <p className="text-2xl font-black font-mono">${user.balance.toLocaleString()}</p>
                       <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Available to offset debt</p>
                    </div>
                 </div>
                 <div className="pt-4 space-y-3">
                    <p className="text-[9px] font-bold text-white/60 leading-relaxed uppercase tracking-tighter">Your recent deposit will show here. Use this balance to settle active loans below.</p>
                 </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10">
                 <div className="flex justify-between items-center mb-4 text-xs font-bold text-white/40">
                   <span>AUTOMATED OFFSET</span>
                   <div className="w-8 h-4 bg-guava-dark/20 rounded-full relative">
                      <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white/50 rounded-full shadow-sm" />
                   </div>
                 </div>
                 <p className="text-[10px] text-white/40 leading-relaxed italic">Enable auto-offset in settings to automatically use deposits for repayment.</p>
              </div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-guava-orange/10 rounded-full blur-3xl" />
           </div>

           <div className="bg-white dark:bg-[#1E293B] rounded-[40px] border border-gray-100 dark:border-white/5 p-8 shadow-sm transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <History className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-black text-guava-dark dark:text-white italic">Recent Ledger</h3>
              </div>
              <div className="space-y-6">
                 {user.balance > 0 && (
                   <div className="flex justify-between items-center bg-guava-green/5 p-3 rounded-2xl border border-guava-green/10">
                      <div>
                         <p className="text-xs font-black text-guava-green italic">Recent Portal Deposit</p>
                         <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Just Now</p>
                      </div>
                      <p className="text-sm font-black font-mono text-guava-green">+${user.balance.toLocaleString()}</p>
                   </div>
                 )}
                 <div className="flex justify-between items-center opacity-50">
                    <div>
                       <p className="text-xs font-black text-guava-dark dark:text-white">Portal Sync-42</p>
                       <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">May 12, 2026</p>
                    </div>
                    <p className="text-sm font-black font-mono text-gray-400 dark:text-gray-600">$0.00</p>
                 </div>
                 <button className="w-full py-4 bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 hover:text-guava-dark dark:hover:text-white transition-all">
                    Download Full Ledger
                 </button>
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(null)}
              className="absolute inset-0 bg-guava-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl relative z-10 p-10"
            >
               <button 
                 onClick={() => setShowConfirmModal(null)}
                 className="absolute top-8 right-8 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all text-gray-400"
               >
                 <X className="w-6 h-6" />
               </button>

               <div className="mb-8">
                  <div className="w-16 h-16 bg-guava-orange/10 rounded-[28px] flex items-center justify-center mb-6">
                    <CreditCard className="w-8 h-8 text-guava-orange" />
                  </div>
                  <h3 className="text-3xl font-black italic tracking-tighter dark:text-white">Confirm Settlement</h3>
                  <p className="text-gray-400 text-sm font-medium mt-1">Authorize portal obligation settlement using your current wallet balance.</p>
               </div>

               <div className="space-y-6">
                  <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Payment Method</p>
                           <div className="flex items-center gap-3">
                              <Wallet className="w-4 h-4 text-guava-orange" />
                              <p className="text-sm font-black font-mono dark:text-white uppercase tracking-widest">Portal Wallet Balance</p>
                           </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-guava-green" />
                     </div>
                     <div className="pt-6 border-t border-gray-100 dark:border-white/5 space-y-3">
                        <div className="flex justify-between text-xs font-bold">
                           <span className="text-gray-400">Principal + interest</span>
                           <span className="dark:text-white">${showConfirmModal.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold border-b border-gray-100 dark:border-white/5 pb-2">
                           <span className="text-gray-400">Available Balance</span>
                           <span className="text-guava-green">${user.balance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black pt-2">
                           <span className="dark:text-white font-black italic">Remaining after payment</span>
                           <span className="text-guava-orange italic font-mono">${(user.balance - showConfirmModal.amount).toLocaleString()}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                     <Lock className="w-4 h-4 text-guava-orange" />
                     <p className="text-[10px] text-guava-orange font-bold">This transaction will be deducted from your deposit balance.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <button 
                        onClick={() => setShowConfirmModal(null)}
                        className="py-5 border border-gray-100 dark:border-white/5 rounded-3xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={confirmSettle}
                        className="py-5 bg-guava-dark text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-guava-orange transition-all shadow-xl shadow-guava-orange/20"
                     >
                        Confirm Repayment
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
