import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState, useMemo, useRef, useEffect } from 'react';
import { UserProfile, UserRole, AuditEventType, CreditScoreResult, BorrowerProfileData, VerificationResult } from '../types';
import { BusinessLocationMap } from '../components/BusinessLocationMap';
import { calculateCreditScore } from '../lib/gemini';
import { auditService } from '../lib/audit';
import { useFirebase } from '../components/FirebaseProvider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  User as UserIcon, 
  MapPin, 
  Briefcase, 
  Zap, 
  ShieldCheck, 
  TrendingUp,
  CheckCircle2,
  Wallet,
  Activity,
  UserCheck,
  Smartphone,
  Navigation,
  FileSignature,
  Download,
  QrCode,
  ChevronRight,
  ShieldAlert,
  Fingerprint,
  Share2,
  Globe,
  Clock,
  AlertCircle,
  Lock,
  Radar as RadarIcon,
  Camera,
  X,
  Save,
  Loader2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Webcam from 'react-webcam';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TriangleAlert,
  Skull,
  Gavel,
  Bell,
  Mail
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BorrowerProfileProps {
  user: UserProfile;
}

type ProfileSection = 'identity' | 'employment' | 'financials' | 'credit' | 'alternative' | 'business' | 'documents' | 'preferences';

function CreditGauge({ score }: { score: number }) {
  const data = [
    { value: score - 300 },
    { value: 900 - score }
  ];
  
  const COLORS = ['#f36d38', '#1e293b10'];

  return (
    <div className="relative w-full h-[300px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="80%"
            startAngle={180}
            endAngle={0}
            innerRadius={80}
            outerRadius={120}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Node Resonance</p>
        <span className="text-6xl font-bold text-slate-900 dark:text-white tracking-tight">{score}</span>
      </div>
    </div>
  );
}

const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon', 'Central African Republic',
  'Chad', 'Comoros', 'Democratic Republic of the Congo', 'Republic of the Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea',
  'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya',
  'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique',
  'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia',
  'South Africa', 'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
].sort();

export default function BorrowerProfile({ user }: BorrowerProfileProps) {
  const { updateProfile } = useFirebase();
  const [activeSection, setActiveSection] = useState<ProfileSection>('identity');
  const [step, setStep] = useState(1);
  const [isScoring, setIsScoring] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const isInitialized = useRef(false);

  // Custom modals/alerts state to bypass blocked native window.confirm/alert in sandboxed iframe
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState<string | null>(null);

  const defaultProfile = useMemo(() => ({
    // 1. Identity
    firstName: user.displayName.split(' ')[0] || '',
    lastName: user.displayName.split(' ')[1] || '',
    dob: '',
    gender: 'Other',
    idNumber: '',
    taxNumber: '',
    nationality: user.country || '',
    maritalStatus: 'Single',
    address: '',
    gpsData: '',
    phone: '',
    email: user.email,
    
    // 2. Employment
    employer: '',
    industry: '',
    employmentStatus: 'Permanent',
    jobTitle: '',
    yearsEmployed: 0,
    payrollNumber: '',
    grossSalary: 0,
    netSalary: 0,
    incomeFrequency: 'Monthly',
    
    // 3. Financials
    mortgageRent: 0,
    monthlyExpenses: 0,
    debtRatio: 0,
    savingsBehavior: 'Establishing',
    insuranceCoverage: '',
    
    // 4. Alternative
    mobileMoneyUsage: 'Low',
    utilityPaymentHistory: 'None',
    eCommerceActivity: '',
    deviceConsistency: '',
    
    // 5. Business (SME)
    isSME: false,
    businessName: '',
    businessReg: '',
    businessTurnover: 0,
    
    // 6. Preferences
    desiredAmount: 0,
    preferredTenure: 1,
    loanPurpose: '',
  }), [user.displayName]);

  // Core Profile State
  const [profile, setProfile] = useState<BorrowerProfileData>(() => {
    if (user.borrowerDetails?.profile) {
      return { ...defaultProfile, ...user.borrowerDetails.profile };
    }
    return defaultProfile;
  });

  const [uploads, setUploads] = useState<Record<string, boolean>>(() => {
    return user.borrowerDetails?.uploads || {
      nationalId: false,
      passport: false,
      utilityBill: false,
      payslip: false,
      bankStatement: false,
      selfie: false
    };
  });

  const [scoreResult, setScoreResult] = useState<CreditScoreResult | null>(user.borrowerDetails?.scoreResult || null);
  const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>(() => {
    return user.borrowerDetails?.verificationResults || {
      nationalId: { status: 'NONE' },
      passport: { status: 'NONE' },
      utilityBill: { status: 'NONE' },
      payslip: { status: 'NONE' },
      bankStatement: { status: 'NONE' },
      selfie: { status: 'NONE' }
    };
  });

  const isMounted = useRef(true);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Abort all pending OCR requests on unmount
      for (const controller of abortControllers.current.values()) {
        controller.abort();
      }
      abortControllers.current.clear();
    };
  }, []);

  // Keep state in sync with user prop updates
  useEffect(() => {
    if (user.borrowerDetails && !isInitialized.current) {
      setProfile({ ...defaultProfile, ...user.borrowerDetails.profile });
      setUploads(user.borrowerDetails.uploads);
      setScoreResult(user.borrowerDetails.scoreResult);
      
      if (user.borrowerDetails.verificationResults) {
        // Clean up stale PENDING states from Firestore
        const cleaned = { ...user.borrowerDetails.verificationResults };
        Object.keys(cleaned).forEach(key => {
          if (cleaned[key].status === 'PENDING') {
            cleaned[key] = { status: 'NONE' };
          }
        });
        setVerificationResults(cleaned);
      }
      isInitialized.current = true;
    } else if (!isInitialized.current) {
      isInitialized.current = true;
    }
  }, [user.borrowerDetails, defaultProfile]);

  const clearNodeCache = async () => {
    try {
      setIsSaving(true);
      // Clear local storage keys starting with acx_
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("acx_")) {
          localStorage.removeItem(key);
        }
      });
      
      // Reset local react state to defaults
      setProfile(defaultProfile);
      setUploads({
        nationalId: false,
        passport: false,
        utilityBill: false,
        payslip: false,
        bankStatement: false,
        selfie: false
      });
      setScoreResult(null);
      setVerificationResults({
        nationalId: { status: 'NONE' },
        passport: { status: 'NONE' },
        utilityBill: { status: 'NONE' },
        payslip: { status: 'NONE' },
        bankStatement: { status: 'NONE' },
        selfie: { status: 'NONE' }
      });
      setStep(1);

      // Update profile in Firestore database
      const emptyProfile: Partial<UserProfile> = {
        borrowerDetails: {
          profile: defaultProfile,
          uploads: {
            nationalId: false,
            passport: false,
            utilityBill: false,
            payslip: false,
            bankStatement: false,
            selfie: false
          },
          scoreResult: null,
          verificationResults: {
            nationalId: { status: 'NONE' },
            passport: { status: 'NONE' },
            utilityBill: { status: 'NONE' },
            payslip: { status: 'NONE' },
            bankStatement: { status: 'NONE' },
            selfie: { status: 'NONE' }
          },
          lastUpdated: new Date().toISOString()
        }
      };
      await updateProfile(emptyProfile);
      setShowConfirmReset(false);
      setShowResetSuccess(true);
    } catch (error) {
      console.error("Error resetting profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveProfileData = async () => {
    setIsSaving(true);
    try {
      const isInstitutional = [UserRole.LENDER, UserRole.BANK, UserRole.INVESTOR, UserRole.RETAILER].includes(user.role);
      const updates: Partial<UserProfile> = {
        borrowerDetails: {
          profile,
          uploads,
          scoreResult,
          verificationResults,
          lastUpdated: new Date().toISOString()
        }
      };

      if ((isInstitutional || profile.isSME) && profile.businessName) {
        updates.displayName = profile.businessName;
      }

      await updateProfile(updates);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const sections: ProfileSection[] = ['identity', 'employment', 'financials', 'credit', 'alternative', 'business', 'documents', 'preferences'];
  
  const handleNextSection = () => {
    const currentIndex = sections.indexOf(activeSection);
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const SaveProgressButton = () => {
    const currentIndex = sections.indexOf(activeSection);
    const isLastSection = currentIndex === sections.length - 1;

    return (
      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-slate-50 dark:border-slate-800 mt-10">
        <button 
          onClick={saveProfileData}
          disabled={isSaving}
          className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {isSaving ? 'Syncing...' : 'Save Draft'}
        </button>

        {!isLastSection && (
          <button 
            onClick={handleNextSection}
            className="w-full sm:w-auto px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 dark:shadow-white/5"
          >
            Continue to Next Section
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  // Auto-save to Firestore (debounced)
  useEffect(() => {
    if (!isInitialized.current) return;
    
    const timeoutId = setTimeout(() => {
      saveProfileData();
    }, 5000); // 5s debounce for auto-save to reduce writes

    return () => clearTimeout(timeoutId);
  }, [profile, uploads, scoreResult, verificationResults]);

  const sectionConfig = [
    { id: 'identity', label: 'Identity', icon: UserIcon },
    { id: 'employment', label: 'Professional', icon: Briefcase },
    { id: 'financials', label: 'Financials', icon: Wallet },
    { id: 'credit', label: 'Credit History', icon: Activity },
    { id: 'alternative', label: 'Alt Data', icon: Smartphone },
    { id: 'business', label: 'SME / Business', icon: Building2 },
    { id: 'documents', label: 'Documents', icon: FileSignature },
    { id: 'preferences', label: 'Loan Intent', icon: Zap },
  ];

  const docInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadKey, setActiveUploadKey] = useState<keyof typeof uploads | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const triggerDocUpload = (key: keyof typeof uploads) => {
    if (key === 'selfie') {
      setIsCameraOpen(true);
      return;
    }
    setActiveUploadKey(key);
    docInputRef.current?.click();
  };

  const captureSelfie = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setUploads(prev => ({ ...prev, selfie: true }));
      await auditService.log(
        user,
        AuditEventType.KYC_UPDATED,
        `Document uploaded: identity selfie (captured via camera)`,
        'INFO',
        { documentType: 'selfie' }
      );
      setIsCameraOpen(false);
    }
  };

  const processOCR = async (file: File, docType: string) => {
    if (!isMounted.current) return;

    // Cancel existing request for same docType if any
    if (abortControllers.current.has(docType)) {
      abortControllers.current.get(docType)?.abort();
    }

    const controller = new AbortController();
    abortControllers.current.set(docType, controller);

    setVerificationResults(prev => ({ 
      ...prev, 
      [docType]: { status: 'PENDING' } 
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      console.log(`[OCR] Response status for ${docType}: ${response.status} ${response.statusText}`);

      if (!isMounted.current) return;

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error(`[OCR] Unexpected response for ${docType}:`, text.substring(0, 500));
        throw new Error(text.length > 50 ? `Server returned HTML error page (Status: ${response.status})` : text);
      }

      if (!isMounted.current) return;

      if (response.ok) {
        if (data.success) {
          const extractedValue = data.extractedValue;
          let isMatch = false;

          if (docType === 'nationalId' || docType === 'passport') {
            const cleanExtracted = (extractedValue || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanProfileId = (profile.idNumber || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
            
            isMatch = cleanExtracted.length > 3 && (cleanExtracted.includes(cleanProfileId) || cleanProfileId.includes(cleanExtracted));
          } else if (docType === 'payslip') {
            const netFromDoc = parseFloat(extractedValue.toString().replace(/[^0-9.]/g, ''));
            // Increased tolerance slightly and handled case where netSalary might be 0
            isMatch = !isNaN(netFromDoc) && (profile.netSalary === 0 || Math.abs(netFromDoc - profile.netSalary) < 150); 
          }

          setVerificationResults(prev => ({
            ...prev,
            [docType]: { 
              status: isMatch ? 'MATCH' : 'MISMATCH',
              value: extractedValue
            }
          }));
          
          await auditService.log(
            user,
            AuditEventType.KYC_UPDATED,
            `OCR Verification for ${docType}: ${isMatch ? 'MATCH' : 'MISMATCH'} (Found: ${extractedValue})`,
            isMatch ? 'INFO' : 'WARNING',
            { docType, extractedValue, matches: isMatch }
          );
        } else {
          setVerificationResults(prev => ({ 
            ...prev, 
            [docType]: { status: 'ERROR', value: data.errorMessage || 'AI could not read document' } 
          }));
        }
      } else {
        setVerificationResults(prev => ({ 
          ...prev, 
          [docType]: { status: 'ERROR', value: data.error || data.message || `Server Error (${response.status})` } 
        }));
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`OCR processing for ${docType} was aborted.`);
        return;
      }
      if (!isMounted.current) return;
      console.error("OCR Background Error:", error);
      const err = error as Error;
      setVerificationResults(prev => ({ 
        ...prev, 
        [docType]: { status: 'ERROR', value: err.message || 'Connection failed' } 
      }));
    } finally {
      if (abortControllers.current.get(docType) === controller) {
        abortControllers.current.delete(docType);
      }
    }
  };

  const onDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadKey) {
      const docType = activeUploadKey;
      
      // Update UI state immediately
      setUploads(prev => ({ ...prev, [docType]: true }));
      setActiveUploadKey(null);
      if (docInputRef.current) docInputRef.current.value = '';

      // Start OCR in background (non-blocking)
      if (['nationalId', 'passport', 'payslip'].includes(docType)) {
        console.log(`[DEBUG] Starting OCR for ${docType}`);
        processOCR(file, docType);
      }

      await auditService.log(
        user,
        AuditEventType.KYC_UPDATED,
        `Document uploaded: ${docType}`,
        'INFO',
        { documentType: docType }
      );
    }
  };

  const completeness = useMemo(() => {
    const fields = Object.values(profile).filter(v => v !== '' && v !== 0).length;
    const files = Object.values(uploads).filter(Boolean).length;
    const matches = Object.values(verificationResults).filter(v => v.status === 'MATCH').length;
    return Math.min(100, Math.round(((fields + files + matches * 2) / (Object.keys(profile).length + Object.keys(uploads).length + 6)) * 100));
  }, [profile, uploads, verificationResults]);

  const handleCalculateScore = async () => {
    if (completeness < 40) {
      setCustomAlertMessage("Please complete more of your profile (at least 40%) to generate a high-trust rating.");
      return;
    }
    setIsScoring(true);
    const metadata = {
      ...profile,
      repaymentWeight: 0.35,
      incomeStabilityWeight: 0.20,
      alternativeDataWeight: 0.10,
      completenessScore: completeness,
      isVerified: Object.values(uploads).every(v => v)
    };

    const result = await calculateCreditScore(user, metadata);
    setScoreResult(result);
    setIsScoring(false);
    setStep(2);

    await auditService.log(
      user,
      AuditEventType.CREDIT_SCORED,
      `AI Credit Score calculated: ${result.score}`,
      'INFO',
      { score: result.score, rating: result.ratingCategory }
    );
  };

  const handleDownloadIdentity = async () => {
    setIsDownloading(true);

    await auditService.log(
      user,
      AuditEventType.SYSTEM_CONFIG_CHANGED,
      `Financial Passport downloaded`,
      'WARNING'
    );

    // Auto-notification to email
    try {
      await fetch('/api/notify/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'Financial Identity Passport', 
          email: user.email, 
          userName: user.displayName 
        })
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    // Identify the principal name
    const principalName = (user.role === UserRole.RETAILER || user.role === UserRole.LENDER || user.role === UserRole.BANK || user.role === UserRole.INVESTOR) && user.borrowerDetails?.profile?.businessName
      ? user.borrowerDetails.profile.businessName
      : `${profile.firstName} ${profile.lastName}` || user.displayName;

    // Simulate generation and download
    setTimeout(() => {
      setIsDownloading(false);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = new jsPDF() as any;
        const timestamp = new Date().toLocaleString();
        const assetId = `ACX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Color Palette
        const colors = {
          dark: [30, 41, 59] as [number, number, number], // guava-dark
          orange: [243, 109, 56] as [number, number, number], // guava-orange
          green: [34, 197, 94] as [number, number, number] // guava-green
        };

        // Header Background
        doc.setFillColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        doc.rect(0, 0, 210, 45, 'F');

        // Logo/Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ACX PORTABLE FINANCIAL IDENTITY', 20, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('AFRICA CREDIT EXCHANGE | PAN-AFRICAN DIGITAL REPUTATION NODE', 20, 33);
        doc.text(`CERTIFICATE ID: ${assetId} | TIMESTAMP: ${timestamp}`, 20, 38);

        // Watermark/Glow effect simulation
        doc.setDrawColor(colors.orange[0], colors.orange[1], colors.orange[2]);
        doc.setLineWidth(2);
        doc.line(0, 45, 210, 45);

        // User Summary Section
        doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Identity Authentication Specifications', 20, 60);

        autoTable(doc, {
          startY: 65,
          head: [['Authentication Node', 'Verified Protocol Detail']],
          body: [
            ['Principal Entity/Holder', principalName],
            ['Reference Logic', `${profile.idNumber || 'VERIFIED'} / ${profile.taxNumber || 'SECURE'}`],
            ['Registered Jurisdiction', profile.nationality || user.country || 'Global'],
            ['Credit Resonance (ACX)', `${scoreResult?.score || 'SCORING_PENDING'}`],
            ['Reputation Category', scoreResult?.ratingCategory || 'B_PRIME'],
          ],
          margin: { top: 65 },
          theme: 'striped',
          headStyles: { fillColor: colors.dark, fontStyle: 'bold' },
          bodyStyles: { fontSize: 10 }
        });

        // Scoring Breakdown
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let currentY = (doc as any).lastAutoTable.finalY + 15;
        
        // Check for page overflow
        if (currentY > 220) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Reputation Resonance Factor Analysis', 20, currentY);

        const factorData = (scoreResult?.factors || []).map(f => [
          f.factor,
          `${f.score}/100`,
          f.score >= 80 ? 'Exceptional' : f.score >= 60 ? 'Optimal' : f.score >= 40 ? 'Satisfactory' : 'Establishing'
        ]);

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Factor Node', 'Resonance Strength', 'Stability Classification']],
          body: factorData.length > 0 ? factorData : [['General Trust', 'N/A', 'Pending Data Integration']],
          theme: 'grid',
          headStyles: { fillColor: colors.orange, fontStyle: 'bold' },
          bodyStyles: { fontSize: 9 }
        });

        // Certificate Footer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let certY = (doc as any).lastAutoTable.finalY + 20;

        // Check for page overflow
        if (certY > 230) {
          doc.addPage();
          certY = 20;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('Legal Disclaimer & Portal Validity', 20, certY);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const concludingText = [
          "This certificate confirms that the bearer's financial identity and liquidity reputation have been",
          "vetted by the Africa Credit Exchange (ACX) Portal using decentralized reputation scoring algorithms.",
          "The data provided is a zero-knowledge representation of creditworthiness and is interoperable",
          "across all participating regional liquidity nodes and institutional bank partners."
        ];
        
        concludingText.forEach((line, i) => {
          doc.text(line, 20, certY + 8 + (i * 4));
        });

        // Verification Footer (Static positioning at bottom of current page)
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 270, 210, 27, 'F');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Digital Fingerprint: ${Math.random().toString(36).substr(2, 16).toUpperCase()}`, 20, 278);
        doc.text(`Portal Version: ACX-v2.1.4-ReputationMaster`, 20, 283);
        doc.text('Confidential Document - Shared under ACX Data Privacy Protocol v4.0', 20, 288);
        doc.text(`Generated: ${timestamp}`, 20, 284);
        doc.text('Africa Credit Exchange High-Trust Network | End-to-End Encrypted', 190, 284, { align: 'right' });

        doc.save(`ACX_Financial_Pass_${profile.lastName}.pdf`);
        setCustomAlertMessage(`Financial Passport downloaded as PDF. A notification has been sent to ${user.email}`);
      } catch (err) {
        console.error('PDF generation failed:', err);
        setCustomAlertMessage('Could not generate PDF. Please try again.');
      }
    }, 2000);
  };

  const getRatingLabel = (score: number) => {
    if (score >= 800) return { label: 'AAA', color: 'text-guava-green', desc: 'Prime Individual' };
    if (score >= 700) return { label: 'AA', color: 'text-guava-green', desc: 'Very Low Risk' };
    if (score >= 600) return { label: 'A', color: 'text-guava-green', desc: 'Strong Reliability' };
    if (score >= 500) return { label: 'BBB', color: 'text-guava-orange', desc: 'Satisfactory' };
    if (score >= 400) return { label: 'BB', color: 'text-guava-orange', desc: 'Sub-Prime' };
    return { label: 'C', color: 'text-red-500', desc: 'High Risk' };
  };

  return (
    <div className="w-full animate-in fade-in duration-1000">
      {/* Delinquency Warning Banner */}
      {user.delinquencyStage && user.delinquencyStage !== 'NONE' && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className={cn(
            "mb-8 p-6 rounded-[32px] border-l-8 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden",
            user.delinquencyStage === 'INITIAL' ? "bg-orange-50 border-orange-400 text-orange-900" :
            user.delinquencyStage === 'WRITTEN' ? "bg-orange-100 border-orange-600 text-orange-950" :
            user.delinquencyStage === 'FINAL' ? "bg-red-500 border-red-800 text-white" :
            "bg-black border-red-600 text-white"
          )}
        >
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
            user.delinquencyStage === 'INITIAL' ? "bg-orange-400 text-white" :
            user.delinquencyStage === 'WRITTEN' ? "bg-orange-600 text-white" :
            user.delinquencyStage === 'FINAL' ? "bg-white text-red-600" :
            "bg-red-600 text-white"
          )}>
            {user.delinquencyStage === 'INITIAL' && <Bell className="w-8 h-8" />}
            {user.delinquencyStage === 'WRITTEN' && <Mail className="w-8 h-8" />}
            {user.delinquencyStage === 'FINAL' && <TriangleAlert className="w-8 h-8" />}
            {user.delinquencyStage === 'BLACKLISTED' && <Skull className="w-8 h-8" />}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold tracking-tight mb-1 flex items-center gap-2">
              {user.delinquencyStage === 'INITIAL' && "Portal Payment Reminder"}
              {user.delinquencyStage === 'WRITTEN' && "Official Written Warning"}
              {user.delinquencyStage === 'FINAL' && "Final Demand Notice: Immediate Action Required"}
              {user.delinquencyStage === 'BLACKLISTED' && "Portal Blacklist: Access Revoked"}
            </h3>
            <p className="text-sm font-medium opacity-80 leading-relaxed max-w-2xl">
              {user.delinquencyStage === 'INITIAL' && "Our records show an upcoming or slightly overdue repayment. Please clear this to maintain your ACX resonance score."}
              {user.delinquencyStage === 'WRITTEN' && "This is a formal written warning regarding your overdue repayment. Continuous delay will result in credit score annihilation."}
              {user.delinquencyStage === 'FINAL' && "This is your final notice. Failure to settle your outstanding debt within 24 hours will result in permanent blacklisting and legal referral."}
              {user.delinquencyStage === 'BLACKLISTED' && "Your ACX node has been permanently blacklisted due to serial default. Your global financial identity is now flagged across all institutional pools."}
            </p>
          </div>
          {user.delinquencyStage !== 'BLACKLISTED' && (
            <button className={cn(
              "px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95",
              user.delinquencyStage === 'FINAL' ? "bg-white text-red-600 hover:bg-slate-100" : "bg-slate-900 text-white hover:bg-slate-800"
            )}>
              Settle Now
            </button>
          )}
          {user.delinquencyStage === 'BLACKLISTED' && (
             <div className="flex items-center gap-2 px-4 py-2 bg-red-600/20 rounded-xl text-[10px] font-bold uppercase tracking-widest">
               <Gavel className="w-4 h-4" />
               Legal Hold Active
             </div>
          )}
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-2 py-1 bg-guava-orange/10 text-guava-orange text-[8px] font-bold uppercase tracking-[0.2em] rounded border border-guava-orange/20">
              Portal v2.4
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <ShieldCheck className="w-3 h-3 text-guava-green" />
              End-to-End Encrypted
            </div>
          </div>
          <div className="flex items-center gap-4 mb-1">
            <div className="relative">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-2xl object-cover border-2 border-guava-orange/20" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white font-bold text-xl">
                  {user.displayName.charAt(0)}
                </div>
              )}
              {user.is2FAEnabled && (
                <div className="absolute -top-2 -right-2 p-1 bg-blue-500 text-white rounded-full border-2 border-white">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              )}
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">{user.displayName}</h2>
            {user.is2FAEnabled && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20">
                <Lock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">2FA Active</span>
              </div>
            )}
            {user.kycStatus === 'VERIFIED' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-guava-green/10 text-guava-green rounded-full border border-guava-green/20">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
              </div>
            )}
            {user.kycStatus === 'PENDING' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full border border-amber-500/20">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">KYC Pending</span>
              </div>
            )}
            {user.kycStatus === 'REJECTED' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-600 rounded-full border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Action Required</span>
              </div>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Building your portable global credit reputation.</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowConfirmReset(true)}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-guava-orange hover:border-guava-orange transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3 h-3" />
              Clear passport fields & cache
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 pr-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
           <div className="relative">
             <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-slate-700 flex items-center justify-center text-white font-bold">
               {completeness}%
             </div>
             <svg className="absolute inset-0 w-full h-full -rotate-90">
               <circle 
                 cx="24" cy="24" r="22" 
                 fill="none" 
                 stroke="currentColor" 
                 className="text-slate-100 dark:text-slate-800"
                 strokeWidth="3" 
               />
               <circle 
                 cx="24" cy="24" r="22" 
                 fill="none" 
                 stroke="var(--color-guava-green)" 
                 strokeWidth="3" 
                 strokeDasharray="138"
                 strokeDashoffset={138 - (138 * completeness) / 100}
                 className="transition-all duration-1000"
               />
             </svg>
           </div>
           <div>
              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Profile Resonance</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {completeness === 100 ? 'Fully Calibrated' : 'Establishing Trust...'}
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-3 space-y-3">
           {sectionConfig.map((section) => (
             <button
               key={section.id}
               onClick={() => {
                 setActiveSection(section.id as ProfileSection);
                 if (step === 2) setStep(1);
               }}
               className={cn(
                 "w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-semibold transition-all duration-200",
                 activeSection === section.id 
                   ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" 
                   : "bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white"
               )}
             >
               <section.icon className={cn("w-5 h-5", activeSection === section.id ? "text-guava-orange" : "text-slate-300")} />
               <span>{section.label}</span>
               {activeSection === section.id && <motion.div layoutId="nav-glow" className="ml-auto w-1.5 h-1.5 bg-guava-green rounded-full" />}
             </button>
           ))}

           <div className="mt-12 p-8 bg-slate-900 rounded-3xl text-white overflow-hidden relative group">
              <div className="relative z-10">
                 <h4 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Fingerprint className="w-4 h-4 text-guava-orange" />
                   Portal Safety
                 </h4>
                 <p className="text-[10px] text-white/50 leading-relaxed mb-6 font-medium">
                   ACX Reputation Scores are non-custodial and portable across nodes.
                 </p>
                 <button 
                   onClick={handleCalculateScore}
                   disabled={isScoring || completeness < 40}
                   className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-20"
                 >
                   {isScoring ? 'Analyzing Profile...' : 'Calculate Credit Score'}
                 </button>
              </div>
           </div>
        </div>

        <div className="lg:col-span-9">
           <AnimatePresence mode="wait">
             {step === 1 ? (
               <motion.div
                 key={activeSection}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-sm"
               >
                 {activeSection === 'identity' && (
                   <div className="space-y-10">
                   <div className="flex items-center justify-between">
                    <SectionTitle title="Foundation & Identity" subtitle="Base-layer verification details for standard KYC compatibility." />
                    <button 
                      onClick={saveProfileData}
                      disabled={isSaving}
                      className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      {isSaving ? 'Syncing...' : 'Save Progress'}
                    </button>
                  </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <InputField label="First Name" value={profile.firstName} onChange={v => setProfile({...profile, firstName: v})} />
                         <InputField label="Last Name" value={profile.lastName} onChange={v => setProfile({...profile, lastName: v})} />
                       </div>
                       <InputField label="National ID / Passport" value={profile.idNumber} onChange={v => setProfile({...profile, idNumber: v})} placeholder="e.g. C-18293746" />
                       <InputField label="Tax Identification No." value={profile.taxNumber} onChange={v => setProfile({...profile, taxNumber: v})} placeholder="TIN / VAT" />
                       <InputField label="Email Address" value={profile.email} onChange={v => setProfile({...profile, email: v})} placeholder="yourname@example.com" />
                       <InputField label="Phone Number" value={profile.phone} onChange={v => setProfile({...profile, phone: v})} placeholder="e.g. +27 12 345 6789" />
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date of Birth</label>
                          <input type="date" className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" value={profile.dob} onChange={e => setProfile({...profile, dob: e.target.value})} />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gender</label>
                          <select className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})}>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Non-binary</option>
                            <option>Prefer not to say</option>
                          </select>
                       </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Citizenship</label>
                           <select 
                             className="w-full text-lg font-bold border-b border-gray-100 dark:border-slate-800 focus:border-guava-orange outline-none pb-2 bg-transparent text-slate-900 dark:text-white" 
                             value={profile.nationality} 
                             onChange={e => setProfile({...profile, nationality: e.target.value})}
                           >
                             <option value="" disabled>Select Country</option>
                             {AFRICAN_COUNTRIES.map(country => (
                               <option key={country} value={country} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{country}</option>
                             ))}
                           </select>
                        </div>
                       <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Residential Address</label>
                          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                             <MapPin className="w-4 h-4 text-gray-300" />
                             <input className="w-full text-lg font-bold outline-none" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} placeholder="Full physical address" />
                           </div>
                        </div>

                        {/* Interactive Business Location Map pinning */}
                        <div className="md:col-span-2">
                           <BusinessLocationMap
                              physicalAddress={profile.address}
                              latitude={(() => {
                                 const parts = (profile.gpsData || '').split(',');
                                 if (parts.length === 2) {
                                    const lat = parseFloat(parts[0].trim());
                                    return isNaN(lat) ? undefined : lat;
                                 }
                                 return undefined;
                              })()}
                              longitude={(() => {
                                 const parts = (profile.gpsData || '').split(',');
                                 if (parts.length === 2) {
                                    const lng = parseFloat(parts[1].trim());
                                    return isNaN(lng) ? undefined : lng;
                                 }
                                 return undefined;
                              })()}
                              onLocationSelected={(lat, lng) => {
                                 setProfile({
                                    ...profile,
                                    gpsData: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                                 });
                              }}
                              primaryColor="#22c55e"
                           />
                        </div>
                        <div className="hidden"><div>
                          </div>
                       </div>
                       <Field label="Portal Geolocation (GPS)" value={profile.gpsData} className="text-guava-green" />
                     </div>
                     <SaveProgressButton />
                   </div>
                 )}

                 {activeSection === 'employment' && (
                   <div className="space-y-10">
                     <SectionTitle title="Employment & Affordability" subtitle="Verification of income patterns to determine repayment velocity." />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InputField label="Employer Name" value={profile.employer} onChange={v => setProfile({...profile, employer: v})} placeholder="Current Organization" />
                        <InputField label="Job Title" value={profile.jobTitle} onChange={v => setProfile({...profile, jobTitle: v})} placeholder="e.g. Senior Analyst" />
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Employment Status</label>
                          <select className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" value={profile.employmentStatus} onChange={e => setProfile({...profile, employmentStatus: e.target.value})}>
                            <option>Permanent</option>
                            <option>Contract</option>
                            <option>Self-Employed</option>
                            <option>Informal</option>
                          </select>
                        </div>
                        <InputField label="Payroll / Employee No." value={profile.payrollNumber} onChange={v => setProfile({...profile, payrollNumber: v})} />
                        <CurrencyInput label="Gross Annual Salary (USD)" value={profile.grossSalary} onChange={v => setProfile({...profile, grossSalary: v})} />
                        <CurrencyInput label="Net Monthly Take-home (USD)" value={profile.netSalary} onChange={v => setProfile({...profile, netSalary: v})} />
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payment Frequency</label>
                          <select className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" value={profile.incomeFrequency} onChange={e => setProfile({...profile, incomeFrequency: e.target.value})}>
                            <option>Weekly</option>
                            <option>Bi-Weekly</option>
                            <option>Monthly</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Years in Current Role</label>
                          <input type="number" className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" value={profile.yearsEmployed} onChange={e => setProfile({...profile, yearsEmployed: Number(e.target.value)})} />
                        </div>
                     </div>
                     <SaveProgressButton />
                   </div>
                 )}

                 {activeSection === 'financials' && (
                   <div className="space-y-10">
                     <SectionTitle title="Financial Health" subtitle="Evaluation of current obligations, debt loads, and savings discipline." />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CurrencyInput label="Monthly Housing (Rent/Mortgage)" value={profile.mortgageRent} onChange={v => setProfile({...profile, mortgageRent: v})} />
                        <CurrencyInput label="Avg. Monthly Lifestyle Expenses" value={profile.monthlyExpenses} onChange={v => setProfile({...profile, monthlyExpenses: v})} />
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Self-Reported Debt Ratio (%)</label>
                          <input type="range" min="0" max="100" step="1" className="w-full accent-guava-dark" value={profile.debtRatio * 100} onChange={e => setProfile({...profile, debtRatio: Number(e.target.value) / 100})} />
                          <div className="flex justify-between text-[8px] font-black uppercase text-gray-400">
                             <span>Minimal (0%)</span>
                             <span className="text-guava-orange">{Math.round(profile.debtRatio * 100)}%</span>
                             <span>Over-extended (100%)</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Savings Behavior</label>
                          <select className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" value={profile.savingsBehavior} onChange={e => setProfile({...profile, savingsBehavior: e.target.value})}>
                            <option>Consistent Monthly</option>
                            <option>Occasional</option>
                            <option>Lifestyle Neutral</option>
                            <option>Burn Scenario</option>
                          </select>
                        </div>
                        <InputField label="Insurance Coverage" value={profile.insuranceCoverage} onChange={v => setProfile({...profile, insuranceCoverage: v})} placeholder="Life, Health, Asset" />
                     </div>
                     <SaveProgressButton />
                   </div>
                 )}

                 {activeSection === 'alternative' && (
                   <div className="space-y-10">
                     <SectionTitle title="Reputation & Alt Data" subtitle="Scoring based on mobile usage, digital utility, and behavioral patterns." />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mobile Money Velocity</label>
                          <select className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" value={profile.mobileMoneyUsage} onChange={e => setProfile({...profile, mobileMoneyUsage: e.target.value})}>
                            <option>High / Institutional</option>
                            <option>Moderate</option>
                            <option>Low / Casual</option>
                            <option>None</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Utility Bill Reliability</label>
                          <select className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" value={profile.utilityPaymentHistory} onChange={e => setProfile({...profile, utilityPaymentHistory: e.target.value})}>
                            <option>Always On-Time</option>
                            <option>Generally On-Time</option>
                            <option>Frequent Delays</option>
                          </select>
                        </div>
                        <InputField label="Digital Social Graph" value="Connected (LinkedIn/Professional)" readOnly />
                        <InputField label="Device Consistency Index" value="98.2% (Static HWID)" readOnly />
                     </div>
                     <SaveProgressButton />
                   </div>
                 )}

                 {activeSection === 'business' && (
                   <div className="space-y-10">
                     <div className="flex justify-between items-center">
                        <SectionTitle title="SME / Business Profile" subtitle="Switch on for entrepreneur and small business credit facilities." />
                        <button 
                          onClick={() => setProfile({...profile, isSME: !profile.isSME})}
                          className={cn(
                            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            profile.isSME ? "bg-guava-green text-white" : "bg-gray-100 text-gray-400"
                          )}
                        >
                          {profile.isSME ? 'Business Mode ON' : 'Turn On SME Mode'}
                        </button>
                     </div>
                     {profile.isSME ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
                          <InputField label="Registered Business Name" value={profile.businessName} onChange={v => setProfile({...profile, businessName: v})} />
                          <InputField label="Registration Number" value={profile.businessReg} onChange={v => setProfile({...profile, businessReg: v})} />
                          <CurrencyInput label="Annual Business Turnover" value={profile.businessTurnover} onChange={v => setProfile({...profile, businessTurnover: v})} />
                          <InputField label="Primary Industry" value="Logistics" readOnly />
                       </div>
                     ) : (
                       <div className="p-12 border-2 border-dashed border-gray-100 rounded-[32px] text-center">
                          <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                          <p className="text-xs font-bold text-gray-400">Currently profiling as an individual. <br/> Enable SME mode to access business liquidity.</p>
                           <button
                             id="create-business-profile-btn"
                             onClick={() => setProfile({...profile, isSME: true})}
                             className="px-6 py-3 bg-guava-orange hover:bg-guava-orange/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg active:scale-95 inline-flex items-center gap-2 mt-4"
                           >
                             Create Business Profile
                           </button>
                       </div>
                     )}
                     <SaveProgressButton />
                   </div>
                 )}

                 {activeSection === 'documents' && (
                   <div className="space-y-10">
                     <SectionTitle title="Verification Vault" subtitle="Upload primary evidence for KYC, income, and residence." />
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                 <UploadCard 
                           label="National ID" 
                           active={uploads.nationalId} 
                           verification={verificationResults.nationalId}
                           onClick={() => triggerDocUpload('nationalId')} 
                         />
                                                 <UploadCard 
                           label="Passport" 
                           active={uploads.passport} 
                           verification={verificationResults.passport}
                           onClick={() => triggerDocUpload('passport')} 
                         />
                        <UploadCard label="Utility Bill" active={uploads.utilityBill} onClick={() => triggerDocUpload('utilityBill')} />
                                                 <UploadCard 
                           label="Payslip" 
                           active={uploads.payslip} 
                           verification={verificationResults.payslip}
                           onClick={() => triggerDocUpload('payslip')} 
                         />
                        <UploadCard label="Bank Statement" active={uploads.bankStatement} onClick={() => triggerDocUpload('bankStatement')} />
                        <UploadCard label="Identity Selfie" active={uploads.selfie} onClick={() => triggerDocUpload('selfie')} />
                     </div>
                     <input 
                       type="file" 
                       ref={docInputRef} 
                       onChange={onDocFileChange} 
                       className="hidden" 
                       accept=".pdf,.jpg,.png" 
                     />
                     <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                        <ShieldAlert className="w-4 h-4 text-guava-orange shrink-0 mt-0.5" />
                        <p className="text-[10px] text-guava-orange font-medium leading-relaxed">
                          Your documents are zero-knowledge encrypted. Lenders never see the raw images, only a cryptographic proof of verification from the ACX node.
                        </p>
                      </div>

                      <AnimatePresence>
                        {isCameraOpen && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
                              onClick={() => setIsCameraOpen(false)}
                            />
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              className="relative bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800"
                            >
                              <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                  <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Identity Verification</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selfie Biometric Capture</p>
                                  </div>
                                  <button onClick={() => setIsCameraOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                  </button>
                                </div>

                                <div className="aspect-square relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 mb-8">
                                  <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "user" }}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none flex items-center justify-center">
                                    <div className="w-48 h-64 border-2 border-dashed border-white/50 rounded-full" />
                                  </div>
                                </div>

                                <div className="flex gap-4">
                                  <button
                                    onClick={() => setIsCameraOpen(false)}
                                    className="flex-1 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={captureSelfie}
                                    className="flex-1 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                                  >
                                    <Camera className="w-4 h-4" />
                                    Capture & Verify
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>
                      <SaveProgressButton />
                    </div>
                  )}

                 {activeSection === 'preferences' && (
                   <div className="space-y-10">
                     <SectionTitle title="Loan Intent" subtitle="Set your liquidity requirements to match with suitable lenders." />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CurrencyInput label="Desired Loan Amount (USD)" value={profile.desiredAmount} onChange={v => setProfile({...profile, desiredAmount: v})} />
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preferred Tenure (Months)</label>
                          <select className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2 bg-transparent" value={profile.preferredTenure} onChange={e => setProfile({...profile, preferredTenure: Number(e.target.value)})}>
                            <option value="6">6 Months</option>
                            <option value="12">12 Months</option>
                            <option value="24">24 Months</option>
                            <option value="36">36 Months</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Purpose of Funding</label>
                          <input className="w-full text-lg font-bold border-b border-gray-100 focus:border-guava-orange outline-none pb-2" value={profile.loanPurpose} onChange={e => setProfile({...profile, loanPurpose: e.target.value})} placeholder="e.g. Inventory Financing, Personal Education" />
                        </div>
                     </div>
                     <SaveProgressButton />
                   </div>
                 )}

                 {activeSection === 'credit' && (
                   <div className="space-y-10">
                      <SectionTitle title="Historical Reputation" subtitle="Synced data from traditional credit bureaus and global payroll systems." />
                      <div className="space-y-6">
                         {[
                           { label: "African Credit Bureau (TransUnion)", status: "Synced", val: "Excellent" },
                           { label: "Payroll Stability Sync", status: "Active", val: "Consistent" },
                           { label: "Historical Default Check", status: "Clear", val: "0 Incidents" }
                         ].map((sync, i) => (
                           <div key={i} className="p-6 bg-gray-50 rounded-[28px] border border-gray-100 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-gray-300" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-black uppercase tracking-tight text-guava-dark">{sync.label}</p>
                                    <p className="text-[8px] font-bold text-guava-green uppercase">{sync.status}</p>
                                 </div>
                              </div>
                              <p className="text-sm font-bold text-guava-dark">{sync.val}</p>
                           </div>
                         ))}
                      </div>
                      <SaveProgressButton />
                   </div>
                 )}
               </motion.div>
             ) : (
               <motion.div
                 key="scoring-result"
                 initial={{ opacity: 0, y: 40 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-8"
               >
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 shadow-sm relative overflow-hidden">
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                       <div className="text-center">
                          <CreditGauge score={scoreResult?.score || 550} />
                          
                          <div className="flex flex-col items-center mt-4">
                             <div className={cn("text-5xl font-black mb-2", getRatingLabel(scoreResult?.score || 0).color)}>
                               {getRatingLabel(scoreResult?.score || 0).label}
                             </div>
                             <div className="inline-flex items-center gap-2 px-4 py-2 bg-guava-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest mb-6">
                                <ShieldCheck className="w-3 h-3 text-guava-green" />
                                {getRatingLabel(scoreResult?.score || 0).desc}
                             </div>
                             <p className="text-sm text-gray-400 leading-relaxed italic max-w-sm">
                                "{scoreResult?.reasoning}"
                             </p>
                          </div>
                       </div>

                       <div className="space-y-8">
                          <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex flex-col items-center">
                             <h5 className="w-full text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-200 pb-4 mb-4 flex items-center justify-between">
                                AI Factor Breakdown
                                <RadarIcon className="w-3 h-3 text-guava-orange" />
                             </h5>
                             
                             <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scoreResult?.factors}>
                                      <PolarGrid stroke="#e2e8f0" />
                                      <PolarAngleAxis dataKey="factor" tick={{ fontSize: 8, fontWeight: 900, fill: '#64748b' }} />
                                      <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                                      <Radar
                                         name="Score"
                                         dataKey="score"
                                         stroke="#f36d38"
                                         fill="#f36d38"
                                         fillOpacity={0.6}
                                      />
                                   </RadarChart>
                                </ResponsiveContainer>
                             </div>

                             <div className="w-full grid grid-cols-2 gap-4 mt-4">
                                {(scoreResult?.factors || []).map((f, i) => (
                                   <div key={i} className="flex flex-col">
                                      <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">{f.factor}</span>
                                      <div className="flex items-center gap-2">
                                         <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-guava-dark" style={{ width: `${f.score}%` }} />
                                         </div>
                                         <span className="text-[10px] font-black text-guava-dark">{f.score}</span>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4">
                             <button 
                               onClick={handleDownloadIdentity}
                               disabled={isDownloading}
                               className="flex-1 py-5 bg-guava-dark text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-guava-orange/20 disabled:opacity-50"
                             >
                                {isDownloading ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Encrypting Passport...
                                  </div>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4 text-guava-orange" />
                                    Download Financial Pass
                                  </>
                                )}
                             </button>
                             <div className="flex gap-4">
                                <button className="w-16 h-16 bg-white border-2 border-gray-100 rounded-3xl flex items-center justify-center hover:border-guava-dark hover:scale-[1.02] transition-all group shadow-sm">
                                   <Share2 className="w-6 h-6 text-gray-400 group-hover:text-guava-dark" />
                                </button>
                                <button className="w-16 h-16 bg-white border-2 border-guava-dark rounded-3xl flex items-center justify-center hover:scale-[1.02] transition-all shadow-sm">
                                   <QrCode className="w-8 h-8 text-guava-dark" />
                                </button>
                             </div>
                          </div>

                          <div className="p-6 bg-guava-orange/5 border border-guava-orange/10 rounded-[32px]">
                             <div className="flex items-start gap-3">
                                <div className="p-2 bg-guava-orange rounded-xl">
                                   <Globe className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                   <p className="text-[10px] font-black uppercase text-guava-dark mb-1">Global Interoperability</p>
                                   <p className="text-[10px] text-gray-500 leading-relaxed">
                                      Your ACX Pass is compatible with decentralized finance (DeFi) portals and traditional bank nodes across 42 jurisdictions.
                                   </p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-8 bg-guava-dark rounded-[40px] text-white">
                       <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Lender Match Confidence</h5>
                       <p className="text-4xl font-black font-mono tracking-tighter">94.8%</p>
                       <p className="text-[10px] font-bold opacity-60 mt-2 italic uppercase">High Yield Potential</p>
                    </div>
                    <div className="md:col-span-2 p-8 bg-gray-100 rounded-[40px] flex items-center gap-8">
                       <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center border-2 border-gray-200">
                          <TrendingUp className="w-10 h-10 text-guava-green" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-guava-dark mb-1 underline decoration-guava-orange underline-offset-4">Identity Resonating Across Africa</p>
                          <p className="text-xs text-gray-500 leading-relaxed max-w-md">Your profile currently meets the liquidity threshold for 14 active pools in Nigeria, Egypt, and Kenya.</p>
                       </div>
                       <div className="ml-auto">
                          <button onClick={() => setStep(1)} className="p-4 bg-white border border-gray-200 rounded-2xl hover:bg-guava-dark hover:text-white transition-all group">
                             <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </button>
                       </div>
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* Custom Confirmation Modals / Dialogs to bypass Iframe-blocked native confirm/alerts */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-2xl relative animate-in scale-in duration-300">
            <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2 font-sans">Reset Financial Passport?</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-sans">
              Are you sure you want to clear your passport data and cached fields? This will reset your progress to a clean slate.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A] dark:text-white border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all cursor-pointer font-sans select-none"
              >
                No, Keep it
              </button>
              <button
                onClick={clearNodeCache}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white rounded-2xl transition-all cursor-pointer shadow-lg shadow-red-500/10 font-sans select-none bg-[#F36D38] hover:bg-[#E25C27]"
              >
                Yes, Clear Slate
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetSuccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-2xl relative text-center animate-in scale-in duration-300">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2 font-sans">Cache Cleared</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-sans">
              Your form and Financial Passport settings have been reset successfully.
            </p>
            <button
               onClick={() => {
                 setShowResetSuccess(false);
                 window.location.reload();
               }}
               className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl transition-all cursor-pointer font-sans select-none"
            >
              OK, Reload Now
            </button>
          </div>
        </div>
      )}

      {customAlertMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] p-8 shadow-2xl relative text-center animate-in scale-in duration-300">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2 font-sans">ACX Security Protocol</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-sans">
              {customAlertMessage}
            </p>
            <button
              onClick={() => setCustomAlertMessage(null)}
              className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 rounded-2xl transition-all cursor-pointer font-sans select-none"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-l-4 border-guava-orange pl-4">
      <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{subtitle}</p>
    </div>
  );
}

function Field({ label, value, readOnly, className }: { label: string; value: string | number; readOnly?: boolean; className?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
      <div className={cn("text-lg font-bold border-b border-slate-50 dark:border-slate-800 pb-2 flex items-center gap-2 text-slate-900 dark:text-white", readOnly && "text-slate-400 opacity-60", className)}>
        {label === 'Full Legal Name' && <UserCheck className="w-4 h-4" />}
        {label === 'Citizenship' && <Navigation className="w-4 h-4" />}
        {value}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, readOnly }: { label: string; value: string; onChange?: (v: string) => void; placeholder?: string; readOnly?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={e => onChange?.(e.target.value)} 
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "w-full text-lg font-bold border-b border-slate-100 dark:border-slate-800 focus:border-guava-orange outline-none pb-2 transition-colors bg-transparent text-slate-900 dark:text-white rounded-none",
          readOnly && "text-slate-400 cursor-not-allowed"
        )}
      />
    </div>
  );
}

function CurrencyInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 focus-within:border-guava-orange transition-colors">
        <span className="text-slate-300 font-bold">$</span>
        <input 
          type="number" 
          value={value} 
          onChange={e => onChange(Number(e.target.value))} 
          className="w-full text-lg font-bold outline-none bg-transparent text-slate-900 dark:text-white"
        />
      </div>
    </div>
  );
}

function UploadCard({ label, active, verification, onClick }: { label: string; active: boolean; verification?: VerificationResult; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-6 rounded-2xl border transition-all flex flex-col items-center justify-center gap-4 text-center group relative overflow-hidden",
        active 
          ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10" 
          : "bg-slate-50 dark:bg-slate-800 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-guava-orange/40 hover:bg-white dark:hover:bg-slate-700"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
        active ? "bg-white/10 text-guava-orange" : "bg-white dark:bg-slate-900 text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
      )}>
        {verification?.status === 'PENDING' ? <Loader2 className="w-6 h-6 animate-spin text-guava-orange" /> : active ? <CheckCircle2 className="w-6 h-6" /> : <Download className="w-6 h-6" />}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">{label}</span>
      
      {active && !verification && <span className="text-[8px] font-bold text-guava-green uppercase mt-1">Proof Encrypted</span>}
      
      {verification && (
        <div className="mt-1">
          {verification.status === 'MATCH' && (
            <div className="flex items-center gap-1 text-[8px] font-bold text-guava-green uppercase">
              <CheckCircle2 className="w-2 h-2" />
              Verified Match
            </div>
          )}
          {verification.status === 'MISMATCH' && (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-[8px] font-bold text-red-400 uppercase">
                <AlertCircle className="w-2 h-2" />
                Mismatch Detected
              </div>
              <span className="text-[7px] text-white/50 lowercase italic">Found: {verification.value}</span>
            </div>
          )}
          {verification.status === 'PENDING' && (
            <span className="text-[8px] font-bold text-guava-orange uppercase animate-pulse">Running AI OCR...</span>
          )}
          {verification.status === 'ERROR' && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-bold text-red-400 uppercase">OCR Failed</span>
              {verification.value && (
                <span className="text-[7px] text-white/50 lowercase italic max-w-[80px] truncate">{verification.value}</span>
              )}
            </div>
          )}
        </div>
      )}
    </button>
  );
}
