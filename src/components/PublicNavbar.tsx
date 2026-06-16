// components/PublicNavbar.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Lock,
  Cpu,
  Shield,
  Key,
  Phone,
  Globe,
  User,
  Landmark,
  Camera,
  UserPlus,
  RefreshCw,
  Eye,
  EyeOff,
  Building,
  Zap,
} from "lucide-react";
import { UserRole, UserProfile } from "../types";
import { BusinessLocationMap } from "./BusinessLocationMap";
import { COUNTRIES, CURRENCIES } from "../constants/countries";
import { MOCK_USERS } from "../lib/store";
import { Link } from "react-router-dom";
import AcxLogo from "./AcxLogo";
import { compressImage } from "../lib/utils";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { evaluatePasswordStrength, registrationSchema, passwordRequirements } from "../lib/validation";

interface PublicNavbarProps {
  onLogin: (user: UserProfile) => void;
}

export default function PublicNavbar({ onLogin }: PublicNavbarProps) {
  // Auth Modal State
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(1);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [expectedCode, setExpectedCode] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFinalizingRegistration, setIsFinalizingRegistration] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmailError, setResetEmailError] = useState("");
  const [resetEmailLoading, setResetEmailLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [simulationActive, setSimulationActive] = useState<string | null>(null);

  // Admin Login State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const [adminPassword, setAdminPassword] = useState("");

  const [showRegistrationPassword, setShowRegistrationPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ displayName?: string; email?: string; physicalAddress?: string; password?: string; confirmPassword?: string }>({});

  // Form Data for Registration
  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    physicalAddress: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    country: "",
    phoneCode: "",
    preferredCurrencies: [] as string[],
    languages: ["English"] as string[],
    photoURL: "",
    password: "",
    confirmPassword: "",
    organizationDetails: {
      companySize: "",
      contactPerson: "",
      industry: "",
      taxId: "",
    },
  });

  const resetFormFields = (keepRoleAndStep = false) => {
    setLoginEmail("");
    setLoginPassword("");
    setTwoFactorCode("");
    setExpectedCode(null);
    setResetEmailSent(false);
    setResetEmailError("");
    setShowRegistrationPassword(false);
    setShowConfirmPassword(false);
    setShowLoginPassword(false);
    setShowAdminPassword(false);
    setValidationErrors({});
    setIsLoggingIn(false);
    setIsFinalizingRegistration(false);
    if (!keepRoleAndStep) {
      setSelectedRole(null);
      setStep(1);
    }
    setFormData({
      displayName: "",
      email: "",
      physicalAddress: "",
      latitude: undefined,
      longitude: undefined,
      country: "",
      phoneCode: "",
      preferredCurrencies: [],
      languages: ["English"],
      photoURL: "",
      password: "",
      confirmPassword: "",
      organizationDetails: {
        companySize: "",
        contactPerson: "",
        industry: "",
        taxId: "",
      },
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSimulationActive("photo");
      try {
        const compressedBase64 = await compressImage(file);
        setFormData((prev) => ({ ...prev, photoURL: compressedBase64 }));
      } catch (err) {
        console.error("Failed to compress image:", err);
      } finally {
        setSimulationActive(null);
      }
    }
  };

  const toggleCurrency = (cur: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredCurrencies: prev.preferredCurrencies.includes(cur)
        ? prev.preferredCurrencies.filter((c) => c !== cur)
        : [...prev.preferredCurrencies, cur],
    }));
  };


  const initiate2FA = async () => {
    setValidationErrors({});
    const validationResult = registrationSchema.safeParse({
      displayName: formData.displayName,
      email: formData.email,
      physicalAddress: formData.physicalAddress,
      password: formData.password,
    });

    const fieldErrors: { displayName?: string; email?: string; physicalAddress?: string; password?: string; confirmPassword?: string } = {};
    if (!validationResult.success) {
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as "displayName" | "email" | "physicalAddress" | "password"] = err.message;
        }
      });
    }

    if (formData.password !== formData.confirmPassword) {
      fieldErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setValidationErrors(fieldErrors);
      return;
    }

    setIsSendingCode(true);
    try {
      // Simulate 2FA code for demo
      const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedCode(demoCode);
      setStep(3);
      setIsVerifying2FA(true);
    } catch (error) {
      console.error("Failed to initiate 2FA:", error);
      alert("Failed to connect to the authorization server.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyAndFinalize = async () => {
    if (twoFactorCode !== expectedCode) {
      alert(
        "Invalid code. Please enter the correct 6-digit synchronization key.",
      );
      return;
    }

    setIsFinalizingRegistration(true);
    // Simulate secure 2FA and registration completion delay to prevent duplicate submissions
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newUser: UserProfile = {
      uid: "USR-" + Math.floor(Math.random() * 100000),
      email: formData.email || "user@acx.africa",
      displayName: formData.displayName || "Anonymous Node",
      password: formData.password,
      physicalAddress: formData.physicalAddress,
      latitude: formData.latitude,
      longitude: formData.longitude,
      role: selectedRole || UserRole.BORROWER,
      creditScore: selectedRole === UserRole.BORROWER ? 650 : 0,
      kycStatus: "PENDING",
      currency: formData.preferredCurrencies[0] || "USD",
      preferredCurrencies: formData.preferredCurrencies,
      balance: 0,
      country: formData.country,
      phoneCode: formData.phoneCode,
      languages: formData.languages,
      photoURL: formData.photoURL,
      organizationDetails:
        selectedRole === UserRole.LENDER
          ? formData.organizationDetails
          : undefined,
      is2FAEnabled: true,
    };

    // Save newly registered user to localStorage custom users registry
    try {
      const customUsersRaw = localStorage.getItem('acx_custom_users');
      let customUsers: UserProfile[] = [];
      if (customUsersRaw) {
        customUsers = JSON.parse(customUsersRaw);
      }
      // Avoid duplicate registrations
      customUsers = customUsers.filter(u => u.email.toLowerCase() !== newUser.email.toLowerCase());
      customUsers.push(newUser);
      localStorage.setItem('acx_custom_users', JSON.stringify(customUsers));

      // Also persist to cloud Firestore
      await setDoc(doc(db, 'users', newUser.uid), newUser);
    } catch (e) {
      console.error("Failed to persist newly registered custom user to memory/cloud:", e);
    }

    setIsFinalizingRegistration(false);
    onLogin(newUser);
    setShowAuthModal(false);
    resetFormFields();
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      setResetEmailError("Please enter your email in the Email field above first.");
      setResetEmailSent(false);
      return;
    }
    
    setResetEmailLoading(true);
    setResetEmailError("");
    setResetEmailSent(false);
    
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      setResetEmailSent(true);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === "auth/user-not-found") {
        setResetEmailError("No registered merchant account was found with this email.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setResetEmailError("The entered email address is not in a valid format.");
      } else {
        setResetEmailError(firebaseError.message || "Failed to send reset email. Please try again.");
      }
    } finally {
      setResetEmailLoading(false);
    }
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsLoggingIn(true);
    // Simulate login verification delay to prevent duplicate submissions
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Check custom registrations first, then default MOCK_USERS
    let customUsers: UserProfile[] = [];
    try {
      const customUsersRaw = localStorage.getItem('acx_custom_users');
      if (customUsersRaw) {
        customUsers = JSON.parse(customUsersRaw);
      }
    } catch (e) {
      console.error("Failed to parse custom registrations", e);
    }

    const allUsers = [...customUsers, ...MOCK_USERS];
    let user = allUsers.find((u) => u.email.trim().toLowerCase() === loginEmail.trim().toLowerCase());
    
    // If not found in local mock state, check Firestore cloud database for an existing account
    if (!user) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', loginEmail.trim().toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          user = { uid: querySnapshot.docs[0].id, ...docData } as UserProfile;
        }
      } catch (err) {
        console.error("Firestore cloud lookup failed:", err);
      }
    }

    if (user) {
      const correctPassword = user.password || 'password';
      if (loginPassword === correctPassword) {
        onLogin(user);
        setShowAuthModal(false);
        resetFormFields();
      } else {
        alert("Invalid credentials. Please verify your password.");
      }
    } else {
      alert(
        "Invalid credentials or user not found. Please register if you don't have an account.",
      );
    }
    setIsLoggingIn(false);
  };

  const handleAdminLogin = () => {
    const secret = import.meta.env.VITE_ADMIN_PASSWORD || "admin123";
    if (adminPassword === secret) {
      const adminUser = MOCK_USERS.find((u) => u.role === UserRole.ADMIN);
      if (adminUser) {
        onLogin(adminUser);
        setShowAdminLogin(false);
        setAdminPassword("");
      }
    } else {
      setAdminPassword("");
      setAdminClicks(0);
      setShowAdminLogin(false);
      alert("Unauthorized access attempt logged.");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLogoClick = () => {
    const newCount = adminClicks + 1;
    setAdminClicks(newCount);
    if (newCount >= 7) {
      setShowAdminLogin(true);
      setAdminClicks(0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigateToHowItWorks = () => {
    window.location.href = "/how-it-works";
  };

  const openLoginModal = () => {
    setAuthMode("login");
    setShowAuthModal(true);
  };

  const openRegisterModal = () => {
    setAuthMode("register");
    setSelectedRole(null);
    setStep(1);
    setShowAuthModal(true);
  };

  useEffect(() => {
    const handleTriggerRegister = () => {
      openRegisterModal();
    };
    window.addEventListener("trigger-acx-signup", handleTriggerRegister);
    return () => {
      window.removeEventListener("trigger-acx-signup", handleTriggerRegister);
    };
  }, []);

  const pwStrength = evaluatePasswordStrength(formData.password);

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
                  <h2 className="text-xl font-black text-white tracking-tighter">
                    RESTRICTED ACCESS
                  </h2>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">
                    Administrator Authorization Required
                  </p>
                </div>
                <div className="w-full space-y-3">
                  <div className="relative">
                    <input
                      id="nav-admin-password-input"
                      type={showAdminPassword ? "text" : "password"}
                      autoFocus
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                      placeholder="••••••••"
                      className="w-full pl-6 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-center text-white outline-none focus:border-guava-orange transition-all font-mono"
                    />
                    <button
                      id="nav-admin-password-toggle"
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                      aria-label={showAdminPassword ? "Hide password" : "Show password"}
                    >
                      {showAdminPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAdminLogin(false);
                        setAdminPassword("");
                      }}
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
                <p className="text-white/20 text-[7px] font-bold tracking-widest uppercase">
                  Encryption Mode: AES-256-GCM ACTIVE
                </p>
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
            className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row overflow-y-auto md:overflow-hidden h-screen w-screen"
          >
            {/* Left visual column - Majestic high-fidelity vertical finance architecture for ACX */}
            <div className="relative w-full md:w-1/2 lg:w-[52%] h-[400px] md:h-full bg-slate-950 flex flex-col p-6 md:p-10 text-white overflow-hidden shrink-0">
              <div className="absolute inset-0 z-0 select-none pointer-events-none">
                <img
                  src="/src/assets/images/acx_sovereign_nodes_1780667190940.png"
                  alt="ACX Sovereign Credit Explorer"
                  className="w-full h-full object-cover scale-105 opacity-40 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-slate-950/85" />
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/30 to-transparent" />
                
                {/* Visual narrative pattern representing trade maps for ACX */}
                <svg className="absolute inset-0 w-full h-full opacity-20 mix-blend-screen" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="gridNavbar" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#gridNavbar)" />
                </svg>
              </div>
              
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <AcxLogo size="sm" />
                  <span className="text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent">ACX</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold text-white/95 max-w-max">
                  <span className="w-1.5 h-1.5 rounded-full bg-guava-green animate-pulse" />
                  Africa Credit Exchange
                </div>
              </div>

              <div className="relative z-10 flex-grow py-5 md:py-8 flex flex-col justify-center">
                <div className="space-y-0.5">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-none text-white uppercase">
                    SOVEREIGN TRUST.
                  </h1>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-none uppercase bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent">
                    GLOBAL LIQUIDITY.
                  </h1>
                </div>
                <p className="text-slate-350 text-xs md:text-sm mt-3.5 leading-relaxed font-sans font-medium max-w-sm">
                  Connecting institutional business lenders directly to consumer credit passports in over 52 African markets.
                </p>

                {/* Live Micro-Telemetry Stat Feed - completely unique to ACX fintech, and highly interactive! */}
                <div className="mt-5 p-4 bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl max-w-lg hidden lg:block transition-all duration-300">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-guava-orange animate-ping" />
                      {selectedRole === UserRole.LENDER ? "LIQUIDITY VAULT INDICES (BUSINESS)" : "CREDIT PASSPORT SUBSYSTEM (CONSUMER)"}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">NODE: UTC {new Date().toISOString().slice(11, 19)}</span>
                  </div>
                  
                  {selectedRole === UserRole.LENDER ? (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-guava-orange shrink-0" />
                          Lagos Sovereign Pool (Active)
                        </span>
                        <span className="text-white font-bold font-mono">₦ 1,248,500,000</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Landmark className="w-3.5 h-3.5 text-guava-orange shrink-0" />
                          Johannesburg Liquidity Core
                        </span>
                        <span className="text-white font-bold font-mono">R 45,210,000</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-guava-green shrink-0" />
                          Consolidated Trade Yield
                        </span>
                        <span className="text-guava-green font-bold font-mono">+12.4% Annualized</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-guava-green shrink-0" />
                          Alternative Trust Passport
                        </span>
                        <span className="text-white font-bold font-mono">724 Score (Tier-A)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5 text-guava-green shrink-0" />
                          Nairobi SME Liquidity
                        </span>
                        <span className="text-white font-bold font-mono font-mono">KSh 120,400,000</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-guava-orange shrink-0" />
                          Underwriting Processing Speed
                        </span>
                        <span className="text-guava-orange font-bold font-mono">Instant (AI scored)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Available Portals Lists - customized to look uniquely original and matching ACX colors */}
                <div className="mt-5 space-y-2.5 max-w-lg hidden sm:block">
                  <p className="text-[10px] font-black tracking-wider text-slate-400 uppercase">ACCESS GATEWAYS</p>
                  
                  {/* Card 1: Business / Lenders */}
                  <div 
                    onClick={() => {
                      setSelectedRole(UserRole.LENDER);
                      localStorage.setItem("acx_preferred_role", UserRole.LENDER);
                      if (authMode === "login") {
                        if (!loginEmail || loginEmail.trim() === "" || loginEmail === "borrower@example.com" || loginEmail === "lender@example.com") {
                          setLoginEmail("lender@example.com");
                          setLoginPassword("password");
                        }
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                      selectedRole === UserRole.LENDER 
                        ? "bg-white/10 border-guava-orange/40 shadow-lg scale-[1.02] bg-gradient-to-r from-slate-900 to-slate-950" 
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-guava-orange/20 border border-guava-orange/30 flex items-center justify-center shrink-0 text-guava-orange">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5 justify-between">
                        Business Portal
                        {selectedRole === UserRole.LENDER && <span className="w-1.5 h-1.5 rounded-full bg-guava-orange animate-pulse" />}
                      </h4>
                      <p className="text-[9px] text-slate-300 font-sans mt-0.5 font-medium">
                        Deploy liquidity pools, underwrite alternative credit cards, and manage indices.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Consumers */}
                  <div 
                    onClick={() => {
                      setSelectedRole(UserRole.BORROWER);
                      localStorage.setItem("acx_preferred_role", UserRole.BORROWER);
                      if (authMode === "login") {
                        if (!loginEmail || loginEmail.trim() === "" || loginEmail === "lender@example.com" || loginEmail === "borrower@example.com") {
                          setLoginEmail("borrower@example.com");
                          setLoginPassword("password");
                        }
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                      selectedRole === UserRole.BORROWER 
                        ? "bg-white/10 border-guava-green/40 shadow-lg scale-[1.02] bg-gradient-to-r from-slate-900 to-slate-950" 
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-guava-green/20 border border-guava-green/30 flex items-center justify-center shrink-0 text-guava-green">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5 justify-between">
                        Consumer Portal
                        {selectedRole === UserRole.BORROWER && <span className="w-1.5 h-1.5 rounded-full bg-guava-green animate-pulse" />}
                      </h4>
                      <p className="text-[9px] text-slate-300 font-sans mt-0.5 font-medium">
                        Establish alternative identity, manage smart repay channels, and borrow liquidity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secure note */}
              <div className="relative z-10 flex items-center gap-1.5 text-[10px] text-slate-400 font-sans font-semibold mt-auto pt-4 border-t border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-guava-green animate-ping" />
                Dual-route gateway secured by Guava API Framework
              </div>
            </div>

            {/* Right forms column */}
            <div className="w-full md:w-1/2 lg:w-[48%] h-full bg-white flex flex-col justify-center p-6 md:p-12 overflow-y-auto relative shrink-0">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  resetFormFields();
                }}
                className="absolute top-6 right-6 p-2.5 hover:bg-slate-50 border border-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-800 cursor-pointer z-20 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-w-md w-full mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={authMode}
                    initial={{ opacity: 0, y: 8, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.99 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="w-full"
                  >
                    {authMode === "register" ? (
                      <>
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex gap-1.5 flex-1 mr-3">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full ${step >= i ? "bg-guava-orange" : "bg-gray-100"}`}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => setAuthMode("login")}
                          className="text-[10px] font-black uppercase tracking-widest text-guava-orange hover:underline shrink-0 cursor-pointer"
                        >
                          Login Instead
                        </button>
                      </div>
                      <div className="mb-4 text-left border-l-2 border-guava-orange pl-3 py-0.5">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                          Join ACX
                        </p>
                        <p className="text-[10px] font-medium text-slate-500">
                          Connecting Opportunity, Empowering Growth
                        </p>
                      </div>
                      <p className="text-gray-400 text-xs font-medium">
                        Step {step}:{" "}
                        {step === 1
                          ? "Archetype"
                          : step === 2
                            ? "Registration Details"
                            : "2FA Authorization"}
                      </p>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`step-${step}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full"
                      >
                        {step === 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          {
                            role: UserRole.LENDER,
                            title: "Business",
                            icon: Landmark,
                            desc: "Deploy capital, manage credit lines, or run merchant/retailer nodes.",
                          },
                          {
                            role: UserRole.BORROWER,
                            title: "Consumer",
                            icon: User,
                            desc: "Initialize credit passport, borrow, or buy-now pay-later.",
                          },
                        ].map((r) => (
                          <button
                            key={r.role}
                            onClick={() => {
                              localStorage.setItem(
                                "acx_preferred_role",
                                r.role,
                              );
                              setSelectedRole(r.role);
                              setStep(2);
                            }}
                            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer group ${
                              selectedRole === r.role 
                                ? (r.role === UserRole.LENDER ? "border-guava-orange bg-orange-50/45 text-slate-900" : "border-guava-green bg-green-50/45 text-slate-900") 
                                : "border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            <r.icon
                              className={`w-5 h-5 mb-2 transition-transform duration-300 group-hover:scale-110 ${
                                selectedRole === r.role 
                                  ? (r.role === UserRole.LENDER ? "text-guava-orange" : "text-guava-green") 
                                  : "text-gray-400"
                              }`}
                            />
                            <h4 className="text-base font-black tracking-tighter mb-1">
                              {r.title}
                            </h4>
                            <p className="text-[9px] text-gray-400 font-medium">
                              {r.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-5">
                        <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-5">
                          {/* Profile Identity Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">
                                {selectedRole === UserRole.BORROWER ? "Full Name (Individual)" : "Full Name / Entity Name"}
                              </label>
                              <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    displayName: e.target.value,
                                  })
                                }
                                placeholder={selectedRole === UserRole.BORROWER ? "e.g. Andy Moyo" : "e.g. Phoenix Ventures"}
                                className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-sans font-medium outline-none transition-all ${
                                  selectedRole === UserRole.BORROWER 
                                    ? "focus:border-guava-green focus:ring-2 focus:ring-guava-green/10" 
                                    : "focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/10"
                                }`}
                              />
                              {validationErrors.displayName && (
                                <p className="text-[10px] text-red-500 font-bold mt-1 ml-3 animate-pulse">
                                  ⚠️ {validationErrors.displayName}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">
                                Email Address
                              </label>
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    email: e.target.value,
                                  })
                                }
                                placeholder="node@acx.africa"
                                className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-sans font-medium outline-none transition-all ${
                                  selectedRole === UserRole.BORROWER 
                                    ? "focus:border-guava-green focus:ring-2 focus:ring-guava-green/10" 
                                    : "focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/10"
                                }`}
                              />
                              {validationErrors.email && (
                                <p className="text-[10px] text-red-500 font-bold mt-1 ml-3 animate-pulse">
                                  ⚠️ {validationErrors.email}
                                </p>
                              )}
                            </div>

                            {/* Physical Address */}
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">
                                Physical Address
                              </label>
                              <input
                                type="text"
                                value={formData.physicalAddress}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    physicalAddress: e.target.value,
                                  })
                                }
                                placeholder="e.g. Plot 304, Guava Avenue, Kampala, Uganda"
                                className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-sans font-medium outline-none transition-all ${
                                  selectedRole === UserRole.BORROWER 
                                    ? "focus:border-guava-green focus:ring-2 focus:ring-guava-green/10" 
                                    : "focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/10"
                                }`}
                              />
                              {validationErrors.physicalAddress && (
                                <p className="text-[10px] text-red-500 font-bold mt-1 ml-3 animate-pulse">
                                  ⚠️ {validationErrors.physicalAddress}
                                </p>
                              )}
                            </div>

                            {/* Business Location Map embedding */}
                            <div className="md:col-span-2">
                              <BusinessLocationMap
                                physicalAddress={formData.physicalAddress}
                                latitude={formData.latitude}
                                longitude={formData.longitude}
                                onLocationSelected={(lat, lng) =>
                                  setFormData({
                                    ...formData,
                                    latitude: lat,
                                    longitude: lng,
                                  })
                                }
                                primaryColor={selectedRole === UserRole.BORROWER ? "#22c55e" : "#f97316"}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">
                              Access Password
                            </label>
                            <div className="relative">
                              <input
                                id="nav-reg-password-input"
                                type={showRegistrationPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    password: e.target.value,
                                  })
                                }
                                placeholder="Set a secure password"
                                className={`w-full pl-4 pr-11 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-sans font-medium outline-none transition-all ${
                                  selectedRole === UserRole.BORROWER 
                                    ? "focus:border-guava-green focus:ring-2 focus:ring-guava-green/10" 
                                    : "focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/10"
                                }`}
                              />
                              <button
                                id="nav-reg-password-toggle"
                                type="button"
                                onClick={() => setShowRegistrationPassword(!showRegistrationPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label={showRegistrationPassword ? "Hide password" : "Show password"}
                              >
                                {showRegistrationPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            {validationErrors.password && (
                              <p className="text-[10px] text-red-500 font-bold mt-1 ml-3">
                                ⚠️ {validationErrors.password}
                              </p>
                            )}

                            {formData.password && (
                              <div className="mt-2.5 p-3.5 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-400 font-black text-[9px] uppercase tracking-widest">
                                    Strength Indicator:
                                  </span>
                                  <span className={`text-[10px] ${pwStrength.colorClass}`}>
                                    {pwStrength.status}
                                  </span>
                                </div>
                                
                                {/* Visual Strength Meter */}
                                <div className="grid grid-cols-5 gap-1.5">
                                  {[1, 2, 3, 4, 5].map((level) => (
                                    <div
                                      key={level}
                                      className={`h-1.5 rounded-full transition-all duration-300 ${
                                        level <= pwStrength.score
                                          ? pwStrength.progressBarColorClass
                                          : "bg-gray-100"
                                      }`}
                                    />
                                  ))}
                                </div>

                                {/* Live Checklist */}
                                <div className="pt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 border-t border-gray-100/60 mt-1">
                                  {Object.values(passwordRequirements).map((req) => {
                                    const isMet = req.test(formData.password);
                                    return (
                                      <div key={req.id} className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMet ? "bg-green-500" : "bg-gray-300"}`} />
                                        <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${isMet ? "text-green-600 line-through" : "text-gray-400"}`}>
                                          {req.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">
                              Confirm Password
                            </label>
                            <div className="relative">
                              <input
                                id="nav-reg-confirm-password-input"
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    confirmPassword: e.target.value,
                                  })
                                }
                                placeholder="Confirm your password"
                                className={`w-full pl-4 pr-11 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-sans font-medium outline-none transition-all ${
                                  selectedRole === UserRole.BORROWER 
                                    ? "focus:border-guava-green focus:ring-2 focus:ring-guava-green/10" 
                                    : "focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/10"
                                }`}
                              />
                              <button
                                id="nav-reg-confirm-password-toggle"
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            {validationErrors.confirmPassword && (
                              <p className="text-[10px] text-red-500 font-bold mt-1 ml-3">
                                ⚠️ {validationErrors.confirmPassword}
                              </p>
                            )}
                          </div>

                          {/* Upload Logo & Identity */}
                          <div className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                            <div className="relative group shrink-0">
                              <div className="w-16 h-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-guava-orange">
                                {formData.photoURL ? (
                                  <img
                                    src={formData.photoURL}
                                    alt="Node Identity"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-center p-1">
                                    <Camera className="w-5 h-5 text-gray-400 mx-auto" />
                                    <p className="text-[6px] font-black uppercase tracking-widest text-gray-400">
                                      Upload
                                    </p>
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  document.getElementById("file-input")?.click()
                                }
                                disabled={!!simulationActive}
                                className="absolute -bottom-1 -right-1 w-6 h-6 bg-guava-orange text-white rounded-md flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer text-center"
                              >
                                {simulationActive === "photo" ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <UserPlus className="w-3 h-3" />
                                )}
                              </button>
                              <input
                                id="file-input"
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                              />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-gray-700">
                                Identity Representation
                              </h4>
                              <p className="text-[9px] text-gray-400 font-medium">
                                {selectedRole === UserRole.LENDER
                                  ? "Institutional Logo (preferred: square PNG)"
                                  : "Personal Identity Avatar"}
                              </p>
                            </div>
                          </div>

                          {/* Localization Details */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">
                                <Phone className="w-3 h-3" /> Dial Code
                              </label>
                              <select
                                value={formData.phoneCode}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    phoneCode: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-sans font-medium outline-none focus:border-guava-orange transition-all appearance-none cursor-pointer"
                              >
                                <option value="" className="text-black">
                                  Select Code
                                </option>
                                {(COUNTRIES || []).map((c) => (
                                  <option
                                    key={c.code}
                                    value={c.phone}
                                    className="text-black"
                                  >
                                    {c.phone} ({c.code})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">
                                <Globe className="w-3 h-3" /> Host Nation
                              </label>
                              <select
                                value={formData.country}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    country: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-sans font-medium outline-none focus:border-guava-orange transition-all appearance-none cursor-pointer"
                              >
                                <option value="" className="text-black">
                                  Select Country
                                </option>
                                {(COUNTRIES || []).map((c) => (
                                  <option
                                    key={c.code}
                                    value={c.name}
                                    className="text-black"
                                  >
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Preferences Group */}
                          <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-3">
                                Currency
                              </label>
                              <div className="flex flex-wrap gap-1">
                                {CURRENCIES.map((cur) => (
                                  <button
                                    key={cur}
                                    type="button"
                                    onClick={() => toggleCurrency(cur)}
                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all border cursor-pointer ${formData.preferredCurrencies.includes(cur) ? "bg-black text-white border-black" : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200"}`}
                                  >
                                    {cur}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Lender Specific Configuration */}
                          {selectedRole === UserRole.LENDER && (
                            <div className="p-4 bg-orange-50/20 rounded-2xl border border-orange-100/50 space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-wider text-guava-orange">
                                Business Categories Attributes
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-2">
                                    Industry
                                  </label>
                                  <select
                                    value={
                                      formData.organizationDetails.industry
                                    }
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        organizationDetails: {
                                          ...formData.organizationDetails,
                                          industry: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-sans font-medium outline-none focus:border-guava-orange transition-all cursor-pointer"
                                  >
                                    <option value="">Select</option>
                                    <option value="Fintech">Fintech</option>
                                    <option value="Retailer">Retailer</option>
                                    <option value="Banking">Banking</option>
                                    <option value="VC">VC</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-2">
                                    Company Size
                                  </label>
                                  <select
                                    value={
                                      formData.organizationDetails.companySize
                                    }
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        organizationDetails: {
                                          ...formData.organizationDetails,
                                          companySize: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-sans font-medium outline-none focus:border-guava-orange transition-all cursor-pointer"
                                  >
                                    <option value="">Select</option>
                                    <option value="1-10">1-10</option>
                                    <option value="11-50">11-50</option>
                                    <option value="51-200">51-200</option>
                                    <option value="200+">200+</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-2">
                                    Contact Person
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Name"
                                    value={
                                      formData.organizationDetails.contactPerson
                                    }
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        organizationDetails: {
                                          ...formData.organizationDetails,
                                          contactPerson: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-sans font-medium outline-none focus:border-guava-orange transition-all"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-2">
                                    Tax ID
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="TIN-8293"
                                    value={
                                      formData.organizationDetails.taxId || ""
                                    }
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        organizationDetails: {
                                          ...formData.organizationDetails,
                                          taxId: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-sans font-medium outline-none focus:border-guava-orange transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom Controller */}
                        <div className="flex gap-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-3 border border-gray-100 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            onClick={initiate2FA}
                            disabled={isSendingCode || !formData.displayName || !formData.email}
                            className="flex-1 py-3 bg-guava-dark text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-guava-orange disabled:opacity-50 disabled:hover:bg-guava-dark cursor-pointer text-center flex items-center justify-center gap-2"
                          >
                            {isSendingCode ? (
                              <>
                                <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent inline-block" />
                                Sending...
                              </>
                            ) : (
                              "Setup Account"
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-guava-orange animate-pulse">
                            <Key className="w-8 h-8" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-black text-guava-dark">
                            Two-Factor Authorization
                          </h3>
                          <p className="text-xs text-gray-400 font-medium">
                            Enter the 6-digit key sent to{" "}
                            <span className="text-guava-dark font-bold font-mono text-xs">
                              {formData.email}
                            </span>
                          </p>

                          <div className="mt-3 p-3 bg-orange-50/50 border border-orange-100 rounded-xl text-left">
                            <p className="text-[8px] font-black uppercase text-guava-orange tracking-widest mb-1">
                              Development Mode
                            </p>
                            <p className="text-[9px] text-gray-500">
                              Key:{" "}
                              <span className="font-mono font-black text-guava-dark">
                                {expectedCode}
                              </span>
                            </p>
                          </div>
                        </div>

                        <input
                          type="text"
                          maxLength={6}
                          value={twoFactorCode}
                          onChange={(e) =>
                            setTwoFactorCode(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="000000"
                          className="w-full max-w-[200px] mx-auto px-3 py-4 bg-gray-50 border border-gray-100 rounded-xl text-2xl font-black text-center tracking-[0.3em] outline-none focus:border-guava-orange transition-all font-mono"
                        />

                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-3 border border-gray-100 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            onClick={verifyAndFinalize}
                            disabled={isFinalizingRegistration}
                            className="flex-1 py-3 bg-guava-orange text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                          >
                            {isFinalizingRegistration ? (
                              <>
                                <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent inline-block" />
                                Activating...
                              </>
                            ) : (
                              <>
                                Activate
                                <Shield className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        </div>
                        <button
                          onClick={initiate2FA}
                          disabled={isSendingCode}
                          className="text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-guava-orange transition-colors cursor-pointer"
                        >
                          {isSendingCode ? "Sending..." : "Resend Code"}
                        </button>
                      </div>
                    )}
                      </motion.div>
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="mb-4">
                      <h2 className="text-2xl font-black tracking-tighter">
                        Welcome Back
                      </h2>
                      <p className="text-gray-400 text-xs font-medium">
                        Enter your credentials to access the ACX terminal.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-3">
                        Access Perspective
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRole(UserRole.LENDER);
                            localStorage.setItem(
                              "acx_preferred_role",
                              UserRole.LENDER,
                            );
                            if (!loginEmail || loginEmail.trim() === "" || loginEmail === "borrower@example.com" || loginEmail === "lender@example.com") {
                              setLoginEmail("lender@example.com");
                              setLoginPassword("password");
                            }
                          }}
                          className={`py-2 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                            selectedRole === UserRole.LENDER
                              ? "border-guava-orange bg-orange-50 text-guava-orange shadow-sm shadow-guava-orange/10"
                              : "border-gray-100 text-gray-400"
                          }`}
                        >
                          Business Portal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRole(UserRole.BORROWER);
                            localStorage.setItem(
                              "acx_preferred_role",
                              UserRole.BORROWER,
                            );
                            if (!loginEmail || loginEmail.trim() === "" || loginEmail === "lender@example.com" || loginEmail === "borrower@example.com") {
                              setLoginEmail("borrower@example.com");
                              setLoginPassword("password");
                            }
                          }}
                          className={`py-2 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                            selectedRole === UserRole.BORROWER
                              ? "border-guava-green bg-green-50 text-guava-green shadow-sm shadow-guava-green/10"
                              : "border-gray-100 text-gray-400"
                          }`}
                        >
                          Consumer Portal
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-3">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="user@example.com"
                          className={`w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-sans font-medium outline-none transition-all ${
                            selectedRole === UserRole.BORROWER 
                              ? "focus:border-guava-green focus:ring-2 focus:ring-guava-green/10" 
                              : "focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/10"
                          }`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-3">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={resetEmailLoading}
                            className="text-[9px] font-black uppercase tracking-widest text-guava-orange hover:text-guava-dark transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {resetEmailLoading ? "Sending..." : "Forgot?"}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            id="nav-login-password-input"
                            type={showLoginPassword ? "text" : "password"}
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full pl-5 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-sans font-medium outline-none transition-all ${
                              selectedRole === UserRole.BORROWER 
                                ? "focus:border-guava-green focus:ring-2 focus:ring-guava-green/10" 
                                : "focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/10"
                            }`}
                          />
                          <button
                            id="nav-login-password-toggle"
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label={showLoginPassword ? "Hide password" : "Show password"}
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {resetEmailSent && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                          <p className="text-[8px] font-black uppercase text-green-600 tracking-widest mb-1">
                            Password Reset Sent
                          </p>
                          <p className="text-[10px] text-green-700 font-medium font-sans">
                            A recovery link was dispatched to <span className="font-bold underline">{loginEmail}</span>. Please verify your inbox and spam folder.
                          </p>
                        </div>
                      )}

                      {resetEmailError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-[8px] font-black uppercase text-red-600 tracking-widest mb-1">
                            Recovery Failed
                          </p>
                          <p className="text-[10px] text-red-700 font-medium font-sans">
                            {resetEmailError}
                          </p>
                        </div>
                      )}

                      <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl">
                        <p className="text-[8px] font-black uppercase text-guava-orange tracking-widest mb-1">
                          Demo Access (Password: password)
                        </p>
                        <p className="text-[9px] text-gray-500">
                          borrower@example.com / lender@example.com
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={isLoggingIn}
                          className={`w-full py-3 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                            selectedRole === UserRole.BORROWER 
                              ? "bg-guava-green hover:bg-slate-950 shadow-guava-green/20" 
                              : "bg-guava-orange hover:bg-slate-950 shadow-guava-orange/20"
                          }`}
                        >
                          {isLoggingIn ? (
                            <>
                              <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent inline-block" />
                              Verifying Credentials...
                            </>
                          ) : (
                            "Login to ACX"
                          )}
                        </button>
                      </div>
                      <p className="text-center text-xs text-slate-400 mt-4">
                        Don&apos;t have an account?{" "}
                        <button
                          type="button"
                          onClick={() => setAuthMode("register")}
                          className="font-black text-guava-orange hover:underline cursor-pointer"
                        >
                          Create one free
                        </button>
                      </p>
                    </form>
                  </div>
                )}
                </motion.div>
              </AnimatePresence>
              </div>
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center justify-between px-4 md:px-8">
        <Link
          to={"/"}
          className="text-xl md:text-2xl font-black tracking-tighter flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
        >
          <AcxLogo size="sm" />
          <span className="bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent">ACX</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-8">
          <Link
            to={"/how-it-works"}
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
          <button
            onClick={openLoginModal}
            className="text-xs md:text-sm font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
          >
            Login
          </button>
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
