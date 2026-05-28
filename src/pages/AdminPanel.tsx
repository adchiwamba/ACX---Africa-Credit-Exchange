import { useState, useEffect } from 'react';
import { ShieldAlert, Users, Database, Key, Settings, ArrowRight, Clock, ShieldCheck, Check, X } from 'lucide-react';
import { auditService } from '../lib/audit';
import { AuditLog, LoanStatus, AuditEventType, UserRole, UserProfile } from '../types';
import { MOCK_LOANS } from '../lib/store';
import { useNotify } from '../lib/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminPanel() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const { notify } = useNotify();
  const [pendingLoans, setPendingLoans] = useState(MOCK_LOANS.filter(l => l.status === LoanStatus.PENDING));

  const handleLoanAction = async (loanId: string, action: 'APPROVE' | 'REJECT') => {
    const loan = pendingLoans.find(l => l.id === loanId);
    if (!loan) return;

    const eventType = action === 'APPROVE' ? AuditEventType.LOAN_APPROVED : AuditEventType.LOAN_REJECTED;
    
    // Simulate updating the loan status
    setPendingLoans(prev => prev.filter(l => l.id !== loanId));
    
    // Log the event
    await auditService.log(
      { 
        uid: 'admin_1', 
        email: 'admin@acx.africa', 
        displayName: 'ACX Admin', 
        role: UserRole.ADMIN,
        creditScore: 850,
        kycStatus: 'VERIFIED',
        currency: 'USD',
        preferredCurrencies: ['USD'],
        balance: 0,
        is2FAEnabled: false
      } as UserProfile,
      eventType,
      `Loan ${loanId} ${action === 'APPROVE' ? 'approved' : 'rejected'} by admin`,
      action === 'APPROVE' ? 'INFO' : 'WARNING',
      { loanId, amount: loan.amount, borrowerId: loan.borrowerId }
    );

    // Trigger instant notification to the borrower (simulated here for the demo user)
    notify(
      action === 'APPROVE' ? 'success' : 'error',
      `Loan ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`,
      `Your loan request for $${loan.amount.toLocaleString()} has been ${action === 'APPROVE' ? 'approved' : 'rejected'} by the ACX risk committee.`
    );
    
    // In a real app we'd refresh the logs here
    const auditLogs = await auditService.getLogs();
    setLogs(auditLogs);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      const auditLogs = await auditService.getLogs();
      setLogs(auditLogs);
    };
    fetchLogs();
  }, []);

  const systemMetrics = [
    { label: 'Network Liquidity', value: '$842.5M', status: 'Optimal' },
    { label: 'Default Rate', value: '1.24%', status: 'Stable' },
    { label: 'Active Sessions', value: '4,802', status: 'Peak' },
    { label: 'Node Distribution', value: '14 Regions', status: 'Sync' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in zoom-in-95 duration-500">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
             <ShieldAlert className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-3xl font-black tracking-tighter">System Nexus</h2>
             <p className="text-gray-400 text-sm font-medium">Root Infrastructure Control • ACX Core</p>
           </div>
        </div>
        
        <div className="flex gap-3">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Security Override Active</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((metric, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{metric.label}</p>
            <p className="text-2xl font-black font-mono tracking-tighter mb-2">{metric.value}</p>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
               <span className="text-[10px] font-bold text-green-600 uppercase tracking-tight">{metric.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  Privileged Entities
                </h3>
                <button className="text-[10px] font-black uppercase text-gray-400 hover:text-black">Management Console</button>
             </div>
             <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-black transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div>
                        <p className="text-sm font-bold">Standard Chartered Bank {i}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Liquidity Provider • Verified</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-all" />
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-guava-orange/5">
                <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                   <Clock className="w-5 h-5 text-guava-orange" />
                   Loan Review Queue
                </h3>
                <span className="text-[10px] font-black text-guava-orange uppercase tracking-widest">{pendingLoans.length} Pending Review</span>
             </div>
             <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto">
                {pendingLoans.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                     <ShieldCheck className="w-12 h-12 text-guava-green/20 mx-auto" />
                     <p className="text-sm font-bold text-gray-300 italic">Queue Cleared • Portal Balanced</p>
                  </div>
                ) : (
                  pendingLoans.map((loan) => (
                    <div key={loan.id} className="p-6 bg-gray-50 border border-gray-100 rounded-[32px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-guava-orange transition-all">
                       <div className="space-y-2">
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black bg-guava-dark text-white px-2 py-0.5 rounded uppercase tracking-widest">{loan.id}</span>
                             <span className="text-xs font-black text-guava-dark">{loan.purpose}</span>
                          </div>
                          <p className="text-xl font-black font-mono tracking-tighter">${loan.amount.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold ml-1">@ {loan.interestRate}%</span></p>
                          <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                             <span>Borrower: {loan.borrowerId}</span>
                             <span>•</span>
                             <span>Score: {loan.creditScoreSnapshot}</span>
                          </div>
                       </div>
                       <div className="flex gap-3 w-full md:w-auto">
                          <button 
                            onClick={() => handleLoanAction(loan.id, 'REJECT')}
                            className="flex-1 md:flex-none px-6 py-3 border-2 border-red-100 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                             <X className="w-4 h-4" />
                             Reject
                          </button>
                          <button 
                            onClick={() => handleLoanAction(loan.id, 'APPROVE')}
                            className="flex-1 md:flex-none px-6 py-3 bg-guava-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-guava-green transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                          >
                             <Check className="w-4 h-4" />
                             Approve
                          </button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                  <Database className="w-5 h-5 text-guava-orange" />
                  Portal Audit Trail
                </h3>
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{logs.length} Operations Captured</span>
                   <button 
                     onClick={async () => {
                       await auditService.clearLogs();
                       setLogs([]);
                     }}
                     className="text-[10px] font-black uppercase text-red-500 hover:scale-105 transition-transform"
                   >
                     Purge Logs
                   </button>
                </div>
             </div>
             <div className="p-6 max-h-[500px] overflow-y-auto">
               {logs.length === 0 ? (
                 <div className="py-20 text-center space-y-4">
                    <Clock className="w-12 h-12 text-gray-100 mx-auto" />
                    <p className="text-sm font-bold text-gray-300 italic">Centralized Logging Engine Idle...</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {logs.map((log) => (
                     <div key={log.id} className="flex gap-4 p-4 text-xs font-mono border border-gray-50 hover:border-guava-orange/20 hover:bg-gray-50/50 transition-all rounded-2xl group relative overflow-hidden">
                       <div className={cn(
                         "w-1 self-stretch rounded-full",
                         log.severity === 'CRITICAL' ? "bg-red-500" :
                         log.severity === 'WARNING' ? "bg-guava-orange" : "bg-guava-green"
                       )} />
                       
                       <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <span className="text-guava-dark font-black tracking-tighter">
                                   {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                  log.severity === 'CRITICAL' ? "bg-red-500 text-white" :
                                  log.severity === 'WARNING' ? "bg-guava-orange text-white" : "bg-guava-green text-white"
                                )}>
                                   {log.eventType}
                                </span>
                             </div>
                             <span className="text-[8px] text-gray-400 font-bold">{log.userEmail}</span>
                          </div>
                          <p className="text-gray-600 font-medium leading-relaxed">{log.description}</p>
                          {log.metadata && (
                            <div className="p-2 bg-white rounded-lg border border-gray-100 text-[9px] text-gray-400 flex flex-wrap gap-x-4">
                               {Object.entries(log.metadata).map(([k, v]) => (
                                 <span key={k}>{k}: <span className="text-guava-dark font-bold">{String(v)}</span></span>
                               ))}
                            </div>
                          )}
                       </div>
                       
                       {log.severity === 'CRITICAL' && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-100 transition-opacity">
                             <ShieldCheck className="w-8 h-8 text-red-500" />
                          </div>
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-black p-8 rounded-[32px] text-white space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-3">
                 <Key className="w-5 h-5 text-orange-500" />
                 API Gateways
              </h4>
              <div className="space-y-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/30 transition-all">
                    <p className="text-[10px] font-black uppercase text-white/40 mb-1">SWIFT Integration</p>
                    <p className="text-xs font-mono">connected • tunnel_id: 8219</p>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-white/30 transition-all">
                    <p className="text-[10px] font-black uppercase text-white/40 mb-1">Stripe Payouts</p>
                    <p className="text-xs font-mono">active • batch_sync: on</p>
                 </div>
              </div>
              <button className="w-full py-4 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all">
                Integrations Center
              </button>
           </div>

           <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-3">
                 <Settings className="w-5 h-5 text-gray-400" />
                 Global Params
              </h4>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-2">
                       <span>Market Reserve Ratio</span>
                       <span className="text-black">15%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full">
                       <div className="h-full bg-black w-[15%]" />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-2">
                       <span>Daily Disbursement Limit</span>
                       <span className="text-black">$45M / $50M</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full">
                       <div className="h-full bg-orange-500 w-[90%]" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
