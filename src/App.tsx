/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import AviatorHeader from './components/AviatorHeader';
import HistoryRibbon from './components/HistoryRibbon';
import AviatorGameViewport from './components/AviatorGameViewport';
import AviatorBetPanel from './components/AviatorBetPanel';
import BetsLedger from './components/BetsLedger';
import MpesaModal from './components/MpesaModal';
import DownloadAppModal from './components/DownloadAppModal';
import { audioEngine } from './utils/audio';
import ResponsibleGamingModal from './components/ResponsibleGamingModal';
import { AnimatePresence, motion } from 'motion/react';
import CasinoGames from './components/CasinoGames';
import AdminPanel from './components/AdminPanel';
import NotificationsCenter from './components/NotificationsCenter';
import WelcomingIntro from './components/WelcomingIntro';
import ProfilePanel from './components/ProfilePanel';
import SettingsModal from './components/SettingsModal';
import GlobalChatDrawer, { ChatMessage } from './components/GlobalChatDrawer';
import { Lock, PhoneCall, ShieldAlert, HeartHandshake, AlertOctagon, Gamepad2, Settings, ListFilter, Bell, WifiOff } from 'lucide-react';
import { Wallet, UserProfile, JackpotPool, Transaction, NotificationItem } from './types';

// Mock avatar names list for simulated online players
const COMPANION_AVATARS = ['KM', 'AM', 'NJ', 'OT', 'SS', 'MW', 'KB', 'JM', 'ZR', 'KC', 'MM', 'GG', 'KR', 'WJ'];

const COMPANION_USERS = [
  'Kamau_KE', 'Amani_254', 'Mpesa_King', 'Njoroge_Bettor', 'Otieno_Hustler', 
  'ShillingSlinger', 'Wanjiku_Win', 'Mwangi_001', 'Kibet_Racer', 'Juma_Bets', 
  'SafariSafar', 'Zuri_Zuri', 'Kipchoge_Fast', 'Mama_Mboga_VIP', 'Gikomba_Guru', 'Kiambu_Rider'
];

interface BetLogItem {
  id: string;
  username: string;
  betAmount: number;
  multiplier?: number;
  payoutAmount?: number;
  cashedOut: boolean;
  timestamp: string;
}

/// Deterministic Random Generator for synchronizing lobby players and values
function seededRandom(seedValue: number) {
  let value = seedValue;
  return function() {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

// Compute deterministic round limit based on time-synchronized checks & login elapsed state
function getRoundLimit(roundIndex: number) {
  let h = Math.abs(Math.sin(roundIndex) * 10000);
  h = h - Math.floor(h);

  // Retrieve stored first open time from sessionStorage or localStorage safely
  let loginTime = Date.now();
  try {
    const stored = localStorage.getItem('casinohub_first_open_time') || sessionStorage.getItem('casinohub_login_time');
    if (stored) {
      loginTime = parseInt(stored, 10);
    } else {
      localStorage.setItem('casinohub_first_open_time', loginTime.toString());
      sessionStorage.setItem('casinohub_login_time', loginTime.toString());
    }
  } catch (e) {}

  // Check sessionStorage or localStorage for high gold round indices
  let highRoundIndices: number[] = [];
  try {
    const stored = localStorage.getItem('casinohub_high_round_indices');
    if (stored) {
      highRoundIndices = JSON.parse(stored);
    }
  } catch (e) {}

  // Decide if this roundIndex qualifies as a gold win round after 2 minutes
  const elapsedMs = Date.now() - loginTime;
  const isPast2Minutes = elapsedMs >= 120000; // 2 minutes = 120000ms

  if (isPast2Minutes && highRoundIndices.length < 2) {
    if (!highRoundIndices.includes(roundIndex)) {
      highRoundIndices.push(roundIndex);
      localStorage.setItem('casinohub_high_round_indices', JSON.stringify(highRoundIndices));
    }
  }

  const isHigh = highRoundIndices.includes(roundIndex);
  if (isHigh) {
    // Gold win: 200 minimum to 1000 maximum randomly selected
    return parseFloat((200.00 + h * 800.00).toFixed(2));
  } else {
    // Highly authentic Aviator model: over 55% of rounds crash under 2.00x (1.00 - 1.99)
    if (h < 0.11) {
      // 11% of rounds crash immediately at 1.00x
      return 1.00;
    } else if (h < 0.55) {
      // 44% of rounds crash between 1.01x and 1.99x
      const p = (h - 0.11) / 0.44;
      return parseFloat((1.01 + p * 0.98).toFixed(2));
    } else if (h < 0.80) {
      // 25% of rounds crash between 2.00x and 10.00x
      const p = (h - 0.55) / 0.25;
      return parseFloat((2.00 + p * 8.00).toFixed(2));
    } else if (h < 0.95) {
      // 15% of rounds between 10.01x and 30.00x
      const p = (h - 0.80) / 0.15;
      return parseFloat((10.01 + p * 19.99).toFixed(2));
    } else {
      // 5% of rounds rare hits between 30.01x and 107.00x
      const p = (h - 0.95) / 0.05;
      return parseFloat((30.01 + p * 76.99).toFixed(2));
    }
  }
}

export default function App() {
  // Web online stability check state
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      return window.navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Lock the desktop & mobile viewports to prevent user from magnifying or scaling (enlarging or minimizing) the static layout
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent standard browser zoom hotkeys: Ctrl/Cmd and +, -, 0
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '-' || e.key === '0' || e.key === '+' || e.key === '_')) {
        e.preventDefault();
      }
    };

    const handleGestureStart = (e: any) => {
      e.preventDefault();
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown, { passive: false });
    document.addEventListener('gesturestart', handleGestureStart, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('gesturestart', handleGestureStart);
    };
  }, []);

  // Navigation & Workspace views state
  const [currentView, setView] = useState<'aviator' | 'lobby' | 'admin'>('lobby');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Custom Welcoming entrance blocker state
  const [authSessionMode, setAuthSessionMode] = useState<'demo' | 'real' | null>(() => {
    const isAuthed = sessionStorage.getItem('casinohub_session_authenticated') === 'true';
    if (isAuthed) {
      return 'real';
    }
    return null;
  });

  // Integrations states
  const [wallet, setWalletState] = useState<Wallet>(() => {
    const saved = localStorage.getItem('casinohub_wallet_balances');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          realBalance: parsed.realBalance !== undefined ? parsed.realBalance : 0.00,
          demoBalance: parsed.demoBalance !== undefined ? parsed.demoBalance : 50000.00,
          mainBalance: parsed.mainBalance !== undefined ? parsed.mainBalance : 50000.00,
          bonusBalance: parsed.bonusBalance !== undefined ? parsed.bonusBalance : 1250.00,
          cashbackBalance: parsed.cashbackBalance !== undefined ? parsed.cashbackBalance : 250.00
        };
      } catch (e) {}
    }
    return {
      realBalance: 0.00,
      demoBalance: 50000.00,
      mainBalance: 50000.00,
      bonusBalance: 1250.00,
      cashbackBalance: 250.00
    };
  });

  const setWallet = (val: React.SetStateAction<Wallet>) => {
    setWalletState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      localStorage.setItem('casinohub_wallet_balances', JSON.stringify(next));
      return next;
    });
  };

  const balance = authSessionMode === 'real' ? wallet.realBalance : wallet.demoBalance;
  const balanceRef = useRef<number>(balance);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  const setBalance = (val: number | ((prev: number) => number)) => {
    setWallet(prev => {
      const isReal = authSessionMode === 'real';
      const currentVal = isReal ? prev.realBalance : prev.demoBalance;
      const nextVal = typeof val === 'function' ? val((balanceRef.current !== undefined && Math.abs(balanceRef.current - currentVal) < 1) ? balanceRef.current : currentVal) : val;
      const roundedVal = parseFloat(nextVal.toFixed(2));
      balanceRef.current = roundedVal;
      if (isReal) {
        return {
          ...prev,
          realBalance: roundedVal,
          mainBalance: roundedVal
        };
      } else {
        return {
          ...prev,
          demoBalance: roundedVal,
          mainBalance: roundedVal
        };
      }
    });
  };

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    let loginDate = localStorage.getItem('casinohub_login_date');
    if (!loginDate) {
      loginDate = new Date().toISOString().split('T')[0];
      localStorage.setItem('casinohub_login_date', loginDate);
    }

    const baseProfile: UserProfile = {
      username: 'francypendy',
      email: 'francypendy@gmail.com',
      phone: '0712345678',
      avatar: 'FP',
      language: 'EN',
      currency: 'KSh',
      vipLevel: 'Silver',
      vipPoints: 1240,
      joinedDate: loginDate,
      referralCode: 'REF-FRANCYPENDY-5678'
    };

    try {
      const customSaved = localStorage.getItem('casinohub_custom_settings_profile');
      if (customSaved) {
        const parsed = JSON.parse(customSaved);
        if (parsed.fullName) baseProfile.fullName = parsed.fullName;
        if (parsed.username) baseProfile.username = parsed.username;
        if (parsed.avatar) baseProfile.avatar = parsed.avatar;
      }
    } catch (e) {}

    return baseProfile;
  });

  const [jackpotPool, setJackpotPool] = useState<JackpotPool>({
    mega: 1845209.45,
    major: 421908.20,
    minor: 56123.00,
    mini: 12400.50
  });

  const [transactions, setTransactionsState] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('casinohub_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const setTransactions = (val: React.SetStateAction<Transaction[]>) => {
    setTransactionsState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      localStorage.setItem('casinohub_transactions', JSON.stringify(next));
      return next;
    });
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp' | 'status'> & { status?: 'SUCCESS' | 'FAILED' | 'PENDING' }) => {
    const newTx: Transaction = {
      ...tx,
      id: `TX-${Math.random().toString(36).substring(3, 9).toUpperCase()}`,
      status: tx.status || 'SUCCESS',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  // Game of the Week State
  const [gameOfTheWeek, setGameOfTheWeek] = useState<any>(() => {
    const saved = localStorage.getItem('casino_game_of_the_week');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      gameId: 'slot-classic', // Fruit Mania 777 standard default
      promoType: 'cashback_boost',
      promoValue: '+10% Cashback',
      description: 'Spin Fruit Mania 777 this week and unlock massive 10% boosted cashback on all lost stakes!',
      bannerTitle: 'Fruit Mania 777 Cashback Turbo Boost!'
    };
  });

  // Notification center states
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-01',
      title: 'Welcome to CasinoHub 🎰',
      message: 'Take off inside our high-performance Aviator or explore dozens of slots and table games!',
      type: 'general',
      channel: 'in_app',
      timestamp: 'Just now',
      read: false
    }
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  const triggerNotification = (
    title: string,
    message: string,
    type: 'deposit' | 'withdrawal' | 'bonus' | 'jackpot' | 'tournament' | 'vip' | 'general'
  ) => {
    const newNotif: NotificationItem = {
      id: `notif-${Math.random().toString(36).substring(2, 8)}`,
      title,
      message,
      type,
      channel: 'in_app',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleToggleAuthSessionMode = () => {
    // If they are playing in Demo Practice mode, check if their real play session is still authenticated
    if (authSessionMode === 'demo') {
      const isAuthenticated = sessionStorage.getItem('casinohub_session_authenticated') === 'true';
      const hasAccount = localStorage.getItem('casinohub_registered_account');

      if (isAuthenticated && hasAccount) {
        // They did NOT sign out of their real account! Allow them to toggle back to real play normally via confirmation modal
        setSwitchModeTargetState('real');
        return;
      }

      // Otherwise, return to the landing screen as before
      sessionStorage.removeItem('casinohub_session_authenticated');
      setAuthSessionMode(null);
      setIsProfileOpen(false);
      setIsDepositOpen(false);
      return;
    }
    const targetMode = authSessionMode === 'demo' ? 'real' : 'demo';
    setSwitchModeTargetState(targetMode);
  };

  const executeToggleAuthSessionMode = (targetMode: 'real' | 'demo') => {
    const todayStr = localStorage.getItem('casinohub_login_date') || new Date().toISOString().split('T')[0];

    if (targetMode === 'real') {
      // Switch to Real mode
      const saved = localStorage.getItem('casinohub_registered_account');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const cleanName = (parsed.fullName || 'Frank Janal').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const cleanPhone = (parsed.phone || '0117051321').trim().replace(/[^0-9]/g, '');
          const lastFour = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '1321';
          const generatedCode = `REF-${cleanName}-${lastFour}`;

          setUserProfile(prev => ({
            ...prev,
            username: parsed.fullName.toLowerCase().replace(/\s+/g, '_'),
            phone: parsed.phone,
            fullName: parsed.fullName,
            joinedDate: todayStr,
            referralCode: generatedCode
          }));
          setAuthSessionMode('real');
          triggerNotification(
            '🟢 REAL PLAY ACTIVE',
            `Successfully switched to Real Play mode. Main Balance is KSh ${wallet.realBalance.toLocaleString()}`,
            'vip'
          );
        } catch (e) {
          setAuthSessionMode('real');
        }
      } else {
        // Create a default registry account in localStorage so they have an account immediately
        const defaultAccount = {
          fullName: 'Frank Janal',
          phone: '0117051321',
          password: '4298'
        };
        localStorage.setItem('casinohub_registered_account', JSON.stringify(defaultAccount));
        setUserProfile(prev => ({
          ...prev,
          username: 'frank_janal',
          phone: '0117051321',
          fullName: 'Frank Janal',
          joinedDate: todayStr,
          referralCode: 'REF-FRANKJANAL-1321'
        }));
        setAuthSessionMode('real');
        triggerNotification(
          '🟢 REAL PLAY ACTIVE',
          `Initialized new Real Play profile! Welcome back.`,
          'vip'
        );
      }
    } else {
      // Switch to Demo
      setAuthSessionMode('demo');
      setUserProfile(prev => ({
        ...prev,
        username: 'demo_player',
        fullName: 'Demo Player',
        joinedDate: todayStr,
        referralCode: 'REF-DEMOPLAYER-0000'
      }));
      triggerNotification(
        '🟣 DEMO PLAY RUNNING',
        'Switched to Demo Aviator. Unlimited practice mode is active!',
        'general'
      );
    }
    setSwitchModeTargetState(null);
  };

  const incrementJackpots = (amount: number) => {
    setJackpotPool(prev => ({
      mega: prev.mega + amount * 0.4,
      major: prev.major + amount * 0.3,
      minor: prev.minor + amount * 0.2,
      mini: prev.mini + amount * 0.1
    }));
  };

  // Audio system state
  const [muted, setMuted] = useState<boolean>(() => audioEngine.isMuted());

  // Responsible Gaming states
  const [isResponsibleGamingOpen, setIsResponsibleGamingOpen] = useState<boolean>(false);
  const [depositLimit, setDepositLimitState] = useState<number | null>(() => {
    const saved = localStorage.getItem('aviator_deposit_limit');
    return saved ? parseFloat(saved) : null;
  });
  const [sessionLimit, setSessionLimitState] = useState<number | null>(() => {
    const saved = localStorage.getItem('aviator_session_limit');
    return saved ? parseInt(saved) : null;
  });
  const [selfExcludedUntil, setSelfExcludedUntil] = useState<string | null>(() => {
    return localStorage.getItem('aviator_self_excluded_until');
  });
  const [totalDepositedToday, setTotalDepositedToday] = useState<number>(() => {
    const saved = localStorage.getItem('aviator_deposited_today');
    return saved ? parseFloat(saved) : 0;
  });
  const [sessionTimeLeftSecs, setSessionTimeLeftSecs] = useState<number | null>(null);
  const [showSessionAlert, setShowSessionAlert] = useState<boolean>(false);

  // Storage synced limit setters
  const setDepositLimit = (val: number | null) => {
    setDepositLimitState(val);
    if (val !== null) {
      localStorage.setItem('aviator_deposit_limit', val.toString());
    } else {
      localStorage.removeItem('aviator_deposit_limit');
    }
  };

  const setSessionLimit = (val: number | null) => {
    setSessionLimitState(val);
    if (val !== null) {
      localStorage.setItem('aviator_session_limit', val.toString());
      setSessionTimeLeftSecs(val * 60);
    } else {
      localStorage.removeItem('aviator_session_limit');
      setSessionTimeLeftSecs(null);
    }
    setShowSessionAlert(false);
  };

  const handleSelfExclude = (days: number) => {
    const end = new Date();
    end.setDate(end.getDate() + days);
    const isoStr = end.toISOString();
    setSelfExcludedUntil(isoStr);
    localStorage.setItem('aviator_self_excluded_until', isoStr);
    setIsResponsibleGamingOpen(false);
  };

  const resetSessionTimer = () => {
    if (sessionLimit !== null) {
      setSessionTimeLeftSecs(sessionLimit * 60);
    } else {
      setSessionTimeLeftSecs(null);
    }
    setShowSessionAlert(false);
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  const handleResetDepositedToday = () => {
    setTotalDepositedToday(0);
    localStorage.setItem('aviator_deposited_today', '0');
    alert("Sandbox Mode: Today's deposit logs have been cleared!");
  };

  // Session limits timer countdown ticker
  useEffect(() => {
    if (sessionLimit === null) {
      setSessionTimeLeftSecs(null);
      return;
    }

    if (sessionTimeLeftSecs === null) {
      setSessionTimeLeftSecs(sessionLimit * 60);
    }

    const timer = setInterval(() => {
      setSessionTimeLeftSecs(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          setShowSessionAlert(true);
          return 0; // Lock timer remaining at zero
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionLimit, sessionTimeLeftSecs]);
  
  // Game flight states
  const [roundIndex, setRoundIndex] = useState<number>(() => Math.floor(Date.now() / 42000));
  const [currentPhase, setCurrentPhase] = useState<'lobby' | 'flight' | 'crashed'>('lobby');
  const [crashActive, setCrashActive] = useState<boolean>(false);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(1.00);
  const [crashStatusMessage, setCrashStatusMessage] = useState<string>("Ready KSh");
  const [countdownValue, setCountdownValue] = useState<number | null>(5.0);
  const [roundCrashLimit, setRoundCrashLimit] = useState<number>(2.50);

  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Recent multiplier outcomes matching the list pictured in user screenshots
  const [historyList, setHistoryList] = useState<number[]>([
    1.29, 2.08, 1.73, 1.75, 1.43, 2.17, 3.20, 1.05, 4.88, 1.11, 2.76, 1.94, 1.35
  ]);

  // Personal Bets Log
  const [myBets, setMyBetsState] = useState<{
    amount: number;
    multiplier?: number;
    payout?: number;
    time: string;
    status: 'WON' | 'LOST' | 'ACTIVE';
    mode?: 'demo' | 'real';
    timestamp?: number;
  }[]>(() => {
    const saved = localStorage.getItem('casinohub_my_bets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Immediately filter out previous day's demo bets on init
          const today = new Date();
          return parsed.filter(bet => {
            if (bet.mode === 'demo') {
              if (!bet.timestamp) return false;
              const betDate = new Date(bet.timestamp);
              return betDate.getDate() === today.getDate() &&
                     betDate.getMonth() === today.getMonth() &&
                     betDate.getFullYear() === today.getFullYear();
            }
            return true;
          });
        }
      } catch (e) {}
    }
    return [];
  });

  const setMyBets = (val: React.SetStateAction<{
    amount: number;
    multiplier?: number;
    payout?: number;
    time: string;
    status: 'WON' | 'LOST' | 'ACTIVE';
    mode?: 'demo' | 'real';
    timestamp?: number;
  }[]>) => {
    setMyBetsState(prev => {
      const next = typeof val === 'function' ? val(prev) : val;
      localStorage.setItem('casinohub_my_bets', JSON.stringify(next));
      return next;
    });
  };

  // Midnight 12h Auto-Refresh for Demo Bets
  useEffect(() => {
    const checkAndClearDemoBets = () => {
      setMyBetsState(prev => {
        const today = new Date();
        const filtered = prev.filter(bet => {
          if (bet.mode === 'demo') {
            if (!bet.timestamp) return false;
            const betDate = new Date(bet.timestamp);
            return betDate.getDate() === today.getDate() &&
                   betDate.getMonth() === today.getMonth() &&
                   betDate.getFullYear() === today.getFullYear();
          }
          return true; // Keep all real bets
        });

        if (filtered.length !== prev.length) {
          localStorage.setItem('casinohub_my_bets', JSON.stringify(filtered));
          return filtered;
        }
        return prev;
      });
    };

    // Run right away
    checkAndClearDemoBets();

    // Check periodically for midnight crossing
    const interval = setInterval(checkAndClearDemoBets, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simulated live lobby bettors
  const [activePlayers, setActivePlayers] = useState<BetLogItem[]>([]);
  const [siteOnlineCount, setSiteOnlineCount] = useState<number>(() => Math.floor(Math.random() * (2550 - 2250 + 1)) + 2250);
  const siteOnlineCountRef = useRef(siteOnlineCount);

  useEffect(() => {
    siteOnlineCountRef.current = siteOnlineCount;
  }, [siteOnlineCount]);

  // Slowly and realistically fluctuate site-wide online players counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSiteOnlineCount(prev => {
        // Subtle drift of -3 to +3 players every 4.5 seconds
        const change = Math.floor(Math.random() * 7) - 3;
        const nextVal = prev + change;
        // Keep strictly bound within the 1430 to 2650 range
        return Math.min(2650, Math.max(1430, nextVal));
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const [onlinePlayersCount, setOnlinePlayersCount] = useState<number>(() => Math.floor(Math.random() * (2200 - 1950 + 1)) + 1950);
  const [startingPlayers, setStartingPlayers] = useState<number>(() => Math.floor(Math.random() * (2200 - 1950 + 1)) + 1950);
  const [finalMinPlayers, setFinalMinPlayers] = useState<number>(85);
  const [bigWinOverlay, setBigWinOverlay] = useState<{ multiplier: number; amount: number } | null>(null);

  // Big Win overlay auto-close effect
  useEffect(() => {
    if (bigWinOverlay) {
      const timer = setTimeout(() => {
        setBigWinOverlay(null);
      }, 5000); // 5 seconds of majestic golden glory
      return () => clearTimeout(timer);
    }
  }, [bigWinOverlay]);

  // Automatic demo account replenishment when balance goes below 10 KSh
  useEffect(() => {
    if (authSessionMode === 'demo' && wallet.demoBalance < 10) {
      setWallet(prev => {
        const nextDemo = parseFloat((prev.demoBalance + 50000.00).toFixed(2));
        const updated = {
          ...prev,
          demoBalance: nextDemo,
          mainBalance: nextDemo
        };
        localStorage.setItem('casinohub_wallet_balances', JSON.stringify(updated));
        return updated;
      });
      triggerNotification(
        '💰 RECHARGED',
        'Your demo account balance dropped below 10.00 KSh! We added +50,000.00 KSh of free demo credits for practice.',
        'general'
      );
    }
  }, [wallet.demoBalance, authSessionMode]);

  // M-Pesa overlay indicator State
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isDownloadAppOpen, setIsDownloadAppOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', username: 'Kamau_KE', text: 'JetCash is giving crazy runs today! 🚀', timestamp: '09:12' },
    { id: 'm2', username: 'Wanjiku_Win', text: 'Cashed out on 5.4x, lets go! 🔥💵', timestamp: '09:15' },
    { id: 'm3', username: 'Mwangi_001', text: 'Almost hit the 15x, better luck next time!', timestamp: '09:20' },
    { id: 'm4', username: 'Amani_254', text: 'Wow!', timestamp: '09:24' }
  ]);
  const [switchModeTargetState, setSwitchModeTargetState] = useState<'real' | 'demo' | null>(null);

  // Periodic simulated lounge chat banter
  useEffect(() => {
    const chatPhrases = [
      'Nice win! 🎉',
      'Better luck next time! 👍',
      'Wow!',
      'JetCash to the moon! 🚀',
      'Let\'s gooo! 🙌',
      'So close! 🤏',
      'Oh no, crashed! 💥',
      'Play safe guys! 🛡️',
      'High risk, high reward! 💎',
      'Wait for the big one! 🐉',
      'Withdraw on time! ⏱️',
      'Next round is 10x! 🔥',
      'Got 2.5x, I\'m happy! 😎',
      'Perfect flight!',
      'Unbelievable multiplier! 🔥'
    ];

    const generateSimulatedMessage = () => {
      // Pick dynamic sender from COMPANION_USERS list to keep community style
      const idx1 = Math.floor(Math.random() * COMPANION_USERS.length);
      const user = COMPANION_USERS[idx1];
      const idx2 = Math.floor(Math.random() * chatPhrases.length);
      const phrase = chatPhrases[idx2];
      
      const newMsg: ChatMessage = {
        id: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        username: user,
        text: phrase,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => {
        const updated = [...prev, newMsg];
        if (updated.length > 45) {
          return updated.slice(updated.length - 45);
        }
        return updated;
      });
    };

    // Periodical chatter with high-action dynamic spacing (1.5s to 4.5s) like real Aviator apps
    let timeoutId: any;
    
    const scheduleNext = () => {
      const delay = Math.round(Math.random() * 2700 + 1500); // 1.5s to 4.2s
      timeoutId = setTimeout(() => {
        generateSimulatedMessage();
        scheduleNext();
      }, delay);
    };
    
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  const handleSendChatMessage = (text: string) => {
    if (socketConnected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        sender: userProfile.username || 'francypendy',
        text: text,
        vipLevel: userProfile.vipLevel || 'Bronze'
      }));
    } else {
      const newMsg: ChatMessage = {
        id: `me-${Date.now()}`,
        username: userProfile.username || 'francypendy',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true
      };
      setChatMessages(prev => {
        const updated = [...prev, newMsg];
        if (updated.length > 45) {
          return updated.slice(updated.length - 45);
        }
        return updated;
      });
    }
  };

  const handleSignOut = () => {
    sessionStorage.removeItem('casinohub_session_authenticated');
    localStorage.removeItem('casinohub_registered_account');
    setAuthSessionMode(null);
    setIsProfileOpen(false);
    triggerNotification(
      '🚪 SIGNED OUT',
      'You have safely signed out of your player session. Welcome back anytime!',
      'general'
    );
  };

  // Individual dual bet panels data synchronized state
  const [panel1Placed, setPanel1Placed] = useState<boolean>(false);
  const [panel1Cashed, setPanel1Cashed] = useState<boolean>(false);
  const [panel1BetVal, setPanel1BetVal] = useState<number>(0);
  const [panel1NextPlaced, setPanel1NextPlaced] = useState<boolean>(false);
  const [panel1NextBetVal, setPanel1NextBetVal] = useState<number>(0);

  const [panel2Placed, setPanel2Placed] = useState<boolean>(false);
  const [panel2Cashed, setPanel2Cashed] = useState<boolean>(false);
  const [panel2BetVal, setPanel2BetVal] = useState<number>(0);
  const [panel2NextPlaced, setPanel2NextPlaced] = useState<boolean>(false);
  const [panel2NextBetVal, setPanel2NextBetVal] = useState<number>(0);

  // Growth loop ticker references
  const mainTickerInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  // Synchronized Multi-Device Ticker Refs
  const panel1ActiveBetRef = useRef<number | null>(null);
  const panel2ActiveBetRef = useRef<number | null>(null);
  const panel1NextRoundBetRef = useRef<number | null>(null);
  const panel2NextRoundBetRef = useRef<number | null>(null);
  const panel1BetModeRef = useRef<'demo' | 'real' | null>(null);
  const panel2BetModeRef = useRef<'demo' | 'real' | null>(null);
  const panel1NextRoundBetModeRef = useRef<'demo' | 'real' | null>(null);
  const panel2NextRoundBetModeRef = useRef<'demo' | 'real' | null>(null);
  const bothBetsPlacedInRoundRef = useRef<boolean>(false);
  const gamePhaseRef = useRef<'lobby' | 'flight' | 'crashed' | null>(null);
  const currentRoundIndexRef = useRef<number>(-1);

  // Helper to get adjusted/capped round limit based on active real bets
  const getCurrentRoundLimit = (index: number) => {
    const baseLimit = getRoundLimit(index);
    let maxAllowed = Infinity;

    const checkBet = (amount: number, mode: 'demo' | 'real' | null) => {
      const isReal = mode === 'real' || (mode === null && authSessionMode === 'real');
      if (isReal) {
        if (amount === 10) {
          maxAllowed = Math.min(maxAllowed, 5.0);
        } else if (amount === 20) {
          maxAllowed = Math.min(maxAllowed, 4.0);
        } else if (amount === 30) {
          maxAllowed = Math.min(maxAllowed, 3.0);
        } else if (amount === 40) {
          maxAllowed = Math.min(maxAllowed, 2.0);
        } else if (amount >= 50) {
          maxAllowed = Math.min(maxAllowed, 2.0);
        }
      }
    };

    if (panel1ActiveBetRef.current !== null && panel1ActiveBetRef.current > 0) {
      checkBet(panel1ActiveBetRef.current, panel1BetModeRef.current);
    }
    if (panel2ActiveBetRef.current !== null && panel2ActiveBetRef.current > 0) {
      checkBet(panel2ActiveBetRef.current, panel2BetModeRef.current);
    }

    if (maxAllowed !== Infinity && baseLimit > maxAllowed) {
      return parseFloat(Math.min(baseLimit, maxAllowed).toFixed(2));
    }
    return baseLimit;
  };

  // Helper: setup simulated other players bets at start of lobby
  const generateSimulatedLobbyBettors = (roundIndex: number) => {
    const rand = Math.random;
    const limit = getCurrentRoundLimit(roundIndex);
    
    // To ensure users live is always more than those actively playing, 
    // the game's round active players (maxStart) is a fraction of the total site-wide users (siteOnlineCount).
    const maxStart = Math.min(2650, Math.max(1200, Math.floor(siteOnlineCountRef.current * (0.84 + rand() * 0.08))));
    // a minimum of 63 to 135
    const minFinal = Math.floor(rand() * (135 - 63 + 1)) + 63;
    
    setStartingPlayers(maxStart);
    setFinalMinPlayers(minFinal);
    setOnlinePlayersCount(maxStart);

    const poolList: (BetLogItem & { cashoutThreshold?: number; willCashOut?: boolean })[] = [];
    const usedNames = new Set<string>();

    const firstNames = [
      'Kamau', 'Amani', 'Njoroge', 'Otieno', 'Wanjiku', 'Mwangi', 'Kibet', 'Juma', 'Zuri', 'Mutua',
      'Fatuma', 'Amina', 'Kiptoo', 'Ngugi', 'Omondi', 'Kariuki', 'Waweru', 'Abdi', 'Adan', 'Ali',
      'Chebet', 'Jepchirchir', 'Kosgei', 'Lagat', 'Maalim', 'Musa', 'Ochieng', 'Odhiambo', 'Okoth',
      'Wanjala', 'Peter', 'John', 'Grace', 'Mercy', 'David', 'James', 'Sarah', 'Mary', 'Joseph'
    ];
    const lastNames = [
      'KE', '254', 'Bettor', 'Hustler', 'Win', '001', 'Racer', 'Bets', 'Safar', 'Guru', 'Rider',
      'VIP', 'Jet', 'Flyer', 'Fast', 'Ace', 'Star', 'Rich', 'Winner', 'Boss', 'Slinger', 'Pro',
      'Gold', 'King', 'Queen', 'Max', 'Apex', 'Hyper', 'Sonic', 'Zon', 'Play', 'Club', 'Storm'
    ];

    // Generate simulated active participants
    const cohortSize = 65;
    for (let i = 0; i < cohortSize; i++) {
      const idx1 = Math.floor(rand() * firstNames.length);
      const first = firstNames[idx1];
      const idx2 = Math.floor(rand() * lastNames.length);
      const last = lastNames[idx2];
      let candidate = `${first}_${last}`;
      if (usedNames.has(candidate)) {
        candidate = `${candidate}_${Math.floor(rand() * 99)}`;
      }
      usedNames.add(candidate);

      const randomStake = rand() > 0.6 
        ? Math.floor(rand() * 800) + 100 
        : Math.floor(rand() * 11000) + 1000;

      // Realistic cashout threshold distributions matching actual round's crash limit!
      const canSucceed = limit > 1.05;
      const willSucceed = canSucceed && (rand() < 0.65); // 65% of players successfully cash out before crashing

      let cashoutThreshold = 1.5;
      let willCashOut = true;

      if (willSucceed) {
        // Distribute cashouts down to 1.05 up to limit, heavily skewed to early cashouts for authenticity
        const powerFactor = Math.pow(rand(), 1.7);
        cashoutThreshold = parseFloat((1.05 + powerFactor * (limit - 1.05)).toFixed(2));
        willCashOut = true;
      } else {
        // They failed / chose to cash out too late (or crash before reaching the threshold)
        // Set their target higher than the crash limit of the round
        cashoutThreshold = parseFloat((limit + 0.10 + rand() * 150.0).toFixed(2));
        willCashOut = rand() > 0.40;
      }

      poolList.push({
        id: `b-${i}-${Math.floor(rand() * 10000)}`,
        username: candidate,
        betAmount: randomStake,
        cashedOut: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cashoutThreshold,
        willCashOut
      });
    }

    // Sort players so higher bets are placed on top for dramatic gaming impact
    poolList.sort((a,b) => b.betAmount - a.betAmount);
    setActivePlayers(poolList);
  };

  // Helper helper: trigger payouts or losses at the end of flight
  const resolveRoundUnsecuredBets = () => {
    const lostAmt1 = panel1ActiveBetRef.current;
    if (lostAmt1 !== null) {
      const mode = panel1BetModeRef.current || (authSessionMode === 'real' ? 'real' : 'demo');
      setMyBets(prev => [
        {
          amount: lostAmt1,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'LOST',
          mode,
          timestamp: Date.now()
        },
        ...prev
      ]);
      panel1ActiveBetRef.current = null;
      panel1BetModeRef.current = null;
    }

    const lostAmt2 = panel2ActiveBetRef.current;
    if (lostAmt2 !== null) {
      const mode = panel2BetModeRef.current || (authSessionMode === 'real' ? 'real' : 'demo');
      setMyBets(prev => [
        {
          amount: lostAmt2,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'LOST',
          mode,
          timestamp: Date.now()
        },
        ...prev
      ]);
      panel2ActiveBetRef.current = null;
      panel2BetModeRef.current = null;
    }
  };

  // Dynamic Flight System Hook with NO hanging
  const phaseStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Generate simulated players if round index changes
    if (currentRoundIndexRef.current !== roundIndex) {
      currentRoundIndexRef.current = roundIndex;
      generateSimulatedLobbyBettors(roundIndex);
    }
  }, [roundIndex]);

  useEffect(() => {
    phaseStartTimeRef.current = Date.now();
    if (currentPhase === 'lobby' && currentView === 'aviator') {
      audioEngine.playFlightStart();
    }
  }, [currentPhase, currentView]);

  // Stop/play flight background sound based on navigating into or out of Aviator view
  useEffect(() => {
    if (currentView !== 'aviator') {
      audioEngine.stopFlightSound();
    } else {
      if (currentPhase === 'lobby' || currentPhase === 'flight') {
        audioEngine.playFlightStart();
      }
    }
  }, [currentView, currentPhase]);

  // Set initial history list on mount dynamically
  useEffect(() => {
    const list: number[] = [];
    const baseIndex = Math.floor(Date.now() / 42000);
    for (let i = 1; i <= 30; i++) {
      list.push(getRoundLimit(baseIndex - i));
    }
    setHistoryList(list);
  }, []);

  useEffect(() => {
    const handleGameLoopTick = () => {
      if (socketConnected) {
        return;
      }
      const now = Date.now();
      const elapsed = now - phaseStartTimeRef.current;
      const limit = getCurrentRoundLimit(roundIndex);

      // Slowly and realistically fluctuate active flight round online counter while waiting in lobby
      if (typeof window !== 'undefined' && currentPhase === 'lobby' && Math.random() < 0.15) {
        setOnlinePlayersCount(prev => {
          const jitter = Math.floor(Math.random() * 5) - 2; // -2 to +2
          const nextVal = prev + jitter;
          const maxAllowed = Math.floor(siteOnlineCountRef.current * 0.94);
          return Math.min(maxAllowed, Math.max(1200, nextVal));
        });
      }

      // Determine flight duration smoothly scaled using the standard Aviator exponential scale growth duration
      let flightDuration = limit <= 1.00 ? 0 : Math.round((Math.log(limit) / 0.0866) * 1000);

      const lobbyDuration = 6000; // 6 seconds lobby countdown
      const crashedDuration = 2200; // 2.2 seconds display on crashed (no hanging!)

      if (currentPhase === 'lobby') {
        const countdownVal = parseFloat(((lobbyDuration - elapsed) / 1000).toFixed(1));
        if (countdownVal > 0) {
          setCountdownValue(countdownVal);
          // General room counter now fluctuates organically on tick
          setCrashActive(false);
          setCrashMultiplier(1.00);
          setCrashStatusMessage("Lobby Loaded");
          setRoundCrashLimit(limit);
        } else {
          // Transition to flight!
          setCrashActive(true);
          setCountdownValue(null);
          setRoundCrashLimit(limit);
          setStartingPlayers(onlinePlayersCount); // Lock the current lobby count as starting point
          bothBetsPlacedInRoundRef.current = (panel1ActiveBetRef.current !== null && panel2ActiveBetRef.current !== null);
          setCurrentPhase('flight');
        }
      } else if (currentPhase === 'flight') {
        if (elapsed < flightDuration) {
          const tSec = elapsed / 1000;
          let currentScale = Math.exp(0.0866 * tSec);
          if (currentScale > limit) {
            currentScale = limit;
          }
          currentScale = parseFloat(currentScale.toFixed(2));
          setCrashMultiplier(prev => Math.max(prev, currentScale));

          // Update active players' cashout status based on thresholds
          setActivePlayers(prev => {
            return prev.map(player => {
              if (!player.cashedOut) {
                const th = (player as any).cashoutThreshold || 1.8;
                const willCO = (player as any).willCashOut !== false;
                if (willCO && currentScale >= th) {
                  return {
                    ...player,
                    cashedOut: true,
                    multiplier: th,
                    payoutAmount: parseFloat((player.betAmount * th).toFixed(1))
                  };
                }
              }
              return player;
            });
          });

          // Decline online survivors count smoothly and strictly based on the scale range
          let remainingFraction = 1.0;
          if (currentScale <= 1.99) {
            const scaleFraction = Math.max(0, Math.min(1, (currentScale - 1.0) / 0.99));
            // Declines slowly and organically by around 12% total in this initial range (from 100% to 88%)
            remainingFraction = 1.0 - (scaleFraction * 0.12) + (Math.sin(currentScale * 12) * 0.003);
          } else {
            // Above 1.99x, it declines steadily and faster as players cash out at high limits
            const scaleFraction = Math.max(0, Math.min(1, (currentScale - 1.99) / (limit - 1.99 || 1.0)));
            const floorFrac = 0.035;
            remainingFraction = 0.88 - Math.pow(scaleFraction, 1.6) * (0.88 - floorFrac) + (Math.sin(currentScale * 4) * 0.002);
          }
          // Clamp and compute physical counter values
          remainingFraction = Math.max(0.03, Math.min(1.0, remainingFraction));
          const calculatedCount = Math.max(
            finalMinPlayers,
            Math.round(startingPlayers * remainingFraction)
          );
          setOnlinePlayersCount(calculatedCount);
        } else {
          // Transition to crashed!
          if (currentView === 'aviator') {
            audioEngine.playCrash();
          } else {
            audioEngine.stopFlightSound();
          }
          setCrashActive(false);
          setCountdownValue(null);
          setCrashMultiplier(limit);
          setCrashStatusMessage(`FLEW AWAY! at ${limit.toFixed(2)}x`);
          resolveRoundUnsecuredBets();
          // General room counter is preserved realistically during crash instead of forced to zero
          
          // Append actual result to history ribbon list
          setHistoryList(prev => {
            if (prev.includes(limit)) return prev; // Avoid duplicating if already added
            const nextList = [limit, ...prev];
            return nextList.slice(0, 30);
          });

          setCurrentPhase('crashed');
        }
      } else if (currentPhase === 'crashed') {
        if (elapsed >= crashedDuration) {
          // Transition to next round immediately after display!
          if (panel1NextRoundBetRef.current !== null) {
            panel1ActiveBetRef.current = panel1NextRoundBetRef.current;
            panel1BetModeRef.current = panel1NextRoundBetModeRef.current;
            panel1NextRoundBetRef.current = null;
            panel1NextRoundBetModeRef.current = null;
            setPanel1Placed(true);
            setPanel1Cashed(false);
            setPanel1BetVal(panel1ActiveBetRef.current);
          } else {
            setPanel1Placed(false);
            setPanel1Cashed(false);
            setPanel1BetVal(0);
          }
          setPanel1NextPlaced(false);
          setPanel1NextBetVal(0);

          if (panel2NextRoundBetRef.current !== null) {
            panel2ActiveBetRef.current = panel2NextRoundBetRef.current;
            panel2BetModeRef.current = panel2NextRoundBetModeRef.current;
            panel2NextRoundBetRef.current = null;
            panel2NextRoundBetModeRef.current = null;
            setPanel2Placed(true);
            setPanel2Cashed(false);
            setPanel2BetVal(panel2ActiveBetRef.current);
          } else {
            setPanel2Placed(false);
            setPanel2Cashed(false);
            setPanel2BetVal(0);
          }
          setPanel2NextPlaced(false);
          setPanel2NextBetVal(0);

          bothBetsPlacedInRoundRef.current = false;
          setRoundIndex(prev => {
            const nextLobbyCount = Math.min(2650, Math.max(1200, Math.floor(siteOnlineCountRef.current * (0.84 + Math.random() * 0.08))));
            setOnlinePlayersCount(nextLobbyCount);
            setStartingPlayers(nextLobbyCount);
            return prev + 1;
          });
          setCurrentPhase('lobby');
        }
      }
    };

    const interval = setInterval(handleGameLoopTick, 50);
    return () => clearInterval(interval);
  }, [currentPhase, roundIndex, startingPlayers, finalMinPlayers]);

  // Dual Panel handlers
  const handleBetPlaced = (panelId: string, amount: number): boolean => {
    // Verify current balance via thread-safe balanceRef
    if (balanceRef.current < amount) {
      triggerNotification(
        '⚠️ LIMIT EXCEEDED',
        'Cannot place this bet. The combined bet values exceed your wallet balance!',
        'general'
      );
      if (panelId === 'panel1') {
        setPanel1Placed(false);
        setPanel1Cashed(false);
        setPanel1BetVal(0);
        panel1ActiveBetRef.current = null;
        panel1NextRoundBetRef.current = null;
        panel1BetModeRef.current = null;
        panel1NextRoundBetModeRef.current = null;
      } else {
        setPanel2Placed(false);
        setPanel2Cashed(false);
        setPanel2BetVal(0);
        panel2ActiveBetRef.current = null;
        panel2NextRoundBetRef.current = null;
        panel2BetModeRef.current = null;
        panel2NextRoundBetModeRef.current = null;
      }
      return false;
    }

    // Deduct wager instantaneously
    balanceRef.current = parseFloat((balanceRef.current - amount).toFixed(2));
    setBalance(prev => parseFloat((prev - amount).toFixed(2)));

    const isNextRound = currentPhase === 'flight' || currentPhase === 'crashed';
    const activeMode = authSessionMode === 'real' ? 'real' : 'demo';

    if (panelId === 'panel1') {
      if (isNextRound) {
        panel1NextRoundBetRef.current = amount;
        panel1NextRoundBetModeRef.current = activeMode;
        setPanel1NextPlaced(true);
        setPanel1NextBetVal(amount);
      } else {
        setPanel1Placed(true);
        setPanel1Cashed(false);
        setPanel1BetVal(amount);
        panel1ActiveBetRef.current = amount;
        panel1BetModeRef.current = activeMode;
      }
    } else {
      if (isNextRound) {
        panel2NextRoundBetRef.current = amount;
        panel2NextRoundBetModeRef.current = activeMode;
        setPanel2NextPlaced(true);
        setPanel2NextBetVal(amount);
      } else {
        setPanel2Placed(true);
        setPanel2Cashed(false);
        setPanel2BetVal(amount);
        panel2ActiveBetRef.current = amount;
        panel2BetModeRef.current = activeMode;
      }
    }

    if (socketConnected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'PLACE_BET',
        username: userProfile.username || 'francypendy',
        amount,
        panelId,
        mode: activeMode
      }));
    }
    return true;
  };

  const handleBetCancelled = (panelId: string, amount: number) => {
    // Refund the balance!
    balanceRef.current = parseFloat((balanceRef.current + amount).toFixed(2));
    setBalance(prev => parseFloat((prev + amount).toFixed(2)));

    const isNextRound = currentPhase === 'flight' || currentPhase === 'crashed';

    if (panelId === 'panel1') {
      if (isNextRound) {
        setPanel1NextBetVal(0);
        setPanel1NextPlaced(false);
        panel1NextRoundBetRef.current = null;
        panel1NextRoundBetModeRef.current = null;
      } else {
        setPanel1BetVal(0);
        setPanel1Placed(false);
        panel1ActiveBetRef.current = null;
        panel1BetModeRef.current = null;
      }
    } else {
      if (isNextRound) {
        setPanel2NextBetVal(0);
        setPanel2NextPlaced(false);
        panel2NextRoundBetRef.current = null;
        panel2NextRoundBetModeRef.current = null;
      } else {
        setPanel2BetVal(0);
        setPanel2Placed(false);
        panel2ActiveBetRef.current = null;
        panel2BetModeRef.current = null;
      }
    }

    if (socketConnected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'CANCEL_BET',
        panelId,
        isNextRound
      }));
    }
  };

  const handleCashOut = (panelId: string, finalMult: number, cashPayout: number) => {
    // Sound effect trigger
    if (currentView === 'aviator') {
      audioEngine.playCashout();
    }
    // Deposit cashout rewards immediately
    setBalance(prev => parseFloat((prev + cashPayout).toFixed(2)));

    if (panelId === 'panel1') {
      setPanel1Cashed(true);
      panel1ActiveBetRef.current = null;
    } else {
      setPanel2Cashed(true);
      panel2ActiveBetRef.current = null;
    }

    // Add personal wins to ledger
    const betVal = panelId === 'panel1' ? panel1BetVal : panel2BetVal;
    const mode = panelId === 'panel1' 
      ? (panel1BetModeRef.current || (authSessionMode === 'real' ? 'real' : 'demo'))
      : (panel2BetModeRef.current || (authSessionMode === 'real' ? 'real' : 'demo'));

    setMyBets(prev => [
      {
        amount: betVal,
        multiplier: finalMult,
        payout: cashPayout,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'WON',
        mode,
        timestamp: Date.now()
      },
      ...prev
    ]);

    // Clear bet mode refs
    if (panelId === 'panel1') {
      panel1BetModeRef.current = null;
    } else {
      panel2BetModeRef.current = null;
    }

    // Trigger Big Win Celebration Overlay if multiplier >= 5.0x!
    if (finalMult >= 5.0 && !bothBetsPlacedInRoundRef.current) {
      setBigWinOverlay({ multiplier: finalMult, amount: cashPayout });
    }

    if (socketConnected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'CASH_OUT',
        panelId,
        multiplier: finalMult
      }));
    }
  };

  // WebSocket Connection & Synchronization Hook
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let ws: WebSocket;

    function connect() {
      console.log("[WS Client] Connecting to:", wsUrl);
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("[WS Client] Connected to real-time synchronized game host");
        setSocketConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'INITIAL_STATE') {
            setRoundIndex(msg.roundIndex);
            setCurrentPhase(msg.currentPhase);
            if (msg.phaseStartTime && msg.serverTime) {
              const serverElapsed = msg.serverTime - msg.phaseStartTime;
              phaseStartTimeRef.current = Date.now() - serverElapsed;
            }
            setCountdownValue(msg.currentPhase === 'lobby' ? parseFloat(((6000 - (Date.now() - msg.phaseStartTime)) / 1000).toFixed(1)) : null);
            setCrashActive(msg.currentPhase === 'flight');
            setCrashMultiplier(msg.currentPhase === 'flight' ? msg.currentMultiplier : 1.00);
            setRoundCrashLimit(msg.limit);
            setHistoryList(msg.historyList || []);
            setActivePlayers(msg.activePlayers || []);
            setSiteOnlineCount(msg.siteOnlineCount);
            setOnlinePlayersCount(msg.onlinePlayersCount);
          } else if (msg.type === 'LOBBY_TICK') {
            setCountdownValue(msg.countdownValue);
            setOnlinePlayersCount(msg.onlinePlayersCount);
            setSiteOnlineCount(msg.siteOnlineCount);
            setCrashActive(false);
            setCrashMultiplier(1.00);
            setCrashStatusMessage("Waiting for Round...");
          } else if (msg.type === 'MULTIPLIER_TICK') {
            setCrashMultiplier(prev => Math.max(prev, msg.multiplier));
            if (msg.multiplier && msg.multiplier >= 1.00) {
              const expectedElapsed = (Math.log(msg.multiplier) / 0.0866) * 1000;
              phaseStartTimeRef.current = Date.now() - expectedElapsed;
            }
            setOnlinePlayersCount(msg.onlinePlayersCount);
            setActivePlayers(msg.activePlayers || []);
          } else if (msg.type === 'PHASE_CHANGE') {
            const nextPhase = msg.phase;
            setCurrentPhase(nextPhase);
            phaseStartTimeRef.current = Date.now();

            if (nextPhase === 'lobby') {
              setRoundIndex(msg.roundIndex);
              setCountdownValue(6.0);
              setCrashActive(false);
              setCrashMultiplier(1.00);
              setCrashStatusMessage("Lobby Loaded");
              setActivePlayers(msg.activePlayers || []);
              
              if (panel1NextRoundBetRef.current !== null) {
                panel1ActiveBetRef.current = panel1NextRoundBetRef.current;
                panel1BetModeRef.current = panel1NextRoundBetModeRef.current;
                panel1NextRoundBetRef.current = null;
                panel1NextRoundBetModeRef.current = null;
                setPanel1Placed(true);
                setPanel1Cashed(false);
                setPanel1BetVal(panel1ActiveBetRef.current);
              } else {
                setPanel1Placed(false);
                setPanel1Cashed(false);
                setPanel1BetVal(0);
              }
              setPanel1NextPlaced(false);
              setPanel1NextBetVal(0);

              if (panel2NextRoundBetRef.current !== null) {
                panel2ActiveBetRef.current = panel2NextRoundBetRef.current;
                panel2BetModeRef.current = panel2NextRoundBetModeRef.current;
                panel2NextRoundBetRef.current = null;
                panel2NextRoundBetModeRef.current = null;
                setPanel2Placed(true);
                setPanel2Cashed(false);
                setPanel2BetVal(panel2ActiveBetRef.current);
              } else {
                setPanel2Placed(false);
                setPanel2Cashed(false);
                setPanel2BetVal(0);
              }
              setPanel2NextPlaced(false);
              setPanel2NextBetVal(0);
              bothBetsPlacedInRoundRef.current = false;
            } else if (nextPhase === 'flight') {
              setCrashActive(true);
              setCountdownValue(null);
              setRoundCrashLimit(msg.limit);
              setActivePlayers(msg.activePlayers || []);
              
              if (currentView === 'aviator') {
                audioEngine.playFlightStart();
              }
            } else if (nextPhase === 'crashed') {
              if (currentView === 'aviator') {
                audioEngine.playCrash();
              } else {
                audioEngine.stopFlightSound();
              }
              setCrashActive(false);
              setCountdownValue(null);
              setCrashMultiplier(msg.limit);
              setCrashStatusMessage(`FLEW AWAY! at ${msg.limit.toFixed(2)}x`);
              setHistoryList(msg.historyList || []);

              const lost1 = panel1ActiveBetRef.current;
              if (lost1 !== null) {
                const mode = panel1BetModeRef.current || (authSessionMode === 'real' ? 'real' : 'demo');
                setMyBetsState(prev => [{
                  amount: lost1,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: 'LOST',
                  mode,
                  timestamp: Date.now()
                }, ...prev]);
                panel1ActiveBetRef.current = null;
                panel1BetModeRef.current = null;
                setPanel1Placed(false);
              }
              const lost2 = panel2ActiveBetRef.current;
              if (lost2 !== null) {
                const mode = panel2BetModeRef.current || (authSessionMode === 'real' ? 'real' : 'demo');
                setMyBetsState(prev => [{
                  amount: lost2,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: 'LOST',
                  mode,
                  timestamp: Date.now()
                }, ...prev]);
                panel2ActiveBetRef.current = null;
                panel2BetModeRef.current = null;
                setPanel2Placed(false);
              }
            }
          } else if (msg.type === 'LOBBY_BET_UPDATE') {
            setActivePlayers(msg.activePlayers || []);
          } else if (msg.type === 'PLAYER_CASHED_OUT') {
            setActivePlayers(msg.activePlayers || []);
          } else if (msg.type === 'AUTO_CASHOUT_SUCCESS') {
            const { multiplier, payoutAmount, panelId } = msg;
            handleCashOut(panelId, multiplier, payoutAmount);
          } else if (msg.type === 'CHAT_BROADCAST') {
            const receivedMsg = msg.message;
            setChatMessages(prev => {
              if (prev.some(m => m.id === receivedMsg.id)) return prev;
              const updated = [...prev, receivedMsg];
              return updated.slice(-45);
            });
          }
        } catch (e) {
          console.error("[WS Message Handling Error]:", e);
        }
      };

      ws.onclose = () => {
        console.warn("[WS Client] Disconnected, falling back to local simulator");
        setSocketConnected(false);
        setTimeout(connect, 3000);
      };

      ws.onerror = (e) => {
        console.error("[WS Client] Error:", e);
        ws.close();
      };
    }

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [currentView, authSessionMode, userProfile.username]);

  // Mpesa cashier cashier deposit
  const handleDepositSuccess = (cashAmount: number) => {
    setBalance(prev => parseFloat((prev + cashAmount).toFixed(2)));
    setTotalDepositedToday(prev => {
      const next = prev + cashAmount;
      localStorage.setItem('aviator_deposited_today', next.toString());
      return next;
    });
  };

  // App Installer Reward Bonus Credit
  const handleAppInstallBonus = (cashAmount: number) => {
    setBalance(prev => parseFloat((prev + cashAmount).toFixed(2)));
    addTransaction({
      amount: cashAmount,
      type: 'bonus_credit',
      currency: 'KSh',
      method: 'CasinoHub Mobile App',
      referenceCode: 'BONUS-APP-1K',
      status: 'SUCCESS'
    });
  };

  const handleRefill = (amount: number) => {
    setBalance(prev => parseFloat((prev + amount).toFixed(2)));
    addTransaction({
      amount,
      type: authSessionMode === 'real' ? 'deposit' : 'bonus_credit',
      currency: 'KSh',
      method: authSessionMode === 'real' ? 'M-Pesa Express' : 'Demo Refill',
      referenceCode: 'REFILL-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'SUCCESS'
    });
    triggerNotification(
      '💸 BALANCE REFILLED',
      `Your balance has been successfully refilled with +${amount.toLocaleString()} KSh!`,
      authSessionMode === 'real' ? 'deposit' : 'bonus'
    );
  };

  const handleWithdrawSuccess = (cashAmount: number) => {
    setBalance(prev => parseFloat((prev - cashAmount).toFixed(2)));
  };



  // Tick exclusion clock dynamically if excluded
  const [exclusionTick, setExclusionTick] = useState<number>(0);
  const isExcluded = selfExcludedUntil ? new Date(selfExcludedUntil) > new Date() : false;
  
  useEffect(() => {
    if (isExcluded) {
      const interval = setInterval(() => {
        setExclusionTick(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isExcluded]);

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-[#07080a] text-gray-100 flex flex-col justify-center items-center p-4 relative font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(226,21,21,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="w-full max-w-md bg-[#131518] rounded-2xl border border-rose-500/20 p-6 flex flex-col gap-6 text-center shadow-[0_15px_50px_rgba(239,68,68,0.1)] relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
          
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-950/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse">
            <WifiOff className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-black uppercase text-white tracking-widest leading-none">Connection Lost</h1>
            <span className="text-rose-400 text-[9px] font-extrabold uppercase bg-rose-950/35 py-1 px-3.5 rounded-full border border-rose-500/20 inline-block font-sans tracking-wider">
              Offline Mode Detected
            </span>
          </div>

          <p className="text-[11px] text-gray-400 font-medium leading-relaxed px-1">
            CasinoHub is a real-time multiplayer gaming system and requires a stable online internet connection. The application is locked to prevent desynchronized stakes and to secure your balance coffers.
          </p>

          <div className="bg-[#0e0f11] p-3.5 rounded-xl border border-[#212328] flex items-center justify-between text-left">
            <div>
              <span className="text-[8px] uppercase font-bold text-gray-500 block tracking-wider leading-none mb-0.5">STATUS REPORT</span>
              <span className="text-[10px] text-rose-300 font-bold">Awaiting server handshake...</span>
            </div>
            <div className="flex items-center gap-1.5 bg-rose-950/20 px-2.5 py-1 rounded-full border border-rose-950/50">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[9px] font-black uppercase tracking-wider text-rose-400">DISCONNECTED</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && 'navigator' in window) {
                  const status = window.navigator.onLine;
                  setIsOnline(status);
                  if (status) {
                    triggerNotification(
                      '📶 CONNECTION RESTORED',
                      'Handshake successful. You are back online!',
                      'general'
                    );
                  }
                }
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 border border-rose-500/30 text-white text-[10.5px] font-extrabold rounded-xl uppercase tracking-wider transition-all duration-350 shadow-[0_4px_16px_rgba(239,68,68,0.25)] flex items-center justify-center gap-1.5 cursor-pointer leading-none"
            >
              <span>Verify & Reconnect</span>
            </button>
            <p className="text-[8.5px] text-gray-500 leading-none">
              Check your Wi-Fi or cellular network settings to resolve this issue automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isExcluded) {
    const end = new Date(selfExcludedUntil!);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    
    // Convert to days, hours, mins, secs remaining
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);
    const diffSecs = Math.floor((diffMs / 1000) % 60);

    const handleClearSelfExclusion = () => {
      setSelfExcludedUntil(null);
      localStorage.removeItem('aviator_self_excluded_until');
      alert("Sandbox Mode: Self-exclusion cleared! Welcome back to the Aviator.");
    };

    return (
      <div className="min-h-screen bg-[#07080a] text-gray-100 flex flex-col justify-center items-center p-4 relative font-sans">
        <div className="w-full max-w-md bg-[#131518] rounded-2xl border border-red-500/20 p-6 flex flex-col gap-6 text-center shadow-[0_15px_50px_rgba(239,68,68,0.15)] animate-scaleUp">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-950/30 border-2 border-red-500 flex items-center justify-center text-[#ff3a3a] animate-pulse cursor-default select-none">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black uppercase text-white tracking-widest leading-none">Safety Exclusion Active</h1>
            <span className="text-[#ff5555] text-[10px] font-extrabold uppercase bg-red-950/20 py-1 px-3.5 rounded-full border border-red-500/10 inline-block font-sans">
              Play Break active
            </span>
          </div>

          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            As requested under our **Responsible Gaming** policy, your CasinoHub / Aviator access is locked. Use this pause to step away from active betting.
          </p>

          <div className="bg-[#0e0f11] p-4 rounded-xl border border-[#212328] space-y-1">
            <div className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Time remaining:</div>
            <div className="text-lg font-mono font-black text-red-400">
              {diffDays > 0 && <span>{diffDays}d </span>}
              {diffHours.toString().padStart(2, '0')}h : {diffMins.toString().padStart(2, '0')}m : {diffSecs.toString().padStart(2, '0')}s
            </div>
          </div>

          {/* Helpline listings inside block screen */}
          <div className="text-left space-y-2">
            <h4 className="text-[9.5px] text-gray-500 uppercase font-black tracking-wider flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-amber-500" />
              <span>Free Support Handshake Contacts</span>
            </h4>
            <div className="space-y-1.5 text-[10px]">
              <div className="bg-[#1b1c21] p-2 rounded-lg border border-[#252830] text-gray-300">
                <strong className="text-white block font-bold text-[10.5px]">Kenya Support Helpline (RGAK)</strong>
                <span>Counselling: <strong className="font-mono text-[#00e600]">+254 700 000 000</strong></span>
              </div>
              <div className="bg-[#1b1c21] p-2 rounded-lg border border-[#252830] text-gray-300">
                <strong className="text-white block font-bold text-[10.5px]">GambleAware International helpline</strong>
                <span>UK Free: <strong className="font-mono text-[#00e600]">+44 808 8020 133</strong></span>
              </div>
            </div>
          </div>

          {/* Developer Sandbox Override Bypass button */}
          <div className="pt-2 border-t border-[#23252a] space-y-1">
            <span className="text-[9px] text-gray-500 block font-mono">Sandbox Bypass Tool for Evaluation:</span>
            <button
              onClick={handleClearSelfExclusion}
              className="w-full py-2 bg-[#00e600]/10 hover:bg-[#00e600]/20 border border-[#00e600]/20 hover:border-[#00e600]/45 text-[#00e600] text-[9.5px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer"
            >
              🛠️ Sandbox Override: Liftoff Exclusion early
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!authSessionMode) {
    return (
      <WelcomingIntro 
        onLoginSuccess={(name, phoneStr, mode, referralCode) => {
          setAuthSessionMode(mode);
          
          if (referralCode && referralCode.trim() !== '') {
            const codeClean = referralCode.trim().toUpperCase();
            
            setWallet(w => {
              if (mode === 'real') {
                const nextReal = parseFloat((w.realBalance + 500.0).toFixed(2));
                return {
                  ...w,
                  realBalance: nextReal,
                  mainBalance: nextReal
                };
              } else {
                const nextDemo = parseFloat((w.demoBalance + 500.0).toFixed(2));
                return {
                  ...w,
                  demoBalance: nextDemo,
                  mainBalance: nextDemo
                };
              }
            });

            addTransaction({
              type: 'bonus_credit',
              amount: 500.0,
              currency: 'KSh',
              method: `Referral welcome bonus: ${codeClean}`,
            });

            setTimeout(() => {
              triggerNotification(
                '🎉 REFERRAL ACTIVATED!',
                `Referral promo code "${codeClean}" approved! KSh 500.00 welcome gift has been loaded to your wallet.`,
                'vip'
              );
            }, 150);
          }

          const todayStr = new Date().toISOString().split('T')[0];
          localStorage.setItem('casinohub_login_date', todayStr);

          if (mode === 'real') {
            const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            const cleanPhone = phoneStr.trim().replace(/[^0-9]/g, '');
            const lastFour = cleanPhone.length >= 4 ? cleanPhone.slice(-4) : '7777';
            const generatedCode = `REF-${cleanName}-${lastFour}`;

            setUserProfile(prev => ({
              ...prev,
              username: name.toLowerCase().replace(/\s+/g, '_'),
              phone: phoneStr,
              fullName: name,
              joinedDate: todayStr,
              referralCode: generatedCode
            }));
            triggerNotification(
              '🟢 REAL PLAY ACTIVE',
              `Greetings ${name}! You have successfully logged in under Real Play mode.`,
              'vip'
            );
          } else {
            setUserProfile(prev => ({
              ...prev,
              username: 'demo_player',
              fullName: 'Demo Player',
              joinedDate: todayStr,
              referralCode: 'REF-DEMOPLAYER-0000'
            }));
            triggerNotification(
              '🟣 DEMO PLAY RUNNING',
              'Enjoy free unlimited wagers in Aviator demo mode!',
              'general'
            );
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#0d0e10] text-gray-100 flex flex-col justify-start items-stretch p-0 relative antialiased overflow-y-auto">
      
      {/* Central Screen Frame */}
      <div className="w-full bg-[#0d0e10] flex flex-col shadow-none shrink-0 overflow-y-auto">
        
        {/* STICKY TOP DASHBOARD WRAPPER: Matches Mobile & Laptop Full-Page layout */}
        <div className="sticky top-0 z-40 bg-[#141518] flex flex-col shrink-0 border-b border-[#212327]/50 shadow-md">
          {/* Dynamic Session Limit Alert Banner */}
          {showSessionAlert && (
            <div className="bg-amber-950/85 border-b border-amber-500/15 px-4 py-2 flex items-center justify-between text-[11px] select-none animate-slideDown shrink-0">
              <div className="flex items-center gap-2 text-amber-300">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>Play Session limit reached!</strong> You have played for your self-imposed limit of {sessionLimit}m.
                </span>
              </div>
              <div className="flex gap-1.5 shrink-0 ml-1">
                <button
                  onClick={resetSessionTimer}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded text-[9.5px] uppercase cursor-pointer transition-colors"
                >
                  Reset Timer
                </button>
                <button
                  onClick={() => { setSessionLimit(null); resetSessionTimer(); }}
                  className="bg-white/5 hover:bg-white/10 text-gray-300 font-bold px-2 py-0.5 rounded text-[9.5px] uppercase cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* TOP BAR BRAND INDENT */}
          <AviatorHeader 
            balance={balance}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenResponsibleGaming={() => setIsResponsibleGamingOpen(true)}
            muted={muted}
            onToggleMute={handleToggleMute}
            currentView={currentView}
            setView={setView}
            notificationsCount={notifications.filter(n => !n.read).length}
            onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
            authSessionMode={authSessionMode}
            onToggleAuthSessionMode={handleToggleAuthSessionMode}
            userProfile={userProfile}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Alert Notifications Center pop-down drawer overlays */}
          <div className="relative">
            <NotificationsCenter 
              notifications={notifications}
              setNotifications={setNotifications}
              isOpen={isNotificationsOpen}
              setIsOpen={setIsNotificationsOpen}
            />
          </div>

          {/* VIEW NAVIGATION TABS */}
          <div className="bg-[#101114] px-3 py-1.5 flex items-center justify-between gap-1 select-none shrink-0 overflow-x-auto text-[10px] font-bold font-sans tracking-wide">
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => { setView('aviator'); setIsNotificationsOpen(false); }}
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${currentView === 'aviator' ? 'bg-[#e21515] text-[#fff] shadow-[0_0_12px_rgba(226,21,21,0.3)]' : 'bg-black/15 text-[#9b9da4] hover:text-[#d1d2d6]'}`}
              >
                <span>🚀</span>
                <span className="uppercase">JETCASH</span>
              </button>
              <button
                onClick={() => { setView('lobby'); setIsNotificationsOpen(false); }}
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${currentView === 'lobby' ? 'bg-purple-600 text-[#fff] shadow-[0_0_12px_rgba(147,51,234,0.3)]' : 'bg-black/15 text-[#9b9da4] hover:text-[#d1d2d6]'}`}
              >
                <span>🎰</span>
                <span className="uppercase">Casino Lobby</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsDepositOpen(true)}
                className="px-3 py-1.5 rounded bg-[#4ea300] hover:bg-[#5fc502] text-white font-black uppercase text-[10px] tracking-wider cursor-pointer flex items-center gap-1 shadow-[0_0_12px_rgba(78,163,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-100"
                title="M-Pesa Express Deposit"
              >
                <span>💳</span>
                <span>Deposit</span>
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="px-2.5 py-1.5 rounded bg-purple-950/20 hover:bg-purple-900/30 text-purple-400 border border-purple-900/30 hover:border-purple-500/40 text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all"
                title="Open Account Profile Detail"
              >
                <span className="text-[11px]">👤</span>
                <span>Profile</span>
              </button>

              <button
                onClick={() => setIsChatOpen(true)}
                className="px-2.5 py-1.5 rounded bg-amber-950/20 hover:bg-amber-900/30 text-amber-500 border border-amber-900/30 hover:border-amber-500/40 text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all"
                title="Open Global Lounge Chat"
              >
                <span className="text-[11px]">💬</span>
                <span>Chat</span>
              </button>
            </div>
          </div>
        </div>

        {currentView === 'aviator' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-fit bg-[#0d0e10]">
            {/* LEFT SIDEBAR: Multiplayer lobby statistics & lounge chats */}
            <div className="w-full md:w-[280px] lg:w-[320px] xl:w-[360px] shrink-0 border-r border-[#212327]/30 bg-[#0d0e10] flex flex-col overflow-y-auto order-2 md:order-1 h-auto md:p-3 pb-3 md:pb-3">
              <BetsLedger 
                myBets={myBets.filter(bet => (bet.mode || 'demo') === (authSessionMode === 'real' ? 'real' : 'demo'))}
                activePlayers={activePlayers}
                crashActive={crashActive}
                crashMultiplier={crashMultiplier}
                multipliers={historyList}
                roundIndex={roundIndex}
                userProfile={userProfile}
                chatMessages={chatMessages}
                onSendMessage={handleSendChatMessage}
                onlineCount={siteOnlineCount}
                onlinePlayersCount={onlinePlayersCount}
                className="h-full"
              />
            </div>

            {/* RIGHT MAIN STATION: Multiplier Ribbon, cockpit canvas and twin-bet consoles */}
            <div className="flex-1 flex flex-col order-1 md:order-2 h-auto bg-[#0d0e10]">
              {/* RECENT HISTORIC MULTIPLIERS STRIP */}
              <HistoryRibbon 
                multipliers={historyList}
              />

              {/* MIDDLE FLIGHT VIEWPORT CONTAINER */}
              <div className="p-2 sm:p-3 bg-[#0d0e10] flex-1 min-h-[250px] md:min-h-[160px] lg:min-h-[200px] xl:min-h-[250px] flex flex-col justify-center">
                <AviatorGameViewport 
                  crashActive={crashActive}
                  crashMultiplier={crashMultiplier}
                  crashStatusMessage={crashStatusMessage}
                  countdownValue={countdownValue}
                  onlinePlayersCount={onlinePlayersCount}
                  avatarList={(() => {
                    const alive = activePlayers.filter(p => !p.cashedOut);
                    const pool = alive.length >= 3 ? alive : activePlayers;
                    const mapped = pool.slice(0, 3).map(p => {
                      const clean = p.username.replace(/[^a-zA-Z]/g, '').toUpperCase();
                      return clean.substring(0, 2) || 'KM';
                    });
                    return mapped.length >= 3 ? mapped : ['KM', 'AM', 'NJ'];
                  })()}
                  authSessionMode={authSessionMode}
                />
              </div>

              {/* BOTTOM ACTIVE BET CONTROL CONSOLES - Side-by-side on all screens */}
              <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:gap-3 px-1.5 xs:px-2 sm:px-3 pb-2 sm:pb-3 bg-[#0d0e10] shrink-0">
                <AviatorBetPanel 
                  panelId="panel1"
                  balance={balance}
                  crashActive={crashActive}
                  crashMultiplier={crashMultiplier}
                  countdownActive={countdownValue !== null}
                  isPlaced={panel1Placed}
                  setIsPlaced={setPanel1Placed}
                  hasCashedOut={panel1Cashed}
                  setHasCashedOut={setPanel1Cashed}
                  onBetPlaced={(amt) => handleBetPlaced('panel1', amt)}
                  onCashOut={(mult, payout) => handleCashOut('panel1', mult, payout)}
                  onBetCancelled={(amt) => handleBetCancelled('panel1', amt)}
                  onRefill={handleRefill}
                  isDemo={authSessionMode === 'demo'}
                  isNextPlaced={panel1NextPlaced}
                  nextBetVal={panel1NextBetVal}
                  placedBetAmountProp={panel1BetVal}
                />

                <AviatorBetPanel 
                  panelId="panel2"
                  balance={balance}
                  crashActive={crashActive}
                  crashMultiplier={crashMultiplier}
                  countdownActive={countdownValue !== null}
                  isPlaced={panel2Placed}
                  setIsPlaced={setPanel2Placed}
                  hasCashedOut={panel2Cashed}
                  setHasCashedOut={setPanel2Cashed}
                  onBetPlaced={(amt) => handleBetPlaced('panel2', amt)}
                  onCashOut={(mult, payout) => handleCashOut('panel2', mult, payout)}
                  onBetCancelled={(amt) => handleBetCancelled('panel2', amt)}
                  onRefill={handleRefill}
                  isDemo={authSessionMode === 'demo'}
                  isNextPlaced={panel2NextPlaced}
                  nextBetVal={panel2NextBetVal}
                  placedBetAmountProp={panel2BetVal}
                />
              </div>
            </div>
          </div>
        )}

        {currentView === 'lobby' && (
          <div className="flex-1 overflow-y-auto p-4 bg-[#0d0e10] text-[#eaeaea] scrollbar-thin scrollbar-thumb-purple-900/30 font-sans">
            <CasinoGames 
              wallet={wallet}
              setWallet={setWallet}
              addTransaction={addTransaction}
              triggerNotification={triggerNotification}
              incrementJackpots={incrementJackpots}
              jackpotPool={jackpotPool}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              gameOfTheWeek={gameOfTheWeek}
              userProfile={userProfile}
              authSessionMode={authSessionMode}
              setUserProfile={setUserProfile}
              onLaunchAviator={() => { setView('aviator'); setIsNotificationsOpen(false); }}
            />
          </div>
        )}

        {currentView === 'admin' && (
          <div className="flex-1 overflow-y-auto p-4 bg-[#0a0515] scrollbar-thin scrollbar-thumb-purple-900/30">
            <AdminPanel 
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              wallet={wallet}
              setWallet={setWallet}
              jackpotPool={jackpotPool}
              setJackpotPool={setJackpotPool}
              transactions={transactions}
              addTransaction={addTransaction}
              triggerNotification={triggerNotification}
              gameOfTheWeek={gameOfTheWeek}
              setGameOfTheWeek={setGameOfTheWeek}
            />
          </div>
        )}

        {/* Interactive M-Pesa STK Cashier drawer popup window */}
        {isDepositOpen && (
          <MpesaModal 
            onClose={() => setIsDepositOpen(false)}
            onDepositSuccess={handleDepositSuccess}
            onWithdrawSuccess={handleWithdrawSuccess}
            balance={balance}
            depositLimit={depositLimit}
            totalDepositedToday={totalDepositedToday}
            onOpenResponsibleGaming={() => {
              setIsDepositOpen(false);
              setIsResponsibleGamingOpen(true);
            }}
            authSessionMode={authSessionMode}
            onToggleAuthMode={handleToggleAuthSessionMode}
          />
        )}

        {/* Interactive Download Mobile Client package Overlay */}
        {isDownloadAppOpen && (
          <DownloadAppModal 
            isOpen={isDownloadAppOpen}
            onClose={() => setIsDownloadAppOpen(false)}
            onCreditWallet={handleAppInstallBonus}
            triggerNotification={triggerNotification}
          />
        )}

        {/* Responsible Gaming & Player Safety Settings Panel */}
        {isResponsibleGamingOpen && (
          <ResponsibleGamingModal 
            onClose={() => setIsResponsibleGamingOpen(false)}
            depositLimit={depositLimit}
            setDepositLimit={setDepositLimit}
            sessionLimit={sessionLimit}
            setSessionLimit={setSessionLimit}
            selfExcludedDays={null}
            onSelfExclude={handleSelfExclude}
            totalDepositedToday={totalDepositedToday}
            sessionTimeLeftSecs={sessionTimeLeftSecs}
            resetSessionTimer={resetSessionTimer}
            onResetDeposits={handleResetDepositedToday}
          />
        )}

        {/* Real-Aviator Styled Account Profile Panel Drawer */}
        <ProfilePanel 
          userProfile={userProfile}
          wallet={wallet}
          authSessionMode={authSessionMode}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onSignOut={handleSignOut}
          triggerNotification={triggerNotification}
          transactions={transactions}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleAuthSessionMode={handleToggleAuthSessionMode}
        />

        {/* Global Player Settings Menu Modal */}
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          muted={muted}
          onToggleMute={handleToggleMute}
          triggerNotification={triggerNotification}
        />

        {/* Global JetCash Lounge Chat Drawer */}
        <GlobalChatDrawer 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          userProfile={userProfile}
          messages={chatMessages}
          onSendMessage={handleSendChatMessage}
          onlineCount={siteOnlineCount}
        />

        {/* Switch mode safety assurance overlay warning */}
        {switchModeTargetState && (
          <div id="switch-mode-confirm-overlay" className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
            <div id="switch-mode-confirm-card" className="w-full max-w-sm bg-[#141518] border border-zinc-800 rounded-2xl p-5 shadow-[0_0_60px_rgba(0,0,0,0.9)] text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
                <AlertOctagon className="w-8 h-8 text-amber-500 animate-pulse" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Confirm Account Switch
                </h3>
                <p className="text-xs text-[#a3a5ae] leading-relaxed px-1">
                  {switchModeTargetState === 'real' ? (
                    <span>
                      You are about to switch to your <strong className="text-[#00e600]">REAL BALANCE COFFER</strong>. Bets placed in this mode are real cash transactions!
                    </span>
                  ) : (
                    <span>
                      You are about to switch to <strong className="text-purple-400">DEMO PRACTICE COFFER</strong>. Play is risk-free for fun & strategy tests.
                    </span>
                  )}
                </p>
              </div>

              <div className="bg-black/35 p-3 rounded-lg border border-zinc-800/60 text-left">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block">New Mode:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${switchModeTargetState === 'real' ? 'bg-[#00e600] animate-pulse' : 'bg-purple-400'}`}></span>
                  <span className="text-xs font-black text-rose-100 uppercase tracking-tight">
                    {switchModeTargetState === 'real' ? 'Real Play (KSh Wallet)' : 'Demo Play (Free Practice)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => setSwitchModeTargetState(null)}
                  className="py-2.5 bg-zinc-900 border border-zinc-800 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeToggleAuthSessionMode(switchModeTargetState)}
                  className={`py-2.5 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer border shadow-sm transition-all active:scale-[0.97] ${
                    switchModeTargetState === 'real'
                      ? 'bg-emerald-950/40 border-emerald-500/40 hover:bg-[#00e600]/20 text-[#00e600]'
                      : 'bg-purple-950/40 border-purple-500/40 hover:bg-purple-600/20 text-purple-300'
                  }`}
                >
                  Confirm Switch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BIG WIN CELEBRATION OVERLAY */}
        <AnimatePresence>
          {bigWinOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none overflow-hidden"
              onClick={() => setBigWinOverlay(null)}
            >
              {/* Confetti canvas items drifting downward */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 40 }).map((_, i) => {
                  const x = Math.random() * 100;
                  const size = Math.random() * 6 + 4;
                  const delay = Math.random() * 2;
                  const duration = 2.5 + Math.random() * 2.5;
                  const color = i % 3 === 0 ? '#fbbf24' : i % 2 === 0 ? '#10b981' : '#f59e0b';
                  return (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        left: `${x}%`,
                        width: size,
                        height: size,
                        backgroundColor: color,
                        top: '-10px',
                        boxShadow: `0 0 8px ${color}`,
                      }}
                      initial={{ y: -50, opacity: 0, rotate: 0 }}
                      animate={{ 
                        y: '105vh', 
                        opacity: [0, 1, 1, 0],
                        rotate: 360 
                      }}
                      transition={{ 
                        duration, 
                        repeat: Infinity,
                        delay,
                        ease: "linear"
                      }}
                    />
                  );
                })}
              </div>

              {/* Celebration Golden Box Modal Card */}
              <motion.div
                initial={{ scale: 0.3, y: 100, rotate: -5 }}
                animate={{ scale: 1, y: 0, rotate: 0 }}
                exit={{ scale: 0.3, y: 100, rotate: 5 }}
                transition={{ type: "spring", stiffness: 120, damping: 15 }}
                className="relative bg-gradient-to-b from-[#1c1236]/95 via-[#14151a]/95 to-[#0b0c0ed9] border-2 border-yellow-400 p-8 rounded-3xl max-w-sm w-full text-center shadow-[0_0_80px_rgba(251,191,36,0.55)] flex flex-col items-center gap-4 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Shining Golden Halo Rays in background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.12)_0%,transparent_70%)] pointer-events-none rounded-3xl" />

                {/* Sparkling icon layout */}
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 animate-bounce shadow-[0_0_25px_rgba(251,191,36,0.5)]">
                  <span className="text-4xl">🏆</span>
                  {/* Glowing small sparkles */}
                  <span className="absolute -top-1 -right-1 text-xl animate-pulse">✨</span>
                  <span className="absolute -bottom-1 -left-1 text-xl animate-pulse">✨</span>
                </div>

                {/* Bold Golden Header label */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-amber-400 font-mono font-bold">Awesome Flight Achievement</h3>
                  <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1 animate-pulse uppercase">
                    BIG WIN!
                  </h2>
                </div>

                {/* Display Multiplier Achievement */}
                <div className="bg-black/40 border border-yellow-400/20 px-6 py-2 rounded-2xl flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-widest text-[#9e9ea4] font-semibold">Cashed out Multiplier</span>
                  <div className="text-5xl font-sans font-black text-[#00e600] tracking-tight py-1">
                    {bigWinOverlay.multiplier.toFixed(2)}x
                  </div>
                </div>

                {/* Display Balance payout */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Winning Balance Payout</span>
                  <div className="text-3xl font-mono font-black text-white py-1">
                    KSh {bigWinOverlay.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-mono">
                    Credited Instantly to Real Balance
                  </div>
                </div>

                {/* Action Collect Button */}
                <button
                  onClick={() => setBigWinOverlay(null)}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:to-amber-500 text-black font-extrabold tracking-widest text-sm rounded-xl uppercase shadow-[0_4px_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer transform active:scale-95 duration-100"
                >
                  COLLECT MONEY
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
