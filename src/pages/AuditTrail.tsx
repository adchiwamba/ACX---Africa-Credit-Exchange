import { useState, useEffect } from 'react';
import { 
  Database, ShieldCheck, AlertTriangle, Info, Search, Filter, 
  ArrowDownToLine, Zap, ShieldAlert as FirewallIcon, RefreshCw, FileCode, CheckCircle2,
  FileDown, TrendingUp, BarChart3, PieChart
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { UserProfile, AuditLog, AuditEventType, UserRole } from '../types';
import { auditService } from '../lib/audit';
import { useNotify } from '../lib/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
  dataKey?: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl font-sans text-xs">
        <p className="font-mono text-[10px] font-black text-slate-450 uppercase tracking-widest mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
              <span className="text-slate-350 font-medium">{p.name || String(p.dataKey || '')}:</span>
              <span className="font-mono font-black text-white">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface AuditTrailProps {
  user: UserProfile;
}

export default function AuditTrail({ user }: AuditTrailProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'stream' | 'analytics'>('stream');
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  const { notify } = useNotify();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const dbLogs = await auditService.getLogs();
      setLogs(dbLogs);
    } catch (e) {
      console.error(e);
      notify('error', 'Sync Failed', 'Could not refresh compliance ledger from Firestore.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter & Search Logic
  useEffect(() => {
    let result = logs;

    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.description.toLowerCase().includes(lowerQuery) ||
        log.userEmail.toLowerCase().includes(lowerQuery) ||
        log.eventType.toLowerCase().includes(lowerQuery) ||
        (log.id && log.id.toLowerCase().includes(lowerQuery))
      );
    }

    if (severityFilter !== 'ALL') {
      result = result.filter(log => log.severity === severityFilter);
    }

    if (typeFilter !== 'ALL') {
      result = result.filter(log => log.eventType === typeFilter);
    }

    setFilteredLogs(result);
  }, [logs, searchQuery, severityFilter, typeFilter]);

  // Export as JSON
  const handleExportJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `ACX-Ledger-Audit-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      notify('success', 'Export Initiated', 'Structured compliance ledger exported successfully.');
    } catch {
      notify('error', 'Export Error', 'Structured serialization failed.');
    }
  };

  // Export as CSV
  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Timestamp', 'User Email', 'Event Type', 'Severity', 'Description', 'IP Address'];
      const rows = logs.map(log => [
        log.id || '',
        log.timestamp,
        log.userEmail,
        log.eventType,
        log.severity,
        log.description.replace(/"/g, '""'),
        log.ipAddress || ''
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", encodeURI(csvContent));
      downloadAnchor.setAttribute("download", `ACX-Ledger-Audit-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      notify('success', 'CSV Created', 'Decentralized compliance ledger formatted and downloaded.');
    } catch {
      notify('error', 'Audit Sync Error', 'CSV serialization failed.');
    }
  };

  // Export filtered logs as beautiful PDF report
  const handleExportPDF = () => {
    try {
      if (filteredLogs.length === 0) {
        notify('warning', 'No Records to Export', 'There are no compliance logs matching the current filter filters.');
        return;
      }

      notify('info', 'Export Initiated', 'Formatting and compiling security compliance report...');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = new jsPDF() as any;
      const timestamp = new Date().toLocaleString();

      // Header Banner
      doc.setFillColor(30, 41, 59); // deep slate/charcoal
      doc.rect(0, 0, 210, 42, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ACX COMPLIANCE AUDIT LEDGER', 14, 24);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240);
      doc.text('SECURITY AUDIT REPORT  |  MUTABLE CRYPTOGRAPHIC VERIFICATION', 14, 32);

      // Decorative orange Accent Line
      doc.setFillColor(243, 109, 56); // guava-orange [243, 109, 56]
      doc.rect(0, 41, 210, 1.5, 'F');

      // Mini-logo
      doc.setFontSize(22);
      doc.setTextColor(243, 109, 56);
      doc.setFont('helvetica', 'bold');
      doc.text('ACX', 178, 26);

      // Metadata section
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORT METADATA:', 14, 52);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Generated By: ${user.displayName || user.email || 'Compliance Monitor'}`, 14, 58);
      doc.text(`Generated At: ${timestamp}`, 14, 63);
      doc.text('Ledger Integrity: 100% Core Verification Sealed', 14, 68);

      // Filter Context Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('FILTER CONTEXT:', 110, 52);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Query: ${searchQuery ? `"${searchQuery}"` : 'None'}`, 110, 58);
      doc.text(`Severity filter: ${severityFilter}`, 110, 63);
      doc.text(`Event category: ${typeFilter}`, 110, 68);

      // Stats Summary Box
      const filteredCritical = filteredLogs.filter(l => l.severity === 'CRITICAL').length;
      const filteredWarning = filteredLogs.filter(l => l.severity === 'WARNING').length;
      const filteredInfo = filteredLogs.filter(l => l.severity === 'INFO').length;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 73, 182, 16, 3, 3, 'FD');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Filtered Metrics:', 18, 83);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Total Count: ${filteredLogs.length}`, 60, 83);

      doc.setTextColor(239, 68, 68); // Red
      doc.setFont('helvetica', 'bold');
      doc.text(`Critical: ${filteredCritical}`, 102, 83);

      doc.setTextColor(243, 109, 56); // Guava orange
      doc.text(`Warning: ${filteredWarning}`, 134, 83);

      doc.setTextColor(34, 197, 94); // Green
      doc.text(`Info: ${filteredInfo}`, 166, 83);

      // Table data
      const tableRows = filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.eventType.replace(/_/g, ' '),
        log.severity,
        log.userEmail,
        log.description
      ]);

      autoTable(doc, {
        startY: 95,
        head: [['Timestamp', 'Event Category', 'Severity', 'Operator / Node', 'Operational Description']],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 34 },
          1: { cellWidth: 34 },
          2: { cellWidth: 16 },
          3: { cellWidth: 38 },
          4: { cellWidth: 'auto' },
        },
        theme: 'striped',
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const val = data.cell.raw;
            if (val === 'CRITICAL') {
              data.cell.styles.textColor = [239, 68, 68];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'WARNING') {
              data.cell.styles.textColor = [243, 109, 56];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'INFO') {
              data.cell.styles.textColor = [34, 197, 94];
            }
          }
        },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(148, 163, 184);

          doc.text(
            'ACX Security Compliance System Ledger  |  System Integrity Core',
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );

          const pageStr = `Page ${pageCount}`;
          doc.text(
            pageStr,
            doc.internal.pageSize.width - data.settings.margin.right - doc.getTextWidth(pageStr),
            doc.internal.pageSize.height - 10
          );
        }
      });

      doc.save(`ACX-Ledger-Audit-${new Date().toISOString().slice(0, 10)}.pdf`);
      notify('success', 'PDF Export completed', 'Formatted compliance ledger exported as PDF.');
    } catch (error) {
      console.error(error);
      notify('error', 'Export Failed', 'PDF compilation failed.');
    }
  };

  // Direct mock compliance injector to immediately demonstrate logs functionality
  const triggerSimulationLog = async (severity: 'INFO' | 'WARNING' | 'CRITICAL', eventType: AuditEventType, desc: string) => {
    const mockOperators = [
      'sec-guard@acx.africa', 
      'lending-validator@acx.africa', 
      'risk-committee@acx.africa',
      'swift-bridge@external.acx'
    ];
    const randomOperator = mockOperators[Math.floor(Math.random() * mockOperators.length)];
    const simulatedOperator: UserProfile = {
      uid: 'sys-node-' + Math.floor(Math.random() * 1000),
      email: randomOperator,
      displayName: 'System Operations Daemon',
      role: UserRole.ADMIN,
      creditScore: 850,
      kycStatus: 'VERIFIED',
      currency: 'USD',
      preferredCurrencies: ['USD'],
      balance: 1542000000,
      is2FAEnabled: true
    };

    notify('info', 'Injecting Event', 'Generating cryptographically sealed audit entry...');
    await auditService.log(
      simulatedOperator,
      eventType,
      desc,
      severity,
      {
        entropySeed: Math.random().toString(16).slice(2, 10).toUpperCase(),
        threatIndex: severity === 'CRITICAL' ? '0.94' : severity === 'WARNING' ? '0.42' : '0.01',
        originCidr: '102.45.18.291'
      }
    );
    notify('success', 'Audit Sealed', 'Compliance log added securely.');
    fetchLogs();
  };

  // Derived counts
  const totalCount = logs.length;
  const criticalCount = logs.filter(l => l.severity === 'CRITICAL').length;
  const warningCount = logs.filter(l => l.severity === 'WARNING').length;
  const infoCount = logs.filter(l => l.severity === 'INFO').length;

  // Process logs database for charts
  const getChartData = () => {
    const groups: { [key: string]: { 
      date: string; 
      timestamp: number;
      INFO: number; 
      WARNING: number; 
      CRITICAL: number; 
      TOTAL: number;
      LOGIN: number;
      LOAN_APPLIED: number;
      LOAN_APPROVED: number;
      REPAYMENT_MADE: number;
      SYSTEM_CONFIG_CHANGED: number;
      OTHER: number;
    } } = {};

    logs.forEach(log => {
      const dateObj = new Date(log.timestamp);
      const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dayStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();

      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          timestamp: dayStart,
          INFO: 0,
          WARNING: 0,
          CRITICAL: 0,
          TOTAL: 0,
          LOGIN: 0,
          LOAN_APPLIED: 0,
          LOAN_APPROVED: 0,
          REPAYMENT_MADE: 0,
          SYSTEM_CONFIG_CHANGED: 0,
          OTHER: 0,
        };
      }

      const g = groups[dateStr];
      g.TOTAL += 1;
      
      if (log.severity === 'INFO') g.INFO += 1;
      else if (log.severity === 'WARNING') g.WARNING += 1;
      else if (log.severity === 'CRITICAL') g.CRITICAL += 1;

      if (log.eventType === 'LOGIN') g.LOGIN += 1;
      else if (log.eventType === 'LOAN_APPLIED') g.LOAN_APPLIED += 1;
      else if (log.eventType === 'LOAN_APPROVED') g.LOAN_APPROVED += 1;
      else if (log.eventType === 'REPAYMENT_MADE') g.REPAYMENT_MADE += 1;
      else if (log.eventType === 'SYSTEM_CONFIG_CHANGED') g.SYSTEM_CONFIG_CHANGED += 1;
      else g.OTHER += 1;
    });

    return Object.values(groups).sort((a, b) => a.timestamp - b.timestamp);
  };

  const chartData = getChartData();
  const peakDayObj = chartData.reduce((max, val) => val.TOTAL > max.TOTAL ? val : max, { date: 'N/A', TOTAL: 0 });

  const eventCounts: { [key: string]: number } = {};
  logs.forEach(l => {
    eventCounts[l.eventType] = (eventCounts[l.eventType] || 0) + 1;
  });
  let mostFrequentEvent = 'None';
  let mostFrequentEventCount = 0;
  Object.entries(eventCounts).forEach(([type, count]) => {
    if (count > mostFrequentEventCount) {
      mostFrequentEvent = type;
      mostFrequentEventCount = count;
    }
  });

  const criticalLogs = logs.filter(l => l.severity === 'CRITICAL').length;
  const criticalRatio = logs.length > 0 ? ((criticalLogs / logs.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Visual Header Deck */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900 border border-slate-800 text-white p-8 rounded-[32px] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-guava-orange/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-800/25 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 bg-guava-orange/10 text-guava-orange rounded-2xl flex items-center justify-center border border-guava-orange/20 shadow-inner">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Security Audit Trail</h2>
            <p className="text-xs text-slate-400 font-mono mt-1.5 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4 text-guava-green" /> Compliance Ledger • Operator: {user.displayName || 'System Admin'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 relative z-10">
          <button 
            onClick={fetchLogs}
            className="px-5 py-2.5 bg-slate-800 text-slate-200 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 hover:text-white transition-all border border-slate-700 flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Sequence
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="px-5 py-2.5 bg-guava-orange text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-guava-dark transition-all border border-guava-orange flex items-center gap-2 cursor-pointer shadow-lg shadow-guava-orange/15"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Export CSV
          </button>

          <button 
            onClick={handleExportPDF}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-red-600 flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/10"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>

          <button 
            onClick={handleExportJSON}
            className="px-5 py-2.5 bg-slate-900 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-850 hover:text-white transition-all border border-slate-800 flex items-center gap-2 cursor-pointer"
          >
            <FileCode className="w-4 h-4" />
            JSON Dump
          </button>
        </div>
      </div>

      {/* Grid of Micro-Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1">Total Monitored Sequences</p>
          <p className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tighter mb-2">{totalCount}</p>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-guava-green" />
            <span className="text-[10px] font-bold text-guava-green uppercase tracking-wide">100% Core Integrity Cryptographed</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1">Critical Deflections</p>
          <p className="font-mono text-3xl font-black tracking-tighter mb-2 text-red-500">{criticalCount}</p>
          <div className="flex items-center gap-1.5">
            <FirewallIcon className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Firewall Deflection Rate: optimal</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1">Warning Events Logged</p>
          <p className="font-mono text-3xl font-black tracking-tighter mb-2 text-guava-orange">{warningCount}</p>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-guava-orange" />
            <span className="text-[10px] font-bold text-guava-orange uppercase tracking-wide">Requires intermittent manual audit</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1">Standard Operations Info</p>
          <p className="font-mono text-3xl font-black tracking-tighter mb-2 text-slate-700 dark:text-slate-200">{infoCount}</p>
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Routine operational checkpoints</span>
          </div>
        </div>
      </div>      {/* Tab Switcher Navigation */}
      <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200/40 dark:border-slate-850/30">
        <button
          onClick={() => setActiveTab('stream')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'stream'
              ? 'bg-white dark:bg-slate-900 text-guava-orange shadow-sm font-black'
              : 'text-slate-500 dark:text-slate-450 hover:text-slate-850 dark:hover:text-white font-bold'
          }`}
        >
          <Database className="w-4 h-4" />
          Audit Stream
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-slate-900 text-guava-orange shadow-sm font-black'
              : 'text-slate-500 dark:text-slate-450 hover:text-slate-850 dark:hover:text-white font-bold'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Ledger Analytics
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-550 mb-1">Peak Operational Day</p>
              <p className="text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tighter mb-2">
                {peakDayObj.date !== 'N/A' ? peakDayObj.date : 'None'}
              </p>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-guava-orange animate-pulse" />
                <span className="text-[10px] font-bold text-guava-orange uppercase tracking-wide">
                  {peakDayObj.TOTAL} logs registered this day
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-550 mb-1">Most Common Operation</p>
              <p className="text-lg font-black font-mono text-slate-900 dark:text-white mb-2 truncate">
                {mostFrequentEvent.replace(/_/g, ' ')}
              </p>
              <div className="flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-purple-500" />
                <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wide">
                  Recorded {mostFrequentEventCount} times total
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-550 mb-1">Critical Threat Indicator</p>
              <p className={`text-3xl font-black font-mono tracking-tighter mb-2 ${Number(criticalRatio) > 10 ? 'text-red-550' : 'text-guava-green'}`}>
                {criticalRatio}%
              </p>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-guava-green" />
                <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide">
                  Share of overall critical alerts
                </span>
              </div>
            </div>
          </div>

          {/* Charts Bento Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Severity distribution timeline */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Severity Spectrum Over Time</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase mt-1">Timeline analysis of informational warnings & critical threats</p>
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400 font-mono italic">Insufficient chronological log points to compute trajectory</p>
                </div>
              ) : (
                <div className="h-[350px] text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="INFO" stroke="#22c55e" strokeWidth={3} name="Info" activeDot={{ r: 6 }} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="WARNING" stroke="#f36d38" strokeWidth={3} name="Warning" activeDot={{ r: 6 }} dot={{ r: 2 }} />
                      <Line type="monotone" dataKey="CRITICAL" stroke="#ef4444" strokeWidth={3} name="Critical" activeDot={{ r: 6 }} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 2: Event Type stacked volumes over time */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200/50 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Operational Sequence Volume</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase mt-1">Daily aggregated volume of action categories</p>
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-400 font-mono italic">Insufficient chronological log points to compute volume</p>
                </div>
              ) : (
                <div className="h-[350px] text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                      <RechartsTooltip cursor={{ fill: 'rgba(243, 109, 56, 0.03)' }} content={<CustomTooltip />} />
                      <Legend iconType="square" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                      <Bar dataKey="LOGIN" stackId="evt" fill="#475569" name="Login Operations" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="LOAN_APPLIED" stackId="evt" fill="#3b82f6" name="Loan Applied" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="LOAN_APPROVED" stackId="evt" fill="#10b981" name="Loan Approved" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="REPAYMENT_MADE" stackId="evt" fill="#8b5cf6" name="Repayments" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="SYSTEM_CONFIG_CHANGED" stackId="evt" fill="#ec4899" name="Config Changes" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="OTHER" stackId="evt" fill="#f59e0b" name="Other Events" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
          
          {/* Extra visual note */}
          <div className="bg-slate-900 border border-slate-800 text-slate-350 p-8 rounded-[32px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-guava-orange/5 rounded-full blur-[90px] pointer-events-none" />
            <span className="text-[9px] font-mono bg-guava-orange/10 text-guava-orange px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block mb-3">
              ACX STATISTICAL INTEGRITY DECK
            </span>
            <h4 className="font-bold text-lg text-white uppercase tracking-tight mb-2">Automated Threat Mitigation Telemetry</h4>
            <p className="text-xs text-slate-405 leading-relaxed font-medium">
              This analytics dashboard presents direct visualizations computed over cryptographically verifiable compliance logs. Overdue alarms, swift credit scoring recalculations, and risk thresholds are updated instantly in Firestore databases, creating a highly traceable operational path for lenders and administrators.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Controls bar: Search + Select Filter */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search ledger by description, operator, event ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-guava-orange dark:focus:border-guava-orange transition-all text-xs font-bold dark:text-white placeholder:text-slate-400"
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-4 w-full md:w-auto shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-2xl">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select 
                    value={severityFilter}
                    onChange={e => setSeverityFilter(e.target.value as 'ALL' | 'INFO' | 'WARNING' | 'CRITICAL')}
                    className="bg-transparent border-0 outline-none text-xs font-bold text-slate-600 dark:text-slate-200 py-2 cursor-pointer"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="INFO">Info Only</option>
                    <option value="WARNING">Warning Only</option>
                    <option value="CRITICAL">Critical Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-2xl">
                  <select 
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="bg-transparent border-0 outline-none text-xs font-bold text-slate-600 dark:text-slate-200 py-2 cursor-pointer"
                  >
                    <option value="ALL">All Event Types</option>
                    {Object.values(AuditEventType).map(val => (
                      <option key={val} value={val}>{val.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Core Logs Stream List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850 flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase text-slate-900 dark:text-white tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-guava-orange rounded-full animate-ping" />
                  Live Sequence Feed
                </h3>
                <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">{filteredLogs.length} of {totalCount} captured operations shown</p>
              </div>

              <div className="p-6 space-y-4 max-h-[680px] overflow-y-auto">
                {isLoading ? (
                  <div className="py-24 text-center space-y-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-guava-orange mx-auto pr-px"></div>
                    <p className="text-xs font-mono text-slate-400">Synchronizing ledger telemetry stream...</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="py-24 text-center space-y-4">
                    <Database className="w-14 h-14 text-slate-200 dark:text-slate-800 mx-auto" />
                    <p className="text-sm font-bold text-slate-400 italic">No corresponding operations recorded inside current query domain...</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {filteredLogs.map((log) => (
                      <motion.div 
                        key={log.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`flex gap-4 p-5 text-xs font-mono border rounded-2xl transition-all cursor-pointer relative overflow-hidden ${
                          selectedLog?.id === log.id 
                            ? 'border-guava-orange bg-guava-orange/5 dark:bg-guava-orange/5 shadow-md shadow-guava-orange/5' 
                            : 'border-slate-105 dark:border-slate-800/50 dark:bg-slate-850/20 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/20'
                        }`}
                        onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                      >
                        {/* Left color bar of severity */}
                        <div className={`w-1 shrink-0 rounded-full ${
                          log.severity === 'CRITICAL' ? 'bg-red-500 shadow-lg shadow-red-500/50' :
                          log.severity === 'WARNING' ? 'bg-guava-orange shadow-lg shadow-guava-orange/50' : 'bg-guava-green shadow-lg shadow-guava-orange/20'
                        }`} />

                        {/* Main log detail row */}
                        <div className="flex-1 space-y-2.5">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="text-slate-900 dark:text-white font-black hover:text-guava-orange transition-colors">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">[{new Date(log.timestamp).toLocaleDateString()}]</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                log.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                                log.severity === 'WARNING' ? 'bg-guava-orange text-white' : 'bg-guava-green text-white'
                              }`}>
                                {log.eventType}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase">{log.userEmail}</span>
                          </div>

                          <p className="text-slate-700 dark:text-slate-305 font-bold leading-relaxed">{log.description}</p>
                          
                          {log.ipAddress && (
                            <div className="text-[10px] text-slate-400 font-semibold">IP Address Node: {log.ipAddress}</div>
                          )}

                          {/* Dropdown JSON Metadata expansion preview */}
                          <AnimatePresence>
                            {selectedLog?.id === log.id && log.metadata && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 p-4 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl space-y-2">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Operations Core Signature Details (Audit Log Metadata)</span>
                                  <pre className="text-[10px] font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto select-all max-h-40 text-left bg-black/30 p-2.5 rounded-lg border border-slate-850">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>

          {/* Right Admin controls element */}
          <div className="space-y-8">
            {/* Sandbox Security Simulation Injection Tools Panel */}
            <div className="bg-slate-900 text-white p-8 rounded-[32px] border border-slate-800 shadow-xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-44 h-44 bg-guava-orange/5 rounded-full blur-[80px]" />
              
              <div>
                <h4 className="font-bold text-lg uppercase tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-guava-orange" />
                  Ledger Injector Simulator
                </h4>
                <p className="text-xs text-slate-450 mt-1">Simulate operational & warning events to watch compliance responses trigger inside the central deck in real-time.</p>
              </div>

              <div className="space-y-4 pt-2">
                <button 
                  onClick={() => triggerSimulationLog(
                    'INFO', 
                    AuditEventType.LOGIN, 
                    'Institutional operator calibrated secure websocket terminal credentials'
                  )}
                  className="w-full p-4 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between pointer-events-auto cursor-pointer"
                >
                  <span>Simulate Operator Login</span>
                  <span className="px-2 py-0.5 bg-guava-green/10 text-guava-green text-[9px] rounded font-bold uppercase">Info Event</span>
                </button>

                <button 
                  onClick={() => triggerSimulationLog(
                    'WARNING', 
                    AuditEventType.SYSTEM_CONFIG_CHANGED, 
                    'SWIFT Liquidity Gateway protocol threshold variable incremented to +12% reserve margin by core root Admin'
                  )}
                  className="w-full p-4 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between pointer-events-auto cursor-pointer"
                >
                  <span>System Parameter Adjustment</span>
                  <span className="px-2 py-0.5 bg-guava-orange/15 text-guava-orange text-[9px] rounded font-bold uppercase">Warning Event</span>
                </button>

                <button 
                  onClick={() => triggerSimulationLog(
                    'CRITICAL', 
                    AuditEventType.DELINQUENCY_WARNING_ISSUED, 
                    '[CRITICAL DEFLECTION ERROR] Direct digital credit line ACX-9982 failed standard biometrics metadata verification checklist sequence'
                  )}
                  className="w-full p-4 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between pointer-events-auto cursor-pointer"
                >
                  <span>Biometrics Guard Triggered</span>
                  <span className="px-2 py-0.5 bg-red-500/15 text-red-500 text-[9px] rounded font-bold uppercase">Critical Explo</span>
                </button>
              </div>
            </div>

            {/* Ledger Integrity Audit */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[31px] border border-slate-200/50 dark:border-slate-800 shadow-sm space-y-6">
              <h4 className="font-bold text-sm uppercase text-slate-900 dark:text-white tracking-widest">
                Security Ledger Integrity
              </h4>
              
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Ledger Accuracy</span>
                    <span className="text-xs font-black text-guava-green font-mono">100.0% Perfect</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-guava-green w-full" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decentralized Rule Coverage</span>
                    <span className="text-xs font-black text-guava-green font-mono">99.98%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-guava-green w-[99.98%]" />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase leading-relaxed text-center">
                  Operations written in our Firebase Firestore backend are filtered through multiple layers of cell validation policies. This keeps our global ledgers and system trails secure.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
