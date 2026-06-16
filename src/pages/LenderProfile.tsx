import { useState, useMemo, useEffect } from "react";
import { UserProfile, UserRole, LoanStatus, LoanRequest, Repayment } from "../types";
import { useFirebase } from "../components/FirebaseProvider";
import { BusinessLocationMap } from "../components/BusinessLocationMap";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Landmark, 
  Percent, 
  RefreshCw, 
  UploadCloud, 
  Banknote, 
  Users, 
  TrendingUp, 
  Save, 
  AlertTriangle, 
  UserX, 
  X, 
  LayoutDashboard,
  PlusCircle,
  ShieldAlert,
  Printer,
  Briefcase,
  Settings,
  Bell
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { firestoreService } from "../services/firestoreService";

interface StaffUser {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  creditScore: number;
  balance: number;
  borrowLimit: number;
  isBlacklisted: boolean;
  department: string;
  blacklistReason?: string;
  blacklistCategory?: string;
}

interface LenderProfileProps {
  user: UserProfile;
}

type LenderTab = 
  | "dashboard" 
  | "portfolio"
  | "blacklist"
  | "reports"
  | "users"
  | "node"
  | "config";

type DelinquentLoanStage = "INITIAL" | "WRITTEN" | "FINAL" | "BLACKLISTED";

interface DelinquentLoan {
  id: string;
  borrower: string;
  amount: number;
  overdueDays: number;
  creditScore: number;
  stage: DelinquentLoanStage;
}

const PNL_DATA = [
  { month: "Jan", revenue: 45000, expenses: 12000, profit: 33000 },
  { month: "Feb", revenue: 52000, expenses: 14000, profit: 38000 },
  { month: "Mar", revenue: 48000, expenses: 13500, profit: 34500 },
  { month: "Apr", revenue: 61000, expenses: 15000, profit: 46000 },
  { month: "May", revenue: 75000, expenses: 18000, profit: 57000 },
  { month: "Jun", revenue: 89000, expenses: 21000, profit: 68000 },
];

const REVENUE_STREAMS = [
  { name: "Interest Yield", value: 65, color: "#f36d38" },
  { name: "Origination Fees", value: 20, color: "#000000" },
  { name: "Late Penalties", value: 10, color: "#3b82f6" },
  { name: "service Fees", value: 5, color: "#22c55e" },
];

export default function LenderProfile({ user }: LenderProfileProps) {
  const { updateProfile } = useFirebase();

  // Navigation states
  const [activeTab, setActiveTab] = useState<LenderTab>("dashboard");
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(user.kycStatus === "VERIFIED");

  // Core configuration parameters
  const [lenderConfig, setLenderConfig] = useState({
    maxDebtToIncome: 40,
    baseApr: 12.4,
    penaltyInterestMultiplier: 1.5,
    autoScoreThreshold: 685,
    gracePeriodDays: 5,
    is2faMandatory: user.is2FAEnabled || false,
    autoFundApproval: true,
  });

  // State to track live visual credit events
  const [liveLogEvents, setLiveLogEvents] = useState([
    { id: "1", type: "info", text: "Enterprise node online: connected securely to ACX liquidity rails", time: "09:12 AM" },
    { id: "2", type: "success", text: "Staff disbursement request auto-routed to smart liquidity pool #10A", time: "10:45 AM" },
    { id: "3", type: "warning", text: "Warning: Employee T. Moyo limit adjusted to account for alternative score drop", time: "11:20 AM" },
    { id: "4", type: "success", text: "Repayment of $450 received from Staff Member S. Kamwendo (DTI safe)", time: "01:15 PM" },
  ]);

  // System Configuration states
  const [lenderData, setLenderData] = useState({
    entityName: user.borrowerDetails?.profile?.businessName || user.displayName || "Guava Corp International",
    taxId: user.organizationDetails?.taxId || user.borrowerDetails?.profile?.businessReg || "TAX-77821-ACX",
    jurisdiction: user.country || "East Africa",
    hqAddress: user.physicalAddress || "Guava Towers Block C, Lilongwe",
    latitude: user.latitude || -13.9626,
    longitude: user.longitude || 33.7718,
    entityType: user.organizationDetails?.industry || "Institutional Investor",
    liquidityCapacity: 500000,
    minYieldTarget: 12.0,
    maxRiskExposure: "MEDIUM"
  });

  // Document Uploads states & progressive validation states
  const [uploads, setUploads] = useState({
    governance: true,
    proofOfFunds: true,
    operatingLicense: false,
    complianceAudit: false,
    taxResidency: false,
  });

  const [uploadProgress, setUploadProgress] = useState<Record<string, {
    progress: number;
    status: 'idle' | 'uploading' | 'analyzing' | 'approved';
    fileName?: string;
  }>>({
    governance: { progress: 100, status: 'approved', fileName: 'governance_framework.pdf' },
    proofOfFunds: { progress: 100, status: 'approved', fileName: 'bank_statement_proof.pdf' }
  });

  // Live employee/users state from localStorage
  const [customUsers, setCustomUsers] = useState<StaffUser[]>([]);
  const [loansList, setLoansList] = useState<LoanRequest[]>([]);
  const [repaymentsList, setRepaymentsList] = useState<Repayment[]>([]);

  // Loan Management local tabs and calculator states
  const [nodeSubTab, setNodeSubTab] = useState<"loan_mgr" | "entity_info">("loan_mgr");
  const [loanManagerTab, setLoanManagerTab] = useState<"payments" | "calculator" | "notifications">("payments");
  const [selectedRepayLoanId, setSelectedRepayLoanId] = useState<string>("");
  const [calcPrincipal, setCalcPrincipal] = useState<number>(5000);
  const [calcInterest, setCalcInterest] = useState<number>(12);
  const [calcTermMonths, setCalcTermMonths] = useState<number>(12);
  const [calculatedInstallment, setCalculatedInstallment] = useState<number>(444.24);
  const [calculatedTotalInterest, setCalculatedTotalInterest] = useState<number>(330.88);
  const [calculatedTotalPayable, setCalculatedTotalPayable] = useState<number>(5330.88);
  const [amortizationSchedule, setAmortizationSchedule] = useState<{ month: number, payment: number, principal: number, interest: number, balance: number }[]>([]);
  
  // Modals / forms
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  
  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    displayName: "",
    email: "",
    role: UserRole.BORROWER,
    kycStatus: "VERIFIED" as 'PENDING' | 'VERIFIED' | 'REJECTED',
    creditScore: 710,
    balance: 500,
    borrowLimit: 3000
  });

  // Blacklist addition state
  const [blacklistForm, setBlacklistForm] = useState({
    emailOrUid: "",
    reason: "Late payments warning delinquency",
    category: "Default Risk"
  });

  // Report execution builder parameters
  const [reportType, setReportType] = useState("PNL");
  const [reportFormat, setReportFormat] = useState("PDF");
  const [reportDateRange, setReportDateRange] = useState("Q2-2026");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportOutputs, setReportOutputs] = useState<string[]>([]);



  // Notifications Popover State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Load custom users from localStorage & loans from firebase
  useEffect(() => {
    const loadData = async () => {
      // Load custom users
      const raw = localStorage.getItem("acx_custom_users");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setCustomUsers(parsed);
        } catch {
          setCustomUsers(getSampleUsers());
        }
      } else {
        const samples = getSampleUsers();
        localStorage.setItem("acx_custom_users", JSON.stringify(samples));
        setCustomUsers(samples);
      }

      // Load real loans list from firestore
      try {
        const loans = await firestoreService.getLoans();
        setLoansList(loans || []);
      } catch (err) {
        console.error("Failed to load real loans, using fallbacks:", err);
        setLoansList(getSampleLoans(user.uid));
      }

      // Load repayments list from firestore
      try {
        const reps = await firestoreService.getRepayments();
        if (reps && reps.length > 0) {
          setRepaymentsList(reps);
        } else {
          setRepaymentsList(getSampleRepayments());
        }
      } catch (err) {
        console.error("Failed to load repayments, using fallbacks:", err);
        setRepaymentsList(getSampleRepayments());
      }
    };
    loadData();
  }, [user.uid]);

  // Recalculate dynamic loan calculations of calculator
  useEffect(() => {
    const P = calcPrincipal || 0;
    const r = (calcInterest || 0) / 12 / 100;
    const n = calcTermMonths || 12;
    
    if (P <= 0 || n <= 0) {
      setCalculatedInstallment(0);
      setCalculatedTotalInterest(0);
      setCalculatedTotalPayable(0);
      setAmortizationSchedule([]);
      return;
    }
    
    let monthlyPayment = 0;
    if (r === 0) {
      monthlyPayment = P / n;
    } else {
      monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkPrint = () => {
    if (selectedItemIds.length === 0) return;
    setIsBulkPrintOpen(true);
  };

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (isScannerOpen) {
      // Small delay to ensure the DOM element #reader exists
      const timer = setTimeout(() => {
        scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          false,
        );

        scanner.render(
          (decodedText: string) => {
            const item = inventory.find(
              (i) => i.barcode === decodedText || i.id === decodedText,
            );
            if (item && !scannedItem) {
              setScannedItem(item);
              setInventory((prev) =>
                prev.map((si) =>
                  si.id === item.id
                    ? { ...si, stockQuantity: si.stockQuantity + 1 }
                    : si,
                ),
              );

              // Clear scanned item after 2 seconds to allow next scan
              setTimeout(() => {
                setScannedItem(null);
              }, 2000);
            }
          },
          () => {
            // Silence errors as they are frequent during scanning
          },
        );
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner
            .clear()
            .catch((e: Error) => console.error("Failed to clear scanner", e));
        }
      };
    }
  }, [isScannerOpen, inventory, scannedItem]);

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const newItems: StockItem[] = [];

      // Skip header assuming format: Name, Price, Quantity
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [name, price, quantity, category, threshold] = line
          .split(",")
          .map((s) => s.trim());
        if (name && price && quantity) {
          newItems.push({
            id: `bulk_${Date.now()}_${i}`,
            name,
            price: parseFloat(price),
            stockQuantity: parseInt(quantity),
            lowStockThreshold: threshold ? parseInt(threshold) : 5,
            category: category || "General",
            currency: "USD",
            description: `Bulk uploaded product: ${name}`,
          });
        }
      }

      if (newItems.length > 0) {
        setInventory((prev) => [...prev, ...newItems]);
        alert(`Successfully imported ${newItems.length} items to inventory.`);
      } else {
        alert(
          "No valid items found in CSV. Expected format: Name, Price, Quantity, [Category]",
        );
      }
      setIsUploading(false);
    };

    reader.onerror = () => {
      alert("Error reading file.");
      setIsUploading(false);
    };

    reader.readAsText(file);
    // Reset input
    event.target.value = "";
  };

  const [delinquentLoans, setDelinquentLoans] = useState([]);

  // Report Filters
  const [timeRange, setTimeRange] = useState<TimeRange>("6M");
  const [assetClass, setAssetClass] = useState<AssetClass>("ALL");
  const [regionFilter, setRegionFilter] = useState<Region>("ALL");
  const [minCreditScore, setMinCreditScore] = useState(650);

  // Dynamic Intelligence Calculations
  const filteredIntelligence = useMemo(() => {
    let multiplier = 1;
    if (timeRange === "30D") multiplier = 0.2;
    if (timeRange === "1Y") multiplier = 2.0;
    if (timeRange === "ALL") multiplier = 3.5;

    // Asset and Region weighting simulation
    const assetWeights: Record<AssetClass, number> = {
      ALL: 1,
      Energy: 0.25,
      Agriculture: 0.35,
      Retail: 0.2,
      Retailer: 0.2,
      Consumer: 0.2,
    };
    const regionWeights: Record<Region, number> = {
      ALL: 1,
      "East Africa": 0.3,
      "Central Europe": 0.2,
      "Southeast Asia": 0.25,
      "Southern Africa": 0.25,
    };

    const weight = assetWeights[assetClass] * regionWeights[regionFilter];
    const effectiveMultiplier = multiplier * weight;

    // Credit score impact simulation: higher min score = lower volume but potentially higher safety/lower raw yield
    const scoreImpact = 1 - (minCreditScore - 300) / 1200;
    const finalMod = effectiveMultiplier * scoreImpact;

    return {
      profit: (276.5 * finalMod).toFixed(1),
      revenue: (370.0 * finalMod).toFixed(1),
      yield: (12.8 * (1 + (minCreditScore - 600) / 1000)).toFixed(1),
      trend:
        assetClass === "Energy"
          ? "+32.1%"
          : regionFilter === "East Africa"
            ? "+28.5%"
            : "+24.2%",
      chartData: PNL_DATA.map((d) => ({
        ...d,
        revenue: Math.round(d.revenue * finalMod),
        expenses: Math.round(d.expenses * finalMod),
        profit: Math.round(d.profit * finalMod),
      })),
    };
  }, [timeRange, assetClass, regionFilter, minCreditScore]);

  const [lenderData, setLenderData] = useState({
    entityName: user.borrowerDetails?.profile?.businessName || user.displayName,
    taxId:
      user.organizationDetails?.taxId ||
      user.borrowerDetails?.profile?.businessReg ||
      "",
    jurisdiction: user.country || "",
    hqAddress: user.physicalAddress || "",
    latitude: user.latitude,
    longitude: user.longitude,
    entityType:
      user.organizationDetails?.industry ||
      (user.role === UserRole.RETAILER ? "Retailer" : "Institutional Investor"),
    liquidityCapacity: 0,
    minYieldTarget: 0,
    maxRiskExposure: "MEDIUM",
    sectors: [],
    regions: [],
    reportingCurrency: "USD",
  });

  const [uploads, setUploads] = useState({
    governance: false,
    proofOfFunds: false,
    operatingLicense: false,
    complianceAudit: false,
    taxResidency: false,
  });

  const [uploadProgress, setUploadProgress] = useState<Record<string, {
    progress: number;
    status: 'idle' | 'uploading' | 'analyzing' | 'approved';
    fileName?: string;
  }>>({});

  const handleFileChosen = (key: keyof typeof uploads, file: File) => {
    setUploadProgress((prev) => ({
      ...prev,
      [key]: { progress: 0, status: 'uploading', fileName: file.name },
    }));

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 20) + 15;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setUploadProgress((prev) => ({
          ...prev,
          [key]: { progress: 100, status: 'analyzing', fileName: file.name },
        }));

        setTimeout(() => {
          setUploadProgress((prev) => ({
            ...prev,
            [key]: { progress: 100, status: 'approved', fileName: file.name },
          }));
          setUploads((prev) => ({ ...prev, [key]: true }));
          addLogEvent("success", `KYB file verified: ${file.name} validated in secure compliance vault`);
        }, 1250);
      } else {
        setUploadProgress((prev) => ({
          ...prev,
          [key]: { progress: currentProgress, status: 'uploading', fileName: file.name },
        }));
      }
    }, 150);
  };

  const isUploadComplete = Object.values(uploads).every((v) => v);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: lenderData.entityName,
        physicalAddress: lenderData.hqAddress,
        latitude: lenderData.latitude,
        longitude: lenderData.longitude,
        organizationDetails: {
          companySize: user.organizationDetails?.companySize || "Medium",
          contactPerson: user.organizationDetails?.contactPerson || user.displayName || "HR Representative",
          industry: lenderData.entityType,
          taxId: lenderData.taxId,
        },
        country: lenderData.jurisdiction,
      });
      addLogEvent("info", "Portal primary address & corporate details saved to secure cloud backend");
      alert("Portal configurations and details saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    await saveProfile();
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      addLogEvent("success", "Approved institutional credentials node authenticated: unlocked portal operations");
    }, 2500);
  };

  const sectionConfig = [
    { id: "identity", label: "Institutional Identity", icon: Landmark },
    { id: "liquidity", label: "Capital Allocation", icon: Banknote },
    { id: "documents", label: "KYB", icon: FileSearch },
  ];

  const completeness = useMemo(() => {
    const files = Object.values(uploads).filter(Boolean).length;
    const fields = Object.values(lenderData).filter(
      (v) => v !== "" && v !== 0 && (Array.isArray(v) ? v.length > 0 : true)
    ).length;
    return Math.min(100, Math.round(((fields + files) / (10 + 5)) * 100));
  }, [lenderData, uploads]);

  const displaySections = useMemo(() => {
    return sectionConfig;
  }, []);

  // Handle section visibility changes
  useEffect(() => {
    if (activeSection !== "identity" && activeSection !== "liquidity" && activeSection !== "documents") {
      setActiveSection("identity");
    }
  }, [activeSection]);

  const inventoryStats = useMemo(() => {
    const totalValue = inventory.reduce(
      (acc, item) => acc + item.price * item.stockQuantity,
      0,
    );
    const categories: Record<string, number> = {};
    inventory.forEach((item) => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });
    const distributionData = Object.entries(categories).map(
      ([name, count]) => ({
        name,
        count,
      }),
    );
    return { totalValue, distributionData };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [inventory, searchQuery]);

  return (
    <>
      <div id="lender-profile-container" className="py-2 space-y-8 select-none">
        
        {/* TOP COMPRESSIVE BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div id="badge-version" className="px-2.5 py-0.5 bg-guava-orange text-white text-[8px] font-black uppercase tracking-[0.2em] rounded">
                Lender Core Hub v4.8
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                <Lock className="w-3.5 h-3.5 text-guava-orange" />
                Sovereign Node Connection
              </div>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-guava-dark uppercase">
              Corporate Credit Studio
            </h2>
            <p className="text-gray-400 text-xs font-semibold mt-1">
              Command, scale, and monitor alternative micro-credit corridores for your enterprise workforce.
            </p>
          </div>

          <div id="profile-node-widget" className="flex items-center gap-4 bg-gray-50 p-3 pr-6 rounded-3xl border border-gray-100 shadow-sm">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Org Logo"
                className="w-11 h-11 rounded-2xl object-cover shadow-md border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-guava-orange flex items-center justify-center text-white font-black shadow-md shadow-guava-orange/20 text-xs font-mono">
                {isVerified ? "AUTH" : "PEND"}
              </div>
            )}
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
                ORGANIZATIONAL NODE
              </p>
              <div className="flex items-center gap-2">
                <p className={`text-xs font-black uppercase tracking-tight ${isVerified ? 'text-guava-green' : 'text-guava-orange'}`}>
                  {isVerified ? "Secured Corporate Node" : "Authentication Pending"}
                </p>
                {lenderConfig.is2faMandatory && (
                  <div className="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded flex items-center gap-1 border border-blue-100">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[7px] font-black">2FA</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* DETECT IF NOT CORE IDENTITY VERIFIED */}
        {!isVerified && (
          <div id="kyb-warning-panel" className="p-8 bg-amber-50/50 rounded-[32px] border-2 border-dashed border-amber-300 text-amber-950 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
            <div className="flex flex-col gap-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full self-center md:self-start">
                <AlertTriangle className="w-3.5 h-3.5" /> Action Required
              </span>
              <h4 className="text-lg font-black text-amber-900 mt-2 tracking-tight">System Node Authentication Pending</h4>
              <p className="text-xs text-amber-800/80 font-medium max-w-xl">
                Please visit the <span className="font-bold cursor-pointer underline text-guava-orange" onClick={() => setActiveTab("node")}>Business Node</span> tab to upload security credentials, drag coordinates pin, and authenticate your active liquidity account. Completeness is currently at {completeness}%.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab("node")}
              className="px-6 py-3 bg-guava-orange hover:bg-guava-orange/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all shrink-0 flex items-center gap-2 shadow-lg shadow-guava-orange/20 border-none"
            >
              Verify Node Now <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* HERO METRIC BLOCKS */}
        <div id="stats-ribbon" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-50 text-guava-orange rounded-2xl flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
                Disbursed Corridor Liquidity
              </p>
              <h4 className="text-xl font-black text-guava-dark font-mono">
                ${totalVolumeDisbursed.toLocaleString()}
              </h4>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
                Active staff borrowers
              </p>
              <h4 className="text-xl font-black text-guava-dark font-mono">
                {activeEmployeeCount} Employees
              </h4>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-50 text-guava-green rounded-2xl flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
                Default Delinquent rate
              </p>
              <h4 className="text-xl font-black text-red-500 font-mono">
                {defaultRates}
              </h4>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
                Minimum yields margin
              </p>
              <h4 className="text-xl font-black text-guava-green font-mono">
                {lenderData.minYieldTarget}% Base APR
              </h4>
            </div>
          </div>
        </div>

        {/* MASTER DUAL-SPLIT NAVIGATION & WORKSPACE CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* NAVIGATION SIDEBAR RAIL - STYLED TO MATCH SCREENSHOTS */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-[32px] p-5 border border-gray-100 shadow-sm space-y-6">
              
              {/* GROUP 1: LENDING CENTER */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 px-3 block">
                  Lending Console
                </span>
                <div className="space-y-1">
                  {[
                    { id: "dashboard", label: "Credit Dashboard", icon: LayoutDashboard },
                    { id: "portfolio", label: "Active Portfolios", icon: Briefcase },
                    { id: "blacklist", label: "Borrower Blacklist", icon: UserX },
                  ].map((item) => (
                    <button
                      key={item.id}
                      id={`tab-lender-${item.id}`}
                      onClick={() => setActiveTab(item.id as LenderTab)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all cursor-pointer text-xs font-semibold ${
                        activeTab === item.id
                          ? "bg-gray-100/80 text-gray-900 font-bold"
                          : "text-gray-505 hover:text-slate-900 hover:bg-gray-50/70"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0 text-slate-700" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* GROUP 2: ORGANIZATION ACCOUNT GROUP (SPEAKS TO ORGANIZATION ADMIN) */}
              <div className="space-y-2 pt-4 border-t border-gray-105/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 px-3 block">
                  Administration
                </span>
                <div className="space-y-1">
                  {[
                    { id: "reports", label: "Financial Reports", icon: TrendingUp },
                    { id: "users", label: "Borrower Directory", icon: Users },
                    { id: "node", label: "Compliance Settings", icon: Landmark },
                    { id: "config", label: "Console Settings", icon: Settings },
                  ].map((item) => (
                    <button
                      key={item.id}
                      id={`tab-org-${item.id}`}
                      onClick={() => setActiveTab(item.id as LenderTab)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all cursor-pointer text-xs font-semibold ${
                        activeTab === item.id
                          ? "bg-gray-100/80 text-gray-900 font-bold"
                          : "text-gray-505 hover:text-slate-900 hover:bg-gray-50/70"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0 text-slate-700" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* NOTIFICATIONS WITH ROUND BLACK PILL BADGE AT THE BOTTOM - IDENTICAL TO SCREENSHOT */}
              <div className="pt-4 border-t border-gray-105/60">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl transition-all cursor-pointer text-xs font-semibold ${
                    isNotificationsOpen ? "bg-amber-50 text-amber-900 font-bold" : "text-gray-600 hover:text-slate-900 hover:bg-gray-50/70"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Bell className="w-4 h-4 shrink-0 text-slate-700" />
                    <span>Notifications</span>
                  </span>
                  <span className="bg-black text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center font-mono select-none">
                    {liveLogEvents.length}
                  </span>
                </button>

                {/* EXPANDABLE NOTIFICATIONS DRAWER POPOVER IN SIDEBAR PANEL */}
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 overflow-hidden"
                  >
                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <span>Live Ledger Feed</span>
                      <button 
                        onClick={() => {
                          setLiveLogEvents([]);
                          addLogEvent("info", "Alert logs purged locally");
                        }} 
                        className="text-guava-orange hover:underline cursor-pointer border-none bg-transparent"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto scroller-hide select-text">
                      {liveLogEvents.length === 0 ? (
                        <p className="text-[10px] text-gray-400 text-center font-medium py-2">No active notifications</p>
                      ) : (
                        liveLogEvents.map(evt => (
                          <div key={evt.id} className="text-[9px] leading-relaxed border-b border-gray-100 pb-1.5 last:border-none">
                            <div className="flex justify-between text-slate-430 font-bold font-mono">
                              <span>{evt.time}</span>
                              <span className={`uppercase text-[8px] ${
                                evt.type === 'success' ? 'text-guava-green' : evt.type === 'warning' ? 'text-red-500' : 'text-blue-500'
                              }`}>
                                {evt.type}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-600 font-medium">{evt.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

            </div>

          </div>

          {/* MAIN WORKING FRAME (THE TABS PRESENTATIONS ENVIRONMENT) */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-[40px] p-8 md:p-10 border border-gray-100 shadow-xl"
              >
                
                {/* ================================================================= TAB: DASHBOARD ================================================================= */}
                {activeTab === "dashboard" && (
                  <div id="tab-dashboard-panel" className="space-y-8">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-guava-dark decoration-guava-orange decoration-4 underline-offset-8 underline mb-1">
                          Lender Operations Dashboard
                        </h3>
                        <p className="text-xs text-gray-400 font-semibold">Consolidated micro-credit corridors & liquidity metrics</p>
                      </div>
                      <span className="px-3 py-1 bg-green-500/10 text-guava-green rounded-full text-[9px] font-black uppercase tracking-wider border border-green-500/10 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-guava-green rounded-full animate-pulse" /> Live Feed Online
                      </span>
                    </div>

              <div className="space-y-4">
                <button
                  onClick={() => window.print()}
                  className="w-full py-4 bg-guava-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-guava-dark transition-all shadow-lg shadow-guava-orange/20"
                >
                  <Printer className="w-4 h-4" />
                  Print Asset Label
                </button>
                <button
                  onClick={() => setQrItem(null)}
                  className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-guava-dark transition-all"
                >
                  Close Portal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8 animate-in fade-in duration-1000">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-2 py-1 bg-guava-orange text-white text-[8px] font-black uppercase tracking-[0.2em] rounded">
                Institutional Gateway v4
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <Lock className="w-3 h-3 text-guava-orange" />
                Secured Node Connection
              </div>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-guava-dark">
              Business Portal Studio
            </h2>
            <p className="text-gray-400 text-sm font-medium mt-1">
              Configure your deployment parameters for the global ACX credit
              ecosystem.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={clearNodeCache}
                className="px-6 py-2 bg-white border border-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-guava-orange transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 block" />
                Clear Node Cache
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Org Logo"
                className="w-12 h-12 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-guava-orange flex items-center justify-center text-white italic font-black shadow-lg shadow-guava-orange/20">
                {isVerified ? "GOLD" : "LVL 0"}
              </div>
            )}
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                Node Status
              </p>
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "text-sm font-bold uppercase italic tracking-tight",
                    isVerified ? "text-guava-green" : "text-guava-orange",
                  )}
                >
                  {isVerified
                    ? "Authenticated Institutional Node"
                    : "Authentication Pending"}
                </p>
                {user.is2FAEnabled && (
                  <div className="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded flex items-center gap-1 border border-blue-100">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase">2FA</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {user.organizationDetails && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-50 text-guava-orange rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">
                  Industry
                </p>
                <p className="text-sm font-black text-guava-dark">
                  {user.organizationDetails.industry}
                </p>
              </div>
            </div>
            <div className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">
                  Company Size
                </p>
                <p className="text-sm font-black text-guava-dark">
                  {user.organizationDetails.companySize} Elements
                </p>
              </div>
            </div>
            <div className="p-6 bg-white border border-gray-100 rounded-[32px] flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 text-guava-green rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">
                  Contact Person
                </p>
                <p className="text-sm font-black text-guava-dark">
                  {user.organizationDetails.contactPerson}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Horizontal Navigation Tabs on Top */}
        <div className="mb-8 border-b border-gray-100 pb-4">
          <div className="flex flex-wrap gap-2 md:gap-3 overflow-x-auto scroller-hide pb-2">
            {displaySections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id as LenderSection);
                  if (step === 2) setStep(1);
                }}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 border-2 cursor-pointer select-none",
                  activeSection === section.id
                    ? "bg-guava-orange text-white border-guava-orange shadow-md shadow-guava-orange/20 scale-[1.01]"
                    : "bg-white text-gray-400 border-gray-100/80 hover:border-guava-orange/20 hover:text-guava-dark",
                )}
              >
                <section.icon
                  className={cn(
                    "w-4 h-4",
                    activeSection === section.id
                      ? "text-white"
                      : "text-gray-400",
                  )}
                />
                <span>{section.label}</span>
                {activeSection === section.id && (
                  <motion.div
                    layoutId="nav-glow-lender-horizontal"
                    className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-200/20"
                >
                  {activeSection === "identity" && (
                    <div className="space-y-10">
                      <SectionHeader
                        title="Capital Entity Identity"
                        subtitle="Primary organizational data for institutional record sync."
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InputField
                          label="Official Entity Name"
                          value={lenderData.entityName}
                          onChange={(v) =>
                            setLenderData({ ...lenderData, entityName: v })
                          }
                        />
                        <InputField
                          label="Tax ID / Registration No."
                          value={lenderData.taxId}
                          onChange={(v) =>
                            setLenderData({ ...lenderData, taxId: v })
                          }
                          placeholder="e.g. VAT/TIN-8219"
                        />
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Primary Jurisdiction
                          </label>
                          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Globe className="w-5 h-5 text-gray-300" />
                            <input
                              className="w-full text-lg font-bold outline-none"
                              value={lenderData.jurisdiction}
                              onChange={(e) =>
                                setLenderData({
                                  ...lenderData,
                                  jurisdiction: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Institutional Category
                          </label>
                          <select
                            className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent"
                            value={lenderData.entityType}
                            onChange={(e) =>
                              setLenderData({
                                ...lenderData,
                                entityType: e.target.value,
                              })
                            }
                          >
                            <option value="Commercial Bank">
                              Commercial Bank
                            </option>
                            <option value="Retailer">Retailer</option>
                            <option value="Hedge Fund / Family Office">
                              Hedge Fund / Family Office
                            </option>
                            <option value="Pension Fund">Pension Fund</option>
                            <option value="Individual (HNW / Accredited)">
                              Individual (HNW / Accredited)
                            </option>
                          </select>
                        </div>
                      </div>

                                      <div className="pt-4 border-t border-slate-200 space-y-3">
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Record Custom Repayment Amount ($)</label>
                                          <input
                                            type="number"
                                            id="custom-repay-amount-input"
                                            placeholder="e.g. 250"
                                            className="w-full text-xs font-mono font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-guava-orange"
                                          />
                                        </div>
                                        <button
                                          onClick={() => {
                                            const input = document.getElementById("custom-repay-amount-input") as HTMLInputElement;
                                            const val = Math.round((parseFloat(input?.value) || 0) * 100) / 100;
                                            if (val <= 0) {
                                              alert("Repayment payload invalid: Enter amount greater than zero.");
                                              return;
                                            }
                                            handleLogCustomRepayment(selectedRepayLoanId, val);
                                            if (input) input.value = "";
                                          }}
                                          className="w-full py-2.5 bg-guava-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-sm shadow-guava-orange/10 cursor-pointer border-none"
                                        >
                                          Submit Repayment Segment
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                                
                                {!selectedRepayLoanId && (
                                  <div className="text-center py-6 text-slate-400 font-bold">
                                    <p className="text-[10px] font-bold uppercase">No Corridor Selection</p>
                                    <p className="text-[9px] mt-1 font-semibold">Select a borrower corridor above to register instant installments or record repayments.</p>
                                  </div>
                                )}
                              </div>

                              {/* Right detailed list in repayments */}
                              <div className="lg:col-span-2 space-y-4">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                    {selectedRepayLoanId ? "Installment Amortization Milestones" : "Global Repayments Amortization Matrix"}
                                  </h4>
                                  <span className="text-[9px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">
                                    {selectedRepayLoanId 
                                      ? `Filtered: ${repaymentsList.filter(r => r.loanId === selectedRepayLoanId).length} Payments` 
                                      : `${repaymentsList.length} total payments`
                                    }
                                  </span>
                                </div>

                                <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                  <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-gray-100 text-[9px] font-black uppercase tracking-wider text-slate-505">
                                      <tr>
                                        <th className="p-4">Staff Member</th>
                                        <th className="p-4">Due Date</th>
                                        <th className="p-4">Corridor Owed</th>
                                        <th className="p-4">Milestone Status</th>
                                        <th className="p-4 text-right">Quick Intervention</th>
                                      </tr>
                                    </thead>
                                    <tbody className="text-xs font-semibold text-slate-700 divide-y divide-gray-50">
                                      {(selectedRepayLoanId 
                                        ? repaymentsList.filter(r => r.loanId === selectedRepayLoanId)
                                        : repaymentsList
                                      ).map((repay, idx) => {
                                        const associatedLoan = loansList.find(l => l.id === repay.loanId);
                                        const borrowerUid = associatedLoan?.borrowerId || "unknown";
                                        const emp = customUsers.find(u => u.uid === borrowerUid) || { displayName: `Staff Node ID: ${borrowerUid.slice(0, 5)}` };
                                        
                                        return (
                                          <tr key={repay.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                              <p className="font-bold text-guava-dark">{emp.displayName}</p>
                                              <p className="text-[8px] font-mono text-slate-400">{associatedLoan?.purpose ? associatedLoan.purpose.slice(0, 24) : "Micro Loan"}...</p>
                                            </td>
                                            <td className="p-4 font-mono font-bold text-slate-500">{repay.dueDate}</td>
                                            <td className="p-4 font-mono font-black">${repay.amount.toFixed(2)}</td>
                                            <td className="p-4">
                                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                repay.status === "PAID" ? "bg-green-100 text-guava-green" :
                                                repay.status === "OVERDUE" ? "bg-red-100 text-red-600 animate-pulse" :
                                                "bg-amber-100 text-amber-600"
                                              }`}>
                                                {repay.status}
                                              </span>
                                            </td>
                                            <td className="p-4 text-right">
                                              {repay.status !== "PAID" ? (
                                                <button
                                                  onClick={() => handleSurgicalPayRepayment(repay.id)}
                                                  className="px-2.5 py-1 bg-guava-dark hover:bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none"
                                                >
                                                  Instant Settle
                                                </button>
                                              ) : (
                                                <span className="text-[8px] font-bold text-guava-green font-mono">Completed ✓</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {loanManagerTab === "calculator" && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                              {/* Left parameters */}
                              <div className="lg:col-span-4 space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Dynamic Amortization Simulator</h4>
                                
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Principal Volume Amount ($)</label>
                                    <input
                                      type="number"
                                      value={calcPrincipal}
                                      onChange={(e) => setCalcPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
                                      className="w-full text-xs font-mono font-black border border-gray-200 rounded-xl px-3 py-2.5 bg-transparent"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Annual Interest rate APR (%)</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={calcInterest}
                                      onChange={(e) => setCalcInterest(Math.max(0, parseFloat(e.target.value) || 0))}
                                      className="w-full text-xs font-mono font-black border border-gray-200 rounded-xl px-3 py-2.5 bg-transparent"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Amortization Term Duration (Months)</label>
                                    <input
                                      type="number"
                                      value={calcTermMonths}
                                      onChange={(e) => setCalcTermMonths(Math.max(1, parseInt(e.target.value) || 0))}
                                      className="w-full text-xs font-mono font-black border border-gray-200 rounded-xl px-3 py-2.5 bg-transparent"
                                    />
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold">Estimated Monthly Installment:</span>
                                    <span className="font-mono font-black text-guava-orange text-sm">${calculatedInstallment.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold">Cumulative Interest Fee:</span>
                                    <span className="font-mono font-black text-guava-dark">${calculatedTotalInterest.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold">Aggregate Repayment Sum:</span>
                                    <span className="font-mono font-black text-slate-800">${calculatedTotalPayable.toFixed(2)}</span>
                                  </div>
                                </div>

                                <div className="pt-4 border-t border-slate-200 space-y-3">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Directly Disburse Sandbox Simulator Loan</label>
                                  <select
                                    id="sandbox-borrower-select"
                                    className="w-full text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-guava-orange appearance-none"
                                  >
                                    <option value="">-- Choose Sandbox Target --</option>
                                    {customUsers.filter(u => !u.isBlacklisted).map(u => (
                                      <option key={u.uid} value={u.uid}>{u.displayName} ({u.department})</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      const select = document.getElementById("sandbox-borrower-select") as HTMLSelectElement;
                                      const borrowerId = select?.value;
                                      if (!borrowerId) {
                                        alert("Sandbox generation blocked: Please choose target staff corridor first.");
                                        return;
                                      }
                                      handleSimulatedDisbursal(borrowerId, calcPrincipal, calcInterest, calcTermMonths);
                                      if (select) select.value = "";
                                    }}
                                    className="w-full py-2.5 bg-guava-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-colors shadow-sm cursor-pointer border-none"
                                  >
                                    ⚡ Disburse simulated Loan
                                  </button>
                                </div>
                              </div>

                              {/* RightSchedule Chart */}
                              <div className="lg:col-span-8 space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Generated Monthly Amortization Table</h4>
                                <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm max-h-[380px] overflow-y-auto">
                                  <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10 w-full">
                                      <tr>
                                        <th className="p-3">Month</th>
                                        <th className="p-3">Installment Payment</th>
                                        <th className="p-3">Towards Principal</th>
                                        <th className="p-3">Towards Interest</th>
                                        <th className="p-3 text-right">Outstanding Principal</th>
                                      </tr>
                                    </thead>
                                    <tbody className="text-xs font-semibold text-slate-700 divide-y divide-gray-50">
                                      {amortizationSchedule.map((row) => (
                                        <tr key={row.month} className="hover:bg-slate-50/35 transition-colors">
                                          <td className="p-3 font-bold">Month {row.month}</td>
                                          <td className="p-3 font-mono">${row.payment.toFixed(2)}</td>
                                          <td className="p-3 font-mono text-guava-green">${row.principal.toFixed(2)}</td>
                                          <td className="p-3 font-mono text-amber-500">${row.interest.toFixed(2)}</td>
                                          <td className="p-3 font-mono text-right font-black">${row.balance.toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {loanManagerTab === "notifications" && (
                          <div className="space-y-6">
                            <div className="flex justify-between items-center pb-2">
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Automated Installment Delinquency Alerts</h4>
                                <p className="text-[10px] text-gray-400 font-semibold mt-1">Pending and delinquent milestones inside active employee corridors</p>
                              </div>
                              <span className="text-[9px] font-black uppercase bg-red-50 border border-red-100 text-red-600 px-2 py-0.5 rounded">
                                {repaymentsList.filter(r => r.status === "OVERDUE").length} OVERDUE
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Left Column: Alerts feed */}
                              <div className="md:col-span-2 space-y-4">
                                {repaymentsList.filter(r => r.status === "OVERDUE" || r.status === "PENDING").length === 0 ? (
                                  <div className="bg-green-50 p-6 rounded-3xl border border-green-100/50 text-center text-slate-600 space-y-2">
                                    <p className="text-xs font-black uppercase tracking-wider text-guava-green">✓ System Portfolios are perfect</p>
                                    <p className="text-[10px] text-gray-400 font-semibold">Zero pending calculations or overdue warnings recorded inside security corridor.</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {repaymentsList
                                      .filter(r => r.status === "OVERDUE" || r.status === "PENDING")
                                      .map((repay) => {
                                        const associatedLoan = loansList.find(l => l.id === repay.loanId);
                                        const borrowerUid = associatedLoan?.borrowerId || "unknown";
                                        const emp = customUsers.find(u => u.uid === borrowerUid) || { displayName: `Staff ID: ${borrowerUid.slice(0, 5)}` };
                                        
                                        return (
                                          <div key={repay.id} className={`p-5 rounded-3xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                                            repay.status === "OVERDUE" 
                                              ? "bg-red-50/30 border-red-100/80 hover:bg-red-50/50" 
                                              : "bg-amber-50/30 border-amber-100/80 hover:bg-amber-50/50"
                                          }`}>
                                            <div className="space-y-1.5">
                                              <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${
                                                  repay.status === "OVERDUE" ? "bg-red-500 animate-pulse" : "bg-amber-500"
                                                }`} />
                                                <h5 className="text-xs font-black text-guava-dark">{emp.displayName}</h5>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                                  repay.status === "OVERDUE" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                                                }`}>
                                                  {repay.status}
                                                </span>
                                              </div>
                                              <p className="text-xs font-semibold text-slate-600 font-bold">
                                                Authorized payout amount <span className="font-mono font-black text-slate-800">${repay.amount.toFixed(2)}</span> is scheduled on <span className="font-mono text-slate-500">{repay.dueDate}</span>
                                              </p>
                                              <p className="text-[9px] text-gray-400 font-semibold">
                                                Corridor purpose: {associatedLoan?.purpose || "Active Micro Credit Allocation"}
                                              </p>
                                            </div>
                                            
                                            <button
                                              onClick={() => handleDispatchWarningNotification(repay, emp.displayName)}
                                              className={`w-full sm:w-auto px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border-none ${
                                                repay.status === "OVERDUE"
                                                  ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                                  : "bg-slate-800 hover:bg-slate-900 text-white"
                                              }`}
                                            >
                                              Notify Borrower
                                            </button>
                                          </div>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>

                              {/* Right column: Notification simulator logs dashboard */}
                              <div className="md:col-span-1 space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Notification Logs Channel</h4>
                                <p className="text-[10px] text-slate-400 font-semibold font-bold">Active warning signals transmitted across system corridors</p>
                                
                                <div className="space-y-3 max-h-64 overflow-y-auto pt-2 border-t border-slate-200">
                                  <div className="p-3 bg-white rounded-2xl border border-slate-100 text-[10px] space-y-1">
                                    <div className="flex justify-between items-center font-mono text-[8px] text-slate-400">
                                      <span>NOTICE DISPATCH #09</span>
                                      <span>02 MINS AGO</span>
                                    </div>
                                    <p className="font-extrabold text-slate-700">Notice pushed to Soka Kamwendo</p>
                                    <p className="text-slate-500 font-medium text-[9px]">Instalment: $141.00. Status: PENDING (Scheduled 3 days from now)</p>
                                  </div>

                                  <div className="p-3 bg-white rounded-2xl border border-slate-100 text-[10px] space-y-1">
                                    <div className="flex justify-between items-center font-mono text-[8px] text-slate-400">
                                      <span>WARN TRANSCEPT #01</span>
                                      <span>12 HOURS AGO</span>
                                    </div>
                                    <p className="font-extrabold text-red-600">Sovereign Notice push to Thoko Moyo</p>
                                    <p className="text-slate-500 font-medium text-[9px]">Instalment: $167.50 is OVERDUE by 75 days. Legal trace initialized.</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-10 animate-fade-in">
                        <div className="flex justify-between items-center pb-2">
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Compliance credentials &amp; Verification</h4>
                            <p className="text-xs text-gray-400 font-semibold font-bold">Submit tax articles, physical coordinates on maps and legal KYB data</p>
                          </div>
                          <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-500">
                            Completeness: {completeness}%
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Left: Input parameters */}
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">
                                Entity Name
                              </label>
                              <input 
                                type="text" 
                                className="w-full text-sm font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" 
                                value={lenderData.entityName}
                                onChange={(e) => setLenderData({ ...lenderData, entityName: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">
                                Sovereign TAX ID Register
                              </label>
                              <input 
                                type="text" 
                                className="w-full text-sm font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" 
                                value={lenderData.taxId}
                                onChange={(e) => setLenderData({ ...lenderData, taxId: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold">
                                HQ Physical Location Address
                              </label>
                              <input 
                                type="text" 
                                className="w-full text-sm font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" 
                                value={lenderData.hqAddress}
                                onChange={(e) => setLenderData({ ...lenderData, hqAddress: e.target.value })}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold font-semibold">Latitude</label>
                                <input 
                                  type="number" 
                                  className="w-full text-xs font-mono font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" 
                                  value={lenderData.latitude}
                                  onChange={(e) => setLenderData({ ...lenderData, latitude: Number(e.target.value) })}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 font-bold font-mono">Longitude</label>
                                <input 
                                  type="number" 
                                  className="w-full text-xs font-mono font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" 
                                  value={lenderData.longitude}
                                  onChange={(e) => setLenderData({ ...lenderData, longitude: Number(e.target.value) })}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right: Map Integration element */}
                          <div id="map-preview" className="h-[280px] bg-gray-50 border border-gray-100 rounded-3xl overflow-hidden relative shadow-sm">
                            <BusinessLocationMap 
                              physicalAddress={lenderData.hqAddress}
                              latitude={lenderData.latitude}
                              longitude={lenderData.longitude}
                              onLocationSelected={(lat, lng) => {
                                setLenderData({
                                  ...lenderData,
                                  latitude: lat,
                                  longitude: lng
                                });
                                addLogEvent("info", `Enterprise Map Pin coordinates updated: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-6">
                          <SectionHeader 
                            title="Corporate audit evidence uploads" 
                            subtitle="Identity Articles, Verification of Capital Assets and legal licenses." 
                          />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <UploadCard
                              id="governance"
                              label="Incorporation document"
                              active={uploads.governance}
                              state={uploadProgress.governance}
                              onFileChosen={(file) => handleFileChosen("governance", file)}
                            />
                            <UploadCard
                              id="proofOfFunds"
                              label="Proof of credit liquidity"
                              active={uploads.proofOfFunds}
                              state={uploadProgress.proofOfFunds}
                              onFileChosen={(file) => handleFileChosen("proofOfFunds", file)}
                            />
                            <UploadCard
                              id="operatingLicense"
                              label="Regulatory operating license"
                              active={uploads.operatingLicense}
                              state={uploadProgress.operatingLicense}
                              onFileChosen={(file) => handleFileChosen("operatingLicense", file)}
                            />
                            <UploadCard
                              id="complianceAudit"
                              label="Third-party audit review"
                              active={uploads.complianceAudit}
                              state={uploadProgress.complianceAudit}
                              onFileChosen={(file) => handleFileChosen("complianceAudit", file)}
                            />
                            <UploadCard
                              id="taxResidency"
                              label="Tax verification card"
                              active={uploads.taxResidency}
                              state={uploadProgress.taxResidency}
                              onFileChosen={(file) => handleFileChosen("taxResidency", file)}
                            />
                          </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <p className="text-xs text-gray-400 font-semibold font-semibold">
                            {isUploadComplete 
                              ? "Credentials verification ready: click Authenticate to secure node corridors of the enterprise." 
                              : "Upload remaining standard items to finish initial regulatory token onboarding."}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 w-full sm:w-auto justify-end">
                            <button 
                              onClick={clearNodeCache}
                              className="flex-1 sm:flex-initial px-5 py-3 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                            >
                              Reset Node Cache
                            </button>
                            <button 
                              onClick={saveProfile}
                              disabled={isSaving}
                              className="flex-1 sm:flex-initial px-6 py-3 bg-white text-slate-800 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                            >
                              <Save className="w-3.5 h-3.5" /> Save details
                            </button>
                            <button
                              onClick={handleVerify}
                              disabled={isVerifying || !isUploadComplete}
                              className={`flex-1 sm:flex-initial px-8 py-3 bg-guava-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-guava-orange/90 flex items-center justify-center gap-2 cursor-pointer transition-all border-none ${
                                !isUploadComplete ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'shadow-lg shadow-guava-orange/20'
                              }`}
                            >
                              {isVerifying ? "Verifying matrix..." : "Authenticate Global Portal"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* ================================================================= TAB: BUSINESS PORTFOLIO ================================================================= */}
                {activeTab === "portfolio" && (
                  <div id="tab-portfolio-panel" className="space-y-8">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-guava-dark decoration-guava-orange decoration-4 underline-offset-8 underline mb-1">
                          Business Credit Portfolio
                        </h3>
                        <p className="text-xs text-gray-400 font-semibold">Active employee corridors and scheduled repayment amortization maps</p>
                      </div>
                      
                      <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                        <input 
                          type="text" 
                          placeholder="Search borrower name..." 
                          className="px-4 py-1.5 text-xs font-semibold bg-transparent outline-none max-w-44"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* ENHANCED AMORTIZATION LIST */}
                    <div className="space-y-6">
                      <div className="border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 border-b border-gray-100 text-[9px] font-black uppercase tracking-wider text-slate-505">
                            <tr>
                              <th className="p-4">Staff Member</th>
                              <th className="p-4">authorized / APR</th>
                              <th className="p-4">repayment tenure</th>
                              <th className="p-4">Amortization progress</th>
                              <th className="p-4">corridor Status</th>
                              <th className="p-4 text-center">Operational action</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs font-semibold text-slate-700 divide-y divide-gray-50">
                            {loansList
                              .filter(l => {
                                const emp = customUsers.find(u => u.uid === l.borrowerId) || { displayName: "" };
                                return emp.displayName.toLowerCase().includes(searchQuery.toLowerCase());
                              })
                              .map((item, idx) => {
                                const emp = customUsers.find(u => u.uid === item.borrowerId) || { displayName: `Staff ID ${item.borrowerId.slice(0, 6)}`, department: "Operations" };
                                return (
                                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                      <p className="font-bold text-guava-dark">{emp.displayName}</p>
                                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">{emp.department || "Staff Node"}</p>
                                    </td>
                                    <td className="p-4">
                                      <p className="font-mono font-black">${item.amount.toLocaleString()} USD</p>
                                      <p className="text-[10px] text-gray-400 font-mono font-bold mr-1">@{item.interestRate}% Interest</p>
                                    </td>
                                    <td className="p-4">
                                      <p>{item.durationMonths} Months</p>
                                      <p className="text-[9px] font-bold text-slate-400">Term Ends: Q4-2026</p>
                                    </td>
                                    <td className="p-4">
                                      <div className="w-full space-y-1">
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full ${
                                            item.status === LoanStatus.DELINQUENT ? 'bg-red-500' : 'bg-guava-green'
                                          }`} style={{ width: item.status === LoanStatus.COMPLETED ? '100%' : '60%' }} />
                                        </div>
                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider text-right">
                                          {item.status === LoanStatus.COMPLETED ? 'Paid Complete' : 'Installments 3/6 Paid'}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                        item.status === LoanStatus.FUNDED ? "bg-green-500/10 text-guava-green" :
                                        item.status === LoanStatus.DELINQUENT ? "text-red-500 bg-red-50 animate-pulse" : "text-amber-500 bg-amber-50"
                                      }`}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="p-4 text-center">
                                      <button 
                                        onClick={() => {
                                          addLogEvent("info", `dispatched legal trace ping securely for employee ${emp.displayName}`);
                                          alert(`Legal trace check audit initiated for ${emp.displayName}. Record validated with hash: md5-${Date.now().toString().slice(6)}`);
                                        }}
                                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer hover:bg-slate-700 hover:scale-[1.02] transition-all border-none"
                                      >
                                        Trigger Audit Check
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}
                
                {/* ================================================================= TAB: BLACKLIST ================================================================= */}
                {activeTab === "blacklist" && (
                  <div id="tab-blacklist-panel" className="space-y-8">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-red-500 decoration-red-500 decoration-4 underline-offset-8 underline mb-1">
                          Workforce Risk Blacklist
                        </h3>
                        <p className="text-xs text-gray-400 font-semibold">Restrict credit permissions and blacklist users with repayment defaults</p>
                      </div>
                      <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-[9px] font-black uppercase tracking-wider border border-red-100 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> High Risk Protocol Active
                      </span>
                    </div>

                    {/* TWO COLUMN WORKSPACE */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                      {/* Form: Add Restricted members */}
                      <form onSubmit={handleAddBlacklist} className="lg:col-span-2 bg-gray-50 border border-gray-100 rounded-3xl p-6 space-y-5 self-start">
                        <div className="flex items-center gap-2 mb-2">
                          <UserX className="w-5 h-5 text-red-500" />
                          <h4 className="text-sm font-black uppercase tracking-wide text-slate-800">Add Restrictive Block</h4>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee email or UID ID</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. thoko.moyo@guavacorp.com"
                            className="w-full text-xs font-semibold px-4 py-2 border border-gray-200 rounded-xl bg-white focus:border-red-500 outline-none"
                            value={blacklistForm.emailOrUid}
                            onChange={(e) => setBlacklistForm({ ...blacklistForm, emailOrUid: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reason Category</label>
                          <select 
                            className="w-full text-xs font-semibold px-4 py-2 border border-gray-200 rounded-xl bg-white focus:border-red-500 outline-none"
                            value={blacklistForm.category}
                            onChange={(e) => setBlacklistForm({ ...blacklistForm, category: e.target.value })}
                          >
                            <option value="Default Risk">Exceeded Delinquency Bounds (Default Risk)</option>
                            <option value="Policy Violation">Contract Breach / Policy Violation</option>
                            <option value="Identity Mismatch">Sovereign KYB Mismatch Error</option>
                            <option value="Termination">Voluntary/Involuntary Job Termination</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delinquency Remarks / details</label>
                          <textarea 
                            rows={3}
                            placeholder="Late installment warnings ignored for over 60 days on solar loan..."
                            className="w-full text-xs font-semibold px-4 py-2 border border-gray-200 rounded-xl bg-white focus:border-red-500 outline-none"
                            value={blacklistForm.reason}
                            onChange={(e) => setBlacklistForm({ ...blacklistForm, reason: e.target.value })}
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] cursor-pointer transition-all border-none"
                        >
                          Submit Restriction Block
                        </button>
                      </form>

                      {/* Display Active blacklist */}
                      <div className="lg:col-span-3 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Blacklisted borrowers</p>
                        
                        <div className="space-y-4">
                          {blacklistedEmployeesList.length === 0 ? (
                            <div className="p-8 text-center bg-gray-50 border border-gray-100 rounded-3xl">
                              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">No borrowers are blacklisted inside this enterprise gateway node.</p>
                            </div>
                          ) : (
                            blacklistedEmployeesList.map(item => (
                              <div key={item.uid} className="p-6 bg-red-50/30 border border-red-100 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="space-y-1.5 text-center md:text-left">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-bold text-slate-800 text-sm">{item.displayName}</h5>
                                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[8px] font-black uppercase tracking-widest">
                                      {item.blacklistCategory || "High Risk default"}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-505 font-mono">{item.email}</p>
                                  <p className="text-xs text-red-800 font-medium italic">Reason: {item.blacklistReason || "micro-loan payment delinquency alerts ignored"}</p>
                                </div>
                                <button 
                                  onClick={() => handleRemoveFromBlacklist(item.uid, item.displayName)}
                                  className="px-4 py-2 bg-white hover:bg-red-50 hover:text-red-600 border border-red-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all shrink-0"
                                >
                                  Pardon & Restore Access
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                )}
                
                {/* ================================================================= TAB: USER MANAGEMENT ================================================================= */}
                {activeTab === "users" && (
                  <div id="tab-users-panel" className="space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-guava-dark decoration-guava-orange decoration-4 underline-offset-8 underline mb-1">
                          Workforce Node Directory
                        </h3>
                        <p className="text-xs text-gray-400 font-semibold">Allocate credit lines, update roles, and manage employee borrow limits</p>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full md:w-auto self-start">
                        <div className="flex bg-gray-50 px-2 py-1.5 rounded-2xl border border-gray-100 w-full sm:w-auto">
                          <input 
                            type="text" 
                            placeholder="Filter employee registry..." 
                            className="bg-transparent text-xs font-semibold px-2 outline-none w-full sm:w-44"
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={() => setIsAddUserModalOpen(true)}
                          className="px-5 py-2.5 bg-guava-orange hover:bg-guava-orange/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:scale-[1.01] transition-all shrink-0 flex items-center gap-1 border-none font-sans"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Invite Staff Member
                        </button>
                      </div>
                    </div>

                    {/* ROSTER TABLE */}
                    <div className="border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[9px] font-black uppercase tracking-wider text-slate-550">
                          <tr>
                            <th className="p-4">Employee Details</th>
                            <th className="p-4">corporate Division</th>
                            <th className="p-4">KYC state</th>
                            <th className="p-4">Credit Score</th>
                            <th className="p-4">Authorized limit</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-semibold text-slate-750 divide-y divide-gray-50">
                          {filteredEmployeesList.map(item => (
                            <tr key={item.uid} className={`hover:bg-gray-50/50 transition-colors ${item.isBlacklisted ? 'opacity-50 min-h-[50px]' : ''}`}>
                              <td className="p-4">
                                <p className="font-bold text-guava-dark flex items-center gap-1.5">
                                  {item.displayName}
                                  {item.isBlacklisted && <span className="px-1.5 py-0.5 bg-red-100 text-[7px] text-red-600 rounded">Restricted</span>}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 font-bold">{item.email}</p>
                              </td>
                              <td className="p-4 font-black uppercase text-[10px] tracking-wider text-slate-500">
                                {item.department || "Operations Node"}
                              </td>
                              <td className="p-4">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                  item.kycStatus === 'VERIFIED' ? 'bg-green-500/10 text-guava-green' : 'bg-amber-50 text-orange-500'
                                }`}>
                                  {item.kycStatus}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="font-mono font-black">{item.creditScore} AAA</span>
                              </td>
                              <td className="p-4">
                                <span className="font-mono font-black text-guava-orange">${(item.borrowLimit || 2000).toLocaleString()} USD</span>
                              </td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => openEditUser(item)}
                                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-colors border-none"
                                >
                                  Modify bounds
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}
                
                {/* ================================================================= TAB: SYSTEM CONFIGURATION ================================================================= */}
                {activeTab === "config" && (
                  <div id="tab-config-panel" className="space-y-8">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-guava-dark decoration-guava-orange decoration-4 underline-offset-8 underline mb-1">
                          System configuration
                        </h3>
                        <p className="text-xs text-gray-400 font-semibold">Adjust interest APR policies, automated credit metrics and security bounds</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-50 text-blue-500 rounded-full text-[9px] font-black uppercase tracking-wider border border-blue-100">
                        Institutional policies
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: General rules */}
                      <div className="space-y-6 bg-gray-50 border border-gray-100 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-2">
                          <Percent className="w-5 h-5 text-guava-orange" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Sovereign rules APR rates</h4>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                            <span>Base Annual Percentage Yield</span>
                            <span className="font-bold text-guava-orange">{lenderConfig.baseApr}% interest</span>
                          </label>
                          <input 
                            type="range" 
                            min="5" 
                            max="30" 
                            step="0.1"
                            className="w-full accent-guava-orange cursor-pointer"
                            value={lenderConfig.baseApr}
                            onChange={(e) => setLenderConfig({ ...lenderConfig, baseApr: Number(e.target.value) })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                            <span>Max Employee Debt-to-income (DTI) Cap</span>
                            <span className="font-bold text-slate-800">{lenderConfig.maxDebtToIncome}% of gross salary</span>
                          </label>
                          <input 
                            type="range" 
                            min="10" 
                            max="60" 
                            step="5"
                            className="w-full accent-slate-800 cursor-pointer"
                            value={lenderConfig.maxDebtToIncome}
                            onChange={(e) => setLenderConfig({ ...lenderConfig, maxDebtToIncome: Number(e.target.value) })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                            <span>Minimum Auto-Approval rating</span>
                            <span className="font-bold text-guava-green">FICO SCORE {lenderConfig.autoScoreThreshold}</span>
                          </label>
                          <input 
                            type="range" 
                            min="500" 
                            max="850" 
                            step="5"
                            className="w-full accent-guava-green cursor-pointer"
                            value={lenderConfig.autoScoreThreshold}
                            onChange={(e) => setLenderConfig({ ...lenderConfig, autoScoreThreshold: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      {/* Right: Security & approval protocols */}
                      <div className="space-y-6 bg-gray-50 border border-gray-100 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-2">
                          <ShieldCheck className="w-5 h-5 text-guava-green" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Security & dispatch rules</h4>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                            <div>
                              <p className="text-xs font-bold text-slate-800">MFA & 2FA mandatory check</p>
                              <p className="text-[9px] text-gray-400 font-medium">Verify employee identity signature via 2FA</p>
                            </div>
                            <input 
                              type="checkbox" 
                              className="accent-guava-orange cursor-pointer w-4 h-4"
                              checked={lenderConfig.is2faMandatory}
                              onChange={(e) => setLenderConfig({ ...lenderConfig, is2faMandatory: e.target.checked })}
                            />
                          </div>

                          <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
                            <div>
                              <p className="text-xs font-bold text-slate-800">Auto-Disbursement triggers</p>
                              <p className="text-[9px] text-gray-400 font-medium">Automatically dispatch capital once credit checks match</p>
                            </div>
                            <input 
                              type="checkbox" 
                              className="accent-guava-orange cursor-pointer w-4 h-4"
                              checked={lenderConfig.autoFundApproval}
                              onChange={(e) => setLenderConfig({ ...lenderConfig, autoFundApproval: e.target.checked })}
                            />
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Grace Period (Days)</label>
                            <input 
                              type="number" 
                              className="w-full text-xs font-bold px-4 py-2 border border-gray-200 rounded-xl bg-white outline-none"
                              value={lenderConfig.gracePeriodDays}
                              onChange={(e) => setLenderConfig({ ...lenderConfig, gracePeriodDays: Number(e.target.value) })}
                            />
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Maturity delays allowed before late penalties fees trigger.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={() => {
                          addLogEvent("success", "System policies re-calibrated successfully: settings pushed to smart pools");
                          alert("System Configuration saved successfully! Smart liquidity pool parameters were updated instantly.");
                        }}
                        className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border-none"
                      >
                        Deploy updated bounds
                      </button>
                    </div>

                  </div>
                )}
                
                {/* ================================================================= TAB: REPORTS ================================================================= */}
                {activeTab === "reports" && (
                  <div id="tab-reports-panel" className="space-y-8">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-guava-dark decoration-guava-orange decoration-4 underline-offset-8 underline mb-1">
                          Enterprise Ledger Reports
                        </h3>
                        <p className="text-xs text-gray-400 font-semibold">Generate structured CSV yields sheets, compliance statements and staff debt parameters</p>
                      </div>
                      <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-550">
                        Reporting tools
                      </span>
                    </div>

                      {isUploadComplete ? (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-8 bg-emerald-50 rounded-[32px] border-2 border-emerald-500/20 text-emerald-950 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden md:text-left text-center shadow-xl shadow-emerald-500/5 mt-8"
                        >
                          <div className="flex flex-col gap-1 items-center md:items-start text-left">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-emerald-500/20">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Compliance Active
                            </div>
                            <h4 className="text-xl font-black text-emerald-900 mt-2 tracking-tight">
                              KYB Verification Approved by System
                            </h4>
                            <p className="text-xs text-emerald-700/80 font-medium max-w-xl">
                              The automated regulatory compliance engine has audited all uploaded credentials and validated your institutional node authenticity.
                            </p>
                          </div>
                          <button
                            onClick={handleVerify}
                            disabled={isVerifying}
                            className="px-8 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 w-full md:w-auto justify-center"
                          >
                            {isVerifying ? (
                              <>Connecting Node... <RefreshCw className="w-4 h-4 animate-spin" /></>
                            ) : (
                              <>Authenticate Node <ArrowRight className="w-4 h-4" /></>
                            )}
                          </button>
                        </motion.div>
                      ) : (
                        <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <p className="text-xs text-gray-400 font-medium">
                            Upload all 5 credentials to activate full institutional gateway authentication.
                          </p>
                          <button
                            onClick={saveProfile}
                            disabled={isSaving}
                            className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer shadow-lg w-full sm:w-auto justify-center"
                          >
                            {isSaving ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            Save Progress
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="lender-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <div className="bg-white border-4 border-guava-dark rounded-[48px] p-12 shadow-2xl relative overflow-hidden text-center md:text-left">
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                      <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-guava-green/10 text-guava-green rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-guava-green/20">
                          <CheckCircle2 className="w-4 h-4" />
                          Verified Institutional Node
                        </div>
                        <h4 className="text-6xl font-black font-mono tracking-tighter text-guava-dark mb-4">
                          $
                          {(
                            lenderData.liquidityCapacity / 1000000
                          ).toLocaleString()}
                          M
                        </h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 max-w-sm">
                          DEPLOYMENT QUOTA AUTHORIZED FOR GLOBAL PORTAL POOLS.
                          JURISDICTION: {lenderData.jurisdiction.toUpperCase()}
                        </p>
                        <div className="flex gap-4">
                          <button className="flex-1 py-5 bg-guava-dark text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-guava-orange transition-all flex items-center justify-center gap-3">
                            Enter Market Board
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corporate Email</label>
                  <input 
                    type="email" 
                    required
                    className="w-full text-xs font-semibold px-4 py-2 border border-gray-200 rounded-xl outline-none"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  />
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-guava-orange text-white rounded-[40px] shadow-lg shadow-guava-orange/20">
                      <h5 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
                        Avg Market Yield
                      </h5>
                      <p className="text-4xl font-black font-mono tracking-tighter">
                        12.4%
                      </p>
                      <p className="text-[10px] font-bold mt-2 opacity-80 italic uppercase">
                        Exceeding target by 3.9%
                      </p>
                    </div>
                    <div className="md:col-span-2 p-8 bg-white border border-gray-100 rounded-[40px] flex items-center justify-between group cursor-pointer hover:border-guava-dark transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-guava-dark rounded-2xl flex items-center justify-center text-white italic font-black text-2xl group-hover:rotate-6 transition-transform">
                          ACX
                        </div>
                        <div>
                          <h6 className="text-lg font-black text-guava-dark">
                            Liquidity Certificate
                          </h6>
                          <p className="text-xs text-gray-400 font-medium">
                            Verify your capital availability to external
                            portals.
                          </p>
                        </div>
                      </div>
                      <button className="p-4 bg-gray-50 rounded-2xl group-hover:bg-guava-orange group-hover:text-white transition-all">
                        <Download className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* KYB Status Widget Panel on Right */}
          <div className="lg:col-span-3 space-y-6">
            <div className="p-8 bg-white border border-gray-100 rounded-[40px] relative overflow-hidden group shadow-sm">
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    KYB Readiness
                  </span>
                  <span className="text-sm font-black text-guava-dark">
                    {completeness}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completeness}%` }}
                    className="h-full bg-guava-green"
                  />
                </div>
                <button
                  disabled={isVerifying || !isUploadComplete}
                  onClick={handleVerify}
                  className="w-full py-4 bg-guava-orange text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-20 flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  {isVerifying ? "Verifying Node..." : "Authenticate Global Portal"}
                  {isVerifying && <RefreshCw className="w-4 h-4 animate-spin" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-black tracking-tight text-guava-dark uppercase underline decoration-guava-orange decoration-4 underline-offset-8 mb-4">
        {title}
      </h3>
      <p className="text-xs font-semibold text-gray-400">{subtitle}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 transition-colors bg-transparent"
      />
    </div>
  );
}

function UploadCard({
  id,
  label,
  active,
  state = { progress: 0, status: 'idle' },
  onFileChosen,
}: {
  id: string;
  label: string;
  active: boolean;
  state?: { progress: number; status: 'idle' | 'uploading' | 'analyzing' | 'approved'; fileName?: string };
  onFileChosen: (file: File) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChosen(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChosen(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative p-6 rounded-[32px] border-2 transition-all flex flex-col items-center justify-center gap-4 text-center h-52 overflow-hidden",
        isDragOver ? "border-guava-orange bg-guava-orange/5 scale-[1.02]" : "",
        state.status === 'approved' || active
          ? "bg-emerald-50/60 border-emerald-500/30 text-emerald-950"
          : state.status === 'uploading' || state.status === 'analyzing'
          ? "bg-slate-50 border-slate-300"
          : "bg-gray-50 border-dashed border-gray-200 text-gray-400 hover:border-guava-orange/40 hover:bg-gray-50/50"
      )}
    >
      <input
        type="file"
        id={`file-input-${id}`}
        className="hidden"
        onChange={handleChange}
        disabled={state.status !== 'idle' && state.status !== 'approved'}
      />

      <label
        htmlFor={`file-input-${id}`}
        className="absolute inset-0 cursor-pointer z-10"
      />

      {state.status === 'idle' && !active && (
        <div className="flex flex-col items-center gap-3 relative z-20 pointer-events-none">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm">
            <UploadCloud className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-gray-700">{label}</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Drag & drop or Click to Upload</p>
          </div>
        </div>
      )}

      {(state.status === 'uploading' || state.status === 'analyzing') && (
        <div className="flex flex-col items-center gap-2 w-full px-2 relative z-20 pointer-events-none">
          <div className="w-10 h-10 rounded-full border-2 border-guava-orange border-t-transparent animate-spin flex items-center justify-center" />
          <div className="space-y-1 w-full">
            <p className="text-[9px] font-black uppercase text-guava-dark">
              {state.status === 'uploading' ? `Uploading (${state.progress}%)` : 'Pre-Approving...'}
            </p>
            <p className="text-[8px] font-bold text-gray-400 truncate max-w-full">
              {state.fileName || 'analyzing_payload.pdf'}
            </p>
          </div>
        </div>
      )}

      {(state.status === 'approved' || active) && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-2 relative z-20 pointer-events-none"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">{label}</p>
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-[7px] font-black uppercase tracking-widest text-emerald-700 rounded-full border border-emerald-200">
              <ShieldCheck className="w-2.5 h-2.5" />
              Approved Node
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
