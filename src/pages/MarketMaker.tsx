import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Settings, 
  Zap, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  Globe, 
  Cpu, 
  Lock,
  TrendingUp,
  Database,
  CheckCircle2,
  PlusCircle
} from 'lucide-react';
import { UserProfile, LoanStatus, LoanRequest } from '../types';
import { firestoreService } from '../services/firestoreService';
import { cn } from '../lib/utils';

interface MarketMakerProps {
  user: UserProfile;
}

const NODES = [
  { id: 'MM-AFR-01', location: 'Lagos, Nigeria', capacity: '$1.2M', utilized: '84%', health: 'Optimal' },
  { id: 'MM-AFR-02', location: 'Nairobi, Kenya', capacity: '$850K', utilized: '62%', health: 'Optimal' },
  { id: 'MM-AFR-03', location: 'Johannesburg, SA', capacity: '$2.1M', utilized: '91%', health: 'High Usage' },
];

export default function MarketMaker({ user }: MarketMakerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'deployment' | 'automatch'>('overview');
  const [loans, setLoans] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoMatchActive, setIsAutoMatchActive] = useState(true);
  const [riskThreshold, setRiskThreshold] = useState(700);

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      try {
        const allLoans = await firestoreService.getLoans();
        setLoans(allLoans.filter(l => l.status === LoanStatus.PENDING || l.status === LoanStatus.APPROVED));
      } catch (error) {
        console.error("MM Data Load Failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketData();
  }, []);

  const stats = [
    { label: 'Total Liquidity', value: `$${user.balance.toLocaleString()}`, change: '+0%', icon: Zap, color: 'text-guava-orange' },
    { label: 'Deployed (24h)', value: `$${loans.filter(l => l.status === LoanStatus.FUNDED).reduce((sum, l) => sum + l.amount, 0).toLocaleString()}`, change: '+0%', icon: BarChart3, color: 'text-blue-500' },
    { label: 'Avg Node Yield', value: '8.5%', change: '+0%', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Active Channels', value: loans.length.toString(), change: '+0%', icon: Activity, color: 'text-purple-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header with Ticker Effect */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-[#0F172A] p-8 rounded-[32px] border border-gray-100 dark:border-white/5 relative overflow-hidden shadow-2xl shadow-black/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-guava-orange/5 blur-[100px] pointer-events-none" />
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-guava-orange/10 text-guava-orange text-[10px] font-black uppercase tracking-widest rounded-full border border-guava-orange/20">
              Institutional Market Maker
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1 h-1 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">ICX Node Manager</h1>
          <p className="text-gray-400 font-mono text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
            <Lock className="w-3 h-3" /> Encrypted Session: {user.uid.slice(0, 8)}...
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Liquidity Status</p>
            <p className="text-xl font-bold font-mono text-guava-dark dark:text-white">STABLE_CONNECTED</p>
          </div>
          <button className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/10">
            <Settings className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white dark:bg-[#1E293B] rounded-[24px] border border-gray-100 dark:border-white/5 hover:border-guava-orange/30 transition-all group shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-xl bg-gray-50 dark:bg-white/5", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                {stat.change}
              </span>
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black font-mono tracking-tighter text-gray-900 dark:text-white group-hover:scale-105 origin-left transition-transform">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Sub Navigation */}
      <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-[#1E293B] rounded-2xl w-fit border border-gray-200 dark:border-white/5">
        {[
          { id: 'overview', label: 'Node Overview', icon: Cpu },
          { id: 'deployment', label: 'Order Book', icon: Database },
          { id: 'automatch', label: 'Auto-Match Engine', icon: ShieldCheck }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'overview' | 'deployment' | 'automatch')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all",
              activeTab === tab.id 
                ? "bg-white dark:bg-[#0F172A] text-guava-orange shadow-sm" 
                : "text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Active Nodes Grid */}
                <div className="bg-white dark:bg-[#0F172A] rounded-[32px] border border-gray-100 dark:border-white/5 p-8 shadow-xl shadow-black/5">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Institutional Network Nodes</h3>
                    <button className="flex items-center gap-2 text-xs font-bold text-guava-orange p-2 hover:bg-guava-orange/5 rounded-xl transition-all">
                      Add Node <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid gap-4">
                    {NODES.map((node, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-gray-50/50 dark:bg-white/5 rounded-[24px] border border-gray-100 dark:border-white/5 group hover:bg-white dark:hover:bg-white/10 transition-all hover:shadow-lg hover:-translate-y-1">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-guava-orange/10 rounded-2xl flex items-center justify-center text-guava-orange">
                            <Globe className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 font-mono">{node.id}</p>
                            <p className="font-bold text-gray-900 dark:text-white">{node.location}</p>
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Node Capacity</p>
                          <p className="font-mono font-bold text-gray-900 dark:text-white">{node.capacity}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{node.health}</span>
                          </div>
                          <p className="text-sm font-black text-gray-900 dark:text-white">{node.utilized} Utilized</p>
                        </div>
                        <button className="p-3 bg-white dark:bg-white/5 rounded-xl text-gray-400 hover:text-guava-orange transition-colors opacity-0 group-hover:opacity-100 border border-gray-100 dark:border-white/10">
                          <ArrowUpRight className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Market Pulse Chart Placeholder */}
                <div className="bg-guava-orange text-white p-10 rounded-[32px] relative overflow-hidden shadow-2xl shadow-guava-orange/20">
                  <div className="relative z-10">
                    <h3 className="text-4xl font-black tracking-tight mb-4">Market Yield Optimization</h3>
                    <p className="max-w-md text-white/80 font-medium mb-8 leading-relaxed">Your nodes are currently operating at 92.4% efficiency. Deploying an additional $500K into West African Retail could increase localized yield by 2.1%.</p>
                    <button className="px-8 py-4 bg-white text-guava-orange rounded-[20px] font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-all flex items-center gap-4">
                      Deploy Liquidity <TrendingUp className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 p-8 opacity-20">
                    <BarChart3 className="w-64 h-64 rotate-12 translate-x-20 -translate-y-10" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'automatch' && (
              <motion.div 
                key="automatch"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-[#0F172A] rounded-[32px] border border-gray-100 dark:border-white/5 p-8">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Auto-Match Engine</h2>
                      <p className="text-gray-400 text-sm mt-1">Smart liquidity deployment based on real-time scoring.</p>
                    </div>
                    <button 
                      onClick={() => setIsAutoMatchActive(!isAutoMatchActive)}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                        isAutoMatchActive 
                          ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                          : "bg-gray-100 dark:bg-white/5 text-gray-400"
                      )}
                    >
                      {isAutoMatchActive ? 'Engine Alive' : 'Engine Standby'}
                      <div className={cn("w-2 h-2 rounded-full", isAutoMatchActive ? "bg-white animate-pulse" : "bg-gray-400")} />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div className="p-8 bg-gray-50 dark:bg-white/5 rounded-[24px] border border-gray-100 dark:border-white/10">
                      <div className="flex justify-between items-center mb-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Risk Threshold Score</label>
                        <span className="text-2xl font-black font-mono text-guava-orange">{riskThreshold}</span>
                      </div>
                      <input 
                        type="range" 
                        min="300" 
                        max="850" 
                        value={riskThreshold}
                        onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-guava-orange"
                      />
                      <div className="flex justify-between mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        <span>High Alpha / High Risk (300+)</span>
                        <span>Institutional Grade (800+)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 border border-gray-100 dark:border-white/10 rounded-2xl">
                        <h4 className="text-sm font-bold mb-4">Asset Class Focus</h4>
                        <div className="space-y-3">
                          {['Retail Micro-loans', 'SME Growth Capital', 'Agricultural Trade', 'Cross-border Settlement'].map(cat => (
                            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                              <div className="w-5 h-5 border-2 border-gray-200 dark:border-white/20 rounded-md group-hover:border-guava-orange transition-all flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-guava-orange scale-0 group-hover:scale-100 transition-transform" />
                              </div>
                              <span className="text-sm font-medium text-gray-400 group-hover:text-guava-dark dark:group-hover:text-white transition-colors">{cat}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="p-6 border border-gray-100 dark:border-white/10 rounded-2xl">
                        <h4 className="text-sm font-bold mb-4">Deployment Limits</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Max Match size (USD)</p>
                            <div className="p-3 bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-xl font-mono font-bold">$25,000</div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Portfolio Concentration</p>
                            <div className="p-3 bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-white/10 rounded-xl font-mono font-bold">3.5% PER ASSET</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar / Live Pulse */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-[#0F172A] rounded-[32px] border border-gray-100 dark:border-white/5 p-8 shadow-xl shadow-black/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8 flex items-center gap-2">
              <Activity className="w-4 h-4 text-guava-orange" /> Network Pulse
            </h3>
            <div className="space-y-6">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-2xl" />)}
                </div>
              ) : (
                loans.slice(0, 5).map((loan, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-guava-orange">Auto-Scan Match FOUND</p>
                      <span className="text-[10px] font-mono text-gray-400">2m ago</span>
                    </div>
                    <div className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-gray-100 dark:hover:border-white/10">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-gray-400 group-hover:text-guava-orange transition-colors" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">{loan.purpose}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Risk Score: {loan.creditScoreSnapshot} • APR: {loan.interestRate}%</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loans.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">No Active Bid Signals</p>
                </div>
              )}
            </div>
            <button className="w-full mt-8 py-4 bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-white/60 rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-guava-orange hover:text-white transition-all border border-gray-100 dark:border-white/10">
              View All Signals
            </button>
          </div>

          <div className="bg-black text-white p-8 rounded-[32px] overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-guava-orange/20 blur-[60px]" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-guava-orange" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Node Security</span>
              </div>
              <p className="text-lg font-bold mb-6">Your institutional license is valid until 2027.</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-white/40 uppercase tracking-widest">Global Ranking</span>
                  <span className="text-guava-orange">Top 12%</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[88%] h-full bg-guava-orange" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
