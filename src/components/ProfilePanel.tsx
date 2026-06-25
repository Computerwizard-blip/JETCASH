/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, User, Crown, Phone, Calendar, Copy, LogOut, Award, Check, AlertTriangle, Settings, Bot, Send, ChevronLeft, Headphones, MessageSquare } from 'lucide-react';
import { UserProfile, Wallet, Transaction } from '../types';

interface ProfilePanelProps {
  userProfile: UserProfile;
  wallet: Wallet;
  authSessionMode: 'demo' | 'real' | null;
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  triggerNotification: (title: string, message: string, type: 'deposit' | 'withdrawal' | 'bonus' | 'jackpot' | 'tournament' | 'vip' | 'general') => void;
  transactions?: Transaction[];
  onOpenSettings?: () => void;
  onToggleAuthSessionMode?: () => void;
}

export const VIP_DETAILS: Record<UserProfile['vipLevel'], {
  bgGradient: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  accentColor: string;
  badgeLabel: string;
  percentRebate: number;
  pointsToUnlock: number;
  benefits: string[];
}> = {
  Bronze: {
    bgGradient: "from-[#8a5737] via-[#a3704c] to-[#8a5737]",
    textColor: "text-[#fce4d6]",
    borderColor: "border-[#a3704c]/60",
    glowColor: "rgba(138,87,55,0.4)",
    accentColor: "text-[#b07d62]",
    badgeLabel: "Bronze Veteran",
    percentRebate: 2,
    pointsToUnlock: 0,
    benefits: ["2% Coffer Commissions Cashback", "Standard multiplier wagering", "Daily free play faucet refill", "Standard chat assistance"]
  },
  Silver: {
    bgGradient: "from-[#4a4e69] via-[#9a8c98] to-[#4a4e69]",
    textColor: "text-slate-100",
    borderColor: "border-slate-400/50",
    glowColor: "rgba(154,140,152,0.4)",
    accentColor: "text-slate-300",
    badgeLabel: "Silver Vanguard",
    percentRebate: 5,
    pointsToUnlock: 500,
    benefits: ["5% Coffer Commissions Cashback", "1.2x tournament score multiplier", "Access to Aviator AI Support Chat", "Custom profile picture uploads"]
  },
  Gold: {
    bgGradient: "from-[#b8860b] via-[#ffd700] to-[#b8860b]",
    textColor: "text-yellow-100",
    borderColor: "border-yellow-400/60",
    glowColor: "rgba(253,224,71,0.5)",
    accentColor: "text-yellow-400",
    badgeLabel: "Gold Centurion",
    percentRebate: 8,
    pointsToUnlock: 1500,
    benefits: ["8% Coffer Commissions Cashback", "KSh 200 Practice Coffer refills", "1.5x VIP Points velocity boost", "Exclusive gold interface glow options"]
  },
  Platinum: {
    bgGradient: "from-[#3a506b] via-[#00b4d8] to-[#3a506b]",
    textColor: "text-cyan-100",
    borderColor: "border-cyan-400/60",
    glowColor: "rgba(0,180,216,0.5)",
    accentColor: "text-cyan-400",
    badgeLabel: "Platinum Champion",
    percentRebate: 12,
    pointsToUnlock: 3000,
    benefits: ["12% Coffer Commissions Cashback", "Auto cashout speed optimization", "Dedicated private VIP tournaments", "Fast-track deposit priority routing"]
  },
  Diamond: {
    bgGradient: "from-[#4a00e0] via-[#8e2de2] to-[#f000ff]",
    textColor: "text-fuchsia-100",
    borderColor: "border-[#e200f7]/60",
    glowColor: "rgba(240,0,255,0.6)",
    accentColor: "text-fuchsia-400 animate-pulse",
    badgeLabel: "Diamond Sovereign",
    percentRebate: 15,
    pointsToUnlock: 5000,
    benefits: ["15% Coffer Commissions Cashback", "Customizable pilot avatar badges", "24/7 personal customer VIP manager", "Weekly absolute wager rebates"]
  },
  Elite: {
    bgGradient: "from-[#1f1a3a] via-[#e21515] to-[#f59e0b]",
    textColor: "text-[#fffcf2]",
    borderColor: "border-red-500/80",
    glowColor: "rgba(226,21,21,0.7)",
    accentColor: "text-rose-400 animate-pulse",
    badgeLabel: "Elite Overlord",
    percentRebate: 20,
    pointsToUnlock: 10000,
    benefits: ["20% Coffer Commissions Cashback", "100% loss-recovery coffer insurance", "Private beta access to custom Aviator algorithms", "Direct priority channel support override"]
  }
};

export const getNextVipTier = (currentPoints: number): { tier: string; pointsNeeded: number; progress: number } => {
  if (currentPoints < 500) {
    return { tier: 'Silver', pointsNeeded: 500 - currentPoints, progress: (currentPoints / 500) * 100 };
  } else if (currentPoints < 1500) {
    return { tier: 'Gold', pointsNeeded: 1500 - currentPoints, progress: ((currentPoints - 500) / 1000) * 100 };
  } else if (currentPoints < 3000) {
    return { tier: 'Platinum', pointsNeeded: 3000 - currentPoints, progress: ((currentPoints - 1500) / 1500) * 100 };
  } else if (currentPoints < 5000) {
    return { tier: 'Diamond', pointsNeeded: 5000 - currentPoints, progress: ((currentPoints - 3000) / 2000) * 100 };
  } else if (currentPoints < 10000) {
    return { tier: 'Elite', pointsNeeded: 10000 - currentPoints, progress: ((currentPoints - 5000) / 5000) * 100 };
  } else {
    return { tier: 'Max Level', pointsNeeded: 0, progress: 100 };
  }
};

export default function ProfilePanel({
  userProfile,
  wallet,
  authSessionMode,
  isOpen,
  onClose,
  onSignOut,
  triggerNotification,
  transactions,
  onOpenSettings,
  onToggleAuthSessionMode
}: ProfilePanelProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'deposits' | 'withdrawals' | 'bonuses' | 'gameplay'>('all');
  const confirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AI Support chatbot state hooks
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; timestamp: string }>>([
    {
      sender: 'ai',
      text: 'Jambo! ✈️ I am your Aviator AI Co-Pilot & Security Support Agent. You can report any issues/bugs, or ask me how play strategies like Auto Cash Out or Auto Bet work! How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat when messages update or open status changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  const simulateAIResponse = (userText: string) => {
    setIsTyping(true);
    setTimeout(() => {
      let aiText = '';
      const norm = userText.toLowerCase();

      if (norm.includes('how') && (norm.includes('play') || norm.includes('work') || norm.includes('aviator'))) {
        aiText = "✈️ **Aviator Mechanics Guide**\n\nThe game is fully random & provably fair:\n1. **Enter Stake**: Choose a bet amount (e.g. KSh 10 - KSh 1,000) and click 'BET' before takeoff.\n2. **Look closely**: As the jet climbs, the multiplier increases starting from 1.00x upwards.\n3. **Cash out**: Click the large green button to cash out before the plane flies away!\n4. **Failure**: If the plane vanishes ('Flew Away') before you tap cash out, the bet is lost.";
      } else if (norm.includes('auto') || norm.includes('cashout') || norm.includes('setting')) {
        aiText = "⚙️ **Auto Pilot Automation Explained**\n\n- **Auto Bet**: Places your desired wager automatically as soon as any new round departs.\n- **Auto Cash Out**: Cashes out automatically at any specific multiplier target (e.g. 1.20x or 2.00x) that you input. Highly recommended to eliminate browser latency!";
      } else if (norm.includes('bug') || norm.includes('report') || norm.includes('issue') || norm.includes('failed') || norm.includes('error')) {
        aiText = "🐛 **Bug & Diagnostics Safe Report**\n\nWe appreciate the submission! We have automatically extracted this diagnostic report from your safe session:\n- Account: " + userProfile.username + " (" + (userProfile.fullName || 'Frank Janal') + ")\n- Status: Safe Sandbox Verified\n- Log Type: Client UI Event\n\nOur specialized developer squad is reviewing transaction states & canvas rendering frames. We will notify you in your notifications center if you need to refresh your environment!";
      } else if (norm.includes('deposit') || norm.includes('money') || norm.includes('topup') || norm.includes('refill') || norm.includes('real')) {
        aiText = "💰 **Balance Coffer refills:**\n\nIn **Demo Practice Play**, you have mock coffer credits for training. In **Real Cash Mode**, top-ups are safely triggered instantly via customized M-Pesa till credentials! Check your billing coffer to track recent successful deposits.";
      } else {
        aiText = "👋 **Jambo Player!** I am your secure Aviator Co-Pilot AI.\n\nI am configured to resolve any doubts about the mechanics or investigate bugs. Feel free to use the quick suggestion chips below to learn how play multipliers are calculated!";
      }

      setChatMessages(prev => [...prev, {
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, {
      sender: 'user',
      text: userMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setChatInput('');
    simulateAIResponse(userMsg);
  };

  const handleSendSuggestion = (text: string) => {
    if (isTyping) return;
    setChatMessages(prev => [...prev, {
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    simulateAIResponse(text);
  };

  // Reset confirmation state when drawer opens or closes
  useEffect(() => {
    setConfirmSignOut(false);
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (chatOpen) {
    return (
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex justify-end z-[60] select-none font-sans animate-fadeIn">
        {/* Click outside to close */}
        <div className="absolute inset-0 cursor-pointer" onClick={() => setChatOpen(false)}></div>

        {/* Support Chat Panel Container */}
        <div className="relative w-full max-w-sm bg-[#141518] border-l border-[#24262d] h-full shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col text-slate-200 overflow-hidden animate-slideLeft">
          
          {/* Custom Chat Header */}
          <div className="p-4 bg-gradient-to-r from-[#1c1d22] via-[#141518] to-red-950/20 border-b border-[#212327] flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setChatOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all active:scale-90 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00e600] animate-pulse"></span>
                <h3 className="text-sm font-black text-rose-100 uppercase tracking-wider">Aviator AI Support</h3>
              </div>
              <p className="text-[9.5px] text-gray-400 uppercase font-mono">Instant Co-Pilot Helpline</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Guidance Banner */}
          <div className="bg-red-950/25 border-b border-red-500/10 px-4 py-2 flex items-center gap-2 text-left shrink-0">
            <Bot className="w-4 h-4 text-red-550 shrink-0" />
            <span className="text-[10px] text-gray-300 font-medium">
              Verify gaming tips, auto features, or report client bugs 24/7.
            </span>
          </div>

          {/* Chat Messages Log Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800 bg-black/10">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className={`p-3 rounded-2xl text-xs leading-relaxed text-left text-white shadow-md ${
                  msg.sender === 'user' 
                    ? 'bg-red-650 rounded-tr-none text-white font-medium' 
                    : 'bg-[#1e2025] rounded-tl-none border border-zinc-850/60 text-gray-200'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[7.5px] font-bold text-gray-500 mt-1 font-mono">{msg.timestamp}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex flex-col items-start mr-auto max-w-[80%]">
                <div className="p-3 bg-[#1e2025] border border-zinc-850/60 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Suggestion Chips */}
          <div className="p-2 border-t border-zinc-800/60 bg-zinc-950/25 space-y-1 text-left shrink-0">
            <span className="text-[8.5px] text-gray-500 font-black uppercase tracking-wider block px-2">Quick support queries:</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800 px-2">
              <button 
                type="button"
                onClick={() => handleSendSuggestion("How does the Aviator crash game work?")}
                className="shrink-0 px-2.5 py-1.5 bg-zinc-90 w-auto hover:bg-zinc-850 border border-zinc-800 text-gray-300 rounded-full text-[10px] font-bold transition-all cursor-pointer"
              >
                ✈️ How to Play
              </button>
              <button 
                type="button"
                onClick={() => handleSendSuggestion("How do I use Auto Betting & Auto Cashout?")}
                className="shrink-0 px-2.5 py-1.5 bg-zinc-90 w-auto hover:bg-zinc-850 border border-zinc-800 text-gray-300 rounded-full text-[10px] font-bold transition-all cursor-pointer"
              >
                ⚙️ Auto Cash Out
              </button>
              <button 
                type="button"
                onClick={() => handleSendSuggestion("I found a bug. I want to report a system issue.")}
                className="shrink-0 px-2.5 py-1.5 bg-zinc-90 w-auto hover:bg-red-950/10 border border-zinc-800/80 hover:border-red-500/20 text-[#ff4747] rounded-full text-[10px] font-bold transition-all cursor-pointer"
              >
                🐛 Report Bug
              </button>
            </div>
          </div>

          {/* Custom Message Input Footer */}
          <form 
            onSubmit={handleChatSubmit}
            className="p-3 bg-[#1c1d22] border-t border-[#212327] flex items-center gap-2 shrink-0 px-4"
          >
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI or type an issue..."
              disabled={isTyping}
              className="flex-1 bg-black/45 border border-zinc-850 focus:border-red-500 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition-all disabled:opacity-50 font-medium"
            />
            <button 
              type="submit"
              disabled={isTyping || !chatInput.trim()}
              className="w-8 h-8 rounded-xl bg-red-650 hover:bg-red-500 text-white flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      </div>
    );
  }

  const currentBalance = authSessionMode === 'real' ? wallet.realBalance : wallet.demoBalance;
  const referralCode = userProfile.referralCode || `REF-${(userProfile.fullName || userProfile.username).trim().toUpperCase().replace(/[^A-Z0-9]/g, '')}-${userProfile.phone ? userProfile.phone.replace(/[^0-9]/g, '').slice(-4) : '7777'}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    triggerNotification(
      '📋 Referral Promo Code Copied!',
      `Copied code "${referralCode}" to clipboard! Refer players to earn a 10% instant deposit commission!`,
      'general'
    );
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const hasActiveRealSession = authSessionMode === 'demo' && 
    sessionStorage.getItem('casinohub_session_authenticated') === 'true' && 
    !!localStorage.getItem('casinohub_registered_account');

  const handleSignOutClick = () => {
    if (!confirmSignOut) {
      setConfirmSignOut(true);
      if (hasActiveRealSession) {
        triggerNotification(
          '🟢 RETURN TO REAL PLAY',
          'Please tap "CLICK AGAIN TO RETURN" within 4 seconds to switch back to your active Real Play coins coffer instantly!',
          'vip'
        );
      } else {
        triggerNotification(
          authSessionMode === 'demo' ? '📶 SIGN IN REQUESTED' : '⚠️ Sign Out Pending',
          authSessionMode === 'demo'
            ? 'Please tap "CLICK AGAIN TO SIGN IN" to navigate back to the real play login screen.'
            : 'Please tap "CLICK AGAIN TO SIGN OUT" within 4 seconds to secure log out.',
          'general'
        );
      }
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => {
        setConfirmSignOut(false);
      }, 4000);
    } else {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      setConfirmSignOut(false);
      if (hasActiveRealSession && onToggleAuthSessionMode) {
        onClose();
        onToggleAuthSessionMode();
      } else {
        onSignOut();
      }
    }
  };

  const filteredTransactions = transactions?.filter((tx) => {
    if (txFilter === 'all') return true;
    if (txFilter === 'deposits') return tx.type === 'deposit';
    if (txFilter === 'withdrawals') return tx.type === 'withdrawal';
    if (txFilter === 'bonuses') return tx.type === 'bonus_credit';
    if (txFilter === 'gameplay') return tx.type === 'win' || tx.type === 'bet';
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex justify-end z-[60] select-none font-sans animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      {/* Aviator-styled Slate Profile Drawer Panel */}
      <div className="relative w-full max-w-sm bg-[#141518] border-l border-[#24262d] h-full shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col text-slate-200 overflow-hidden animate-slideLeft">
        
        {/* Header background with red Aviator angle gradient */}
        <div className="relative p-6 bg-gradient-to-br from-[#1c1d22] via-[#141518] to-red-950/20 border-b border-[#212327]">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Settings button on the right, right below the "X" button */}
          {onOpenSettings && (
            <button 
              type="button"
              onClick={onOpenSettings}
              className="absolute top-13 right-4 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
              title="Player Settings: Change Photo, Initials, Username & Sounds"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}

          <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[8px] font-black tracking-widest uppercase animate-pulse">
            Aviator Safe Profile
          </span>

          {/* Header User Profile Information with Luxury VIP gradients */}
          {(() => {
            const vipData = VIP_DETAILS[userProfile.vipLevel] || VIP_DETAILS.Silver;
            return (
              <div className="flex items-center gap-4 mt-3">
                <div className="relative">
                  <div 
                    className={`w-16 h-16 rounded-full bg-gradient-to-r ${vipData.bgGradient} p-0.5 flex items-center justify-center overflow-hidden transition-all duration-300`}
                    style={{ 
                      boxShadow: `0 0 16px ${vipData.glowColor}`
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-[#141518] flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center font-black text-2xl text-white">
                        {userProfile.avatar && (userProfile.avatar.startsWith('data:image/') || userProfile.avatar.startsWith('http://') || userProfile.avatar.startsWith('https://')) ? (
                          <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                        ) : (
                          userProfile.avatar || userProfile.username.substring(0, 2).toUpperCase()
                        )}
                      </div>
                    </div>
                  </div>
                  <div 
                    className={`absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r ${vipData.bgGradient} rounded-full border border-[#141518] flex items-center justify-center shadow-lg transition-all duration-300`}
                    style={{ 
                      boxShadow: `0 0 8px ${vipData.glowColor}`
                    }}
                  >
                    <Crown className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                <div className="space-y-1.5 text-left flex-1">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-base font-black text-white uppercase tracking-tight leading-snug">
                      {userProfile.fullName || 'Frank Janal'}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-red-500 font-mono font-bold">
                        @{userProfile.username}
                      </span>
                      
                      {/* Premium Aesthetic Mini Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest bg-gradient-to-r ${vipData.bgGradient} ${vipData.textColor} border ${vipData.borderColor} shadow-[0_0_8px_${vipData.glowColor}] transition-all duration-300`}>
                        <Crown className="w-2.5 h-2.5 text-white shrink-0" />
                        <span>{vipData.badgeLabel}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
          
          {/* Main live account balance */}
          <div className="bg-black/40 border border-[#23252d] p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${authSessionMode === 'real' ? 'bg-[#00e600] animate-pulse' : 'bg-purple-400'}`}></span>
                <span>{authSessionMode === 'real' ? 'Real Balance Coffer' : 'Demo Practice Coffer'}</span>
              </span>
            </div>
            
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-mono font-black text-[#00e600] tracking-tight">
                KSh {currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-gray-400 font-bold font-mono">KES</span>
            </div>
          </div>

          {/* Account Details Specs */}
          <div className="space-y-3">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-black text-left">
              ID Registry Records
            </h4>

            <div className="space-y-2 font-mono text-xs">
              <div className="bg-black/25 px-4 py-3 rounded-lg flex items-center justify-between border border-[#1d1f24]">
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="w-3.5 h-3.5" />
                  <span>Full Name</span>
                </div>
                <span className="text-white font-bold">{userProfile.fullName || 'Frank Janal'}</span>
              </div>

              <div className="bg-black/25 px-4 py-3 rounded-lg flex items-center justify-between border border-[#1d1f24]">
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone Line</span>
                </div>
                <span className="text-white">{userProfile.phone || '0712345678'}</span>
              </div>

              <div className="bg-black/25 px-4 py-3 rounded-lg flex items-center justify-between border border-[#1d1f24]">
                <div className="flex items-center gap-2 text-gray-400">
                  <Award className="w-3.5 h-3.5" />
                  <span>VIP Rank Tier</span>
                </div>
                {(() => {
                  const vipData = VIP_DETAILS[userProfile.vipLevel] || VIP_DETAILS.Silver;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[9.5px] uppercase tracking-wider bg-gradient-to-r ${vipData.bgGradient} ${vipData.textColor} border ${vipData.borderColor} shadow-[0_0_8px_${vipData.glowColor}]`}>
                      <Crown className="w-3 h-3 text-white" />
                      <span>{userProfile.vipLevel}</span>
                    </span>
                  );
                })()}
              </div>

              <div className="bg-black/25 px-4 py-3 rounded-lg flex items-center justify-between border border-[#1d1f24]">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined Date</span>
                </div>
                <span className="text-white">{userProfile.joinedDate || '2026-06-03'}</span>
              </div>
            </div>
          </div>

          {/* VIP Benefits & Tier Progress Segment */}
          {(() => {
            const vipData = VIP_DETAILS[userProfile.vipLevel] || VIP_DETAILS.Silver;
            const nextVip = getNextVipTier(userProfile.vipPoints || 0);
            return (
              <div className="bg-gradient-to-b from-[#191921] to-[#121216] border border-zinc-800 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Crown className={`w-4 h-4 ${vipData.accentColor}`} />
                    <h5 className="text-xs font-black text-rose-100 uppercase tracking-tight">VIP Benefits & Levels</h5>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono font-bold uppercase">
                    {(userProfile.vipPoints || 0).toLocaleString()} pts
                  </span>
                </div>

                {/* Progress to Next Tier */}
                {nextVip.tier !== 'Max Level' ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Progress to <strong className="text-white">{nextVip.tier}</strong></span>
                      <span className="font-mono font-bold">{(userProfile.vipPoints || 0)} / {VIP_DETAILS[nextVip.tier as UserProfile['vipLevel']]?.pointsToUnlock || 0} pts</span>
                    </div>
                    <div className="relative w-full h-2 bg-black/40 rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${vipData.bgGradient} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(5, nextVip.progress))}%`, boxShadow: `0 0 10px ${vipData.glowColor}` }}
                      ></div>
                    </div>
                    <p className="text-[9px] text-[#8e9099] leading-tight text-left">
                      Accumulate <strong className="text-amber-400 font-mono">{nextVip.pointsNeeded} more points</strong> by placing flying stakes in game to unlock the next prestige rank!
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#0e160e] border border-emerald-500/25 p-2.5 rounded-lg text-center shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">
                      🏆 Max level elite OVERLORD achieved
                    </p>
                  </div>
                )}

                {/* VIP Tiers Interactive Breakdown */}
                <div className="space-y-2.5 text-left pt-2.5 border-t border-zinc-800/60">
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block">VIP Tier Benefits Breakdown:</span>
                  
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800/40">
                    {(Object.keys(VIP_DETAILS) as Array<UserProfile['vipLevel']>).map((lvl) => {
                      const details = VIP_DETAILS[lvl];
                      const isActive = userProfile.vipLevel === lvl;
                      const pointsNeededForThis = details.pointsToUnlock;
                      const isUnlocked = (userProfile.vipPoints || 0) >= pointsNeededForThis || isActive;
                      
                      return (
                        <div 
                          key={lvl}
                          className={`relative border rounded-lg p-3 transition-all duration-300 ${
                            isActive 
                              ? `bg-gradient-to-br from-[#1c1d22] to-black ${details.borderColor} shadow-[0_0_12px_${details.glowColor}]` 
                              : isUnlocked 
                                ? 'bg-black/15 border-zinc-900 opacity-80 hover:opacity-100'
                                : 'bg-black/40 border-[#1f2025] opacity-40 hover:opacity-75'
                          }`}
                        >
                          {/* Active tag banner */}
                          {isActive && (
                            <div className={`absolute top-2.5 right-2 text-white inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-widest bg-gradient-to-r ${details.bgGradient} ${details.textColor} border ${details.borderColor} animate-pulse`}>
                              Active
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-1.5 font-sans">
                            <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${details.bgGradient}`} />
                            <span className={`text-[11px] font-black uppercase tracking-wider ${isActive ? details.textColor : 'text-gray-350'}`}>
                              {lvl} Status
                            </span>
                            {!isUnlocked && (
                              <span className="text-[8px] text-gray-500 font-bold font-mono">
                                (Locked: {pointsNeededForThis} pts)
                              </span>
                            )}
                          </div>

                          {/* Benefits list */}
                          <ul className="space-y-1 pl-1 font-sans">
                            {details.benefits.map((benefit, bidx) => (
                              <li key={bidx} className="flex items-start gap-1.5 text-[9.5px] text-gray-400">
                                <span className={`text-[10px] flex-shrink-0 mt-0.5 ${isActive ? details.textColor : 'text-gray-500'}`}>
                                  ✓
                                </span>
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Deposits, Withdrawals & Transaction History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-black text-left shrink-0">
                Transaction Ledger
              </h4>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {(['all', 'deposits', 'withdrawals', 'bonuses', 'gameplay'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setTxFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                      txFilter === cat
                        ? 'bg-[#00e600] text-black shadow-sm shadow-[#00e600]/20'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-black/30 border border-[#1d1f24] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between border-b border-[#212327] pb-1.5 mb-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase">
                  {txFilter === 'all' ? 'Recent Activities' : `${txFilter} History`}
                </span>
                <span className="text-[9px] text-[#00e600] font-mono font-bold">
                  {filteredTransactions && filteredTransactions.length > 0 ? `${filteredTransactions.length} recorded` : 'No logs'}
                </span>
              </div>
              
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-850">
                {!filteredTransactions || filteredTransactions.length === 0 ? (
                  <div className="py-6 text-center text-[10px] text-gray-500 uppercase tracking-wide font-mono">
                    No {txFilter === 'all' ? '' : txFilter} transactions found.
                  </div>
                ) : (
                  filteredTransactions.slice(0, 15).map((tx) => {
                    const isDeposit = tx.type === 'deposit';
                    const isWithdrawal = tx.type === 'withdrawal';
                    const isBonus = tx.type === 'bonus_credit';
                    const isWin = tx.type === 'win';
                    const isBet = tx.type === 'bet';
                    
                    let typeLabel = tx.type.replace('_', ' ');
                    let amtSign = '';
                    let colorClass = 'text-gray-400';
                    
                    if (isDeposit) {
                      typeLabel = 'Deposit';
                      amtSign = '+';
                      colorClass = 'text-[#00e600]';
                    } else if (isWithdrawal) {
                      typeLabel = 'Withdraw';
                      amtSign = '-';
                      colorClass = 'text-red-400';
                    } else if (isBonus) {
                      typeLabel = 'Bonus';
                      amtSign = '+';
                      colorClass = 'text-amber-400';
                    } else if (isWin) {
                      typeLabel = 'Win';
                      amtSign = '+';
                      colorClass = 'text-[#00e600]';
                    } else if (isBet) {
                      typeLabel = 'Bet';
                      amtSign = '-';
                      colorClass = 'text-gray-550';
                    }
                    
                    return (
                      <div key={tx.id} className="flex items-center justify-between text-[11px] py-1 border-b border-[#212327]/40 last:border-0">
                        <div className="flex flex-col text-left">
                          <span className="text-white font-bold capitalize">{typeLabel}</span>
                          <span className="text-[9px] text-gray-500">{tx.timestamp} • {tx.method || 'Platform'}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`font-mono font-black ${colorClass}`}>
                            {amtSign}{tx.currency || 'KSh'} {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          </span>
                          <span className={`text-[8.5px] font-bold px-1 rounded scale-90 ${tx.status === 'SUCCESS' ? 'bg-[#00e600]/10 text-[#00e600]' : tx.status === 'FAILED' ? 'bg-red-500/10 text-red-100' : 'bg-amber-500/10 text-amber-500'}`}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Promotional referral coffer */}
          <div className="bg-gradient-to-b from-[#18110b] to-[#120b06] border border-amber-600/20 p-4 rounded-xl space-y-3">
            <div className="space-y-1">
              <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[7.5px] font-black tracking-wider uppercase">
                🏷️ Bottom Referral Promotion
              </span>
              <h5 className="text-xs font-black text-rose-100 uppercase tracking-tight">Your Promo Code</h5>
              {authSessionMode === 'demo' ? (
                <p className="text-[10px] text-[#ffbf43] leading-normal text-left font-medium">
                  🔒 Affiliate campaigns are only active on real accounts. In Demo practice, codes are simulation assets.
                </p>
              ) : (
                <p className="text-[10px] text-gray-400 leading-normal text-left">
                  Keep track of this unique bottom referral token. Copy and share it to instantly claim a <strong className="text-amber-400">10% deposit commission</strong> cash back on all player reloads!
                </p>
              )}
            </div>

            {authSessionMode === 'demo' ? (
              <div className="space-y-3">
                <div className="text-center bg-black/40 border border-zinc-800 rounded-lg p-2 font-mono font-bold text-xs text-zinc-500 select-none pointer-events-none tracking-wide">
                  Ref-demo account 5682
                </div>
                <div className="bg-black/50 p-2.5 rounded-lg border border-amber-500/10 text-[9.5px] leading-relaxed text-gray-300">
                  <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1">💡 How Referrals Work:</span>
                  When new players register their accounts using your promo code, they become permanently linked to your profile to track commissions. Every time they make an M-Pesa deposit to reload their coins, you instantly earn a <strong className="text-white font-extrabold">10% cash commission</strong> cash back credited directly to your balance coffer!
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  readOnly
                  value={referralCode}
                  className="flex-1 text-center bg-black/55 border border-amber-500/20 rounded-lg p-2 font-mono font-black text-xs text-amber-400 outline-none uppercase"
                />
                <button 
                  onClick={handleCopyCode}
                  className="p-2 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg select-none transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                  title="Copy referral promo code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                </button>
              </div>
            )}
          </div>

          {/* Live AI Support Co-Pilot & Helpdesk Block */}
          <div id="live-helpdesk-panel-card" className="bg-gradient-to-r from-red-950/20 via-black/45 to-zinc-900/40 border border-red-500/10 p-4 rounded-xl space-y-3">
            <div className="space-y-1">
              <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[7.5px] font-black tracking-wider uppercase">
                🎧 Helpdesk Support
              </span>
              <h5 className="text-xs font-black text-rose-100 uppercase tracking-tight">Need assistance or have issue?</h5>
              <p className="text-[10px] text-gray-400 leading-normal text-left">
                Instantly connect with our smart <strong className="text-red-400">Aviator AI Support Co-Pilot</strong> to ask how gameplay works, debug automatic wagers, or file error logs & report client issues directly!
              </p>
            </div>

            <button 
              type="button"
              onClick={() => setChatOpen(true)}
              className="w-full py-2.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/25 rounded-lg font-black text-xs uppercase tracking-wider text-red-400 select-none transition-all duration-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-red-550 animate-bounce" />
              <span>Launch Support AI Agent</span>
            </button>
          </div>

        </div>

        {/* Footer Area with standard signout */}
        <div className="p-6 bg-black/40 border-t border-[#212327]">
          <button
            onClick={handleSignOutClick}
            className={`w-full py-3.5 active:scale-95 font-black uppercase text-xs tracking-widest rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
              confirmSignOut
                ? 'bg-amber-500 hover:bg-amber-450 text-black shadow-amber-500/20 shadow-xl border-2 border-amber-600/50 animate-pulse'
                : hasActiveRealSession
                  ? 'bg-[#00e600] text-black hover:bg-emerald-400 shadow-emerald-500/25'
                  : authSessionMode === 'demo'
                    ? 'bg-[#00e600] text-black hover:bg-emerald-400 shadow-emerald-500/25'
                    : 'bg-[#e21515] text-white hover:bg-[#ff2020] shadow-red-500/10'
            }`}
          >
            {confirmSignOut ? (
              <>
                <AlertTriangle className="w-4 h-4 text-black" />
                <span>
                  {hasActiveRealSession
                    ? 'Click Again to Return'
                    : authSessionMode === 'demo'
                      ? 'Click Again to Sign In'
                      : 'Click Again to Sign Out'}
                </span>
              </>
            ) : (
              <>
                {hasActiveRealSession ? (
                  <Crown className="w-4 h-4 text-black" />
                ) : authSessionMode === 'demo' ? (
                  <Crown className="w-4 h-4 text-black" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>
                  {hasActiveRealSession
                    ? 'Return to Real Play'
                    : authSessionMode === 'demo'
                      ? 'Sign In for Real Account'
                      : 'Sign Out Profile'}
                </span>
              </>
            )}
          </button>
          <div className="text-[9px] text-gray-600 text-center mt-3 font-mono">
            Secure Session Authentication verified through CasinoHub Link
          </div>
        </div>

      </div>
    </div>
  );
}
