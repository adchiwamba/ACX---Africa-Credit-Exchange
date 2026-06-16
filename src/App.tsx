/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import { useNotify } from './lib/NotificationContext';

function AppContent() {
  const { profile: user, loading, login, sandboxLogin, logout, updateProfile } = useFirebase();
  const { notify } = useNotify();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  useEffect(() => {
    if (user?.role && !localStorage.getItem('acx_original_role')) {
      localStorage.setItem('acx_original_role', user.role);
    }
  }, [user]);

  // Inactivity timer (15 minutes)
  const userUid = user?.uid;
  useEffect(() => {
    if (!userUid) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleInactivityLogout = () => {
      // Clear localStorage logic
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('acx_') && key !== 'acx_custom_users') {
          localStorage.removeItem(key);
        }
      });
      logout();
      notify('warning', 'Session Expired', 'You have been logged out due to 15 minutes of inactivity.');
    };

    const resetTimer = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        handleInactivityLogout();
      }, 15 * 60 * 1000); // 15 minutes
    };

    // Set initial timer
    resetTimer();

    // Event listeners to detect user activity
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    const handler = () => resetTimer();

    events.forEach(event => {
      window.addEventListener(event, handler);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      events.forEach(event => {
        window.removeEventListener(event, handler);
      });
    };
  }, [userUid, logout, notify]);

  const handleLogout = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('acx_') && key !== 'acx_custom_users') {
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
      if (sandboxLogin) {
        await sandboxLogin(newUser);
        return;
      }
    }
    await login();
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
        <Route path="/how-it-works" element={<HowItWorks user={user} onLogin={handleLogin} />} />
        
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
  onDeposit,
  isDepositModalOpen,
  onDepositClose,
  onUpdateBalance
}: { 
  user: UserProfile; 
  onLogout: () => void;
  onDeposit: () => void;
  isDepositModalOpen: boolean;
  onDepositClose: () => void;
  onUpdateBalance: (amount: number) => void;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#0F172A] font-sans text-black dark:text-white transition-colors">
      <Navbar 
        user={user} 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        onLogout={onLogout}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isOpen={isSidebarOpen} 
          user={user} 
          onClose={() => setIsSidebarOpen(false)}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
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