import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Smartphone, 
  Cpu, 
  Layers, 
  Download, 
  CreditCard, 
  Info, 
  ExternalLink,
  LifeBuoy
} from 'lucide-react';
import { DeviceCheck } from '../types';

interface DeviceCheckWorkflowProps {
  currentCheck: DeviceCheck;
  onRetry: () => void;
  onMakePayment: () => void;
  onGenerateFirmware: () => void;
  onCloseCheck: () => void;
}

const STATUS_MESSAGES = [
  "✓ Validating request and input format",
  "✓ Normalizing device identifier (IMEI / Serial / TAC)",
  "✓ Completing Cloudflare security verification",
  "✓ Connecting to iCloud unlock servers",
  "✓ Querying manufacturer and model reference database",
  "✓ Checking device model details",
  "✓ Checking iCloud (Find My) activation status",
  "✓ Checking blacklist / carrier status",
  "✓ Searching multiple secure data sources",
  "✓ Correlating results and resolving matches",
  "✓ Applying server-side validation rules",
  "✓ Verifying unlock server support eligibility",
  "✓ Finalizing compatibility check"
];

// Stable generator helpers based on device specs to make 3uTools diagnostics realistic and consistent
function getStableHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getStableValue<T>(seed: string, options: T[]): T {
  const hash = getStableHash(seed);
  return options[hash % options.length];
}

function getStableInt(seed: string, min: number, max: number): number {
  const hash = getStableHash(seed);
  return min + (hash % (max - min + 1));
}

export default function DeviceCheckWorkflow({
  currentCheck,
  onRetry,
  onMakePayment,
  onGenerateFirmware,
  onCloseCheck
}: DeviceCheckWorkflowProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(1);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isFinalAnimating, setIsFinalAnimating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // Generate stable mock values for 3uTools simulation
  const seed = currentCheck.imeiSerial || currentCheck.requestId || "default";
  
  // 1. Device name & specs
  const deviceName = currentCheck.device || "iPhone 12 Pro";
  const isIpad = deviceName.toLowerCase().includes('ipad');
  
  // 2. Model Identifier
  const modelIdentifier = getStableValue(seed, isIpad ? [
    'iPad13,4 (A2377)', 'iPad13,8 (A2301)', 'iPad14,1 (A2567)', 'iPad11,3 (A2123)', 'iPad12,1 (A2197)'
  ] : [
    'iPhone13,2 (A2482)', 'iPhone14,2 (A2638)', 'iPhone15,3 (A3102)', 'iPhone12,1 (A2221)', 'iPhone14,5 (A2633)'
  ]);

  // 3. Serial Number & IMEIs
  let serialNum = '';
  let imei1 = '';
  let imei2 = '';
  if (seed.length === 12) {
    serialNum = seed;
    const imeiBase = '353056111' + getStableInt(seed, 100000, 999999).toString();
    imei1 = imeiBase + '2';
    imei2 = imeiBase + '7';
  } else {
    imei1 = seed;
    const lastDigits = getStableInt(seed, 10, 99).toString();
    imei2 = seed.substring(0, Math.max(0, seed.length - 2)) + lastDigits;
    serialNum = 'FFMDF7J' + getStableInt(seed, 1000, 9999).toString().padEnd(5, 'X');
  }

  // 4. Sales Region
  const salesRegion = getStableValue(seed, ['LL/A (USA)', 'ZP/A (Singapore)', 'CH/A (China)', 'KH/A (Korea)', 'FD/A (Austria)']);

  // 5. iOS build code
  const iosBuild = getStableValue(currentCheck.iosVersion || seed, ['23F84', '22G74', '21E236', '21F79', '20F75']);
  const iosFull = `${currentCheck.iosVersion || '17.5.1'} (${iosBuild})`;

  // 6. Mfg Date
  const mfgMonth = getStableInt(seed, 1, 12).toString().padStart(2, '0');
  const mfgYear = getStableInt(seed, 2017, 2024).toString();
  const mfgDate = `${mfgMonth}/${getStableInt(seed, 10, 28)}/${mfgYear}`;

  // 7. Battery & Storage Specs
  const batteryLife = getStableInt(seed, 82, 100);
  const chargeCycles = getStableInt(seed, 80, 720);
  
  const storageTotal = getStableValue(seed, [64, 128, 256, 512]);
  const storageUsedPercent = getStableInt(seed, 40, 92);
  const storageAvailable = (storageTotal * (1 - storageUsedPercent / 100)).toFixed(2);

  // 8. Face ID vs Touch ID
  const biometricsLabel = (deviceName.toLowerCase().includes('se') || deviceName.toLowerCase().includes('8') || deviceName.toLowerCase().includes('7') || (isIpad && !deviceName.toLowerCase().includes('pro'))) 
    ? 'Touch ID' 
    : 'Face ID';

  // Keep a ref to animatedProgress to use inside final animation callback safely
  const progressRef = useRef(animatedProgress);
  useEffect(() => {
    progressRef.current = animatedProgress;
  }, [animatedProgress]);

  // Calculate elapsed seconds relative to submittedAt
  useEffect(() => {
    if (currentCheck.currentStatus === 'Waiting' || currentCheck.currentStatus === 'Reviewing') {
      const calculateElapsed = () => {
        const submittedTime = new Date(currentCheck.submittedAt).getTime();
        const seconds = Math.floor((Date.now() - submittedTime) / 1000);
        return Math.max(0, seconds);
      };

      setElapsedSeconds(calculateElapsed());
      setShowResults(false);
      setIsFinalAnimating(false);

      const interval = setInterval(() => {
        const seconds = calculateElapsed();
        setElapsedSeconds(seconds);

        // Slow progression over 5 minutes (300 seconds) up to 98%
        if (seconds < 300) {
          const pct = Math.min(98, Math.floor(1 + (seconds / 300) * 97));
          setAnimatedProgress(pct);

          // Rotate messages smoothly every 14 seconds (index 0 to 12)
          const msgIdx = Math.min(12, Math.floor(seconds / 14));
          setCurrentMessageIndex(msgIdx);
        } else {
          setAnimatedProgress(98);
          setCurrentMessageIndex(12);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentCheck.submittedAt, currentCheck.currentStatus]);

  // Handle final completion animation when status changes to 'Feedback Sent'
  useEffect(() => {
    if (currentCheck.currentStatus === 'Feedback Sent' && !showResults && !isFinalAnimating) {
      setIsFinalAnimating(true);
      
      const startVal = progressRef.current;
      const duration = 2000; // 2 seconds
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const passed = now - startTime;

        if (passed >= duration) {
          setAnimatedProgress(100);
          setShowResults(true);
          setIsFinalAnimating(false);
        } else {
          const pct = passed / duration;
          const currentVal = Math.floor(startVal + (100 - startVal) * pct);
          setAnimatedProgress(currentVal);
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [currentCheck.currentStatus]);

  // Determine isTimedOut
  const isTimedOut = elapsedSeconds >= 300 && (currentCheck.currentStatus === 'Waiting' || currentCheck.currentStatus === 'Reviewing');

  // Handle direct view results bypass (if they click notification after timeout or refresh)
  useEffect(() => {
    if (currentCheck.currentStatus === 'Feedback Sent' && !isFinalAnimating) {
      setAnimatedProgress(100);
      setShowResults(true);
    }
  }, [currentCheck.currentStatus]);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        
        {/* CASE A: Loading & Processing Screen */}
        {!showResults && !isTimedOut && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-xl space-y-8 text-center max-w-xl mx-auto"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Checking Device Compatibility
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm font-medium px-4">
                Please be patient while we verify your device. This usually takes a few minutes.
              </p>
            </div>

            {/* Apple Style Premium Circular or Bar Progress Indicator */}
            <div className="space-y-4 max-w-sm mx-auto">
              
              {/* Progress Bar Container */}
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1E4DFF] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${animatedProgress}%` }}
                />
              </div>

              {/* Progress Percentage */}
              <div className="text-2xl font-black text-[#1E4DFF] tracking-tight font-mono">
                {animatedProgress}%
              </div>
            </div>

            {/* Animated Status Message Box */}
            <div className="h-12 flex items-center justify-center px-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentMessageIndex + (isFinalAnimating ? '-completed' : '')}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-slate-600 text-xs font-semibold tracking-normal"
                >
                  {isFinalAnimating ? "✓ Compatibility check completed." : STATUS_MESSAGES[currentMessageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Do not refresh notice */}
            <div className="pt-4 border-t border-slate-50 flex items-center justify-center gap-2 text-slate-400 text-[11px] font-medium">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Please do not refresh or close this page while your request is being processed.</span>
            </div>
          </motion.div>
        )}

        {/* CASE B: Server Busy Timeout Card */}
        {isTimedOut && !showResults && (
          <motion.div
            key="timeout"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[24px] p-8 border border-red-100 shadow-xl space-y-6 text-center max-w-xl mx-auto"
          >
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-100">
              <AlertTriangle className="w-7 h-7 text-red-500 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Server Busy
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium px-4 leading-relaxed">
                Our servers are currently experiencing a high volume of requests. Please try again later or contact support if the issue persists.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
              <button
                onClick={onRetry}
                className="w-full sm:w-1/2 bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs py-3.5 rounded-xl transition cursor-pointer shadow-md shadow-blue-500/10"
              >
                Retry Check
              </button>
              <button
                onClick={() => setSupportModalOpen(true)}
                className="w-full sm:w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3.5 rounded-xl transition cursor-pointer border border-slate-200"
              >
                Contact Support
              </button>
            </div>
          </motion.div>
        )}

        {/* CASE C: Results Panel */}
        {showResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] p-5 sm:p-8 border border-slate-200/80 shadow-xl space-y-6 text-left max-w-4xl mx-auto"
          >
            
            {/* Results Title with Action Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  Verification Passed
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Compatibility Diagnostic Results
                </h2>
              </div>
              <button
                onClick={onCloseCheck}
                className="text-xs text-[#1E4DFF] hover:text-blue-700 underline font-bold cursor-pointer transition-colors"
              >
                Check another device
              </button>
            </div>

            {/* 3uTools High-Fidelity Diagnostic Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Specs Table */}
              <div className="bg-white rounded-2xl border border-slate-200/70 p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="border-b border-slate-100 pb-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Device Specifications</h4>
                </div>
                <div className="space-y-2.5 text-[11px] font-mono text-left">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">iOS Version</span>
                    <span className="text-slate-800 font-bold">{iosFull}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">Serial Number</span>
                    <span className="text-slate-800 font-bold select-all">{serialNum}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">IMEI1</span>
                    <span className="text-slate-800 font-bold select-all">{imei1}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">IMEI2</span>
                    <span className="text-slate-800 font-bold select-all">{imei2}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">Model Identifier</span>
                    <span className="text-slate-800 font-bold">{modelIdentifier}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">Model Name</span>
                    <span className="text-slate-800 font-extrabold">{deviceName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">Sales Region</span>
                    <span className="text-slate-800 font-bold">{salesRegion}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">Activation</span>
                    <span className="text-emerald-600 font-bold uppercase text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">Unlocked</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">Jailbreak</span>
                    <span className="text-slate-800 font-bold">No</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">ID Lock</span>
                    <span className="text-emerald-600 font-bold uppercase text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">Unlocked</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">iCloud</span>
                    <span className="text-slate-500 font-bold">Off</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">Mfg. Date</span>
                    <span className="text-slate-800">{mfgDate}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-400">Warranty Period</span>
                    <span className="text-blue-600 hover:underline cursor-pointer font-bold">Online Query</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Crash Logs</span>
                    <span className="text-emerald-600 font-bold uppercase text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">No Crash</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Battery, Storage, Banner & Checklist */}
              <div className="space-y-4">
                
                {/* Battery & Storage Horizontal pair */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Battery Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/70 p-3 sm:p-4 flex justify-between items-center shadow-sm">
                    <div className="space-y-0.5 text-left">
                      <div className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1">
                        <span>Battery Life</span>
                        <span className="text-blue-600 text-[9px] font-bold hover:underline cursor-pointer">Details</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Cycles: {chargeCycles}</div>
                    </div>
                    
                    {/* Battery Indicator Circle */}
                    <div className="relative w-11 h-11 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500"
                          strokeDasharray={`${batteryLife}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                        {batteryLife}%
                      </div>
                    </div>
                  </div>

                  {/* Storage Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/70 p-3 sm:p-4 flex justify-between items-center shadow-sm">
                    <div className="space-y-0.5 text-left">
                      <div className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1">
                        <span>Hard Disk</span>
                        <span className="text-blue-600 text-[9px] font-bold hover:underline cursor-pointer">Details</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Free: {storageAvailable} GB</div>
                    </div>
                    
                    {/* Storage Indicator Circle */}
                    <div className="relative w-11 h-11 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-500"
                          strokeDasharray={`${100 - storageUsedPercent}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                        {100 - storageUsedPercent}%
                      </div>
                    </div>
                  </div>

                </div>

                {/* Unlocking done successfully banner */}
                <div className="bg-emerald-50 text-emerald-800 text-[13px] font-bold px-4 py-3 rounded-xl border border-emerald-100 flex items-center gap-2.5 shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    ✓
                  </div>
                  <span>Unlocking is done successfully</span>
                </div>

                {/* Diagnostic Checklist */}
                <div className="bg-white rounded-2xl border border-slate-200/70 p-4 sm:p-5 space-y-3.5 shadow-sm text-left">
                  <div className="border-b border-slate-100 pb-1.5">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Basic Information</h4>
                  </div>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Motherboard Status</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[9px] border border-emerald-200">✓</span>
                        Normal
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Battery Status</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[9px] border border-emerald-200">✓</span>
                        Normal
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Screen Status</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[9px] border border-emerald-200">✓</span>
                        Normal
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Front Camera</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[9px] border border-emerald-200">✓</span>
                        Normal
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Rear Camera</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[9px] border border-emerald-200">✓</span>
                        Normal
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">{biometricsLabel}</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[9px] border border-emerald-200">✓</span>
                        Normal
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Administrator Feedback Highlighted Card */}
            <div className="space-y-2.5 pt-2 text-left">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">
                Administrator Review Notes
              </h3>
              
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E4DFF]" />
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">Reviewer Response Message</span>
                </div>
                
                {/* Preservation of original HTML/Markdown Rich text formatting */}
                <div 
                  className="prose prose-slate max-w-none text-slate-700 text-xs sm:text-sm font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: currentCheck.adminFeedback || 'Your device has been reviewed. Support has been verified successfully. Please proceed with payment.' 
                  }} 
                />
              </div>
            </div>

            {/* Results Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={onMakePayment}
                className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/10"
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Make Payment</span>
              </button>
              <button
                onClick={onGenerateFirmware}
                className="w-full bg-[#E8F0FE] hover:bg-blue-100 text-[#1E4DFF] font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-blue-200"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Generate Firmware Link</span>
              </button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>

      {/* Support Info Modal Overlay */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSupportModalOpen(false)} />
          <div className="relative bg-white rounded-[24px] p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl z-50 space-y-6 text-left animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-[#1E4DFF]" />
                Customer Support Node
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium">
                Our support team is always available to verify your activation logs manually.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs font-mono space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span>Support Email:</span>
                <span className="font-bold text-slate-900">iunlockapple1427@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span>Active Server:</span>
                <span className="font-bold text-emerald-600">Enterprise Node S3-Unlocks</span>
              </div>
            </div>

            <button
              onClick={() => setSupportModalOpen(false)}
              className="w-full bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs py-3.5 rounded-xl transition"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
