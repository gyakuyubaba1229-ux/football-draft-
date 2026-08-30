import React, { useEffect, useState, useRef } from 'react';
import { Club, GameMode, Language } from '../types';
import { getClubsByMode, getAvailableYears } from '../data/playerDatabase';
import { TRANSLATIONS, getLocalizedClubName } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { Sparkles, RotateCcw, AlertTriangle, ShieldCheck, Zap, Award } from 'lucide-react';

export type BlackBallSpinType = 'none' | 'normal-blackball' | 'lightning-blackball';

interface SlotMachineProps {
  mode: GameMode;
  language: Language;
  selectedYear: number | null;
  selectedClub: Club | null;
  isSpinning: boolean;
  blackBallSpinType?: BlackBallSpinType;
  blackBallStage?: 'spinning-normal' | 'lightning-striking' | 'blackball-spinning' | 'revealed';
  isBlackBallResult?: boolean;
  hasCurrentDraft: boolean;
  skipsRemaining: number;
  onSpin: () => void;
  onSkip: () => void;
  disabled: boolean;
  isTeamFull: boolean;
}

export const SlotMachine: React.FC<SlotMachineProps> = ({
  mode,
  language,
  selectedYear,
  selectedClub,
  isSpinning,
  blackBallSpinType = 'none',
  blackBallStage = 'spinning-normal',
  isBlackBallResult = false,
  hasCurrentDraft,
  skipsRemaining,
  onSpin,
  onSkip,
  disabled,
  isTeamFull,
}) => {
  const t = TRANSLATIONS[language];
  const clubs = getClubsByMode(mode);
  const years = getAvailableYears(mode);

  // Reel animated current indices
  const [displayYear, setDisplayYear] = useState<number>(selectedYear || 2021);
  const [displayClub, setDisplayClub] = useState<Club>(selectedClub || clubs[0]);
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Black ball reel animation counter
  const [blackBallAnimTick, setBlackBallAnimTick] = useState<number>(0);

  useEffect(() => {
    if (isSpinning) {
      let tickCount = 0;
      spinIntervalRef.current = setInterval(() => {
        tickCount++;
        setBlackBallAnimTick((prev) => (prev + 1) % 100);

        // If in regular spinning phase, update random items
        if (blackBallStage === 'spinning-normal' || blackBallSpinType === 'none') {
          const randomYear = years[Math.floor(Math.random() * years.length)];
          const randomClub = clubs[Math.floor(Math.random() * clubs.length)];
          setDisplayYear(randomYear);
          setDisplayClub(randomClub);
        }

        if (tickCount % 2 === 0) {
          soundManager.playSpinTick();
        }
      }, 65);
    } else {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
      }
      if (selectedYear) setDisplayYear(selectedYear);
      if (selectedClub) setDisplayClub(selectedClub);
    }

    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, [isSpinning, selectedYear, selectedClub, clubs, years, blackBallSpinType, blackBallStage]);

  // Is black ball active right now on the reels?
  const isBlackBallReelActive =
    isSpinning &&
    (blackBallSpinType === 'normal-blackball' || blackBallSpinType === 'lightning-blackball') &&
    blackBallStage === 'blackball-spinning';

  // Is lightning striking right now?
  const isLightningStriking = isSpinning && blackBallStage === 'lightning-striking';

  // Is the main spin button disabled?
  const isSpinButtonDisabled = isSpinning || hasCurrentDraft || disabled || isTeamFull;

  return (
    <div
      id="slot-machine-container"
      className={`w-full max-w-3xl mx-auto rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md transition-all duration-500 ${
        isLightningStriking || isBlackBallReelActive ? 'animate-shake' : ''
      } ${
        isBlackBallReelActive || isBlackBallResult
          ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/40 border-2 border-amber-400 shadow-amber-950/60'
          : 'bg-slate-900/90 border border-emerald-500/30 shadow-emerald-950/40'
      }`}
    >
      {/* Decorative top illumination */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 shadow-lg transition-all duration-500 ${
          isBlackBallReelActive || isBlackBallResult
            ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_#f59e0b]'
            : 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981]'
        }`}
      />

      {/* Lightning Flash Overlay when lightning strikes center */}
      {isLightningStriking && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center bg-white/40 animate-ping">
          {/* Searing Electric Shockwave */}
          <div className="w-full h-full bg-gradient-to-r from-amber-200/50 via-white to-amber-200/50 animate-pulse" />
        </div>
      )}

      {/* Center Lightning Strike Visual ⚡ */}
      {isLightningStriking && (
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center">
          <div className="relative flex flex-col items-center animate-bounce">
            <Zap className="w-24 h-24 sm:w-32 sm:h-32 text-amber-300 fill-yellow-200 filter drop-shadow-[0_0_35px_rgba(253,224,71,1)] animate-ping" />
            <div className="text-xl sm:text-3xl font-heading font-black text-amber-300 uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-950/90 border-2 border-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.8)] mt-2">
              ⚡ LIGHTNING STRIKE! ⚡
            </div>
          </div>
        </div>
      )}

      {/* Reel Titles */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-center">
        <div
          className={`flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
            isBlackBallReelActive || isBlackBallResult ? 'text-amber-400' : 'text-emerald-400'
          }`}
        >
          <span>{isBlackBallReelActive || isBlackBallResult ? '⚫' : '📅'}</span>
          <span>
            {isBlackBallReelActive ? 'BLACK BALL REEL' : `${t.joiningYear} (YEAR)`}
          </span>
        </div>
        <div
          className={`flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
            isBlackBallReelActive || isBlackBallResult ? 'text-yellow-400' : 'text-teal-400'
          }`}
        >
          {isBlackBallReelActive || isBlackBallResult ? (
            <Award className="w-4 h-4 text-amber-400" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span>
            {isBlackBallReelActive ? 'BLACK BALL REEL' : `${t.club} (CLUB)`}
          </span>
        </div>
      </div>

      {/* The Dual Slot Reels */}
      <div id="reels-display" className="grid grid-cols-2 gap-3 sm:gap-6 relative">
        {/* Year Reel */}
        <div
          id="year-reel"
          className={`h-36 sm:h-44 rounded-2xl border-2 flex flex-col items-center justify-center p-3 relative overflow-hidden transition-all duration-300 ${
            isBlackBallReelActive
              ? 'border-amber-400 bg-gradient-to-b from-slate-950 via-black to-slate-950 shadow-[inset_0_0_30px_rgba(251,191,36,0.6)]'
              : isSpinning
              ? 'border-emerald-400 bg-slate-950 shadow-[inset_0_0_20px_rgba(16,185,129,0.3)] animate-pulse'
              : isBlackBallResult
              ? 'border-amber-400 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-xl shadow-amber-900/30'
              : selectedYear
              ? 'border-emerald-500/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-lg'
              : 'border-slate-800 bg-slate-950'
          }`}
        >
          {/* Glass glare line */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/40 pointer-events-none" />

          {/* STATE A: BLACK BALL REEL SPINNING */}
          {isBlackBallReelActive ? (
            <div className="flex flex-col items-center justify-center space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl animate-spin">⚽</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-black via-slate-900 to-amber-900 border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.9)] flex items-center justify-center text-xs font-black text-amber-300">
                  ⚫
                </div>
                <span className="text-3xl sm:text-4xl animate-spin">⚽</span>
              </div>
              <div className="text-xs sm:text-sm font-heading font-black text-amber-300 tracking-widest uppercase">
                BLACK BALL
              </div>
              <div className="text-[10px] font-mono text-amber-400/80">
                0.001% ROULETTE
              </div>
            </div>
          ) : (
            /* STATE B: STANDARD REEL / REVEALED RESULT */
            <>
              <div
                className={`text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-1 ${
                  isBlackBallResult ? 'text-amber-400 font-black' : 'text-emerald-400/80'
                }`}
              >
                {isBlackBallResult ? '⭐ LEGENDARY YEAR ⭐' : 'SIGNING YEAR'}
              </div>

              <div
                className={`font-heading font-extrabold text-4xl sm:text-6xl tracking-tight transition-transform ${
                  isSpinning
                    ? 'scale-110 blur-[0.5px] text-emerald-300'
                    : isBlackBallResult
                    ? 'scale-100 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                    : 'scale-100 text-white'
                }`}
              >
                {displayYear}
              </div>

              <div
                className={`mt-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-xs font-bold ${
                  isBlackBallResult
                    ? 'bg-amber-950/60 border-amber-400/60 text-amber-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <span>SEASON</span>
                <span
                  className={`font-mono ${
                    isBlackBallResult ? 'text-amber-300 font-black' : 'text-emerald-400'
                  }`}
                >
                  {displayYear}-{String(displayYear + 1).slice(2)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Club Reel */}
        <div
          id="club-reel"
          className={`h-36 sm:h-44 rounded-2xl border-2 flex flex-col items-center justify-center p-3 relative overflow-hidden transition-all duration-300 ${
            isBlackBallReelActive
              ? 'border-yellow-400 bg-gradient-to-b from-slate-950 via-black to-slate-950 shadow-[inset_0_0_30px_rgba(250,204,21,0.6)]'
              : isSpinning
              ? 'border-teal-400 bg-slate-950 shadow-[inset_0_0_20px_rgba(20,184,166,0.3)] animate-pulse'
              : isBlackBallResult
              ? 'border-amber-400 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-xl shadow-amber-900/30'
              : selectedClub
              ? 'border-teal-500/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-lg'
              : 'border-slate-800 bg-slate-950'
          }`}
          style={{
            borderTopColor: isBlackBallResult
              ? '#fbbf24'
              : displayClub.primaryColor || undefined,
          }}
        >
          {/* Glass glare line */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/40 pointer-events-none" />

          {/* STATE A: BLACK BALL REEL SPINNING */}
          {isBlackBallReelActive ? (
            <div className="flex flex-col items-center justify-center space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl animate-spin">⚽</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-black via-slate-900 to-amber-900 border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.9)] flex items-center justify-center text-xs font-black text-yellow-300">
                  ⚫
                </div>
                <span className="text-3xl sm:text-4xl animate-spin">⚽</span>
              </div>
              <div className="text-xs sm:text-sm font-heading font-black text-yellow-300 tracking-widest uppercase">
                BLACK BALL
              </div>
              <div className="text-[10px] font-mono text-yellow-400/80">
                0.001% ROULETTE
              </div>
            </div>
          ) : (
            /* STATE B: STANDARD REEL / REVEALED RESULT */
            <>
              {/* Club Header Badges */}
              <div
                className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase mb-1 ${
                  isBlackBallResult ? 'text-amber-300 font-black' : 'text-teal-400'
                }`}
              >
                <span>{displayClub.countryFlag}</span>
                <span className="truncate max-w-[110px] sm:max-w-none">
                  {displayClub.league}
                </span>
              </div>

              {/* Club Crest Emoji / Icon */}
              <div
                className={`text-3xl sm:text-5xl transition-transform my-0.5 ${
                  isSpinning ? 'scale-110 blur-[0.5px]' : 'scale-100'
                }`}
              >
                {displayClub.crestEmoji || '🛡️'}
              </div>

              {/* Club Localized Name */}
              <div className="text-center px-1">
                <span
                  className={`font-heading font-extrabold text-sm sm:text-lg line-clamp-1 ${
                    isBlackBallResult
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 font-black'
                      : 'text-white'
                  }`}
                >
                  {getLocalizedClubName(displayClub, language)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons: ⚽ SPIN DRAFT + SKIP */}
      <div className="mt-5 flex flex-col sm:flex-row items-center gap-3 justify-center">
        {/* Main 1-Click Spin Draft Button */}
        <button
          id="spin-draft-btn"
          disabled={isSpinButtonDisabled}
          onClick={onSpin}
          className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-heading font-extrabold text-base sm:text-lg tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2.5 shadow-xl ${
            isTeamFull
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : isSpinning
              ? isBlackBallReelActive
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black animate-pulse cursor-wait'
                : 'bg-emerald-700 text-white cursor-wait animate-pulse'
              : hasCurrentDraft
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5'
          }`}
        >
          {isSpinning ? (
            <>
              <div
                className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                  isBlackBallReelActive ? 'border-slate-950' : 'border-white'
                }`}
              />
              <span>
                {isBlackBallReelActive ? '⚫ BLACK BALL SPINNING...' : t.spinning}
              </span>
            </>
          ) : isTeamFull ? (
            <>
              <span>🏆</span>
              <span>{t.bestXiCompleted}</span>
            </>
          ) : hasCurrentDraft ? (
            <>
              <span>🔒</span>
              <span>{t.spinLocked}</span>
            </>
          ) : (
            <>
              <span className="text-xl">⚽</span>
              <span>{t.spinDraft}</span>
            </>
          )}
        </button>

        {/* Skip Button (Max 3) */}
        {hasCurrentDraft && !isTeamFull && (
          <button
            id="skip-btn"
            disabled={isSpinning || skipsRemaining <= 0}
            onClick={onSkip}
            className={`w-full sm:w-auto py-3.5 px-5 rounded-2xl font-heading font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 border ${
              skipsRemaining > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border-amber-500/40 hover:border-amber-400 active:scale-95 shadow-md'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
          >
            <RotateCcw
              className={`w-4 h-4 ${skipsRemaining > 0 ? 'animate-none' : 'opacity-40'}`}
            />
            <span>{t.skip}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-extrabold ${
                skipsRemaining > 0
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-slate-800 text-slate-600'
              }`}
            >
              {skipsRemaining}/3
            </span>
          </button>
        )}
      </div>

      {/* Lock Notice or Skips Remaining Indicator */}
      {hasCurrentDraft && (
        <div className="mt-2.5 text-center text-[11px] text-amber-300/80 font-medium">
          💡 {t.spinDraftLockedNotice}
        </div>
      )}

      {!hasCurrentDraft && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
          <span>{t.skipRemaining}:</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`w-2.5 h-2.5 rounded-full ${
                  num <= skipsRemaining
                    ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


