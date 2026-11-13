import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Sliders,
  CheckCircle2,
  Ban,
  RotateCcw,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import {
  AIToolItem,
  DepartmentFilter,
  DepartmentName,
  DepartmentPolicy,
  PMRationalePinData,
} from '../types/governance';
import { PMRationaleBadge } from './PMRationaleBadge';

interface QuadrantAndQueueProps {
  tools: AIToolItem[];
  selectedDepartment: DepartmentFilter;
  departmentPolicies: Record<string, DepartmentPolicy>;
  onInspectTool: (tool: AIToolItem) => void;
  onOpenDeptPolicyModal: (dept: DepartmentName) => void;
  onApproveShadowTool: (toolId: string) => void;
  onBlockShadowTool: (toolId: string) => void;
  onUndoOtterAction: () => void;
  onReclaimJasperSeats: () => void;
  onUndoJasperReclaim: () => void;
  jasperReclaimed: boolean;
  otterActionState: 'pending' | 'approved' | 'blocked';
  showRationalePins: boolean;
  quadrantPin: PMRationalePinData;
  queueHighlightPulse: boolean;
  queueSectionRef: React.RefObject<HTMLDivElement>;
}

export const QuadrantAndQueue: React.FC<QuadrantAndQueueProps> = ({
  tools,
  selectedDepartment,
  departmentPolicies,
  onInspectTool,
  onOpenDeptPolicyModal,
  onApproveShadowTool,
  onBlockShadowTool,
  onUndoOtterAction,
  onReclaimJasperSeats,
  onUndoJasperReclaim,
  jasperReclaimed,
  otterActionState,
  showRationalePins,
  quadrantPin,
  queueHighlightPulse,
  queueSectionRef,
}) => {
  const [hoveredBubbleId, setHoveredBubbleId] = useState<string | null>(null);

  // Filter tools for the Sanctioned/Underutilized Seat Utilization vs Monthly Spend Quadrant
  // Per prompt: GitHub Copilot (88% util, $11.4k), OpenAI Enterprise (82%/89% util, $14.2k), Claude Team (76%/77% util, $5.8k), Jasper AI (18% util, $4.9k - highlighted amber), Notion AI (64%/79% util, $2.4k)
  const quadrantTools = tools.filter(
    (t) => t.status === 'Sanctioned' || t.status === 'Underutilized'
  );

  // Check if Engineering cap overrun is resolved
  const engPolicy = departmentPolicies['Engineering'];
  const engOverrunResolved =
    engPolicy && engPolicy.approvedCap >= engPolicy.projectedEomSpend;

  const activeAlertCount =
    (engOverrunResolved ? 0 : 1) +
    (otterActionState === 'pending' ? 1 : 0) +
    (jasperReclaimed ? 0 : 1);

  // Coordinate mapping for SVG viewBox (0 0 560 300)
  // Plot area: x from 58 to 536 (width 478), y from 24 to 256 (height 232)
  const plotLeft = 58;
  const plotRight = 536;
  const plotTop = 24;
  const plotBottom = 256;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const midX = plotLeft + plotWidth * 0.5;
  const midY = plotTop + plotHeight * 0.5;

  const getUtilPct = (tool: AIToolItem) => {
    // Use exact prompt visual percentages for clean separation while reflecting live seat reclamation
    if (tool.id === 'openai-enterprise') return 82;
    if (tool.id === 'github-copilot') return 88;
    if (tool.id === 'claude-team') return 76;
    if (tool.id === 'notion-ai') return 64;
    if (tool.id === 'jasper-ai') {
      return tool.paidSeats > 0 ? Math.round((tool.activeSeats / tool.paidSeats) * 100) : 18;
    }
    return tool.paidSeats > 0 ? Math.round((tool.activeSeats / tool.paidSeats) * 100) : 80;
  };

  return (
    <section
      aria-label="Seat Efficiency Quadrant and Governance Action Queue"
      className="grid grid-cols-1 lg:grid-cols-12 gap-5"
    >
      {/* LEFT (50% -> 6 cols): Seat Utilization vs. Monthly Spend (Sanctioned Tools) */}
      <div className="lg:col-span-6 bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 flex flex-col justify-between relative">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3.5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Seat Utilization vs. Monthly Spend (Sanctioned Tools)
                </h2>
                <PMRationaleBadge pin={quadrantPin} visible={showRationalePins} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                2×2 efficiency matrix isolating high-ROI core AI stack from reclaimable shelfware
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
                Healthy ROI
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] ring-2 ring-amber-200" />
                Shelfware Risk
              </span>
            </div>
          </div>

          {/* Custom Responsive SVG 2x2 Quadrant Scatter Plot */}
          <div className="relative mt-3 w-full">
            <svg
              viewBox="0 0 560 295"
              className="w-full h-auto overflow-visible select-none"
              role="img"
              aria-label="2x2 Quadrant Scatter Plot of Active Seat Utilization vs Monthly Spend"
            >
              {/* Top-Left Quadrant: Shelfware Risk (Reclaim) */}
              <rect
                x={plotLeft}
                y={plotTop}
                width={plotWidth / 2}
                height={plotHeight / 2}
                fill="#FFFBEB"
                fillOpacity="0.7"
              />
              {/* Top-Right Quadrant: High ROI Core Stack */}
              <rect
                x={midX}
                y={plotTop}
                width={plotWidth / 2}
                height={plotHeight / 2}
                fill="#EEF2FF"
                fillOpacity="0.55"
              />
              {/* Bottom-Left Quadrant: Under Evaluation */}
              <rect
                x={plotLeft}
                y={midY}
                width={plotWidth / 2}
                height={plotHeight / 2}
                fill="#F8FAFC"
              />
              {/* Bottom-Right Quadrant: High Adoption / Low Cost */}
              <rect
                x={midX}
                y={midY}
                width={plotWidth / 2}
                height={plotHeight / 2}
                fill="#ECFDF5"
                fillOpacity="0.45"
              />

              {/* Outer Plot Frame */}
              <rect
                x={plotLeft}
                y={plotTop}
                width={plotWidth}
                height={plotHeight}
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1"
                rx="6"
              />

              {/* Subtle Grid Lines */}
              {[0.25, 0.5, 0.75].map((pct) => (
                <React.Fragment key={pct}>
                  <line
                    x1={plotLeft + plotWidth * pct}
                    y1={plotTop}
                    x2={plotLeft + plotWidth * pct}
                    y2={plotBottom}
                    stroke={pct === 0.5 ? '#94A3B8' : '#E2E8F0'}
                    strokeWidth={pct === 0.5 ? '1.5' : '1'}
                    strokeDasharray={pct === 0.5 ? '4 4' : '2 2'}
                  />
                  <line
                    x1={plotLeft}
                    y1={plotTop + plotHeight * pct}
                    x2={plotRight}
                    y2={plotTop + plotHeight * pct}
                    stroke={pct === 0.5 ? '#94A3B8' : '#E2E8F0'}
                    strokeWidth={pct === 0.5 ? '1.5' : '1'}
                    strokeDasharray={pct === 0.5 ? '4 4' : '2 2'}
                  />
                </React.Fragment>
              ))}

              {/* Quadrant Watermark Labels */}
              <text
                x={plotLeft + 10}
                y={plotTop + 18}
                className="text-[10px] font-bold fill-amber-700 uppercase tracking-wider"
              >
                Shelfware Risk (Reclaim)
              </text>
              <text
                x={plotRight - 10}
                y={plotTop + 18}
                textAnchor="end"
                className="text-[10px] font-bold fill-indigo-700 uppercase tracking-wider"
              >
                High ROI Core Stack
              </text>
              <text
                x={plotLeft + 10}
                y={plotBottom - 10}
                className="text-[10px] font-semibold fill-slate-400 uppercase tracking-wider"
              >
                Under Evaluation
              </text>
              <text
                x={plotRight - 10}
                y={plotBottom - 10}
                textAnchor="end"
                className="text-[10px] font-bold fill-emerald-700 uppercase tracking-wider"
              >
                High Adoption / Low Cost
              </text>

              {/* Y-Axis Labels ($0 to $20k) */}
              {[
                { val: '$20k', y: plotTop + 4 },
                { val: '$15k', y: plotTop + plotHeight * 0.25 + 4 },
                { val: '$10k', y: midY + 4 },
                { val: '$5k', y: plotTop + plotHeight * 0.75 + 4 },
                { val: '$0', y: plotBottom },
              ].map((tick) => (
                <text
                  key={tick.val}
                  x={plotLeft - 8}
                  y={tick.y}
                  textAnchor="end"
                  className="text-[10px] font-mono fill-slate-500"
                >
                  {tick.val}
                </text>
              ))}

              {/* Y-Axis Title */}
              <text
                x="14"
                y={midY}
                textAnchor="middle"
                transform={`rotate(-90, 14, ${midY})`}
                className="text-[10px] font-semibold fill-slate-500"
              >
                Monthly Spend ($0 – $20k)
              </text>

              {/* X-Axis Labels (0% to 100%) */}
              {[
                { val: '0%', x: plotLeft },
                { val: '25%', x: plotLeft + plotWidth * 0.25 },
                { val: '50%', x: midX },
                { val: '75%', x: plotLeft + plotWidth * 0.75 },
                { val: '100%', x: plotRight },
              ].map((tick) => (
                <text
                  key={tick.val}
                  x={tick.x}
                  y={plotBottom + 16}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-slate-500"
                >
                  {tick.val}
                </text>
              ))}

              {/* X-Axis Title */}
              <text
                x={midX}
                y={plotBottom + 33}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-slate-500"
              >
                Active Seat Utilization % (0% to 100%)
              </text>

              {/* Plot Tool Bubbles */}
              {quadrantTools.map((tool) => {
                const utilPct = getUtilPct(tool);
                const spendClamped = Math.min(20000, Math.max(0, tool.monthlySpend));
                const cx = plotLeft + (utilPct / 100) * plotWidth;
                const cy = plotBottom - (spendClamped / 20000) * plotHeight;

                const isDeptMatch =
                  selectedDepartment === 'All Departments' ||
                  tool.department === selectedDepartment ||
                  tool.department === 'All Teams';
                const isUnderutilized = tool.status === 'Underutilized' || utilPct < 45;
                const isHovered = hoveredBubbleId === tool.id;
                const radius = Math.max(8, Math.min(16, 7 + Math.sqrt(tool.paidSeats) * 0.55));

                return (
                  <g
                    key={tool.id}
                    className="cursor-pointer transition-all duration-300"
                    style={{ opacity: isDeptMatch ? 1 : 0.3 }}
                    onMouseEnter={() => setHoveredBubbleId(tool.id)}
                    onMouseLeave={() => setHoveredBubbleId(null)}
                    onClick={() => onInspectTool(tool)}
                  >
                    {/* Outer Pulse Ring for Jasper AI when Underutilized */}
                    {isUnderutilized && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 6}
                        fill="#F59E0B"
                        fillOpacity="0.22"
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                        strokeDasharray="3 2"
                      />
                    )}

                    {/* Main Bubble */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? radius + 2.5 : radius}
                      fill={isUnderutilized ? '#F59E0B' : '#4F46E5'}
                      fillOpacity={isHovered ? '0.95' : '0.85'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />

                    {/* Tool Label Pill */}
                    <g
                      transform={`translate(${
                        utilPct > 83 ? cx - 8 : cx + radius + 5
                      }, ${cy + 3})`}
                    >
                      <text
                        textAnchor={utilPct > 83 ? 'end' : 'start'}
                        dx={utilPct > 83 ? -radius + 2 : 0}
                        className={`text-[10px] font-bold ${
                          isUnderutilized ? 'fill-amber-900' : 'fill-slate-800'
                        }`}
                      >
                        {tool.name} ({utilPct}%, ${(tool.monthlySpend / 1000).toFixed(1)}k)
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Floating Hover Tooltip for Scatter Plot */}
            {hoveredBubbleId && (() => {
              const tool = quadrantTools.find((t) => t.id === hoveredBubbleId);
              if (!tool) return null;
              const utilPct = getUtilPct(tool);
              return (
                <div className="absolute right-3 top-3 z-30 w-64 rounded-xl bg-slate-900 text-white p-3 shadow-xl border border-slate-700 pointer-events-none animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
                    <span className="text-xs font-bold">{tool.name}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        tool.status === 'Underutilized'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {tool.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active / Paid Seats:</span>
                      <span className="font-mono font-semibold">
                        {tool.activeSeats} / {tool.paidSeats} ({utilPct}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Spend:</span>
                      <span className="font-mono font-semibold">
                        ${tool.monthlySpend.toLocaleString()}/mo
                      </span>
                    </div>
                    {tool.reclaimableMonthlySavings > 0 && (
                      <div className="flex justify-between text-amber-300 font-semibold pt-1 border-t border-slate-800">
                        <span>Reclaimable Savings:</span>
                        <span className="font-mono">
                          ${tool.reclaimableMonthlySavings.toLocaleString()}/mo
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="mt-2 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Bubble size = provisioned license count • Click any bubble to inspect telemetry
          </span>
          <span className="font-semibold text-amber-700">
            {jasperReclaimed
              ? '✓ Jasper AI right-sized (66 seats reclaimed)'
              : '⚠ Jasper AI: 18% util ($4.9k/mo)'}
          </span>
        </div>
      </div>

      {/* RIGHT (50% -> 6 cols): Governance Action Queue (Workflow Triggers) */}
      <div
        ref={queueSectionRef}
        className={`lg:col-span-6 bg-white rounded-xl border shadow-xs p-5 flex flex-col justify-between transition-all duration-500 ${
          queueHighlightPulse
            ? 'border-indigo-500 ring-4 ring-indigo-500/20'
            : 'border-[#E2E8F0]'
        }`}
      >
        <div>
          {/* Queue Header */}
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3.5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Governance Action Queue (Workflow Triggers)
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    activeAlertCount > 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  {activeAlertCount} Active {activeAlertCount === 1 ? 'Trigger' : 'Triggers'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Prioritized FinOps & SecOps remediation workflows connected to Okta, Google OAuth & Slack
              </p>
            </div>
          </div>

          {/* 3 Prioritized Interactive Alert Cards */}
          <div className="mt-4 space-y-3">
            {/* ALERT CARD 1: Budget Overrun Warning */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                engOverrunResolved
                  ? 'bg-emerald-50/40 border-emerald-200/80'
                  : 'bg-amber-50/40 border-amber-200/90 hover:border-amber-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      engOverrunResolved
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {engOverrunResolved ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100/80 text-amber-800">
                        1 • Budget Overrun Warning
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Engineering • OpenAI API + Copilot
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mt-1">
                      {engOverrunResolved
                        ? `Engineering cap updated to $${engPolicy.approvedCap.toLocaleString()} (Covers $${engPolicy.projectedEomSpend.toLocaleString()} EOM forecast)`
                        : `Engineering projected to breach $${engPolicy.approvedCap.toLocaleString()} cap by Nov 23`}
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Current spend at{' '}
                      <strong className="font-mono text-slate-800">$22,560</strong> (94% of cap); EOM
                      run-rate forecasted at{' '}
                      <strong className="font-mono text-amber-800">
                        ${engPolicy.projectedEomSpend.toLocaleString()}
                      </strong>{' '}
                      due to GPT-4o token surge.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenDeptPolicyModal('Engineering')}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 shadow-2xs transition-all cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Adjust Cap
                </button>
              </div>
            </div>

            {/* ALERT CARD 2: Shadow AI Discovery */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                otterActionState === 'pending'
                  ? 'bg-rose-50/40 border-rose-200/90 hover:border-rose-300'
                  : otterActionState === 'approved'
                  ? 'bg-emerald-50/40 border-emerald-200/80'
                  : 'bg-slate-100/70 border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      otterActionState === 'pending'
                        ? 'bg-rose-100 text-rose-700'
                        : otterActionState === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {otterActionState === 'pending' ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : otterActionState === 'approved' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          otterActionState === 'pending'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        2 • Shadow AI Discovery
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Google Workspace OAuth Log
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mt-1">
                      {otterActionState === 'pending' &&
                        '8 Marketing & Sales users authorized Otter.ai via Google Workspace OAuth'}
                      {otterActionState === 'approved' &&
                        'Otter.ai sanctioned with $1,200/mo cap & migrated under Okta SSO'}
                      {otterActionState === 'blocked' &&
                        'Otter.ai OAuth tokens revoked across 8 Google Workspace accounts'}
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {otterActionState === 'pending'
                        ? 'Unvetted meeting bot granted calendar.readonly & external call recording permissions ($1,000/mo expensed).'
                        : otterActionState === 'approved'
                        ? 'DPA verification logged; Shadow AI Exposure reduced by $1,000/mo.'
                        : 'Google Admin API revoked OAuth grant ID #OA-8821; corporate card merchant blocked.'}
                    </p>
                  </div>
                </div>

                {otterActionState === 'pending' ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onApproveShadowTool('otter-ai')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => onBlockShadowTool('otter-ai')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 transition-all cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Block App
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onUndoOtterAction}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Undo
                  </button>
                )}
              </div>
            </div>

            {/* ALERT CARD 3: License Optimization */}
            <div
              className={`rounded-xl p-3.5 border transition-all ${
                jasperReclaimed
                  ? 'bg-emerald-50/50 border-emerald-200/90'
                  : 'bg-indigo-50/35 border-indigo-200/80 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      jasperReclaimed
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {jasperReclaimed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          jasperReclaimed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        3 • License Optimization
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        Okta SSO Activity Harvest
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 mt-1">
                      {jasperReclaimed
                        ? 'Reclaimed 66 inactive Jasper AI seats — $3,960/mo ($47,520/yr) harvested!'
                        : '66 of 80 Jasper AI seats inactive for >30 days'}
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {jasperReclaimed
                        ? 'Okta deprovisioning workflow completed. Jasper AI contract right-sized to 14 active Marketing seats ($940/mo).'
                        : 'Only 14 Marketing users logged in via Okta SSO since Oct 13. Auto-harvest deprovisions idle seats ahead of Dec 15 renewal.'}
                    </p>
                  </div>
                </div>

                {!jasperReclaimed ? (
                  <button
                    type="button"
                    onClick={onReclaimJasperSeats}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Reclaim $3,960/mo
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onUndoJasperReclaim}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Undo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Connected playbooks: Okta Deprovision • Google Admin OAuth Revoke • Brex Card Lock</span>
          <span className="font-semibold text-emerald-700">
            {jasperReclaimed ? 'Realized Savings: $3,960/mo' : 'Potential Savings: $4,120/mo'}
          </span>
        </div>
      </div>
    </section>
  );
};

