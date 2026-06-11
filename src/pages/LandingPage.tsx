import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Shield,
  Zap,
  ArrowRight,
  Landmark,
  Building,
  X,
  Phone,
  Lock,
  Cpu,
  Camera,
  UserPlus,
  Key,
  RefreshCw,
  User,
  Twitter,
  Linkedin,
  Mail,
  CheckCircle,
  Wallet,
  Activity,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { UserRole, UserProfile } from "../types";
import { BusinessLocationMap } from "../components/BusinessLocationMap";
import { COUNTRIES, CURRENCIES } from "../constants/countries";
import { MOCK_USERS } from "../lib/store";
import { Link } from "react-router-dom";
import AcxLogo from "../components/AcxLogo";
import GuavaLogo from "../components/GuavaLogo";
import { compressImage } from "../lib/utils";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { evaluatePasswordStrength, registrationSchema, passwordRequirements } from "../lib/validation";

// Placeholder for Guava logo - replace with actual image import

interface LandingPageProps {
  onLogin: (user: UserProfile) => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState(1);
  const [, setIsVerifying2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [expectedCode, setExpectedCode] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFinalizingRegistration, setIsFinalizingRegistration] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmailError, setResetEmailError] = useState("");
  const [resetEmailLoading, setResetEmailLoading] = useState(false);
  const [showRegistrationPassword, setShowRegistrationPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ displayName?: string; email?: string; physicalAddress?: string; password?: string; confirmPassword?: string }>({});

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

  const [simulationActive, setSimulationActive] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentYear = new Date().getFullYear();

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

  useEffect(() => {
    if (!showAuthModal) {
      setLoginEmail("");
      setLoginPassword("");
      setTwoFactorCode("");
      setExpectedCode(null);
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
      setSelectedRole(null);
      setStep(1);
    }
  }, [showAuthModal]);

  useEffect(() => {
    if (formData.phoneCode) {
      const match = COUNTRIES.find((c) => c.phone === formData.phoneCode);
      if (match && match.name !== formData.country) {
        setFormData((prev) => ({ ...prev, country: match.name }));
      }
    }
  }, [formData.phoneCode]);

  useEffect(() => {
    if (formData.country) {
      const match = COUNTRIES.find((c) => c.name === formData.country);
      if (match && match.phone !== formData.phoneCode) {
        setFormData((prev) => ({ ...prev, phoneCode: match.phone }));
      }
    }
  }, [formData.country]);

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
      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (data.success) {
        setExpectedCode(data.code);
        setStep(3);
        setIsVerifying2FA(true);
      }
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
      }
    } else {
      setAdminPassword("");
      setAdminClicks(0);
      setShowAdminLogin(false);
      alert("Unauthorized access attempt logged.");
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

  const pwStrength = evaluatePasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-white text-black selection:bg-black selection:text-white">
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row overflow-y-auto md:overflow-hidden h-screen w-screen"
          >
            {/* Left visual column - Majestic high-fidelity vertical finance architecture for ACX */}
            <div className="relative w-full md:w-1/2 lg:w-[52%] h-[400px] md:h-full bg-slate-950 flex flex-col p-6 md:p-10 text-white md:overflow-hidden overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
              <div className="absolute inset-0 z-0 select-none pointer-events-none">
                <img
                  src="/src/assets/images/acx_sovereign_nodes_1780667190940.png"
                  alt="ACX Sovereign Credit Explorer"
                  className="w-full h-full object-cover scale-105 opacity-25 filter blur-sm transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-950" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#388E3C]/5 via-transparent to-[#F58220]/5 opacity-60" />
                
                {/* Visual narrative pattern representing trade maps for ACX */}
                <svg className="absolute inset-0 w-full h-full opacity-15 mix-blend-screen" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
              
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <AcxLogo size="sm" />
                  <span className="text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent">ACX</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-bold text-gray-400 max-w-max">
                  New Portal Account
                </div>
              </div>

              <div className="relative z-10 flex-grow py-5 md:py-8 flex flex-col justify-center">
                <div className="space-y-1.5">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white uppercase">
                    JOIN ACX
                  </h1>
                  <p className="text-xs md:text-sm font-black bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent uppercase tracking-wider">
                    Connecting Opportunity, Empowering Growth
                  </p>
                </div>
                
                <p className="text-slate-400 text-xs md:text-sm mt-4 leading-relaxed font-sans font-medium max-w-sm">
                  Choose your portal identity, complete the profile steps, and land directly in the right workspace after sign in.
                </p>

                {/* Available Portals Lists - customized to look uniquely original and matching ACX colors */}
                <div className="mt-8 space-y-3 max-w-lg hidden sm:block">
                  <p className="text-[10px] font-black tracking-wider text-slate-500 uppercase">ACCESS PORTALS</p>
                  
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
                    className={`p-4 rounded-3xl border transition-all duration-300 cursor-pointer flex items-center gap-4 ${
                      selectedRole === UserRole.LENDER 
                        ? "bg-white/[0.07] border-guava-orange/40 shadow-[0_4px_24px_rgba(245,130,32,0.15)] scale-[1.02]" 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 transition-colors ${
                      selectedRole === UserRole.LENDER 
                        ? "bg-guava-orange/20 border-guava-orange/30 text-guava-orange" 
                        : "bg-white/5 border-white/15 text-gray-400"
                    }`}>
                      <Landmark className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5 justify-between">
                        Business Portal
                        {selectedRole === UserRole.LENDER && <span className="w-1.5 h-1.5 rounded-full bg-guava-orange animate-pulse" />}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-sans mt-1 font-medium">
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
                    className={`p-4 rounded-3xl border transition-all duration-300 cursor-pointer flex items-center gap-4 ${
                      selectedRole === UserRole.BORROWER 
                        ? "bg-white/[0.07] border-guava-green/40 shadow-[0_4px_24px_rgba(56,142,60,0.15)] scale-[1.02]" 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 transition-colors ${
                      selectedRole === UserRole.BORROWER 
                        ? "bg-guava-green/20 border-guava-green/30 text-guava-green" 
                        : "bg-white/5 border-white/15 text-gray-400"
                    }`}>
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5 justify-between">
                        Consumer Portal
                        {selectedRole === UserRole.BORROWER && <span className="w-1.5 h-1.5 rounded-full bg-guava-green animate-pulse" />}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-sans mt-1 font-medium">
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
            <div className="w-full md:w-1/2 lg:w-[48%] h-full bg-white dark:bg-slate-900 text-slate-900 dark:text-gray-150 flex flex-col justify-center p-6 md:p-12 overflow-y-auto relative shrink-0 transition-colors duration-300">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  resetFormFields();
                }}
                className="absolute top-6 right-6 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full transition-all text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer z-20 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-w-md w-full mx-auto">
                {authMode === "register" ? (
                <>
                    {/* Exquisite Top-Mounted Progress Stepper Timeline */}
                    <div className="flex items-center justify-between mb-8 max-w-sm mx-auto scale-95 origin-center select-none">
                      {/* Step 1 */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                          step >= 1 
                            ? "bg-gradient-to-tr from-emerald-500 to-teal-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20" 
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                        }`}>
                          {step > 1 ? <Check className="w-4.5 h-4.5 stroke-[2.5]" /> : "1"}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider mt-1.5 ${step >= 1 ? "text-slate-800 dark:text-slate-200" : "text-slate-400"}`}>Account</span>
                        <span className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Step 1</span>
                      </div>
                      
                      {/* Line 1-2 */}
                      <div className="flex-1 h-[2px] mx-2 bg-slate-100 dark:bg-slate-800 relative rounded-full">
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500 rounded-full" 
                          style={{ width: step >= 2 ? "100%" : "0%" }} 
                        />
                      </div>

                      {/* Step 2 */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                          step >= 2 
                            ? "bg-gradient-to-tr from-amber-500 to-orange-500 border-amber-500 text-white shadow-sm shadow-amber-500/20" 
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                        }`}>
                          {step > 2 ? <Check className="w-4.5 h-4.5 stroke-[2.5]" /> : "2"}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider mt-1.5 ${step >= 2 ? "text-slate-800 dark:text-slate-200" : "text-slate-400"}`}>
                          {selectedRole === UserRole.LENDER ? "Company" : selectedRole === UserRole.BORROWER ? "Profile" : "Portal"}
                        </span>
                        <span className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Step 2</span>
                      </div>

                      {/* Line 2-3 */}
                      <div className="flex-1 h-[2px] mx-2 bg-slate-100 dark:bg-slate-800 relative rounded-full">
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-amber-500 to-guava-orange transition-all duration-500 rounded-full" 
                          style={{ width: step >= 3 ? "100%" : "0%" }} 
                        />
                      </div>

                      {/* Step 3 */}
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                          step === 3 
                            ? "bg-gradient-to-tr from-guava-orange to-red-500 border-guava-orange text-white shadow-sm shadow-guava-orange/25 animate-pulse" 
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                        }`}>
                          3
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider mt-1.5 ${step >= 3 ? "text-slate-800 dark:text-slate-200" : "text-slate-400"}`}>Security</span>
                        <span className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Step 3</span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 tracking-widest uppercase">Join ACX</span>
                        <button
                          onClick={() => setAuthMode("login")}
                          className="text-[9px] font-black uppercase tracking-widest text-guava-orange hover:underline cursor-pointer"
                        >
                          Login Instead
                        </button>
                      </div>

                      <div className="mb-4 text-left border-l-2 border-guava-orange pl-3 py-0.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Join ACX
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                          Connecting Opportunity, Empowering Growth
                        </p>
                      </div>
                      
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 leading-tight">
                        {step === 1 && "Choose your portal identity"}
                        {step === 2 && (selectedRole === UserRole.LENDER ? "Complete your Business profile" : "Complete your Individual profile")}
                        {step === 3 && "Two-factor authorization security"}
                      </h2>
                      <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-1">
                        {step === 1 && "Select business or individual archetype to start."}
                        {step === 2 && "Fill in the required information below to proceed."}
                        {step === 3 && `Type the verification passcode transmitted to ${formData.email || "your address"}.`}
                      </p>
                    </div>

                    {step === 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                        {[
                          {
                            role: UserRole.LENDER,
                            title: "Business Portal",
                            icon: Landmark,
                            desc: "Deploy capital, manage credit lines, and run merchant/retailer nodes.",
                          },
                          {
                            role: UserRole.BORROWER,
                            title: "Consumer Portal",
                            icon: User,
                            desc: "Initialize credit passport, borrow, and manage pay-later channels.",
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
                            className={`p-5 rounded-3xl border text-left transition-all duration-300 cursor-pointer group flex flex-col justify-between h-44 ${
                              selectedRole === r.role 
                                ? (r.role === UserRole.LENDER ? "border-guava-orange bg-guava-orange/[0.04] text-slate-900 dark:text-white" : "border-guava-green bg-guava-green/[0.04] text-slate-900 dark:text-white") 
                                : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-200 dark:hover:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-white"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 transition-all duration-300 ${
                              selectedRole === r.role 
                                ? (r.role === UserRole.LENDER ? "bg-guava-orange/20 border-guava-orange/30 text-guava-orange shadow-sm" : "bg-guava-green/20 border-guava-green/30 text-guava-green shadow-sm") 
                                : "bg-slate-50 dark:bg-slate-800 border-slate-150 dark:border-slate-700 text-gray-400 dark:text-gray-500 group-hover:scale-105"
                            }`}>
                              <r.icon className="w-5 h-5" />
                            </div>
                            <div className="mt-4">
                              <h4 className="text-sm font-black tracking-tight mb-1 text-slate-900 dark:text-white">
                                {r.title}
                              </h4>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                {r.desc}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-5 animate-fadeIn">
                        {/* Premium Card Container wrapper */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative space-y-4 transition-all">
                          {/* Inner Top Summary Badge Panel */}
                          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
                            <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                              selectedRole === UserRole.LENDER 
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                selectedRole === UserRole.LENDER ? "bg-amber-500" : "bg-emerald-500"
                              }`} />
                              {selectedRole === UserRole.LENDER ? "Business Node" : "Consumer Node"}
                            </div>
                            
                            <button
                              onClick={() => setStep(1)}
                              className="text-[9px] font-black text-gray-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 uppercase tracking-wider cursor-pointer group"
                            >
                              <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
                              Change portal type
                            </button>
                          </div>

                          <div className="max-h-[48vh] overflow-y-auto pr-1.5 space-y-5 [scrollbar-width:thin]">
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
                                id="reg-password-input"
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
                                id="reg-password-toggle"
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
                                id="reg-confirm-password-input"
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
                                id="reg-confirm-password-toggle"
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
                                onClick={() => fileInputRef.current?.click()}
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
                                type="file"
                                ref={fileInputRef}
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
                        </div>

                        {/* Bottom Controller */}
                        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-3 border border-slate-150 dark:border-slate-800 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            onClick={initiate2FA}
                            disabled={isSendingCode || !formData.displayName || !formData.email}
                            className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-guava-orange dark:hover:bg-guava-orange dark:hover:text-white disabled:opacity-30 disabled:hover:bg-slate-900 dark:disabled:hover:bg-white dark:disabled:hover:text-slate-950 cursor-pointer text-center flex items-center justify-center gap-2 shadow-sm"
                          >
                            {isSendingCode ? (
                              <>
                                <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent inline-block" />
                                Sending Code...
                              </>
                            ) : (
                              selectedRole === UserRole.LENDER ? "Create Business Profile" : "Setup Account"
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6 animate-fadeIn">
                        {/* Premium Card Container wrapper */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col items-center">
                          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center text-amber-500 animate-pulse shrink-0">
                            <Key className="w-6 h-6" />
                          </div>
                          
                          <div className="space-y-2 text-center w-full">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">
                              Two-Factor Authorization
                            </h3>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                              Enter the 6-digit passcode sent to{" "}
                              <span className="text-slate-900 dark:text-white font-bold font-mono text-xs block mt-0.5">
                                {formData.email}
                              </span>
                            </p>

                            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-left shadow-inner">
                              <p className="text-[8px] font-black uppercase text-guava-orange tracking-widest mb-1.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-guava-orange" />
                                Development Sandbox
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                Passcode:{" "}
                                <span className="font-mono font-black text-slate-900 dark:text-white tracking-wider">
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
                            className="w-full max-w-[200px] mx-auto px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-2xl font-black text-center tracking-[0.3em] text-slate-900 dark:text-white outline-none focus:border-guava-orange dark:focus:border-guava-orange transition-all font-mono"
                          />
                        </div>

                        {/* Bottom Navigation */}
                        <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-3 border border-slate-150 dark:border-slate-800 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                          >
                            Back
                          </button>
                          <button
                            onClick={verifyAndFinalize}
                            disabled={isFinalizingRegistration}
                            className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-35"
                          >
                            {isFinalizingRegistration ? (
                              <>
                                <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent inline-block" />
                                Activating...
                              </>
                            ) : (
                              <>
                                Activate
                                <Shield className="w-3.5 h-3.5" />
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
                  </>
                ) : (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="mb-4">
                      <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 tracking-widest uppercase">AUTHENTICATION</span>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 leading-tight">
                        Welcome back to ACX
                      </h2>
                      <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-1">
                        Input your access credentials to lease security nodes.
                      </p>
                    </div>

                    {/* Premium Card form wrapper */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative space-y-5 transition-all">
                      <div className="space-y-1.5 pb-2 border-b border-slate-50 dark:border-slate-800">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                          Access Perspective Gateway
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
                            className={`py-2 px-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              selectedRole === UserRole.LENDER
                                ? "border-guava-orange bg-guava-orange/[0.04] text-guava-orange shadow-inner"
                                : "border-slate-100 dark:border-slate-805 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedRole === UserRole.LENDER ? "bg-guava-orange animate-pulse" : "bg-slate-200 dark:bg-slate-750"}`} />
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
                            className={`py-2 px-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              selectedRole === UserRole.BORROWER
                                ? "border-guava-green bg-guava-green/[0.04] text-guava-green shadow-inner"
                                : "border-slate-100 dark:border-slate-805 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedRole === UserRole.BORROWER ? "bg-guava-green animate-pulse" : "bg-slate-200 dark:bg-slate-750"}`} />
                            Consumer Portal
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-3">
                            Email address
                          </label>
                          <input
                            type="email"
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="user@example.com"
                            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-sans font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all ${
                              selectedRole === UserRole.BORROWER 
                                ? "focus:border-guava-green focus:ring-2 focus:ring-guava-green/10" 
                                : "focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/10"
                            }`}
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center px-3">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              Access Key / Password
                            </label>
                            <button
                              type="button"
                              onClick={handleForgotPassword}
                              disabled={resetEmailLoading}
                              className="text-[9px] font-black uppercase tracking-widest text-guava-orange hover:text-guava-dark transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {resetEmailLoading ? "Transmitting..." : "Forgot?"}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              id="login-password-input"
                              type={showLoginPassword ? "text" : "password"}
                              required
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="••••••••"
                              className={`w-full pl-4 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-black text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none transition-all ${
                                selectedRole === UserRole.BORROWER 
                                  ? "focus:border-guava-green focus:ring-2 focus:ring-guava-green/10" 
                                  : "focus:border-guava-orange focus:ring-2 focus:ring-guava-orange/10"
                              }`}
                            />
                            <button
                              id="login-password-toggle"
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors"
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
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-fadeIn">
                            <p className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-1">
                              Password Reset Sent
                            </p>
                            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
                              A recovery link was dispatched to <span className="font-bold underline">{loginEmail}</span>. Please verify your inbox and spam folder.
                            </p>
                          </div>
                        )}

                        {resetEmailError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-fadeIn">
                            <p className="text-[8px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest mb-1">
                              Recovery Failed
                            </p>
                            <p className="text-[10px] text-red-700 dark:text-red-300 font-medium font-sans">
                              {resetEmailError}
                            </p>
                          </div>
                        )}

                        <div className="p-3 bg-amber-500/[0.04] dark:bg-amber-500/[0.02] border border-amber-500/10 dark:border-amber-500/5 rounded-xl">
                          <p className="text-[8px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest mb-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Development Bypass (Pass: password)
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                            borrower@example.com / lender@example.com
                          </p>
                        </div>

                        <div className="flex flex-col gap-3.5 pt-2">
                          <button
                            type="submit"
                            disabled={isLoggingIn}
                            className={`w-full py-3 text-white dark:text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                              selectedRole === UserRole.BORROWER 
                                ? "bg-slate-900 dark:bg-white hover:bg-guava-green dark:hover:bg-guava-green dark:hover:text-white" 
                                : "bg-slate-900 dark:bg-white hover:bg-guava-orange dark:hover:bg-guava-orange dark:hover:text-white"
                            }`}
                          >
                            {isLoggingIn ? (
                              <>
                                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white dark:border-slate-950 border-t-transparent inline-block" />
                                Verifying Node...
                              </>
                            ) : (
                              "Login to ACX"
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setAuthMode("register")}
                            className="w-full py-3 border border-slate-150 dark:border-slate-800 rounded-xl font-black text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer"
                          >
                            Signup to ACX
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                      id="admin-password-input"
                      type={showAdminPassword ? "text" : "password"}
                      autoFocus
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                      placeholder="••••••••"
                      className="w-full pl-6 pr-12 py-4 bg-white/5 border border-white/10 rounded-xl text-center text-white outline-none focus:border-guava-orange transition-all font-mono"
                    />
                    <button
                      id="admin-password-toggle"
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

      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-14 flex items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        <div
          onClick={handleLogoClick}
          className="text-xl md:text-2xl font-black tracking-tighter flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
        >
          <AcxLogo size="sm" />
          <span className="bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent">ACX</span>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <Link
            to={"/how-it-works"}
            className="text-xs md:text-sm font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
          >
            How It Works
          </Link>
          {/* <a href="#features" className="text-xs md:text-sm font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer">Features</a> */}
          <button
            onClick={() => {
              setAuthMode("login");
              setShowAuthModal(true);
            }}
            className="text-xs md:text-sm font-bold opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => {
              setAuthMode("register");
              setShowAuthModal(true);
            }}
            className="text-xs md:text-sm font-black uppercase tracking-widest hover:text-guava-orange transition-colors cursor-pointer"
          >
            Access
          </button>
        </div>
      </nav>

      {/* Add padding-top to account for fixed navbar */}
      <div>
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
                    <span className="bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent">
                      Financial Potential
                    </span>
                  </h1>
                  <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-lg">
                    The unified platform for AI-powered credit scoring and
                    liquidity access across African markets. Each user receives
                    a dynamic credit score based on their loan history and
                    repayment behavior.
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Powered by:
                    </div>

                    <a
                      href="https://guava.africa/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative z-10 hover:opacity-80 transition-opacity block cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GuavaLogo variant="full" size="sm" />
                    </a>
                  </div>
                </motion.div>

                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-guava-green" />
                    <span className="text-xs md:text-sm font-medium">
                      AI Credit Scoring
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-guava-green" />
                    <span className="text-xs md:text-sm font-medium">
                      Instant Liquidity
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-guava-green" />
                    <span className="text-xs md:text-sm font-medium">
                      Multi-Currency
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => {
                      setAuthMode("register");
                      setShowAuthModal(true);
                    }}
                    className="group flex items-center justify-center gap-2 px-6 py-3 bg-guava-orange text-white rounded-full font-bold hover:scale-105 transition-all text-sm md:text-base shadow-lg shadow-guava-orange/20 cursor-pointer w-full sm:w-auto"
                  >
                    Start Building Credit
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <Link
                    to={"/how-it-works"}
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
                    <h3 className="text-white font-bold text-base md:text-lg tracking-tighter">
                      African Continent
                    </h3>
                    <p className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-wider">
                      Pan-African Credit Network
                    </p>
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
                    <p className="text-white/30 text-[7px] md:text-[9px] uppercase tracking-wider">
                      52 Markets | 1 Platform
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* How It Works Section */}
            <section
              id="how-it-works"
              className="scroll-mt-20 mt-12 md:mt-16 mb-20"
            >
              <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10">
                <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-guava-orange text-[9px] md:text-[10px] font-black uppercase tracking-wider mb-3">
                  Simple Process
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-3">
                  Get Started in{" "}
                  <span className="text-guava-green">3 Easy Steps</span>
                </h2>
                <p className="text-gray-500 text-sm md:text-base">
                  From registration to funding, we've made the process seamless.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="text-center p-4 md:p-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-guava-orange/10 rounded-full flex items-center justify-center mx-auto mb-3 text-guava-orange">
                    <UserPlus className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="text-xl md:text-2xl font-black text-guava-orange mb-1">
                    01
                  </div>
                  <h3 className="text-base md:text-xl font-bold mb-1">
                    Create Your Profile
                  </h3>
                  <p className="text-gray-500 text-xs md:text-sm">
                    Register as a Business or Consumer. Complete your KYC.
                  </p>
                </div>
                <div className="text-center p-4 md:p-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-guava-green/10 rounded-full flex items-center justify-center mx-auto mb-3 text-guava-green">
                    <Activity className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="text-xl md:text-2xl font-black text-guava-orange mb-1">
                    02
                  </div>
                  <h3 className="text-base md:text-xl font-bold mb-1">
                    Get Credit Scored
                  </h3>
                  <p className="text-gray-500 text-xs md:text-sm">
                    Our AI analyzes alternative data to generate your credit
                    profile.
                  </p>
                </div>
                <div className="text-center p-4 md:p-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500">
                    <Wallet className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="text-xl md:text-2xl font-black text-guava-orange mb-1">
                    03
                  </div>
                  <h3 className="text-base md:text-xl font-bold mb-1">
                    Access Credit
                  </h3>
                  <p className="text-gray-500 text-xs md:text-sm">
                    Connect with lenders and access the capital you need.
                  </p>
                </div>
              </div>
            </section>

            {/* Registration Cards */}
            <div className="grid md:grid-cols-2 gap-6 mt-10 md:mt-12">
              <motion.div
                whileHover={{ y: -5 }}
                className="p-6 md:p-8 lg:p-10 bg-gray-50 rounded-2xl md:rounded-3xl hover:bg-white border-2 border-transparent hover:border-guava-orange transition-all group cursor-pointer"
                onClick={() => {
                  localStorage.setItem("acx_preferred_role", UserRole.BORROWER);
                  setAuthMode("register");
                  setSelectedRole(UserRole.BORROWER);
                  setStep(2);
                  setShowAuthModal(true);
                }}
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-guava-orange group-hover:text-white transition-colors">
                  <Building className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter mb-2">
                  Consumer Portal
                </h3>
                <p className="text-gray-500 text-xs md:text-sm lg:text-base mb-4 md:mb-6 leading-relaxed">
                  Build decentralized credit history and access instant
                  liquidity through our alternative data scoring engine.
                </p>
                <div className="flex items-center gap-2 text-guava-orange font-bold text-xs md:text-sm">
                  Register as Consumer{" "}
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="p-6 md:p-8 lg:p-10 bg-white border-2 border-gray-100 rounded-2xl md:rounded-3xl hover:border-guava-orange transition-all group cursor-pointer"
                onClick={() => {
                  localStorage.setItem("acx_preferred_role", UserRole.LENDER);
                  setAuthMode("register");
                  setSelectedRole(UserRole.LENDER);
                  setStep(2);
                  setShowAuthModal(true);
                }}
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-guava-green group-hover:text-white transition-colors">
                  <Landmark className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter mb-2">
                  Business Portal
                </h3>
                <p className="text-gray-500 text-xs md:text-sm lg:text-base mb-4 md:mb-6 leading-relaxed">
                  Deploy capital into AI-scored credit opportunities. Access
                  real-time risk analytics and diversify across African markets.
                </p>
                <div className="flex items-center gap-2 text-guava-orange font-bold text-xs md:text-sm">
                  Register as Business{" "}
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="mt-4 md:mt-8 pt-10 md:pt-12 px-4 md:px-6 scroll-mt-20 bg-white"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
              <span className="inline-block px-3 py-1 rounded-full bg-orange-50 text-guava-orange text-[9px] md:text-[10px] font-black uppercase tracking-wider mb-3">
                Platform Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-3">
                Engineered for <span className="text-guava-green">African</span>{" "}
                Markets
              </h2>
              <p className="text-gray-500 text-sm md:text-base">
                Powering credit access and liquidity across 52 markets with
                localized intelligence.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <div className="p-6 md:p-8 rounded-xl md:rounded-2xl border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-5 group-hover:bg-guava-orange group-hover:text-white transition-colors">
                  <Zap className="w-5 h-5 md:w-6 md:h-6 text-guava-orange group-hover:text-white" />
                </div>
                <h4 className="text-lg md:text-xl font-bold mb-2">
                  AI Alternative Scoring
                </h4>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed">
                  Proprietary algorithms analyze mobile usage, utility patterns,
                  and behavioral data to generate accurate credit scores.
                </p>
              </div>

              <div className="p-6 md:p-8 rounded-xl md:rounded-2xl border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-5 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Globe className="w-5 h-5 md:w-6 md:h-6 text-blue-500 group-hover:text-white" />
                </div>
                <h4 className="text-lg md:text-xl font-bold mb-2">
                  Regional Settlement Hub
                </h4>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed">
                  Deploy and receive capital across African economic blocks.
                  Support for NGN, KES, XAF, GHS, and more.
                </p>
              </div>

              <div className="p-6 md:p-8 rounded-xl md:rounded-2xl border border-gray-100 hover:shadow-xl transition-all group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-5 group-hover:bg-guava-green group-hover:text-white transition-colors">
                  <Shield className="w-5 h-5 md:w-6 md:h-6 text-guava-green group-hover:text-white" />
                </div>
                <h4 className="text-lg md:text-xl font-bold mb-2">
                  Risk & Compliance
                </h4>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed">
                  Real-time monitoring and automated audit trails ensure every
                  transaction adheres to regional standards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black text-white mt-10 md:mt-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <AcxLogo size="sm" variant="icon" withHoverGlow={false} />
                  <span className="text-lg md:text-xl font-black tracking-tighter bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent">
                    ACX
                  </span>
                </div>
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-3">
                  The unified credit and liquidity platform for the African
                  continent.
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="#"
                    className="text-gray-400 hover:text-guava-orange transition-colors cursor-pointer"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-guava-orange transition-colors cursor-pointer"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-guava-orange transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-2 bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent inline-block">
                  Platform
                </h4>
                <ul className="space-y-1.5">
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      Credit Scoring
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      Liquidity Pools
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      For Consumers
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      For Business
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-2 bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent inline-block">
                  Resources
                </h4>
                <ul className="space-y-1.5">
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      API Status
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      Research
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      Support
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-2 bg-gradient-to-r from-guava-orange to-guava-green bg-clip-text text-transparent inline-block">
                  Legal
                </h4>
                <ul className="space-y-1.5">
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      Terms
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      Regulatory
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer"
                    >
                      Cookies
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-white/30 flex flex-col items-center justify-center gap-4">
              <p className="text-gray-500 text-[11px] md:text-xs text-center">
                &copy; {currentYear} Africa Credit Exchange. All rights
                reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
