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
  LifeBuoy,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X
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

// Robust HTML-to-table parser to structure reviewer response feedback as clean key-values
function parseFeedbackToTable(html: string) {
  if (!html) return [];
  
  // Convert basic HTML block/line tags into newlines
  let text = html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n');
    
  // Strip all other HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
    
  const rows: { key: string; value: string }[] = [];
  lines.forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > -1) {
      const key = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      rows.push({ key, value });
    } else {
      const lower = line.toLowerCase();
      if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('apple') || lower.includes('model')) {
        rows.push({ key: 'Verified Model', value: line });
      } else if (lower.includes('imei') || lower.includes('sn') || lower.includes('serial')) {
        rows.push({ key: 'Device Identifier', value: line });
      } else {
        rows.push({ key: 'Reviewer Note', value: line });
      }
    }
  });
  return rows;
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
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showDiagnosticTable, setShowDiagnosticTable] = useState(false);

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

  // Reusable High-Fidelity 3uTools panel renderer
  const renderThreeUToolsPanel = () => {
    const tableItems = [
      {
        leftLabel: "iOS Version",
        leftVal: iosFull,
        rightLabel: "Apple ID Lock",
        rightVal: "Off",
        rightAction: "Online Query"
      },
      {
        leftLabel: "Jailbroken",
        leftVal: "No",
        rightLabel: "iCloud",
        rightVal: "Off",
        rightAction: "Details"
      },
      {
        leftLabel: "Activated",
        leftVal: "Yes",
        rightLabel: "Production Date",
        rightVal: mfgDate
      },
      {
        leftLabel: "Product Type",
        leftVal: modelIdentifier,
        rightLabel: "Warranty Date",
        rightVal: "Inquiring..."
      },
      {
        leftLabel: "Sales Model",
        leftVal: getStableValue(seed, ['MQ9V3 ZP/A', 'MQ9U3 LL/A', 'MQ9T3 CH/A', 'MQ9R3 JP/A']),
        rightLabel: "Sales Region",
        rightVal: salesRegion
      },
      {
        leftLabel: "IMEI",
        leftVal: imei1,
        rightLabel: "CPU",
        rightVal: getStableValue(seed, ['A16 Hexa', 'A17 Hexa', 'A15 Hexa', 'A14 Hexa']),
        rightAction: "Details"
      },
      {
        leftLabel: "Serial Number",
        leftVal: serialNum,
        rightLabel: "Hard Disk Type",
        rightVal: getStableValue(seed, ['TLC', 'QLC', 'MLC']),
        rightAction: "Details"
      },
      {
        leftLabel: "ECID",
        leftVal: currentCheck.ecid || ('00184' + getStableInt(seed, 1000000, 9999999).toString(16).toUpperCase()),
        rightLabel: "Charge Times",
        rightVal: `${chargeCycles} Times`
      },
      {
        leftLabel: "Crash Analysis",
        leftVal: "0 Times",
        leftAction: "Details",
        rightLabel: "Battery Life",
        rightVal: `${batteryLife}%`,
        rightAction: "Details"
      }
    ];

    const udidVal = getStableHash(seed).toString(16).padEnd(40, '0').substring(0, 40).toUpperCase();

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5 font-sans text-[11px] text-[#334155]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 border-b border-slate-100 pb-4">
          {tableItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {/* Left Column Item */}
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100/60">
                <span className="text-[#94A3B8] font-normal">{item.leftLabel}</span>
                <span className="text-[#334155] font-semibold flex items-center select-all">
                  {item.leftVal}
                  {item.leftAction && (
                    <span className="text-[#1E4DFF] hover:underline cursor-pointer ml-1 text-[10px] font-sans font-medium">
                      [{item.leftAction}]
                    </span>
                  )}
                </span>
              </div>
              
              {/* Right Column Item */}
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100/60">
                <span className="text-[#94A3B8] font-normal">{item.rightLabel}</span>
                <span className="text-[#334155] font-semibold flex items-center select-all">
                  {item.rightVal}
                  {item.rightAction && (
                    <span className="text-[#1E4DFF] hover:underline cursor-pointer ml-1 text-[10px] font-sans font-medium">
                      [{item.rightAction}]
                    </span>
                  )}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
        
        {/* UDID full width footer inside table */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 text-[10px] text-[#94A3B8]">
          <span>UDID</span>
          <span className="font-mono font-bold text-[#475569] select-all tracking-tight sm:text-right mt-0.5 sm:mt-0 break-all">
            {udidVal}
          </span>
        </div>
      </div>
    );
  };

  // Centered rich administrator feedback renderer
  const renderFeedbackText = () => {
    const feedback = currentCheck.adminFeedback;
    if (!feedback) {
      return (
        <div className="text-center py-2 flex flex-col items-center justify-center space-y-1.5 font-sans">
          <div className="text-[#0F172A] font-extrabold text-sm sm:text-base leading-snug">
            {currentCheck.device || 'Verified Apple Device'}
          </div>
          <div className="text-[#475569] text-xs sm:text-sm font-medium leading-relaxed max-w-2xl">
            Your device eligibility has been verified. Please proceed with payment or firmware generation below.
          </div>
        </div>
      );
    }

    // Check if feedback looks like HTML
    const hasHtml = /<[a-z][\s\S]*>/i.test(feedback);
    
    if (hasHtml) {
      return (
        <div 
          className="text-center py-2 flex flex-col items-center justify-center space-y-1 text-sm sm:text-base text-slate-800 font-sans leading-relaxed select-all"
          dangerouslySetInnerHTML={{ __html: feedback }}
        />
      );
    }

    // Parse plain text by lines to styled blocks
    const lines = feedback.split('\n').map(l => l.trim()).filter(Boolean);
    return (
      <div className="text-center py-2 flex flex-col items-center justify-center space-y-1 text-sm sm:text-base text-slate-800 font-sans leading-relaxed select-all">
        {lines.map((line, idx) => {
          const isHeader = idx === 0 && !line.includes(':');
          if (isHeader) {
            return (
              <div key={idx} className="text-[#0F172A] font-extrabold text-sm sm:text-base">
                {line}
              </div>
            );
          }
          return (
            <div key={idx} className="text-[#475569] text-xs sm:text-sm font-medium">
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  // Parsed administrator feedback table rows
  const feedbackRows = parseFeedbackToTable(currentCheck.adminFeedback || '');

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="inline-block bg-[#EFFDF4] border border-[#DCFCE7] text-[#15803D] text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                  CHECK COMPLETED
                </span>
                <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  Compatibility Results
                </h2>
              </div>
              <button
                onClick={onCloseCheck}
                className="text-sm text-[#475569] hover:text-[#1E4DFF] hover:underline font-bold transition-colors cursor-pointer"
              >
                Check another device
              </button>
            </div>

            <hr className="border-slate-150" />

            {/* DEVICE DETAILS Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-[#94A3B8] tracking-widest font-mono">
                DEVICE DETAILS
              </h3>
              
              <div className="bg-[#F8FAFC]/50 rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-[#94A3B8] font-mono text-[10px] tracking-wider">
                      <th className="text-left py-3 px-5 font-bold uppercase">FIELD</th>
                      <th className="text-left py-3 px-5 font-bold uppercase">VALUE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 font-sans text-sm text-[#334155]">
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 text-[#94A3B8] font-medium">Device</td>
                      <td className="py-3 px-5 text-[#0F172A] font-bold">{currentCheck.device || 'iPhone 17'}</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 text-[#94A3B8] font-medium">IMEI / Serial</td>
                      <td className="py-3 px-5 text-[#0F172A] font-bold select-all">{currentCheck.imeiSerial}</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 text-[#94A3B8] font-medium">ECID</td>
                      <td className="py-3 px-5 text-[#0F172A] font-bold select-all">{currentCheck.ecid || 'N/A'}</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 text-[#94A3B8] font-medium">iOS Version</td>
                      <td className="py-3 px-5 text-[#0F172A] font-bold">v{currentCheck.iosVersion}</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 text-[#94A3B8] font-medium">Support Status</td>
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center gap-1 border border-[#DCFCE7] bg-[#EFFDF4] text-[#15803D] text-xs font-bold px-2.5 py-0.5 rounded-full">
                          ✓ Supported
                        </span>
                      </td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 text-[#94A3B8] font-medium">Success Rate</td>
                      <td className="py-3 px-5 text-[#10B981] font-bold">{currentCheck.successRate || '88%'}</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 text-[#94A3B8] font-medium">Registration Required</td>
                      <td className="py-3 px-5 text-[#334155] font-semibold">{currentCheck.registrationRequired || 'Yes'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ADMINISTRATOR FEEDBACK Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase text-[#94A3B8] tracking-widest font-mono">
                ADMINISTRATOR FEEDBACK
              </h3>
              
              <div className="bg-[#F0F7FF]/55 border border-blue-100/70 rounded-[24px] p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E4DFF]" />
                  <span className="text-[10px] font-mono uppercase text-[#64748B] tracking-wider font-semibold">
                    REVIEWER RESPONSE
                  </span>
                </div>
                
                {/* Custom formatted response text block */}
                {renderFeedbackText()}
              </div>
            </div>

            {/* Premium Control Bar for 3uTools Diagnostic Report */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-150 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-left">
                <div className="text-xs font-bold text-slate-800">High-Fidelity Diagnostic Verification Report</div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Detailed hardware authenticity checklists, battery cycles, disk space, and motherboard diagnostics.
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDiagnosticTable(!showDiagnosticTable)}
                  className="flex-1 md:flex-none px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                  <span>{showDiagnosticTable ? 'Collapse Details' : 'Show Report Inline'}</span>
                  {showDiagnosticTable ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiagnosticModal(true)}
                  className="flex-1 md:flex-none px-3.5 py-2 bg-[#1E4DFF]/10 hover:bg-[#1E4DFF]/15 text-[#1E4DFF] text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Show as Pop-up</span>
                </button>
              </div>
            </div>

            {/* Inline Collapsible Diagnostic Table */}
            <AnimatePresence>
              {showDiagnosticTable && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden pt-1"
                >
                  {renderThreeUToolsPanel()}
                </motion.div>
              )}
            </AnimatePresence>

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

      {/* 3uTools Diagnostic Report Pop-up Modal */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDiagnosticModal(false)} />
          <div className="relative bg-[#F8FAFC] rounded-[24px] p-6 sm:p-8 max-w-4xl w-full border border-slate-200 shadow-2xl z-50 space-y-6 text-left animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-50 text-[#1E4DFF] px-2.5 py-0.5 rounded-full border border-blue-100">
                    High-Fidelity Diagnostics
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    System Verified
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#1E4DFF]" />
                  3uTools Verification Report
                </h3>
              </div>
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reusable High-Fidelity Table Grid */}
            {renderThreeUToolsPanel()}

            {/* Footer action to close */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="px-6 py-2.5 bg-[#1E4DFF] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md shadow-blue-500/10"
              >
                Close Diagnostic Table
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
