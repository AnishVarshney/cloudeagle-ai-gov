import React, { useState, useMemo, useRef } from 'react';
import {
  Shield,
  Sliders,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Users,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Building2,
  ArrowDownRight,
  RotateCcw,
  X,
  Info,
} from 'lucide-react';
import {
  AIToolItem,
  DepartmentFilter,
  DepartmentName,
  DepartmentPolicy,
  TimeframeKey,
  ToastMessage,
} from './types/governance';
import {
  INITIAL_DEPARTMENT_POLICIES,
  INITIAL_TOOLS,
  PM_RATIONALE_PINS,
  TIMEFRAME_MULTIPLIERS,
} from './data/mockGovernanceData';
import { PMRationaleBadge } from './components/PMRationaleBadge';
import { DepartmentChartMetrics, DepartmentCharts } from './components/DepartmentCharts';
import { QuadrantAndQueue } from './components/QuadrantAndQueue';
import { ToolInventoryLedger } from './components/ToolInventoryLedger';
import { SpendPolicyModal } from './components/SpendPolicyModal';
import { ToolDetailDrawer } from './components/ToolDetailDrawer';

// Enterprise volume credit that reconciles the 8-row gross ledger ($45,120) to the net CFO invoice ($42,850)
const ENTERPRISE_NET_CREDIT_BY_DEPT: Record<DepartmentName, number> = {
  Engineering: 1640, // OpenAI + GitHub Enterprise bundle credit
  Marketing: 310,
  Product: 200,
  Sales: 120,
}; // Sum = $2,270 ($45,120 - $2,270 = $42,850 exact)

export function App() {
  const [timeframe, setTimeframe] = useState<TimeframeKey>('Nov 2026 (Current)');
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentFilter>('All Departments');
  const [showRationalePins, setShowRationalePins] = useState<boolean>(false);

  const [tools, setTools] = useState<AIToolItem[]>(INITIAL_TOOLS);
  const [departmentPolicies, setDepartmentPolicies] = useState<
    Record<string, DepartmentPolicy>
  >(INITIAL_DEPARTMENT_POLICIES);

  // Workflow Queue states
  const [jasperReclaimed, setJasperReclaimed] = useState<boolean>(false);
  const [otterActionState, setOtterActionState] = useState<
    'pending' | 'approved' | 'blocked'
  >('pending');

  // Modal & Drawer states
  const [policyModalOpen, setPolicyModalOpen] = useState<boolean>(false);
  const [policyModalMode, setPolicyModalMode] = useState<'department' | 'tool'>(
    'department'
  );
  const [policyModalDept, setPolicyModalDept] =
    useState<DepartmentName>('Engineering');
  const [policyModalToolId, setPolicyModalToolId] =
    useState<string>('openai-enterprise');
  const [inspectedToolId, setInspectedToolId] = useState<string | null>(null);

  // Highlight pulse when clicking KPI 4 ("Active Policy Breaches")
  const [queueHighlightPulse, setQueueHighlightPulse] = useState<boolean>(false);
  const queueSectionRef = useRef<HTMLDivElement>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = (
    title: string,
    description: string,
    variant: ToastMessage['variant'] = 'indigo'
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [
      { id, title, description, variant, timestamp: 'Just now' },
      ...prev.slice(0, 3),
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  };

  const tfConfig = TIMEFRAME_MULTIPLIERS[timeframe];

  // Scale tools by active timeframe
  const timeframeAdjustedTools = useMemo(() => {
    return tools.map((t) => ({
      ...t,
      monthlySpend: Math.round(t.monthlySpend * tfConfig.spendMultiplier),
      monthlyCap:
        t.monthlyCap !== null
          ? Math.round(t.monthlyCap * tfConfig.capMultiplier)
          : null,
      projectedEomSpend: Math.round(
        t.projectedEomSpend * tfConfig.forecastMultiplier
      ),
      reclaimableMonthlySavings: Math.round(
        t.reclaimableMonthlySavings * tfConfig.spendMultiplier
      ),
      departmentAllocations: t.departmentAllocations
        ? {
            Engineering: {
              ...t.departmentAllocations.Engineering,
              spend: Math.round(
                t.departmentAllocations.Engineering.spend *
                  tfConfig.spendMultiplier
              ),
            },
            Marketing: {
              ...t.departmentAllocations.Marketing,
              spend: Math.round(
                t.departmentAllocations.Marketing.spend *
                  tfConfig.spendMultiplier
              ),
            },
            Product: {
              ...t.departmentAllocations.Product,
              spend: Math.round(
                t.departmentAllocations.Product.spend * tfConfig.spendMultiplier
              ),
            },
            Sales: {
              ...t.departmentAllocations.Sales,
              spend: Math.round(
                t.departmentAllocations.Sales.spend * tfConfig.spendMultiplier
              ),
            },
          }
        : undefined,
    }));
  }, [tools, tfConfig]);

  // Compute per-department analytical metrics (reconciled across all widgets)
  const departmentMetrics: DepartmentChartMetrics[] = useMemo(() => {
    const depts: { name: DepartmentName; short: string }[] = [
      { name: 'Engineering', short: 'Engineering' },
      { name: 'Marketing', short: 'Marketing' },
      { name: 'Product', short: 'Product' },
      { name: 'Sales', short: 'Sales' },
    ];

    return depts.map(({ name, short }) => {
      const policy = departmentPolicies[name];
      const netCredit = Math.round(
        ENTERPRISE_NET_CREDIT_BY_DEPT[name] * tfConfig.spendMultiplier
      );

      let grossSanctioned = 0;
      let shadowSpend = 0;
      let sanctionedCount = 0;
      let shadowCount = policy.unapprovedToolCountExtra;

      timeframeAdjustedTools.forEach((tool) => {
        if (tool.status === 'Blocked') return;

        if (tool.department === name) {
          if (tool.status === 'Shadow AI') {
            shadowSpend += tool.monthlySpend;
            shadowCount += 1;
          } else {
            grossSanctioned += tool.monthlySpend;
            sanctionedCount += 1;
          }
        } else if (
          tool.department === 'All Teams' &&
          tool.departmentAllocations?.[name]
        ) {
          grossSanctioned += tool.departmentAllocations[name].spend;
          sanctionedCount += 1;
        }
      });

      const netSanctionedSpend = Math.max(0, grossSanctioned - netCredit);
      const totalSpend = netSanctionedSpend + shadowSpend;
      const approvedCap = Math.round(policy.approvedCap * tfConfig.capMultiplier);

      // Adjust projected EOM if seats were reclaimed or tools blocked
      const basePolicyDeptSpend =
        name === 'Engineering'
          ? 28560
          : name === 'Marketing'
          ? 6710
          : name === 'Product'
          ? 6250
          : 1330;
      const liveDelta =
        totalSpend - Math.round(basePolicyDeptSpend * tfConfig.spendMultiplier);
      const projectedEomSpend = Math.max(
        totalSpend,
        Math.round(policy.projectedEomSpend * tfConfig.forecastMultiplier) +
          liveDelta
      );

      return {
        department: name,
        shortName: short,
        sanctionedSpend: netSanctionedSpend,
        shadowSpend,
        totalSpend,
        approvedCap,
        projectedEomSpend,
        projectedOverrunDate:
          projectedEomSpend > approvedCap ? policy.projectedOverrunDate : null,
        sanctionedToolCount: sanctionedCount,
        shadowToolCount: shadowCount,
        deptHead: policy.deptHead,
      };
    });
  }, [timeframeAdjustedTools, departmentPolicies, tfConfig]);

  // Compute Top-Level Executive KPIs (Row 1) filtered by selectedDepartment
  const kpiSummary = useMemo(() => {
    const activeDepts =
      selectedDepartment === 'All Departments'
        ? departmentMetrics
        : departmentMetrics.filter((d) => d.department === selectedDepartment);

    const totalSpend = activeDepts.reduce((acc, d) => acc + d.totalSpend, 0);
    const totalCap = activeDepts.reduce((acc, d) => acc + d.approvedCap, 0);
    const projectedEom = activeDepts.reduce(
      (acc, d) => acc + d.projectedEomSpend,
      0
    );
    const capUtilizationPct =
      totalCap > 0 ? Math.round((totalSpend / totalCap) * 1000) / 10 : 0;
    const eomOverCapPct =
      totalCap > 0
        ? Math.round(((projectedEom - totalCap) / totalCap) * 1000) / 10
        : 0;

    const shadowSpend = activeDepts.reduce((acc, d) => acc + d.shadowSpend, 0);
    const shadowToolsCount = activeDepts.reduce(
      (acc, d) => acc + d.shadowToolCount,
      0
    );

    // Licensed Seat Utilization (Sanctioned & Underutilized tools)
    // In initial All Departments view: 418 / 620 active seats (67.4% utilized), $4,120/mo reclaimable shelfware
    let activeSeats = 0;
    let paidSeats = 0;
    let reclaimableDollar = 0;

    timeframeAdjustedTools.forEach((tool) => {
      if (tool.status === 'Shadow AI' || tool.status === 'Blocked') return;

      if (selectedDepartment === 'All Departments') {
        if (tool.department === 'All Teams') {
          // Notion AI enterprise seat pool calibrated so All Depts = 418 / 620 initially
          activeSeats += 28;
          paidSeats += 105;
        } else {
          activeSeats += tool.activeSeats;
          paidSeats += tool.paidSeats;
          reclaimableDollar += tool.reclaimableMonthlySavings;
        }
      } else {
        if (tool.department === selectedDepartment) {
          activeSeats += tool.activeSeats;
          paidSeats += tool.paidSeats;
          reclaimableDollar += tool.reclaimableMonthlySavings;
        } else if (
          tool.department === 'All Teams' &&
          tool.departmentAllocations?.[selectedDepartment]
        ) {
          activeSeats += tool.departmentAllocations[selectedDepartment].activeSeats;
          paidSeats += tool.departmentAllocations[selectedDepartment].paidSeats;
        }
      }
    });

    const seatUtilPct =
      paidSeats > 0 ? Math.round((activeSeats / paidSeats) * 1000) / 10 : 0;

    // Active Policy Breaches count
    const engPolicy = departmentPolicies['Engineering'];
    const engOverrunActive =
      engPolicy && engPolicy.approvedCap < engPolicy.projectedEomSpend;
    const otterAlertActive = otterActionState === 'pending';
    const jasperAlertActive = !jasperReclaimed;

    let breachCount = 0;
    if (selectedDepartment === 'All Departments') {
      breachCount =
        (engOverrunActive ? 1 : 0) +
        (otterAlertActive ? 1 : 0) +
        (jasperAlertActive ? 1 : 0);
    } else if (selectedDepartment === 'Engineering') {
      breachCount = (engOverrunActive ? 1 : 0) + 1; // Eng cap + Cursor Pro shadow
    } else if (selectedDepartment === 'Marketing') {
      breachCount = (jasperAlertActive ? 1 : 0) + (otterAlertActive ? 1 : 0);
    } else if (selectedDepartment === 'Sales') {
      breachCount = otterAlertActive ? 1 : 0;
    } else {
      breachCount = 0;
    }

    return {
      totalSpend,
      totalCap,
      projectedEom,
      capUtilizationPct,
      eomOverCapPct,
      shadowSpend,
      shadowToolsCount,
      activeSeats,
      paidSeats,
      seatUtilPct,
      reclaimableDollar,
      breachCount,
    };
  }, [
    selectedDepartment,
    departmentMetrics,
    timeframeAdjustedTools,
    departmentPolicies,
    otterActionState,
    jasperReclaimed,
  ]);

  // Handlers for interactive Governance Actions
  const handleSaveDepartmentPolicy = (
    dept: DepartmentName,
    newCap: number,
    threshold: 80 | 90,
    slackNotify: boolean
  ) => {
    setDepartmentPolicies((prev) => ({
      ...prev,
      [dept]: {
        ...prev[dept],
        approvedCap: newCap,
        alertThreshold: threshold,
        slackNotify,
      },
    }));

    pushToast(
      `Updated ${dept} Spend Policy`,
      `Monthly cap set to $${newCap.toLocaleString()} (${threshold}% alert threshold)${
        slackNotify ? ` • Slack webhook active` : ''
      }.`,
      'indigo'
    );
  };

  const handleSaveToolPolicy = (
    toolId: string,
    newCap: number,
    threshold: 80 | 90,
    slackNotify: boolean,
    sanctionIfShadow: boolean
  ) => {
    const targetTool = tools.find((t) => t.id === toolId);
    setTools((prev) =>
      prev.map((t) => {
        if (t.id !== toolId) return t;
        return {
          ...t,
          monthlyCap: newCap,
          alertThreshold: threshold,
          slackNotify,
          status:
            sanctionIfShadow && t.status === 'Shadow AI'
              ? 'Sanctioned'
              : t.status,
        };
      })
    );

    if (toolId === 'otter-ai' && sanctionIfShadow) {
      setOtterActionState('approved');
    }

    pushToast(
      `Saved Policy for ${targetTool?.name ?? 'AI Tool'}`,
      `Approved cap set to $${newCap.toLocaleString()}/mo (${threshold}% alert threshold)${
        sanctionIfShadow && targetTool?.status === 'Shadow AI'
          ? ' • Status updated to Sanctioned'
          : ''
      }.`,
      'emerald'
    );
  };

  const handleApproveShadowTool = (toolId: string) => {
    const target = tools.find((t) => t.id === toolId);
    if (!target) return;
    const defaultCap = Math.ceil((target.monthlySpend * 1.2) / 200) * 200;

    setTools((prev) =>
      prev.map((t) =>
        t.id === toolId
          ? {
              ...t,
              status: 'Sanctioned',
              monthlyCap: t.monthlyCap ?? defaultCap,
              riskLevel: 'Low',
              slackNotify: true,
            }
          : t
      )
    );

    if (toolId === 'otter-ai') {
      setOtterActionState('approved');
    }

    pushToast(
      `${target.name} Sanctioned & Governed`,
      `Assigned $${defaultCap.toLocaleString()}/mo cap and migrated OAuth grant under Okta SSO governance.`,
      'emerald'
    );
  };

  const handleBlockShadowTool = (toolId: string) => {
    const target = tools.find((t) => t.id === toolId);
    if (!target) return;

    setTools((prev) =>
      prev.map((t) =>
        t.id === toolId
          ? {
              ...t,
              status: 'Blocked',
              activeSeats: 0,
              monthlySpend: 0,
              projectedEomSpend: 0,
            }
          : t
      )
    );

    if (toolId === 'otter-ai') {
      setOtterActionState('blocked');
    }

    pushToast(
      `Blocked ${target.name} & Revoked Access`,
      `OAuth tokens revoked and corporate card merchant rule enforced. Saved $${target.monthlySpend.toLocaleString()}/mo in Shadow AI exposure.`,
      'rose'
    );
  };

  const handleUndoOtterAction = () => {
    const originalOtter = INITIAL_TOOLS.find((t) => t.id === 'otter-ai')!;
    setTools((prev) =>
      prev.map((t) => (t.id === 'otter-ai' ? originalOtter : t))
    );
    setOtterActionState('pending');
    pushToast(
      'Restored Otter.ai Discovery Alert',
      'Reverted Otter.ai to unapproved Shadow AI state.',
      'amber'
    );
  };

  const handleReclaimToolSeats = (toolId: string) => {
    const target = tools.find((t) => t.id === toolId);
    if (!target || target.reclaimableMonthlySavings <= 0) return;

    const savings = target.reclaimableMonthlySavings;
    const harvestedSeats = target.inactiveSeats30d;

    setTools((prev) =>
      prev.map((t) =>
        t.id === toolId
          ? {
              ...t,
              status: 'Sanctioned',
              paidSeats: t.activeSeats,
              monthlySpend: Math.max(400, t.monthlySpend - savings),
              projectedEomSpend: Math.max(400, t.projectedEomSpend - savings),
              inactiveSeats30d: 0,
              reclaimableMonthlySavings: 0,
            }
          : t
      )
    );

    if (toolId === 'jasper-ai') {
      setJasperReclaimed(true);
    }

    pushToast(
      `Harvested ${harvestedSeats} Idle ${target.name} Seats`,
      `Deprovisioned inactive Okta licenses • Reclaimed $${savings.toLocaleString()}/mo ($${(
        savings * 12
      ).toLocaleString()}/yr annualized).`,
      'emerald'
    );
  };

  const handleUndoJasperReclaim = () => {
    const originalJasper = INITIAL_TOOLS.find((t) => t.id === 'jasper-ai')!;
    setTools((prev) =>
      prev.map((t) => (t.id === 'jasper-ai' ? originalJasper : t))
    );
    setJasperReclaimed(false);
    pushToast(
      'Reverted Jasper AI Seat Harvest',
      'Restored 80 provisioned seats ($4,900/mo) for simulation.',
      'amber'
    );
  };

  const handleResetDemo = () => {
    setTools(INITIAL_TOOLS);
    setDepartmentPolicies(INITIAL_DEPARTMENT_POLICIES);
    setJasperReclaimed(false);
    setOtterActionState('pending');
    setSelectedDepartment('All Departments');
    setTimeframe('Nov 2026 (Current)');
    pushToast(
      'Command Center Reset',
      'Restored initial Nov 2026 executive benchmark state.',
      'indigo'
    );
  };

  const handleScrollToQueue = () => {
    queueSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    setQueueHighlightPulse(true);
    setTimeout(() => setQueueHighlightPulse(false), 2200);
  };

  const handleExportCsv = () => {
    const headers = [
      'Tool Name',
      'Vendor',
      'Governance Status',
      'Detection Source',
      'Department',
      'Active Seats',
      'Paid Seats',
      'Monthly Spend ($)',
      'Monthly Cap ($)',
    ];
    const rows = timeframeAdjustedTools.map((t) => [
      t.name,
      t.vendor,
      t.status,
      t.detectionSource,
      t.department,
      t.activeSeats,
      t.paidSeats,
      t.monthlySpend,
      t.monthlyCap ?? 'No Cap',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `CloudEagle_AI_Governance_Ledger_${timeframe.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    pushToast(
      'Exported Governance Ledger CSV',
      `Downloaded ${timeframeAdjustedTools.length} AI tool audit records for ${timeframe}.`,
      'indigo'
    );
  };

  const inspectedTool = useMemo(
    () => timeframeAdjustedTools.find((t) => t.id === inspectedToolId) ?? null,
    [timeframeAdjustedTools, inspectedToolId]
  );

  const isModifiedState =
    jasperReclaimed ||
    otterActionState !== 'pending' ||
    selectedDepartment !== 'All Departments' ||
    timeframe !== 'Nov 2026 (Current)';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-12">
      {/* 1. TOP NAVIGATION & CONTEXT BAR */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Left: CloudEagle.ai Brand Badge + Title + Subtitle */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center text-white shadow-sm shadow-indigo-600/25 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-[#4F46E5] border border-indigo-200/80">
                  CloudEagle.ai
                </span>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  AI Governance & Spend Command Center
                </h1>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Real-time visibility across sanctioned AI tools, OAuth grants & corporate card spend
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Timeframe Selector */}
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                aria-label="Select Timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as TimeframeKey)}
                className="rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-white pl-8 pr-7 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/15 cursor-pointer transition-colors"
              >
                <option value="Nov 2026 (Current)">Nov 2026 (Current)</option>
                <option value="Oct 2026">Oct 2026</option>
                <option value="Q4 2026">Q4 2026</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="relative flex items-center">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                aria-label="Filter by Department"
                value={selectedDepartment}
                onChange={(e) =>
                  setSelectedDepartment(e.target.value as DepartmentFilter)
                }
                className={`rounded-xl border pl-8 pr-7 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/15 cursor-pointer transition-colors ${
                  selectedDepartment !== 'All Departments'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-800'
                    : 'border-slate-200 bg-slate-50/80 hover:bg-white text-slate-700'
                }`}
              >
                <option value="All Departments">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Product">Product</option>
                <option value="Sales">Sales</option>
              </select>
            </div>

            {/* PM Rationale Mode Toggle Pill Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={showRationalePins}
              onClick={() => setShowRationalePins((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                showRationalePins
                  ? 'bg-indigo-950 text-white border-indigo-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${
                  showRationalePins ? 'text-amber-300' : 'text-indigo-600'
                }`}
              />
              <span>PM Rationale Pins</span>
              <span
                className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                  showRationalePins ? 'bg-indigo-500 justify-end' : 'bg-slate-200 justify-start'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-white shadow-2xs" />
              </span>
            </button>

            {/* Reset Demo Button when state modified */}
            {isModifiedState && (
              <button
                type="button"
                onClick={handleResetDemo}
                title="Reset all filters and workflow actions to initial benchmark"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            {/* Primary CTA Button: + Set Spend Policy */}
            <button
              type="button"
              onClick={() => {
                setPolicyModalMode('department');
                setPolicyModalDept(
                  selectedDepartment === 'All Departments'
                    ? 'Engineering'
                    : selectedDepartment
                );
                setPolicyModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#4F46E5] text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>+ Set Spend Policy</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN SINGLE-SCREEN CONTAINER (max-w-[1440px] mx-auto) */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Optional PM Rationale Banner when pins are toggled ON */}
        {showRationalePins && (
          <div className="rounded-xl bg-indigo-950 text-indigo-100 px-4 py-2.5 border border-indigo-800 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                <strong>PM Rationale Mode Active:</strong> Hover or click any numbered{' '}
                <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-bold text-[10px]">
                  PM Pin #1–#5
                </span>{' '}
                badge to inspect the CFO & CISO product design trade-offs behind each module.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowRationalePins(false)}
              className="text-indigo-300 hover:text-white text-[11px] font-semibold underline cursor-pointer"
            >
              Hide Pins
            </button>
          </div>
        )}

        {/* 2. ROW 1: FOUR EXECUTIVE KPI CARDS (The 10-Second Scan) */}
        <section aria-label="Executive KPI Summary">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Executive 10-Second Scan • {tfConfig.label}
              </span>
              <PMRationaleBadge
                pin={PM_RATIONALE_PINS[0]}
                visible={showRationalePins}
              />
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Telemetry synced 2 mins ago via OpenAI Admin API, Okta SSO, Google OAuth & Brex/Ramp
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total AI Spend vs. Approved Cap */}
            <div
              onClick={() => {
                setPolicyModalMode('department');
                setPolicyModalDept(
                  selectedDepartment === 'All Departments'
                    ? 'Engineering'
                    : selectedDepartment
                );
                setPolicyModalOpen(true);
              }}
              className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Total AI Spend vs. Approved Cap</span>
                  <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {kpiSummary.capUtilizationPct}% utilized
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-bold text-slate-900">
                    ${kpiSummary.totalSpend.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    / ${kpiSummary.totalCap.toLocaleString()}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-2.5 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      kpiSummary.capUtilizationPct > 90
                        ? 'bg-amber-500'
                        : 'bg-[#4F46E5]'
                    }`}
                    style={{
                      width: `${Math.min(100, kpiSummary.capUtilizationPct)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                    kpiSummary.eomOverCapPct > 0
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  {tfConfig.periodComparisonLabel}: $
                  {kpiSummary.projectedEom.toLocaleString()} (
                  {kpiSummary.eomOverCapPct > 0
                    ? `+${kpiSummary.eomOverCapPct}% over cap`
                    : `${kpiSummary.eomOverCapPct}% under cap`}
                  )
                </span>
              </div>
            </div>

            {/* KPI 2: Shadow AI Exposure */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Shadow AI Exposure</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <ShieldAlert className="w-3 h-3" />
                    {kpiSummary.shadowToolsCount} unapproved tools
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-bold text-slate-900">
                    ${kpiSummary.shadowSpend.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-slate-400">/ mo</span>
                </div>

                <div className="mt-2 text-[11px] text-slate-500">
                  Uncapped spend bypassing Okta SSO & Legal DPA review
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  {tfConfig.momShadowDelta}
                </span>
              </div>
            </div>

            {/* KPI 3: Licensed Seat Utilization */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Licensed Seat Utilization</span>
                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {kpiSummary.seatUtilPct}% utilized
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-1.5 font-mono">
                  <span className="text-2xl font-bold text-slate-900">
                    {kpiSummary.activeSeats} / {kpiSummary.paidSeats}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    active seats
                  </span>
                </div>

                <div className="mt-2.5 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, kpiSummary.seatUtilPct)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Sparkles className="w-3 h-3" />
                  {kpiSummary.reclaimableDollar > 0
                    ? `$${kpiSummary.reclaimableDollar.toLocaleString()}/mo reclaimable shelfware`
                    : 'All idle shelfware seats harvested ($3,960/mo saved)'}
                </span>
              </div>
            </div>

            {/* KPI 4: Active Policy Breaches (Clickable to scroll/highlight Action Queue) */}
            <div
              onClick={handleScrollToQueue}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleScrollToQueue();
              }}
              className="bg-white rounded-xl border border-[#E2E8F0] hover:border-rose-300 p-4 shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Active Policy Breaches</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 group-hover:underline">
                    Jump to Queue
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-bold font-mono ${
                      kpiSummary.breachCount > 0
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {kpiSummary.breachCount}{' '}
                    {kpiSummary.breachCount === 1 ? 'Alert' : 'Alerts'}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    Requiring Action
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-slate-500">
                  {kpiSummary.breachCount > 0
                    ? 'Engineering at 94% cap • Unvetted Google OAuth • Idle seats'
                    : 'All high-priority FinOps & OAuth policy alerts remediated'}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                    kpiSummary.breachCount > 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {kpiSummary.breachCount > 0
                    ? 'Engineering at 94% cap • Click to remediate'
                    : 'Zero unmitigated policy breaches'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. ROW 2: PRIMARY ANALYTICAL CHARTS (60% / 40% Split) */}
        <DepartmentCharts
          metrics={departmentMetrics}
          selectedDepartment={selectedDepartment}
          onSelectDepartment={setSelectedDepartment}
          onOpenDeptPolicyModal={(dept) => {
            setPolicyModalMode('department');
            setPolicyModalDept(dept);
            setPolicyModalOpen(true);
          }}
          showRationalePins={showRationalePins}
          pacingPin={PM_RATIONALE_PINS[1]}
          shadowSplitPin={PM_RATIONALE_PINS[2]}
          periodLabel={tfConfig.periodComparisonLabel}
        />

        {/* 4. ROW 3: EFFICIENCY QUADRANT + GOVERNANCE ACTION QUEUE (50% / 50% Split) */}
        <QuadrantAndQueue
          tools={timeframeAdjustedTools}
          selectedDepartment={selectedDepartment}
          departmentPolicies={departmentPolicies}
          onInspectTool={(tool) => setInspectedToolId(tool.id)}
          onOpenDeptPolicyModal={(dept) => {
            setPolicyModalMode('department');
            setPolicyModalDept(dept);
            setPolicyModalOpen(true);
          }}
          onApproveShadowTool={handleApproveShadowTool}
          onBlockShadowTool={handleBlockShadowTool}
          onUndoOtterAction={handleUndoOtterAction}
          onReclaimJasperSeats={() => handleReclaimToolSeats('jasper-ai')}
          onUndoJasperReclaim={handleUndoJasperReclaim}
          jasperReclaimed={jasperReclaimed}
          otterActionState={otterActionState}
          showRationalePins={showRationalePins}
          quadrantPin={PM_RATIONALE_PINS[3]}
          queueHighlightPulse={queueHighlightPulse}
          queueSectionRef={queueSectionRef}
        />

        {/* 5. ROW 4: AI TOOL INVENTORY & GOVERNANCE LEDGER (Full Width) */}
        <ToolInventoryLedger
          tools={timeframeAdjustedTools}
          selectedDepartment={selectedDepartment}
          onInspectTool={(tool) => setInspectedToolId(tool.id)}
          onOpenToolPolicyModal={(toolId) => {
            setPolicyModalMode('tool');
            setPolicyModalToolId(toolId);
            setPolicyModalOpen(true);
          }}
          onApproveShadowTool={handleApproveShadowTool}
          onBlockShadowTool={handleBlockShadowTool}
          onReclaimSeats={handleReclaimToolSeats}
          onExportCsv={handleExportCsv}
          showRationalePins={showRationalePins}
          ledgerPin={PM_RATIONALE_PINS[4]}
        />
      </main>

      {/* 6. INTERACTIVE "SET / ADJUST SPEND POLICY" MODAL */}
      <SpendPolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        initialMode={policyModalMode}
        initialDepartment={policyModalDept}
        initialToolId={policyModalToolId}
        departmentPolicies={departmentPolicies}
        tools={tools}
        onSaveDepartmentPolicy={handleSaveDepartmentPolicy}
        onSaveToolPolicy={handleSaveToolPolicy}
      />

      {/* INTERACTIVE TOOL DEEP-DIVE DRAWER / MODAL */}
      <ToolDetailDrawer
        tool={inspectedTool}
        onClose={() => setInspectedToolId(null)}
        onOpenPolicyModal={(toolId) => {
          setPolicyModalMode('tool');
          setPolicyModalToolId(toolId);
          setPolicyModalOpen(true);
        }}
        onApproveShadowTool={handleApproveShadowTool}
        onBlockShadowTool={handleBlockShadowTool}
        onReclaimSeats={handleReclaimToolSeats}
      />

      {/* FLOATING CONFIRMATION TOAST STACK */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-xl bg-slate-900 text-white p-4 shadow-2xl border border-slate-700/90 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  toast.variant === 'emerald'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : toast.variant === 'rose'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : toast.variant === 'amber'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">{toast.title}</div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default App;

