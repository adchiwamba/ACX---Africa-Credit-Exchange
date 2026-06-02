/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { UserProfile, UserRole } from './types';
import { cn } from './lib/utils';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SupportWidget from './components/SupportWidget';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import LoanApplication from './pages/LoanApplication';
import Portfolio from './pages/Portfolio';
import AdminPanel from './pages/AdminPanel';
import LenderProfile from './pages/LenderProfile';
import BorrowerProfile from './pages/BorrowerProfile';
import Checkout from './pages/Checkout';
import Repayments from './pages/Repayments';
import Reports from './pages/Reports';
import BlacklistManager from './pages/BlacklistManager';
import MarketMaker from './pages/MarketMaker';
import Settings from './pages/Settings';
import MerchantLedger from './pages/MerchantLedger';
import DepositModal from './components/DepositModal';
import HowItWorks from './pages/HowItWorks';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';

function AppContent() {
  const { profile: user, loading, login, logout, updateProfile } = useFirebase();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const handleLogout = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('acx_')) {
        localStorage.removeItem(key);
      }
    });
    logout();
  };

  const handleLogin = async (newUser?: UserProfile) => {
    if (newUser?.role && !localStorage.getItem('acx_preferred_role')) {
      localStorage.setItem('acx_preferred_role', newUser.role);
    }
    if (newUser?.displayName) {
      localStorage.setItem('acx_preferred_display_name', newUser.displayName);
    }
    if (newUser) {
      localStorage.setItem('acx_registration_data', JSON.stringify({
        country: newUser.country,
        phoneCode: newUser.phoneCode,
        languages: newUser.languages,
        preferredCurrencies: newUser.preferredCurrencies,
        photoURL: newUser.photoURL,
        organizationDetails: newUser.organizationDetails
      }));
    }
    await login();
  };

  const switchRole = async (role: UserRole) => {
    if (user) {
      await updateProfile({ role });
    }
  };

  const updateBalance = async (amount: number) => {
    if (user) {
      const newBalance = (user.balance || 0) + amount;
      await updateProfile({ balance: newBalance });
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-[#0F172A]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-guava-orange"></div>
      </div>
    );
  }

  // Wrap everything in Router
  return (
    <Router>
      <Routes>
        {/* Public routes - no login required */}
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path='/login' element={<LoginPage/>} />
        <Route path='/signup' element={<SignupPage/>} />
        
        {/* Protected routes - require login */}
        <Route 
          path="/*" 
          element={
            !user ? (
              <LandingPage onLogin={handleLogin} />
            ) : (
              <AuthenticatedApp 
                user={user}
                onLogout={handleLogout}
                onSwitchRole={switchRole}
                onDeposit={() => setIsDepositModalOpen(true)}
                isDepositModalOpen={isDepositModalOpen}
                onDepositClose={() => setIsDepositModalOpen(false)}
                onUpdateBalance={updateBalance}
              />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

// Separate component for authenticated app to avoid conditional hook issues
function AuthenticatedApp({ 
  user, 
  onLogout, 
  onSwitchRole, 
  onDeposit,
  isDepositModalOpen,
  onDepositClose,
  onUpdateBalance
}: { 
  user: UserProfile; 
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onDeposit: () => void;
  isDepositModalOpen: boolean;
  onDepositClose: () => void;
  onUpdateBalance: (amount: number) => void;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] dark:bg-[#0F172A] font-sans text-[#1A1A1A] dark:text-white/90 transition-colors">
      <Navbar 
        user={user} 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        onLogout={onLogout}
        onSwitchRole={onSwitchRole}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          user={user} 
          onClose={() => setIsSidebarOpen(false)} 
          onDeposit={onDeposit}
        />
        
        <main className={cn(
          "flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 lg:p-10 transition-all duration-300 bg-white dark:bg-[#0F172A]",
          isSidebarOpen ? "lg:ml-0" : "lg:ml-0"
        )}>
          <div className="max-w-[1600px] mx-auto w-full">
            <Routes>
              <Route path="/" element={<Dashboard key={user.uid} user={user} />} />
              <Route path="/dashboard" element={<Dashboard key={user.uid} user={user} />} />
              <Route path="/marketplace" element={<Marketplace user={user} />} />
              <Route path="/apply" element={<LoanApplication user={user} />} />
              <Route path="/portfolio" element={<Portfolio user={user} onDeposit={onDeposit} />} />
              <Route path="/profile" element={<BorrowerProfile key={user.uid} user={user} />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/lender-profile" element={<LenderProfile key={user.uid} user={user} />} />
              <Route path="/repayments" element={<Repayments user={user} />} />
              <Route path="/merchant-ledger" element={<MerchantLedger user={user} />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/market-maker" element={<MarketMaker user={user} />} />
              <Route path="/blacklist" element={<BlacklistManager user={user} />} />
              <Route path="/settings" element={<Settings user={user} />} />
              <Route path="/admin" element={user.role === UserRole.ADMIN ? <AdminPanel /> : <Navigate to="/dashboard" />} />

              
            </Routes>
          </div>
        </main>
        <SupportWidget />
        <DepositModal 
          isOpen={isDepositModalOpen} 
          onClose={onDepositClose} 
          onDeposit={onUpdateBalance}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}