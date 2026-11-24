import React, { useEffect, useState, useRef } from 'react';
import { Club, GameMode, Language, BlackBallSpinType, NationalDecade, NationalTeam, Manager } from '../types';
import { getClubsByMode, getAvailableYears } from '../data/playerDatabase';
import {
  NATIONAL_DECADES,
  NATIONAL_TEAMS,
  getDecadeLabel,
  getNationalTeamById,
  getLocalizedNationalTeamName,
} from '../data/nationalEraDatabase';
import { getLocalizedManagerName } from '../data/managersDatabase';
import { TRANSLATIONS, getLocalizedClubName } from '../utils/translations';
import { soundManager } from '../utils/audio';
import {
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Zap,
  Award,
  Crown,
  Globe,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

interface SlotMachineProps {
  mode: GameMode;
  language: Language;
  selectedYear: number | null;
  selectedClub: Club | null;
  selectedDecade?: NationalDecade | null;
  selectedNationalTeamId?: string | null;
  isSpinning: boolean;
  blackBallSpinType?: BlackBallSpinType;
  blackBallStage?: 'spinning-normal' | 'lightning-striking' | 'blackball-spinning' | 'golden-rain' | 'revealed';
  isBlackBallResult?: boolean;
  isGoldenResult?: boolean;
  isPurpleResult?: boolean;
  isPurpleSpin?: boolean;
  hasCurrentDraft: boolean;
  skipsRemaining: number;
  onSpin: () => void;
  onSkip: () => void;
  disabled: boolean;
  isTeamFull: boolean;
  managerDrafted?: boolean;
  pendingManagerCount?: number;
  draftedManager?: Manager | null;
  onOpenManagerDraft?: () => void;
}

export const SlotMachine: React.FC<SlotMachineProps> = ({
  mode,
  language,
  selectedYear,
  selectedClub,
  selectedDecade = null,
  selectedNationalTeamId = null,
  isSpinning,
  blackBallSpinType = 'none',
  blackBallStage = 'spinning-normal',
  isBlackBallResult = false,
  isGoldenResult = false,
  isPurpleResult = false,
  isPurpleSpin: isPurpleSpinProp = false,
  hasCurrentDraft,
  skipsRemaining,
  onSpin,
  onSkip,
  disabled,
  isTeamFull,
  managerDrafted = false,
  pendingManagerCount = 0,
  draftedManager = null,
  onOpenManagerDraft,
}) => {
  const t = TRANSLATIONS[language];
  const clubs = getClubsByMode(mode);
  const years = getAvailableYears(mode);
  const isNationalEra = mode === 'national_era';
  const hasNationalResult = isNationalEra && hasCurrentDraft && Boolean(selectedDecade) && Boolean(selectedNationalTeamId);

  // Reel animated current indices
  const [displayYear, setDisplayYear] = useState<number>(selectedYear || 2021);
  const [displayClub, setDisplayClub] = useState<Club>(selectedClub || clubs[0]);
  const [displayDecade, setDisplayDecade] = useState<NationalDecade>(selectedDecade || '2020s');
  const [displayNation, setDisplayNation] = useState<NationalTeam>(
    getNationalTeamById(selectedNationalTeamId) || NATIONAL_TEAMS[0]
  );
  const spinIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGoldenSpin =
    blackBallSpinType === 'golden-ballon-dor' ||
    blackBallSpinType === 'golden-lightning-ballon-dor' ||
    isGoldenResult;

  const isPurpleSpin =
    isPurpleSpinProp ||
    blackBallSpinType === 'purple-spark' ||
    blackBallSpinType === 'purple-neon' ||
    Boolean(isPurpleResult);

  useEffect(() => {
    if (isSpinning) {
      let tickCount = 0;
      spinIntervalRef.current = setInterval(() => {
        tickCount++;

        if (isNationalEra) {
          const randomDecade = NATIONAL_DECADES[Math.floor(Math.random() * NATIONAL_DECADES.length)].id;
          const randomNation = NATIONAL_TEAMS[Math.floor(Math.random() * NATIONAL_TEAMS.length)];
          setDisplayDecade(randomDecade);
          setDisplayNation(randomNation);
        } else if (blackBallStage === 'spinning-normal' || blackBallSpinType === 'none') {
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
      if (selectedDecade) setDisplayDecade(selectedDecade);
      if (selectedNationalTeamId) {
        const foundNation = getNationalTeamById(selectedNationalTeamId);
        if (foundNation) setDisplayNation(foundNation);
      }
    }

    return () => {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
      }
    };
  }, [
    isSpinning,
    isNationalEra,
    selectedYear,
    selectedClub,
    selectedDecade,
    selectedNationalTeamId,
    clubs,
    years,
    blackBallSpinType,
    blackBallStage,
  ]);

  const isSpecialReelActive =
    isSpinning &&
    (blackBallStage === 'blackball-spinning' || blackBallStage === 'golden-rain');

  const isLightningStriking = isSpinning && blackBallStage === 'lightning-striking';
  const isSpinButtonDisabled = isSpinning || hasCurrentDraft || disabled || isTeamFull;

  const activeClubBadgeSymbol = displayClub?.badgeSymbol || '🛡️';
  const activeDecadeMeta = NATIONAL_DECADES.find((d) => d.id === displayDecade) || NATIONAL_DECADES[3];

  return (
    <div
      id="slot-machine-container"
      className={`w-full max-w-3xl mx-auto rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md transition-all duration-500 ${
        isLightningStriking || isSpecialReelActive ? 'animate-shake' : ''
      } ${
        isPurpleSpin
          ? 'bg-gradient-to-b from-slate-950 via-purple-950/60 to-slate-950 border-2 border-fuchsia-400 shadow-[0_0_45px_rgba(217,70,239,0.5)]'
          : isGoldenSpin
          ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/60 border-2 border-yellow-300 shadow-[0_0_40px_rgba(250,204,21,0.4)]'
          : isSpecialReelActive || isBlackBallResult
          ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/40 border-2 border-amber-400 shadow-amber-950/60'
          : isNationalEra
          ? 'bg-gradient-to-b from-slate-900/95 via-cyan-950/35 to-slate-900/95 border border-cyan-500/40 shadow-cyan-950/40'
          : 'bg-slate-900/90 border border-emerald-500/30 shadow-emerald-950/40'
      }`}
    >
      {/* Decorative top illumination */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 shadow-lg transition-all duration-500 ${
          isPurpleSpin
            ? 'bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent shadow-[0_0_30px_#e879f9]'
            : isGoldenSpin
            ? 'bg-gradient-to-r from-transparent via-yellow-300 to-transparent shadow-[0_0_30px_#facc15]'
            : isSpecialReelActive || isBlackBallResult
            ? 'bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_#f59e0b]'
            : isNationalEra
            ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee]'
            : 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981]'
        }`}
      />

      {/* Manager Draft Quick Banner Bar */}
      {onOpenManagerDraft && (
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                managerDrafted
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                  : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
              }`}
            >
              {managerDrafted ? <CheckCircle2 className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {t.managerDraft} ({managerDrafted ? '1/1' : pendingManagerCount > 0 ? '候補選出中' : '0/1'})
              </div>
              <div className="text-xs font-bold text-white truncate">
                {managerDrafted && draftedManager
                  ? `${draftedManager.nationalityFlag} ${getLocalizedManagerName(draftedManager, language)} (MAX ${draftedManager.maxAffinity})`
                  : pendingManagerCount > 0
                  ? language === 'ja'
                    ? `監督候補${pendingManagerCount}名が待機中 — 1名を選択してください`
                    : `${pendingManagerCount} manager candidates waiting — select 1`
                  : t.managerDraftSubtitle}
              </div>
            </div>
          </div>

          <button
            id="btn-open-manager-draft"
            type="button"
            disabled={isSpinning}
            onClick={() => {
              soundManager.playButtonClick();
              onOpenManagerDraft();
            }}
            className={`px-3.5 py-2 rounded-xl font-heading font-black text-xs tracking-wider transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
              managerDrafted
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>
              {managerDrafted
                ? t.managerAppointed
                : pendingManagerCount > 0
                ? language === 'ja'
                  ? `👔 監督を選ぶ (${pendingManagerCount}名)`
                  : `👔 CHOOSE MANAGER (${pendingManagerCount})`
                : `👔 ${t.managerDraft}`}
            </span>
          </button>
        </div>
      )}

      {/* Lightning Flash Overlay */}
      {isLightningStriking && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center bg-white/50 animate-ping">
          <div
            className={`w-full h-full animate-pulse ${
              isPurpleSpin
                ? 'bg-gradient-to-r from-fuchsia-400/70 via-white to-purple-500/70'
                : isGoldenSpin
                ? 'bg-gradient-to-r from-yellow-200/60 via-white to-amber-200/60'
                : 'bg-gradient-to-r from-purple-200/60 via-white to-indigo-200/60'
            }`}
          />
        </div>
      )}

      {/* Center Lightning Strike Visual */}
      {isLightningStriking && (
        <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-center">
          <div className="relative flex flex-col items-center animate-bounce">
            <Zap
              className={`w-24 h-24 sm:w-32 sm:h-32 ${
                isPurpleSpin
                  ? 'text-fuchsia-300 fill-fuchsia-400 filter drop-shadow-[0_0_40px_rgba(232,121,249,1)]'
                  : isGoldenSpin
                  ? 'text-yellow-200 fill-yellow-300 filter drop-shadow-[0_0_40px_rgba(253,224,71,1)]'
                  : 'text-amber-300 fill-yellow-200 filter drop-shadow-[0_0_40px_rgba(253,224,71,1)]'
              } animate-ping`}
            />
            <div
              className={`text-xl sm:text-3xl font-heading font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-950/95 border-2 mt-2 ${
                isPurpleSpin
                  ? 'text-fuchsia-300 border-fuchsia-400 shadow-[0_0_40px_rgba(217,70,239,0.9)]'
                  : isGoldenSpin
                  ? 'text-yellow-300 border-yellow-300 shadow-[0_0_35px_rgba(251,191,36,0.9)]'
                  : 'text-amber-300 border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.9)]'
              }`}
            >
              {isPurpleSpin
                ? '🟣 紫演出発生！ PURPLE SPECIAL 🟣'
                : isGoldenSpin
                ? '⚡ GOLDEN LIGHTNING! ⚡'
                : '⚡ LIGHTNING STRIKE! ⚡'}
            </div>
          </div>
        </div>
      )}

      {/* Reel Titles */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-center">
        <div
          className={`flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
            isPurpleSpin
              ? 'text-fuchsia-300'
              : isGoldenSpin
              ? 'text-yellow-300'
              : isSpecialReelActive || isBlackBallResult
              ? 'text-amber-400'
              : isNationalEra
              ? 'text-cyan-400'
              : 'text-emerald-400'
          }`}
        >
          <span>{isPurpleSpin ? '🟣' : isGoldenSpin ? '🏆' : isSpecialReelActive || isBlackBallResult ? '⚫' : '📅'}</span>
          <span>
            {isPurpleSpin
              ? 'PURPLE REEL'
              : isGoldenSpin
              ? 'GOLDEN REEL'
              : isSpecialReelActive
              ? 'BLACK BALL REEL'
              : isNationalEra
              ? language === 'ja'
                ? '年代 (ERA)'
                : 'ERA DECADE'
              : `${t.joiningYear} (YEAR)`}
          </span>
        </div>
        <div
          className={`flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
            isPurpleSpin
              ? 'text-fuchsia-300'
              : isGoldenSpin
              ? 'text-yellow-300'
              : isSpecialReelActive || isBlackBallResult
              ? 'text-yellow-400'
              : isNationalEra
              ? 'text-sky-400'
              : 'text-teal-400'
          }`}
        >
          {isPurpleSpin ? (
            <Sparkles className="w-4 h-4 text-fuchsia-300" />
          ) : isGoldenSpin ? (
            <Crown className="w-4 h-4 text-yellow-300" />
          ) : isSpecialReelActive || isBlackBallResult ? (
            <Award className="w-4 h-4 text-amber-400" />
          ) : isNationalEra ? (
            <Globe className="w-4 h-4 text-sky-400" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          <span>
            {isPurpleSpin
              ? 'ACTIVE STARS'
              : isGoldenSpin
              ? 'GOLDEN REEL'
              : isSpecialReelActive
              ? 'BLACK BALL REEL'
              : isNationalEra
              ? language === 'ja'
                ? '代表チーム (NATIONAL)'
                : 'NATIONAL TEAM'
              : `${t.club} (CLUB)`}
          </span>
        </div>
      </div>

      {/* The Dual Slot Reels */}
      <div id="reels-display" className="grid grid-cols-2 gap-3 sm:gap-6 relative">
        {/* Left Reel: Year OR Era Decade */}
        <div
          id="year-reel"
          className={`h-36 sm:h-44 rounded-2xl border-2 flex flex-col items-center justify-center p-3 relative overflow-hidden transition-all duration-300 ${
            isPurpleSpin
              ? 'border-fuchsia-400 bg-gradient-to-b from-slate-950 via-purple-950/60 to-slate-950 shadow-[inset_0_0_35px_rgba(217,70,239,0.6)]'
              : isGoldenSpin
              ? 'border-yellow-300 bg-gradient-to-b from-slate-950 via-amber-950/50 to-slate-950 shadow-[inset_0_0_35px_rgba(250,204,21,0.6)]'
              : isSpecialReelActive
              ? 'border-amber-300 bg-black shadow-[inset_0_0_35px_rgba(251,191,36,0.65)]'
              : isSpinning
              ? 'border-emerald-400 bg-slate-950 shadow-[inset_0_0_20px_rgba(16,185,129,0.3)] animate-pulse'
              : isBlackBallResult
              ? 'border-amber-300 bg-black shadow-xl shadow-amber-900/40'
              : isNationalEra
              ? 'border-cyan-500/70 bg-gradient-to-b from-slate-950 via-cyan-950/30 to-slate-950 shadow-lg'
              : selectedYear
              ? 'border-emerald-500/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-lg'
              : 'border-slate-800 bg-slate-950'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/40 pointer-events-none" />

          {isPurpleSpin && isSpinning ? (
            <div className="flex flex-col items-center justify-center space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl animate-bounce">🟣</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-fuchsia-500 via-purple-600 to-indigo-700 border-2 border-fuchsia-300 shadow-[0_0_25px_rgba(217,70,239,1)] flex items-center justify-center text-xs font-black text-white">
                  ★
                </div>
                <span className="text-3xl sm:text-4xl animate-bounce">🟣</span>
              </div>
              <div className="text-xs sm:text-sm font-heading font-black text-fuchsia-300 tracking-widest uppercase">
                PURPLE SPECIAL
              </div>
              <div className="text-[10px] font-mono text-fuchsia-200/90 font-bold">3.0% RARE OCCURRENCE</div>
            </div>
          ) : isGoldenSpin && isSpinning ? (
            <div className="flex flex-col items-center justify-center space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl animate-bounce">🏆</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-600 border-2 border-yellow-200 shadow-[0_0_25px_rgba(250,204,21,1)] flex items-center justify-center text-xs font-black text-slate-950">
                  ★
                </div>
                <span className="text-3xl sm:text-4xl animate-bounce">🏆</span>
              </div>
              <div className="text-xs sm:text-sm font-heading font-black text-yellow-300 tracking-widest uppercase">
                GOLDEN ERA
              </div>
              <div className="text-[10px] font-mono text-yellow-200/90 font-bold">GOLDEN SPECIAL</div>
            </div>
          ) : isSpecialReelActive ? (
            <div className="flex flex-col items-center justify-center space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl animate-bounce">⚡</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black border-2 border-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.95)] flex items-center justify-center text-xs font-black text-amber-300">
                  ⚫
                </div>
                <span className="text-3xl sm:text-4xl animate-bounce">⚡</span>
              </div>
              <div className="text-xs sm:text-sm font-heading font-black text-amber-300 tracking-widest uppercase">
                BLACK BALL
              </div>
              <div className="text-[10px] font-mono text-amber-300/90 font-bold">1.8% • OVR 100+</div>
            </div>
          ) : isNationalEra ? (
            isSpinning || hasNationalResult ? (
              <>
                <div className="text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-1 text-cyan-300">
                  {hasNationalResult && !isSpinning ? '✓ SELECTED ERA' : 'ERA DECADE'}
                </div>
                <div
                  className={`font-heading font-extrabold text-3xl sm:text-5xl tracking-tight transition-transform ${
                    isSpinning ? 'scale-110 blur-[0.5px] text-cyan-300' : 'scale-100 text-white drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]'
                  }`}
                >
                  {displayDecade}
                </div>
                <div className="mt-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border bg-cyan-950/70 border-cyan-500/40 text-[10px] sm:text-xs font-bold text-cyan-200">
                  <span>{getDecadeLabel(displayDecade, language)}</span>
                  <span className="font-mono text-cyan-400">({activeDecadeMeta.range})</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-1 text-cyan-300/80">
                  ERA ROULETTE
                </div>
                <div className="font-heading font-black text-3xl sm:text-4xl text-cyan-200/80 tracking-widest">
                  ? ? ?
                </div>
                <div className="mt-2 px-2.5 py-0.5 rounded-full border bg-slate-900 border-cyan-500/30 text-[10px] font-bold text-cyan-300">
                  {language === 'ja' ? 'ランダム決定' : 'RANDOM DRAW'}
                </div>
              </>
            )
          ) : (
            <>
              <div
                className={`text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-1 ${
                  isPurpleResult
                    ? 'text-fuchsia-300 font-black'
                    : isGoldenResult
                    ? 'text-yellow-300 font-black'
                    : isBlackBallResult
                    ? 'text-amber-400 font-black'
                    : 'text-emerald-400/80'
                }`}
              >
                {isPurpleResult
                  ? '🟣 PURPLE SPECIAL YEAR 🟣'
                  : isGoldenResult
                  ? '👑 GOLDEN SPECIAL YEAR 👑'
                  : isBlackBallResult
                  ? '⚫ BLACK BALL (OVR 100+) ⚫'
                  : 'SIGNING YEAR'}
              </div>

              <div
                className={`font-heading font-extrabold text-4xl sm:text-6xl tracking-tight transition-transform ${
                  isSpinning
                    ? 'scale-110 blur-[0.5px] text-emerald-300'
                    : isPurpleResult
                    ? 'scale-100 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 via-purple-300 to-indigo-200 drop-shadow-[0_0_20px_rgba(217,70,239,0.8)]'
                    : isGoldenResult
                    ? 'scale-100 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]'
                    : isBlackBallResult
                    ? 'scale-100 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                    : 'scale-100 text-white'
                }`}
              >
                {displayYear}
              </div>

              <div
                className={`mt-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-xs font-bold ${
                  isPurpleResult
                    ? 'bg-purple-950/70 border-fuchsia-400/80 text-fuchsia-200 shadow-md shadow-fuchsia-500/20'
                    : isGoldenResult
                    ? 'bg-amber-900/60 border-yellow-300/80 text-yellow-200 shadow-md shadow-yellow-500/20'
                    : isBlackBallResult
                    ? 'bg-amber-950/60 border-amber-400/60 text-amber-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                <span>SEASON</span>
                <span
                  className={`font-mono ${
                    isPurpleResult
                      ? 'text-fuchsia-300 font-black'
                      : isGoldenResult
                      ? 'text-yellow-300 font-black'
                      : isBlackBallResult
                      ? 'text-amber-300 font-black'
                      : 'text-emerald-400'
                  }`}
                >
                  {displayYear}-{String(displayYear + 1).slice(2)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right Reel: Club OR National Team */}
        <div
          id="club-reel"
          className={`h-36 sm:h-44 rounded-2xl border-2 flex flex-col items-center justify-center p-3 relative overflow-hidden transition-all duration-300 ${
            isPurpleSpin
              ? 'border-fuchsia-400 bg-gradient-to-b from-slate-950 via-purple-950/60 to-slate-950 shadow-[inset_0_0_35px_rgba(217,70,239,0.6)]'
              : isGoldenSpin
              ? 'border-yellow-300 bg-gradient-to-b from-slate-950 via-amber-950/50 to-slate-950 shadow-[inset_0_0_35px_rgba(250,204,21,0.6)]'
              : isSpecialReelActive
              ? 'border-amber-300 bg-black shadow-[inset_0_0_35px_rgba(251,191,36,0.65)]'
              : isSpinning
              ? 'border-teal-400 bg-slate-950 shadow-[inset_0_0_20px_rgba(20,184,166,0.3)] animate-pulse'
              : isBlackBallResult
              ? 'border-amber-300 bg-black shadow-xl shadow-amber-900/40'
              : isNationalEra
              ? 'border-sky-500/70 bg-gradient-to-b from-slate-950 via-sky-950/25 to-slate-950 shadow-lg'
              : selectedClub
              ? 'border-teal-500/80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-lg'
              : 'border-slate-800 bg-slate-950'
          }`}
          style={{
            borderTopColor: isPurpleResult
              ? '#e879f9'
              : isGoldenResult
              ? '#fde047'
              : isBlackBallResult
              ? '#fbbf24'
              : isNationalEra
              ? displayNation.primaryColor
              : displayClub.primaryColor || undefined,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/40 pointer-events-none" />

          {isPurpleSpin && isSpinning ? (
            <div className="flex flex-col items-center justify-center space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl animate-bounce">🟣</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-fuchsia-500 via-purple-600 to-indigo-700 border-2 border-fuchsia-300 shadow-[0_0_25px_rgba(217,70,239,1)] flex items-center justify-center text-xs font-black text-white">
                  ★
                </div>
                <span className="text-3xl sm:text-4xl animate-bounce">🟣</span>
              </div>
              <div className="text-xs sm:text-sm font-heading font-black text-fuchsia-300 tracking-widest uppercase">
                ACTIVE SUPERSTARS
              </div>
              <div className="text-[10px] font-mono text-fuchsia-200/90 font-bold">OVR 98 - 101</div>
            </div>
          ) : isGoldenSpin && isSpinning ? (
            <div className="flex flex-col items-center justify-center space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl animate-bounce">🏆</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-600 border-2 border-yellow-200 shadow-[0_0_25px_rgba(250,204,21,1)] flex items-center justify-center text-xs font-black text-slate-950">
                  ★
                </div>
                <span className="text-3xl sm:text-4xl animate-bounce">🏆</span>
              </div>
              <div className="text-xs sm:text-sm font-heading font-black text-yellow-300 tracking-widest uppercase">
                GOLDEN CLUB
              </div>
              <div className="text-[10px] font-mono text-yellow-200/90 font-bold">SPECIAL EDITION</div>
            </div>
          ) : isSpecialReelActive ? (
            <div className="flex flex-col items-center justify-center space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl animate-bounce">⚡</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black border-2 border-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.95)] flex items-center justify-center text-xs font-black text-amber-300">
                  ⚫
                </div>
                <span className="text-3xl sm:text-4xl animate-bounce">⚡</span>
              </div>
              <div className="text-xs sm:text-sm font-heading font-black text-amber-300 tracking-widest uppercase">
                BLACK BALL
              </div>
              <div className="text-[10px] font-mono text-amber-300/90 font-bold">1.8% • OVR 100+</div>
            </div>
          ) : isNationalEra ? (
            isSpinning || hasNationalResult ? (
              <>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase mb-1 text-sky-300">
                  <span>{displayNation.confederation}</span>
                </div>
                <div className={`text-4xl sm:text-5xl transition-transform my-0.5 ${isSpinning ? 'scale-110 blur-[0.5px]' : 'scale-100'}`}>
                  {displayNation.flag}
                </div>
                <div className="text-center px-1 mt-1">
                  <span className="font-heading font-extrabold text-sm sm:text-lg line-clamp-1 text-white">
                    {getLocalizedNationalTeamName(displayNation, language)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-1 text-sky-300/80">
                  NATIONAL TEAM
                </div>
                <div className="text-4xl sm:text-5xl opacity-80 my-0.5">🌐</div>
                <div className="mt-1 px-2.5 py-0.5 rounded-full border bg-slate-900 border-sky-500/30 text-[10px] font-bold text-sky-300">
                  {language === 'ja' ? 'DRAFT STARTで抽選' : 'PRESS DRAFT START'}
                </div>
              </>
            )
          ) : (
            <>
              <div
                className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase mb-1 ${
                  isPurpleResult
                    ? 'text-fuchsia-300 font-black'
                    : isGoldenResult
                    ? 'text-yellow-300 font-black'
                    : isBlackBallResult
                    ? 'text-amber-300 font-black'
                    : 'text-teal-400'
                }`}
              >
                <span>{displayClub.countryFlag}</span>
                <span className="truncate max-w-[110px] sm:max-w-none">
                  {isPurpleResult ? 'ACTIVE SUPERSTARS' : displayClub.league}
                </span>
              </div>

              <div className={`text-3xl sm:text-5xl transition-transform my-0.5 ${isSpinning ? 'scale-110 blur-[0.5px]' : 'scale-100'}`}>
                {isPurpleResult ? '🟣' : activeClubBadgeSymbol}
              </div>

              <div className="text-center px-1">
                <span
                  className={`font-heading font-extrabold text-sm sm:text-lg line-clamp-1 ${
                    isPurpleResult
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 via-purple-300 to-indigo-200 font-black'
                      : isGoldenResult
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 font-black'
                      : isBlackBallResult
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 font-black'
                      : 'text-white'
                  }`}
                >
                  {isPurpleResult
                    ? language === 'ja'
                      ? '現役特枠スーパースター'
                      : language === 'es'
                      ? 'Superestrellas Activas'
                      : 'Active Superstars'
                    : getLocalizedClubName(displayClub, language)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Prominent Locked Result Banner for Randomized Era x National Team Draft */}
      {hasNationalResult && !isSpinning && (
        <div
          id="national-era-locked-banner"
          className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-slate-900 to-sky-950/90 border-2 border-cyan-400/70 shadow-xl shadow-cyan-950/50 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-4xl sm:text-5xl shrink-0">{displayNation.flag}</span>
            <div>
              <div className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-300">
                {language === 'ja' ? '🎯 抽選決定条件（固定）' : '🎯 DRAWN CONDITION (LOCKED)'}
              </div>
              <div className="font-heading font-black text-lg sm:text-2xl text-white leading-tight">
                {getDecadeLabel(displayDecade, language)} × {getLocalizedNationalTeamName(displayNation, language)}
              </div>
              <div className="text-[11px] font-mono text-cyan-200/80">
                {activeDecadeMeta.range} • {displayNation.confederation}
              </div>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-[11px] font-mono font-black shrink-0">
            🔒 {language === 'ja' ? '条件確定（変更不可）' : 'LOCKED IN'}
          </div>
        </div>
      )}

      {/* Action Buttons: SPIN DRAFT + SKIP */}
      <div className="mt-5 flex flex-col sm:flex-row items-center gap-3 justify-center">
        <button
          id="spin-draft-btn"
          disabled={isSpinButtonDisabled}
          onClick={onSpin}
          className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-heading font-extrabold text-base sm:text-lg tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2.5 shadow-xl cursor-pointer ${
            isTeamFull
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : isSpinning
              ? isPurpleSpin
                ? 'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 text-white font-black animate-pulse cursor-wait shadow-[0_0_25px_rgba(217,70,239,0.8)]'
                : isGoldenSpin
                ? 'bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-slate-950 font-black animate-pulse cursor-wait shadow-[0_0_25px_rgba(250,204,21,0.8)]'
                : isSpecialReelActive
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black animate-pulse cursor-wait'
                : 'bg-emerald-700 text-white cursor-wait animate-pulse'
              : hasCurrentDraft
              ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80'
              : isNationalEra
              ? 'bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black shadow-cyan-500/25'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5'
          }`}
        >
          {isSpinning ? (
            <>
              <div
                className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                  isPurpleSpin ? 'border-white' : isGoldenSpin || isSpecialReelActive ? 'border-slate-950' : 'border-white'
                }`}
              />
              <span>
                {isPurpleSpin
                  ? '🟣 PURPLE SPECIAL SPINNING...'
                  : isGoldenSpin
                  ? '👑 GOLDEN SPECIAL SPINNING...'
                  : isSpecialReelActive
                  ? '⚫ BLACK BALL SPINNING...'
                  : t.spinning}
              </span>
            </>
          ) : isTeamFull ? (
            <>
              <span>🏆</span>
              <span>{t.teamCompletedBadge} (11/11)</span>
            </>
          ) : hasCurrentDraft ? (
            <>
              <span>🔒</span>
              <span>{t.spinLocked}</span>
            </>
          ) : (
            <>
              <span className="text-xl">{isNationalEra ? '🌐' : '⚽'}</span>
              <span>
                {isNationalEra
                  ? language === 'ja'
                    ? 'DRAFT START（年代×代表 抽選）'
                    : 'DRAFT START'
                  : t.spinDraft}
              </span>
            </>
          )}
        </button>

        {hasCurrentDraft && !isTeamFull && (
          <button
            id="skip-btn"
            disabled={isSpinning || skipsRemaining <= 0}
            onClick={onSkip}
            className={`w-full sm:w-auto py-3.5 px-5 rounded-2xl font-heading font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 border cursor-pointer ${
              isSpinning || skipsRemaining <= 0
                ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border-amber-500/40 hover:border-amber-400 active:scale-95 shadow-md'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${!isSpinning && skipsRemaining > 0 ? 'animate-none' : 'opacity-40'}`} />
            <span>{t.skip}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-extrabold ${
                !isSpinning && skipsRemaining > 0
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'bg-slate-800 text-slate-600'
              }`}
            >
              {skipsRemaining}/3
            </span>
          </button>
        )}
      </div>

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
                    ? isGoldenSpin
                      ? 'bg-yellow-300 shadow-[0_0_8px_#fde047]'
                      : 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
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
