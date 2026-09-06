import React, { useState, useMemo } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { HelpCircle, X, Zap, Crown, Shield } from 'lucide-react';
import { getOver100Players } from '../data/playerDatabase';

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
  const [activeTab, setActiveTab] = useState<'rules' | 'legends'>('rules');

  const over100Players = useMemo(() => getOver100Players(), []);

  if (!isOpen) return null;

  return (
    <div
      id="how-to-play-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none"
    >
      <div
        id="how-to-play-modal"
        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1.5">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('rules');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{language === 'ja' ? '遊び方・基本ルール' : 'How To Play'}</span>
          </button>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('legends');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'legends'
                ? 'bg-amber-950/60 text-yellow-300 shadow-sm border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>
              {language === 'ja' ? `OVR 100+ 選手一覧 (${over100Players.length})` : `100+ PLAYERS (${over100Players.length})`}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5">
          {activeTab === 'rules' ? (
            <>
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
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/30">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span>{language === 'ja' ? 'OVR 100+ 登録選手データベース' : 'OVR 100+ Player Database'}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {language === 'ja'
                    ? 'ゲーム内データベースから総合値100以上の選手を自動抽出しています。ゴールデン演出・黒玉特別枠として獲得可能です。'
                    : 'Automatically extracted from the database for players with OVR 100+. Available through Golden Presentation & Black Ball spins.'}
                </p>
              </div>

              <div className="space-y-2">
                {over100Players.map((player) => {
                  const localizedName =
                    language === 'ja'
                      ? player.nameJa || player.playerName
                      : language === 'es'
                      ? player.nameEs || player.playerName
                      : player.nameEn || player.playerName;

                  return (
                    <div
                      key={player.playerId}
                      className="p-2.5 sm:p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Rating Badge */}
                        <div
                          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-heading font-black shrink-0 border shadow-md ${
                            player.rating >= 104
                              ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 border-yellow-200 text-slate-950 shadow-yellow-500/20'
                              : player.rating >= 102
                              ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300 text-slate-950'
                              : 'bg-slate-900 border-amber-400/80 text-yellow-300'
                          }`}
                        >
                          <span className="text-base leading-none">{player.rating}</span>
                          <span className="text-[8px] uppercase tracking-tighter opacity-80">OVR</span>
                        </div>

                        {/* Player Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-bold text-xs sm:text-sm text-white truncate">
                              {localizedName}
                            </span>
                            <span className="text-xs shrink-0">{player.nationalityFlag}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 font-bold font-mono">
                              {player.position}
                              {player.subPosition && player.subPosition !== player.position ? ` / ${player.subPosition}` : ''}
                            </span>
                            <span className="truncate">{player.clubName}</span>
                            <span className="font-mono text-slate-500 shrink-0">({player.joiningYear})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black border border-amber-400/60 text-amber-300 shadow-sm">
                          ⚫ LEGEND
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-right">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black tracking-wider transition-all cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
