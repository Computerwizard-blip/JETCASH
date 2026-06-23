/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, AlertTriangle, HeartHandshake, Timer, Ban, 
  Settings, Coins, PhoneCall, HelpCircle, CheckCircle2, RefreshCw 
} from 'lucide-react';

interface ResponsibleGamingProps {
  onClose: () => void;
  depositLimit: number | null;
  setDepositLimit: (limit: number | null) => void;
  sessionLimit: number | null; // in minutes
  setSessionLimit: (limit: number | null) => void;
  selfExcludedDays: number | null;
  onSelfExclude: (days: number) => void;
  totalDepositedToday: number;
  sessionTimeLeftSecs: number | null;
  resetSessionTimer: () => void;
  onResetDeposits?: () => void;
}

export default function ResponsibleGamingModal({
  onClose,
  depositLimit,
  setDepositLimit,
  sessionLimit,
  setSessionLimit,
  selfExcludedDays,
  onSelfExclude,
  totalDepositedToday,
  sessionTimeLeftSecs,
  resetSessionTimer,
  onResetDeposits
}: ResponsibleGamingProps) {
  const [activeTab, setActiveTab ] = useState<'overview' | 'limits' | 'exclusion' | 'resources'>('overview');
  const [tempLimit, setTempLimit] = useState<string>(depositLimit ? depositLimit.toString() : '');
  const [tempTime, setTempTime] = useState<string>(sessionLimit ? sessionLimit.toString() : '');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse deposit limit
    const parsedLimit = tempLimit.trim() === '' ? null : parseFloat(tempLimit);
    if (parsedLimit !== null && (isNaN(parsedLimit) || parsedLimit <= 0)) {
      alert("Please enter a valid positive deposit limit!");
      return;
    }
    setDepositLimit(parsedLimit);

    // Parse session limit
    const parsedTime = tempTime.trim() === '' ? null : parseInt(tempTime);
    if (parsedTime !== null && (isNaN(parsedTime) || parsedTime <= 0)) {
      alert("Please enter a valid positive session duration in minutes!");
      return;
    }
    setSessionLimit(parsedTime);
    if (parsedTime !== null) {
      resetSessionTimer();
    }

    setSaveStatus("Limits updated successfully!");
    setTimeout(() => {
      setSaveStatus(null);
    }, 2500);
  };

  const formatTimeStr = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="resp-gaming-modal" className="fixed inset-0 bg-[#07080a]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn select-none font-sans text-gray-100">
      <div className="bg-[#141518] rounded-2xl border border-[#2b2d35] max-w-md w-full overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex flex-col h-[520px]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 bg-[#0d0e10] border-b border-[#212327]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h4 className="text-white text-sm font-black uppercase tracking-wider">Responsible Gaming</h4>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Row */}
        <div className="flex border-b border-[#212327] bg-[#0d0e10]/40 p-1 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-3 text-[11px] font-bold transition-all rounded-lg cursor-pointer whitespace-nowrap ${activeTab === 'overview' ? 'bg-[#1b1c21] text-emerald-400' : 'text-gray-400 hover:text-white'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('limits')}
            className={`flex-1 py-2 px-3 text-[11px] font-bold transition-all rounded-lg cursor-pointer whitespace-nowrap ${activeTab === 'limits' ? 'bg-[#1b1c21] text-emerald-400' : 'text-gray-400 hover:text-white'}`}
          >
            Setup Limits
          </button>
          <button
            onClick={() => setActiveTab('exclusion')}
            className={`flex-1 py-2 px-3 text-[11px] font-bold transition-all rounded-lg cursor-pointer whitespace-nowrap ${activeTab === 'exclusion' ? 'bg-[#1b1c21] text-red-400' : 'text-gray-400 hover:text-white'}`}
          >
            Self-Exclusion
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex-1 py-2 px-3 text-[11px] font-bold transition-all rounded-lg cursor-pointer whitespace-nowrap ${activeTab === 'resources' ? 'bg-[#1b1c21] text-amber-400' : 'text-gray-400 hover:text-white'}`}
          >
            Support Helplines
          </button>
        </div>

        {/* Modal Main Content (Scrollable if necessary) */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-scaleUp">
              <div className="bg-[#1b1d22] p-3 rounded-xl border border-[#2b2d35] flex items-start gap-3">
                <HeartHandshake className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-white text-xs font-bold leading-tight">Our Commitment to You</h5>
                  <p className="text-[10px] text-gray-400 font-medium">
                    CasinoHub & Aviator provides player safety protection features. Play responsibly for leisure and entertainment only. Set custom limits early.
                  </p>
                </div>
              </div>

              {/* Limit Status indicators */}
              <div className="grid grid-cols-2 gap-3">
                {/* Deposit limits indicator */}
                <div className="bg-[#0e0f11] p-3 rounded-xl border border-[#212327] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-gray-500 font-bold text-[10px] uppercase">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Deposit Limit</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-md font-mono font-black text-white">
                      {depositLimit !== null ? `${depositLimit.toLocaleString()} KSh` : 'Unlimited'}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-1 flex justify-between items-center">
                      <span>Deposited today: <strong className="text-emerald-400 font-mono">{totalDepositedToday} KSh</strong></span>
                      {onResetDeposits && (
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); onResetDeposits(); }}
                          className="text-[8px] text-[#00e600] hover:text-[#34d100] underline uppercase font-bold cursor-pointer"
                          title="Sandbox: Reset statistics log"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Session limit indicator */}
                <div className="bg-[#0e0f11] p-3 rounded-xl border border-[#212327] flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-gray-500 font-bold text-[10px] uppercase">
                    <Timer className="w-3.5 h-3.5 text-amber-500" />
                    <span>Session Timer</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-md font-mono font-black text-white">
                      {sessionLimit !== null ? `${sessionLimit} minutes` : 'Unlimited'}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-1">
                      {sessionTimeLeftSecs !== null ? (
                        <span>Enforced state: <strong className="text-amber-400 font-mono">{formatTimeStr(sessionTimeLeftSecs)} remaining</strong></span>
                      ) : (
                        <span>Standard active play monitoring</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety warning */}
              <div className="p-3 bg-red-950/15 border border-red-500/10 rounded-xl flex gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[9.5px] text-gray-400">
                  Daily stats indicate you have participated in safe entertainment loops. Avoid chasing losses or gambling with coins you can't afford to lose.
                </p>
              </div>

              {/* Clean Reload helper */}
              <button
                onClick={() => setActiveTab('limits')}
                className="w-full py-2.5 bg-[#212327] hover:bg-[#2c2d35] text-white text-[10.5px] font-bold rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Adjust Limits & Controls</span>
              </button>
            </div>
          )}

          {/* TAB 2: SETUP DEPOSIT & SESSION LIMITS */}
          {activeTab === 'limits' && (
            <form onSubmit={handleSaveLimits} className="space-y-4 animate-scaleUp">
              {/* Heading */}
              <div>
                <h5 className="text-xs text-white uppercase font-black tracking-wider flex items-center gap-1">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>Enforce Financial Limits</span>
                </h5>
                <p className="text-[10px] text-gray-400 font-medium">
                  Financial limits safeguard your wallet by rejecting M-Pesa STK deposits that would exceed your ceiling.
                </p>
              </div>

              {/* Deposit limit input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Daily Deposit Limit (KSh)</label>
                  <label className="text-[9px] text-[#00e600] font-bold">Limit: 24h cycle</label>
                </div>
                <div className="relative">
                  <Coins className="w-4.5 h-4.5 absolute left-3 top-3 text-gray-500" />
                  <input 
                    type="number"
                    value={tempLimit}
                    onChange={(e) => setTempLimit(e.target.value)}
                    className="w-full pl-10 pr-16 py-2.5 bg-[#0e0f11] text-white rounded-lg border border-[#2c2d34] text-xs font-mono outline-none focus:border-emerald-500 transition-all font-bold"
                    placeholder="Enter max KSh (e.g. 5000) or leave empty for no limit"
                  />
                  <span className="absolute right-3.5 top-3 text-[10px] text-gray-500 font-bold">KSh / DAY</span>
                </div>
              </div>

              {/* Session timer limit input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-wider">Session Time Limit (Minutes)</label>
                  <label className="text-[9px] text-amber-500 font-bold">Automatic alert trigger</label>
                </div>
                <div className="relative">
                  <Timer className="w-4.5 h-4.5 absolute left-3 top-3 text-gray-500" />
                  <input 
                    type="number"
                    value={tempTime}
                    onChange={(e) => setTempTime(e.target.value)}
                    className="w-full pl-10 pr-16 py-2.5 bg-[#0e0f11] text-white rounded-lg border border-[#2c2d34] text-xs font-mono outline-none focus:border-emerald-500 transition-all font-bold"
                    placeholder="e.g. 10(mins) or leave empty to clear"
                  />
                  <span className="absolute right-3.5 top-3 text-[10px] text-gray-500 font-bold">MINUTES</span>
                </div>
              </div>

              {/* Success notification banner */}
              {saveStatus && (
                <div className="flex items-center gap-1.5 p-2 bg-emerald-950/20 border border-emerald-500/15 rounded-lg text-[10.5px] text-emerald-400 font-bold justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{saveStatus}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-[10.5px] tracking-wider rounded-xl transition-all cursor-pointer shadow-[0_3px_10px_rgba(16,185,129,0.25)]"
              >
                APPLY LIMIT CONTROLS
              </button>
            </form>
          )}

          {/* TAB 3: SELF-EXCLUSION EXTREME SAFETY VALVE */}
          {activeTab === 'exclusion' && (
            <div className="space-y-4 animate-scaleUp text-[11px]">
              <div>
                <h5 className="text-xs text-white uppercase font-black tracking-wider flex items-center gap-1 text-red-400">
                  <Ban className="w-4 h-4 text-red-400" />
                  <span>Enable Self-Exclusion</span>
                </h5>
                <p className="text-[10px] text-gray-400 font-medium">
                  Need a break? Cool down immediately. Selecting an option below will lock your account and log you out of all betting features for the chosen duration.
                </p>
              </div>

              {/* Warning Area */}
              <div className="bg-red-950/20 border border-red-500/20 p-3 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="text-white text-[10.5px] block font-bold">CRITICAL SAFETY FACT:</strong>
                  <span className="text-gray-400 text-[9.5px]">
                    Once enabled, flight betting is fully locked. Safaricom and CasinoHub limits are strictly obeyed. You cannot undo this trigger until the timeline finishes!
                  </span>
                </div>
              </div>

              {/* Duration choice buttons */}
              <div className="space-y-2 pt-1">
                {[
                  { days: 1, label: "Cool Off - 24 Hours Break" },
                  { days: 7, label: "Cool Off - 7 Days Break" },
                  { days: 30, label: "Extended Safe Self-Exclusion (30 Days)" }
                ].map((choice) => (
                  <button
                    key={choice.days}
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you absolutely sure you want to lock your account for ${choice.days} days? This cannot be bypassed.`)) {
                        onSelfExclude(choice.days);
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-[#1a1c22] hover:bg-red-950/25 border border-red-500/10 hover:border-red-500/30 text-gray-200 hover:text-red-400 rounded-xl transition-all font-bold text-left flex justify-between items-center cursor-pointer"
                  >
                    <span>{choice.label}</span>
                    <Ban className="w-3.5 h-3.5 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HELPLINES & EDUCATIONAL RESOURCES */}
          {activeTab === 'resources' && (
            <div className="space-y-4 animate-scaleUp text-[11px]">
              <div>
                <h5 className="text-xs text-amber-400 uppercase font-black tracking-wider flex items-center gap-1">
                  <PhoneCall className="w-4 h-4 text-amber-400" />
                  <span>Support Organizations</span>
                </h5>
                <p className="text-[10px] text-gray-400 font-medium">
                  If you or someone you know feels overwhelmed or shows signs of unhealthy gambling behavior, please reach out to these expert institutions. Support is confidential & free:
                </p>
              </div>

              {/* Organization cards list */}
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                <div className="bg-[#101114] p-3 rounded-lg border border-[#23252a] space-y-1">
                  <h6 className="text-white font-extrabold text-xs">Responsible Gambling Association of Kenya (RGAK)</h6>
                  <p className="text-[10px] text-gray-400">Promotes player safety and helps find counseling services across East Africa.</p>
                  <div className="flex gap-4 pt-1 font-mono text-[9px] text-emerald-400 font-bold">
                    <span>📞 Hotline: +254 700 000 000</span>
                    <a href="https://rgak.org" target="_blank" rel="noopener noreferrer" className="hover:underline">🌐 Visit website</a>
                  </div>
                </div>

                <div className="bg-[#101114] p-3 rounded-lg border border-[#23252a] space-y-1">
                  <h6 className="text-white font-extrabold text-xs">GambleAware (International Help)</h6>
                  <p className="text-[10px] text-gray-400">Leading organization promoting responsible play, offering live chats and interactive self-evaluation toolkits.</p>
                  <div className="flex gap-4 pt-1 font-mono text-[9px] text-emerald-400 font-bold">
                    <span>📞 UK Free: +44 808 8020 133</span>
                    <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" className="hover:underline">🌐 begambleaware.org</a>
                  </div>
                </div>

                <div className="bg-[#101114] p-3 rounded-lg border border-[#23252a] space-y-1">
                  <h6 className="text-white font-extrabold text-xs">National Council on Problem Gambling</h6>
                  <p className="text-[10px] text-gray-400">Completely anonymous hotline counseling and health protection assets.</p>
                  <div className="flex gap-4 pt-1 font-mono text-[9px] text-emerald-400 font-bold">
                    <span>📞 24/7 Call: 1-800-522-4700</span>
                    <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="hover:underline">🌐 ncpgambling.org</a>
                  </div>
                </div>
              </div>

              {/* Supportive note */}
              <div className="p-2.5 bg-[#0e0f11] rounded-md border border-amber-500/10 text-center font-medium italic text-[10px] text-gray-400">
                ⚠️ Betting on crash multipliers is intended purely to be a fun pastime, not a replacement for steady financial income. Only play with pocket funds!
              </div>
            </div>
          )}

        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-[#0d0e10] border-t border-[#212327] flex justify-between items-center shrink-0">
          <span className="text-[9px] font-mono text-gray-500">M-Pesa Cashier & VIP Player Safety Enforced</span>
          <span className="text-[9.5px] uppercase font-mono font-black text-emerald-400">Provably Fair</span>
        </div>

      </div>
    </div>
  );
}
