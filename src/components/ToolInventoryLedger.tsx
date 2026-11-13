import React, { useState } from 'react';
import {
  Search,
  Sliders,
  Sparkles,
  CheckCircle2,
  Ban,
  ShieldAlert,
  KeyRound,
  CreditCard,
  Terminal,
  Download,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import {
  AIToolItem,
  DepartmentFilter,
  PMRationalePinData,
} from '../types/governance';
import { PMRationaleBadge } from './PMRationaleBadge';

type LedgerTab = 'All Tools' | 'Sanctioned' | 'Shadow AI' | 'Underutilized';

interface ToolInventoryLedgerProps {
  tools: AIToolItem[];
  selectedDepartment: DepartmentFilter;
  onInspectTool: (tool: AIToolItem) => void;
  onOpenToolPolicyModal: (toolId: string) => void;
  onApproveShadowTool: (toolId: string) => void;
  onBlockShadowTool: (toolId: string) => void;
  onReclaimSeats: (toolId: string) => void;
  onExportCsv: () => void;
  showRationalePins: boolean;
  ledgerPin: PMRationalePinData;
}

export const ToolInventoryLedger: React.FC<ToolInventoryLedgerProps> = ({
  tools,
  selectedDepartment,
  onInspectTool,
  onOpenToolPolicyModal,
  onApproveShadowTool,
  onBlockShadowTool,
  onReclaimSeats,
  onExportCsv,
  showRationalePins,
  ledgerPin,
}) => {
  const [activeTab, setActiveTab] = useState<LedgerTab>('All Tools');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // First filter by top bar Department filter
  const departmentFilteredTools = tools.filter((tool) => {
    if (selectedDepartment === 'All Departments') return true;
    return tool.department === selectedDepartment || tool.department === 'All Teams';
  });

  // Tab counts based on department-filtered tools
  const counts = {
    'All Tools': departmentFilteredTools.length,
    Sanctioned: departmentFilteredTools.filter((t) => t.status === 'Sanctioned').length,
    'Shadow AI': departmentFilteredTools.filter((t) => t.status === 'Shadow AI').length,
    Underutilized: departmentFilteredTools.filter((t) => t.status === 'Underutilized').length,
  };

  // Apply tab & search filter
  const visibleTools = departmentFilteredTools.filter((tool) => {
    const matchesTab =
      activeTab === 'All Tools' ? true : tool.status === activeTab;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      tool.name.toLowerCase().includes(q) ||
      tool.vendor.toLowerCase().includes(q) ||
      tool.detectionSource.toLowerCase().includes(q) ||
      tool.department.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const getDetectionIcon = (sourceType: AIToolItem['sourceType']) => {
    switch (sourceType) {
      case 'Admin API':
        return <Terminal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
      case 'SSO / IdP':
        return <KeyRound className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'Card / Expense':
        return <CreditCard className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'OAuth Grant':
        return <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    }
  };

  return (
    <section
      aria-label="AI Tool Inventory and Governance Ledger"
      className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden"
    >
      {/* Top Header & Controls */}
      <div className="p-5 border-b border-slate-200/80 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2
                id="ledger-table-caption"
                className="text-sm font-bold text-slate-900 tracking-tight"
              >
                AI Tool Inventory & Governance Ledger
              </h2>
              <PMRationaleBadge pin={ledgerPin} visible={showRationalePins} />
              {selectedDepartment !== 'All Departments' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Filtered: {selectedDepartment} (includes All Teams shared tools)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified ledger correlating Direct Admin APIs, Okta SSO, Google Workspace OAuth grants & Brex/Ramp card feeds
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tool, source, dept..."
                aria-label="Search AI Tool Inventory"
                className="w-56 sm:w-64 rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/15 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Tabs (modern-web-guidance: tabs with role="tablist" & non-color underline shape) */}
        <div
          role="tablist"
          aria-label="Filter AI tools by governance status"
          className="flex items-center gap-1 border-b border-slate-200 -mb-5 pb-0 overflow-x-auto"
        >
          {(['All Tools', 'Sanctioned', 'Shadow AI', 'Underutilized'] as LedgerTab[]).map(
            (tab) => {
              const selected = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    selected
                      ? 'text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      selected
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : tab === 'Shadow AI' && counts['Shadow AI'] > 0
                        ? 'bg-rose-50 text-rose-700'
                        : tab === 'Underutilized' && counts['Underutilized'] > 0
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {counts[tab]}
                  </span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Responsive Table Wrapper (modern-web-guidance: responsive-table) */}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby="ledger-table-caption"
        className="table-wrapper"
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/95 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th scope="col" className="py-3 pl-5 pr-3 bg-slate-50/95">
                Tool Name & Vendor
              </th>
              <th scope="col" className="py-3 px-3 bg-slate-50/95">
                Governance Status
              </th>
              <th scope="col" className="py-3 px-3 bg-slate-50/95">
                Detection Source
              </th>
              <th scope="col" className="py-3 px-3 bg-slate-50/95">
                Department
              </th>
              <th scope="col" className="py-3 px-3 bg-slate-50/95">
                Active / Paid Seats
              </th>
              <th scope="col" className="py-3 px-3 bg-slate-50/95">
                Monthly Spend vs. Cap
              </th>
              <th scope="col" className="py-3 pl-3 pr-5 text-right bg-slate-50/95">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 text-xs">
            {visibleTools.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-500">
                  No AI tools match the active filter criteria.
                </td>
              </tr>
            ) : (
              visibleTools.map((tool) => {
                const seatPct =
                  tool.paidSeats > 0
                    ? Math.round((tool.activeSeats / tool.paidSeats) * 100)
                    : 0;
                const capPct =
                  tool.monthlyCap && tool.monthlyCap > 0
                    ? Math.round((tool.monthlySpend / tool.monthlyCap) * 100)
                    : null;

                return (
                  <tr
                    key={tool.id}
                    onClick={() => onInspectTool(tool)}
                    className={`group transition-colors cursor-pointer ${
                      tool.status === 'Blocked'
                        ? 'bg-slate-50/60 opacity-60'
                        : 'bg-white hover:bg-indigo-50/30'
                    }`}
                  >
                    {/* Sticky Row Header: Tool Name & Vendor */}
                    <th
                      scope="row"
                      className="py-3.5 pl-5 pr-3 font-normal bg-white group-hover:bg-indigo-50/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg ${tool.logoBg} ${tool.logoColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                        >
                          {tool.logoText}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="truncate">{tool.name}</span>
                            {tool.riskLevel === 'Critical' && tool.status === 'Shadow AI' && (
                              <span
                                title="Critical OAuth Scope Risk"
                                className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-100 text-rose-800"
                              >
                                High Risk
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {tool.vendor} • {tool.category}
                          </div>
                        </div>
                      </div>
                    </th>

                    {/* Governance Status Pill Badge */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          tool.status === 'Sanctioned'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : tool.status === 'Shadow AI'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : tool.status === 'Underutilized'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tool.status === 'Sanctioned'
                              ? 'bg-emerald-500'
                              : tool.status === 'Shadow AI'
                              ? 'bg-rose-500 animate-pulse'
                              : tool.status === 'Underutilized'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {tool.status}
                      </span>
                    </td>

                    {/* Detection Source */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 font-medium text-[11px]">
                        {getDetectionIcon(tool.sourceType)}
                        <span>{tool.detectionSource}</span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                        {tool.department}
                      </span>
                    </td>

                    {/* Active / Paid Seats */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-bold text-slate-900">
                            {tool.activeSeats}/{tool.paidSeats}
                          </span>
                          <span
                            className={`text-[11px] font-mono font-semibold ${
                              seatPct < 40
                                ? 'text-amber-600'
                                : seatPct >= 80
                                ? 'text-emerald-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {seatPct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              seatPct < 40
                                ? 'bg-amber-500'
                                : tool.status === 'Shadow AI'
                                ? 'bg-rose-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, seatPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Monthly Spend vs. Cap */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="w-44">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-bold text-slate-900">
                            ${tool.monthlySpend.toLocaleString()}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            /{' '}
                            {tool.monthlyCap ? (
                              `$${tool.monthlyCap.toLocaleString()}`
                            ) : (
                              <span className="text-rose-600 font-semibold">No Cap</span>
                            )}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              capPct === null
                                ? 'bg-rose-500'
                                : capPct >= 90
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{
                              width: `${capPct === null ? 100 : Math.min(100, capPct)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Action Column */}
                    <td
                      className="py-3.5 pl-3 pr-5 whitespace-nowrap text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {tool.status === 'Underutilized' && tool.reclaimableMonthlySavings > 0 ? (
                          <button
                            type="button"
                            onClick={() => onReclaimSeats(tool.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-500 text-white hover:bg-amber-600 shadow-2xs transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            Reclaim ${tool.reclaimableMonthlySavings.toLocaleString()}
                          </button>
                        ) : tool.status === 'Shadow AI' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onApproveShadowTool(tool.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Sanction
                            </button>
                            <button
                              type="button"
                              onClick={() => onBlockShadowTool(tool.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <Ban className="w-3 h-3" />
                              Block
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenToolPolicyModal(tool.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Sliders className="w-3 h-3 text-indigo-600" />
                            {tool.monthlyCap ? 'Adjust Cap' : 'Set Cap'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onInspectTool(tool)}
                          title={`Inspect ${tool.name} OAuth & Token Telemetry`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

