/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Minus, Plus, Settings2, HelpCircle } from 'lucide-react';

interface AviatorBetPanelProps {
  panelId: string;
  balance: number;
  crashActive: boolean;
  crashMultiplier: number;
  countdownActive: boolean;
  isPlaced: boolean;
  setIsPlaced: (v: boolean) => void;
  hasCashedOut: boolean;
  setHasCashedOut: (v: boolean) => void;
  onBetPlaced: (amount: number) => boolean | void;
  onCashOut: (multiplier: number, amount: number) => void;
  onBetCancelled?: (amount: number) => void;
  onRefill?: (amount: number) => void;
  isDemo?: boolean;
  isNextPlaced?: boolean;
  nextBetVal?: number;
  placedBetAmountProp?: number;
}

export default function AviatorBetPanel({
  panelId,
  balance,
  crashActive,
  crashMultiplier,
  countdownActive,
  isPlaced,
  setIsPlaced,
  hasCashedOut,
  setHasCashedOut,
  onBetPlaced,
  onCashOut,
  onBetCancelled,
  onRefill,
  isDemo = true,
  isNextPlaced = false,
  nextBetVal = 0,
  placedBetAmountProp = 0,
}: AviatorBetPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'bet' | 'auto'>('bet');
  const [betAmount, setBetAmount] = useState<number>(10.00);
  const [betAmountInput, setBetAmountInput] = useState<string>("10.00");
  const [localPlacedBetAmount, setLocalPlacedBetAmount] = useState<number>(0);
  const setPlacedBetAmount = setLocalPlacedBetAmount;
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState<boolean>(false);
  const [autoCashoutValue, setAutoCashoutValue] = useState<number>(2.00);
  const [autoBetEnabled, setAutoBetEnabled] = useState<boolean>(false);
  const [localIsWaitingNextRound, setLocalIsWaitingNextRound] = useState<boolean>(false);
  const setIsWaitingNextRound = setLocalIsWaitingNextRound;
  const [panelError, setPanelError] = useState<string>('');
  const [showRefillPrompt, setShowRefillPrompt] = useState<boolean>(false);

  const isWaitingNextRound = isNextPlaced;
  const resolvedIsPlaced = isPlaced || isNextPlaced;
  const placedBetAmount = isNextPlaced ? nextBetVal : (placedBetAmountProp !== undefined && placedBetAmountProp > 0 ? placedBetAmountProp : localPlacedBetAmount);
  const isStakeLocked = resolvedIsPlaced && !hasCashedOut && !isWaitingNextRound;

  // Quick stake buttons with custom ordered formats
  const quickStakes = [
    { value: 10, label: "10.00" },
    { value: 100, label: "100.00" },
    { value: 1000, label: "1000.00" },
    { value: 10000, label: "10,000.00" },
    { value: 100000, label: "100000" }
  ];

  // Sync state betAmount with text input representation
  useEffect(() => {
    if (document.activeElement?.id !== `bet-input-${panelId}`) {
      setBetAmountInput(betAmount.toFixed(2));
    }
  }, [betAmount, panelId]);

  // Adjust bet bounds
  const adjustBet = (amount: number) => {
    if (isStakeLocked) return; // Prevent adjustment when bet is active
    setBetAmount(prev => {
      const next = prev + amount;
      const finalVal = next >= 10 ? (next <= 100000 ? parseFloat(next.toFixed(2)) : 100000.00) : 10.00;
      setBetAmountInput(finalVal.toFixed(2));
      setPanelError('');
      return finalVal;
    });
  };

  const handleManualInput = (val: string) => {
    if (isStakeLocked) return;
    setBetAmountInput(val);

    const num = parseFloat(val);
    if (!isNaN(num)) {
      // Limit to max 100,000 KSh
      const capped = Math.min(100000, Math.max(0, num));
      setBetAmount(capped);

      // Instant alert when entering value below 10 KSh
      if (capped < 10 && val.trim() !== '') {
        setPanelError("Minimum authorized limit is 10 KSh!");
      } else if (capped > 100000) {
        setPanelError("Maximum authorized limit is 100,000 KSh!");
      } else {
        setPanelError('');
      }
    } else {
      setPanelError('');
    }
  };

  const handleInputBlur = () => {
    let num = parseFloat(betAmountInput);
    if (isNaN(num) || num < 10) {
      num = 10.00;
    } else if (num > 100000) {
      num = 100000.00;
    }
    const finalVal = parseFloat(num.toFixed(2));
    setBetAmount(finalVal);
    setBetAmountInput(finalVal.toFixed(2));
    setPanelError('');
  };

  const handleQuickStakeClick = (stake: number) => {
    if (isStakeLocked) return;
    setBetAmount(stake);
    setBetAmountInput(stake.toFixed(2));
    setPanelError('');
  };

  const handlePlaceNextRoundBet = () => {
    if (betAmount < 10) {
      setPanelError("Minimum authorized limit is 10 KSh!");
      setTimeout(() => setPanelError(''), 4000);
      return;
    }

    if (betAmount > 100000) {
      setPanelError("Maximum authorized limit is 100,000 KSh!");
      setTimeout(() => setPanelError(''), 4000);
      return;
    }

    if (balance < betAmount) {
      if (isDemo) {
        setShowRefillPrompt(true);
      } else {
        setPanelError("please make a deposit of a minimum 100ksh");
        setTimeout(() => setPanelError(''), 4000);
      }
      return;
    }

    setIsWaitingNextRound(true);
    setIsPlaced(true);
    setHasCashedOut(false);
    setPlacedBetAmount(betAmount);
    const success = onBetPlaced(betAmount);
    if (success === false) {
      setIsWaitingNextRound(false);
      setIsPlaced(false);
      setPlacedBetAmount(0);
    }
  };

  // Perform Bet placements
  const handlePlaceBet = () => {
    if (resolvedIsPlaced) {
      // Cancel outstanding preflight bet or queued next-round bet
      if (countdownActive || isWaitingNextRound) {
        setIsPlaced(false);
        setHasCashedOut(false);
        if (onBetCancelled) {
          onBetCancelled(placedBetAmount);
        }
        setPlacedBetAmount(0);
        setIsWaitingNextRound(false);
      }
      return;
    }

    if (betAmount < 10) {
      setPanelError("Minimum authorized limit is 10 KSh!");
      setTimeout(() => setPanelError(''), 4000);
      return;
    }

    if (betAmount > 100000) {
      setPanelError("Maximum authorized limit is 100,000 KSh!");
      setTimeout(() => setPanelError(''), 4000);
      return;
    }

    if (balance < betAmount) {
      if (isDemo) {
        setShowRefillPrompt(true);
      } else {
        setPanelError("please make a deposit of a minimum 100ksh");
        setTimeout(() => setPanelError(''), 4000);
      }
      return;
    }

    // Capture whether the flight is currently soaring or not
    const expectWaiting = !!(crashActive || !countdownActive);
    if (expectWaiting) {
      setIsWaitingNextRound(true);
    } else {
      setIsWaitingNextRound(false);
    }

    setIsPlaced(true);
    setHasCashedOut(false);
    setPlacedBetAmount(betAmount);
    const success = onBetPlaced(betAmount);
    if (success === false) {
      setIsWaitingNextRound(false);
      setIsPlaced(false);
      setPlacedBetAmount(0);
    }
  };

  // Trigger cashout payout
  const handleCashOutClick = () => {
    if (!isPlaced || hasCashedOut || !crashActive || isWaitingNextRound) return;
    setHasCashedOut(true);
    const payout = parseFloat((placedBetAmount * crashMultiplier).toFixed(2));
    onCashOut(crashMultiplier, payout);
  };

  // Auto-cashout trigger scan loop in-flight
  useEffect(() => {
    if (crashActive && isPlaced && !isWaitingNextRound && !hasCashedOut && autoCashoutEnabled) {
      if (crashMultiplier >= autoCashoutValue) {
        setHasCashedOut(true);
        const payout = parseFloat((placedBetAmount * autoCashoutValue).toFixed(2));
        onCashOut(autoCashoutValue, payout);
      }
    }
  }, [crashActive, crashMultiplier, isPlaced, isWaitingNextRound, hasCashedOut, autoCashoutEnabled, autoCashoutValue, placedBetAmount]);

  // Handle auto-bet setup on countdown start
  useEffect(() => {
    if (countdownActive && autoBetEnabled && !isPlaced) {
      if (balance >= betAmount && betAmount >= 10) {
        setIsPlaced(true);
        setHasCashedOut(false);
        setPlacedBetAmount(betAmount);
        const success = onBetPlaced(betAmount);
        if (success === false) {
          setIsPlaced(false);
          setPlacedBetAmount(0);
        }
      }
    }
  }, [countdownActive, autoBetEnabled]);

  // Sync waiting next round bet into active countdown slot when lobby countdown begins
  useEffect(() => {
    if (countdownActive && isWaitingNextRound) {
      setIsWaitingNextRound(false);
    }
  }, [countdownActive, isWaitingNextRound]);

  // Reset states when round ends
  useEffect(() => {
    if (!crashActive && !countdownActive) {
      if (!isWaitingNextRound) {
        if (!autoBetEnabled) {
          setIsPlaced(false);
          setPlacedBetAmount(0);
        }
        setHasCashedOut(false);
      }
    }
  }, [crashActive, countdownActive, isWaitingNextRound, autoBetEnabled]);

  return (
    <div className="bg-[#141518] p-1.5 xs:p-2 md:p-1.5 lg:p-2 rounded-xl md:rounded-2xl border border-[#212327] flex flex-col gap-1 xs:gap-1.5 md:gap-1 lg:gap-1.5 overflow-hidden select-none shadow-md">
      {/* 1. Header Tabs Row - Bet & Auto */}
      <div className="flex justify-between items-center select-none pb-0.5 border-b border-[#212327]/10">
        <div className="flex bg-[#0e0f11] p-0.5 rounded-full border border-[#23252b]">
          <button 
            type="button"
            onClick={() => setActiveSubTab('bet')}
            className={`px-3 md:px-3 text-[10px] sm:text-xs font-bold font-sans transition-all cursor-pointer ${activeSubTab === 'bet' ? 'bg-[#212327] text-white shadow' : 'text-[#8e9099] hover:text-white'}`}
          >
            Bet
          </button>
          <button 
            type="button"
            onClick={() => setActiveSubTab('auto')}
            className={`px-3 md:px-3 text-[10px] sm:text-xs font-bold font-sans transition-all cursor-pointer ${activeSubTab === 'auto' ? 'bg-[#212327] text-white shadow' : 'text-[#8e9099] hover:text-white'}`}
          >
            Auto
          </button>
        </div>

        {/* Small settings gear icon */}
        <button className="text-[#8e9099] hover:text-white transition-colors cursor-pointer p-0.5 rounded hover:bg-[#1f2025]">
          <Settings2 className="w-3 h-3" />
        </button>
      </div>

      {/* 2. Embedded Auto Settings if Active */}
      {activeSubTab === 'auto' && (
        <div className="grid grid-cols-2 gap-2 md:gap-1.5 bg-[#0d0e10] p-1.5 md:p-1 lg:p-1.5 rounded-lg border border-[#22242a] animate-fadeIn text-[11px] font-sans">
          {/* Toggle Auto Bet */}
          <div className="flex items-center justify-between bg-[#141518] px-2 md:px-1.5 py-1 md:py-0.5 rounded border border-[#252830]">
            <span className="text-[#8e9099] font-bold uppercase tracking-wider text-[9.5px]">Auto Bet</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoBetEnabled}
                onChange={(e) => setAutoBetEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-[#23252b] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[#8e9099] peer-checked:after:bg-[#00e600] after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0c1f0b]" />
            </label>
          </div>

          {/* Toggle Auto Cashout */}
          <div className="flex items-center justify-between bg-[#141518] px-2 md:px-1.5 py-1 md:py-0.5 rounded border border-[#252830]">
            <span className="text-[#8e9099] font-bold uppercase tracking-wider text-[9.5px]">Auto Cash</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoCashoutEnabled}
                onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-[#23252b] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-[#8e9099] peer-checked:after:bg-[#00e600] after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0c1f0b]" />
            </label>
          </div>

          {/* Auto Cashout multiplier input field */}
          <div className="col-span-2 flex items-center justify-between bg-[#0e0f11] px-2 md:px-1.5 py-1 md:py-0.5 rounded border border-[#1b1c21]">
            <span className="text-[#8e9099] font-semibold text-[9.5px]">CASHOUT MULTIPLIER (x)</span>
            <input 
              type="number"
              step="0.1"
              min="1.01"
              value={autoCashoutValue}
              disabled={!autoCashoutEnabled}
              onChange={(e) => setAutoCashoutValue(Math.max(1.01, parseFloat(e.target.value)))}
              className="w-16 bg-black/60 outline-none hover:border-[#442b66] font-mono text-center text-amber-400 font-bold text-xs ring-1 ring-[#22242a] focus:ring-amber-500 rounded py-0.5 disabled:opacity-40"
            />
          </div>
        </div>
      )}

      {/* Auto Cashout Quick Control Row */}
      <div className="bg-[#0e0f11] p-1.5 md:p-1 lg:p-1.5 rounded-lg md:rounded-xl border border-[#212327] flex flex-wrap items-center justify-between gap-1 text-[11px] sm:text-xs font-sans">
        <div className="flex items-center gap-1.5">
          {/* Custom Slide Checkbox for instant toggle */}
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={autoCashoutEnabled}
              onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
              className="sr-only peer"
            />
            {/* Smooth toggle slider container */}
            <div className="w-8 h-4.5 bg-[#23252b] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-gray-400 peer-checked:after:bg-[#00e600] after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0c1f0b] border border-transparent" />
          </label>
          <div className="flex flex-col">
            <span className="text-[#eaeaea] font-black uppercase tracking-wider text-[9.5px] sm:text-[10.5px]">Auto Cashout</span>
            <span className="text-[8px] sm:text-[9px] text-[#8e9099] leading-none">Auto payout on target hit</span>
          </div>
        </div>

        {/* Dynamic target input value with quick-adjust multipliers */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-black/50 border border-[#252830] rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1 focus-within:border-amber-400 transition-colors">
            <input 
              type="number"
              step="0.05"
              min="1.01"
              disabled={!autoCashoutEnabled}
              value={autoCashoutValue}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setAutoCashoutValue(isNaN(val) ? 1.01 : Math.max(1.01, val));
              }}
              className="w-10 sm:w-14 bg-transparent outline-none font-mono text-right text-amber-400 font-bold text-[11px] sm:text-xs disabled:opacity-40 disabled:text-gray-600 transition-all"
            />
            <span className="text-gray-500 text-[9px] sm:text-[10px] ml-0.5 sm:ml-1 font-black font-mono">x</span>
          </div>

          {/* Preset increment adjustments */}
          <div className="flex gap-0.5 sm:gap-1">
            <button
              type="button"
              disabled={!autoCashoutEnabled}
              onClick={() => setAutoCashoutValue(prev => parseFloat(Math.max(1.01, prev - 0.5).toFixed(2)))}
              className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-[#1f2025] hover:bg-[#282a32] text-[8.5px] sm:text-[9.5px] font-mono font-black text-gray-400 hover:text-white rounded transition-colors disabled:opacity-20 cursor-pointer"
              title="Decrease multiplier by 0.5"
            >
              -0.5
            </button>
            <button
              type="button"
              disabled={!autoCashoutEnabled}
              onClick={() => setAutoCashoutValue(prev => parseFloat((prev + 0.5).toFixed(2)))}
              className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-[#1f2025] hover:bg-[#282a32] text-[8.5px] sm:text-[9.5px] font-mono font-black text-gray-400 hover:text-white rounded transition-colors disabled:opacity-20 cursor-pointer"
              title="Increase multiplier by 0.5"
            >
              +0.5
            </button>
            <button
              type="button"
              disabled={!autoCashoutEnabled}
              onClick={() => setAutoCashoutValue(2.00)}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8.5px] sm:text-[9.5px] font-mono font-black rounded transition-colors cursor-pointer ${autoCashoutValue === 2.0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-[#1f2025] hover:bg-[#282a32] text-gray-400 hover:text-white'}`}
              title="Set to 2.0x"
            >
              2.0x
            </button>
          </div>
        </div>
      </div>

      {/* 3. Betting Operation core section */}
      <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
        {/* Left column: Minus/Plus Counter & Quick buttons */}
        <div className="col-span-12 sm:col-span-6 flex flex-col gap-1.5">
          {/* Main Bet Counter field */}
          <div className="flex items-center justify-between bg-[#0e0f11] rounded-full border border-[#202228] p-1 h-9 sm:h-10 md:h-7.5 lg:h-8 xl:h-10 select-none">
            {/* Minus buttons */}
            <button 
              type="button"
              disabled={isStakeLocked}
              onClick={() => adjustBet(-10.00)}
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 rounded-full flex items-center justify-center bg-[#1f2025] hover:bg-[#2b2d35] border border-[#2e313a] text-white hover:text-red-500 transition-colors disabled:opacity-30 cursor-pointer active:scale-90"
            >
              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3" />
            </button>

            {/* Editable display */}
            <div className="flex-1 text-center font-mono select-all">
              <input 
                id={`bet-input-${panelId}`}
                type="text" 
                value={betAmountInput} 
                disabled={isStakeLocked}
                onChange={(e) => handleManualInput(e.target.value)}
                onBlur={handleInputBlur}
                className="w-full text-center bg-transparent border-none text-white outline-none font-black text-xs sm:text-sm md:text-[10px] lg:text-xs xl:text-sm select-all"
              />
            </div>

            {/* Plus buttons */}
            <button 
              type="button"
              disabled={isStakeLocked}
              onClick={() => adjustBet(10.00)}
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-8 xl:h-8 rounded-full flex items-center justify-center bg-[#1f2025] hover:bg-[#2b2d35] border border-[#2e313a] text-white hover:text-green-500 transition-colors disabled:opacity-30 cursor-pointer active:scale-90"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3" />
            </button>
          </div>

          {/* Underlying Quick Stake Buttons */}
          <div className="grid grid-cols-5 gap-0.5 select-none">
            {quickStakes.map((item) => (
              <button 
                key={item.value}
                type="button"
                disabled={isStakeLocked}
                onClick={() => handleQuickStakeClick(item.value)}
                className={`py-0.5 sm:py-1 md:py-0.5 lg:py-0.5 xl:py-1 rounded bg-[#1c1d22] hover:bg-[#282a32] border border-[#25282f] text-[7.5px] xs:text-[8px] sm:text-[9.5px] md:text-[8px] lg:text-[9px] xl:text-[9.5px] font-mono font-black select-none text-gray-300 hover:text-white transition-all duration-150 disabled:opacity-30 cursor-pointer active:scale-90`}
              >
                {Math.floor(item.value)}
              </button>
            ))}
          </div>
        </div>

        {/* Right column: Massive green button wrapper */}
        <div className="col-span-12 sm:col-span-6">
          {/* Conditional display of button layout based on round status */}
          {!resolvedIsPlaced ? (
            /* Standard GREEN BET trigger - matches photos */
            <button 
              type="button"
              onClick={handlePlaceBet}
              className="w-full h-[44px] md:h-[36px] lg:h-[42px] xl:h-[48px] rounded-lg md:rounded-xl bg-[#2cb400] hover:bg-[#34d100] active:scale-95 hover:scale-[1.01] transition-all cursor-pointer shadow-[0_4px_15px_rgba(44,180,0,0.3)] border-b-2 border-[#1f8700] text-center flex flex-col justify-center items-center select-none"
            >
              <span className="text-white text-xs md:text-[10px] lg:text-[11px] xl:text-xs tracking-widest font-black uppercase leading-none select-none">Bet</span>
              <span className="text-white text-[9px] md:text-[8px] lg:text-[9px] xl:text-[10px] font-mono font-bold tracking-tight select-none mt-0.5">
                {betAmount.toFixed(2)} KSh
              </span>
            </button>
          ) : (
            /* Active Bet displays cancel or CASH OUT triggers dynamically */
            (countdownActive || isWaitingNextRound) ? (
              /* Placed wager inside lobby countdown or waiting for next round - user can CANCEL and get refund */
              <button 
                type="button"
                onClick={handlePlaceBet}
                className="w-full h-[44px] md:h-[36px] lg:h-[42px] xl:h-[48px] rounded-lg md:rounded-xl bg-[#cb002b] hover:bg-[#e60031] active:scale-95 transition-all cursor-pointer shadow-[0_4px_12px_rgba(203,0,43,0.3)] border-b-2 border-[#94001f] text-center flex flex-col justify-center items-center"
              >
                <span className="text-white text-xs md:text-[10px] lg:text-[11px] xl:text-xs font-black tracking-widest uppercase leading-none">CANCEL</span>
                <span className="text-white text-[8px] md:text-[7.5px] lg:text-[8px] uppercase font-mono font-bold opacity-80 mt-0.5">
                  {isWaitingNextRound ? 'Wait Round' : 'Refund'}
                </span>
              </button>
            ) : (
              /* Flight is active and user went on-board! Redirection to ORANGE-GOLD CASH OUT button */
              !hasCashedOut ? (
                <button 
                  type="button"
                  onClick={handleCashOutClick}
                  className="w-full h-[44px] md:h-[36px] lg:h-[42px] xl:h-[48px] rounded-lg md:rounded-xl bg-gradient-to-r from-[#ffbf00] to-[#ff9900] active:scale-95 hover:scale-[1.01] transition-all cursor-pointer shadow-[0_4px_22px_rgba(255,153,0,0.4)] border-b-2 border-[#c47c00] text-center flex flex-col justify-center items-center animate-pulse"
                >
                  <span className="text-black text-xs md:text-[10px] lg:text-[11px] xl:text-xs tracking-widest font-black uppercase leading-none select-none">CASH OUT</span>
                  <span className="text-black font-mono font-bold text-xs md:text-[10px] lg:text-[11px] xl:text-xs tracking-tight mt-0.5 select-none text-shadow-sm">
                    {(placedBetAmount * crashMultiplier).toFixed(2)} KSh
                  </span>
                </button>
              ) : (
                /* Already cashed out successfully - allow placing bet for next flight immediately 24/7! */
                <button 
                  type="button"
                  onClick={handlePlaceNextRoundBet}
                  className="w-full h-[44px] md:h-[36px] lg:h-[42px] xl:h-[48px] rounded-lg md:rounded-xl bg-[#2cb400] hover:bg-[#34d100] active:scale-95 hover:scale-[1.01] transition-all cursor-pointer shadow-[0_4px_15px_rgba(44,180,0,0.3)] border-b-2 border-[#1f8700] text-center flex flex-col justify-center items-center select-none"
                >
                  <span className="text-white text-[9px] md:text-[8px] lg:text-[9px] tracking-widest font-black uppercase leading-none select-none">BET (NEXT)</span>
                  <span className="text-[8px] md:text-[7.5px] lg:text-[8px] font-mono font-bold tracking-tight text-emerald-300 mt-0.5 uppercase">Cashed Out</span>
                  <span className="text-white text-[9px] md:text-[8px] lg:text-[9px] font-mono font-bold tracking-tight select-none mt-0.5">
                    {betAmount.toFixed(2)} KSh
                  </span>
                </button>
              )
            )
          )}
          {showRefillPrompt ? (
            <div className="bg-[#151221] border border-purple-500/30 rounded-xl p-3 mt-2 text-center animate-fadeIn space-y-2.5">
              <div className="flex items-center justify-center gap-1.5 text-xs text-purple-300 font-bold">
                💳 <span>Please refill your account</span>
              </div>
              
              <div className="text-xl font-mono font-black text-[#00e600] animate-pulse">
                50,000.00 KSh
              </div>
              
              <div className="text-[10px] text-gray-400">
                Would you like to refill your account balance?
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onRefill) {
                      onRefill(50000);
                    }
                    setShowRefillPrompt(false);
                  }}
                  className="flex-1 py-1.5 bg-[#2cb400] hover:bg-[#34d100] text-black font-black text-xs uppercase rounded-lg border-b-2 border-green-700 active:scale-95 transition-all cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setShowRefillPrompt(false)}
                  className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase rounded-lg active:scale-95 transition-all cursor-pointer"
                >
                  No
                </button>
              </div>
            </div>
          ) : panelError ? (
            <div className="text-[10px] text-red-400 font-bold bg-red-950/40 border border-red-500/20 text-center rounded-lg mt-1.5 py-1 animate-fadeIn">
              ⚠️ {panelError}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
