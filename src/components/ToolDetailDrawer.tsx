import React, { useEffect, useRef } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Cpu,
  Users,
  Calendar,
  Sliders,
  Sparkles,
  Ban,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { AIToolItem } from '../types/governance';

interface ToolDetailDrawerProps {
  tool: AIToolItem | null;
  onClose: () => void;
  onOpenPolicyModal: (toolId: string) => void;
  onApproveShadowTool: (toolId: string) => void;
  onBlockShadowTool: (toolId: string) => void;
  onReclaimSeats: (toolId: string) => void;
}

export const ToolDetailDrawer: React.FC<ToolDetailDrawerProps> = ({
  tool,
  onClose,
  onOpenPolicyModal,
  onApproveShadowTool,
  onBlockShadowTool,
  onReclaimSeats,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (tool) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [tool]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

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

  if (!tool) {
    return (
      <dialog
        ref={dialogRef}
        aria-label="AI Tool Telemetry Inspector"
        {...({ closedby: 'any' } as any)}
      />
    );
  }

  const seatUtilPct =
    tool.paidSeats > 0 ? Math.round((tool.activeSeats / tool.paidSeats) * 1000) / 10 : 0;
  const capUtilPct =
    tool.monthlyCap && tool.monthlyCap > 0
      ? Math.round((tool.monthlySpend / tool.monthlyCap) * 1000) / 10
      : null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="tool-drawer-title"
      {...({ closedby: 'any' } as any)}
      className="w-full max-w-xl rounded-2xl bg-white p-0 text-slate-900 shadow-2xl border border-slate-200 open:animate-in open:fade-in open:zoom-in-95 duration-150"
    >
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl ${tool.logoBg} ${tool.logoColor} flex items-center justify-center font-bold text-sm shadow-sm`}
            >
              {tool.logoText}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="tool-drawer-title" className="text-base font-bold text-slate-900">
                  {tool.name}
                </h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                    tool.status === 'Sanctioned'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : tool.status === 'Shadow AI'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : tool.status === 'Underutilized'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {tool.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {tool.vendor} • {tool.category} • Discovered via{' '}
                <strong className="text-slate-700">{tool.detectionSource}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close tool inspector"
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Description */}
        <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 leading-relaxed">
          {tool.description}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-3.5 bg-white">
            <div className="text-[11px] font-medium text-slate-500">Monthly Spend vs Cap</div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900">
              ${tool.monthlySpend.toLocaleString()}
              <span className="text-xs font-normal text-slate-400">
                {' '}
                / {tool.monthlyCap ? `$${tool.monthlyCap.toLocaleString()}` : 'No Cap'}
              </span>
            </div>
            <div className="mt-1.5 text-[11px] font-semibold text-indigo-600">
              {capUtilPct !== null ? `${capUtilPct}% of approved cap` : 'Uncapped exposure'}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3.5 bg-white">
            <div className="text-[11px] font-medium text-slate-500">Seat Utilization (30d)</div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-900">
              {tool.activeSeats} / {tool.paidSeats}{' '}
              <span className="text-xs font-normal text-slate-400">seats</span>
            </div>
            <div
              className={`mt-1.5 text-[11px] font-semibold ${
                seatUtilPct < 50 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {seatUtilPct}% active ({tool.inactiveSeats30d} idle)
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3.5 bg-white">
            <div className="text-[11px] font-medium text-slate-500">GenAI Security Risk</div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                  tool.riskLevel === 'Critical' || tool.riskLevel === 'High'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : tool.riskLevel === 'Medium'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {tool.riskLevel} Risk
              </span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500 truncate">
              {tool.tokenUsageMillions
                ? `${tool.tokenUsageMillions}M tokens/mo`
                : 'Seat/Card billed'}
            </div>
          </div>
        </div>

        {/* Data Privacy & OAuth Scopes */}
        <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/60">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-slate-900">
                LLM Data Retention & Training Posture
              </div>
              <div className="text-xs text-slate-600 mt-0.5">{tool.dataTrainingPolicy}</div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-200/80">
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5 mb-2">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              Detected OAuth Scopes & Telemetry Signals
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tool.oauthScopes.map((scope) => (
                <span
                  key={scope}
                  className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700"
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Owner:</span>
              <strong className="text-slate-800 truncate">{tool.ownerName}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Renewal / Billing:</span>
              <strong className="text-slate-800">{tool.renewalDate}</strong>
            </div>
          </div>
        </div>

        {/* Contextual Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPolicyModal(tool.id);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            {tool.monthlyCap ? 'Adjust Spend Cap' : 'Set Spend Cap'}
          </button>

          <div className="flex items-center gap-2">
            {tool.reclaimableMonthlySavings > 0 && (
              <button
                type="button"
                onClick={() => {
                  onReclaimSeats(tool.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Reclaim {tool.inactiveSeats30d} Seats (${tool.reclaimableMonthlySavings.toLocaleString()}/mo)
              </button>
            )}

            {tool.status === 'Shadow AI' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onBlockShadowTool(tool.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Block & Revoke OAuth
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onApproveShadowTool(tool.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sanction Tool
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

