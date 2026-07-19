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
            className="bg-white rounded-[24px] p-6 sm:p-8 border border-slate-100 shadow-xl space-y-6 text-left max-w-2xl mx-auto"
          >
            
            {/* Results Title with Action Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full">
                  Check Completed
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Compatibility Results
                </h2>
              </div>
              <button
                onClick={onCloseCheck}
                className="text-xs text-slate-400 hover:text-slate-600 underline font-semibold cursor-pointer"
              >
                Check another device
              </button>
            </div>

            {/* Device Information Premium Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">
                Device Details
              </h3>
              
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100/80 bg-slate-100/35">
                      <th className="text-left py-2.5 px-4 font-semibold text-slate-500 font-mono text-[10px]">FIELD</th>
                      <th className="text-left py-2.5 px-4 font-semibold text-slate-500 font-mono text-[10px]">VALUE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50">
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400 font-medium">Device</td>
                      <td className="py-2.5 px-4 text-slate-900 font-bold">{currentCheck.device || 'iPad Pro 11"'}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400 font-medium">IMEI / Serial</td>
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
                      <td className="py-2.5 px-4 text-slate-400 font-medium">Support Status</td>
                      <td className="py-2.5 px-4">
                        <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-[11px] inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          {currentCheck.supportStatus || 'Supported'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400 font-medium">Success Rate</td>
                      <td className="py-2.5 px-4 text-emerald-600 font-extrabold">{currentCheck.successRate || '98%'}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 text-slate-400 font-medium">Registration Required</td>
                      <td className="py-2.5 px-4 text-slate-700 font-semibold">{currentCheck.registrationRequired || 'Yes'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Administrator Feedback Highlighted Card */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">
                Administrator Feedback
              </h3>
              
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E4DFF]" />
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider font-semibold">Reviewer Response</span>
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
