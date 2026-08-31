import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { CURRENT_VERSION, UPDATE_NOTES_HISTORY, UpdateNote } from '../data/versionConfig';
import { Sparkles, X, CheckCircle2, History, ChevronRight, FileText } from 'lucide-react';

interface UpdateNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const UpdateNotesModal: React.FC<UpdateNotesModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const getTitle = (note: UpdateNote) => {
    if (language === 'ja') return note.titleJa;
    if (language === 'es') return note.titleEs;
    return note.titleEn;
  };

  const getNotes = (note: UpdateNote) => {
    if (language === 'ja') return note.notesJa;
    if (language === 'es') return note.notesEs;
    return note.notesEn;
  };

  return (
    <div
      id="update-notes-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none overflow-y-auto"
    >
      <div
        id="update-notes-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh] animate-fadeIn"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg text-white tracking-wide">
                  UPDATE NOTES
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-black">
                  {CURRENT_VERSION}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'ja'
                  ? '最新バージョンの更新内容・変更履歴'
                  : language === 'es'
                  ? 'Notas y novedades de la versión'
                  : 'Latest release updates & changelog'}
              </p>
            </div>
          </div>

          <button
            id="close-update-notes-btn"
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          {UPDATE_NOTES_HISTORY.map((entry, idx) => (
            <div
              key={entry.version}
              className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 ${
                entry.isLatest
                  ? 'bg-slate-950/80 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-85'
              }`}
            >
              {/* Version Header Banner */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-emerald-300">
                    {entry.version}
                  </span>
                  {entry.isLatest && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black tracking-wider uppercase shadow-sm">
                      LATEST
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {entry.releaseDate}
                </span>
              </div>

              {/* Title */}
              <div className="text-sm font-bold text-white font-heading tracking-wide">
                {getTitle(entry)}
              </div>

              {/* Notes List */}
              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
                {getNotes(entry).map((point, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-2.5">
                    <CheckCircle2
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        entry.isLatest ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            {CURRENT_VERSION}
          </span>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs tracking-wider transition-colors shadow-md cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
