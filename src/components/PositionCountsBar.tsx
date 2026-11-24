import React from 'react';
import { Player, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { MAX_FW_PER_TEAM, MAX_GK_PER_TEAM } from '../utils/positionEngine';
import { Users, Lock, AlertTriangle } from 'lucide-react';

interface PositionCountsBarProps {
  players: Player[];
  language: Language;
}

export const PositionCountsBar: React.FC<PositionCountsBarProps> = ({ players, language }) => {
  const t = TRANSLATIONS[language];
  const gkCount = players.filter((p) => p.position === 'GK').length;
  const dfCount = players.filter((p) => p.position === 'DF').length;
  const mfCount = players.filter((p) => p.position === 'MF').length;
  const fwCount = players.filter((p) => p.position === 'FW').length;
  const totalCount = players.length;

  const isGkFull = gkCount >= MAX_GK_PER_TEAM;
  const isFwFull = fwCount >= MAX_FW_PER_TEAM;
  const needsMandatoryGk = totalCount === 10 && gkCount === 0;

  return (
    <div
      id="position-counts-bar"
      className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl backdrop-blur-md animate-fade-in"
    >
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-heading font-black text-slate-200 uppercase tracking-wider">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>SQUAD POSITION STATUS (FW上限3 / GK上限1)</span>
        </div>
        <div className="flex items-center gap-1.5">
          {needsMandatoryGk && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {language === 'ja' ? '最終枠はGK確定' : 'Last Pick: GK Only'}
            </span>
          )}
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
        {/* GK (Max 1) */}
        <div
          className={`rounded-xl p-2 flex flex-col items-center justify-center transition-colors border ${
            isGkFull
              ? 'bg-amber-950/35 border-amber-400/60'
              : 'bg-slate-950/80 border-amber-500/30 hover:border-amber-500/60'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 tracking-wider">
            <span>GK</span>
            {isGkFull && <Lock className="w-2.5 h-2.5 text-amber-300" />}
          </div>
          <div className="text-base sm:text-lg font-black text-amber-200 mt-0.5">
            {gkCount}
            <span className="text-[11px] text-amber-400/75">/{MAX_GK_PER_TEAM}</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 font-sans">
            {isGkFull ? (
              <span className="text-amber-300 font-bold">
                {language === 'ja' ? '上限・候補除外' : 'MAX・Excluded'}
              </span>
            ) : language === 'ja' ? (
              'あと1名可'
            ) : (
              'Open'
            )}
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

        {/* FW (Max 3) */}
        <div
          className={`rounded-xl p-2 flex flex-col items-center justify-center transition-colors border ${
            isFwFull
              ? 'bg-rose-950/40 border-rose-400/70'
              : 'bg-slate-950/80 border-rose-500/30 hover:border-rose-500/60'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-400 tracking-wider">
            <span>FW</span>
            {isFwFull && <Lock className="w-2.5 h-2.5 text-rose-300" />}
          </div>
          <div className="text-base sm:text-lg font-black text-rose-200 mt-0.5">
            {fwCount}
            <span className="text-[11px] text-rose-400/75">/{MAX_FW_PER_TEAM}</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 font-sans">
            {isFwFull ? (
              <span className="text-rose-300 font-bold">
                {language === 'ja' ? '上限・候補除外' : 'MAX・Excluded'}
              </span>
            ) : language === 'ja' ? (
              `あと${MAX_FW_PER_TEAM - fwCount}名可`
            ) : (
              `${MAX_FW_PER_TEAM - fwCount} left`
            )}
          </div>
        </div>
      </div>

      {(isFwFull || isGkFull) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-300">
          {isFwFull && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold">
              🚫 {t.fwLimitReached}
            </span>
          )}
          {isGkFull && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
              🚫 {t.gkLimitReached}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
