/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCw, 
  Zap, 
  User, 
  Coins, 
  Activity, 
  Flame, 
  ChevronRight, 
  Eye, 
  Sparkles, 
  Clock, 
  Grid, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Sliders,
  TrendingDown,
  Navigation,
  Crown,
  Gift,
  Users,
  Copy
} from 'lucide-react';
import { GameItem, Wallet, Transaction, UserProfile } from '../types';

interface CasinoGamesProps {
  wallet: Wallet;
  setWallet: React.Dispatch<React.SetStateAction<Wallet>>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'status'>) => void;
  triggerNotification: (title: string, message: string, type: 'deposit' | 'withdrawal' | 'bonus' | 'jackpot' | 'tournament' | 'vip' | 'general') => void;
  incrementJackpots: (amount: number) => void;
  jackpotPool: { mega: number; major: number; minor: number; mini: number };
  setActiveCategory: (cat: string) => void;
  activeCategory: string;
  gameOfTheWeek: {
    gameId: string;
    promoType: string;
    promoValue: string;
    description: string;
    bannerTitle: string;
  };
  userProfile?: UserProfile;
  authSessionMode?: 'demo' | 'real' | null;
  setUserProfile?: React.Dispatch<React.SetStateAction<UserProfile>>;
  onLaunchAviator?: () => void;
}

export const LISTED_GAMES: GameItem[] = [
  // SLOTS
  { id: 'slot-classic', title: 'Fruit Mania 777', category: 'slots', provider: 'CasinoHub Original', emoji: '🍒', rtp: 96.5, minBet: 10.00, maxBet: 100000, jackpotEligible: true },
  { id: 'slot-video', title: 'Gates of Valhalla', category: 'slots', provider: 'Pragmatic Play', emoji: '🎰', rtp: 97.2, minBet: 10.00, maxBet: 100000, jackpotEligible: true },
  { id: 'slot-jackpot', title: 'Mega Moolah Gold', category: 'slots', provider: 'Microgaming', emoji: '👑', rtp: 95.8, minBet: 10.00, maxBet: 100000, jackpotEligible: true },
  { id: 'slot-megaways', title: 'Sweet Bonanza Extra', category: 'slots', provider: 'Megaways Inc', emoji: '🍭', rtp: 96.8, minBet: 10.00, maxBet: 100000 },
  { id: 'slot-3d', title: 'Necromancer Quest', category: 'slots', provider: 'Betsoft 3D', emoji: '💀', rtp: 96.1, minBet: 10.00, maxBet: 100000 },

  // LIVE DEALER
  { id: 'live-roulette', title: 'Lightning Roulette Live', category: 'live', provider: 'Evolution Gaming', emoji: '🎡', rtp: 97.3, minBet: 10.00, maxBet: 100000, liveDealerName: 'Sophia' },
  { id: 'live-blackjack', title: 'VIP Blackjack Table', category: 'live', provider: 'Evolution Gaming', emoji: '🃏', rtp: 99.5, minBet: 10.00, maxBet: 100000, liveDealerName: 'Lucas' },
  { id: 'live-baccarat', title: 'Speed Baccarat High Limits', category: 'live', provider: 'Pragmatic Live', emoji: '💎', rtp: 98.9, minBet: 10.00, maxBet: 100000, liveDealerName: 'Olivia' },
  { id: 'live-poker', title: 'Texas Hold\'em Ultimate', category: 'live', provider: 'Playtech Live', emoji: '👑', rtp: 97.9, minBet: 10.00, maxBet: 100000, liveDealerName: 'Marcus' },
  { id: 'live-sicbo', title: 'Super Sic Bo Live', category: 'live', provider: 'Evolution Gaming', emoji: '🎲', rtp: 97.2, minBet: 10.00, maxBet: 100000, liveDealerName: 'Chloe' },
  { id: 'live-dragontiger', title: 'Dragon Tiger Fortune', category: 'live', provider: 'Asia Gaming', emoji: '🐯', rtp: 96.2, minBet: 10.00, maxBet: 100000, liveDealerName: 'Chen' },

  // TABLE GAMES
  { id: 'table-euro-roulette', title: 'European Roulette Pro', category: 'table', provider: 'CasinoHub Original', emoji: '🎡', rtp: 97.3, minBet: 10.00, maxBet: 100000 },
  { id: 'table-classic-blackjack', title: 'Classic Blackjack Multi-hand', category: 'table', provider: 'NetEnt', emoji: '🃏', rtp: 99.6, minBet: 10.00, maxBet: 100000 },
  { id: 'table-vip-baccarat', title: 'Traditional Baccarat standard', category: 'table', provider: 'CasinoHub Original', emoji: '💎', rtp: 98.9, minBet: 10.00, maxBet: 100000 },
  { id: 'table-poker-threecard', title: 'Three Card Poker', category: 'table', provider: 'NetEnt', emoji: '🃏', rtp: 96.6, minBet: 10.00, maxBet: 100000 },

  // INSTANT WIN & CRASH
  { id: 'instant-aviator', title: 'JETCASH', category: 'instant', provider: 'Spribe Original', emoji: '🚀', rtp: 97.0, minBet: 10.00, maxBet: 100000 },
  { id: 'instant-crush', title: 'Space Crush Arena', category: 'instant', provider: 'CasinoHub Original', emoji: '☄️', rtp: 97.5, minBet: 10.00, maxBet: 100000 },
  { id: 'instant-wheel', title: 'Mega Wheel Spin', category: 'instant', provider: 'Pragmatic Play', emoji: '🎡', rtp: 96.5, minBet: 10.00, maxBet: 100000 },
  { id: 'instant-mines', title: 'Mines Gold Mines', category: 'instant', provider: 'CasinoHub Original', emoji: '💣', rtp: 98.0, minBet: 10.00, maxBet: 100000 },
  { id: 'instant-plinko', title: 'Plinko Multi-drops', category: 'instant', provider: 'CasinoHub Original', emoji: '🎯', rtp: 99.0, minBet: 10.00, maxBet: 100000 },
  { id: 'instant-coinflip', title: 'Turbo Coin Flip', category: 'instant', provider: 'CasinoHub Original', emoji: '🪙', rtp: 98.5, minBet: 10.00, maxBet: 100000 },
  { id: 'instant-dice', title: 'Master Roll Dice', category: 'instant', provider: 'CasinoHub Original', emoji: '🎲', rtp: 98.2, minBet: 10.00, maxBet: 100000 },
];

export default function CasinoGames({
  wallet,
  setWallet,
  addTransaction,
  triggerNotification,
  incrementJackpots,
  jackpotPool,
  setActiveCategory,
  activeCategory,
  gameOfTheWeek,
  userProfile = {
    username: 'francypendy',
    email: 'francypendy@gmail.com',
    phone: '0712345678',
    avatar: 'FP',
    language: 'EN',
    currency: 'KSh',
    vipLevel: 'Silver',
    vipPoints: 1240,
    joinedDate: '2026-01-10'
  },
  authSessionMode = 'real',
  setUserProfile,
  onLaunchAviator = () => {}
}: CasinoGamesProps) {
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [winOverlay, setWinOverlay] = useState<{ amount: number; message: string; title: string } | null>(null);

  // Auto-dismiss helper for Win Overlay
  const triggerWinOverlay = (amount: number, message: string, title: string = 'YOU WON!') => {
    setWinOverlay({ amount, message, title });
    setTimeout(() => {
      setWinOverlay(prev => (prev?.amount === amount ? null : prev));
    }, 4500);
  };

  const awardWinnings = (amount: number, gameTitle: string, methodLabel: string) => {
    setWallet((prev) => {
      const isReal = authSessionMode === 'real';
      const balanceField = isReal ? 'realBalance' : 'demoBalance';
      const currentVal = prev[balanceField];
      const newVal = parseFloat((currentVal + amount).toFixed(2));
      return {
        ...prev,
        [balanceField]: newVal,
        mainBalance: newVal
      };
    });

    addTransaction({
      type: 'win',
      amount: amount,
      currency: 'KSh',
      method: methodLabel,
      game: gameTitle
    });

    triggerWinOverlay(amount, `Congratulations! Your balance has been instantly credited under ${authSessionMode === 'real' ? 'Real' : 'Demo'} Funds. Game: ${gameTitle}.`, 'YOU WON!');
  };

  // Automated sliding banner states & ticking jackpot setup
  const [lobbyTab, setLobbyTab] = useState<'games' | 'offers' | 'affiliate'>('games');
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [ke7Jackpot, setKe7Jackpot] = useState<number>(156183.15);
  const [selectedSportsOdds, setSelectedSportsOdds] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // 1. Auto slide transition interval timer (4 seconds)
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 5);
    }, 4000);

    // 2. Continuous jackpot ticking incrementer (randomize fraction delta every 1.5s)
    const jackpotTimer = setInterval(() => {
      setKe7Jackpot((prev) => prev + (Math.random() * 0.45 + 0.15));
    }, 1500);

    return () => {
      clearInterval(slideTimer);
      clearInterval(jackpotTimer);
    };
  }, []);

  // VIP Loyalty Bonus claim state & timer logic
  const [referredList, setReferredList] = useState<{username: string; totalDeposits: number; commission: number; joinedDate: string}[]>(() => {
    const saved = localStorage.getItem('casinohub_referred_players');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { username: 'kamau_flyer', totalDeposits: 22000, commission: 2200, joinedDate: '2026-05-12' },
      { username: 'amina_99', totalDeposits: 14000, commission: 1400, joinedDate: '2026-05-24' },
      { username: 'mwangi_jet', totalDeposits: 3500, commission: 350, joinedDate: '2026-05-29' },
      { username: 'mwende_crypto', totalDeposits: 0, commission: 0, joinedDate: '2026-06-01' }
    ];
  });

  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyReferralCode = () => {
    if (authSessionMode === 'demo') {
      triggerNotification(
        '🔒 Demo Referral Locked',
        'Demo practice profiles cannot distribute referrals.',
        'general'
      );
      return;
    }
    const refCode = userProfile.referralCode || `REF-${userProfile.username.toUpperCase()}-${userProfile.phone ? userProfile.phone.replace(/[^0-9]/g, '').slice(-4) : '7777'}`;
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    triggerNotification(
      '📋 Referral Code Copied!',
      `Copied code "${refCode}" to clipboard! Refer players to earn a 10% instant commission!`,
      'general'
    );
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Game of the week local interactive states
  const [showGotwPromoModal, setShowGotwPromoModal] = useState<boolean>(false);
  const [nextWeekVotedId, setNextWeekVotedId] = useState<string | null>(() => {
    return localStorage.getItem('casinohub_gotw_voted_id');
  });
  const [nextWeekVotes, setNextWeekVotes] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem('casinohub_gotw_votes');
    if (saved) return JSON.parse(saved);
    return {
      'slot-video': 542,
      'live-roulette': 319,
      'instant-mines': 612
    };
  });
  const [gotwTimeLeft, setGotwTimeLeft] = useState<string>('5d 14h 22m');

  // Dynamic countdown calculations
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Calculate target: coming Sunday at 23:59:59
      const target = new Date();
      target.setDate(now.getDate() + (7 - now.getDay()) % 7);
      target.setHours(23, 59, 59, 999);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 7);
      }
      const diff = target.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setGotwTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Dynamically calculate VIP Club Coffer amount based on session mode and transaction history
  let totalDeposited = 0;
  if (authSessionMode === 'real') {
    try {
      const storedTx = localStorage.getItem('casinohub_transactions');
      if (storedTx) {
        const parsed = JSON.parse(storedTx);
        if (Array.isArray(parsed)) {
          totalDeposited = parsed
            .filter((t: any) => t.type === 'deposit')
            .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        }
      }
    } catch (e) {}
  }
  const dynamicVipBonusAmount = authSessionMode === 'real' 
    ? parseFloat((totalDeposited * 0.05).toFixed(2)) 
    : 100;

  const handleVoteForNextWeek = (gameId: string) => {
    if (nextWeekVotedId) {
      triggerNotification('Already Voted', 'You have already voted for next week\'s featured Game of the Week!', 'general');
      return;
    }
    setNextWeekVotedId(gameId);
    localStorage.setItem('casinohub_gotw_voted_id', gameId);
    
    const updatedVotes = {
      ...nextWeekVotes,
      [gameId]: (nextWeekVotes[gameId] || 0) + 1
    };
    setNextWeekVotes(updatedVotes);
    localStorage.setItem('casinohub_gotw_votes', JSON.stringify(updatedVotes));

    const votedGameName = LISTED_GAMES.find(g => g.id === gameId)?.title || 'Selected Game';
    triggerNotification(
      '🗳️ Vote Registered!',
      `Thank you for voting! "${votedGameName}" is now in the lead for next week's Game of the Week!`,
      'bonus'
    );
  };

  const handleSimulateReferredDeposit = () => {
    const candidates = ['kamau_flyer', 'amina_99', 'mwangi_jet', 'mwende_crypto', 'juma_bet', 'ruth_wins', 'brian_flyer', 'sharon_spin'];
    const randomFriend = candidates[Math.floor(Math.random() * candidates.length)];
    const depositAmounts = [1000, 2500, 5000, 10000, 15000];
    const amount = depositAmounts[Math.floor(Math.random() * depositAmounts.length)];
    const commission = parseFloat((amount * 0.10).toFixed(2));

    setReferredList(prev => {
      let isExisting = false;
      const next = prev.map(p => {
        if (p.username === randomFriend) {
          isExisting = true;
          return {
            ...p,
            totalDeposits: p.totalDeposits + amount,
            commission: parseFloat((p.commission + commission).toFixed(2))
          };
        }
        return p;
      });

      if (!isExisting) {
        next.push({
          username: randomFriend,
          totalDeposits: amount,
          commission: commission,
          joinedDate: new Date().toISOString().split('T')[0]
        });
      }

      localStorage.setItem('casinohub_referred_players', JSON.stringify(next));
      return next;
    });

    // Credit corresponding balance
    setWallet(w => {
      if (authSessionMode === 'real') {
        const nextReal = parseFloat((w.realBalance + commission).toFixed(2));
        return {
          ...w,
          realBalance: nextReal,
          mainBalance: nextReal
        };
      } else {
        const nextDemo = parseFloat((w.demoBalance + commission).toFixed(2));
        return {
          ...w,
          demoBalance: nextDemo,
          mainBalance: nextDemo
        };
      }
    });

    addTransaction({
      type: 'bonus_credit',
      amount: commission,
      currency: 'KSh',
      method: `10% commission: ${randomFriend} deposited KSh ${amount.toLocaleString()}`,
    });

    triggerNotification(
      '💰 Commission Earned!',
      `Your referred user "${randomFriend}" made a deposit of KSh ${amount.toLocaleString()}! You earned KSh ${commission.toLocaleString()} cash (10%)!`,
      'bonus'
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // 30% chance every 40 seconds to simulate a referred user deposit
      if (Math.random() < 0.35) {
        handleSimulateReferredDeposit();
      }
    }, 40000);
    return () => clearInterval(interval);
  }, [authSessionMode, userProfile]);

  const [vipBonusCooldown, setVipBonusCooldown] = useState<number>(() => {
    const savedEnd = localStorage.getItem('casinohub_vip_bonus_cooldown_end');
    if (savedEnd) {
      const secondsLeft = Math.ceil((parseInt(savedEnd) - Date.now()) / 1000);
      return secondsLeft > 0 ? secondsLeft : 0;
    }
    return 0;
  });

  useEffect(() => {
    if (vipBonusCooldown <= 0) return;
    const timer = setInterval(() => {
      setVipBonusCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [vipBonusCooldown]);

  const handleClaimVipBonus = () => {
    if (vipBonusCooldown > 0) return;

    let reward = 100;
    let localTotalDeposited = 0;

    if (authSessionMode === 'real') {
      try {
        const storedTx = localStorage.getItem('casinohub_transactions');
        if (storedTx) {
          const parsed = JSON.parse(storedTx);
          if (Array.isArray(parsed)) {
            localTotalDeposited = parsed
              .filter((t: any) => t.type === 'deposit')
              .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
          }
        }
      } catch (e) {}
      reward = parseFloat((localTotalDeposited * 0.05).toFixed(2));
    } else {
      reward = 100;
    }

    // Credit corresponding balance
    setWallet(w => {
      if (authSessionMode === 'real') {
        const nextReal = parseFloat((w.realBalance + reward).toFixed(2));
        return {
          ...w,
          realBalance: nextReal,
          mainBalance: nextReal
        };
      } else {
        const nextDemo = parseFloat((w.demoBalance + reward).toFixed(2));
        return {
          ...w,
          demoBalance: nextDemo,
          mainBalance: nextDemo
        };
      }
    });

    // Write persistent transaction history log
    addTransaction({
      type: 'bonus_credit',
      amount: reward,
      currency: 'KSh',
      method: authSessionMode === 'real'
        ? `VIP Coffer: 5% Deposit Commission`
        : `VIP Coffer: Demo Practice Bonus`,
    });

    // Notify player elegantly
    triggerNotification(
      '🏆 VIP Loyalty Claimed!',
      authSessionMode === 'real'
        ? `Successfully unlocked KSh ${reward.toLocaleString()} (5% Coffer commission from KSh ${localTotalDeposited.toLocaleString()} total deposits)!`
        : `Successfully unlocked KSh ${reward.toLocaleString()} Demo Practice Bonus!`,
      'vip'
    );

    // Set 45 seconds claim cooldown for high engagement gaming loops
    const nextEnd = Date.now() + 45000;
    localStorage.setItem('casinohub_vip_bonus_cooldown_end', nextEnd.toString());
    setVipBonusCooldown(45);
  };

  // Slots Game State
  const [slotsReels, setSlotsReels] = useState<string[]>(['🍒', '💎', '🎰']);
  const [slotsStatus, setSlotsStatus] = useState<string>('Set bet and spin!');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);

  // Crash (Aviator / Space Crush) State
  const [crashActive, setCrashActive] = useState<boolean>(false);
  const [crashMultiplier, setCrashMultiplier] = useState<number>(1.0);
  const [crashBetPlaced, setCrashBetPlaced] = useState<boolean>(false);
  const [crashHasCashedOut, setCrashHasCashedOut] = useState<boolean>(false);
  const [crashPayoutAmount, setCrashPayoutAmount] = useState<number>(0);
  const [crashMessage, setCrashMessage] = useState<string>('Determine stakes and launch!');
  const [crashPreflightPercent, setCrashPreflightPercent] = useState<number>(0);
  const [crashHistory, setCrashHistory] = useState<number[]>([1.42, 2.91, 1.15, 5.84, 1.05]);
  const [autoCashoutEnabled, setAutoCashoutEnabled] = useState<boolean>(false);
  const [autoCashoutValue, setAutoCashoutValue] = useState<number>(2.0);
  const [simulatedPlayers, setSimulatedPlayers] = useState<{ name: string; bet: number; cashedOut: boolean; mult?: number }[]>([]);
  const crashIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mines State
  const [minesGrid, setMinesGrid] = useState<{ id: number; hasMine: boolean; revealed: boolean }[]>([]);
  const [minesBetPlaced, setMinesBetPlaced] = useState<boolean>(false);
  const [minesCount, setMinesCount] = useState<number>(3);
  const [minesRevealedCount, setMinesRevealedCount] = useState<number>(0);
  const [minesGameOver, setMinesGameOver] = useState<boolean>(false);
  const [minesOutcome, setMinesOutcome] = useState<'WIN' | 'FAIL' | 'IDLE'>('IDLE');

  // Plinko State
  const [plinkoHistory, setPlinkoHistory] = useState<{ x: number; y: number }[]>([]);
  const [plinkoMultiplierSelected, setPlinkoMultiplierSelected] = useState<number | null>(null);
  const [isPlinkoDropping, setIsPlinkoDropping] = useState<boolean>(false);

  // Roulette (Table) State
  const [rouletteSelectedNumber, setRouletteSelectedNumber] = useState<number | null>(null);
  const [rouletteSelectedColor, setRouletteSelectedColor] = useState<'red' | 'black' | 'green' | null>(null);
  const [rouletteSpinning, setRouletteSpinning] = useState<boolean>(false);
  const [rouletteOutcome, setRouletteOutcome] = useState<{ number: number; color: 'red' | 'black' | 'green' } | null>(null);

  // Blackjack State
  const [blackjackDealerCards, setBlackjackDealerCards] = useState<{ text: string; value: number }[]>([]);
  const [blackjackPlayerCards, setBlackjackPlayerCards] = useState<{ text: string; value: number }[]>([]);
  const [blackjackInGame, setBlackjackInGame] = useState<boolean>(false);
  const [blackjackStatus, setBlackjackStatus] = useState<string>('Place bet and deal!');

  // Live Dealer counts
  const [liveDealerTime, setLiveDealerTime] = useState<number>(10);
  const [liveDealerChatMessage, setLiveDealerChatMessage] = useState<string>('Sophia: Place your bets, chips on board!');
  const [liveDealerPrevWins, setLiveDealerPrevWins] = useState<string[]>(['RED 14', 'BLACK 22', 'RED 3', 'BLACK 11']);
  const [liveUserBetOn, setLiveUserBetOn] = useState<string>('');

  // Mega Spin Wheel State
  const [wheelSpinning, setWheelSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [wheelSelectedItem, setWheelSelectedItem] = useState<{ sector: string; mult: number; color: string } | null>(null);
  const [wheelBetOn, setWheelBetOn] = useState<string>('x2'); // Selected bet sector

  // Turbo Coin Flip State
  const [isCoinFlipping, setIsCoinFlipping] = useState<boolean>(false);
  const [coinBetOn, setCoinBetOn] = useState<'heads' | 'tails'>('heads');
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);

  // Master Roll Dice State
  const [diceIsRolling, setDiceIsRolling] = useState<boolean>(false);
  const [diceRollValue, setDiceRollValue] = useState<number>(50.0);
  const [diceTargetValue, setDiceTargetValue] = useState<number>(50.0);
  const [diceBetType, setDiceBetType] = useState<'over' | 'under'>('over');
  const [diceOutcomeValue, setDiceOutcomeValue] = useState<number | null>(null);

  useEffect(() => {
    // Keep live dealer interactive simulated countdown timer running
    const timer = setInterval(() => {
      setLiveDealerTime((prev) => {
        if (prev <= 1) {
          const isReal = authSessionMode === 'real';
          const winRate = isReal ? 0.30 : 0.60;
          const shouldWinLive = (liveUserBetOn !== '') ? (Math.random() < winRate) : null;

          let pickedColor: 'red' | 'black' | 'green';
          let outcomeNum: number;
          const colors: ('red' | 'black' | 'green')[] = ['green', 'red', 'black'];

          if (shouldWinLive !== null) {
            if (shouldWinLive) {
              pickedColor = liveUserBetOn as 'red' | 'black' | 'green';
              if (pickedColor === 'green') {
                outcomeNum = 0;
              } else if (pickedColor === 'red') {
                const evens = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
                outcomeNum = evens[Math.floor(Math.random() * evens.length)];
              } else {
                const odds = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35];
                outcomeNum = odds[Math.floor(Math.random() * odds.length)];
              }
            } else {
              pickedColor = liveUserBetOn === 'red' ? 'black' : 'red';
              if (pickedColor === 'red') {
                const evens = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36];
                outcomeNum = evens[Math.floor(Math.random() * evens.length)];
              } else {
                const odds = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35];
                outcomeNum = odds[Math.floor(Math.random() * odds.length)];
              }
            }
          } else {
            outcomeNum = Math.floor(Math.random() * 37);
            pickedColor = outcomeNum === 0 ? 'green' : colors[outcomeNum % 2 + 1];
          }

          const combined = `${pickedColor.toUpperCase()} ${outcomeNum}`;
          
          setLiveDealerPrevWins(prevList => [combined, ...prevList.slice(0, 3)]);
          setLiveDealerChatMessage(`Sophia: Dealer Result: ${combined}! Next spin starts shortly.`);
          
          if (liveUserBetOn !== '') {
            const won = (liveUserBetOn === pickedColor);
            if (won) {
              const multi = liveUserBetOn === 'green' ? 35 : 2;
              const payout = betAmount * multi;
              awardWinnings(payout, 'Lightning Roulette Live', 'Live Studio Payout');
              triggerNotification('Live Casino Win!', `You won ${payout.toFixed(2)} sh on Sophia's Live Roulette!`, 'general');
            }
            setLiveUserBetOn('');
          }
          return 15;
        }
        if (prev === 12) {
          setLiveDealerChatMessage('Sophia: No more bets please. Spin in motion!');
        }
        if (prev === 5) {
          setLiveDealerChatMessage('Sophia: Slowing down... watch the golden ball.');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [liveUserBetOn, betAmount]);

  useEffect(() => {
    return () => {
      if (crashIntervalRef.current) clearInterval(crashIntervalRef.current);
    };
  }, []);

  // Initialize Mines Grid
  const initializeMines = () => {
    const freshGrid = [];
    const mineIndices = new Set<number>();
    while (mineIndices.size < minesCount) {
      mineIndices.add(Math.floor(Math.random() * 25));
    }
    for (let i = 0; i < 25; i++) {
      freshGrid.push({
        id: i,
        hasMine: mineIndices.has(i),
        revealed: false
      });
    }
    setMinesGrid(freshGrid);
    setMinesRevealedCount(0);
    setMinesGameOver(false);
    setMinesOutcome('IDLE');
  };

  const handleGameSelect = (game: GameItem) => {
    if (game.id === 'instant-aviator' || game.id.includes('aviator')) {
      onLaunchAviator();
      return;
    }
    setSelectedGame(game);
    // Prep individual game state as required
    if (game.id === 'instant-mines') {
      initializeMines();
      setMinesBetPlaced(false);
    }
  };

  const deductFunds = (amount: number, gameTitle: string): boolean => {
    // Rigidly enforce 10 sh and 100,000 sh bounds across all casino games
    if (amount < 10) {
      triggerNotification('Validation Error', 'The minimum stake or wager is 10 sh.', 'general');
      return false;
    }
    if (amount > 100000) {
      triggerNotification('Validation Error', 'The maximum stake or wager is 100,000 sh.', 'general');
      return false;
    }

    const isReal = authSessionMode === 'real';
    const balanceField = isReal ? 'realBalance' : 'demoBalance';
    const activeBalance = wallet[balanceField];

    if (activeBalance < amount) {
      triggerNotification('Insufficient Funds', 'Your balance is too low. Place a secure deposit now!', 'general');
      return false;
    }
    setWallet((prev) => {
      const isReal = authSessionMode === 'real';
      const balanceField = isReal ? 'realBalance' : 'demoBalance';
      const currentVal = prev[balanceField];
      const newVal = parseFloat((currentVal - amount).toFixed(2));
      return {
        ...prev,
        [balanceField]: newVal,
        mainBalance: newVal
      };
    });
    incrementJackpots(amount * 0.05); // 5% added toprogressive jackpots
    addTransaction({
      type: 'bet',
      amount: amount,
      currency: 'KSh',
      method: 'Placed Stake',
      game: gameTitle
    });

    // Game of the week loyalty point booster awards
    if (setUserProfile) {
      const gotw = gameOfTheWeek;
      const gotwGame = gotw ? LISTED_GAMES.find(g => g.id === gotw.gameId) : null;
      const isGOTW = gotwGame && (
        (selectedGame && selectedGame.id === gotw.gameId) ||
        gameTitle.toLowerCase().includes(gotwGame.title.toLowerCase())
      );

      const basePoints = Math.max(1, Math.round(amount * 0.1));
      const finalPoints = isGOTW ? basePoints * 3 : basePoints;

      setUserProfile(prev => {
        const nextPoints = prev.vipPoints + finalPoints;
        // See if VIP tier should level up!
        let nextTier = prev.vipLevel;
        if (nextPoints >= 10000) nextTier = 'Elite';
        else if (nextPoints >= 5000) nextTier = 'Diamond';
        else if (nextPoints >= 3000) nextTier = 'Platinum';
        else if (nextPoints >= 1500) nextTier = 'Gold';
        else if (nextPoints >= 500) nextTier = 'Silver';

        if (nextTier !== prev.vipLevel) {
          setTimeout(() => {
            triggerNotification(
              '🎉 VIP LEVEL UP!',
              `Congratulations! You have been promoted to ${nextTier} tier! Keep playing to unlock bigger cash rewards!`,
              'vip'
            );
          }, 600);
        }

        return {
          ...prev,
          vipPoints: nextPoints,
          vipLevel: nextTier
        };
      });

      if (isGOTW) {
        triggerNotification(
          '💎 GOTW LOYALTY BOOST',
          `Earned +${finalPoints} VIP Points (incorporating 3x Game of the Week multiplier boost) on ${gameTitle}!`,
          'vip'
        );
      }
    }

    return true;
  };

  // --- SLOT SPIN MACHINE LOGIC ---
  const triggerSlotSpin = () => {
    if (isSpinning) return;
    if (!deductFunds(betAmount, selectedGame?.title || 'Slots Mania')) return;

    setIsSpinning(true);
    setSlotsStatus('Spinning the golden reels...');
    
    let rollCount = 0;
    const icons = ['🍒', '💎', '🎰', '🍭', '🍋', '🔔', '👑', '⭐'];
    
    const spinInterval = setInterval(() => {
      setSlotsReels([
        icons[Math.floor(Math.random() * icons.length)],
        icons[Math.floor(Math.random() * icons.length)],
        icons[Math.floor(Math.random() * icons.length)]
      ]);
      rollCount++;
      if (rollCount > 12) {
        clearInterval(spinInterval);
        setIsSpinning(false);
        
        const isReal = authSessionMode === 'real';
        const winRate = isReal ? 0.30 : 0.60;
        const shouldWin = Math.random() < winRate;

        let finalReels;
        if (shouldWin) {
          const winType = Math.random() < 0.15 ? 'jackpot' : 'double';
          if (winType === 'jackpot') {
            const sym = icons[Math.floor(Math.random() * icons.length)];
            finalReels = [sym, sym, sym];
          } else {
            const sym1 = icons[Math.floor(Math.random() * icons.length)];
            let sym2 = icons[Math.floor(Math.random() * icons.length)];
            while (sym2 === sym1) {
              sym2 = icons[Math.floor(Math.random() * icons.length)];
            }
            const arr = [sym1, sym1, sym2];
            finalReels = arr.sort(() => Math.random() - 0.5);
          }
        } else {
          let sym1 = icons[Math.floor(Math.random() * icons.length)];
          let sym2 = icons[Math.floor(Math.random() * icons.length)];
          while (sym2 === sym1) {
            sym2 = icons[Math.floor(Math.random() * icons.length)];
          }
          let sym3 = icons[Math.floor(Math.random() * icons.length)];
          while (sym3 === sym1 || sym3 === sym2) {
            sym3 = icons[Math.floor(Math.random() * icons.length)];
          }
          finalReels = [sym1, sym2, sym3];
        }

        setSlotsReels(finalReels);

        const unique = new Set(finalReels);
        if (unique.size === 1) {
          const winMultiplier = finalReels[0] === '🎰' ? 50 : finalReels[0] === '👑' ? 30 : finalReels[0] === '💎' ? 20 : 10;
          const totalWin = betAmount * winMultiplier;
          awardWinnings(totalWin, selectedGame?.title || 'Slots Mania', 'Slot Jackpot Win');
          setSlotsStatus(`JACKPOT COMBO! 3x ${finalReels[0]} pays ${totalWin.toFixed(2)} sh`);
          triggerNotification('Big Slot Win!', `Stunning jackpot combo! You won ${totalWin.toFixed(2)} sh on ${selectedGame?.title}!`, 'jackpot');

          // Progressive Jackpot opportunity!
          if (Math.random() > 0.85 && selectedGame?.jackpotEligible) {
            const jpType = Math.random() > 0.8 ? 'Mega' : 'Major';
            const jpWin = jpType === 'Mega' ? jackpotPool.mega : jackpotPool.major;
            awardWinnings(jpWin, selectedGame?.title || 'Slots Mania', `Progressive ${jpType} Jackpot`);
            triggerNotification('PROGRESSIVE JACKPOT WON!', `OMG! You hit the ${jpType} Jackpot for ${jpWin.toFixed(2)} sh on ${selectedGame?.title}!`, 'jackpot');
          }
        } else if (unique.size === 2) {
          const totalWin = betAmount * 1.5;
          awardWinnings(totalWin, selectedGame?.title || 'Slots Mania', 'Slot Match Win');
          setSlotsStatus(`Double Combo! 2x identical symbols pays ${totalWin.toFixed(2)} sh`);
        } else {
          setSlotsStatus('Bummer! No winning combinations. Tune your stakes and try again.');
        }
      }
    }, 100);
  };

  // --- AVIATOR & SPACE CRUSH ENGINE ---
  const launchCrashGame = () => {
    if (crashActive) return;
    const isAviator = selectedGame?.id === 'instant-aviator';
    const gameLabel = isAviator ? 'JETCASH' : 'Space Crush Arena';
    
    if (!deductFunds(betAmount, gameLabel)) return;

    setCrashActive(true);
    setCrashBetPlaced(true);
    setCrashHasCashedOut(false);
    setCrashMultiplier(1.0);
    setCrashMessage('Starting engine booster parameters...');
    setCrashPreflightPercent(0);

    // Initial simulated wagers list
    const names = ['Aero_King', 'StakesGold', 'AlphaBet', 'VIP_Silver09', 'LobbyG', 'M-PesaHero', 'HighLander', 'CoinSlinger'];
    const pld = names.map(n => ({
      name: n,
      bet: Math.floor(Math.random() * 85) + 10,
      cashedOut: false
    }));
    setSimulatedPlayers(pld);

    let progress = 0;
    const takeoffInterval = setInterval(() => {
      progress += 20;
      setCrashPreflightPercent(progress);
      if (progress >= 100) {
        clearInterval(takeoffInterval);
        setCrashMessage(isAviator ? 'The Red Jet is cruising! Cash out now!' : 'Asteroid mining rocket ascending! Keep watch!');
        
        // Randomized crash limit based on practice mode (60% win opportunity) vs real money live mode (30% win opportunity)
        const isReal = authSessionMode === 'real';
        const winRate = isReal ? 0.30 : 0.60;
        const allowsWinOpportunity = Math.random() < winRate;

        let crashLimit;
        if (allowsWinOpportunity) {
          const randSeed = Math.random();
          crashLimit = randSeed < 0.5 ? 2.0 + Math.random() * 3.0 : randSeed < 0.9 ? 5.0 + Math.random() * 8 : 13.0 + Math.random() * 15;
        } else {
          crashLimit = 1.01 + Math.random() * 0.34;
        }
        let currMult = 1.0;

        crashIntervalRef.current = setInterval(() => {
          currMult += (currMult * 0.04) + 0.01;
          const roundedMult = parseFloat(currMult.toFixed(2));

          // Check simulated auto-cashouts for other players
          setSimulatedPlayers(prev => prev.map(p => {
            if (!p.cashedOut && Math.random() > 0.88 - (currMult * 0.02)) {
              return { ...p, cashedOut: true, mult: roundedMult };
            }
            return p;
          }));

          // Trigger player's Auto Cashout
          if (autoCashoutEnabled && !crashHasCashedOut && roundedMult >= autoCashoutValue) {
            handleCrashAutoCashout(roundedMult, gameLabel);
          }

          if (currMult >= crashLimit) {
            // CRASH EVENT
            clearInterval(crashIntervalRef.current!);
            setCrashActive(false);
            setCrashBetPlaced(false);
            setCrashMessage(isAviator ? `EXPLODED! Plane crashed at x${roundedMult}` : `CRUSHED! Mine rocket hit space debris at x${roundedMult}`);
            setCrashHistory(prev => [roundedMult, ...prev.slice(0, 4)]);
            
            if (!crashHasCashedOut) {
              triggerNotification('Busted Stake!', `${gameLabel} crashed at x${roundedMult}. Better timing next round!`, 'general');
            }
          } else {
            setCrashMultiplier(roundedMult);
          }
        }, 120);
      }
    }, 100);
  };

  const handleCrashAutoCashout = (targetMult: number, gameTitle: string) => {
    setCrashHasCashedOut(true);
    const payout = parseFloat((betAmount * targetMult).toFixed(2));
    setCrashPayoutAmount(payout);
    awardWinnings(payout, gameTitle, 'Auto Cashout Target');
    setCrashMessage(`AUTO CASHOUT SUCCESS! Paid out at x${targetMult}! Got KSh ${payout.toFixed(2)}`);
    triggerNotification('Auto Cashout Cleared!', `Secured profit of KSh ${payout.toFixed(2)} on x${targetMult}!`, 'general');
  };

  const manualCrashCashOut = () => {
    if (!crashBetPlaced || crashHasCashedOut) return;
    const gameLabel = selectedGame?.id === 'instant-aviator' ? 'JETCASH' : 'Space Crush Arena';

    setCrashHasCashedOut(true);
    const payout = parseFloat((betAmount * crashMultiplier).toFixed(2));
    setCrashPayoutAmount(payout);
    awardWinnings(payout, gameLabel, 'Manual Recall Cashout');
    setCrashMessage(`SUCCESS! Secured cashout at x${crashMultiplier}! Profit: KSh ${payout.toFixed(2)}`);
    triggerNotification('Cashout Claimed!', `Recalled winnings of KSh ${payout.toFixed(2)} on ${gameLabel}!`, 'general');
  };

  // --- MINES MACHINE LOGIC ---
  const startMinesGame = () => {
    if (minesBetPlaced) return;
    if (!deductFunds(betAmount, 'Mines Gold')) return;

    initializeMines();
    setMinesBetPlaced(true);
  };

  const checkMineTile = (tileId: number) => {
    if (!minesBetPlaced || minesGameOver) return;
    
    const updated = [...minesGrid];
    const index = updated.findIndex(t => t.id === tileId);
    if (index === -1 || updated[index].revealed) return;

    const isReal = authSessionMode === 'real';
    const winRate = isReal ? 0.30 : 0.60;
    const shouldBeSafe = Math.random() < winRate;

    if (shouldBeSafe) {
      if (updated[index].hasMine) {
        const otherIndex = updated.findIndex(t => !t.revealed && !t.hasMine && t.id !== tileId);
        if (otherIndex !== -1) {
          updated[otherIndex].hasMine = true;
          updated[index].hasMine = false;
        } else {
          updated[index].hasMine = false;
        }
      }
    } else {
      if (!updated[index].hasMine) {
        const otherIndex = updated.findIndex(t => !t.revealed && t.hasMine && t.id !== tileId);
        if (otherIndex !== -1) {
          updated[otherIndex].hasMine = false;
          updated[index].hasMine = true;
        } else {
          updated[index].hasMine = true;
        }
      }
    }

    updated[index].revealed = true;
    
    if (updated[index].hasMine) {
      setMinesGameOver(true);
      setMinesOutcome('FAIL');
      setMinesBetPlaced(false);
      triggerNotification('Mine Exploded!', 'Kaboom! You stepped on a red explosive element.', 'general');
    } else {
      const revCount = minesRevealedCount + 1;
      setMinesRevealedCount(revCount);
      setMinesGrid(updated);
      
      const nonMines = 25 - minesCount;
      if (revCount === nonMines) {
        const multiplier = parseFloat((1 + (minesCount * 0.45)).toFixed(2));
        const payout = parseFloat((betAmount * multiplier).toFixed(2));
        awardWinnings(payout, 'Mines Gold Mines', 'Sweep Win');
        setMinesGameOver(true);
        setMinesOutcome('WIN');
        setMinesBetPlaced(false);
        triggerNotification('Mines Sweep Completed!', `Outstanding! You swept all tiles for KSh ${payout.toFixed(2)}!`, 'general');
      }
    }
  };

  const cashOutMines = () => {
    if (!minesBetPlaced || minesGameOver || minesRevealedCount === 0) return;

    const multiplier = parseFloat((1 + (minesRevealedCount * (minesCount * 0.16))).toFixed(2));
    const payout = parseFloat((betAmount * multiplier).toFixed(2));
    awardWinnings(payout, 'Mines Gold Mines', 'Mine Winnings Claimed');
    setMinesGameOver(true);
    setMinesOutcome('WIN');
    setMinesBetPlaced(false);
    triggerNotification('Mines Secured!', `Withdrew KSh ${payout} with nice multiplier x${multiplier}!`, 'general');
  };

  // --- PLINKO GAME LOGIC ---
  const triggerPlinkoDrop = () => {
    if (isPlinkoDropping) return;
    if (!deductFunds(betAmount, 'Plinko Multi-drops')) return;

    const isReal = authSessionMode === 'real';
    const winRate = isReal ? 0.30 : 0.60;
    const shouldWin = Math.random() < winRate;

    setIsPlinkoDropping(true);
    setPlinkoMultiplierSelected(null);
    const pathPoints = [];
    let initialX = 50; 

    for (let row = 0; row < 8; row++) {
      let step;
      if (row === 7) {
        if (shouldWin) {
          const chooseLeft = Math.random() > 0.5;
          if (chooseLeft) {
            initialX = 15 + Math.random() * 20; // range 15 to 35 -> guarantees mult 5.0 or 1.8
          } else {
            initialX = 65 + Math.random() * 20; // range 65 to 85 -> guarantees mult 5.0 or 1.8
          }
        } else {
          initialX = 42 + Math.random() * 16; // range 42 to 58 -> guarantees mult 0.3 or 0.5
        }
        step = 0;
      } else {
        step = Math.random() > 0.5 ? 5.5 : -5.5;
      }
      initialX = Math.max(10, Math.min(90, initialX + step));
      pathPoints.push({ x: initialX, y: (row + 1) * 11 });
    }
    
    setPlinkoHistory(pathPoints);

    setTimeout(() => {
      const finalX = initialX;
      let mult = 0.5;
      if (finalX < 25 || finalX > 75) {
        mult = 5.0; 
      } else if (finalX < 40 || finalX > 60) {
        mult = 1.8; 
      } else {
        mult = 0.3; 
      }
      
      const payout = parseFloat((betAmount * mult).toFixed(2));
      awardWinnings(payout, 'Plinko Multi-drops', 'Multiplier Win');
      setPlinkoMultiplierSelected(mult);
      setIsPlinkoDropping(false);
      
      if (mult > 1.0) {
        triggerNotification('Plinko Multipled Win!', `Rewarded x${mult} payouts total KSh ${payout.toFixed(2)}`, 'general');
      }
    }, 1500);
  };

  // --- TABLE ROULETTE LOGIC ---
  const triggerRouletteSpin = () => {
    if (rouletteSpinning) return;
    if (rouletteSelectedNumber === null && rouletteSelectedColor === null) {
      triggerNotification('Place bet target', 'You must select a number or color to stake first!', 'general');
      return;
    }
    if (!deductFunds(betAmount, 'European Roulette Pro')) return;

    setRouletteSpinning(true);
    setRouletteOutcome(null);

    setTimeout(() => {
      const isReal = authSessionMode === 'real';
      const winRate = isReal ? 0.30 : 0.60;
      const shouldWin = Math.random() < winRate;

      let outcomeNum;
      let color: 'red' | 'black' | 'green';
      const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

      if (shouldWin) {
        if (rouletteSelectedNumber !== null) {
          outcomeNum = rouletteSelectedNumber;
          color = outcomeNum === 0 ? 'green' : (redNumbers.includes(outcomeNum) ? 'red' : 'black');
        } else if (rouletteSelectedColor !== null) {
          color = rouletteSelectedColor;
          if (color === 'red') {
            outcomeNum = redNumbers[Math.floor(Math.random() * redNumbers.length)];
          } else if (color === 'black') {
            const blackNumbers = Array.from({length: 37}, (_, i) => i).filter(n => n !== 0 && !redNumbers.includes(n));
            outcomeNum = blackNumbers[Math.floor(Math.random() * blackNumbers.length)];
          } else {
            outcomeNum = 0;
          }
        } else {
          outcomeNum = Math.floor(Math.random() * 37);
          color = outcomeNum === 0 ? 'green' : (redNumbers.includes(outcomeNum) ? 'red' : 'black');
        }
      } else {
        let attempts = 0;
        let candidateNum = Math.floor(Math.random() * 37);
        let candidateColor: 'red' | 'black' | 'green' = candidateNum === 0 ? 'green' : (redNumbers.includes(candidateNum) ? 'red' : 'black');
        
        while (attempts < 100) {
          let matchesNumber = (rouletteSelectedNumber !== null && rouletteSelectedNumber === candidateNum);
          let matchesColor = (rouletteSelectedColor !== null && rouletteSelectedColor === candidateColor);
          if (!matchesNumber && !matchesColor) {
            break;
          }
          candidateNum = Math.floor(Math.random() * 37);
          candidateColor = candidateNum === 0 ? 'green' : (redNumbers.includes(candidateNum) ? 'red' : 'black');
          attempts++;
        }
        outcomeNum = candidateNum;
        color = candidateColor;
      }

      setRouletteOutcome({ number: outcomeNum, color });
      setRouletteSpinning(false);

      let totalWin = 0;
      if (rouletteSelectedNumber !== null && rouletteSelectedNumber === outcomeNum) {
        totalWin += betAmount * 35;
      }
      if (rouletteSelectedColor !== null && rouletteSelectedColor === color) {
        totalWin += betAmount * 2;
      }

      if (totalWin > 0) {
        awardWinnings(totalWin, 'European Roulette Pro', 'Table Win');
        triggerNotification('Roulette WIN!', `Winner! Drawn number is ${outcomeNum} (${color.toUpperCase()}). You earned KSh ${totalWin}!`, 'general');
      } else {
        triggerNotification('No Match!', `Drawn was ${outcomeNum} (${color.toUpperCase()}). Try another round.`, 'general');
      }
    }, 2000);
  };

  // --- BLACKJACK LOGIC ---
  const initiateBlackjack = () => {
    if (blackjackInGame) return;
    if (!deductFunds(betAmount, 'Classic Blackjack')) return;

    setBlackjackInGame(true);
    setBlackjackStatus('Dealer dealt your starting hand!');

    const suits = ['♠', '♥', '♦', '♣'];
    const cardsPool = [
      { text: 'A', value: 11 }, { text: 'K', value: 10 }, { text: 'Q', value: 10 }, { text: 'J', value: 10 },
      { text: '10', value: 10 }, { text: '9', value: 9 }, { text: '8', value: 8 }, { text: '7', value: 7 },
      { text: '6', value: 6 }, { text: '5', value: 5 }, { text: '4', value: 4 }, { text: '3', value: 3 }, { text: '2', value: 2 }
    ];

    const getCard = () => {
      const item = cardsPool[Math.floor(Math.random() * cardsPool.length)];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      return { text: `${item.text}${suit}`, value: item.value };
    };

    setBlackjackPlayerCards([getCard(), getCard()]);
    setBlackjackDealerCards([getCard(), { text: '🎴 Hidden', value: 0 }]);
  };

  const getCardsSum = (cards: { text: string; value: number }[]) => {
    let sum = cards.reduce((acc, curr) => acc + curr.value, 0);
    let aces = cards.filter(c => c.text.startsWith('A')).length;
    while (sum > 21 && aces > 0) {
      sum -= 10;
      aces -= 1;
    }
    return sum;
  };

  const blackjackHit = () => {
    if (!blackjackInGame) return;
    const suits = ['♠', '♥', '♦', '♣'];
    const cardsPool = [
      { text: 'A', value: 11 }, { text: 'K', value: 10 }, { text: 'Q', value: 10 }, { text: 'J', value: 10 },
      { text: '10', value: 10 }, { text: '9', value: 9 }, { text: '8', value: 8 }, { text: '7', value: 7 },
      { text: '6', value: 6 }, { text: '5', value: 5 }, { text: '4', value: 4 }, { text: '3', value: 3 }, { text: '2', value: 2 }
    ];
    const getCard = () => {
      const item = cardsPool[Math.floor(Math.random() * cardsPool.length)];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      return { text: `${item.text}${suit}`, value: item.value };
    };

    const updated = [...blackjackPlayerCards, getCard()];
    setBlackjackPlayerCards(updated);

    if (getCardsSum(updated) > 21) {
      setBlackjackInGame(false);
      setBlackjackStatus('BUSTED! Exceeded blackjack score of 21.');
      triggerNotification('You went Bust!', 'Round finished. Dealer reclaimed active wager.', 'general');
    }
  };

  const blackjackStand = () => {
    if (!blackjackInGame) return;
    const suits = ['♠', '♥', '♦', '♣'];
    const cardsPool = [
      { text: 'A', value: 11 }, { text: 'K', value: 10 }, { text: 'Q', value: 10 }, { text: 'J', value: 10 },
      { text: '10', value: 10 }, { text: '9', value: 9 }, { text: '8', value: 8 }, { text: '7', value: 7 },
      { text: '6', value: 6 }, { text: '5', value: 5 }, { text: '4', value: 4 }, { text: '3', value: 3 }, { text: '2', value: 2 }
    ];
    const getCard = () => {
      const item = cardsPool[Math.floor(Math.random() * cardsPool.length)];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      return { text: `${item.text}${suit}`, value: item.value };
    };

    const isReal = authSessionMode === 'real';
    const winRate = isReal ? 0.30 : 0.60;
    const shouldWin = Math.random() < winRate;

    const playerSum = getCardsSum(blackjackPlayerCards);
    let dealer: { text: string; value: number }[] = [blackjackDealerCards[0]];

    if (shouldWin) {
      let attempts = 0;
      let dealerCandidate = [blackjackDealerCards[0]];
      while (attempts < 1000) {
        dealerCandidate = [blackjackDealerCards[0], getCard()];
        while (getCardsSum(dealerCandidate) < 17) {
          dealerCandidate.push(getCard());
        }
        const sum = getCardsSum(dealerCandidate);
        if (sum > 21 || sum < playerSum) {
          dealer = dealerCandidate;
          break;
        }
        attempts++;
      }
      if (attempts >= 1000) {
        dealer = [blackjackDealerCards[0], { text: 'Q♠', value: 10 }, { text: 'K♦', value: 10 }];
      }
    } else {
      let attempts = 0;
      let dealerCandidate = [blackjackDealerCards[0]];
      while (attempts < 1000) {
        dealerCandidate = [blackjackDealerCards[0], getCard()];
        while (getCardsSum(dealerCandidate) < 17) {
          dealerCandidate.push(getCard());
        }
        const sum = getCardsSum(dealerCandidate);
        if (sum <= 21 && sum >= playerSum) {
          dealer = dealerCandidate;
          break;
        }
        attempts++;
      }
      if (attempts >= 1000) {
        dealer = [blackjackDealerCards[0], getCard()];
        while (getCardsSum(dealer) < 17) {
          dealer.push(getCard());
        }
      }
    }

    setBlackjackDealerCards(dealer);
    setBlackjackInGame(false);

    const dealerSum = getCardsSum(dealer);

    if (dealerSum > 21) {
      const payout = betAmount * 2;
      awardWinnings(payout, 'Classic Blackjack Multi-hand', 'Dealer Busted Win');
      setBlackjackStatus(`WINNER! Dealer busted with ${dealerSum}! Credited KSh ${payout.toFixed(2)}`);
      triggerNotification('Dealer busted!', `Blackjack profit transferred of KSh ${payout.toFixed(2)}`, 'general');
    } else if (playerSum > dealerSum) {
      const payout = betAmount * 2;
      awardWinnings(payout, 'Classic Blackjack Multi-hand', 'High Score Win');
      setBlackjackStatus(`WINNER! You scored ${playerSum} vs Dealer's ${dealerSum}! Credited KSh ${payout.toFixed(2)}`);
      triggerNotification('Blackjack clear!', `Beated croupier! Won KSh ${payout.toFixed(2)}!`, 'general');
    } else if (playerSum === dealerSum) {
      setWallet(prev => {
        const isReal = authSessionMode === 'real';
        const balanceField = isReal ? 'realBalance' : 'demoBalance';
        const newVal = parseFloat((prev[balanceField] + betAmount).toFixed(2));
        return {
          ...prev,
          [balanceField]: newVal,
          mainBalance: newVal
        };
      });
      setBlackjackStatus(`PUSH! Tied scores at ${playerSum}. Stake returned.`);
    } else {
      setBlackjackStatus(`Dealer Wins with ${dealerSum} vs ${playerSum}. Try another round.`);
    }
  };

  // --- MEGA SPINNING WHEEL ENGINE ---
  // 4 numbers x2 to x9 randomly arranged with 6 enhancing x0, x1 numbers
  const sectorsList = [
    { sector: 'x3', mult: 3, color: '#3b82f6' }, // index 0 (Profit win)
    { sector: 'x0', mult: 0, color: '#252830' }, // index 1 (Loss)
    { sector: 'x5', mult: 5, color: '#10b981' }, // index 2 (Profit win)
    { sector: 'x1', mult: 1, color: '#475569' }, // index 3 (Push)
    { sector: 'x7', mult: 7, color: '#f59e0b' }, // index 4 (Profit win)
    { sector: 'x0', mult: 0, color: '#252830' }, // index 5 (Loss)
    { sector: 'x9', mult: 9, color: '#ec4899' }, // index 6 (Profit win)
    { sector: 'x1', mult: 1, color: '#475569' }, // index 7 (Push)
    { sector: 'x0', mult: 0, color: '#252830' }, // index 8 (Loss)
    { sector: 'x1', mult: 1, color: '#475569' }, // index 9 (Push)
  ];

  const triggerMegaWheel = () => {
    if (wheelSpinning) return;
    if (!deductFunds(betAmount, 'Mega Wheel Spin')) return;

    setWheelSpinning(true);
    setWheelSelectedItem(null);

    // Enforce strict Win Rate silently behind the scenes (60% Demo, 30% Real)
    const isReal = authSessionMode === 'real';
    const winRate = isReal ? 0.30 : 0.60;
    const isWinOutcome = Math.random() < winRate;
    
    let rollIndex = 0;
    if (isWinOutcome) {
      // Land on profit multipliers (indexed x3, x5, x7, x9)
      const winIndices = [0, 2, 4, 6];
      rollIndex = winIndices[Math.floor(Math.random() * winIndices.length)];
    } else {
      // Land on neutral/loss multipliers (indexed x0, x1)
      const loseIndices = [1, 3, 5, 7, 8, 9];
      rollIndex = loseIndices[Math.floor(Math.random() * loseIndices.length)];
    }
    const selected = sectorsList[rollIndex];
    
    // Add multiple rotations (360 * 5) and align degree offset
    const targetRotation = 1800 + (rollIndex * (360 / sectorsList.length));
    setWheelRotation(targetRotation);

    setTimeout(() => {
      setWheelSpinning(false);
      setWheelSelectedItem(selected);

      const payout = parseFloat((betAmount * selected.mult).toFixed(2));

      if (selected.mult > 1) {
        awardWinnings(payout, 'Mega Wheel Spin', 'Wheel Win Payout');
        triggerNotification('Mega Wheel Win!', `Matched multiplier ${selected.sector}! Credited KSh ${payout.toFixed(2)} received!`, 'general');
      } else if (selected.mult === 1) {
        setWallet(prev => {
          const isReal = authSessionMode === 'real';
          const balanceField = isReal ? 'realBalance' : 'demoBalance';
          const newVal = parseFloat((prev[balanceField] + payout).toFixed(2));
          return { ...prev, [balanceField]: newVal, mainBalance: newVal };
        });
        triggerNotification('Wager Returned', `Landed on x1. Push - stake returned.`, 'general');
        addTransaction({
          type: 'win',
          amount: payout,
          currency: 'KSh',
          method: 'Wheel Push Return',
          game: 'Mega Wheel Spin'
        });
      } else {
        triggerNotification('House Wins!', `Stopped on x0. Better luck next spin!`, 'general');
      }
    }, 2800);
  };

  // --- TURBO COIN FLIP ---
  const triggerCoinFlip = () => {
    if (isCoinFlipping) return;
    if (!deductFunds(betAmount, 'Turbo Coin Flip')) return;

    setIsCoinFlipping(true);
    setCoinResult(null);

    setTimeout(() => {
      const isReal = authSessionMode === 'real';
      const winRate = isReal ? 0.30 : 0.60;
      const shouldWin = Math.random() < winRate;
      const randResult: 'heads' | 'tails' = shouldWin ? coinBetOn : (coinBetOn === 'heads' ? 'tails' : 'heads');

      setCoinResult(randResult);
      setIsCoinFlipping(false);

      if (coinBetOn === randResult) {
        const payout = parseFloat((betAmount * 1.96).toFixed(2));
        awardWinnings(payout, 'Turbo Coin Flip', 'Multiplier Win');
        triggerNotification('Coin Flip Win!', `Matched ${randResult.toUpperCase()}! You won KSh ${payout}!`, 'general');
      } else {
        triggerNotification('Flip Lost!', `Landed ${randResult.toUpperCase()}. Try heads next!`, 'general');
      }
    }, 1500);
  };

  // --- MASTER ROLL DICE ENGINE ---
  const triggerDiceRoll = () => {
    if (diceIsRolling) return;
    if (!deductFunds(betAmount, 'Master Roll Dice')) return;

    setDiceIsRolling(true);
    setDiceOutcomeValue(null);

    setTimeout(() => {
      const isReal = authSessionMode === 'real';
      const winRate = isReal ? 0.30 : 0.60;
      const shouldWin = Math.random() < winRate;

      let outcome: number;
      if (shouldWin) {
        if (diceBetType === 'over') {
          const minRange = Math.min(99, diceTargetValue + 0.1);
          outcome = parseFloat((minRange + Math.random() * (99.99 - minRange)).toFixed(2));
        } else {
          const maxRange = Math.max(1, diceTargetValue - 0.1);
          outcome = parseFloat((Math.random() * maxRange).toFixed(2));
        }
      } else {
        if (diceBetType === 'over') {
          const maxRange = Math.max(0.01, diceTargetValue);
          outcome = parseFloat((Math.random() * maxRange).toFixed(2));
        } else {
          const minRange = Math.min(99.98, diceTargetValue);
          outcome = parseFloat((minRange + Math.random() * (99.99 - minRange)).toFixed(2));
        }
      }

      setDiceOutcomeValue(outcome);
      setDiceIsRolling(false);

      let won = false;
      if (diceBetType === 'over' && outcome > diceTargetValue) won = true;
      if (diceBetType === 'under' && outcome < diceTargetValue) won = true;

      if (won) {
        // Payout formula based on risk/target
        const winChance = diceBetType === 'over' ? 100 - diceTargetValue : diceTargetValue;
        const multiplier = parseFloat((98 / winChance).toFixed(2));
        const payout = parseFloat((betAmount * multiplier).toFixed(2));

        awardWinnings(payout, 'Master Roll Dice', 'Multiplier Win');
        triggerNotification('Dice Master Win!', `Rolled ${outcome}! You matched Over/Under target and won KSh ${payout}!`, 'general');
      } else {
        triggerNotification('Roll Missed!', `Outcome ${outcome} did not meet criteria. Adjust and roll again!`, 'general');
      }
    }, 1200);
  };

  const currentWinChance = diceBetType === 'over' ? 100 - diceTargetValue : diceTargetValue;
  const currentMultiplier = parseFloat((98 / currentWinChance).toFixed(2));

  const filteredGames = activeCategory === 'all' 
    ? LISTED_GAMES 
    : LISTED_GAMES.filter(g => g.category === activeCategory);

  return (
    <div id="casino-lobby" className="flex flex-col gap-3 select-none font-sans h-full min-h-0 overflow-hidden">
      
      {/* ACTIVE GAME PLAYING MODULE WINDOW */}
      {selectedGame ? (
        <div className="rounded-2xl bg-gradient-to-br from-[#130722] to-[#080210] border-2 border-purple-500/30 p-5 shadow-[0_0_35px_rgba(147,51,234,0.15)] relative">
          
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <span className="text-xs text-purple-400 font-mono">RTP: {selectedGame.rtp}%</span>
            <button 
              onClick={() => {
                setSelectedGame(null);
                setCrashActive(false);
                if (crashIntervalRef.current) clearInterval(crashIntervalRef.current);
              }}
              className="text-gray-400 hover:text-white px-3 py-1 bg-white/5 rounded text-xs font-black border border-white/10"
            >
              ← Back to Lobby
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl bg-[#261543] p-2 rounded-xl border border-purple-500/15">{selectedGame.emoji}</span>
            <div>
              <div className="text-[10px] text-amber-400 uppercase font-bold tracking-widest">{selectedGame.provider}</div>
              <h3 className="text-lg font-bold text-white uppercase">{selectedGame.title}</h3>
            </div>
          </div>

          <hr className="border-purple-900/30 mb-4" />

          {/* Config stake control panel */}
          <div className="bg-black/40 p-3.5 rounded-xl border border-purple-900/30 mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-purple-300 uppercase font-black font-sans">STAKE AMOUNT:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[10, 50, 200, 1000, 5000, 20000, 100000].map((val) => (
                  <button 
                    key={val}
                    onClick={() => setBetAmount(val)}
                    className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-all ${betAmount === val ? 'bg-amber-400 text-black shadow-md' : 'bg-[#18112b] text-purple-300 border border-purple-500/25 hover:bg-purple-900/20'}`}
                  >
                    {val.toLocaleString()} sh
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-gray-400">Manual Bet:</span>
              <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(Number(e.target.value))}
                onBlur={() => setBetAmount(Math.max(10, Math.min(100000, betAmount || 10)))}
                className="w-24 bg-[#0a0510] text-amber-400 text-center text-sm font-bold border border-purple-800/60 rounded py-1 px-1"
                min={10}
                max={100000}
              />
              <span className="text-xs text-purple-300 font-bold">sh</span>
            </div>
          </div>

          {/* GAME GRAPHICAL PRESENTATION PORT */}
          <div className="min-h-[290px] bg-[#07030c] rounded-xl border border-purple-900/40 p-6 flex flex-col justify-center items-center relative overflow-hidden">
            
            {/* Live Indicator overlay popup */}
            {selectedGame.category === 'live' && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-red-600/95 text-white font-mono px-2 py-0.5 rounded text-[10px] font-black animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span>SECURE HIGH LIMIT CASINO TRANSMISSION</span>
              </div>
            )}

            {/* Visual Win Overlay Banner */}
            {winOverlay && (
              <div className="absolute inset-0 bg-[#06020f]/95 z-40 flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.2),transparent_70%)] pointer-events-none"></div>
                
                <div className="relative z-10 space-y-4 max-w-xs transition-transform transform scale-100 ease-out duration-300">
                  <div className="text-5xl animate-bounce">🏆</div>
                  
                  <div className="space-y-1">
                    <h4 className="text-amber-400 font-extrabold tracking-widest text-[11px] uppercase">
                      {winOverlay.title || 'BIG WINNER!'}
                    </h4>
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)] select-all font-mono">
                      +{winOverlay.amount.toFixed(2)} sh
                    </p>
                  </div>
                  
                  <p className="text-[11px] text-purple-200/80 font-medium font-sans">
                    {winOverlay.message}
                  </p>
                  
                  <button
                    onClick={() => setWinOverlay(null)}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all transform active:scale-[0.97] cursor-pointer shadow-md shadow-amber-500/10"
                  >
                    Collect Winnings
                  </button>
                </div>
              </div>
            )}

            {/* 1. SLOTS CHASSIS CONTROL */}
            {selectedGame.category === 'slots' && (
              <div className="text-center w-full max-w-sm">
                <div className="flex justify-center gap-4 mb-5">
                  {slotsReels.map((symbol, idx) => (
                    <div 
                      key={idx} 
                      className={`w-16 h-20 bg-[#170929] rounded-xl border-2 ${isSpinning ? 'border-amber-400 animate-bounce' : 'border-purple-500'} flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(245,158,11,0.06)]`}
                    >
                      {symbol}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-purple-300 font-mono mb-4">{slotsStatus}</div>
                <button 
                  onClick={triggerSlotSpin}
                  disabled={isSpinning}
                  className="px-8 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black uppercase text-xs tracking-widest rounded shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSpinning ? 'TURNING REELS...' : 'PULL SPIN LEVER'}
                </button>
              </div>
            )}

            {/* 2. AVIATOR & SPACE CRUSH COMPONENT */}
            {(selectedGame.id === 'instant-aviator' || selectedGame.id === 'instant-crush') && (
              <div className="w-full flex flex-col gap-4">
                
                {/* Recent Multipliers history tracker */}
                <div className="flex gap-1.5 mb-1.5 items-center flex-wrap shrink-0">
                  <span className="text-[9px] text-gray-500">History:</span>
                  {crashHistory.map((h, i) => (
                    <span key={i} className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded ${h > 2.0 ? 'bg-purple-950/40 text-purple-300 border border-purple-500/10' : 'bg-red-950/40 text-red-400'}`}>
                      x{h}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
                  
                  {/* Left Graphical rising vector chart */}
                  <div className="md:col-span-8 bg-black/60 rounded-xl relative border border-purple-900/30 h-44 overflow-hidden flex items-center justify-center">
                    {/* Animated background stars/grids */}
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_14px]"></div>

                    {crashActive ? (
                      <div className="text-center z-10">
                        <div className="text-6xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-yellow-600 tracking-tighter animate-pulse">
                          {crashMultiplier.toFixed(2)}x
                        </div>
                        <span className="text-[9px] font-mono text-purple-400 tracking-widest block mt-1 uppercase">multiplier payout</span>
                      </div>
                    ) : (
                      <div className="text-center z-10 px-4">
                        <div className="text-xs text-gray-400 uppercase font-mono tracking-widest mb-1.5">{crashMessage}</div>
                        {crashPreflightPercent > 0 && (
                          <div className="w-48 bg-purple-950 h-1.5 rounded-full mx-auto overflow-hidden border border-purple-900/40">
                            <div className="bg-amber-400 h-full rounded-full transition-all duration-100" style={{ width: `${crashPreflightPercent}%` }}></div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Animated ascending plane emoji */}
                    {crashActive && (
                      <div 
                        className="absolute bottom-5 left-5 text-3xl transition-transform duration-100"
                        style={{ 
                          transform: `translate(${Math.min(270, crashMultiplier * 20)}px, -${Math.min(100, crashMultiplier * 10)}px) scale(1.1)` 
                        }}
                      >
                        {selectedGame.id === 'instant-aviator' ? '🚀' : '☄️'}
                      </div>
                    )}
                  </div>

                  {/* Right Real-time cockpit wagers pane */}
                  <div className="md:col-span-4 bg-[#11071e] p-3 rounded-lg border border-purple-900/30 flex flex-col justify-between">
                    <div>
                      <div className="text-[9px] text-[#fbbf24] font-black uppercase tracking-wider mb-2">Lobby Stake Board</div>
                      <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                        {simulatedPlayers.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[9px] font-mono py-1 border-b border-purple-900/10">
                            <span className="text-purple-300 font-bold">{p.name}</span>
                            <span className="text-gray-500">KSh {p.bet}</span>
                            {p.cashedOut ? (
                              <span className="text-[#22c55e] font-bold font-sans">x{p.mult}</span>
                            ) : crashActive ? (
                              <span className="text-amber-400 animate-pulse">BET</span>
                            ) : (
                              <span className="text-red-500">BUST</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-900/20 text-[9px] text-purple-400 font-mono">
                      <span>Server: <strong>STABLE-SG3</strong></span>
                    </div>
                  </div>

                </div>

                {/* Automation Setup drawer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/30 p-3 rounded-xl border border-purple-900/20">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="enable-auto"
                      checked={autoCashoutEnabled}
                      onChange={(e) => setAutoCashoutEnabled(e.target.checked)}
                      className="rounded border-purple-900 text-purple-600 font-mono accent-amber-500 bg-black"
                    />
                    <label htmlFor="enable-auto" className="text-xs text-purple-300 font-bold uppercase select-none">Auto Cashout</label>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs text-purple-400">Target Mult:</span>
                    <input 
                      type="number"
                      step="0.1"
                      min="1.1"
                      value={autoCashoutValue}
                      disabled={!autoCashoutEnabled}
                      onChange={(e) => setAutoCashoutValue(Math.max(1.1, parseFloat(e.target.value)))}
                      className="w-14 bg-[#0a0510] text-amber-400 text-center font-bold text-xs ring-1 ring-purple-900 rounded py-0.5 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Operating core triggers */}
                <div className="flex gap-4">
                  <button 
                    onClick={launchCrashGame}
                    disabled={crashActive}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-extrabold text-xs uppercase tracking-widest disabled:opacity-40 shadow-lg shadow-purple-900/20"
                  >
                    Place wager & take off
                  </button>
                  <button 
                    onClick={manualCrashCashOut}
                    disabled={!crashActive || crashHasCashedOut}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg text-black font-extrabold text-xs uppercase tracking-widest disabled:opacity-40 shadow-lg shadow-amber-500/20"
                  >
                    CASH OUT ({(betAmount * crashMultiplier).toFixed(2)} sh)
                  </button>
                </div>

              </div>
            )}

            {/* 3. MINES BOX */}
            {selectedGame.id === 'instant-mines' && (
              <div className="w-full flex flex-col items-center">
                <div className="flex justify-between w-full max-w-xs items-center mb-4">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs text-gray-400">Mines target count:</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="20" 
                      value={minesCount} 
                      disabled={minesBetPlaced}
                      onChange={(e) => setMinesCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                      className="w-12 bg-black font-mono text-center text-xs text-white border border-purple-900 rounded py-0.5 outline-none"
                    />
                  </div>
                  <span className="text-xs text-[#fbbf24] font-mono">Multiplier: x{(1 + (minesRevealedCount * (minesCount * 0.16))).toFixed(2)}</span>
                </div>

                {!minesBetPlaced && !minesGameOver ? (
                  <button 
                    onClick={startMinesGame}
                    className="px-8 py-3 bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-lg shadow-lg"
                  >
                    DEPLOY STAKE BET ({betAmount} sh)
                  </button>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="grid grid-cols-5 gap-1.5 mb-4 max-w-[200px]">
                      {minesGrid.map((tile) => (
                        <button 
                          key={tile.id}
                          onClick={() => checkMineTile(tile.id)}
                          disabled={minesGameOver}
                          className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-all ${tile.revealed ? (tile.hasMine ? 'bg-red-600' : 'bg-emerald-600') : 'bg-[#1b1030] hover:bg-purple-900 border border-purple-500/10'}`}
                        >
                          {tile.revealed ? (tile.hasMine ? '💣' : '💎') : ''}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                       <button 
                        onClick={cashOutMines}
                        disabled={minesRevealedCount === 0 || minesGameOver}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded uppercase tracking-wider disabled:opacity-40"
                      >
                        Secured payout ({(betAmount * (1 + (minesRevealedCount * (minesCount * 0.165)))).toFixed(2)} sh)
                      </button>
                      {minesGameOver && (
                        <button 
                          onClick={() => {
                            setMinesGameOver(false);
                            setMinesBetPlaced(false);
                            initializeMines();
                          }}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded uppercase tracking-wider"
                        >
                          ROUND AGAIN
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. PLINKO BOX */}
            {selectedGame.id === 'instant-plinko' && (
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-xs h-40 bg-black/50 rounded-lg relative overflow-hidden flex flex-col justify-end p-2 mb-4 border border-purple-900/30">
                  <div className="absolute inset-0 flex flex-col justify-between py-4 items-center opacity-40">
                    <div className="flex gap-8 text-[8px] text-purple-500 font-black">● ● ● ● ●</div>
                    <div className="flex gap-7 text-[8px] text-purple-500 font-black">● ● ● ● ● ●</div>
                    <div className="flex gap-8 text-[8px] text-purple-500 font-bold">● ● ● ● ● ● ●</div>
                    <div className="flex gap-6 text-[8px] text-purple-500">● ● ● ● ● ● ● ●</div>
                  </div>

                  {isPlinkoDropping && plinkoHistory.map((pt, idx) => (
                    <div 
                      key={idx}
                      className="absolute bg-amber-400 w-2 h-2 rounded-full shadow-[0_0_8px_#fbbf24] transition-all duration-300"
                      style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                    />
                  ))}

                  <div className="flex justify-between gap-1 w-full mt-auto">
                    {['X5.0', 'X1.8', 'X0.3', 'X0.3', 'X1.8', 'X5.0'].map((b, i) => (
                      <div 
                        key={i}
                        className={`flex-1 text-center font-mono py-1 rounded text-[9px] font-bold ${plinkoMultiplierSelected !== null && i === (plinkoMultiplierSelected > 2 ? 0 : plinkoMultiplierSelected < 0.5 ? 2 : 1) ? 'bg-amber-400 text-black scale-105' : 'bg-purple-900/40 text-purple-300'}`}
                      >
                        {b}
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={triggerPlinkoDrop}
                  disabled={isPlinkoDropping}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold rounded text-xs uppercase disabled:opacity-50"
                >
                  {isPlinkoDropping ? 'GRAVITY DROP...' : 'RELEASE BALL'}
                </button>
              </div>
            )}

            {/* 5. EUROPEAN ROULETTE BOX */}
            {selectedGame.id === 'table-euro-roulette' && (
              <div className="w-full flex flex-col items-center">
                <div className="grid grid-cols-5 gap-1.5 mb-4 max-w-sm">
                  <button 
                    onClick={() => { setRouletteSelectedColor('red'); setRouletteSelectedNumber(null); }}
                    className={`col-span-2 py-2 rounded text-xs font-bold text-white transition-all bg-red-600 border ${rouletteSelectedColor === 'red' ? 'border-amber-400 ring-2 ring-amber-400' : 'border-transparent opacity-80'}`}
                  >
                    RED SECTOR (2x)
                  </button>
                  <button 
                    onClick={() => { setRouletteSelectedColor('green'); setRouletteSelectedNumber(null); }}
                    className={`col-span-1 py-1 rounded text-xs font-bold text-white transition-all bg-emerald-600 border ${rouletteSelectedColor === 'green' ? 'border-amber-400 ring-2 ring-amber-400' : 'border-transparent'}`}
                  >
                    ZERO (35x)
                  </button>
                  <button 
                    onClick={() => { setRouletteSelectedColor('black'); setRouletteSelectedNumber(null); }}
                    className={`col-span-2 py-2 rounded text-xs font-bold text-white transition-all bg-neutral-900 border ${rouletteSelectedColor === 'black' ? 'border-amber-400 ring-2 ring-amber-400' : 'border-transparent opacity-80'}`}
                  >
                    BLACK SECTOR (2x)
                  </button>

                  {[7, 14, 21, 28, 35].map((num) => (
                    <button 
                      key={num}
                      onClick={() => { setRouletteSelectedNumber(num); setRouletteSelectedColor(null); }}
                      className={`py-1.5 rounded text-xs font-mono transition-all font-bold ${rouletteSelectedNumber === num ? 'bg-amber-400 text-black border border-amber-500' : 'bg-purple-950/40 text-purple-200 border border-purple-500/10 hover:bg-purple-900/30'}`}
                    >
                      #{num} (35x)
                    </button>
                  ))}
                </div>

                {rouletteOutcome && (
                  <div className="mb-4 text-center select-text font-mono text-xs">
                    <span className="text-gray-400">Outcome Sector: </span>
                    <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ml-1 ${rouletteOutcome.color === 'red' ? 'bg-red-600 text-white' : rouletteOutcome.color === 'green' ? 'bg-emerald-600 text-white' : 'bg-neutral-800 text-gray-200 border border-purple-500/20'}`}>
                      {rouletteOutcome.color.toUpperCase()} {rouletteOutcome.number}
                    </span>
                  </div>
                )}

                <button 
                  onClick={triggerRouletteSpin}
                  disabled={rouletteSpinning}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded text-xs uppercase disabled:opacity-50 shadow-lg"
                >
                  {rouletteSpinning ? 'SPINNING ROULETTE...' : 'SPIN THE ROULETTE'}
                </button>
              </div>
            )}

            {/* 6. BLACKJACK CARD HOUSE */}
            {selectedGame.id === 'table-classic-blackjack' && (
              <div className="w-full flex flex-col items-center">
                {blackjackInGame ? (
                  <div className="w-full max-w-sm flex flex-col gap-3">
                    
                    <div className="bg-black/30 p-2.5 rounded-lg border border-purple-900/20">
                      <div className="text-[10px] text-purple-400 font-bold mb-1 uppercase shrink-0">Dealer Hand</div>
                      <div className="flex gap-1.5">
                        {blackjackDealerCards.map((c, i) => (
                          <span key={i} className="px-2.5 py-1 bg-purple-900/30 text-white font-bold font-mono rounded border border-purple-500/20 text-xs">
                            {c.text}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-black/30 p-2.5 rounded-lg border border-amber-500/20">
                      <div className="text-[10px] text-amber-500 font-bold mb-1 uppercase tracking-wider">Your Hand (Value: {getCardsSum(blackjackPlayerCards)})</div>
                      <div className="flex gap-1.5">
                        {blackjackPlayerCards.map((c, i) => (
                          <span key={i} className="px-2.5 py-1 bg-[#1e0e33] text-white font-bold font-mono rounded border border-purple-400/30 text-xs">
                            {c.text}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-1.5">
                      <button 
                        onClick={blackjackHit}
                        className="flex-1 py-1.5 bg-purple-600 text-white font-bold rounded text-xs uppercase hover:bg-purple-700 transition-colors"
                      >
                        HIT CARD
                      </button>
                      <button 
                        onClick={blackjackStand}
                        className="flex-1 py-1.5 bg-amber-400 text-black font-bold rounded text-xs uppercase hover:bg-amber-500 transition-all"
                      >
                        STAND BOARD
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-xs text-purple-300 font-mono mb-4">{blackjackStatus}</div>
                    <button 
                      onClick={initiateBlackjack}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold rounded text-xs uppercase"
                    >
                      DEAL DECK STAKE ({betAmount.toLocaleString()} sh)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 7. LIVE CASINO BROADCASTING */}
            {selectedGame.category === 'live' && (
              <div className="w-full flex flex-col md:flex-row gap-4 h-full">
                
                <div className="flex-1 hover:scale-[1.01] transition-transform duration-300 bg-[#050208] border border-red-500/30 relative rounded-xl h-44 overflow-hidden flex items-center justify-center">
                  <div className="absolute right-3 top-3 bg-black/80 backdrop-blur-md border border-purple-900/40 px-2 rounded text-[7px] text-purple-300 font-mono font-bold flex flex-col">
                    <span>BROADCAST: OK</span>
                    <span>1080P @60FPS HL</span>
                  </div>

                  <div className="text-center z-10 px-4">
                    <div className="text-2xl mb-1 animate-pulse">📼</div>
                    <div className="text-xs font-black text-white uppercase italic tracking-wider">
                      LIVE STREAM CO-ESTABLISHING
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">
                      Macau Room High rollers studio table #{selectedGame.id.split('-')[1].toUpperCase()}
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 bg-black/80 py-1 px-2.5 rounded text-[10px] text-amber-400 font-mono flex items-center justify-between border border-purple-900/40">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      <span>Presenter: <strong>{selectedGame.liveDealerName}</strong></span>
                    </div>
                    <span>Stakes timer: <strong className="text-red-400">{liveDealerTime}s</strong></span>
                  </div>
                </div>

                <div className="w-full md:w-48 bg-[#090312] p-2.5 rounded-lg border border-purple-900/30 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-purple-400 font-bold block mb-1 uppercase font-mono">Place chips here</span>
                    
                    <div className="grid grid-cols-2 gap-1 mb-1.5">
                      <button 
                        onClick={() => { setLiveUserBetOn('red'); deductFunds(betAmount, `Live Live ${selectedGame?.title}`); }}
                        className={`py-1 rounded text-[9px] font-bold text-white transition-all bg-red-600/90 ${liveUserBetOn === 'red' ? 'ring-2 ring-amber-400' : 'opacity-80'}`}
                      >
                        RED (2x)
                      </button>
                      <button 
                        onClick={() => { setLiveUserBetOn('black'); deductFunds(betAmount, `Live Live ${selectedGame?.title}`); }}
                        className={`py-1 rounded text-[9px] font-bold text-white bg-neutral-900 ${liveUserBetOn === 'black' ? 'ring-2 ring-amber-400' : 'opacity-80'}`}
                      >
                        BLACK (2x)
                      </button>
                    </div>

                    <button 
                      onClick={() => { setLiveUserBetOn('green'); deductFunds(betAmount, `Live Live ${selectedGame?.title}`); }}
                      className={`w-full py-1 rounded text-[9px] font-bold text-white bg-emerald-600 mb-1.5 ${liveUserBetOn === 'green' ? 'ring-2 ring-amber-400' : ''}`}
                    >
                      ZERO GREEN (35x)
                    </button>
                    
                    <div className="bg-black/30 py-1 px-1.5 rounded text-[8px] text-purple-300 italic max-h-[35px] overflow-y-auto leading-normal">
                      {liveDealerChatMessage}
                    </div>
                  </div>

                  <div className="text-[8px] text-center text-gray-500 font-mono flex items-center justify-center gap-1 shrink-0 mt-1">
                    <span>Recent Spins: </span>
                    {liveDealerPrevWins.slice(0, 2).map((w, i) => (
                      <span key={i} className={`px-1 rounded ${w.startsWith('RED') ? 'text-red-400' : 'text-gray-300 bg-neutral-900'}`}>
                        {w}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 8. PREMIER SVG SPIN WHEEL ENGINE */}
            {selectedGame.id === 'instant-wheel' && (
              <div className="w-full flex flex-col md:flex-row gap-5 items-center justify-center">
                
                {/* Visual Wheel Rotator Container */}
                <div className="relative flex flex-col items-center">
                  {/* Pin stopper indicator ticker */}
                  <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-amber-400 absolute -top-1.5 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div>

                  <div 
                    className="w-36 h-36 rounded-full border-4 border-purple-500/30 relative overflow-hidden shadow-[0_0_20px_rgba(147,51,234,0.15)] flex items-center justify-center bg-black"
                    style={{ 
                      transform: `rotate(-${wheelRotation}deg)`, 
                      transition: wheelSpinning ? 'transform 2.8s cubic-bezier(0.2, 0.8, 0.25, 1)' : 'none'
                    }}
                  >
                    {/* SVG segments for high quality presentation */}
                    <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0">
                      {sectorsList.map((sec, idx) => {
                        const angle = 360 / sectorsList.length;
                        const startAngle = idx * angle;
                        const endAngle = startAngle + angle;
                        const rad = Math.PI / 180;
                        const x1 = 50 + 50 * Math.cos(startAngle * rad);
                        const y1 = 50 + 50 * Math.sin(startAngle * rad);
                        const x2 = 50 + 50 * Math.cos(endAngle * rad);
                        const y2 = 50 + 50 * Math.sin(endAngle * rad);
                        return (
                          <path 
                            key={idx}
                            d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                            fill={sec.color}
                            opacity="0.80"
                            stroke="#130722"
                            strokeWidth="1"
                          />
                        );
                      })}
                    </svg>

                    {/* Overlay sectors content descriptors */}
                    <div className="absolute w-full h-full inset-0 pointer-events-none">
                      {sectorsList.map((sec, idx) => {
                        const angle = (360 / sectorsList.length) * idx + (360 / sectorsList.length)/2;
                        return (
                          <div 
                            key={idx}
                            className="absolute text-[8px] font-mono font-black text-white shrink-0 tracking-widest origin-center"
                            style={{ 
                              left: '50%', 
                              top: '50%',
                              transform: `translate(-50%, -50%) rotate(${angle}deg) translate(0, -42px)` 
                            }}
                          >
                            {sec.sector}
                          </div>
                        );
                      })}
                    </div>

                    <div className="w-12 h-12 bg-[#0c0516] rounded-full absolute border border-purple-500/40 shadow-inner z-10 flex items-center justify-center font-bold text-[9px] text-[#fbbf24]">
                      SPIN
                    </div>
                  </div>

                  {wheelSelectedItem && (
                    <div className="mt-2.5 bg-black/40 px-3 py-1 rounded border border-purple-900/40 select-text text-[10px] text-center font-mono">
                      <span>Landed: </span>
                      <strong style={{ color: wheelSelectedItem.color || '#fbbf24' }}>{wheelSelectedItem.sector}</strong>
                    </div>
                  )}
                </div>

                {/* Right sector picker info layout */}
                <div className="w-full md:w-48 bg-[#0a0513] p-4 rounded-xl border border-purple-900/30 text-left flex flex-col justify-between min-h-[170px]">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold tracking-widest mb-1.5 block uppercase">Multiplier Wheel</span>
                    <p className="text-[10px] text-purple-200/70 leading-relaxed mb-3">
                      Place your stake, click spin, and secure whatever multiplier lands directly!
                    </p>
                    
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-[9px] bg-purple-950/20 px-2 py-0.5 rounded border border-purple-900/10 font-mono">
                        <span className="text-purple-300">Wager Sectors:</span>
                        <span className="text-amber-400 font-bold">x3, x5, x7, x9</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] bg-purple-950/20 px-2 py-0.5 rounded border border-purple-900/10 font-mono">
                        <span className="text-purple-400">Base Sectors:</span>
                        <span className="text-gray-400">x0 (Loss), x1 (Push)</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={triggerMegaWheel}
                    disabled={wheelSpinning}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black uppercase text-[10px] tracking-widest rounded-lg shadow-lg shadow-amber-500/10 active:scale-95 transition-all disabled:opacity-50 cursor-pointer hover:shadow-yellow-500/20"
                  >
                    {wheelSpinning ? 'SPINNING...' : 'SPIN WHEEL'}
                  </button>
                </div>

              </div>
            )}

            {/* 9. TURBO COIN FLIP PANEL */}
            {selectedGame.id === 'instant-coinflip' && (
              <div className="w-full flex flex-col md:flex-row gap-5 items-center justify-center">
                
                {/* Graphical flipping Coin visualizer */}
                <div className="flex flex-col items-center justify-center relative">
                  <div 
                    className={`w-28 h-28 rounded-full border-4 border-amber-400 bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-500 shadow-[0_0_20px_rgba(245,158,11,0.30)] flex items-center justify-center relative transition-transform duration-150 ${isCoinFlipping ? 'animate-spin' : ''}`}
                  >
                    <div className="w-24 h-24 rounded-full border border-yellow-300 bg-transparent flex flex-col items-center justify-center">
                      <span className="text-3xl">🪙</span>
                      <strong className="text-xs font-serif font-black tracking-widest text-[#0c0516] select-none text-center">
                        {coinResult ? coinResult.toUpperCase() : coinBetOn.toUpperCase()}
                      </strong>
                    </div>
                  </div>

                  {coinResult && (
                    <div className="mt-3 bg-black/40 px-2.5 py-0.5 rounded border border-purple-900/30 text-[10px] font-mono text-amber-400">
                      Result: <strong className="font-extrabold">{coinResult.toUpperCase()}</strong>
                    </div>
                  )}
                </div>

                {/* Coin options chips selection */}
                <div className="w-full md:w-44 bg-[#0a0513] p-3 rounded-lg border border-purple-900/30 text-left">
                  <span className="text-[10px] text-purple-400 font-bold tracking-widest mb-2 block uppercase">Pick Heads/Tails</span>
                  
                  <div className="flex gap-2 mb-3">
                    <button 
                      onClick={() => setCoinBetOn('heads')}
                      className={`flex-1 py-2 rounded text-xs font-mono font-bold transition-all ${coinBetOn === 'heads' ? 'bg-amber-400 text-black border-amber-500' : 'bg-purple-950/40 text-purple-200 border border-purple-500/10 hover:bg-purple-900/20'}`}
                    >
                      HEADS
                    </button>
                    <button 
                      onClick={() => setCoinBetOn('tails')}
                      className={`flex-1 py-2 rounded text-xs font-mono font-bold transition-all ${coinBetOn === 'tails' ? 'bg-amber-400 text-black border-amber-500' : 'bg-purple-950/40 text-purple-200 border border-purple-500/10 hover:bg-purple-900/20'}`}
                    >
                      TAILS
                    </button>
                  </div>

                  <button 
                    onClick={triggerCoinFlip}
                    disabled={isCoinFlipping}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold uppercase text-[10px] tracking-widest rounded disabled:opacity-50 shadow-lg shadow-purple-900/20"
                  >
                    {isCoinFlipping ? 'FLIPPING COIN...' : 'FLIP TURBO COIN'}
                  </button>
                </div>

              </div>
            )}

            {/* 10. MASTER ROLL DICE GAME */}
            {selectedGame.id === 'instant-dice' && (
              <div className="w-full flex flex-col gap-4 max-w-sm">
                
                {/* Risk Over/Under selection board */}
                <div className="grid grid-cols-2 gap-2 bg-black/40 p-2 rounded-xl border border-purple-900/20">
                  <button 
                    onClick={() => setDiceBetType('over')}
                    className={`py-1.5 rounded text-xs font-bold transition-all uppercase flex items-center justify-center gap-1 ${diceBetType === 'over' ? 'bg-purple-600 text-white shadow' : 'bg-[#120a22]/50 text-purple-300'}`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Over Target
                  </button>
                  <button 
                    onClick={() => setDiceBetType('under')}
                    className={`py-1.5 rounded text-xs font-bold transition-all uppercase flex items-center justify-center gap-1 ${diceBetType === 'under' ? 'bg-purple-600 text-white shadow' : 'bg-[#120a22]/50 text-purple-300'}`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" /> Under Target
                  </button>
                </div>

                {/* Target slider controls */}
                <div className="bg-[#11071d] p-3 rounded-lg border border-purple-900/30 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-purple-300 uppercase">
                    <span>Target Target: {diceTargetValue.toFixed(2)}</span>
                    <span>Win Probability: {currentWinChance.toFixed(2)}%</span>
                  </div>

                  {/* Interactive Slider Input wrapper */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-gray-500">0.01</span>
                    <input 
                      type="range"
                      min="1.00"
                      max="98.00"
                      step="0.5"
                      value={diceTargetValue}
                      onChange={(e) => setDiceTargetValue(parseFloat(e.target.value))}
                      className="flex-1 accent-amber-400 h-1 bg-purple-950 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] font-mono font-bold text-gray-500">98.00</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                    <span>Calculated Pay Multiplier: <strong className="text-amber-400">x{currentMultiplier}</strong></span>
                    <span>Payout: <strong className="text-purple-300">{(betAmount * currentMultiplier).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sh</strong></span>
                  </div>
                </div>

                {/* Display RNG Outcomes rolling results */}
                <div className="h-16 bg-[#040108] border border-purple-950/50 rounded-xl flex items-center justify-center relative overflow-hidden font-bold">
                  {diceIsRolling ? (
                    <span className="text-sm text-amber-500 font-mono tracking-widest animate-pulse">ROLLING RNG CODES...</span>
                  ) : diceOutcomeValue !== null ? (
                    <div className="text-center font-mono select-text">
                      <span className="text-[9px] text-gray-500 block">DICE OUTCOME</span>
                      <strong className={`text-2xl tracking-tighter ${((diceBetType === 'over' && diceOutcomeValue > diceTargetValue) || (diceBetType === 'under' && diceOutcomeValue < diceTargetValue)) ? 'text-[#22c55e]' : 'text-red-500'}`}>
                        {diceOutcomeValue.toFixed(2)}
                      </strong>
                    </div>
                  ) : (
                    <span className="text-[10px] text-purple-500 font-mono">DICE SYSTEM STABLE ON RNG SECURE</span>
                  )}
                </div>

                <button 
                  onClick={triggerDiceRoll}
                  disabled={diceIsRolling}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold uppercase text-xs tracking-widest rounded-lg shadow-lg"
                >
                  ROLL SECURE DICE
                </button>

              </div>
            )}

          </div>

          <div className="mt-3.5 flex items-center justify-between text-[10px] text-purple-400/50">
            <span>Minimum wager limit: {selectedGame.minBet.toLocaleString('en-US', { minimumFractionDigits: 2 })} sh</span>
            <span className="flex items-center gap-1">🛡️ Provably Fair RNG Verified</span>
            <span>Maximum wager limit: {selectedGame.maxBet.toLocaleString('en-US', { minimumFractionDigits: 2 })} sh</span>
          </div>

        </div>
      ) : (
        /* STANDARD ALL CATEGORIES LOBBY GAMES LIST GRID CONTAINER */
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden relative">
          
          {/* LOBBY NAV SWITCHER */}
          <div className="bg-[#121318]/90 p-1 rounded-xl border border-purple-500/15 flex items-center gap-1 shrink-0 text-xs font-bold font-sans">
            <button
              onClick={() => setLobbyTab('games')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${lobbyTab === 'games' ? 'bg-[#9333ea] text-white shadow-[0_0_12px_rgba(147,51,234,0.3)] font-extrabold' : 'bg-transparent text-[#9b9da4] hover:text-[#d1d2d6]'}`}
            >
              <span>🎰</span>
              <span className="uppercase text-[10.5px]">Stake Games</span>
            </button>
            <button
              onClick={() => setLobbyTab('offers')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${lobbyTab === 'offers' ? 'bg-[#9333ea] text-white shadow-[0_0_12px_rgba(147,51,234,0.3)] font-extrabold' : 'bg-transparent text-[#9b9da4] hover:text-[#d1d2d6]'}`}
            >
              <span>🎁</span>
              <span className="uppercase text-[10.5px]">Offers & VIP</span>
            </button>
            <button
              onClick={() => setLobbyTab('affiliate')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${lobbyTab === 'affiliate' ? 'bg-[#9333ea] text-white shadow-[0_0_12px_rgba(147,51,234,0.3)] font-extrabold' : 'bg-transparent text-[#9b9da4] hover:text-[#d1d2d6]'}`}
            >
              <span>🤝</span>
              <span className="uppercase text-[10.5px]">Affiliate</span>
            </button>
          </div>

          {/* TAB CONTENT 1: GAMES */}
          {lobbyTab === 'games' && (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 min-h-0 scrollbar-thin scrollbar-thumb-purple-900/30">

              {/* 1. BRAND CAROUSEL SLIDESHOW ACCENT */}
          <div className="relative rounded-2xl overflow-hidden min-h-[140px] xs:min-h-[170px] sm:min-h-[210px] md:min-h-[235px] bg-gradient-to-br from-[#101115] via-[#1b1c23] to-[#0c0d11] border border-neutral-800 shadow-xl select-none">
            {/* Slides Mapping */}
            {(() => {
              const slides = [
                {
                  title: "CLAIM AVIATOR STUDIO RAIN FREEBETS",
                  subtitle: "ZA KSh 97!",
                  desc: "Bet na KSh 70 Bob Na Uwe Na Account Balance Ya KSh 50 KES To Claim Free Raindrops!",
                  badge: "RAIN FREEBETS",
                  color: "from-red-600 via-rose-750 to-amber-600",
                  icon: "✈️"
                },
                {
                  title: "FIFA WORLD CUP 2026",
                  subtitle: "HIGHLIGHT ODDS SPECIAL",
                  desc: "From 11th June to 19th July 2026. Place your premium sports predictions at KE7.com!",
                  badge: "SPORTSBOOK LIVE",
                  color: "from-blue-600 via-[#1e3a8a] to-indigo-600",
                  icon: "⚽"
                },
                {
                  title: "GET 50% MATCHING BONUS",
                  subtitle: "ON YOUR FIRST DEPOSIT!",
                  desc: "Kickstart your real-account casino journey with instant play matches and safe limits!",
                  badge: "WELCOME BONUS",
                  color: "from-emerald-600 via-emerald-800 to-teal-600",
                  icon: "🎁"
                },
                {
                  title: "PASSIVE COFFER MONEY ENGINE",
                  subtitle: "10% COMMISSION FOREVER",
                  desc: "Share your code/link and claim a solid 10% cash commission on every deposit friends make!",
                  badge: "REFERRAL AFFILIATE",
                  color: "from-amber-600 via-[#d97706] to-yellow-500",
                  icon: "💎"
                },
                {
                  title: "MEGA JACKPOT LUCKY WHEEL",
                  subtitle: "SPIN FOR EVERY 50 KES STAKED!",
                  desc: "Earn an exclusive free lucky wheel multiplier attempt for every KSh 50 wagered in the lobby!",
                  badge: "GOLDEN ROTATOR",
                  color: "from-purple-600 via-purple-800 to-pink-600",
                  icon: "🎡"
                }
              ];
              const slide = slides[currentSlide];
              return (
                <div className={`p-4 xs:p-6 md:p-8 flex items-center justify-between gap-6 h-full w-full bg-gradient-to-r ${slide.color} transition-all duration-700 ease-in-out relative min-h-[140px] xs:min-h-[170px] sm:min-h-[210px] md:min-h-[235px]`}>
                  {/* Decorative faint background graphics */}
                  <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
                  <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

                  <div className="space-y-1.5 text-left max-w-xl z-10 select-text font-sans">
                    <span className="px-2 py-0.5 rounded bg-black/40 text-yellow-400 border border-yellow-400/30 text-[8px] xs:text-[9px] font-black tracking-widest uppercase inline-block">
                      {slide.badge}
                    </span>
                    <h3 className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-black text-white leading-tight uppercase tracking-tight">
                      {slide.title} <strong className="text-yellow-400 font-black block sm:inline">{slide.subtitle}</strong>
                    </h3>
                    <p className="text-[9.5px] xs:text-[11px] sm:text-xs text-neutral-100 max-w-lg leading-relaxed font-sans opacity-95 line-clamp-2 md:line-clamp-none">
                      {slide.desc}
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-black/25 text-4xl md:text-5xl shrink-0 border border-white/10 select-none animate-bounce z-10 shadow-lg">
                    {slide.icon}
                  </div>
                </div>
              );
            })()}

            {/* Slider Dots indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {[0, 1, 2, 3, 4].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${currentSlide === idx ? 'bg-yellow-400 w-3.5 shadow-md' : 'bg-neutral-600'}`}
                />
              ))}
            </div>
          </div>

          {/* 2. MEGAPHONE BANNER MARQUEE */}
          <div className="bg-[#111215] border border-yellow-500/15 rounded-xl px-3.5 py-2 flex items-center gap-2.5 overflow-hidden text-xs text-amber-105 select-none relative z-10 shadow-sm font-sans">
            <span className="text-yellow-400 font-extrabold shrink-0 text-base animate-pulse">📢</span>
            <div className="flex-1 overflow-hidden relative h-5 flex items-center">
              {/* Marquee Ticker */}
              <div className="whitespace-nowrap flex gap-8 font-mono tracking-wide text-[10px] text-neutral-300 animate-marquee relative">
                <span>Welcome to www.KE7.com! Minimum cashier deposit is KSh 100 threshold. Placed real stakes generate +30% VIP Loyalty points automatically. Play safe and gamble responsibly. Aviator Studio freebets raindrop promotion is now active! Live customer support channels are open 24/7/365.</span>
                <span>Welcome to www.KE7.com! Minimum cashier deposit is KSh 100 threshold. Placed real stakes generate +30% VIP Loyalty points automatically. Play safe and gamble responsibly. Aviator Studio freebets raindrop promotion is now active! Live customer support channels are open 24/7/365.</span>
              </div>
            </div>
            
            {/* Custom CSS injector to guarantee flawless infinite marquee scrolling */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes marquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                display: flex;
                width: max-content;
                animation: marquee 25s linear infinite;
              }
            `}} />
          </div>
          </div>
          )}

          {/* TAB CONTENT 2: OFFERS & VIP */}
          {lobbyTab === 'offers' && (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 min-h-0 scrollbar-thin scrollbar-thumb-purple-900/30 p-1">

              {/* 3. PHYSICAL DIGIT LIVE PROGRESSIVE JACKPOT COUNTER */}
          <div className="bg-gradient-to-r from-yellow-600/10 via-[#101114] to-yellow-600/10 border-2 border-yellow-500/35 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none relative overflow-hidden shadow-md shadow-yellow-500/5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/5 via-transparent to-transparent pointer-events-none"></div>
            
            <div className="flex flex-col gap-1 items-start text-left z-10">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-[9px] font-black tracking-widest uppercase shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                🏆 GLOBAL TOURNAMENT PROGRESSIVE JACKPOT
              </span>
              <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1.5 uppercase mt-0.5">
                NEXT LIVE SPLASH DRAW TIME: <strong className="text-yellow-400 font-black tracking-wide">21:00 EAT</strong>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
              </span>
            </div>
            
            {/* Real Ticking Digit Panels */}
            <div className="flex flex-wrap items-center justify-start md:justify-end gap-0.5 sm:gap-1 font-mono text-sm xs:text-base sm:text-lg md:text-xl xl:text-2xl font-black z-10 animate-fadeIn min-w-0 max-w-full">
              <span className="text-yellow-400 font-sans tracking-wide text-xs sm:text-sm uppercase mr-1">KSh</span>
              {Math.floor(ke7Jackpot).toLocaleString().split('').map((char, idx) => {
                if (char === ',') {
                  return <span key={idx} className="text-yellow-500 mx-0.5 font-bold">,</span>;
                }
                return (
                  <span key={idx} className="bg-[#0b0c10] text-[#ffbf00] border-y border-yellow-500/35 rounded px-1 py-0.5 sm:px-2 sm:py-1 shadow-inner shadow-black font-black text-center min-w-[15px] xs:min-w-[18px] sm:min-w-[22px]">
                    {char}
                  </span>
                );
              })}
              <span className="text-yellow-500 font-bold">.</span>
              <span className="bg-[#0b0c10] text-[#ffbf00] border-y border-yellow-500/35 rounded px-1 py-0.5 sm:px-1.5 sm:py-1 text-xs sm:text-base font-black">
                {ke7Jackpot.toFixed(2).split('.')[1]}
              </span>
            </div>
          </div>
          
          {/* Game of the Week Prominent Premium Showcase */}
          {gameOfTheWeek && (() => {
            const gotwGame = LISTED_GAMES.find(g => g.id === gameOfTheWeek.gameId) || LISTED_GAMES[0];
            return (
              <div className="flex flex-col gap-4">
                <div className="bg-gradient-to-br from-[#1c133a] via-[#120d24] to-[#1d0e37] border-2 border-amber-500/30 rounded-2xl p-4 sm:p-6 select-none relative overflow-hidden shadow-[0_12px_45px_rgba(245,158,11,0.06)] animate-fadeIn">
                  {/* Decorative ambient background lights */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-start sm:items-center gap-4 text-left">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40 flex items-center justify-center text-4xl shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse">
                        {gotwGame?.emoji || '🏆'}
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black tracking-widest uppercase shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                            👑 GAME OF THE WEEK LIMITLESS
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-[#00e600] text-[9px] font-mono font-black uppercase tracking-wider">
                            {gameOfTheWeek.promoValue || '3x Loyalty'}
                          </span>
                          <span className="text-[10px] text-amber-300 font-bold font-mono bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ⏰ {gotwTimeLeft}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">
                          {gameOfTheWeek.bannerTitle || `${gotwGame?.title} Weekly Splash!`}
                        </h3>
                        <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                          {gameOfTheWeek.description || `Play ${gotwGame?.title} this week to claim enhanced 3x Loyalty VIP points, exclusive loss cashbacks, and special matching bonuses!`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0 z-20">
                      <button
                        onClick={() => setShowGotwPromoModal(true)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-purple-950/50 border border-purple-500/30 hover:bg-purple-900/45 text-purple-300 hover:text-purple-200 font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer text-center"
                      >
                        🎁 Claim Match Bonus
                      </button>
                      <button
                        onClick={() => {
                          if (gotwGame) handleGameSelect(gotwGame);
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Launch & Spin 🚀
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Benefits Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-purple-900/40 relative z-10 text-[11px]">
                    <div className="bg-[#120a21]/60 border border-purple-500/10 p-2.5 rounded-xl text-left flex items-start gap-2.5">
                      <span className="text-amber-400 text-lg">💎</span>
                      <div>
                        <strong className="text-gray-200 block font-bold leading-tight uppercase text-[9.5px]">3x VIP Loyalty Points</strong>
                        <span className="text-gray-400">Earn +30% VIP points on each game wager instead of the standard 10%.</span>
                      </div>
                    </div>
                    <div className="bg-[#120a21]/60 border border-purple-500/10 p-2.5 rounded-xl text-left flex items-start gap-2.5">
                      <span className="text-[#00e600] text-lg">🛡️</span>
                      <div>
                        <strong className="text-gray-200 block font-bold leading-tight uppercase text-[9.5px]">+15% High Cashback</strong>
                        <span className="text-gray-400">Enjoy safe-side returns! Loss-protection boost credited straight to Cashback Wallet.</span>
                      </div>
                    </div>
                    <div className="bg-[#120a21]/60 border border-purple-500/10 p-2.5 rounded-xl text-left flex items-start gap-2.5">
                      <span className="text-purple-400 text-lg">🎁</span>
                      <div>
                        <strong className="text-gray-200 block font-bold leading-tight uppercase text-[9.5px]">Double Pocket Match</strong>
                        <span className="text-gray-400">100% balance bonus matched instantly when depositing using promotion codes.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SNEAK PEEK & COMMUNITY VOTING SYSTEM FOR NEXT WEEK'S GAME */}
                <div className="bg-[#101015] border border-[#21232c] rounded-2xl p-4 sm:p-5 select-none relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-gray-800/20 pb-3">
                    <div className="text-left">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        🗳️ Next Week's Game of the Week Vote
                      </h4>
                      <p className="text-[10px] text-gray-500">Pick next week's featured game & bonuses. Current top choice wins!</p>
                    </div>
                    {nextWeekVotedId && (
                      <span className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block animate-slideDown">
                        ✓ Your Vote is Cast!
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left animate-fadeIn">
                    {[
                      { id: 'slot-video', title: 'Gates of Valhalla', emoji: '🎰', desc: 'Pragmatic Video Slot with multiplying multipliers.' },
                      { id: 'live-roulette', title: 'Lightning Roulette', emoji: '🎡', desc: 'Evolution Live Dealer with up to 500x high lightning strikes.' },
                      { id: 'instant-mines', title: 'Mines Gold Mines', emoji: '💣', desc: 'Original Mines guessing game. Uncover multipliers, avoid bombs.' }
                    ].map(candidate => {
                      const votes = nextWeekVotes[candidate.id] || 0;
                      const totalVotes = (Object.values(nextWeekVotes) as number[]).reduce((a, b) => a + b, 0);
                      const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                      const isVotedThis = nextWeekVotedId === candidate.id;

                      return (
                        <div 
                          key={candidate.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isVotedThis 
                              ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
                              : 'bg-[#15161d] border-[#22242c] hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-2xl">{candidate.emoji}</span>
                            <span className="text-[10px] font-mono font-bold text-gray-400 bg-black/40 px-1.5 py-0.5 rounded">
                              {votes} votes ({percent}% )
                            </span>
                          </div>
                          <h5 className="text-[11px] font-black text-white uppercase truncate">{candidate.title}</h5>
                          <p className="text-[9.5px] text-gray-500 leading-tight mb-3 h-6 line-clamp-2">{candidate.desc}</p>
                          
                          {/* Vote Percent Slider Track */}
                          <div className="w-full bg-black/50 h-1.5 rounded-full mb-3 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${isVotedThis ? 'bg-amber-400' : 'bg-purple-600'}`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>

                          <button
                            onClick={() => handleVoteForNextWeek(candidate.id)}
                            disabled={nextWeekVotedId !== null}
                            className={`w-full py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                              isVotedThis 
                                ? 'bg-amber-500 text-black font-black' 
                                : nextWeekVotedId 
                                  ? 'bg-[#1c1d24] text-gray-600 cursor-not-allowed' 
                                  : 'bg-purple-950/40 hover:bg-purple-950 border border-purple-500/25 hover:border-purple-500/45 text-purple-400 hover:text-white'
                            }`}
                          >
                            {isVotedThis ? '✓ Selected' : 'Vote Game'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VIP Loyalty Bonus Premium Interactive Panel */}
          <div className="bg-gradient-to-r from-purple-950/40 via-[#180931] to-purple-950/40 border-2 border-purple-500/25 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 select-none relative overflow-hidden backdrop-blur-md shadow-[0_0_25px_rgba(147,51,234,0.12)]">
            {/* Abs decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex items-center gap-4 text-left w-full md:w-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#2a1354] border-2 border-purple-400/50 flex flex-col items-center justify-center text-3xl shrink-0 shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                <Crown className="w-7 h-7 text-yellow-500 animate-pulse" />
              </div>
              
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[8px] font-black tracking-widest uppercase animate-pulse">
                    🏆 VIP CLUB COFFER
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/40 border border-purple-500/30 text-purple-300 text-[8px] font-mono font-black uppercase">
                    Level: {userProfile.vipLevel}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/50 text-[#00e600] border border-emerald-500/20 text-[8px] font-mono font-bold leading-none animate-bounce">
                    + KSh {dynamicVipBonusAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight leading-tight flex items-center gap-1.5">
                  🏆 {authSessionMode === 'real' ? 'Real Balance Coffer' : 'Demo Practice Coffer'} Loyalty
                </h3>
                <p className="text-[10px] text-purple-200/80 max-w-lg leading-relaxed">
                  {authSessionMode === 'real' ? (
                    <>
                      As a distinguished <strong className="text-pink-400 font-extrabold">{userProfile.vipLevel}</strong> tier member, claim your coffer commissions instantly! Real account coffers earn a <strong className="text-emerald-400 font-bold">5% commission</strong> on all successfully deposited money. Current coffer reward is <strong className="text-[#00e600] font-mono font-bold">KSh {dynamicVipBonusAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>, based on your <strong className="text-white font-mono font-bold">KSh {totalDeposited.toLocaleString()}</strong> lifetime real deposits.
                    </>
                  ) : (
                    <>
                      As a distinguished <strong className="text-pink-400 font-extrabold">{userProfile.vipLevel}</strong> tier member, reload your practice stakes instantly! Demo Practice coffers claim a fixed <strong className="text-[#00e600] font-sans font-black">KSh 100.00</strong> coffer bonus anytime for unlimited practice play.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch md:items-end gap-1.5 w-full md:w-auto shrink-0">
              {vipBonusCooldown > 0 ? (
                <div className="space-y-1 w-full md:w-44">
                  <div className="flex items-center justify-between text-[9px] text-purple-300 font-bold uppercase font-mono px-0.5">
                    <span>Reloading...</span>
                    <span>{vipBonusCooldown}s</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/45 rounded-full overflow-hidden border border-purple-900/30">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(vipBonusCooldown / 45) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleClaimVipBonus}
                  className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 via-purple-750 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/35 transition-all outline-none border border-purple-400/20 active:scale-[0.98] cursor-pointer"
                >
                  🎁 Claim Loyalty Bonus
                </button>
              )}
            </div>
          </div>
          </div>
          )}

          {/* TAB CONTENT 1 (SECTION 2): GAMES LISTING */}
          {lobbyTab === 'games' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/30 pb-2.5">
            <div className="flex items-center gap-2 select-text">
              <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase italic">Casino Lobby Grounds</span>
              <span className="px-2 py-0.5 rounded bg-[#22c55e]/15 border border-green-500/30 text-[8px] text-[#22c55e] font-black uppercase tracking-widest">
                AUTOMATED STABLE
              </span>
            </div>

            <div className="w-full sm:w-auto -mx-2 px-2 overflow-x-auto no-scrollbar scroll-smooth">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                {[
                  { id: 'all', title: 'All Stake Games', emoji: '🎰' },
                  { id: 'slots', title: 'Slots Arena', emoji: '🍒' },
                  { id: 'live', title: 'Livestream Croupiers', emoji: '📹' },
                  { id: 'table', title: 'Elite Tables', emoji: '🃏' },
                  { id: 'instant', title: 'Instant / Crash', emoji: '🚀' },
                ].map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all shrink-0 cursor-pointer ${activeCategory === cat.id ? 'bg-[#1d0e37] border-purple-500 text-purple-200 shadow-[0_0_12px_rgba(147,51,234,0.3)]' : 'bg-[#0f081c] border-transparent text-purple-300/70 hover:text-white hover:bg-white/5'}`}
                  >
                    <span className="text-xs shrink-0">{cat.emoji}</span>
                    <span className="text-[11px] font-sans">{cat.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid high density cards viewport */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 xs:gap-3.5">
            {filteredGames.map((game) => {
              const isGameOfTheWeek = game.id === gameOfTheWeek?.gameId;
              const hotHighlight = ['slot-video', 'instant-aviator', 'instant-crush', 'instant-wheel', 'instant-mines'].includes(game.id) || isGameOfTheWeek;
              return (
                <div 
                  key={game.id}
                  onClick={() => handleGameSelect(game)}
                  className={`cursor-pointer group relative rounded-xl overflow-hidden bg-[#0c0519]/90 border transition-all duration-300 hover:scale-[1.03] hover:-translate-y-0.5 flex flex-col h-48 xs:h-52 sm:h-56 ${isGameOfTheWeek ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-gradient-to-br from-[#24133d] to-[#0c0415]' : hotHighlight ? 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.06)] bg-gradient-to-br from-[#180d28] to-[#0a0414]' : 'border-purple-900/30 hover:border-purple-500/30'}`}
                >
                  
                  {isGameOfTheWeek ? (
                    <div className="absolute top-2.5 left-2.5 z-10 px-1.5 py-0.5 rounded bg-[#00e600] text-black text-[8px] font-black tracking-widest uppercase">
                      ✨ GOTW
                    </div>
                  ) : hotHighlight ? (
                    <div className="absolute top-2.5 left-2.5 z-10 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[8px] font-black tracking-widest uppercase">
                      ACTIVE SECTOR
                    </div>
                  ) : null}

                  {game.jackpotEligible && (
                    <div className="absolute top-2.5 right-2.5 z-10 px-1.5 py-0.5 rounded bg-purple-600/95 text-white text-[8px] font-black tracking-widest uppercase border border-purple-400/40">
                      JACKPOT
                    </div>
                  )}

                  <div className="flex-1 bg-[#25153f]/20 flex items-center justify-center relative group-hover:bg-[#25153f]/45 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#06030a] via-[#06030a]/20 to-transparent"></div>
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-300 z-10 select-none">
                      {game.emoji}
                    </span>
                  </div>

                  <div className="p-3 bg-black/45 z-10 flex flex-col justify-between shrink-0">
                    <div>
                      <div className="text-[9px] text-[#fbbf24] uppercase font-black tracking-widest truncate">
                        {game.provider}
                      </div>
                      <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate uppercase font-sans">
                        {game.title}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-purple-900/15 text-[9px] text-purple-300/50">
                      <span>RTP {game.rtp}%</span>
                      <button className="text-[10px] text-amber-400 font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        STAKE <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
          </>
          )}

          {/* TAB CONTENT 3: PARTNER AFFILIATE */}
          {lobbyTab === 'affiliate' && (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 min-h-0 scrollbar-thin scrollbar-thumb-purple-900/30 p-1">

              {/* PLAYER ACCOUNT PROFILE & REFERRER AFFILIATE DECK */}
          <div className="mt-12 bg-gradient-to-b from-[#140b2a] via-[#0d071d] to-[#080312] border-2 border-purple-500/20 rounded-2xl p-5 sm:p-6 space-y-6 select-none relative overflow-hidden backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
            
            {/* Abs decorative gradient glow background */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-purple-900/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 border-2 border-purple-500/40 flex items-center justify-center text-xl font-black text-purple-200 uppercase overflow-hidden">
                  {userProfile.avatar && (userProfile.avatar.startsWith('data:image/') || userProfile.avatar.startsWith('http://') || userProfile.avatar.startsWith('https://')) ? (
                    <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    userProfile.avatar || 'FP'
                  )}
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">
                    {userProfile.fullName || 'Frank Janal'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[8px] font-black uppercase">
                      👑 {userProfile.vipLevel} Status
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      Joined {userProfile.joinedDate || '2026-06-03'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateReferredDeposit}
                  className="px-3.5 py-1.5 bg-[#4ea300]/15 hover:bg-[#4ea300]/25 border border-[#4ea300]/40 hover:border-[#4ea300]/60 text-[#4ea300] font-black uppercase text-[9px] tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  title="Simulate a referred friend making a cash deposit to earn instant 10% commission"
                >
                  <Zap className="w-3 h-3 text-[#4ea300] animate-pulse" />
                  <span>Test Deposit (10% Referral Commission)</span>
                </button>
              </div>
            </div>

            {/* Main Interactive Referral Engine Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Your Referral code card */}
              <div className="lg:col-span-5 bg-black/45 p-4 sm:p-5 rounded-xl border border-purple-900/20 space-y-4 flex flex-col justify-between">
                
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-black text-[8px] font-black tracking-widest uppercase">
                    🎁 PASSIVE EARNINGS ENGINE
                  </span>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Your Unique Referral Link</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed text-left">
                    Refer friends to CasinoHub and instantly receive a <strong className="text-purple-400 font-bold">10% cash commission</strong> of whatever they deposit, credited straight into your main playable balance!
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {authSessionMode === 'demo' ? (
                      <div className="flex-1 text-center bg-[#0d071a] border border-zinc-800/40 rounded-lg p-2.5 text-xs font-mono font-bold text-zinc-500 select-none pointer-events-none tracking-wide">
                        Ref-demo account 5682
                      </div>
                    ) : (
                      <>
                        <input 
                          type="text"
                          readOnly
                          value={userProfile.referralCode || `REF-${userProfile.username.toUpperCase()}-${userProfile.phone ? userProfile.phone.replace(/[^0-9]/g, '').slice(-4) : '7777'}`}
                          className="flex-1 text-center bg-[#0d071a] border border-purple-900/50 rounded-lg p-2.5 text-xs font-mono font-bold text-amber-300 pointer-events-none select-all focus:outline-none uppercase"
                        />
                        <button 
                          onClick={handleCopyReferralCode}
                          className="px-3.5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center shrink-0 border border-purple-400/20"
                          title="Copy referral invitation code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  <div className="bg-[#120722] py-2.5 px-3 rounded-lg border border-purple-900/30 flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[8px] text-gray-400 uppercase tracking-widest block font-mono">Commission Level</span>
                      <strong className="text-[11px] font-black text-white font-sans">10% of ALL Depositors</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-gray-400 uppercase tracking-widest block font-mono">Total Earnings</span>
                      <strong className="text-sm font-bold text-[#00e600] font-mono leading-none">
                        KSh {referredList.reduce((acc, current) => acc + current.commission, 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Referred Players Ledger list table */}
              <div className="lg:col-span-7 bg-black/45 p-4 sm:p-5 rounded-xl border border-purple-900/20 space-y-3">
                
                <div className="flex items-center justify-between pb-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span>Your Referred Friends ({referredList.length})</span>
                  </h4>
                  <span className="text-[9px] text-purple-300 font-mono font-semibold uppercase">10% Earned Ledger</span>
                </div>

                <div className="overflow-x-auto min-h-[135px] max-h-[145px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-900/40">
                  <table className="w-full text-left font-mono text-[10.5px]">
                    <thead>
                      <tr className="border-b border-purple-900/30 text-[8.5px] text-purple-400 font-black uppercase text-left pb-1">
                        <th className="pb-1 text-left text-[8.5px]">Username</th>
                        <th className="pb-1 text-center text-[8.5px]">Date Joined</th>
                        <th className="pb-1 text-right text-[8.5px]">Deposited</th>
                        <th className="pb-1 text-right text-[8.5px]">Commission (10%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/10 text-purple-200/80">
                      {referredList.map((referred) => (
                        <tr key={referred.username} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 font-bold text-[#fbbf24] text-left">{referred.username}</td>
                          <td className="py-2.5 text-gray-500 text-center">{referred.joinedDate}</td>
                          <td className="py-2.5 text-right font-medium text-white">KSh {referred.totalDeposits.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-black text-[#00e600]">+KSh {referred.commission.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[8px] text-gray-600 block leading-tight text-left italic">
                  * Live Commission engine: Whenever referred friends initiate deposits via M-pesa Till, you receive a payout instantly. Tested & validated on current active currency.
                </p>

              </div>

            </div>

          </div>
          </div>
          )}

        </div>
      )}

      {/* Game of the Week special deposit matching modal */}
      {showGotwPromoModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="bg-[#141518] rounded-2xl border border-amber-500/30 max-w-sm w-full overflow-hidden shadow-[0_12px_50px_rgba(245,158,11,0.15)] flex flex-col">
            <div className="flex items-center justify-between p-4 bg-[#0d0e10] border-b border-[#212327]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎁</span>
                <h4 className="text-white text-xs font-black uppercase tracking-wider">GOTW Special Match</h4>
              </div>
              <button 
                onClick={() => setShowGotwPromoModal(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-left">
              <div className="bg-amber-950/20 border border-amber-500/20 p-3.5 rounded-xl text-xs text-amber-200">
                <p className="font-extrabold mb-1">🔥 EXCLUSIVE GOTW CAMPAIGN</p>
                <p>Deposit today to instantly claim 100% matching promotional play currency on this week's featured game! Valid for both M-Pesa & Card deposits.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-purple-300 uppercase font-black block">Featured Match Bonus Promo Code</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-[#090a0d] border border-purple-900/40 rounded-xl px-4 py-2 flex items-center justify-between font-mono text-xs text-[#00e600] font-black tracking-widest bg-black">
                    GOTW3X
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('GOTW3X');
                      triggerNotification('📋 Code Copied!', 'Promo Code "GOTW3X" copied! Enter this during your next cashier deposit.', 'general');
                    }}
                    className="px-4 py-1.5 bg-purple-950/40 hover:bg-purple-900 border border-purple-500/20 text-[#fbbf24] text-[10px] font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-[10px] text-gray-400">
                <span className="text-white font-bold block uppercase text-[9px]">How to redeem:</span>
                <p className="flex items-start gap-2">
                  <span className="text-[#00e600]">1.</span> 
                  <span>Copy code <strong className="text-white">GOTW3X</strong> and click the Quick Cashier Deposit button below.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#00e600]">2.</span> 
                  <span>Initiate any secure till or card deposit of KSh 200 or more in the cashier.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#00e600]">3.</span> 
                  <span>Bonus Funds are matched instantly. Enjoy 3x VIP point generation on this week's featured Game of the Week!</span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#0d0e10] border-t border-[#212327] flex gap-2">
              <button
                onClick={() => setShowGotwPromoModal(false)}
                className="flex-1 py-2 bg-[#1b1c23] hover:bg-[#2c2e39] text-gray-300 font-bold uppercase text-[9px] tracking-wider rounded-xl transition-all cursor-pointer text-center"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowGotwPromoModal(false);
                  const depBtn = document.getElementById('deposit-header-btn');
                  if (depBtn) depBtn.click();
                  else {
                    triggerNotification('Cashier Triggered', 'Promo code "GOTW3X" is active! Click Deposit at the top right of the application.', 'general');
                  }
                }}
                className="flex-1 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black uppercase text-[9px] tracking-widest rounded-xl transition-all shadow-lg text-center cursor-pointer"
              >
                Deposit Now 🚀
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
