import React from 'react';
import { GameMode, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { X, Shield, Globe2, ChevronRight, Sparkles } from 'lucide-react';

interface ModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  language: Language;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
  language,
}) => {
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const handleModePick = (mode: GameMode) => {
    soundManager.playButtonClick();
    onSelectMode(mode);
    onClose();
  };

  return (
    <div
      id="mode-select-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-fadeIn"
    >
      <div
        id="mode-select-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-white tracking-wide">
                {t.selectMode}
              </h3>
              <p className="text-xs text-slate-400">Choose your football league universe</p>
            </div>
          </div>

          <button
            id="close-mode-modal-btn"
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: The 3 Selection Cards */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Active Players Option (New Worldwide Active Mode) */}
          <button
            id="select-mode-active-card"
            onClick={() => handleModePick('active')}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all group flex items-center justify-between relative overflow-hidden ${
              currentMode === 'active'
                ? 'bg-gradient-to-r from-amber-950/60 to-slate-900 border-amber-400 shadow-xl shadow-amber-950/50'
                : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-600/20 text-3xl flex items-center justify-center border border-amber-500/30 group-hover:scale-105 transition-transform shrink-0">
                🌍
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-lg sm:text-xl text-white tracking-wide group-hover:text-amber-300 transition-colors">
                    {t.modeActive}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-mono">
                    NEW 1.1.0
                  </span>
                  {currentMode === 'active' && (
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  {t.modeActiveDesc}
                </p>
                <div className="text-[11px] text-amber-400 font-semibold pt-1 flex items-center gap-1.5">
                  <span>⚡ Mbappé, Haaland, Vinícius, Bellingham, Rodri, Messi, CR7 & Worldwide</span>
                </div>
              </div>
            </div>

            <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </button>

          {/* European Clubs Option */}
          <button
            id="select-mode-europe-card"
            onClick={() => handleModePick('europe')}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all group flex items-center justify-between relative overflow-hidden ${
              currentMode === 'europe'
                ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900 border-emerald-400 shadow-xl shadow-emerald-950/50'
                : 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-3xl flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform shrink-0">
                🇪🇺
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-lg sm:text-xl text-white tracking-wide group-hover:text-emerald-300 transition-colors">
                    {t.modeEurope}
                  </span>
                  {currentMode === 'europe' && (
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  {t.modeEuropeDesc}
                </p>
                <div className="text-[11px] text-emerald-400 font-semibold pt-1 flex items-center gap-1.5">
                  <span>⚽ Real Madrid, Barça, Man City, Bayern, PSG, Liverpool & more</span>
                </div>
              </div>
            </div>

            <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </button>

          {/* J1 League Option */}
          <button
            id="select-mode-j1-card"
            onClick={() => handleModePick('j1')}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all group flex items-center justify-between relative overflow-hidden ${
              currentMode === 'j1'
                ? 'bg-gradient-to-r from-teal-950/60 to-slate-900 border-teal-400 shadow-xl shadow-teal-950/50'
                : 'bg-slate-950/80 border-slate-800 hover:border-teal-500/50 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-600/20 text-3xl flex items-center justify-center border border-teal-500/30 group-hover:scale-105 transition-transform shrink-0">
                🇯🇵
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-lg sm:text-xl text-white tracking-wide group-hover:text-teal-300 transition-colors">
                    {t.modeJ1}
                  </span>
                  {currentMode === 'j1' && (
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-teal-500 text-slate-950 font-mono">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                  {t.modeJ1Desc}
                </p>
                <div className="text-[11px] text-teal-400 font-semibold pt-1 flex items-center gap-1.5">
                  <span>🌸 Vissel Kobe, Kashima Antlers, Urawa Reds, Kawasaki Frontale, Marinos</span>
                </div>
              </div>
            </div>

            <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
          </button>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 text-right">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
