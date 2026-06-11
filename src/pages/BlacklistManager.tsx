import { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  UserX, 
  MessageSquare, 
  Share2, 
  AlertTriangle, 
  ChevronRight, 
  Search,
  Filter,
  FileText,
  Mail,
  Activity,
  Ban,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, BlacklistRecord, WarningType, DefaultWarning } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BlacklistManagerProps {
  user: UserProfile;
}

const MOCK_BLACKLIST: BlacklistRecord[] = [
  {
    id: 'bl-1',
    borrowerId: 'USR-882',
    borrowerName: 'Matrix Logistics Ltd',
    reason: 'Repeated Default (> 90 days)',
    comments: 'Operational collapse reported. Collateral liquidation in progress.',
    blacklistedBy: 'Global Capital Bank',
    createdAt: '2026-03-12T10:00:00Z',
    severity: 'CRITICAL',
    isPublic: true
  },
  {
    id: 'bl-2',
    borrowerId: 'USR-441',
    borrowerName: 'Sarah Jenkins',
    reason: 'Identity Inconsistency',
    comments: 'Kyc fingerprints did not match secondary hash indices.',
    blacklistedBy: 'Nexus Venture Group',
    createdAt: '2026-04-05T14:20:00Z',
    severity: 'HIGH',
    isPublic: true
  },
  {
    id: 'bl-3',
    borrowerId: 'USR-119',
    borrowerName: 'Alpha Tech Exports',
    reason: 'Liquidity Mismanagement',
    comments: 'Multiple bridge loan failures across 3 portals.',
    blacklistedBy: 'ACX Portal Admin',
    createdAt: '2026-04-28T09:15:00Z',
    severity: 'MODERATE',
    isPublic: false
  }
];

const BLACKLIST_REASONS = [
  'Repeated Default (> 90 days)',
  'Identity Inconsistency / Fraud',
  'Liquidity Mismanagement',
  'Portal Abuse',
  'Collateral Drain Attempt',
  'KYC/AML Failure',
  'Multiple Portal Defaults'
];

const MOCK_DEFAULTERS = [
  { id: 'def-1', name: 'Zion Construction', loanId: 'ACX-7721', amount: 45000, daysOverdue: 12, warningStatus: 'NONE' },
  { id: 'def-2', name: 'Orbit Media', loanId: 'ACX-4511', amount: 12000, daysOverdue: 45, warningStatus: 'WRITTEN' },
  { id: 'def-3', name: 'Quasar Retail', loanId: 'ACX-9902', amount: 8500, daysOverdue: 92, warningStatus: 'FINAL' },
];

export default function BlacklistManager({ user }: BlacklistManagerProps) {
  const [activeTab, setActiveTab] = useState<'blacklist' | 'defaulters'>('blacklist');
  const [searchTerm, setSearchTerm] = useState('');
  const [issuedWarnings, setIssuedWarnings] = useState<DefaultWarning[]>([]);
  const [selectedBlacklist, setSelectedBlacklist] = useState<BlacklistRecord[]>(MOCK_BLACKLIST);
  
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [newProposal, setNewProposal] = useState({
    borrowerName: '',
    reason: BLACKLIST_REASONS[0],
    comments: '',
    severity: 'MODERATE' as 'MODERATE' | 'HIGH' | 'CRITICAL',
    isPublic: true
  });

  const filteredBlacklist = useMemo(() => {
    return selectedBlacklist.filter(r => 
      r.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, selectedBlacklist]);

  const handleProposeListing = () => {
    if (!newProposal.borrowerName || !newProposal.comments) {
      alert("Please provide the borrower name and comments.");
      return;
    }

    const record: BlacklistRecord = {
      id: `bl-${Date.now()}`,
      borrowerId: 'USR-' + Math.floor(Math.random() * 999),
      borrowerName: newProposal.borrowerName,
      reason: newProposal.reason,
      comments: newProposal.comments,
      blacklistedBy: user.displayName,
      createdAt: new Date().toISOString(),
      severity: newProposal.severity,
      isPublic: newProposal.isPublic
    };

    setSelectedBlacklist([record, ...selectedBlacklist]);
    setShowProposeModal(false);
    setNewProposal({
      borrowerName: '',
      reason: BLACKLIST_REASONS[0],
      comments: '',
      severity: 'MODERATE',
      isPublic: true
    });
    alert("Listing proposal broadcast to network consensus.");
  };

  const handleIssueWarning = (defaulterId: string, level: 'WRITTEN' | 'FINAL') => {
    const warning: DefaultWarning = {
      id: `warn-${Date.now()}`,
      borrowerId: defaulterId,
      loanId: 'UNKNOWN', // In a real app we'd link this
      type: level === 'WRITTEN' ? WarningType.WRITTEN : WarningType.FINAL_DEMAND,
      issuedAt: new Date().toISOString(),
      content: level === 'WRITTEN' 
        ? "Official notification of overdue repayment. Immediate action required to avoid credit resonance degradation."
        : "FINAL DEMAND: Permanent portal blacklisting and collateral liquidation will initiate in 48 hours."
    };
    
    setIssuedWarnings([warning, ...issuedWarnings]);
    alert(`${level} Warning transmission initiated for ${defaulterId}`);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Borrower Name', 'Borrower ID', 'Reason', 'Comments', 'Blacklisted By', 'Severity', 'Created At'];
    const rows = filteredBlacklist.map(record => [
      record.id,
      record.borrowerName,
      record.borrowerId,
      record.reason,
      record.comments,
      record.blacklistedBy,
      record.severity,
      record.createdAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `blacklist_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-guava-orange" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-guava-orange">Security Intelligence</span>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-guava-dark dark:text-white">Blacklist Terminal</h2>
           <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mt-1">Shared risk intelligence and default management node.</p>
        </div>

        <div className="flex gap-4 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
           <button 
             onClick={() => setActiveTab('blacklist')}
             className={cn(
               "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'blacklist' ? "bg-white dark:bg-black text-guava-dark dark:text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
             )}
           >
             Shared Blacklist
           </button>
           <button 
             onClick={() => setActiveTab('defaulters')}
             className={cn(
               "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'defaulters' ? "bg-white dark:bg-black text-guava-dark dark:text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
             )}
           >
             Default Management
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                  <UserX className="w-5 h-5 text-red-600" />
               </div>
               <span className="text-[10px] font-black text-gray-400">Total Blacklisted</span>
            </div>
            <p className="text-3xl font-black dark:text-white">{MOCK_BLACKLIST.length}</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-red-600 font-bold">
               <Activity className="w-3 h-3" />
               Critical Network Guard
            </div>
         </div>

         <div className="bg-white dark:bg-[#1E293B] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
               </div>
               <span className="text-[10px] font-black text-gray-400">Pending Actions</span>
            </div>
            <p className="text-3xl font-black dark:text-white">12</p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 font-bold">
               <ChevronRight className="w-3 h-3" />
               Warnings Awaiting Response
            </div>
         </div>

         <div className="bg-guava-dark dark:bg-black p-6 rounded-3xl border border-white/5 shadow-xl shadow-guava-orange/5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-guava-green rounded-full animate-pulse" />
               <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Network Consensus</span>
            </div>
            <p className="text-sm font-bold text-white leading-tight">Syncing blacklist with 14 other portal nodes in Real-time.</p>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 text-[10px] font-black text-guava-orange uppercase tracking-widest mt-4 hover:opacity-80 transition-opacity"
            >
               <Share2 className="w-3 h-3" />
               Export Registry
            </button>
         </div>
      </div>

      {activeTab === 'blacklist' ? (
        <div className="space-y-6">
           <div className="flex items-center gap-4 bg-white dark:bg-[#1E293B] p-4 px-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by entity name or reason..."
                className="bg-transparent text-sm font-medium w-full outline-none dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Filter className="w-4 h-4 text-gray-400 cursor-pointer" />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBlacklist.map((record) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={record.id} 
                  className="bg-white dark:bg-[#1E293B] border border-gray-100 dark:border-white/5 rounded-3xl overflow-hidden group hover:border-guava-orange/30 transition-all"
                >
                   <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 dark:bg-black rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-guava-orange transition-colors">
                               <Ban className="w-6 h-6" />
                            </div>
                            <div>
                               <h3 className="text-xl font-black text-guava-dark dark:text-white">{record.borrowerName}</h3>
                               <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Entity UID: {record.borrowerId}</p>
                            </div>
                         </div>
                         <div className={cn(
                           "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                           record.severity === 'CRITICAL' ? "bg-red-500 text-white" : 
                           record.severity === 'HIGH' ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-500"
                         )}>
                            {record.severity}
                         </div>
                      </div>

                      <div className="space-y-4">
                         <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                            <span className="text-[10px] font-black uppercase text-guava-orange block mb-1">Reason for Listing</span>
                            {record.isPublic ? (
                              <p className="text-sm font-bold text-guava-dark dark:text-white">{record.reason}</p>
                            ) : (
                              <p className="text-sm font-bold text-gray-400 italic">Content Restricted (Private Listing)</p>
                            )}
                         </div>
                         <div className="flex items-start gap-3">
                            <MessageSquare className="w-4 h-4 text-gray-300 mt-0.5" />
                            {record.isPublic ? (
                              <p className="text-xs text-gray-400 leading-relaxed font-medium">"{record.comments}"</p>
                            ) : (
                              <p className="text-xs text-gray-300 italic">Comments hidden by reporter.</p>
                            )}
                         </div>
                      </div>
                   </div>

                   <div className="px-8 py-5 bg-gray-50/50 dark:bg-black/20 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-5 h-5 rounded-full bg-guava-dark flex items-center justify-center text-[8px] text-white font-black">ACX</div>
                         <span className="text-[10px] font-black text-gray-400">{record.blacklistedBy}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-300">{new Date(record.createdAt).toLocaleDateString()}</span>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1E293B] rounded-[48px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
          <div className="p-10 border-b border-gray-50 dark:border-white/5">
              <h3 className="text-2xl font-black text-guava-dark dark:text-white">Active Defaulters</h3>
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 mt-1">Review liquidity delays and escalate via portal warnings</p>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full">
                <thead>
                   <tr className="border-b border-gray-50 dark:border-white/5">
                      <th className="text-left px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Borrower Entity</th>
                      <th className="text-left py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Loan ID</th>
                      <th className="text-right py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Arrears</th>
                      <th className="text-right py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Days Overdue</th>
                      <th className="text-right py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Portal Status</th>
                      <th className="text-right px-10 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                   {MOCK_DEFAULTERS.map((def) => (
                      <tr key={def.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                         <td className="px-10 py-6">
                            <p className="text-sm font-black text-guava-dark dark:text-white">{def.name}</p>
                         </td>
                         <td className="py-6">
                            <span className="text-xs font-bold text-gray-400">{def.loanId}</span>
                         </td>
                         <td className="py-6 text-right font-mono font-black dark:text-white">
                            ${def.amount.toLocaleString()}
                         </td>
                         <td className="py-6 text-right">
                            <span className={cn(
                              "text-xs font-black",
                              def.daysOverdue > 60 ? "text-red-600" : def.daysOverdue > 30 ? "text-amber-500" : "text-gray-400"
                            )}>{def.daysOverdue}D</span>
                         </td>
                         <td className="py-6 text-right">
                            <div className="flex flex-col items-end gap-1">
                               {def.warningStatus === 'NONE' && (
                                 <span className="text-[8px] font-black uppercase py-1 px-2 border border-blue-500/20 text-blue-500 rounded">Grace Period</span>
                               )}
                               {def.warningStatus === 'WRITTEN' && (
                                 <span className="text-[8px] font-black uppercase py-1 px-2 bg-amber-500 text-white rounded">Written Warn Issued</span>
                               )}
                               {def.warningStatus === 'FINAL' && (
                                 <span className="text-[8px] font-black uppercase py-1 px-2 bg-red-600 text-white rounded">Final Demand Sent</span>
                               )}
                            </div>
                         </td>
                         <td className="px-10 py-6 text-right">
                            <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => handleIssueWarning(def.name, 'WRITTEN')}
                                 className="p-2 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                 title="Issue Written Warning"
                               >
                                  <FileText className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => handleIssueWarning(def.name, 'FINAL')}
                                 className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                 title="Issue Final Demand"
                               >
                                  <Mail className="w-4 h-4" />
                               </button>
                               <button 
                                 className="p-2 text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                 title="Add to Blacklist"
                               >
                                  <UserX className="w-4 h-4" />
                               </button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
          
          <div className="p-10 bg-gray-50 dark:bg-white/5 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-guava-orange" />
                <p className="text-xs font-bold text-gray-400 italic">Listing an entity requires multi-node attestation.</p>
             </div>
             <button 
               onClick={() => setShowProposeModal(true)}
               className="px-8 py-3 bg-white dark:bg-black border border-gray-100 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-guava-dark dark:text-white shadow-sm hover:border-black active:scale-95 transition-all"
             >
                Propose New Listing
             </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showProposeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-[#0F172A] w-full max-w-xl rounded-[48px] overflow-hidden shadow-2xl relative border border-white/5"
            >
               <button 
                 onClick={() => setShowProposeModal(false)}
                 className="absolute top-8 right-8 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all text-gray-400"
               >
                  <X className="w-6 h-6" />
               </button>

               <div className="p-12">
                  <h3 className="text-3xl font-black tracking-tighter mb-8 dark:text-white">Propose Sanction</h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Borrower Entity Name</label>
                       <input 
                         type="text" 
                         value={newProposal.borrowerName}
                         onChange={e => setNewProposal({...newProposal, borrowerName: e.target.value})}
                         placeholder="e.g. Acme Corp"
                         className="w-full px-8 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Standard Infraction Reason</label>
                       <select 
                         value={newProposal.reason}
                         onChange={e => setNewProposal({...newProposal, reason: e.target.value})}
                         className="w-full px-8 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white appearance-none cursor-pointer"
                       >
                          {BLACKLIST_REASONS.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Supporting Evidence / Comments</label>
                       <textarea 
                         value={newProposal.comments}
                         onChange={e => setNewProposal({...newProposal, comments: e.target.value})}
                         rows={3}
                         placeholder="Describe the nature of the default or infraction..."
                         className="w-full px-8 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white resize-none"
                       />
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-guava-orange/10 rounded-xl">
                             <Share2 className="w-4 h-4 text-guava-orange" />
                          </div>
                          <div>
                             <p className="text-xs font-black dark:text-white">Share Reason with Lenders</p>
                             <p className="text-[10px] text-gray-400 font-bold">Makes infraction details public</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => setNewProposal({...newProposal, isPublic: !newProposal.isPublic})}
                         className={`w-12 h-6 rounded-full transition-all relative ${newProposal.isPublic ? 'bg-guava-orange' : 'bg-gray-200'}`}
                       >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${newProposal.isPublic ? 'translate-x-6' : ''}`} />
                       </button>
                    </div>

                    <button 
                      onClick={handleProposeListing}
                      className="w-full py-5 bg-guava-dark text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-guava-orange/10"
                    >
                       Broadcast Proposal
                    </button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warnings Feed (Bottom) */}
      {issuedWarnings.length > 0 && (
         <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Live Transmission Feed</h4>
            <div className="space-y-2">
               {issuedWarnings.map(warn => (
                 <div key={warn.id} className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-1.5 h-1.5 rounded-full animate-pulse",
                         warn.type === WarningType.WRITTEN ? "bg-amber-500" : "bg-red-600"
                       )} />
                       <p className="text-xs font-bold text-guava-dark dark:text-white">
                         {warn.type.replace('_', ' ')} issued to {warn.borrowerId}
                       </p>
                    </div>
                    <span className="text-[10px] font-mono text-gray-300">{new Date(warn.issuedAt).toLocaleTimeString()}</span>
                 </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
}
