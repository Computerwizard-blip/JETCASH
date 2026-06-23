/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bonus_credit' | 'win' | 'bet';
  amount: number;
  currency: string;
  method?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  timestamp: string;
  game?: string;
  referenceCode?: string;
}

export interface UserProfile {
  username: string;
  email: string;
  phone: string;
  avatar: string;
  language: 'EN' | 'ES' | 'FR' | 'SW';
  currency: 'USD' | 'EUR' | 'KES' | 'KSh' | 'ZAR';
  vipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Elite';
  vipPoints: number;
  joinedDate: string;
  fullName?: string;
  referralCode?: string;
}

export interface Wallet {
  mainBalance: number;
  realBalance: number;
  demoBalance: number;
  bonusBalance: number;
  cashbackBalance: number;
}

export interface JackpotPool {
  mega: number;
  major: number;
  minor: number;
  mini: number;
}

export interface GameItem {
  id: string;
  title: string;
  category: 'slots' | 'live' | 'table' | 'instant';
  provider: string;
  emoji: string;
  rtp: number;
  minBet: number;
  maxBet: number;
  jackpotEligible?: boolean;
  liveDealerName?: string;
}

export interface LiveActivityFeedItem {
  id: string;
  username: string;
  game: string;
  amount: number;
  type: 'win' | 'jackpot' | 'bet';
  timeAgo: string;
}

export interface Tournament {
  id: string;
  title: string;
  type: 'Daily' | 'Weekly' | 'Monthly';
  prizePool: number;
  leaderboard: { rank: number; username: string; points: number; prize: number }[];
  endsAt: string;
  minBetToJoin: number;
  progressPercent: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'deposit' | 'withdrawal' | 'bonus' | 'jackpot' | 'tournament' | 'vip' | 'general';
  channel: 'push' | 'email' | 'sms' | 'in_app';
  timestamp: string;
  read: boolean;
}

export interface ReferralStats {
  referralLink: string;
  totalReferred: number;
  totalCommissions: number;
  referredUsers: { username: string; rewardEarned: number; status: string; date: string }[];
}
