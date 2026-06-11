import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState, useEffect } from 'react';
import { useFirebase } from '../components/FirebaseProvider';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Zap,
  Activity,
  Globe,
  ShieldCheck,
  ChevronRight,
  Share2,
  RefreshCw,
  LayoutGrid,
  Map as MapIcon,
  FileDown,
  DollarSign,
  LucideIcon,
  FileText,
  Check,
  Trash2,
  Plus,
  MessageSquare,
  ArrowRight,
  Lock,
  Printer
} from 'lucide-react';
import PrintReportModal from '../components/PrintReportModal';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNotify } from '../lib/NotificationContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATA_RESONANCE = [
  { name: 'JAN', value: 680, target: 650 },
  { name: 'FEB', value: 710, target: 690 },
  { name: 'MAR', value: 695, target: 700 },
  { name: 'APR', value: 740, target: 710 },
  { name: 'MAY', value: 720, target: 730 },
  { name: 'JUN', value: 785, target: 750 },
];

const DATA_LIQUIDITY_FLOW = [
  { name: 'JAN', inflow: 120, outflow: 95, pool: 2400 },
  { name: 'FEB', name2: 'FEB', inflow: 145, outflow: 110, pool: 2435 },
  { name: 'MAR', name2: 'MAR', inflow: 130, outflow: 115, pool: 2450 },
  { name: 'APR', name2: 'APR', inflow: 160, outflow: 125, pool: 2485 },
  { name: 'MAY', name2: 'MAY', inflow: 185, outflow: 140, pool: 2530 },
  { name: 'JUN', name2: 'JUN', inflow: 210, outflow: 155, pool: 2585 },
];

const DATA_RISK_DISTRIBUTION = [
  { range: '400-500', count: 5, color: '#ef4444' },
  { range: '500-600', count: 12, color: '#f59e0b' },
  { range: '600-700', count: 45, color: '#3b82f6' },
  { range: '700-800', count: 78, color: '#22c55e' },
  { range: '800-850', count: 24, color: '#10b981' },
];

const DATA_COUNTRY_SPREAD = [
  { name: 'Nigeria', value: 35, growth: '+12%', resonance: 742 },
  { name: 'Kenya', value: 25, growth: '+8%', resonance: 710 },
  { name: 'South Africa', value: 20, growth: '+15%', resonance: 785 },
  { name: 'Egypt', value: 10, growth: '+5%', resonance: 695 },
  { name: 'Ghana', value: 10, growth: '+22%', resonance: 720 },
];

const DATA_REGION = [
  { name: 'Sub-Saharan Africa', value: 45, color: '#f36d38' },
  { name: 'Southeast Asia', value: 25, color: '#1e293b' },
  { name: 'Latin America', value: 20, color: '#22c55e' },
  { name: 'Eastern Europe', value: 10, color: '#3b82f6' },
];

const DATA_ALLOCATION = [
  { category: 'Micro-retail', amount: 45000, risk: 'Low' },
  { category: 'Agri-tech', amount: 32000, risk: 'Medium' },
  { category: 'Digital Svcs', amount: 58000, risk: 'Low' },
  { category: 'Bridge Equity', amount: 29000, risk: 'High' },
  { category: 'Education', amount: 15000, risk: 'Low' },
];

const SPEC_STEPS = [
  {
    id: 'intake',
    title: 'Stage 01: Borrower Intake & Onboarding',
    icon: LayoutGrid,
    sla: '< 3 seconds',
    owner: 'KYC & API Gateway',
    risk: 'Encrypted TLS parameters & digital sign verification',
    desc: 'The gateway validates borrower authentication credentials, checks system device footprint, and pulls mobile telemetry/transaction histories over securely-hashed pipes.',
    features: [
      'Encrypted Device-Footprint Telemetry Extraction',
      'Instant Digital Identification Cross-Verifications',
      'Dynamic Consent Capture Mechanics'
    ],
    technicalSpec: 'Uses AES-256 GCM envelope encryption on payload level; rates requests utilizing adaptive IP rate-limiting guards.'
  },
  {
    id: 'underwrite',
    title: 'Stage 02: AI Credit Score Underwriting',
    icon: Activity,
    sla: '< 1.2 seconds',
    owner: 'Underwriting ML Engine',
    risk: 'Volatility correlation limits & regional defaults threshold',
    desc: 'Analyzes user aggregate cash flow indicators to compute their microfinance/SME resonance score (400-850 scale) and evaluates repayment bandwidth.',
    features: [
      'Cash Flow Volatility & Drift Analysis Mapping',
      'Real-time Country & Macroeconomic Risk Balancing',
      'Dynamic Personal Credit Resonance Score (400-850)'
    ],
    technicalSpec: 'Runs gradient boosting classifier nodes trained on historical sub-Saharan and Southeast Asian default parameters.'
  },
  {
    id: 'blacklist',
    title: 'Stage 03: Centralized Integrity Registry',
    icon: ShieldCheck,
    sla: '< 500ms',
    owner: 'Escrow Registry DB',
    risk: 'Peer validated credentials & active duplicate checking',
    desc: 'Checks database for any overlapping open loans across external liquidity nodes or active entries in the institutional blacklists to prevent over-leverage.',
    features: [
      'ACX Global Anti-Collusion Sync API',
      'Syndicated Institutional Fraud & High-Risk Register Check',
      'Instant Active-Capacity Threshold Validation'
    ],
    technicalSpec: 'Sub-millisecond query executing against highly-indexed, replicated regional transactional tables.'
  },
  {
    id: 'syndicate',
    title: 'Stage 04: Syndication Board Desk',
    icon: Globe,
    sla: '24-48 hours max',
    owner: 'Liquidity Exchange',
    risk: 'Fractional lender bounds & minimum yield guardrails',
    desc: 'Pools capital for the loan. Single institutional default is cushioned because loans are highly fractionated across multiple independent lenders.',
    features: [
      'Fractional Funding Pool Syndication (Max 40% per Lender)',
      'Real-time Yield Adjustments based on Risk Level',
      'Automated Liquidity Recall on Auction Timeout'
    ],
    technicalSpec: 'Sub-accounting settlement ledger executing distributed locks during loan slice reservation.'
  },
  {
    id: 'disburse',
    title: 'Stage 05: Automated Disbursement Routing',
    icon: Zap,
    sla: '< 15 seconds',
    owner: 'Currency Swap Rails',
    risk: 'Prefunded swap buffers & immediate transaction receipts',
    desc: 'Triggers instant currency swap with low-spread partners and dispatches final funds directly onto the borrower’s mobile wallet or local digital bank route.',
    features: [
      'Multi-currency Native Swap Execution Routing',
      'Integrated Mobile Money Webhook Handlers',
      'Prefunded Escrow Collateral Locking'
    ],
    technicalSpec: 'API interface directly integrated in banking gateways with automatic rollback on network anomalies.'
  },
  {
    id: 'repay',
    title: 'Stage 06: Collections & Automated Reminders',
    icon: DollarSign,
    sla: 'Continuous Sync',
    owner: 'Recoup Ledger System',
    risk: 'Grace schedules, auto-debits & automated reminders',
    desc: 'Manages repayment collection, triggers pre-arrears reminders via email or push notifications, and handles standard or deferred grace schedules.',
    features: [
      'Automated Reminder Service (48h Pre-arrears Email & Push Notifications)',
      'Borrower Repayment History Exports (Custom PDF Generation Engine)',
      'Flexible Collections & Auto-debits on Mobile Accounts'
    ],
    technicalSpec: 'Daily scheduled cron job checks active loans. Generates structured borrower statements as PDF exports.'
  }
];

const REPORT_TABS = [
  { id: 'overview', label: 'Executive Overview', icon: LayoutGrid },
  { id: 'liquidity', label: 'Liquidity Analysis', icon: Zap },
  { id: 'geography', label: 'Geographical Spread', icon: MapIcon },
  { id: 'risk', label: 'Risk Integrity', icon: ShieldCheck },
  { id: 'spec', label: 'Loan Workflow Spec', icon: FileText },
];

export default function Reports() {
  const { profile } = useFirebase();
  const isAdmin = profile?.role === UserRole.ADMIN;

  const allowedTabs = REPORT_TABS.filter(tab => {
    if (tab.id === 'overview' || tab.id === 'spec') {
      return isAdmin;
    }
    return true;
  });

  const [activeTab, setActiveTab] = useState('liquidity');

  // Align active tab once profile loads
  useEffect(() => {
    if (profile) {
      if (isAdmin) {
        setActiveTab('overview');
      } else {
        setActiveTab('liquidity');
      }
    }
  }, [profile, isAdmin]);

  const [isFilterPaneOpen, setIsFilterPaneOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());
  const { notify } = useNotify();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    timeRange: 'Last 6 Months',
    assetClass: 'All',
    region: 'All',
    minResonance: 600
  });

  const [selectedSpecStep, setSelectedSpecStep] = useState('intake');
  const [specComments, setSpecComments] = useState<{
    id: string;
    section: string;
    author: string;
    comment: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
    date: string;
  }[]>(() => {
    const saved = localStorage.getItem('acx_boss_comments');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        section: 'AI Credit Assessment',
        author: 'Chief Executive / Board President',
        comment: 'Please clarify how the cash flow volatility mapping protects our capital during sudden market dips (e.g. currency shifts).',
        priority: 'critical',
        resolved: false,
        date: '2026-05-29 11:30'
      },
      {
        id: '2',
        section: 'Syndication & Auction Board',
        author: 'Risk Management Officer',
        comment: 'We need to cap fractional pools so no single lender holds over 40% of standard micro-retail loans.',
        priority: 'medium',
        resolved: true,
        date: '2026-05-29 11:45'
      }
    ];
  });

  const [commentSection, setCommentSection] = useState('General Overview');
  const [commentAuthor, setCommentAuthor] = useState('Board Reviewer');
  const [commentText, setCommentText] = useState('');
  const [commentPriority, setCommentPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now().toString(),
      section: commentSection,
      author: commentAuthor || 'Board Reviewer',
      comment: commentText,
      priority: commentPriority,
      resolved: false,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updated = [newComment, ...specComments];
    setSpecComments(updated);
    localStorage.setItem('acx_boss_comments', JSON.stringify(updated));
    setCommentText('');
    notify('success', 'Review Added', 'Your feedback comment has been recorded securely.');
  };

  const handleToggleCommentResolved = (commentId: string) => {
    const updated = specComments.map(c => 
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    );
    setSpecComments(updated);
    localStorage.setItem('acx_boss_comments', JSON.stringify(updated));
    notify('info', 'Status Updated', 'Comment status has been toggled.');
  };

  const handleDeleteComment = (commentId: string) => {
    const updated = specComments.filter(c => c.id !== commentId);
    setSpecComments(updated);
    localStorage.setItem('acx_boss_comments', JSON.stringify(updated));
    notify('success', 'Comment Cleared', 'Specification comment was deleted.');
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastRefreshed(new Date().toLocaleTimeString());
    }, 1200);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'ACX Portal Intelligence',
      text: 'Check out the latest financial intelligence reports on ACX.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        notify('success', 'Intelligence Shared', 'Report has been shared successfully.');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        notify('success', 'Link Copied', 'Report URL has been copied to clipboard.');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        notify('error', 'Share Failed', 'Could not share the report.');
      }
    }
  };

  const handleDownload = () => {
    if (activeTab === 'spec') {
      notify('info', 'Exporting Specifications', 'Compiling granular system specifications and lifecycle workbook for supervisor review...');
      setTimeout(() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const doc = new jsPDF() as any;
          const timestamp = new Date().toLocaleString();
          const email = "adchiwamba@gmail.com";

          const addPageHeaderFooter = (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            docObj: any,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _pageNum?: number
          ) => {
            // Header bar
            docObj.setFillColor(30, 41, 59); // Charcoal gray top banner (guava-dark)
            docObj.rect(0, 0, 210, 15, 'F');
            
            docObj.setTextColor(255, 255, 255);
            docObj.setFontSize(8);
            docObj.setFont('helvetica', 'bold');
            docObj.text('ACX PORTAL OPERATIONS BLUEPRINT', 20, 9);
            
            docObj.setTextColor(243, 109, 56); // guava-orange accent
            docObj.text('RECOVERY & DISBURSEMENT DIRECTIVE', 135, 9);
          };

          // ==============================
          // PAGE 1: FULL COVER SHEET
          // ==============================
          // Top Decorative Bands
          doc.setFillColor(30, 41, 59); // guava-dark background block
          doc.rect(0, 0, 210, 150, 'F');
          
          doc.setFillColor(243, 109, 56); // orange visual strip divider
          doc.rect(0, 150, 210, 4, 'F');

          // Title Text inside cover block
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(28);
          doc.setFont('helvetica', 'bold');
          doc.text('ACX SYSTEM SPECS', 20, 55);
          doc.text('& LIFECYCLE WORKBOOK', 20, 68);

          // Subtitle
          doc.setTextColor(243, 109, 56);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('END-TO-END OPERATIONAL LOAN MANAGEMENT MANUAL', 20, 80);

          doc.setTextColor(226, 232, 240);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const summaryText = "An exhaustive, stage-by-stage technical, business, and ledger-level blueprint documenting borrower registration payloads, mobile network API telemetry lookups, proprietary GBDT AI credit underwriting grids, real-time sync with regional collusion registries, fractional syndication limits, mobile money wallet transfer webhooks, and autonomous repayment reminders.";
          const summaryLines = doc.splitTextToSize(summaryText, 170);
          doc.text(summaryLines, 20, 92);

          // Cover Metadata Card
          doc.setFillColor(248, 250, 252); // light slate gray box
          doc.rect(20, 170, 170, 85, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.rect(20, 170, 170, 85, 'D');

          // Metadata Contents
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('DOCUMENT CLASSIFICATION & METADATA', 26, 182);
          doc.line(26, 185, 184, 185);

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text('• Authorized Recipient:', 26, 195);
          doc.setFont('helvetica', 'bold');
          doc.text(`${email}`, 70, 195);

          doc.setFont('helvetica', 'normal');
          doc.text('• System Integrity Build:', 26, 203);
          doc.setFont('helvetica', 'bold');
          doc.text('Production v4.0 (Active Gateway)', 70, 203);

          doc.setFont('helvetica', 'normal');
          doc.text('• Scope Matrix:', 26, 211);
          doc.setFont('helvetica', 'bold');
          doc.text('Borrower Request, Underwriting, Syndication, Settlement', 70, 211);

          doc.setFont('helvetica', 'normal');
          doc.text('• Compile Timestamp:', 26, 219);
          doc.setFont('helvetica', 'bold');
          doc.text(`${timestamp}`, 70, 219);

          doc.setFont('helvetica', 'normal');
          doc.text('• Safety & Risk Group:', 26, 227);
          doc.setFont('helvetica', 'bold');
          doc.text('LEVEL-C4 AUDITED PLATFORM (CONSOLIDATED SIGN-OFF)', 70, 227);

          doc.setFont('helvetica', 'normal');
          doc.text('• Automated Daemon:', 26, 235);
          doc.setFont('helvetica', 'bold');
          doc.text('48-Hour Pre-Arrears autonomous notifier active', 70, 235);

          // ==============================
          // PAGE 2: S1 & S2 ONBOARDING & UNDERWRITING
          // ==============================
          doc.addPage();
          addPageHeaderFooter(doc, 2);

          doc.setTextColor(30, 41, 59);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('PART I: BORROWER ONBOARDING & AI UNDERWRITING', 20, 28);
          doc.line(20, 31, 190, 31);

          // Stage 01
          doc.setTextColor(243, 109, 56);
          doc.setFontSize(11);
          doc.text('STAGE 01: Borrower Inquiry & Carrier API Telemetry', 20, 40);
          
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          const stage1Text = "The lifecycle initiates immediately as an applicant lodges a loan query payload in the platform. Upon secure identity token routing, the gateway retrieves granular network configurations, system device identifiers, fingerprint hashes, and geolocations, while capturing explicit user digital signatures. Parallel asynchronous API tunnels query regional Cellular Carriers and Mobile Money Operator (MTN, Orange, Safaricom, etc.) gateways with pre-vetted consent indicators. This extracts account balances, cash velocity statistics, and monthly volume histories over the preceding 6 months to define an organic transactional profile.";
          const stage1Lines = doc.splitTextToSize(stage1Text, 170);
          doc.text(stage1Lines, 20, 46);

          // Capabilities
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('CAPABILITY SPECIFICATIONS:', 20, 75);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text('• Automated multi-country identity cross-verifications (NIN, BVN, Geolocation matches).', 20, 81);
          doc.text('• Real-time carrier transaction ledger queries using sub-second web sockets.', 20, 86);
          doc.text('• Encrypted, non-custodial metadata telemetry caching with automated consent tracking.', 20, 91);

          // Stage 02
          doc.setTextColor(243, 109, 56);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('STAGE 02: GBDT Algorithmic Underwriting & Scoring', 20, 103);

          doc.setTextColor(71, 85, 105);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          const stage2Text = "Raw transactional indices are immediately mapped as numeric matrices and pushed into the Underwriting Engine. Built on optimized Gradient Boosting Decision Tree (GBDT) nodes, the algorithm weights variables including historical microfinance payment promptness, cash flow volatilities, debit ratios, and localized macroeconomic stress triggers. The module outputs a Personal Credit Resonance Score, scaling from 400 (unusable/extreme default band) to 850 (prime sovereign credit). This indicator informs maximum borrow capacity, repayment SLA boundaries, and direct lender yields.";
          const stage2Lines = doc.splitTextToSize(stage2Text, 170);
          doc.text(stage2Lines, 20, 109);

          // Capabilities
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('CAPABILITY SPECIFICATIONS:', 20, 138);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text('• Decision trees calibrated against historical Sub-Saharan and SE Asian micro-default profiles.', 20, 144);
          doc.text('• Flow drift checks: deviations of cash-flow patterns exceeding +/-12% prompt review quarantine.', 20, 149);
          doc.text('• Live pricing yield bounds adjusted dynamically based on calculated default correlations.', 20, 154);

          // Financial & Security Logic block card
          doc.setFillColor(241, 245, 249);
          doc.rect(20, 163, 170, 68, 'F');
          doc.setDrawColor(203, 213, 225);
          doc.rect(20, 163, 170, 68, 'D');

          doc.setTextColor(30, 41, 59);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('FINANCIAL MECHANICS: INTEREST ACCRUEMENT & REPAYMENT VELOCITY', 24, 171);
          doc.line(24, 173, 186, 173);

          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text('• Tenure Sensitivity: Loan interest is dynamically adjusted based on the repayment period. Shorter tenures (1-3 months)', 24, 179);
          doc.text('  significantly reduce cumulative interest accrual, lowering the borrower’s cost of capital. Longer tenures (6-12 months)', 24, 183);
          doc.text('  distribute major principal loads over safe installment bounds, scaling target cumulative yields to protect lender liquidity.', 24, 187);
          doc.text('• AI Underwritten Pricing: The borrower’s GBDT credit assessment score guides the dynamic interest rate. Profile matching', 24, 192);
          doc.text('  reduces core risk offsets, delivering lower dynamic APR ranges directly to compliant SME borrowers.', 24, 196);
          doc.text('• Ledger-Locked Settlement: Immutable repayment schedules and amortization scales are committed and hardlocked into', 24, 201);
          doc.text('  Firestore databases upon signing. Values are protected and cannot be updated during active operational loan lifecycles.', 24, 205);
          doc.text('• Auto-Sweep Core Recovery: High-speed integrations with mobile wallet APIs trigger pre-authorized installment auto-debits', 24, 210);
          doc.text('  exactly on maturity timestamps (S-06) to accelerate capital recoupment speed and fully eliminate default arrears.', 24, 214);

          // ==============================
          // PAGE 3: S3 & S4 INTEGRITY & SYNDICATION
          // ==============================
          doc.addPage();
          addPageHeaderFooter(doc, 3);

          doc.setTextColor(30, 41, 59);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('PART II: PLATFORM INTEGRITY GATEWAYS & POOL SYNDICATION', 20, 28);
          doc.line(20, 31, 190, 31);

          // Stage 03
          doc.setTextColor(243, 109, 56);
          doc.setFontSize(11);
          doc.text('STAGE 03: Distributed Collusion Registrar & Anti-Fraud Gates', 20, 40);

          doc.setTextColor(71, 85, 105);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          const stage3Text = "Before capital allocation is committed, the computed application is checked through the ACX Global Anti-Collusion Sync API. This database cross-references decentralized shared ledger networks to catch dual-application fraud, cross-borrowing, and outstanding credit balances across external liquidity vaults or blacklists. Sub-millisecond reads parse indexing vectors of high-risk borrowers to guard against capital over-indexing and system exploitation.";
          const stage3Lines = doc.splitTextToSize(stage3Text, 170);
          doc.text(stage3Lines, 20, 46);

          // Stage 04
          doc.setTextColor(243, 109, 56);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('STAGE 04: Syndication Board Floor & Fractional Allocation Limits', 20, 75);

          doc.setTextColor(71, 85, 105);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          const stage4Text = "Upon safety sign-off, loans are listed on the Syndication Auction Desk. Individual, corporate, and institutional capital providers can subscribe to slices of loans to fractionalize risk exposure. The platform enforces a strict safety restriction: no single lender may absorb more than 40% of standard microfinance loan totals. This ensures that a single lender default is cushioned and spreads exposure across diverse liquidity networks. The syndication matches capital within a 24-to-48 hour window.";
          const stage4Lines = doc.splitTextToSize(stage4Text, 170);
          doc.text(stage4Lines, 20, 81);

          // Capabilities
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text('CAPABILITY SPECIFICATIONS:', 20, 110);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text('• Global distributed ledger checking executing under 500ms bounds.', 20, 116);
          doc.text('• Dynamic risk balancing adjustor adjusting target loan yields in response to lender balances.', 20, 121);
          doc.text('• Escrow collateral locking mechanism securing assets during active syndication reservation.', 20, 126);

          // SLA Table on Page 3
          doc.setTextColor(30, 41, 59);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('INTEGRATED METRICS: SYSTEM LATENCY & ARCHITECTURE SLA', 20, 142);
          
          const specTableData = [
            ['Stage', 'System Role & Target', 'Assigned Component', 'Target SLA', 'Risk Guardrail'],
            ['S-01', 'Borrower Intake & MMO Pull', 'KYC & API Gateway', '< 3.0s Latency', 'TLS AES-256 Envelope'],
            ['S-02', 'Underwriting & Alg Scoring', 'Risk Model ML Hive', '< 1.2s Latency', 'Volatility Drift Flag'],
            ['S-03', 'Integrity Sync lookup', 'Collusion Registry', '< 500ms Read', 'Live Transaction Lock'],
            ['S-04', 'Syndication Funding matches', 'Liquidity Exchange', '24h - 48h limit', '40% Fractional Pool Clamp'],
            ['S-05', 'Automated Wallet Routing', 'Clearing Swap Desk', '< 15s Broadcast', 'Callback Webhop Guard'],
            ['S-06', 'Repayment & Reminder scheduler', 'Recoup Daemon Engine', 'Continuous Sync', '48h Autonomous Reminder']
          ];

          autoTable(doc, {
            startY: 147,
            head: [specTableData[0]],
            body: specTableData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [243, 109, 56] },
            styles: { fontSize: 7.5, cellPadding: 2.5 },
          });

          // ==============================
          // PAGE 4: S5 & S6 SWAP, REPAYMENT & BOARD COMMENTS
          // ==============================
          doc.addPage();
          addPageHeaderFooter(doc, 4);

          doc.setTextColor(30, 41, 59);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('PART III: SWAP DISBURSEMENT & AUTONOMOUS RECOVERY ENGINE', 20, 28);
          doc.line(20, 31, 190, 31);

          // Stage 05
          doc.setTextColor(243, 109, 56);
          doc.setFontSize(11);
          doc.text('STAGE 05: Foreign Exchange Clearing & Native Wallet Swaps', 20, 40);

          doc.setTextColor(71, 85, 105);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          const stage5Text = "When a syndicated loan closes successfully, final execution initiates native clearing transactions. FX clearing routes convert base capitals (e.g., USD, EUR, ZAR) into local currencies (NGN, KES, GHS) utilizing pre-funded, low-spread liquidity pools. Instant API disbursements deliver capital directly onto mobile borrower wallets. Automatic webhooks monitor final handshakes; any network failure triggers transaction rollbacks, preventing partial disbursements.";
          const stage5Lines = doc.splitTextToSize(stage5Text, 170);
          doc.text(stage5Lines, 20, 46);

          // Stage 06 + Automated Notification Service
          doc.setTextColor(243, 109, 56);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('STAGE 06: Autonomous Pre-Arrears Notifications & Collection Engine', 20, 75);

          doc.setTextColor(71, 85, 105);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          const stage6Text = "Repayments are monitored by automated billing databases. To keep delinquencies exceptionally low, the system activates an autonomous notification daemon. This cron checks active loans daily: exactly 48 hours before an installment due date, the daemon triggers automated emails, SMS, and borrower-profile push notifications detailing the bill amount, schedule timeline, and links for auto-debit triggers. The module supports customizable grace calendars, automatic cellular bank debits, and deferred repayments for verified SME stress.";
          const stage6Lines = doc.splitTextToSize(stage6Text, 170);
          doc.text(stage6Lines, 20, 81);

          // Live Board Endorsements and Review comments
          doc.setTextColor(30, 41, 59);
          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'bold');
          doc.text('PART IV: ACTIVE AUDIT TRAILS & BOSS ENDORSEMENT LOGS', 20, 115);
          doc.line(20, 118, 190, 118);

          doc.setTextColor(71, 85, 105);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text('Feedback, queries, and instructions logged live inside the Board Review panel are presented below as an official clearance audit trail:', 20, 123);

          if (specComments.length === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(20, 128, 170, 25, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.rect(20, 128, 170, 25, 'D');
            
            doc.setTextColor(30, 41, 59);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('SYSTEM DISCHARGE STATUS: DIRECTORS UNANIMOUSLY APPROVED', 25, 138);
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.setFont('helvetica', 'normal');
            doc.text('No active questions or revisions are pending. System integrity parameters are certified.', 25, 144);
          } else {
            const commentTableContent = specComments.map(c => [
              c.section,
              c.author,
              c.comment,
              c.priority.toUpperCase(),
              c.resolved ? 'RESOLVED' : 'ACTIVE / PENDING',
              c.date
            ]);

            autoTable(doc, {
              startY: 128,
              head: [['Category', 'Auditor/Signer', 'Feedback/Directive', 'Priority', 'Status', 'Date Logged']],
              body: commentTableContent,
              theme: 'striped',
              headStyles: { fillColor: [30, 41, 59] },
              styles: { fontSize: 7.5, cellPadding: 2 },
            });
          }

          doc.save(`ACX-EndToEnd-Loan-Module-Technical-Specs-Handbook-${new Date().toISOString().split('T')[0]}.pdf`);
          notify('success', 'Comprehensive Handbook Compiled', 'The formatted 4-page Technical Specs Handbook has been successfully compiled and downloaded.');
        } catch (e) {
          console.error(e);
          notify('error', 'Compilation Failed', 'Internal PDF engine error.');
        }
      }, 1500);
      return;
    }

    notify('info', 'Exporting Intelligence', 'Preparing your intelligence report for export...');
    setTimeout(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const doc = new jsPDF() as any;
        const timestamp = new Date().toLocaleString();
        
        // Header
        doc.setFillColor(30, 41, 59); // guava-dark equivalent
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ACX PORTAL INTELLIGENCE', 20, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`INTELLIGENCE REPORT | ${activeTab.toUpperCase()}`, 20, 33);
        
        // Metadata
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text(`Generated: ${timestamp}`, 20, 50);
        doc.text(`Filters: ${filters.timeRange} | ${filters.region} | Min Resonance: ${filters.minResonance}`, 20, 55);
        
        // Summary Table
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(14);
        doc.text('Performance Summary', 20, 70);
        
        const summaryData = [
          ['Metric', 'Value', 'Status'],
          ['Total Portfolio Value', '$4.28M', 'Growth +18.2%'],
          ['Avg Resonance Score', '742', 'Optimal'],
          ['Risk Integrity', '98.4%', 'Verifed'],
          ['Active Jurisdictions', '124', 'Expanding']
        ];
        
        autoTable(doc, {
          startY: 75,
          head: [summaryData[0]],
          body: summaryData.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [243, 109, 56] } // guava-orange
        });

        // Allocation Detail
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY = (doc as any).lastAutoTable.finalY || 120;
        doc.text('Asset Allocation Intelligence', 20, finalY + 15);
        
        const tableData = DATA_ALLOCATION.map(item => [
          item.category,
          `$${item.amount.toLocaleString()}`,
          item.risk,
          `${Math.round((item.amount / 180000) * 100)}%`
        ]);

        autoTable(doc, {
          startY: finalY + 20,
          head: [['Category', 'Amount Committed', 'Risk Profile', 'Contribution']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [30, 41, 59] }
        });

        doc.save(`ACX_Intel_${activeTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
        notify('success', 'Report Exported', 'The intelligence PDF has been downloaded.');
      } catch (err) {
        console.error('PDF generation failed:', err);
        notify('error', 'Export Failed', 'Could not generate PDF.');
      }
    }, 1500);
  };

  return (
    <div className="w-full flex h-[calc(100vh-120px)] -mt-4 bg-[#F3F4F6] rounded-[32px] overflow-hidden border border-gray-200">
      {/* Top Controller Bar (Power BI Style) */}
      <div className="absolute top-4 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20 mx-8 rounded-t-[32px]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-guava-orange rounded-sm" />
            <h1 className="text-sm font-black text-guava-dark uppercase tracking-widest bg-clip-text">Portal Intelligence v4.0</h1>
          </div>
          <div className="h-6 w-[1px] bg-gray-200" />
          <nav className="flex gap-1">
            {allowedTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all flex items-center gap-2",
                  activeTab === tab.id ? "bg-guava-dark text-white shadow-lg" : "text-gray-400 hover:bg-gray-100"
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            Updated {lastRefreshed}
          </div>
          <button onClick={refreshData} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Share Report">
            <Share2 className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={() => setIsPrintModalOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-slate-500 hover:text-guava-orange" title="Print Friendly Ledger / Report">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={handleDownload} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Export Data">
             <FileDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pt-14 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="absolute inset-0 bg-guava-orange"
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-guava-dark animate-pulse">Synchronizing Intelligence</p>
              </motion.div>
            ) : null}

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {activeTab === 'overview' && (
                <>
                  {/* KPI Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <KPICard title="Total Portfolio Value" value="$4.28M" trend="+18.2%" icon={Activity} />
                    <KPICard title="Avg Resonance Score" value="742" trend="+12" icon={TrendingUp} />
                    <KPICard title="Active Nodes" value="124" trend="+3" icon={Globe} />
                    <KPICard title="Risk Integrity" value="98.4%" trend="Stable" icon={ShieldCheck} isSuccess />
                  </div>

                  {/* Main Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-10">
                        <div>
                          <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest">Resonance Trajectory</h3>
                          <p className="text-[10px] text-gray-400 font-bold">Observed vs Target Intelligence Growth</p>
                        </div>
                        <div className="flex gap-4">
                           <div className="flex items-center gap-1.5">
                              <div className="w-3 h-1 bg-guava-orange rounded-full" />
                              <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">Actual</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                              <div className="w-3 h-1 bg-gray-200 rounded-full" />
                              <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400">Target</span>
                           </div>
                        </div>
                      </div>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={DATA_RESONANCE}>
                            <defs>
                              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f36d38" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#f36d38" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="value" stroke="#f36d38" strokeWidth={3} fill="url(#colorVal)" />
                            <Line type="monotone" dataKey="target" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col">
                       <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest mb-10">Regional Intensity</h3>
                       <div className="flex-1 flex flex-col items-center justify-center">
                          <div className="h-[220px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={DATA_REGION}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {DATA_REGION.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                </PieChart>
                             </ResponsiveContainer>
                          </div>
                          <div className="grid grid-cols-2 gap-4 w-full mt-6">
                             {DATA_REGION.map(region => (
                               <div key={region.name} className="space-y-1">
                                  <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: region.color }} />
                                     <span className="text-[9px] font-black uppercase text-gray-500 whitespace-nowrap">{region.name}</span>
                                  </div>
                                  <div className="text-sm font-black">{region.value}%</div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Allocation Table Row */}
                  <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest">Asset Allocation Intelligence</h3>
                       <button className="text-[9px] font-black uppercase tracking-widest text-guava-orange hover:underline">View All Assets</button>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full">
                          <thead>
                             <tr className="border-b border-gray-100">
                                <th className="text-left pb-4 text-[9px] font-black uppercase text-gray-400">Category</th>
                                <th className="text-right pb-4 text-[9px] font-black uppercase text-gray-400">Amount Committed</th>
                                <th className="text-right pb-4 text-[9px] font-black uppercase text-gray-400">Risk Profile</th>
                                <th className="text-right pb-4 text-[9px] font-black uppercase text-gray-400">Contribution</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                             {DATA_ALLOCATION.map((item, i) => (
                               <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                  <td className="py-5 text-xs font-black text-guava-dark">{item.category}</td>
                                  <td className="py-5 text-right text-xs font-black font-mono">${item.amount.toLocaleString()}</td>
                                  <td className="py-5 text-right">
                                     <span className={cn(
                                       "px-2 py-1 rounded-lg text-[8px] font-black uppercase",
                                       item.risk === 'Low' ? "bg-green-50 text-green-600" : item.risk === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                     )}>
                                        {item.risk} Risk
                                     </span>
                                  </td>
                                  <td className="py-5 text-right">
                                     <div className="flex items-center justify-end gap-3">
                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                           <div className="h-full bg-guava-dark rounded-full" style={{ width: `${(item.amount / 180000) * 100}%` }} />
                                        </div>
                                        <span className="text-[10px] font-black font-mono w-8">{Math.round((item.amount / 180000) * 100)}%</span>
                                     </div>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'liquidity' && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <KPICard title="Total Liquidity Pool" value="$12.84M" trend="+4.2%" icon={Zap} />
                      <KPICard title="Utilization Rate" value="68.2%" trend="-2.1%" icon={Activity} />
                      <KPICard title="Cash Flow Gap" value="$0.8M" trend="Stable" icon={TrendingUp} isSuccess />
                      <KPICard title="Available Surplus" value="$4.1M" trend="+12.5%" icon={DollarSign} />
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                         <div className="flex justify-between items-center mb-10">
                            <div>
                               <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest">Inflow-Outflow Dynamics</h3>
                               <p className="text-[10px] text-gray-400 font-bold">Monthly Liquidity Movement Analysis</p>
                            </div>
                         </div>
                         <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={DATA_LIQUIDITY_FLOW}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                                  <Bar dataKey="inflow" fill="#f36d38" radius={[4, 4, 0, 0]} name="Inflow" />
                                  <Bar dataKey="outflow" fill="#1e293b" radius={[4, 4, 0, 0]} name="Outflow" />
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>

                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                         <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest mb-10">Liquidity Depth</h3>
                         <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={DATA_LIQUIDITY_FLOW}>
                                  <defs>
                                    <linearGradient id="colorPool" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <RechartsTooltip content={<CustomTooltip />} />
                                  <Area type="monotone" dataKey="pool" stroke="#22c55e" strokeWidth={3} fill="url(#colorPool)" />
                               </AreaChart>
                            </ResponsiveContainer>
                         </div>
                         <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Observation</p>
                            <p className="text-xs font-medium text-gray-600">Liquidity surplus remains high at 18.2% above historical average, indicating strong capital buffering.</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'geography' && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden h-[500px]">
                         <div className="relative z-10">
                            <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest">Global Node Distribution</h3>
                            <p className="text-[10px] text-gray-400 font-bold">Active Capital Deployment Areas</p>
                         </div>
                         <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <Globe className="w-96 h-96" />
                         </div>
                         <div className="relative z-10 h-full mt-12">
                            <div className="space-y-6">
                               {DATA_COUNTRY_SPREAD.map((country, idx) => (
                                 <motion.div 
                                   initial={{ opacity: 0, x: -20 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: idx * 0.1 }}
                                   key={country.name} 
                                   className="flex items-center justify-between group cursor-default"
                                 >
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-black text-xs text-guava-orange group-hover:bg-guava-orange group-hover:text-white transition-all">
                                          {country.name.substring(0, 2).toUpperCase()}
                                       </div>
                                       <div>
                                          <h4 className="text-sm font-black text-guava-dark">{country.name}</h4>
                                          <div className="flex items-center gap-2">
                                             <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-guava-dark" style={{ width: `${country.value}%` }} />
                                             </div>
                                             <span className="text-[10px] font-black text-gray-400">{country.value}%</span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-xs font-black text-green-500">{country.growth}</p>
                                       <p className="text-[9px] font-black uppercase tracking-tighter text-gray-300">MoM Growth</p>
                                    </div>
                                 </motion.div>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-[234px]">
                            <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest mb-6 focus-within:">Resonance by Jurisdiction</h3>
                            <div className="h-[120px]">
                               <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={DATA_COUNTRY_SPREAD} layout="vertical">
                                     <XAxis type="number" hide />
                                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} width={80} />
                                     <RechartsTooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                     <Bar dataKey="resonance" fill="#f36d38" radius={[0, 4, 4, 0]} barSize={12} />
                                  </BarChart>
                               </ResponsiveContainer>
                            </div>
                         </div>

                         <div className="bg-guava-dark rounded-3xl p-8 text-white relative overflow-hidden h-[234px]">
                            <MapIcon className="absolute -right-12 -bottom-12 w-48 h-48 opacity-10 rotate-12" />
                            <div className="relative z-10">
                               <h3 className="text-sm font-black uppercase tracking-widest opacity-60 mb-8">Strategic Analysis</h3>
                               <div className="space-y-4">
                                  <div className="flex border-l-2 border-guava-orange pl-4">
                                     <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Primary Hub</p>
                                        <p className="text-xl font-black">West African Corridor</p>
                                     </div>
                                  </div>
                                  <div className="flex border-l-2 border-white/20 pl-4">
                                     <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Emerging Frontier</p>
                                        <p className="text-xl font-black">East African Tech-belt</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'risk' && (
                <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm col-span-2">
                         <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest mb-10">Resonance Score Distribution</h3>
                         <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={DATA_RISK_DISTRIBUTION}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#9ca3af' }} />
                                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                     {DATA_RISK_DISTRIBUTION.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} />
                                     ))}
                                  </Bar>
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>

                      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
                         <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest">Integrity Metrics</h3>
                         <div className="space-y-6">
                            <IntegrityMeter label="Default Rate" value="1.2%" target="< 2.0%" status="Ideal" />
                            <IntegrityMeter label="Collateral Cover" value="142%" target="> 120%" status="Optimal" />
                            <IntegrityMeter label="Recovery Node Latency" value="14ms" target="< 20ms" status="Optimal" />
                         </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                      <h3 className="text-sm font-black text-guava-dark uppercase tracking-widest mb-8">Risk Event Audit Trail</h3>
                      <div className="space-y-4">
                         {[
                           { event: 'Resonance Shift Detected', region: 'Nigeria/Node-04', impact: 'Negligible', time: '14 mins ago' },
                           { event: 'Collateral Re-validation', region: 'Global', impact: 'Systemic', time: '2 hours ago' },
                           { event: 'Liquidation Automated', region: 'Kenya/Node-12', impact: 'Isolated', time: '5 hours ago' },
                           { event: 'New Institutional Onboarding', region: 'South Africa', impact: 'Positive', time: 'Yesterday' },
                         ].map((event, i) => (
                           <div key={i} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                              <div className="flex items-center gap-4">
                                 <div className="p-2 bg-gray-50 rounded-lg">
                                    <ShieldCheck className="w-4 h-4 text-gray-400" />
                                 </div>
                                 <div>
                                    <h5 className="text-xs font-black text-guava-dark">{event.event}</h5>
                                    <p className="text-[10px] text-gray-400 font-bold">{event.region}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className={cn(
                                   "text-[10px] font-black uppercase tracking-widest mb-1",
                                   event.impact === 'Positive' ? "text-green-500" : event.impact === 'Negligible' ? "text-gray-400" : "text-amber-500"
                                 )}>{event.impact} Impact</p>
                                 <p className="text-[9px] font-bold text-gray-300">{event.time}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'spec' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                  {/* Left Column: Visual Flow & Specifications Detail */}
                  <div className="lg:col-span-8 space-y-8">
                    {/* Top Blueprint Summary */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-150 shadow-sm animate-fade-in">
                      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-guava-orange/10 text-guava-orange rounded-md">Confidential Blueprint</span>
                          <h3 className="text-xl font-black text-guava-dark uppercase tracking-tight mt-2">Operational Loan Life-Cycle Flow</h3>
                          <p className="text-xs text-gray-400 mt-1 font-semibold text-slate-500">Click on any lifecycle node below to audit technical specifications, SLA metrics, and operational checks.</p>
                        </div>
                        <button
                          onClick={handleDownload}
                          type="button"
                          className="shrink-0 py-3 px-5 bg-guava-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-guava-orange transition-all flex items-center justify-center gap-2 border border-guava-dark hover:border-guava-orange shadow-lg shadow-gray-100 group"
                        >
                          <FileText className="w-4 h-4 text-guava-orange group-hover:text-white transition-colors" />
                          <span>Download Boss Review Manual (PDF)</span>
                        </button>
                      </div>

                      {/* Unified Interactive Flowchart Schema */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-8">
                        {SPEC_STEPS.map((step, idx) => {
                          const StepIcon = step.icon;
                          const isSelected = selectedSpecStep === step.id;
                          return (
                            <button
                              key={step.id}
                              onClick={() => setSelectedSpecStep(step.id)}
                              className={cn(
                                "relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-36 group",
                                isSelected 
                                  ? "bg-guava-dark text-white border-guava-dark shadow-lg shadow-guava-dark/10" 
                                  : "bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-200 hover:bg-gray-100/50"
                              )}
                            >
                              <div className="flex justify-between items-center w-full">
                                <div className={cn(
                                  "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                                  isSelected ? "bg-white/10 text-white" : "bg-white text-guava-dark shadow-sm border border-gray-100"
                                )}>
                                  <StepIcon className="w-4 h-4" />
                                </div>
                                <span className={cn(
                                  "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded",
                                  isSelected ? "bg-white/10 text-white/80" : "bg-gray-200/50 text-gray-500"
                                )}>
                                  S0{idx + 1}
                                </span>
                              </div>
                              <div>
                                <p className={cn(
                                  "text-[9px] font-bold uppercase tracking-tight line-clamp-1 opacity-65",
                                  isSelected ? "text-white" : "text-gray-400"
                                )}>
                                  {step.owner}
                                </p>
                                <h4 className={cn(
                                  "text-[11px] font-black tracking-tight line-clamp-2 mt-0.5 group-hover:text-guava-orange transition-colors",
                                  isSelected ? "text-white group-hover:text-white" : "text-guava-dark"
                                )}>
                                  {step.title.split(': ')[1]}
                                </h4>
                              </div>
                              {/* Horizontal connector lines for desktop */}
                              {idx < SPEC_STEPS.length - 1 && (
                                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Deep-Dive Inspection Panel */}
                      {(() => {
                        const step = SPEC_STEPS.find(s => s.id === selectedSpecStep) || SPEC_STEPS[0];
                        const StepIcon = step.icon;
                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-gray-50/55 rounded-2xl border border-gray-100 space-y-6"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-guava-orange text-white rounded-xl flex items-center justify-center">
                                  <StepIcon className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-guava-dark uppercase tracking-tight">{step.title}</h4>
                                  <p className="text-[10px] text-gray-400 font-bold">Primary system component: <span className="text-guava-orange font-black">{step.owner}</span></p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Target SLA</span>
                                <div className="px-3 py-1 bg-white text-guava-dark text-[10px] font-mono font-black border border-gray-100 rounded-lg">
                                  {step.sla}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-4">
                                <div>
                                  <h5 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Functional Description</h5>
                                  <p className="text-xs text-gray-600 leading-relaxed font-semibold">{step.desc}</p>
                                </div>
                                <div className="pt-2">
                                  <h5 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Key System Capabilities</h5>
                                  <ul className="space-y-2">
                                    {step.features.map((f, i) => (
                                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600 font-semibold">
                                        <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                        <span>{f}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between">
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3 text-guava-orange" />
                                      Safety Controller Guardrails
                                    </h5>
                                    <p className="text-xs text-slate-700 font-bold bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl">
                                      {step.risk}
                                    </p>
                                  </div>
                                  <div>
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 font-mono">
                                      API Node Specs
                                    </h5>
                                    <p className="text-[10px] font-mono text-gray-500 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                      {step.technicalSpec}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 text-[9px] text-gray-400 font-mono">
                                  <Lock className="w-3 h-3" /> Encrypted ISO-20022 message block
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </div>

                    {/* Integrated Key Feature Deep-Dive Showcase */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Repayment statement export */}
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between pt-6">
                        <div>
                          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4">
                            <FileText className="w-5 h-5" />
                          </div>
                          <h4 className="text-sm font-black text-guava-dark uppercase tracking-tight">Statement Portability Engine</h4>
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed font-semibold text-slate-500">
                            Empower borrowers to generate formatted, cryptographically-hashable repayment histories directly inside their profiles. Fits our decentralized, transparent governance paradigm.
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono font-bold text-gray-400 w-full animate-pulse">
                          <span>Output: Format ISO PDF</span>
                          <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded">Active Capability</span>
                        </div>
                      </div>

                      {/* Reminder Engine Service */}
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between pt-6">
                        <div>
                          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-4">
                            <Zap className="w-5 h-5" />
                          </div>
                          <h4 className="text-sm font-black text-guava-dark uppercase tracking-tight">Pre-Arrears Autonomous Reminders</h4>
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed font-semibold text-slate-500">
                            System initiates secure batch queries 48 hours prior to amortization dates. Triggers push/email reminders through pre-authorised gateways ensuring low default rates.
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] font-mono font-bold text-gray-400 w-full animate-pulse">
                          <span>Trigger: 48h Advance SLA</span>
                          <span className="text-amber-500 bg-amber-50 px-2 py-0.5 rounded">Active Daemon</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Board & Boss Comments Panel */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-guava-orange" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-guava-dark">Executive Comment Board</h3>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold mb-6">Internal review feedback for directors and supervisors.</p>

                      {/* Comment Input Form */}
                      <form onSubmit={handleAddComment} className="space-y-4 mb-6">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Your Name / Title</label>
                          <input 
                            type="text" 
                            required
                            value={commentAuthor}
                            onChange={(e) => setCommentAuthor(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2 text-xs font-black outline-none focus:border-guava-orange"
                            placeholder="e.g. Chief Executive / Risk Officer"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Target Section / Stage</label>
                          <select 
                            value={commentSection}
                            onChange={(e) => setCommentSection(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-150 rounded-lg px-3 py-2 text-xs font-black outline-none focus:border-guava-orange"
                          >
                            <option value="General Overview">General Overview</option>
                            <option value="Borrower Intake">Borrower Intake</option>
                            <option value="AI Credit Assessment">AI Credit Assessment</option>
                            <option value="Centralized Registry">Centralized Registry</option>
                            <option value="Syndication & Auction Board">Syndication & Auction Board</option>
                            <option value="Disbursement Routing">Disbursement Routing</option>
                            <option value="Repayments & Reminders">Repayments & Reminders</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Priority</label>
                            <select 
                              value={commentPriority}
                              onChange={(e) => setCommentPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                              className="w-full bg-gray-50 border border-gray-150 rounded-lg px-3 py-2 text-xs font-black outline-none focus:border-guava-orange"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          <div className="flex flex-col justify-end">
                            <span className="text-[8px] text-gray-400 font-bold mb-1 block">Saves locally</span>
                            <div className="text-[9px] text-guava-orange font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Direct Sign
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Review Comment</label>
                          <textarea 
                            rows={3}
                            required
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3.5 py-2 text-xs font-medium outline-none focus:border-guava-orange resize-none"
                            placeholder="Write questions, revisions or approvals..."
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-2.5 bg-guava-orange text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-3.5 h-3.5" /> File Comment / Request
                        </button>
                      </form>

                      {/* Display Comments List */}
                      <div className="space-y-4 pt-6 border-t border-gray-100 max-h-[380px] overflow-y-auto custom-scrollbar">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center justify-between">
                          <span>Board Requests ({specComments.length})</span>
                          {specComments.length > 0 && <span className="text-[8px] opacity-40">Scroll to view</span>}
                        </h4>

                        {specComments.length === 0 ? (
                          <div className="py-8 text-center text-gray-400 text-xs font-bold bg-gray-50 rounded-2xl border border-gray-50/50">
                            No active comments. Fully approved.
                          </div>
                        ) : (
                          specComments.map((c) => (
                            <motion.div 
                              layout
                              key={c.id}
                              className={cn(
                                "p-4 rounded-2xl border transition-all space-y-2 relative group",
                                c.resolved 
                                  ? "bg-gray-50/50 border-gray-100/50 opacity-60" 
                                  : "bg-white border-gray-100 shadow-sm"
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <span className={cn(
                                    "px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tight rounded",
                                    c.priority === 'critical' ? "bg-red-50 text-red-500" :
                                    c.priority === 'high' ? "bg-orange-50 text-orange-500" :
                                    c.priority === 'medium' ? "bg-amber-50 text-amber-500" : "bg-gray-100 text-gray-500"
                                  )}>
                                    {c.priority}
                                  </span>
                                  <span className="text-[9px] text-gray-400 font-bold ml-2">{c.section}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={() => handleToggleCommentResolved(c.id)}
                                    title={c.resolved ? "Reopen comment" : "Resolve comment"}
                                    type="button"
                                    className={cn(
                                      "p-1.5 rounded-lg border transition-all",
                                      c.resolved 
                                        ? "bg-green-50 border-green-200 text-green-600" 
                                        : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200"
                                    )}
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteComment(c.id)}
                                    title="Delete comment"
                                    type="button"
                                    className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <p className={cn("text-xs leading-relaxed", c.resolved ? "line-through text-gray-400" : "text-gray-600 font-semibold")}>
                                {c.comment}
                              </p>

                              <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold border-t border-gray-50 pt-2">
                                <span className="text-guava-dark">{c.author}</span>
                                <span>{c.date}</span>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Right Side Filter Pane (Power BI Style) */}
      <motion.aside 
        initial={false}
        animate={{ width: isFilterPaneOpen ? 320 : 0 }}
        className="bg-white border-l border-gray-200 relative z-30 flex flex-col"
      >
        <div className="absolute top-0 right-full h-12 w-8 bg-white border-y border-l border-gray-200 rounded-l-xl flex items-center justify-center cursor-pointer mt-4 shadow-[-5px_0_15px_rgba(0,0,0,0.05)]"
             onClick={() => setIsFilterPaneOpen(!isFilterPaneOpen)}>
          <ChevronRight className={cn("w-4 h-4 transition-transform", isFilterPaneOpen ? "rotate-0" : "rotate-180")} />
        </div>

        <div className={cn("flex-1 overflow-hidden transition-opacity flex flex-col", !isFilterPaneOpen && "opacity-0")}>
          <div className="p-6 border-b border-gray-100">
             <div className="flex items-center gap-2 mb-1">
                <Filter className="w-4 h-4 text-guava-orange" />
                <h2 className="text-xs font-black uppercase tracking-widest text-guava-dark">Intelligence Filters</h2>
             </div>
             <p className="text-[10px] text-gray-400 font-bold">Restrict analytical scope</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Filter Group: Time */}
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Time Intelligence</label>
              <div className="grid grid-cols-1 gap-2">
                 {['Live Analytics', 'Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Last 6 Months'].map(time => (
                   <button 
                     key={time}
                     onClick={() => setFilters({ ...filters, timeRange: time })}
                     className={cn(
                       "text-left px-4 py-3 rounded-xl text-[10px] font-black transition-all border",
                       filters.timeRange === time ? "bg-guava-dark text-white border-guava-dark shadow-md" : "bg-gray-50 text-gray-500 border-transparent hover:border-gray-200"
                     )}
                   >
                     {time}
                   </button>
                 ))}
              </div>
            </div>

            {/* Filter Group: Geography */}
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Regional Drilldown</label>
              <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[10px] font-black outline-none focus:border-guava-orange">
                <option>Global Portal</option>
                <option>Africa Sourcing</option>
                <option>SEA Liquidity</option>
                <option>LatAm Emergence</option>
              </select>
            </div>

            {/* Filter Group: Resonance Slider */}
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Min Resonance</label>
                  <span className="text-[10px] font-black">{filters.minResonance}</span>
               </div>
               <input 
                 type="range" 
                 min="400" 
                 max="850" 
                 step="10"
                 value={filters.minResonance}
                 onChange={(e) => setFilters({ ...filters, minResonance: Number(e.target.value) })}
                 className="w-full accent-guava-dark"
               />
               <div className="flex justify-between text-[8px] font-bold text-gray-300">
                  <span>Standard</span>
                  <span>Institutional</span>
               </div>
            </div>

            {/* Visual Settings */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
               <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 font-mono">Visual Parameters</label>
               <div className="space-y-3">
                  <ToggleButton label="Show Targets" active />
                  <ToggleButton label="Sync Real-time" />
                  <ToggleButton label="Cross-filtering" active />
               </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100">
             <button
               onClick={() => { setFilters({ timeRange: 'Last 6 Months', assetClass: 'All', region: 'All', minResonance: 600 }); refreshData(); }}
               className="w-full py-3 border-2 border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-guava-dark hover:text-guava-dark transition-all"
             >
                Reset Visuals
             </button>
          </div>
        </div>
      </motion.aside>

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        filters={filters}
        specComments={specComments}
        DATA_ALLOCATION={DATA_ALLOCATION}
        DATA_LIQUIDITY_FLOW={DATA_LIQUIDITY_FLOW}
        DATA_COUNTRY_SPREAD={DATA_COUNTRY_SPREAD}
      />
    </div>
  );
}

function KPICard({ title, value, trend, icon: Icon, isSuccess }: { title: string, value: string, trend: string, icon: LucideIcon, isSuccess?: boolean }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:translate-y-[-2px] transition-transform cursor-default group">
       <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-guava-dark group-hover:text-white transition-all">
             <Icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </div>
          <div className={cn(
             "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter flex items-center gap-1",
             isSuccess || trend.startsWith('+') ? "bg-green-50 text-green-500" : "bg-amber-50 text-amber-500"
          )}>
             {trend.startsWith('+') ? <ArrowUpRight className="w-2 h-2" /> : trend === 'Stable' ? null : <ArrowDownRight className="w-2 h-2" />}
             {trend}
          </div>
       </div>
       <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
       <h4 className="text-2xl font-black text-guava-dark font-mono tracking-tighter">{value}</h4>
    </div>
  );
}

function IntegrityMeter({ label, value, target, status }: { label: string, value: string, target: string, status: string }) {
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-end">
          <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
             <h4 className="text-xl font-black text-guava-dark leading-none">{value}</h4>
          </div>
          <div className="text-right">
             <p className="text-[8px] font-black uppercase text-gray-300">Target: {target}</p>
             <div className="flex items-center gap-1 justify-end text-[9px] font-black text-green-600">
                <ShieldCheck className="w-3 h-3" />
                {status}
             </div>
          </div>
       </div>
       <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
          <div className="h-full bg-guava-orange" style={{ width: '85%' }} />
       </div>
    </div>
  );
}

function ToggleButton({ label, active }: { label: string, active?: boolean }) {
  const [isOn, setIsOn] = useState(active);
  return (
    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsOn(!isOn)}>
      <span className="text-[10px] font-bold text-gray-500 group-hover:text-guava-dark transition-colors">{label}</span>
      <div className={cn("w-8 h-4 rounded-full relative transition-colors", isOn ? "bg-guava-dark" : "bg-gray-200")}>
        <motion.div 
          animate={{ x: isOn ? 16 : 2 }}
          className="absolute top-1 w-2 h-2 bg-white rounded-full shadow-sm"
        />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean, payload?: { value: number | string }[], label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-guava-dark p-4 rounded-2xl shadow-2xl border border-white/10 text-white min-w-[120px]">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-[8px] font-bold opacity-60">Resonance</span>
            <span className="text-[10px] font-black font-mono">{payload[0].value}</span>
          </div>
          {payload[1] && (
            <div className="flex justify-between gap-4">
              <span className="text-[8px] font-bold opacity-60">Target</span>
              <span className="text-[10px] font-black font-mono">{payload[1].value}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}
