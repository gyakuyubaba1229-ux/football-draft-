import React from 'react';
import { Language, UserTeam } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { Trophy, Share2, Plus, Eye, Sparkles, X } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: UserTeam;
  language: Language;
  onViewTeam: () => void;
  onCreateNewTeam: () => void;
  onShareTeam?: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  team,
  language,
  onViewTeam,
  onCreateNewTeam,
  onShareTeam,
}) => {
  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const avgRating =
    team.players.length > 0
      ? Math.round(team.players.reduce((acc, p) => acc + p.rating, 0) / team.players.length)
      : 0;

  return (
    <div
      id="celebration-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn"
    >
      <div
        id="celebration-modal"
        className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-500/20 text-center space-y-5 relative overflow-hidden"
      >
        {/* Decorative sparkles glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Trophy Icon */}
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-0.5 mx-auto shadow-2xl shadow-amber-500/40 flex items-center justify-center animate-bounce">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{team.name || `TEAM ${team.teamNumber}`} COMPLETED (11/11)</span>
          </div>

          <h2 className="font-heading font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300 tracking-wide">
            {t.teamCompletedBanner}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed px-2">
            {t.teamCompletedBannerDesc}
          </p>
        </div>

        {/* Summary Stat Box */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">{t.avgRating}</div>
            <div className="font-heading font-black text-xl text-amber-400">{avgRating}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">{t.formation}</div>
            <div className="font-heading font-black text-xl text-emerald-400">{team.formation}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* 1. SHARE TEAM BUTTON (SNS) */}
          {onShareTeam && (
            <button
              id="btn-celebration-share-team"
              onClick={() => {
                soundManager.playButtonClick();
                onShareTeam();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-black text-sm tracking-wider shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Share2 className="w-4 h-4 stroke-[3]" />
              <span>{t.shareTeam} (SNS共有)</span>
            </button>
          )}

          {/* 2. Create New Team (Next Squad) */}
          <button
            id="btn-celebration-create-new-team"
            onClick={() => {
              soundManager.playButtonClick();
              onCreateNewTeam();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{t.createNewTeam} (TEAM {team.teamNumber + 1})</span>
          </button>

          {/* 3. View Team on Tactical Pitch */}
          <button
            id="btn-celebration-view-pitch"
            onClick={() => {
              soundManager.playButtonClick();
              onViewTeam();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t.viewTeam}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
