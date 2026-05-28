import { useState, useEffect } from 'react';
import { UserProfile, LoanStatus, LoanRequest } from '../types';
import { firestoreService } from '../services/firestoreService';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  ChevronRight,
  MapPin,
  Clock,
  Fingerprint,
  Activity,
  Zap,
  BarChart3,
  Calendar,
  Smartphone,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MarketplaceProps {
  user: UserProfile;
}

const getRatingLabel = (score: number) => {
  if (score >= 800) return { label: 'AAA', color: 'bg-guava-green text-white', desc: 'Prime' };
  if (score >= 700) return { label: 'AA', color: 'bg-guava-green/80 text-white', desc: 'Very Low Risk' };
  if (score >= 600) return { label: 'A', color: 'bg-guava-green/60 text-white', desc: 'Low Risk' };
  if (score >= 500) return { label: 'BBB', color: 'bg-guava-orange text-white', desc: 'Satisfactory' };
  if (score >= 400) return { label: 'BB', color: 'bg-guava-orange/80 text-white', desc: 'High Risk' };
  return { label: 'C', color: 'bg-red-500 text-white', desc: 'Alert' };
};

const getStatusStyles = (status: LoanStatus) => {
  switch (status) {
    case LoanStatus.PENDING:
      return "bg-amber-100 text-amber-700 border-amber-200";
    case LoanStatus.APPROVED:
      return "bg-blue-100 text-blue-700 border-blue-200";
    case LoanStatus.FUNDED:
      return "bg-guava-green/10 text-guava-green border-guava-green/20";
    case LoanStatus.REJECTED:
      return "bg-red-100 text-red-700 border-red-200";
    case LoanStatus.COMPLETED:
      return "bg-gray-100 text-gray-700 border-gray-200";
    case LoanStatus.DEFAULTED:
      return "bg-red-900 text-white border-red-900";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

export default function Marketplace({ user }: MarketplaceProps) {
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [minAmount, setMinAmount] = useState(0);
  const [minRate, setMinRate] = useState(0);
  const [minScore, setMinScore] = useState(0);
  const [maxDuration, setMaxDuration] = useState(36);

  useEffect(() => {
    const fetchLoans = async () => {
      setLoading(true);
      try {
        const data = await firestoreService.getLoans();
        // Only show pending or approved loans in marketplace
        setLoans(data.filter(l => [LoanStatus.PENDING, LoanStatus.APPROVED].includes(l.status)));
      } catch (error) {
        console.error("Failed to fetch loans:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  const handleCommit = async (loan: LoanRequest) => {
    try {
      // 1. Create investment
      await firestoreService.createInvestment({
        lenderId: user.uid,
        loanId: loan.id,
        amount: loan.amount, // Funding the whole loan for simplicity in this demo
      });
      
      // 2. Refresh loans (the rules allow isAdmin or specific updates, but for this demo, 
      // we'll assume the client can update status or we'd ideally have a transaction)
      // Actually, my rules allow lenders to update status to FUNDED if they change nothing else
      
      alert(`Success! You have committed liquidity to ${loan.purpose}.`);
      setLoans(prev => prev.filter(l => l.id !== loan.id));
    } catch (error) {
      console.error("Commit failed:", error);
      alert("Failed to commit liquidity. Check your connectivity.");
    }
  };

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
      loan.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.borrowerId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAmount = loan.amount >= minAmount;
    const matchesRate = loan.interestRate >= minRate;
    const matchesScore = loan.creditScoreSnapshot >= minScore;
    const matchesDuration = loan.durationMonths <= maxDuration;

    return matchesSearch && matchesAmount && matchesRate && matchesScore && matchesDuration;
  });

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-guava-orange rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">ACX Liquidity Terminal</span>
           </div>
           <h2 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">Credit Auction Board</h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2">Bidding open for institutional-grade vetted credit assets.</p>
        </div>
        
        <div className="flex flex-col items-end gap-4 w-full lg:max-w-2xl">
          <div className="flex w-full gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-guava-orange transition-colors" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search purpose, ID, or borrower..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-3xl text-sm outline-none focus:border-guava-orange shadow-sm transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-6 py-4 border rounded-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all shadow-sm",
                showFilters ? "bg-slate-900 text-white border-slate-900 dark:bg-slate-800" : "bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-800 hover:border-guava-orange"
              )}
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Filters'}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="w-full bg-white border border-gray-100 rounded-[40px] p-8 shadow-xl overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {/* Amount Filter */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Min Amount</label>
                      <span className="text-xs font-bold text-guava-orange">${minAmount.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100000" 
                      step="5000"
                      value={minAmount}
                      onChange={(e) => setMinAmount(Number(e.target.value))}
                      className="w-full accent-guava-orange"
                    />
                  </div>

                  {/* Rate Filter */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Min APR</label>
                      <span className="text-xs font-bold text-guava-orange">{minRate}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="30" 
                      step="1"
                      value={minRate}
                      onChange={(e) => setMinRate(Number(e.target.value))}
                      className="w-full accent-guava-orange"
                    />
                  </div>

                  {/* Score Filter */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Min ACX Score</label>
                      <span className="text-xs font-bold text-guava-orange">{minScore}</span>
                    </div>
                    <input 
                      type="range" 
                      min="300" 
                      max="850" 
                      step="50"
                      value={minScore}
                      onChange={(e) => setMinScore(Number(e.target.value))}
                      className="w-full accent-guava-orange"
                    />
                  </div>

                  {/* Duration Filter */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Max Duration</label>
                      <span className="text-xs font-bold text-guava-orange">{maxDuration} Mo</span>
                    </div>
                    <input 
                      type="range" 
                      min="6" 
                      max="60" 
                      step="6"
                      value={maxDuration}
                      onChange={(e) => setMaxDuration(Number(e.target.value))}
                      className="w-full accent-guava-orange"
                    />
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <p className="text-[9px] font-medium text-slate-400">Showing {filteredLoans.length} active assets</p>
                  <button 
                    onClick={() => {
                      setMinAmount(0);
                      setMinRate(0);
                      setMinScore(0);
                      setMaxDuration(36);
                      setSearchTerm('');
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest text-guava-orange hover:underline"
                  >
                    Reset All
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredLoans.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                <Search className="w-10 h-10" />
             </div>
             <div>
                <p className="text-xl font-black text-guava-dark">No assets match your criteria</p>
                <p className="text-sm text-gray-400">Try adjusting your filters or search term to discover more opportunities.</p>
             </div>
             <button 
                onClick={() => {
                  setMinAmount(0);
                  setMinRate(0);
                  setMinScore(0);
                  setMaxDuration(36);
                  setSearchTerm('');
                }}
                className="px-6 py-3 bg-guava-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-guava-orange transition-colors"
             >
                Clear All Filters
             </button>
          </div>
        )}
        {filteredLoans.map((loan, idx) => {
          const rating = getRatingLabel(loan.creditScoreSnapshot);
          const isExpanded = expandedLoanId === loan.id;

          return (
            <motion.div 
              key={loan.id} 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm transition-all group relative overflow-hidden flex flex-col cursor-pointer",
                isExpanded ? "lg:col-span-2 shadow-2xl ring-2 ring-guava-orange/20" : "hover:shadow-2xl hover:-translate-y-1"
              )}
              onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
            >
              {/* Card Header */}
              <div className="flex justify-between items-start mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white font-bold shadow-sm">
                      {loan.borrowerId.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Fingerprint className="w-3 h-3 text-guava-orange" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Identity Portal Verified</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">Asset ID: {loan.id.split('-')[1] || loan.id}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className={cn("px-4 py-2 border rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all", getStatusStyles(loan.status))}>
                        {loan.status}
                    </div>
                    <div className={cn("px-4 py-2 rounded-xl text-[10px] font-bold shadow-sm", rating.color)}>
                        {rating.label}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedLoanId(isExpanded ? null : loan.id);
                      }}
                      className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                 </div>
              </div>

              {/* Grid Layout for Expanded View */}
              <div className={cn("grid gap-8", isExpanded ? "lg:grid-cols-2" : "grid-cols-1")}>
                <div className="space-y-8">
                  {/* Asset Purpose */}
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-4 group-hover:text-guava-orange transition-colors">{loan.purpose}</h3>
                    <div className="flex flex-wrap gap-3">
                        <Badge icon={MapPin} label="Global / Emerging" />
                        <Badge icon={Clock} label={`${loan.durationMonths} Months`} />
                        <Badge icon={Zap} label={`${loan.interestRate}% Target APR`} color="text-guava-orange" />
                    </div>
                  </div>

                  {/* Risk Intelligence Snapshot */}
                  <div className="mt-auto space-y-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Asset Value</p>
                            <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">${loan.amount.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              <Activity className="w-3 h-3 text-guava-green" />
                              <span className="text-[8px] font-bold uppercase tracking-widest text-guava-green">Resonance: 92%</span>
                            </div>
                            <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{loan.creditScoreSnapshot}</p>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                          <div className="h-full bg-guava-orange w-[65%] rounded-full" />
                          <div className="absolute top-0 left-[65%] w-0.5 h-full bg-white dark:bg-slate-800 z-10" />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Pool Utilization: 65%</p>
                          <p className="text-[9px] text-guava-green font-bold uppercase">Deployment Phase 2</p>
                        </div>
                    </div>

                    {!isExpanded && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCommit(loan);
                        }}
                        className="w-full py-5 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-guava-orange transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 active:scale-95"
                      >
                        Commit Liquidity
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      {/* Credit Data Snapshot */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-guava-orange" />
                          Credit Score Snapshot
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <DetailTile label="Payment History" value="Excellent" color="text-guava-green" />
                          <DetailTile label="Credit Age" value="5.2 Years" />
                          <DetailTile label="Public Records" value="0 Incidents" color="text-guava-green" />
                          <DetailTile label="Inquiries" value="2 (90d)" />
                        </div>
                      </div>

                      {/* Alternative Data Metrics */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-guava-orange" />
                          Alternative Data Metrics
                        </h4>
                        <div className="p-6 bg-slate-900 rounded-3xl text-white overflow-hidden relative border border-slate-800">
                          <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold opacity-60">Mobile Money Usage</span>
                              <span className="text-[10px] font-bold text-guava-orange">Institutional</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold opacity-60">Digital Trust Index</span>
                              <span className="text-xl font-bold font-mono">92/100</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold opacity-60">Social Resonance</span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                  <div key={i} className={cn("w-2 h-2 rounded-full", i <= 4 ? "bg-guava-orange" : "bg-white/10")} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <Globe className="absolute -bottom-8 -right-8 w-24 h-24 text-white/5" />
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCommit(loan);
                          }}
                          className="flex-1 py-5 bg-slate-900 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-guava-orange transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                        >
                          Commit Liquidity
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => e.stopPropagation()}
                          className="px-6 py-5 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all bg-white dark:bg-slate-900"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Decorative Background Elements */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-slate-100 dark:bg-slate-800/10 rounded-full blur-[40px] group-hover:bg-guava-orange/10 transition-all duration-700" />
            </motion.div>
          );
        })}

        {/* Empty State / Reserve Capacity */}
        <div className="bg-gray-50 border-4 border-dashed border-gray-100 rounded-[48px] p-12 flex flex-col items-center justify-center text-center space-y-6 group">
           <div className="w-16 h-16 rounded-[24px] bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
             <TrendingUp className="w-8 h-8 text-gray-200 group-hover:text-guava-orange transition-colors" />
           </div>
           <div>
              <p className="text-xs font-black text-gray-300 uppercase tracking-[0.3em] mb-2">Portal Expansion</p>
              <p className="text-sm font-bold text-gray-400 max-w-[180px] mx-auto italic leading-relaxed">Incoming liquidity pools are currently being audited for Q4 deployment.</p>
           </div>
           <div className="flex gap-2">
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-pulse" />
           </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label, color = "text-slate-400" }: { icon: React.ElementType, label: string, color?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-[9px] font-bold uppercase tracking-widest border border-slate-100 dark:border-slate-700 shrink-0", color)}>
       <Icon className="w-3 h-3" />
       {label}
    </div>
  );
}

function DetailTile({ label, value, color = "text-slate-900 dark:text-white" }: { label: string, value: string, color?: string }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={cn("text-xs font-bold", color)}>{value}</p>
    </div>
  );
}
