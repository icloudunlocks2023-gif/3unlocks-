import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Smartphone, 
  ShoppingBag, 
  Activity, 
  Award,
  Globe,
  PieChart,
  BarChart,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function AdminAnalytics() {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Analytical Dataset Mock values for sleek visual graphings
  const revenueData = [
    { label: 'Mon', value: 120, checks: 45 },
    { label: 'Tue', value: 240, checks: 72 },
    { label: 'Wed', value: 180, checks: 50 },
    { label: 'Thu', value: 310, checks: 98 },
    { label: 'Fri', value: 420, checks: 124 },
    { label: 'Sat', value: 290, checks: 85 },
    { label: 'Sun', value: 380, checks: 110 }
  ];

  const countryShare = [
    { name: 'United States', percentage: 42, color: 'bg-blue-600' },
    { name: 'Brazil', percentage: 21, color: 'bg-emerald-500' },
    { name: 'United Kingdom', percentage: 15, color: 'bg-indigo-500' },
    { name: 'Poland', percentage: 12, color: 'bg-amber-500' },
    { name: 'Others', percentage: 10, color: 'bg-slate-400' }
  ];

  const maxRevenue = Math.max(...revenueData.map(d => d.value));
  const maxChecks = Math.max(...revenueData.map(d => d.checks));

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-300">
      
      {/* Intro section */}
      <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 font-sans flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-[#1E4DFF]" />
            Business Intelligence & Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Real-time tracking of FMI locks unlocked, gross margins, geographical origins, and pipeline throughput.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 font-bold">
          <TrendingUp className="w-4 h-4" />
          <span>+24.8% growth this week</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Revenue & Checks Curve SVG Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-[20px] border border-slate-100 p-6 shadow-sm text-left space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Performance</h3>
              <p className="text-[11px] text-slate-400">Comparing iCloud checks with gross revenue inflows</p>
            </div>
            <div className="flex gap-4 text-xs font-mono font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#1E4DFF]" />
                <span>Revenue ($)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
                <span>Device Checks</span>
              </div>
            </div>
          </div>

          {/* SVG Rendering Chart */}
          <div className="relative h-64 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="160" x2="500" y2="160" stroke="#f1f5f9" strokeWidth="1" />
              
              {/* REVENUE PATH (BLUE) */}
              <path
                d={`
                  M ${0 * 80 + 20} ${180 - (revenueData[0].value / maxRevenue) * 120}
                  C ${0 * 80 + 50} ${180 - (revenueData[0].value / maxRevenue) * 120},
                    ${1 * 80 - 10} ${180 - (revenueData[1].value / maxRevenue) * 120},
                    ${1 * 80 + 20} ${180 - (revenueData[1].value / maxRevenue) * 120}
                  C ${1 * 80 + 50} ${180 - (revenueData[1].value / maxRevenue) * 120},
                    ${2 * 80 - 10} ${180 - (revenueData[2].value / maxRevenue) * 120},
                    ${2 * 80 + 20} ${180 - (revenueData[2].value / maxRevenue) * 120}
                  C ${2 * 80 + 50} ${180 - (revenueData[2].value / maxRevenue) * 120},
                    ${3 * 80 - 10} ${180 - (revenueData[3].value / maxRevenue) * 120},
                    ${3 * 80 + 20} ${180 - (revenueData[3].value / maxRevenue) * 120}
                  C ${3 * 80 + 50} ${180 - (revenueData[3].value / maxRevenue) * 120},
                    ${4 * 80 - 10} ${180 - (revenueData[4].value / maxRevenue) * 120},
                    ${4 * 80 + 20} ${180 - (revenueData[4].value / maxRevenue) * 120}
                  C ${4 * 80 + 50} ${180 - (revenueData[4].value / maxRevenue) * 120},
                    ${5 * 80 - 10} ${180 - (revenueData[5].value / maxRevenue) * 120},
                    ${5 * 80 + 20} ${180 - (revenueData[5].value / maxRevenue) * 120}
                  C ${5 * 80 + 50} ${180 - (revenueData[5].value / maxRevenue) * 120},
                    ${6 * 80 - 10} ${180 - (revenueData[6].value / maxRevenue) * 120},
                    ${6 * 80 + 20} ${180 - (revenueData[6].value / maxRevenue) * 120}
                `}
                fill="none"
                stroke="#1E4DFF"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* CHECKS PATH (GREEN) */}
              <path
                d={`
                  M ${0 * 80 + 20} ${180 - (revenueData[0].checks / maxChecks) * 120}
                  C ${0 * 80 + 50} ${180 - (revenueData[0].checks / maxChecks) * 120},
                    ${1 * 80 - 10} ${180 - (revenueData[1].checks / maxChecks) * 120},
                    ${1 * 80 + 20} ${180 - (revenueData[1].checks / maxChecks) * 120}
                  C ${1 * 80 + 50} ${180 - (revenueData[1].checks / maxChecks) * 120},
                    ${2 * 80 - 10} ${180 - (revenueData[2].checks / maxChecks) * 120},
                    ${2 * 80 + 20} ${180 - (revenueData[2].checks / maxChecks) * 120}
                  C ${2 * 80 + 50} ${180 - (revenueData[2].checks / maxChecks) * 120},
                    ${3 * 80 - 10} ${180 - (revenueData[3].checks / maxChecks) * 120},
                    ${3 * 80 + 20} ${180 - (revenueData[3].checks / maxChecks) * 120}
                  C ${3 * 80 + 50} ${180 - (revenueData[3].checks / maxChecks) * 120},
                    ${4 * 80 - 10} ${180 - (revenueData[4].checks / maxChecks) * 120},
                    ${4 * 80 + 20} ${180 - (revenueData[4].checks / maxChecks) * 120}
                  C ${4 * 80 + 50} ${180 - (revenueData[4].checks / maxChecks) * 120},
                    ${5 * 80 - 10} ${180 - (revenueData[5].checks / maxChecks) * 120},
                    ${5 * 80 + 20} ${180 - (revenueData[5].checks / maxChecks) * 120}
                  C ${5 * 80 + 50} ${180 - (revenueData[5].checks / maxChecks) * 120},
                    ${6 * 80 - 10} ${180 - (revenueData[6].checks / maxChecks) * 120},
                    ${6 * 80 + 20} ${180 - (revenueData[6].checks / maxChecks) * 120}
                `}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="4 4"
              />

              {/* Data points */}
              {revenueData.map((d, index) => {
                const cx = index * 80 + 20;
                const cyRevenue = 180 - (d.value / maxRevenue) * 120;
                const cyChecks = 180 - (d.checks / maxChecks) * 120;
                const isHovered = hoveredPoint === index;

                return (
                  <g key={index} onMouseEnter={() => setHoveredPoint(index)} onMouseLeave={() => setHoveredPoint(null)}>
                    {/* Revenue Circle */}
                    <circle
                      cx={cx}
                      cy={cyRevenue}
                      r={isHovered ? 6 : 4}
                      fill="#1E4DFF"
                      className="cursor-pointer transition-all"
                    />
                    {/* Checks Circle */}
                    <circle
                      cx={cx}
                      cy={cyChecks}
                      r={isHovered ? 5 : 3.5}
                      fill="#10b981"
                      className="cursor-pointer transition-all"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Labels under the graph */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[10px] text-slate-400 font-mono font-bold">
              {revenueData.map((d, index) => (
                <span key={index} className="w-14 text-center">{d.label}</span>
              ))}
            </div>

            {/* Tooltip Hover Overlay */}
            {hoveredPoint !== null && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white p-3 rounded-xl border border-slate-800 text-[10px] font-mono space-y-1 shadow-lg z-10">
                <div className="font-bold border-b border-slate-800 pb-1 mb-1 text-slate-400">{revenueData[hoveredPoint].label} Statistics</div>
                <div>Revenue: <strong className="text-white">${revenueData[hoveredPoint].value} USDT</strong></div>
                <div>Device Checks: <strong className="text-emerald-400">{revenueData[hoveredPoint].checks}</strong></div>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown side panel (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-[20px] border border-slate-100 p-6 shadow-sm space-y-6 text-left">
          
          {/* Countries origin breakdown */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <Globe className="w-4 h-4 text-slate-500" />
                Geographic Sources
              </h3>
              <p className="text-[10px] text-slate-400">Origin of API checking request</p>
            </div>

            <div className="space-y-3">
              {countryShare.map((c) => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                    <span>{c.name}</span>
                    <span>{c.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100/50">
                    <div className={`${c.color} h-full rounded-full`} style={{ width: `${c.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Efficiency indicators */}
          <div className="border-t border-slate-50 pt-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                System Success Rates
              </h3>
              <p className="text-[10px] text-slate-400">Total processed unlock yield metrics</p>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-center">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <span className="text-[9px] text-slate-400 block font-bold">FMI OFF SUCCESS</span>
                <span className="text-lg font-black text-[#1E4DFF] block mt-0.5">99.4%</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <span className="text-[9px] text-slate-400 block font-bold">AVG UNLOCK TIME</span>
                <span className="text-lg font-black text-emerald-600 block mt-0.5">3.8 min</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
