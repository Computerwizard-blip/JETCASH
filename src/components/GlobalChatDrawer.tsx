/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Users, Trash2, Heart, Sparkles, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  isMe?: boolean;
  avatarColor?: string;
  isSystem?: boolean;
}

interface GlobalChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onlineCount: number;
}

const PREDEFINED_PHRASES = [
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
  'Next round is 10x! 🔥'
];

export default function GlobalChatDrawer({
  isOpen,
  onClose,
  userProfile,
  messages,
  onSendMessage,
  onlineCount
}: GlobalChatDrawerProps) {
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'rules'>('chat');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto scroll to the end of messages when messages change
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handlePhraseClick = (phrase: string) => {
    onSendMessage(phrase);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[#101114] border-l border-[#212327] shadow-[0_0_40px_rgba(0,0,0,0.85)] z-50 flex flex-col font-sans text-white/90">
      {/* Drawer Header */}
      <div className="p-4 bg-[#141518] border-b border-[#212327] flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500 animate-pulse">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#eaeaea] leading-tight">Global JetCash Chat</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e600] animate-ping" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" />
                {onlineCount} active players online
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-lg border border-[#212327] hover:border-[#383b42] hover:bg-black/20 text-gray-405 hover:text-white transition-all duration-150 flex items-center justify-center cursor-pointer active:scale-95"
          title="Close chat drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Tabs */}
      <div className="flex bg-[#0d0e11] px-2 py-1.5 border-b border-[#212327]/40 text-[10px] uppercase font-black tracking-wider select-none shrink-0 gap-1.5">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`px-3 py-1 rounded transition-all cursor-pointer ${activeTab === 'chat' ? 'bg-[#212327] text-[#00e600] shadow-xs' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Community Feed
        </button>
        <button 
          onClick={() => setActiveTab('rules')}
          className={`px-3 py-1 rounded transition-all cursor-pointer ${activeTab === 'rules' ? 'bg-[#212327] text-amber-400 shadow-xs' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Chat Rules
        </button>
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Messages Display log area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800/50 bg-[#0d0e10]/40">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-600 select-none">
                <MessageSquare className="w-10 h-10 mb-2 opacity-15 text-[#9b9da4]" />
                <p className="text-[11px] font-bold tracking-wide uppercase font-mono">No chat logs yet</p>
                <p className="text-[10px] text-gray-500 mt-1">Be the first to interact and say hello to the JetCash lounge!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col gap-1 max-w-[85%] ${msg.isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className={`font-black font-sans ${msg.isMe ? 'text-amber-400' : 'text-purple-400'}`}>
                      {msg.isMe ? 'You' : msg.username}
                    </span>
                    <span className="text-gray-600 text-[9px] font-mono">{msg.timestamp}</span>
                  </div>

                  <div 
                    className={`px-3 py-2 rounded-xl text-[11.5px] font-medium leading-relaxed shadow-xs ${
                      msg.isMe 
                        ? 'bg-[#00e600]/10 border border-[#00e600]/20 text-white rounded-br-none' 
                        : 'bg-[#1b1c21] border border-[#272930] text-gray-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Quick Predefined interactive Phrase Buttons */}
          <div className="p-3 bg-[#111216] border-t border-[#212327]/60 shrink-0">
            <span className="text-[9px] text-[#8e9099] uppercase font-black tracking-wider block mb-2 select-none flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              Quick Quick-Fire Phrases:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-none pr-1">
              {PREDEFINED_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePhraseClick(phrase)}
                  className="px-2.5 py-1 text-[10px] font-bold text-gray-300 hover:text-white bg-[#1a1b20] hover:bg-[#252730] border border-[#272930] hover:border-gray-600 rounded-lg transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input typing bar */}
          <form 
            onSubmit={handleSubmit}
            className="p-3 bg-[#141518] border-t border-[#212327] flex items-center gap-2 shrink-0"
          >
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send a pre-defined phrase or type here..."
              maxLength={150}
              className="flex-1 bg-black/60 border border-[#252830] focus:border-[#00e600]/50 outline-none rounded-xl px-3 py-2 text-xs font-semibold placeholder:text-gray-600 transition-colors text-white"
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="w-9 h-9 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-[0_2px_8px_rgba(226,21,21,0.3)] transition-all flex items-center justify-center cursor-pointer active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
              title="Submit message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      ) : (
        /* Chat Rules Policy tab content */
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-400 text-xs flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-bold block uppercase tracking-wide">Responsible Lounge Banter</span>
              <span className="text-[10px] mt-0.5 block leading-relaxed text-gray-400">Please respect other flyers on JetCash. Let's keep the lobby exciting and positive!</span>
            </div>
          </div>

          <div className="space-y-3.5 text-xs text-gray-400 leading-relaxed font-sans">
            <div>
              <h5 className="font-black text-gray-200 uppercase tracking-widest text-[10px] mb-1">1. Respectful Communication</h5>
              <p>We do not allow hate speech, slurs, bad insults, or targeting other players. Disagreement is allowed, but must remain polite.</p>
            </div>

            <div>
              <h5 className="font-black text-gray-200 uppercase tracking-widest text-[10px] mb-1">2. Fair Play & Multipliers</h5>
              <p>Connect with real flyers live on JetCash. Share tips, discuss ongoing multiplier trends, and don't spam external links or suspicious promotions.</p>
            </div>

            <div>
              <h5 className="font-black text-gray-200 uppercase tracking-widest text-[10px] mb-1">3. Live Payout Pride</h5>
              <p>Brag about your wins! Share strategies, and respect others who crash. High-multiplier flights should be celebrated together!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
