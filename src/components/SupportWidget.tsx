import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  BookOpen, 
  ChevronRight, 
  Send,
  Zap,
  Shield,
  Globe,
  LifeBuoy,
  LucideIcon
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FAQS = [
  {
    q: "How is my ACX resonance score calculated?",
    a: "ACX engine analyses your financial identity, capital deployment history, and behavior within the portal to generate a dynamic score reflecting your credit resonance in the African ecosystem."
  },
  {
    q: "What are the portal fees?",
    a: "ACX charges a flat 0.5% settlement fee on all principal transactions. This fee is used to secure the liquidity pool and incentivize node validators."
  },
  {
    q: "Is my data stored on-chain?",
    a: "Only cryptographic proof of your identity and creditworthiness is stored on-chain. Sensitive PII (Personally Identifiable Information) remains encrypted in your private sovereign node."
  },
  {
    q: "How do I withdraw my capital?",
    a: "Capital can be withdrawn at any time if it is not locked in active loan contracts. Go to your Portfolio page and initiate a 'Node Withdrawal' request."
  }
];

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'faq' | 'contact'>('home');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    setTimeout(() => setFormStatus('sent'), 1500);
  };

  const topics: Record<string, { title: string, content: string }> = {
    'Portal Documentation': {
      title: 'Portal Documentation',
      content: 'The ACX Portal involves a multi-layer consensus engine based on Proof-of-Resonance across African economies. View our Whitepaper v2.1 for details on liquidity provision, resonance scoring, and node synchronization. Our APIs follow RESTful patterns with JSON-LD support for semantic financial graphs. SDKs are available for Node.js (acx-sdk), Python (acx-py), and Rust (acx-rs).'
    },
    'Security & Compliance': {
      title: 'Security & Compliance',
      content: 'ACX utilizes Zero-Knowledge Proofs (ZKPs) and Secure Multi-Party Computation (SMPC) to verify borrower identity without exposing PII. Our security audits are performed by top-tier cryptographic firms like Quantstamp and Trail of Bits. Ensure your node entropy is set to maximum and your identity keys are backed up in a secure vault.'
    },
    'Marketplace Status': {
      title: 'Marketplace Status',
      content: 'Network utilization is currently at 84.32%, indicating strong liquidity demand. Average APY for liquidity providers is 9.2%. 24h Volume: $4,240,192. Active Nodes: 12,402. All portal subsystems are fully operational with 99.99% uptime recorded in the last 30 days.'
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            className="absolute bottom-24 right-0 w-[400px] bg-white dark:bg-[#1E293B] rounded-[40px] border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden flex flex-col transition-colors"
          >
            {/* Header */}
            <div className="p-8 bg-guava-orange text-white relative overflow-hidden shrink-0">
               <div className="relative z-10 flex justify-between items-start">
                  <div 
                    className="cursor-pointer group/header" 
                    onClick={() => {
                      setSelectedTopic(null);
                      setActiveTab('home');
                    }}
                  >
                     <h3 className="text-2xl font-black tracking-tighter group-hover/header:text-guava-orange transition-colors">Portal Support</h3>
                     <p className="text-[10px] uppercase font-black tracking-widest opacity-50 mt-1">ACX Node Assistance AI v2.4</p>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
               </div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-guava-orange/20 rounded-full blur-3xl" />
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-50 dark:border-white/5">
               {(['home', 'faq', 'contact'] as const).map((tab) => (
                 <button
                   key={tab}
                   onClick={() => {
                     setActiveTab(tab);
                     setFormStatus('idle');
                     setSelectedTopic(null);
                   }}
                   className={cn(
                     "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
                     activeTab === tab 
                      ? "text-guava-orange border-b-2 border-guava-orange bg-guava-orange/5" 
                      : "text-gray-400 dark:text-gray-500 hover:text-guava-dark dark:hover:text-white"
                   )}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {/* Content Area */}
            <div className="p-8 h-[400px] overflow-y-auto custom-scrollbar">
               {activeTab === 'home' && (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }} 
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-6"
                 >
                    {selectedTopic ? (
                      <div className="space-y-4">
                        <button 
                          onClick={() => setSelectedTopic(null)}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-guava-orange hover:underline mb-2"
                        >
                          <ChevronRight className="w-3 h-3 rotate-180" /> Back to Dashboard
                        </button>
                        <h4 className="text-xl font-black text-guava-dark dark:text-white">{topics[selectedTopic].title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                          {topics[selectedTopic].content}
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Welcome to the ACX Support Terminal. How can we optimize your session today?</p>
                        
                        <div className="grid grid-cols-1 gap-4">
                           <MenuButton 
                             icon={BookOpen} 
                             title="Portal Documentation" 
                             desc="Deep-dive into whitepapers & SDKs"
                             onClick={() => setSelectedTopic('Portal Documentation')}
                           />
                           <MenuButton 
                             icon={Shield} 
                             title="Security & Compliance" 
                             desc="Verify node integrity portals"
                             onClick={() => setSelectedTopic('Security & Compliance')}
                           />
                           <MenuButton 
                             icon={Globe} 
                             title="Marketplace Status" 
                             desc="Real-time network liquidity updates"
                             onClick={() => setSelectedTopic('Marketplace Status')}
                           />
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                           <div className="flex items-center gap-3 mb-2">
                              < Zap className="w-4 h-4 text-guava-orange" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-guava-dark dark:text-white">Pro Tip</span>
                           </div>
                           <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold leading-relaxed">
                             Enable "Automated Settlement" in System Config to ensure your resonance score never drops due to latency.
                           </p>
                        </div>
                      </>
                    )}
                 </motion.div>
               )}

               {activeTab === 'faq' && (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }} 
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-6"
                 >
                    {FAQS.map((faq, i) => (
                      <div key={i} className="space-y-2 group">
                         <h4 className="text-sm font-black text-guava-dark dark:text-white flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 text-guava-orange" />
                            {faq.q}
                         </h4>
                         <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-5 font-medium">{faq.a}</p>
                      </div>
                    ))}
                    <button 
                      onClick={() => setSelectedTopic('Portal Documentation')}
                      className="w-full py-4 border-2 border-gray-50 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-guava-dark dark:hover:text-white transition-all"
                    >
                       Search Knowledge Base
                    </button>
                 </motion.div>
               )}

               {activeTab === 'contact' && (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }} 
                   animate={{ opacity: 1, x: 0 }}
                 >
                    {formStatus === 'sent' ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-10">
                         <div className="w-16 h-16 bg-guava-green/10 rounded-full flex items-center justify-center">
                            <Send className="w-8 h-8 text-guava-green" />
                         </div>
                         <h4 className="text-xl font-black text-guava-dark dark:text-white">Transmission Successful</h4>
                         <p className="text-xs text-gray-400 font-bold">Portal agents will respond within 4 business hours.</p>
                         <button 
                           onClick={() => setFormStatus('idle')}
                           className="text-[10px] font-black uppercase text-guava-orange hover:underline pt-4"
                         >
                           Send another message
                         </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Subject Node</label>
                            <select className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white">
                               <option>Technical Issue</option>
                               <option>Liquidity Query</option>
                               <option>Identity Verification</option>
                               <option>Portal Suggestion</option>
                            </select>
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Message Body</label>
                            <textarea 
                              required
                              placeholder="Describe your inquiry..."
                              className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black h-32 outline-none focus:border-guava-orange transition-all dark:text-white resize-none"
                            />
                         </div>
                         <button 
                           disabled={formStatus === 'sending'}
                           className="w-full py-5 bg-guava-dark dark:bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-guava-orange transition-all shadow-xl shadow-guava-orange/10 flex items-center justify-center gap-3"
                         >
                           {formStatus === 'sending' ? 'Transmitting...' : (
                             <>
                               Initiate Contact
                               <Send className="w-4 h-4" />
                             </>
                           )}
                         </button>
                      </form>
                    )}
                 </motion.div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-300",
          isOpen 
            ? "bg-guava-dark dark:bg-black text-white rotate-90" 
            : "bg-guava-orange text-white"
        )}
      >
        {isOpen ? <X className="w-8 h-8" /> : <LifeBuoy className="w-8 h-8" />}
      </motion.button>
    </div>
  );
}

function MenuButton({ icon: Icon, title, desc, onClick }: { icon: LucideIcon, title: string, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-gray-50 dark:border-white/10 rounded-2xl hover:border-guava-orange/30 group transition-all"
    >
       <div className="flex items-center gap-4 text-left">
          <div className="p-3 bg-gray-50 dark:bg-white/10 rounded-xl group-hover:bg-guava-dark dark:group-hover:bg-white/20 transition-all">
             <Icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </div>
          <div>
             <h4 className="text-xs font-black text-guava-dark dark:text-white">{title}</h4>
             <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">{desc}</p>
          </div>
       </div>
       <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-guava-dark dark:group-hover:text-white transition-all" />
    </button>
  );
}
