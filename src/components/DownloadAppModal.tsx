/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Smartphone, CheckCircle2, ShieldCheck, Award, Share, HelpCircle, Star } from 'lucide-react';
// @ts-ignore
import appLogo from '../assets/images/aviator_app_logo_1780602471546.png';

interface DownloadAppModalProps {
  onClose: () => void;
  isOpen: boolean;
  onCreditWallet: (amount: number) => void;
  triggerNotification: (
    title: string,
    msg: string,
    type: 'deposit' | 'withdrawal' | 'bonus' | 'jackpot' | 'tournament' | 'vip' | 'general'
  ) => void;
}

export default function DownloadAppModal({
  onClose,
  isOpen,
  onCreditWallet,
  triggerNotification
}: DownloadAppModalProps) {
  const [platform, setPlatform] = useState<'android' | 'ios' | 'pc'>('android');
  const [promotionActivated, setPromotionActivated] = useState(false);

  // Detect platform automatically on mount
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('pc');
    }
  }, []);

  if (!isOpen) return null;

  const handleActivatePromotion = () => {
    if (promotionActivated) return;
    setPromotionActivated(true);
    // Give a small starting token or trigger the commission logic
    onCreditWallet(150); // Optional small welcome gift
    triggerNotification(
      '🔥 PROMO ACTIVATED',
      'Congratulations! You have activated the 3% Home Screen win commission booster. Launch CasinoHub from your home screen anytime!',
      'bonus'
    );
  };

  return (
    <div id="download-app-modal-overlay" className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in font-sans">
      <div id="download-app-modal-container" className="w-full max-w-md bg-[#181921] border border-red-500/20 hover:border-red-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(226,21,21,0.15)] transition-all duration-300 transform scale-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Top Header */}
        <div className="p-4 bg-gradient-to-r from-[#2a1115] to-[#181921] border-b border-[#24262f] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-red-500/30 p-1 flex items-center justify-center shadow-[0_0_12px_rgba(226,21,21,0.25)] relative group">
              <img 
                src={appLogo} 
                alt="CasinoHub Logo App" 
                className="w-full h-full object-contain shrink-0 rounded-lg group-hover:scale-110 transition-transform"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e600] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00e600]"></span>
              </span>
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-50 uppercase tracking-tight">CasinoHub Home Screen App</h3>
              <p className="text-[10px] text-gray-400 font-mono">Instant PWA Web Client</p>
            </div>
          </div>
          <button 
            id="download-app-close-button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black/40 border border-[#24262f] text-gray-400 hover:text-white flex items-center justify-center transition-colors hover:bg-black/80 active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-red-950/40">
          
          {/* Welcome App Promotion Banner */}
          <div className="bg-gradient-to-br from-[#e21515]/10 via-amber-500/5 to-transparent border border-red-500/30 p-4 rounded-xl flex items-start gap-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1 text-left">
              <h4 className="text-xs font-black text-red-400 uppercase tracking-wide">🎁 3% Win Commission Promotion</h4>
              <p className="text-[11px] text-gray-200 leading-relaxed font-sans">
                Get a <strong className="text-white font-black">+3% Win Commission bonus</strong> on all your cash outs! Simply add CasinoHub to your home screen and load the app to start gaming with extra payout earnings.
              </p>
            </div>
          </div>

          {/* Quick Platform selection Tabs */}
          <div id="download-app-platform-tabs" className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-[#24262f] shrink-0">
            {[
              { id: 'android', label: 'Android Phone', icon: <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> },
              { id: 'ios', label: 'iPhone / iOS', icon: <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> },
              { id: 'pc', label: 'Desktop / PC', icon: <Smartphone className="w-3.5 h-3.5 text-amber-400" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPlatform(tab.id as any)}
                className={`py-2 rounded-lg text-[11px] font-black uppercase flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  platform === tab.id 
                    ? 'bg-[#e21515] text-white shadow-md' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Android Home Screen Steps */}
          {platform === 'android' && (
            <div className="space-y-3.5">
              <div className="bg-black/30 p-3.5 rounded-xl border border-[#24262f] space-y-3">
                <span className="text-[10px] text-gray-400 uppercase font-mono block mb-1.5">How to install to Home Screen via Chrome:</span>
                
                <div className="space-y-2 text-left">
                  <div className="bg-black/10 p-2.5 rounded-lg border border-[#24262f] flex gap-2.5 items-center">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-white text-[10px] font-mono flex items-center justify-center font-bold">1</span>
                    <span className="text-[11px] text-gray-300">Tap the browser's menu button (three vertical dots <strong className="text-white">:</strong>) on top-right.</span>
                  </div>
                  <div className="bg-black/10 p-2.5 rounded-lg border border-[#24262f] flex gap-2.5 items-center">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-white text-[10px] font-mono flex items-center justify-center font-bold">2</span>
                    <span className="text-[11px] text-gray-300">Select <strong className="text-white">"Add to Home Screen"</strong> or <strong className="text-white">"Install App"</strong>.</span>
                  </div>
                  <div className="bg-black/10 p-2.5 rounded-lg border border-[#24262f] flex gap-2.5 items-center">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-white text-[10px] font-mono flex items-center justify-center font-bold">3</span>
                    <span className="text-[11px] text-gray-300">Tap Confirm. Then launch CasinoHub from your mobile screen.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* iOS Home Screen Steps */}
          {platform === 'ios' && (
            <div className="space-y-3.5">
              <div className="bg-black/30 p-3.5 rounded-xl border border-[#24262f] space-y-3">
                <span className="text-[10px] text-gray-400 uppercase font-mono block mb-1.5">How to install to Home Screen via Safari:</span>
                
                <div className="space-y-2 text-left">
                  <div className="bg-black/10 p-2.5 rounded-lg border border-[#24262f] flex gap-2.5 items-center">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-white text-[10px] font-mono flex items-center justify-center font-bold">1</span>
                    <span className="text-[11px] text-gray-300">Tap the <strong className="text-white">"Share" <Share className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" /></strong> icon at the bottom of Safari.</span>
                  </div>
                  <div className="bg-black/10 p-2.5 rounded-lg border border-[#24262f] flex gap-2.5 items-center">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-white text-[10px] font-mono flex items-center justify-center font-bold">2</span>
                    <span className="text-[11px] text-gray-300">Scroll down and select <strong className="text-white">"Add to Home Screen"</strong>.</span>
                  </div>
                  <div className="bg-black/10 p-2.5 rounded-lg border border-[#24262f] flex gap-2.5 items-center">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-white text-[10px] font-mono flex items-center justify-center font-bold">3</span>
                    <span className="text-[11px] text-gray-300">Launch CasinoHub from your desktop to instantly activate the 3% promo.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PC Desktop Shortcut Steps */}
          {platform === 'pc' && (
            <div className="space-y-3.5">
              <div className="bg-black/30 p-3.5 rounded-xl border border-[#24262f] space-y-3">
                <span className="text-[10px] text-gray-400 uppercase font-mono block mb-1.5">How to install Desktop Web App:</span>
                
                <div className="space-y-2 text-left">
                  <div className="bg-black/10 p-2.5 rounded-lg border border-[#24262f] flex gap-2.5 items-center">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-white text-[10px] font-mono flex items-center justify-center font-bold">1</span>
                    <span className="text-[11px] text-gray-300">Look at the browser address bar at the top-right of your window.</span>
                  </div>
                  <div className="bg-black/10 p-2.5 rounded-lg border border-[#24262f] flex gap-2.5 items-center">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-white text-[10px] font-mono flex items-center justify-center font-bold">2</span>
                    <span className="text-[11px] text-gray-300">Click the small Web App Install icon <HelpCircle className="w-3.5 h-3.5 inline text-amber-400 mx-0.5" /> next to the bookmark star.</span>
                  </div>
                  <div className="bg-black/10 p-2.5 rounded-lg border border-[#24262f] flex gap-2.5 items-center">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-white text-[10px] font-mono flex items-center justify-center font-bold">3</span>
                    <span className="text-[11px] text-gray-300">Confirm setup. The program opens in its own lag-free application frame.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active button panel */}
          <div className="pt-1.5">
            {!promotionActivated ? (
              <button
                id="activate-promo-button"
                onClick={handleActivatePromotion}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-[#e21515] hover:from-red-400 hover:to-[#f12121] active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(226,21,21,0.25)]"
              >
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-spin-slow" />
                <span>Activate 3% Win Commission Booster</span>
              </button>
            ) : (
              <div className="py-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 fill-emerald-950" />
                <span>3% Commission Booster Activated Successfully!</span>
              </div>
            )}
          </div>

          {/* Verification seal */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-500 bg-emerald-950/15 py-2 rounded-xl border border-emerald-950/30">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Valid for all players adding app to mobile or desktop home screen.</span>
          </div>

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 bg-[#111217] border-t border-[#24262f] flex justify-between items-center text-[10.5px] uppercase shrink-0 px-4">
          <span className="text-gray-500 font-mono">Commission: 3% EXTRA Win multiplier</span>
          <span className="text-[#00e600] font-black tracking-wide">Approved Promotion</span>
        </div>

      </div>
    </div>
  );
}
