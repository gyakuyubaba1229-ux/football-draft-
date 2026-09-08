import React, { useState, useEffect } from 'react';
import {
  RewardTicketType,
  Player,
  Language,
  UserTeam,
} from '../types';
import {
  REWARD_SCOUT_DEFINITIONS,
  generateScoutCandidates,
  getStoredUserTickets,
  consumeUserTicket,
} from '../utils/rewardScoutEngine';
import { BlackBallAnimation } from './BlackBallAnimation';
import { CandidateCard } from './CandidateCard';
import { soundManager } from '../utils/audio';
import {
  X,
  Sparkles,
  Crown,
  Award,
  Zap,
  Star,
  Gift,
  Flame,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCw,
  UserPlus,
} from 'lucide-react';

interface RewardScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  onAcquirePlayer: (player: Player) => void;
  onOpenGiftBox?: () => void;
  activeTeam?: UserTeam | null;
}

export const RewardScoutModal: React.FC<RewardScoutModalProps> = ({
  isOpen,
  onClose,
  language = 'ja',
  onAcquirePlayer,
  onOpenGiftBox = () => {},
  activeTeam,
}) => {
  const [selectedTicketType, setSelectedTicketType] = useState<RewardTicketType>('legend_20');
  const [userTickets, setUserTickets] = useState<Record<RewardTicketType, number>>(() => getStoredUserTickets());
  const [isDraftSpinning, setIsDraftSpinning] = useState<boolean>(false);
  const [spinningCards, setSpinningCards] = useState<string[]>(['FW', 'MF', 'DF', 'GK']);
  const [activeStaging, setActiveStaging] = useState<'gold' | 'purple' | 'black' | null>(null);
  const [activeCandidates, setActiveCandidates] = useState<Player[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Player | null>(null);
  const [acquiredPlayer, setAcquiredPlayer] = useState<Player | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync tickets on open
  useEffect(() => {
    if (isOpen) {
      setUserTickets(getStoredUserTickets());
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle spin visual shuffle
  useEffect(() => {
    let timer: any;
    if (isDraftSpinning) {
      const positions = ['ST', 'CF', 'RW', 'LW', 'CAM', 'CM', 'CDM', 'CB', 'LB', 'RB', 'GK'];
      timer = setInterval(() => {
        setSpinningCards((prev) => [...prev.slice(1), positions[Math.floor(Math.random() * positions.length)]]);
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isDraftSpinning]);

  if (!isOpen) return null;

  const currentDef = REWARD_SCOUT_DEFINITIONS[selectedTicketType];
  const ticketCount = userTickets[selectedTicketType] || 0;

  const handleExecuteScout = () => {
    soundManager.playButtonClick();
    setErrorMessage(null);

    // 1. Strict Server/Client ticket inventory check
    const currentInventory = getStoredUserTickets();
    const available = currentInventory[selectedTicketType] || 0;
    if (available <= 0) {
      soundManager.playError();
      setErrorMessage('チケットを所持していません。プレゼントBOXから受け取ってください。');
      return;
    }

    // 2. Consume ticket safely
    const consumed = consumeUserTicket(selectedTicketType);
    if (!consumed) {
      soundManager.playError();
      setErrorMessage('チケット消費に失敗しました。');
      return;
    }

    // Update tickets in state
    setUserTickets(getStoredUserTickets());

    // 3. Generate Candidates and Staging
    const { candidates, stagingType } = generateScoutCandidates(selectedTicketType);

    // 4. Start Spin Draft Animation (1.8s)
    setIsDraftSpinning(true);
    soundManager.playSpinTick();

    setTimeout(() => {
      setIsDraftSpinning(false);

      // 5. Trigger Staging or direct candidates
      if (stagingType === 'gold') {
        setActiveStaging('gold');
      } else if (stagingType === 'purple') {
        setActiveStaging('purple');
      } else {
        // Normal staging: show candidates directly
        setActiveCandidates(candidates);
        soundManager.playDraftAcquired();
      }

      // Save candidates for reveal
      (window as any).__pendingScoutCandidates = candidates;
    }, 1800);
  };

  const handleStagingEnd = () => {
    setActiveStaging(null);
    const candidates = (window as any).__pendingScoutCandidates || [];
    setActiveCandidates(candidates);
    soundManager.playDraftAcquired();
  };

  const handleConfirmAcquisition = () => {
    if (!selectedCandidate) return;

    soundManager.playFanfare();
    // Safely add to MY TEAM and notify parent
    onAcquirePlayer(selectedCandidate);
    setAcquiredPlayer(selectedCandidate);
    setActiveCandidates([]);
  };

  const handleResetScout = () => {
    setAcquiredPlayer(null);
    setSelectedCandidate(null);
    setActiveCandidates([]);
    setUserTickets(getStoredUserTickets());
  };

  const getScoutIcon = (type: RewardTicketType) => {
    switch (type) {
      case 'legend_guaranteed':
        return <Crown className="w-5 h-5 text-amber-300" />;
      case 'purple_guaranteed':
        return <Sparkles className="w-5 h-5 text-purple-300" />;
      case 'legend_purple_guaranteed':
        return <Award className="w-5 h-5 text-yellow-300" />;
      case 'legend_purple_50':
        return <Zap className="w-5 h-5 text-indigo-300" />;
      case 'legend_50':
        return <Star className="w-5 h-5 text-yellow-400" />;
      case 'legend_20':
        return <Gift className="w-5 h-5 text-amber-400" />;
      case 'purple_50':
        return <Flame className="w-5 h-5 text-purple-400" />;
      case 'purple_20':
        return <Sparkles className="w-5 h-5 text-fuchsia-400" />;
      default:
        return <Award className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div
      id="reward-scout-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto"
    >
      {/* Active Staging Animation Component */}
      {activeStaging && (
        <BlackBallAnimation
          language={language}
          type={activeStaging}
          onAnimationEnd={handleStagingEnd}
        />
      )}

      {/* Main Container */}
      <div
        id="reward-scout-card"
        className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-indigo-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-indigo-500/20 text-slate-100 overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-200 to-indigo-300">
                  REWARD SCOUT
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold uppercase tracking-wider">
                  特別スカウト
                </span>
              </div>
              <p className="text-xs text-slate-400">
                チケットを消費して高レアリティ選手をスカウトし、MY TEAMを強化
              </p>
            </div>
          </div>

          <button
            id="close-scout-modal-btn"
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="my-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SPIN DRAFT RUNNING PHASE */}
        {isDraftSpinning && (
          <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 border-t-amber-400 animate-spin" />
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-indigo-950 to-slate-900 border-2 border-indigo-400 shadow-2xl flex flex-col items-center justify-center gap-1 animate-pulse">
                <RotateCw className="w-8 h-8 text-amber-400 animate-spin" />
                <span className="font-heading font-black text-xs text-indigo-200 tracking-widest">
                  SPINNING
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-heading font-black text-xl sm:text-2xl text-white tracking-wider animate-bounce">
                SPIN DRAFT 回転中...
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                スカウトチケットを消費して最高峰の候補をドラフト選出しています
              </p>
            </div>

            {/* Visual Roulette Slots */}
            <div className="flex items-center gap-2">
              {spinningCards.map((pos, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-indigo-500/40 font-mono font-black text-xs text-amber-300 shadow-md transform -translate-y-1"
                >
                  {pos}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CANDIDATE SELECTION PHASE */}
        {!isDraftSpinning && activeCandidates.length > 0 && !acquiredPlayer && (
          <div className="py-4 space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-mono text-amber-400 font-bold tracking-widest uppercase">
                STEP 2 : SELECT 1 PLAYER
              </span>
              <h4 className="font-heading font-black text-xl sm:text-2xl text-white">
                スカウト候補選手 ({activeCandidates.length}名)
              </h4>
              <p className="text-xs text-slate-300">
                獲得したい選手を1名選択して「チームに獲得する」を押してください
              </p>
            </div>

            {/* Candidates Grid */}
            <div className={`grid gap-3 sm:gap-4 ${
              activeCandidates.length === 5
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
                : 'grid-cols-1 sm:grid-cols-3'
            }`}>
              {activeCandidates.map((candidate) => {
                const isSelected = selectedCandidate?.playerId === candidate.playerId;
                return (
                  <div
                    key={candidate.playerId}
                    onClick={() => {
                      soundManager.playButtonClick();
                      setSelectedCandidate(candidate);
                    }}
                    className={`relative cursor-pointer transition-all transform hover:scale-[1.02] ${
                      isSelected
                        ? 'ring-4 ring-amber-400 rounded-2xl shadow-xl shadow-amber-500/30'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <CandidateCard
                      player={candidate}
                      onSelect={() => setSelectedCandidate(candidate)}
                      language={language}
                      isSelected={isSelected}
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg font-black text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Acquisition Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                {selectedCandidate ? (
                  <span className="text-slate-200">
                    選択中: <strong className="text-amber-300">{selectedCandidate.nameJa || selectedCandidate.playerName}</strong> (OVR {selectedCandidate.rating} / {selectedCandidate.subPosition || selectedCandidate.position})
                  </span>
                ) : (
                  <span>選手を選択してください</span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  disabled={!selectedCandidate}
                  onClick={handleConfirmAcquisition}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-heading font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all ${
                    selectedCandidate
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/30 active:scale-95 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>この選手をMY TEAMに獲得する</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACQUIRED PLAYER CELEBRATION */}
        {acquiredPlayer && (
          <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                PLAYER ACQUIRED TO MY TEAM
              </span>
              <h4 className="font-heading font-black text-2xl sm:text-3xl text-white">
                {acquiredPlayer.nameJa || acquiredPlayer.playerName} を獲得しました！
              </h4>
              <p className="text-xs text-slate-400">
                OVR {acquiredPlayer.rating} · {acquiredPlayer.subPosition || acquiredPlayer.position} · {acquiredPlayer.joiningYear} {acquiredPlayer.clubName}
              </p>
            </div>

            <div className="max-w-xs w-full">
              <CandidateCard
                player={acquiredPlayer}
                onSelect={() => {}}
                language={language}
                isSelected={true}
              />
            </div>

            <div className="pt-3 flex items-center gap-3">
              <button
                onClick={handleResetScout}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-heading font-black text-xs tracking-wider transition-colors shadow-lg cursor-pointer"
              >
                続けてスカウトを行う
              </button>
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-heading font-bold text-xs tracking-wider transition-colors cursor-pointer"
              >
                スカウトを終了
              </button>
            </div>
          </div>
        )}

        {/* SCOUT SELECTOR GRID (When not drafting or choosing candidates) */}
        {!isDraftSpinning && activeCandidates.length === 0 && !acquiredPlayer && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-2">
            {/* Left: Ticket Category Selector */}
            <div className="md:col-span-5 space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {(Object.keys(REWARD_SCOUT_DEFINITIONS) as RewardTicketType[]).map((type) => {
                const def = REWARD_SCOUT_DEFINITIONS[type];
                const count = userTickets[type] || 0;
                const isSelected = selectedTicketType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      soundManager.playButtonClick();
                      setSelectedTicketType(type);
                    }}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-950 to-slate-900 border-indigo-400 shadow-md ring-1 ring-indigo-400'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                        {getScoutIcon(type)}
                      </div>
                      <div className="truncate">
                        <div className="font-heading font-black text-xs text-white truncate">
                          {def.nameJa}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          候補 {def.candidateCount}名
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black shrink-0 ${
                      count > 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {count} 枚
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Selected Scout Detail & Execute Box */}
            <div className="md:col-span-7 bg-slate-950/80 border-2 border-indigo-500/40 rounded-3xl p-5 space-y-4 flex flex-col justify-between shadow-inner">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">
                      SELECTED SCOUT
                    </span>
                    <h4 className="font-heading font-black text-xl text-white">
                      {currentDef.nameJa}
                    </h4>
                  </div>

                  <span className={`px-3 py-1 rounded-xl text-xs font-mono font-black ${
                    ticketCount > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}>
                    所持: {ticketCount} 枚
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentDef.descriptionJa}
                </p>

                {/* Probabilities / Specs */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>登場候補人数:</span>
                    <span className="text-white font-bold">{currentDef.candidateCount} 名 (重複なし)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>レジェンド確率:</span>
                    <span className="text-amber-400 font-bold">
                      {Math.round(currentDef.legendChance * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>紫演出確率 (OVR 98-101):</span>
                    <span className="text-purple-400 font-bold">
                      {Math.round(currentDef.purpleChance * 100)}%
                    </span>
                  </div>
                </div>

                {ticketCount === 0 && (
                  <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>チケットを所持していません。</span>
                    </div>
                    <button
                      onClick={() => {
                        soundManager.playButtonClick();
                        onClose();
                        onOpenGiftBox();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[11px] hover:bg-amber-500/30 border border-amber-500/40 whitespace-nowrap cursor-pointer"
                    >
                      プレゼントBOXへ
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div>
                <button
                  disabled={ticketCount <= 0}
                  onClick={handleExecuteScout}
                  className={`w-full py-3.5 rounded-2xl font-heading font-black text-sm tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all ${
                    ticketCount > 0
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20 active:scale-95 cursor-pointer'
                      : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>スカウトを実行 (チケット1枚消費)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
