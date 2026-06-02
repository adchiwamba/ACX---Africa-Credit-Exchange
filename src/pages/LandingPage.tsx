import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Shield, Zap, ArrowRight, Users, Landmark, Building, X, Phone, 
  Lock, Cpu, Camera, Briefcase, UserPlus, Key, RefreshCw, FileText, User,
  Twitter, Linkedin, Mail, CheckCircle, Wallet, Activity
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { COUNTRIES, CURRENCIES, LANGUAGES } from '../constants/countries';
import { MOCK_USERS } from '../lib/store';
import Logo from '../img/logo.png';
import ACX from '../img/ACX logo.png';
import ACXText from '../img/ACX logoText.png';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';


// Placeholder for Guava logo - replace with actual image import

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
  const currentYear = new Date().getFullYear();

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

  useEffect(() => {
    if (formData.phoneCode) {
      const match = COUNTRIES.find(c => c.phone === formData.phoneCode);
      if (match && match.name !== formData.country) {
        setFormData(prev => ({ ...prev, country: match.name }));
      }
    }
  }, [formData.phoneCode]);

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
    
    const user = MOCK_USERS.find(u => u.email === loginEmail);
    if (user) {
      onLogin(user);
    } else {
      alert("Invalid credentials or user not found. Please register if you don't have an account.");
    }
  };

  const handleAdminLogin = () => {
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl relative"
             >
                <button 
                   onClick={() => { setShowAuthModal(false); resetFormFields(); }}
                   className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 cursor-pointer z-10"
                >
                   <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                   {authMode === 'register' ? (
                     <>
                       <div className="mb-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex gap-1.5 flex-1 mr-3">
                               {[1, 2, 3, 4, 5].map(i => (
                                 <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-guava-orange' : 'bg-gray-100'}`} />
                               ))}
                            </div>
                            <button 
                              onClick={() => setAuthMode('login')}
                              className="text-[10px] font-black uppercase tracking-widest text-guava-orange hover:underline shrink-0 cursor-pointer"
                            >
                              Login Instead
                            </button>
                          </div>
                          <h2 className="text-2xl font-black tracking-tighter">Initialize Portal Node</h2>
                          <p className="text-gray-400 text-xs font-medium">
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
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${selectedRole === r.role ? 'border-guava-orange bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                              >
                                 <r.icon className={`w-5 h-5 mb-2 ${selectedRole === r.role ? 'text-guava-orange' : 'text-gray-400'}`} />
                                 <h4 className="text-base font-black italic mb-1">{r.title}</h4>
                                 <p className="text-[9px] text-gray-400 font-medium">{r.desc}</p>
                              </button>
                            ))}
                         </div>
                       )}

                       {step === 2 && (
                         <div className="space-y-4">
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Name / Entity Name</label>
                               <input 
                                 type="text" 
                                 value={formData.displayName}
                                 onChange={e => setFormData({...formData, displayName: e.target.value})}
                                 placeholder="e.g. Phoenix Ventures"
                                 className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black outline-none focus:border-guava-orange transition-all"
                               />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Communication Endpoint (Email)</label>
                               <input 
                                 type="email" 
                                 value={formData.email}
                                 onChange={e => setFormData({...formData, email: e.target.value})}
                                 placeholder="node@acx.africa"
                                 className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black outline-none focus:border-guava-orange transition-all"
                               />
                            </div>
                            <div className="flex gap-3 pt-4">
                               <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-100 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 cursor-pointer">Back</button>
                               <button onClick={() => setStep(3)} className="flex-1 py-3 bg-guava-dark text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-guava-orange cursor-pointer">Continue</button>
                            </div>
                         </div>
                       )}

                       {step === 3 && (
                         <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1.5">
                                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    <Phone className="w-3 h-3" /> Dial Code
                                  </label>
                                  <select 
                                    value={formData.phoneCode}
                                    onChange={e => setFormData({...formData, phoneCode: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black outline-none focus:border-guava-orange transition-all appearance-none cursor-pointer"
                                  >
                                     <option value="" className="text-black">Select Code</option>
                                     {(COUNTRIES || []).map(c => <option key={c.code} value={c.phone} className="text-black">{c.phone} ({c.code})</option>)}
                                  </select>
                               </div>
                               <div className="space-y-1.5">
                                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">
                                    <Globe className="w-3 h-3" /> Host Nation
                                  </label>
                                  <select 
                                    value={formData.country}
                                    onChange={e => setFormData({...formData, country: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black outline-none focus:border-guava-orange transition-all appearance-none cursor-pointer"
                                  >
                                     <option value="" className="text-black">Select Country</option>
                                     {(COUNTRIES || []).map(c => <option key={c.code} value={c.name} className="text-black">{c.name}</option>)}
                                  </select>
                               </div>
                            </div>

                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Authorized Asset Classes (Currencies)</label>
                               <div className="flex flex-wrap gap-1.5">
                                  {CURRENCIES.slice(0, 6).map(cur => (
                                    <button 
                                      key={cur}
                                      onClick={() => toggleCurrency(cur)}
                                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all border cursor-pointer ${formData.preferredCurrencies.includes(cur) ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                       {cur}
                                    </button>
                                  ))}
                               </div>
                            </div>

                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Operational Languages</label>
                               <div className="flex flex-wrap gap-1.5">
                                  {LANGUAGES.slice(0, 5).map(lang => (
                                    <button 
                                      key={lang}
                                      onClick={() => toggleLanguage(lang)}
                                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all border cursor-pointer ${formData.languages.includes(lang) ? 'bg-guava-green text-white border-guava-green' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                       {lang}
                                    </button>
                                  ))}
                               </div>
                            </div>

                            <div className="flex gap-3 pt-3">
                               <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-100 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 cursor-pointer">Back</button>
                               <button onClick={() => setStep(4)} className="flex-1 py-3 bg-guava-dark text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-guava-orange cursor-pointer">Continue</button>
                            </div>
                         </div>
                       )}

                       {step === 4 && (
                         <div className="space-y-5">
                            <div className="flex flex-col items-center gap-3">
                               <div className="relative group">
                                  <div className="w-24 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-guava-orange">
                                     {formData.photoURL ? (
                                       <img src={formData.photoURL} alt="Node Identity" className="w-full h-full object-cover" />
                                     ) : (
                                       <div className="text-center p-3">
                                          <Camera className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                          <p className="text-[7px] font-black uppercase tracking-widest text-gray-400">Upload</p>
                                       </div>
                                     )}
                                  </div>
                                  <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={!!simulationActive}
                                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-guava-orange text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    {simulationActive === 'photo' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                  </button>
                                  <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    accept="image/*" 
                                    className="hidden" 
                                  />
                               </div>
                               <p className="text-[8px] font-bold text-gray-400 text-center max-w-[180px]">
                                  {selectedRole === UserRole.LENDER ? 'Institutional Logo' : 'Personal Identity'}
                                </p>
                            </div>

                             {selectedRole === UserRole.LENDER && (
                               <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                     <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-3">Industry</label>
                                     <select 
                                       value={formData.organizationDetails.industry}
                                       onChange={e => setFormData({...formData, organizationDetails: {...formData.organizationDetails, industry: e.target.value}})}
                                       className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none focus:border-guava-orange transition-all cursor-pointer"
                                     >
                                        <option value="">Select</option>
                                        <option value="Fintech">Fintech</option>
                                        <option value="Retailer">Retailer</option>
                                        <option value="Banking">Banking</option>
                                        <option value="VC">VC</option>
                                     </select>
                                  </div>
                                  <div className="space-y-1">
                                     <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-3">Company Size</label>
                                     <select 
                                       value={formData.organizationDetails.companySize}
                                       onChange={e => setFormData({...formData, organizationDetails: {...formData.organizationDetails, companySize: e.target.value}})}
                                       className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none focus:border-guava-orange transition-all cursor-pointer"
                                     >
                                        <option value="">Select</option>
                                        <option value="1-10">1-10</option>
                                        <option value="11-50">11-50</option>
                                        <option value="51-200">51-200</option>
                                        <option value="200+">200+</option>
                                     </select>
                                  </div>
                                  <div className="space-y-1">
                                     <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-3">Contact Person</label>
                                     <input 
                                       type="text" 
                                       placeholder="Name"
                                       value={formData.organizationDetails.contactPerson}
                                       onChange={e => setFormData({...formData, organizationDetails: {...formData.organizationDetails, contactPerson: e.target.value}})}
                                       className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none focus:border-guava-orange transition-all"
                                     />
                                  </div>
                                  <div className="space-y-1">
                                     <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-3">Tax ID</label>
                                     <input 
                                       type="text" 
                                       placeholder="TIN-8293"
                                       value={formData.organizationDetails.taxId || ''}
                                       onChange={e => setFormData({...formData, organizationDetails: {...formData.organizationDetails, taxId: e.target.value}})}
                                       className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black outline-none focus:border-guava-orange transition-all"
                                     />
                                  </div>
                               </div>
                            )}

                            <div className="flex gap-3 pt-3">
                               <button onClick={() => setStep(3)} className="flex-1 py-3 border border-gray-100 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 cursor-pointer">Back</button>
                               <button onClick={initiate2FA} className="flex-1 py-3 bg-guava-dark text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-guava-orange cursor-pointer">Setup Security</button>
                            </div>
                         </div>
                       )}

                       {step === 5 && (
                         <div className="space-y-6 text-center">
                            <div className="flex justify-center">
                               <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-guava-orange animate-pulse">
                                  <Key className="w-8 h-8" />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <h3 className="text-xl font-black text-guava-dark italic">Two-Factor Authorization</h3>
                               <p className="text-xs text-gray-400 font-medium">Enter the 6-digit key sent to <span className="text-guava-dark font-bold font-mono text-xs">{formData.email}</span></p>
                               
                               <div className="mt-3 p-3 bg-orange-50/50 border border-orange-100 rounded-xl text-left">
                                  <p className="text-[8px] font-black uppercase text-guava-orange tracking-widest mb-1">Development Mode</p>
                                  <p className="text-[9px] text-gray-500">Key: <span className="font-mono font-black text-guava-dark">{expectedCode}</span></p>
                               </div>
                            </div>
                            
                            <input 
                              type="text" 
                              maxLength={6}
                              value={twoFactorCode}
                              onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="000000"
                              className="w-full max-w-[200px] mx-auto px-3 py-4 bg-gray-50 border border-gray-100 rounded-xl text-2xl font-black text-center tracking-[0.3em] outline-none focus:border-guava-orange transition-all font-mono"
                            />

                            <div className="flex gap-3 pt-4">
                               <button onClick={() => setStep(4)} className="flex-1 py-3 border border-gray-100 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 cursor-pointer">Back</button>
                               <button onClick={verifyAndFinalize} className="flex-1 py-3 bg-guava-orange text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group cursor-pointer">
                                  Activate
                                  <Shield className="w-3 h-3" />
                               </button>
                            </div>
                            <button onClick={initiate2FA} disabled={isSendingCode} className="text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-guava-orange transition-colors cursor-pointer">
                              {isSendingCode ? 'Sending...' : 'Resend Code'}
                            </button>
                         </div>
                       )}
                     </>
                   ) : (
                     <div className="space-y-6">
                       <div className="mb-4">
                          <h2 className="text-2xl font-black tracking-tighter">Welcome Back</h2>
                          <p className="text-gray-400 text-xs font-medium">Enter your credentials to access the ACX terminal.</p>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-3">Access Perspective</label>
                          <div className="grid grid-cols-2 gap-3">
                             <button 
                               type="button"
                               onClick={() => {
                                 setSelectedRole(UserRole.LENDER);
                                 localStorage.setItem('acx_preferred_role', UserRole.LENDER);
                                 setLoginEmail('lender@example.com');
                                 setLoginPassword('password');
                               }}
                               className={`py-2 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                 selectedRole === UserRole.LENDER 
                                   ? "border-guava-orange bg-orange-50 text-guava-orange" 
                                   : "border-gray-100 text-gray-400"
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
                               className={`py-2 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                 selectedRole === UserRole.BORROWER 
                                   ? "border-guava-orange bg-orange-50 text-guava-orange" 
                                   : "border-gray-100 text-gray-400"
                               }`}
                             >
                               Consumer Portal
                             </button>
                          </div>
                       </div>

                       <form onSubmit={handleLoginSubmit} className="space-y-4">
                         <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-3">Email</label>
                           <input 
                             type="email" 
                             required
                             value={loginEmail}
                             onChange={e => setLoginEmail(e.target.value)}
                             placeholder="user@example.com"
                             className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black outline-none focus:border-guava-orange transition-all"
                           />
                         </div>
                         <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-3">Password</label>
                           <input 
                             type="password" 
                             required
                             value={loginPassword}
                             onChange={e => setLoginPassword(e.target.value)}
                             placeholder="••••••••"
                             className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black outline-none focus:border-guava-orange transition-all"
                           />
                         </div>

                         <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                           <p className="text-[8px] font-black uppercase text-guava-orange tracking-widest mb-1">Demo Access</p>
                           <p className="text-[9px] text-gray-500">borrower@example.com / lender@example.com</p>
                         </div>

                         <div className="flex flex-col gap-2 pt-2">
                           <button 
                             type="submit"
                             className="w-full py-3 bg-guava-orange text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-guava-dark transition-all shadow-lg shadow-guava-orange/20 cursor-pointer"
                           >
                             Log In to ACX
                           </button>
                           <button 
                             type="button"
                             onClick={() => setAuthMode('register')}
                             className="w-full py-3 border border-gray-100 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-guava-orange transition-colors cursor-pointer"
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
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4"
          >
             <motion.div 
               initial={{ scale: 0.8, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="w-full max-w-sm"
             >
                <div className="flex flex-col items-center text-center space-y-6">
                   <div className="w-16 h-16 bg-guava-orange rounded-2xl flex items-center justify-center animate-pulse">
                      <Lock className="w-8 h-8 text-white" />
                   </div>
                   <div className="space-y-1">
                      <h2 className="text-xl font-black text-white italic tracking-tighter">RESTRICTED ACCESS</h2>
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Administrator Authorization Required</p>
                   </div>
                   <div className="w-full space-y-3">
                      <input 
                        type="password" 
                        autoFocus
                        value={adminPassword}
                        onChange={e => setAdminPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
                        placeholder="••••••••"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-center text-white outline-none focus:border-guava-orange transition-all font-mono"
                      />
                      <div className="flex gap-3">
                         <button 
                           onClick={() => { setShowAdminLogin(false); setAdminPassword(''); }}
                           className="flex-1 py-3 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer"
                         >
                            Abort
                         </button>
                         <button 
                           onClick={handleAdminLogin}
                           className="flex-1 py-3 bg-guava-orange text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group cursor-pointer"
                         >
                            Authorize
                            <Cpu className="w-3 h-3" />
                         </button>
                      </div>
                   </div>
                   <p className="text-white/20 text-[7px] font-bold tracking-widest uppercase">Encryption Mode: AES-256-GCM ACTIVE</p>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        <img src={ACXText} alt="ACX Logo" className="h-13" />
        <div className="flex items-center gap-4 md:gap-8">
          <Link to={'/how-it-works'} className="text-xs md:text-sm font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer">
            How It Works
          </Link>
          {/* <a href="#features" className="text-xs md:text-sm font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer">Features</a> */}
          <button 
            onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
            className="text-xs md:text-sm font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
          >
            Login
          </button>
          <button 
            onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
            className="text-xs md:text-sm font-black uppercase tracking-widest hover:text-guava-orange transition-colors cursor-pointer"
          >
            Access
          </button>
        </div>
      </nav>

      {/* Add padding-top to account for fixed navbar */}
      <div >
        {/* Hero Section */}
        <section className=" pb-16 px-4 md:px-6 overflow-hidden bg-gradient-to-b from-white via-orange-50/20 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[10px] md:text-[11px] font-black uppercase tracking-wider mb-4 text-guava-orange border border-orange-100"
                >
                  <Zap className="w-3 h-3" />
                  AI-Powered Credit & Liquidity Engine
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-4 mb-6"
                >
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1]">
                    Unlock Africa's <br /> 
                    <span className="bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent">Financial Potential</span>
                  </h1>
                  <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-lg">
                    The unified platform for AI-powered credit scoring and liquidity access across African markets. 
                    Each user receives a dynamic credit score based on their loan history and repayment behavior.
                  </p>

                  <div className='flex'>
                    <div>Powered by: </div>

                    <a href={'https://guava.africa'} target='_blank' rel="noopener noreferrer" className='z-100' onClick={(e) => e.stopPropagation()}>
                    <img
                      src={Logo}
                      alt="Guava Africa Logo"
                      width={70}
                      height={40}
                      className="ml-2 z--100"
                    />
                    </a>
                  </div>
                </motion.div>
                
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-guava-green" />
                    <span className="text-xs md:text-sm font-medium">AI Credit Scoring</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-guava-green" />
                    <span className="text-xs md:text-sm font-medium">Instant Liquidity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-guava-green" />
                    <span className="text-xs md:text-sm font-medium">Multi-Currency</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button 
                    onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
                    className="group flex items-center justify-center gap-2 px-6 py-3 bg-guava-orange text-white rounded-full font-bold hover:scale-105 transition-all text-sm md:text-base shadow-lg shadow-guava-orange/20 cursor-pointer w-full sm:w-auto"
                  >
                    Start Building Credit
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <Link to={'/how-it-works'} 
                    className="px-6 py-3 border-2 border-gray-200 rounded-full font-bold text-sm md:text-base text-guava-dark hover:border-guava-orange hover:bg-gray-50 transition-all flex items-center justify-center gap-2 group cursor-pointer w-full sm:w-auto"
                  >
                    <Globe className="w-4 h-4 text-guava-orange" />
                    How It Works
                  </Link>
                </div>
              </div>
              
              {/* African Continent Map */}
              <div className="relative">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="relative rounded-2xl md:rounded-3xl p-4 md:p-6 overflow-hidden"
                >
                  <div className="text-center mb-3 md:mb-4">
                    <h3 className="text-white font-bold text-base md:text-lg tracking-tighter">African Continent</h3>
                    <p className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-wider">Pan-African Credit Network</p>
                  </div>
                  
                  <div className="relative w-full aspect-[0.85] bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/86/Africa_%28orthographic_projection%29.svg')] bg-contain bg-center bg-no-repeat">
                    <div className="absolute top-[40%] left-[45%] w-2 h-2 md:w-3 md:h-3 bg-guava-orange rounded-full animate-pulse" />
                    <div className="absolute top-[50%] left-[55%] w-1.5 h-1.5 md:w-2 md:h-2 bg-guava-green rounded-full animate-pulse" />
                    <div className="absolute top-[62.5%] left-[61%] w-1.5 h-1.5 md:w-2 md:h-2 bg-guava-orange rounded-full animate-pulse" />
                    <div className="absolute top-[30%] left-[35%] w-1.5 h-1.5 md:w-2 md:h-2 bg-guava-green rounded-full animate-pulse" />
                    <div className="absolute top-[71%] left-[54%] w-2 h-2 md:w-3 md:h-3 bg-guava-orange rounded-full animate-pulse" />
                  </div>

                  <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-guava-orange/20 to-transparent rounded-full blur-2xl -z-0" />
                  
                  <div className="mt-3 md:mt-4 text-center">
                    <p className="text-white/30 text-[7px] md:text-[9px] uppercase tracking-wider">52 Markets | 1 Platform</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* How It Works Section */}
            <section id="how-it-works" className="scroll-mt-20 mt-12 md:mt-16 mb-20">
              <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
                <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-guava-orange text-[9px] md:text-[10px] font-black uppercase tracking-wider mb-3">Simple Process</span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-3">
                  Get Started in <span className="text-guava-green">3 Easy Steps</span>
                </h2>
                <p className="text-gray-500 text-sm md:text-base">From registration to funding, we've made the process seamless.</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="text-center p-4 md:p-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-guava-orange/10 rounded-full flex items-center justify-center mx-auto mb-3 text-guava-orange">
                    <UserPlus className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="text-xl md:text-2xl font-black text-guava-orange mb-1">01</div>
                  <h3 className="text-base md:text-xl font-bold mb-1">Create Your Profile</h3>
                  <p className="text-gray-500 text-xs md:text-sm">Register as a Business or Consumer. Complete your KYC.</p>
                </div>
                <div className="text-center p-4 md:p-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-guava-green/10 rounded-full flex items-center justify-center mx-auto mb-3 text-guava-green">
                    <Activity className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="text-xl md:text-2xl font-black text-guava-orange mb-1">02</div>
                  <h3 className="text-base md:text-xl font-bold mb-1">Get Credit Scored</h3>
                  <p className="text-gray-500 text-xs md:text-sm">Our AI analyzes alternative data to generate your credit profile.</p>
                </div>
                <div className="text-center p-4 md:p-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500">
                    <Wallet className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="text-xl md:text-2xl font-black text-guava-orange mb-1">03</div>
                  <h3 className="text-base md:text-xl font-bold mb-1">Access Credit</h3>
                  <p className="text-gray-500 text-xs md:text-sm">Connect with lenders and access the capital you need.</p>
                </div>
              </div>
            </section>

            {/* Registration Cards */}
            <div className="grid md:grid-cols-2 gap-6 mt-10 md:mt-12">
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-6 md:p-8 lg:p-10 bg-gray-50 rounded-2xl md:rounded-3xl hover:bg-white border-2 border-transparent hover:border-guava-orange transition-all group cursor-pointer"
                onClick={() => { 
                  localStorage.setItem('acx_preferred_role', UserRole.BORROWER);
                  setAuthMode('register'); 
                  setSelectedRole(UserRole.BORROWER); 
                  setStep(2); 
                  setShowAuthModal(true); 
                }}
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-guava-orange group-hover:text-white transition-colors">
                  <Building className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter mb-2">Consumer Portal</h3>
                <p className="text-gray-500 text-xs md:text-sm lg:text-base mb-4 md:mb-6 leading-relaxed">Build decentralized credit history and access instant liquidity through our alternative data scoring engine.</p>
                <div className="flex items-center gap-2 text-guava-orange font-bold text-xs md:text-sm">
                  Register as Consumer <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="p-6 md:p-8 lg:p-10 bg-white border-2 border-gray-100 rounded-2xl md:rounded-3xl hover:border-guava-orange transition-all group cursor-pointer"
                onClick={() => { 
                  localStorage.setItem('acx_preferred_role', UserRole.LENDER);
                  setAuthMode('register'); 
                  setSelectedRole(UserRole.LENDER); 
                  setStep(2); 
                  setShowAuthModal(true); 
                }}
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-guava-green group-hover:text-white transition-colors">
                  <Landmark className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter mb-2">Business Portal</h3>
                <p className="text-gray-500 text-xs md:text-sm lg:text-base mb-4 md:mb-6 leading-relaxed">Deploy capital into AI-scored credit opportunities. Access real-time risk analytics and diversify across African markets.</p>
                <div className="flex items-center gap-2 text-guava-orange font-bold text-xs md:text-sm">
                  Register as Business <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              </motion.div>

              
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mt-4 md:mt-8 pt-10 md:pt-12 px-4 md:px-6 scroll-mt-20 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
              <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-guava-orange text-[9px] md:text-[10px] font-black uppercase tracking-wider mb-3">Platform Capabilities</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-3">
                Engineered for <span className="text-guava-green">African</span> Markets
              </h2>
              <p className="text-gray-500 text-sm md:text-base">Powering credit access and liquidity across 52 markets with localized intelligence.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <div className="p-6 md:p-8 rounded-xl md:rounded-2xl border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-5 group-hover:bg-guava-orange group-hover:text-white transition-colors">
                  <Zap className="w-5 h-5 md:w-6 md:h-6 text-guava-orange group-hover:text-white" />
                </div>
                <h4 className="text-lg md:text-xl font-bold mb-2">AI Alternative Scoring</h4>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed">Proprietary algorithms analyze mobile usage, utility patterns, and behavioral data to generate accurate credit scores.</p>
              </div>

              <div className="p-6 md:p-8 rounded-xl md:rounded-2xl border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-5 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Globe className="w-5 h-5 md:w-6 md:h-6 text-blue-500 group-hover:text-white" />
                </div>
                <h4 className="text-lg md:text-xl font-bold mb-2">Regional Settlement Hub</h4>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed">Deploy and receive capital across African economic blocks. Support for NGN, KES, XAF, GHS, and more.</p>
              </div>

              <div className="p-6 md:p-8 rounded-xl md:rounded-2xl border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-5 group-hover:bg-guava-green group-hover:text-white transition-colors">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 text-guava-green group-hover:text-white" />
                </div>
                <h4 className="text-lg md:text-xl font-bold mb-2">Risk & Compliance</h4>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed">Real-time monitoring and automated audit trails ensure every transaction adheres to regional standards.</p>
              </div>
            </div>
          </div>
        </section>

        <Footer/>
      </div>
    </div>
  );
}