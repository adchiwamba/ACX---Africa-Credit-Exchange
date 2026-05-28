import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, UserRole, LoanStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import LendingOrderModal from '../components/LendingOrderModal';
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
  Building2
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

  // State to track live count feeds
  const [globalCounts, setGlobalCounts] = useState({
    applied: 1420,
    approved: 1185,
    rejected: 235
  });

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
          const totalBorrowed = loans.filter(l => l.status === LoanStatus.FUNDED).reduce((sum, l) => sum + l.amount, 0);
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Terminal Overview</h2>
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
            className="px-6 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-white dark:hover:bg-slate-800 transition-all uppercase tracking-widest text-slate-700 dark:text-slate-300"
          >
            History
          </button>
          <button 
            onClick={() => isLender ? setIsOrderModalOpen(true) : navigate('/apply')}
            className="px-6 py-2.5 bg-guava-dark text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 uppercase tracking-widest"
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
               <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">Network Pulse & Digital Credit Velocity</h3>
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
                  className="px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
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
