import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, Users, CreditCard, Shield, FileText, Clock, 
  CheckCircle, XCircle, TrendingUp, Award, Zap, Globe, 
  Wallet, Activity, UserX, AlertCircle, DollarSign, Briefcase, Landmark,
  TrendingDown, RefreshCw, Repeat, Eye, UserCheck
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';

export default function HowItWorks() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'business' | 'borrower'>('business');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const currentYear = new Date().getFullYear();

  // Pricing plans for businesses
  const businessPricingPlans = [
    {
      name: 'Startup',
      price: billingCycle === 'monthly' ? '$99' : '$990',
      yearlyPrice: '$990',
      monthlyPrice: '$99',
      period: billingCycle === 'monthly' ? 'month' : 'year',
      savings: billingCycle === 'yearly' ? 'Save $198/year' : null,
      features: [
        'Up to $50,000 disbursement limit',
        'Up to 50 active loans at once',
        'Basic credit scoring access',
        'Standard blacklist queries (50/month)',
        'Email support (48hr response)',
        'Basic reporting dashboard',
        'Single user account'
      ],
      recommended: false,
      icon: Building
    },
    {
      name: 'Professional',
      price: billingCycle === 'monthly' ? '$299' : '$2,990',
      yearlyPrice: '$2,990',
      monthlyPrice: '$299',
      period: billingCycle === 'monthly' ? 'month' : 'year',
      savings: billingCycle === 'yearly' ? 'Save $598/year' : null,
      features: [
        'Up to $500,000 disbursement limit',
        'Up to 500 active loans at once',
        'Advanced AI credit scoring',
        'Full blacklist access with real-time sync',
        'Priority support & SLA (24hr response)',
        'Bulk borrower verification',
        'Custom risk analytics dashboard',
        'Automated loan approval workflows',
        'Up to 5 user accounts',
        'Export reports (CSV/PDF)'
      ],
      recommended: true,
      icon: Briefcase
    },
    {
      name: 'Corporate',
      price: billingCycle === 'monthly' ? '$699' : '$6,990',
      yearlyPrice: '$6,990',
      monthlyPrice: '$699',
      period: billingCycle === 'monthly' ? 'month' : 'year',
      savings: billingCycle === 'yearly' ? 'Save $1,398/year' : null,
      features: [
        'Up to $2,000,000 disbursement limit',
        'Up to 2,000 active loans at once',
        'Enterprise AI credit scoring models',
        'Unlimited blacklist queries',
        '24/7 priority support',
        'Bulk borrower verification with auto-approval',
        'Advanced risk analytics & reporting dashboards',
        'Unlimited user accounts with role-based access',
        'Automated loan approval & disbursement workflows',
        'Multi-currency settlement support',
        'Regulatory compliance reporting tools',
        'White-labeled reports'
      ],
      recommended: false,
      icon: Landmark
    },
    {
      name: 'Enterprise',
      price: billingCycle === 'monthly' ? '$1,499' : '$14,990',
      yearlyPrice: '$14,990',
      monthlyPrice: '$1,499',
      period: billingCycle === 'monthly' ? 'month' : 'year',
      savings: billingCycle === 'yearly' ? 'Save $2,998/year' : null,
      features: [
        'Unlimited disbursement capacity',
        'Unlimited active loans',
        'Custom AI credit models & algorithms',
        'Unlimited blacklist queries',
        '24/7 dedicated support team',
        'Real-time cross-border settlement',
        'Multi-country license support',
        'Custom compliance & regulatory tools',
        'Private blacklist integration',
        'Dedicated infrastructure',
        'SLA guarantees with financial penalties',
        'Full white-label customization'
      ],
      recommended: false,
      icon: Globe
    }
  ];

  // Pricing plans for borrowers - all include real-time credit
  const borrowerPricingPlans = [
    {
      name: 'Basic',
      price: billingCycle === 'monthly' ? '$5' : '$50',
      yearlyPrice: '$50',
      monthlyPrice: '$5',
      period: billingCycle === 'monthly' ? 'month' : 'year',
      savings: billingCycle === 'yearly' ? 'Save $10/year' : null,
      features: [
        'Real-time credit score access',
        'Apply for loans up to $1,000',
        'Basic credit building tools',
        'Email support',
        'Loan repayment reminders',
        'Single profile',
        'Monthly credit report'
      ],
      recommended: false,
      icon: Users
    },
    {
      name: 'Plus',
      price: billingCycle === 'monthly' ? '$12' : '$120',
      yearlyPrice: '$120',
      monthlyPrice: '$12',
      period: billingCycle === 'monthly' ? 'month' : 'year',
      savings: billingCycle === 'yearly' ? 'Save $24/year' : null,
      features: [
        'Real-time credit score access',
        'Apply for loans up to $5,000',
        'Advanced credit building tools & tips',
        'Priority email & chat support',
        'Loan repayment calendar & automation',
        'Up to 3 linked accounts',
        'Credit score simulator',
        'Financial literacy resources',
        'Weekly credit updates'
      ],
      recommended: true,
      icon: TrendingUp
    },
    {
      name: 'Premium',
      price: billingCycle === 'monthly' ? '$25' : '$250',
      yearlyPrice: '$250',
      monthlyPrice: '$25',
      period: billingCycle === 'monthly' ? 'month' : 'year',
      savings: billingCycle === 'yearly' ? 'Save $50/year' : null,
      features: [
        'Real-time credit score access',
        'Apply for loans up to $25,000',
        'Premium credit building tools',
        '24/7 priority support',
        'Full loan automation & management',
        'Unlimited linked accounts',
        'Credit score simulator & projections',
        'Financial literacy courses & certifications',
        'Credit monitoring alerts',
        'Identity theft protection',
        'Personalized financial recommendations',
        'Daily credit updates'
      ],
      recommended: false,
      icon: Award
    }
  ];

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleDemoAccess = () => {
    const demoUser = {
      uid: 'demo_' + Date.now(),
      email: 'demo@acx.africa',
      displayName: 'Demo User',
      role: UserRole.BORROWER,
      creditScore: 720,
      kycStatus: 'VERIFIED',
      currency: 'USD',
      preferredCurrencies: ['USD', 'KES'],
      balance: 5000,
      country: 'Kenya',
      phoneCode: '+254',
      languages: ['English'],
      photoURL: '',
      is2FAEnabled: false
    };
    localStorage.setItem('acx_demo_user', JSON.stringify(demoUser));
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <PublicNavbar />

      {/* Add padding-top for fixed navbar */}
      <div className="pt-14">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-guava-dark to-black text-white py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4">
                How <span className="text-guava-orange">ACX</span> Works
              </h1>
              <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
                A dual-sided platform connecting institutional capital with African borrowers through AI-powered credit scoring
              </p>
            </motion.div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white sticky top-14 z-30">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex gap-8 justify-center">
              <button
                onClick={() => setActiveTab('business')}
                className={`py-4 px-2 font-black text-sm uppercase tracking-wider transition-all cursor-pointer relative ${
                  activeTab === 'business' 
                    ? 'text-guava-orange' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  For Businesses & Lenders
                </div>
                {activeTab === 'business' && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-guava-orange"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('borrower')}
                className={`py-4 px-2 font-black text-sm uppercase tracking-wider transition-all cursor-pointer relative ${
                  activeTab === 'borrower' 
                    ? 'text-guava-orange' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  For Borrowers & Consumers
                </div>
                {activeTab === 'borrower' && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-guava-orange"
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Business/Lender Section */}
        {activeTab === 'business' && (
          <section className="py-12 md:py-16 px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">
                  For Financial Institutions, Banks & Lenders
                </h2>
                <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                  Join ACX to deploy capital into African markets with confidence, backed by AI-powered risk assessment and a comprehensive borrower blacklist.
                </p>
              </div>

              {/* Process Steps */}
              <div className="grid md:grid-cols-4 gap-8 mb-16">
                <div className="text-center p-6 rounded-2xl bg-orange-50/30 hover:bg-orange-50 transition-all">
                  <div className="w-16 h-16 bg-guava-orange rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-2xl font-black text-guava-orange mb-2">01</div>
                  <h3 className="text-xl font-bold mb-2">Choose Your Plan</h3>
                  <p className="text-gray-500 text-sm">Select a subscription tier that matches your disbursement volume and feature requirements.</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-emerald-50/30 hover:bg-emerald-50 transition-all">
                  <div className="w-16 h-16 bg-guava-green rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-2xl font-black text-guava-orange mb-2">02</div>
                  <h3 className="text-xl font-bold mb-2">Get Verified</h3>
                  <p className="text-gray-500 text-sm">Complete KYC, provide proof of regulatory licenses, business registration documents and proof of residence.</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-blue-50/30 hover:bg-blue-50 transition-all">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-2xl font-black text-guava-orange mb-2">03</div>
                  <h3 className="text-xl font-bold mb-2">De-Risk & Disburse</h3>
                  <p className="text-gray-500 text-sm">Access loan applications, match interest rates, check continental blacklist, approve loans, and disburse funds from one platform.</p>
                </div>
                <div className="text-center p-6 rounded-2xl bg-teal-50/30 hover:bg-teal-50 transition-all">
                  <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-2xl font-black text-guava-orange mb-2">04</div>
                  <h3 className="text-xl font-bold mb-2">Grow Business</h3>
                  <p className="text-gray-500 text-sm">Manage and monitor loan portfolio performance with real-time analytics and reporting.</p>
                </div>
              </div>

              {/* Business Pricing Plans with Billing Switcher */}
              <div className="mb-16">
                <div className="text-center mb-10">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-3">
                    Subscription Plans
                  </h3>
                  <p className="text-gray-500 mb-4">Choose the plan that fits your business needs</p>
                  
                  {/* Billing Toggle */}
                  <div className="inline-flex items-center gap-4 p-1 bg-gray-100 rounded-full">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                        billingCycle === 'monthly' 
                          ? 'bg-guava-orange text-white shadow-md' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                        billingCycle === 'yearly' 
                          ? 'bg-guava-orange text-white shadow-md' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Yearly <span className="text-[10px] text-guava-green ml-1">Save 15%</span>
                    </button>
                  </div>
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                  {businessPricingPlans.map((plan) => (
                    <motion.div
                      key={plan.name}
                      whileHover={{ y: -8 }}
                      className={`rounded-2xl border-2 p-6 transition-all ${
                        plan.recommended 
                          ? 'border-guava-orange shadow-xl shadow-guava-orange/10 bg-white relative' 
                          : 'border-gray-100 hover:border-guava-orange/50'
                      }`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-guava-orange text-white text-[10px] font-black uppercase tracking-wider">
                          Most Popular
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-4 mt-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          plan.recommended ? 'bg-guava-orange text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <plan.icon className="w-5 h-5" />
                        </div>
                        <h4 className="text-xl font-bold">{plan.name}</h4>
                      </div>
                      <div className="mb-4">
                        <span className="text-3xl font-black">{plan.price}</span>
                        <span className="text-gray-400 text-sm">/{plan.period}</span>
                        {plan.savings && billingCycle === 'yearly' && (
                          <p className="text-[10px] text-guava-green font-bold mt-1">{plan.savings}</p>
                        )}
                      </div>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-guava-green shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Blacklist System */}
              <div className="bg-red-50 rounded-3xl p-8 md:p-10 mb-8">
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider mb-4">
                      <UserX className="w-3 h-3" />
                      Continental AI Blacklist System
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-4">
                      Protect Your Portfolio with Real-Time Blacklist Access
                    </h3>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      All ACX business subscribers get access to the centralized African Credit Blacklist — a shared database of borrowers with documented default history, fraud cases, or repeated missed payments.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-red-500" />
                        <span className="text-sm">Real-time blacklist queries before loan approval</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-sm">Cross-institution fraud prevention</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <RefreshCw className="w-5 h-5 text-red-500" />
                        <span className="text-sm">Automated updates from all participating lenders</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-red-500" />
                        <span className="text-sm">Detailed default history and documentation</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-red-600">Blacklist Status Check</h4>
                      <span className="text-xs text-gray-400">Real-time</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-mono text-sm">ID: ACX-2025-001234</p>
                            <p className="text-xs text-gray-500">Tawanda M. • Harare, Zimbabwe</p>
                          </div>
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded-full">LISTED</span>
                        </div>
                        <p className="text-xs text-red-500 mt-2">Defaulted: 3 loans • Total: $1,450 • Since: Mar 2025</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-mono text-sm">ID: ACX-2025-005678</p>
                            <p className="text-xs text-gray-500">Terry J. • Accra, Ghana</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-600 text-[10px] font-black rounded-full">CLEAR</span>
                        </div>
                        <p className="text-xs text-green-600 mt-2">No blacklist records • Eligible for lending</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-mono text-sm">ID: ACX-2026-009127</p>
                            <p className="text-xs text-gray-500">Sarah A. • Nairobi, Kenya</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-600 text-[10px] font-black rounded-full">CLEAR</span>
                        </div>
                        <p className="text-xs text-green-600 mt-2">No blacklist records • Eligible for lending</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How Blacklisting Works */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 md:p-10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-wider mb-4">
                    <Repeat className="w-3 h-3" />
                    Blacklisting Protocol
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-3">
                    How the Blacklist System Works
                  </h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    A fair and transparent process for all parties involved
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-5 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserX className="w-6 h-6 text-red-500" />
                    </div>
                    <h4 className="font-bold mb-2">1. Institution Reports Default</h4>
                    <p className="text-sm text-gray-600">When a borrower defaults on a loan, the lending institution submits evidence to ACX's blacklist committee for review.</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Eye className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h4 className="font-bold mb-2">2. Review & Approval</h4>
                    <p className="text-sm text-gray-600">ACX reviews the submission to prevent false or retaliatory listings. Approved listings become visible to all partner institutions.</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserCheck className="w-6 h-6 text-green-500" />
                    </div>
                    <h4 className="font-bold mb-2">3. Removal Protocol</h4>
                    <p className="text-sm text-gray-600">Only the original institution that submitted the blacklist entry can request removal—after the borrower has fully repaid or reached a settlement agreement.</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-100 rounded-xl">
                  <p className="text-sm text-blue-800 text-center">
                    🔒 <span className="font-bold">Important:</span> Blacklisted borrowers remain visible to all partner institutions until the originating lender formally requests removal. This prevents borrowers from "shopping" for lenders after default.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Borrower/Consumer Section */}
        {activeTab === 'borrower' && (
          <section className="py-12 md:py-16 px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">
                  For Borrowers & Consumers
                </h2>
                <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                  Build your credit history, access fair loans, and improve your financial future with ACX's transparent credit scoring system.
                </p>
              </div>

              {/* Credit Score System */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 md:p-10 mb-16">
                <div className="text-center mb-10">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-3">
                    Your ACX Credit Score
                  </h3>
                  <p className="text-gray-600">A dynamic score from 300-850 based on your financial behavior</p>
                </div>
                
                {/* Score Bar - Low to High */}
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="inline-block bg-white rounded-2xl px-8 py-4 shadow-md">
                      <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Your Score Range</p>
                      <p className="text-5xl font-black text-guava-dark">300 → 850</p>
                      <p className="text-xs text-gray-400 mt-1">Poor → Excellent</p>
                    </div>
                  </div>

                  {/* Visual score bar */}
                  <div className="relative h-10 bg-gray-200 rounded-full overflow-hidden shadow-inner mb-6">
                    <div className="absolute h-full bg-red-500 w-[20%] left-0 flex items-center justify-center text-white text-[10px] font-bold">
                      300-579
                    </div>
                    <div className="absolute h-full bg-orange-500 w-[22%] left-[20%] flex items-center justify-center text-white text-[10px] font-bold">
                      580-669
                    </div>
                    <div className="absolute h-full bg-yellow-500 w-[17%] left-[42%] flex items-center justify-center text-white text-[10px] font-bold">
                      670-739
                    </div>
                    <div className="absolute h-full bg-emerald-400 w-[18%] left-[59%] flex items-center justify-center text-white text-[10px] font-bold">
                      740-799
                    </div>
                    <div className="absolute h-full bg-emerald-600 w-[23%] left-[77%] flex items-center justify-center text-white text-[10px] font-bold">
                      800-850
                    </div>
                  </div>

                  {/* Labels under the bar */}
                  <div className="flex text-[10px] md:text-xs font-medium mb-8">
                    <div className="flex-1 text-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1" />
                      <span className="text-red-600 font-bold">Bad</span>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mx-auto mb-1" />
                      <span className="text-orange-600 font-bold">Poor</span>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mb-1" />
                      <span className="text-yellow-600 font-bold">Fair</span>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mx-auto mb-1" />
                      <span className="text-emerald-600 font-bold">Good</span>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full mx-auto mb-1" />
                      <span className="text-emerald-700 font-bold">Excellent</span>
                    </div>
                  </div>
                </div>

                {/* Score Factors - Hurts (Red) on left, Helps (Green) on right */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  {/* What hurts your score - Red (LEFT) */}
                  <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                      <h4 className="font-bold text-red-700">✗ What Hurts Your Score</h4>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>Missing loan payment due dates</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>Defaulting on loans</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>Bounced debit orders or failed payments</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>Over-borrowing or having multiple active loans at once</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>Incomplete or unverified profile information</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>Spending more than 30% of monthly revenue on loan payments</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>No savings or investment accounts</span>
                      </li>
                    </ul>
                  </div>

                  {/* What helps your score - Green (RIGHT) */}
                  <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-bold text-emerald-700">✓ What Helps Your Score</h4>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Paying loans on time or early</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Completing loans successfully</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Keeping low credit utilization (using less than 30% of your monthly income)</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Having a longer positive credit history</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Completing your profile with verified documents</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Regular activity on your bank account</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Quick tip */}
                <div className="mt-6 p-4 bg-guava-orange/10 rounded-xl text-center">
                  <p className="text-sm text-guava-dark">
                    💡 <span className="font-bold">Pro Tip:</span> Setting up automatic payments is the easiest way to maintain a good credit score!
                  </p>
                </div>
              </div>

              {/* Borrower Pricing Plans */}
              <div className="mb-16">
                <div className="text-center mb-10">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter mb-3">
                    Consumer Plans
                  </h3>
                  <p className="text-gray-500 mb-4">Affordable plans with real-time credit monitoring</p>
                  
                  {/* Billing Toggle */}
                  <div className="inline-flex items-center gap-4 p-1 bg-gray-100 rounded-full">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                        billingCycle === 'monthly' 
                          ? 'bg-guava-orange text-white shadow-md' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                        billingCycle === 'yearly' 
                          ? 'bg-guava-orange text-white shadow-md' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Yearly <span className="text-[10px] text-guava-green ml-1">Save 15%</span>
                    </button>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {borrowerPricingPlans.map((plan) => (
                    <motion.div
                      key={plan.name}
                      whileHover={{ y: -8 }}
                      className={`rounded-2xl border-2 p-6 transition-all ${
                        plan.recommended 
                          ? 'border-guava-orange shadow-xl shadow-guava-orange/10 bg-white relative' 
                          : 'border-gray-100 hover:border-guava-orange/50'
                      }`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-guava-orange text-white text-[10px] font-black uppercase tracking-wider">
                          Best Value
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-4 mt-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          plan.recommended ? 'bg-guava-orange text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <plan.icon className="w-5 h-5" />
                        </div>
                        <h4 className="text-xl font-bold">{plan.name}</h4>
                      </div>
                      <div className="mb-4">
                        <span className="text-3xl font-black">{plan.price}</span>
                        <span className="text-gray-400 text-sm">/{plan.period}</span>
                        {plan.savings && billingCycle === 'yearly' && (
                          <p className="text-[10px] text-guava-green font-bold mt-1">{plan.savings}</p>
                        )}
                      </div>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-guava-green shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* How to Build Credit */}
              <div className="mb-16">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-center mb-8">
                  Simple Steps to Build Your Credit
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-guava-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-guava-green" />
                    </div>
                    <p className="font-bold text-sm">Pay on Time</p>
                    <p className="text-xs text-gray-500 mt-1">Set payment reminders</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-guava-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Wallet className="w-6 h-6 text-guava-green" />
                    </div>
                    <p className="font-bold text-sm">Complete Loans</p>
                    <p className="text-xs text-gray-500 mt-1">Full repayment builds history</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-guava-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-guava-green" />
                    </div>
                    <p className="font-bold text-sm">Verify Your Profile</p>
                    <p className="text-xs text-gray-500 mt-1">Add ID and documents</p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-guava-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-6 h-6 text-guava-green" />
                    </div>
                    <p className="font-bold text-sm">Borrow Responsibly</p>
                    <p className="text-xs text-gray-500 mt-1">Only borrow what you need</p>
                  </div>
                </div>
              </div>

              {/* Benefits of Good Credit */}
              <div className="bg-gradient-to-r from-guava-green/10 to-guava-orange/10 rounded-3xl p-8 md:p-10">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-center mb-8">
                  Benefits of a Good Credit Score
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                      <DollarSign className="w-8 h-8 text-guava-green" />
                    </div>
                    <p className="font-bold">Lower Interest Rates</p>
                    <p className="text-sm text-gray-600">Save money on every loan</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                      <Award className="w-8 h-8 text-guava-green" />
                    </div>
                    <p className="font-bold">Higher Loan Limits</p>
                    <p className="text-sm text-gray-600">Access more capital</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                      <Zap className="w-8 h-8 text-guava-green" />
                    </div>
                    <p className="font-bold">Instant Approvals</p>
                    <p className="text-sm text-gray-600">Faster access to funds</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-guava-orange/10 py-16 px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">
              Ready to Join the ACX Network?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whether you're looking to deploy capital or build credit history, ACX is your gateway to African financial growth.
            </p>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}