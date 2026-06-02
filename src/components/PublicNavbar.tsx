// components/PublicNavbar.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Cpu, Shield, Key, Phone, Globe, User, Landmark, Building, Camera, UserPlus, RefreshCw, Briefcase, FileText, Users, CheckCircle, Wallet, Activity } from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { COUNTRIES, CURRENCIES, LANGUAGES } from '../constants/countries';
import { MOCK_USERS } from '../lib/store';
import { Link } from 'react-router-dom';
import ACX from '../img/ACX logo.png';
import ACXText from '../img/ACX logoText.png';

interface PublicNavbarProps {
  onLogin: (user: UserProfile) => void;
}

export default function PublicNavbar({ onLogin }: PublicNavbarProps) {
  // Auth Modal State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(1);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [expectedCode, setExpectedCode] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [simulationActive, setSimulationActive] = useState<string | null>(null);
  
  // Admin Login State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const [adminPassword, setAdminPassword] = useState('');
  
  // Form Data for Registration
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

  const fileInputRef = useState<HTMLInputElement | null>(null);

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
      // Simulate 2FA code for demo
      const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedCode(demoCode);
      setStep(5);
      setIsVerifying2FA(true);
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
    setShowAuthModal(false);
    resetFormFields();
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const user = MOCK_USERS.find(u => u.email === loginEmail);
    if (user) {
      onLogin(user);
      setShowAuthModal(false);
      resetFormFields();
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
        setShowAdminLogin(false);
        setAdminPassword('');
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
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const navigateToHowItWorks = () => {
    window.location.href = '/how-it-works';
  };

  const openLoginModal = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const openRegisterModal = () => {
    setAuthMode('register');
    setSelectedRole(null);
    setStep(1);
    setShowAuthModal(true);
  };

  return (
    <>
      {/* Admin Login Modal */}
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

      {/* Auth Modal */}
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
                              onClick={() => document.getElementById('file-input')?.click()}
                              disabled={!!simulationActive}
                              className="absolute -bottom-2 -right-2 w-8 h-8 bg-guava-orange text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {simulationActive === 'photo' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            </button>
                            <input 
                              id="file-input"
                              type="file" 
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

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center justify-between px-4 md:px-8">
        <Link 
          to={'/'}
          className="text-xl md:text-2xl font-black tracking-tighter italic flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
        >
                  <img src={ACX} alt="ACX Logo" className="h-12" />

        </Link>
        <div className="flex items-center gap-4 md:gap-8">
          <Link 
            to={'/how-it-works'}
            className="text-xs md:text-sm font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
          >
            How It Works
          </Link>
          {/* <button 
            onClick={() => scrollToSection('features')}
            className="text-xs md:text-sm font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
          >
            Features
          </button> */}
          <Link 
          to={'/login'}
            // onClick={openLoginModal}
            className="text-xs md:text-sm font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
          >
            Login
          </Link>
          <button 
            onClick={openRegisterModal}
            className="text-xs md:text-sm font-black uppercase tracking-widest hover:text-guava-orange transition-colors cursor-pointer"
          >
            Access
          </button>
        </div>
      </nav>
    </>
  );
}