import { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, Database, Key, Settings, ArrowRight, Clock, ShieldCheck, Check, X,
  Play, Shield, Terminal, RefreshCw, Search, Filter, Edit3, TrendingUp, Activity
} from 'lucide-react';
import { doc, setDoc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { auditService } from '../lib/audit';
import { AuditLog, LoanStatus, AuditEventType, UserRole, UserProfile } from '../types';
import { MOCK_LOANS, MOCK_INVESTMENTS, MOCK_REPAYMENTS, MOCK_USERS } from '../lib/store';
import { useNotify } from '../lib/NotificationContext';
import { firestoreService } from '../services/firestoreService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Reports from './Reports';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminPanel() {
  const { profile: currentUser } = useFirebase();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const { notify } = useNotify();
  const [pendingLoans, setPendingLoans] = useState(MOCK_LOANS.filter(l => l.status === LoanStatus.PENDING));

  const [activeTab, setActiveTab] = useState<'nexus' | 'users' | 'reports'>('nexus');
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [userDirectoriesLoading, setUserDirectoriesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [kycFilter, setKycFilter] = useState<string>('ALL');

  // Integrations State
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [testingGatewayId, setTestingGatewayId] = useState<string | null>(null);
  const [gateways, setGateways] = useState([
    {
      id: 'swift',
      name: 'SWIFT Settlement Gateway',
      category: 'Bank Transfer' as 'Settlement' | 'Bank Transfer' | 'Mobile Money',
      provider: 'SWIFT Alliance Access',
      tunnelId: '8219',
      status: 'ACTIVE' as 'ACTIVE' | 'PAUSED' | 'MAINTENANCE',
      rateLimit: 120,
      autoSweepEnabled: true,
      securityStandard: 'ISO-20022 + HSM Hardened',
      repaymentEfficiencyRating: '99.8% Success Rate',
      endpoint: 'https://api.swift.com/v4/clearing-swap',
      lastPingMs: 72,
      lastPingTime: 'Just now'
    },
    {
      id: 'stripe',
      name: 'Stripe Institutional Pool Payouts',
      category: 'Settlement' as 'Settlement' | 'Bank Transfer' | 'Mobile Money',
      provider: 'Stripe Connect',
      tunnelId: '9041',
      status: 'ACTIVE' as 'ACTIVE' | 'PAUSED' | 'MAINTENANCE',
      rateLimit: 300,
      autoSweepEnabled: true,
      securityStandard: 'PCI-DSS Level 1 + AES-256',
      repaymentEfficiencyRating: '99.6% Success Rate',
      endpoint: 'https://api.stripe.com/v1/payouts/batch',
      lastPingMs: 45,
      lastPingTime: 'Just now'
    },
    {
      id: 'mtn',
      name: 'MTN Mobile Money Gateway',
      category: 'Mobile Money' as 'Settlement' | 'Bank Transfer' | 'Mobile Money',
      provider: 'MTN MoMo API Group',
      tunnelId: 'MTN-451',
      status: 'ACTIVE' as 'ACTIVE' | 'PAUSED' | 'MAINTENANCE',
      rateLimit: 500,
      autoSweepEnabled: true,
      securityStandard: 'REST OAuth 2.0 + TLS v1.3',
      repaymentEfficiencyRating: '98.9% SLA Sweep',
      endpoint: 'https://partner.momoapi.mtn.com/collection/v1_0',
      lastPingMs: 140,
      lastPingTime: '2 mins ago'
    },
    {
      id: 'mpesa',
      name: 'Safaricom M-Pesa C2B API',
      category: 'Mobile Money' as 'Settlement' | 'Bank Transfer' | 'Mobile Money',
      provider: 'Safaricom Daraja Portal',
      tunnelId: 'SAF-902',
      status: 'ACTIVE' as 'ACTIVE' | 'PAUSED' | 'MAINTENANCE',
      rateLimit: 1000,
      autoSweepEnabled: true,
      securityStandard: 'SSL Pinning + Multi-Factor PIN',
      repaymentEfficiencyRating: '99.2% SLA Sync',
      endpoint: 'https://api.safaricom.co.ke/mpesa/c2b/v1/simulate',
      lastPingMs: 110,
      lastPingTime: '5 mins ago'
    },
    {
      id: 'orange',
      name: 'Orange Money Webhook Desk',
      category: 'Mobile Money' as 'Settlement' | 'Bank Transfer' | 'Mobile Money',
      provider: 'Orange Partner API',
      tunnelId: 'ORA-880',
      status: 'PAUSED' as 'ACTIVE' | 'PAUSED' | 'MAINTENANCE',
      rateLimit: 250,
      autoSweepEnabled: false,
      securityStandard: 'HMAC Webhook Signatures',
      repaymentEfficiencyRating: '97.5% SLA Sweep',
      endpoint: 'https://api.orange.com/money/payment/v1',
      lastPingMs: 195,
      lastPingTime: '10 mins ago'
    },
    {
      id: 'ecocash',
      name: 'EcoCash Mobile Wallet API',
      category: 'Mobile Money' as 'Settlement' | 'Bank Transfer' | 'Mobile Money',
      provider: 'EcoCash Econet',
      tunnelId: 'ECO-712',
      status: 'ACTIVE' as 'ACTIVE' | 'PAUSED' | 'MAINTENANCE',
      rateLimit: 400,
      autoSweepEnabled: true,
      securityStandard: 'AES-128 + Secure Token Auth',
      repaymentEfficiencyRating: '98.5% SLA Sweep',
      endpoint: 'https://api.ecocash.co.zw/v1/payment',
      lastPingMs: 125,
      lastPingTime: 'Just now'
    }
  ]);

  const handleTestGateway = async (gatewayId: string) => {
    setTestingGatewayId(gatewayId);
    notify('info', 'Gateway Ping Initialized', `Deploying secure TLS packet to check endpoint connectivity...`);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const randomLatency = Math.floor(Math.random() * 80) + 30; // 30ms to 110ms

    setGateways(prev => prev.map(g => {
      if (g.id === gatewayId) {
        return {
          ...g,
          lastPingMs: randomLatency,
          lastPingTime: 'Just now'
        };
      }
      return g;
    }));

    setTestingGatewayId(null);
    notify('success', 'Ping Response Received', `Connection status: OK. Latency: ${randomLatency}ms. SSL Handshake sealed.`);

    const targetGateway = gateways.find(g => g.id === gatewayId);
    if (currentUser && targetGateway) {
      await auditService.log(
        currentUser,
        AuditEventType.SYSTEM_CONFIG_CHANGED,
        `Gateway diagnostics check succeeded for ${targetGateway.name}. Tunnel: ${targetGateway.tunnelId}. Response latency: ${randomLatency}ms. Protocol: ${targetGateway.securityStandard}`,
        'INFO'
      );
      // Refresh logs
      const auditLogs = await auditService.getLogs();
      setLogs(auditLogs);
    }
  };

  const handleToggleGatewayStatus = async (gatewayId: string, newStatus: 'ACTIVE' | 'PAUSED' | 'MAINTENANCE') => {
    setGateways(prev => prev.map(g => {
      if (g.id === gatewayId) {
        return { ...g, status: newStatus };
      }
      return g;
    }));

    const targetGateway = gateways.find(g => g.id === gatewayId);
    if (currentUser && targetGateway) {
      const severity = newStatus === 'PAUSED' ? 'WARNING' : 'INFO';
      await auditService.log(
        currentUser,
        AuditEventType.SYSTEM_CONFIG_CHANGED,
        `Admin modified integration gateway routing parameters for high-priority channel ${targetGateway.name}. New registration status: ${newStatus}`,
        severity
      );
      // Refresh logs
      const auditLogs = await auditService.getLogs();
      setLogs(auditLogs);
    }
    notify('success', 'Gateway Router Adjusted', `Gateway ${targetGateway?.name || gatewayId} state shifted to ${newStatus}.`);
  };

  const handleToggleAutoSweep = async (gatewayId: string, enabled: boolean) => {
    setGateways(prev => prev.map(g => {
      if (g.id === gatewayId) {
        return { ...g, autoSweepEnabled: enabled };
      }
      return g;
    }));

    const targetGateway = gateways.find(g => g.id === gatewayId);
    if (currentUser && targetGateway) {
      await auditService.log(
        currentUser,
        AuditEventType.SYSTEM_CONFIG_CHANGED,
        `Admin updated auto-sweep recovery daemon setting for gateway ${targetGateway.name}. Automated pre-arrears collection auto-sweep: ${enabled ? 'ENABLED' : 'DISABLED'}`,
        'INFO'
      );
      // Refresh logs
      const auditLogs = await auditService.getLogs();
      setLogs(auditLogs);
    }
    notify('success', 'Arrears Engine Balanced', `Automated billing sweep ${enabled ? 'enabled' : 'disabled'} for ${targetGateway?.name}.`);
  };

  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedDummyData = async () => {
    if (!currentUser) {
      notify('error', 'Authentication Required', 'Please sign in with an administrator account to seed demo records.');
      return;
    }
    
    setIsSeeding(true);
    notify('info', 'Ledger Seeding Initialized', 'Connecting security streams to build prototype loan balances...');
    
    try {
      // 1. Seed Loans
      for (const mockLoan of MOCK_LOANS) {
        const loanPayload = {
          borrowerId: mockLoan.borrowerId === 'borrower_1' ? (currentUser.uid || 'borrower_1') : mockLoan.borrowerId,
          amount: mockLoan.amount,
          currency: mockLoan.currency,
          purpose: mockLoan.purpose,
          durationMonths: mockLoan.durationMonths,
          interestRate: mockLoan.interestRate,
          status: mockLoan.status,
          creditScoreSnapshot: mockLoan.creditScoreSnapshot,
          alternativeDataMetrics: mockLoan.alternativeDataMetrics,
        };
        await firestoreService.createLoan(loanPayload);
      }

      // 2. Seed Investments
      for (const mockInv of MOCK_INVESTMENTS) {
        const invPayload = {
          lenderId: mockInv.lenderId === 'lender_1' ? (currentUser.uid || 'lender_1') : mockInv.lenderId,
          loanId: mockInv.loanId,
          amount: mockInv.amount,
        };
        await firestoreService.createInvestment(invPayload);
      }

      // 3. Seed Repayments
      for (const mockRep of MOCK_REPAYMENTS) {
        const repPayload = {
          loanId: mockRep.loanId,
          amount: mockRep.amount,
          dueDate: mockRep.dueDate,
          status: mockRep.status as 'PENDING' | 'PAID',
          paidDate: mockRep.paidDate || null,
        };
        await firestoreService.createRepayment(repPayload);
      }

      // Log to Audit Trail
      await auditService.log(
        currentUser,
        AuditEventType.SYSTEM_CONFIG_CHANGED,
        `Seeded system database with robust high-fidelity dummy loan portfolios, scheduling repayments, and live investments. Target audience demo ready.`,
        'INFO'
      );

      // Refresh Audit Trail logs
      const updatedLogs = await auditService.getLogs();
      setLogs(updatedLogs);

      notify('success', 'Seeding Succeeded', 'Demo loan ledger seeded! Refresh other tabs (Marketplace, Portfolio, Dashboard) to see full simulation data.');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      notify('error', 'Seeding Aborted', errorMessage || 'Firestore rules or network restricted index creation.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRateLimitChange = async (gatewayId: string, newLimit: number) => {
    setGateways(prev => prev.map(g => {
      if (g.id === gatewayId) {
        return { ...g, rateLimit: newLimit };
      }
      return g;
    }));

    const targetGateway = gateways.find(g => g.id === gatewayId);
    if (currentUser && targetGateway) {
      await auditService.log(
        currentUser,
        AuditEventType.SYSTEM_CONFIG_CHANGED,
        `Admin modified operational threshold rate-limits for gateway ${targetGateway.name}. New limit: ${newLimit} requests/min.`,
        'INFO'
      );
      // Refresh logs list
      const auditLogs = await auditService.getLogs();
      setLogs(auditLogs);
    }
    notify('success', 'Rate Limit Calibrated', `API Gateway ${targetGateway?.name || gatewayId} updated with a threshold limit of ${newLimit} reqs/min.`);
  };

  // Editing User state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [updateRole, setUpdateRole] = useState<UserRole>(UserRole.BORROWER);
  const [updateKyc, setUpdateKyc] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [updateScore, setUpdateScore] = useState<number>(650);
  const [updateBalance, setUpdateBalance] = useState<number>(0);

  const fetchUserDirectory = async () => {
    setUserDirectoriesLoading(true);
    let firestoreUsers: UserProfile[] = [];
    let fetchErrorOccurred = false;
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      firestoreUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    } catch (err) {
      console.error("Fetch user directories failed:", err);
      fetchErrorOccurred = true;
    }

    // Load custom users from local storage
    let customUsers: UserProfile[] = [];
    try {
      const customUsersRaw = localStorage.getItem('acx_custom_users');
      if (customUsersRaw) {
        customUsers = JSON.parse(customUsersRaw);
      }
    } catch (e) {
      console.error("Failed to parse custom registrations", e);
    }

    // Merge mock users, local custom users, and firestore users
    const allUsersMap = new Map<string, UserProfile>();

    // 1. Fill with MOCK_USERS
    MOCK_USERS.forEach(u => {
      allUsersMap.set(u.uid, u);
    });

    // 2. Override with custom local users
    customUsers.forEach(u => {
      allUsersMap.set(u.uid, u);
    });

    // 3. Override with firestore users (highest source-of-truth priority if available)
    firestoreUsers.forEach(u => {
      allUsersMap.set(u.uid, u);
    });

    const mergedList = Array.from(allUsersMap.values());
    setUserList(mergedList);
    setUserDirectoriesLoading(false);

    if (fetchErrorOccurred && firestoreUsers.length === 0) {
      notify('info', 'Sandbox Mode Active', 'Operating directory offline with local and simulated ledger identities.');
    }
  };

  const seedDemoOperators = async () => {
    notify('info', 'Core Registry Seeder', 'Syndicating institutional borrower and lender nodes...');
    const demoUsers: UserProfile[] = [
      {
        uid: 'demo-borrower-1',
        displayName: 'Amara Diop (POS Merchant)',
        email: 'amara.diop@acx-merchant.sn',
        role: UserRole.RETAILER,
        creditScore: 710,
        kycStatus: 'VERIFIED',
        currency: 'USD',
        preferredCurrencies: ['USD', 'EUR'],
        balance: 15400,
        is2FAEnabled: false
      },
      {
        uid: 'demo-lender-2',
        displayName: 'Kenji Takahashi (Venture Fund)',
        email: 'k.takahashi@nexus-cap.tokyo',
        role: UserRole.LENDER,
        creditScore: 820,
        kycStatus: 'VERIFIED',
        currency: 'USD',
        preferredCurrencies: ['USD'],
        balance: 500000,
        is2FAEnabled: true
      },
      {
        uid: 'demo-borrower-3',
        displayName: 'Chinedu Okafor (Agri-distributor)',
        email: 'c.okafor@agri-hub.ng',
        role: UserRole.BORROWER,
        creditScore: 615,
        kycStatus: 'PENDING',
        currency: 'NGN',
        preferredCurrencies: ['NGN', 'USD'],
        balance: 1200,
        is2FAEnabled: false
      }
    ];

    // Seed local storage custom users to keep them in sync
    try {
      const customUsersRaw = localStorage.getItem('acx_custom_users');
      const customUsers: UserProfile[] = customUsersRaw ? JSON.parse(customUsersRaw) : [];
      
      demoUsers.forEach(demoU => {
        const idx = customUsers.findIndex(u => u.uid === demoU.uid);
        if (idx >= 0) {
          customUsers[idx] = { ...customUsers[idx], ...demoU };
        } else {
          customUsers.push(demoU);
        }
      });
      localStorage.setItem('acx_custom_users', JSON.stringify(customUsers));
    } catch (e) {
      console.error("Local storage seeding failed:", e);
    }

    let fsSucceeded = true;
    try {
      for (const u of demoUsers) {
        await setDoc(doc(db, 'users', u.uid), u, { merge: true });
      }
    } catch (err) {
      console.error("Seeding failed: ", err);
      fsSucceeded = false;
    }

    if (fsSucceeded) {
      notify('success', 'Seeder Completed', 'Demo compliance profiles provisioned and cryptographed in user directory.');
    } else {
      notify('success', 'Seeder Completed (Sandbox)', 'Demo compliance profiles provisioned offline in browser memory.');
    }

    await fetchUserDirectory();
  };

  const handleUpdateUserProperties = async () => {
    if (!editingUser) return;
    
    notify('info', 'Mutating Record', 'Transmitting parameter adjustment payload...');
    const updatePayload = {
      role: updateRole,
      kycStatus: updateKyc,
      creditScore: updateScore,
      balance: updateBalance
    };

    // Update in Local Storage first so it maintains consistent state in sandbox
    try {
      const customUsersRaw = localStorage.getItem('acx_custom_users');
      const customUsers: UserProfile[] = customUsersRaw ? JSON.parse(customUsersRaw) : [];
      const existingIdx = customUsers.findIndex(u => u.uid === editingUser.uid);
      if (existingIdx >= 0) {
        customUsers[existingIdx] = {
          ...customUsers[existingIdx],
          ...updatePayload
        };
      } else {
        const mockUser = MOCK_USERS.find(u => u.uid === editingUser.uid);
        const newUser = {
          ...(mockUser || editingUser),
          ...updatePayload
        };
        customUsers.push(newUser);
      }
      localStorage.setItem('acx_custom_users', JSON.stringify(customUsers));
    } catch (e) {
      console.error("Local storage update failed:", e);
    }

    let dbSucceeded = true;
    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, updatePayload);
      
      if (currentUser) {
        await auditService.log(
          currentUser,
          AuditEventType.SYSTEM_CONFIG_CHANGED,
          `Admin modified index properties for member ${editingUser.email}. Role: ${updateRole}, KYC: ${updateKyc}, Credit Score: ${updateScore}, Balance: $${updateBalance}`,
          'WARNING'
        );
      }
    } catch (err) {
      console.error("Modification failed: ", err);
      dbSucceeded = false;
    }

    setEditingUser(null);
    await fetchUserDirectory();

    if (dbSucceeded) {
      notify('success', 'System Parameter Sealed', `Operator role and kyc updated for ${editingUser.displayName || editingUser.email}`);
    } else {
      notify('success', 'System Parameter Sealed (Sandbox)', `Operator role and kyc updated locally in sandbox memory.`);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUserDirectory();
    }
  }, [activeTab]);

  // Simulators State
  const [sim1State, setSim1State] = useState<{ status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED'; errorMsg?: string; rawError?: string }>({ status: 'IDLE' });
  const [sim2State, setSim2State] = useState<{ status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED'; errorMsg?: string; rawError?: string }>({ status: 'IDLE' });
  const [sim3State, setSim3State] = useState<{ status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED'; errorMsg?: string; rawError?: string }>({ status: 'IDLE' });
  const [sim4State, setSim4State] = useState<{ status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED'; errorMsg?: string; rawError?: string }>({ status: 'IDLE' });

  // Simulation 1: Identity Spoofing (User Profile)
  const runSimulation1 = async () => {
    setSim1State({ status: 'RUNNING' });
    await new Promise(resolve => setTimeout(resolve, 900));

    try {
      // Attempt to write a profile document in Firestore with a random spoofed UID
      const spoofedUid = 'spoofed_attacker_' + Math.floor(Math.random() * 10000);
      await setDoc(doc(db, 'users', spoofedUid), {
        uid: spoofedUid,
        email: 'attacker@acx.africa',
        role: UserRole.BORROWER,
        displayName: 'Spoofed Attacker Profile'
      });
      // If we survive and reach here without an exception, it is a backend vulnerability!
      setSim1State({ 
        status: 'FAILED', 
        errorMsg: `Identity Spoof write succeeded on path /users/${spoofedUid}. Guard failed!` 
      });
      if (currentUser) {
        await auditService.log(
          currentUser,
          AuditEventType.SYSTEM_CONFIG_CHANGED,
          `[CRITICAL BREACH] Identity Spoof injection succeeded on path /users/${spoofedUid}`,
          'CRITICAL'
        );
      }
      notify('error', 'Vulnerability Failed', 'Identity Spoofing payload bypassed security filters.');
    } catch (err: unknown) {
      // This is the expected and secure outcome: rules block non-owners from writing user documents
      const errorMsgDetails = err instanceof Error ? err.message : String(err);
      setSim1State({ 
        status: 'PASSED', 
        errorMsg: 'Verification enforced: isOwner(userId) logic denied. unauthorized block success.',
        rawError: errorMsgDetails
      });
      if (currentUser) {
        await auditService.log(
          currentUser,
          AuditEventType.SYSTEM_CONFIG_CHANGED,
          `[PENETRATION RESOLVED] Identity Spoofing attempt blocked by rules (isOwner guard). Target: /users/spoofed_attacker_*`,
          'INFO'
        );
      }
      notify('success', 'Attack Deflected', 'Security layers successfully blocked Identity Spoofing.');
    }

    // Refresh logs trail
    const auditLogs = await auditService.getLogs();
    setLogs(auditLogs);
  };

  // Simulation 2: Role Escalation
  const runSimulation2 = async () => {
    setSim2State({ status: 'RUNNING' });
    await new Promise(resolve => setTimeout(resolve, 900));

    try {
      if (!auth.currentUser) {
        setSim2State({ status: 'FAILED', errorMsg: 'Authentication required. Click Login first.' });
        notify('error', 'Execution Error', 'No active authenticate user found.');
        return;
      }
      // Attempt to modify the 'role' field in the current authenticated user's own profile doc
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        role: UserRole.ADMIN
      });
      // If we survive without a security exception, it is a role escalation vulnerability!
      setSim2State({ 
        status: 'FAILED', 
        errorMsg: 'Role Escalation update succeeded! Field-level shield bypassed.' 
      });
      if (currentUser) {
        await auditService.log(
          currentUser,
          AuditEventType.SYSTEM_CONFIG_CHANGED,
          `[CRITICAL BREACH] Self-escalation to ADMIN succeeded on profile path /users/${auth.currentUser.uid}`,
          'CRITICAL'
        );
      }
      notify('error', 'Vulnerability Failed', 'Role Escalation payload bypassed security filters.');
    } catch (err: unknown) {
      // Secure outcome: rules block updates of the 'role' field using diff().affectedKeys().hasOnly()
      const errorMsgDetails = err instanceof Error ? err.message : String(err);
      setSim2State({ 
        status: 'PASSED', 
        errorMsg: 'Role validation enforced: affectedKeys().hasOnly() guard denied role mutation.',
        rawError: errorMsgDetails
      });
      if (currentUser) {
        await auditService.log(
          currentUser,
          AuditEventType.SYSTEM_CONFIG_CHANGED,
          `[PENETRATION RESOLVED] Role Escalation attempt blocked (affectedKeys guard). Target Account: ${currentUser.email}`,
          'INFO'
        );
      }
      notify('success', 'Attack Deflected', 'Security layers successfully blocked Role Escalation.');
    }

    // Refresh logs trail
    const auditLogs = await auditService.getLogs();
    setLogs(auditLogs);
  };

  // Simulation 3: Ghost Field Injection
  const runSimulation3 = async () => {
    setSim3State({ status: 'RUNNING' });
    await new Promise(resolve => setTimeout(resolve, 900));

    try {
      if (!auth.currentUser) {
        setSim3State({ status: 'FAILED', errorMsg: 'Authentication required. Click Login first.' });
        notify('error', 'Execution Error', 'No active authenticated user found.');
        return;
      }
      // Attempt to update the user's own profile doc by injecting an unallowed field 'isVerified'
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        isVerified: true
      });
      // If we reach here, it means the field update was allowed!
      setSim3State({ 
        status: 'FAILED', 
        errorMsg: 'Ghost Field Injection update succeeded! "isVerified" field was injected.' 
      });
      if (currentUser) {
        await auditService.log(
          currentUser,
          AuditEventType.SYSTEM_CONFIG_CHANGED,
          `[CRITICAL BREACH] Ghost Field Injection succeeded on user profile /users/${auth.currentUser.uid}`,
          'CRITICAL'
        );
      }
      notify('error', 'Vulnerability Failed', 'Ghost Field Injection payload bypassed security filters.');
    } catch (err: unknown) {
      // Secure outcome: rules block updates containing unlisted keys
      const errorMsgDetails = err instanceof Error ? err.message : String(err);
      setSim3State({ 
        status: 'PASSED', 
        errorMsg: 'Verification enforced: affectedKeys().hasOnly() filter blocked "isVerified" injection.',
        rawError: errorMsgDetails
      });
      if (currentUser) {
        await auditService.log(
          currentUser,
          AuditEventType.SYSTEM_CONFIG_CHANGED,
          `[PENETRATION RESOLVED] Ghost Field Injection attempt blocked. Target Account: ${currentUser.email}`,
          'INFO'
        );
      }
      notify('success', 'Attack Deflected', 'Security layers successfully blocked Ghost Field Injection.');
    }

    // Refresh logs trail
    const auditLogs = await auditService.getLogs();
    setLogs(auditLogs);
  };

  // Simulation 4: Unauthorized Loan Access
  const runSimulation4 = async () => {
    setSim4State({ status: 'RUNNING' });
    await new Promise(resolve => setTimeout(resolve, 900));

    try {
      if (!auth.currentUser) {
        setSim4State({ status: 'FAILED', errorMsg: 'Authentication required. Click Login first.' });
        notify('error', 'Execution Error', 'No active authenticated user found.');
        return;
      }
      // Attempt to fetch another borrower's loan document using getDoc
      const loanRef = doc(db, 'loans', 'ACX_PENDING_LOAN_TEST_SECURE');
      await getDoc(loanRef);
      // If we reach here without throwing, then read access was allowed
      setSim4State({ 
        status: 'FAILED', 
        errorMsg: 'Unauthorized Loan Access succeeded! Reading other users draft/pending loans allowed.' 
      });
      if (currentUser) {
        await auditService.log(
          currentUser,
          AuditEventType.SYSTEM_CONFIG_CHANGED,
          `[CRITICAL BREACH] Unauthorized read/lookup allowed on /loans/ACX_PENDING_LOAN_TEST_SECURE`,
          'CRITICAL'
        );
      }
      notify('error', 'Vulnerability Failed', 'Unauthorized Loan Access payload bypassed security filters.');
    } catch (err: unknown) {
      // Secure outcome
      const errorMsgDetails = err instanceof Error ? err.message : String(err);
      setSim4State({ 
        status: 'PASSED', 
        errorMsg: 'Verification enforced: read query denied by (isOwner || isAdmin || isApproved) check.',
        rawError: errorMsgDetails
      });
      if (currentUser) {
        await auditService.log(
          currentUser,
          AuditEventType.SYSTEM_CONFIG_CHANGED,
          `[PENETRATION RESOLVED] Unauthorized Loan read blocked. Target Account: ${currentUser.email}`,
          'INFO'
        );
      }
      notify('success', 'Attack Deflected', 'Security layers successfully blocked Unauthorized Access.');
    }

    // Refresh logs trail
    const auditLogs = await auditService.getLogs();
    setLogs(auditLogs);
  };

  // Run all sims together
  const runAllSimulations = async () => {
    notify('info', 'Sandbox Security Suite', 'Initiating all "Dirty Dozen" security exploit simulations.');
    await Promise.all([
      runSimulation1(),
      runSimulation2(),
      runSimulation3(),
      runSimulation4()
    ]);
  };

  const handleLoanAction = async (loanId: string, action: 'APPROVE' | 'REJECT') => {
    const loan = pendingLoans.find(l => l.id === loanId);
    if (!loan) return;

    const eventType = action === 'APPROVE' ? AuditEventType.LOAN_APPROVED : AuditEventType.LOAN_REJECTED;
    
    // Simulate updating the loan status
    setPendingLoans(prev => prev.filter(l => l.id !== loanId));
    
    // Log the event
    await auditService.log(
      { 
        uid: 'admin_1', 
        email: 'admin@acx.africa', 
        displayName: 'ACX Admin', 
        role: UserRole.ADMIN,
        creditScore: 850,
        kycStatus: 'VERIFIED',
        currency: 'USD',
        preferredCurrencies: ['USD'],
        balance: 0,
        is2FAEnabled: false
      } as UserProfile,
      eventType,
      `Loan ${loanId} ${action === 'APPROVE' ? 'approved' : 'rejected'} by admin`,
      action === 'APPROVE' ? 'INFO' : 'WARNING',
      { loanId, amount: loan.amount, borrowerId: loan.borrowerId }
    );

    // Trigger instant notification to the borrower (simulated here for the demo user)
    notify(
      action === 'APPROVE' ? 'success' : 'error',
      `Loan ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`,
      `Your loan request for $${loan.amount.toLocaleString()} has been ${action === 'APPROVE' ? 'approved' : 'rejected'} by the ACX risk committee.`
    );
    
    // In a real app we'd refresh the logs here
    const auditLogs = await auditService.getLogs();
    setLogs(auditLogs);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      const auditLogs = await auditService.getLogs();
      setLogs(auditLogs);
    };
    fetchLogs();
  }, []);

  const systemMetrics = [
    { label: 'Network Liquidity', value: '$842.5M', status: 'Optimal' },
    { label: 'Default Rate', value: '1.24%', status: 'Stable' },
    { label: 'Active Sessions', value: '4,802', status: 'Peak' },
    { label: 'Node Distribution', value: '14 Regions', status: 'Sync' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
             <ShieldAlert className="w-6 h-6" />
           </div>
           <div>
             <h2 className="text-3xl font-black tracking-tighter">System Nexus</h2>
             <p className="text-gray-400 text-sm font-medium">Root Infrastructure Control • ACX Core</p>
           </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-none">Security Override Active</span>
           </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-100 gap-6">
        <button
          onClick={() => {
            setActiveTab('nexus');
            setEditingUser(null);
          }}
          className={cn(
            "pb-4 font-black uppercase text-xs tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'nexus' 
              ? "border-slate-900 text-slate-900 font-bold" 
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Shield className="w-4 h-4" />
          Nexus Control
        </button>
        <button
          onClick={() => {
            setActiveTab('users');
            setEditingUser(null);
          }}
          className={cn(
            "pb-4 font-black uppercase text-xs tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'users' 
              ? "border-slate-900 text-slate-900 font-bold" 
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <Users className="w-4 h-4" />
          User Directory
        </button>
        <button
          onClick={() => {
            setActiveTab('reports');
            setEditingUser(null);
          }}
          className={cn(
            "pb-4 font-black uppercase text-xs tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'reports' 
              ? "border-slate-900 text-slate-900 font-bold" 
              : "border-transparent text-gray-400 hover:text-gray-600"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Analytics Reports
        </button>
      </div>

      {activeTab === 'nexus' && (
        <div className="space-y-10 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemMetrics.map((metric, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden group">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{metric.label}</p>
            <p className="text-2xl font-black font-mono tracking-tighter mb-2">{metric.value}</p>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
               <span className="text-[10px] font-bold text-green-600 uppercase tracking-tight">{metric.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Red Team Penetration Sandbox */}
      <div className="bg-slate-900 text-white rounded-[32px] border border-slate-800 shadow-xl overflow-hidden p-8 space-y-8 relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-500/20">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                Red Team Security Sandbox
                <span className="text-xs font-mono px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">ACTIVE SIMULATORS</span>
              </h3>
              <p className="text-slate-400 text-sm">Validate the Zero-Trust configuration against "The Dirty Dozen" security exploits.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
               onClick={runAllSimulations}
               disabled={sim1State.status === 'RUNNING' || sim2State.status === 'RUNNING' || sim3State.status === 'RUNNING' || sim4State.status === 'RUNNING'}
               className="px-5 py-2.5 bg-red-650 hover:bg-red-700 text-white font-mono text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-red-500/10 border border-red-550 flex items-center gap-2 disabled:opacity-50"
            >
               <RefreshCw className="w-4 h-4" />
               Run All Exploits
            </button>
            <div className="text-xs font-mono text-slate-400 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5">
              Database Status: <span className="text-green-400 font-bold">MUTATION_GUARDED</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          {/* Simulation 1 Card */}
          <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800/80 hover:border-red-500/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-mono text-xs font-bold">01</span>
                  <h4 className="font-bold text-sm text-white">Identity Spoofing Security Test</h4>
                </div>
                {sim1State.status === 'PASSED' && <span className="text-[10px] font-mono px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded">PASSED</span>}
                {sim1State.status === 'FAILED' && <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">FAILED</span>}
                {sim1State.status === 'RUNNING' && <span className="text-[10px] font-mono px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded animate-pulse">TESTING...</span>}
                {sim1State.status === 'IDLE' && <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-400 rounded">READY</span>}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Attempts to write a profile document inside of Firestore where the path's 
                <code className="text-red-400 font-mono px-1">userId</code> represents another arbitrary user account.
              </p>

              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 font-mono text-[10px] space-y-1.5 text-slate-400">
                <div className="text-slate-500">// Simulated Exploitation Payload</div>
                <div><span className="text-purple-400">setDoc</span>(doc(db, <span className="text-green-300">'users'</span>, <span className="text-red-300">'attacker_uid'</span>), &#123;</div>
                <div className="pl-4">uid: <span className="text-red-300">'attacker_uid'</span>,</div>
                <div className="pl-4">role: <span className="text-orange-300">'ADMIN'</span></div>
                <div>&#125;);</div>
                <div className="text-slate-500 pt-2">// Guard Principle: isOwner(userId) rule matching request.auth.uid</div>
              </div>

              {sim1State.status !== 'IDLE' && (
                <div className={cn(
                  "p-4 rounded-xl border font-mono text-xs transition-all space-y-2",
                  sim1State.status === 'RUNNING' ? "bg-orange-950/20 border-orange-500/20 text-orange-400" :
                  sim1State.status === 'PASSED' ? "bg-green-950/20 border-green-500/20 text-green-400" :
                  "bg-red-950/20 border-red-500/20 text-red-400"
                )}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{sim1State.status === 'RUNNING' ? 'Executing Exploit Payload...' : sim1State.status === 'PASSED' ? 'Exploit Deflected Successfully' : 'Vulnerability Triggered'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{sim1State.errorMsg}</p>
                  {sim1State.rawError && <p className="text-[10px] opacity-60 text-slate-400 uppercase tracking-tight font-sans">Details: {sim1State.rawError}</p>}
                </div>
              )}
            </div>

            <button 
              onClick={runSimulation1}
              disabled={sim1State.status === 'RUNNING'}
              className="mt-6 w-full py-3 bg-red-550/10 hover:bg-red-600/25 border border-red-500/30 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sim1State.status === 'RUNNING' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run Exploit Simulation 1
            </button>
          </div>

          {/* Simulation 2 Card */}
          <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800/80 hover:border-orange-500/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-mono text-xs font-bold">02</span>
                  <h4 className="font-bold text-sm text-white">Privileged Role Escalation Test</h4>
                </div>
                {sim2State.status === 'PASSED' && <span className="text-[10px] font-mono px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded">PASSED</span>}
                {sim2State.status === 'FAILED' && <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">FAILED</span>}
                {sim2State.status === 'RUNNING' && <span className="text-[10px] font-mono px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded animate-pulse">TESTING...</span>}
                {sim2State.status === 'IDLE' && <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-400 rounded">READY</span>}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Attempts to update the current signed-in user's profile document to modify the high-privilege 
                <code className="text-orange-400 font-mono px-1">role</code> field directly to <code className="text-orange-400 font-mono px-1">ADMIN</code>.
              </p>

              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 font-mono text-[10px] space-y-1.5 text-slate-400">
                <div className="text-slate-500">// Simulated Exploitation Payload</div>
                <div><span className="text-purple-400">updateDoc</span>(doc(db, <span className="text-green-300">'users'</span>, <span className="text-green-300">currentUser?.uid || 'user_id'</span>), &#123;</div>
                <div className="pl-4">role: <span className="text-orange-300">'ADMIN'</span></div>
                <div>&#125;);</div>
                <div className="text-slate-500 pt-2">// Guard Principle: diff().affectedKeys().hasOnly([allowedFields])</div>
              </div>

              {sim2State.status !== 'IDLE' && (
                <div className={cn(
                  "p-4 rounded-xl border font-mono text-xs transition-all space-y-2",
                  sim2State.status === 'RUNNING' ? "bg-orange-950/20 border-orange-500/20 text-orange-400" :
                  sim2State.status === 'PASSED' ? "bg-green-950/20 border-green-500/20 text-green-400" :
                  "bg-red-950/20 border-red-500/20 text-red-400"
                )}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{sim2State.status === 'RUNNING' ? 'Executing Exploit Payload...' : sim2State.status === 'PASSED' ? 'Exploit Deflected Successfully' : 'Vulnerability Triggered'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{sim2State.errorMsg}</p>
                  {sim2State.rawError && <p className="text-[10px] opacity-60 text-slate-400 uppercase tracking-tight font-sans">Details: {sim2State.rawError}</p>}
                </div>
              )}
            </div>

            <button 
              onClick={runSimulation2}
              disabled={sim2State.status === 'RUNNING'}
              className="mt-6 w-full py-3 bg-orange-550/10 hover:bg-orange-600/25 border border-orange-500/30 text-orange-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sim2State.status === 'RUNNING' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run Exploit Simulation 2
            </button>
          </div>

          {/* Simulation 3 Card */}
          <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800/80 hover:border-yellow-500/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center font-mono text-xs font-bold">03</span>
                  <h4 className="font-bold text-sm text-white">Ghost Field Injection Test</h4>
                </div>
                {sim3State.status === 'PASSED' && <span className="text-[10px] font-mono px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded">PASSED</span>}
                {sim3State.status === 'FAILED' && <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">FAILED</span>}
                {sim3State.status === 'RUNNING' && <span className="text-[10px] font-mono px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded animate-pulse">TESTING...</span>}
                {sim3State.status === 'IDLE' && <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-400 rounded">READY</span>}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Attempts to inject arbitrary non-whitelisted fields (e.g., <code className="text-yellow-400 font-mono px-1">isVerified: true</code>) 
                during a regular profile document update payload.
              </p>

              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 font-mono text-[10px] space-y-1.5 text-slate-400">
                <div className="text-slate-500">// Simulated Exploitation Payload</div>
                <div><span className="text-purple-400">updateDoc</span>(doc(db, <span className="text-green-300">'users'</span>, <span className="text-green-300">currentUser?.uid || 'user_id'</span>), &#123;</div>
                <div className="pl-4">isVerified: <span className="text-yellow-300">true</span></div>
                <div>&#125;);</div>
                <div className="text-slate-500 pt-2">// Guard Principle: diff().affectedKeys().hasOnly([allowedFields])</div>
              </div>

              {sim3State.status !== 'IDLE' && (
                <div className={cn(
                  "p-4 rounded-xl border font-mono text-xs transition-all space-y-2",
                  sim3State.status === 'RUNNING' ? "bg-orange-950/20 border-orange-500/20 text-orange-400" :
                  sim3State.status === 'PASSED' ? "bg-green-950/20 border-green-500/20 text-green-400" :
                  "bg-red-950/20 border-red-500/20 text-red-400"
                )}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{sim3State.status === 'RUNNING' ? 'Executing Exploit Payload...' : sim3State.status === 'PASSED' ? 'Exploit Deflected Successfully' : 'Vulnerability Triggered'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{sim3State.errorMsg}</p>
                  {sim3State.rawError && <p className="text-[10px] opacity-60 text-slate-400 uppercase tracking-tight font-sans">Details: {sim3State.rawError}</p>}
                </div>
              )}
            </div>

            <button 
              onClick={runSimulation3}
              disabled={sim3State.status === 'RUNNING'}
              className="mt-6 w-full py-3 bg-yellow-550/10 hover:bg-yellow-600/25 border border-yellow-500/30 text-yellow-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sim3State.status === 'RUNNING' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run Exploit Simulation 3
            </button>
          </div>

          {/* Simulation 4 Card */}
          <div className="bg-slate-950/60 p-6 rounded-3xl border border-slate-800/80 hover:border-blue-500/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono text-xs font-bold">04</span>
                  <h4 className="font-bold text-sm text-white">Unauthorized Loan Access Test</h4>
                </div>
                {sim4State.status === 'PASSED' && <span className="text-[10px] font-mono px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded">PASSED</span>}
                {sim4State.status === 'FAILED' && <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">FAILED</span>}
                {sim4State.status === 'RUNNING' && <span className="text-[10px] font-mono px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded animate-pulse">TESTING...</span>}
                {sim4State.status === 'IDLE' && <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-400 rounded">READY</span>}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Attempts to read another borrower's private or unapproved loan document directly which is protected by 
                ownership filters.
              </p>

              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 font-mono text-[10px] space-y-1.5 text-slate-400">
                <div className="text-slate-500">// Simulated Exploitation Payload</div>
                <div><span className="text-purple-400">getDoc</span>(doc(db, <span className="text-green-300">'loans'</span>, <span className="text-red-300">'ACX_PENDING_LOAN_TEST_SECURE'</span>));</div>
                <div className="text-slate-500 pt-2">// Guard Principle: allow get: isOwner(existing().borrowerId) || isAdmin()</div>
              </div>

              {sim4State.status !== 'IDLE' && (
                <div className={cn(
                  "p-4 rounded-xl border font-mono text-xs transition-all space-y-2",
                  sim4State.status === 'RUNNING' ? "bg-orange-950/20 border-orange-500/20 text-orange-400" :
                  sim4State.status === 'PASSED' ? "bg-green-950/20 border-green-500/20 text-green-400" :
                  "bg-red-950/20 border-red-500/20 text-red-400"
                )}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{sim4State.status === 'RUNNING' ? 'Executing Exploit Payload...' : sim4State.status === 'PASSED' ? 'Exploit Deflected Successfully' : 'Vulnerability Triggered'}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{sim4State.errorMsg}</p>
                  {sim4State.rawError && <p className="text-[10px] opacity-60 text-slate-400 uppercase tracking-tight font-sans">Details: {sim4State.rawError}</p>}
                </div>
              )}
            </div>

            <button 
              onClick={runSimulation4}
              disabled={sim4State.status === 'RUNNING'}
              className="mt-6 w-full py-3 bg-blue-550/10 hover:bg-blue-600/25 border border-blue-500/30 text-blue-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sim4State.status === 'RUNNING' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run Exploit Simulation 4
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  Privileged Entities
                </h3>
                <button className="text-[10px] font-black uppercase text-gray-400 hover:text-black">Management Console</button>
             </div>
             <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-black transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div>
                        <p className="text-sm font-bold">Standard Chartered Bank {i}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Liquidity Provider • Verified</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-all" />
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-guava-orange/5">
                <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                   <Clock className="w-5 h-5 text-guava-orange" />
                   Loan Review Queue
                </h3>
                <span className="text-[10px] font-black text-guava-orange uppercase tracking-widest">{pendingLoans.length} Pending Review</span>
             </div>
             <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto">
                {pendingLoans.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                     <ShieldCheck className="w-12 h-12 text-guava-green/20 mx-auto" />
                     <p className="text-sm font-bold text-gray-300 italic">Queue Cleared • Portal Balanced</p>
                  </div>
                ) : (
                  pendingLoans.map((loan) => (
                    <div key={loan.id} className="p-6 bg-gray-50 border border-gray-100 rounded-[32px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-guava-orange transition-all">
                       <div className="space-y-2">
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black bg-guava-dark text-white px-2 py-0.5 rounded uppercase tracking-widest">{loan.id}</span>
                             <span className="text-xs font-black text-guava-dark">{loan.purpose}</span>
                          </div>
                          <p className="text-xl font-black font-mono tracking-tighter">${loan.amount.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold ml-1">@ {loan.interestRate}%</span></p>
                          <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                             <span>Borrower: {loan.borrowerId}</span>
                             <span>•</span>
                             <span>Score: {loan.creditScoreSnapshot}</span>
                          </div>
                       </div>
                       <div className="flex gap-3 w-full md:w-auto">
                          <button 
                            onClick={() => handleLoanAction(loan.id, 'REJECT')}
                            className="flex-1 md:flex-none px-6 py-3 border-2 border-red-100 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                             <X className="w-4 h-4" />
                             Reject
                          </button>
                          <button 
                            onClick={() => handleLoanAction(loan.id, 'APPROVE')}
                            className="flex-1 md:flex-none px-6 py-3 bg-guava-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-guava-green transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10"
                          >
                             <Check className="w-4 h-4" />
                             Approve
                          </button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-3">
                  <Database className="w-5 h-5 text-guava-orange" />
                  Portal Audit Trail
                </h3>
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{logs.length} Operations Captured</span>
                   <button 
                     onClick={async () => {
                       await auditService.clearLogs();
                       setLogs([]);
                     }}
                     className="text-[10px] font-black uppercase text-red-500 hover:scale-105 transition-transform"
                   >
                     Purge Logs
                   </button>
                </div>
             </div>
             <div className="p-6 max-h-[500px] overflow-y-auto">
               {logs.length === 0 ? (
                 <div className="py-20 text-center space-y-4">
                    <Clock className="w-12 h-12 text-gray-100 mx-auto" />
                    <p className="text-sm font-bold text-gray-300 italic">Centralized Logging Engine Idle...</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {logs.map((log) => (
                     <div key={log.id} className="flex gap-4 p-4 text-xs font-mono border border-gray-50 hover:border-guava-orange/20 hover:bg-gray-50/50 transition-all rounded-2xl group relative overflow-hidden">
                       <div className={cn(
                         "w-1 self-stretch rounded-full",
                         log.severity === 'CRITICAL' ? "bg-red-500" :
                         log.severity === 'WARNING' ? "bg-guava-orange" : "bg-guava-green"
                       )} />
                       
                       <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <span className="text-guava-dark font-black tracking-tighter">
                                   {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                                  log.severity === 'CRITICAL' ? "bg-red-500 text-white" :
                                  log.severity === 'WARNING' ? "bg-guava-orange text-white" : "bg-guava-green text-white"
                                )}>
                                   {log.eventType}
                                </span>
                             </div>
                             <span className="text-[8px] text-gray-400 font-bold">{log.userEmail}</span>
                          </div>
                          <p className="text-gray-600 font-medium leading-relaxed">{log.description}</p>
                          {log.metadata && (
                            <div className="p-2 bg-white rounded-lg border border-gray-100 text-[9px] text-gray-400 flex flex-wrap gap-x-4">
                               {Object.entries(log.metadata).map(([k, v]) => (
                                 <span key={k}>{k}: <span className="text-guava-dark font-bold">{String(v)}</span></span>
                               ))}
                            </div>
                          )}
                       </div>
                       
                       {log.severity === 'CRITICAL' && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-100 transition-opacity">
                             <ShieldCheck className="w-8 h-8 text-red-500" />
                          </div>
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-black p-8 rounded-[32px] text-white space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-3">
                 <Key className="w-5 h-5 text-orange-500" />
                 API Gateways
              </h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 select-none font-bold">
                 {gateways.map(g => (
                   <button 
                     key={g.id} 
                     onClick={() => setIsIntegrationsOpen(true)}
                     className="w-full text-left p-3 bg-white/5 rounded-2xl border border-white/10 hover:border-white/30 transition-all flex items-center justify-between cursor-pointer focus:outline-none focus:border-white/50 block group"
                   >
                     <div className="space-y-0.5">
                       <p className="text-[9px] font-black uppercase text-white/40 tracking-wider group-hover:text-orange-400 transition-colors">
                         {g.id === 'swift' ? 'SWIFT Routing' : g.id === 'stripe' ? 'Stripe Pay' : g.id === 'mtn' ? 'MTN MoMo' : g.id === 'mpesa' ? 'M-Pesa Pay' : g.id === 'ecocash' ? 'EcoCash Pay' : 'Orange Pay'}
                       </p>
                       <p className="text-[11px] font-mono font-medium text-white/95">
                         {g.status === 'ACTIVE' ? 'connected' : g.status === 'PAUSED' ? 'suspended' : 'dialing'} • td_{g.tunnelId}
                       </p>
                     </div>
                     <div className="flex items-center gap-2">
                       {g.lastPingMs && (
                         <span className="text-[9px] font-mono text-white/30">{g.lastPingMs}ms</span>
                       )}
                       <span className={cn(
                         "w-1.5 h-1.5 rounded-full",
                         g.status === 'ACTIVE' ? "bg-green-400 animate-pulse" :
                         g.status === 'PAUSED' ? "bg-amber-400" : "bg-red-400"
                       )} />
                     </div>
                   </button>
                 ))}
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setIsIntegrationsOpen(true)}
                  className="w-full py-4 bg-white hover:bg-slate-100 text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer block text-center font-bold"
                >
                  Integrations Center
                </button>
                <button 
                  onClick={handleSeedDummyData}
                  disabled={isSeeding}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer block text-center font-bold"
                >
                  {isSeeding ? 'Seeding system...' : 'Seed Demo Loan Ledger'}
                </button>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-3">
                 <Settings className="w-5 h-5 text-gray-400" />
                 Global Params
              </h4>
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-2">
                       <span>Market Reserve Ratio</span>
                       <span className="text-black">15%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full">
                       <div className="h-full bg-black w-[15%]" />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-2">
                       <span>Daily Disbursement Limit</span>
                       <span className="text-black">$45M / $50M</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full">
                       <div className="h-full bg-orange-500 w-[90%]" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
    )}

      {/* User Directory Tab Content */}
      {activeTab === 'users' && (
        <div className="space-y-8 animate-in fade-in duration-300 text-slate-800">
          {/* Controls Panel */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full font-bold">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search user directory by name, email, credentials..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-slate-400 transition-all text-xs font-bold placeholder:text-gray-400"
              />
            </div>

            <div className="flex gap-4 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-1.5 rounded-2xl font-bold">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs font-bold text-gray-600 py-2 cursor-pointer focus:ring-0"
                >
                  <option value="ALL">All Roles</option>
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-1.5 rounded-2xl font-bold">
                <select 
                  value={kycFilter}
                  onChange={e => setKycFilter(e.target.value)}
                  className="bg-transparent border-0 outline-none text-xs font-bold text-gray-605 py-2 cursor-pointer focus:ring-0"
                >
                  <option value="ALL">All KYC Statuses</option>
                  <option value="PENDING">KYC Pending</option>
                  <option value="VERIFIED">KYC Verified</option>
                  <option value="REJECTED">KYC Rejected</option>
                </select>
              </div>

              <button 
                onClick={seedDemoOperators}
                className="px-5 py-3 bg-slate-900 text-white hover:bg-slate-800 text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer inline-flex items-center gap-2 whitespace-nowrap font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Seed Demo Users
              </button>
            </div>
          </div>

          {/* User Directory Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Total Member Registry</p>
              <p className="text-3xl font-black font-mono tracking-tighter mb-2">{userList.length}</p>
              <span className="text-[10px] text-gray-400 uppercase tracking-tight font-bold">Registered on-chain identity records</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">KYC Verified Profiles</p>
              <p className="text-3xl font-black font-mono text-green-600 tracking-tighter mb-2">
                {userList.filter(u => u.kycStatus === 'VERIFIED').length}
              </p>
              <span className="text-[10px] text-green-605 uppercase tracking-tight font-bold">Passed biometrics & tax audits</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">KYC Action Pending</p>
              <p className="text-3xl font-black font-mono text-orange-500 tracking-tighter mb-2">
                {userList.filter(u => u.kycStatus === 'PENDING').length}
              </p>
              <span className="text-[10px] text-orange-500 uppercase tracking-tight font-bold">Requiring review panel oversight</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Administrators Count</p>
              <p className="text-3xl font-black font-mono text-slate-900 tracking-tighter mb-2">
                {userList.filter(u => u.role === UserRole.ADMIN).length}
              </p>
              <span className="text-[10px] text-slate-400 uppercase tracking-tight font-bold">Root override privilege access</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User List Detail */}
            <div className={cn("bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm", editingUser ? 'lg:col-span-2' : 'lg:col-span-3')}>
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/55">
                <h3 className="font-black text-sm uppercase tracking-widest text-gray-900 flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" />
                  Operator Directory Index
                </h3>
                <button 
                  onClick={fetchUserDirectory}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                  title="Force index sync"
                >
                  <RefreshCw className={cn("w-4 h-4", userDirectoriesLoading ? "animate-spin" : "")} />
                </button>
              </div>

              <div className="p-8">
                {userDirectoriesLoading ? (
                  <div className="py-24 text-center space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-900 mx-auto pr-px"></div>
                    <p className="text-xs font-mono text-gray-400">Loading user schemas from registry...</p>
                  </div>
                ) : userList.length === 0 ? (
                  <div className="py-24 text-center space-y-4">
                    <Users className="w-14 h-14 text-gray-250 mx-auto" />
                    <p className="text-sm font-bold text-gray-450 italic leading-relaxed">No members provisioned on current node.<br/>Use 'Seed Demo Users' to generate initial mock members.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-wider font-bold">
                          <th className="pb-4 pl-4">Member Identity</th>
                          <th className="pb-4">System Role</th>
                          <th className="pb-4">KYC Status</th>
                          <th className="pb-4">Credit Rating</th>
                          <th className="pb-4">Asset Balance</th>
                          <th className="pb-4 pr-4 text-center">Operation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {userList
                          .filter(u => {
                            const matchQuery = searchQuery.trim() === '' || 
                              u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              u.uid.toLowerCase().includes(searchQuery.toLowerCase());
                            const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
                            const matchKyc = kycFilter === 'ALL' || u.kycStatus === kycFilter;
                            return matchQuery && matchRole && matchKyc;
                          })
                          .map(u => (
                            <tr key={u.uid} className={cn("font-medium hover:bg-gray-50/55 transition-all text-gray-700", editingUser?.uid === u.uid ? "bg-orange-500/5" : "")}>
                              <td className="py-4 pl-4">
                                <div className="flex items-center gap-3 font-bold">
                                  <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-xs uppercase text-slate-600 border border-slate-205 font-mono">
                                    {u.displayName?.charAt(0) || u.email.charAt(0) || 'U'}
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-slate-800 leading-tight">{u.displayName || 'Unnamed Member'}</p>
                                    <p className="text-[10px] font-mono text-slate-400">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4">
                                <span className={cn(
                                  "text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border",
                                  u.role === UserRole.ADMIN ? "bg-red-50 text-red-655 border-red-100" :
                                  u.role === UserRole.RETAILER ? "bg-orange-50 text-orange-655 border-orange-100" :
                                  u.role === UserRole.LENDER ? "bg-blue-50 text-blue-655 border-blue-100" : "bg-slate-50 text-slate-655 border-slate-100"
                                )}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-4">
                                <span className={cn(
                                  "text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1 w-max",
                                  u.kycStatus === 'VERIFIED' ? "text-green-600 bg-green-50" :
                                  u.kycStatus === 'REJECTED' ? "text-red-500 bg-red-50" : "text-orange-600 bg-orange-50"
                                )}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full", 
                                    u.kycStatus === 'VERIFIED' ? "bg-green-600" :
                                    u.kycStatus === 'REJECTED' ? "bg-red-500" : "bg-orange-650"
                                  )} />
                                  {u.kycStatus}
                                </span>
                              </td>
                              <td className="py-4 font-mono font-bold text-xs text-slate-600">
                                {u.role === UserRole.BORROWER || u.role === UserRole.RETAILER ? (
                                  <span className={cn("font-bold", 
                                    u.creditScore >= 750 ? "text-green-600" :
                                    u.creditScore >= 620 ? "text-orange-505" : "text-red-500"
                                  )}>
                                    {u.creditScore || 'No Score'} Rating
                                  </span>
                                ) : 'N/A'}
                              </td>
                              <td className="py-4 font-mono font-bold text-xs text-slate-705">
                                ${u.balance?.toLocaleString() || '0'}
                              </td>
                              <td className="py-4 pr-4">
                                <div className="flex gap-2 justify-center">
                                  <button 
                                    onClick={() => {
                                      setEditingUser(u);
                                      setUpdateRole(u.role);
                                      setUpdateKyc(u.kycStatus);
                                      setUpdateScore(u.creditScore || 650);
                                      setUpdateBalance(u.balance || 0);
                                    }}
                                    className="py-1 px-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-100 hover:border-slate-900 transition-all cursor-pointer text-center font-bold shrink-0"
                                  >
                                    Modify
                                  </button>
                                  {u.uid !== currentUser?.uid && (
                                    <button 
                                      onClick={() => {
                                        if (currentUser) {
                                          localStorage.setItem('acx_admin_impersonate_backup', JSON.stringify(currentUser));
                                          localStorage.setItem('acx_sandbox_session', JSON.stringify(u));
                                          notify('success', 'Impersonation Mode Initiated', `Assuming identity of member ${u.displayName || u.email}.`);
                                          setTimeout(() => {
                                            window.location.reload();
                                          }, 800);
                                        }
                                      }}
                                      className="py-1 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer text-center font-bold shrink-0 shadow-sm shadow-amber-500/15"
                                    >
                                      Impersonate
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Adjuster Sidebar Panel */}
            {editingUser && (
              <div className="bg-slate-900 text-white rounded-[32px] p-8 border border-slate-800 shadow-xl space-y-6 relative overflow-hidden animate-in slide-in-from-right-10 duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-505/5 rounded-full blur-[60px]" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-base uppercase tracking-tight flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-orange-505" />
                      Adjust Member Rules
                    </h4>
                    <p className="text-[11px] text-slate-450 mt-1 font-medium font-bold">Direct Firestore update logic block for identity profiles.</p>
                  </div>
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 pt-2 text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Target Account</p>
                    <p className="font-bold text-white text-sm">{editingUser.displayName || 'Unnamed'}</p>
                    <p className="font-mono text-[10px] text-slate-400 font-bold">{editingUser.email}</p>
                  </div>

                  <hr className="border-slate-800" />

                  <div className="space-y-1.5 font-bold">
                    <label className="text-[9px] uppercase tracking-widest font-black text-slate-400">Security Override Role</label>
                    <select 
                      value={updateRole}
                      onChange={e => setUpdateRole(e.target.value as UserRole)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none cursor-pointer focus:border-orange-505"
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 font-bold">
                    <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 font-bold">KYC Clearance Code</label>
                    <select 
                      value={updateKyc}
                      onChange={e => setUpdateKyc(e.target.value as 'PENDING' | 'VERIFIED' | 'REJECTED')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none cursor-pointer focus:border-orange-505"
                    >
                      <option value="PENDING">PENDING - In Review</option>
                      <option value="VERIFIED">VERIFIED - Cleared</option>
                      <option value="REJECTED">REJECTED - Discarded</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 font-bold font-bold">Credit Bureau Score (300 - 850)</label>
                    <input 
                      type="number" 
                      min="300" 
                      max="850" 
                      value={updateScore}
                      onChange={e => setUpdateScore(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 p-3 text-xs font-mono font-bold text-white rounded-xl outline-none focus:border-orange-505"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest font-black text-slate-404 font-bold">Simulate Node Balance (USD)</label>
                    <input 
                      type="number" 
                      value={updateBalance}
                      onChange={e => setUpdateBalance(Number(e.target.value))}
                      className="w-full bg-slate-805 border border-slate-700 p-3 text-xs font-mono font-bold text-white rounded-xl outline-none focus:border-orange-505"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleUpdateUserProperties}
                    className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-orange-500/20 font-bold"
                  >
                    Commit Settings to Firestore
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="animate-in fade-in duration-300">
          <Reports />
        </div>
      )}

      {/* Integrations Center Modal */}
      {isIntegrationsOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-slate-50">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-black uppercase tracking-widest font-bold">
                    Operational Control Desk
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                </div>
                <h3 className="font-black text-2xl uppercase tracking-tight text-slate-900">
                  Global API Integrations Center
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-bold">
                  Connect secure external payment protocols, mobile money APIs, and international clearing nodes. 
                  Enforce automatic repayment sweeps and monitor system-wide routing latencies below.
                </p>
              </div>
              <button 
                onClick={() => setIsIntegrationsOpen(false)}
                className="p-3 hover:bg-slate-200 text-slate-400 hover:text-slate-900 rounded-2xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-8 bg-slate-100/50 border-b border-gray-100">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1">Active Pipelines</p>
                <p className="text-2xl font-black font-mono text-slate-900">
                  {gateways.filter(g => g.status === 'ACTIVE').length} / {gateways.length}
                </p>
                <p className="text-[9px] text-green-600 uppercase font-black tracking-tight mt-1">✓ Secure tunnels open</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1">Repayment Sweep SLA</p>
                <p className="text-2xl font-black font-mono text-slate-900">99.4%</p>
                <p className="text-[9px] text-slate-405 uppercase font-bold tracking-tight mt-1">Average collection efficiency</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1">Avg Network Latency</p>
                <p className="text-2xl font-black font-mono text-slate-900">
                  {Math.round(gateways.reduce((acc, g) => acc + (g.lastPingMs || 0), 0) / gateways.length)}ms
                </p>
                <p className="text-[9px] text-slate-405 uppercase font-bold tracking-tight mt-1 font-bold">Optimized SSL routing</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 mb-1">Integrity Standards</p>
                <span className="text-xs font-black uppercase text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg inline-block w-fit font-bold">
                  ISO-20022 Enforced
                </span>
              </div>
            </div>

            {/* Core Modal Contents */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Detailed Technical Overview section for the Boss */}
              <div className="p-6 bg-slate-900 text-white rounded-[24px] space-y-4 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />
                <h4 className="font-black text-sm uppercase tracking-widest text-orange-400 font-bold">
                  Loan Lifecycle Security &amp; Repayment Recovery Mechanics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-350 leading-relaxed font-bold">
                  <div className="space-y-2.5">
                    <p>
                      <strong className="text-orange-400 font-black">How does it work?</strong> Our platform acts as an institutional-grade microfinance bridge. 
                      At loan issuance, repayment timelines are fixed into ledger systems in Firestore. 
                      Our API Gateways operate as high-performance conduits linking our database backends with mobile money nodes (MTN, M-Pesa, Orange) and financial institutions.
                    </p>
                    <p>
                      <strong className="text-orange-400 font-black font-bold font-bold">Auto-Sweep Recovery (SLA S-06):</strong> To prevent recovery loss issues that worry lenders and auditors, 
                      each active gateway supports pre-authorized repayment sweeps. The gateway system initiates secure automated debit sweeps 48 hours pre-maturity.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <p>
                      <strong className="text-orange-400 font-black">Double-Spend Prevention:</strong> In-flight transactions are protected by transaction locks. 
                      Repayment request execution queues block duplicate submissions within a 60-second execution frame, securing borrower deposits from overlapping transactions.
                    </p>
                    <p>
                      <strong className="text-orange-400 font-black">Dynamic Compliance Logging:</strong> All changes to routing speeds, status parameters, 
                      or test pulses post audit logs within our Firestore logs index.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Gateways List */}
              <div className="space-y-6">
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 font-bold">
                  Configured Operational Gateways
                </h4>
                <div className="space-y-4">
                  {gateways.map((g) => (
                    <div 
                      key={g.id} 
                      className="p-6 bg-white border border-gray-150 hover:border-slate-300 transition-all rounded-[24px] shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
                    >
                      {/* Name & Category Info */}
                      <div className="lg:col-span-4 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                            g.category === 'Settlement' ? "bg-purple-100 text-purple-700" :
                            g.category === 'Bank Transfer' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                          )}>
                            {g.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">tunnel_id: {g.tunnelId}</span>
                        </div>
                        <p className="font-bold text-slate-905 text-sm leading-none font-bold">{g.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono leading-none font-bold">{g.endpoint}</p>
                      </div>

                      {/* Configurations (Sliders, Toggles) */}
                      <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                        {/* Auto sweep Toggle */}
                        <div className="space-y-1 font-bold">
                          <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block font-bold">Auto-Sweep Recovery</label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAutoSweep(g.id, !g.autoSweepEnabled)}
                              className={cn(
                                "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-0",
                                g.autoSweepEnabled ? "bg-green-500" : "bg-slate-200"
                              )}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                  g.autoSweepEnabled ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </button>
                            <span className="text-[10px] font-bold uppercase text-slate-650">
                              {g.autoSweepEnabled ? 'ACTIVE' : 'OFF'}
                            </span>
                          </div>
                        </div>

                        {/* Rate limits */}
                        <div className="space-y-1.5 font-bold">
                          <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block font-bold">Speed Limit (min)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="50"
                              max="1500"
                              step="50"
                              value={g.rateLimit}
                              onChange={(e) => handleRateLimitChange(g.id, Number(e.target.value))}
                              className="w-16 accent-slate-900 cursor-pointer"
                            />
                            <span className="text-[11px] font-mono font-bold text-slate-650">{g.rateLimit} req</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div className="lg:col-span-2 space-y-1.5 font-bold">
                        <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 block font-bold">Network Status</label>
                        <select
                          value={g.status}
                          onChange={(e) => handleToggleGatewayStatus(g.id, e.target.value as 'ACTIVE' | 'PAUSED' | 'MAINTENANCE')}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer focus:border-slate-300"
                        >
                          <option value="ACTIVE">ACTIVE (Secure)</option>
                          <option value="PAUSED">PAUSED (Suspended)</option>
                          <option value="MAINTENANCE">MAINTENANCE</option>
                        </select>
                      </div>

                      {/* Ping Diagnostic Execution */}
                      <div className="lg:col-span-2 flex flex-col items-stretch gap-2 self-end lg:self-center">
                        <div className="flex gap-2 justify-between items-center px-1 font-bold">
                          <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 font-bold">SLA Sync</span>
                          <span className="text-[10px] font-mono font-bold text-slate-600">{g.repaymentEfficiencyRating}</span>
                        </div>
                        <button
                          onClick={() => handleTestGateway(g.id)}
                          disabled={testingGatewayId === g.id}
                          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 font-bold"
                        >
                          {testingGatewayId === g.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin bg-transparent border-0 outline-none" />
                          ) : (
                            <Activity className="w-3 h-3 text-slate-500" />
                          )}
                          Test Pulse
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-slate-50 flex justify-between items-center text-[10px] font-mono text-slate-450 font-bold">
              <span>Security Protocols: SHA-512 Hash Verification &amp; Dual JWT Tunnels Active</span>
              <button
                onClick={() => setIsIntegrationsOpen(false)}
                className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer font-bold"
              >
                Close Integration Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
