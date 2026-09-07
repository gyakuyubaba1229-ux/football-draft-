import React, { useState } from 'react';
import { GiftBoxItem, Language, RewardTicketType } from '../types';
import { REWARD_SCOUT_DEFINITIONS } from '../utils/rewardScoutEngine';
import { soundManager } from '../utils/audio';
import {
  Gift,
  CheckCircle2,
  Clock,
  Sparkles,
  Ticket,
  ChevronRight,
  Inbox,
  Award,
} from 'lucide-react';

interface GiftBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  presents: GiftBoxItem[];
  onClaimItem: (giftId: string) => Promise<void>;
  onClaimAll: () => Promise<void>;
  onOpenScoutModal: () => void;
  language: Language;
}

export const GiftBoxModal: React.FC<GiftBoxModalProps> = ({
  isOpen,
  onClose,
  presents,
  onClaimItem,
  onClaimAll,
  onOpenScoutModal,
  language,
}) => {
  const [filter, setFilter] = useState<'all' | 'unclaimed' | 'claimed'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const unclaimedItems = presents.filter((p) => !p.isClaimed);
  const filteredItems = presents.filter((p) => {
    if (filter === 'unclaimed') return !p.isClaimed;
    if (filter === 'claimed') return p.isClaimed;
    return true;
  });

  const handleClaim = async (giftId: string) => {
    setIsProcessing(true);
    try {
      await onClaimItem(giftId);
      soundManager.playDraftAcquired();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClaimAll = async () => {
    if (unclaimedItems.length === 0) return;
    setIsProcessing(true);
    try {
      await onClaimAll();
      soundManager.playTeamCompleted();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="gift-box-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 max-w-2xl w-full shadow-2xl space-y-5 animate-scaleUp my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0 shadow-md">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  PRESENT BOX
                </span>
                {unclaimedItems.length > 0 && (
                  <span className="px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/40 animate-pulse">
                    未受取: {unclaimedItems.length}件
                  </span>
                )}
              </div>
              <h3 className="font-heading font-black text-xl sm:text-2xl text-white">
                プレゼントボックス
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-xs font-bold"
          >
            ✕ 閉じる
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          {/* Filters */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              すべて ({presents.length})
            </button>
            <button
              onClick={() => setFilter('unclaimed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'unclaimed'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              未受取 ({unclaimedItems.length})
            </button>
            <button
              onClick={() => setFilter('claimed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'claimed'
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              受取済み ({presents.length - unclaimedItems.length})
            </button>
          </div>

          {/* Claim All Button */}
          {unclaimedItems.length > 0 && (
            <button
              disabled={isProcessing}
              onClick={handleClaimAll}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-black text-xs tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>一括受取 ({unclaimedItems.length}件)</span>
            </button>
          )}
        </div>

        {/* Gift List */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
              <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-400">
                {filter === 'unclaimed'
                  ? '未受取のプレゼントはありません'
                  : 'プレゼントはありません'}
              </div>
            </div>
          ) : (
            filteredItems.map((item) => {
              const def = REWARD_SCOUT_DEFINITIONS[item.rewardType as RewardTicketType];
              const badgeText = def ? def.nameJa : item.rewardType;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.isClaimed
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-950/90 border-amber-500/30 hover:border-amber-500/60 shadow-md'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-black text-sm text-white">
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {badgeText} ×{item.amount || 1}
                      </span>
                      {item.isClaimed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                          受取済み
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                    {item.isClaimed ? (
                      <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>受取完了</span>
                      </div>
                    ) : (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleClaim(item.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-heading font-black text-xs tracking-wider shadow-md cursor-pointer disabled:opacity-50 transition-all active:scale-95 flex items-center gap-1"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>受け取る</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut to Reward Scout */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-amber-400" />
            <span>受け取ったチケットは報酬スカウトで利用できます</span>
          </div>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
              onOpenScoutModal();
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>報酬スカウト画面へ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
