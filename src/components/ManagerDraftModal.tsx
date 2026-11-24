import React from 'react';
import { Manager, Language } from '../types';
import { ManagerCard } from './ManagerCard';
import { soundManager } from '../utils/audio';
import { Briefcase, Lock, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface ManagerDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  teamName: string;
  existingManager?: Manager | null;
  managerDrafted?: boolean;
  pendingCandidates?: Manager[];
  isTeamLocked?: boolean;
  onStartManagerGacha?: () => void;
  onDraftManager: (manager: Manager) => void;
}

export const ManagerDraftModal: React.FC<ManagerDraftModalProps> = ({
  isOpen,
  onClose,
  language,
  teamName,
  existingManager,
  managerDrafted = false,
  pendingCandidates = [],
  isTeamLocked = false,
  onStartManagerGacha,
  onDraftManager,
}) => {
  const alreadyDrafted = Boolean(managerDrafted || existingManager);
  const hasPendingCandidates = pendingCandidates && pendingCandidates.length > 0;

  if (!isOpen) return null;

  return (
    <div
      id="manager-draft-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none"
    >
      <div
        id="manager-draft-modal"
        className="w-full max-w-4xl bg-slate-900 border-2 border-amber-400/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-black text-lg text-white">
                  {language === 'ja' ? '監督ドラフト (MANAGER GACHA)' : 'MANAGER DRAFT'}
                </h3>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {teamName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ja'
                  ? '1ゲーム1回限定ガチャ・登場した3名の実在名将から1名を選択'
                  : '1 Gacha per team — select 1 of 3 real legendary & active managers'}
              </p>
            </div>
          </div>

          <button
            id="close-manager-draft-btn"
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {alreadyDrafted && existingManager ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 text-emerald-300 text-xs sm:text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    {language === 'ja'
                      ? 'このゲーム（チーム）ではすでに監督を獲得済みです。新しいチームを作成すると再び監督ドラフトが可能になります。'
                      : 'Manager already drafted for this team. Create a new team to draft another manager.'}
                  </span>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-black">
                  <Lock className="w-3 h-3" />
                  <span>1/1 DRAFTED</span>
                </span>
              </div>

              <div className="max-w-md mx-auto">
                <ManagerCard manager={existingManager} language={language} />
              </div>
            </div>
          ) : isTeamLocked ? (
            <div className="p-6 text-center rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2">
              <Lock className="w-8 h-8 text-amber-400 mx-auto" />
              <div className="font-bold text-white text-sm">
                {language === 'ja'
                  ? 'このチームはロック中のため監督を変更できません。'
                  : 'This team is locked and cannot draft a manager.'}
              </div>
            </div>
          ) : !hasPendingCandidates ? (
            <div className="space-y-5 text-center py-4">
              <div className="max-w-md mx-auto p-6 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-400/50 shadow-2xl space-y-4">
                <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-300">
                  {language === 'ja'
                    ? '👔 1チーム1回限定・監督ガチャ'
                    : 'MANAGER GACHA (ONCE PER TEAM)'}
                </div>

                <div className="py-5 px-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="text-2xl sm:text-3xl font-heading font-black text-white">
                    {language === 'ja' ? '名将候補3名を抽選！' : 'Draw 3 Manager Candidates'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {language === 'ja'
                      ? 'クロップ、グアルディオラ、モウリーニョ、アンチェロッティ、森保一など実在の名将20名を収録'
                      : 'Includes Klopp, Guardiola, Mourinho, Ancelotti, Moriyasu & 15 more'}
                  </div>
                </div>

                <button
                  id="btn-spin-manager-draft"
                  type="button"
                  onClick={() => {
                    soundManager.playButtonClick();
                    onClose();
                    if (onStartManagerGacha) onStartManagerGacha();
                  }}
                  className="w-full py-3.5 px-5 rounded-2xl font-heading font-black text-sm sm:text-base tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-slate-950 active:scale-95"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {language === 'ja'
                      ? '👔 監督ガチャを回す（1回限定）'
                      : '👔 SPIN MANAGER GACHA'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 bg-amber-950/30 border border-amber-400/30 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-heading font-black text-sm sm:text-base">
                    👔 {language === 'ja' ? '監督ガチャ結果：候補3名から1名を選択' : 'MANAGER CANDIDATES (SELECT 1)'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 border border-amber-500/40 font-mono font-bold">
                    <Lock className="w-3 h-3" />
                    <span>{language === 'ja' ? '抽選確定・再抽選不可' : 'LOCKED'}</span>
                  </span>
                </div>
                <span className="text-xs text-slate-300">
                  {language === 'ja'
                    ? '選んだ1名がMY TEAM＆HISTORYに保存されます'
                    : 'Chosen manager is saved to MY TEAM & HISTORY'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pendingCandidates.map((mgr) => (
                  <ManagerCard
                    key={mgr.id}
                    manager={mgr}
                    language={language}
                    compact
                    onSelect={(chosen) => {
                      onDraftManager(chosen);
                      onClose();
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
