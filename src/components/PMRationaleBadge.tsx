import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, UserCheck, ShieldAlert, TrendingUp } from 'lucide-react';
import { PMRationalePinData } from '../types/governance';

interface PMRationaleBadgeProps {
  pin: PMRationalePinData;
  visible: boolean;
}

export const PMRationaleBadge: React.FC<PMRationaleBadgeProps> = ({ pin, visible }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center z-30"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label={`PM Rationale Pin ${pin.id}: ${pin.title}`}
        aria-expanded={open}
        className="group relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200 hover:bg-indigo-700 transition-all cursor-pointer"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
        <span>PM Pin #{pin.id}</span>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 text-slate-100 shadow-2xl border border-slate-700/80 p-4 z-50 text-left animate-in fade-in duration-150"
        >
          <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-bold">
                #{pin.id}
              </span>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Product Management Rationale
                </div>
                <h4 className="text-xs font-semibold text-white leading-snug">{pin.title}</h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close rationale popover"
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between bg-slate-800/70 rounded-lg px-2.5 py-1.5 border border-slate-700/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                Target Executive:
              </span>
              <span className="font-semibold text-indigo-300">{pin.targetPersona}</span>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1 mb-0.5">
                <ShieldAlert className="w-3 h-3" /> Executive Pain Point
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">{pin.problemSolved}</p>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-amber-300 mb-0.5">
                Why This Design Pattern
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">{pin.designDecision}</p>
            </div>

            <div className="pt-1.5 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mb-0.5">
                <TrendingUp className="w-3 h-3" /> Quantified Business Impact
              </div>
              <p className="text-slate-200 leading-relaxed text-[11px] font-medium">{pin.businessImpact}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

