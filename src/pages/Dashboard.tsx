import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, UserRole, LoanStatus, LoanRequest } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import LendingOrderModal from '../components/LendingOrderModal';
import { MOCK_LOANS } from '../lib/store';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  DollarSign,
  Activity,
  Zap,
  Globe,
  Filter,
  ShieldAlert,
  Check,
  X,
  PlusCircle,
  Building2,
  Search,
  Coins,
  Briefcase,
  ArrowRight,
  Lock,
  UserCheck,
  CreditCard
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface DashboardProps {
  user: UserProfile;
}

const INITIAL_CHART_DATA = [
  { name: '08:00', value: 4000 },
  { name: '09:00', value: 3000 },
  { name: '10:00', value: 2000 },
  { name: '11:00', value: 2780 },
  { name: '12:00', value: 1890 },
  { name: '13:00', value: 2390 },
  { name: '14:00', value: 3490 },
];

const RECENT_ACTIVITIES = [
  "New Liquidity Batch: $4.2M NGN/USD",
  "Yield Rebalance: ACX African Bridge v2",
  "Loan Settlement: ACX-4822 (Lagos Hub)",
  "Credit Resonance Upgraded: USER-921",
  "Portal Buffer Incremented: +0.25%",
  "New Market Maker: Pan-African Bank-88"
];

const FINANCIAL_INSTRUMENTS = [
  { id: 'inst_1', name: 'SWIFT Settlement Bridge Node', category: 'Settlement Gateway', apr: 8.5, volume24h: 3420000, market: 'Pan-African Direct', risk: 'Low', provider: 'SWIFT Alliance', status: 'ACTIVE' },
  { id: 'inst_2', name: 'Stripe Institutional Pool Payouts', category: 'Yield Pool', apr: 9.2, volume24h: 5800000, market: 'Global Settlement Proxy', risk: 'Medium-Low', provider: 'Stripe Connect', status: 'ACTIVE' },
  { id: 'inst_3', name: 'MTN Mobile Money Cleared Liquidity', category: 'Micro-Finance Pool', apr: 11.0, volume24h: 1250000, market: 'East & West Africa', risk: 'Medium', provider: 'MTN MoMo API', status: 'ACTIVE' },
  { id: 'inst_4', name: 'Safaricom M-Pesa Daraja Liquidity Node', category: 'BNPL Pool', apr: 10.5, volume24h: 2100000, market: 'East Africa Retail', risk: 'Low', provider: 'Safaricom Portal', status: 'ACTIVE' },
  { id: 'inst_5', name: 'Alpha Capital High-Yield Syndicate', category: 'Securitized Debt Pool', apr: 12.0, volume24h: 940000, market: 'SME Over-vetted', risk: 'Medium-High', provider: 'Alpha Capital Node', status: 'ACTIVE' },
  { id: 'inst_6', name: 'West Africa Micro-Retail Ledger', category: 'Direct Retail Pool', apr: 14.5, volume24h: 620000, market: 'ECOWAS Regional', risk: 'High', provider: 'Local Node JV', status: 'ACTIVE' },
];

import { firestoreService } from '../services/firestoreService';

export default function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [liveChartData, setLiveChartData] = useState(INITIAL_CHART_DATA);
  const [liveStats, setLiveStats] = useState({
    invested: 0,
    apr: 8.42,
    borrowed: 0,
    score: user.creditScore,
    activeLoans: 0
  });

  // Search and query terminal states
  const [dbLoans, setDbLoans] = useState<LoanRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<'all' | 'loans' | 'instruments'>('all');
  const [simulatedPoolCommit, setSimulatedPoolCommit] = useState<string | null>(null);
  const [customFeedbackMsg, setCustomFeedbackMsg] = useState<{ type: 'success' | 'info'; title: string; desc: string } | null>(null);

  // State to track live count feeds
  const [globalCounts, setGlobalCounts] = useState({
    applied: 1420,
    approved: 1185,
    rejected: 235
  });

  const [myBorrowerLoans, setMyBorrowerLoans] = useState<LoanRequest[]>([]);

  // State to track live visual credit events
  const [liveEvents, setLiveEvents] = useState<{ id: string; text: string; timestamp: string }[]>([
    { id: 'initial-1', text: "Consumer J. Mubaiwa registered & matching credit score: 720 AAA", timestamp: new Date(Date.now() - 300000).toLocaleTimeString() },
    { id: 'initial-2', text: "Direct Digital Credit Line originated for $420 at OK Zimbabwe Retail Node", timestamp: new Date(Date.now() - 240000).toLocaleTimeString() },
    { id: 'initial-3', text: "SME Working Capital application for $5,000 APPROVED", timestamp: new Date(Date.now() - 180000).toLocaleTimeString() },
    { id: 'initial-4', text: "Alternative POS data verified: Customer scoring optimal", timestamp: new Date(Date.now() - 120000).toLocaleTimeString() },
    { id: 'initial-5', text: "Yield distribution trigger: Alpha Capital Pool balanced", timestamp: new Date(Date.now() - 60000).toLocaleTimeString() },
    { id: 'initial-6', text: "Invoice discounting ticket originated: $1,800 Nairobi Hub", timestamp: new Date().toLocaleTimeString() }
  ]);

  const isLender = [UserRole.LENDER, UserRole.INVESTOR, UserRole.BANK].includes(user.role);
  const isDefaulterDemo = user.role === UserRole.BORROWER && user.creditScore < 600 && liveStats.borrowed > 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allLoans = await firestoreService.getLoans();
        const mergedLoans = allLoans.length > 0 ? allLoans : MOCK_LOANS;
        setDbLoans(mergedLoans);

        const dbApplied = allLoans.length;
        const dbApproved = allLoans.filter(l => [LoanStatus.APPROVED, LoanStatus.FUNDED, LoanStatus.COMPLETED].includes(l.status)).length;
        const dbRejected = allLoans.filter(l => l.status === LoanStatus.REJECTED).length;

        setGlobalCounts({
          applied: 1420 + dbApplied,
          approved: 1185 + dbApproved,
          rejected: 235 + dbRejected
        });

        if (isLender) {
          const investments = await firestoreService.getInvestments(user.uid);
          const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
          const activeLoans = allLoans.filter(l => l.status === LoanStatus.FUNDED).length;
          
          setLiveStats(prev => ({
            ...prev,
            invested: totalInvested,
            activeLoans: activeLoans
          }));
        } else {
          const loans = await firestoreService.getMyLoans(user.uid);
          setMyBorrowerLoans(loans);
          const totalBorrowed = loans.filter(l => [LoanStatus.FUNDED, LoanStatus.DELINQUENT].includes(l.status)).reduce((sum, l) => sum + l.amount, 0);
          setLiveStats(prev => ({
            ...prev,
            borrowed: totalBorrowed
          }));
        }
      } catch (error) {
        console.error("Dashboard data fetch failed:", error);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      // Rotate ticker
      setTickerIndex((prev) => (prev + 1) % RECENT_ACTIVITIES.length);

      // Fluctuate counts slightly sometimes to show a live stream heartbeat
      if (Math.random() > 0.6) {
        setGlobalCounts(prev => {
          const isApproval = Math.random() > 0.45;
          return {
            applied: prev.applied + 1,
            approved: prev.approved + (isApproval ? 1 : 0),
            rejected: prev.rejected + (isApproval ? 0 : 1)
          };
        });

        // Add a live event dynamically
        const clientNames = ["A. Ncube", "M. Kiptoo", "K. Mensah", "F. Diallo", "S. Touré", "N. Mwangi", "T. Chida", "E. Baloyi"];
        const purposes = ["Device Fin (Samsung A35)", "Agricultural Fertilizer", "POS Retail BNPL Ticket", "Solar lantern unit", "Store inventory stock", "Pharmacy Supplies"];
        const randomClient = clientNames[Math.floor(Math.random() * clientNames.length)];
        const randomPurpose = purposes[Math.floor(Math.random() * purposes.length)];
        const amount = Math.floor(Math.random() * 800) + 100;
        
        const actions = [
          `New Application: Consumer ${randomClient} requested flat digital credit of $${amount} for ${randomPurpose}`,
          `Verification Sync: Consumer ${randomClient} phone metadata scored optimally`,
          `Digital Credit Match: Retail credit agreement approved for ${randomClient} for $${amount}`,
          `Repayment Reconciled: Digital wallet received transaction settlement of $${Math.floor(amount / 4)}`
        ];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        const newEventObj = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          text: randomAction,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setLiveEvents(prev => [newEventObj, ...prev.slice(0, 5)]);
      }

      // Fluctuate APR and Score slightly for UI feel
      setLiveStats(prev => ({
        ...prev,
        apr: +(prev.apr + (Math.random() > 0.5 ? 0.01 : -0.01) * Math.random()).toFixed(2),
        score: Math.min(850, Math.max(300, prev.score + (Math.random() > 0.5 ? 1 : -1)))
      }));

      // Update chart with a new point
      setLiveChartData(prev => {
        const last = prev[prev.length - 1];
        const newTime = new Date();
        const timeStr = `${newTime.getHours()}:${newTime.getMinutes().toString().padStart(2, '0')}`;
        const newValue = Math.max(1000, Math.min(5000, last.value + (Math.random() > 0.5 ? 1 : -1) * 200));
        return [...prev.slice(1), { name: timeStr, value: newValue }];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [user.uid, user.role, isLender, user.balance]);
  
  const stats = isLender ? [
    { label: 'Total Invested', value: `$${liveStats.invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: liveStats.invested > 0 ? '+12.5%' : '+0%', trending: 'up', icon: DollarSign, sublabel: 'Alpha Capital Node' },
    { label: 'Yield APR', value: `${liveStats.apr}%`, change: liveStats.invested > 0 ? '+0.2%' : '+0%', trending: 'up', icon: TrendingUp, sublabel: 'Portal Avg: 8.1%' },
    { label: 'Active Loans', value: liveStats.activeLoans.toString(), change: liveStats.activeLoans > 0 ? '+2' : '+0', trending: 'up', icon: Activity, sublabel: '98.5% On-time' },
    { label: 'Market Pulse', value: 'Optimal', icon: Clock, sublabel: 'Auto-Match ACTIVE' },
  ] : [
    { label: 'Borrowed', value: `$${liveStats.borrowed.toLocaleString()}`, icon: DollarSign },
    { label: 'Current APR', value: '8.5%', icon: TrendingUp },
    { label: 'Next Payment', value: liveStats.borrowed > 0 ? '$2,000' : '$0', date: liveStats.borrowed > 0 ? 'May 12, 2026' : '--', icon: Clock },
    { label: 'Resonance Score', value: liveStats.score.toString(), icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {isDefaulterDemo && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-guava-orange border-2 border-guava-orange p-8 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-guava-orange/10 rounded-full flex items-center justify-center animate-pulse">
                <ShieldAlert className="w-8 h-8 text-guava-orange" />
             </div>
              <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-guava-orange px-2 py-0.5 bg-guava-orange/10 rounded">Portal Alert: Final Demand</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Issued 2 hours ago</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Repayment Overdue: Action Required</h3>
                  <p className="text-sm text-white/60 font-medium max-w-xl">
                    Your capital resonance score has dropped to critical levels. 
                    Failure to settle arrears within 48 hours will result in automatic collateral liquidation and permanent portal blacklisting.
                  </p>
              </div>
          </div>
          <button 
            onClick={() => navigate('/repayments')}
            className="px-8 py-4 bg-guava-orange text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-guava-orange/20 whitespace-nowrap"
          >
             Initiate Emergency Settlement
          </button>
        </motion.div>
      )}

      {/* Real-time Ticker */}
      <div className="bg-guava-orange py-3 px-6 -mx-4 md:-mx-8 lg:-mx-10 overflow-hidden relative border-y border-white/5 transition-colors">
          <div className="max-w-[1600px] mx-auto flex items-center gap-8">
            <div className="flex items-center gap-2 shrink-0 border-r border-white/10 pr-8">
               <Globe className="w-4 h-4 text-guava-orange animate-spin-slow" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Live Feed</span>
            </div>
            
            <AnimatePresence mode="wait">
               <motion.div 
                 key={tickerIndex}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="flex items-center gap-4 text-[10px] font-semibold text-white/70 tracking-widest uppercase"
               >
                  <Zap className="w-3 h-3 text-guava-orange" />
                  {RECENT_ACTIVITIES[tickerIndex]}
               </motion.div>
            </AnimatePresence>
            
            <div className="ml-auto flex items-center gap-6">
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-guava-green rounded-full animate-pulse" />
                  <span className="text-[8px] font-bold uppercase text-guava-green">Portal v2.1 Online</span>
               </div>
               <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[8px] font-bold uppercase opacity-30 text-white">Gas: 12 Gwei</span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Terminal Overview</h2>
          <div className="flex items-center gap-2 mt-1">
             <Activity className="w-3 h-3 text-guava-orange" />
             <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">
               Deep Sync Active • {user.borrowerDetails?.profile?.businessName || user.displayName}
             </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/portfolio')}
            className="px-6 py-2.5 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:border-guava-orange dark:hover:border-guava-orange/60 transition-all cursor-pointer"
          >
            History
          </button>
          <button 
            onClick={() => isLender ? setIsOrderModalOpen(true) : navigate('/apply')}
            className="px-6 py-2.5 bg-guava-orange text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-guava-orange/20 cursor-pointer"
          >
            {isLender ? 'New Loan Order' : 'Create Order'}
          </button>
        </div>
      </div>

      <LendingOrderModal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)} 
        user={user} 
      />

      {/* 🌟 RE-DESIGNED CONSUMER LOAN ACQUISITION PROGRESSIVE PATHWAY */}
      {!isLender && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 rounded-[32px] p-8 text-white border border-slate-800 shadow-2xl relative overflow-hidden my-4 transition-all">
          <div className="absolute top-0 right-0 w-80 h-80 bg-guava-orange/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-guava-green/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="px-2 py-0.5 bg-guava-orange/20 border border-guava-orange/30 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-guava-orange rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-guava-orange">Core Borrower Lifecycle</span>
                  </div>
                </div>
                <h3 className="text-2xl font-black tracking-tight uppercase">Your Digital Credit Corridor Roadmap</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl font-medium">
                  Track your progress step-by-step from initial identity registry to alternative AI credit profiling, funding, and micro-payment builds.
                </p>
              </div>
              
              {/* Global Progress Indicator */}
              <div className="flex items-center gap-4 bg-slate-900/60 border border-white/5 px-6 py-3 rounded-2xl shrink-0 self-start md:self-auto">
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Overall Journey Completion</p>
                  <p className="text-lg font-black font-mono mt-0.5 text-guava-orange">
                    {(() => {
                      let completed = 0;
                      if (user.kycStatus === 'VERIFIED') completed++;
                      if (user.borrowerDetails?.scoreResult) completed++;
                      if (myBorrowerLoans.length > 0) completed++;
                      if (myBorrowerLoans.some(l => [LoanStatus.FUNDED, LoanStatus.DELINQUENT, LoanStatus.COMPLETED].includes(l.status))) completed++;
                      return `${Math.round((completed / 4) * 100)}%`;
                    })()}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center p-1">
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                    {(() => {
                      let completed = 0;
                      if (user.kycStatus === 'VERIFIED') completed++;
                      if (user.borrowerDetails?.scoreResult) completed++;
                      if (myBorrowerLoans.length > 0) completed++;
                      if (myBorrowerLoans.some(l => [LoanStatus.FUNDED, LoanStatus.DELINQUENT, LoanStatus.COMPLETED].includes(l.status))) completed++;
                      return `${completed}/4`;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Steps Container */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              {/* Connectors for desktop */}
              <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-[2px] bg-white/5 z-0" />
              
              {/* STEP 1: IDENTITY REGISTRY */}
              {(() => {
                const isCompleted = user.kycStatus === 'VERIFIED';
                const isRejected = user.kycStatus === 'REJECTED';
                return (
                  <div className="bg-slate-900/50 border border-white/5 hover:border-white/10 p-5 rounded-2xl flex flex-col justify-between min-h-[220px] transition-all group relative z-10 select-none">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCompleted ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-white/5 text-slate-400 border border-white/5"
                        }`}>
                          {isCompleted ? <UserCheck className="w-5 h-5" /> : "01"}
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          isCompleted ? "bg-green-500/10 text-green-400" :
                          isRejected ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {user.kycStatus}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold tracking-tight text-white mb-1.5">Profile Identity Onboarding</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        {isCompleted 
                          ? "Your core profile setup, official credentials, and location bounds are verified." 
                          : "Configure your official bio-registry data and pin your business coordinates."}
                      </p>
                    </div>
                    
                    {!isCompleted && (
                      <button 
                        onClick={() => navigate('/profile')}
                        className="mt-4 w-full py-2 bg-guava-orange hover:bg-guava-orange/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-1"
                      >
                        Complete KYC Verify
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {isCompleted && (
                      <div className="mt-4 w-full py-2 bg-green-500/10 text-green-400 rounded-lg text-[9px] font-bold uppercase text-center border border-green-500/10 flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Core Profile Secured
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* STEP 2: CREDIT SCORING RUN */}
              {(() => {
                const isKycCompleted = user.kycStatus === 'VERIFIED';
                const scoreResult = user.borrowerDetails?.scoreResult;
                const score = user.creditScore || (scoreResult ? scoreResult.score : null);
                const rating = scoreResult ? scoreResult.ratingCategory : (score ? (score > 720 ? 'AAA' : score > 680 ? 'AA' : 'A') : null);
                const isCompleted = !!scoreResult || !!score;
                return (
                  <div className={`bg-slate-900/50 border p-5 rounded-2xl flex flex-col justify-between min-h-[220px] transition-all group relative z-10 select-none ${
                    isCompleted && isKycCompleted ? "border-white/5 hover:border-white/10" : "border-white/5 opacity-60"
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCompleted ? "bg-guava-orange/20 text-guava-orange border border-guava-orange/20" : "bg-white/5 text-slate-400 border border-white/15"
                        }`}>
                          {isCompleted ? <TrendingUp className="w-5 h-5" /> : "02"}
                        </div>
                        {isCompleted ? (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-guava-orange/15 text-guava-orange">
                            SC: {score} ({rating})
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-500">
                            UNRATED
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold tracking-tight text-white mb-1.5">Alternative Data Scoring</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        {isCompleted 
                          ? "Gemini AI has assessed your phone and metadata indexes for alternative risk categorization." 
                          : "Calculate your sovereign credit rating to unlock larger liquidity channels."}
                      </p>
                    </div>

                    {!isCompleted ? (
                      <button 
                        onClick={() => navigate('/profile')}
                        disabled={!isKycCompleted}
                        className={`mt-4 w-full py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 ${
                          isKycCompleted 
                            ? "bg-white/10 hover:bg-white/15 text-white hover:scale-[1.02]" 
                            : "bg-white/5 text-slate-500 pointer-events-none"
                        }`}
                      >
                        {!isKycCompleted ? <Lock className="w-3 h-3 text-slate-600 mb-0.5 inline" /> : null}
                        Evaluate alternative
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <div className="mt-4 w-full py-2 bg-guava-orange/15 text-guava-orange border border-guava-orange/20 rounded-lg text-[9px] font-bold uppercase text-center flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Model Evaluated: {score}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* STEP 3: APPLICATION FOR CREDIT */}
              {(() => {
                const isPreStepCompleted = !!user.borrowerDetails?.scoreResult || user.creditScore > 0;
                const hasApplied = myBorrowerLoans.length > 0;
                const latestLoan = hasApplied ? myBorrowerLoans[0] : null;
                const status = latestLoan ? latestLoan.status : 'PENDING APPLICATION';
                const isCompleted = hasApplied;
                return (
                  <div className={`bg-slate-900/50 border p-5 rounded-2xl flex flex-col justify-between min-h-[220px] transition-all group relative z-10 select-none ${
                    isCompleted && isPreStepCompleted ? "border-white/5 hover:border-white/10" : "border-white/5 opacity-60"
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCompleted ? "bg-guava-orange/20 text-guava-orange border border-guava-orange/20" : "bg-white/5 text-slate-400 border border-white/5"
                        }`}>
                          {isCompleted ? <Coins className="w-5 h-5" /> : "03"}
                        </div>
                        {hasApplied ? (
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                            status === LoanStatus.FUNDED ? "bg-green-500/10 text-green-400" :
                            status === LoanStatus.APPROVED ? "bg-blue-500/10 text-blue-400" :
                            status === LoanStatus.REJECTED ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {status}
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-500">
                            Empty
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold tracking-tight text-white mb-1.5">Secure Credit Facility</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        {hasApplied 
                          ? `Application for $${latestLoan?.amount.toLocaleString()} is currently on status: ${status}.` 
                          : "Establish your borrowing size and terms, then dispatch your asset demand to smart-pools."}
                      </p>
                    </div>

                    {!hasApplied ? (
                      <button 
                        onClick={() => navigate('/apply')}
                        disabled={!isPreStepCompleted}
                        className={`mt-4 w-full py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg cursor-pointer flex items-center justify-center gap-1 ${
                          isPreStepCompleted 
                            ? "bg-white/10 hover:bg-white/15 text-white hover:scale-[1.02]" 
                            : "bg-white/5 text-slate-500 pointer-events-none"
                        }`}
                      >
                        {!isPreStepCompleted ? <Lock className="w-3 h-3 text-slate-600 mb-0.5 inline" /> : null}
                        Apply For Credit
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <div className="mt-4 w-full py-2 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-[9px] font-bold uppercase text-center flex items-center justify-center gap-1 hover:bg-white/15 cursor-pointer animate-pulse" onClick={() => navigate('/portfolio')}>
                        View Application Status
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* STEP 4: TRACK SUB-PAYMENTS */}
              {(() => {
                const hasFundedLoan = myBorrowerLoans.some(l => [LoanStatus.FUNDED, LoanStatus.DELINQUENT, LoanStatus.COMPLETED].includes(l.status));
                const activeLoans = myBorrowerLoans.filter(l => [LoanStatus.FUNDED, LoanStatus.DELINQUENT].includes(l.status));
                const isCompleted = hasFundedLoan;
                return (
                  <div className={`bg-slate-900/50 border p-5 rounded-2xl flex flex-col justify-between min-h-[220px] transition-all group relative z-10 select-none ${
                    isCompleted ? "border-white/5 hover:border-white/10" : "border-white/5 opacity-60"
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCompleted ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-white/5 text-slate-400 border border-white/5"
                        }`}>
                          {isCompleted ? <CreditCard className="w-5 h-5" /> : "04"}
                        </div>
                        {isCompleted ? (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-green-500/10 text-green-400">
                            Active Calendar
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-500">
                            Locked
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold tracking-tight text-white mb-1.5">Amortization & Tracking</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                        {isCompleted 
                          ? `You have ${activeLoans.length} active funded loan lines. Make swift installments to build score.` 
                          : "Structured repayment calendars, maturity trackers, and scoring boosts activate here."}
                      </p>
                    </div>

                    {isCompleted ? (
                      <button 
                        onClick={() => navigate('/repayments')}
                        className="mt-4 w-full py-2 bg-guava-green hover:bg-guava-green/90 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-1"
                      >
                        Repayments Hub
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <div className="mt-4 w-full py-2 bg-white/5 text-slate-500 rounded-lg text-[9px] font-bold uppercase text-center border border-white/5 flex items-center justify-center gap-1 select-none">
                        <Lock className="w-3 h-3" /> Awaiting disbursement
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 INTEGRATED SEARCH & INSTRUMENT TERMINAL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[32px] shadow-sm relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-36 h-36 bg-guava-orange/5 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 bg-guava-orange rounded-full animate-ping" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-guava-orange">Unified Port Node Query</span>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Search Loan Applications & Instruments</h3>
            <p className="text-xs text-slate-400 font-medium">Quickly query cross-border micro-credit ledger entries and yield liquidity tools across 52 African markets.</p>
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-slate-500 font-mono">
              Ledger: {dbLoans.length} entries
            </span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-bold text-slate-500 font-mono">
              Instruments: {FINANCIAL_INSTRUMENTS.length} active
            </span>
          </div>
        </div>

        {/* Search Input Controller */}
        <div className="relative group mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-guava-orange transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCustomFeedbackMsg(null); // Clear feedback on search change
            }}
            placeholder="Type pool name, loan ID, country (e.g. Kenya, Nigeria), purpose, rate or risk metrics..."
            className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm focus:border-guava-orange focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-guava-orange/15 outline-none transition-all placeholder:text-slate-400 dark:text-white font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery('');
                setCustomFeedbackMsg(null);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggested Quick Search Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested:</span>
          {[
            { tag: "Lagos Tech", query: "Lagos Tech" },
            { tag: "SWIFT Gateway", query: "SWIFT" },
            { tag: "Micro-Retail", query: "Retail" },
            { tag: "Kenya", query: "Kenya" },
            { tag: "Stripe Pool", query: "Stripe" },
            { tag: "SME", query: "SME" },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => {
                setSearchQuery(item.query);
                setCustomFeedbackMsg(null);
              }}
              className="px-3 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-guava-orange/10 hover:text-guava-orange text-slate-500 rounded-lg text-xs font-medium border border-slate-200/50 dark:border-slate-800 hover:border-guava-orange/30 transition-all cursor-pointer"
            >
              {item.tag}
            </button>
          ))}
        </div>

        {/* Simulated Successful Commitment Toast Notification inside the component */}
        <AnimatePresence>
          {customFeedbackMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-between"
            >
              <div className="flex gap-3 items-center">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider">{customFeedbackMsg.title}</h5>
                  <p className="text-[11px] opacity-80 mt-0.5">{customFeedbackMsg.desc}</p>
                </div>
              </div>
              <button 
                onClick={() => setCustomFeedbackMsg(null)}
                className="text-xs uppercase font-black hover:opacity-80"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Tab buttons */}
        {searchQuery && (
          <div className="flex border-b border-slate-100 dark:border-slate-800 mb-6 gap-6">
            {[
              { id: 'all', label: 'All Matches' },
              { id: 'loans', label: `Loan Applications (${dbLoans.filter(l => (l.purpose || "").toLowerCase().includes(searchQuery.toLowerCase()) || (l.id || "").toLowerCase().includes(searchQuery.toLowerCase())).length})` },
              { id: 'instruments', label: `Market Instruments (${FINANCIAL_INSTRUMENTS.filter(i => (i.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (i.category || "").toLowerCase().includes(searchQuery.toLowerCase())).length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSearchTab(tab.id as 'all' | 'loans' | 'instruments')}
                className={`pb-3 text-xs font-black uppercase tracking-widest relative transition-all cursor-pointer ${
                  searchTab === tab.id 
                    ? 'text-guava-orange' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {searchTab === tab.id && (
                  <motion.div 
                    layoutId="activeSearchUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-guava-orange" 
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* If Not query - show Quick Highlight Grid */}
        {!searchQuery && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Preview active credits */}
            <div className="p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Featured Loan Ledger (Real-time)</h4>
                <span className="text-[9px] px-2 py-0.5 bg-guava-orange/10 text-guava-orange font-bold uppercase rounded">Top Rated</span>
              </div>
              <div className="space-y-3">
                {dbLoans.slice(0, 2).map((loan) => (
                  <div key={loan.id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/40 last:border-0">
                    <div>
                      <p className="text-xs font-bold dark:text-white">{loan.purpose}</p>
                      <span className="text-[9px] font-mono opacity-55 uppercase tracking-wide">{loan.id} • {loan.durationMonths}m @ {loan.interestRate}% APR</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold dark:text-white">${loan.amount.toLocaleString()}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        loan.status === LoanStatus.APPROVED ? 'bg-blue-500/10 text-blue-500' :
                        loan.status === LoanStatus.FUNDED ? 'bg-guava-green/10 text-guava-green' : 'bg-slate-500/10 text-slate-500'
                      }`}>{loan.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Preview stable pools */}
            <div className="p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Guaranteed Liquidity Instruments</h4>
                <p className="text-[9px] font-bold text-guava-green uppercase flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> SECURED
                </p>
              </div>
              <div className="space-y-3">
                {FINANCIAL_INSTRUMENTS.slice(0, 2).map((inst) => (
                  <div key={inst.id} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/40 last:border-0">
                    <div>
                      <p className="text-xs font-bold dark:text-white">{inst.name}</p>
                      <span className="text-[9px] font-mono opacity-55 uppercase tracking-wide">{inst.category} • {inst.market}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-guava-green font-mono">{inst.apr}% APR</p>
                      <span className="text-[8px] opacity-40 font-mono">Vol: ${(inst.volume24h / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results Drawer */}
        {searchQuery && (
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 pb-2">
            
            {/* NO MATCHES FOUND */}
            {dbLoans.filter(l => (l.purpose || "").toLowerCase().includes(searchQuery.toLowerCase()) || (l.id || "").toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && 
             FINANCIAL_INSTRUMENTS.filter(i => (i.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (i.category || "").toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Search className="w-8 h-8 mx-auto stroke-[1.5] mb-2 opacity-50" />
                <p className="text-xs font-bold uppercase tracking-wider">No matching applications or instruments found</p>
                <p className="text-[11px] opacity-75 mt-1">Try refining your search text or use one of the suggestions above.</p>
              </div>
            )}

            {/* LOAN APPLICATIONS SECTION */}
            {(searchTab === 'all' || searchTab === 'loans') && dbLoans.filter(l => (l.purpose || "").toLowerCase().includes(searchQuery.toLowerCase()) || (l.id || "").toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white dark:bg-slate-900 py-1">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matching Credit & Loan Records ({dbLoans.filter(l => (l.purpose || "").toLowerCase().includes(searchQuery.toLowerCase()) || (l.id || "").toLowerCase().includes(searchQuery.toLowerCase())).length})</h4>
                </div>
                {dbLoans.filter(l => (l.purpose || "").toLowerCase().includes(searchQuery.toLowerCase()) || (l.id || "").toLowerCase().includes(searchQuery.toLowerCase())).map((loan) => (
                  <div 
                    key={loan.id} 
                    className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-guava-orange/30 transition-all flex flex-col md:flex-row justify-between md:items-center gap-4 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center font-bold text-[10px] text-guava-orange shrink-0">
                        {loan.id.replace('loan_', '').toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800 dark:text-white">{loan.purpose}</span>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                            loan.status === LoanStatus.APPROVED ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            loan.status === LoanStatus.FUNDED ? 'bg-guava-green/10 text-guava-green' : 'bg-amber-100 text-amber-700 font-bold'
                          }`}>
                            {loan.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          ID: {loan.id} • Credit Res Snapshot: {loan.creditScoreSnapshot || 720} Rating
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                      <div className="text-left md:text-right">
                        <p className="text-sm font-black text-slate-800 dark:text-white">${loan.amount.toLocaleString()} {loan.currency}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{loan.durationMonths} Mo @ {loan.interestRate}% APR</p>
                      </div>

                      {loan.status === LoanStatus.APPROVED && isLender ? (
                        <button
                          onClick={async () => {
                            setSimulatedPoolCommit(loan.id);
                            // Simulate delay of clearing nodes
                            setTimeout(() => {
                              // Fund Loan Request
                              setDbLoans(prev => prev.map(l => l.id === loan.id ? { ...l, status: LoanStatus.FUNDED } : l));
                              setLiveStats(prev => ({
                                ...prev,
                                invested: prev.invested + loan.amount,
                                activeLoans: prev.activeLoans + 1
                              }));
                              setLiveEvents(prev => [
                                {
                                  id: `sim-fund-${Date.now()}`,
                                  text: `[SUCCESS] Direct Liquidity Sweep: committed $${loan.amount.toLocaleString()} into ${loan.purpose} (ACX Node Authorized)`,
                                  timestamp: new Date().toLocaleTimeString()
                                },
                                ...prev.slice(0, 5)
                              ]);
                              setCustomFeedbackMsg({
                                type: 'success',
                                title: 'Clearing Complete',
                                desc: `Sweep finalized! Vested $${loan.amount.toLocaleString()} successfully to ${loan.purpose}.`
                              });
                              setSimulatedPoolCommit(null);
                            }, 1200);
                          }}
                          disabled={simulatedPoolCommit !== null}
                          className="px-4 py-2 bg-slate-900 hover:bg-guava-orange text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shrink-0"
                        >
                          {simulatedPoolCommit === loan.id ? (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              SWEPT...
                            </span>
                          ) : 'Automate Funding'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            navigate('/portfolio');
                          }}
                          className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-900 group-hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FINANCIAL INSTRUMENTS SECTION */}
            {(searchTab === 'all' || searchTab === 'instruments') && FINANCIAL_INSTRUMENTS.filter(i => (i.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (i.category || "").toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white dark:bg-slate-900 py-1">
                  <Coins className="w-4 h-4 text-slate-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matching Cleared Instruments & Pools ({FINANCIAL_INSTRUMENTS.filter(i => (i.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (i.category || "").toLowerCase().includes(searchQuery.toLowerCase())).length})</h4>
                </div>
                {FINANCIAL_INSTRUMENTS.filter(i => (i.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (i.category || "").toLowerCase().includes(searchQuery.toLowerCase())).map((inst) => {
                  const InstIcon = inst.id === 'inst_1' ? Globe : inst.id === 'inst_2' ? Zap : inst.id === 'inst_3' ? Activity : Coins;
                  return (
                    <div 
                      key={inst.id} 
                      className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-guava-orange/30 transition-all flex flex-col md:flex-row justify-between md:items-center gap-4 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-guava-orange shrink-0">
                          <InstIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-white">{inst.name}</span>
                            <span className="text-[8px] font-bold text-guava-green tracking-widest uppercase border border-guava-green/20 bg-guava-green/5 px-2 py-0.5 rounded">
                              {inst.risk} Risk
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">
                            Type: {inst.category} • Provider: {inst.provider} • Area: {inst.market}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                        <div className="text-left md:text-right">
                          <p className="text-sm font-black text-guava-green font-mono">{inst.apr}% APR Yield</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">24h Vol: ${(inst.volume24h / 1000000).toFixed(2)}M</p>
                        </div>

                        <button
                          onClick={() => {
                            setSimulatedPoolCommit(inst.id);
                            setTimeout(() => {
                              setLiveEvents(prev => [
                                {
                                  id: `sim-inst-${Date.now()}`,
                                  text: `[ROUTING] Connected to ${inst.name} (${inst.category}) with cleared parameters under SLA rule`,
                                  timestamp: new Date().toLocaleTimeString()
                                },
                                ...prev.slice(0, 5)
                              ]);
                              setCustomFeedbackMsg({
                                type: 'success',
                                title: 'Clearing corridor active',
                                desc: `Parameters successfully integrated for ${inst.name} (API link secured).`
                              });
                              setSimulatedPoolCommit(null);
                            }, 1000);
                          }}
                          disabled={simulatedPoolCommit !== null}
                          className="px-4 py-2 bg-slate-900 hover:bg-guava-orange hover:text-white text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shrink-0"
                        >
                          {simulatedPoolCommit === inst.id ? (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ROUTING...
                            </span>
                          ) : 'Authorize direct placement'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="flex justify-between items-center mb-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-guava-orange group-hover:text-white transition-all duration-300">
                <stat.icon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-white" />
              </div>
              {stat.change && (
                <span className="text-[10px] font-bold px-2 py-1 bg-green-50 dark:bg-green-500/10 text-guava-green rounded-full border border-green-100 dark:border-green-500/20">
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1 relative z-10">{stat.label}</p>
            <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white relative z-10">{stat.value}</p>
            
            {stat.sublabel && (
              <p className="text-[9px] font-medium text-slate-400 mt-2 relative z-10 uppercase tracking-tight">
                {stat.sublabel}
              </p>
            )}
            
            {/* Visual pulse for live updates */}
            <motion.div 
               animate={{ opacity: [0, 0.05, 0] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 bg-guava-orange"
            />
          </div>
        ))}
      </div>

      {/* ACX GLOBAL CREDIT VELOCITY HARNESS & LIVE TICKER FEED */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 relative overflow-hidden transition-colors">
         {/* Top Info Row */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-guava-orange rounded-full animate-ping" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-guava-orange">Live Central Credit Ledger</span>
               </div>
               <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Network Pulse & Digital Credit Velocity</h3>
               <p className="text-xs text-slate-400 mt-1 font-medium">Real-time aggregate status of global micro-financing, local consumer BNPL, and enterprise credit lines.</p>
            </div>
            
            {user.role === UserRole.RETAILER && (
               <button 
                 onClick={() => navigate('/merchant-ledger')}
                 className="px-6 py-3 bg-guava-orange text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-guava-dark transition-all flex items-center gap-2 shadow-lg shadow-guava-orange/10"
               >
                  <PlusCircle className="w-4 h-4" />
                  Open POS Merchant Terminal
               </button>
            )}
         </div>

         {/* Three live feed indicators */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Applied Card */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-guava-orange/20 transition-all relative overflow-hidden group">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400">
                     <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">Applied</span>
               </div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Credit Applied</p>
               <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{globalCounts.applied.toLocaleString()}</span>
                  <span className="text-[10px] text-guava-orange font-bold">+Live pings</span>
               </div>
               <div className="w-1.5 h-1.5 bg-guava-orange rounded-full absolute top-6 right-6 animate-pulse" />
            </div>

            {/* Approved Card */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-guava-green/20 transition-all relative overflow-hidden group">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                     <Check className="w-5 h-5" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-green-500 bg-green-500/10 px-2.5 py-1 rounded">Approved</span>
               </div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Lines Approved</p>
               <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{globalCounts.approved.toLocaleString()}</span>
                  <span className="text-[9px] text-green-500 font-bold">{(globalCounts.approved / globalCounts.applied * 100).toFixed(1)}% Ratio</span>
               </div>
               <div className="w-1.5 h-1.5 bg-green-505 rounded-full absolute top-6 right-6 animate-pulse" />
            </div>

            {/* Rejected Card */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-red-500/20 transition-all relative overflow-hidden group">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                     <X className="w-5 h-5" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-red-500 bg-red-500/10 px-2.5 py-1 rounded font-bold">Rejected</span>
               </div>
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Risk Deflections</p>
               <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold font-mono text-slate-900 dark:text-white">{globalCounts.rejected.toLocaleString()}</span>
                  <span className="text-[9px] text-red-500 font-bold">{(globalCounts.rejected / globalCounts.applied * 100).toFixed(1)}% Ratio</span>
               </div>
               <div className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-6 right-6 animate-pulse" />
            </div>
         </div>

         {/* Scrolling Live Credit Heartbeat Feed */}
         <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-2 h-2 bg-guava-orange rounded-full animate-ping" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 font-mono">Ledger Heartbeat Stream (Live Transactions)</span>
            </div>

            <div className="space-y-3 max-h-[180px] overflow-hidden">
               <AnimatePresence initial={false}>
                  {liveEvents.map((evt, idx) => (
                     <motion.div 
                        key={evt.id}
                        initial={{ opacity: 0, x: -10, y: -5 }}
                        animate={{ opacity: 1 - (idx * 0.15), x: 0, y: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0 text-xs text-white/80 font-mono"
                     >
                        <Zap className="w-3.5 h-3.5 text-guava-orange shrink-0 animate-pulse" />
                        <span className="text-[10px] opacity-40 shrink-0">[{evt.timestamp}]</span>
                        <span className="truncate">{evt.text}</span>
                     </motion.div>
                  ))}
               </AnimatePresence>
            </div>
         </div>

         {/* Retailer special BNPL policy guide */}
         {user.role === UserRole.RETAILER && (
            <div className="p-6 bg-guava-orange/5 border border-guava-orange/20 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-guava-orange text-white rounded-xl flex items-center justify-center">
                     <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-guava-dark dark:text-white uppercase tracking-wider">Configure Point of Sale Installments</p>
                     <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Extend digital credit lines directly. Repayments accrue straight into your pool balance with full alternative profiling.</p>
                  </div>
               </div>
               <button 
                  onClick={() => navigate('/merchant-ledger')}
                  className="px-5 py-3 bg-white dark:bg-slate-800 border-2 border-guava-orange/20 hover:border-guava-orange text-guava-orange hover:text-white hover:bg-guava-orange rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm"
               >
                  Launch Client BNPL Setup
               </button>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                 <h3 className="font-bold text-lg tracking-tight uppercase text-slate-900 dark:text-white">Liquidity Velocity</h3>
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-guava-orange/10 rounded-md">
                    <div className="w-1 h-1 bg-guava-orange rounded-full animate-ping" />
                    <span className="text-[8px] font-bold text-guava-orange uppercase tracking-widest">Live Stream</span>
                 </div>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="w-3 h-3 bg-guava-green rounded-full" />
              </div>
            </div>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: '500' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: '#0f172a', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#F39233" 
                    strokeWidth={2}
                    fill="#F39233"
                    fillOpacity={0.05}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {isLender && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="font-bold text-lg tracking-tight uppercase text-slate-900 dark:text-white">Matchmaking Terminal</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Pending Loans meeting your Credit Policy</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                     <Filter className="w-3 h-3 text-guava-orange" />
                     <span className="text-[10px] font-bold uppercase dark:text-white tracking-widest">Score 650+</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'ACX-8821', score: 742, amount: '$12,500', purpose: 'Lagos Tech Hub Exp.', market: 'Nigeria' },
                    { id: 'ACX-7492', score: 685, amount: '$5,000', purpose: 'Agri-Supply Chain', market: 'Kenya' },
                    { id: 'ACX-9301', score: 810, amount: '$25,000', purpose: 'Solar Grid Project', market: 'Ghana' },
                    { id: 'ACX-2291', score: 658, amount: '$3,200', purpose: 'Fintech Micro-Loans', market: 'Ethiopia' }
                  ].map((match) => (
                    <div key={match.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-guava-orange transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-slate-900 dark:bg-slate-700 rounded-xl flex items-center justify-center font-bold text-xs text-white">
                                {match.id.split('-')[1]}
                             </div>
                             <div>
                                <p className="text-sm font-bold dark:text-white">{match.purpose}</p>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase">{match.market}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-bold text-guava-green">SC: {match.score}</p>
                             <p className="text-xs font-bold dark:text-white uppercase mt-0.5">{match.amount}</p>
                          </div>
                       </div>
                       <button className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                          Automate Funding
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl text-white flex flex-col justify-between transition-colors relative overflow-hidden border border-slate-800 shadow-xl">
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-8">
                 <div className="w-2 h-2 bg-guava-orange rounded-full animate-pulse" />
                 <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Intelligence Node</span>
              </div>
              <h4 className="text-2xl font-bold mb-4 leading-tight">Credit is the <br /> currency of trust.</h4>
              <p className="text-sm opacity-50 leading-relaxed mb-8 font-medium">
                Your portfolio diversity index is currently {Math.floor(liveStats.apr * 10)}% above market average. Consider increasing exposure to emerging trade credits.
              </p>
           </div>
           
           <div className="p-4 bg-white/5 rounded-2xl border border-white/10 relative z-10">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Network Risk</span>
                 <span className="text-[10px] font-bold text-guava-green">Low</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full bg-guava-green w-[12%]" />
              </div>
           </div>

           <div className="absolute top-0 right-0 w-32 h-32 bg-guava-orange/20 rounded-full blur-[80px]" />
        </div>
      </div>
    </div>
  );
}
