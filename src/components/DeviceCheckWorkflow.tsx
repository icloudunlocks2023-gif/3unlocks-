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
  X,
  Zap
} from 'lucide-react';
import { DeviceCheck } from '../types';

interface DeviceCheckWorkflowProps {
  currentCheck: DeviceCheck;
  onRetry: () => void;
  onMakePayment: () => void;
  onGenerateFirmware: () => void;
  onActivateDevice?: () => void;
  onCloseCheck: () => void;
}

const parseFeedbackText = (feedbackHtml: string) => {
  if (!feedbackHtml) return [];
  
  // Replace break tags with newlines and strip any other tags
  const clean = feedbackHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
    
  const lines = clean.split('\n');
  const results: { key: string; val: string }[] = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex !== -1) {
      const key = trimmed.slice(0, colonIndex).trim();
      const val = trimmed.slice(colonIndex + 1).trim();
      results.push({ key, val });
    } else {
      results.push({ key: 'Reviewer Note', val: trimmed });
    }
  });
  
  return results;
};

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

export default function DeviceCheckWorkflow({
  currentCheck,
  onRetry,
  onMakePayment,
  onGenerateFirmware,
  onActivateDevice,
  onCloseCheck
}: DeviceCheckWorkflowProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(1);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isFinalAnimating, setIsFinalAnimating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

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

  // Handle final completion animation when status changes to completed/reviewed
  useEffect(() => {
    const isCompleted = ['Feedback Sent', 'Supported', 'FMI OFF', 'Not Supported'].includes(currentCheck.currentStatus);
    if (isCompleted && !showResults && !isFinalAnimating) {
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
          setIsMinimized(false);
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

  // Handle direct view results unlock (if they click notification after timeout or refresh)
  useEffect(() => {
    const isCompleted = ['Feedback Sent', 'Supported', 'FMI OFF', 'Not Supported'].includes(currentCheck.currentStatus);
    if (isCompleted && !isFinalAnimating) {
      setAnimatedProgress(100);
      setShowResults(true);
      setIsMinimized(false);
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
              <a
                href="https://t.me/Unlocks_3u"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-2/3 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs py-3.5 px-3 rounded-xl transition cursor-pointer shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 text-center"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>Join our Telegram community for updates & information</span>
              </a>
              <button
                onClick={onCloseCheck}
                className="w-full sm:w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3.5 rounded-xl transition cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* CASE C: Results Panel */}
        {showResults && (
          <>
            {/* If minimized, show a clean inline preview card instead of blocking the main content area */}
            {isMinimized ? (
              <motion.div
                key="results-minimized"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-md space-y-4 text-center max-w-xl mx-auto"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900">Check Completed</h3>
                  <p className="text-slate-500 text-xs font-mono">
                    Device compatibility results are active for IMEI: {currentCheck.imeiSerial}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsMinimized(false)}
                    className="bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-blue-500/10 w-full sm:w-auto"
                  >
                    Show Compatibility Results
                  </button>
                  <button
                    onClick={onCloseCheck}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm w-full sm:w-auto"
                  >
                    Check Another Device
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Modal Overlay Background & Container */
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop with click-to-minimize */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
                  onClick={() => setIsMinimized(true)} 
                />
                
                {/* Modal Main Body */}
                <motion.div
                  key="results-modal"
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                  className="relative bg-white rounded-[24px] p-6 sm:p-8 border border-slate-100 shadow-2xl space-y-6 text-left max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10"
                >
                  
                  {/* Results Title with Action Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full">
                          Check Completed
                        </span>
                        <button
                          onClick={() => setIsMinimized(true)}
                          className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full transition cursor-pointer"
                        >
                          Collapse Panel
                        </button>
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        Compatibility Results
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={onCloseCheck}
                        className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold cursor-pointer"
                      >
                        Check another device
                      </button>
                      <button
                        onClick={() => setIsMinimized(true)}
                        className="text-slate-400 hover:text-slate-600 bg-slate-50 border border-slate-200 p-1.5 rounded-lg cursor-pointer transition-colors"
                        title="Minimize"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* If it was an existing lookup */}
                  {['Feedback Sent', 'Supported', 'FMI OFF', 'Not Supported'].includes(currentCheck.currentStatus) && (
                    <div className="bg-blue-50 border border-blue-100 text-[#1E4DFF] px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold font-sans">
                      <Info className="w-4 h-4 shrink-0 text-[#1E4DFF]" />
                      <span>Compatibility results found. This device has already been reviewed.</span>
                    </div>
                  )}

                  {/* Device Information & Feedback arranged in ONE unified premium table */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">
                      Device Specifications & Verification Results
                    </h3>
                    
                    <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-x-auto text-xs">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100/80 bg-slate-100/35">
                            <th className="text-left py-2.5 px-4 font-semibold text-slate-500 font-mono text-[10px]">FIELD</th>
                            <th className="text-left py-2.5 px-4 font-semibold text-slate-500 font-mono text-[10px]">VALUE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                          <tr>
                            <td className="py-2.5 px-4 text-slate-400 font-medium">Device Model</td>
                            <td className="py-2.5 px-4 text-slate-900 font-extrabold">{currentCheck.device || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 text-slate-400 font-medium">IMEI / Serial Number</td>
                            <td className="py-2.5 px-4 text-slate-900 font-mono font-bold select-all">{currentCheck.imeiSerial}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 text-slate-400 font-medium">ECID</td>
                            <td className="py-2.5 px-4 text-slate-900 font-mono font-bold select-all">{currentCheck.ecid}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 text-slate-400 font-medium">iOS Version</td>
                            <td className="py-2.5 px-4 text-slate-900 font-bold">v{currentCheck.iosVersion}</td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 text-slate-400 font-medium">Compatibility Status</td>
                            <td className="py-2.5 px-4">
                              <span className="font-extrabold uppercase text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-md">
                                {currentCheck.currentStatus}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 text-slate-400 font-medium">Support Status</td>
                            <td className="py-2.5 px-4">
                              {currentCheck.supportStatus === 'Not Supported' ? (
                                <span className="font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 text-[11px] inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500" />
                                  Not Supported
                                </span>
                              ) : (
                                <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-[11px] inline-flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                                  {currentCheck.supportStatus || 'Supported'}
                                </span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 text-slate-400 font-medium">FMI Status</td>
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-slate-700">
                                {currentCheck.fmiStatus ? `FMI ${currentCheck.fmiStatus}` : 'N/A'}
                              </span>
                            </td>
                          </tr>
                          {!['FMI OFF', 'Not Supported'].includes(currentCheck.supportStatus || '') &&
                           !['FMI OFF', 'Not Supported'].includes(currentCheck.currentStatus || '') && (
                            <tr>
                              <td className="py-2.5 px-4 text-slate-400 font-medium">Success Rate</td>
                              <td className="py-2.5 px-4 text-emerald-600 font-extrabold">{currentCheck.successRate || 'N/A'}</td>
                            </tr>
                          )}
                          <tr>
                            <td className="py-2.5 px-4 text-slate-400 font-medium">Unlock Price</td>
                            <td className="py-2.5 px-4 text-[#1E4DFF] font-black font-mono">
                              {currentCheck.price || 'N/A'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-4 text-slate-400 font-medium">Date Created</td>
                            <td className="py-2.5 px-4 text-slate-500 font-mono font-medium">
                              {new Date(currentCheck.submittedAt).toLocaleString()}
                            </td>
                          </tr>
                          {currentCheck.lastUpdated && (
                            <tr>
                              <td className="py-2.5 px-4 text-slate-400 font-medium">Last Updated</td>
                              <td className="py-2.5 px-4 text-slate-500 font-mono font-medium">
                                {new Date(currentCheck.lastUpdated).toLocaleString()}
                              </td>
                            </tr>
                          )}

                          {/* Unlock Server Report Section Header */}
                          <tr className="bg-slate-100/35 border-y border-slate-100">
                            <td colSpan={2} className="py-2.5 px-4 text-[#1E4DFF] font-bold uppercase tracking-wider text-[10px] font-mono">
                              Unlock Server Report
                            </td>
                          </tr>

                          {/* Render Parsed Feedback Rows */}
                          {parseFeedbackText(currentCheck.adminFeedback || 'Your device has been reviewed. Support has been verified successfully. Please proceed with payment.').map((item, index) => {
                            const isCode = item.key.toLowerCase().includes('imei') || 
                                           item.key.toLowerCase().includes('serial') || 
                                           item.key.toLowerCase().includes('ecid') || 
                                           item.key.toLowerCase().includes('model');
                            return (
                              <tr key={index}>
                                <td className="py-2.5 px-4 text-slate-400 font-medium">
                                  {item.key}
                                </td>
                                <td className={`py-2.5 px-4 text-slate-900 font-bold ${isCode ? 'font-mono select-all' : ''}`}>
                                  {item.val}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notice banner if payment is disabled due to FMI OFF or Not Supported */}
                  {(currentCheck.supportStatus === 'FMI OFF' || currentCheck.currentStatus === 'FMI OFF' || currentCheck.supportStatus === 'Not Supported' || currentCheck.currentStatus === 'Not Supported') && (
                    <div className={`px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                      currentCheck.supportStatus === 'FMI OFF' || currentCheck.currentStatus === 'FMI OFF'
                        ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                        : 'bg-red-50 border border-red-100 text-red-800'
                    }`}>
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>
                        {currentCheck.supportStatus === 'FMI OFF' || currentCheck.currentStatus === 'FMI OFF'
                          ? 'Find My iPhone is OFF. No unlock registration or payment is required for this device.'
                          : 'This device is currently Not Supported for unlock registration.'}
                      </span>
                    </div>
                  )}

                  {/* Results Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                    {(() => {
                      const isFmiOff = currentCheck.supportStatus === 'FMI OFF' || currentCheck.currentStatus === 'FMI OFF';
                      const isNotSupported = currentCheck.supportStatus === 'Not Supported' || currentCheck.currentStatus === 'Not Supported';
                      const isPaymentDisabled = isFmiOff || isNotSupported;

                      return (
                        <button
                          disabled={isSubmittingPayment || isPaymentDisabled}
                          onClick={async () => {
                            if (isPaymentDisabled) return;
                            setIsSubmittingPayment(true);
                            try {
                              await onMakePayment();
                            } finally {
                              setTimeout(() => setIsSubmittingPayment(false), 1500);
                            }
                          }}
                          className={`w-full font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition ${
                            isPaymentDisabled
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                              : isSubmittingPayment
                              ? 'bg-slate-400 text-slate-100 cursor-not-allowed border border-slate-400 shadow-md'
                              : 'bg-[#1E4DFF] hover:bg-blue-600 text-white cursor-pointer shadow-md shadow-blue-500/10'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span>
                            {isSubmittingPayment ? 'Processing Payment...' : 'Make Payment to Register Unlock'}
                          </span>
                        </button>
                      );
                    })()}
                    <button
                      onClick={onCloseCheck}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200"
                    >
                      <X className="w-4 h-4 shrink-0" />
                      <span>Cancel</span>
                    </button>
                  </div>

                </motion.div>
              </div>
            )}

            {/* Floating Expand Button when Minimized */}
            {isMinimized && (
              <div className="fixed bottom-6 right-6 z-50 animate-bounce">
                <button
                  onClick={() => setIsMinimized(false)}
                  className="bg-[#1E4DFF] hover:bg-blue-600 text-white font-bold text-xs px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2 transition cursor-pointer border border-blue-400/20"
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>Show Results ({currentCheck.device || 'Device'})</span>
                </button>
              </div>
            )}
          </>
        )}

      </AnimatePresence>

      {/* Support Info Modal Overlay */}
      {supportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSupportModalOpen(false)} />
          <div className="relative bg-white rounded-[24px] p-6 sm:p-8 max-w-md w-full border border-slate-100 shadow-2xl z-50 space-y-6 text-left animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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
