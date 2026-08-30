import React, { useState, useMemo } from 'react';
import { DraftHistoryEntry, Language } from '../types';
import { TRANSLATIONS, getLocalizedPlayerName, getLocalizedClubName, getLocalizedNationality, getLocalizedPosition } from '../utils/translations';
import { searchDraftHistory } from '../utils/searchHistory';
import { soundManager } from '../utils/audio';
import { ALL_PLAYERS } from '../data/playerDatabase';
import { ALL_CLUBS } from '../data/clubs';
import { History, X, Search, Trash2, AlertTriangle, Shield, Trophy, Globe2 } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: DraftHistoryEntry[];
  language: Language;
  onClearHistory?: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  language,
  onClearHistory,
}) => {
  const t = TRANSLATIONS[language];
  const [filterMode, setFilterMode] = useState<'all' | 'europe' | 'j1'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter history with multilingual search
  const filteredHistory = useMemo(() => {
    // 1. Filter by mode
    const modeFiltered = history.filter((item) => {
      return filterMode === 'all' || item.mode === filterMode;
    });

    // 2. Filter by multi-language search (JA / EN / ES)
    return searchDraftHistory(modeFiltered, searchTerm, language);
  }, [history, filterMode, searchTerm, language]);

  if (!isOpen) return null;

  return (
    <div
      id="history-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none"
    >
      <div
        id="history-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg text-white tracking-wide">
                  {t.history}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30 font-mono">
                  {history.length} SAVED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-language search: 🇯🇵 日本語 • 🇬🇧 English • 🇪🇸 Español
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Clear History Button */}
            {onClearHistory && history.length > 0 && (
              <button
                id="btn-trigger-clear-history"
                onClick={() => {
                  soundManager.playButtonClick();
                  setShowClearConfirm(true);
                }}
                title={t.clearHistory}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all flex items-center gap-1.5 text-xs font-bold"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t.clearHistory}</span>
              </button>
            )}

            {/* Close Button */}
            <button
              id="close-history-btn"
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
              }}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clear Confirmation Banner */}
        {showClearConfirm && (
          <div className="p-4 bg-rose-950/90 border-b border-rose-500/50 space-y-2.5 animate-fadeIn">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{t.clearHistoryConfirmTitle}</span>
            </div>
            <p className="text-xs text-slate-300 whitespace-pre-line">
              {t.clearHistoryConfirm}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  if (onClearHistory) onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        )}

        {/* Filters & Multilingual Search */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/60 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Mode switch */}
            <div className="flex items-center gap-1 w-full sm:w-auto">
              {(['all', 'europe', 'j1'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    soundManager.playButtonClick();
                    setFilterMode(m);
                  }}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    filterMode === m
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m === 'all' ? 'ALL' : m === 'europe' ? '🇪🇺 EUROPE' : '🇯🇵 J1'}
                </button>
              ))}
            </div>

            {/* Multilingual Search box */}
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="history-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Result Info */}
          {searchTerm && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>
                Search results for &quot;<span className="text-emerald-400 font-bold">{searchTerm}</span>&quot;:
              </span>
              <span className="font-mono text-emerald-300 font-bold">
                {filteredHistory.length} matches
              </span>
            </div>
          )}
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <div className="text-3xl text-slate-600">📜</div>
              <div className="text-slate-400 text-xs sm:text-sm font-medium">
                {searchTerm ? 'No drafted players match your search query.' : t.historyEmpty}
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-xs text-emerald-400 font-bold underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredHistory.map((entry) => {
              // Lookup player & club in database for localized display
              const dbPlayer = ALL_PLAYERS.find((p) => p.playerId === entry.playerId || p.playerName === entry.playerName);
              const dbClub = ALL_CLUBS.find((c) => c.id === entry.clubId || c.name === entry.clubName);

              const displayName = dbPlayer
                ? getLocalizedPlayerName(dbPlayer, language)
                : (language === 'ja' && entry.nameJa ? entry.nameJa : (language === 'es' && entry.nameEs ? entry.nameEs : entry.playerName));

              const displayClub = dbClub
                ? getLocalizedClubName(dbClub, language)
                : (language === 'ja' && entry.clubNameJa ? entry.clubNameJa : (language === 'es' && entry.clubNameEs ? entry.clubNameEs : entry.clubName));

              const flag = entry.nationalityFlag || dbPlayer?.nationalityFlag || (entry.mode === 'j1' ? '🇯🇵' : '🌍');

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-emerald-500/40 transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    {/* Rating Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-heading font-black text-sm border shadow-md ${
                        entry.rating >= 90
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : entry.rating >= 85
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      }`}
                    >
                      <span className="leading-none">{entry.rating}</span>
                      <span className="text-[8px] font-sans font-bold text-slate-400 uppercase">
                        {entry.position}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-base">{flag}</span>
                        <span className="font-heading font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                          {displayName}
                        </span>
                        {displayName !== entry.playerName && (
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({entry.playerName})
                          </span>
                        )}
                        {(() => {
                          const cat = entry.category || dbPlayer?.category || (entry.isLegendary ? 'LEGEND' : entry.rating >= 85 ? 'STAR' : entry.rating >= 78 ? 'MID' : 'NORMAL');
                          switch (cat) {
                            case 'LEGEND':
                              return (
                                <span className="text-[9px] bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black px-1.5 py-0.5 rounded font-mono shadow-sm flex items-center gap-0.5">
                                  ⭐ LEGEND
                                </span>
                              );
                            case 'STAR':
                              return (
                                <span className="text-[9px] bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold px-1.5 py-0.5 rounded font-mono shadow-sm flex items-center gap-0.5">
                                  ✨ STAR
                                </span>
                              );
                            case 'YOUNG':
                              return (
                                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                                  🌱 YOUNG
                                </span>
                              );
                            case 'MID':
                              return (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                                  ⚔️ MID
                                </span>
                              );
                            case 'VETERAN':
                              return (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                                  🛡️ VET
                                </span>
                              );
                            default:
                              return null;
                          }
                        })()}
                        {entry.teamNumber && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold px-1.5 py-0.2 rounded">
                            TEAM {entry.teamNumber}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-emerald-400 font-semibold">{displayClub}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-300">{entry.joiningYear}</span>
                        <span>•</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {getLocalizedPosition(entry.position, language)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right pl-2 shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px] text-slate-500">
            * History is preserved independently from game resets.
          </span>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
