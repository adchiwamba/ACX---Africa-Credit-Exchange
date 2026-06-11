import React, { useState } from "react";
import { 
  X, 
  Printer, 
  CheckSquare, 
  Square, 
  Heading, 
  Layout, 
  AlignLeft, 
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    timeRange: string;
    assetClass: string;
    region: string;
    minResonance: number;
  };
  specComments: {
    id: string;
    section: string;
    author: string;
    comment: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
    date: string;
  }[];
  DATA_ALLOCATION: { category: string; amount: number; risk: string }[];
  DATA_LIQUIDITY_FLOW: { name: string; inflow: number; outflow: number; pool: number }[];
  DATA_COUNTRY_SPREAD: { name: string; value: number; growth: string; resonance: number }[];
}

export default function PrintReportModal({
  isOpen,
  onClose,
  filters,
  specComments,
  DATA_ALLOCATION,
  DATA_LIQUIDITY_FLOW,
  DATA_COUNTRY_SPREAD,
}: PrintReportModalProps) {
  // Toggle states for ledger segments to print
  const [includeCover, setIncludeCover] = useState(true);
  const [includeKPIs, setIncludeKPIs] = useState(true);
  const [includeAllocation, setIncludeAllocation] = useState(true);
  const [includeLiquidity, setIncludeLiquidity] = useState(true);
  const [includeGeographics, setIncludeGeographics] = useState(true);
  const [includeRiskAudit, setIncludeRiskAudit] = useState(true);
  const [includeFeedback, setIncludeFeedback] = useState(true);

  // Custom print-specific states
  const [paperSize, setPaperSize] = useState<"A4" | "Letter">("A4");
  const [fontFamily, setFontFamily] = useState<"Sans" | "Serif" | "Mono">("Sans");
  const [colorProfile, setColorProfile] = useState<"minimal" | "mono">("minimal");
  const [customMemo, setCustomMemo] = useState<string>(
    "Prepared for Quarterly Capital Suitability Meeting and Sovereign Board Audit."
  );

  const timestamp = "2026-06-10 13:29:14";
  const compiledBy = "adchiwamba@gmail.com";

  if (!isOpen) return null;

  // Handler for printing
  const handleTriggerPrint = () => {
    // We add a brief timeout to let the print frame layout stabilize if there are any pending updates
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const selectedFontClass = 
    fontFamily === "Sans" 
      ? "font-sans" 
      : fontFamily === "Serif" 
      ? "font-serif" 
      : "font-mono";

  const totalAllocationSum = DATA_ALLOCATION.reduce((acc, item) => acc + item.amount, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-start md:p-6 p-2 [scrollbar-width:thin]">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            /* Hide entire outer app structure during printing */
            #root, .fixed, .no-print, aside, nav, button, header {
              display: none !important;
              visibility: hidden !important;
            }
            /* Show ONLY our printable document block container */
            .acx-print-document-container {
              display: block !important;
              visibility: visible !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              box-shadow: none !important;
            }
            .acx-print-decor {
              display: block !important;
            }
            .print-page-break {
              page-break-before: always !important;
              break-before: page !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}} />

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl w-full max-w-7xl shadow-2xl flex flex-col lg:flex-row h-auto min-h-[85vh] lg:h-[90vh] overflow-hidden border border-slate-100"
        >
          {/* LEFT COLUMN: Controls & Selections (No-print element) */}
          <div className="w-full lg:w-96 bg-slate-50 border-r border-slate-100 p-6 flex flex-col justify-between overflow-y-auto [scrollbar-width:thin] no-print shrink-0">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-guava-orange flex items-center justify-center text-white">
                    <Printer className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">Print Ledger Manager</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Configure clean, printable layouts</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-200 border border-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Toggle Sections */}
              <div className="space-y-3.5">
                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                  <Layout className="w-3.5 h-3.5 text-slate-400" /> Print Segment Sequence
                </h4>
                
                <div className="space-y-2">
                  {[
                    { state: includeCover, setter: setIncludeCover, label: "Title cover sheet" },
                    { state: includeKPIs, setter: setIncludeKPIs, label: "Portfolio overview metrics" },
                    { state: includeAllocation, setter: setIncludeAllocation, label: "Asset Allocation Ledger Table" },
                    { state: includeLiquidity, setter: setIncludeLiquidity, label: "Liquidity Dynamics ledger" },
                    { state: includeGeographics, setter: setIncludeGeographics, label: "Regional Node metrics" },
                    { state: includeRiskAudit, setter: setIncludeRiskAudit, label: "Risk score metrics & Audit trail" },
                    { state: includeFeedback, setter: setIncludeFeedback, label: "Executive Sign-Off logs" },
                  ].map((seg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => seg.setter(!seg.state)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-150 rounded-xl text-left text-xs text-slate-700 font-semibold transition-colors"
                    >
                      {seg.state ? (
                        <CheckSquare className="w-3.5 h-3.5 text-guava-orange shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      )}
                      <span className="truncate">{seg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formatting & Controls */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                  <AlignLeft className="w-3.5 h-3.5" /> Style & Typography
                </h4>

                {/* Fonts */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 block ml-0.5">Typography Pairing</label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100/60 p-1 rounded-xl">
                    {(["Sans", "Serif", "Mono"] as const).map((font) => (
                      <button
                        key={font}
                        type="button"
                        onClick={() => setFontFamily(font)}
                        className={`py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          fontFamily === font ? "bg-white text-slate-800 shadow" : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {font}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ink profile */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 block ml-0.5">Ink Saver Profile</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100/60 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setColorProfile("minimal")}
                      className={`py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        colorProfile === "minimal" ? "bg-white text-slate-850 shadow" : "text-slate-400"
                      }`}
                    >
                      Minimal Slate
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorProfile("mono")}
                      className={`py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        colorProfile === "mono" ? "bg-white text-slate-850 shadow" : "text-slate-400"
                      }`}
                    >
                      Monochromatic
                    </button>
                  </div>
                </div>

                {/* Paper settings */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 block ml-0.5">Bound Target Format</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100/60 p-1 rounded-xl">
                    {(["A4", "Letter"] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setPaperSize(sz)}
                        className={`py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          paperSize === sz ? "bg-white text-slate-800 shadow" : "text-slate-400"
                        }`}
                      >
                        {sz} Ratio
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Annotations & Memo */}
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
                  <Heading className="w-3.5 h-3.5" /> Customs Memo Description
                </h4>
                <textarea
                  rows={2}
                  maxLength={160}
                  value={customMemo}
                  onChange={(e) => setCustomMemo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-[10px] font-semibold text-slate-600 outline-none focus:border-guava-orange"
                  placeholder="Insert review directives or audience scope..."
                />
                <span className="text-[8px] text-slate-400 font-bold block text-right mt-0.5">Limit 160 characters</span>
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handleTriggerPrint}
                className="w-full py-3.5 bg-slate-900 border border-slate-900 hover:bg-guava-orange hover:border-guava-orange text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Initialize Print</span>
              </button>
              <div className="text-[9px] text-slate-400 font-bold text-center">
                Uses the system dialogue configured for A4 portrait layout.
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Print Preview Sheet (Prism slate canvas layout) */}
          <div className="flex-grow bg-slate-100/80 p-6 overflow-y-auto flex flex-col items-center [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.1)_transparent]">
            {/* Header Badge */}
            <div className="w-full max-w-[820px] flex justify-between items-center mb-4 no-print">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">A4 Layout sheet preview</span>
              <span className="text-[9px] font-black text-guava-orange uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 100% vector scaling on paper
              </span>
            </div>

            {/* Simulated Printed Document Block container */}
            <div 
              className={`acx-print-document-container w-full max-w-[800px] bg-white border border-slate-200/90 shadow-lg text-slate-900 ${selectedFontClass} overflow-hidden p-10 md:p-14 space-y-12 transition-all`}
              style={{ minHeight: paperSize === "A4" ? "1120px" : "1030px" }}
            >
              {/* COVER PAGE (Optional) */}
              {includeCover && (
                <div className="relative border-b-4 border-slate-900 pb-12 flex flex-col justify-between min-h-[500px] md:min-h-[700px]">
                  <div>
                    {/* Top line branding */}
                    <div className="flex items-center justify-between mb-16">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded ${colorProfile === 'mono' ? 'bg-slate-900' : 'bg-orange-500'} flex items-center justify-center text-white text-[10px] font-black`}>
                          AC
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">ACX PORTAL LEDGERS</span>
                      </div>
                      <span className="text-[8px] font-mono font-bold tracking-wider text-slate-400 uppercase">CLASSIFIED: EXECUTIVE DIRECTIVE</span>
                    </div>

                    {/* Big Bold Title */}
                    <div className="space-y-4">
                      <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-none">
                        CONSOLIDATED FINANCIAL INTELLIGENCE REPORT
                      </h1>
                      <p className={`text-sm md:text-base font-medium ${colorProfile === 'mono' ? 'text-slate-600' : 'text-orange-500'} uppercase tracking-widest`}>
                        Ledgers, Allocations, Liquidity Swaps & Auditor Trails
                      </p>
                    </div>

                    {/* Custom note */}
                    {customMemo && (
                      <div className="mt-8 p-4 bg-slate-50 border-l-4 border-slate-500/30 text-xs text-slate-600 leading-relaxed font-medium">
                        <span className="font-black text-slate-800 uppercase block text-[9px] tracking-wider mb-1">Director Annotations & Directives:</span>
                        "{customMemo}"
                      </div>
                    )}
                  </div>

                  {/* Metadata Block card */}
                  <div className="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-100 p-6 rounded-2xl text-[10px] space-y-0.5">
                    <div>
                      <span className="text-slate-400 uppercase font-black text-[8px] tracking-widest block mb-0.5">Authorized Signee</span>
                      <span className="font-black text-slate-800 text-xs block">{compiledBy}</span>
                      <span className="text-slate-400 font-bold block mt-3">Distribution Channel</span>
                      <span className="font-bold text-slate-700 block">Sovereign Board Review / Internal Auditor</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-black text-[8px] tracking-widest block mb-0.5">Compile Date</span>
                      <span className="font-bold text-slate-800 block text-xs font-mono">{timestamp}</span>
                      <span className="text-slate-400 font-bold block mt-3">Audit Scope</span>
                      <span className="font-bold text-slate-700 block">System Verification v4.0</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Print layout break if cover included */}
              {includeCover && <div className="print-page-break" />}

              {/* REPORT OVERVIEW KPI / SUMMARY LEDGER */}
              {includeKPIs && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest m-0">Ledger Section 01</span>
                      <h2 className="text-lg font-black uppercase text-slate-800 tracking-tight">Executive Performance metrics</h2>
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 font-mono">Scope: {filters.timeRange}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/50">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Portfolio Assets</span>
                      <span className="text-xl font-black text-slate-900 block font-mono">$4.28M</span>
                      <span className="text-[9px] text-emerald-600 font-bold mt-1 block">MoM +18.2%</span>
                    </div>
                    <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/50">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Avg Credit Score</span>
                      <span className="text-xl font-black text-slate-900 block font-mono">742 pts</span>
                      <span className="text-[9px] text-slate-500 font-bold mt-1 block">Optimal Band</span>
                    </div>
                    <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/50">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Active Nodes</span>
                      <span className="text-xl font-black text-slate-900 block font-mono">124 nodes</span>
                      <span className="text-[9px] text-emerald-600 font-bold mt-1 block">MoM +3</span>
                    </div>
                    <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50/50">
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block mb-1">Risk Integrity</span>
                      <span className="text-xl font-black text-slate-900 block font-mono">98.4%</span>
                      <span className="text-[9px] text-emerald-605 font-bold text-emerald-600 mt-1 block">Certified</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ASSET ALLOCATION TABLE */}
              {includeAllocation && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest m-0">Ledger Section 02</span>
                      <h2 className="text-lg font-black uppercase text-slate-800 tracking-tight">Asset Allocation Ledger Table</h2>
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 font-mono">Total committed Portfolio: ${totalAllocationSum.toLocaleString()}</span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-350 text-slate-400 font-semibold text-[9px] uppercase tracking-wider">
                        <th className="py-2.5 pb-2 font-bold">Investment Category</th>
                        <th className="py-2.5 pb-2 pr-4 text-right font-bold w-32">Committed Volume</th>
                        <th className="py-2.5 pb-2 text-center font-bold w-28">Risk Class</th>
                        <th className="py-2.5 pb-2 text-right font-bold w-24">Ratio Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DATA_ALLOCATION.map((item, i) => (
                        <tr key={i} className="text-slate-700 font-semibold text-xs">
                          <td className="py-3 font-bold text-slate-900">{item.category}</td>
                          <td className="py-3 pr-4 text-right font-mono text-slate-800">${item.amount.toLocaleString()}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              item.risk === "Low" 
                                ? "bg-slate-100 text-slate-700 border border-slate-250 animate-none" 
                                : item.risk === "Medium"
                                ? "bg-slate-100/80 text-slate-800 border border-slate-200"
                                : "bg-slate-200/50 text-slate-900 border border-slate-300"
                            }`}>
                              {item.risk} Risk Profile
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-slate-800">
                            {Math.round((item.amount / totalAllocationSum) * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-900 text-slate-900 font-black text-xs">
                        <td className="py-3 text-left">Aggregated Balance Commitments</td>
                        <td className="py-3 pr-4 text-right font-mono">${totalAllocationSum.toLocaleString()}</td>
                        <td className="py-3"></td>
                        <td className="py-3 text-right font-mono">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* LIQUIDITY DYNAMICS LEDGER */}
              {includeLiquidity && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest m-0">Ledger Section 03</span>
                      <h2 className="text-lg font-black uppercase text-slate-800 tracking-tight">Liquidity Flow statement</h2>
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 font-mono">Unit: Thousands (k) USD</span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-350 text-slate-400 font-semibold text-[9px] uppercase tracking-wider">
                        <th className="py-2.5 pb-2 font-bold">Month Segment</th>
                        <th className="py-2.5 pb-2 text-right font-bold w-28">Monthly Inflow</th>
                        <th className="py-2.5 pb-2 text-right font-bold w-28">Monthly Outflow</th>
                        <th className="py-2.5 pb-2 text-right font-bold w-28">Net Liquidity Pool</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DATA_LIQUIDITY_FLOW.map((flow, i) => (
                        <tr key={i} className="text-slate-700 font-semibold text-xs">
                          <td className="py-2.5 font-bold text-slate-900">{flow.name}</td>
                          <td className="py-2.5 text-right font-mono text-slate-800">${flow.inflow}k</td>
                          <td className="py-2.5 text-right font-mono text-slate-800">${flow.outflow}k</td>
                          <td className="py-2.5 text-right font-mono text-slate-900 font-bold">${flow.pool.toLocaleString()}k</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-medium">
                    <span className="font-black text-slate-800 inline-block mr-1">Ledger Notice:</span>
                    Current available surplus reserve accounts match liquidity parameters with a standard margin offset representing 18.2% safety threshold bounds.
                  </div>
                </div>
              )}

              {/* print break if necessary to guarantee table doesn't crack */}
              {(includeAllocation || includeLiquidity) && <div className="print-page-break" />}

              {/* REGIONAL GEOGRAPHICS NODE DISTRIBUTIONS */}
              {includeGeographics && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest m-0">Ledger Section 04</span>
                      <h2 className="text-lg font-black uppercase text-slate-800 tracking-tight">Geographical Expansion Spread Ledger</h2>
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 font-mono">Jurisdiction Drilldown</span>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-350 text-slate-400 font-semibold text-[9px] uppercase tracking-wider">
                        <th className="py-2.5 pb-2 font-bold">Country Node Jurisdiction</th>
                        <th className="py-2.5 pb-2 text-right font-bold w-32">Activity Share</th>
                        <th className="py-2.5 pb-2 text-right font-bold w-32">Resonance score Score</th>
                        <th className="py-2.5 pb-2 text-right font-bold w-32">MoM Growth Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {DATA_COUNTRY_SPREAD.map((country, i) => (
                        <tr key={i} className="text-slate-700 font-semibold text-xs">
                          <td className="py-3 font-bold text-slate-900">{country.name}</td>
                          <td className="py-3 text-right font-mono text-slate-800">{country.value}%</td>
                          <td className="py-3 text-right font-mono text-slate-900 font-bold">{country.resonance} pts</td>
                          <td className="py-3 text-right font-mono text-emerald-700 font-bold">{country.growth}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RISK SEGMENTS AND EVENT AUDIT TRAIL */}
              {includeRiskAudit && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest m-0">Ledger Section 05</span>
                      <h2 className="text-lg font-black uppercase text-slate-800 tracking-tight">Sovereign Risk Segment & Events Ledger</h2>
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 font-mono">System Defaults Index: 1.2%</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 border border-slate-150 rounded-xl bg-slate-50/50">
                      <span className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">Aggregated Defaults</span>
                      <span className="text-sm font-black text-slate-900 font-mono block">1.2%</span>
                      <span className="text-[7px] text-slate-400 font-bold">Target limit &lt; 2.0%</span>
                    </div>
                    <div className="p-3 border border-slate-150 rounded-xl bg-slate-50/50">
                      <span className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">Collateral Balance ratio</span>
                      <span className="text-sm font-black text-slate-900 font-mono block">142%</span>
                      <span className="text-[7px] text-slate-400 font-bold">Target limit &gt; 120%</span>
                    </div>
                    <div className="p-3 border border-slate-150 rounded-xl bg-slate-50/50">
                      <span className="text-[8px] font-black uppercase text-slate-400 block mb-0.5">Recoup Response Node</span>
                      <span className="text-sm font-black text-slate-900 font-mono block">14ms</span>
                      <span className="text-[7px] text-slate-400 font-bold">Target SLA &lt; 20ms</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Active Security Event Audit Trail</h4>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold text-[8px] uppercase">
                          <th className="py-2 pb-1.5">Node Event Log</th>
                          <th className="py-2 pb-1.5 w-32">Region node</th>
                          <th className="py-2 pb-1.5 text-center w-28">Implication</th>
                          <th className="py-2 pb-1.5 text-right w-24">Recorded Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { event: "Resonance Shift Detected", region: "Nigeria/Node-04", impact: "Negligible", time: "14 mins ago" },
                          { event: "Collateral Re-validation", region: "Global", impact: "Systemic", time: "2 hours ago" },
                          { event: "Liquidation Automated", region: "Kenya/Node-12", impact: "Isolated", time: "5 hours ago" },
                          { event: "New Institutional Onboarding", region: "South Africa", impact: "Positive", time: "Yesterday" },
                        ].map((event, idx) => (
                          <tr key={idx} className="text-slate-600 font-medium text-[11px]">
                            <td className="py-2 font-bold text-slate-800">{event.event}</td>
                            <td className="py-2">{event.region}</td>
                            <td className="py-2 text-center">
                              <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-slate-100 rounded border border-slate-150">
                                {event.impact}
                              </span>
                            </td>
                            <td className="py-2 text-right font-mono text-slate-400">{event.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* EXECUTIVE COMMENTS SIGN-OFF */}
              {includeFeedback && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest m-0">Ledger Section 06</span>
                      <h2 className="text-lg font-black uppercase text-slate-800 tracking-tight">Director Clearance & Sign-Off logs</h2>
                    </div>
                    <span className="text-[9px] font-medium text-slate-400 font-mono">Active directives: {specComments.length}</span>
                  </div>

                  {specComments.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-xl border border-slate-100/60 text-center font-bold text-xs text-slate-500 animate-none">
                      UNANIMOUS APPROVAL: System operational boundaries fully cleared by Director Panel. No outstanding corrections recorded.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {specComments.map((c) => (
                        <div key={c.id} className="p-3.5 border border-slate-150 rounded-xl bg-slate-50/40 text-[11px] space-y-1.5">
                          <div className="flex justify-between items-center text-[9px] uppercase font-black text-slate-400">
                            <span>Topic: {c.section}</span>
                            <span className={`px-1.5 py-0.5 rounded ${
                              c.priority === 'critical' ? 'bg-red-50 text-red-700 border border-red-200/50' : 'bg-slate-150 text-slate-800'
                            }`}>{c.priority} priority</span>
                          </div>
                          <p className="text-slate-700 italic leading-relaxed font-semibold">
                            "{c.comment}"
                          </p>
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 pt-1.5 border-t border-slate-100">
                            <span className="text-slate-800 font-black">{c.author}</span>
                            <span className="font-mono flex items-center gap-1">
                              {c.resolved ? "✓ Cleared" : "⌛ Pending Resolution"} | {c.date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Operational verification sign blocks */}
                  <div className="pt-8 grid grid-cols-2 gap-12 text-[10px] select-none text-slate-600 font-semibold">
                    <div className="space-y-4">
                      <span className="border-b border-slate-300 block w-full h-8" />
                      <div className="text-center">
                        <span className="font-black text-slate-800 block">Sovereign Risk Chief Inspector</span>
                        <span className="text-slate-400 text-[8px] font-bold font-mono">ACX COMPLIANCE GROUP SEC-4</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <span className="border-b border-slate-300 block w-full h-8" />
                      <div className="text-center">
                        <span className="font-black text-slate-800 block">Chief Operations Officer</span>
                        <span className="text-slate-400 text-[8px] font-bold font-mono">AUTHENTICITY SIGNED ON PORTAL</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
