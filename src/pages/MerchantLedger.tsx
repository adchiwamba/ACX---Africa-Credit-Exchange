import { useState, useEffect } from 'react';
import { UserProfile, LoanStatus, LoanRequest, AuditEventType } from '../types';
import { firestoreService } from '../services/firestoreService';
import { useFirebase } from '../components/FirebaseProvider';
import { auditService } from '../lib/audit';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  PlusCircle, 
  Briefcase, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Calculator,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface MerchantLedgerProps {
  user: UserProfile;
}

export default function MerchantLedger({ user }: MerchantLedgerProps) {
  const { updateProfile } = useFirebase();
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal states
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [repaymentSimulating, setRepaymentSimulating] = useState<string | null>(null);

  // Form states for custom loan origination
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [interestRate, setInterestRate] = useState('12');
  const [durationMonths, setDurationMonths] = useState('6');

  const fetchIssuedLoans = async () => {
    try {
      const data = await firestoreService.getIssuedLoans(user.uid);
      setLoans(data);
    } catch (error) {
      console.error("Failed to load retailer issued loans:", error);
    }
  };

  useEffect(() => {
    fetchIssuedLoans();
  }, [user.uid]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchIssuedLoans();
    setIsRefreshing(false);
  };

  // origination
  const handleIssueLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const principalAmount = parseFloat(amount);
    const rate = parseFloat(interestRate);
    const term = parseInt(durationMonths);

    if (!customerEmail || !customerName || isNaN(principalAmount) || principalAmount <= 0) {
      alert("Please enrich all operational parameters correctly.");
      return;
    }

    if (user.balance < principalAmount) {
      alert("Operational error: Your current terminal balance is insufficient to back this credit line.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a LoanRequest with status FUNDED immediately
      const newLoanPayload = {
        borrowerId: customerEmail, // Using customer identifier 
        lenderId: user.uid,
        amount: principalAmount,
        currency: 'USD',
        purpose: `${purpose || 'Business Retail Financing'} (Issued by ${user.displayName})`,
        durationMonths: term,
        interestRate: rate,
        status: LoanStatus.FUNDED,
        creditScoreSnapshot: 700, 
        alternativeDataMetrics: {
          clientName: customerName,
          channel: 'Direct Retail Store POS',
          issuedBy: user.displayName
        }
      };

      await firestoreService.createLoan(newLoanPayload);

      // Decrement merchant balance
      await updateProfile({
        balance: user.balance - principalAmount
      });

      // Audit trail
      await auditService.log(
        user,
        AuditEventType.LOAN_APPLIED,
        `Merchant issued direct retail credit line to ${customerName}: $${principalAmount}`,
        'INFO',
        { customerEmail, customerName, principalAmount }
      );

      // Reset
      setCustomerEmail('');
      setCustomerName('');
      setAmount('');
      setPurpose('');
      setIsIssueModalOpen(false);
      
      // Refresh
      await fetchIssuedLoans();
      alert(`Customer credit ticket initialized successfully! Deployed $${principalAmount} for ${customerName}.`);
    } catch (error) {
      console.error("Failed to origin loan:", error);
      alert("Failed to record credit. Please verify connectivity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogRepayment = async (loanId: string, returnAmount: number, clientName: string) => {
    if (!confirm(`Confirm customer cash/mobile money settlement of $${returnAmount} for ${clientName}?`)) return;
    
    setRepaymentSimulating(loanId);
    try {
      // 1. Mark loan as complete
      await firestoreService.updateLoan(loanId, { status: LoanStatus.COMPLETED });

      // 2. Refresh balance & credit score of merchant
      await updateProfile({
        balance: user.balance + returnAmount
      });

      // 3. Log audit
      await auditService.log(
        user,
        AuditEventType.REPAYMENT_MADE,
        `Merchant processed outward loan receipt of $${returnAmount} for customer ${clientName}`,
        'CRITICAL',
        { loanId, returnAmount, clientName }
      );

      await fetchIssuedLoans();
      alert(`Ledger successfully balanced! Outward yield of $${returnAmount} returned to active merchant pool.`);
    } catch (error) {
      console.error("Outward repayment failed:", error);
      alert("System failed to update local ledger. Please try again.");
    } finally {
      setRepaymentSimulating(null);
    }
  };

  // calculations
  const totalPrincipalIssued = loans.reduce((sum, l) => sum + l.amount, 0);
  const activeObligations = loans.filter(l => l.status === LoanStatus.FUNDED);
  const activeAmount = activeObligations.reduce((sum, l) => sum + l.amount, 0);
  const averageInterest = loans.length > 0 ? (loans.reduce((sum, l) => sum + l.interestRate, 0) / loans.length).toFixed(1) : '0';

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000">
      
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-guava-orange rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">ACX Retailer Merchant Ecosystem</span>
           </div>
           <h2 className="text-5xl font-black tracking-tighter italic text-guava-dark dark:text-white">Merchant Cabinet</h2>
           <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mt-2">Design merchant credit lines, issue customer inventory financing, and track repayments directly.</p>
        </div>

        <div className="flex gap-4">
          <button 
             onClick={() => setIsIssueModalOpen(true)}
             className="px-6 py-4 bg-guava-orange text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-guava-dark transition-all shadow-xl shadow-guava-orange/20"
          >
             <PlusCircle className="w-4 h-4" />
             Issue Customer Credit
          </button>
          
          <button 
             onClick={handleRefresh}
             disabled={isRefreshing}
             className="p-4 bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 rounded-3xl text-gray-400 hover:text-guava-orange transition-colors"
          >
             <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-guava-orange' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/20 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-guava-orange" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Merchant Pool Balance</p>
          <p className="text-2xl font-black text-guava-dark dark:text-white mt-1 font-mono">${user.balance.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-950/20 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Total Capital Deployed</p>
          <p className="text-2xl font-black text-guava-dark dark:text-white mt-1 font-mono">${totalPrincipalIssued.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Active Debt Lines</p>
          <p className="text-2xl font-black text-guava-dark dark:text-white mt-1 font-mono">{activeObligations.length} <span className="text-xs text-gray-400">(${activeAmount.toLocaleString()})</span></p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-[32px] border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/20 rounded-2xl flex items-center justify-center mb-4">
            <Calculator className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Average Active Yield</p>
          <p className="text-2xl font-black text-guava-dark dark:text-white mt-1 font-mono">{averageInterest}% ARR</p>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="bg-white dark:bg-[#1E293B] rounded-[48px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
        <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-guava-orange" />
              <h3 className="text-xl font-black text-guava-dark dark:text-white italic">Active Merchant Ledger</h3>
           </div>
           <span className="text-xs font-bold text-gray-400">Total Customer Records: {loans.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Asset / Client</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Origin Date</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Client ID / Email</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Principal / Rate</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Term</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">State</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-gray-400">
                    <CheckCircle2 className="w-12 h-12 text-guava-green mx-auto opacity-20 mb-3" />
                    <p className="text-sm font-black uppercase tracking-widest">No Direct Credit Lines Issued Yet</p>
                    <p className="text-xs font-medium text-gray-400 mt-1">Initiate customer financing from the button above.</p>
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const clientName = (loan.alternativeDataMetrics as { clientName?: string })?.clientName || "Customer Entity";
                  return (
                    <tr key={loan.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-black text-guava-dark dark:text-white capitalize text-sm">{loan.purpose.replace(`(Issued by ${user.displayName})`, '').trim()}</p>
                        <p className="text-[10px] text-gray-400 font-bold tracking-tight uppercase mt-0.5">LID: #{loan.id.slice(-6)}</p>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-500 font-medium font-mono">
                        {new Date(loan.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-black text-sm text-gray-700 dark:text-gray-300">{clientName}</p>
                        <p className="text-xs text-gray-400 font-mono font-medium">{loan.borrowerId}</p>
                      </td>
                      <td className="px-8 py-6 font-mono">
                        <p className="text-sm font-black text-guava-dark dark:text-white">${loan.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-green-500 font-bold">{loan.interestRate}% interest</p>
                      </td>
                      <td className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-widest">
                        {loan.durationMonths} months
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase ${
                          loan.status === LoanStatus.COMPLETED 
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                            : 'bg-guava-orange/10 text-guava-orange'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {loan.status === LoanStatus.FUNDED ? (
                          <button
                            onClick={() => handleLogRepayment(loan.id, loan.amount * (1 + loan.interestRate / 100), clientName)}
                            disabled={repaymentSimulating === loan.id}
                            className="px-4 py-2 bg-white dark:bg-white/5 border border-guava-orange/20 hover:bg-guava-orange hover:text-white hover:border-transparent text-guava-orange rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                          >
                            {repaymentSimulating === loan.id ? 'balancing...' : 'Log Repayment'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 italic">Fully Settled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit terms informational callout */}
      <div className="bg-guava-orange/5 border border-guava-orange/10 rounded-[40px] p-8 relative overflow-hidden group">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-white dark:bg-[#1E293B] rounded-3xl flex items-center justify-center shadow-lg shadow-guava-orange/5">
                  <Calculator className="w-8 h-8 text-guava-orange" />
               </div>
               <div>
                  <h4 className="text-xl font-black text-guava-dark dark:text-white italic">Custom Dynamic BNPL Policies</h4>
                  <p className="text-gray-500 text-sm max-w-xl">Every consumer BNPL credit agreement issued contributes positively to your merchants trust ledger, unlock deep sync liquidity vaults from local partners.</p>
               </div>
            </div>
            <button className="px-8 py-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-guava-dark dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-guava-orange hover:text-white transition-all shadow-sm">
               Partner Terms
            </button>
         </div>
      </div>

      {/* Issuance Form Modal */}
      <AnimatePresence>
        {isIssueModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white dark:bg-[#1E293B] w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl relative border border-gray-100 dark:border-white/5"
            >
               <button 
                  onClick={() => setIsIssueModalOpen(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all text-gray-400"
               >
                  <X className="w-5 h-5" />
               </button>

               <form onSubmit={handleIssueLoan} className="p-8 md:p-10 space-y-6">
                  <div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-guava-orange">POS Channel Origination</span>
                     <h3 className="text-3xl font-black tracking-tight mt-1 text-guava-dark dark:text-white italic">Direct Customer Credit</h3>
                  </div>

                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Customer Full Name</label>
                           <input 
                              type="text" 
                              required
                              value={customerName}
                              onChange={e => setCustomerName(e.target.value)}
                              placeholder="e.g. John Sibanda"
                              className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Customer Email / ID</label>
                           <input 
                              type="email" 
                              required
                              value={customerEmail}
                              onChange={e => setCustomerEmail(e.target.value)}
                              placeholder="client@acx.africa"
                              className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Financing Purpose</label>
                           <input 
                              type="text" 
                              required
                              value={purpose}
                              onChange={e => setPurpose(e.target.value)}
                              placeholder="e.g. Device Financing - Samsung"
                              className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Credit Principal ($ USD)</label>
                           <div className="relative">
                              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                              <input 
                                 type="number" 
                                 min="10"
                                 required
                                 value={amount}
                                 onChange={e => setAmount(e.target.value)}
                                 placeholder="500"
                                 className="w-full pl-9 pr-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                              />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Financing Tenure (Months)</label>
                           <select 
                              value={durationMonths}
                              onChange={e => setDurationMonths(e.target.value)}
                              className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-black outline-none focus:border-guava-orange transition-all dark:text-white cursor-pointer"
                           >
                              <option value="3">3 Months</option>
                              <option value="6">6 Months</option>
                              <option value="12">12 Months</option>
                              <option value="24">24 Months</option>
                           </select>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-2">Flat Interest Rate (%)</label>
                           <input 
                              type="number" 
                              min="0"
                              max="30"
                              required
                              value={interestRate}
                              onChange={e => setInterestRate(e.target.value)}
                              placeholder="12"
                              className="w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                           />
                        </div>
                     </div>
                  </div>

                  {/* Wallet Check helper */}
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl flex gap-3 text-xs">
                     <AlertCircle className="w-5 h-5 text-guava-orange shrink-0 mt-0.5" />
                     <div>
                        <p className="font-black text-guava-orange uppercase text-[10px] tracking-wider">WALLET AFFORDABILITY CHECK</p>
                        <p className="text-gray-500 font-medium mt-0.5">Your pool balance: <span className="font-mono font-bold">${user.balance.toLocaleString()}</span>. Funding this credit immediately locks liquidity from your pool balance.</p>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                       type="button" 
                       onClick={() => setIsIssueModalOpen(false)} 
                       className="flex-1 py-4 border border-gray-100 dark:border-white/10 rounded-3xl font-black text-xs uppercase tracking-widest text-gray-400"
                    >
                       Cancel
                    </button>
                    <button 
                       type="submit" 
                       disabled={isSubmitting}
                       className="flex-2 py-4 bg-guava-orange text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                       {isSubmitting ? 'Recording Ticket...' : 'Deploy Direct Credit'}
                       <ShieldCheck className="w-4 h-4" />
                    </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
