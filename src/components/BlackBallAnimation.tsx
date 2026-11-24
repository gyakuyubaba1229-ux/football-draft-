import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Language, Manager, Player } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { getVerifiedPositionsForPlayer } from '../utils/positionEngine';
import {
  getLocalizedManagerName,
  getLocalizedManagerNationality,
  getLocalizedTacticName,
} from '../data/managersDatabase';
import { getDecadeLabel, getNationalTeamById, getLocalizedNationalTeamName } from '../data/nationalEraDatabase';
import { ManagerPortraitSvg } from './ManagerCard';
import {
  UnifiedRarity,
  resolvePlayerRarity,
  rarityToRevealTier,
  getRarityDisplayLabel,
} from '../utils/rarityEngine';
import { Zap, Sparkles, Star, Crown, Briefcase, FastForward, Trophy } from 'lucide-react';

export type SpecialAnimationType = 'black' | 'gold' | 'purple';

export type DraftRevealTier = 'normal' | 'high' | 'ultra' | 'supreme' | 'manager';

export type RevealStagingEvent = 'blackball' | 'purple' | 'normal' | 'manager' | 'japan_star';

interface BlackBallAnimationProps {
  language: Language;
  type?: SpecialAnimationType;
  player?: Player | null;
  rarityOverride?: UnifiedRarity | null;
  onAnimationEnd: () => void;
}

interface DraftRevealOverlayProps {
  language: Language;
  tier: DraftRevealTier;
  stagingEvent?: RevealStagingEvent;
  player?: Player | null;
  manager?: Manager | null;
  rarityOverride?: UnifiedRarity | null;
  candidateCount?: number;
  onAnimationEnd: () => void;
}

const TIER_DURATIONS: Record<DraftRevealTier, { burstMs: number; spinMs: number; revealMs: number; endMs: number }> = {
  normal: { burstMs: 180, spinMs: 420, revealMs: 700, endMs: 2150 },
  high: { burstMs: 240, spinMs: 650, revealMs: 1150, endMs: 2900 },
  ultra: { burstMs: 320, spinMs: 850, revealMs: 1550, endMs: 3500 },
  supreme: { burstMs: 320, spinMs: 900, revealMs: 1650, endMs: 3800 },
  manager: { burstMs: 260, spinMs: 700, revealMs: 1250, endMs: 3200 },
};

export const DraftRevealOverlay: React.FC<DraftRevealOverlayProps> = ({
  language = 'ja',
  tier,
  stagingEvent,
  player = null,
  manager = null,
  rarityOverride = null,
  candidateCount = 1,
  onAnimationEnd,
}) => {
  const lang: Language = language === 'en' || language === 'es' ? language : 'ja';
  const t = TRANSLATIONS[lang];
  const [phase, setPhase] = useState<'initial' | 'burst' | 'focus' | 'reveal'>('initial');

  const isExplicitBlackBall = stagingEvent === 'blackball';
  const isExplicitPurple = stagingEvent === 'purple';
  const isExplicitJapanStar = stagingEvent === 'japan_star';
  const isExplicitNormal = stagingEvent === 'normal';

  // Authoritative unified rarity check when stagingEvent is not explicitly forcing normal/japan_star/blackball/purple
  const effectiveRarity: UnifiedRarity | null =
    tier === 'manager' || stagingEvent === 'manager'
      ? null
      : isExplicitBlackBall
      ? 'black'
      : isExplicitPurple
      ? 'purple'
      : isExplicitJapanStar
      ? 'star'
      : isExplicitNormal
      ? player && (player.rating >= 85 || player.isLegendary)
        ? 'star'
        : player?.category === 'YOUNG'
        ? 'young'
        : player && player.rating >= 78
        ? 'mid'
        : 'normal'
      : player
      ? resolvePlayerRarity(player, rarityOverride)
      : rarityOverride;

  const effectiveTier: DraftRevealTier =
    tier === 'manager' || stagingEvent === 'manager'
      ? 'manager'
      : isExplicitBlackBall
      ? 'supreme'
      : isExplicitPurple
      ? 'supreme'
      : isExplicitJapanStar
      ? 'high'
      : isExplicitNormal
      ? player && (player.rating >= 85 || player.isLegendary)
        ? 'high'
        : 'normal'
      : effectiveRarity
      ? rarityToRevealTier(effectiveRarity)
      : tier;

  // Keep latest callback in ref so re-renders NEVER reset or cancel active timers
  const onEndRef = useRef(onAnimationEnd);
  onEndRef.current = onAnimationEnd;
  const completedRef = useRef(false);

  const triggerComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onEndRef.current();
  }, []);

  useEffect(() => {
    completedRef.current = false;
    setPhase('initial');
    const timing = TIER_DURATIONS[effectiveTier];

    if (effectiveTier === 'supreme') {
      soundManager.playBlackBallAura();
    } else if (effectiveTier === 'ultra') {
      soundManager.playBlackBallAura();
    } else if (effectiveTier === 'high' || effectiveTier === 'manager') {
      soundManager.playSlotLever();
    } else {
      soundManager.playCardFlip();
    }

    const burstTimer = window.setTimeout(() => {
      setPhase('burst');
      if (effectiveTier === 'supreme') {
        soundManager.playGoldenLightning();
      } else if (effectiveTier === 'ultra') {
        soundManager.playLightningElectricBuzz();
      } else if (effectiveTier === 'high' || effectiveTier === 'manager') {
        soundManager.playThunderStrike();
      }
    }, timing.burstMs);

    const spinTimer = window.setTimeout(() => {
      setPhase('focus');
    }, timing.spinMs);

    const revealTimer = window.setTimeout(() => {
      setPhase('reveal');
      if (effectiveTier === 'supreme') {
        soundManager.playGoldenFanfare();
      } else if (effectiveTier === 'ultra' || effectiveTier === 'manager') {
        soundManager.playVictory();
      } else if (effectiveTier === 'high') {
        soundManager.playDraftAcquired();
      } else {
        soundManager.playCardFlip();
      }
    }, timing.revealMs);

    const endTimer = window.setTimeout(() => {
      triggerComplete();
    }, timing.endMs);

    return () => {
      window.clearTimeout(burstTimer);
      window.clearTimeout(spinTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(endTimer);
    };
  }, [effectiveTier, player?.playerId, manager?.id, triggerComplete]);

  const getLocalizedText = (ja?: string, en?: string, es?: string) => {
    if (language === 'ja') return ja || en || '';
    if (language === 'es') return es || en || '';
    return en || ja || '';
  };

  const isPurpleSpecial =
    isExplicitPurple ||
    (!isExplicitBlackBall &&
      !isExplicitNormal &&
      !isExplicitJapanStar &&
      (effectiveRarity === 'purple' || player?.specialType === 'purple' || player?.special_type === 'purple'));
  const isBlackBallLuxury =
    isExplicitBlackBall || (!isExplicitPurple && !isExplicitNormal && !isExplicitJapanStar && effectiveTier === 'ultra');
  const isSupreme = effectiveTier === 'supreme';
  const isUltra = effectiveTier === 'ultra';
  const isHigh = effectiveTier === 'high';
  const isManager = effectiveTier === 'manager';

  const playerName = player
    ? getLocalizedText(player.nameJa, player.nameEn, player.nameEs) || player.playerName
    : '';
  const ntInfo = player?.nationalTeamId ? getNationalTeamById(player.nationalTeamId) : undefined;
  const clubOrNationName = player
    ? ntInfo
      ? `${ntInfo.flag} ${getLocalizedNationalTeamName(ntInfo, lang)}`
      : getLocalizedText(player.clubNameJa, player.clubNameEn, player.clubNameEs) || player.clubName
    : '';
  const verifiedPositions = player ? getVerifiedPositionsForPlayer(player) : [];

  // Visual theme tokens per tier
  const badgeText = isBlackBallLuxury
    ? 'ULTRA RARE • BLACK BALL (1.8% • OVR 100+)'
    : isSupreme
    ? isPurpleSpecial
      ? 'PURPLE SPECIAL (3.0%) • ACTIVE SUPERSTARS'
      : 'SUPREME GOLDEN • ICONIC LEGEND'
    : isExplicitJapanStar
    ? 'SAMURAI BLUE • JAPAN NT STAR'
    : isHigh
    ? 'STAR PLAYER • HIGH RATING'
    : isManager
    ? candidateCount > 1
      ? 'MANAGER GACHA • 3 CANDIDATES DRAWN'
      : 'MANAGER APPOINTMENT • TACTICAL BOSS'
    : 'PLAYER SCOUTED • DRAFT CANDIDATE';

  const mainTitle = isBlackBallLuxury
    ? language === 'ja'
      ? '⚡ 超激レア・黒玉演出発動！ ⚡'
      : '⚡ ULTRA RARE BLACK BALL! ⚡'
    : isSupreme
    ? isPurpleSpecial
      ? language === 'ja'
        ? '🟣 紫演出発動！ PURPLE SPECIAL 🟣'
        : '🟣 PURPLE SPECIAL ACTIVATED! 🟣'
      : language === 'ja'
      ? '✨ ゴールデン・レジェンド降臨！ ✨'
      : '✨ SUPREME GOLDEN LEGEND! ✨'
    : isExplicitJapanStar
    ? language === 'ja'
      ? '🇯🇵 日本代表スター選手登場！ ★'
      : '🇯🇵 JAPAN NT STAR SCOUTED! ★'
    : isHigh
    ? language === 'ja'
      ? '★ スター選手出現！ ★'
      : '★ STAR CANDIDATE SPOTTED! ★'
    : isManager
    ? candidateCount > 1
      ? language === 'ja'
        ? '👔 監督ガチャ発動！候補3名選出！'
        : '👔 MANAGER GACHA! 3 CANDIDATES!'
      : language === 'ja'
      ? '👔 新監督就任発表！ 👔'
      : '👔 MANAGER APPOINTED! 👔'
    : language === 'ja'
    ? '⚽ 選手スカウト完了！'
    : '⚽ CANDIDATE SCOUTED!';

  return (
    <div
      id="special-staging-overlay"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden backdrop-blur-md ${
        isBlackBallLuxury
          ? 'bg-black/98'
          : isPurpleSpecial
          ? 'bg-[#120524]/95'
          : 'bg-slate-950/95'
      } ${
        (isBlackBallLuxury || isSupreme || isUltra) && phase === 'burst' ? 'animate-shake' : ''
      }`}
    >
      {/* 1. Fullscreen Flash Burst */}
      {phase === 'burst' && (
        <div
          className={`absolute inset-0 pointer-events-none animate-reveal-flash ${
            isBlackBallLuxury
              ? 'bg-gradient-to-b from-amber-200/70 via-white/60 to-black/80'
              : isSupreme
              ? isPurpleSpecial
                ? 'bg-fuchsia-400/50'
                : 'bg-amber-300/55'
              : isManager
              ? 'bg-cyan-300/35'
              : isExplicitJapanStar
              ? 'bg-sky-400/40'
              : isHigh
              ? 'bg-indigo-300/35'
              : 'bg-emerald-300/25'
          }`}
        />
      )}

      {/* 2. Radial Light Rays & Shockwave */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className={`w-[540px] h-[540px] sm:w-[840px] sm:h-[840px] rounded-full blur-3xl animate-radial-spin ${
            isBlackBallLuxury
              ? 'bg-gradient-to-tr from-zinc-900/90 via-amber-400/35 to-black/95'
              : isSupreme
              ? isPurpleSpecial
                ? 'bg-gradient-to-tr from-fuchsia-600/45 via-purple-500/35 to-indigo-600/45'
                : 'bg-gradient-to-tr from-amber-500/45 via-yellow-300/45 to-orange-500/35'
              : isManager
              ? 'bg-gradient-to-tr from-amber-500/30 via-cyan-500/25 to-emerald-500/30'
              : isExplicitJapanStar
              ? 'bg-gradient-to-tr from-sky-500/40 via-blue-500/35 to-indigo-600/40'
              : isHigh
              ? 'bg-gradient-to-tr from-violet-500/35 via-sky-500/30 to-indigo-600/35'
              : 'bg-gradient-to-tr from-emerald-500/25 via-cyan-500/20 to-slate-800/30'
          }`}
        />

        {phase !== 'initial' && (
          <>
            <div
              className={`absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full border-2 animate-shockwave ${
                isBlackBallLuxury
                  ? 'border-amber-300/90'
                  : isSupreme
                  ? isPurpleSpecial
                    ? 'border-fuchsia-400/70'
                    : 'border-amber-300/80'
                  : isManager
                  ? 'border-amber-400/60'
                  : isExplicitJapanStar
                  ? 'border-sky-400/70'
                  : isHigh
                  ? 'border-indigo-400/60'
                  : 'border-emerald-400/50'
              }`}
            />
            {isBlackBallLuxury && (
              <div className="absolute w-80 h-80 sm:w-[440px] sm:h-[440px] rounded-full border border-white/40 animate-ping" />
            )}
          </>
        )}
      </div>

      {/* 3. Kinetic Lightning / Spark Columns */}
      {(isBlackBallLuxury || isSupreme || isUltra || isHigh || isManager) && phase !== 'initial' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className={`absolute top-0 left-[18%] w-1 h-full bg-gradient-to-b to-transparent opacity-80 animate-pulse ${
              isBlackBallLuxury
                ? 'from-white via-amber-400'
                : isSupreme
                ? isPurpleSpecial
                  ? 'from-fuchsia-400 via-purple-400'
                  : 'from-yellow-200 via-amber-400'
                : isManager
                ? 'from-amber-300 via-cyan-400'
                : 'from-sky-300 via-indigo-400'
            }`}
          />
          <div
            className={`absolute top-0 right-[18%] w-1 h-full bg-gradient-to-b to-transparent opacity-80 animate-pulse ${
              isBlackBallLuxury
                ? 'from-amber-300 via-white'
                : isSupreme
                ? isPurpleSpecial
                  ? 'from-purple-300 via-fuchsia-500'
                  : 'from-amber-200 via-yellow-400'
                : isManager
                ? 'from-cyan-300 via-amber-400'
                : 'from-indigo-300 via-violet-400'
            }`}
          />
          {isBlackBallLuxury ? (
            <>
              <div className="absolute top-10 left-8 sm:left-16 text-amber-300 text-3xl animate-bounce">⚡</div>
              <div className="absolute top-14 right-8 sm:right-16 text-white text-3xl animate-pulse">⚫</div>
              <div className="absolute bottom-20 left-12 text-yellow-200 text-2xl animate-spin">✦</div>
              <div className="absolute bottom-24 right-12 text-amber-300 text-3xl animate-bounce">⚡</div>
            </>
          ) : (isSupreme || isUltra) ? (
            <>
              <div className="absolute top-12 left-8 sm:left-16 text-fuchsia-300 text-3xl animate-bounce">🟣</div>
              <div className="absolute top-16 right-8 sm:right-16 text-purple-300 text-3xl animate-pulse">✦</div>
              <div className="absolute bottom-20 left-12 text-fuchsia-200 text-2xl animate-spin">★</div>
              <div className="absolute bottom-24 right-12 text-purple-300 text-3xl animate-bounce">⚡</div>
            </>
          ) : null}
        </div>
      )}

      {/* 4. Central Staging Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-xl w-full">
        {/* Tier Pill */}
        <div className="mb-3 sm:mb-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 font-heading font-black text-[11px] sm:text-xs tracking-widest uppercase shadow-lg ${
              isBlackBallLuxury
                ? 'bg-black border-amber-300 text-amber-200 shadow-amber-400/50'
                : isSupreme
                ? isPurpleSpecial
                  ? 'bg-purple-950/90 border-fuchsia-400 text-fuchsia-200 shadow-fuchsia-500/50'
                  : 'bg-amber-950/80 border-amber-300 text-amber-200 shadow-amber-500/50'
                : isManager
                ? 'bg-slate-900/90 border-amber-400 text-amber-200 shadow-amber-500/40'
                : isExplicitJapanStar
                ? 'bg-sky-950/90 border-sky-400 text-sky-200 shadow-sky-500/40'
                : isHigh
                ? 'bg-indigo-950/90 border-indigo-400 text-indigo-200 shadow-indigo-500/40'
                : 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-emerald-500/30'
            }`}
          >
            {isBlackBallLuxury ? (
              <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
            ) : isSupreme ? (
              <Crown className="w-4 h-4 animate-pulse" />
            ) : isManager ? (
              <Briefcase className="w-4 h-4 animate-pulse" />
            ) : isHigh ? (
              <Star className="w-4 h-4 animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4 animate-pulse" />
            )}
            <span>{badgeText}</span>
          </div>
        </div>

        {/* Central Sphere / Crest Emblem */}
        <div className="relative w-32 h-32 sm:w-44 sm:h-44 mb-4 flex items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full blur-2xl opacity-90 animate-spin ${
              isBlackBallLuxury
                ? 'bg-gradient-to-tr from-black via-amber-400/80 to-zinc-800'
                : isSupreme
                ? isPurpleSpecial
                  ? 'bg-gradient-to-tr from-fuchsia-600 via-purple-400 to-indigo-600'
                  : 'bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-600'
                : isManager
                ? 'bg-gradient-to-tr from-amber-500 via-cyan-500 to-emerald-500'
                : isExplicitJapanStar
                ? 'bg-gradient-to-tr from-sky-500 via-blue-400 to-indigo-500'
                : isHigh
                ? 'bg-gradient-to-tr from-indigo-500 via-violet-400 to-sky-500'
                : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500'
            }`}
          />
          <div
            className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 flex flex-col items-center justify-center shadow-2xl transition-transform duration-300 ${
              phase === 'burst' ? 'scale-110' : 'scale-100'
            } ${
              isBlackBallLuxury
                ? 'bg-gradient-to-br from-black via-zinc-950 to-black border-amber-300 shadow-[0_0_45px_rgba(251,191,36,0.75)]'
                : isSupreme
                ? isPurpleSpecial
                  ? 'bg-gradient-to-br from-purple-950 via-fuchsia-900 to-indigo-950 border-fuchsia-300'
                  : 'bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-500 border-yellow-100'
                : isManager
                ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 border-amber-400'
                : isExplicitJapanStar
                ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-sky-950 border-sky-400'
                : isHigh
                ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 border-indigo-400'
                : 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border-emerald-400'
            }`}
          >
            {isManager && manager ? (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-300">
                <ManagerPortraitSvg manager={manager} />
              </div>
            ) : (
              <>
                <span className="text-4xl sm:text-5xl drop-shadow-[0_0_16px_rgba(255,255,255,0.85)]">
                  {isBlackBallLuxury
                    ? '⚫'
                    : isSupreme
                    ? isPurpleSpecial
                      ? '🟣'
                      : '👑'
                    : isExplicitJapanStar
                    ? '🇯🇵'
                    : isHigh
                    ? '⭐'
                    : '⚽'}
                </span>
                <span
                  className={`text-[10px] font-heading font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 ${
                    isBlackBallLuxury
                      ? 'bg-amber-300 text-black border border-white/60'
                      : isSupreme && !isPurpleSpecial
                      ? 'bg-yellow-100 text-slate-950'
                      : 'bg-slate-950/85 text-white border border-white/20'
                  }`}
                >
                  {isBlackBallLuxury
                    ? 'BLACK BALL'
                    : isSupreme
                    ? isPurpleSpecial
                      ? 'PURPLE'
                      : 'GOLDEN'
                    : isExplicitJapanStar
                    ? 'SAMURAI BLUE'
                    : isHigh
                    ? 'STAR'
                    : 'SCOUT'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          className={`font-heading font-black text-xl sm:text-3xl tracking-wide mb-2 ${
            isBlackBallLuxury
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]'
              : isSupreme
              ? isPurpleSpecial
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 via-purple-200 to-indigo-200'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-400'
              : isManager
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-cyan-200'
              : isExplicitJapanStar
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-blue-300'
              : isHigh
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-indigo-200 to-violet-200'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-cyan-200'
          }`}
        >
          {mainTitle}
        </h2>

        {/* Reveal Showcase Card */}
        {phase === 'reveal' && isManager && manager ? (
          <div className="w-full mt-2 p-4 rounded-2xl border border-amber-400/70 bg-slate-900/95 shadow-2xl shadow-amber-500/20 text-left animate-card-3d relative overflow-hidden">
            <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber-300/15 to-transparent pointer-events-none animate-beam-sweep" />
            <div className="flex items-center justify-between gap-3 border-b border-slate-700/70 pb-2.5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{manager.nationalityFlag}</span>
                <div>
                  <div className="text-[10px] font-mono font-black text-amber-300 uppercase tracking-widest flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    <span>{getLocalizedManagerNationality(manager, lang)}</span>
                  </div>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                    {getLocalizedManagerName(manager, lang)}
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase">MAX TACTIC</div>
                <div className="text-2xl font-mono font-black text-amber-300">{manager.maxAffinity}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-2.5">
              {manager.specialtyTactics.map((tac) => (
                <span
                  key={tac}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold"
                >
                  ★ {getLocalizedTacticName(tac, lang)} ({manager.tactics[tac]})
                </span>
              ))}
            </div>
          </div>
        ) : phase === 'reveal' && player ? (
          <div
            className={`w-full mt-2 p-3.5 sm:p-4 rounded-2xl border text-left animate-card-3d relative overflow-hidden ${
              isBlackBallLuxury
                ? 'bg-black/95 border-amber-300/90 shadow-2xl shadow-amber-400/30'
                : isSupreme
                ? isPurpleSpecial
                  ? 'bg-slate-900/95 border-fuchsia-400/80 shadow-xl shadow-fuchsia-500/30'
                  : 'bg-slate-900/95 border-amber-400/80 shadow-xl shadow-amber-500/25'
                : isExplicitJapanStar
                ? 'bg-slate-900/95 border-sky-400/80 shadow-xl shadow-sky-500/25'
                : isHigh
                ? 'bg-slate-900/95 border-indigo-400/70 shadow-xl shadow-indigo-500/20'
                : 'bg-slate-900/95 border-emerald-400/60 shadow-xl shadow-emerald-500/20'
            }`}
          >
            <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none animate-beam-sweep" />
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{player.nationalityFlag}</span>
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    {isExplicitJapanStar
                      ? lang === 'ja'
                        ? '日本代表スター選手確定枠'
                        : 'SAMURAI BLUE STAR'
                      : effectiveRarity
                      ? getRarityDisplayLabel(effectiveRarity, lang)
                      : player.category || 'PLAYER'}
                    {candidateCount > 1 ? ` • ${candidateCount} CANDIDATES READY` : ''}
                  </div>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-white">{playerName}</h3>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase">OVR</div>
                <div
                  className={`text-2xl font-mono font-black ${
                    isBlackBallLuxury
                      ? 'text-amber-300'
                      : isSupreme
                      ? isPurpleSpecial
                        ? 'text-fuchsia-300'
                        : 'text-amber-300'
                      : isExplicitJapanStar
                      ? 'text-sky-300'
                      : isHigh
                      ? 'text-indigo-300'
                      : 'text-emerald-300'
                  }`}
                >
                  {player.rating}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-200 pt-2 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                  {player.eraDecade ? getDecadeLabel(player.eraDecade, lang) : player.joiningYear} {clubOrNationName}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-black">
                  {player.subPosition || player.position}
                </span>
              </div>
              {verifiedPositions.length > 0 && (
                <div className="flex items-center gap-1">
                  {verifiedPositions.slice(0, 3).map((pos) => (
                    <span
                      key={pos}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700"
                    >
                      {pos}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md">
            {isBlackBallLuxury
              ? '全員 OVR 100+ スター選手確定！最高峰の超激レア黒玉演出！'
              : isSupreme
              ? isPurpleSpecial
                ? '最高峰の現役スーパースターが候補に降臨します！'
                : '伝説の黄金期スーパースターが候補に降臨します！'
              : isExplicitJapanStar
              ? '森保監督感謝チケット発動！現日本代表のスター日本人選手が登場！'
              : isManager
              ? candidateCount > 1
                ? '実在する名将3名のスカウト候補を抽選中！'
                : '新監督がクラブの指揮官として就任します！'
              : isHigh
              ? 'ハイレーティングの有力選手がスカウト網にヒット！'
              : 'スカウト候補をピックアップしています…'}
          </p>
        )}

        {/* Always-clickable SKIP Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              triggerComplete();
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-slate-100 text-xs font-heading font-black border border-slate-600 shadow-lg transition-all cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{t.skip} / {t.close}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Legacy-compatible BlackBallAnimation wrapper (used by RewardScoutModal & Special Test Bench)
 */
export const BlackBallAnimation: React.FC<BlackBallAnimationProps> = ({
  language = 'ja',
  type = 'black',
  player = null,
  rarityOverride = null,
  onAnimationEnd,
}) => {
  const effectiveRarity: UnifiedRarity = player
    ? resolvePlayerRarity(player, rarityOverride)
    : rarityOverride
    ? rarityOverride
    : type === 'gold'
    ? 'golden'
    : type;
  const mappedTier: DraftRevealTier = rarityToRevealTier(effectiveRarity);

  return (
    <DraftRevealOverlay
      language={language}
      tier={mappedTier}
      player={player}
      rarityOverride={effectiveRarity}
      onAnimationEnd={onAnimationEnd}
    />
  );
};
