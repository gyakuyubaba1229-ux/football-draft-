import React, { useEffect, useState } from 'react';
import { InventoryItemType, Language, LoginBonusState, RewardTicketType } from '../types';
import {
  LOGIN_BONUS_SCHEDULE,
  canClaimLoginBonusToday,
  formatCountdownJa,
  getMsUntilNextJstMidnight,
} from '../utils/loginBonusEngine';
import { ITEM_CATALOG } from '../utils/itemBoxEngine';
import { REWARD_SCOUT_DEFINITIONS } from '../utils/rewardScoutEngine';
import { claimLoginBonus, ServerUserProgressPayload } from '../utils/backendApi';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Gift,
  Sparkles,
  X,
  Info,
} from 'lucide-react';

interface LoginBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  userId: string;
  loginBonus: LoginBonusState;
  onProgressUpdated: (progress: ServerUserProgressPayload) => void;
}

export const LoginBonusModal: React.FC<LoginBonusModalProps> = ({
  isOpen,
  onClose,
  language,
  userId,
  loginBonus,
  onProgressUpdated,
}) => {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimBanner, setClaimBanner] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setNowMs(Date.now());
    setClaimBanner(null);
    setErrorMsg(null);
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const canClaimToday = canClaimLoginBonusToday(loginBonus, nowMs);
  const activeDay = loginBonus.currentDay || 1;
  const claimedSet = new Set(loginBonus.claimedDaysInCycle || []);
  const msUntilReset = getMsUntilNextJstMidnight(nowMs);
  const countdownText = formatCountdownJa(msUntilReset);

  const handleClaimToday = async () => {
    if (!canClaimToday || isClaiming) return;
    soundManager.playButtonClick();
    setIsClaiming(true);
    setErrorMsg(null);

    const res = await claimLoginBonus(userId);
    setIsClaiming(false);

    if (!res.success) {
      soundManager.playError();
      onProgressUpdated(res.progress);
      setErrorMsg(
        language === 'ja'
          ? '本日のログインボーナスはすでに受け取り済みです（毎日 0:00 JST リセット）。'
          : 'Today’s login bonus has already been claimed (resets daily at 00:00 JST).'
      );
      return;
    }

    onProgressUpdated(res.progress);
    soundManager.playVictory();
    confetti({
      particleCount: 110,
      spread: 80,
      origin: { y: 0.55 },
    });

    const claimedDayDef = LOGIN_BONUS_SCHEDULE.find((d) => d.day === res.claimedDay);
    setClaimBanner(
      language === 'ja'
        ? `🎉 Day ${res.claimedDay} 報酬「${claimedDayDef?.labelJa || ''}」を受け取りました！`
        : `🎉 Claimed Day ${res.claimedDay}: ${claimedDayDef?.labelEn || ''}!`
    );
  };

  return (
    <div
      id="login-bonus-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
    >
      <div
        id="login-bonus-modal"
        className="w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/25 to-amber-500/25 border border-emerald-400/50 text-emerald-300 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  15-DAY LOGIN BONUS • CYCLE #{loginBonus.cycleCount || 1}
                </span>
                {canClaimToday ? (
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 animate-pulse">
                    受取可能 (Day {activeDay})
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    本日受取済み
                  </span>
                )}
              </div>
              <h3 className="font-heading font-black text-lg sm:text-xl text-white mt-0.5">
                {language === 'ja' ? '15日ログインボーナス' : '15-DAY LOGIN BONUS'}
              </h3>
            </div>
          </div>

          <button
            id="close-login-bonus-btn"
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Rules Strip */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {language === 'ja'
                ? `日付変更まで (0:00 JST): `
                : `Next JST Reset (00:00 JST): `}
              <strong className="font-mono text-amber-300">{countdownText}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {language === 'ja'
                ? '未ログイン日があってもズレずに続きから受取可・15日目受取後は1日目へループ'
                : 'Missed days never skip rewards • Cycles back to Day 1 after Day 15'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {claimBanner && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-400/60 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{claimBanner}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {/* 15-Day Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
            {LOGIN_BONUS_SCHEDULE.map((dayDef) => {
              const isClaimed = claimedSet.has(dayDef.day);
              const isCurrent = dayDef.day === activeDay;
              const isHighlightedForClaim = isCurrent && canClaimToday;
              const primaryReward = dayDef.rewards[0];
              const catalog = ITEM_CATALOG[primaryReward.rewardType as InventoryItemType];
              const scoutDef = REWARD_SCOUT_DEFINITIONS[primaryReward.rewardType as RewardTicketType];
              const itemName =
                language === 'ja'
                  ? catalog?.nameJa || scoutDef?.nameJa || dayDef.labelJa
                  : catalog?.nameEn || scoutDef?.nameEn || dayDef.labelEn;

              const isMilestone = dayDef.day === 8 || dayDef.day === 9 || dayDef.day === 14 || dayDef.day === 15;

              return (
                <div
                  key={dayDef.day}
                  id={`login-bonus-day-${dayDef.day}`}
                  className={`relative rounded-2xl p-3 border transition-all flex flex-col justify-between min-h-[126px] ${
                    isClaimed
                      ? 'bg-slate-950/50 border-slate-800 opacity-65'
                      : isHighlightedForClaim
                      ? 'bg-gradient-to-b from-amber-950/60 via-slate-900 to-emerald-950/40 border-2 border-amber-400 shadow-lg shadow-amber-500/20 ring-1 ring-amber-300/60'
                      : isMilestone
                      ? 'bg-gradient-to-b from-indigo-950/50 via-slate-900 to-slate-950 border-indigo-400/50'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-lg ${
                        isClaimed
                          ? 'bg-slate-800 text-slate-400'
                          : isHighlightedForClaim
                          ? 'bg-amber-400 text-slate-950'
                          : isMilestone
                          ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-400/40'
                          : 'bg-slate-800 text-emerald-300'
                      }`}
                    >
                      DAY {dayDef.day}
                    </span>
                    {isClaimed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isHighlightedForClaim ? (
                      <span className="text-[9px] font-black text-amber-300 animate-pulse">TODAY</span>
                    ) : null}
                  </div>

                  <div className="my-2 space-y-1">
                    <div className="text-xs font-heading font-black text-white leading-snug line-clamp-2">
                      {itemName}
                    </div>
                    <div className="text-sm font-mono font-black text-amber-300">
                      ×{primaryReward.amount}
                    </div>
                  </div>

                  <div>
                    {dayDef.expiryNoteJa ? (
                      <span className="inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/30">
                        ⏱ {language === 'ja' ? dayDef.expiryNoteJa : dayDef.expiryNoteEn}
                      </span>
                    ) : (
                      <span className="inline-block text-[9px] font-mono text-slate-500">
                        {isClaimed ? '受取済み' : '無期限アイテム'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono">
            累計受取回数: <strong className="text-white">{loginBonus.totalClaims || 0}日</strong> • 現在進行: <strong className="text-emerald-400">Day {activeDay} / 15</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="btn-claim-login-bonus"
              type="button"
              disabled={!canClaimToday || isClaiming}
              onClick={handleClaimToday}
              className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-heading font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                canClaimToday && !isClaiming
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-xl shadow-amber-500/25 active:scale-95 cursor-pointer'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {canClaimToday ? <Sparkles className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
              <span>
                {isClaiming
                  ? '受取処理中...'
                  : canClaimToday
                  ? `Day ${activeDay} ボーナスを受け取る`
                  : '本日は受取済み (0:00 JST更新)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
