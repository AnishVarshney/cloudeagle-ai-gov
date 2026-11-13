import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  DepartmentFilter,
  DepartmentName,
  PMRationalePinData,
} from '../types/governance';
import { PMRationaleBadge } from './PMRationaleBadge';

export interface DepartmentChartMetrics {
  department: DepartmentName;
  shortName: string;
  sanctionedSpend: number;
  shadowSpend: number;
  totalSpend: number;
  approvedCap: number;
  projectedEomSpend: number;
  projectedOverrunDate: string | null;
  sanctionedToolCount: number;
  shadowToolCount: number;
  deptHead: string;
}

interface DepartmentChartsProps {
  metrics: DepartmentChartMetrics[];
  selectedDepartment: DepartmentFilter;
  onSelectDepartment: (dept: DepartmentFilter) => void;
  onOpenDeptPolicyModal: (dept: DepartmentName) => void;
  showRationalePins: boolean;
  pacingPin: PMRationalePinData;
  shadowSplitPin: PMRationalePinData;
  periodLabel: string;
}

export const DepartmentCharts: React.FC<DepartmentChartsProps> = ({
  metrics,
  selectedDepartment,
  onSelectDepartment,
  onOpenDeptPolicyModal,
  showRationalePins,
  pacingPin,
  shadowSplitPin,
  periodLabel,
}) => {
  const [hoveredBulletDept, setHoveredBulletDept] = useState<DepartmentName | null>(null);
  const [hoveredStackedDept, setHoveredStackedDept] = useState<DepartmentName | null>(null);

  // Max scale for Chart 1 (Department Spend vs Cap & Forecast)
  const maxBulletValue = Math.max(
    30000,
    ...metrics.map((m) => Math.max(m.totalSpend, m.approvedCap, m.projectedEomSpend) * 1.12)
  );

  // Max scale for Chart 2 (Sanctioned vs Shadow AI Stacked Bar)
  const maxStackedValue = Math.max(
    26000,
    ...metrics.map((m) => (m.sanctionedSpend + m.shadowSpend) * 1.15)
  );

  return (
    <section
      aria-label="Primary Department Spend and Shadow AI Charts"
      className="grid grid-cols-1 lg:grid-cols-12 gap-5"
    >
      {/* CHART 1 (Left, 60% width -> 7 of 12 cols on desktop) */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 flex flex-col justify-between relative">
        <div>
          {/* Card Header */}
          <div className="flex flex-wrap items-start justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Department Spend vs. Approved Cap & EOM Forecast
                </h2>
                <PMRationaleBadge pin={pacingPin} visible={showRationalePins} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time budget pacing vs. monthly cap with linear token & seat burn-rate projection
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3.5 text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/70">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#4F46E5]" />
                Current Spend
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-2.5 rounded-xs border border-amber-500 bg-forecast-stripes" />
                {periodLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-0.5 h-3.5 bg-slate-900 inline-block" />
                Approved Cap
              </span>
            </div>
          </div>

          {/* Horizontal Bullet Rows */}
          <div className="mt-4 space-y-4">
            {metrics.map((m) => {
              const isSelected =
                selectedDepartment === 'All Departments' || selectedDepartment === m.department;
              const isHovered = hoveredBulletDept === m.department;

              const spendPct = Math.min(100, (m.totalSpend / maxBulletValue) * 100);
              const capPct = Math.min(100, (m.approvedCap / maxBulletValue) * 100);
              const forecastPct = Math.min(100, (m.projectedEomSpend / maxBulletValue) * 100);

              const capUtilization =
                m.approvedCap > 0 ? Math.round((m.totalSpend / m.approvedCap) * 1000) / 10 : 0;
              const isOverCapForecast = m.projectedEomSpend > m.approvedCap;
              const isAlreadyOverCap = m.totalSpend > m.approvedCap;
              const remainingOrOverrun = m.approvedCap - m.totalSpend;
              const projectedDelta = m.projectedEomSpend - m.approvedCap;

              // Semantic bar color
              const barColor = isAlreadyOverCap
                ? '#EF4444'
                : capUtilization >= 85
                ? '#4F46E5'
                : '#4F46E5';

              return (
                <div
                  key={m.department}
                  onMouseEnter={() => setHoveredBulletDept(m.department)}
                  onMouseLeave={() => setHoveredBulletDept(null)}
                  onClick={() =>
                    onSelectDepartment(
                      selectedDepartment === m.department ? 'All Departments' : m.department
                    )
                  }
                  className={`group relative rounded-xl p-3 border transition-all cursor-pointer ${
                    !isSelected
                      ? 'opacity-45 border-slate-100 bg-slate-50/40'
                      : isHovered
                      ? 'border-indigo-300 bg-indigo-50/25 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Row Label & Status Numbers */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{m.department}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isOverCapForecast
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isOverCapForecast ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {m.projectedOverrunDate
                              ? `Breach est. ${m.projectedOverrunDate.replace(', 2026', '')}`
                              : `+${Math.round((projectedDelta / m.approvedCap) * 100)}% EOM overrun`}
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            On Track ({capUtilization}% of cap)
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="font-mono">
                        <span className="font-bold text-slate-900">
                          ${m.totalSpend.toLocaleString()}
                        </span>
                        <span className="text-slate-400"> / </span>
                        <span className="font-medium text-slate-600">
                          ${m.approvedCap.toLocaleString()} cap
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                        ({periodLabel}:{' '}
                        <strong
                          className={
                            isOverCapForecast ? 'text-amber-700 font-bold' : 'text-slate-700'
                          }
                        >
                          ${m.projectedEomSpend.toLocaleString()}
                        </strong>
                        )
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDeptPolicyModal(m.department);
                        }}
                        title={`Adjust ${m.department} Spend Cap`}
                        className="opacity-80 group-hover:opacity-100 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/70 transition-all"
                      >
                        <Sliders className="w-3 h-3" />
                        Cap
                      </button>
                    </div>
                  </div>

                  {/* Custom SVG Horizontal Bullet Chart */}
                  <div className="relative h-7 w-full">
                    <svg
                      viewBox="0 0 600 28"
                      className="w-full h-full overflow-visible"
                      role="img"
                      aria-label={`${m.department} spend ${m.totalSpend} against cap ${m.approvedCap} and forecast ${m.projectedEomSpend}`}
                    >
                      <defs>
                        <pattern
                          id={`stripe-${m.department}`}
                          width="8"
                          height="8"
                          patternUnits="userSpaceOnUse"
                          patternTransform="rotate(45)"
                        >
                          <line
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="8"
                            stroke={isOverCapForecast ? '#F59E0B' : '#6366F1'}
                            strokeWidth="4"
                            strokeOpacity="0.45"
                          />
                        </pattern>
                      </defs>

                      {/* Background Track */}
                      <rect
                        x="0"
                        y="5"
                        width="600"
                        height="18"
                        rx="5"
                        fill="#F1F5F9"
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />

                      {/* Striped Extension Bar for Projected EOM Run Rate */}
                      {forecastPct > spendPct && (
                        <rect
                          x={(spendPct / 100) * 600}
                          y="5"
                          width={Math.max(4, ((forecastPct - spendPct) / 100) * 600)}
                          height="18"
                          rx="4"
                          fill={`url(#stripe-${m.department})`}
                          stroke={isOverCapForecast ? '#F59E0B' : '#818CF8'}
                          strokeWidth="1"
                          strokeDasharray="3 2"
                        />
                      )}

                      {/* Solid Bar for Current MTD Spend */}
                      <rect
                        x="0"
                        y="5"
                        width={Math.max(6, (spendPct / 100) * 600)}
                        height="18"
                        rx="5"
                        fill={barColor}
                      />

                      {/* Forecast End Marker Dot */}
                      <circle
                        cx={(forecastPct / 100) * 600}
                        cy="14"
                        r="3.5"
                        fill={isOverCapForecast ? '#F59E0B' : '#4F46E5'}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />

                      {/* Vertical Dark Marker Line for Approved Budget Cap */}
                      <g transform={`translate(${(capPct / 100) * 600}, 0)`}>
                        <line
                          x1="0"
                          y1="1"
                          x2="0"
                          y2="27"
                          stroke="#0F172A"
                          strokeWidth="2.5"
                        />
                        <polygon points="-4,0 4,0 0,4" fill="#0F172A" />
                        <polygon points="-4,28 4,28 0,24" fill="#0F172A" />
                      </g>
                    </svg>
                  </div>

                  {/* Interactive Hover Tooltip */}
                  {isHovered && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-6 -top-2 -translate-y-full z-40 w-72 rounded-xl bg-slate-900 text-white p-3.5 shadow-xl border border-slate-700 pointer-events-none animate-in fade-in duration-100"
                    >
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-white">{m.department} Pacing</span>
                        <span className="text-[11px] font-mono text-indigo-300">
                          {capUtilization}% Utilized
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Spend:</span>
                          <span className="font-mono font-semibold text-white">
                            ${m.totalSpend.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Approved Budget Cap:</span>
                          <span className="font-mono font-semibold text-slate-200">
                            ${m.approvedCap.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Remaining Cap Headroom:</span>
                          <span
                            className={`font-mono font-semibold ${
                              remainingOrOverrun >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {remainingOrOverrun >= 0
                              ? `$${remainingOrOverrun.toLocaleString()} left`
                              : `-$${Math.abs(remainingOrOverrun).toLocaleString()} over`}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-400">{periodLabel} Run Rate:</span>
                          <span
                            className={`font-mono font-bold ${
                              isOverCapForecast ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            ${m.projectedEomSpend.toLocaleString()} (
                            {projectedDelta > 0
                              ? `+$${projectedDelta.toLocaleString()}`
                              : 'Within cap'}
                            )
                          </span>
                        </div>
                        {m.projectedOverrunDate && isOverCapForecast && (
                          <div className="flex justify-between text-amber-300 font-medium">
                            <span>Projected Breach Date:</span>
                            <span>{m.projectedOverrunDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scale Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>$0</span>
          <span>${Math.round(maxBulletValue * 0.25).toLocaleString()}</span>
          <span>${Math.round(maxBulletValue * 0.5).toLocaleString()}</span>
          <span>${Math.round(maxBulletValue * 0.75).toLocaleString()}</span>
          <span>${Math.round(maxBulletValue).toLocaleString()}</span>
        </div>
      </div>

      {/* CHART 2 (Right, 40% width -> 5 of 12 cols on desktop) */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 flex flex-col justify-between relative">
        <div>
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Sanctioned vs. Shadow AI Spend by Dept
                </h2>
                <PMRationaleBadge pin={shadowSplitPin} visible={showRationalePins} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Contrasting IT-governed stack vs. expensed & OAuth-discovered Shadow AI
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/70">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#4F46E5]" />
                Sanctioned
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#EF4444]" />
                Shadow AI
              </span>
            </div>
          </div>

          {/* Vertical SVG Stacked Column Chart + Tool Counts */}
          <div className="mt-5 grid grid-cols-4 gap-3 pt-2 items-end">
            {metrics.map((m) => {
              const isSelected =
                selectedDepartment === 'All Departments' || selectedDepartment === m.department;
              const isHovered = hoveredStackedDept === m.department;

              const sanctionedHeightPct = Math.max(
                4,
                Math.min(100, (m.sanctionedSpend / maxStackedValue) * 100)
              );
              const shadowHeightPct =
                m.shadowSpend > 0
                  ? Math.max(6, Math.min(100, (m.shadowSpend / maxStackedValue) * 100))
                  : 0;
              const shadowSharePct =
                m.totalSpend > 0 ? Math.round((m.shadowSpend / m.totalSpend) * 1000) / 10 : 0;

              return (
                <div
                  key={m.department}
                  onMouseEnter={() => setHoveredStackedDept(m.department)}
                  onMouseLeave={() => setHoveredStackedDept(null)}
                  onClick={() =>
                    onSelectDepartment(
                      selectedDepartment === m.department ? 'All Departments' : m.department
                    )
                  }
                  className={`group relative flex flex-col items-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    !isSelected
                      ? 'opacity-45 border-slate-100 bg-slate-50/40'
                      : isHovered
                      ? 'border-indigo-300 bg-indigo-50/25 shadow-xs'
                      : 'border-slate-200/70 bg-slate-50/40 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Total Spend Label on Top */}
                  <div className="font-mono text-xs font-bold text-slate-900 mb-1">
                    ${(m.totalSpend / 1000).toFixed(1)}k
                  </div>
                  <div
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded mb-2 ${
                      m.shadowSpend > 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                    }`}
                  >
                    {m.shadowSpend > 0 ? `${shadowSharePct}% Shadow` : '0% Shadow'}
                  </div>

                  {/* SVG Stacked Column */}
                  <div className="w-full h-40 flex items-end justify-center px-2">
                    <svg
                      viewBox="0 0 60 160"
                      className="w-12 h-full overflow-visible"
                      role="img"
                      aria-label={`${m.department}: Sanctioned ${m.sanctionedSpend}, Shadow AI ${m.shadowSpend}`}
                    >
                      {/* Background Pillar Track */}
                      <rect
                        x="6"
                        y="0"
                        width="48"
                        height="160"
                        rx="6"
                        fill="#F1F5F9"
                      />

                      {/* Sanctioned Spend Base Bar (Indigo) */}
                      <rect
                        x="6"
                        y={160 - (sanctionedHeightPct / 100) * 160}
                        width="48"
                        height={(sanctionedHeightPct / 100) * 160}
                        rx="4"
                        fill="#4F46E5"
                      />

                      {/* Shadow AI Top Stacked Bar (Rose) */}
                      {shadowHeightPct > 0 && (
                        <rect
                          x="6"
                          y={
                            160 -
                            ((sanctionedHeightPct + shadowHeightPct) / 100) * 160 -
                            2
                          }
                          width="48"
                          height={(shadowHeightPct / 100) * 160}
                          rx="4"
                          fill="#EF4444"
                        />
                      )}
                    </svg>
                  </div>

                  {/* Department Name */}
                  <div className="mt-2.5 text-xs font-bold text-slate-900">{m.shortName}</div>

                  {/* Tool Count Callout Badge */}
                  <div className="mt-1.5 w-full space-y-1 text-center">
                    <div className="text-[10px] font-medium text-indigo-700 bg-indigo-50/90 border border-indigo-200/60 rounded px-1.5 py-0.5 truncate">
                      {m.sanctionedToolCount} Sanctioned
                    </div>
                    <div
                      className={`text-[10px] font-semibold rounded px-1.5 py-0.5 truncate border ${
                        m.shadowToolCount > 0
                          ? 'text-rose-700 bg-rose-50 border-rose-200'
                          : 'text-slate-500 bg-slate-100 border-slate-200'
                      }`}
                    >
                      {m.shadowToolCount} Shadow
                    </div>
                  </div>

                  {/* Hover Tooltip */}
                  {isHovered && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full z-40 w-60 rounded-xl bg-slate-900 text-white p-3 shadow-xl border border-slate-700 pointer-events-none text-left"
                    >
                      <div className="text-xs font-bold text-white pb-1.5 mb-1.5 border-b border-slate-800">
                        {m.department}: {m.sanctionedToolCount} Sanctioned, {m.shadowToolCount} Shadow
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-indigo-300">Sanctioned Spend:</span>
                          <span className="font-mono font-semibold">
                            ${m.sanctionedSpend.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-rose-300">Shadow AI Spend:</span>
                          <span className="font-mono font-semibold text-rose-300">
                            ${m.shadowSpend.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800 text-slate-300">
                          <span>Dept Head:</span>
                          <span className="font-medium">{m.deptHead.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CISO Discovery Insight Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 text-[11px]">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span>
              <strong>Eng: 4 Sanctioned, 5 Shadow</strong> • Highest unapproved card & OAuth density
            </span>
          </span>
          <span className="text-[11px] font-medium text-indigo-600">Click bar to filter</span>
        </div>
      </div>
    </section>
  );
};

