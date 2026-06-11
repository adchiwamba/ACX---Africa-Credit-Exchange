import { useState } from 'react';
import { UserProfile, AuditEventType } from '../types';
import { auditService } from '../lib/audit';
import { useTheme } from '../lib/ThemeContext';
import { useNotify } from '../lib/NotificationContext';
import { 
  User, 
  Shield, 
  Bell, 
  Database, 
  Smartphone, 
  Lock,
  Eye,
  Fingerprint,
  Zap,
  Server,
  Sun,
  Moon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsProps {
  user: UserProfile;
}

export default function Settings({ user }: SettingsProps) {
  const { theme, setTheme } = useTheme();
  const { notify } = useNotify();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'keys' | 'data' | 'devices'>('profile');

  const handleCommitChanges = async () => {
    await auditService.log(
      user,
      AuditEventType.SYSTEM_CONFIG_CHANGED,
      'System configuration updated by user',
      'WARNING'
    );
    notify('success', 'Configuration Committed', 'Changes have been synchronized across the ACX mesh.');
  };

  const updateTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    notify('info', 'Visual Portal Updated', `Switched to Portal ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`);
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
           <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-guava-orange rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">ACX Core Configuration</span>
           </div>
           <h2 className="text-5xl font-black tracking-tighter text-guava-dark dark:text-white">System Config</h2>
           <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mt-2">Personalize your node preferences and portal interaction depth.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navigation */}
        <div className="lg:col-span-1 space-y-2">
           <SettingsNav 
             icon={User} 
             label="Profile Node" 
             active={activeTab === 'profile'} 
             onClick={() => setActiveTab('profile')} 
           />
           <SettingsNav 
             icon={Bell} 
             label="Notifications" 
             active={activeTab === 'notifications'} 
             onClick={() => setActiveTab('notifications')} 
           />
           <SettingsNav 
             icon={Shield} 
             label="Portal Security" 
             active={activeTab === 'security'} 
             onClick={() => setActiveTab('security')} 
           />
           <SettingsNav 
             icon={Fingerprint} 
             label="Identity Keys" 
             active={activeTab === 'keys'} 
             onClick={() => setActiveTab('keys')} 
           />
           <SettingsNav 
             icon={Database} 
             label="Data Sovereignty" 
             active={activeTab === 'data'} 
             onClick={() => setActiveTab('data')} 
           />
           <SettingsNav 
             icon={Smartphone} 
             label="Connected Devices" 
             active={activeTab === 'devices'} 
             onClick={() => setActiveTab('devices')} 
           />
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-12">
           {activeTab === 'profile' && (
             <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                {/* Theme Switcher Section */}
                <div className="bg-white dark:bg-[#1E293B] rounded-[48px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
                   <div className="p-8 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                      <h3 className="text-xl font-black text-guava-dark dark:text-white">Interface Aesthetics</h3>
                      <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 mt-1">Configure your terminal visual portal</p>
                   </div>
                   <div className="p-10 space-y-8">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <button 
                         onClick={() => updateTheme('light')}
                         className={cn(
                           "flex items-center gap-6 p-6 rounded-3xl border-2 transition-all group text-left",
                           theme === 'light' 
                             ? "border-guava-orange bg-guava-orange/5" 
                             : "border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:border-gray-200 dark:hover:border-white/10"
                         )}
                       >
                         <div className={cn(
                           "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all",
                           theme === 'light' ? "bg-white text-guava-orange" : "bg-white dark:bg-white/10 text-gray-400"
                         )}>
                           <Sun className="w-7 h-7" />
                         </div>
                         <div>
                           <p className={cn("text-lg font-black", theme === 'light' ? "text-guava-dark" : "text-gray-400")}>Portal Light</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">High visibility mode</p>
                         </div>
                       </button>

                       <button 
                         onClick={() => updateTheme('dark')}
                         className={cn(
                           "flex items-center gap-6 p-6 rounded-3xl border-2 transition-all group text-left",
                           theme === 'dark' 
                             ? "border-guava-orange bg-guava-orange/5" 
                             : "border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:border-gray-200 dark:hover:border-white/10"
                         )}
                       >
                         <div className={cn(
                           "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all",
                           theme === 'dark' ? "bg-guava-dark text-guava-orange" : "bg-white dark:bg-white/10 text-gray-400"
                         )}>
                           <Moon className="w-7 h-7" />
                         </div>
                         <div>
                           <p className={cn("text-lg font-black", theme === 'dark' ? "text-white" : "text-gray-400")}>Portal Dark</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Eye-strain reduction</p>
                         </div>
                       </button>
                     </div>
                   </div>
                </div>

                <div className="bg-white dark:bg-[#1E293B] rounded-[48px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
                   <div className="p-8 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                      <h3 className="text-xl font-black text-guava-dark dark:text-white">Portal Identity</h3>
                      <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 dark:text-gray-500 mt-1">Managed via decentralized ID portal C-42</p>
                   </div>
                   <div className="p-10 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-4">Public Display Alias</label>
                            <input 
                              type="text" 
                              defaultValue={user.displayName}
                              className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                            />
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 ml-4">Portal Role</label>
                            <input 
                              type="text" 
                              defaultValue={user.role}
                              disabled
                              className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black text-gray-400 cursor-not-allowed italic"
                            />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'notifications' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-white dark:bg-[#1E293B] rounded-[48px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden p-10">
                   <h3 className="text-xl font-black text-guava-dark dark:text-white mb-8">Signal Configuration</h3>
                   <div className="space-y-6">
                      {[
                        { label: 'Network Alerts', desc: 'Critical portal status and risk updates', status: 'Active' },
                        { label: 'Transaction Pings', desc: 'Real-time liquidity move notifications', status: 'Active' },
                        { label: 'Loan Status Updates', desc: 'Instant transmission on approval or rejection', status: 'Active' },
                        { label: 'Security Breaches', desc: 'Instant transmission on unauthorized node access', status: 'Forced' },
                        { label: 'Marketing Comms', desc: 'New asset class listings and portal news', status: 'Inactive' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-3xl group hover:border-guava-orange border border-transparent transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white dark:bg-white/10 rounded-xl flex items-center justify-center">
                                 <Bell className="w-5 h-5 text-gray-400" />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-guava-dark dark:text-white">{item.label}</p>
                                 <p className="text-[10px] font-bold text-gray-400">{item.desc}</p>
                              </div>
                           </div>
                           <button className={cn(
                             "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                             item.status === 'Active' ? "bg-guava-green/10 text-guava-green" :
                             item.status === 'Forced' ? "bg-red-500/10 text-red-500" :
                             "bg-gray-100 dark:bg-white/10 text-gray-400"
                           )}>
                              {item.status}
                           </button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'security' && (
             <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-white dark:bg-[#1E293B] rounded-[48px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-colors">
                   <div className="p-8 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                      <h3 className="text-xl font-black text-guava-dark dark:text-white">Portal Security</h3>
                      <span className="text-[10px] font-black uppercase tracking-widest text-guava-green flex items-center gap-2">
                         <Zap className="w-3 h-3 animate-pulse" />
                         Active Shield
                      </span>
                   </div>
                   <div className="p-8 divide-y divide-gray-50 dark:divide-white/5">
                      <div className="py-6 flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-guava-dark dark:group-hover:bg-white/20 transition-all">
                               <Eye className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-white" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-guava-dark dark:text-white">Privacy Mode</p>
                               <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Obfuscate balance in public terminals</p>
                            </div>
                         </div>
                         <button className="text-[10px] font-black uppercase tracking-widest text-guava-orange">Configure</button>
                      </div>
                      <div className="py-6 flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-guava-dark dark:group-hover:bg-white/20 transition-all">
                               <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-white" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-guava-dark dark:text-white">Two-Factor Encryption</p>
                               <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Required for principal withdrawals</p>
                            </div>
                         </div>
                         <button className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Established</button>
                      </div>
                      <div className="py-6 flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-guava-dark dark:group-hover:bg-white/20 transition-all">
                               <Server className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-white" />
                            </div>
                            <div>
                               <p className="text-sm font-black text-guava-dark dark:text-white">Web3 Wallet Connection</p>
                               <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">MetaMask and Ledger support</p>
                            </div>
                         </div>
                         <button className="text-[10px] font-black uppercase tracking-widest text-guava-orange">Sync Node</button>
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-guava-dark dark:bg-black rounded-[32px] text-white flex items-center justify-between group">
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                         <Fingerprint className="w-7 h-7 text-guava-orange" />
                      </div>
                      <div>
                         <h4 className="text-lg font-black">Biometric Authentication</h4>
                         <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-1">FaceID / TouchID Enforcement</p>
                      </div>
                   </div>
                   <div className="w-12 h-6 bg-guava-green rounded-full relative shadow-lg shadow-guava-green/20">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'keys' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-white dark:bg-[#1E293B] rounded-[48px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden p-10">
                   <h3 className="text-xl font-black text-guava-dark dark:text-white mb-8">Node Identity Keys</h3>
                   <div className="space-y-6">
                      <div className="p-8 bg-gray-50 dark:bg-white/5 rounded-[32px] border border-dashed border-gray-200 dark:border-white/10">
                         <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Master Signing Key</span>
                            <span className="px-2 py-1 bg-guava-green/10 text-guava-green text-[8px] font-black uppercase rounded text-center">Verified</span>
                         </div>
                         <code className="text-xs font-mono text-guava-dark dark:text-white block break-all">
                            acx_node_master_pk_9a2f2...e1c4b8d7f9a2
                         </code>
                         <div className="flex gap-4 mt-6">
                            <button className="text-[10px] font-black uppercase tracking-widest text-guava-orange">Rotate Key</button>
                            <button className="text-[10px] font-black uppercase tracking-widest text-gray-400">View Public Copy</button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'data' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-white dark:bg-[#1E293B] rounded-[48px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden p-10">
                   <h3 className="text-xl font-black text-guava-dark dark:text-white mb-8">Data Governance</h3>
                   <div className="p-8 bg-orange-50 dark:bg-orange-500/5 rounded-3xl border border-orange-100 dark:border-orange-500/10 mb-8">
                      <p className="text-sm font-bold text-guava-dark dark:text-white">Your data is stored locally on this node and encrypted via your identity key.</p>
                      <p className="text-xs text-gray-500 mt-2">ACX Portal never transmits unencrypted financial data to the central mesh.</p>
                   </div>
                   
                   <div className="space-y-8">
                     <div className="space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Database Explorer</h4>
                        <p className="text-xs text-gray-500">Manual inspection of your account document in the ACX Mesh (Firestore).</p>
                        <div className="relative">
                          <pre className="w-full bg-slate-900 text-guava-green p-6 rounded-3xl text-[10px] font-mono overflow-auto max-h-[400px] border border-white/10 shadow-2xl">
                            {JSON.stringify(user, null, 2)}
                          </pre>
                          <div className="absolute top-4 right-4 flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          </div>
                        </div>
                     </div>

                     <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Data Controls</h4>
                        <div className="space-y-4">
                          {[
                            { label: 'Audit Log Persistence', val: '90 Days' },
                            { label: 'Encrypted Cloud Proxy', val: 'Disabled' },
                            { label: 'Anonymous Mesh Contribution', val: 'Opt-in' }
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-4 border-b border-gray-50 dark:border-white/5 last:border-0">
                               <span className="text-sm font-bold text-guava-dark dark:text-white">{item.label}</span>
                               <span className="text-[10px] font-black uppercase tracking-widest text-guava-orange">{item.val}</span>
                            </div>
                          ))}
                        </div>
                     </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'devices' && (
             <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-white dark:bg-[#1E293B] rounded-[48px] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden p-10">
                   <h3 className="text-xl font-black text-guava-dark dark:text-white mb-8">Authorized Hardware</h3>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-3xl">
                         <div className="flex items-center gap-4">
                            <Smartphone className="w-8 h-8 text-guava-orange" />
                            <div>
                               <p className="text-sm font-black text-guava-dark dark:text-white">iPhone 15 Pro (Primary Node)</p>
                               <p className="text-[10px] font-bold text-guava-green">Currently Online</p>
                            </div>
                         </div>
                         <button className="text-[10px] font-black uppercase tracking-widest text-red-500">Deauthorize</button>
                      </div>
                      <button className="w-full py-4 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-guava-orange hover:text-guava-orange transition-all">
                         Register New Device
                      </button>
                   </div>
                </div>
             </div>
           )}

           <div className="flex justify-end gap-6 pt-6">
              <button className="px-10 py-5 text-gray-400 text-xs font-black uppercase tracking-widest hover:text-guava-dark transition-all">
                 Revert Defaults
              </button>
              <button 
                onClick={handleCommitChanges}
                className="px-10 py-5 bg-guava-dark text-white rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-guava-orange transition-all shadow-xl shadow-guava-orange/20"
              >
                 Commit Changes
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SettingsNav({ icon: Icon, label, active = false, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all group border-2",
        active 
          ? "bg-white dark:bg-[#1E293B] border-guava-dark shadow-sm" 
          : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-gray-400 hover:text-guava-dark dark:hover:text-white"
      )}
    >
       <div className="flex items-center gap-4">
          <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-guava-dark dark:text-white" : "text-gray-300 dark:text-gray-600 group-hover:text-guava-dark dark:group-hover:text-white")} />
          <span className="text-[10px] font-black tracking-widest uppercase">{label}</span>
       </div>
       {active && <div className="w-1.5 h-1.5 bg-guava-orange rounded-full animate-bounce" />}
    </button>
  );
}
