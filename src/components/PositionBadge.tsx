import React from 'react';
import { Player } from '../types';
import { EFootballPosition } from '../data/playerPositions';
import { getVerifiedPositionsForPlayer, evaluatePlayerAtPosition } from '../utils/positionEngine';
import { ShieldAlert, CheckCircle2, Award } from 'lucide-react';

interface PositionBadgeProps {
  player: Player;
  currentPosition?: EFootballPosition;
  compact?: boolean;
  showDetails?: boolean;
}

const ALL_POSITIONS_GRID: { row: string; positions: EFootballPosition[] }[] = [
  { row: 'FW', positions: ['LWG', 'SS', 'CF', 'RWG'] },
  { row: 'MF', positions: ['LMF', 'AMF', 'CMF', 'DMF', 'RMF'] },
  { row: 'DF', positions: ['LB', 'CB', 'RB'] },
  { row: 'GK', positions: ['GK'] },
];

export const EFootballPositionGrid: React.FC<{
  player: Player;
  targetPosition?: EFootballPosition;
}> = ({ player, targetPosition }) => {
  const verifiedList = getVerifiedPositionsForPlayer(player);

  const getPositionColor = (pos: EFootballPosition, isVerified: boolean, isSelected: boolean) => {
    if (!isVerified) {
      return isSelected
        ? 'bg-rose-950/80 text-rose-400 border-2 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse'
        : 'bg-slate-900/60 text-slate-600 border border-slate-800 opacity-40';
    }

    if (isSelected) {
      return 'bg-emerald-400 text-slate-950 font-black border-2 border-white shadow-[0_0_12px_rgba(52,211,153,0.9)] scale-110 z-10';
    }

    if (['LWG', 'SS', 'CF', 'RWG'].includes(pos)) {
      return 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30';
    }
    if (['LMF', 'AMF', 'CMF', 'DMF', 'RMF'].includes(pos)) {
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30';
    }
    if (['LB', 'CB', 'RB'].includes(pos)) {
      return 'bg-sky-500/20 text-sky-300 border border-sky-500/50 hover:bg-sky-500/30';
    }
    return 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30';
  };

  return (
    <div className="bg-slate-950/90 rounded-2xl p-3 border border-slate-800 space-y-2">
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1 font-bold text-slate-300">
          <span>📋</span>
          <span>Position Suitability Map</span>
        </span>
        <span className="text-[10px] text-emerald-400 font-semibold">
          {verifiedList.length} Verified Roles
        </span>
      </div>

      <div className="space-y-1.5 py-1">
        {ALL_POSITIONS_GRID.map((rowGroup, idx) => (
          <div key={idx} className="flex items-center justify-center gap-1">
            {rowGroup.positions.map((pos) => {
              const isVerified = verifiedList.includes(pos);
              const isSelected = targetPosition === pos;

              return (
                <div
                  key={pos}
                  className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-black transition-all ${getPositionColor(
                    pos,
                    isVerified,
                    isSelected
                  )}`}
                >
                  {pos}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {targetPosition && (
        <div className="pt-2 border-t border-slate-800/80">
          {(() => {
            const evalRes = evaluatePlayerAtPosition(player, targetPosition);
            if (evalRes.isSuitable) {
              return (
                <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Position Suitable: {targetPosition}</span>
                  </div>
                  <span className="font-mono font-black text-white bg-emerald-600/60 px-2 py-0.5 rounded-md">
                    OVR {evalRes.effectiveRating} (100%)
                  </span>
                </div>
              );
            }
            return (
              <div className="flex items-center justify-between text-xs text-rose-300 bg-rose-950/50 p-2 rounded-xl border border-rose-500/40">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                  <span>Out of Position: {targetPosition}</span>
                </div>
                <span className="font-mono font-black text-rose-200 bg-rose-600/60 px-2 py-0.5 rounded-md">
                  OVR {evalRes.effectiveRating} ({evalRes.ratingDelta})
                </span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
