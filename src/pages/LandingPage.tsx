import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Shield, Zap, ArrowRight, Users, Landmark, Building, X, Phone, Lock, Cpu, Camera, Briefcase, UserPlus, Key, RefreshCw, FileText, User } from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { COUNTRIES, CURRENCIES, LANGUAGES } from '../constants/countries';
import { MOCK_USERS } from '../lib/store';

interface LandingPageProps {
  onLogin: (user: UserProfile) => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(1);
  const [, setIsVerifying2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [expectedCode, setExpectedCode] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    country: '',
    phoneCode: '',
    preferredCurrencies: [] as string[],
    languages: [] as string[],
    photoURL: '',
    organizationDetails: {
      companySize: '',
      contactPerson: '',
      industry: '',
      taxId: ''
    }
  });

  const [simulationActive, setSimulationActive] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFormFields = (keepRoleAndStep = false) => {
    setLoginEmail('');
    setLoginPassword('');
    setTwoFactorCode('');
    setExpectedCode(null);
    if (!keepRoleAndStep) {
      setSelectedRole(null);
      setStep(1);
    }
    setFormData({
      displayName: '',
      email: '',
      country: '',
      phoneCode: '',
      preferredCurrencies: [],
      languages: [],
      photoURL: '',
      organizationDetails: {
        companySize: '',
        contactPerson: '',
        industry: '',
        taxId: ''
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSimulationActive('photo');
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
        setSimulationActive(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Erase previous user inputs when auth modal opens, closes, or authMode changes
  useEffect(() => {
    setLoginEmail('');
    setLoginPassword('');
    setTwoFactorCode('');
    setExpectedCode(null);
    setFormData({
      displayName: '',
      email: '',
      country: '',
      phoneCode: '',
      preferredCurrencies: [],
      languages: [],
      photoURL: '',
      organizationDetails: {
        companySize: '',
        contactPerson: '',
        industry: '',
        taxId: ''
      }
    });

    if (!showAuthModal) {
      setSelectedRole(null);
      setStep(1);
    }
  }, [showAuthModal, authMode]);

  // Handle auto-depict: Country Code -> Country
  useEffect(() => {
    if (formData.phoneCode) {
      const match = COUNTRIES.find(c => c.phone === formData.phoneCode);
      if (match && match.name !== formData.country) {
        setFormData(prev => ({ ...prev, country: match.name }));
      }
    }
  }, [formData.phoneCode]);

  // Reciprocal: Country -> Country Code
  useEffect(() => {
    if (formData.country) {
      const match = COUNTRIES.find(c => c.name === formData.country);
      if (match && match.phone !== formData.phoneCode) {
        setFormData(prev => ({ ...prev, phoneCode: match.phone }));
      }
    }
  }, [formData.country]);

  const toggleCurrency = (cur: string) => {
    setFormData(prev => ({
      ...prev,
      preferredCurrencies: prev.preferredCurrencies.includes(cur)
        ? prev.preferredCurrencies.filter(c => c !== cur)
        : [...prev.preferredCurrencies, cur]
    }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const initiate2FA = async () => {
    setIsSendingCode(true);
    try {
      const response = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await response.json();
      if (data.success) {
        setExpectedCode(data.code);
        setStep(5);
        setIsVerifying2FA(true);
      }
    } catch (error) {
      console.error('Failed to initiate 2FA:', error);
      alert('Failed to connect to the authorization server.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyAndFinalize = () => {
    if (twoFactorCode !== expectedCode) {
      alert("Invalid code. Please enter the correct 6-digit synchronization key.");
      return;
    }

    const newUser: UserProfile = {
      uid: 'USR-' + Math.floor(Math.random() * 100000),
      email: formData.email || 'user@acx.africa',
      displayName: formData.displayName || 'Anonymous Node',
      role: selectedRole || UserRole.BORROWER,
      creditScore: selectedRole === UserRole.BORROWER ? 650 : 0,
      kycStatus: 'PENDING',
      currency: formData.preferredCurrencies[0] || 'USD',
      preferredCurrencies: formData.preferredCurrencies,
      balance: selectedRole === UserRole.LENDER ? 50000 : 1000,
      country: formData.country,
      phoneCode: formData.phoneCode,
      languages: formData.languages,
      photoURL: formData.photoURL,
      organizationDetails: selectedRole === UserRole.LENDER ? formData.organizationDetails : undefined,
      is2FAEnabled: true
    };
    onLogin(newUser);
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Check against mock users
    const user = MOCK_USERS.find(u => u.email === loginEmail);
    if (user) {
      // In a real app, we'd verify password here
      // For demo, we accept the mock users
      onLogin(user);
    } else {
      alert("Invalid credentials or user not found. Please register if you don't have an account.");
    }
  };

  const handleAdminLogin = () => {
    // Hidden admin login using password from environment (fallback to 'admin123' for demo)
    const secret = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
    if (adminPassword === secret) {
      const adminUser = MOCK_USERS.find(u => u.role === UserRole.ADMIN);
      if (adminUser) {
        onLogin(adminUser);
      }
    } else {
      setAdminPassword('');
      setAdminClicks(0);
      setShowAdminLogin(false);
      alert('Unauthorized access attempt logged.');
    }
  };

  const handleLogoClick = () => {
    const newCount = adminClicks + 1;
    setAdminClicks(newCount);
    if (newCount >= 7) {
      setShowAdminLogin(true);
      setAdminClicks(0);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-6"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white dark:bg-[#0F172A] w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl relative"
             >
                <button 
                   onClick={() => { setShowAuthModal(false); resetFormFields(); }}
                   className="absolute top-8 right-8 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all text-gray-400"
                >
                   <X className="w-6 h-6" />
                </button>

                <div className="p-6 md:p-8">
                   {authMode === 'register' ? (
                     <>
                       <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-2 flex-1 mr-4">
                               {[1, 2, 3, 4, 5].map(i => (
                                 <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-guava-orange' : 'bg-gray-100 dark:bg-white/5'}`} />
                               ))}
                            </div>
                            <button 
                              onClick={() => setAuthMode('login')}
                              className="text-[10px] font-black uppercase tracking-widest text-guava-orange hover:underline shrink-0"
                            >
                              Login Instead
                            </button>
                          </div>
                          <h2 className="text-3xl font-black tracking-tighter italic dark:text-white">Initialize Portal Node</h2>
                          <p className="text-gray-400 text-sm font-medium">
                            Step {step}: {
                              step === 1 ? 'Archetype' : 
                              step === 2 ? 'Identity' : 
                              step === 3 ? 'Localization' : 
                              step === 4 ? 'Profile Enrichment' : 
                              '2FA Authorization'
                            }
                          </p>
                       </div>

                       {step === 1 && (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {[
                              { role: UserRole.LENDER, title: 'Business', icon: Landmark, desc: 'Deploy capital, manage credit lines, or run merchant/retailer nodes.' },
                              { role: UserRole.BORROWER, title: 'Consumer', icon: User, desc: 'Initialize credit passport, borrow, or buy-now pay-later.' }
                            ].map(r => (
                              <button 
                                key={r.role}
                                onClick={() => { 
                                  localStorage.setItem('acx_preferred_role', r.role);
                                  setSelectedRole(r.role); 
                                  setStep(2); 
                                }}
                                className={`p-4 rounded-3xl border-2 text-left transition-all ${selectedRole === r.role ? 'border-guava-orange bg-orange-50/50' : 'border-gray-50 dark:border-white/5 hover:border-gray-200'}`}
                              >
                                 <r.icon className={`w-6 h-6 mb-3 ${selectedRole === r.role ? 'text-guava-orange' : 'text-gray-300'}`} />
                                 <h4 className="text-lg font-black italic mb-1 dark:text-white">{r.title}</h4>
                                 <p className="text-[10px] text-gray-400 font-medium">{r.desc}</p>
                              </button>
                            ))}
                         </div>
                       )}

                       {step === 2 && (
                         <div className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Name / Entity Name</label>
                               <input 
                                 type="text" 
                                 value={formData.displayName}
                                 onChange={e => setFormData({...formData, displayName: e.target.value})}
                                 placeholder="e.g. Phoenix Ventures"
                                 className="w-full px-6 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Communication Endpoint (Email)</label>
                               <input 
                                 type="email" 
                                 value={formData.email}
                                 onChange={e => setFormData({...formData, email: e.target.value})}
                                 placeholder="node@acx.africa"
                                 className="w-full px-6 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                               />
                            </div>
                            <div className="flex gap-4 pt-6">
                               <button onClick={() => setStep(1)} className="flex-1 py-5 border border-gray-100 rounded-3xl font-black text-xs uppercase tracking-widest text-gray-400">Back</button>
                               <button onClick={() => setStep(3)} className="flex-2 py-5 bg-guava-dark text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all hover:bg-guava-orange">Continue</button>
                            </div>
                         </div>
                       )}

                       {step === 3 && (
                         <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    <Phone className="w-3 h-3" /> Dial Code
                                  </label>
                                  <select 
                                    value={formData.phoneCode}
                                    onChange={e => setFormData({...formData, phoneCode: e.target.value})}
                                    className="w-full px-6 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white appearance-none"
                                  >
                                     <option value="" className="text-black">Select Code</option>
                                     {(COUNTRIES || []).map(c => <option key={c.code} value={c.phone} className="text-black">{c.phone} ({c.code})</option>)}
                                  </select>
                               </div>
                               <div className="space-y-2">
                                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    <Globe className="w-3 h-3" /> Host Nation
                                  </label>
                                  <select 
                                    value={formData.country}
                                    onChange={e => setFormData({...formData, country: e.target.value})}
                                    className="w-full px-6 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white appearance-none"
                                  >
                                     <option value="" className="text-black">Select Country</option>
                                     {(COUNTRIES || []).map(c => <option key={c.code} value={c.name} className="text-black">{c.name}</option>)}
                                  </select>
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Authorized Asset Classes (Currencies)</label>
                               <div className="flex flex-wrap gap-2">
                                  {CURRENCIES.map(cur => (
                                    <button 
                                      key={cur}
                                      onClick={() => toggleCurrency(cur)}
                                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${formData.preferredCurrencies.includes(cur) ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                       {cur}
                                    </button>
                                  ))}
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Operational Languages</label>
                               <div className="flex flex-wrap gap-2">
                                  {LANGUAGES.map(lang => (
                                    <button 
                                      key={lang}
                                      onClick={() => toggleLanguage(lang)}
                                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${formData.languages.includes(lang) ? 'bg-guava-green text-white border-guava-green' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                       {lang}
                                    </button>
                                  ))}
                               </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                               <button onClick={() => setStep(2)} className="flex-1 py-5 border border-gray-100 rounded-3xl font-black text-xs uppercase tracking-widest text-gray-400">Back</button>
                               <button onClick={() => setStep(4)} className="flex-2 py-5 bg-guava-dark text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all hover:bg-guava-orange">Continue</button>
                            </div>
                         </div>
                       )}

                       {step === 4 && (
                         <div className="space-y-6">
                            <div className="flex flex-col items-center gap-4">
                               <div className="relative group">
                                  <div className="w-32 h-32 bg-gray-50 dark:bg-white/5 rounded-[40px] border-4 border-dashed border-gray-100 dark:border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-guava-orange">
                                     {formData.photoURL ? (
                                       <img src={formData.photoURL} alt="Node Identity" className="w-full h-full object-cover" />
                                     ) : (
                                       <div className="text-center p-4">
                                          <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Upload Identity</p>
                                       </div>
                                     )}
                                  </div>
                                  <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={!!simulationActive}
                                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-guava-orange text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                                  >
                                    {simulationActive === 'photo' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                                  </button>
                                  <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    accept="image/*" 
                                    className="hidden" 
                                  />
                               </div>
                               <p className="text-[10px] font-bold text-gray-400 text-center max-w-[200px]">
                                  {selectedRole === UserRole.LENDER ? 'Institutional Logo or Seal' : 'Personal Identity Representation'}
                                </p>
                            </div>

                             {selectedRole === UserRole.LENDER && (
                               <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2">
                                        <Briefcase className="w-3 h-3" /> Industry
                                     </label>
                                     <select 
                                       value={formData.organizationDetails.industry}
                                       onChange={e => setFormData({...formData, organizationDetails: {...formData.organizationDetails, industry: e.target.value}})}
                                       className="w-full px-6 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                                     >
                                        <option value="">Select Industry</option>
                                        <option value="Fintech">Fintech</option>
                                        <option value="Retailer">Retailer</option>
                                        <option value="Traditional Banking">Traditional Banking</option>
                                        <option value="Venture Capital">Venture Capital</option>
                                        <option value="Private Equity">Private Equity</option>
                                     </select>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2">
                                        <Users className="w-3 h-3" /> Company Size
                                     </label>
                                     <select 
                                       value={formData.organizationDetails.companySize}
                                       onChange={e => setFormData({...formData, organizationDetails: {...formData.organizationDetails, companySize: e.target.value}})}
                                       className="w-full px-6 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                                     >
                                        <option value="">Select Size</option>
                                        <option value="1-10">1-10</option>
                                        <option value="11-50">11-50</option>
                                        <option value="51-200">51-200</option>
                                        <option value="200+">200+</option>
                                     </select>
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2">
                                        <UserPlus className="w-3 h-3" /> Contact Person
                                     </label>
                                     <input 
                                       type="text" 
                                       placeholder="e.g. Chief Risk Officer"
                                       value={formData.organizationDetails.contactPerson}
                                       onChange={e => setFormData({...formData, organizationDetails: {...formData.organizationDetails, contactPerson: e.target.value}})}
                                       className="w-full px-6 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                                     />
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4 flex items-center gap-2">
                                        <FileText className="w-3 h-3 text-guava-orange" /> Tax ID
                                     </label>
                                     <input 
                                       type="text" 
                                       placeholder="e.g. TIN-8293"
                                       value={formData.organizationDetails.taxId || ''}
                                       onChange={e => setFormData({...formData, organizationDetails: {...formData.organizationDetails, taxId: e.target.value}})}
                                       className="w-full px-6 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                                     />
                                  </div>
                               </div>
                            )}

                            <div className="flex gap-4 pt-4">
                               <button onClick={() => setStep(3)} className="flex-1 py-5 border border-gray-100 rounded-3xl font-black text-xs uppercase tracking-widest text-gray-400">Back</button>
                               <button onClick={initiate2FA} className="flex-2 py-5 bg-guava-dark text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all hover:bg-guava-orange">Setup Security</button>
                            </div>
                         </div>
                       )}

                       {step === 5 && (
                         <div className="space-y-8 text-center">
                            <div className="flex justify-center">
                               <div className="w-20 h-20 bg-orange-50 rounded-[28px] flex items-center justify-center text-guava-orange animate-pulse">
                                  <Key className="w-10 h-10" />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <h3 className="text-2xl font-black text-guava-dark italic">Two-Factor Authorization</h3>
                               <p className="text-xs text-gray-400 font-medium max-w-sm mx-auto">We've sent a 6-digit synchronization key to <span className="text-guava-dark font-bold font-mono">{formData.email}</span>. Enter it below to authorize this session.</p>
                               
                               {/* Development Mode Helper */}
                               <div className="mt-4 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-left">
                                  <p className="text-[9px] font-black uppercase text-guava-orange tracking-widest mb-1">Development Mode Active</p>
                                  <p className="text-[10px] text-gray-500 italic leading-relaxed">System is in simulation mode. The 6-digit synchronization key is: <span className="font-mono font-black text-guava-dark select-all bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{expectedCode}</span></p>
                               </div>
                            </div>
                            
                            <input 
                              type="text" 
                              maxLength={6}
                              value={twoFactorCode}
                              onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="0 0 0 0 0 0"
                              className="w-full max-w-[240px] mx-auto px-4 py-6 bg-gray-50 border border-gray-100 rounded-3xl text-3xl font-black text-center tracking-[0.5em] outline-none focus:border-guava-orange transition-all font-mono"
                            />

                            <div className="flex gap-4 pt-8">
                               <button onClick={() => setStep(4)} className="flex-1 py-5 border border-gray-100 rounded-3xl font-black text-xs uppercase tracking-widest text-gray-400">Back</button>
                               <button onClick={verifyAndFinalize} className="flex-2 py-5 bg-guava-orange text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group">
                                  Finalize Node Activation
                                  <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                               </button>
                            </div>
                            <button onClick={initiate2FA} disabled={isSendingCode} className="text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-guava-orange transition-colors">
                              {isSendingCode ? 'Sending...' : 'Resend Code'}
                            </button>
                         </div>
                       )}
                     </>
                   ) : (
                     <div className="space-y-8">
                       <div className="mb-8">
                          <h2 className="text-2xl font-black tracking-tighter italic dark:text-white">Welcome Back</h2>
                          <p className="text-gray-400 text-sm font-medium">Enter your credentials to access the ACX terminal.</p>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Access Perspective</label>
                          <div className="grid grid-cols-2 gap-4">
                             <button 
                               type="button"
                               onClick={() => {
                                 setSelectedRole(UserRole.LENDER);
                                 localStorage.setItem('acx_preferred_role', UserRole.LENDER);
                                 setLoginEmail('lender@example.com');
                                 setLoginPassword('password');
                               }}
                               className={`py-2 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                 selectedRole === UserRole.LENDER 
                                   ? "border-guava-orange bg-orange-50 text-guava-orange" 
                                   : "border-gray-50 dark:border-white/5 text-gray-400 border-gray-100"
                               }`}
                             >
                               Business Portal
                             </button>
                             <button 
                               type="button"
                               onClick={() => {
                                 setSelectedRole(UserRole.BORROWER);
                                 localStorage.setItem('acx_preferred_role', UserRole.BORROWER);
                                 setLoginEmail('borrower@example.com');
                                 setLoginPassword('password');
                               }}
                               className={`py-2 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                 selectedRole === UserRole.BORROWER 
                                   ? "border-guava-orange bg-orange-50 text-guava-orange" 
                                   : "border-gray-50 dark:border-white/5 text-gray-400 border-gray-100"
                               }`}
                             >
                               Consumer Portal
                             </button>
                          </div>
                       </div>

                       <form onSubmit={handleLoginSubmit} className="space-y-6">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Credential Identifier (Email)</label>
                           <input 
                             type="email" 
                             required
                             value={loginEmail}
                             onChange={e => setLoginEmail(e.target.value)}
                             placeholder="user@example.com"
                             className="w-full px-6 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                           />
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Authorization Token (Password)</label>
                           <input 
                             type="password" 
                             required
                             value={loginPassword}
                             onChange={e => setLoginPassword(e.target.value)}
                             placeholder="••••••••"
                             className="w-full px-6 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-sm font-black outline-none focus:border-guava-orange transition-all dark:text-white"
                           />
                         </div>

                         <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                           <p className="text-[9px] font-black uppercase text-guava-orange tracking-widest mb-1">Demo Access</p>
                           <p className="text-[10px] text-gray-500 italic">Try: <span className="font-mono font-bold text-guava-dark">borrower@example.com</span> or <span className="font-mono font-bold text-guava-dark">lender@example.com</span></p>
                         </div>

                         <div className="flex flex-col gap-2 pt-3">
                           <button 
                             type="submit"
                             className="w-full py-3 bg-guava-orange text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-guava-dark transition-all shadow-xl shadow-guava-orange/20"
                           >
                             Log In to ACX
                           </button>
                           <button 
                             type="button"
                             onClick={() => setAuthMode('register')}
                             className="w-full py-3 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-guava-orange transition-colors"
                           >
                             Create New Portal Node
                           </button>
                         </div>
                       </form>
                     </div>
                   )}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6"
          >
             <motion.div 
               initial={{ scale: 0.8, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="w-full max-w-sm"
             >
                <div className="flex flex-col items-center text-center space-y-8">
                   <div className="w-20 h-20 bg-guava-orange rounded-3xl flex items-center justify-center animate-pulse">
                      <Lock className="w-10 h-10 text-white" />
                   </div>
                   <div className="space-y-2">
                      <h2 className="text-2xl font-black text-white italic tracking-tighter">RESTRICTED ACCESS</h2>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest text-center">System Administrator Authorization Required</p>
                   </div>
                   <div className="w-full space-y-4">
                      <input 
                        type="password" 
                        autoFocus
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                        placeholder="••••••••"
                        className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-2xl text-center text-xl text-white outline-none focus:border-guava-orange transition-all font-mono"
                      />
                      <div className="flex gap-4">
                         <button 
                           onClick={() => { setShowAdminLogin(false); setAdminPassword(''); }}
                           className="flex-1 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                         >
                            Abort
                         </button>
                         <button 
                           onClick={handleAdminLogin}
                           className="flex-1 py-4 bg-guava-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
                         >
                            Authorize
                            <Cpu className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                   <p className="text-white/20 text-[8px] font-bold tracking-widest uppercase">Encryption Mode: AES-256-GCM ACTIVE</p>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="h-20 flex items-center justify-between px-8 max-w-7xl mx-auto cursor-default">
        <div 
          onClick={handleLogoClick}
          className="text-2xl font-black tracking-tighter italic flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 bg-guava-orange rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-guava-green rounded-full translate-x-1 -translate-y-1" />
          </div>
          ACX
        </div>
        <div className="flex items-center gap-8">
          <a href="#features" className="text-sm font-bold opacity-40 hover:opacity-100 transition-opacity">Features</a>
          <a href="#network" className="text-sm font-bold opacity-40 hover:opacity-100 transition-opacity">Network</a>
          <button 
            onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
            className="text-sm font-bold opacity-40 hover:opacity-100 transition-opacity"
          >
            Login
          </button>
          <button 
            onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
            className="text-sm font-black uppercase tracking-widest hover:text-guava-orange transition-colors"
          >
            Access Terminal
          </button>
        </div>
      </nav>

      <section className="pt-20 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
           <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
            <div className="max-w-2xl">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[10px] font-bold uppercase tracking-widest mb-6 text-guava-orange border border-orange-100"
              >
                <Zap className="w-3 h-3" />
                Next-Gen Liquidity Layer
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-4 mb-8"
              >
                <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.85]">
                  Africa Credit <br /> 
                  Exchange <span className="font-serif italic font-normal text-guava-green">Portal</span>.
                </h1>
                <p className="text-lg font-black uppercase tracking-[0.4em] text-guava-orange">
                  Powered by Guava
                </p>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-500 max-w-md mb-10 leading-snug"
              >
                The unified liquidity layer for the African continent. Connecting local growth markets with institutional capital through the Pan-African Credit Engine.
              </motion.p>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                  className="group flex items-center gap-3 px-8 py-4 bg-guava-orange text-white rounded-full font-bold hover:scale-105 transition-all text-lg shadow-xl shadow-guava-orange/20"
                >
                  Join the Network
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('network');
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.pageYOffset - 100;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }}
                  className="px-8 py-4 border border-gray-200 rounded-full font-bold text-lg text-guava-dark hover:border-guava-orange hover:bg-gray-50 transition-all flex items-center gap-3 group"
                >
                  <Globe className="w-5 h-5 text-guava-orange" />
                  Asset Explorer
                </button>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="bg-guava-orange p-8 rounded-[48px] shadow-2xl border border-white/5"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-white/30 text-[10px] uppercase font-bold tracking-widest">
                    <span>Network Status: Optimal</span>
                    <span>14:00:34 UTC</span>
                  </div>
                  <div className="h-48 grid grid-cols-12 gap-2 items-end">
                    {[30, 50, 40, 80, 60, 45, 90, 70, 60, 85, 40, 75].map((h, i) => (
                      <div key={i} className="bg-white/10 rounded-t-lg transition-all hover:bg-guava-orange" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex gap-4">
                     <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-white/40 uppercase font-black mb-1">Total Volume</p>
                        <p className="text-2xl font-mono text-white">$4.82B</p>
                     </div>
                     <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-white/40 uppercase font-black mb-1">Yield APR</p>
                        <p className="text-2xl font-mono text-guava-green">8.42%</p>
                     </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <div id="register" className="grid md:grid-cols-2 gap-8 scroll-mt-24">
             <motion.div 
               whileHover={{ y: -10 }}
               className="p-12 bg-white border-2 border-gray-100 rounded-[48px] hover:border-guava-orange transition-all group"
             >
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-guava-green group-hover:text-white transition-colors">
                   <Landmark className="w-8 h-8" />
                </div>
                <h3 className="text-4xl font-black tracking-tighter mb-4">Business</h3>
                <p className="text-gray-500 mb-8 font-medium">Verify your institution to deploy capital into high-yield, AI-scored credit opportunities globally.</p>
                <button 
                  onClick={() => { 
                    localStorage.setItem('acx_preferred_role', UserRole.LENDER);
                    setAuthMode('register'); 
                    setSelectedRole(UserRole.LENDER); 
                    setStep(2); 
                    setShowAuthModal(true); 
                  }}
                  className="w-full py-5 bg-guava-green text-white rounded-3xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-guava-green/10"
                >
                  Register as Business
                </button>
             </motion.div>

             <motion.div 
               whileHover={{ y: -10 }}
               className="p-12 bg-gray-50 rounded-[48px] hover:bg-white border-2 border-transparent hover:border-guava-orange transition-all group"
             >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 group-hover:bg-guava-orange group-hover:text-white transition-colors">
                   <Building className="w-8 h-8" />
                </div>
                <h3 className="text-4xl font-black tracking-tighter mb-4">Consumer</h3>
                <p className="text-gray-500 mb-8 font-medium">Build decentralized credit history and access instant liquidity through our alternative data engine.</p>
                <button 
                  onClick={() => { 
                    localStorage.setItem('acx_preferred_role', UserRole.BORROWER);
                    setAuthMode('register'); 
                    setSelectedRole(UserRole.BORROWER); 
                    setStep(2); 
                    setShowAuthModal(true); 
                  }}
                  className="w-full py-5 bg-guava-orange text-white rounded-3xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-guava-orange/20"
                >
                  Register as Consumer
                </button>
             </motion.div>
          </div>

          {/* Features Section */}
          <section id="features" className="mt-32 pt-24 scroll-mt-24">
            <div className="flex flex-col lg:flex-row gap-20 items-center mb-24">
              <div className="flex-1">
                <h2 className="text-5xl font-black tracking-tighter leading-none mb-8">
                  Engineered for <span className="text-guava-green italic">Institutional</span> Precision.
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-6 group">
                    <div className="w-12 h-12 shrink-0 bg-orange-50 rounded-2xl flex items-center justify-center text-guava-orange group-hover:bg-guava-orange group-hover:text-white transition-all">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold tracking-tight mb-2">AI Alternative Scoring</h4>
                      <p className="text-gray-500 text-sm">Our proprietary engine analyzes alternative data points—mobile usage, utility patterns, and digital behavioral footprint—to generate accurate credit scores for the unbanked.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 group">
                    <div className="w-12 h-12 shrink-0 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold tracking-tight mb-2">Regional Hub Settlement</h4>
                      <p className="text-gray-500 text-sm">Deploy and receive capital across African regional economic blocks. Our ledger handles Nigerian Naira, Kenyan Shillings, CFA Francs, and more with institutional-grade efficiency.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 group">
                    <div className="w-12 h-12 shrink-0 bg-green-50 rounded-2xl flex items-center justify-center text-guava-green group-hover:bg-guava-green group-hover:text-white transition-all">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold tracking-tight mb-2">African Risk Guardrails</h4>
                      <p className="text-gray-500 text-sm">Real-time monitoring and automated audit trails ensure every transaction on the ACX portal adheres to regional compliance and international safety standards.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full grid grid-cols-2 gap-4">
                 {[
                   { label: 'Latency', value: '42ms', sub: 'Global Average' },
                   { label: 'Uptime', value: '99.99%', sub: 'Portal Stability' },
                   { label: 'Security', value: 'AES-256', sub: 'Military Grade' },
                   { label: 'Volume', value: '$840M', sub: 'Daily Liquidity' },
                 ].map((stat, i) => (
                   <div key={i} className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{stat.label}</p>
                     <p className="text-3xl font-black font-mono text-guava-dark">{stat.value}</p>
                     <p className="text-[10px] font-bold text-guava-green mt-1">{stat.sub}</p>
                   </div>
                 ))}
              </div>
            </div>
          </section>

          {/* Network Section */}
          <section id="network" className="mt-32 pt-24 pb-32 scroll-mt-24">
            <div className="p-12 md:p-20 bg-guava-dark rounded-[64px] text-white relative overflow-hidden">
               <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                  <div>
                    <h2 className="text-6xl font-black tracking-tighter leading-none mb-8">
                      Pan-African <br /> <span className="text-guava-orange italic">Intelligence</span> Network.
                    </h2>
                    <p className="text-lg text-white/60 mb-12">ACX connects 124 portal nodes across the continent, facilitating instant credit resonance in growth markets where traditional infrastructure fails.</p>
                    <div className="grid grid-cols-3 gap-8">
                       <div>
                          <p className="text-4xl font-black">124</p>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Active Nodes</p>
                       </div>
                       <div>
                          <p className="text-4xl font-black">52</p>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Markets</p>
                       </div>
                       <div>
                          <p className="text-4xl font-black">1.2M</p>
                          <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Profiles</p>
                       </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="aspect-square bg-white/5 rounded-full flex items-center justify-center p-8 border border-white/10 animate-pulse transition-all">
                       <div className="w-full h-full bg-guava-orange/20 rounded-full flex items-center justify-center">
                          <Globe className="w-32 h-32 text-guava-orange" />
                       </div>
                    </div>
                    {/* Animated Dots for Nodes */}
                    {[...Array(6)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.7, 0.3]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity, 
                          delay: i * 0.5 
                        }}
                        className="absolute w-4 h-4 bg-guava-orange rounded-full shadow-[0_0_20px_rgba(244,114,22,0.5)]"
                        style={{ 
                          top: `${Math.random() * 80 + 10}%`, 
                          left: `${Math.random() * 80 + 10}%` 
                        }}
                      />
                    ))}
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                 <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-guava-orange to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
               </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
