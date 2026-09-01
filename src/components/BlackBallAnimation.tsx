import React, { useEffect, useState } from 'react';
import { Language, Player } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { BallonDorInfo, LegendPeakEraInfo, getBallonDorWinner, getLegendPeakEra } from '../data/legendaryEraDatabase';
import { Zap, Sparkles, Trophy, Star, Award, Crown, CheckCircle } from 'lucide-react';

export type SpecialAnimationType = 'blackball' | 'lightning-blackball' | 'golden';

interface BlackBallAnimationProps {
  language: Language;
  type?: SpecialAnimationType;
  player?: Player | null;
  ballonDorInfo?: BallonDorInfo | null;
  legendPeakInfo?: LegendPeakEraInfo | null;
  onAnimationEnd: () => void;
}

export const BlackBallAnimation: React.FC<BlackBallAnimationProps> = ({
  language,
  type = 'lightning-blackball',
  player = null,
  ballonDorInfo: initialBallonDor = null,
  legendPeakInfo: initialLegendPeak = null,
  onAnimationEnd,
}) => {
  const t = TRANSLATIONS[language];
  const isGolden = type === 'golden' || Boolean(initialBallonDor);

  // Auto-resolve Ballon d'Or info or Legend Peak info if not passed directly
  const ballonDorData = initialBallonDor || (player ? getBallonDorWinner(player) : null);
  const legendPeakData = initialLegendPeak || (player ? getLegendPeakEra(player) : null);

  const [phase, setPhase] = useState<'initial' | 'lightning-burst' | 'sphere-spin' | 'legend-reveal'>('initial');

  useEffect(() => {
    if (isGolden) {
      // 1. Initial golden aura
      soundManager.playBlackBallAura();

      // 2. Heavy Golden Lightning Strike & Cascading Thunder
      const lightningTimer = setTimeout(() => {
        setPhase('lightning-burst');
        soundManager.playGoldenLightning();
      }, 350);

      // 3. Golden Sphere Spin & Particle Shower
      const spinTimer = setTimeout(() => {
        setPhase('sphere-spin');
      }, 950);

      // 4. Ballon d'Or Supreme Reveal with Golden Fanfare
      const revealTimer = setTimeout(() => {
        setPhase('legend-reveal');
        soundManager.playGoldenFanfare();
      }, 1800);

      // 5. Completion
      const endTimer = setTimeout(() => {
        onAnimationEnd();
      }, 4200);

      return () => {
        clearTimeout(lightningTimer);
        clearTimeout(spinTimer);
        clearTimeout(revealTimer);
        clearTimeout(endTimer);
      };
    } else {
      // Black Ball Presentation
      soundManager.playBlackBallAura();

      if (type === 'lightning-blackball') {
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
      } else {
        // Standard Black Ball
        const spinTimer = setTimeout(() => {
          setPhase('sphere-spin');
        }, 400);

        const revealTimer = setTimeout(() => {
          setPhase('legend-reveal');
          soundManager.playVictory();
        }, 1300);

        const endTimer = setTimeout(() => {
          onAnimationEnd();
        }, 3200);

        return () => {
          clearTimeout(spinTimer);
          clearTimeout(revealTimer);
          clearTimeout(endTimer);
        };
      }
    }
  }, [isGolden, type, onAnimationEnd]);

  // Multilingual display helpers
  const getLocalizedText = (ja?: string, en?: string, es?: string) => {
    if (language === 'ja') return ja || en || '';
    if (language === 'es') return es || en || '';
    return en || ja || '';
  };

  return (
    <div
      id="special-staging-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 select-none overflow-hidden backdrop-blur-md"
    >
      {/* 1. Lightning Flash Screen Effects */}
      {phase === 'lightning-burst' && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity ${
            isGolden
              ? 'bg-amber-300/40 animate-ping'
              : 'bg-white/60 animate-ping'
          }`}
        />
      )}

      {/* 2. Golden / Black Ball Background Ray Emitter */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {isGolden ? (
          <>
            {/* Golden Solar Flare Radiance */}
            <div className="w-[500px] h-[500px] sm:w-[750px] sm:h-[750px] rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-400/30 to-amber-600/20 blur-3xl animate-spin" />
            <div className="absolute w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full bg-yellow-300/25 blur-2xl animate-pulse" />
          </>
        ) : (
          <>
            {/* Black Ball Dark Matter Aura */}
            <div className="w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] rounded-full bg-gradient-to-tr from-purple-900/30 via-slate-900/50 to-amber-900/20 blur-3xl animate-spin" />
            <div className="absolute w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] rounded-full bg-amber-500/15 blur-2xl animate-pulse" />
          </>
        )}
      </div>

      {/* 3. Golden Lightning Rain Bolts (When Golden is Active) */}
      {isGolden && phase !== 'initial' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Cascading Golden Lightning Streaks */}
          <div className="absolute top-0 left-1/6 w-1 h-full bg-gradient-to-b from-yellow-300 via-amber-400 to-transparent opacity-75 animate-pulse" />
          <div className="absolute top-0 left-2/6 w-1.5 h-full bg-gradient-to-b from-yellow-200 via-amber-300 to-transparent opacity-90 animate-ping" />
          <div className="absolute top-0 right-2/6 w-1.5 h-full bg-gradient-to-b from-yellow-100 via-yellow-400 to-transparent opacity-85 animate-pulse" />
          <div className="absolute top-0 right-1/6 w-1 h-full bg-gradient-to-b from-amber-300 via-yellow-300 to-transparent opacity-70 animate-ping" />
          
          {/* Floating Gold Stars & Sparkles */}
          <div className="absolute top-12 left-10 text-yellow-300 text-3xl animate-bounce">⚡</div>
          <div className="absolute top-20 right-12 text-amber-300 text-4xl animate-pulse">✨</div>
          <div className="absolute bottom-24 left-16 text-yellow-200 text-3xl animate-spin">★</div>
          <div className="absolute bottom-28 right-16 text-amber-400 text-4xl animate-bounce">⚡</div>
          <div className="absolute top-1/3 left-6 text-yellow-300 text-2xl animate-ping">⚡</div>
          <div className="absolute top-1/3 right-8 text-amber-300 text-3xl animate-ping">⚡</div>
        </div>
      )}

      {/* 4. Black Ball Lightning Bolts */}
      {!isGolden && type === 'lightning-blackball' && phase !== 'initial' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-12 text-amber-400 text-3xl animate-ping">⚡</div>
          <div className="absolute top-24 right-14 text-yellow-300 text-4xl animate-pulse">⚡</div>
          <div className="absolute bottom-28 left-20 text-amber-300 text-2xl animate-bounce">⚡</div>
          <div className="absolute bottom-20 right-20 text-yellow-400 text-3xl animate-ping">⚡</div>
        </div>
      )}

      {/* 5. Central Staging Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center p-4 sm:p-6 text-center max-w-xl w-full">
        
        {/* Rarity & Event Header Badge */}
        <div className="mb-4 animate-bounce">
          {isGolden ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 border-2 border-yellow-300 text-yellow-200 font-heading font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_25px_rgba(253,224,71,0.8)]">
              <Trophy className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
              <span>SUPREME GOLDEN BALLON D'OR</span>
              <Trophy className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-300 font-heading font-black text-xs sm:text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(251,191,36,0.6)]">
              <Zap className="w-4 h-4 fill-amber-300 animate-pulse" />
              <span>1% ULTRA RARE • BLACK BALL</span>
              <Zap className="w-4 h-4 fill-amber-300 animate-pulse" />
            </div>
          )}
        </div>

        {/* Floating Sphere Graphic */}
        <div className="relative w-40 h-40 sm:w-56 sm:h-56 mb-4 flex items-center justify-center">
          {isGolden ? (
            /* GOLDEN BALL SPHERE */
            <div className="relative flex items-center justify-center">
              {/* Outer Golden Corona */}
              <div className="absolute inset-0 w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-400 animate-spin blur-2xl opacity-90 shadow-[0_0_80px_rgba(253,224,71,1)]" />
              
              {/* Golden Trophy Sphere */}
              <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 border-4 border-yellow-100 shadow-[inset_0_0_30px_rgba(255,255,255,0.9),0_0_50px_rgba(250,204,21,0.9)] flex flex-col items-center justify-center transform transition-transform animate-pulse">
                <span className="text-5xl sm:text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,1)] animate-bounce">
                  🏆
                </span>
                <span className="text-[10px] sm:text-xs font-heading font-black text-slate-950 uppercase tracking-widest bg-yellow-200/90 px-2 py-0.5 rounded-full mt-1 border border-yellow-400">
                  BALLON D'OR
                </span>
              </div>
            </div>
          ) : (
            /* BLACK BALL SPHERE */
            <div className="relative flex items-center justify-center">
              {/* Outer Dark Aura */}
              <div className="absolute inset-0 w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-purple-900/80 via-amber-600/50 to-slate-900 animate-spin blur-2xl opacity-90" />

              {/* Central Black Sphere */}
              <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-slate-900 via-black to-slate-950 border-4 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.8)] flex items-center justify-center transform transition-transform animate-pulse">
                <span className="text-5xl sm:text-7xl drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] animate-spin">
                  ⚽
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Event Main Title */}
        <h2
          className={`font-heading font-black text-xl sm:text-3xl tracking-wide mb-2 ${
            isGolden
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-yellow-300 to-amber-400 drop-shadow-[0_0_20px_rgba(253,224,71,0.8)]'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]'
          }`}
        >
          {isGolden ? t.goldenBallonDorTriggered : t.blackBallTriggered}
        </h2>

        {/* Context Description or Player Historical Peak Card */}
        {phase === 'legend-reveal' && (ballonDorData || legendPeakData) ? (
          /* REVEALED HISTORICAL DATA CARD */
          <div
            className={`w-full mt-2 p-3.5 sm:p-4 rounded-2xl border text-left transition-all animate-fade-in ${
              isGolden
                ? 'bg-slate-900/90 border-yellow-400/80 shadow-2xl shadow-yellow-500/30'
                : 'bg-slate-900/90 border-amber-500/60 shadow-xl shadow-amber-500/20'
            }`}
          >
            {isGolden && ballonDorData ? (
              /* BALLON D'OR WINNER SHOWCASE */
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-yellow-500/30 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">{ballonDorData.nationalityFlag}</span>
                    <div>
                      <div className="text-xs font-mono font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5 text-yellow-400" />
                        <span>
                          {ballonDorData.totalWins > 1
                            ? `${ballonDorData.totalWins}x BALLON D'OR WINNER`
                            : 'BALLON D\'OR WINNER'}
                        </span>
                      </div>
                      <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                        {getLocalizedText(ballonDorData.nameJa, ballonDorData.nameEn, ballonDorData.nameEs)}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">AWARD YEARS</div>
                    <div className="text-xs sm:text-sm font-mono font-black text-yellow-300">
                      {ballonDorData.winningYears.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Subtitle & Club */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <span className="px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-[10px] font-mono">
                    {getLocalizedText(ballonDorData.clubAtWinJa, ballonDorData.clubAtWinEn, ballonDorData.clubAtWinEs)}
                  </span>
                  <span className="text-[11px] text-yellow-200/90 font-medium">
                    {getLocalizedText(ballonDorData.goldenSubtitleJa, ballonDorData.goldenSubtitleEn, ballonDorData.goldenSubtitleEs)}
                  </span>
                </div>

                {/* Iconic Real Historical Feat */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-yellow-500/20">
                  <span className="font-bold text-yellow-400 mr-1">✦ </span>
                  {getLocalizedText(ballonDorData.iconicFeatJa, ballonDorData.iconicFeatEn, ballonDorData.iconicFeatEs)}
                </p>
              </div>
            ) : legendPeakData ? (
              /* LEGEND ICONIC PEAK ERA SHOWCASE */
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl sm:text-2xl">{legendPeakData.nationalityFlag}</span>
                    <div>
                      <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>{legendPeakData.seasonLabel}</span>
                      </div>
                      <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                        {getLocalizedText(legendPeakData.nameJa, legendPeakData.nameEn, legendPeakData.nameEs)}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">CLUB</div>
                    <div className="text-xs font-bold text-amber-300">
                      {getLocalizedText(legendPeakData.clubJa, legendPeakData.clubEn, legendPeakData.clubEs)}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-bold text-amber-200">
                  {getLocalizedText(legendPeakData.eraTitleJa, legendPeakData.eraTitleEn, legendPeakData.eraTitleEs)}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-amber-500/20">
                  <span className="font-bold text-amber-400 mr-1">⚡ </span>
                  {getLocalizedText(legendPeakData.eraDescriptionJa, legendPeakData.eraDescriptionEn, legendPeakData.eraDescriptionEs)}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-200 font-medium max-w-md">
            {isGolden ? t.goldenBallonDorDesc : t.blackBallDesc}
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
