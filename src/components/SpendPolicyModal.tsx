import React, { useEffect, useRef, useState } from 'react';
import {
  Sliders,
  X,
  Bell,
  Building2,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { AIToolItem, DepartmentName, DepartmentPolicy } from '../types/governance';

interface SpendPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'department' | 'tool';
  initialDepartment?: DepartmentName;
  initialToolId?: string;
  departmentPolicies: Record<string, DepartmentPolicy>;
  tools: AIToolItem[];
  onSaveDepartmentPolicy: (
    dept: DepartmentName,
    newCap: number,
    threshold: 80 | 90,
    slackNotify: boolean
  ) => void;
  onSaveToolPolicy: (
    toolId: string,
    newCap: number,
    threshold: 80 | 90,
    slackNotify: boolean,
    sanctionIfShadow: boolean
  ) => void;
}

export const SpendPolicyModal: React.FC<SpendPolicyModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  initialDepartment = 'Engineering',
  initialToolId = 'openai-enterprise',
  departmentPolicies,
  tools,
  onSaveDepartmentPolicy,
  onSaveToolPolicy,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [mode, setMode] = useState<'department' | 'tool'>(initialMode);
  const [selectedDept, setSelectedDept] = useState<DepartmentName>(initialDepartment);
  const [selectedToolId, setSelectedToolId] = useState<string>(initialToolId);
  const [capAmount, setCapAmount] = useState<number>(24000);
  const [alertThreshold, setAlertThreshold] = useState<80 | 90>(90);
  const [slackNotify, setSlackNotify] = useState<boolean>(true);
  const [sanctionTool, setSanctionTool] = useState<boolean>(true);

  // Sync state when modal opens or target changes
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    if (initialMode === 'department') {
      const dept = initialDepartment || 'Engineering';
      setSelectedDept(dept);
      const policy = departmentPolicies[dept];
      if (policy) {
        setCapAmount(policy.approvedCap);
        setAlertThreshold(policy.alertThreshold);
        setSlackNotify(policy.slackNotify);
      }
    } else {
      const toolId = initialToolId || tools[0]?.id || 'openai-enterprise';
      setSelectedToolId(toolId);
      const tool = tools.find((t) => t.id === toolId);
      if (tool) {
        setCapAmount(tool.monthlyCap ?? Math.ceil((tool.monthlySpend * 1.2) / 500) * 500);
        setAlertThreshold(tool.alertThreshold);
        setSlackNotify(tool.slackNotify);
        setSanctionTool(tool.status === 'Shadow AI');
      }
    }
  }, [isOpen, initialMode, initialDepartment, initialToolId, departmentPolicies, tools]);

  // Update form controls when user switches department inside modal
  const handleDeptChange = (dept: DepartmentName) => {
    setSelectedDept(dept);
    const policy = departmentPolicies[dept];
    if (policy) {
      setCapAmount(policy.approvedCap);
      setAlertThreshold(policy.alertThreshold);
      setSlackNotify(policy.slackNotify);
    }
  };

  // Update form controls when user switches tool inside modal
  const handleToolChange = (toolId: string) => {
    setSelectedToolId(toolId);
    const tool = tools.find((t) => t.id === toolId);
    if (tool) {
      setCapAmount(tool.monthlyCap ?? Math.ceil((tool.monthlySpend * 1.25) / 500) * 500);
      setAlertThreshold(tool.alertThreshold);
      setSlackNotify(tool.slackNotify);
      setSanctionTool(tool.status === 'Shadow AI');
    }
  };

  // Modern Web Guidance: Open native <dialog> via showModal() + light-dismiss fallback for browsers without closedBy
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    // Fallback for browsers without native closedby="any" support (modern-web-guidance: light-dismiss-a-dialog)
    const handleClick = (event: MouseEvent) => {
      if ('closedBy' in HTMLDialogElement.prototype) return;
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isDialogContent) {
        dialog.close();
      }
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('click', handleClick);
    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  const currentDeptSpend = React.useMemo(() => {
    return tools.reduce((sum, tool) => {
      if (tool.status === 'Blocked') return sum;
      if (tool.department === selectedDept) return sum + tool.monthlySpend;
      if (tool.department === 'All Teams' && tool.departmentAllocations?.[selectedDept]) {
        return sum + tool.departmentAllocations[selectedDept].spend;
      }
      return sum;
    }, 0);
  }, [tools, selectedDept]);

  const currentTool = tools.find((t) => t.id === selectedToolId);
  const currentSpendForPreview =
    mode === 'department' ? currentDeptSpend : currentTool?.monthlySpend ?? 0;
  const projectedSpendForPreview =
    mode === 'department'
      ? departmentPolicies[selectedDept]?.projectedEomSpend ?? currentDeptSpend
      : currentTool?.projectedEomSpend ?? 0;

  const newUtilizationPct = capAmount > 0 ? Math.round((currentSpendForPreview / capAmount) * 1000) / 10 : 0;
  const isOverForecast = projectedSpendForPreview > capAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'department') {
      onSaveDepartmentPolicy(selectedDept, capAmount, alertThreshold, slackNotify);
    } else {
      onSaveToolPolicy(selectedToolId, capAmount, alertThreshold, slackNotify, sanctionTool);
    }
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="spend-policy-modal-title"
      {...({ closedby: 'any' } as any)}
      className="w-full max-w-lg rounded-2xl bg-white p-0 text-slate-900 shadow-2xl border border-slate-200 open:animate-in open:fade-in open:zoom-in-95 duration-150"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 id="spend-policy-modal-title" className="text-base font-bold text-slate-900">
                Set / Adjust AI Spend Policy
              </h2>
              <p className="text-xs text-slate-500">
                Configure hard/soft budget caps, threshold triggers & automated Slack governance alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close spend policy modal"
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Policy Target Scope
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setMode('department');
                  handleDeptChange(selectedDept);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'department'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Department Cap
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('tool');
                  handleToolChange(selectedToolId);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'tool'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                Specific AI Tool Cap
              </button>
            </div>
          </div>

          {/* Target Dropdown */}
          {mode === 'department' ? (
            <div>
              <label
                htmlFor="policy-dept-select"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Select Department Cost Center
              </label>
              <select
                id="policy-dept-select"
                value={selectedDept}
                onChange={(e) => handleDeptChange(e.target.value as DepartmentName)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              >
                {(['Engineering', 'Marketing', 'Product', 'Sales'] as DepartmentName[]).map((dept) => (
                  <option key={dept} value={dept}>
                    {dept} — Head: {departmentPolicies[dept]?.deptHead}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label
                htmlFor="policy-tool-select"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Select AI Application / Vendor
              </label>
              <select
                id="policy-tool-select"
                value={selectedToolId}
                onChange={(e) => handleToolChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              >
                {tools.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.department}) — Current: ${t.monthlySpend.toLocaleString()}/mo [{t.status}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Monthly Spend Cap Slider & Numeric Input */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="cap-number-input" className="text-xs font-semibold text-slate-700">
                Approved Monthly Spend Cap ($)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-semibold text-slate-400">$</span>
                <input
                  id="cap-number-input"
                  type="number"
                  step={250}
                  min={500}
                  max={60000}
                  autoFocus
                  value={capAmount}
                  onChange={(e) => setCapAmount(Math.max(500, Number(e.target.value)))}
                  className="w-32 rounded-lg border border-slate-300 bg-white pl-6 pr-3 py-1.5 text-right font-mono text-sm font-bold text-indigo-600 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>
            </div>

            <input
              type="range"
              aria-label="Monthly Spend Cap Slider"
              min={mode === 'department' ? 4000 : 500}
              max={mode === 'department' ? 40000 : 25000}
              step={250}
              value={capAmount}
              onChange={(e) => setCapAmount(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                Current MTD Spend:{' '}
                <strong className="font-mono text-slate-800">
                  ${currentSpendForPreview.toLocaleString()}
                </strong>{' '}
                ({newUtilizationPct}% of new cap)
              </span>
              <span>
                Projected EOM:{' '}
                <strong
                  className={`font-mono ${
                    isOverForecast ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  ${projectedSpendForPreview.toLocaleString()}
                </strong>
              </span>
            </div>

            {/* Live Policy Impact Preview Banner */}
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${
                isOverForecast
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {isOverForecast ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Projected EOM (${projectedSpendForPreview.toLocaleString()}) still exceeds this cap by{' '}
                    <strong>${(projectedSpendForPreview - capAmount).toLocaleString()}</strong>. Raise to{' '}
                    <button
                      type="button"
                      onClick={() => setCapAmount(Math.ceil(projectedSpendForPreview / 500) * 500)}
                      className="underline font-bold hover:text-amber-950"
                    >
                      ${(Math.ceil(projectedSpendForPreview / 500) * 500).toLocaleString()}
                    </button>{' '}
                    to clear overrun warning.
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Healthy buffer: Projected EOM spend fits within this cap with{' '}
                    <strong>${(capAmount - projectedSpendForPreview).toLocaleString()}</strong> headroom.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Alert Threshold Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Automated Pacing Alert Threshold
            </label>
            <div className="grid grid-cols-2 gap-3">
              {([80, 90] as const).map((threshold) => (
                <button
                  key={threshold}
                  type="button"
                  onClick={() => setAlertThreshold(threshold)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    alertThreshold === threshold
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-600/15'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Trigger at {threshold}% of Cap</span>
                  <span className="font-mono text-[11px] text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">
                    ${Math.round((capAmount * threshold) / 100).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Shadow AI Sanction Checkbox if editing a Shadow AI tool */}
          {mode === 'tool' && currentTool?.status === 'Shadow AI' && (
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 cursor-pointer">
              <input
                type="checkbox"
                checked={sanctionTool}
                onChange={(e) => setSanctionTool(e.target.checked)}
                className="mt-0.5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Promote {currentTool.name} from Shadow AI to Sanctioned
                </div>
                <p className="text-slate-600 mt-0.5">
                  Assigns an official spend cap and moves {currentTool.name} under Okta SSO governance.
                </p>
              </div>
            </label>
          )}

          {/* Slack Notification Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                <Bell className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Auto-notify Dept Head on Slack
                </div>
                <div className="text-[11px] text-slate-500">
                  {mode === 'department'
                    ? `Routes webhook to ${departmentPolicies[selectedDept]?.slackChannel} (${departmentPolicies[selectedDept]?.deptHead})`
                    : `Notifies ${currentTool?.ownerName} when ${alertThreshold}% threshold is reached`}
                </div>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={slackNotify}
              aria-label="Auto-notify Dept Head on Slack"
              onClick={() => setSlackNotify((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                slackNotify ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  slackNotify ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Save Policy
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
