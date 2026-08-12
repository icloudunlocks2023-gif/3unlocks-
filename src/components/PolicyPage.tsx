import React from 'react';
import { FileText, ShieldCheck, RefreshCw, HelpCircle, ArrowLeft, CheckCircle2, MessageSquare } from 'lucide-react';

export type PolicyType = 'terms' | 'privacy' | 'refund' | 'faq';

interface PolicyPageProps {
  type: PolicyType;
  onNavigate: (tab: any) => void;
  onSelectPolicy: (policy: PolicyType) => void;
}

export default function PolicyPage({ type, onNavigate, onSelectPolicy }: PolicyPageProps) {
  return (
    <div className="min-h-[80vh] py-10 px-4 sm:px-6 bg-slate-50/50">
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        
        {/* Navigation Breadcrumb & Policy Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#1E4DFF] bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          {/* Policy quick switcher buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs font-bold">
            <button
              onClick={() => onSelectPolicy('terms')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                type === 'terms'
                  ? 'bg-[#1E4DFF] text-white border-[#1E4DFF] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Terms & Conditions
            </button>
            <button
              onClick={() => onSelectPolicy('privacy')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                type === 'privacy'
                  ? 'bg-[#1E4DFF] text-white border-[#1E4DFF] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onSelectPolicy('refund')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                type === 'refund'
                  ? 'bg-[#1E4DFF] text-white border-[#1E4DFF] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Refund Policy
            </button>
            <button
              onClick={() => onSelectPolicy('faq')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer border ${
                type === 'faq'
                  ? 'bg-[#1E4DFF] text-white border-[#1E4DFF] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              FAQ
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-[24px] p-6 sm:p-10 border border-slate-100 shadow-xl space-y-8">
          
          {/* TERMS & CONDITIONS */}
          {type === 'terms' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E4DFF] flex items-center justify-center shrink-0 border border-blue-100">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Terms & Conditions</h1>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Please read these terms carefully before using 3uUnlocks</p>
                </div>
              </div>

              <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">1</span>
                    Acceptance of Terms
                  </h3>
                  <p className="pl-7 text-slate-600">
                    By accessing or using <strong className="text-slate-900">3uUnlocks</strong>, you agree to these Terms & Conditions. If you do not agree, please discontinue use of our services.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">2</span>
                    Our Services
                  </h3>
                  <p className="pl-7 text-slate-600">
                    3uUnlocks provides compatibility checks and Activation Lock services for supported Apple <strong>iPhone</strong> and <strong>iPad</strong> devices. Service availability may change without prior notice.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">3</span>
                    User Responsibilities
                  </h3>
                  <div className="pl-7 space-y-2">
                    <p>Users are responsible for:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
                      <li>Providing accurate IMEI, Serial Number, ECID, and iOS version.</li>
                      <li>Ensuring they are authorized to request services for the device.</li>
                      <li>Following all instructions provided by the website or support team.</li>
                    </ul>
                    <p className="text-amber-700 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100 mt-2 text-xs">
                      ⚠️ Incorrect information may delay or prevent processing.
                    </p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">4</span>
                    Payments
                  </h3>
                  <p className="pl-7 text-slate-600">
                    Payments are processed only through the payment methods displayed on our website. Orders begin processing only after payment has been verified by our team.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">5</span>
                    Order Processing
                  </h3>
                  <p className="pl-7 text-slate-600">
                    Processing times are estimates and may vary depending on server traffic, device compatibility, and other technical factors.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">6</span>
                    Account Security
                  </h3>
                  <p className="pl-7 text-slate-600">
                    Users are responsible for maintaining the security of their account credentials. Any activity performed using your account is your responsibility.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">7</span>
                    Service Availability
                  </h3>
                  <p className="pl-7 text-slate-600">
                    Temporary interruptions may occur due to maintenance or high server traffic. We strive to restore services as quickly as possible.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs flex items-center justify-center font-bold">8</span>
                    Changes
                  </h3>
                  <p className="pl-7 text-slate-600">
                    We reserve the right to modify our services, pricing, supported devices, or these terms at any time.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {type === 'privacy' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Your data privacy & security standards</p>
                </div>
              </div>

              <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">Information We Collect</h3>
                  <p className="text-slate-600">We may collect:</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-medium text-slate-700">
                    <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Username
                    </li>
                    <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Email Address
                    </li>
                    <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Country
                    </li>
                    <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Telegram Handle (optional)
                    </li>
                    <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> IMEI or Serial Number
                    </li>
                    <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> ECID & iOS Version
                    </li>
                    <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Payment Information
                    </li>
                    <li className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Support messages
                    </li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">How We Use Your Information</h3>
                  <p className="text-slate-600">Your information is used to:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 font-medium">
                    <li>Process compatibility checks</li>
                    <li>Manage orders</li>
                    <li>Verify payments</li>
                    <li>Provide customer support</li>
                    <li>Send notifications and updates</li>
                    <li>Improve our services</li>
                  </ul>
                </section>

                <section className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Data Protection</h3>
                  <p className="text-slate-600">
                    We use secure authentication and encrypted databases to protect customer information. Passwords are securely managed through Firebase Authentication and are never stored in plain text.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">Third-Party Services</h3>
                  <p className="text-slate-600">
                    We may use trusted third-party services such as Firebase, Cloudflare, Telegram, and payment providers to deliver our services.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">Information Sharing</h3>
                  <p className="text-slate-600">
                    We do not sell or rent your personal information. Information is shared only when necessary to provide our services or comply with legal obligations.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* REFUND POLICY */}
          {type === 'refund' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Refund Policy</h1>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Clear guidelines regarding payments & refunds</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">Compatibility Checks</h3>
                  <p className="text-slate-600">Compatibility checks are provided free of charge unless otherwise stated.</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">Successful Unlocks</h3>
                  <p className="text-slate-600">Payments for successfully completed unlock services are <strong className="text-slate-900">non-refundable</strong>.</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">Unsupported Devices</h3>
                  <p className="text-slate-600">If your device is found to be unsupported before processing begins, no unlock fee will be charged.</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">Duplicate Payments</h3>
                  <p className="text-slate-600">Duplicate or accidental payments will be reviewed and refunded where applicable.</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">Payment Verification</h3>
                  <p className="text-slate-600">Payments remain pending until verified by our administrators. Orders will not begin until verification is complete.</p>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">Wallet Balance</h3>
                  <p className="text-slate-600">Deposited funds are credited to your account balance after approval. Withdrawal requests are handled through Customer Support and reviewed individually.</p>
                </div>
              </div>
            </div>
          )}

          {/* FREQUENTLY ASKED QUESTIONS */}
          {type === 'faq' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Frequently Asked Questions (FAQ)</h1>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Find answers to common questions about 3uUnlocks</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    q: 'Is the compatibility check free?',
                    a: 'Yes. Compatibility checks are completely free.',
                  },
                  {
                    q: 'Which devices are supported?',
                    a: 'We currently provide services for supported Apple iPhone and iPad models.',
                  },
                  {
                    q: 'How do I know if my device is supported?',
                    a: 'Submit your IMEI or Serial Number through the compatibility check on our homepage. Our team will review your device and provide the results.',
                  },
                  {
                    q: 'When do I pay?',
                    a: 'Payment is requested only after your device has been confirmed as supported.',
                  },
                  {
                    q: 'How long does processing take?',
                    a: 'Processing times vary depending on server traffic and the specific device. Estimated progress is shown during your order.',
                  },
                  {
                    q: 'Can I track my order?',
                    a: 'Yes. Registered users can monitor the status of all orders from the My Account page.',
                  },
                  {
                    q: 'When is the unlock fee charged?',
                    a: 'The unlock fee is deducted from your account balance only after a successful unlock.',
                  },
                  {
                    q: 'What happens if my device is not supported?',
                    a: 'If your device is marked as Not Supported, you will not be able to proceed with the unlock process.',
                  },
                  {
                    q: 'What does "FMI OFF" mean?',
                    a: 'FMI OFF means Find My iPhone/iPad is already disabled, so no Activation Lock service is required.',
                  },
                  {
                    q: 'My order is delayed. What should I do?',
                    a: 'Please contact our Support Team using the floating Support button or the Contact Support page.',
                  },
                  {
                    q: 'Can I request a refund?',
                    a: 'Refund requests are reviewed according to our Refund Policy. Contact Support if you believe a payment was made in error.',
                  },
                  {
                    q: 'How can I contact support?',
                    a: 'You can contact us through Website Live Chat or Telegram.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-1 text-left">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-start gap-2">
                      <span className="text-[#1E4DFF] font-black shrink-0">Q:</span>
                      <span>{item.q}</span>
                    </h4>
                    <p className="text-xs text-slate-600 font-medium pl-6 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}

                {/* Need More Help section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-6 rounded-2xl border border-blue-100 text-slate-800 space-y-3 mt-6">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#1E4DFF]" />
                    Need More Help?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    If you have additional questions, our Support Team is available to assist you with compatibility checks, payments, orders, and general inquiries.
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2">
                    <a
                      href="https://t.me/Chris_Morgan057"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0088cc] text-white text-xs font-bold transition shadow-sm hover:bg-[#0088cc]/90"
                    >
                      Telegram Support
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
