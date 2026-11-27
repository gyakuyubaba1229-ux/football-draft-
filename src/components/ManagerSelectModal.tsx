import React, { useMemo, useState } from 'react';
import { Language, Manager, OwnedManagerRecord, UserTeam } from '../types';
import {
  MANAGERS_DATABASE,
  getLocalizedManagerName,
  getLocalizedManagerNationality,
  getLocalizedTacticName,
} from '../data/managersDatabase';
import { ManagerPortraitSvg } from './ManagerCard';
import { selectManagerWithTicket, ServerUserProgressPayload } from '../utils/backendApi';
import { soundManager } from '../utils/audio';
import { Briefcase, CheckCircle2, Lock, Search, Sparkles, X, AlertTriangle } from 'lucide-react';

interface ManagerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  userId: string;
  ticketCount: number;
  ownedManagers: OwnedManagerRecord[];
  teams: UserTeam[];
  activeTeamId: string;
  onProgressUpdated: (progress: ServerUserProgressPayload) => void;
  onAssignManagerToTeam?: (teamId: string, manager: Manager) => void;
}

export const ManagerSelectModal: React.FC<ManagerSelectModalProps> = ({
  isOpen,
  onClose,
  language,
  userId,
  ticketCount,
  ownedManagers,
  teams,
  activeTeamId,
  onProgressUpdated,
  onAssignManagerToTeam,
}) => {
  const [search, setSearch] = useState('');
  const [eraFilter, setEraFilter] = useState<'ALL' | 'ACTIVE' | 'LEGEND'>('ALL');
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [targetTeamId, setTargetTeamId] = useState<string>(activeTeamId);
  const [appointOnAcquire, setAppointOnAcquire] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ownedIdSet = useMemo(
    () => new Set(ownedManagers.map((m) => m.managerId)),
    [ownedManagers]
  );

  const unlockedTeams = useMemo(
    () => teams.filter((t) => !t.isLocked),
    [teams]
  );

  const filteredManagers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MANAGERS_DATABASE.filter((m) => {
      if (eraFilter !== 'ALL' && m.eraOrStatus !== eraFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.nameJa.toLowerCase().includes(q) ||
        m.nameEn.toLowerCase().includes(q) ||
        m.nationality.toLowerCase().includes(q) ||
        m.nationalityJa.toLowerCase().includes(q) ||
        m.clubsCoached.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [search, eraFilter]);

  if (!isOpen) return null;

  const targetTeam = teams.find((t) => t.teamId === targetTeamId) || unlockedTeams[0];
  const isDuplicateSelection = selectedManager ? ownedIdSet.has(selectedManager.id) : false;

  const handleConfirmSelect = async () => {
    if (!selectedManager || ticketCount <= 0 || isSubmitting) return;
    soundManager.playButtonClick();
    setIsSubmitting(true);
    setErrorMsg(null);
    setResultMessage(null);

    const localizedName = getLocalizedManagerName(selectedManager, language);
    const res = await selectManagerWithTicket(userId, selectedManager.id, localizedName);
    setIsSubmitting(false);

    if (!res.success || !res.progress) {
      soundManager.playError();
      setErrorMsg(res.error || '監督選択スカウトの実行に失敗しました。');
      return;
    }

    onProgressUpdated(res.progress);
    if (appointOnAcquire && targetTeam && !targetTeam.isLocked && onAssignManagerToTeam) {
      onAssignManagerToTeam(targetTeam.teamId, selectedManager);
    }
    soundManager.playVictory();
    setResultMessage(
      res.alreadyOwned
        ? `「${localizedName}」を選択しました（すでに獲得済みの監督です${appointOnAcquire && targetTeam && !targetTeam.isLocked ? `・${targetTeam.name}へ就任反映済み` : ''}）。`
        : `🎉 新監督「${localizedName}」を獲得しました！${appointOnAcquire && targetTeam && !targetTeam.isLocked ? `（${targetTeam.name}へ就任済み）` : ''}`
    );
  };

  return (
    <div
      id="manager-select-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none"
    >
      <div
        id="manager-select-modal"
        className="w-full max-w-4xl bg-slate-900 border-2 border-indigo-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-black text-lg text-white">
                  {language === 'ja' ? '監督選択スカウト' : 'MANAGER SELECT SCOUT'}
                </h3>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
                  チケット所持: {ticketCount} 枚
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ja'
                  ? '実在名将リストから好きな監督を1名選んで獲得（通常監督ドラフト1ゲーム1回制限とは別枠）'
                  : 'Choose 1 manager directly without affecting the 1-per-game Manager Draft gacha'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'ja' ? '監督名・国籍・指導クラブで検索...' : 'Search manager / nationality / club...'}
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {(['ALL', 'ACTIVE', 'LEGEND'] as const).map((era) => (
              <button
                key={era}
                type="button"
                onClick={() => setEraFilter(era)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  eraFilter === era
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {era === 'ALL' ? 'すべて' : era === 'ACTIVE' ? '現役監督' : 'レジェンド'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {resultMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{resultMessage}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredManagers.map((mgr) => {
              const isOwned = ownedIdSet.has(mgr.id);
              const isPicked = selectedManager?.id === mgr.id;
              return (
                <button
                  key={mgr.id}
                  type="button"
                  onClick={() => {
                    soundManager.playButtonClick();
                    setSelectedManager(mgr);
                  }}
                  className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 cursor-pointer ${
                    isPicked
                      ? 'bg-indigo-950/70 border-2 border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                      : 'bg-slate-950/80 border-slate-800 hover:border-indigo-400/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ManagerPortraitSvg manager={mgr} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-sm">{mgr.nationalityFlag}</span>
                          <span className="font-heading font-black text-sm text-white truncate">
                            {getLocalizedManagerName(mgr, language)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {getLocalizedManagerNationality(mgr, language)} • {mgr.eraOrStatus}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[9px] font-mono text-slate-400">MAX</div>
                      <div className="text-lg font-mono font-black text-amber-300 leading-none">
                        {mgr.maxAffinity}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {mgr.specialtyTactics.map((tac) => (
                      <span
                        key={tac}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-800 font-bold"
                      >
                        ★ {getLocalizedTacticName(tac, language)} ({mgr.tactics[tac]})
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400 truncate max-w-[160px]">
                      {mgr.clubsCoached.slice(0, 2).join(' / ')}
                    </span>
                    {isOwned && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold shrink-0">
                        所持済み
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer / Appointment Options */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/95 space-y-3">
          {selectedManager && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>選択中: {getLocalizedManagerName(selectedManager, language)}</span>
                  {isDuplicateSelection && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <AlertTriangle className="w-3 h-3" />
                      すでに所持済み
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  ※監督選択スカウトによる獲得は、通常の「監督ドラフト」の1ゲーム1回制限を消費しません。
                </div>
              </div>

              {unlockedTeams.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appointOnAcquire}
                      onChange={(e) => setAppointOnAcquire(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-950 text-indigo-500"
                    />
                    <span>チームへ就任させる</span>
                  </label>
                  {appointOnAcquire && (
                    <select
                      value={targetTeam?.teamId || ''}
                      onChange={(e) => setTargetTeamId(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                    >
                      {unlockedTeams.map((t) => (
                        <option key={t.teamId} value={t.teamId}>
                          {t.name} {t.manager ? `(現: ${getLocalizedManagerName(t.manager, language)})` : '(未就任)'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {unlockedTeams.length === 0 && (
                <div className="text-[11px] text-amber-300 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>全チームロック中のため所持コレクションへ追加されます</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
            >
              閉じる
            </button>
            <button
              id="btn-confirm-manager-select"
              type="button"
              disabled={!selectedManager || ticketCount <= 0 || isSubmitting}
              onClick={handleConfirmSelect}
              className={`px-6 py-2.5 rounded-xl font-heading font-black text-xs sm:text-sm tracking-wider flex items-center gap-2 transition-all min-h-[44px] ${
                selectedManager && ticketCount > 0 && !isSubmitting
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? '獲得処理中...'
                  : ticketCount <= 0
                  ? '監督選択スカウト未所持'
                  : 'この監督を選択する (チケット1枚消費)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
