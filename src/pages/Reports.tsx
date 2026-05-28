import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Zap,
  Activity,
  Globe,
  ShieldCheck,
  ChevronRight,
  Share2,
  RefreshCw,
  LayoutGrid,
  Map as MapIcon,
  FileDown,
  DollarSign,
  LucideIcon
} from 'lucide-react';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNotify } from '../lib/NotificationContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATA_RESONANCE = [
  { name: 'JAN', value: 680, target: 650 },
  { name: 'FEB', value: 710, target: 690 },
  { name: 'MAR', value: 695, target: 700 },
  { name: 'APR', value: 740, target: 710 },
  { name: 'MAY', value: 720, target: 730 },
  { name: 'JUN', value: 785, target: 750 },
];

const DATA_LIQUIDITY_FLOW = [
  { name: 'JAN', inflow: 120, outflow: 95, pool: 2400 },
  { name: 'FEB', name2: 'FEB', inflow: 145, outflow: 110, pool: 2435 },
  { name: 'MAR', name2: 'MAR', inflow: 130, outflow: 115, pool: 2450 },
  { name: 'APR', name2: 'APR', inflow: 160, outflow: 125, pool: 2485 },
  { name: 'MAY', name2: 'MAY', inflow: 185, outflow: 140, pool: 2530 },
  { name: 'JUN', name2: 'JUN', inflow: 210, outflow: 155, pool: 2585 },
];

const DATA_RISK_DISTRIBUTION = [
  { range: '400-500', count: 5, color: '#ef4444' },
  { range: '500-600', count: 12, color: '#f59e0b' },
  { range: '600-700', count: 45, color: '#3b82f6' },
  { range: '700-800', count: 78, color: '#22c55e' },
  { range: '800-850', count: 24, color: '#10b981' },
];

const DATA_COUNTRY_SPREAD = [
  { name: 'Nigeria', value: 35, growth: '+12%', resonance: 742 },
  { name: 'Kenya', value: 25, growth: '+8%', resonance: 710 },
  { name: 'South Africa', value: 20, growth: '+15%', resonance: 785 },
  { name: 'Egypt', value: 10, growth: '+5%', resonance: 695 },
  { name: 'Ghana', value: 10, growth: '+22%', resonance: 720 },
];

const DATA_REGION = [
  { name: 'Sub-Saharan Africa', value: 45, color: '#f36d38' },
  { name: 'Southeast Asia', value: 25, color: '#1e293b' },
  { name: 'Latin America', value: 20, color: '#22c55e' },
  { name: 'Eastern Europe', value: 10, color: '#3b82f6' },
];

const DATA_ALLOCATION = [
  { category: 'Micro-retail', amount: 45000, risk: 'Low' },
  { category: 'Agri-tech', amount: 32000, risk: 'Medium' },
  { category: 'Digital Svcs', amount: 58000, risk: 'Low' },
  { category: 'Bridge Equity', amount: 29000, risk: 'High' },
  { category: 'Education', amount: 15000, risk: 'Low' },
];

const REPORT_TABS = [
  { id: 'overview', label: 'Executive Overview', icon: LayoutGrid },
  { id: 'liquidity', label: 'Liquidity Analysis', icon: Zap },
  { id: 'geography', label: 'Geographical Spread', icon: MapIcon },
  { id: 'risk', label: 'Risk Integrity', icon: ShieldCheck },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFilterPaneOpen, setIsFilterPaneOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());
  const { notify } = useNotify();

  // Filters
  const [filters, setFilters] = useState({
    timeRange: 'Last 6 Months',
    assetClass: 'All',
    region: 'All',
    minResonance: 600
  });

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastRefreshed(new Date().toLocaleTimeString());
    }, 1200);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'ACX Portal Intelligence',
      text: 'Check out the latest financial intelligence reports on ACX.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        notify('success', 'Intelligence Shared', 'Report has been shared successfully.');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        notify('success', 'Link Copied', 'Report URL has been copied to clipboard.');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        notify('error', 'Share Failed', 'Could not share the report.');
      }
    }
  };

  const handleDownload = () => {
    notify('info', 'Exporting Intelligence', 'Preparing your intelligence report for export...');
    setTimeout(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = new jsPDF() as any;
        const timestamp = new Date().toLocaleString();
        
        // Header
        doc.setFillColor(30, 41, 59); // guava-dark equivalent
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ACX PORTAL INTELLIGENCE', 20, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`INTELLIGENCE REPORT | ${activeTab.toUpperCase()}`, 20, 33);
        
        // Metadata
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text(`Generated: ${timestamp}`, 20, 50);
        doc.text(`Filters: ${filters.timeRange} | ${filters.region} | Min Resonance: ${filters.minResonance}`, 20, 55);
        
        // Summary Table
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(14);
        doc.text('Performance Summary', 20, 70);
        
        const summaryData = [
          ['Metric', 'Value', 'Status'],
          ['Total Portfolio Value', '$4.28M', 'Growth +18.2%'],
          ['Avg Resonance Score', '742', 'Optimal'],
          ['Risk Integrity', '98.4%', 'Verifed'],
          ['Active Jurisdictions', '124', 'Expanding']
        ];
        
        autoTable(doc, {
          startY: 75,
          head: [summaryData[0]],
          body: summaryData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [243, 109, 56] } // guava-orange
        });

        // Allocation Detail
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY = (doc as any).lastAutoTable.finalY || 120;
        doc.text('Asset Allocation Intelligence', 20, finalY + 15);
        
        const tableData = DATA_ALLOCATION.map(item => [
          item.category,
          `$${item.amount.toLocaleString()}`,
          item.risk,
          `${Math.round((item.amount / 180000) * 100)}%`
        ]);

        autoTable(doc, {
          startY: finalY + 20,
          head: [['Category', 'Amount Committed', 'Risk Profile', 'Contribution']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59] }
        });

        doc.save(`ACX_Intel_${activeTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
        notify('success', 'Report Exported', 'The intelligence PDF has been downloaded.');
      } catch (err) {
        console.error('PDF generation failed:', err);
        notify('error', 'Export Failed', 'Could not generate PDF.');
      }
    }, 1500);
  };

  return (
    <div className="w-full flex h-[calc(100vh-120px)] -mt-4 bg-[#F3F4F6] rounded-[32px] overflow-hidden border border-gray-200">
      {/* Top Controller Bar (Power BI Style) */}
      <div className="absolute top-4 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20 mx-8 rounded-t-[32px]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-guava-orange rounded-sm" />
            <h1 className="text-sm font-black text-guava-dark uppercase tracking-widest bg-clip-text">Portal Intelligence v4.0</h1>
          </div>
          <div className="h-6 w-[1px] bg-gray-200" />
          <nav className="flex gap-1">
            {REPORT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-2",
                  activeTab === tab.id ? "bg-guava-dark text-white shadow-lg" : "text-gray-400 hover:bg-gray-100"
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            Updated {lastRefreshed}
          </div>
          <button onClick={refreshData} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Share Report">
            <Share2 className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={handleDownload} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Export Data">
             <FileDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pt-14 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="absolute inset-0 bg-guava-orange"
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-guava-dark animate-pulse">Synchronizing Intelligence</p>
              </motion.div>
            ) : null}

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {activeTab === 'overview' && (
                <>
                  {/* KPI Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <KPICard title="Total Portfolio Value" value="$4.28M" trend="+18.2%" icon={Activity} />
                    <KPICard title="Avg Resonance Score" value="742" trend="+12" icon={TrendingUp} />
                    <KPICard title="Active Nodes" value="124" trend="+3" icon={Globe} />
                    <KPICard title="Risk Integrity" value="98.4%" trend="Stable" icon={ShieldCheck} isSuccess />
                  </div>

                  {/* Main Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-10">
                        <div>
                          <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest">Resonance Trajectory</h3>
                          <p className="text-[10px] text-gray-400 font-bold">Observed vs Target Intelligence Growth</p>
                        </div>
                        <div className="flex gap-4">
                           <div className="flex items-center gap-1.5">
                              <div className="w-3 h-1 bg-guava-orange rounded-full" />
                              <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">Actual</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                              <div className="w-3 h-1 bg-gray-200 rounded-full" />
                              <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">Target</span>
                           </div>
                        </div>
                      </div>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={DATA_RESONANCE}>
                            <defs>
                              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f36d38" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#f36d38" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="value" stroke="#f36d38" strokeWidth={3} fill="url(#colorVal)" />
                            <Line type="monotone" dataKey="target" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col">
                       <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest mb-10">Regional Intensity</h3>
                       <div className="flex-1 flex flex-col items-center justify-center">
                          <div className="h-[220px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={DATA_REGION}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {DATA_REGION.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                </PieChart>
                             </ResponsiveContainer>
                          </div>
                          <div className="grid grid-cols-2 gap-4 w-full mt-6">
                             {DATA_REGION.map(region => (
                               <div key={region.name} className="space-y-1">
                                  <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: region.color }} />
                                     <span className="text-[9px] font-black uppercase text-gray-500 whitespace-nowrap">{region.name}</span>
                                  </div>
                                  <div className="text-sm font-black italic">{region.value}%</div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Allocation Table Row */}
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest">Asset Allocation Intelligence</h3>
                       <button className="text-[9px] font-black uppercase tracking-widest text-guava-orange hover:underline">View All Assets</button>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full">
                          <thead>
                             <tr className="border-b border-gray-100">
                                <th className="text-left pb-4 text-[9px] font-black uppercase text-gray-400">Category</th>
                                <th className="text-right pb-4 text-[9px] font-black uppercase text-gray-400">Amount Committed</th>
                                <th className="text-right pb-4 text-[9px] font-black uppercase text-gray-400">Risk Profile</th>
                                <th className="text-right pb-4 text-[9px] font-black uppercase text-gray-400">Contribution</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {DATA_ALLOCATION.map((item, i) => (
                               <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                  <td className="py-5 text-xs font-black text-guava-dark">{item.category}</td>
                                  <td className="py-5 text-right text-xs font-black font-mono">${item.amount.toLocaleString()}</td>
                                  <td className="py-5 text-right">
                                     <span className={cn(
                                       "px-2 py-1 rounded-lg text-[8px] font-black uppercase",
                                       item.risk === 'Low' ? "bg-green-50 text-green-600" : item.risk === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                     )}>
                                        {item.risk} Risk
                                     </span>
                                  </td>
                                  <td className="py-5 text-right">
                                     <div className="flex items-center justify-end gap-3">
                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                           <div className="h-full bg-guava-dark rounded-full" style={{ width: `${(item.amount / 180000) * 100}%` }} />
                                        </div>
                                        <span className="text-[10px] font-black font-mono w-8">{Math.round((item.amount / 180000) * 100)}%</span>
                                     </div>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'liquidity' && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <KPICard title="Total Liquidity Pool" value="$12.84M" trend="+4.2%" icon={Zap} />
                      <KPICard title="Utilization Rate" value="68.2%" trend="-2.1%" icon={Activity} />
                      <KPICard title="Cash Flow Gap" value="$0.8M" trend="Stable" icon={TrendingUp} isSuccess />
                      <KPICard title="Available Surplus" value="$4.1M" trend="+12.5%" icon={DollarSign} />
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                         <div className="flex justify-between items-center mb-10">
                            <div>
                               <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest">Inflow-Outflow Dynamics</h3>
                               <p className="text-[10px] text-gray-400 font-bold">Monthly Liquidity Movement Analysis</p>
                            </div>
                         </div>
                         <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={DATA_LIQUIDITY_FLOW}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                                  <Bar dataKey="inflow" fill="#f36d38" radius={[4, 4, 0, 0]} name="Inflow" />
                                  <Bar dataKey="outflow" fill="#1e293b" radius={[4, 4, 0, 0]} name="Outflow" />
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>

                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                         <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest mb-10">Liquidity Depth</h3>
                         <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={DATA_LIQUIDITY_FLOW}>
                                  <defs>
                                    <linearGradient id="colorPool" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <RechartsTooltip content={<CustomTooltip />} />
                                  <Area type="monotone" dataKey="pool" stroke="#22c55e" strokeWidth={3} fill="url(#colorPool)" />
                               </AreaChart>
                            </ResponsiveContainer>
                         </div>
                         <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Observation</p>
                            <p className="text-xs font-medium text-gray-600">Liquidity surplus remains high at 18.2% above historical average, indicating strong capital buffering.</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'geography' && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden h-[500px]">
                         <div className="relative z-10">
                            <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest">Global Node Distribution</h3>
                            <p className="text-[10px] text-gray-400 font-bold">Active Capital Deployment Areas</p>
                         </div>
                         <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <Globe className="w-96 h-96" />
                         </div>
                         <div className="relative z-10 h-full mt-12">
                            <div className="space-y-6">
                               {DATA_COUNTRY_SPREAD.map((country, idx) => (
                                 <motion.div 
                                   initial={{ opacity: 0, x: -20 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: idx * 0.1 }}
                                   key={country.name} 
                                   className="flex items-center justify-between group cursor-default"
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-xs text-guava-orange group-hover:bg-guava-orange group-hover:text-white transition-all">
                                          {country.name.substring(0, 2).toUpperCase()}
                                       </div>
                                       <div>
                                          <h4 className="text-sm font-black text-guava-dark">{country.name}</h4>
                                          <div className="flex items-center gap-2">
                                             <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-guava-dark" style={{ width: `${country.value}%` }} />
                                             </div>
                                             <span className="text-[10px] font-black text-gray-400">{country.value}%</span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-xs font-black text-green-500 italic">{country.growth}</p>
                                       <p className="text-[9px] font-black uppercase tracking-tighter text-gray-300">MoM Growth</p>
                                    </div>
                                 </motion.div>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-[234px]">
                            <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest mb-6 focus-within:">Resonance by Jurisdiction</h3>
                            <div className="h-[120px]">
                               <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={DATA_COUNTRY_SPREAD} layout="vertical">
                                     <XAxis type="number" hide />
                                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} width={80} />
                                     <RechartsTooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                     <Bar dataKey="resonance" fill="#f36d38" radius={[0, 4, 4, 0]} barSize={12} />
                                  </BarChart>
                               </ResponsiveContainer>
                            </div>
                         </div>

                         <div className="bg-guava-dark rounded-3xl p-8 text-white relative overflow-hidden h-[234px]">
                            <MapIcon className="absolute -right-12 -bottom-12 w-48 h-48 opacity-10 rotate-12" />
                            <div className="relative z-10">
                               <h3 className="text-sm font-black uppercase tracking-widest opacity-60 mb-8">Strategic Analysis</h3>
                               <div className="space-y-4">
                                  <div className="flex border-l-2 border-guava-orange pl-4">
                                     <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Primary Hub</p>
                                        <p className="text-xl font-black italic">West African Corridor</p>
                                     </div>
                                  </div>
                                  <div className="flex border-l-2 border-white/20 pl-4">
                                     <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Emerging Frontier</p>
                                        <p className="text-xl font-black italic">East African Tech-belt</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'risk' && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm col-span-2">
                         <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest mb-10">Resonance Score Distribution</h3>
                         <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={DATA_RISK_DISTRIBUTION}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                     {DATA_RISK_DISTRIBUTION.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} />
                                     ))}
                                  </Bar>
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>

                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
                         <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest">Integrity Metrics</h3>
                         <div className="space-y-6">
                            <IntegrityMeter label="Default Rate" value="1.2%" target="< 2.0%" status="Ideal" />
                            <IntegrityMeter label="Collateral Cover" value="142%" target="> 120%" status="Optimal" />
                            <IntegrityMeter label="Recovery Node Latency" value="14ms" target="< 20ms" status="Optimal" />
                         </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                      <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest mb-8">Risk Event Audit Trail</h3>
                      <div className="space-y-4">
                         {[
                           { event: 'Resonance Shift Detected', region: 'Nigeria/Node-04', impact: 'Negligible', time: '14 mins ago' },
                           { event: 'Collateral Re-validation', region: 'Global', impact: 'Systemic', time: '2 hours ago' },
                           { event: 'Liquidation Automated', region: 'Kenya/Node-12', impact: 'Isolated', time: '5 hours ago' },
                           { event: 'New Institutional Onboarding', region: 'South Africa', impact: 'Positive', time: 'Yesterday' },
                         ].map((event, i) => (
                           <div key={i} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                              <div className="flex items-center gap-4">
                                 <div className="p-2 bg-gray-50 rounded-lg">
                                    <ShieldCheck className="w-4 h-4 text-gray-400" />
                                 </div>
                                 <div>
                                    <h5 className="text-xs font-black text-guava-dark">{event.event}</h5>
                                    <p className="text-[10px] text-gray-400 font-bold">{event.region}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className={cn(
                                   "text-[10px] font-black uppercase tracking-widest mb-1",
                                   event.impact === 'Positive' ? "text-green-500" : event.impact === 'Negligible' ? "text-gray-400" : "text-amber-500"
                                 )}>{event.impact} Impact</p>
                                 <p className="text-[9px] font-bold text-gray-300">{event.time}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Right Side Filter Pane (Power BI Style) */}
      <motion.aside 
        initial={false}
        animate={{ width: isFilterPaneOpen ? 320 : 0 }}
        className="bg-white border-l border-gray-200 relative z-30 flex flex-col"
      >
        <div className="absolute top-0 right-full h-12 w-8 bg-white border-y border-l border-gray-200 rounded-l-xl flex items-center justify-center cursor-pointer mt-4 shadow-[-5px_0_15px_rgba(0,0,0,0.05)]"
             onClick={() => setIsFilterPaneOpen(!isFilterPaneOpen)}>
          <ChevronRight className={cn("w-4 h-4 transition-transform", isFilterPaneOpen ? "rotate-0" : "rotate-180")} />
        </div>

        <div className={cn("flex-1 overflow-hidden transition-opacity flex flex-col", !isFilterPaneOpen && "opacity-0")}>
          <div className="p-6 border-b border-gray-100">
             <div className="flex items-center gap-2 mb-1">
                <Filter className="w-4 h-4 text-guava-orange" />
                <h2 className="text-xs font-black uppercase tracking-widest text-guava-dark">Intelligence Filters</h2>
             </div>
             <p className="text-[10px] text-gray-400 font-bold">Restrict analytical scope</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Filter Group: Time */}
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Time Intelligence</label>
              <div className="grid grid-cols-1 gap-2">
                 {['Live Analytics', 'Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Last 6 Months'].map(time => (
                   <button 
                     key={time}
                     onClick={() => setFilters({ ...filters, timeRange: time })}
                     className={cn(
                       "text-left px-4 py-3 rounded-xl text-[10px] font-black transition-all border",
                       filters.timeRange === time ? "bg-guava-dark text-white border-guava-dark shadow-md" : "bg-gray-50 text-gray-500 border-transparent hover:border-gray-200"
                     )}
                   >
                     {time}
                   </button>
                 ))}
              </div>
            </div>

            {/* Filter Group: Geography */}
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Regional Drilldown</label>
              <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[10px] font-black outline-none focus:border-guava-orange">
                <option>Global Portal</option>
                <option>Africa Sourcing</option>
                <option>SEA Liquidity</option>
                <option>LatAm Emergence</option>
              </select>
            </div>

            {/* Filter Group: Resonance Slider */}
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Min Resonance</label>
                  <span className="text-[10px] font-black italic">{filters.minResonance}</span>
               </div>
               <input 
                 type="range" 
                 min="400" 
                 max="850" 
                 step="10"
                 value={filters.minResonance}
                 onChange={(e) => setFilters({ ...filters, minResonance: Number(e.target.value) })}
                 className="w-full accent-guava-dark"
               />
               <div className="flex justify-between text-[8px] font-bold text-gray-300">
                  <span>Standard</span>
                  <span>Institutional</span>
               </div>
            </div>

            {/* Visual Settings */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
               <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 font-mono">Visual Parameters</label>
               <div className="space-y-3">
                  <ToggleButton label="Show Targets" active />
                  <ToggleButton label="Sync Real-time" />
                  <ToggleButton label="Cross-filtering" active />
               </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100">
             <button
               onClick={() => { setFilters({ timeRange: 'Last 6 Months', assetClass: 'All', region: 'All', minResonance: 600 }); refreshData(); }}
               className="w-full py-3 border-2 border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-guava-dark hover:text-guava-dark transition-all"
             >
                Reset Visuals
             </button>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}

function KPICard({ title, value, trend, icon: Icon, isSuccess }: { title: string, value: string, trend: string, icon: LucideIcon, isSuccess?: boolean }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:translate-y-[-2px] transition-transform cursor-default group">
       <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-guava-dark group-hover:text-white transition-all">
             <Icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </div>
          <div className={cn(
             "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter flex items-center gap-1",
             isSuccess || trend.startsWith('+') ? "bg-green-50 text-green-500" : "bg-amber-50 text-amber-500"
          )}>
             {trend.startsWith('+') ? <ArrowUpRight className="w-2 h-2" /> : trend === 'Stable' ? null : <ArrowDownRight className="w-2 h-2" />}
             {trend}
          </div>
       </div>
       <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
       <h4 className="text-2xl font-black text-guava-dark font-mono italic tracking-tighter">{value}</h4>
    </div>
  );
}

function IntegrityMeter({ label, value, target, status }: { label: string, value: string, target: string, status: string }) {
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-end">
          <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
             <h4 className="text-xl font-black text-guava-dark italic leading-none">{value}</h4>
          </div>
          <div className="text-right">
             <p className="text-[8px] font-black uppercase text-gray-300">Target: {target}</p>
             <div className="flex items-center gap-1 justify-end text-[9px] font-black text-green-600">
                <ShieldCheck className="w-3 h-3" />
                {status}
             </div>
          </div>
       </div>
       <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
          <div className="h-full bg-guava-orange" style={{ width: '85%' }} />
       </div>
    </div>
  );
}

function ToggleButton({ label, active }: { label: string, active?: boolean }) {
  const [isOn, setIsOn] = useState(active);
  return (
    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsOn(!isOn)}>
      <span className="text-[10px] font-bold text-gray-500 group-hover:text-guava-dark transition-colors">{label}</span>
      <div className={cn("w-8 h-4 rounded-full relative transition-colors", isOn ? "bg-guava-dark" : "bg-gray-200")}>
        <motion.div 
          animate={{ x: isOn ? 16 : 2 }}
          className="absolute top-1 w-2 h-2 bg-white rounded-full shadow-sm"
        />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean, payload?: { value: number | string }[], label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-guava-dark p-4 rounded-2xl shadow-2xl border border-white/10 text-white min-w-[120px]">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-[8px] font-bold opacity-60">Resonance</span>
            <span className="text-[10px] font-black font-mono">{payload[0].value}</span>
          </div>
          {payload[1] && (
            <div className="flex justify-between gap-4">
              <span className="text-[8px] font-bold opacity-60">Target</span>
              <span className="text-[10px] font-black font-mono">{payload[1].value}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}
