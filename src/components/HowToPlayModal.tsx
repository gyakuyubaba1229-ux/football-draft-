import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { HelpCircle, X, CheckCircle, Zap } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  return (
    <div
      id="how-to-play-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none"
    >
      <div
        id="how-to-play-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-lg text-white tracking-wide">
              {t.howToPlay}
            </h3>
          </div>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5">
          {t.tutorialSteps.map((step, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1"
            >
              <h4 className="font-heading font-bold text-sm text-emerald-400 flex items-center gap-2">
                <span>{step.title}</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed pl-1">
                {step.description}
              </p>
            </div>
          ))}

          {/* Black ball callout */}
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-snug">{t.blackBallNotice}</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-right">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black tracking-wider transition-all"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
