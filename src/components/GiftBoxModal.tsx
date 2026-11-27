import React, { useEffect, useRef, useState } from 'react';
import { GiftBoxItem, InventoryItemType, Language, RewardTicketType } from '../types';
import { REWARD_SCOUT_DEFINITIONS } from '../utils/rewardScoutEngine';
import { ITEM_CATALOG } from '../utils/itemBoxEngine';
import { soundManager } from '../utils/audio';
import {
  Gift,
  CheckCircle2,
  Clock,
  Sparkles,
  Ticket,
  ChevronRight,
  Inbox,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export interface GiftBoxClaimOutcome {
  ok: boolean;
  claimedCount?: number;
  message?: string;
}

interface GiftBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  presents?: GiftBoxItem[];
  onClaimItem?: (giftId: string) => Promise<GiftBoxClaimOutcome | void> | void;
  onClaimAll?: () => Promise<GiftBoxClaimOutcome | void> | void;
  onRefresh?: () => Promise<void> | void;
  onOpenScoutModal?: () => void;
  language?: Language;
}

export const GiftBoxModal: React.FC<GiftBoxModalProps> = ({
  isOpen,
  onClose,
  presents = [],
  onClaimItem,
  onClaimAll,
  onRefresh,
  onOpenScoutModal = () => {},
}) => {
  const [filter, setFilter] = useState<'all' | 'unclaimed' | 'claimed'>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setFeedback(null);
    if (onRefresh) {
      setIsRefreshing(true);
      Promise.resolve(onRefresh())
        .catch((e) => console.warn('Gift box refresh note:', e))
        .finally(() => setIsRefreshing(false));
    }
  }, [isOpen, onRefresh]);

  if (!isOpen) return null;

  const nowMs = Date.now();
  const safePresents = Array.isArray(presents) ? presents : [];
  const isExpired = (item: GiftBoxItem) => Boolean(item.expiresAt && nowMs > item.expiresAt);
  const claimableItems = safePresents.filter((p) => !p.isClaimed && !isExpired(p));
  const claimedItems = safePresents.filter((p) => p.isClaimed);
  const filteredItems = safePresents.filter((p) => {
    if (filter === 'unclaimed') return !p.isClaimed && !isExpired(p);
    if (filter === 'claimed') return p.isClaimed;
    return true;
  });

  const handleManualRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    soundManager.playButtonClick();
    setIsRefreshing(true);
    setFeedback(null);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClaim = async (giftId: string) => {
    if (isProcessingRef.current || isProcessing) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    setFeedback(null);
    try {
      const outcome = onClaimItem ? await onClaimItem(giftId) : undefined;
      if (outcome && !outcome.ok) {
        soundManager.playError();
        setFeedback({ ok: false, text: outcome.message || 'プレゼントの受け取りに失敗しました。' });
      } else {
        soundManager.playDraftAcquired();
        setFeedback({ ok: true, text: outcome?.message || 'プレゼントを受け取りました！' });
      }
    } catch {
      soundManager.playError();
      setFeedback({ ok: false, text: '通信エラーにより受け取りに失敗しました。再度お試しください。' });
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleClaimAll = async () => {
    if (claimableItems.length === 0 || isProcessingRef.current || isProcessing) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    setFeedback(null);
    try {
      const outcome = onClaimAll ? await onClaimAll() : undefined;
      if (outcome && !outcome.ok) {
        soundManager.playError();
        setFeedback({ ok: false, text: outcome.message || '一括受取に失敗しました。' });
      } else {
        soundManager.playTeamCompleted();
        const count = outcome?.claimedCount ?? claimableItems.length;
        setFeedback({
          ok: true,
          text: outcome?.message || `${count}件のプレゼントを一括で受け取りました！`,
        });
      }
    } catch {
      soundManager.playError();
      setFeedback({ ok: false, text: '通信エラーにより一括受取に失敗しました。再度お試しください。' });
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="gift-box-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-7 max-w-2xl w-full shadow-2xl space-y-4 sm:space-y-5 animate-scaleUp my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0 shadow-md">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  PRESENT BOX
                </span>
                {claimableItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/40 animate-pulse">
                    受取可能: {claimableItems.length}件
                  </span>
                )}
              </div>
              <h3 className="font-heading font-black text-lg sm:text-2xl text-white">
                プレゼントボックス
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                disabled={isRefreshing || isProcessing}
                onClick={handleManualRefresh}
                title="最新状態に更新"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-xs font-bold cursor-pointer"
            >
              ✕ 閉じる
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 shrink-0 ${
              feedback.ok
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
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

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 shrink-0">
          {/* Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              すべて ({safePresents.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unclaimed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'unclaimed'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              未受取 ({claimableItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('claimed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'claimed'
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              受取済み ({claimedItems.length})
            </button>
          </div>

          {/* Claim All Button */}
          {claimableItems.length > 0 && (
            <button
              id="btn-claim-all-presents"
              type="button"
              disabled={isProcessing}
              onClick={handleClaimAll}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-black text-xs tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95 min-h-[40px]"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>{isProcessing ? '受取処理中...' : `一括受取 (${claimableItems.length}件)`}</span>
            </button>
          )}
        </div>

        {/* Gift List */}
        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
              <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-400">
                {filter === 'unclaimed'
                  ? '受取可能な未受取プレゼントはありません'
                  : 'プレゼントはありません'}
              </div>
            </div>
          ) : (
            filteredItems.map((item) => {
              const rewardEntries =
                item.rewards && item.rewards.length > 0
                  ? item.rewards
                  : [{ rewardType: item.rewardType, amount: item.amount || 1 }];
              const expired = isExpired(item);

              const formattedExpiry = item.expiresAt
                ? `${new Date(item.expiresAt).toLocaleString('ja-JP', {
                    timeZone: 'Asia/Tokyo',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })} JST`
                : null;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.isClaimed
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : expired
                      ? 'bg-rose-950/20 border-rose-900/50 opacity-70'
                      : 'bg-slate-950/90 border-amber-500/30 hover:border-amber-500/60 shadow-md'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-black text-sm text-white">
                        {item.title}
                      </span>
                      {rewardEntries.map((rew, rIdx) => {
                        const catalogEntry = ITEM_CATALOG[rew.rewardType as InventoryItemType];
                        const scoutDef = REWARD_SCOUT_DEFINITIONS[rew.rewardType as RewardTicketType];
                        const badgeText = catalogEntry
                          ? catalogEntry.nameJa
                          : scoutDef
                          ? scoutDef.nameJa
                          : String(rew.rewardType);
                        return (
                          <span
                            key={`${item.id}_rew_${rIdx}`}
                            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          >
                            {badgeText} ×{rew.amount || 1}
                          </span>
                        );
                      })}
                      {item.isClaimed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                          受取済み
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{new Date(item.createdAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
                      </div>
                      {formattedExpiry && item.expiresAt && (
                        <div className={`flex items-center gap-1 ${expired ? 'text-rose-400 font-bold' : 'text-amber-400/80'}`}>
                          <span>有効期限: {formattedExpiry}</span>
                          {expired && <span>(期限切れ)</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                    {item.isClaimed ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>受取完了</span>
                      </div>
                    ) : expired ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-400 text-xs font-bold flex items-center gap-1">
                        <span>期限切れ</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleClaim(item.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-black text-xs tracking-wider shadow-md cursor-pointer disabled:opacity-50 transition-all active:scale-95 flex items-center gap-1 min-h-[40px]"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>{isProcessing ? '処理中...' : '受け取る'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut to Reward Scout */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-amber-400 shrink-0" />
            <span>受け取ったチケット・アイテムは報酬スカウト／ITEM BOXで利用できます</span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
              onOpenScoutModal();
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>報酬スカウト画面へ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
