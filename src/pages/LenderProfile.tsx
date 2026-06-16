import { useState, useMemo, useEffect } from "react";
import { UserProfile, UserRole } from "../types";
import { useFirebase } from "../components/FirebaseProvider";
import { BusinessLocationMap } from "../components/BusinessLocationMap";
import { motion, AnimatePresence } from "motion/react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";
import {
  Building2,
  ShieldCheck,
  Globe,
  Wallet,
  CheckCircle2,
  Activity,
  Lock,
  ArrowRight,
  Landmark,
  Scale,
  Percent,
  Database,
  RefreshCw,
  Fingerprint,
  UploadCloud,
  FileSearch,
  Banknote,
  Download,
  Users,
  TrendingUp,
  DollarSign,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Package,
  Plus,
  Edit3,
  Trash2,
  Save,
  Image as ImageIcon,
  AlertTriangle,
  Gavel,
  UserX,
  Bell,
  Mail,
  Search,
  Scan,
  QrCode,
  Printer,
  Zap,
  X,
  Calendar,
  MapPin,
  SlidersHorizontal,
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
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { StockItem } from "../types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LenderProfileProps {
  user: UserProfile;
}

type LenderSection =
  | "identity"
  | "liquidity"
  | "mandate"
  | "income"
  | "compliance"
  | "documents"
  | "inventory"
  | "delinquency";

type TimeRange = "30D" | "6M" | "1Y" | "ALL";
type AssetClass =
  | "ALL"
  | "Energy"
  | "Agriculture"
  | "Retail"
  | "Retailer"
  | "Consumer";
type Region =
  | "ALL"
  | "East Africa"
  | "Central Europe"
  | "Southeast Asia"
  | "Southern Africa";

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
  { name: "Origination Fees", value: 20, color: "#1e293b" },
  { name: "Late Penalties", value: 10, color: "#3b82f6" },
  { name: "Service Fees", value: 5, color: "#22c55e" },
];

export default function LenderProfile({ user }: LenderProfileProps) {
  const { updateProfile } = useFirebase();
  const [activeSection, setActiveSection] = useState<LenderSection>("identity");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerified, setIsVerified] = useState(user.kycStatus === "VERIFIED");
  const [step, setStep] = useState(1);
  const [inventory, setInventory] = useState<StockItem[]>(user.inventory || []);

  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [qrItem, setQrItem] = useState<StockItem | null>(null);
  const [scannedItem, setScannedItem] = useState<StockItem | null>(null);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<StockItem>>({
    name: "",
    category: "General",
    price: 0,
    currency: "USD",
    description: "",
    stockQuantity: 0,
    lowStockThreshold: 5,
    barcode: "",
  });

  const handleSaveItem = () => {
    if (editingItem) {
      setInventory((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? ({ ...item, ...newItem } as StockItem)
            : item,
        ),
      );
    } else {
      const itemToAdd: StockItem = {
        ...newItem,
        id: `prod_${Date.now()}`,
      } as StockItem;
      setInventory((prev) => [...prev, itemToAdd]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setNewItem({
      name: "",
      category: "General",
      price: 0,
      currency: "USD",
      description: "",
      stockQuantity: 0,
      lowStockThreshold: 5,
      barcode: "",
    });
  };

  const handleEditItem = (item: StockItem) => {
    setEditingItem(item);
    setNewItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (
      confirm("Are you sure you want to remove this asset from your inventory?")
    ) {
      setInventory((prev) =>
        prev
          .map((item) =>
            item.id === id ? { ...item, stockQuantity: 0 } : item,
          )
          .filter((item) => item.id !== id),
      );
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

  const [delinquentLoans, setDelinquentLoans] = useState<DelinquentLoan[]>([
    {
      id: "dlq_lagos_retail_01",
      borrower: "Lagos Retail Cooperative",
      amount: 18400,
      overdueDays: 37,
      creditScore: 594,
      stage: "INITIAL",
    },
    {
      id: "dlq_nairobi_solar_02",
      borrower: "Nairobi Solar Imports",
      amount: 42100,
      overdueDays: 58,
      creditScore: 561,
      stage: "WRITTEN",
    },
    {
      id: "dlq_harare_trade_03",
      borrower: "Harare FMCG Traders",
      amount: 9800,
      overdueDays: 74,
      creditScore: 522,
      stage: "FINAL",
    },
  ]);

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
        }, 1200);
      } else {
        setUploadProgress((prev) => ({
          ...prev,
          [key]: { progress: currentProgress, status: 'uploading', fileName: file.name },
        }));
      }
    }, 150);
  };

  const isUploadComplete = Object.values(uploads).every((v) => v);

  const clearNodeCache = () => {
    if (
      confirm(
        "Are you sure you want to clear the node cache? This will reset all local registration data and reload the terminal.",
      )
    ) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("acx_")) {
          localStorage.removeItem(key);
        }
      });
      window.location.reload();
    }
  };

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
          contactPerson:
            user.organizationDetails?.contactPerson || user.displayName,
          industry: lenderData.entityType,
          taxId: lenderData.taxId,
        },
        borrowerDetails: {
          ...user.borrowerDetails,
          profile: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(user.borrowerDetails?.profile || ({} as any)),
            businessName: lenderData.entityName,
            businessReg: lenderData.taxId,
            industry: lenderData.entityType,
            isSME: lenderData.entityType === "Retailer",
          },
          uploads: user.borrowerDetails?.uploads || {},
          scoreResult: user.borrowerDetails?.scoreResult || null,
        },
        country: lenderData.jurisdiction,
      });
      alert("Portal Configuration Saved Successfully");
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
      setStep(2);
    }, 2500);
  };

  const sectionConfig: {
    id: LenderSection;
    label: string;
    eyebrow: string;
    icon: typeof Landmark;
  }[] = [
    {
      id: "identity",
      label: "Institution",
      eyebrow: "Entity profile",
      icon: Landmark,
    },
    {
      id: "liquidity",
      label: "Capital",
      eyebrow: "Limits & yield",
      icon: Banknote,
    },
    {
      id: "income",
      label: "Performance",
      eyebrow: "P&L insights",
      icon: TrendingUp,
    },
    {
      id: "mandate",
      label: "Mandate",
      eyebrow: "Markets & sectors",
      icon: Scale,
    },
    {
      id: "compliance",
      label: "Controls",
      eyebrow: "AML & risk",
      icon: ShieldCheck,
    },
    {
      id: "inventory",
      label: "Inventory",
      eyebrow: "Asset rails",
      icon: Package,
    },
    {
      id: "delinquency",
      label: "Collections",
      eyebrow: "Default queue",
      icon: AlertTriangle,
    },
    {
      id: "documents",
      label: "KYB",
      eyebrow: "Evidence vault",
      icon: FileSearch,
    },
  ];

  const completeness = useMemo(() => {
    const files = Object.values(uploads).filter(Boolean).length;
    const fields = Object.values(lenderData).filter(
      (v) => v !== "" && v !== 0 && (Array.isArray(v) ? v.length > 0 : true),
    ).length;
    return Math.min(
      100,
      Math.round(
        ((fields + files) /
          (Object.keys(lenderData).length + Object.keys(uploads).length)) *
          100,
      ),
    );
  }, [lenderData, uploads]);

  const displaySections = useMemo(() => {
    return sectionConfig;
  }, []);

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
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsScannerOpen(false);
                setScannedItem(null);
              }}
              className="absolute inset-0 bg-guava-dark/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8 md:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter text-guava-dark">
                      Inventory Pulse Scanner
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      Ready to authenticate asset hardware IDs.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsScannerOpen(false);
                      setScannedItem(null);
                    }}
                    className="p-3 hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-guava-dark"
                  >
                    <RefreshCw className="w-5 h-5 rotate-45" />
                  </button>
                </div>

                <div
                  id="reader"
                  className="w-full bg-gray-50 rounded-[32px] overflow-hidden border-2 border-dashed border-gray-200 min-h-[300px] flex items-center justify-center"
                >
                  <div className="text-center p-10">
                    <Scan className="w-12 h-12 text-gray-200 mx-auto mb-4 animate-pulse" />
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                      Initializing Optical Relay...
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {scannedItem && (
                    <motion.div
                      key={scannedItem.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="mt-8 p-6 bg-guava-green/5 rounded-[32px] border border-guava-green/10 flex items-center gap-6"
                    >
                      <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center shadow-inner">
                        {scannedItem.image ? (
                          <img
                            src={scannedItem.image}
                            alt={scannedItem.name}
                            className="w-full h-full object-cover rounded-[24px]"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-guava-green" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-guava-green text-white text-[8px] font-black uppercase rounded">
                            ID Detected
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            #{scannedItem.barcode || scannedItem.id.slice(-6)}
                          </span>
                        </div>
                        <h4 className="text-lg font-black text-guava-dark truncate">
                          {scannedItem.name}
                        </h4>
                        <p className="text-xs font-bold text-guava-orange tracking-tighter">
                          Current Inventory: {scannedItem.stockQuantity} Units
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="px-4 py-3 bg-guava-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3" />
                          Updated
                        </div>
                        <p className="text-[8px] font-black text-gray-400 uppercase text-center">
                          +1 Unit Added
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!scannedItem && (
                  <div className="mt-8 text-center bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Instructions
                    </p>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed italic">
                      Hold the asset barcode within the portal's frame. Upon
                      detection, inventory parameters will automatically
                      synchronize with the central node.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-guava-dark/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black tracking-tighter text-guava-dark">
                      {editingItem
                        ? "Update Asset Record"
                        : "Onboard New Inventory"}
                    </h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      Configure asset availability and market parameters.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2.5 hover:bg-gray-50 rounded-xl transition-all text-gray-400 hover:text-guava-dark"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Product Designation
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-b-2 border-gray-100 p-3 rounded-xl text-base font-bold outline-none focus:border-guava-orange transition-all"
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem({ ...newItem, name: e.target.value })
                      }
                      placeholder="e.g. Smart Solar Kit X1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Asset Category
                    </label>
                    <select
                      className="w-full bg-gray-50 border-b-2 border-gray-100 p-3 rounded-xl text-base font-bold outline-none focus:border-guava-orange transition-all appearance-none"
                      value={newItem.category}
                      onChange={(e) =>
                        setNewItem({ ...newItem, category: e.target.value })
                      }
                    >
                      <option value="Energy">Energy</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Retail">Retail</option>
                      <option value="Consumer">Consumer</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Unit Price (USD)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-gray-50 border-b-2 border-gray-100 p-3 rounded-xl text-base font-bold outline-none focus:border-guava-orange transition-all"
                      value={newItem.price}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          price: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Quantity
                      </label>
                      <input
                        type="number"
                        className="w-full bg-gray-50 border-b-2 border-gray-100 p-3 rounded-xl text-base font-bold outline-none focus:border-guava-orange transition-all"
                        value={newItem.stockQuantity}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            stockQuantity: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Threshold
                      </label>
                      <input
                        type="number"
                        className="w-full bg-gray-50 border-b-2 border-yellow-200 p-3 rounded-xl text-base font-bold outline-none focus:border-guava-orange transition-all"
                        value={newItem.lowStockThreshold}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            lowStockThreshold: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Barcode / SKU
                    </label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-b-2 border-gray-100 p-3 rounded-xl text-base font-bold outline-none focus:border-guava-orange transition-all"
                      value={newItem.barcode}
                      onChange={(e) =>
                        setNewItem({ ...newItem, barcode: e.target.value })
                      }
                      placeholder="e.g. 7890123456"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Market Description
                    </label>
                    <textarea
                      className="w-full bg-gray-50 border-b-2 border-gray-100 p-3 rounded-2xl text-sm font-medium outline-none focus:border-guava-orange transition-all min-h-[60px]"
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({ ...newItem, description: e.target.value })
                      }
                      placeholder="Briefly describe the asset utility and market positioning..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveItem}
                    className="flex-[2] py-3.5 bg-guava-orange text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-guava-dark transition-all shadow-xl shadow-guava-orange/20"
                  >
                    {editingItem
                      ? "Update Asset Record"
                      : "Deploy to Inventory"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBulkPrintOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkPrintOpen(false)}
              className="absolute inset-0 bg-guava-dark/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 md:p-10 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter text-guava-dark">
                    Batch Label Foundry
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Generating {selectedItemIds.length} unique asset identifiers
                    for deployment.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-4 bg-guava-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-guava-dark transition-all shadow-lg shadow-guava-orange/20"
                  >
                    <Printer className="w-4 h-4" />
                    Print Batch
                  </button>
                  <button
                    onClick={() => setIsBulkPrintOpen(false)}
                    className="p-4 hover:bg-gray-50 rounded-2xl transition-all text-gray-400 hover:text-guava-dark"
                  >
                    <RefreshCw className="w-5 h-5 rotate-45" />
                  </button>
                </div>
              </div>

              <div className="p-10 overflow-y-auto print:p-0 print:overflow-visible bg-gray-50/50">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 print:grid-cols-3 print:gap-4">
                  {inventory
                    .filter((i) => selectedItemIds.includes(i.id))
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-4 print:shadow-none print:border print:border-gray-200"
                      >
                        <div className="w-full flex justify-between items-center mb-2">
                          <span className="px-2 py-0.5 bg-guava-orange text-white text-[7px] font-black uppercase rounded">
                            HARDWARE ID
                          </span>
                          <span className="text-[7px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                            {item.id.slice(-8)}
                          </span>
                        </div>

                        <QRCodeCanvas
                          value={`${window.location.origin}/checkout?productId=${item.id}`}
                          size={140}
                          level="H"
                          includeMargin={false}
                        />

                        <div className="space-y-1">
                          <p className="text-[11px] font-black italic text-guava-dark leading-tight line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                            {item.category}
                          </p>
                        </div>

                        <div className="w-full pt-4 border-t border-dashed border-gray-100 flex justify-center">
                          <div className="flex items-center gap-1 text-[7px] font-black text-guava-orange uppercase tracking-tighter">
                            <Zap className="w-2.5 h-2.5" />
                            ACX Deep-Link Enabled
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-12 p-8 bg-guava-dark text-white/50 rounded-[32px] text-center border border-white/5 print:hidden">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Label Calibration Instructions
                  </p>
                  <p className="text-xs font-medium mt-2 leading-relaxed">
                    Ensure your printer is set to{" "}
                    <span className="text-white">100% Scale</span> and{" "}
                    <span className="text-white">Portrait orientation</span>.
                    These labels are optimized for permanent adhesive mounting
                    on physical asset chassis.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {qrItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrItem(null)}
              className="absolute inset-0 bg-guava-dark/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[48px] shadow-2xl overflow-hidden border border-gray-100 p-10 text-center"
            >
              <div className="mb-8">
                <h3 className="text-xl font-black tracking-tighter text-guava-dark">
                  {qrItem.name}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Universal Asset Label
                </p>
              </div>

              <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100 flex items-center justify-center mb-8">
                <QRCodeCanvas
                  value={`${window.location.origin}/checkout?productId=${qrItem.id}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
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

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-[1440px] mx-auto p-4 md:p-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[28px] bg-slate-950 text-white border border-slate-800 shadow-2xl shadow-slate-300/30 mb-8"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-guava-orange via-guava-green to-blue-500" />
          <div className="relative grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8 p-6 md:p-8 lg:p-10">
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/70">
                  <Lock className="w-3.5 h-3.5 text-guava-green" />
                  Secured Lender Workspace
                </div>
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border",
                    isVerified
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : "border-amber-400/30 bg-amber-400/10 text-amber-200",
                  )}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isVerified ? "Verified Institution" : "KYB In Progress"}
                </div>
                {user.is2FAEnabled && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-100">
                    <Fingerprint className="w-3.5 h-3.5" />
                    2FA Enabled
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-guava-orange mb-3">
                  Africa Credit Exchange
                </p>
                <h2 className="max-w-4xl text-4xl md:text-6xl font-black tracking-tight text-white">
                  {lenderData.entityName || "Institutional Lender Profile"}
                </h2>
                <p className="mt-4 max-w-2xl text-sm md:text-base font-medium leading-7 text-slate-300">
                  Manage capital deployment, KYB evidence, asset-backed credit
                  rails, collections, and compliance controls from one
                  institutional profile.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: "Liquidity",
                    value:
                      lenderData.liquidityCapacity > 0
                        ? `$${lenderData.liquidityCapacity.toLocaleString()}`
                        : "$0",
                    icon: Wallet,
                  },
                  {
                    label: "Target Yield",
                    value: `${lenderData.minYieldTarget || 0}%`,
                    icon: Percent,
                  },
                  {
                    label: "KYB Readiness",
                    value: `${completeness}%`,
                    icon: ShieldCheck,
                  },
                  {
                    label: "Inventory Value",
                    value: `$${inventoryStats.totalValue.toLocaleString()}`,
                    icon: Package,
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + index * 0.05, duration: 0.35 }}
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <stat.icon className="w-4 h-4 text-guava-orange mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-lg font-black tracking-tight text-white">
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 md:p-6 backdrop-blur"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Org Logo"
                      className="w-14 h-14 rounded-2xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-guava-orange flex items-center justify-center text-white font-black shadow-lg shadow-guava-orange/20">
                      ACX
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Operating Jurisdiction
                    </p>
                    <p className="text-base font-black text-white">
                      {lenderData.jurisdiction || "Not configured"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearNodeCache}
                  className="p-3 rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-guava-orange/50 transition-all"
                  title="Clear node cache"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-8 space-y-3">
                {[
                  {
                    label: "Institution Type",
                    value: lenderData.entityType || "Institutional Investor",
                    icon: Building2,
                  },
                  {
                    label: "Company Size",
                    value: user.organizationDetails?.companySize || "Pending",
                    icon: Users,
                  },
                  {
                    label: "Primary Contact",
                    value:
                      user.organizationDetails?.contactPerson ||
                      user.displayName,
                    icon: Mail,
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.22 + index * 0.05 }}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-guava-orange">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {item.label}
                      </p>
                      <p className="truncate text-sm font-bold text-slate-100">
                        {item.value}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Horizontal Navigation Tabs on Top */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="mb-8 rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm"
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(176px,1fr))] gap-2">
            {displaySections.map((section, index) => (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.22 + index * 0.025 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveSection(section.id);
                  if (step === 2) setStep(1);
                }}
                className={cn(
                  "group flex min-h-[74px] min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-300 cursor-pointer select-none",
                  activeSection === section.id
                    ? "bg-slate-950 text-white border-slate-950 shadow-lg shadow-slate-300/40"
                    : "bg-slate-50/70 text-slate-500 border-transparent hover:border-guava-orange/30 hover:bg-white hover:text-slate-950",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                    activeSection === section.id
                      ? "bg-guava-orange text-white"
                      : "bg-white text-slate-400 group-hover:text-guava-orange",
                  )}
                >
                  <section.icon className="w-4 h-4" />
                </div>
                <span className="min-w-0 flex-1 overflow-hidden">
                  <span className="block whitespace-normal text-xs font-black uppercase tracking-tight leading-tight">
                    {section.label}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block whitespace-normal text-[9px] font-bold uppercase tracking-wider leading-snug",
                      activeSection === section.id
                        ? "text-white/45"
                        : "text-slate-400",
                    )}
                >
                  {section.eyebrow}
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Content Area */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[28px] p-6 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/50"
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

                      <div className="space-y-6 mt-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Headquarters Physical Address
                          </label>
                          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <MapPin className="w-5 h-5 text-gray-300" />
                            <input
                              className="w-full text-lg font-bold outline-none font-sans"
                              value={lenderData.hqAddress}
                              onChange={(e) =>
                                setLenderData({
                                  ...lenderData,
                                  hqAddress: e.target.value,
                                })
                              }
                              placeholder="Full physical headquarters address"
                            />
                          </div>
                        </div>

                        <div>
                          <BusinessLocationMap
                            physicalAddress={lenderData.hqAddress}
                            latitude={lenderData.latitude}
                            longitude={lenderData.longitude}
                            onLocationSelected={(lat, lng) => {
                              setLenderData({
                                ...lenderData,
                                latitude: lat,
                                longitude: lng,
                              });
                            }}
                            primaryColor="#f97316"
                          />
                        </div>
                      </div>
                      <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-gray-400 font-medium">
                          All identity fields are secure and preserved on your local node database.
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
                          {user.organizationDetails?.taxId ? "Update Business Profile" : "Create Business Profile"}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeSection === "liquidity" && (
                    <div className="space-y-10">
                      <SectionHeader
                        title="Capital Allocation & Yield"
                        subtitle="Define your liquidity deployment limits and performance targets."
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Allocated Portal Liquidity (USD)
                          </label>
                          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Wallet className="w-5 h-5 text-gray-300" />
                            <input
                              type="number"
                              className="w-full text-3xl font-black font-mono outline-none text-guava-dark"
                              value={lenderData.liquidityCapacity}
                              onChange={(e) =>
                                setLenderData({
                                  ...lenderData,
                                  liquidityCapacity: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Target Minimum Yield (Net APR %)
                          </label>
                          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Percent className="w-5 h-5 text-gray-300" />
                            <input
                              type="number"
                              step="0.1"
                              className="w-full text-3xl font-black font-mono outline-none text-guava-orange"
                              value={lenderData.minYieldTarget}
                              onChange={(e) =>
                                setLenderData({
                                  ...lenderData,
                                  minYieldTarget: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Risk Threshold Capacity
                          </label>
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            {["LOW", "MEDIUM", "HIGH"].map((risk) => (
                              <button
                                key={risk}
                                onClick={() =>
                                  setLenderData({
                                    ...lenderData,
                                    maxRiskExposure: risk,
                                  })
                                }
                                className={cn(
                                  "py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all border-2",
                                  lenderData.maxRiskExposure === risk
                                    ? "bg-guava-dark text-white border-guava-dark"
                                    : "bg-white text-gray-300 border-gray-100 hover:border-gray-200",
                                )}
                              >
                                {risk === "LOW"
                                  ? "CONSERVATIVE (A+)"
                                  : risk === "MEDIUM"
                                    ? "BALANCED (B-A+)"
                                    : "AGGRESSIVE (C-B)"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-gray-400 font-medium">
                          All credit parameters and investment margins are updated in real-time.
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
                    </div>
                  )}

                  {activeSection === "income" && (
                    <div className="space-y-10">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <SectionHeader
                          title="Profit & Loss Intelligence"
                          subtitle="Deep-dive exploration of yield performance, revenue vectors, and institutional net income."
                        />

                        {/* Dynamic Filters Bar */}
                        <div className="flex flex-wrap items-center gap-3 bg-gray-50 border border-gray-100 p-2 rounded-[28px] mb-8">
                          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <Calendar className="w-3.5 h-3.5 text-guava-orange" />
                            <select
                              value={timeRange}
                              onChange={(e) =>
                                setTimeRange(e.target.value as TimeRange)
                              }
                              className="text-[10px] font-black uppercase tracking-widest outline-none bg-transparent cursor-pointer"
                            >
                              <option value="30D">Last 30 Days</option>
                              <option value="6M">Last 6 Months</option>
                              <option value="1Y">Last Year</option>
                              <option value="ALL">All Time</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <Package className="w-3.5 h-3.5 text-guava-orange" />
                            <select
                              value={assetClass}
                              onChange={(e) =>
                                setAssetClass(e.target.value as AssetClass)
                              }
                              className="text-[10px] font-black uppercase tracking-widest outline-none bg-transparent cursor-pointer"
                            >
                              <option value="ALL">All Asset Classes</option>
                              <option value="Energy">Energy</option>
                              <option value="Agriculture">Agriculture</option>
                              <option value="Retailer">Retailer</option>
                              <option value="Retail">Retail</option>
                              <option value="Consumer">Consumer</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <MapPin className="w-3.5 h-3.5 text-guava-orange" />
                            <select
                              value={regionFilter}
                              onChange={(e) =>
                                setRegionFilter(e.target.value as Region)
                              }
                              className="text-[10px] font-black uppercase tracking-widest outline-none bg-transparent cursor-pointer"
                            >
                              <option value="ALL">All Regions</option>
                              <option value="East Africa">East Africa</option>
                              <option value="Central Europe">
                                Central Europe
                              </option>
                              <option value="Southeast Asia">
                                Southeast Asia
                              </option>
                              <option value="Southern Africa">
                                Southern Africa
                              </option>
                            </select>
                          </div>

                          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <SlidersHorizontal className="w-3.5 h-3.5 text-guava-orange" />
                              <span className="text-[10px] font-black uppercase tracking-widest min-w-[100px]">
                                Min ACX: {minCreditScore}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="300"
                              max="900"
                              step="10"
                              value={minCreditScore}
                              onChange={(e) =>
                                setMinCreditScore(parseInt(e.target.value))
                              }
                              className="w-20 accent-guava-orange h-1 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 col-span-2">
                          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            Net Institutional Profit ({timeRange})
                          </p>
                          <div className="flex items-end gap-3">
                            <p className="text-4xl font-black text-guava-dark tracking-tighter">
                              ${filteredIntelligence.profit}K
                            </p>
                            <div className="flex items-center gap-1 text-guava-green text-[10px] font-black mb-1 bg-guava-green/10 px-2 py-0.5 rounded-full">
                              <TrendingUp className="w-3 h-3" />
                              {filteredIntelligence.trend}
                            </div>
                          </div>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            Portfolio Yield
                          </p>
                          <p className="text-2xl font-black text-guava-orange">
                            {filteredIntelligence.yield}%
                          </p>
                          <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">
                            Target: 8.5%
                          </p>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-2">
                            Total Revenue
                          </p>
                          <p className="text-2xl font-black text-guava-dark tracking-tighter">
                            ${filteredIntelligence.revenue}K
                          </p>
                          <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">
                            {timeRange === "30D" ? "Monthly" : "Period"} Orbit
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                              <Activity className="w-3 h-3 text-guava-orange" />
                              Revenue vs Expenses (USD) - {assetClass} /{" "}
                              {regionFilter}
                            </h4>
                          </div>
                          <div className="h-[300px] w-full border border-gray-100 rounded-[32px] p-4 bg-white">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={filteredIntelligence.chartData}>
                                <defs>
                                  <linearGradient
                                    id="colorRevenue"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor="#f36d38"
                                      stopOpacity={0.1}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor="#f36d38"
                                      stopOpacity={0}
                                    />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  vertical={false}
                                  stroke="#f1f5f9"
                                />
                                <XAxis dataKey="month" hide />
                                <YAxis hide />
                                <RechartsTooltip
                                  contentStyle={{
                                    borderRadius: "24px",
                                    border: "none",
                                    boxShadow:
                                      "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                    fontStyle: "italic",
                                    fontWeight: "bold",
                                  }}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="revenue"
                                  stroke="#f36d38"
                                  strokeWidth={4}
                                  fillOpacity={1}
                                  fill="url(#colorRevenue)"
                                />
                                <Area
                                  type="monotone"
                                  dataKey="expenses"
                                  stroke="#1e293b"
                                  strokeWidth={2}
                                  fill="transparent"
                                  strokeDasharray="5 5"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <PieChartIcon className="w-3 h-3 text-guava-orange" />
                            Income Distribution
                          </h4>
                          <div className="h-[300px] w-full border border-gray-100 rounded-[32px] p-4 bg-white flex items-center">
                            <div className="flex-1 h-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={REVENUE_STREAMS}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {REVENUE_STREAMS.map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                      />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-3 pr-4">
                              {REVENUE_STREAMS.map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                      {item.name}
                                    </span>
                                  </div>
                                  <span className="text-xs font-black text-guava-dark">
                                    {item.value}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-8 bg-guava-orange rounded-[40px] text-white">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-guava-orange">
                            <DollarSign className="w-6 h-6" />
                          </div>
                          <div>
                            <h5 className="text-xl font-black tracking-tight">
                              Institutional Net Analysis
                            </h5>
                            <p className="text-[10px] opacity-60 font-black uppercase tracking-widest">
                              Portal performance forecast for next 90 days
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {[
                            {
                              label: "Forecast Profit",
                              val: "$92.4K",
                              change: "+12%",
                              color: "text-guava-green",
                            },
                            {
                              label: "Unrealized Earnings",
                              val: "$14.2K",
                              change: "Stable",
                              color: "text-blue-400",
                            },
                            {
                              label: "Recovery Rate",
                              val: "99.2%",
                              change: "+0.1%",
                              color: "text-guava-green",
                            },
                            {
                              label: "Yield Variance",
                              val: "-0.3%",
                              change: "Minor",
                              color: "text-guava-orange",
                            },
                          ].map((stat, i) => (
                            <div key={i}>
                              <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">
                                {stat.label}
                              </p>
                              <p className="text-2xl font-black">
                                {stat.val}
                              </p>
                              <p
                                className={cn(
                                  "text-[9px] font-black uppercase mt-1",
                                  stat.color,
                                )}
                              >
                                {stat.change}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "inventory" && (
                    <div className="space-y-10">
                      <div className="flex items-center justify-between">
                        <SectionHeader
                          title="Stock & Inventory"
                          subtitle="Manage high-yield assets available for borrower procurement via credit."
                        />
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            id="bulk-upload"
                            className="hidden"
                            accept=".csv"
                            onChange={handleBulkUpload}
                          />
                          <label
                            htmlFor="bulk-upload"
                            className="px-6 py-3 bg-white border border-gray-100 text-guava-dark rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                          >
                            <UploadCloud className="w-4 h-4 text-guava-orange" />
                            {isUploading ? "Processing..." : "Bulk CSV Upload"}
                          </label>
                          <AnimatePresence>
                            {selectedItemIds.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex items-center gap-4 bg-guava-dark p-2 pl-6 rounded-2xl"
                              >
                                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">
                                  {selectedItemIds.length} Assets Selected
                                </span>
                                <button
                                  onClick={handleBulkPrint}
                                  className="px-6 py-2 bg-guava-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Print selected Labels
                                </button>
                                <button
                                  onClick={() => setSelectedItemIds([])}
                                  className="pr-4 text-[9px] font-bold text-white/40 hover:text-white transition-all uppercase"
                                >
                                  Cancel
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button
                            onClick={() => setIsScannerOpen(true)}
                            className="px-6 py-3 bg-white border border-gray-100 text-guava-dark rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                          >
                            <Scan className="w-4 h-4 text-guava-orange" />
                            Hardware Scan
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(null);
                              setNewItem({
                                name: "",
                                category: "General",
                                price: 0,
                                currency: "USD",
                                description: "",
                                stockQuantity: 0,
                                lowStockThreshold: 5,
                              });
                              setIsModalOpen(true);
                            }}
                            className="px-6 py-3 bg-guava-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-guava-orange/20"
                          >
                            <Plus className="w-4 h-4" />
                            Onboard Asset
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-8 rounded-[40px] border border-gray-100 mb-10">
                        <div className="flex flex-col justify-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                            Total Estimated Inventory Value
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-guava-dark tracking-tighter">
                              ${inventoryStats.totalValue.toLocaleString()}
                            </span>
                            <span className="text-sm font-bold text-gray-400">
                              USD
                            </span>
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                            <div className="px-2 py-0.5 bg-guava-green/10 text-guava-green text-[10px] font-black rounded-full uppercase">
                              Liquid Assets
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {inventory.length} Active SKUs
                            </span>
                          </div>
                        </div>
                        <div className="h-[120px] w-full bg-white rounded-3xl border border-gray-100 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                              Category Distribution
                            </span>
                            <BarChartIcon className="w-3 h-3 text-guava-orange" />
                          </div>
                          <ResponsiveContainer width="100%" height="80%">
                            <BarChart data={inventoryStats.distributionData}>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                              />
                              <XAxis dataKey="name" hide />
                              <YAxis hide />
                              <RechartsTooltip
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "none",
                                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                }}
                                cursor={{ fill: "transparent" }}
                              />
                              <Bar
                                dataKey="count"
                                fill="#f36d38"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="relative mb-8">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                          <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Filter inventory by product name or category..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border border-gray-100 rounded-[32px] py-6 pl-14 pr-8 text-sm font-bold text-guava-dark focus:ring-2 focus:ring-guava-orange/20 focus:border-guava-orange transition-all shadow-sm placeholder:text-gray-300"
                        />
                        {searchQuery && (
                          <div className="absolute inset-y-0 right-6 flex items-center">
                            <button
                              onClick={() => setSearchQuery("")}
                              className="p-2 hover:bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-guava-dark transition-all"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInventory.length > 0 ? (
                          filteredInventory.map((item) => {
                            const isLowStock =
                              item.stockQuantity < item.lowStockThreshold;
                            const isSelected = selectedItemIds.includes(
                              item.id,
                            );
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  "bg-white border rounded-[40px] overflow-hidden group hover:shadow-xl transition-all p-2 relative",
                                  isLowStock
                                    ? "border-yellow-400 bg-yellow-50/10"
                                    : "border-gray-100",
                                  isSelected
                                    ? "ring-2 ring-guava-orange border-guava-orange"
                                    : "",
                                )}
                              >
                                {/* Selection Overlay */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItemSelection(item.id);
                                  }}
                                  className={cn(
                                    "absolute top-6 left-6 z-20 w-8 h-8 rounded-xl flex items-center justify-center transition-all border-2",
                                    isSelected
                                      ? "bg-guava-orange border-guava-orange text-white"
                                      : "bg-white/80 backdrop-blur border-white/50 text-transparent hover:border-guava-orange",
                                  )}
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>

                                <div className="relative h-48 bg-gray-50 rounded-[32px] overflow-hidden">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                                      <ImageIcon className="w-12 h-12 mb-2" />
                                      <p className="text-[10px] font-black uppercase">
                                        No Preview Data
                                      </p>
                                    </div>
                                  )}
                                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-xl text-[10px] font-black text-guava-dark">
                                    {item.category}
                                  </div>
                                  {isLowStock && (
                                    <div className="absolute bottom-4 left-4 right-4 p-3 bg-yellow-400 text-guava-dark rounded-2xl flex items-center gap-2 shadow-lg animate-pulse">
                                      <AlertTriangle className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-tighter">
                                        Low Stock Warning
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="p-6 space-y-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h6 className="text-lg font-black text-guava-dark leading-tight">
                                        {item.name}
                                      </h6>
                                      <p className="text-[10px] font-black text-guava-orange uppercase tracking-widest mt-1">
                                        {item.price} {item.currency}{" "}
                                        <span className="text-gray-300 mx-1">
                                          |
                                        </span>{" "}
                                        {item.stockQuantity} Units
                                      </p>
                                      {isLowStock && (
                                        <p className="text-[9px] font-bold text-yellow-600 uppercase mt-1">
                                          Threshold: {item.lowStockThreshold}{" "}
                                          units
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => setQrItem(item)}
                                        className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-guava-dark transition-all"
                                        title="Generate Asset QR"
                                      >
                                        <QrCode className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleEditItem(item)}
                                        className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-guava-dark transition-all"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteItem(item.id)
                                        }
                                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                    {item.description}
                                  </p>
                                  <div className="pt-2 flex items-center justify-between border-t border-gray-50 mt-4">
                                    <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase">
                                      <Activity className="w-3 h-3" />
                                      Market Trend: Stable
                                    </div>
                                    <div
                                      className={cn(
                                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                                        isLowStock
                                          ? "bg-yellow-400/20 text-yellow-600"
                                          : "bg-guava-green/10 text-guava-green",
                                      )}
                                    >
                                      {isLowStock
                                        ? "Reorder Urgent"
                                        : "In Stock"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-full py-20 bg-gray-50/50 rounded-[48px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 mb-4 shadow-sm">
                              <Search className="w-8 h-8 opacity-20" />
                            </div>
                            <h5 className="text-xl font-black text-gray-400">
                              No matching assets found
                            </h5>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 max-w-xs px-4">
                              We couldn't find any items matching "{searchQuery}
                              " in your current inventory. Try a different
                              search term.
                            </p>
                            <button
                              onClick={() => setSearchQuery("")}
                              className="mt-6 px-6 py-3 bg-white border border-gray-200 text-guava-dark rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                            >
                              Reset Filter
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="p-10 bg-gray-50 rounded-[48px] border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-guava-orange shadow-inner">
                          <Plus className="w-10 h-10 opaicty-20" />
                        </div>
                        <div className="text-center md:text-left flex-1">
                          <h5 className="text-2xl font-black text-guava-dark">
                            Expand your Catalog
                          </h5>
                          <p className="text-[11px] text-gray-400 font-medium mt-2 max-w-md">
                            Connect with manufacturers directly to list their
                            products on the ACX Portal. Automate
                            credit-for-product fulfillment with zero collateral
                            requirements for high-scoring borrowers.
                          </p>
                        </div>
                        <button className="px-8 py-5 bg-guava-orange text-white rounded-[24px] text-xs font-black uppercase tracking-widest transition-all">
                          Registry Sync
                        </button>
                      </div>
                    </div>
                  )}

                  {activeSection === "delinquency" && (
                    <div className="space-y-10">
                      <SectionHeader
                        title="Delinquency & Default Management"
                        subtitle="Systematized oversight of overdue positions, warning escalation, and blacklisting portal."
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          {
                            label: "Portfolio at Risk (PAR 30)",
                            val: "12.4%",
                            status: "Warning",
                            color: "text-guava-orange",
                          },
                          {
                            label: "Active Defaults",
                            val: "3 Cases",
                            status: "Critical",
                            color: "text-red-500",
                          },
                          {
                            label: "Recovery Rate (YTD)",
                            val: "94.2%",
                            status: "Target: 98%",
                            color: "text-guava-green",
                          },
                        ].map((stat, i) => (
                          <div
                            key={i}
                            className="p-8 bg-white border border-gray-100 rounded-[40px] shadow-sm"
                          >
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                              {stat.label}
                            </p>
                            <p
                              className={cn(
                                "text-3xl font-black",
                                stat.color,
                              )}
                            >
                              {stat.val}
                            </p>
                            <p className="text-[9px] font-black uppercase mt-1 opacity-40">
                              {stat.status}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="bg-white border border-gray-100 rounded-[48px] overflow-hidden shadow-xl shadow-gray-200/20">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-guava-dark flex items-center gap-2">
                            <Activity className="w-4 h-4 text-guava-orange" />
                            Active Delinquency Queue
                          </h4>
                          <div className="flex gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-gray-200 text-[10px] font-bold text-gray-400">
                              <div className="w-2 h-2 bg-guava-orange rounded-full" />
                              Stage 1: Reminder
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-gray-200 text-[10px] font-bold text-gray-400">
                              <div className="w-2 h-2 bg-guava-orange rounded-full animate-pulse" />
                              Stage 2: Written
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-gray-200 text-[10px] font-bold text-gray-400">
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                              Stage 3: Final
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-gray-50">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                  Borrower Entity
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                  Exposure
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                  Overdue
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                  Current Status
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                  Portal Action
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {delinquentLoans.map((loan) => (
                                <tr
                                  key={loan.id}
                                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-all group"
                                >
                                  <td className="px-8 py-8">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-guava-orange text-white rounded-xl flex items-center justify-center font-black italic">
                                        {loan.borrower[0]}
                                      </div>
                                      <div>
                                        <p className="text-sm font-black text-guava-dark">
                                          {loan.borrower}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">
                                          ACX Score: {loan.creditScore}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-8">
                                    <p className="text-lg font-black text-guava-dark tracking-tighter">
                                      ${loan.amount.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] font-black text-guava-orange uppercase">
                                      Active Position
                                    </p>
                                  </td>
                                  <td className="px-8 py-8">
                                    <p className="text-lg font-black text-red-500 tracking-tighter">
                                      {loan.overdueDays} Days
                                    </p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">
                                      Sync Latency
                                    </p>
                                  </td>
                                  <td className="px-8 py-8">
                                    <div
                                      className={cn(
                                        "inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                        loan.stage === "INITIAL"
                                          ? "bg-orange-50 text-guava-orange border border-orange-100"
                                          : loan.stage === "WRITTEN"
                                            ? "bg-orange-100 text-guava-dark border border-orange-200"
                                            : "bg-red-500 text-white shadow-lg shadow-red-500/20",
                                      )}
                                    >
                                      {loan.stage === "INITIAL" && (
                                        <Bell className="w-3 h-3" />
                                      )}
                                      {loan.stage === "WRITTEN" && (
                                        <Mail className="w-3 h-3" />
                                      )}
                                      {loan.stage === "FINAL" && (
                                        <Activity className="w-3 h-3" />
                                      )}
                                      {loan.stage === "BLACKLISTED" && (
                                        <UserX className="w-3 h-3" />
                                      )}
                                      {loan.stage === "INITIAL"
                                        ? "Initial Warning"
                                        : loan.stage === "WRITTEN"
                                          ? "Formal Written"
                                          : loan.stage === "FINAL"
                                            ? "Final Demand"
                                            : "Blacklisted"}
                                    </div>
                                  </td>
                                  <td className="px-8 py-8">
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                      {loan.stage === "INITIAL" && (
                                        <button
                                          onClick={() =>
                                            setDelinquentLoans((prev) =>
                                              prev.map((l) =>
                                                l.id === loan.id
                                                  ? { ...l, stage: "WRITTEN" }
                                                  : l,
                                              ),
                                            )
                                          }
                                          className="p-3 bg-guava-orange text-white rounded-xl transition-all flex items-center gap-2 text-[8px] font-black uppercase tracking-widest"
                                        >
                                          <Gavel className="w-3 h-3" />
                                          Escalate to Written
                                        </button>
                                      )}
                                      {loan.stage === "WRITTEN" && (
                                        <button
                                          onClick={() =>
                                            setDelinquentLoans((prev) =>
                                              prev.map((l) =>
                                                l.id === loan.id
                                                  ? { ...l, stage: "FINAL" }
                                                  : l,
                                              ),
                                            )
                                          }
                                          className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all flex items-center gap-2 text-[8px] font-black uppercase tracking-widest shadow-lg shadow-red-500/10"
                                        >
                                          <AlertTriangle className="w-3 h-3" />
                                          Final Demand Notice
                                        </button>
                                      )}
                                      {(loan.stage === "FINAL" ||
                                        loan.stage === "BLACKLISTED") && (
                                        <button
                                          onClick={() =>
                                            setDelinquentLoans((prev) =>
                                              prev.map((l) =>
                                                l.id === loan.id
                                                  ? {
                                                      ...l,
                                                      stage: "BLACKLISTED",
                                                    }
                                                  : l,
                                              ),
                                            )
                                          }
                                          className="p-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2 text-[8px] font-black uppercase tracking-widest shadow-xl"
                                        >
                                          <UserX className="w-3 h-3 text-red-500" />
                                          Blacklist Permanent
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="p-10 bg-guava-orange rounded-[48px] text-white overflow-hidden relative">
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                          <div>
                            <h5 className="text-3xl font-black tracking-tighter mb-4">
                              Portal Default Protection
                            </h5>
                            <p className="text-xs opacity-60 font-medium leading-relaxed max-w-md">
                              The ACX liquidity layer automatically
                              de-privileges borrowers based on repayment
                              latency. Blacklisting triggers a cross-lender
                              warning visible to all institutional nodes in the
                              Southeast & East African regions.
                            </p>
                            <div className="flex gap-4 mt-8">
                              <button className="px-6 py-3 bg-white text-guava-orange rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-guava-dark hover:text-white transition-all">
                                <Download className="w-4 h-4" />
                                Export Delinquency Log
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                              <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">
                                Time to Recovery
                              </p>
                              <p className="text-xl font-black">
                                14.2 Days
                              </p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                              <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">
                                Auto-Legal File
                              </p>
                              <p className="text-xl font-black">
                                Active
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}

                  {activeSection === "mandate" && (
                    <div className="space-y-10">
                      <SectionHeader
                        title="Investment Mandate"
                        subtitle="Filter opportunities by geography, industry, and asset type."
                      />
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Geographic Preferences
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "East Africa",
                              "West Africa",
                              "Northern Africa",
                              "Southern Africa",
                              "Central Africa",
                            ].map((reg) => (
                              <button
                                key={reg}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-[10px] font-bold border transition-all",
                                  lenderData.regions.includes(reg)
                                    ? "bg-guava-orange/10 text-guava-orange border-guava-orange"
                                    : "bg-gray-50 text-gray-400 border-transparent",
                                )}
                              >
                                {reg}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Sector Specialization
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "Logistics",
                              "Agriculture",
                              "Retailer",
                              "SME Finance",
                              "Renewable Energy",
                              "Consumer Goods",
                            ].map((sec) => (
                              <button
                                key={sec}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-[10px] font-bold border transition-all",
                                  lenderData.sectors.includes(sec)
                                    ? "bg-guava-green/10 text-guava-green border-guava-green"
                                    : "bg-gray-50 text-gray-400 border-transparent",
                                )}
                              >
                                {sec}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === "compliance" && (
                    <div className="space-y-10">
                      <SectionHeader
                        title="Regulatory Portal"
                        subtitle="Configure automated AML, KYC, and sanctions screening logic."
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                          {
                            label: "Automatic AML Sync",
                            desc: "Real-time laundering detection",
                            icon: Database,
                          },
                          {
                            label: "Sanctions Node Pinging",
                            desc: "Sync with global restricted lists",
                            icon: Fingerprint,
                          },
                          {
                            label: "Zero-Knowledge Proofs",
                            desc: "Verify capacity without disclosing balances",
                            icon: Lock,
                          },
                          {
                            label: "Tax Residency Sync",
                            desc: "Automated withholding logic",
                            icon: Scale,
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="p-6 rounded-[32px] border border-gray-100 flex items-start gap-4 hover:shadow-md transition-all group"
                          >
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-guava-dark group-hover:text-white transition-all">
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-tight text-guava-dark">
                                {item.label}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1 font-medium italic">
                                {item.desc}
                              </p>
                            </div>
                            <div className="ml-auto">
                              <div className="w-4 h-4 bg-guava-green rounded-full shadow-[0_0_8px_var(--color-guava-green)]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === "documents" && (
                    <div className="space-y-10">
                      <SectionHeader
                        title="KYB Document Evidence"
                        subtitle="Immutable evidence for portal authentication."
                      />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <UploadCard
                          id="governance"
                          label="Articles of Incorporation"
                          active={uploads.governance}
                          state={uploadProgress.governance}
                          onFileChosen={(file) => handleFileChosen("governance", file)}
                        />
                        <UploadCard
                          id="proofOfFunds"
                          label="Verification of Funds"
                          active={uploads.proofOfFunds}
                          state={uploadProgress.proofOfFunds}
                          onFileChosen={(file) => handleFileChosen("proofOfFunds", file)}
                        />
                        <UploadCard
                          id="operatingLicense"
                          label="Regulatory License"
                          active={uploads.operatingLicense}
                          state={uploadProgress.operatingLicense}
                          onFileChosen={(file) => handleFileChosen("operatingLicense", file)}
                        />
                        <UploadCard
                          id="complianceAudit"
                          label="External Audit Report"
                          active={uploads.complianceAudit}
                          state={uploadProgress.complianceAudit}
                          onFileChosen={(file) => handleFileChosen("complianceAudit", file)}
                        />
                        <UploadCard
                          id="taxResidency"
                          label="Tax Residency Certificate"
                          active={uploads.taxResidency}
                          state={uploadProgress.taxResidency}
                          onFileChosen={(file) => handleFileChosen("taxResidency", file)}
                        />
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
                  <div className="bg-white border border-slate-200 rounded-[28px] p-8 md:p-12 shadow-2xl shadow-slate-200/60 relative overflow-hidden text-center md:text-left">
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

                      <div className="space-y-4">
                        {[
                          {
                            label: "Institutional KYC",
                            val: "Level 4 (Full Audit)",
                          },
                          { label: "Node Credential", val: "ECDSA SHA-256" },
                          {
                            label: "Relay Status",
                            val: "High Availability Active",
                          },
                        ].map((stat, i) => (
                          <div
                            key={i}
                            className="p-6 bg-gray-50 rounded-3xl border border-gray-100"
                          >
                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">
                              {stat.label}
                            </p>
                            <p className="text-sm font-bold text-guava-dark italic">
                              {stat.val}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-guava-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
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
            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.28 }}
              whileHover={{ y: -3 }}
              className="p-6 bg-white border border-slate-200 rounded-[24px] relative overflow-hidden group shadow-sm sticky top-6"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Profile Readiness
                  </span>
                  <span className="text-sm font-black text-slate-950">
                    {completeness}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completeness}%` }}
                    className="h-full bg-gradient-to-r from-guava-orange to-guava-green"
                  />
                </div>
                <div className="space-y-3 mb-6">
                  {[
                    {
                      label: "Risk Appetite",
                      value: lenderData.maxRiskExposure,
                    },
                    {
                      label: "Currency",
                      value: lenderData.reportingCurrency,
                    },
                    {
                      label: "Active SKUs",
                      value: inventory.length.toString(),
                    },
                  ].map((item) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.34 }}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {item.label}
                      </span>
                      <span className="text-xs font-black text-slate-950">
                        {item.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <button
                  disabled={isVerifying || !isUploadComplete}
                  onClick={handleVerify}
                  className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 flex items-center justify-center gap-2 cursor-pointer border-none hover:bg-guava-orange"
                >
                  {isVerifying ? "Verifying..." : "Authenticate KYB"}
                  {isVerifying && <RefreshCw className="w-4 h-4 animate-spin" />}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
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
    <div className="mb-8 border-b border-slate-100 pb-6">
      <div className="inline-flex items-center gap-2 rounded-full bg-guava-orange/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-guava-orange mb-4">
        <Activity className="w-3.5 h-3.5" />
        ACX Control Surface
      </div>
      <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="text-sm font-semibold text-slate-500 mt-2 max-w-2xl">
        {subtitle}
      </p>
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
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-bold text-slate-950 outline-none transition-colors focus:border-guava-orange focus:bg-white"
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
        "relative p-6 rounded-[24px] border transition-all flex flex-col items-center justify-center gap-4 text-center h-52 overflow-hidden",
        isDragOver ? "border-guava-orange bg-guava-orange/5 scale-[1.02]" : "",
        state.status === 'approved' || active
          ? "bg-emerald-50/60 border-emerald-500/30 text-emerald-950"
          : state.status === 'uploading' || state.status === 'analyzing'
          ? "bg-slate-50 border-slate-300"
          : "bg-slate-50 border-dashed border-slate-200 text-slate-400 hover:border-guava-orange/40 hover:bg-white"
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
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
            <UploadCloud className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-slate-800">{label}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Drag, drop, or click to upload</p>
          </div>
        </div>
      )}

      {(state.status === 'uploading' || state.status === 'analyzing') && (
        <div className="flex flex-col items-center gap-3 w-full px-4 relative z-20 pointer-events-none">
          <div className="w-12 h-12 rounded-full border-2 border-guava-orange border-t-transparent animate-spin flex items-center justify-center" />
          <div className="space-y-1 w-full">
            <p className="text-xs font-black uppercase text-guava-dark">
              {state.status === 'uploading' ? `Uploading (${state.progress}%)` : 'System Pre-Approving...'}
            </p>
            <p className="text-[10px] font-bold text-gray-400 truncate max-w-full">
              {state.fileName || 'analyzing_payload.pdf'}
            </p>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-guava-orange transition-all duration-150" 
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {(state.status === 'approved' || active) && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-3 relative z-20 pointer-events-none"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-800">{label}</p>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-[8px] font-black uppercase tracking-widest text-emerald-700 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              Approved by ACX
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
