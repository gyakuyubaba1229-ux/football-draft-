import React from 'react';
import { Player, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { Shield, Sparkles, Users } from 'lucide-react';

interface PositionCountsBarProps {
  players: Player[];
  language: Language;
}

export const PositionCountsBar: React.FC<PositionCountsBarProps> = ({ players, language }) => {
  const gkCount = players.filter((p) => p.position === 'GK').length;
  const dfCount = players.filter((p) => p.position === 'DF').length;
  const mfCount = players.filter((p) => p.position === 'MF').length;
  const fwCount = players.filter((p) => p.position === 'FW').length;
  const totalCount = players.length;

  return (
    <div
      id="position-counts-bar"
      className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl backdrop-blur-md animate-fadeIn"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-heading font-black text-slate-200 uppercase tracking-wider">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>SQUAD POSITION STATUS (ポジション別獲得人数)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-mono font-bold text-slate-400">TOTAL:</span>
          <span
            className={`text-xs font-mono font-black px-2 py-0.5 rounded-full ${
              totalCount === 11
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {totalCount}/11
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center font-mono">
        {/* GK */}
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-2 flex flex-col items-center justify-center hover:border-amber-500/60 transition-colors">
          <div className="text-[10px] font-bold text-amber-400 tracking-wider">GK</div>
          <div className="text-base sm:text-lg font-black text-amber-200 mt-0.5">{gkCount}</div>
          <div className="text-[9px] text-slate-400 mt-0.5 font-sans">
            {gkCount === 1 ? 'OK' : gkCount > 1 ? 'Excess' : 'Needed'}
          </div>
        </div>

        {/* DF */}
        <div className="bg-slate-950/80 border border-sky-500/30 rounded-xl p-2 flex flex-col items-center justify-center hover:border-sky-500/60 transition-colors">
          <div className="text-[10px] font-bold text-sky-400 tracking-wider">DF</div>
          <div className="text-base sm:text-lg font-black text-sky-200 mt-0.5">{dfCount}</div>
          <div className="text-[9px] text-slate-400 mt-0.5 font-sans">
            {dfCount >= 3 && dfCount <= 5 ? 'Balanced' : `${dfCount} in squad`}
          </div>
        </div>

        {/* MF */}
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-2 flex flex-col items-center justify-center hover:border-emerald-500/60 transition-colors">
          <div className="text-[10px] font-bold text-emerald-400 tracking-wider">MF</div>
          <div className="text-base sm:text-lg font-black text-emerald-200 mt-0.5">{mfCount}</div>
          <div className="text-[9px] text-slate-400 mt-0.5 font-sans">
            {mfCount >= 3 && mfCount <= 5 ? 'Balanced' : `${mfCount} in squad`}
          </div>
        </div>

        {/* FW */}
        <div className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-2 flex flex-col items-center justify-center hover:border-rose-500/60 transition-colors">
          <div className="text-[10px] font-bold text-rose-400 tracking-wider">FW</div>
          <div className="text-base sm:text-lg font-black text-rose-200 mt-0.5">{fwCount}</div>
          <div className="text-[9px] text-slate-400 mt-0.5 font-sans">
            {fwCount >= 1 && fwCount <= 3 ? 'Attacking' : `${fwCount} in squad`}
          </div>
        </div>
      </div>
    </div>
  );
};
