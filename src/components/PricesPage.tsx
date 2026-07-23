import React, { useState } from 'react';
import { Tablet, Smartphone, ShieldCheck, Clock, CheckCircle, Search, Filter, Sparkles } from 'lucide-react';

interface PricingItem {
  device: string;
  type: 'iphone' | 'ipad';
  rate: string;
  price: string;
  time: string;
  features: string[];
}

export const pricingData: PricingItem[] = [
  // iPhones
  {
    device: 'iPhone X',
    type: 'iphone',
    rate: '99.2%',
    price: '$35.00 USDT',
    time: '2 - 5 Minutes',
    features: ['Instant registration', 'FMI OFF status', 'iOS 15 - 18.x supported', 'Full network support'],
  },
  {
    device: 'iPhone XR',
    type: 'iphone',
    rate: '99.0%',
    price: '$45.00 USDT',
    time: '2 - 5 Minutes',
    features: ['Instant registration', 'FMI OFF status', 'iOS 15 - 18.x supported', 'Full network support'],
  },
  {
    device: 'iPhone XS',
    type: 'iphone',
    rate: '99.0%',
    price: '$40.00 USDT',
    time: '2 - 5 Minutes',
    features: ['Instant registration', 'FMI OFF status', 'iOS 15 - 18.x supported', 'Full network support'],
  },
  {
    device: 'iPhone XS Max',
    type: 'iphone',
    rate: '99.0%',
    price: '$45.00 USDT',
    time: '2 - 5 Minutes',
    features: ['Instant registration', 'FMI OFF status', 'iOS 15 - 18.x supported', 'Full network support'],
  },
  {
    device: 'iPhone 11',
    type: 'iphone',
    rate: '98.8%',
    price: '$50.00 USDT',
    time: '2 - 5 Minutes',
    features: ['Instant registration', 'FMI OFF status', 'iOS 15 - 18.x supported', 'Full network support'],
  },
  {
    device: 'iPhone 11 Pro',
    type: 'iphone',
    rate: '98.8%',
    price: '$55.00 USDT',
    time: '2 - 5 Minutes',
    features: ['Instant registration', 'FMI OFF status', 'iOS 15 - 18.x supported', 'Full network support'],
  },
  {
    device: 'iPhone 11 Pro Max',
    type: 'iphone',
    rate: '98.8%',
    price: '$55.00 USDT',
    time: '2 - 5 Minutes',
    features: ['Instant registration', 'FMI OFF status', 'iOS 15 - 18.x supported', 'Full network support'],
  },
  {
    device: 'iPhone SE (2020)',
    type: 'iphone',
    rate: '99.2%',
    price: '$50.00 USDT',
    time: '2 - 5 Minutes',
    features: ['Instant registration', 'FMI OFF status', 'iOS 15 - 18.x supported', 'Full network support'],
  },
  {
    device: 'iPhone SE (2022)',
    type: 'iphone',
    rate: '98.5%',
    price: '$60.00 USDT',
    time: '2 - 5 Minutes',
    features: ['Instant registration', 'FMI OFF status', 'iOS 15 - 18.x supported', 'Full network support'],
  },
  {
    device: 'iPhone 12 Mini',
    type: 'iphone',
    rate: '98.4%',
    price: '$55.00 USDT',
    time: '5 - 10 Minutes',
    features: ['Server-based approval', 'Clean/Lost supported', 'LTE/5G active', 'iCloud sign-in OK'],
  },
  {
    device: 'iPhone 12',
    type: 'iphone',
    rate: '98.4%',
    price: '$60.00 USDT',
    time: '5 - 10 Minutes',
    features: ['Server-based approval', 'Clean/Lost supported', 'LTE/5G active', 'iCloud sign-in OK'],
  },
  {
    device: 'iPhone 12 Pro',
    type: 'iphone',
    rate: '98.4%',
    price: '$65.00 USDT',
    time: '5 - 10 Minutes',
    features: ['Server-based approval', 'Clean/Lost supported', 'LTE/5G active', 'iCloud sign-in OK'],
  },
  {
    device: 'iPhone 12 Pro Max',
    type: 'iphone',
    rate: '98.4%',
    price: '$70.00 USDT',
    time: '5 - 10 Minutes',
    features: ['Server-based approval', 'Clean/Lost supported', 'LTE/5G active', 'iCloud sign-in OK'],
  },
  {
    device: 'iPhone 13 Mini',
    type: 'iphone',
    rate: '97.9%',
    price: '$75.00 USDT',
    time: '5 - 10 Minutes',
    features: ['Server-based approval', 'Clean/Lost supported', 'LTE/5G active', 'iCloud sign-in OK'],
  },
  {
    device: 'iPhone 13',
    type: 'iphone',
    rate: '97.9%',
    price: '$80.00 USDT',
    time: '5 - 10 Minutes',
    features: ['Server-based approval', 'Clean/Lost supported', 'LTE/5G active', 'iCloud sign-in OK'],
  },
  {
    device: 'iPhone 13 Pro',
    type: 'iphone',
    rate: '97.9%',
    price: '$85.00 USDT',
    time: '5 - 10 Minutes',
    features: ['Server-based approval', 'Clean/Lost supported', 'LTE/5G active', 'iCloud sign-in OK'],
  },
  {
    device: 'iPhone 13 Pro Max',
    type: 'iphone',
    rate: '97.9%',
    price: '$90.00 USDT',
    time: '5 - 10 Minutes',
    features: ['Server-based approval', 'Clean/Lost supported', 'LTE/5G active', 'iCloud sign-in OK'],
  },
  {
    device: 'iPhone 14',
    type: 'iphone',
    rate: '97.5%',
    price: '$90.00 USDT',
    time: '10 - 15 Minutes',
    features: ['A16 Bionic optimized', 'Instant verification', 'Latest iOS supported', 'Permanent signal unlock'],
  },
  {
    device: 'iPhone 14 Plus',
    type: 'iphone',
    rate: '97.5%',
    price: '$95.00 USDT',
    time: '10 - 15 Minutes',
    features: ['A16 Bionic optimized', 'Instant verification', 'Latest iOS supported', 'Permanent signal unlock'],
  },
  {
    device: 'iPhone 14 Pro',
    type: 'iphone',
    rate: '97.5%',
    price: '$100.00 USDT',
    time: '10 - 15 Minutes',
    features: ['A16 Bionic optimized', 'Instant verification', 'Latest iOS supported', 'Permanent signal unlock'],
  },
  {
    device: 'iPhone 14 Pro Max',
    type: 'iphone',
    rate: '97.5%',
    price: '$110.00 USDT',
    time: '10 - 15 Minutes',
    features: ['A16 Bionic optimized', 'Instant verification', 'Latest iOS supported', 'Permanent signal unlock'],
  },
  {
    device: 'iPhone 15',
    type: 'iphone',
    rate: '97.0%',
    price: '$100.00 USDT',
    time: '10 - 15 Minutes',
    features: ['Type-C integration', 'iOS 17 & 18 optimized', 'Direct database sync', 'Clean status supported'],
  },
  {
    device: 'iPhone 15 Plus',
    type: 'iphone',
    rate: '97.0%',
    price: '$100.00 USDT',
    time: '10 - 15 Minutes',
    features: ['Type-C integration', 'iOS 17 & 18 optimized', 'Direct database sync', 'Clean status supported'],
  },
  {
    device: 'iPhone 15 Pro',
    type: 'iphone',
    rate: '97.0%',
    price: '$110.00 USDT',
    time: '10 - 15 Minutes',
    features: ['Type-C integration', 'iOS 17 & 18 optimized', 'Direct database sync', 'Clean status supported'],
  },
  {
    device: 'iPhone 15 Pro Max',
    type: 'iphone',
    rate: '97.0%',
    price: '$120.00 USDT',
    time: '10 - 15 Minutes',
    features: ['Type-C integration', 'iOS 17 & 18 optimized', 'Direct database sync', 'Clean status supported'],
  },
  {
    device: 'iPhone 16',
    type: 'iphone',
    rate: '96.5%',
    price: '$120.00 USDT',
    time: '10 - 15 Minutes',
    features: ['A18 Chipset ready', 'Next-Gen unlock engine', 'Latest iOS support', 'Full LTE/5G network active'],
  },
  {
    device: 'iPhone 16e',
    type: 'iphone',
    rate: '96.5%',
    price: '$120.00 USDT',
    time: '10 - 15 Minutes',
    features: ['A18 Chipset ready', 'Next-Gen unlock engine', 'Latest iOS support', 'Full LTE/5G network active'],
  },
  {
    device: 'iPhone 16 Plus',
    type: 'iphone',
    rate: '96.5%',
    price: '$120.00 USDT',
    time: '10 - 15 Minutes',
    features: ['A18 Chipset ready', 'Next-Gen unlock engine', 'Latest iOS support', 'Full LTE/5G network active'],
  },
  {
    device: 'iPhone 16 Pro',
    type: 'iphone',
    rate: '96.5%',
    price: '$125.00 USDT',
    time: '10 - 15 Minutes',
    features: ['A18 Chipset ready', 'Next-Gen unlock engine', 'Latest iOS support', 'Full LTE/5G network active'],
  },
  {
    device: 'iPhone 16 Pro Max',
    type: 'iphone',
    rate: '96.5%',
    price: '$130.00 USDT',
    time: '10 - 15 Minutes',
    features: ['A18 Chipset ready', 'Next-Gen unlock engine', 'Latest iOS support', 'Full LTE/5G network active'],
  },
  {
    device: 'iPhone 17',
    type: 'iphone',
    rate: '96.0%',
    price: '$130.00 USDT',
    time: '15 - 25 Minutes',
    features: ['A19 Chipset pre-support', 'Database instant register', 'Full signal unlock', 'iCloud services OK'],
  },
  {
    device: 'iPhone 17 Air',
    type: 'iphone',
    rate: '96.0%',
    price: '$130.00 USDT',
    time: '15 - 25 Minutes',
    features: ['A19 Chipset pre-support', 'Database instant register', 'Full signal unlock', 'iCloud services OK'],
  },
  {
    device: 'iPhone 17 Pro',
    type: 'iphone',
    rate: '96.0%',
    price: '$135.00 USDT',
    time: '15 - 25 Minutes',
    features: ['A19 Chipset pre-support', 'Database instant register', 'Full signal unlock', 'iCloud services OK'],
  },
  {
    device: 'iPhone 17 Pro Max',
    type: 'iphone',
    rate: '96.0%',
    price: '$135.00 USDT',
    time: '15 - 25 Minutes',
    features: ['A19 Chipset pre-support', 'Database instant register', 'Full signal unlock', 'iCloud services OK'],
  },

  // iPads
  {
    device: 'iPad (5th / 6th Gen, 2017–2018)',
    type: 'ipad',
    rate: '99.5%',
    price: '$60.00 USDT',
    time: '2 - 5 Minutes',
    features: ['All cellular models', 'Wi-Fi activation unlock', 'All iPadOS supported', 'App Store working'],
  },
  {
    device: 'iPad (7th / 8th Gen, 2019–2020)',
    type: 'ipad',
    rate: '99.5%',
    price: '$65.00 USDT',
    time: '2 - 5 Minutes',
    features: ['All cellular models', 'Wi-Fi activation unlock', 'All iPadOS supported', 'App Store working'],
  },
  {
    device: 'iPad (9th Gen, 2021)',
    type: 'ipad',
    rate: '99.3%',
    price: '$70.00 USDT',
    time: '2 - 5 Minutes',
    features: ['All cellular models', 'Wi-Fi activation unlock', 'All iPadOS supported', 'App Store working'],
  },
  {
    device: 'iPad (10th Gen, 2022–2024)',
    type: 'ipad',
    rate: '99.2%',
    price: '$75.00 USDT',
    time: '5 - 10 Minutes',
    features: ['All cellular models', 'Wi-Fi activation unlock', 'All iPadOS supported', 'App Store working'],
  },
  {
    device: 'iPad Air (3rd Gen, 2019)',
    type: 'ipad',
    rate: '99.5%',
    price: '$70.00 USDT',
    time: '2 - 5 Minutes',
    features: ['All cellular models', 'Wi-Fi activation unlock', 'All iPadOS supported', 'App Store working'],
  },
  {
    device: 'iPad Air (4th Gen, 2020)',
    type: 'ipad',
    rate: '99.3%',
    price: '$80.00 USDT',
    time: '5 - 10 Minutes',
    features: ['All cellular models', 'Wi-Fi activation unlock', 'All iPadOS supported', 'App Store working'],
  },
  {
    device: 'iPad Air (5th Gen, 2022)',
    type: 'ipad',
    rate: '99.1%',
    price: '$85.00 USDT',
    time: '5 - 10 Minutes',
    features: ['All cellular models', 'Wi-Fi activation unlock', 'All iPadOS supported', 'App Store working'],
  },
  {
    device: 'iPad Pro (2017 10.5" & 12.9")',
    type: 'ipad',
    rate: '99.5%',
    price: '$80.00 USDT',
    time: '2 - 5 Minutes',
    features: ['All cellular models', 'Wi-Fi activation unlock', 'All iPadOS supported', 'App Store working'],
  },
  {
    device: 'iPad Pro (2018 Face ID, 11" & 12.9")',
    type: 'ipad',
    rate: '99.2%',
    price: '$90.00 USDT',
    time: '5 - 10 Minutes',
    features: ['All cellular models', 'Wi-Fi activation unlock', 'All iPadOS supported', 'App Store working'],
  },
  {
    device: 'iPad Pro (2020 M1)',
    type: 'ipad',
    rate: '98.9%',
    price: '$100.00 USDT',
    time: '5 - 10 Minutes',
    features: ['Apple Silicon optimized', 'No hardware check', 'USB-C/Thunderbolt working', 'Official backup allowed'],
  },
  {
    device: 'iPad Pro (2021–2024 M1/M2)',
    type: 'ipad',
    rate: '98.9%',
    price: '$110.00 USDT',
    time: '5 - 10 Minutes',
    features: ['Apple Silicon optimized', 'No hardware check', 'USB-C/Thunderbolt working', 'Official backup allowed'],
  },
  {
    device: 'iPad Mini (5th Gen, 2019)',
    type: 'ipad',
    rate: '99.5%',
    price: '$65.00 USDT',
    time: '2 - 5 Minutes',
    features: ['All cellular models', 'Wi-Fi activation unlock', 'All iPadOS supported', 'App Store working'],
  },
  {
    device: 'iPad Mini (6th Gen, 2021)',
    type: 'ipad',
    rate: '99.1%',
    price: '$80.00 USDT',
    time: '5 - 10 Minutes',
    features: ['All cellular models', 'Wi-Fi activation unlock', 'All iPadOS supported', 'App Store working'],
  },
];

interface PricesPageProps {
  onNavigateToHome?: () => void;
}

export default function PricesPage({ onNavigateToHome }: PricesPageProps) {
  const [activeTab, setActiveTab] = useState<'iphone' | 'ipad'>('iphone');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = pricingData.filter(
    (item) =>
      item.type === activeTab &&
      item.device.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const iphoneCount = pricingData.filter((i) => i.type === 'iphone').length;
  const ipadCount = pricingData.filter((i) => i.type === 'ipad').length;

  return (
    <div id="prices-page" className="py-8 px-4 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300 font-sans text-left">
      {/* Intro section */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-[#1E4DFF] text-[11px] font-bold px-3 py-1 rounded-full border border-blue-100">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>UPDATED PRICING CODES</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          iCloud Unlock Price Catalog
        </h2>
        <p className="text-slate-500 text-sm">
          Find exact activation unlock fees for your specific iPhone or iPad model. All payments processed securely via BEP20 USDT.
        </p>
      </div>

      {/* Control bar: Tabs + Search */}
      <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tab switchers */}
        <div className="flex bg-slate-100/90 p-2 rounded-2xl border border-slate-200/80 gap-2.5 w-full md:w-auto shadow-inner">
          <button
            onClick={() => {
              setActiveTab('iphone');
              setSearchTerm('');
            }}
            className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm border ${
              activeTab === 'iphone'
                ? 'bg-[#1341f4] text-white border-[#1341f4] shadow-md scale-[1.02]'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            <Smartphone className={`w-5 h-5 ${activeTab === 'iphone' ? 'text-white' : 'text-[#1341f4]'}`} />
            <span>iPhone Models</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              activeTab === 'iphone' ? 'bg-white/20 text-white' : 'bg-blue-100/70 text-[#1341f4]'
            }`}>{iphoneCount}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('ipad');
              setSearchTerm('');
            }}
            className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm border ${
              activeTab === 'ipad'
                ? 'bg-[#1341f4] text-white border-[#1341f4] shadow-md scale-[1.02]'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            <Tablet className={`w-5 h-5 ${activeTab === 'ipad' ? 'text-white' : 'text-[#1341f4]'}`} />
            <span>iPad Models</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              activeTab === 'ipad' ? 'bg-white/20 text-white' : 'bg-blue-100/70 text-[#1341f4]'
            }`}>{ipadCount}</span>
          </button>
        </div>

        {/* Live Search bar */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search e.g. ${activeTab === 'iphone' ? '15 Pro Max, SE' : 'Pro M1, Air 5'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#1E4DFF] focus:ring-1 focus:ring-[#1E4DFF]/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* Grid of Prices */}
      {filteredData.length === 0 ? (
        <div className="bg-white rounded-[24px] p-12 text-center border border-slate-100 shadow-sm max-w-md mx-auto space-y-3">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-fit mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">No matching models found</h4>
          <p className="text-xs text-slate-400">
            We couldn't find any results for "{searchTerm}". Please refine your search keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:border-[#1E4DFF]/20 text-left"
            >
              <div>
                {/* Badges row */}
                <div className="flex justify-between items-center mb-3.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    {activeTab === 'iphone' ? 'iPhone Unlock' : 'iPad Unlock'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-100/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item.rate} Success</span>
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-sm font-black text-slate-900 group-hover:text-[#1E4DFF] transition-colors">
                  {item.device}
                </h3>

                {/* Price Display */}
                <div className="flex items-baseline gap-1.5 my-3">
                  <span className="text-xl font-black text-[#1E4DFF]">{item.price}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">USDT Only</span>
                </div>

                {/* Unlock Duration */}
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mb-4 pb-3 border-b border-slate-100">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Delivery: {item.time}</span>
                </div>

                {/* Quick features */}
                <ul className="space-y-1.5 mb-5">
                  {item.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                      <CheckCircle className="w-3.5 h-3.5 text-[#1E4DFF] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <button
                onClick={() => {
                  if (onNavigateToHome) {
                    onNavigateToHome();
                  } else {
                    const element = document.getElementById('device-checker-form');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
                className="w-full text-center py-2.5 bg-slate-50 hover:bg-[#1E4DFF] hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all duration-150 cursor-pointer"
              >
                Verify Device Compatibility
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Trust disclaimer banner */}
      <div className="bg-blue-50/50 rounded-[20px] p-6 border border-blue-100/50 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto text-center sm:text-left">
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-[#1E4DFF] flex items-center justify-center sm:justify-start gap-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>100% Refund Guarantee</span>
          </h4>
          <p className="text-slate-500 text-xs">
            If our server fails to register or unlock your device within the estimated timeline, we offer direct and immediate USDT refunds.
          </p>
        </div>
        <div className="bg-white px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm border border-slate-100 whitespace-nowrap">
          🔒 Secured by BEP20 Smart Logs
        </div>
      </div>
    </div>
  );
}
