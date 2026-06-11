import { firestoreService } from '../services/firestoreService';
import { LoanStatus } from '../types';
import { useState } from 'react';
import { UserProfile, AuditEventType } from '../types';
import { calculateCreditScore, CreditScoreResult } from '../lib/gemini';
import { auditService } from '../lib/audit';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2,
  Settings2,
  Globe,
  Download,
  Target,
  Skull,
  Gavel
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface LoanApplicationProps {
  user: UserProfile;
}

function CreditGauge({ score }: { score: number }) {
  const data = [
    { value: score - 300 },
    { value: 900 - score }
  ];
  
  const COLORS = ['#f36d38', '#ffffff10'];

  return (
    <div className="relative w-full h-[200px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="80%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">ACX RESONANCE</p>
        <span className="text-4xl font-black text-white tracking-tighter">{score}</span>
      </div>
    </div>
  );
}

export default function LoanApplication({ user }: LoanApplicationProps) {
  const [step, setStep] = useState(1);
  const [isScoring, setIsScoring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreResult, setScoreResult] = useState<CreditScoreResult | null>(null);

  if (user.isBlacklisted || user.delinquencyStage === 'BLACKLISTED') {
    return (
      <div className="max-w-4xl mx-auto py-20 animate-in fade-in zoom-in duration-500">
        <div className="bg-black text-white rounded-[48px] p-16 text-center space-y-10 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="w-24 h-24 bg-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-red-600/20">
               <Skull className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-5xl font-black tracking-tighter">Application Portal Denied</h2>
              <p className="text-red-500 font-black uppercase tracking-[0.3em] text-xs">Node Status: Permanently Blacklisted</p>
            </div>
            <p className="text-gray-400 font-medium max-w-md mx-auto leading-relaxed italic">
              Your financial identity is currently flagged for serial delinquency or default. Access to new capital through the ACX global liquidity pool has been revoked by the portal governance.
            </p>
            <div className="pt-8 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                <Gavel className="w-4 h-4 text-red-600" />
                Legal Dispute Case #ACX-{Math.floor(Math.random() * 10000)}
              </div>
              <button className="text-sx font-black uppercase tracking-widest text-white/40 hover:text-white transition-all underline underline-offset-8">
                Appeal Portal Decision (Wait time: 180 Days)
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        </div>
      </div>
    );
  }
  
  const [errors, setErrors] = useState<{ purpose?: string }>({});
  const [formData, setFormData] = useState({
    amount: 10000,
    currency: user.currency || 'USD',
    purpose: '',
    duration: 12,
    industry: '',
    interestRate: 12
  });

  const validateStep1 = () => {
    const newErrors: { purpose?: string } = {};
    if (!formData.purpose.trim()) {
      newErrors.purpose = "Purpose is required";
    } else if (formData.purpose.trim().length < 3) {
      newErrors.purpose = "Purpose must be at least 3 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleScore = async () => {
    setIsScoring(true);
    // Simulate some alternative data collection
    const alternativeData = {
      socialMediaPresence: 'HIGH',
      transactionDiversity: 0.85,
      geospatialTrust: 'VERIFIED',
      inventoryTurnover: 4.2
    };

    const result = await calculateCreditScore(user, alternativeData);
    setScoreResult(result);
    setIsScoring(false);
    setStep(3);

    await auditService.log(
      user,
      AuditEventType.CREDIT_SCORED,
      `AI Credit Score generated: ${result.score}`,
      'INFO',
      { score: result.score, riskLevel: result.riskLevel }
    );
  };

  const handleSubmitApplication = async () => {
    if (!scoreResult) return;
    setIsSubmitting(true);
    try {
      await firestoreService.createLoan({
        borrowerId: user.uid,
        amount: formData.amount,
        currency: formData.currency,
        purpose: formData.purpose,
        durationMonths: formData.duration,
        interestRate: formData.interestRate,
        status: LoanStatus.PENDING,
        creditScoreSnapshot: scoreResult.score,
        alternativeDataMetrics: {
          riskLevel: scoreResult.riskLevel,
          factors: scoreResult.factors
        }
      });

      await auditService.log(
        user,
        AuditEventType.LOAN_APPLIED,
        `Loan application submitted: $${formData.amount}`,
        'CRITICAL',
        { amount: formData.amount, purpose: formData.purpose }
      );
      
      alert("Application Submitted for Market Bidding!");
      setFormData({
        amount: 10000,
        currency: user.currency || 'USD',
        purpose: '',
        duration: 12,
        industry: '',
        interestRate: 12
      });
      setScoreResult(null);
      setStep(1); // Reset
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col items-center text-center space-y-4">
         <div className="w-16 h-16 bg-black text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-black/20">
           <Zap className="w-8 h-8" />
         </div>
         <h2 className="text-4xl font-black tracking-tighter">Instant Credit Generation</h2>
         <p className="text-gray-400 font-medium max-w-sm">Apply for international credit using our AI-driven risk assessment engine.</p>
      </div>

      <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-100 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Funding Amount (USD)</label>
                  <input 
                    type="number" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className="w-full text-4xl font-black font-mono border-b-2 border-gray-100 focus:border-black outline-none pb-2 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Duration (Months)</label>
                  <input 
                    type="number" 
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                    className="w-full text-4xl font-black font-mono border-b-2 border-gray-100 focus:border-black outline-none pb-2 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target Interest Rate (%)</label>
                   <span className="text-3xl font-black font-mono text-black">{formData.interestRate}%</span>
                </div>
                <div className="relative pt-2">
                  <input 
                    type="range" 
                    min="5" 
                    max="20" 
                    step="0.1"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({...formData, interestRate: Number(e.target.value)})}
                    className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-black"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-[9px] font-bold text-gray-300">Minimum 5%</span>
                    <span className="text-[9px] font-bold text-gray-300">Maximum 20%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Primary Purpose</label>
                 <div className="flex flex-wrap gap-2 mb-2">
                   {['Working Capital', 'Equipment', 'Inventory', 'Expansion', 'Refinancing'].map(p => (
                     <button 
                       key={p}
                       type="button"
                       onClick={() => {
                         setFormData({...formData, purpose: p});
                         setErrors({...errors, purpose: undefined});
                       }}
                       className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                         formData.purpose === p ? 'border-guava-orange bg-guava-orange text-white' : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                       }`}
                     >
                       {p}
                     </button>
                   ))}
                 </div>
                 <div className="relative">
                   <input 
                     type="text" 
                     value={formData.purpose}
                     onChange={(e) => {
                       setFormData({...formData, purpose: e.target.value});
                       if (e.target.value.trim().length >= 3) {
                         setErrors({...errors, purpose: undefined});
                       }
                     }}
                     placeholder="Describe the purpose of your capital requirement..."
                     className={`w-full px-6 py-4 bg-gray-50 border rounded-2xl text-sm font-black outline-none transition-all ${
                       errors.purpose ? 'border-red-500 bg-red-50/10' : 'border-gray-100 focus:border-black'
                     }`}
                   />
                   {errors.purpose && (
                     <p className="absolute -bottom-5 left-4 text-[9px] font-black text-red-500 uppercase tracking-tighter">
                       {errors.purpose}
                     </p>
                   )}
                 </div>
              </div>

              <button 
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2);
                  }
                }}
                className="w-full py-5 bg-guava-orange text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-guava-orange/20"
              >
                Continue Application
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4 py-8">
                 <div className="relative inline-block">
                    <Loader2 className="w-20 h-20 text-black animate-spin opacity-10" strokeWidth={1} />
                    <Settings2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-black animate-pulse" />
                 </div>
                 <h3 className="text-2xl font-black tracking-tight">Intelligence Verification</h3>
                 <p className="text-gray-400 text-sm max-w-xs mx-auto">
                   Our AI is analyzing alternative data points from 42+ global directories to optimize your credit score.
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="text-xs font-black uppercase">KYC Identity</p>
                      <p className="text-[10px] text-gray-400">Verified • Biometric Match</p>
                    </div>
                 </div>
                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <Globe className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="text-xs font-black uppercase">Tax Residency</p>
                      <p className="text-[10px] text-gray-400">Verified • Jurisdiction: EU</p>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="px-8 py-5 border-2 border-gray-100 rounded-3xl font-black text-gray-400 hover:border-guava-orange hover:text-guava-orange transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleScore}
                  disabled={isScoring}
                  className="flex-1 py-5 bg-guava-orange text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-guava-orange/20 disabled:opacity-50"
                >
                  {isScoring ? 'Analyzing...' : 'Generate AI Credit Score'}
                  <Zap className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && scoreResult && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
               <div className="bg-[#1A1A1A] p-10 rounded-[40px] text-white text-center relative overflow-hidden">
                  <CreditGauge score={scoreResult.score} />
                  <div className={`mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase border ${
                     scoreResult.riskLevel === 'LOW' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                     scoreResult.riskLevel === 'MEDIUM' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                     'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    <ShieldCheck className="w-3 h-3" />
                    {scoreResult.riskLevel} RISK PROFILE
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col items-center">
                     <h4 className="w-full text-xs font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-4 mb-4 flex items-center justify-between">
                        AI Factor Breakdown
                        <Target className="w-4 h-4 text-guava-orange" />
                     </h4>
                     <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scoreResult.factors}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="factor" tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                              <Radar
                                 name="Score"
                                 dataKey="score"
                                 stroke="#f36d38"
                                 fill="#f36d38"
                                 fillOpacity={0.6}
                              />
                           </RadarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Analysis Factors</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {scoreResult.factors.map((f, i) => (
                        <div key={i} className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">{f.factor}</span>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded ${
                              f.impact === 'POSITIVE' ? 'bg-green-100 text-green-600' :
                              f.impact === 'NEGATIVE' ? 'bg-red-100 text-red-600' :
                              'bg-gray-200 text-gray-500'
                            }`}>
                              {f.impact}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-black" style={{ width: `${f.score}%` }} />
                             </div>
                             <span className="text-[10px] font-black">{f.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="p-6 bg-orange-50 border-2 border-orange-100 rounded-3xl flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-orange-900 mb-1">AI Recommendation</p>
                    <p className="text-xs text-orange-800 leading-relaxed opacity-80">{scoreResult.reasoning}</p>
                  </div>
               </div>

               <div className="flex gap-4">
                  <button 
                    onClick={async () => {
                      const content = `ACX CREDIT SCORE REPORT\nScore: ${scoreResult.score}\nRisk: ${scoreResult.riskLevel}\nReasoning: ${scoreResult.reasoning}`;
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `ACX_Credit_Score_${user.displayName.split(' ')[0]}.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);

                      try {
                        await fetch('/api/notify/download', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            type: 'AI Credit Score Report', 
                            email: user.email, 
                            userName: user.displayName 
                          })
                        });
                        alert(`Credit score report downloaded. A notification has been sent to ${user.email}`);
                      } catch (e) {
                         console.error("Notify fail", e);
                      }
                    }}
                    className="flex-1 py-5 border-2 border-guava-orange text-guava-orange rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-guava-orange hover:text-white transition-all shadow-lg shadow-guava-orange/10 cursor-pointer"
                  >
                     <Download className="w-5 h-5" />
                     Download Score
                  </button>
                  <button 
                    onClick={() => setStep(2)}
                    className="px-8 py-5 border-2 border-gray-100 rounded-3xl font-black text-gray-400 hover:border-guava-orange hover:text-guava-orange transition-all cursor-pointer"
                  >
                    Recalculate
                  </button>
                  <button 
                    onClick={handleSubmitApplication}
                    disabled={isSubmitting}
                    className="flex-1 py-5 bg-guava-orange text-white rounded-3xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-guava-orange/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Submitting...' : 'Publish to Marketplace'}
                    {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Abstract background flare */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gray-50 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}
