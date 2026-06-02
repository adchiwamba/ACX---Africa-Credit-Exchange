// pages/SignupPage.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, EyeOff, Lock, Mail, ArrowRight, User, Building, Phone, Globe, 
  Camera, Upload, X, CheckCircle, AlertCircle, Briefcase, Landmark, 
  Store, Truck, Server, CreditCard, Users, Shield, FileText, Calendar,
  ChevronRight, ChevronLeft, DollarSign, Sparkles, Award,
  TrendingUp,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { COUNTRIES, CURRENCIES } from '../constants/countries';
import Logo from '../img/logo.png';

interface SignupPageProps {
  onLogin: (user: UserProfile) => void;
}

// Business categories
const BUSINESS_CATEGORIES = [
  { id: 'agribusiness', name: 'Agribusiness', icon: Truck, description: 'Farming, agriculture, food processing', color: 'from-green-500' },
  { id: 'manufacturing', name: 'Manufacturing / Retail / Wholesale', icon: Store, description: 'Production, distribution, retail operations', color: 'from-blue-500' },
  { id: 'banking', name: 'Banking / Microfinance', icon: Landmark, description: 'Financial services, lending institutions', color: 'from-purple-500' },
  { id: 'vehicle_finance', name: 'Vehicle Finance', icon: CreditCard, description: 'Auto loans, fleet financing', color: 'from-red-500' },
  { id: 'asset_finance', name: 'Asset Finance', icon: Briefcase, description: 'Equipment leasing, asset-backed lending', color: 'from-yellow-500' },
  { id: 'services', name: 'Services', icon: Users, description: 'Professional services, consulting', color: 'from-teal-500' },
  { id: 'it_telco', name: 'IT / Telco', icon: Server, description: 'Technology, telecommunications, software', color: 'from-indigo-500' }
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    registrationNumber: '',
    taxId: '',
    country: '',
    phoneCode: '',
    phoneNumber: '',
    businessCategory: '',
    yearEstablished: '',
    annualRevenue: '',
    documents: {
      incorporationCert: null as File | null,
      taxCompliance: null as File | null,
      idDocument: null as File | null,
      proofOfAddress: null as File | null,
      financialStatements: null as File | null
    },
    logo: null as File | null,
    preferredCurrencies: [] as string[],
    agreeToTerms: false,
    agreeToDataProcessing: false
  });

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();

  // Auto-set phone code when country changes
  useEffect(() => {
    if (formData.country) {
      const selectedCountry = COUNTRIES.find(c => c.name === formData.country);
      if (selectedCountry && selectedCountry.phone !== formData.phoneCode) {
        setFormData(prev => ({ ...prev, phoneCode: selectedCountry.phone }));
      }
    }
  }, [formData.country]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: string, file: File | null) => {
    if (!file) return;

    setUploadProgress(prev => ({ ...prev, [field]: 0 }));
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = (prev[field] || 0) + 20;
        if (newProgress >= 100) {
          clearInterval(interval);
          return { ...prev, [field]: 100 };
        }
        return { ...prev, [field]: newProgress };
      });
    }, 150);

    const previewUrl = URL.createObjectURL(file);
    setPreviewUrls(prev => ({ ...prev, [field]: previewUrl }));
    
    if (field === 'logo') {
      setFormData(prev => ({ ...prev, logo: file }));
    } else {
      setFormData(prev => ({
        ...prev,
        documents: { ...prev.documents, [field]: file }
      }));
    }
  };

  const removeFile = (field: string) => {
    if (previewUrls[field]) {
      URL.revokeObjectURL(previewUrls[field]);
    }
    setPreviewUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[field];
      return newUrls;
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[field];
      return newProgress;
    });
    
    if (field === 'logo') {
      setFormData(prev => ({ ...prev, logo: null }));
    } else {
      setFormData(prev => ({
        ...prev,
        documents: { ...prev.documents, [field]: null }
      }));
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

  const validateStep = () => {
    if (step === 1) {
      if (!selectedRole) {
        alert('Please select an account type');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        alert('Please fill in all required fields');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return false;
      }
      if (formData.password.length < 8) {
        alert('Password must be at least 8 characters');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!formData.displayName || !formData.country || !formData.phoneNumber) {
        alert('Please fill in all required fields');
        return false;
      }
      return true;
    }
    if (step === 4 && selectedRole === UserRole.LENDER) {
      if (!formData.businessCategory || !formData.registrationNumber) {
        alert('Please fill in all business details');
        return false;
      }
      return true;
    }
    if (step === 5) {
      return true;
    }
    if (step === 6) {
      if (!formData.agreeToTerms || !formData.agreeToDataProcessing) {
        alert('Please accept the terms and conditions');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      const newUser: UserProfile = {
        uid: 'USR-' + Math.floor(Math.random() * 100000),
        email: formData.email,
        displayName: formData.displayName,
        role: selectedRole || UserRole.BORROWER,
        creditScore: selectedRole === UserRole.BORROWER ? 650 : 0,
        kycStatus: 'PENDING',
        currency: formData.preferredCurrencies[0] || 'USD',
        preferredCurrencies: formData.preferredCurrencies,
        balance: selectedRole === UserRole.LENDER ? 50000 : 1000,
        country: formData.country,
        phoneCode: formData.phoneCode,
        languages: ['English'],
        photoURL: previewUrls.logo || '',
        organizationDetails: selectedRole === UserRole.LENDER ? {
          companySize: '',
          contactPerson: formData.displayName,
          industry: formData.businessCategory,
          taxId: formData.taxId,
          registrationNumber: formData.registrationNumber,
          yearEstablished: formData.yearEstablished,
          annualRevenue: formData.annualRevenue
        } : undefined,
        is2FAEnabled: false
      };
      
    //   onLogin(newUser);
      navigate('/dashboard');
      setIsLoading(false);
    }, 2000);
  };

  const steps = selectedRole === UserRole.LENDER 
    ? ['Account', 'Credentials', 'Profile', 'Business', 'Documents', 'Review']
    : ['Account', 'Credentials', 'Profile', 'Documents', 'Review'];

  const totalSteps = steps.length;

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background Image with Overlay - Banking/Login themed */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1521791055366-0d553872125f?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-guava-dark/80" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">

        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          {/* Progress Steps - Visual indicator only */}
          <div className="mb-8 px-4">
            <div className="flex items-center justify-center gap-2">
              {steps.map((s, idx) => (
                <div key={idx} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    idx + 1 <= step 
                      ? 'bg-guava-orange text-white shadow-lg' 
                      : 'bg-white/20 text-white/40'
                  }`}>
                    {idx + 1}
                  </div>
                  {idx < totalSteps - 1 && (
                    <div className={`w-12 h-0.5 mx-1 transition-all duration-300 ${
                      idx + 1 < step ? 'bg-guava-orange' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-8 mt-3">
              {steps.map((s, idx) => (
                <span key={idx} className={`text-[9px] font-bold uppercase tracking-wider ${
                  idx + 1 <= step ? 'text-white' : 'text-white/40'
                }`}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-8 border border-white/20"
          >
            {/* Step 1: Account Type */}
            {step === 1 && (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-guava-orange to-guava-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter mb-2 text-gray-900">Choose Your Account</h2>
                  <p className="text-gray-500">Select the type of account you want to create</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setSelectedRole(UserRole.LENDER)}
                    className={`p-6 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      selectedRole === UserRole.LENDER 
                        ? 'border-guava-orange bg-orange-50/80 shadow-lg' 
                        : 'border-gray-200 hover:border-guava-orange/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-guava-orange to-orange-600 rounded-xl flex items-center justify-center mb-4">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Business Account</h3>
                    <p className="text-sm text-gray-500">For financial institutions, banks, and corporate lenders</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-guava-green" />
                        <span>Deploy capital to borrowers</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-guava-green" />
                        <span>Access blacklist database</span>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedRole(UserRole.BORROWER)}
                    className={`p-6 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      selectedRole === UserRole.BORROWER 
                        ? 'border-guava-orange bg-orange-50/80 shadow-lg' 
                        : 'border-gray-200 hover:border-guava-orange/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-guava-green to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Consumer Account</h3>
                    <p className="text-sm text-gray-500">For individuals and small business owners</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-guava-green" />
                        <span>Build credit history</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-guava-green" />
                        <span>Access fair loans</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Credentials */}
            {step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-guava-orange to-guava-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter mb-2 text-gray-900">Create Your Credentials</h2>
                  <p className="text-gray-500">Set up your login information</p>
                </div>
                
                <div className="space-y-5 max-w-md mx-auto">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all text-gray-700 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all text-gray-700 placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Minimum 8 characters with at least one number</p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all text-gray-700 placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Profile Information */}
            {step === 3 && (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-guava-orange to-guava-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter mb-2 text-gray-900">Profile Information</h2>
                  <p className="text-gray-500">Tell us about yourself or your organization</p>
                </div>
                
                <div className="space-y-5 max-w-md mx-auto">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">
                      {selectedRole === UserRole.LENDER ? 'Organization Name *' : 'Full Name *'}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.displayName}
                        onChange={(e) => handleInputChange('displayName', e.target.value)}
                        placeholder={selectedRole === UserRole.LENDER ? "ACX Capital Partners" : "John Doe"}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all text-gray-700 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Country *</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          required
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all appearance-none cursor-pointer text-gray-700"
                        >
                          <option value="" className="text-gray-400">Select Country</option>
                          {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Phone *</label>
                      <div className="flex gap-2">
                        <select
                          value={formData.phoneCode}
                          onChange={(e) => handleInputChange('phoneCode', e.target.value)}
                          className="w-24 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all cursor-pointer text-gray-700"
                        >
                          <option value="" className="text-gray-400">Code</option>
                          {COUNTRIES.map(c => <option key={c.code} value={c.phone}>{c.phone}</option>)}
                        </select>
                        <input
                          type="tel"
                          required
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          placeholder="712345678"
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all text-gray-700 placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {selectedRole === UserRole.LENDER && (
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Registration Number *</label>
                      <input
                        type="text"
                        required
                        value={formData.registrationNumber}
                        onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                        placeholder="CR2024/12345"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all text-gray-700 placeholder-gray-400"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Preferred Currencies</label>
                    <div className="flex flex-wrap gap-2">
                      {CURRENCIES.slice(0, 6).map(cur => (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => toggleCurrency(cur)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border cursor-pointer ${
                            formData.preferredCurrencies.includes(cur)
                              ? 'bg-guava-orange text-white border-guava-orange shadow-sm'
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-guava-orange hover:bg-orange-50'
                          }`}
                        >
                          {cur}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Business Details (Lender Only) */}
            {step === 4 && selectedRole === UserRole.LENDER && (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-guava-orange to-guava-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter mb-2 text-gray-900">Business Details</h2>
                  <p className="text-gray-500">Tell us more about your operations</p>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 block">Business Category *</label>
                    <div className="grid md:grid-cols-2 gap-3">
                      {BUSINESS_CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleInputChange('businessCategory', cat.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            formData.businessCategory === cat.id
                              ? `border-guava-orange bg-gradient-to-r ${cat.color}/10 shadow-md`
                              : 'border-gray-200 hover:border-guava-orange/50 hover:bg-gray-50'
                          }`}
                        >
                          <cat.icon className={`w-5 h-5 mb-2 ${formData.businessCategory === cat.id ? 'text-guava-orange' : 'text-gray-400'}`} />
                          <h4 className="font-bold text-sm text-gray-700">{cat.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{cat.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Year Established</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={formData.yearEstablished}
                          onChange={(e) => handleInputChange('yearEstablished', e.target.value)}
                          placeholder="2020"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all text-gray-700 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Annual Revenue</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={formData.annualRevenue}
                          onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all cursor-pointer text-gray-700"
                        >
                          <option value="" className="text-gray-400">Select range</option>
                          <option value="<100k">&lt; $100,000</option>
                          <option value="100k-500k">$100,000 - $500,000</option>
                          <option value="500k-1m">$500,000 - $1,000,000</option>
                          <option value="1m-5m">$1,000,000 - $5,000,000</option>
                          <option value="5m+">$5,000,000+</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-1 block">Tax ID / VAT</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      placeholder="TIN-12345678"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/20 outline-none transition-all text-gray-700 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4/5: Documents & Logo */}
            {(step === 4 && selectedRole !== UserRole.LENDER) || (step === 5 && selectedRole === UserRole.LENDER) ? (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-guava-orange to-guava-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter mb-2 text-gray-900">Upload Documents</h2>
                  <p className="text-gray-500">Verify your identity and credentials</p>
                </div>
                
                <div className="space-y-6 max-w-md mx-auto">
                  {/* Logo Upload */}
                  <div className="text-center">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 block">Profile Logo / Picture</label>
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                        previewUrls.logo ? 'border-guava-green bg-gray-50' : 'border-gray-300 hover:border-guava-orange bg-gray-50'
                      }`}>
                        {previewUrls.logo ? (
                          <img src={previewUrls.logo} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload('logo', e.target.files?.[0] || null)}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold cursor-pointer hover:bg-gray-200 transition-colors text-gray-700"
                      >
                        Choose File
                      </label>
                    </div>
                  </div>
                  
                  {/* Document Uploads */}
                  <div className="space-y-3">
                    <DocumentUploadRow 
                      id="incorporationCert"
                      label="Incorporation / Registration Certificate"
                      icon={FileText}
                      previewUrl={previewUrls.incorporationCert}
                      uploadProgress={uploadProgress.incorporationCert}
                      onUpload={(file: any) => handleFileUpload('incorporationCert', file)}
                      onRemove={() => removeFile('incorporationCert')}
                    />
                    
                    <DocumentUploadRow 
                      id="taxCompliance"
                      label="Tax Compliance Certificate"
                      icon={Shield}
                      previewUrl={previewUrls.taxCompliance}
                      uploadProgress={uploadProgress.taxCompliance}
                      onUpload={(file: any) => handleFileUpload('taxCompliance', file)}
                      onRemove={() => removeFile('taxCompliance')}
                    />
                    
                    <DocumentUploadRow 
                      id="idDocument"
                      label="Director/Authorized Signatory ID"
                      icon={User}
                      previewUrl={previewUrls.idDocument}
                      uploadProgress={uploadProgress.idDocument}
                      onUpload={(file: any) => handleFileUpload('idDocument', file)}
                      onRemove={() => removeFile('idDocument')}
                    />
                    
                    <DocumentUploadRow 
                      id="proofOfAddress"
                      label="Proof of Address (Utility Bill/Bank Statement)"
                      icon={Building}
                      previewUrl={previewUrls.proofOfAddress}
                      uploadProgress={uploadProgress.proofOfAddress}
                      onUpload={(file: any) => handleFileUpload('proofOfAddress', file)}
                      onRemove={() => removeFile('proofOfAddress')}
                    />
                    
                    {selectedRole === UserRole.LENDER && (
                      <DocumentUploadRow 
                        id="financialStatements"
                        label="Financial Statements (Last 2 Years)"
                        icon={TrendingUp}
                        previewUrl={previewUrls.financialStatements}
                        uploadProgress={uploadProgress.financialStatements}
                        onUpload={(file: any) => handleFileUpload('financialStatements', file)}
                        onRemove={() => removeFile('financialStatements')}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Final Step: Review & Terms */}
            {(step === 5 && selectedRole !== UserRole.LENDER) || (step === 6 && selectedRole === UserRole.LENDER) ? (
              <div>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-guava-orange to-guava-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter mb-2 text-gray-900">Review & Submit</h2>
                  <p className="text-gray-500">Confirm your information and accept terms</p>
                </div>
                
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold mb-3 text-guava-dark">Account Summary</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="text-gray-500">Account Type:</span> {selectedRole === UserRole.LENDER ? 'Business' : 'Consumer'}</p>
                      <p><span className="text-gray-500">Email:</span> {formData.email}</p>
                      <p><span className="text-gray-500">Name:</span> {formData.displayName}</p>
                      <p><span className="text-gray-500">Country:</span> {formData.country}</p>
                      {selectedRole === UserRole.LENDER && formData.businessCategory && (
                        <p><span className="text-gray-500">Category:</span> {BUSINESS_CATEGORIES.find(c => c.id === formData.businessCategory)?.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.agreeToTerms}
                        onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-guava-orange focus:ring-guava-orange"
                      />
                      <span className="text-sm text-gray-700">I agree to the <a href="#" className="text-guava-orange hover:underline">Terms of Service</a> and <a href="#" className="text-guava-orange hover:underline">Privacy Policy</a></span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.agreeToDataProcessing}
                        onChange={(e) => handleInputChange('agreeToDataProcessing', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-guava-orange focus:ring-guava-orange"
                      />
                      <span className="text-sm text-gray-700">I consent to data processing for credit assessment</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 1 ? 
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-200 rounded-xl font-bold text-sm hover:border-guava-orange hover:text-guava-orange transition-all flex items-center gap-2 text-gray-700 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              :
                <Link
                to={'/login'}
                //   onClick={handleBack}
                  className="px-6 py-3 border border-gray-200 rounded-xl font-bold text-sm hover:border-guava-orange hover:text-guava-orange transition-all flex items-center gap-2 text-gray-700 cursor-pointer"
                >
                  Go to Login
                </Link>
              }
              
              <div className="flex-1" />
              
              {step < (selectedRole === UserRole.LENDER ? 6 : 5) ? (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-guava-orange to-orange-600 text-white rounded-xl font-bold text-sm hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 cursor-pointer"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.agreeToTerms || !formData.agreeToDataProcessing}
                  className="px-8 py-3 bg-gradient-to-r from-guava-orange to-guava-dark text-white rounded-xl font-bold text-sm hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Complete Registration
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>

          {/* Powered by Guava */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <span className="text-xs text-white/70">Powered by</span>
              <img src={Logo} alt="Guava Africa" className="h-5" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center">
          <p className="text-white/40 text-xs">
            &copy; {currentYear} African Credit Exchange. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

// Helper component for document upload rows
function DocumentUploadRow({ id, label, icon: Icon, previewUrl, uploadProgress, onUpload, onRemove }: any) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-guava-orange" />
          <span className="font-bold text-xs text-gray-700">{label}</span>
        </div>
        {previewUrl ? (
          <button onClick={onRemove} className="text-red-500 text-xs font-bold hover:text-red-600 cursor-pointer">Remove</button>
        ) : (
          <label htmlFor={id} className="text-guava-orange text-xs font-bold cursor-pointer hover:text-guava-dark">Upload</label>
        )}
      </div>
      <input
        type="file"
        accept=".pdf,.jpg,.png"
        onChange={(e) => onUpload(e.target.files?.[0] || null)}
        className="hidden"
        id={id}
      />
      {uploadProgress && uploadProgress < 100 && (
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-guava-orange rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}
      {previewUrl && (
        <p className="text-xs text-guava-green mt-1">✓ File uploaded</p>
      )}
    </div>
  );
}