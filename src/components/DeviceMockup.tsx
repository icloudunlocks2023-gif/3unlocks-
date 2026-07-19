import React from 'react';
import { Wifi, Battery, Eye, ChevronLeft } from 'lucide-react';

export default function DeviceMockup() {
  return (
    <div id="device-mockup" className="relative w-full max-w-[460px] mx-auto">
      {/* Borderless screen with gorgeous soft shadow, representing the raw interface */}
      <div className="relative bg-white rounded-[32px] shadow-2xl border border-slate-100 aspect-[3/4] flex flex-col overflow-hidden">
        {/* Status Bar */}
        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 px-6 pt-4 pb-1 select-none">
          <span>9:41 AM Mon Jun 10</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-slate-500" />
            <span>100%</span>
            <Battery className="w-4 h-3 text-slate-500 fill-slate-500" />
          </div>
        </div>

        {/* Nav bar */}
        <div className="flex justify-between items-center text-xs text-[#1E4DFF] font-medium px-6 py-3 select-none">
          <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
            <ChevronLeft className="w-4 h-4 -ml-1" />
            <span>Back</span>
          </div>
          <span className="cursor-pointer hover:opacity-80 font-semibold transition-opacity">Next</span>
        </div>

        {/* Main Activation Lock Content */}
        <div className="flex-1 flex flex-col items-center justify-between w-full max-w-[320px] mx-auto text-center px-4 pt-8 pb-8 select-none">
          
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            {/* Filled blue lock icon */}
            <div className="text-[#1E4DFF] mb-5">
              <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 text-[#1E4DFF]">
                {/* Lock Shackle */}
                <path
                  d="M7 10V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V10"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                {/* Lock Body */}
                <rect x="5.5" y="9.5" width="13" height="10" rx="3.2" fill="currentColor" />
              </svg>
            </div>

            {/* Header */}
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">
              Activation Lock
            </h3>

            {/* Description paragraphs exactly matching second screenshot layout */}
            <div className="text-[11px] sm:text-[12px] leading-relaxed text-slate-600 space-y-3.5 mb-6">
              <p>
                Activation Lock prevents anyone who is not the owner from using this iPad.
              </p>
              <p>
                To unlock this iPad, enter the Apple ID and password that were used during setup.
              </p>
            </div>

            {/* Grouped Input fields as a single contiguous card/block */}
            <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Apple ID"
                  disabled
                  value=""
                  className="w-full text-xs sm:text-sm px-4 py-3.5 bg-white text-slate-400 placeholder-slate-400 focus:outline-none border-b border-slate-150"
                />
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  disabled
                  value=""
                  className="w-full text-xs sm:text-sm px-4 py-3.5 bg-white text-slate-400 placeholder-slate-400 focus:outline-none"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Activation help link at bottom */}
          <div className="w-full pt-4">
            <span className="text-xs font-semibold text-[#1E4DFF] hover:underline cursor-pointer transition-all">
              Activation Lock Help
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

