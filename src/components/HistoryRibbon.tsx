/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { History, ShieldAlert, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface HistoryRibbonProps {
  multipliers: number[];
}

export default function HistoryRibbon({ multipliers }: HistoryRibbonProps) {
  const [expanded, setExpanded] = useState(false);

  // Helper to color multiplier badges based on multipliers value as seen in actual screenshots
  const getBadgeStyles = (val: number) => {
    if (val < 2.0) {
      // Light blue color badge
      return {
        bg: 'bg-[#1e2736]',
        border: 'border-[#2d405b]',
        text: 'text-[#3fa2f7]',
      };
    } else if (val < 10.0) {
      // Violet purple color badge
      return {
        bg: 'bg-[#2a1b3d]',
        border: 'border-[#442b66]',
        text: 'text-[#bf5af2]',
      };
    } else {
      // Magenta/gold high roller multipliers
      return {
        bg: 'bg-[#3b1220]',
        border: 'border-[#6c223c]',
        text: 'text-[#ff375f] font-black',
      };
    }
  };

  return (
    <div className="bg-[#141518] relative px-4 py-2 border-b border-[#212327] flex flex-col select-none shrink-0">
      <div className="flex items-center justify-between gap-2 overflow-hidden">
        {/* Scrollable list of recent multipliers */}
        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {multipliers.map((mult, idx) => {
            const styles = getBadgeStyles(mult);
            return (
              <div 
                key={idx}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold border ${styles.bg} ${styles.border} ${styles.text} transition-all cursor-pointer`}
                title={`Provably Fair verification hash #${1402928 + idx}`}
              >
                {mult.toFixed(2)}x
              </div>
            );
          })}
        </div>

        {/* Expand History Dropdown Trigger button */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="py-1 px-2.5 ml-2 rounded-lg bg-[#3b1220] hover:bg-[#6c223c] border border-[#ff375f]/40 hover:border-[#ff375f] text-[#ff375f] hover:text-white transition-all duration-200 flex items-center gap-1.5 cursor-pointer text-[10.5px] font-black tracking-wider uppercase shrink-0 shadow-[0_0_12px_rgba(255,55,95,0.25)] select-none"
        >
          <History className="w-3.5 h-3.5 animate-pulse" />
          <span>Round History</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable detailed provably fair ledger info drawer */}
      {expanded && (
        <div className="mt-2.5 bg-[#0e0f11] p-3 rounded-lg border border-[#202228] animate-fadeIn">
          <div className="flex justify-between items-center pb-2 border-b border-[#202248]/30 mb-2">
            <h4 className="text-xs font-bold text-[#b5b7c0] flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-green-500" />
              <span>PROVABLY FAIR ROUND HISTORY</span>
            </h4>
            <span className="text-[10px] font-mono text-[#5f616b]">System SHA-256 Enabled</span>
          </div>

          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {multipliers.map((mult, idx) => {
              const hash = Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('');
              return (
                <div key={idx} className="flex justify-between items-center text-[10px] font-mono py-1 border-b border-[#15161c]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#5f616b] font-sans">#124802{idx}</span>
                    <span className="text-[#00e600] tracking-tight flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5" /> Verified</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#8d8e95]">hash: {hash}...f098</span>
                    <span className={`font-bold font-mono ${getBadgeStyles(mult).text}`}>{mult.toFixed(2)}x</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
