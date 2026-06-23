/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Crown, 
  Users, 
  Gift, 
  HeartHandshake, 
  Clock, 
  ChevronRight, 
  TrendingUp, 
  CheckCircle2, 
  Award,
  Zap,
  UserCheck
} from 'lucide-react';
import { Tournament, ReferralStats, Wallet } from '../types';

interface BonusesTournamentsProps {
  wallet: Wallet;
  setWallet: React.Dispatch<React.SetStateAction<Wallet>>;
  triggerNotification: (title: string, message: string, type: 'deposit' | 'withdrawal' | 'bonus' | 'jackpot' | 'tournament' | 'vip' | 'general') => void;
  addTransaction: (tx: { type: 'deposit' | 'withdrawal' | 'bonus_credit' | 'win' | 'bet'; amount: number; currency: string; method?: string; status: 'SUCCESS' | 'FAILED' | 'PENDING' }) => void;
}

const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 'tour-1',
    title: 'Macau Golden slots Clash',
    type: 'Daily',
    prizePool: 15000,
    endsAt: '03h 41m 12s',
    minBetToJoin: 50.00,
    progressPercent: 78,
    leaderboard: [
      { rank: 1, username: 'VIP_SlotsKing', points: 14200, prize: 5000 },
      { rank: 2, username: 'User_4492', points: 11950, prize: 3000 },
      { rank: 3, username: 'francypendy', points: 9400, prize: 1500 },
      { rank: 4, username: 'LuckyCharm99', points: 8200, prize: 1000 },
      { rank: 5, username: 'CasinoGod8', points: 6100, prize: 500 }
    ]
  },
  {
    id: 'tour-2',
    title: 'Grandmasters Blackjack Showdown',
    type: 'Weekly',
    prizePool: 50000,
    endsAt: '4d 12h 09m',
    minBetToJoin: 500.00,
    progressPercent: 45,
    leaderboard: [
      { rank: 1, username: 'AceSpeculat8', points: 41200, prize: 18000 },
      { rank: 2, username: 'SophiaHighRoller', points: 38200, prize: 10000 },
      { rank: 3, username: 'BaccaratBull', points: 29800, prize: 6000 },
      { rank: 4, username: 'DealerWhisperer', points: 19100, prize: 4000 },
      { rank: 5, username: 'francypendy', points: 14500, prize: 2500 }
    ]
  }
];

export default function BonusesTournaments({
  wallet,
  setWallet,
  triggerNotification,
  addTransaction
}: BonusesTournamentsProps) {
  const [activeTab, setActiveTab] = useState<'tournaments' | 'vip' | 'referrals' | 'bonuses'>('tournaments');
  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
  
  // VIP Progress values
  const [vipPoints, setVipPoints] = useState<number>(3450);
  const targetVipPoints = 10000; // to level up to Gold
  
  // Referral State
  const [reffStats, setReffStats] = useState<ReferralStats>({
    referralLink: 'https://casinohub.app/join?ref=francypendy',
    totalReferred: 14,
    totalCommissions: 45075.00,
    referredUsers: [
      { username: 'AlphaSpinner', rewardEarned: 15000.00, status: 'Verifed VIP', date: '2026-05-20' },
      { username: 'JackpotJack', rewardEarned: 22050.00, status: 'Verifed VIP', date: '2026-05-22' },
      { username: 'DiceMaster7', rewardEarned: 8025.00, status: 'Active Bettor', date: '2026-05-26' }
    ]
  });

  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [hasClaimedDaily, setHasClaimedDaily] = useState<boolean>(false);

  // Periodic simulation of tournament scores to make it "live"!
  useEffect(() => {
    const tournamentSimulatorInterval = setInterval(() => {
      setTournaments(prevTours => {
        return prevTours.map(tour => {
          // Increment random top scorer scores slightly
          const updatedBoard = tour.leaderboard.map(part => {
            const extraPoints = Math.floor(Math.random() * 150) + 10;
            return {
              ...part,
              points: part.points + extraPoints
            };
          });
          // Sort board descend
          const sorted = [...updatedBoard].sort((a,b) => b.points - a.points);
          // Re-rank 1 to 5
          const ranked = sorted.map((item, index) => ({
            ...item,
            rank: index + 1
          }));

          return {
            ...tour,
            leaderboard: ranked
          };
        });
      });
    }, 4500);

    return () => clearInterval(tournamentSimulatorInterval);
  }, []);

  const claimDailyReward = () => {
    if (hasClaimedDaily) {
      triggerNotification('Claimed Already', 'Your daily loyalty reward has already been issued. Check back tomorrow!', 'general');
      return;
    }

    const reward = 1000.00; // 1,000 KSh free bonus
    setWallet(w => ({
      ...w,
      bonusBalance: w.bonusBalance + reward
    }));
    
    addTransaction({
      type: 'bonus_credit',
      amount: reward,
      currency: 'KSh',
      method: 'Daily Loyalty Claim',
      status: 'SUCCESS'
    });

    setHasClaimedDaily(true);
    triggerNotification('Daily Reward Claimed', `Successfully credited +KSh ${reward.toLocaleString()} to your Promo Bonus Wallet!`, 'bonus');
  };

  const copyRefLink = () => {
    navigator.clipboard.writeText(reffStats.referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    triggerNotification('Link Copied', 'Referral invitation token linked to system clip!', 'general');
  };

  return (
    <div className="bg-[#120a24]/90 border border-purple-900/40 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(147,51,234,0.1)]">
      
      {/* Category picker headers */}
      <div className="bg-[#180f33] p-4 flex flex-col sm:flex-row justify-between items-center border-b border-purple-900/40 gap-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl text-amber-500 font-bold">🏆</div>
          <div>
            <span className="text-xs text-purple-400 font-bold tracking-widest uppercase block">PROMOTIONS & TOURNAMENTS</span>
            <span className="text-[10px] text-gray-500 font-mono">Real-time leadership standings, affiliate hubs, and rewards desk.</span>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap self-center bg-black/30 p-1.5 rounded-lg border border-purple-900/20">
          {[
            { id: 'tournaments', label: 'Standings', icon: <Trophy className="w-3.5 h-3.5" /> },
            { id: 'vip', label: 'VIP Club', icon: <Crown className="w-3.5 h-3.5" /> },
            { id: 'referrals', label: 'Referrals', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'bonuses', label: 'Bonuses', icon: <Gift className="w-3.5 h-3.5 text-amber-400" /> }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${activeTab === tab.id ? 'bg-[#21113c] text-amber-400 border border-purple-500/30' : 'text-purple-300/60 hover:text-white'}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* TAB 1: TOURNAMENTS LIVE LEADERBOARD */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-white uppercase italic">Active Premium Tournaments Lobby</h4>
              <span className="text-[9px] bg-red-600/20 text-red-400 px-2.5 py-0.5 rounded font-mono font-bold animate-pulse">Live Tracking Enabled</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tournaments.map((tour) => (
                <div key={tour.id} className="bg-black/30 p-5 rounded-2xl border border-purple-900/30 h-fit space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-500 border border-amber-400/20 text-[9px] font-black uppercase font-mono">{tour.type} CLASH</span>
                      <h4 className="text-sm font-bold text-white mt-1">{tour.title}</h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">Prize Pool</span>
                      <strong className="text-amber-400 text-base font-mono">KSh {tour.prizePool.toLocaleString()}</strong>
                    </div>
                  </div>

                  <hr className="border-purple-900/20" />

                  {/* Progressive clock bar */}
                  <div className="flex justify-between text-[10px] text-purple-300 font-mono">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-purple-400" /> Ends In: {tour.endsAt}</span>
                    <span>Min stake: KSh {tour.minBetToJoin.toFixed(2)}</span>
                  </div>

                  <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full" style={{ width: `${tour.progressPercent}%` }}></div>
                  </div>

                  {/* Leaderboard participants rows */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest block mb-2">Live Leadership Scores</span>
                    {tour.leaderboard.map((part) => {
                      const isUser = part.username === 'francypendy';
                      return (
                        <div 
                          key={part.rank} 
                          className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono transition-all ${isUser ? 'bg-purple-900/40 border-amber-500 shadow-md' : 'bg-black/20 border-purple-900/20'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${part.rank === 1 ? 'bg-amber-400 text-black' : part.rank === 2 ? 'bg-gray-400 text-black' : part.rank === 3 ? 'bg-yellow-700 text-white' : 'bg-black/40 text-purple-300'}`}>
                              {part.rank}
                            </span>
                            <span className={`font-semibold ${isUser ? 'text-amber-400 font-black' : 'text-purple-200'}`}>{part.username} {isUser && '(You)'}</span>
                          </div>

                          <div className="flex gap-4 items-center">
                            <span className="text-gray-400">{part.points.toLocaleString()} pts</span>
                            <span className="text-emerald-400 font-bold font-sans">KSh {part.prize.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 2: VIP STATUS CLUB AREA */}
        {activeTab === 'vip' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase italic">VIP Club Status Deck</h4>
              <span className="text-xs text-amber-400 font-bold tracking-widest font-mono">Current Status: Silver Tier</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Level up widget */}
              <div className="md:col-span-2 bg-[#170e2f] border border-purple-500/20 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-500 text-black flex items-center justify-center text-xl font-bold font-sans">
                    SV
                  </div>
                  <div>
                    <h5 className="text-base text-white font-extrabold uppercase">Silver VIP Club Member</h5>
                    <span className="text-xs text-purple-300">Higher cashout thresholds and dedicated 1-on-1 support lines enabled.</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono text-purple-300">
                    <span>Rank Progression (To Gold)</span>
                    <span>{vipPoints.toLocaleString()} / {targetVipPoints.toLocaleString()} VIP Points</span>
                  </div>
                  <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full" style={{ width: `${(vipPoints / targetVipPoints) * 100}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                  <div className="bg-black/20 p-3 rounded-lg border border-purple-900/10">
                    <div className="text-[10px] text-gray-400 font-black uppercase">Points Rate</div>
                    <strong className="text-sm text-white font-mono">x1.2 Multi</strong>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-purple-900/10">
                    <div className="text-[10px] text-gray-400 font-black uppercase">Max Payout</div>
                    <strong className="text-sm text-white font-mono">KSh 1,000,000/day</strong>
                  </div>
                </div>
              </div>

              {/* VIP Benefits summary */}
              <div className="bg-black/30 p-5 rounded-2xl border border-purple-900/30 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-amber-500 font-black tracking-widest uppercase block mb-3">VIP Club Levels Ladder</span>
                  <div className="space-y-1.5 text-xs font-mono">
                    {['Bronze (Starter)', 'Silver (Active Player)', 'Gold (High-Roller)', 'Platinum (VIP VIP)', 'Diamond (Elite Master)'].map((lvl, i) => (
                      <div key={lvl} className={`flex items-center justify-between p-1.5 rounded ${i === 1 ? 'bg-purple-950/40 text-amber-400 font-bold border border-purple-500/20' : 'text-purple-300/60'}`}>
                        <span>{lvl}</span>
                        <span>{i === 1 ? '✦ ACTIVE ' : 'Locked'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-purple-400/50 italic text-center mt-3 pt-3 border-t border-purple-905/10">
                  Bets on slots & live tables trigger VIP points automatically!
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 3: REFERRAL SYSTEM */}
        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase italic">Multi-Level Affiliate System</h4>
              <span className="text-[10px] text-purple-400 font-mono">Commission Share: 15% VIP bet turnover</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Affiliate link box */}
              <div className="lg:col-span-1 bg-black/30 p-5 rounded-2xl border border-purple-900/30 space-y-4">
                <div className="text-center py-2">
                  <span className="text-3xl">🔗</span>
                  <h5 className="text-xs font-bold text-white uppercase mt-1">Unique Invite Token</h5>
                  <p className="text-[10px] text-gray-500">Share with family or online audiences. Receive commissions on every slot spin!</p>
                </div>

                <div className="space-y-2">
                  <input 
                    type="text"
                    readOnly
                    value={reffStats.referralLink}
                    className="w-full text-center bg-[#07030e] border border-purple-900 rounded p-2 text-xs font-mono text-purple-300 pointer-events-none"
                  />
                  
                  <button 
                    onClick={copyRefLink}
                    className="w-full py-2 bg-[#2d124c] hover:bg-[#38165f] text-white font-bold text-xs uppercase tracking-wider rounded border border-purple-500/20"
                  >
                    {copiedLink ? 'Copied Invitation Link!' : 'COPY INVITATION LINK'}
                  </button>
                </div>

                <div className="bg-[#120822] p-3 rounded-lg border border-purple-900/10 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase font-mono">Commission Balance</span>
                  <strong className="text-lg font-mono text-amber-400">KSh {reffStats.totalCommissions.toFixed(2)}</strong>
                </div>
              </div>

              {/* Referred history list */}
              <div className="lg:col-span-2 bg-black/30 p-5 rounded-2xl border border-purple-900/30 space-y-4">
                <h5 className="text-xs font-bold text-white uppercase tracking-widest">Referred Players ledger</h5>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-purple-900/30 text-[9px] text-purple-400 font-bold uppercase pb-1">
                        <th>Username</th>
                        <th>Joined Date</th>
                        <th>Status Status</th>
                        <th className="text-right">Commissions Recalled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/10 text-purple-200/80">
                      {reffStats.referredUsers.map((user) => (
                        <tr key={user.username} className="hover:bg-white/5">
                          <td className="py-2.5 font-bold text-[#fbbf24]">{user.username}</td>
                          <td className="py-2.5 text-gray-500">{user.date}</td>
                          <td className="py-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[8px] font-black uppercase">
                              {user.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-bold text-white">+KSh {user.rewardEarned.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: BONUSES DESK */}
        {activeTab === 'bonuses' && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-white uppercase italic">Welcome & Loyalty Claim Deck</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box 1: Daily free lockbox */}
              <div className="bg-[#1b0d2b] border border-purple-500/20 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="px-2 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 text-[9px] font-black uppercase font-mono">Durable Rewards</span>
                    <span className="text-[10px] text-purple-400 font-mono">Refreshes every 24 hr</span>
                  </div>
                  <h4 className="text-base font-black text-white">Daily Loyalty Chest Claim</h4>
                  <p className="text-xs text-purple-300 mt-1 leading-relaxed">
                    Get free Promotional Credits matched straight to your Bonus Wallet. Unlock potential stakes without charge!
                  </p>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={claimDailyReward}
                    disabled={hasClaimedDaily}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black uppercase text-xs tracking-widest rounded disabled:opacity-50"
                  >
                    {hasClaimedDaily ? 'CLAIMED CHEST TODAY (Refreshes tomorrow)' : 'CLAIM FREE KSh 1,000 BONUS CREDIT NOW'}
                  </button>
                </div>
              </div>

              {/* Box 2: Cashback program */}
              <div className="bg-[#0b0717]/80 border border-purple-900/40 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-505/30 text-[9px] font-black uppercase font-mono">Automatic Program</span>
                    <span className="text-[10px] text-purple-400 font-mono">Silver level tier</span>
                  </div>
                  <h4 className="text-base font-black text-white">Cashback Refund Insurance</h4>
                  <p className="text-xs text-purple-300 mt-1 leading-relaxed">
                    Retrieve 5% of all net stake setbacks on classic slots and speed baccarat daily. Refunds are issued instantly to your cashback check!
                  </p>
                </div>

                <div className="pt-4 flex justify-between items-center bg-[#07030e] p-3 rounded-lg border border-purple-900">
                  <div className="text-left">
                    <span className="text-[9px] text-gray-500 block uppercase">Insured Refund Available</span>
                    <span className="text-sm font-semibold font-mono text-emerald-400">KSh {wallet.cashbackBalance.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      if (wallet.cashbackBalance <= 0) {
                        triggerNotification('Zero Balance', 'No insurance cashback accumulated yet. Spins slot or table games!', 'general');
                        return;
                      }
                      const activeCash = wallet.cashbackBalance;
                      setWallet((prev) => ({
                        ...prev,
                        cashbackBalance: 0,
                        mainBalance: prev.mainBalance + activeCash
                      }));
                      addTransaction({
                        type: 'bonus_credit',
                        amount: activeCash,
                        currency: 'KSh',
                        method: 'Cashback Insurance Claim',
                        status: 'SUCCESS'
                      });
                      triggerNotification('Cashback Reclaimed!', `Transferred KSh ${activeCash.toLocaleString()} insurance refund to Main Balance!`, 'bonus');
                    }}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 font-bold text-[10px] uppercase tracking-wider text-white rounded"
                  >
                    Redeem to Cashier
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
