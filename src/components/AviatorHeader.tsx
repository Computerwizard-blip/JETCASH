/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Menu, ArrowLeft, Volume2, VolumeX, ShieldAlert, Bell, Gamepad2, User, Settings } from 'lucide-react';
import { UserProfile } from '../types';
// @ts-ignore
import appLogo from '../assets/images/aviator_app_logo_1780602471546.png';

interface AviatorHeaderProps {
  balance: number;
  onOpenDeposit: () => void;
  onOpenResponsibleGaming: () => void;
  muted: boolean;
  onToggleMute: () => void;
  currentView?: 'aviator' | 'lobby' | 'admin';
  setView?: (view: 'aviator' | 'lobby' | 'admin') => void;
  notificationsCount?: number;
  onToggleNotifications?: () => void;
  authSessionMode?: 'demo' | 'real' | null;
  onToggleAuthSessionMode?: () => void;
  userProfile?: UserProfile;
  onOpenProfile: () => void;
  onOpenDownloadApp?: () => void;
  onOpenSettings?: () => void;
}

export default function AviatorHeader({ 
  balance, 
  onOpenDeposit,
  onOpenResponsibleGaming,
  muted,
  onToggleMute,
  currentView = 'aviator',
  setView,
  notificationsCount = 0,
  onToggleNotifications,
  authSessionMode,
  onToggleAuthSessionMode,
  userProfile,
  onOpenProfile,
  onOpenDownloadApp,
  onOpenSettings
}: AviatorHeaderProps) {
  const handleBackClick = () => {
    if (setView) setView('lobby');
  };

  return (
    <header className="h-14 bg-[#141518] px-4 flex items-center justify-between border-b border-[#212327] select-none shrink-0 border-x border-[#212327]">
      {/* Target Action - Navigation */}
      {currentView !== 'lobby' ? (
        <button 
          onClick={handleBackClick}
          className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 transition-all rounded-lg border border-[#212327] hover:border-[#2b2d32] bg-[#1a1b1e]/60 hover:bg-[#1a1b1e] text-amber-500 hover:text-amber-400 active:scale-90 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.05)] hover:shadow-[0_0_14px_rgba(245,158,11,0.15)]"
          title="Exit back to Casino grounds"
          id="exit-game-btn"
        >
          <Gamepad2 className="w-5 h-5 text-amber-500 hover:scale-105 transition-transform" />
        </button>
      ) : (
        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-[#212327] bg-[#1a1b1e]/40 text-amber-500/80">
          <Gamepad2 className="w-4 h-4 text-amber-500 animate-pulse" />
        </div>
      )}

      {/* Styled Brand Name Logo (Slanted Red or Purple Typography) */}
      <div className="flex items-center gap-2 border-x border-[#212327]/50 px-3 self-stretch cursor-pointer group select-none" onClick={() => setView?.('lobby')}>
        <div className="w-6.5 h-6.5 rounded-lg bg-black/50 border border-red-500/30 p-0.5 flex items-center justify-center shrink-0">
          <img src={appLogo} alt="App Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <span className={`text-sm sm:text-base font-black italic tracking-wide uppercase transition-transform duration-300 ${currentView === 'aviator' ? 'text-[#e21515] drop-shadow-[0_2px_4px_rgba(226,21,21,0.25)]' : 'text-purple-400 drop-shadow-[0_2px_4px_rgba(168,85,247,0.25)]'}`}>
          {currentView === 'aviator' ? 'JETCASH' : 'CasinoHub'}
        </span>
      </div>

      {/* KES Wallet Counter, Audio Volume, Notification alert and Safety Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Toggle Demo vs Real play mode */}
        {onToggleAuthSessionMode && authSessionMode && (
          <button
            onClick={onToggleAuthSessionMode}
            className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm border transition-all active:scale-95 ${
              authSessionMode === 'real'
                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-900/10'
                : 'bg-purple-950/30 text-purple-300 border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-900/10'
            }`}
            title={`Switch to ${authSessionMode === 'real' ? 'Demo Practice' : 'Real Play'} mode`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${authSessionMode === 'real' ? 'bg-[#00e600] animate-pulse' : 'bg-purple-400'}`}></span>
            <span>{authSessionMode === 'real' ? 'Real Play' : 'Demo Play'}</span>
          </button>
        )}

        {/* Clickable Wallet display - triggers MPesa Overlay */}
        <div 
          id="deposit-header-btn"
          onClick={onOpenDeposit}
          className="flex items-center gap-1 bg-[#0e160e] border border-[#2b5c2a] px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg cursor-pointer hover:bg-[#1a2d19] transition-all select-none active:scale-95"
          title="M-Pesa cash transaction till deposit"
        >
          <span className="text-xs font-mono font-black text-[#00e600] tracking-tight">
            {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] font-bold text-gray-400 font-mono">KSh</span>
        </div>






      </div>
    </header>
  );
}
