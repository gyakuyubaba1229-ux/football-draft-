import React, { useEffect, useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { Zap, Sparkles } from 'lucide-react';

interface BlackBallAnimationProps {
  language: Language;
  isLightningGuaranteed?: boolean;
  onAnimationEnd: () => void;
}

export const BlackBallAnimation: React.FC<BlackBallAnimationProps> = ({
  language,
  isLightningGuaranteed = false,
  onAnimationEnd,
}) => {
  const t = TRANSLATIONS[language];
  const [phase, setPhase] = useState<'initial' | 'lightning' | 'blackball-spin' | 'reveal'>('initial');

  useEffect(() => {
    soundManager.playBlackBallAura();

    if (isLightningGuaranteed) {
      // 1. Lightning strike occurs after 400ms with "ビリリリリリ……"
      const lightningTimer = setTimeout(() => {
        setPhase('lightning');
        soundManager.playLightningElectricBuzz();
      }, 450);

      // 2. Black ball swarm spin
      const spinTimer = setTimeout(() => {
        setPhase('blackball-spin');
      }, 1050);

      // 3. Reveal
      const revealTimer = setTimeout(() => {
        setPhase('reveal');
      }, 1900);

      const endTimer = setTimeout(() => {
        onAnimationEnd();
      }, 2600);

      return () => {
        clearTimeout(lightningTimer);
        clearTimeout(spinTimer);
        clearTimeout(revealTimer);
        clearTimeout(endTimer);
      };
    } else {
      // Normal Black Ball: sudden transformation without lightning
      const spinTimer = setTimeout(() => {
        setPhase('blackball-spin');
      }, 500);

      const revealTimer = setTimeout(() => {
        setPhase('reveal');
      }, 1600);

      const endTimer = setTimeout(() => {
        onAnimationEnd();
      }, 2400);

      return () => {
        clearTimeout(spinTimer);
        clearTimeout(revealTimer);
        clearTimeout(endTimer);
      };
    }
  }, [isLightningGuaranteed, onAnimationEnd]);

  return (
    <div
      id="black-ball-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 select-none overflow-hidden"
    >
      {/* Lightning Flash Background */}
      {phase === 'lightning' && (
        <div className="absolute inset-0 bg-white animate-ping pointer-events-none opacity-80" />
      )}

      {/* Screen Animation Container */}
      <div className="relative flex flex-col items-center justify-center p-6 text-center">
        {/* Floating Black Ball Spheres */}
        <div className="relative w-44 h-44 sm:w-60 sm:h-60 mb-6 flex items-center justify-center">
          {/* Outer dark aura glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-900/80 via-amber-600/50 to-slate-900 animate-spin blur-3xl opacity-90" />

          {/* Central Black Sphere */}
          <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-slate-900 via-black to-slate-950 border-4 border-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.8)] flex items-center justify-center transform transition-transform animate-pulse">
            <span className="text-6xl sm:text-8xl drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] animate-spin">
              ⚽
            </span>
          </div>

          {/* Floating mini lightning bolts for confirmed sequence */}
          {isLightningGuaranteed && phase !== 'initial' && (
            <div className="absolute inset-0 pointer-events-none">
              <Zap className="absolute top-1 left-3 w-8 h-8 text-amber-300 animate-ping" />
              <Zap className="absolute bottom-2 right-4 w-10 h-10 text-yellow-400 animate-pulse" />
              <div className="absolute top-1/2 left-0 text-amber-300 font-mono text-2xl font-black animate-bounce">⚡</div>
              <div className="absolute top-1/3 right-1 text-yellow-300 font-mono text-2xl font-black animate-bounce">⚡</div>
            </div>
          )}
        </div>

        {/* Text Banners */}
        <div className="space-y-2 max-w-md">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-heading font-black text-xs sm:text-sm tracking-widest uppercase animate-pulse">
            <Zap className="w-4 h-4 fill-amber-300" />
            <span>0.001% ULTRA RARE EVENT</span>
            <Zap className="w-4 h-4 fill-amber-300" />
          </div>

          <h2 className="font-heading font-black text-2xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 tracking-wider">
            {t.blackBallTriggered}
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 font-medium">
            {t.blackBallDesc}
          </p>
        </div>
      </div>
    </div>
  );
};

