import React, { useEffect, useState } from 'react';
import { Language, Player } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { getVerifiedPositionsForPlayer } from '../utils/positionEngine';
import { Zap, Sparkles, Star, Award, Crown } from 'lucide-react';

export type SpecialAnimationType = 'black' | 'gold';

interface BlackBallAnimationProps {
  language: Language;
  type?: SpecialAnimationType;
  player?: Player | null;
  onAnimationEnd: () => void;
}

export const BlackBallAnimation: React.FC<BlackBallAnimationProps> = ({
  language,
  type = 'black',
  player = null,
  onAnimationEnd,
}) => {
  const t = TRANSLATIONS[language];
  const isGold = type === 'gold';
  const isBlack = !isGold;

  const [phase, setPhase] = useState<'initial' | 'lightning-burst' | 'sphere-spin' | 'legend-reveal'>('initial');

  useEffect(() => {
    if (isGold) {
      soundManager.playBlackBallAura();
      const lightningTimer = setTimeout(() => {
        setPhase('lightning-burst');
        soundManager.playGoldenLightning();
      }, 350);

      const spinTimer = setTimeout(() => {
        setPhase('sphere-spin');
      }, 900);

      const revealTimer = setTimeout(() => {
        setPhase('legend-reveal');
        soundManager.playGoldenFanfare();
      }, 1700);

      const endTimer = setTimeout(() => {
        onAnimationEnd();
      }, 3800);

      return () => {
        clearTimeout(lightningTimer);
        clearTimeout(spinTimer);
        clearTimeout(revealTimer);
        clearTimeout(endTimer);
      };
    } else {
      // Black Ball Presentation
      soundManager.playBlackBallAura();
      const lightningTimer = setTimeout(() => {
        setPhase('lightning-burst');
        soundManager.playLightningElectricBuzz();
      }, 400);

      const spinTimer = setTimeout(() => {
        setPhase('sphere-spin');
      }, 1000);

      const revealTimer = setTimeout(() => {
        setPhase('legend-reveal');
        soundManager.playVictory();
      }, 1800);

      const endTimer = setTimeout(() => {
        onAnimationEnd();
      }, 3800);

      return () => {
        clearTimeout(lightningTimer);
        clearTimeout(spinTimer);
        clearTimeout(revealTimer);
        clearTimeout(endTimer);
      };
    }
  }, [isGold, onAnimationEnd]);

  // Multilingual display helpers
  const getLocalizedText = (ja?: string, en?: string, es?: string) => {
    if (language === 'ja') return ja || en || '';
    if (language === 'es') return es || en || '';
    return en || ja || '';
  };

  const playerName = player
    ? getLocalizedText(player.nameJa, player.nameEn, player.nameEs) || player.playerName
    : '';

  const clubName = player
    ? getLocalizedText(player.clubNameJa, player.clubNameEn, player.clubNameEs) || player.clubName
    : '';

  const verifiedPositions = player ? getVerifiedPositionsForPlayer(player) : [];

  return (
    <div
      id="special-staging-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 select-none overflow-hidden backdrop-blur-md"
    >
      {/* 1. Lightning Flash Screen Effects */}
      {phase === 'lightning-burst' && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity ${
            isGold ? 'bg-yellow-300/40 animate-ping' : 'bg-purple-300/40 animate-ping'
          }`}
        />
      )}

      {/* 2. Ambient Ray Emitters */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {isGold ? (
          <>
            <div className="w-[500px] h-[500px] sm:w-[750px] sm:h-[750px] rounded-full bg-gradient-to-tr from-amber-500/30 via-yellow-400/40 to-amber-600/30 blur-3xl animate-spin" />
            <div className="absolute w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full bg-yellow-300/30 blur-2xl animate-pulse" />
          </>
        ) : (
          <>
            <div className="w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] rounded-full bg-gradient-to-tr from-purple-900/40 via-slate-900/60 to-indigo-900/30 blur-3xl animate-spin" />
            <div className="absolute w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full bg-purple-500/20 blur-2xl animate-pulse" />
          </>
        )}
      </div>

      {/* 3. Floating Lightning & Sparks */}
      {isGold && phase !== 'initial' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/6 w-1 h-full bg-gradient-to-b from-yellow-300 via-amber-400 to-transparent opacity-75 animate-pulse" />
          <div className="absolute top-0 left-2/6 w-1.5 h-full bg-gradient-to-b from-yellow-200 via-amber-300 to-transparent opacity-90 animate-ping" />
          <div className="absolute top-0 right-2/6 w-1.5 h-full bg-gradient-to-b from-yellow-100 via-yellow-400 to-transparent opacity-85 animate-pulse" />
          <div className="absolute top-0 right-1/6 w-1 h-full bg-gradient-to-b from-amber-300 via-yellow-300 to-transparent opacity-70 animate-ping" />
          
          <div className="absolute top-12 left-10 text-yellow-300 text-3xl animate-bounce">⚡</div>
          <div className="absolute top-20 right-12 text-amber-300 text-4xl animate-pulse">✨</div>
          <div className="absolute bottom-24 left-16 text-yellow-200 text-3xl animate-spin">★</div>
          <div className="absolute bottom-28 right-16 text-amber-400 text-4xl animate-bounce">⚡</div>
        </div>
      )}

      {isBlack && phase !== 'initial' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-12 text-purple-400 text-3xl animate-ping">⚡</div>
          <div className="absolute top-24 right-14 text-indigo-300 text-4xl animate-pulse">⚡</div>
          <div className="absolute bottom-28 left-20 text-purple-400 text-2xl animate-bounce">⚡</div>
          <div className="absolute bottom-20 right-20 text-slate-300 text-3xl animate-ping">⚡</div>
        </div>
      )}

      {/* 4. Central Staging Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-xl w-full">
        
        {/* Rarity & Event Header Badge */}
        <div className="mb-4 animate-bounce">
          {isGold ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/30 via-amber-400/40 to-yellow-500/30 border-2 border-amber-300 text-amber-200 font-heading font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(251,191,36,0.7)]">
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
              <span>1.8% SPECIAL LEGEND • GOLDEN</span>
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border-2 border-purple-500/60 text-purple-300 font-heading font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(168,85,247,0.6)]">
              <Zap className="w-4 h-4 fill-purple-300 animate-pulse" />
              <span>1.8% ULTRA RARE • BLACK BALL</span>
              <Zap className="w-4 h-4 fill-purple-300 animate-pulse" />
            </div>
          )}
        </div>

        {/* Floating Sphere Graphic */}
        <div className="relative w-40 h-40 sm:w-56 sm:h-56 mb-4 flex items-center justify-center">
          {isGold ? (
            /* GOLD BALL SPHERE */
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-600 animate-spin blur-2xl opacity-90 shadow-[0_0_60px_rgba(234,179,8,0.9)]" />
              <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-500 border-4 border-yellow-200 shadow-[inset_0_0_25px_rgba(255,255,255,0.8),0_0_40px_rgba(234,179,8,0.8)] flex flex-col items-center justify-center transform transition-transform animate-pulse">
                <span className="text-5xl sm:text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,1)] animate-spin">
                  ✨
                </span>
                <span className="text-[10px] sm:text-xs font-heading font-black text-slate-950 uppercase tracking-widest bg-yellow-100 px-2 py-0.5 rounded-full mt-1 border border-yellow-300">
                  GOLDEN
                </span>
              </div>
            </div>
          ) : (
            /* BLACK BALL SPHERE */
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-purple-950 via-slate-950 to-purple-900 animate-spin blur-2xl opacity-90 shadow-[0_0_50px_rgba(168,85,247,0.7)]" />
              <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-slate-950 via-black to-purple-950 border-4 border-purple-400 shadow-[0_0_50px_rgba(168,85,247,0.8)] flex flex-col items-center justify-center transform transition-transform animate-pulse">
                <span className="text-5xl sm:text-7xl drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] animate-spin">
                  ⚽
                </span>
                <span className="text-[10px] sm:text-xs font-heading font-black text-white uppercase tracking-widest bg-purple-950/90 px-2 py-0.5 rounded-full mt-1 border border-purple-400">
                  BLACK BALL
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Event Main Title */}
        <h2
          className={`font-heading font-black text-xl sm:text-3xl tracking-wide mb-2 ${
            isGold
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-300 to-indigo-200 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]'
          }`}
        >
          {isGold ? '✨ ゴールデン演出発動！ ✨' : '⚡ 黒玉演出発動！ ⚡'}
        </h2>

        {/* Real Player Showcase Card during Reveal */}
        {phase === 'legend-reveal' && player ? (
          <div
            className={`w-full mt-2 p-3.5 sm:p-4 rounded-2xl border text-left transition-all animate-fade-in ${
              isGold
                ? 'bg-slate-900/90 border-amber-400/80 shadow-xl shadow-amber-500/25'
                : 'bg-slate-900/90 border-purple-500/60 shadow-xl shadow-purple-500/20'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">{player.nationalityFlag}</span>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 text-amber-300">
                      {isGold ? <Sparkles className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5 text-purple-400" />}
                      <span>{isGold ? 'GOLDEN TARGET PLAYER' : 'BLACK BALL SUPERSTAR'}</span>
                    </div>
                    <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                      {playerName}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">OVR RATING</div>
                  <div className={`text-xl sm:text-2xl font-mono font-black ${isGold ? 'text-amber-300' : 'text-purple-300'}`}>
                    {player.rating}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-200 pt-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-mono">
                    {player.joiningYear} {clubName}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-black">
                    {player.subPosition || player.position}
                  </span>
                </div>
                {player.height && (
                  <span className="text-slate-400 text-[11px] font-mono">
                    {player.height} cm
                  </span>
                )}
              </div>

              {verifiedPositions.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-mono text-slate-400">適正:</span>
                  {verifiedPositions.map((pos) => (
                    <span
                      key={pos}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[10px] border border-slate-700"
                    >
                      {pos}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-md">
            {isGold
              ? '【確率1.8%】選ばれし伝説の選手が登場！特別なゴールデン選手が降臨します。'
              : '【確率1.8%】超激レア黒玉が出現！最高峰のレジェンド・スーパースターが候補に加わります。'}
          </p>
        )}

        {/* Skip button for fast preview */}
        <div className="mt-4">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onAnimationEnd();
            }}
            className="px-4 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            {t.close} / SKIP
          </button>
        </div>
      </div>
    </div>
  );
};
