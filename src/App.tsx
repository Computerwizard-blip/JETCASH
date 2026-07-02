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

// Compute deterministic round limit based on round index only to be identical on all devices
function getRoundLimit(roundIndex: number): number {
  let h = Math.abs(Math.sin(roundIndex) * 10000);
  h = h - Math.floor(h);

  // 0.5% chance of a high gold round (200x to 1000x)
  if (h > 0.995) {
    const p = (h - 0.995) / 0.005;
    return parseFloat((100.00 + p * 900.00).toFixed(2));
  }

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
    // Rare hits between 30.01x and 100.00x
    const p = (h - 0.95) / 0.045; // 0.95 to 0.995 is 0.045
    return parseFloat((30.01 + p * 69.99).toFixed(2));
  }
}

// Deterministic game state timeline calculations synced to the millisecond of the system clock
function getGameStateAtTime(now: number) {
  const dayMs = 86400000;
  const startOfDay = now - (now % dayMs);
  
  const dayIndex = Math.floor(startOfDay / dayMs);
  let roundIndex = dayIndex * 10000;
  
  let tempTime = startOfDay;
  const lobbyDuration = 6000;
  const crashedDuration = 2200;

  let currentPhase: 'lobby' | 'flight' | 'crashed' = 'lobby';
  let phaseStartTime = tempTime;
  let baseLimit = 1.00;
  let baseFlightDuration = 0;

  while (true) {
    baseLimit = getRoundLimit(roundIndex);
    baseFlightDuration = baseLimit <= 1.00 ? 0 : Math.round((Math.log(baseLimit) / 0.0866) * 1000);
    const roundDuration = lobbyDuration + baseFlightDuration + crashedDuration;

    if (tempTime + roundDuration > now) {
      const elapsedInRound = now - tempTime;
      
      if (elapsedInRound < lobbyDuration) {
        currentPhase = 'lobby';
        phaseStartTime = tempTime;
      } else if (elapsedInRound < lobbyDuration + baseFlightDuration) {
        currentPhase = 'flight';
        phaseStartTime = tempTime + lobbyDuration;
      } else {
        currentPhase = 'crashed';
        phaseStartTime = tempTime + lobbyDuration + baseFlightDuration;
      }
      break;
    }

    tempTime += roundDuration;
    roundIndex++;
  }

  return {
    roundIndex,
    currentPhase,
    phaseStartTime,
    baseLimit,
    baseFlightDuration,
    roundStartTime: tempTime
  };
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
  const [roundIndex, setRoundIndex] = useState<number>(() => getGameStateAtTime(Date.now()).roundIndex);
  const [currentPhase, setCurrentPhase] = useState<'lobby' | 'flight' | 'crashed'>('lobby');
  const [crashActive, setCrashActive] = useState<boolean>(false);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(1.00);
  const [crashStatusMessage, setCrashStatusMessage] = useState<string>("Ready KSh");
  const [countdownValue, setCountdownValue] = useState<number | null>(5.0);
  const [roundCrashLimit, setRoundCrashLimit] = useState<number>(2.50);

  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

  const currentPhaseRef = useRef<'lobby' | 'flight' | 'crashed'>('lobby');
  const crashMultiplierRef = useRef<number>(1.00);
  const roundCrashLimitRef = useRef<number>(2.50);
  
  const lastProcessedPhaseRef = useRef<'lobby' | 'flight' | 'crashed' | null>(null);
  const lastProcessedRoundRef = useRef<number>(-1);

  useEffect(() => {
    currentPhaseRef.current = currentPhase;
  }, [currentPhase]);

  useEffect(() => {
    crashMultiplierRef.current = crashMultiplier;
  }, [crashMultiplier]);

  useEffect(() => {
    roundCrashLimitRef.current = roundCrashLimit;
  }, [roundCrashLimit]);

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
  const [showMobileBets, setShowMobileBets] = useState<boolean>(false);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isDownloadAppOpen, setIsDownloadAppOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'm1', username: 'Kamau_KE', text: 'next round running bet tuko rada sana 🔥', timestamp: '09:12' },
    { id: 'm2', username: 'Wanjiku_Win', text: 'buda timing ya running bet sasa hivi ndio kila kitu', timestamp: '09:15' },
    { id: 'm3', username: 'Mwangi_001', text: 'buda prepare for next round running bet', timestamp: '09:20' },
    { id: 'm4', username: 'Amani_254', text: 'best time to start running bet is now', timestamp: '09:24' }
  ]);
  const [switchModeTargetState, setSwitchModeTargetState] = useState<'real' | 'demo' | null>(null);

  // Periodic simulated lounge chat banter
  const recentMessagesRef = useRef<string[]>([]);

  useEffect(() => {
    const generateSimulatedMessage = () => {
      const phase = currentPhaseRef.current;
      const mult = crashMultiplierRef.current;
      const lastLimit = roundCrashLimitRef.current;

      // Select a subset of active users based on the current minute block (e.g. changes every 3 minutes)
      // This simulates that players are not online all the time
      const timeBlock = Math.floor(Date.now() / (3 * 60 * 1000));
      const activePlayers = COMPANION_USERS.filter((_, index) => {
        const hash = Math.sin(timeBlock + index * 37) * 10000;
        const rand = hash - Math.floor(hash);
        return rand < 0.35; // ~35% chance to be active
      });

      // Fallback: make sure at least 3 players are online
      const currentActivePool = activePlayers.length >= 3 
        ? activePlayers 
        : [COMPANION_USERS[0], COMPANION_USERS[1], COMPANION_USERS[2], COMPANION_USERS[3]];

      // Pick a random sender from the currently online active pool
      const user = currentActivePool[Math.floor(Math.random() * currentActivePool.length)];

      let userPool: string[] = [];

      // Define user-specific styles to ensure variety and different vocabularies
      if (user === 'Kamau_KE') {
        if (phase === 'lobby') {
          userPool = [
            `buda next round running bet tuko ndani kabisa`,
            `weka running bet ya next round mapema wasee`,
            `buda prepare for next round running bet upesi`,
            `getting ready for the next round running bet`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `running bet yetu inapaa fiti mwanangu`,
            `shikilia hiyo running bet isonge juu mkuu`,
            `buda look at the running bet inavyopaa`,
            `this running bet is going high speed`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `imecrash haraka lakini next round running bet tuko rada`,
            `hapa tumegongwa mzee lakini next round tuko fiti`,
            `buda timing mbaya sana next round tutatoboa`,
            `bad timing but next round is the safe bet`
          ];
        } else {
          userPool = [
            `buda timing ya running bet ndio kila kitu`,
            `nani ako online tucheze next round running bet`,
            `weka running bet sasa hivi kabla round kuanza`,
            `perfect timing for next round running bet`
          ];
        }
      } else if (user === 'Amani_254') {
        if (phase === 'lobby') {
          userPool = [
            `subiri kwanza next round running bet ndio hiyo`,
            `mimi hapa nangojea coming next round running bet`,
            `tujiandae na running bet ya next round wasee`,
            `waiting for the next round running bet`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `running bet inapanda na kasi fiti`,
            `oya angalia vile running bet yetu inapaa`,
            `buda inapanda kwenda juu bila wasiwasi`,
            `this is an amazing running bet flight`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `imeanguka lakini coming next round running bet itakuwa safe`,
            `pole sana wasee next round tutaitwanga vizuri`,
            `tumeumia round hii lakini next round tutatoboa`,
            `it crashed but next round is definitely ours`
          ];
        } else {
          userPool = [
            `buda sasa ndio wakati fiti wa running bet`,
            `always target next round running bet kwa wakati`,
            `weka running bet sasa bila kuchelewa`,
            `the right time for running bet is now`
          ];
        }
      } else if (user === 'Mpesa_King') {
        if (phase === 'lobby') {
          userPool = [
            `mpesa iko tayari kwa next round running bet`,
            `coming next round running bet tujiandae kuweka`,
            `weka mpesa tayari roundi hii inakuja fiti`,
            `preparing cash for the next round running bet`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `running bet inapanda na multiplier inakaa safi`,
            `weka kidole karibu kucashout running bet`,
            `running bet inapendeza inavyozidi kwenda juu`,
            `the multiplier looks good on running bet`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `ime crash lakini next round tutabeba doh na running bet`,
            `tuta recover hasara next round running bet ikianza`,
            `imecrash haraka lakini next round tuko fiti kabisa`,
            `we lost that one but next round is active`
          ];
        } else {
          userPool = [
            `running bet inalipa vizuri mpesa ishasoma`,
            `buda withdraw sasa hivi baada ya running bet`,
            `doh inasomeka mpesa baada ya running bet`,
            `easy withdrawal after next round running bet`
          ];
        }
      } else if (user === 'Wanjiku_Win') {
        if (phase === 'lobby') {
          userPool = [
            `running bet ya next round itakuwa kubwa wasee`,
            `tujiunge sote kwa next round running bet`,
            `subiri kidogo next round tujiandae kuweka`,
            `holding cash for the coming next round`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `running bet inazidi kupaa kwenda juu`,
            `hii running bet ya sasa hivi inatupa furaha`,
            `angalia inavyozidi kupaa kwa kasi`,
            `aiming for the high peak on this running bet`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `ime crash mzee lakini next round running bet iko safe`,
            `tujaribu bahati yetu kwa next round running bet`,
            `ime crash mapema mzee next round tutashinda`,
            `unfortunate crash but we go next round`
          ];
        } else {
          userPool = [
            `wakati mzuri wa kucheza running bet ndio huu`,
            `running bet inaleta ushindi fiti sana`,
            `tuweke running bet kwa wakati fiti`,
            `good luck everyone in the next round`
          ];
        }
      } else if (user === 'Mwangi_001') {
        if (phase === 'lobby') {
          userPool = [
            `next round running bet tuko rada mbaya sana`,
            `wasee coming next round running bet isha load`,
            `weka running bet ya next round upesi mzee`,
            `lobby is full for next round running bet`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `oya ona vile running bet inapaa na hasira`,
            `shikilia hiyo running bet isigonge crash mapema`,
            `inapaa vizuri mzee usitoe mapema mno`,
            `look at the running bet multiplier climbing`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `aiii imecrash mapema lakini next round tutatoboa`,
            `nilichelewa nusu sekunde kucashout running bet`,
            `ime crash mwanangu lakini next round tuko fiti`,
            `it crashed so fast but next round we try`
          ];
        } else {
          userPool = [
            `buda tuchape sheng tu na next round running bet`,
            `sasa ndio wakati wa kuweka hiyo running bet`,
            `running bet yetu ya next round ndio siri`,
            `keep your focus on the next round`
          ];
        }
      } else if (user === 'Otieno_Hustler') {
        if (phase === 'lobby') {
          userPool = [
            `hustler yuko tayari kwa next round running bet`,
            `buda weka running bet ya next round upesi`,
            `hapa tuko tayari kwa next round running bet`,
            `ready for the next round running bet run`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `hapa ndio wakati running bet inatupa faida`,
            `angalia running bet inazidi kwenda juu sana`,
            `running bet inapaa fiti mzee tushikilie`,
            `this running bet is flying to the peak`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `imeanguka lakini coming next round running bet iko safi`,
            `crashed mwanangu lakini next round tuko rada fiti`,
            `imeanguka mapema mno mzee next round tuko rada`,
            `unlucky crash but next round we ride again`
          ];
        } else {
          userPool = [
            `kazi bado inaendelea na next round running bet`,
            `buda timing ya running bet sasa hivi ndio fiti kabisa`,
            `weka running bet mapema mzee bila uoga`,
            `always on the watch for the next round`
          ];
        }
      } else if (user === 'ShillingSlinger') {
        if (phase === 'lobby') {
          userPool = [
            `shilingi ziko tayari kwa next round running bet`,
            `buda tujiunge kwenye lobby ya next round running bet`,
            `tunaweka running bet ya next round sasa hivi`,
            `joining the lobby for the next round bet`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `running bet inakaa safi na inapanda vizuri`,
            `multiplier ya running bet inatupa faida kubwa`,
            `running bet inapaa fiti sana roundi hii`,
            `this is a very successful running bet run`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `tumekosa hiyo lakini next round running bet ndio mpango`,
            `imecrash lakini tujiandae kwa next round running bet`,
            `imecrash haraka mzee next round tutafaulu`,
            `early crash_but next round we go again`
          ];
        } else {
          userPool = [
            `running bet inaleta faida ya haraka leo`,
            `buda weka bidii kwa running bet sasa hivi`,
            `wakati mzuri wa running bet ndio huu mzee`,
            `shillings active on the running bet now`
          ];
        }
      } else if (user === 'Njoroge_Bettor') {
        if (phase === 'lobby') {
          userPool = [
            `nimefanya hesabu ya next round running bet`,
            `wakati wa kupanga running bet ya next round ndio huu`,
            `hesabu ya running bet next round iko fiti`,
            `calculating entry for the next round bet`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `running bet inapanda kwa kasi ya kawaida`,
            `hesabu ya running bet ya sasa hivi iko sawa kabisa`,
            `angalia vile multiplier inavyopanda kwa usawa`,
            `monitoring the running bet multiplier speed`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `imecrash lakini next round running bet ndio focus yetu`,
            `tujiandae kwa running bet ya next round mara moja`,
            `ime crash mapema hesabu ya next round tuko rada`,
            `unfortunate result but next round is clear`
          ];
        } else {
          userPool = [
            `timing ya running bet sasa hivi iko sawa kabisa`,
            `mzee hesabu haidanganyi kwa running bet`,
            `buda timing ndio siri ya running bet yetu`,
            `stay focused on the next round multiplier`
          ];
        }
      } else if (user === 'Kibet_Racer') {
        if (phase === 'lobby') {
          userPool = [
            `mbio hadi next round running bet wasee`,
            `running bet ya next round ishaanza kuwa tayari`,
            `kimbia uweke running bet ya next round mapema`,
            `getting fast ready for the next round`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `kasi ya running bet sasa hivi ni ya ajabu`,
            `running bet inapiga mbio kwenda juu fiti`,
            `inapaa kwa kasi mzee cashout mapema`,
            `this running bet is flying super fast`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `ime crash kwa kasi lakini next round tuko fiti`,
            `bad timing lakini next round running bet tutakimbia nayo`,
            `ime crash haraka mno next round tutatoboa`,
            `speed crash but next round is a safe run`
          ];
        } else {
          userPool = [
            `running bet inalipa haraka sana leo mkuu`,
            `buda kasi ya running bet ndio siri hapa`,
            `weka running bet ya sasa hivi kwa mbio`,
            `fast cash is waiting on the next round`
          ];
        }
      } else if (user === 'Zuri_Zuri') {
        if (phase === 'lobby') {
          userPool = [
            `subiri kidogo coming next round running bet tujiandae`,
            `running bet ya next round itakuwa nzuri sana`,
            `amani wasee next round running bet inakuja`,
            `let us wait for the next round running bet`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `running bet inapendeza inavyozidi kupanda`,
            `kasi ya running bet ya sasa hivi ni safi kabisa`,
            `tunaenda mbali na hii running bet mzee`,
            `this running bet flight looks beautiful`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `pole sana lakini coming next round running bet tutashinda`,
            `jaribu tena next round running bet bila wasiwasi`,
            `imecrash mzee lakini next round tutashinda tena`,
            `it crashed but coming next round is safe`
          ];
        } else {
          userPool = [
            `mungu mbele tutakula next round running bet`,
            `running bet yetu iko sawa kabisa leo mzee`,
            `ushindi utapatikana kwa running bet roundi ijayo`,
            `peace and big wins on the next round`
          ];
        }
      } else if (user === 'Mama_Mboga_VIP') {
        if (phase === 'lobby') {
          userPool = [
            `tayari kwa next round running bet soko safi`,
            `running bet ya next round inakaa kuleta faida kubwa`,
            `soko inafunguliwa kwa next round running bet`,
            `market is ready for next round running bet`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `running bet inapanda bei fiti sana`,
            `angalia running bet ya sasa inavyotupa faida`,
            `soko yetu ya running bet inapanda sana leo`,
            `the multiplier is rising for our running bet`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `soko imecrash lakini next round tutafaulu fiti`,
            `next round running bet tutapata faida yetu mzee`,
            `soko imeanguka next round running bet tuko ndani`,
            `early crash but next round we sell better`
          ];
        } else {
          userPool = [
            `biashara ya running bet inalipa vizuri sana`,
            `buda soko ya running bet sasa hivi iko sawa`,
            `faida kubwa inapatikana kwenye running bet sasa`,
            `next round is always profitable for us`
          ];
        }
      } else {
        if (phase === 'lobby') {
          userPool = [
            `next round running bet tujiandae kuweka mapema`,
            `coming next round running bet inaload fiti`,
            `weka running bet yako ya next round upesi`,
            `ready for the next round running bet`
          ];
        } else if (phase === 'flight') {
          userPool = [
            `running bet inazidi kwenda juu sana`,
            `oya angalia running bet yetu inapaa`,
            `running bet inapaa fiti mzee tushikilie`,
            `running bet is going up nicely now`
          ];
        } else if (phase === 'crashed') {
          userPool = [
            `ime crash mzee lakini next round tuko fiti`,
            `tutajaribu tena next round running bet`,
            `ime crash mapema mzee next round tutafaulu`,
            `crashed but next round is safe to bet`
          ];
        } else {
          userPool = [
            `buda timing ya running bet ndio siri ya ushindi`,
            `always target next round running bet fiti`,
            `timing ya running bet sasa hivi ndio siri`,
            `perfect timing for next round running bet`
          ];
        }
      }

      // Special handling for crash limit above 4x
      if (phase === 'crashed' && lastLimit > 4) {
        if (user === 'Kamau_KE') {
          userPool = [
            `buda hiyo ilikuwa ushindi mkubwa wa running bet juu ya 4x`,
            `yaani imegonga over 4x na nime crash mapema sana mkuu`,
            `congrats kwa wale walishikilia hiyo running bet hadi over 4x`,
            `buda nimegongwa nikiwa bado nangojea running bet igonge 4x`,
            `that was a massive win on the running bet above 4x`
          ];
        } else if (user === 'Amani_254') {
          userPool = [
            `ushindi mzuri sana wa running bet kuvuka multiplier ya 4x`,
            `pole sana nime crash mapema mno kwenye hiyo running bet kubwa`,
            `wow pongezi kwa kila mtu aliyeshikilia running bet hadi past 4x`,
            `timing mbaya nilipoteza running bet baada ya kungojea sana`,
            `great run for the running bet exceeding 4x multiplier`
          ];
        } else if (user === 'Mpesa_King') {
          userPool = [
            `payout kubwa sana ya running bet juu ya 4x mpesa ishasoma`,
            `nilipoteza running bet baada ya 4x imecrash haraka sana`,
            `hongera kwa wote waliogonga 4x multiplier kwenye running bet`,
            `sina bahati nilitoka mapema wakati running bet inagonga 4x`,
            `big payout for the running bet above 4x mpesa ready`
          ];
        } else if (user === 'Wanjiku_Win') {
          userPool = [
            `ushindi wa ajabu kwenye running bet kupita 4x multiplier`,
            `kwa bahati mbaya nilikosa hiyo running bet tamu juu ya 4x`,
            `pongezi kwa washindi wote kwenye hii running bet ya over 4x`,
            `tamaa yangu ilifanya nipoteze running bet baada ya kungojea 4x`,
            `amazing win on the running bet past 4x multiplier`
          ];
        } else if (user === 'Mwangi_001') {
          userPool = [
            `running bet hadi mwezini juu ya 4x pongezi wasee`,
            `aiii imecrash after 4x nilichelewa nusu sekunde yaani`,
            `sheng tu hiyo running bet multiplier ya 4x ilikuwa crazy`,
            `buda nilitolewa mapema sana kabla running bet igonge 4x`,
            `running bet to the moon over 4x congrats guys`
          ];
        } else if (user === 'Otieno_Hustler') {
          userPool = [
            `hustle inalipa vizuri na hiyo running bet ya juu ya 4x`,
            `bahati mbaya crash baada ya 4x kwenye running bet next round mkuu`,
            `timing safi kwa walio cashout juu ya 4x kwenye running bet`,
            `buda running bet imegonga 4x na mimi nilitoka mapema`,
            `hustle paying well with that 4x plus running bet`
          ];
        } else if (user === 'ShillingSlinger') {
          userPool = [
            `shilingi ziko safi sana na running bet juu ya 4x mzee`,
            `nime crash mapema mno nikakosa hiyo running bet ya 4x`,
            `ushindi mzuri sana wa running bet past 4x pongezi wasee`,
            `nilipoteza running bet yangu baada ya kungoja multiplier ya 4x`,
            `shillings looking super nice with the running bet above 4x`
          ];
        } else if (user === 'Njoroge_Bettor') {
          userPool = [
            `hesabu imekubali running bet imegonga juu ya 4x pongezi`,
            `matokeo mabaya nimepoteza running bet nikilenga juu ya 4x`,
            `pongezi kwa wote waliobaki juu ya 4x kwenye running bet`,
            `analysis ilifeli nikacrash kwenye running bet kupita 4x`,
            `perfect simulation running bet hit over 4x congrats`
          ];
        } else if (user === 'Kibet_Racer') {
          userPool = [
            `kasi ya ajabu running bet kupita 4x pongezi wasee`,
            `nime crash kwa kasi ya juu ya 4x kwenye running bet`,
            `mbio safi kwenye running bet ikigonga zaidi ya 4x`,
            `kasi ilizidi nikacrash kabla ya kufikisha running bet 4x`,
            `insane speed running bet past 4x congratulations`
          ];
        } else if (user === 'Zuri_Zuri') {
          userPool = [
            `pongezi kubwa kwa ushindi wa running bet juu ya 4x mzee`,
            `pole sana nimepoteza running bet yangu baada ya 4x`,
            `mungu mbele ushindi mkubwa wa running bet 4x umepatikana`,
            `nimechelewa kucashout kwa running bet hadi ikacrash past 4x`,
            `congratulations on the running bet above 4x multiplier`
          ];
        } else if (user === 'Mama_Mboga_VIP') {
          userPool = [
            `faida kubwa sana na running bet juu ya 4x biashara safi`,
            `soko imecrash baada ya 4x nikapoteza running bet yangu mzee`,
            `hongera kwa waliofikisha running bet mbali juu ya 4x`,
            `nilitoka mapema mno kabla ya running bet kugonga 4x soko fiti`,
            `market was amazing running bet hit over 4x successfully`
          ];
        } else {
          userPool = [
            `pongezi kwa kila mtu aliyewahi running bet juu ya 4x`,
            `bahati mbaya crash baada ya 4x kwenye running bet next round`,
            `ushindi mzuri wa running bet kupita multiplier ya 4x`,
            `nilipoteza running bet yangu baada ya kungoja over 4x`,
            `unfortunate loss on the running bet after waiting too long`
          ];
        }
      }

      // Try to find a phrase that is NOT in our recent messages list
      let chosenText = '';
      let attempts = 0;
      while (attempts < 20) {
        const candidate = userPool[Math.floor(Math.random() * userPool.length)];
        if (!recentMessagesRef.current.includes(candidate)) {
          chosenText = candidate;
          break;
        }
        attempts++;
      }
      if (!chosenText) {
        // Fallback: modify a random one slightly so it is unique
        const candidate = userPool[Math.floor(Math.random() * userPool.length)];
        const extraWords = [' sasa', ' mkuu', ' wasee', ' buda', ' kweli', ' safe', ' man', ' guy'];
        const word = extraWords[Math.floor(Math.random() * extraWords.length)];
        chosenText = `${candidate}${word}`;
      }

      // Force starting with a lowercase letter and remove any accidental punctuation
      if (chosenText) {
        chosenText = chosenText.charAt(0).toLowerCase() + chosenText.slice(1);
        chosenText = chosenText.replace(/[!.?,]/g, '');
      }

      // 10% chance to append realistic human-texted emoji(s)
      if (Math.random() < 0.10) {
        let emojisList: string[] = [];
        if (phase === 'flight') {
          emojisList = [' 🔥', ' 🚀', ' 🤑', ' 💰', ' 😎', ' 🚀🔥', ' 💰💰', ' 🙌', ' 📈', ' 🔥🔥', ' 🤑🔥'];
        } else if (phase === 'crashed') {
          emojisList = [' 😭', ' 🤦', ' 💔', ' 📉', ' 💀', ' 😭😂', ' 💀💀', ' 🥴', ' 😡', ' 🤦‍♂️', ' 😭💔'];
        } else if (phase === 'lobby') {
          emojisList = [' 🤞', ' 🙏', ' 👍', ' 💯', ' 🙏🤞', ' 👍👍', ' 🤞🤞', ' 💯🔥', ' 🔥', ' 🚀'];
        } else {
          emojisList = [' 😂', ' 🔥', ' 👍', ' 😎', ' 🙌', ' 💀', ' 😂😂', ' 🙏', ' 💯', ' 💀💀', ' 🔥🔥'];
        }
        const chosenEmoji = emojisList[Math.floor(Math.random() * emojisList.length)];
        chosenText += chosenEmoji;
      }

      // Track the message in our recent history
      recentMessagesRef.current.push(chosenText);
      if (recentMessagesRef.current.length > 25) {
        recentMessagesRef.current.shift();
      }

      const newMsg: ChatMessage = {
        id: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        username: user,
        text: chosenText,
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
    let formattedText = text.trim();
    if (formattedText) {
      formattedText = formattedText.charAt(0).toLowerCase() + formattedText.slice(1);
    }
    if (socketConnected && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'CHAT_MESSAGE',
        sender: userProfile.username || 'francypendy',
        text: formattedText,
        vipLevel: userProfile.vipLevel || 'Bronze'
      }));
    } else {
      const newMsg: ChatMessage = {
        id: `me-${Date.now()}`,
        username: userProfile.username || 'francypendy',
        text: formattedText,
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

  // For Real Account
  const [realPanel1Placed, setRealPanel1Placed] = useState<boolean>(false);
  const [realPanel1Cashed, setRealPanel1Cashed] = useState<boolean>(false);
  const [realPanel1BetVal, setRealPanel1BetVal] = useState<number>(0);
  const [realPanel1NextPlaced, setRealPanel1NextPlaced] = useState<boolean>(false);
  const [realPanel1NextBetVal, setRealPanel1NextBetVal] = useState<number>(0);

  const [realPanel2Placed, setRealPanel2Placed] = useState<boolean>(false);
  const [realPanel2Cashed, setRealPanel2Cashed] = useState<boolean>(false);
  const [realPanel2BetVal, setRealPanel2BetVal] = useState<number>(0);
  const [realPanel2NextPlaced, setRealPanel2NextPlaced] = useState<boolean>(false);
  const [realPanel2NextBetVal, setRealPanel2NextBetVal] = useState<number>(0);

  // For Demo Account
  const [demoPanel1Placed, setDemoPanel1Placed] = useState<boolean>(false);
  const [demoPanel1Cashed, setDemoPanel1Cashed] = useState<boolean>(false);
  const [demoPanel1BetVal, setDemoPanel1BetVal] = useState<number>(0);
  const [demoPanel1NextPlaced, setDemoPanel1NextPlaced] = useState<boolean>(false);
  const [demoPanel1NextBetVal, setDemoPanel1NextBetVal] = useState<number>(0);

  const [demoPanel2Placed, setDemoPanel2Placed] = useState<boolean>(false);
  const [demoPanel2Cashed, setDemoPanel2Cashed] = useState<boolean>(false);
  const [demoPanel2BetVal, setDemoPanel2BetVal] = useState<number>(0);
  const [demoPanel2NextPlaced, setDemoPanel2NextPlaced] = useState<boolean>(false);
  const [demoPanel2NextBetVal, setDemoPanel2NextBetVal] = useState<number>(0);

  const isReal = authSessionMode === 'real';

  const panel1Placed = isReal ? realPanel1Placed : demoPanel1Placed;
  const setPanel1Placed = isReal ? setRealPanel1Placed : setDemoPanel1Placed;
  const panel1Cashed = isReal ? realPanel1Cashed : demoPanel1Cashed;
  const setPanel1Cashed = isReal ? setRealPanel1Cashed : setDemoPanel1Cashed;
  const panel1BetVal = isReal ? realPanel1BetVal : demoPanel1BetVal;
  const setPanel1BetVal = isReal ? setRealPanel1BetVal : setDemoPanel1BetVal;
  const panel1NextPlaced = isReal ? realPanel1NextPlaced : demoPanel1NextPlaced;
  const setPanel1NextPlaced = isReal ? setRealPanel1NextPlaced : setDemoPanel1NextPlaced;
  const panel1NextBetVal = isReal ? realPanel1NextBetVal : demoPanel1NextBetVal;
  const setPanel1NextBetVal = isReal ? setRealPanel1NextBetVal : setDemoPanel1NextBetVal;

  const panel2Placed = isReal ? realPanel2Placed : demoPanel2Placed;
  const setPanel2Placed = isReal ? setRealPanel2Placed : setDemoPanel2Placed;
  const panel2Cashed = isReal ? realPanel2Cashed : demoPanel2Cashed;
  const setPanel2Cashed = isReal ? setRealPanel2Cashed : setDemoPanel2Cashed;
  const panel2BetVal = isReal ? realPanel2BetVal : demoPanel2BetVal;
  const setPanel2BetVal = isReal ? setRealPanel2BetVal : setDemoPanel2BetVal;
  const panel2NextPlaced = isReal ? realPanel2NextPlaced : demoPanel2NextPlaced;
  const setPanel2NextPlaced = isReal ? setRealPanel2NextPlaced : setDemoPanel2NextPlaced;
  const panel2NextBetVal = isReal ? realPanel2NextBetVal : demoPanel2NextBetVal;
  const setPanel2NextBetVal = isReal ? setRealPanel2NextBetVal : setDemoPanel2NextBetVal;

  // Growth loop ticker references
  const mainTickerInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  // Synchronized Multi-Device Ticker Refs
  const panel1ActiveBetRef = useRef<{ demo: number | null; real: number | null }>({ demo: null, real: null });
  const panel2ActiveBetRef = useRef<{ demo: number | null; real: number | null }>({ demo: null, real: null });
  const panel1NextRoundBetRef = useRef<{ demo: number | null; real: number | null }>({ demo: null, real: null });
  const panel2NextRoundBetRef = useRef<{ demo: number | null; real: number | null }>({ demo: null, real: null });
  const panel1BetModeRef = useRef<'demo' | 'real' | null>(null);
  const panel2BetModeRef = useRef<'demo' | 'real' | null>(null);
  const panel1NextRoundBetModeRef = useRef<'demo' | 'real' | null>(null);
  const panel2NextRoundBetModeRef = useRef<'demo' | 'real' | null>(null);
  const bothBetsPlacedInRoundRef = useRef<boolean>(false);
  const gamePhaseRef = useRef<'lobby' | 'flight' | 'crashed' | null>(null);
  const currentRoundIndexRef = useRef<number>(-1);

  // Helper to transition next round pre-placed bets for both modes independently
  const transitionNextRoundBets = () => {
    // Panel 1 Real
    if (panel1NextRoundBetRef.current.real !== null) {
      panel1ActiveBetRef.current.real = panel1NextRoundBetRef.current.real;
      panel1NextRoundBetRef.current.real = null;
      setRealPanel1Placed(true);
      setRealPanel1Cashed(false);
      setRealPanel1BetVal(panel1ActiveBetRef.current.real);
    } else {
      setRealPanel1Placed(false);
      setRealPanel1Cashed(false);
      setRealPanel1BetVal(0);
    }
    setRealPanel1NextPlaced(false);
    setRealPanel1NextBetVal(0);

    // Panel 1 Demo
    if (panel1NextRoundBetRef.current.demo !== null) {
      panel1ActiveBetRef.current.demo = panel1NextRoundBetRef.current.demo;
      panel1NextRoundBetRef.current.demo = null;
      setDemoPanel1Placed(true);
      setDemoPanel1Cashed(false);
      setDemoPanel1BetVal(panel1ActiveBetRef.current.demo);
    } else {
      setDemoPanel1Placed(false);
      setDemoPanel1Cashed(false);
      setDemoPanel1BetVal(0);
    }
    setDemoPanel1NextPlaced(false);
    setDemoPanel1NextBetVal(0);

    // Panel 2 Real
    if (panel2NextRoundBetRef.current.real !== null) {
      panel2ActiveBetRef.current.real = panel2NextRoundBetRef.current.real;
      panel2NextRoundBetRef.current.real = null;
      setRealPanel2Placed(true);
      setRealPanel2Cashed(false);
      setRealPanel2BetVal(panel2ActiveBetRef.current.real);
    } else {
      setRealPanel2Placed(false);
      setRealPanel2Cashed(false);
      setRealPanel2BetVal(0);
    }
    setRealPanel2NextPlaced(false);
    setRealPanel2NextBetVal(0);

    // Panel 2 Demo
    if (panel2NextRoundBetRef.current.demo !== null) {
      panel2ActiveBetRef.current.demo = panel2NextRoundBetRef.current.demo;
      panel2NextRoundBetRef.current.demo = null;
      setDemoPanel2Placed(true);
      setDemoPanel2Cashed(false);
      setDemoPanel2BetVal(panel2ActiveBetRef.current.demo);
    } else {
      setDemoPanel2Placed(false);
      setDemoPanel2Cashed(false);
      setDemoPanel2BetVal(0);
    }
    setDemoPanel2NextPlaced(false);
    setDemoPanel2NextBetVal(0);

    bothBetsPlacedInRoundRef.current = false;
  };

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

    if (panel1ActiveBetRef.current.real !== null && panel1ActiveBetRef.current.real > 0) {
      checkBet(panel1ActiveBetRef.current.real, 'real');
    }
    if (panel1ActiveBetRef.current.demo !== null && panel1ActiveBetRef.current.demo > 0) {
      checkBet(panel1ActiveBetRef.current.demo, 'demo');
    }
    if (panel2ActiveBetRef.current.real !== null && panel2ActiveBetRef.current.real > 0) {
      checkBet(panel2ActiveBetRef.current.real, 'real');
    }
    if (panel2ActiveBetRef.current.demo !== null && panel2ActiveBetRef.current.demo > 0) {
      checkBet(panel2ActiveBetRef.current.demo, 'demo');
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
    // Panel 1 Real
    const lostRealAmt1 = panel1ActiveBetRef.current.real;
    if (lostRealAmt1 !== null) {
      setMyBets(prev => [
        {
          amount: lostRealAmt1,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'LOST',
          mode: 'real',
          timestamp: Date.now()
        },
        ...prev
      ]);
      panel1ActiveBetRef.current.real = null;
      setRealPanel1Placed(false);
      setRealPanel1BetVal(0);
    }
    // Panel 1 Demo
    const lostDemoAmt1 = panel1ActiveBetRef.current.demo;
    if (lostDemoAmt1 !== null) {
      setMyBets(prev => [
        {
          amount: lostDemoAmt1,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'LOST',
          mode: 'demo',
          timestamp: Date.now()
        },
        ...prev
      ]);
      panel1ActiveBetRef.current.demo = null;
      setDemoPanel1Placed(false);
      setDemoPanel1BetVal(0);
    }

    // Panel 2 Real
    const lostRealAmt2 = panel2ActiveBetRef.current.real;
    if (lostRealAmt2 !== null) {
      setMyBets(prev => [
        {
          amount: lostRealAmt2,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'LOST',
          mode: 'real',
          timestamp: Date.now()
        },
        ...prev
      ]);
      panel2ActiveBetRef.current.real = null;
      setRealPanel2Placed(false);
      setRealPanel2BetVal(0);
    }
    // Panel 2 Demo
    const lostDemoAmt2 = panel2ActiveBetRef.current.demo;
    if (lostDemoAmt2 !== null) {
      setMyBets(prev => [
        {
          amount: lostDemoAmt2,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'LOST',
          mode: 'demo',
          timestamp: Date.now()
        },
        ...prev
      ]);
      panel2ActiveBetRef.current.demo = null;
      setDemoPanel2Placed(false);
      setDemoPanel2BetVal(0);
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
    const baseIndex = getGameStateAtTime(Date.now()).roundIndex;
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
      const state = getGameStateAtTime(now);
      const elapsed = now - state.phaseStartTime;
      const limit = state.baseLimit;

      // Handle round transition (e.g. round changed or first load)
      if (state.roundIndex !== lastProcessedRoundRef.current) {
        lastProcessedRoundRef.current = state.roundIndex;
        setRoundIndex(state.roundIndex);
        generateSimulatedLobbyBettors(state.roundIndex);
      }

      // Handle phase transition
      if (state.currentPhase !== lastProcessedPhaseRef.current) {
        lastProcessedPhaseRef.current = state.currentPhase;
        setCurrentPhase(state.currentPhase);

        if (state.currentPhase === 'lobby') {
          setCountdownValue(6.0);
          setCrashActive(false);
          setCrashMultiplier(1.00);
          setCrashStatusMessage("Lobby Loaded");
          setRoundCrashLimit(limit);
          transitionNextRoundBets();
        } else if (state.currentPhase === 'flight') {
          setCrashActive(true);
          setCountdownValue(null);
          setRoundCrashLimit(limit);
          setStartingPlayers(onlinePlayersCount);
          bothBetsPlacedInRoundRef.current = (panel1ActiveBetRef.current !== null && panel2ActiveBetRef.current !== null);
          if (currentView === 'aviator') {
            audioEngine.playFlightStart();
          }
        } else if (state.currentPhase === 'crashed') {
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
          
          setHistoryList(prev => {
            if (prev.includes(limit)) return prev;
            const nextList = [limit, ...prev];
            return nextList.slice(0, 30);
          });
        }
      }

      // Continuous ticks inside each phase
      if (state.currentPhase === 'lobby') {
        const lobbyDuration = 6000;
        const countdownVal = parseFloat(((lobbyDuration - elapsed) / 1000).toFixed(1));
        setCountdownValue(Math.max(0, countdownVal));

        if (Math.random() < 0.15) {
          setOnlinePlayersCount(prev => {
            const jitter = Math.floor(Math.random() * 5) - 2;
            const nextVal = prev + jitter;
            const maxAllowed = Math.floor(siteOnlineCountRef.current * 0.94);
            return Math.min(maxAllowed, Math.max(1200, nextVal));
          });
        }
      } else if (state.currentPhase === 'flight') {
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
          remainingFraction = 1.0 - (scaleFraction * 0.12) + (Math.sin(currentScale * 12) * 0.003);
        } else {
          const scaleFraction = Math.max(0, Math.min(1, (currentScale - 1.99) / (limit - 1.99 || 1.0)));
          const floorFrac = 0.035;
          remainingFraction = 0.88 - Math.pow(scaleFraction, 1.6) * (0.88 - floorFrac) + (Math.sin(currentScale * 4) * 0.002);
        }
        remainingFraction = Math.max(0.03, Math.min(1.0, remainingFraction));
        const calculatedCount = Math.max(
          finalMinPlayers,
          Math.round(startingPlayers * remainingFraction)
        );
        setOnlinePlayersCount(calculatedCount);
      }
    };

    const interval = setInterval(handleGameLoopTick, 50);
    return () => clearInterval(interval);
  }, [currentView, socketConnected, startingPlayers, finalMinPlayers, onlinePlayersCount]);

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
        if (authSessionMode === 'real') {
          setRealPanel1Placed(false);
          setRealPanel1Cashed(false);
          setRealPanel1BetVal(0);
          panel1ActiveBetRef.current.real = null;
          panel1NextRoundBetRef.current.real = null;
        } else {
          setDemoPanel1Placed(false);
          setDemoPanel1Cashed(false);
          setDemoPanel1BetVal(0);
          panel1ActiveBetRef.current.demo = null;
          panel1NextRoundBetRef.current.demo = null;
        }
      } else {
        if (authSessionMode === 'real') {
          setRealPanel2Placed(false);
          setRealPanel2Cashed(false);
          setRealPanel2BetVal(0);
          panel2ActiveBetRef.current.real = null;
          panel2NextRoundBetRef.current.real = null;
        } else {
          setDemoPanel2Placed(false);
          setDemoPanel2Cashed(false);
          setDemoPanel2BetVal(0);
          panel2ActiveBetRef.current.demo = null;
          panel2NextRoundBetRef.current.demo = null;
        }
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
        panel1NextRoundBetRef.current[activeMode] = amount;
        if (activeMode === 'real') {
          setRealPanel1NextPlaced(true);
          setRealPanel1NextBetVal(amount);
        } else {
          setDemoPanel1NextPlaced(true);
          setDemoPanel1NextBetVal(amount);
        }
      } else {
        panel1ActiveBetRef.current[activeMode] = amount;
        if (activeMode === 'real') {
          setRealPanel1Placed(true);
          setRealPanel1Cashed(false);
          setRealPanel1BetVal(amount);
        } else {
          setDemoPanel1Placed(true);
          setDemoPanel1Cashed(false);
          setDemoPanel1BetVal(amount);
        }
      }
    } else {
      if (isNextRound) {
        panel2NextRoundBetRef.current[activeMode] = amount;
        if (activeMode === 'real') {
          setRealPanel2NextPlaced(true);
          setRealPanel2NextBetVal(amount);
        } else {
          setDemoPanel2NextPlaced(true);
          setDemoPanel2NextBetVal(amount);
        }
      } else {
        panel2ActiveBetRef.current[activeMode] = amount;
        if (activeMode === 'real') {
          setRealPanel2Placed(true);
          setRealPanel2Cashed(false);
          setRealPanel2BetVal(amount);
        } else {
          setDemoPanel2Placed(true);
          setDemoPanel2Cashed(false);
          setDemoPanel2BetVal(amount);
        }
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
    const activeMode = authSessionMode === 'real' ? 'real' : 'demo';

    if (panelId === 'panel1') {
      if (isNextRound) {
        panel1NextRoundBetRef.current[activeMode] = null;
        if (activeMode === 'real') {
          setRealPanel1NextBetVal(0);
          setRealPanel1NextPlaced(false);
        } else {
          setDemoPanel1NextBetVal(0);
          setDemoPanel1NextPlaced(false);
        }
      } else {
        panel1ActiveBetRef.current[activeMode] = null;
        if (activeMode === 'real') {
          setRealPanel1BetVal(0);
          setRealPanel1Placed(false);
        } else {
          setDemoPanel1BetVal(0);
          setDemoPanel1Placed(false);
        }
      }
    } else {
      if (isNextRound) {
        panel2NextRoundBetRef.current[activeMode] = null;
        if (activeMode === 'real') {
          setRealPanel2NextBetVal(0);
          setRealPanel2NextPlaced(false);
        } else {
          setDemoPanel2NextBetVal(0);
          setDemoPanel2NextPlaced(false);
        }
      } else {
        panel2ActiveBetRef.current[activeMode] = null;
        if (activeMode === 'real') {
          setRealPanel2BetVal(0);
          setRealPanel2Placed(false);
        } else {
          setDemoPanel2BetVal(0);
          setDemoPanel2Placed(false);
        }
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

    const activeMode = authSessionMode === 'real' ? 'real' : 'demo';

    if (panelId === 'panel1') {
      panel1ActiveBetRef.current[activeMode] = null;
      if (activeMode === 'real') {
        setRealPanel1Cashed(true);
      } else {
        setDemoPanel1Cashed(true);
      }
    } else {
      panel2ActiveBetRef.current[activeMode] = null;
      if (activeMode === 'real') {
        setRealPanel2Cashed(true);
      } else {
        setDemoPanel2Cashed(true);
      }
    }

    // Add personal wins to ledger
    const betVal = panelId === 'panel1'
      ? (activeMode === 'real' ? realPanel1BetVal : demoPanel1BetVal)
      : (activeMode === 'real' ? realPanel2BetVal : demoPanel2BetVal);

    setMyBets(prev => [
      {
        amount: betVal,
        multiplier: finalMult,
        payout: cashPayout,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'WON',
        mode: activeMode,
        timestamp: Date.now()
      },
      ...prev
    ]);

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
              
              transitionNextRoundBets();
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

              resolveRoundUnsecuredBets();
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
            if (receivedMsg && typeof receivedMsg.text === 'string' && receivedMsg.text) {
              receivedMsg.text = receivedMsg.text.charAt(0).toLowerCase() + receivedMsg.text.slice(1);
            }
            setChatMessages(prev => {
              if (prev.some(m => m.id === receivedMsg.id)) return prev;
              const updated = [...prev, receivedMsg];
              return updated.slice(-45);
            });
          }
        } catch (e) {
          console.warn("[WS Message Handling Error]:", e);
        }
      };

      ws.onclose = () => {
        setSocketConnected(false);
      };

      ws.onerror = () => {
        setSocketConnected(false);
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
    <div className="h-screen max-h-screen w-screen bg-[#0d0e10] text-gray-100 flex flex-col justify-start items-stretch p-0 relative antialiased overflow-hidden">
      
      {/* Central Screen Frame */}
      <div className="w-full h-full bg-[#0d0e10] flex flex-col shadow-none shrink-0 flex-1 overflow-hidden">
        
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
              {currentView === 'aviator' && (
                <button
                  onClick={() => setShowMobileBets(!showMobileBets)}
                  className={`md:hidden px-3 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer font-bold ${showMobileBets ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.3)]' : 'bg-black/15 text-[#9b9da4] hover:text-[#d1d2d6]'}`}
                >
                  <span>📊</span>
                  <span className="uppercase">Ledger {showMobileBets ? 'ON' : 'OFF'}</span>
                </button>
              )}
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
          <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#0d0e10] overflow-hidden relative">
            {/* LEFT SIDEBAR: Multiplayer lobby statistics & lounge chats */}
            <div className={`
              ${showMobileBets ? 'flex fixed inset-x-0 bottom-0 top-[110px] z-40 p-4 bg-black/95 border-t border-purple-500/20 animate-fadeIn' : 'hidden'} 
              md:relative md:flex md:inset-auto md:z-0 md:p-3
              w-full md:w-[280px] lg:w-[320px] xl:w-[360px] shrink-0 border-r border-[#212327]/30 bg-[#0d0e10] flex-col overflow-hidden order-2 md:order-1 h-auto md:h-full
            `}>
              {/* Close header for mobile ledger overlay */}
              <div className="flex md:hidden items-center justify-between pb-2 mb-2 border-b border-purple-900/30 shrink-0">
                <span className="text-[10px] uppercase font-black text-amber-400 font-mono">Live Multiplayer Ledger</span>
                <button 
                  onClick={() => setShowMobileBets(false)}
                  className="px-2.5 py-1 text-[9px] uppercase font-black bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer"
                >
                  ✕ Close Ledger
                </button>
              </div>
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
            <div className="flex-1 flex flex-col order-1 md:order-2 h-full overflow-hidden bg-[#0d0e10]">
              {/* RECENT HISTORIC MULTIPLIERS STRIP */}
              <HistoryRibbon 
                multipliers={historyList}
              />

              {/* MIDDLE FLIGHT VIEWPORT CONTAINER */}
              <div className="p-2 sm:p-3 bg-[#0d0e10] flex-1 min-h-[180px] md:min-h-0 flex flex-col justify-center overflow-hidden">
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
          <div className="flex-1 overflow-hidden p-3 bg-[#0d0e10] text-[#eaeaea] font-sans flex flex-col min-h-0">
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
