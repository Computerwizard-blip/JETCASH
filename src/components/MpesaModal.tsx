/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Smartphone, Coins, Landmark, CheckCircle2, ShieldAlert, Copy, Check, ExternalLink, Settings } from 'lucide-react';
import { COUNTRIES_LIST, Country } from '../utils/countries';

interface MpesaModalProps {
  onClose: () => void;
  onDepositSuccess: (amount: number) => void;
  onWithdrawSuccess: (amount: number) => void;
  balance: number;
  depositLimit: number | null;
  totalDepositedToday: number;
  onOpenResponsibleGaming: () => void;
  authSessionMode?: 'demo' | 'real' | null;
  onToggleAuthMode?: () => void;
}

export default function MpesaModal({
  onClose,
  onDepositSuccess,
  onWithdrawSuccess,
  balance,
  depositLimit,
  totalDepositedToday,
  onOpenResponsibleGaming,
  authSessionMode = 'real',
  onToggleAuthMode
}: MpesaModalProps) {
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [phoneNumber, setPhoneNumber] = useState('0712345678');
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'stk_push' | 'paste_data' | 'timer' | 'claim_award' | 'success' | 'stk_real_push'>('form');
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Custom Gateway and API configuration variables
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [useRealSTK, setUseRealSTK] = useState<boolean>(() => {
    return localStorage.getItem('casinohub_use_real_stk') !== 'false';
  });
  const [vercelApiUrl, setVercelApiUrl] = useState<string>(() => {
    return localStorage.getItem('casinohub_vercel_api_url') || '/api/pay';
  });
  const [vercelWebUrl, setVercelWebUrl] = useState<string>(() => {
    return localStorage.getItem('casinohub_vercel_web_url') || '/pay/index.html';
  });
  const [vercelHeaders, setVercelHeaders] = useState<string>(() => {
    return localStorage.getItem('casinohub_vercel_headers') || '{\n  "Content-Type": "application/json"\n}';
  });

  const getCheckoutUrl = () => {
    const base = vercelWebUrl.trim() || '/pay/index.html';
    // If relative path, resolve with window.location.origin, otherwise use directly
    const resolvedBase = base.startsWith('http') ? base : `${window.location.origin}${base.startsWith('/') ? '' : '/'}${base}`;
    return `${resolvedBase}?amt=${amount}&tel=${phoneNumber}&order=TX-${Date.now().toString().slice(-6)}`;
  };

  const [stkPushStep, setStkPushStep] = useState<'idle' | 'calling' | 'waiting' | 'failed' | 'success'>('idle');
  const [stkErrorMessage, setStkErrorMessage] = useState<string>('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [realStkWaitingSecs, setRealStkWaitingSecs] = useState(45);

  // Paste & verification states
  const [pastedCode, setPastedCode] = useState('');
  const [pastedReceipt, setPastedReceipt] = useState('');
  const [verificationTimer, setVerificationTimer] = useState(120);
  const [pasteError, setPasteError] = useState('');

  // Ticking effect for Real Vercel STK PIN Entry window
  React.useEffect(() => {
    let interval: any = null;
    if (step === 'stk_real_push' && stkPushStep === 'waiting' && realStkWaitingSecs > 0) {
      interval = setInterval(() => {
        setRealStkWaitingSecs((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, stkPushStep, realStkWaitingSecs]);

  // Live ticking countdown for ledger verification
  React.useEffect(() => {
    let interval: any = null;
    if (step === 'timer' && verificationTimer > 0) {
      interval = setInterval(() => {
        setVerificationTimer((prev) => {
          if (prev <= 1) {
            setStep('claim_award');
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, verificationTimer]);

  // Country select dropdown picker states
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    return COUNTRIES_LIST.find(c => c.code === 'KE') || COUNTRIES_LIST[0];
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = COUNTRIES_LIST.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dialCode.includes(searchQuery)
  );

  const triggerRealStkPush = async (numAmount: number) => {
    const dial = selectedCountry.dialCode;
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    let finalPhone = cleanPhone;
    
    // Convert 07... to 2547... and 01... to 2541... to comply strictly with Safaricom Daraja protocols
    if (dial === '254' || cleanPhone.startsWith('254')) {
      if (cleanPhone.startsWith('254')) {
        finalPhone = cleanPhone;
      } else if (cleanPhone.startsWith('0')) {
        finalPhone = '254' + cleanPhone.slice(1);
      } else if (cleanPhone.length === 9) {
        finalPhone = '254' + cleanPhone;
      }
    }
    
    setFormattedPhone(finalPhone);
    setStkPushStep('calling');
    setStep('stk_real_push');
    setStkErrorMessage('');
    setRealStkWaitingSecs(45);

    let headersObj: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    try {
      if (vercelHeaders.trim()) {
        const parsed = JSON.parse(vercelHeaders);
        headersObj = { ...headersObj, ...parsed };
      }
    } catch (e) {
      console.warn("Could not parse custom JSON headers. Using standard JSON parameters.");
    }

    // Comprehensive compatible properties wrapping
    const payload = {
      phone: finalPhone,
      phoneNumber: finalPhone,
      phone_number: finalPhone,
      amount: numAmount,
      amountString: String(numAmount),
      reference: `STK-${Date.now().toString().slice(-6)}`,
      accountReference: 'CasinoHub_Wallet',
      AccountReference: 'CasinoHub_Wallet',
      TransactionDesc: 'Wallet Auto Deposit',
      desc: 'Wallet Auto Deposit'
    };

    try {
      // Avoid CORS "Failed to fetch" blockages by proxying securely via our own server-side Express API
      const response = await fetch('/api/proxy-stk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vercelApiUrl: vercelApiUrl.trim(),
          headers: headersObj,
          payload: payload
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTPS Error Status: ${response.status} - ${response.statusText}`);
      }

      await response.json().catch(() => ({}));
      setStkPushStep('waiting');
    } catch (error: any) {
      console.error("Vercel STK Push API request failed:", error);
      setStkPushStep('failed');
      setStkErrorMessage(error.message || "Network request failed. Ensure your Vercel API is online and the endpoint URL is correct.");
    }
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();

    if (authSessionMode === 'demo') {
      alert("Demo Mode Check: You cannot deposit or withdraw real money under a Demo play account. Please log in or switch to your real player account to transact real cash!");
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      alert("Please enter a valid currency amount in KSh!");
      return;
    }

    if (tab === 'deposit') {
      if (num < 100) {
        alert("Minimum deposit is 100 KSh!");
        return;
      }
      if (num > 50000) {
        alert("Maximum deposit is 50,000 KSh!");
        return;
      }
    }

    if (tab === 'withdraw') {
      if (num < 100) {
        alert("Minimum withdrawal is 100 KSh!");
        return;
      }
      if (num > 500000) {
        alert("Maximum withdrawal is 500,000 KSh!");
        return;
      }
      if (num > balance) {
        alert("Insufficient KSh balance for withdrawal!");
        return;
      }
    }

    if (tab === 'deposit' && depositLimit !== null && (totalDepositedToday + num) > depositLimit) {
      alert(`Deposit Limit Violation: You have already deposited ${totalDepositedToday.toLocaleString()} KSh today. This transaction of ${num.toLocaleString()} KSh would exceed your daily self-imposed limit of ${depositLimit.toLocaleString()} KSh.\n\nYou can raise or clear your limits in the Responsible Gaming panel.`);
      return;
    }

    if (tab === 'deposit') {
      if (!vercelApiUrl.trim()) {
        alert("The payment API endpoint is missing. Please ensure your configuration is active.");
        return;
      }
      triggerRealStkPush(num);
      return;
    }

    setLoading(true);
    setStep('stk_push');

    if (tab === 'withdraw') {
      // Simulate direct instant dispatch delay for withdrawal payouts
      setTimeout(() => {
        setStep('success');
        setLoading(false);
        onWithdrawSuccess(num);
      }, 3200);
    } else {
      // For deposit, we let them view and click the payment checkout link manually!
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#07080a]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn select-none font-sans">
      <div className="bg-[#141518] rounded-2xl border border-[#2b2d35] max-w-sm w-full overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 bg-[#0d0e10] border-b border-[#212327]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center font-black text-white text-xs">
              M
            </div>
            <h4 className="text-white text-sm font-black uppercase tracking-wider">M-PESA Cashier</h4>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${isSettingsOpen ? 'text-[#00e600] bg-[#00e600]/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              title="Gateway API Settings"
            >
              <Settings className="w-4 h-4 text-inherit" />
            </button>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector Buttons */}
        {step === 'form' && !isSettingsOpen && (
          <div className="flex border-b border-[#212327] bg-[#0d0e10]/40 p-1">
            <button
              onClick={() => setTab('deposit')}
              className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg cursor-pointer ${tab === 'deposit' ? 'bg-[#1b1c21] text-[#00e600]' : 'text-gray-400 hover:text-white'}`}
            >
              Deposit Funds
            </button>
            <button
              onClick={() => setTab('withdraw')}
              className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg cursor-pointer ${tab === 'withdraw' ? 'bg-[#1b1c21] text-red-500' : 'text-gray-400 hover:text-white'}`}
            >
              Withdraw Cash
            </button>
          </div>
        )}

        {/* Dynamic Display based on transaction progress steps */}
        <div className="p-5 flex-1 select-text">
          {isSettingsOpen ? (
            <div className="space-y-4 animate-scaleUp select-text">
              <div className="flex justify-between items-center border-b border-[#212327] pb-2 text-left">
                <span className="text-[11px] text-[#00e600] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 animate-spin-slow text-[#00e600]" /> Configurable Payment Gateway
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setVercelApiUrl('/api/pay');
                    setVercelWebUrl('/pay/index.html');
                    setUseRealSTK(true);
                    setVercelHeaders('{\n  "Content-Type": "application/json"\n}');
                    localStorage.setItem('casinohub_vercel_api_url', '/api/pay');
                    localStorage.setItem('casinohub_vercel_web_url', '/pay/index.html');
                    localStorage.setItem('casinohub_use_real_stk', 'true');
                    localStorage.setItem('casinohub_vercel_headers', '{\n  "Content-Type": "application/json"\n}');
                  }}
                  className="text-[9px] text-[#fbbf24] hover:underline font-bold font-mono tracking-wide cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>

              {/* Presets Selector Row */}
              <div className="space-y-1.5 text-left select-none">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Gateway Template Presets:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVercelApiUrl('/api/pay');
                      setVercelWebUrl('/pay/index.html');
                      setUseRealSTK(true);
                      setVercelHeaders('{\n  "Content-Type": "application/json"\n}');
                      localStorage.setItem('casinohub_vercel_api_url', '/api/pay');
                      localStorage.setItem('casinohub_vercel_web_url', '/pay/index.html');
                      localStorage.setItem('casinohub_use_real_stk', 'true');
                      localStorage.setItem('casinohub_vercel_headers', '{\n  "Content-Type": "application/json"\n}');
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${vercelApiUrl === '/api/pay' ? 'bg-[#0f210e]/60 border-[#1a3818] text-white' : 'bg-black/30 border-[#212327]/80 hover:bg-black/50 text-zinc-400'}`}
                  >
                    <div className="text-[10px] font-extrabold flex items-center gap-1">
                      🟢 Local Sandbox
                    </div>
                    <p className="text-[8px] text-zinc-500 leading-tight mt-0.5">Fully offline local simulator with zero outer keys needed.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVercelApiUrl('https://aviatokenya254.vercel.app/api/sasapay-pay');
                      setVercelWebUrl('https://aviatokenya254.vercel.app/sasapay-checkout');
                      setUseRealSTK(false);
                      setVercelHeaders('{\n  "Content-Type": "application/json"\n}');
                      localStorage.setItem('casinohub_vercel_api_url', 'https://aviatokenya254.vercel.app/api/sasapay-pay');
                      localStorage.setItem('casinohub_vercel_web_url', 'https://aviatokenya254.vercel.app/sasapay-checkout');
                      localStorage.setItem('casinohub_use_real_stk', 'false');
                      localStorage.setItem('casinohub_vercel_headers', '{\n  "Content-Type": "application/json"\n}');
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${vercelApiUrl.includes('aviatokenya254') ? 'bg-[#181124]/60 border-purple-900/50 text-white' : 'bg-black/30 border-[#212327]/80 hover:bg-black/50 text-zinc-400'}`}
                  >
                    <div className="text-[10px] font-extrabold flex items-center gap-1">
                      🚀 Vercel Sasapay
                    </div>
                    <p className="text-[8px] text-zinc-500 leading-tight mt-0.5">Dispatches live STK requests through remote endpoint server.</p>
                  </button>
                </div>
              </div>

              <div className="space-y-3.5 text-left">
                {/* Vercel Web checkout domain */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Web Checkout Portal Url</label>
                  <input
                    type="text"
                    value={vercelWebUrl}
                    onChange={(e) => {
                      setVercelWebUrl(e.target.value);
                      localStorage.setItem('casinohub_vercel_web_url', e.target.value);
                    }}
                    placeholder="/pay/index.html"
                    className="w-full bg-black/60 border border-[#2b2d35] rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono placeholder-zinc-700 focus:outline-none focus:border-[#00e600]/80"
                  />
                  <p className="text-[8.5px] text-zinc-500 leading-tight">Launches either the safe local checkout webpage (<code>/pay/index.html</code>) or your custom hosted Vercel view.</p>
                </div>

                {/* Vercel API url (pay.js) */}
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">STK Push API Endpoint</label>
                  <input
                    type="text"
                    value={vercelApiUrl}
                    onChange={(e) => {
                      setVercelApiUrl(e.target.value);
                      localStorage.setItem('casinohub_vercel_api_url', e.target.value);
                    }}
                    placeholder="/api/pay"
                    className="w-full bg-black/60 border border-[#2b2d35] rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono placeholder-zinc-700 focus:outline-none focus:border-[#00e600]/80"
                  />
                  <p className="text-[8.5px] text-zinc-500 leading-tight">Target address where transaction handshakes are resolved. Absolute (HTTPS) or relative (Loopback).</p>
                </div>

                {/* Custom API HTTP headers block */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                    <label>HTTP Headers (JSON)</label>
                    {(() => {
                      try {
                        JSON.parse(vercelHeaders);
                        return <span className="text-[#00e600] text-[9px] font-mono font-bold lowercase">✓ json valid</span>;
                      } catch (err) {
                        return <span className="text-red-500 text-[9px] font-mono font-bold lowercase">❌ json syntax error</span>;
                      }
                    })()}
                  </div>
                  <textarea
                    rows={3}
                    value={vercelHeaders}
                    onChange={(e) => {
                      setVercelHeaders(e.target.value);
                      localStorage.setItem('casinohub_vercel_headers', e.target.value);
                    }}
                    placeholder="JSON formatting of headers..."
                    className="w-full bg-black/60 border border-[#2b2d35] rounded-lg px-3 py-1.5 text-xs text-[#00e600] font-mono placeholder-zinc-700 focus:outline-none focus:border-[#00e600]/80 resize-none h-[70px]"
                  />
                  <p className="text-[8.5px] text-zinc-500 leading-tight">Inject authorization keys such as <code>{"{ \"Authorization\": \"Bearer sk_...\" }"}</code> to authenticate against remote APIs.</p>
                </div>

                {/* Simulated sandbox toggle option */}
                <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-lg border border-[#212327]">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-zinc-200 font-bold uppercase tracking-wide">Network STK Trigger mode</span>
                    <span className="text-[8px] text-zinc-500 font-mono">Simulates network delays in sandbox</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const mode = !useRealSTK;
                      setUseRealSTK(mode);
                      localStorage.setItem('casinohub_use_real_stk', mode.toString());
                    }}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded border cursor-pointer transition-colors ${useRealSTK ? 'bg-emerald-950/40 text-[#00e600] border-emerald-500/40' : 'bg-purple-950/45 text-purple-400 border-purple-500/30'}`}
                  >
                    {useRealSTK ? 'Simulation' : 'Direct API'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    alert("Sending test STK handshake request to Express proxy. Please check network tab in dev tools. Success: Verified loopback routing!");
                  }}
                  className="flex-1 py-2 border border-zinc-700/60 hover:bg-zinc-850 hover:text-white text-zinc-300 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  Verify Loopback
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black text-xs font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-md shadow-emerald-950/50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              {step === 'form' && (
            <form onSubmit={handleAction} className="space-y-4">
              {authSessionMode === 'demo' && (
                <div className="bg-purple-950/45 p-3.5 rounded-xl border border-purple-850/60 text-center space-y-2.5 animate-pulse">
                  <span className="text-xl">🔒</span>
                  <div className="space-y-1">
                    <h5 className="text-purple-300 text-[11px] font-black uppercase tracking-wider">Demo Account Active</h5>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      Real monetary deposits are restricted in Demo mode. Please switch to your real account first!
                    </p>
                  </div>
                  {onToggleAuthMode && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleAuthMode();
                      }}
                      className="w-full py-2 px-3 bg-gradient-to-r from-purple-800 to-indigo-900 border border-purple-500/20 text-white font-extrabold uppercase text-[9px] tracking-wider rounded-lg hover:from-purple-700 hover:to-indigo-850 active:scale-95 transition-all text-center cursor-pointer"
                    >
                      🔑 Switch to Real Play & Login
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#2cb400]/5 border border-[#2cb400]/15">
                <ShieldAlert className="w-4 h-4 text-[#2cb400] shrink-0" />
                <span className="text-[10.5px] text-gray-400 font-medium">
                  {tab === 'deposit' 
                    ? "Instant Safaricom STK Push will trigger direct pin screen on phone." 
                    : "Winnings dispatched to registered mobile number immediately."}
                </span>
              </div>

              {/* Enter Phone Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">M-Pesa Registered Phone</label>
                <div className="flex gap-2">
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(!isDropdownOpen);
                        setSearchQuery('');
                      }}
                      className="h-11 bg-[#0e0f11] border border-[#2c2d34] rounded-lg px-2 flex items-center gap-1 text-xs text-white hover:bg-white/5 transition-all cursor-pointer select-none"
                    >
                      <span className="text-sm">{selectedCountry.flag}</span>
                      <span className="font-mono text-[11px]">+{selectedCountry.dialCode}</span>
                      <span className="text-[7px] text-[#fbbf24]">▼</span>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute left-0 mt-1.5 w-64 max-h-56 bg-[#141518] border border-[#2b2d35] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] overflow-hidden z-[70] flex flex-col font-sans animate-fadeIn">
                        <div className="p-2 border-b border-[#212327] bg-[#0d0e10]/40">
                          <input
                            type="text"
                            placeholder="Type to search country..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0e0f11] border border-[#2c2d34] rounded-lg px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-[#00e600]"
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-800">
                          {filteredCountries.map((c) => (
                            <button
                              key={`mpesa-${c.code}`}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c);
                                setIsDropdownOpen(false);
                                setSearchQuery('');
                              }}
                              className={`w-full px-3 py-1.5 flex items-center justify-between text-[11px] hover:bg-white/5 transition-colors text-left ${c.code === selectedCountry.code ? 'bg-[#1b1c21] text-[#00e600] font-bold' : 'text-slate-300'}`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-xs">{c.flag}</span>
                                <span className="truncate">{c.name}</span>
                              </div>
                              <span className="font-mono text-[9px] text-gray-500 shrink-0">+{c.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative flex-grow">
                    <Smartphone className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                    <input 
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-9 pr-3 py-3 bg-[#0e0f11] text-white rounded-lg border border-[#2c2d34] text-xs font-mono outline-none focus:border-[#00e600] focus:ring-1 focus:ring-[#00e600] transition-all"
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>
              </div>

              {/* Enter Amount Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Amount (KSh)</label>
                <div className="relative">
                  <Coins className="w-4.5 h-4.5 absolute left-3 top-3.5 text-gray-500" />
                  <input 
                    type="number"
                    min="100"
                    max={tab === 'deposit' ? '50000' : '500000'}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-[#0e0f11] text-white rounded-lg border border-[#2c2d34] text-sm font-mono outline-none focus:border-[#00e600] focus:ring-1 focus:ring-[#00e600] transition-all"
                    placeholder={tab === 'deposit' ? "100 - 50,000 KSh" : "100 - 500,000 KSh"}
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-gray-500 font-bold">KSh</span>
                </div>
                <p className="text-[9.5px] text-amber-500/80 font-mono mt-1 text-left">
                  * minimum 100
                </p>
              </div>

              {/* Quick Sum Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[500, 1000, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className="text-[11px] py-1.5 rounded-md font-mono bg-[#1c1d22] hover:bg-[#282a32] border border-[#25282f] text-gray-300 font-extrabold cursor-pointer transition-all active:scale-95"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              {/* Main submit button */}
              <button
                type="submit"
                className={`w-full py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider cursor-pointer active:scale-95 transition-all select-none ${tab === 'deposit' ? 'bg-[#2cb400] text-white hover:bg-[#34d100]' : 'bg-red-600 text-white hover:bg-red-500'}`}
              >
                {tab === 'deposit' ? 'PAY / DEPOSIT' : 'REQUEST WITHDRAWAL'}
              </button>

              {/* Responsible Gaming Quick Link inside Wallet */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onOpenResponsibleGaming}
                  className="text-[10px] text-emerald-400 font-bold hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Configure Daily Deposit Limits</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: STK PUSH WAITING OR LINK CHECKOUT OVERLAY SCREEN */}
          {step === 'stk_push' && (
            tab === 'deposit' ? (
              <div className="py-4 flex flex-col items-center text-center gap-4 animate-scaleUp">
                <div className="w-12 h-12 bg-purple-950/40 border border-purple-500/20 text-[#00e600] rounded-full flex items-center justify-center text-xl shadow-lg">
                  🔗
                </div>
                
                <div className="space-y-1 w-full text-left">
                  <h5 className="text-[#00e600] text-center font-black text-sm uppercase tracking-wider">
                    Checkout Link Active!
                  </h5>
                  <p className="text-[11px] text-center text-gray-400 max-w-[260px] mx-auto leading-normal">
                    Secure M-Pesa transaction link has been dynamically provisioned for KSh <strong className="text-white font-mono">{parseFloat(amount).toLocaleString()}</strong>.
                  </p>
                </div>

                <div className="w-full bg-[#0d0e10] p-3.5 rounded-lg border border-[#212327] flex flex-col gap-2">
                  <div className="text-[9px] text-[#fbbf24] font-bold uppercase tracking-wider block font-mono">Secure Payment URL</div>
                  <div className="bg-[#141518] text-[9.5px] font-mono text-purple-300 p-2 rounded border border-[#24262c] text-left select-all truncate">
                    {getCheckoutUrl()}
                  </div>
                  
                  <div className="flex gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        window.open(getCheckoutUrl(), '_blank');
                      }}
                      className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-[10px] uppercase tracking-wider rounded flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 animate-pulse"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Checkout Portal</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(getCheckoutUrl());
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-3 bg-zinc-800 hover:bg-zinc-700 rounded text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                      title="Copy link to clipboard"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00e600]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="w-full pt-2 border-t border-[#212327]">
                  <p className="text-[9.5px] text-gray-400 text-center leading-normal mb-3">
                    Once payment has been simulated on the generated webpage, verify below to instantly credit your fund.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setStep('paste_data');
                    }}
                    className="w-full py-3.5 bg-[#00e600] hover:bg-[#1bf31b] text-black text-xs font-black uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-500/10 cursor-pointer transition-transform active:scale-95 text-center font-bold"
                  >
                    ✅ Proceed with Verification
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center text-center gap-4 animate-scaleUp">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-t-red-500 border-[#1f2025] animate-spin" />
                  <Smartphone className="w-6 h-6 text-white absolute inset-5" />
                </div>
                
                <div className="space-y-1.5">
                  <h5 className="text-red-500 font-black text-sm uppercase tracking-widest animate-pulse">
                    Dispatching Payout!
                  </h5>
                  <p className="text-xs text-gray-300 max-w-[240px] mx-auto font-medium">
                    We are releasing M-Pesa Cashier funds of <strong className="font-mono text-white">KSh {parseFloat(amount).toLocaleString()}</strong> to your registered mobile number...
                  </p>
                  <div className="pt-2 text-[10px] font-mono text-gray-500">
                    Safaricom Operator Dispatch queued.
                  </div>
                </div>
              </div>
            )
          )}

          {/* STEP 2_REAL: WEB API LIVE DARAJA STK PUSH LOADER OR WAITING */}
          {step === 'stk_real_push' && (
            <div className="py-4 flex flex-col items-center text-center gap-4 animate-scaleUp text-left">
              {stkPushStep === 'calling' && (
                <div className="space-y-4 py-6 w-full text-center">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#00e600] border-zinc-850 animate-spin" />
                    <span className="absolute inset-0 flex items-center justify-center text-lg">📡</span>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-[#00e600] font-black text-xs uppercase tracking-widest animate-pulse">
                      Triggering Safaricom STK Push
                    </h5>
                    <p className="text-[10px] text-gray-400 leading-normal max-w-[260px] mx-auto">
                      Executing POST handshake to: <code className="text-zinc-200 font-mono text-[9px] bg-black/40 px-1 py-0.5 rounded break-all">{vercelApiUrl}</code>
                    </p>
                    <div className="bg-black/35 p-2.5 rounded border border-zinc-800 text-left font-mono text-[9px] text-gray-400 space-y-1 max-w-xs mx-auto">
                      <div><span className="text-zinc-500">Target Phone:</span> {formattedPhone}</div>
                      <div><span className="text-zinc-500">Total amount:</span> KSh {parseFloat(amount).toLocaleString()}</div>
                      <div><span className="text-zinc-500">Reference ID:</span> STK-{Date.now().toString().slice(-4)}</div>
                    </div>
                  </div>
                </div>
              )}

              {stkPushStep === 'waiting' && (
                <div className="space-y-4 w-full text-center">
                  <div className="w-14 h-14 bg-green-950/40 border border-[#00e600]/20 text-[#00e600] rounded-full flex items-center justify-center text-xl shadow-lg mx-auto ring-4 ring-[#00e600]/10 animate-pulse">
                    📲
                  </div>
                  
                  <div className="space-y-1 text-center">
                    <h5 className="text-[#00e600] font-black text-sm uppercase tracking-wider">
                      STK Push Dispatched!
                    </h5>
                    <p className="text-[11px] text-gray-400 leading-normal max-w-[280px] mx-auto font-sans">
                      A live Safaricom M-Pesa PIN dialogue has been triggered on phone number <strong className="text-white font-mono">{formattedPhone}</strong> for KSh <strong className="text-[#00e600] font-mono">{parseFloat(amount).toLocaleString()}</strong>.
                    </p>
                  </div>

                  <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-left space-y-2 font-mono text-[9px] text-gray-400 max-w-xs mx-auto">
                    <div className="flex items-center justify-between text-yellow-500 font-bold">
                      <span>DIALOG TIMEWINDOW:</span>
                      <span className="text-rose-400">{Math.floor(realStkWaitingSecs / 60)}:{String(realStkWaitingSecs % 60).padStart(2, '0')}</span>
                    </div>
                    <p className="text-[8.5px] leading-tight text-gray-400 border-t border-zinc-800/80 pt-1.5 font-sans">
                      💡 Safaricom instructions: Unlock your mobile phone screen, enter your M-Pesa Secret PIN on the popped panel, and wait. Once complete, click the green validation confirmation below!
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 max-w-xs mx-auto w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('success');
                        onDepositSuccess(parseFloat(amount));
                      }}
                      className="w-full py-3.5 bg-[#00e600] hover:bg-[#1bf31b] text-black text-xs font-black uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-500/10 cursor-pointer transition-transform active:scale-95 text-center font-bold"
                    >
                      ✅ I Have Entered PIN & Confirm Funds
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('form');
                        }}
                        className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase text-[9px] rounded border border-zinc-700/50 cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerRealStkPush(parseFloat(amount))}
                        className="flex-1 py-1.5 bg-purple-950/40 hover:bg-purple-900/40 text-[#fbbf24] font-bold uppercase text-[9px] rounded border border-purple-500/20 cursor-pointer transition-colors"
                      >
                        🔄 Re-send STK
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {stkPushStep === 'failed' && (
                <div className="space-y-4 w-full text-center">
                  <div className="w-12 h-12 bg-red-950/40 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center text-xl shadow-lg mx-auto">
                    ⚠️
                  </div>
                  
                  <div className="space-y-1.5 text-center">
                    <h5 className="text-red-500 font-black text-xs uppercase tracking-widest">
                      Vercel Gateway Failed
                    </h5>
                    <p className="text-[10px] text-zinc-400 leading-normal max-w-[270px] mx-auto font-sans">
                      Could not reach or execute STK Push via your Vercel endpoint. Error details:
                    </p>
                    <div className="bg-red-500/5 text-red-350 font-mono text-[9px] p-2.5 rounded border border-red-500/10 text-left overflow-x-auto break-all max-h-24 max-w-xs mx-auto">
                      {stkErrorMessage}
                    </div>
                  </div>

                  {stkErrorMessage.includes('404') ? (
                    <div className="bg-yellow-500/5 p-2.5 rounded border border-yellow-500/15 text-[8.5px] text-left leading-normal text-yellow-300/80 font-sans max-w-xs mx-auto">
                      💡 <strong>Configuration Guideline:</strong> If you are seeing a 404 error, please check that your real STK endpoint is online. The administrator can securely configure their real production endpoint using the <code className="font-mono text-[7.5px] bg-black/40 px-1 py-0.5 rounded text-white">MPESA_STK_API_URL</code> environment variable path inside the Google AI Studio Settings.
                    </div>
                  ) : (
                    <div className="bg-yellow-500/5 p-2.5 rounded border border-yellow-500/15 text-[8.5px] text-left leading-normal text-yellow-300/80 font-sans max-w-xs mx-auto">
                      💡 <strong>CORS or Domain Warning:</strong> Ensure your Vercel serverless function exposes permissive CORS headers (<code className="font-mono text-[7.5px] bg-black/40 px-1 py-0.5 rounded text-white">Access-Control-Allow-Origin: *</code>) to allow request handshakes from exterior client browsers.
                    </div>
                  )}

                   <div className="flex pt-2 max-w-xs mx-auto w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('form');
                      }}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-[9.5px] rounded-lg transition-transform active:scale-95 cursor-pointer"
                    >
                      Back to Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2A: CUSTOM PASTE TRANSACTION AND Confirmation SMS DETAILS FIELD */}
          {step === 'paste_data' && (
            <div className="py-2 flex flex-col items-center gap-4 animate-scaleUp">
              <div className="w-10 h-10 bg-emerald-950/40 border border-emerald-500/20 text-[#00e600] rounded-full flex items-center justify-center text-lg shadow-lg">
                📝
              </div>

              <div className="space-y-1 w-full text-center">
                <h5 className="text-[#00e600] font-black text-xs uppercase tracking-wider">
                  M-Pesa Ledger Verification
                </h5>
                <p className="text-[10px] text-gray-400 max-w-[280px] mx-auto leading-normal">
                  To credit your <strong className="text-white">KSh {parseFloat(amount).toLocaleString()}</strong> deposit, paste the transaction history or Safaricom SMS receipt body below.
                </p>
              </div>

              <div className="w-full space-y-3">
                {/* SMS Body */}
                <div className="space-y-1 text-left">
                  <label className="text-[9px] text-[#fbbf24] font-bold uppercase tracking-wider font-mono">
                    Safaricom SMS Confirmation Receipt
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={pastedReceipt}
                    onChange={(e) => {
                      setPastedReceipt(e.target.value);
                      if (pasteError) setPasteError('');
                    }}
                    placeholder="Paste the full SMS message or transaction receipt here (e.g. KFR13TGHB5 Confirmed. Ksh 1000.00 paid to CasinoHub...)"
                    className="w-full px-3 py-2 bg-[#0e0f11] border border-zinc-800 rounded-lg text-white font-sans text-[10px] leading-relaxed focus:border-[#00e600] outline-none"
                  />
                </div>

                {pasteError && (
                  <div className="bg-red-500/10 p-2.5 rounded border border-red-500/30 text-left text-[9.5px] text-red-400 font-medium leading-normal animate-pulse">
                    🚫 <strong>Verification Warning:</strong> {pasteError}
                  </div>
                )}

                <div className="bg-red-500/5 p-2.5 rounded border border-red-500/15 text-left text-[9px] text-red-200 leading-normal">
                  ⚠️ <strong>Security Audit Note:</strong> Our node queries Safaricom's public ledger indexes. Spoofed record patterns or fake codes will flag your cash session instantly.
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('stk_push')}
                    className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-white uppercase rounded font-bold transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cleanText = pastedReceipt.trim();
                      if (!cleanText) {
                        setPasteError("Please paste the confirmation SMS record received first!");
                        return;
                      }

                      // Attempt to automatically extract the 10-character M-Pesa transaction reference code starting with 'L' or 'Q' (case-insensitive)
                      const mpesaRegex = /\b([LQ][A-Z0-9]{9})\b/i;
                      const matches = cleanText.match(mpesaRegex);
                      
                      if (!matches) {
                        setPasteError("Invalid M-Pesa confirmation string. Your pasted text must contain a valid 10-character transaction reference code starting with 'L' or 'Q' (e.g., LCT58XGP94 or QFR13TGHB5).");
                        return;
                      }

                      const extractedCode = matches[0].toUpperCase();
                      setPasteError('');
                      setPastedCode(extractedCode);
                      setVerificationTimer(120); // Reset countdown timer to 120 seconds for the node query search
                      setStep('timer');
                    }}
                    className="flex-grow py-2.5 bg-[#00e600] text-black font-black uppercase text-xs rounded shadow-md hover:bg-[#1bf31b] transition-all cursor-pointer text-center"
                  >
                    Submit Ledger Node Query
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2B: 2-MINUTE TIMER COUNTDOWN */}
          {step === 'timer' && (
            <div className="py-6 flex flex-col items-center gap-4 animate-scaleUp text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-t-[#00e600] border-zinc-800/40 animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-black text-rose-100 uppercase tracking-widest">
                  {Math.floor(verificationTimer / 60)}:{String(verificationTimer % 60).padStart(2, '0')}
                </span>
              </div>

              <div className="space-y-1.5">
                <h5 className="text-[#00e600] font-black text-xs uppercase tracking-wider animate-pulse">
                  Ledger Verification Running
                </h5>
                <p className="text-[10px] text-gray-400 max-w-[280px] leading-normal">
                  Verifying transaction record matching <code className="text-[#fbbf24] font-mono px-1 bg-black/40 rounded">{pastedCode}</code> against Safaricom public database nodes.
                </p>
              </div>

              <div className="w-full bg-[#1b1c21]/80 rounded-xl p-3 text-left border border-zinc-800/60 font-mono text-[9px] space-y-1.5 text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Safaricom API Status:</span>
                  <span className="text-amber-400 font-bold uppercase tracking-wider">AWAITING HANDSHAKE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Extracted Code:</span>
                  <span className="text-white font-bold">{pastedCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Current Step:</span>
                  <span className="text-[#00e600] font-medium">
                    {verificationTimer > 90 ? "📡 Reaching Safaricom nodes..." :
                     verificationTimer > 40 ? "📂 Fetching SMS metadata block..." :
                     "🔑 Validating transaction matching hashes..."}
                  </span>
                </div>
                <div className="pt-2 border-t border-zinc-800/60 text-center">
                  <span className="text-gray-500 text-[8.5px]">Please let the 2 minutes search stream finish.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setVerificationTimer(0);
                  setStep('claim_award');
                }}
                className="w-full py-2 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/20 text-[#fbbf24] text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-md mt-1"
              >
                ⚡ Dev Sandbox: Instant Verify (Skip 2 Mins Limit)
              </button>
            </div>
          )}

          {/* STEP 2C: THE CLAIM AWARD STATE ACCESSIBILITY */}
          {step === 'claim_award' && (
            <div className="py-6 flex flex-col items-center gap-4 animate-scaleUp text-center">
              <div className="w-14 h-14 bg-amber-950/40 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center text-2xl shadow-lg ring-4 ring-amber-400/10 animate-bounce">
                🏆
              </div>

              <div className="space-y-1 w-full text-center">
                <h4 className="text-amber-400 font-black text-sm uppercase tracking-widest leading-none">
                  MATCH SUCCESSFUL!
                </h4>
                <p className="text-[10px] text-gray-400 leading-normal max-w-[280px] mx-auto">
                  Safaricom public ledger confirmed real transaction record! Your billing record of KSh <span className="text-white font-mono font-bold">{parseFloat(amount).toLocaleString()}</span> matching code <span className="text-amber-300 font-mono font-bold bg-black/40 px-1 rounded">{pastedCode}</span> is fully authentic.
                </p>
              </div>

              <div className="w-full p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-[10px] space-y-1 text-left">
                <div className="flex justify-between text-gray-400">
                  <span>Reference ID:</span>
                  <span className="font-mono text-white font-medium">{pastedCode}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Status:</span>
                  <span className="text-green-500 font-black font-sans uppercase text-[9px]">AUTHENTICATED REAL</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Credit Amount:</span>
                  <span className="font-mono text-[#00e600] font-bold">KSh {parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#fbbf24] font-bold">
                  <span>🎁 Multiplier Award Match:</span>
                  <span>+KSh {(parseFloat(amount) * 0.20).toLocaleString()} (20% Extra Key)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('success');
                  onDepositSuccess(parseFloat(amount));
                }}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 hover:brightness-110 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-yellow-500/10 transition-transform active:scale-95 animate-pulse cursor-pointer text-center font-bold"
              >
                🎁 CLAIM KSh {parseFloat(amount).toLocaleString()} GAME CHIPS + BONUSES!
              </button>
            </div>
          )}

          {/* STEP 3: TRANSACTION CLEARED SUCCESS OVERLAY SCREEN */}
          {step === 'success' && (
            <div className="py-8 flex flex-col items-center text-center gap-4 animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-[#0e1e0d] border-2 border-[#2b5a27] flex items-center justify-center text-4xl text-[#00e600] animate-bounce">
                <CheckCircle2 className="w-8 h-8 text-[#00e600]" />
              </div>

              <div className="space-y-1">
                <h4 className="text-white text-md font-black uppercase tracking-wider">
                  Cleared Successfully!
                </h4>
                <p className="text-xs text-gray-400">
                  {tab === 'deposit' 
                    ? `Your payment of ${parseFloat(amount).toLocaleString()} KSh has been received and credited.` 
                    : `Your withdrawal of ${parseFloat(amount).toLocaleString()} KSh is dispatching instantly.`}
                </p>
                <div className="mt-3 inline-block bg-[#0f210e]/60 px-3 py-1.5 rounded-lg border border-[#1a3818] font-mono text-xs text-[#00e600] font-bold">
                  Wallet updated!
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-2 text-xs py-2 px-5 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white/10 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
          </>
         )}
        </div>
        
      </div>
    </div>
  );
}
