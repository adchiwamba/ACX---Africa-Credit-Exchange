import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Percent, ShieldCheck, Zap, ArrowRight, Activity } from 'lucide-react';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

interface LendingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export default function LendingOrderModal({ isOpen, onClose, user }: LendingOrderModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: 10000,
    minRate: 8.5,
    duration: 12,
    minCreditScore: 650,
    riskThreshold: 'MEDIUM',
    autoMatch: true,
    autoCompound: true,
    targetedMarkets: ['East Africa', 'West Africa', 'Southern Africa', 'North Africa']
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 2000);
  };

  const resetModal = () => {
    setStep(1);
    setIsSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#0F172A] rounded-[48px] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5"
          >
            <button
              onClick={resetModal}
              className="absolute top-8 right-8 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all text-gray-400 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {!isSuccess ? (
              <div className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-guava-orange/10 rounded-2xl flex items-center justify-center text-guava-orange">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tighter dark:text-white uppercase">Deploy Capital</h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Institutional Liquidity Order v2.1</p>
                  </div>
                </div>

                <div className="mb-10 flex gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-guava-orange' : 'bg-gray-100 dark:bg-white/5'}`} />
                  ))}
                </div>

                <div className="space-y-8">
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Commitment Amount (USD)</label>
                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                          <DollarSign className="w-8 h-8 text-guava-orange" />
                          <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                            className="bg-transparent text-4xl font-black font-mono outline-none w-full dark:text-white tracking-tighter"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 ml-4 uppercase">Available Wallet Balance: ${user.balance.toLocaleString()}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 space-y-2">
                          <div className="flex items-center gap-2 text-gray-400 mb-2">
                             <Percent className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Min. Yield</span>
                          </div>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.minRate}
                            onChange={(e) => setFormData({ ...formData, minRate: Number(e.target.value) })}
                            className="bg-transparent text-2xl font-black font-mono outline-none w-full dark:text-white"
                          />
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5 space-y-2">
                          <div className="flex items-center gap-2 text-gray-400 mb-2">
                             <ShieldCheck className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Min. Credit Score</span>
                          </div>
                          <input
                            type="number"
                            value={formData.minCreditScore}
                            onChange={(e) => setFormData({ ...formData, minCreditScore: Number(e.target.value) })}
                            className="bg-transparent text-2xl font-black font-mono outline-none w-full dark:text-white"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Risk Exposure Capacity</label>
                        <div className="grid grid-cols-3 gap-4">
                          {['LOW', 'MEDIUM', 'HIGH'].map(risk => (
                            <button
                              key={risk}
                              onClick={() => setFormData({ ...formData, riskThreshold: risk })}
                              className={cn(
                                "py-4 rounded-2xl text-[10px] font-black tracking-widest border-2 transition-all uppercase",
                                formData.riskThreshold === risk 
                                  ? "bg-guava-dark text-white border-guava-dark shadow-xl shadow-guava-orange/10" 
                                  : "bg-transparent text-gray-400 border-gray-100 dark:border-white/5"
                              )}
                            >
                              {risk}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Targeted Regional Nodes</label>
                        <div className="flex flex-wrap gap-2">
                          {['East Africa', 'West Africa', 'Southern Africa', 'Central Africa', 'North Africa', 'SADC', 'ECOWAS', 'EAC'].map(market => (
                            <button
                              key={market}
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  targetedMarkets: prev.targetedMarkets.includes(market)
                                    ? prev.targetedMarkets.filter(m => m !== market)
                                    : [...prev.targetedMarkets, market]
                                }));
                              }}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all uppercase",
                                formData.targetedMarkets.includes(market)
                                  ? "bg-guava-orange/10 text-guava-orange border-guava-orange"
                                  : "bg-gray-50 dark:bg-white/5 text-gray-400 border-transparent"
                              )}
                            >
                              {market}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-xs font-black uppercase dark:text-white">Auto-Compound</p>
                              <p className="text-[8px] text-gray-400 font-bold uppercase">Re-invest earnings</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setFormData({ ...formData, autoCompound: !formData.autoCompound })}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all relative",
                              formData.autoCompound ? "bg-guava-orange" : "bg-gray-200 dark:bg-white/10"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                              formData.autoCompound ? "right-1" : "left-1"
                            )} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-guava-orange" />
                            <div>
                              <p className="text-xs font-black uppercase dark:text-white">Auto-Match</p>
                              <p className="text-[8px] text-gray-400 font-bold uppercase">Instant capital deployment</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setFormData({ ...formData, autoMatch: !formData.autoMatch })}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all relative",
                              formData.autoMatch ? "bg-guava-orange" : "bg-gray-200 dark:bg-white/10"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                              formData.autoMatch ? "right-1" : "left-1"
                            )} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-8"
                    >
                      <div className="p-8 bg-guava-dark dark:bg-black rounded-[40px] text-white space-y-6 border border-white/5">
                        <SectionSummary label="Commitment" value={`$${formData.amount.toLocaleString()}`} />
                        <SectionSummary label="Yield Target" value={`${formData.minRate}% APR`} />
                        <SectionSummary label="Min Credit Score" value={`${formData.minCreditScore}+`} />
                        <SectionSummary label="Risk Profile" value={formData.riskThreshold} />
                        <SectionSummary label="Auto-Match" value={formData.autoMatch ? 'ENABLED' : 'MANUAL'} />
                      </div>

                      <div className="p-6 bg-orange-50 dark:bg-guava-orange/10 rounded-3xl border border-orange-100 dark:border-guava-orange/20 flex gap-4">
                        <ShieldCheck className="w-6 h-6 text-guava-orange shrink-0" />
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-guava-orange">Safety Portal Active</p>
                          <p className="text-[10px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed mt-1">
                            By confirming, you authorize the Africa Credit Exchange to lock the designated capital into the specialized lending pool. Gains are calculated daily and distributed according to the auto-compound logic.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="mt-12 flex gap-4">
                  {step > 1 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="flex-1 py-5 border border-gray-200 dark:border-white/10 rounded-3xl font-black text-xs uppercase tracking-widest dark:text-white"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
                    disabled={isSubmitting}
                    className="flex-2 py-5 bg-guava-dark text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-guava-orange transition-all shadow-xl shadow-guava-orange/20 flex items-center justify-center gap-2 group"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        {step === 3 ? 'Deploy Capital Now' : 'Continue'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center text-center space-y-8 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-guava-green/10 rounded-[40px] flex items-center justify-center text-guava-green shadow-xl shadow-guava-green/10">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-guava-dark dark:text-white italic tracking-tighter uppercase">Deployment Successful</h3>
                  <p className="text-gray-400 text-sm font-medium">Your lending order has been broadcasted to the global node network. Capital is now earning interest.</p>
                </div>

                <div className="w-full bg-gray-50 dark:bg-white/5 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Order ID</span>
                      <span className="text-[10px] font-black dark:text-white font-mono">ORD-029412-X</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Timestamp</span>
                      <span className="text-[10px] font-black dark:text-white font-mono">14:02:11 UTC</span>
                   </div>
                </div>

                <button
                  onClick={resetModal}
                  className="w-full py-5 bg-guava-dark text-white rounded-3xl font-black text-xs uppercase tracking-widest"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SectionSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/10 pb-4 last:border-0 last:pb-0">
      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</span>
      <span className="text-sm font-black italic tracking-tight">{value}</span>
    </div>
  );
}

function RefreshCw({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
