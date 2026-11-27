import React, { useMemo, useRef, useState } from 'react';
import {
  InventoryItemType,
  ItemBoxCategory,
  Language,
  Player,
  RewardTicketType,
  UserTeam,
} from '../types';
import {
  ALL_INVENTORY_ITEM_TYPES,
  ITEM_BOX_CATEGORY_LABELS,
  ITEM_CATALOG,
  evaluateItemUsability,
  formatRemainingTime,
  isScoutTicketType,
} from '../utils/itemBoxEngine';
import {
  CHIPS_PER_LEVEL,
  MAX_AWAKENING_LEVEL,
  MAX_PLAYER_LEVEL,
  canAwakenPlayer,
  canTrainPlayerLevel,
  ensurePlayerTrainingDefaults,
  getEligiblePositionPlusOptions,
  getOvrBonusForLevel,
} from '../utils/playerTrainingEngine';
import {
  ServerUserProgressPayload,
  addPositionPlusToPlayer,
  awakenPlayerWithTicket,
  trainPlayerWithChip,
} from '../utils/backendApi';
import { EFootballPosition } from '../data/playerPositions';
import { MANAGERS_DATABASE, getLocalizedManagerName } from '../data/managersDatabase';
import { getVerifiedPositionsForPlayer } from '../utils/positionEngine';
import { getLocalizedPlayerName } from '../utils/translations';
import { soundManager } from '../utils/audio';
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  History,
  Lock,
  Package,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';

interface ItemBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  userId: string;
  progress: ServerUserProgressPayload;
  teams: UserTeam[];
  activeTeamId: string;
  onProgressUpdated: (progress: ServerUserProgressPayload) => void;
  onPlayerUpdated: (updatedPlayer: Player) => void;
  onOpenScoutWithTicket: (ticketType: RewardTicketType) => void;
  onOpenManagerSelect: () => void;
  onOpenLoginBonus: () => void;
  onOpenGiftBox: () => void;
}

export const ItemBoxModal: React.FC<ItemBoxModalProps> = ({
  isOpen,
  onClose,
  language,
  userId,
  progress,
  teams,
  activeTeamId,
  onProgressUpdated,
  onPlayerUpdated,
  onOpenScoutWithTicket,
  onOpenManagerSelect,
  onOpenLoginBonus,
  onOpenGiftBox,
}) => {
  const [activeCategory, setActiveCategory] = useState<ItemBoxCategory>('training');
  const [selectedItemType, setSelectedItemType] = useState<InventoryItemType>('training_chip');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(activeTeamId);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedTargetPos, setSelectedTargetPos] = useState<EFootballPosition | ''>('');
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const isExecutingRef = useRef<boolean>(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    kind: 'training_chip' | 'awakening_ticket';
    player: Player;
  } | null>(null);

  const categoryItems = useMemo(() => {
    return ALL_INVENTORY_ITEM_TYPES.filter(
      (type) => ITEM_CATALOG[type].category === activeCategory
    );
  }, [activeCategory]);

  const effectiveSelectedItem = useMemo<InventoryItemType>(() => {
    if (ITEM_CATALOG[selectedItemType]?.category === activeCategory) {
      return selectedItemType;
    }
    return categoryItems[0] || 'training_chip';
  }, [activeCategory, categoryItems, selectedItemType]);

  const targetTeam = useMemo(() => {
    return teams.find((t) => t.teamId === selectedTeamId) || teams.find((t) => t.teamId === activeTeamId) || teams[0];
  }, [teams, selectedTeamId, activeTeamId]);

  const teamPlayers = useMemo(() => {
    return (targetTeam?.players || []).map((p) => ensurePlayerTrainingDefaults(p));
  }, [targetTeam]);

  const selectedPlayer = useMemo(() => {
    return teamPlayers.find((p) => p.playerId === selectedPlayerId) || teamPlayers[0] || null;
  }, [teamPlayers, selectedPlayerId]);

  if (!isOpen) return null;

  const inventory = progress.inventory;
  const nowMs = Date.now();

  const getSoonestExpiryForItem = (itemType: InventoryItemType): number | undefined => {
    const matching = (progress.timedLots || [])
      .filter((l) => l.ticketType === itemType && l.remaining > 0 && l.expiresAt > nowMs)
      .sort((a, b) => a.expiresAt - b.expiresAt);
    return matching[0]?.expiresAt;
  };

  const selectedDef = ITEM_CATALOG[effectiveSelectedItem];
  const selectedCount = inventory[effectiveSelectedItem] || 0;
  const selectedExpiry = getSoonestExpiryForItem(effectiveSelectedItem);
  const usability = evaluateItemUsability(effectiveSelectedItem, selectedCount, teams);

  const handleCategorySwitch = (cat: ItemBoxCategory) => {
    soundManager.playButtonClick();
    setActiveCategory(cat);
    setFeedback(null);
    setPendingConfirm(null);
    const first = ALL_INVENTORY_ITEM_TYPES.find((t) => ITEM_CATALOG[t].category === cat);
    if (first) setSelectedItemType(first);
  };

  const handleTrainPlayer = async (targetPlayer: Player) => {
    if (!targetPlayer || isExecutingRef.current) return;
    isExecutingRef.current = true;
    soundManager.playButtonClick();
    setIsBusy(true);
    setFeedback(null);

    try {
      const res = await trainPlayerWithChip(userId, targetPlayer);
      if (!res.success || !res.updatedPlayer || !res.progress) {
        soundManager.playError();
        setFeedback({ ok: false, text: res.error || '育成に失敗しました。' });
        return;
      }

      onProgressUpdated(res.progress);
      onPlayerUpdated(res.updatedPlayer);
      setPendingConfirm(null);
      soundManager.playDraftAcquired();
      setFeedback({
        ok: true,
        text: `${getLocalizedPlayerName(res.updatedPlayer, language)} が Lv.${res.updatedPlayer.level} (OVR ${res.updatedPlayer.rating}) に成長しました！`,
      });
    } finally {
      isExecutingRef.current = false;
      setIsBusy(false);
    }
  };

  const handleAwakenPlayer = async (targetPlayer: Player) => {
    if (!targetPlayer || isExecutingRef.current) return;
    isExecutingRef.current = true;
    soundManager.playButtonClick();
    setIsBusy(true);
    setFeedback(null);

    try {
      const res = await awakenPlayerWithTicket(userId, targetPlayer);
      if (!res.success || !res.updatedPlayer || !res.progress) {
        soundManager.playError();
        setFeedback({ ok: false, text: res.error || '覚醒に失敗しました。' });
        return;
      }

      onProgressUpdated(res.progress);
      onPlayerUpdated(res.updatedPlayer);
      setPendingConfirm(null);
      soundManager.playVictory();
      setFeedback({
        ok: true,
        text: `✨ ${getLocalizedPlayerName(res.updatedPlayer, language)} が覚醒 Lv.${res.updatedPlayer.awakeningLevel}/7 に到達しました！`,
      });
    } finally {
      isExecutingRef.current = false;
      setIsBusy(false);
    }
  };

  const handleAddPosition = async (posToAdd: EFootballPosition) => {
    if (!selectedPlayer || !posToAdd || isExecutingRef.current) return;
    isExecutingRef.current = true;
    soundManager.playButtonClick();
    setIsBusy(true);
    setFeedback(null);

    try {
      const res = await addPositionPlusToPlayer(userId, selectedPlayer, posToAdd);
      if (!res.success || !res.updatedPlayer || !res.progress) {
        soundManager.playError();
        setFeedback({ ok: false, text: res.error || 'ポジション追加に失敗しました。' });
        return;
      }

      onProgressUpdated(res.progress);
      onPlayerUpdated(res.updatedPlayer);
      setSelectedTargetPos('');
      soundManager.playDraftAcquired();
      setFeedback({
        ok: true,
        text: `🧭 ${getLocalizedPlayerName(res.updatedPlayer, language)} に適正ポジション「${posToAdd}」を追加しました！`,
      });
    } finally {
      isExecutingRef.current = false;
      setIsBusy(false);
    }
  };

  const eligiblePositions = selectedPlayer ? getEligiblePositionPlusOptions(selectedPlayer) : [];
  const effectiveTargetPos =
    selectedTargetPos && eligiblePositions.includes(selectedTargetPos)
      ? selectedTargetPos
      : eligiblePositions[0] || '';

  return (
    <div
      id="item-box-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md select-none"
    >
      <div
        id="item-box-modal"
        className="w-full max-w-5xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[93vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                  ITEM BOX
                </h3>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Ver.1.6.1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                育成アイテム・スカウトチケット・監督・ポジション強化・使用履歴
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
                onOpenLoginBonus();
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer"
            >
              <span>📅 ログインボーナス</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
                onOpenGiftBox();
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer"
            >
              <span>🎁 BOX</span>
            </button>
            <button
              id="close-item-box-btn"
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 5 Category Tabs */}
        <div className="px-3 sm:px-5 py-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center gap-1.5 overflow-x-auto">
          {(Object.keys(ITEM_BOX_CATEGORY_LABELS) as ItemBoxCategory[]).map((cat) => {
            const labelInfo = ITEM_BOX_CATEGORY_LABELS[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                id={`item-box-tab-${cat}`}
                type="button"
                onClick={() => handleCategorySwitch(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer min-h-[40px] ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {language === 'ja' ? labelInfo.labelJa : labelInfo.labelEn}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                feedback.ok
                  ? 'bg-emerald-950/50 border-emerald-400/50 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
              }`}
            >
              {feedback.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* CATEGORY 5: OTHER (Logs, Timed Expirations, Quick Links) */}
          {activeCategory === 'other' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Timed Ticket Expirations */}
              <div className="lg:col-span-5 bg-slate-950/75 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="font-heading font-black text-sm text-amber-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>期限付きチケット有効期限一覧</span>
                </h4>
                {(progress.timedLots || []).filter((l) => l.remaining > 0 && l.expiresAt > nowMs).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    現在、有効期限付きのチケットはありません。
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(progress.timedLots || [])
                      .filter((l) => l.remaining > 0 && l.expiresAt > nowMs)
                      .sort((a, b) => a.expiresAt - b.expiresAt)
                      .map((lot) => {
                        const itemMeta = ITEM_CATALOG[lot.ticketType];
                        return (
                          <div
                            key={lot.id}
                            className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">
                                {itemMeta?.nameJa || lot.ticketType} ×{lot.remaining}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                期限: {new Date(lot.expiresAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} JST
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                              {formatRemainingTime(lot.expiresAt, nowMs)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Usage History Logs */}
              <div className="lg:col-span-7 bg-slate-950/75 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="font-heading font-black text-sm text-emerald-300 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <span>アイテム使用履歴 ({progress.usageLogs?.length || 0}件)</span>
                </h4>
                {!progress.usageLogs || progress.usageLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    まだアイテムの使用履歴がありません。
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {progress.usageLogs.map((log) => {
                      const itemMeta = ITEM_CATALOG[log.itemType];
                      return (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">
                              {itemMeta?.nameJa || log.itemType} ×{log.amount}
                            </div>
                            <div className="text-[11px] text-slate-300 truncate">
                              {language === 'ja' ? log.detailJa : log.detailEn}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {new Date(log.timestamp).toLocaleString('ja-JP', {
                              timeZone: 'Asia/Tokyo',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Item List */}
              <div className="lg:col-span-5 space-y-2 max-h-[430px] overflow-y-auto pr-1">
                {categoryItems.map((type) => {
                  const meta = ITEM_CATALOG[type];
                  const count = inventory[type] || 0;
                  const exp = getSoonestExpiryForItem(type);
                  const isSelected = effectiveSelectedItem === type;

                  return (
                    <button
                      key={type}
                      id={`item-box-row-${type}`}
                      type="button"
                      onClick={() => {
                        soundManager.playButtonClick();
                        setSelectedItemType(type);
                        setFeedback(null);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-emerald-400 ring-1 ring-emerald-400/50 shadow-md'
                          : 'bg-slate-950/75 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-heading font-black text-xs sm:text-sm text-white truncate">
                            {language === 'ja' ? meta.nameJa : meta.nameEn}
                          </span>
                          <span className={`text-[9px] font-mono font-black px-1.5 py-0.2 rounded border ${meta.accentColor}`}>
                            {meta.badgeText}
                          </span>
                        </div>
                        {exp && (
                          <div className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatRemainingTime(exp, nowMs)}</span>
                          </div>
                        )}
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black shrink-0 ${
                          count > 0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right: Item Detail & Interactive Action Pane */}
              <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                      {ITEM_BOX_CATEGORY_LABELS[selectedDef.category].labelJa}
                    </span>
                    <h4 className="font-heading font-black text-lg sm:text-xl text-white">
                      {language === 'ja' ? selectedDef.nameJa : selectedDef.nameEn}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-mono text-slate-400">所持数</div>
                    <div className="text-2xl font-mono font-black text-amber-300">{selectedCount}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'ja' ? selectedDef.descriptionJa : selectedDef.descriptionEn}
                </p>

                {selectedExpiry && (
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono flex items-center justify-between">
                    <span>期限付き所持枠の最短期限</span>
                    <span className="font-black text-amber-300">{formatRemainingTime(selectedExpiry, nowMs)}</span>
                  </div>
                )}

                {!usability.usable && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{language === 'ja' ? usability.reasonJa : usability.reasonEn}</span>
                  </div>
                )}

                {/* WORKFLOW A: SCOUT TICKETS */}
                {isScoutTicketType(effectiveSelectedItem) && (
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={selectedCount <= 0}
                      onClick={() => {
                        soundManager.playButtonClick();
                        onOpenScoutWithTicket(effectiveSelectedItem as RewardTicketType);
                      }}
                      className={`w-full py-3 rounded-2xl font-heading font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                        selectedCount > 0
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white shadow-lg cursor-pointer'
                          : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Ticket className="w-4 h-4" />
                      <span>報酬スカウトでこのチケットを使用する</span>
                    </button>
                  </div>
                )}

                {/* WORKFLOW B: MANAGER SELECT TICKET & OWNED MANAGERS */}
                {effectiveSelectedItem === 'manager_select_ticket' && (
                  <div className="space-y-4">
                    <button
                      id="btn-open-manager-select-from-box"
                      type="button"
                      disabled={selectedCount <= 0}
                      onClick={() => {
                        soundManager.playButtonClick();
                        onOpenManagerSelect();
                      }}
                      className={`w-full py-3 rounded-2xl font-heading font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                        selectedCount > 0
                          ? 'bg-gradient-to-r from-indigo-500 to-amber-500 hover:from-indigo-400 hover:to-amber-400 text-slate-950 shadow-lg cursor-pointer'
                          : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>監督選択スカウトを開く（好きな監督を選択）</span>
                    </button>

                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-300">
                        獲得済み監督コレクション ({progress.ownedManagers?.length || 0}名)
                      </div>
                      {!progress.ownedManagers || progress.ownedManagers.length === 0 ? (
                        <p className="text-xs text-slate-500">まだ獲得済み監督はいません。</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {progress.ownedManagers.map((rec) => {
                            const mgr = MANAGERS_DATABASE.find((m) => m.id === rec.managerId);
                            if (!mgr) return null;
                            return (
                              <span
                                key={rec.managerId}
                                className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs text-amber-200 font-bold"
                              >
                                {mgr.nationalityFlag} {getLocalizedManagerName(mgr, language)}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* WORKFLOW C: PLAYER TRAINING / AWAKENING / POSITION PLUS */}
                {(effectiveSelectedItem === 'training_chip' ||
                  effectiveSelectedItem === 'awakening_ticket' ||
                  effectiveSelectedItem === 'position_plus') && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    {/* Team Picker */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-300">対象チーム＆選手を選択</span>
                      <select
                        value={targetTeam?.teamId || ''}
                        onChange={(e) => {
                          setSelectedTeamId(e.target.value);
                          setSelectedPlayerId('');
                          setSelectedTargetPos('');
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        {teams.map((t) => (
                          <option key={t.teamId} value={t.teamId}>
                            {t.name} ({t.players.length}/11名)
                          </option>
                        ))}
                      </select>
                    </div>

                    {teamPlayers.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                        このチームにはまだ獲得済み選手がいません。ドラフトで選手を獲得してください。
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const hasEligibleInCurrent =
                            effectiveSelectedItem === 'awakening_ticket'
                              ? teamPlayers.some(
                                  (p) =>
                                    (p.level ?? 1) >= MAX_PLAYER_LEVEL &&
                                    (p.awakeningLevel ?? 0) < MAX_AWAKENING_LEVEL
                                )
                              : effectiveSelectedItem === 'training_chip'
                              ? teamPlayers.some((p) => (p.level ?? 1) < MAX_PLAYER_LEVEL)
                              : true;
                          const altTeam = !hasEligibleInCurrent
                            ? teams.find((t) =>
                                t.teamId !== targetTeam?.teamId &&
                                t.players.some((raw) => {
                                  const p = ensurePlayerTrainingDefaults(raw);
                                  return effectiveSelectedItem === 'awakening_ticket'
                                    ? (p.level ?? 1) >= MAX_PLAYER_LEVEL &&
                                        (p.awakeningLevel ?? 0) < MAX_AWAKENING_LEVEL
                                    : (p.level ?? 1) < MAX_PLAYER_LEVEL;
                                })
                              )
                            : undefined;
                          if (!altTeam) return null;
                          return (
                            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-2 text-xs">
                              <span className="text-amber-200">
                                {effectiveSelectedItem === 'awakening_ticket'
                                  ? `「${altTeam.name}」に対象（Lv.10）の選手がいます。`
                                  : `「${altTeam.name}」に育成可能な選手がいます。`}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  soundManager.playButtonClick();
                                  setSelectedTeamId(altTeam.teamId);
                                  setSelectedPlayerId('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shrink-0 cursor-pointer"
                              >
                                チームを切替
                              </button>
                            </div>
                          );
                        })()}

                        {/* Player Selector Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                          {teamPlayers.map((p) => {
                            const isPicked = selectedPlayer?.playerId === p.playerId;
                            const curLv = p.level ?? 1;
                            const curAw = p.awakeningLevel ?? 0;
                            const lockedForAwakening =
                              effectiveSelectedItem === 'awakening_ticket' &&
                              (curLv < MAX_PLAYER_LEVEL || curAw >= MAX_AWAKENING_LEVEL);
                            const lockedForPos =
                              effectiveSelectedItem === 'position_plus' && p.position === 'GK';

                            return (
                              <button
                                key={p.playerId}
                                type="button"
                                onClick={() => {
                                  soundManager.playButtonClick();
                                  setSelectedPlayerId(p.playerId);
                                  setSelectedTargetPos('');
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                  isPicked
                                    ? 'bg-emerald-950/60 border-emerald-400 ring-1 ring-emerald-400/50'
                                    : lockedForAwakening || lockedForPos
                                    ? 'bg-slate-900/40 border-slate-800/70 opacity-65'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate">
                                    {p.nationalityFlag} {getLocalizedPlayerName(p, language)}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 flex-wrap">
                                    <span>{p.position}</span>
                                    <span>Lv.{curLv}/10</span>
                                    {curAw > 0 && <span className="text-cyan-300">覚醒{curAw}/7</span>}
                                    {effectiveSelectedItem === 'awakening_ticket' && curLv < MAX_PLAYER_LEVEL && (
                                      <span className="text-rose-300">Lv.10必須</span>
                                    )}
                                  </div>
                                </div>
                                <span className="font-mono font-black text-sm text-amber-300 shrink-0">
                                  {p.rating}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Player Action Preview */}
                        {selectedPlayer && effectiveSelectedItem === 'training_chip' && (() => {
                          const check = canTrainPlayerLevel(selectedPlayer, selectedCount);
                          const curLv = selectedPlayer.level ?? 1;
                          const nextLv = Math.min(MAX_PLAYER_LEVEL, curLv + 1);
                          const baseOvr = selectedPlayer.baseRating ?? selectedPlayer.rating;
                          const nextOvr = baseOvr + getOvrBonusForLevel(nextLv);
                          return (
                            <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white">
                                  {getLocalizedPlayerName(selectedPlayer, language)}
                                </span>
                                <span className="font-mono text-emerald-300 font-black">
                                  Lv.{curLv} → Lv.{nextLv} (OVR {selectedPlayer.rating} → {nextOvr})
                                </span>
                              </div>
                              {!check.allowed && (
                                <p className="text-[11px] text-rose-300">{check.reasonJa}</p>
                              )}
                              <button
                                id="btn-execute-training-chip"
                                type="button"
                                disabled={!check.allowed || isBusy}
                                onClick={() => {
                                  soundManager.playButtonClick();
                                  setPendingConfirm({
                                    kind: 'training_chip',
                                    player: selectedPlayer,
                                  });
                                }}
                                className={`w-full py-2.5 rounded-xl font-heading font-black text-xs tracking-wider flex items-center justify-center gap-1.5 min-h-[44px] ${
                                  check.allowed && !isBusy
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 cursor-pointer'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                <Cpu className="w-4 h-4" />
                                <span>
                                  {isBusy
                                    ? '育成中...'
                                    : `トレーニングチップ ${CHIPS_PER_LEVEL}個で強化する`}
                                </span>
                              </button>
                            </div>
                          );
                        })()}

                        {selectedPlayer && effectiveSelectedItem === 'awakening_ticket' && (() => {
                          const check = canAwakenPlayer(selectedPlayer, selectedCount);
                          const curAw = selectedPlayer.awakeningLevel ?? 0;
                          return (
                            <div className="p-3.5 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white">
                                  {getLocalizedPlayerName(selectedPlayer, language)} (Lv.{selectedPlayer.level ?? 1}/10)
                                </span>
                                <span className="font-mono text-cyan-300 font-black">
                                  覚醒 Lv.{curAw} → Lv.{Math.min(MAX_AWAKENING_LEVEL, curAw + 1)} (OVR変化なし)
                                </span>
                              </div>
                              {!check.allowed && (
                                <p className="text-[11px] text-rose-300">{check.reasonJa}</p>
                              )}
                              <button
                                id="btn-execute-awaken"
                                type="button"
                                disabled={!check.allowed || isBusy}
                                onClick={() => {
                                  soundManager.playButtonClick();
                                  setPendingConfirm({
                                    kind: 'awakening_ticket',
                                    player: selectedPlayer,
                                  });
                                }}
                                className={`w-full py-2.5 rounded-xl font-heading font-black text-xs tracking-wider flex items-center justify-center gap-1.5 min-h-[44px] ${
                                  check.allowed && !isBusy
                                    ? 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 cursor-pointer'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                <Sparkles className="w-4 h-4" />
                                <span>{isBusy ? '覚醒処理中...' : '覚醒チケット 1枚で覚醒する'}</span>
                              </button>
                            </div>
                          );
                        })()}

                        {selectedPlayer && effectiveSelectedItem === 'position_plus' && (
                          <div className="p-3.5 rounded-2xl bg-slate-900 border border-violet-500/30 space-y-3">
                            <div className="text-xs space-y-1">
                              <div className="font-bold text-white">
                                {getLocalizedPlayerName(selectedPlayer, language)} の現在の適正:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {getVerifiedPositionsForPlayer(selectedPlayer).map((pos) => (
                                  <span
                                    key={pos}
                                    className="px-2 py-0.5 rounded bg-slate-950 text-emerald-300 border border-slate-700 font-mono text-[10px] font-bold"
                                  >
                                    {pos}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {selectedPlayer.position === 'GK' ? (
                              <p className="text-[11px] text-rose-300">
                                GK選手にはポジションplusを使用できません。フィールド選手を選択してください。
                              </p>
                            ) : eligiblePositions.length === 0 ? (
                              <p className="text-[11px] text-amber-300">
                                この選手はすべてのフィールドポジション適正を習得済みです。
                              </p>
                            ) : (
                              <>
                                <div className="space-y-1.5">
                                  <div className="text-[11px] text-slate-300 font-bold">
                                    追加する適正ポジションを選択（重複・GK不可）:
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {eligiblePositions.map((pos) => (
                                      <button
                                        key={pos}
                                        type="button"
                                        onClick={() => setSelectedTargetPos(pos)}
                                        className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border cursor-pointer ${
                                          effectiveTargetPos === pos
                                            ? 'bg-violet-500 text-white border-violet-300'
                                            : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-violet-400'
                                        }`}
                                      >
                                        +{pos}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <button
                                  id="btn-execute-position-plus"
                                  type="button"
                                  disabled={selectedCount <= 0 || !effectiveTargetPos || isBusy}
                                  onClick={() => effectiveTargetPos && handleAddPosition(effectiveTargetPos)}
                                  className={`w-full py-2.5 rounded-xl font-heading font-black text-xs tracking-wider flex items-center justify-center gap-1.5 min-h-[44px] ${
                                    selectedCount > 0 && effectiveTargetPos && !isBusy
                                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white cursor-pointer'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  <Compass className="w-4 h-4" />
                                  <span>
                                    {isBusy
                                      ? '追加処理中...'
                                      : `ポジションplus 1個で「${effectiveTargetPos}」を追加`}
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Training Chips & Awakening Tickets */}
      {pendingConfirm && (() => {
        const target = ensurePlayerTrainingDefaults(pendingConfirm.player);
        const isTraining = pendingConfirm.kind === 'training_chip';
        const curLv = target.level ?? 1;
        const nextLv = Math.min(MAX_PLAYER_LEVEL, curLv + 1);
        const curAw = target.awakeningLevel ?? 0;
        const nextAw = Math.min(MAX_AWAKENING_LEVEL, curAw + 1);
        const baseOvr = target.baseRating ?? target.rating;
        const curOvr = target.rating;
        const nextOvr = isTraining ? baseOvr + getOvrBonusForLevel(nextLv) : curOvr;
        const cost = isTraining ? CHIPS_PER_LEVEL : 1;
        const currentQty = isTraining
          ? inventory.training_chip || 0
          : inventory.awakening_ticket || 0;
        const afterQty = Math.max(0, currentQty - cost);

        return (
          <div
            id="item-confirm-modal-overlay"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <div
              id="item-confirm-modal"
              className="w-full max-w-md bg-slate-900 border-2 border-emerald-400/50 rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-heading font-black text-base sm:text-lg text-white">
                  {isTraining ? 'レベル強化の確認' : '選手覚醒の確認'}
                </h4>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    soundManager.playButtonClick();
                    setPendingConfirm(null);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">対象選手</span>
                  <span className="font-bold text-white">
                    {target.nationalityFlag} {getLocalizedPlayerName(target, language)} ({target.position})
                  </span>
                </div>

                {isTraining ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">選手レベル</span>
                      <span className="font-mono font-black text-emerald-300">
                        Lv.{curLv} → Lv.{nextLv}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">OVR変化</span>
                      <span className="font-mono font-black text-amber-300">
                        OVR {curOvr} → {nextOvr}
                        {nextOvr > curOvr ? ` (+${nextOvr - curOvr})` : ' (変動なし)'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">覚醒段階</span>
                      <span className="font-mono font-black text-cyan-300">
                        覚醒 Lv.{curAw} → Lv.{nextAw}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">OVR変化</span>
                      <span className="font-mono font-bold text-slate-300">
                        変動なし (OVR {curOvr})
                      </span>
                    </div>
                  </>
                )}

                <div className="border-t border-slate-800 pt-2 flex items-center justify-between gap-2">
                  <span className="text-slate-400">消費アイテム</span>
                  <span className="font-mono font-black text-rose-300">
                    {isTraining
                      ? `トレーニングチップ ×${cost}個`
                      : `覚醒チケット ×${cost}枚`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">所持数の変化</span>
                  <span className="font-mono font-bold text-slate-200">
                    {currentQty} → {afterQty}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  id="btn-item-confirm-cancel"
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    soundManager.playButtonClick();
                    setPendingConfirm(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs min-h-[44px] cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  id="btn-item-confirm-execute"
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    isTraining
                      ? handleTrainPlayer(target)
                      : handleAwakenPlayer(target)
                  }
                  className={`flex-1 py-2.5 rounded-xl font-heading font-black text-xs min-h-[44px] cursor-pointer ${
                    isTraining
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
                      : 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950'
                  }`}
                >
                  {isBusy
                    ? '処理中...'
                    : isTraining
                    ? '強化を実行する'
                    : '覚醒を実行する'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
