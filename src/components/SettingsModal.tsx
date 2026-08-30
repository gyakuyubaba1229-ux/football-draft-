import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { DEFAULT_X_CHAR_LIMIT } from '../utils/shareUtils';
import { Settings, X, Volume2, VolumeX, RotateCcw, Globe, AlertTriangle, Sliders } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetGame: () => void;
  xCharLimit: number;
  onXCharLimitChange: (limit: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  soundEnabled,
  onToggleSound,
  onResetGame,
  xCharLimit,
  onXCharLimitChange,
}) => {
  const t = TRANSLATIONS[language];
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none overflow-y-auto"
    >
      <div
        id="settings-modal"
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-lg text-white tracking-wide">
              {t.settings}
            </h3>
          </div>

          <button
            id="close-settings-btn"
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Language Selection */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.language}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'ja' as Language, label: '🇯🇵 日本語' },
                { code: 'en' as Language, label: '🇬🇧 English' },
                { code: 'es' as Language, label: '🇪🇸 Español' },
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    soundManager.playButtonClick();
                    onLanguageChange(item.code);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    language === item.code
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2.5">
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <div className="text-sm font-bold text-white">{t.soundSfx}</div>
                <div className="text-[11px] text-slate-400">Web Audio Arcade Sounds</div>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playButtonClick();
                onToggleSound();
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                soundEnabled ? 'bg-emerald-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* X Share Character Limit Settings */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-black text-white font-mono font-black text-xs flex items-center justify-center border border-slate-700">
                  𝕏
                </div>
                <span className="text-xs font-bold text-slate-200">
                  {t.xCharLimitSetting}
                </span>
              </div>
              <span className="font-mono font-black text-xs text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {xCharLimit} chars
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t.xCharLimitSettingDesc}
            </p>

            {/* Quick Limit Presets */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { value: 140, label: '140 (Half)' },
                { value: DEFAULT_X_CHAR_LIMIT, label: '280 (Free Plan)' },
                { value: 500, label: '500 (Premium)' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    soundManager.playButtonClick();
                    onXCharLimitChange(opt.value);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors ${
                    xCharLimit === opt.value
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom slider input */}
            <div className="pt-2 space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>100 chars</span>
                <span>Custom: {xCharLimit}</span>
                <span>1000 chars</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="10"
                value={xCharLimit}
                onChange={(e) => onXCharLimitChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Reset Current Game Button */}
          <div className="pt-2 border-t border-slate-800">
            {!showConfirmReset ? (
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  setShowConfirmReset(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.resetGame}</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{t.resetConfirmTitle}</span>
                </div>
                <p className="text-[11px] text-slate-300">{t.resetConfirmDesc}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playButtonClick();
                      onResetGame();
                      setShowConfirmReset(false);
                      onClose();
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-950/50"
                  >
                    {t.confirm}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-right">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
