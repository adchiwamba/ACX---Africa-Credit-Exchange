import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, ArrowRight, CreditCard, Phone, RefreshCw, Zap } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => void;
}

export default function DepositModal({ isOpen, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState('1000');
  const [method, setMethod] = useState<'BANK' | 'CRYPTO' | 'WIRE' | 'MOBILE' | 'RESONANCE'>('BANK');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      onDeposit(numAmount);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-[#0F172A] w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl relative border border-white/5"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all text-gray-400 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSubmit} className="p-8 md:p-10 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-guava-orange/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-guava-orange" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tighter italic dark:text-white uppercase">Increase Liquidity</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Portal Node Deposit</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-guava-orange/5 border border-guava-orange/20 rounded-2xl">
                <p className="text-[10px] text-guava-orange font-bold uppercase tracking-wide leading-relaxed">
                  Funds will be credited to your internal portal node. You can use this balance to settle active loan obligations in the Repayments terminal.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Amount to Deposit (USD)</label>
                  <div className="relative">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">$</span>
                    <input
                      type="number"
                      autoFocus
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-14 pr-8 py-5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl text-3xl font-black font-mono outline-none focus:border-guava-orange transition-all dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Funding Source</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'BANK', label: 'Direct Bank Transfer', icon: CreditCard },
                      { id: 'WIRE', label: 'SWIFT / FedWire', icon: DollarSign },
                      { id: 'CRYPTO', label: 'USDC / USDT Stable', icon: Zap },
                      { id: 'MOBILE', label: 'Mobile Money (MTN / Ecocash)', icon: Phone },
                      { id: 'RESONANCE', label: 'Resonance Mirror Sync', icon: RefreshCw },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMethod(item.id as 'BANK' | 'CRYPTO' | 'WIRE' | 'MOBILE' | 'RESONANCE')}
                        className={`flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all ${
                          method === item.id
                            ? 'border-guava-orange bg-guava-orange/5 text-guava-dark dark:text-white'
                            : 'border-gray-50 dark:border-white/5 hover:border-gray-200 text-gray-400'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 ${method === item.id ? 'text-guava-orange' : ''}`} />
                        <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-guava-dark text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-guava-orange/10 flex items-center justify-center gap-2 group"
                >
                  Verify & Commit Funds
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
