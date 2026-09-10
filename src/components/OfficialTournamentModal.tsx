import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  X,
  Users,
  Shield,
  Swords,
  Award,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  Flame,
  ChevronDown,
  Gift,
  HelpCircle,
  Info,
  Medal,
  RefreshCw,
} from 'lucide-react';
import {
  TournamentState,
  TournamentEntry,
  TournamentMatch,
  TournamentStanding,
  TournamentStage,
  GoalPatternType,
} from '../types/tournament';
import { UserTeam, TeamTactics, Player } from '../types';
import {
  fetchAuthoritativeTournamentState,
  initTournamentRealtime,
  enterOfficialTournament,
  updateTournamentTacticsOnline,
  testPopulateParticipants,
  testAdvanceTournamentStage,
  testResetTournament,
  getCurrentTournamentState,
} from '../utils/supabaseTournament';
import {
  getSavedTournamentTactics,
  saveTournamentTactics,
  getStageNameJa,
  INITIAL_TOURNAMENT_FD_CUP_001,
} from '../utils/tournamentEngine';
import { getPlayerHeight } from '../data/playerHeights';
import { soundManager } from '../utils/audio';

interface OfficialTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: {
    userId: string;
    username: string;
    team: UserTeam | null;
    tactics: TeamTactics;
    defenseSquad?: UserTeam;
  };
  onOpenGiftBox?: () => void;
}

type TabType = 'overview' | 'tactics' | 'groups' | 'knockout' | 'matches' | 'rewards' | 'test';

export const OfficialTournamentModal: React.FC<OfficialTournamentModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  onOpenGiftBox,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [tournamentState, setTournamentState] = useState<TournamentState>(() => getCurrentTournamentState());
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [entrySuccess, setEntrySuccess] = useState<string | null>(null);

  // Tournament-specific tactical state
  const [tactics, setTactics] = useState<TeamTactics>(() => getSavedTournamentTactics());
  const [tacticsSavedNotice, setTacticsSavedNotice] = useState(false);

  // Dev test runner state
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testNotice, setTestNotice] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Realtime subscription + immediate authoritative sync
  useEffect(() => {
    if (!isOpen) return;

    // Immediately fetch authoritative server state
    fetchAuthoritativeTournamentState().then((state) => {
      if (state) setTournamentState(state);
    });

    const unsubscribe = initTournamentRealtime((state) => {
      setTournamentState(state);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    soundManager.playButtonClick();
    try {
      const state = await fetchAuthoritativeTournamentState();
      if (state) setTournamentState(state);
    } catch (e) {
      console.warn('Manual refresh failed', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Sync tactics when opened or entry found
  useEffect(() => {
    if (!isOpen || !tournamentState || !currentUserProfile?.userId) return;
    const entriesList = Array.isArray(tournamentState?.entries) ? tournamentState.entries : [];
    const myEntry = entriesList.find((e) => e?.userId === currentUserProfile.userId);
    if (myEntry && myEntry.tacticsSnapshot) {
      setTactics(myEntry.tacticsSnapshot);
    }
  }, [isOpen, tournamentState, currentUserProfile?.userId]);

  if (!isOpen) return null;

  const currentDef = tournamentState?.definition || INITIAL_TOURNAMENT_FD_CUP_001;
  const entries = Array.isArray(tournamentState?.entries) ? tournamentState.entries : [];
  const myEntry = entries.find((e) => e?.userId === currentUserProfile?.userId);
  const isEntered = Boolean(myEntry);

  const squadPlayers = Array.isArray(currentUserProfile?.team?.players) ? currentUserProfile.team.players : [];
  const hasElevenPlayers = squadPlayers.length === 11;

  const currentTeamOvr = useMemo(() => {
    if (!squadPlayers.length) return 85;
    return Math.round(squadPlayers.reduce((s, p) => s + (p?.rating || 85), 0) / squadPlayers.length);
  }, [squadPlayers]);

  // Formatting date string in JST
  const scheduleText = {
    reg: '2026年9月8日(火) 00:00 〜 9月13日(日) 23:59 JST',
    match: '2026年9月14日(月) 00:00 JST 〜 順次シミュレーション',
  };

  const getStatusBadge = () => {
    const status = currentDef?.status || 'REGISTRATION';
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700">準備中</span>;
      case 'REGISTRATION':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 animate-pulse">エントリー受付中</span>;
      case 'LOCKED':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">組み合わせ抽選中</span>;
      case 'GROUP_STAGE':
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">予選進行中</span>;
      case 'KNOCKOUT':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">決勝T進行中</span>;
      case 'FINISHED':
      case 'REWARDING':
      case 'COMPLETED':
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black">大会終了</span>;
    }
  };

  const handleEntrySubmit = async () => {
    if (!currentUserProfile?.team || !hasElevenPlayers) {
      setEntryError('公式大会に参加するにはMY TEAMで11人の選手を揃えてください。');
      return;
    }
    setIsSubmittingEntry(true);
    setEntryError(null);
    setEntrySuccess(null);

    soundManager.playButtonClick();

    try {
      const res = await enterOfficialTournament({
        userId: currentUserProfile.userId,
        displayName: currentUserProfile.username || 'Manager',
        teamSnapshot: currentUserProfile.team,
        tacticsSnapshot: tactics,
        defensiveSquadSnapshot: currentUserProfile.defenseSquad,
      });

      if (res.success) {
        soundManager.playVictory();
        setEntrySuccess('🎉 公式大会へのエントリーが完了しました！');
        fetchAuthoritativeTournamentState().then((s) => {
          if (s) setTournamentState(s);
        });
      } else {
        setEntryError(res.error || 'エントリーに失敗しました。');
      }
    } catch (e: any) {
      setEntryError(e.message || '通信エラーが発生しました。');
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  const handleSaveTactics = async () => {
    soundManager.playButtonClick();
    saveTournamentTactics(tactics);
    if (currentUserProfile?.userId) {
      await updateTournamentTacticsOnline(currentUserProfile.userId, tactics);
    }
    setTacticsSavedNotice(true);
    setTimeout(() => setTacticsSavedNotice(false), 2500);
  };

  // Dev simulator actions
  const handleTestPopulate = async (count: number) => {
    setIsTestRunning(true);
    setTestNotice('テスト参加者を生成中...');
    soundManager.playButtonClick();
    try {
      await testPopulateParticipants(count, currentUserProfile);
      setTestNotice(`参加者 ${count}人を生成しました`);
      setTimeout(() => setTestNotice(null), 2500);
    } catch (e: any) {
      setTestNotice('生成失敗');
    } finally {
      setIsTestRunning(false);
    }
  };

  const handleTestAdvance = async () => {
    setIsTestRunning(true);
    setTestNotice('大会ステージを進行中...');
    soundManager.playButtonClick();
    try {
      await testAdvanceTournamentStage();
      setTestNotice('大会ステージを進行しました');
      setTimeout(() => setTestNotice(null), 2500);
    } catch (e: any) {
      setTestNotice('進行失敗');
    } finally {
      setIsTestRunning(false);
    }
  };

  const handleTestReset = async () => {
    setIsTestRunning(true);
    setTestNotice('大会データを初期化中...');
    soundManager.playButtonClick();
    try {
      await testResetTournament();
      setTestNotice('大会データを初期化しました');
      setTimeout(() => setTestNotice(null), 2500);
    } catch (e: any) {
      setTestNotice('初期化失敗');
    } finally {
      setIsTestRunning(false);
    }
  };

  return (
    <div
      id="modal-official-tournament"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden"
    >
      <div className="relative w-full max-w-4xl h-[90vh] min-h-[520px] max-h-[92vh] bg-slate-950 border border-amber-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800/80 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-heading font-black text-white tracking-wide">
                  第1回 FOOTBALL DRAFT CUP
                </h2>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-sm">
                  お試し大会
                </span>
                {getStatusBadge()}
              </div>
              <p className="text-xs text-slate-400 font-sans">
                戦術 vs 戦術による完全自動シミュレーション公式大会
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-tournament-refresh"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 px-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="大会情報・エントリー者を最新状態に同期"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? '同期中...' : '最新化'}</span>
            </button>
            <button
              id="btn-tournament-close"
              onClick={() => {
                soundManager.playButtonClick();
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 border-b border-slate-800 bg-slate-900/60 overflow-x-auto no-scrollbar shrink-0 gap-1 sm:gap-2">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('overview');
            }}
            className={`px-3 py-3 text-xs sm:text-sm font-heading font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>概要・エントリー</span>
            {entries.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {entries.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('tactics');
            }}
            className={`px-3 py-3 text-xs sm:text-sm font-heading font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'tactics'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>大会戦術</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('groups');
            }}
            className={`px-3 py-3 text-xs sm:text-sm font-heading font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'groups'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>対戦表・順位</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('knockout');
            }}
            className={`px-3 py-3 text-xs sm:text-sm font-heading font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'knockout'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>決勝トーナメント</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('matches');
            }}
            className={`px-3 py-3 text-xs sm:text-sm font-heading font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'matches'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>試合結果</span>
            {(tournamentState?.matches?.length || 0) > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {tournamentState?.matches?.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('rewards');
            }}
            className={`px-3 py-3 text-xs sm:text-sm font-heading font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'rewards'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>報酬</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('test');
            }}
            className={`px-3 py-3 text-xs sm:text-sm font-heading font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'test'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-purple-400/70 hover:text-purple-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>検証ツール</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW & REGISTRATION */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Schedule Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Calendar className="w-4 h-4" />
                    <span>エントリー期間</span>
                  </span>
                  <span className="font-mono">{scheduleText.reg}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-800/80">
                  <span className="flex items-center gap-1.5 font-bold text-teal-400">
                    <Clock className="w-4 h-4" />
                    <span>大会対戦期間</span>
                  </span>
                  <span className="font-mono">{scheduleText.match}</span>
                </div>
              </div>

              {/* User Entry Action Card */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-heading font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>エントリーステータス</span>
                  </h3>
                  <div className="text-xs text-slate-400">
                    現在の参加人数:{' '}
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {entries.length}人
                    </span>
                  </div>
                </div>

                {isEntered ? (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>エントリー完了</span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            登録OVR: {myEntry?.teamOvr}
                          </span>
                          {currentTeamOvr !== myEntry?.teamOvr && (
                            <span className="text-xs font-mono text-amber-300">
                              (現在スカッド: OVR {currentTeamOvr})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {myEntry?.displayName} / フォーメーション: {myEntry?.teamSnapshot?.formation || '4-3-3'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        id="btn-re-sync-tournament-entry"
                        onClick={handleEntrySubmit}
                        disabled={!hasElevenPlayers || isSubmittingEntry}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        title="選手の強化や編成変更を大会登録データに反映します"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSubmittingEntry ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
                        <span>{isSubmittingEntry ? '更新中...' : '登録スカッドを最新化'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>登録スカッド: {currentUserProfile?.username || 'You'}</span>
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                              hasElevenPlayers
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            選手数: {squadPlayers.length}/11人
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {hasElevenPlayers
                            ? '11人の選手が揃っています。このスカッドでエントリー可能です。'
                            : '大会参加にはMY TEAMで11人の選手を揃える必要があります。'}
                        </div>
                      </div>

                      <button
                        id="btn-submit-tournament-entry"
                        onClick={handleEntrySubmit}
                        disabled={!hasElevenPlayers || isSubmittingEntry}
                        className={`px-5 py-2.5 rounded-xl font-heading font-bold text-sm tracking-wide transition-all shadow-md flex items-center gap-2 shrink-0 ${
                          hasElevenPlayers && !isSubmittingEntry
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Trophy className="w-4 h-4" />
                        <span>{isSubmittingEntry ? 'エントリー中...' : '大会にエントリー'}</span>
                      </button>
                    </div>

                    {entryError && (
                      <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{entryError}</span>
                      </div>
                    )}
                    {entrySuccess && (
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>{entrySuccess}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tournament Format & Rules Explanation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>大会形式 (自動決定)</span>
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    <li>
                      <span className="font-bold text-white">4〜8人の場合:</span> 全員による総当たりリーグ戦
                    </li>
                    <li>
                      <span className="font-bold text-white">9人以上の場合:</span> グループステージ（各グループ2位まで決勝進出）＋決勝トーナメント
                    </li>
                    <li>
                      <span className="font-bold text-white">勝点システム:</span> 勝ち 3点 / 引き分け 1点 / 負け 0点
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>「戦術 vs 戦術」シミュレーション</span>
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    <li>OVRの高さだけでなく、戦術相性・フォーメーション・選手特徴で勝敗が変化。</li>
                    <li>低OVRでも戦術で高OVRチームに勝利可能。</li>
                    <li>多彩なゴールパターン（クロス、スルーパス、ミドル、カウンター、こぼれ球等）。</li>
                  </ul>
                </div>
              </div>

              {/* Entrants List */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>エントリー者一覧 ({entries.length}人)</span>
                  </h4>
                  <button
                    id="btn-refresh-tournament-entrants"
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="最新のエントリー者状況をサーバーと同期します"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
                    <span>{isRefreshing ? '同期中...' : '最新情報に更新'}</span>
                  </button>
                </div>

                {entries.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    現在エントリーしているユーザーはいません。一番乗りでエントリーしましょう！
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {entries.map((ent, idx) => (
                      <div
                        key={ent.userId}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          ent.userId === currentUserProfile?.userId
                            ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                            : 'bg-slate-950/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-[10px] font-mono text-slate-500 font-bold w-4">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold truncate">
                            {ent.displayName}
                          </span>
                          {ent.userId === currentUserProfile?.userId && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
                          OVR {ent.teamOvr}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TOURNAMENT TACTICS */}
          {activeTab === 'tactics' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>公式大会 専用戦術セッティング</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    通常の戦術対戦とは独立した「公式大会用」の戦術です。試合前まで自由に変更できます。
                  </p>
                </div>
                <button
                  id="btn-save-tournament-tactics"
                  onClick={handleSaveTactics}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-heading font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all"
                >
                  戦術を保存
                </button>
              </div>

              {tacticsSavedNotice && (
                <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle className="w-4 h-4" />
                  <span>大会戦術を保存・同期しました！</span>
                </div>
              )}

              {/* Tactic Selectors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Attack Tactic */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-amber-400">攻撃戦術 (Attack Tactic)</label>
                  <select
                    value={tactics.attackTactic}
                    onChange={(e) => setTactics({ ...tactics, attackTactic: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="POSSESSION">ポゼッション (ボール保持・支配)</option>
                    <option value="COUNTER">カウンター (高速速攻)</option>
                    <option value="TIKI_TAKA">ティキ・タカ (ショートパス連携)</option>
                    <option value="CROSS_GAME">クロスゲー (サイド攻撃＆制空権)</option>
                    <option value="SHORT_PASS">ショートパス (密集突破)</option>
                    <option value="LONG_COUNTER">ロングカウンター (ロングボール起点)</option>
                    <option value="CENTRAL_ATTACK">中央突破 (中央集約アタック)</option>
                    <option value="WIDE_ATTACK">ワイド攻撃 (サイドラック展開)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    相手守備戦術との相性で得点期待値が変動します。
                  </p>
                </div>

                {/* 2. Defense Tactic */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-teal-400">守備戦術 (Defense Tactic)</label>
                  <select
                    value={tactics.defenseTactic}
                    onChange={(e) => setTactics({ ...tactics, defenseTactic: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:border-teal-400 focus:outline-none"
                  >
                    <option value="MID_BLOCK">ミドルブロック (バランス型中盤封鎖)</option>
                    <option value="HIGH_PRESS">ハイプレス (前線積極プレス)</option>
                    <option value="GEGENPRESSING">ゲーゲンプレス (即時ボール奪還)</option>
                    <option value="CATENACCIO">カテナチオ (堅守速攻・鍵穴封鎖)</option>
                    <option value="RETREAT">リトリート (自陣撤退防衛)</option>
                    <option value="SWARM_DEFENSE">スウォーム守備 (数的優位囲い込み)</option>
                    <option value="ZONE_DEFENSE">ゾーンディフェンス (空間統制)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    相手攻撃戦術のスペースを遮断し失点を抑えます。
                  </p>
                </div>

                {/* 3. Attack Direction */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300">攻撃方向 (Attack Direction)</label>
                  <select
                    value={tactics.attackDirection}
                    onChange={(e) => setTactics({ ...tactics, attackDirection: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="BALANCED">バランス (両翼・中央を均等配分)</option>
                    <option value="LEFT">左サイド偏重</option>
                    <option value="RIGHT">右サイド偏重</option>
                    <option value="CENTER">中央集約</option>
                  </select>
                </div>

                {/* 4. Press Intensity */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-300">プレスの強度 (Press Intensity)</label>
                  <select
                    value={tactics.pressIntensity}
                    onChange={(e) => setTactics({ ...tactics, pressIntensity: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="AGGRESSIVE">アグレッシブ (積極奪取・スタミナ消費大)</option>
                    <option value="BALANCED">ノーマル (標準)</option>
                    <option value="CONSERVATIVE">セーフティ (無理に飛び込まず陣形維持)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GROUPS / ROUND ROBIN */}
          {activeTab === 'groups' && (
            <div className="space-y-6">
              {(tournamentState?.standings?.length || 0) === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 space-y-2">
                  <Shield className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white">まだ対戦表は生成されていません</div>
                  <div className="text-xs">
                    エントリー受付終了（2026年9月13日 23:59 JST）後、自動でグループ分けと対戦がシミュレーションされます。
                  </div>
                  <div className="text-[11px] text-purple-400 pt-2">
                    ※開発・検証中の動作確認は「検証ツール」タブから即座にテスト実行できます。
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Render standings tables */}
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-mono">
                          <th className="py-2 px-2">順位</th>
                          <th className="py-2 px-2">マネージャー / チーム</th>
                          <th className="py-2 px-2 text-center">OVR</th>
                          <th className="py-2 px-2 text-center">試合</th>
                          <th className="py-2 px-2 text-center">勝</th>
                          <th className="py-2 px-2 text-center">分</th>
                          <th className="py-2 px-2 text-center">敗</th>
                          <th className="py-2 px-2 text-center">得点</th>
                          <th className="py-2 px-2 text-center">失点</th>
                          <th className="py-2 px-2 text-center">得失差</th>
                          <th className="py-2 px-2 text-center font-bold text-amber-400">勝点</th>
                          <th className="py-2 px-2 text-center">ステータス</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {tournamentState?.standings?.map((st) => (
                          <tr
                            key={st.userId}
                            className={`${
                              st.userId === currentUserProfile?.userId
                                ? 'bg-amber-950/30 text-amber-300 font-bold'
                                : 'text-slate-300 hover:bg-slate-850/50'
                            }`}
                          >
                            <td className="py-2.5 px-2 font-mono font-bold">
                              {st.rank === 1 ? '🥇 1' : st.rank === 2 ? '🥈 2' : st.rank === 3 ? '🥉 3' : st.rank}
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-1.5">
                                <span>{st.displayName}</span>
                                {st.userId === currentUserProfile?.userId && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                                    YOU
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono">{st.teamOvr}</td>
                            <td className="py-2.5 px-2 text-center font-mono">{st.matchesPlayed}</td>
                            <td className="py-2.5 px-2 text-center font-mono">{st.wins}</td>
                            <td className="py-2.5 px-2 text-center font-mono">{st.draws}</td>
                            <td className="py-2.5 px-2 text-center font-mono">{st.losses}</td>
                            <td className="py-2.5 px-2 text-center font-mono text-emerald-400">{st.goalsFor}</td>
                            <td className="py-2.5 px-2 text-center font-mono text-rose-400">{st.goalsAgainst}</td>
                            <td className="py-2.5 px-2 text-center font-mono">
                              {st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono font-black text-amber-400 text-sm">
                              {st.points}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {st.isQualified ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                  🟢 決勝進出
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KNOCKOUT BRACKET */}
          {activeTab === 'knockout' && (
            <div className="space-y-6">
              {!tournamentState?.knockoutBracket ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 space-y-2">
                  <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-sm font-bold text-white">決勝トーナメントはまだ組まれていません</div>
                  <div className="text-xs">
                    予選ステージ上位進出者によって決勝トーナメントが展開されます。
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Champion Podium Card */}
                  {tournamentState?.knockoutBracket?.champion && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/50 shadow-xl text-center space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow-md">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>🏆 第1回 FD CUP チャンピオン決定！</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-heading font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                        {tournamentState.knockoutBracket.champion.displayName || 'Champion'}
                      </h3>
                      <p className="text-xs text-slate-300">
                        戦術: {tournamentState.knockoutBracket.champion.tacticsSnapshot?.attackTactic || 'BALANCED'} / チームOVR {tournamentState.knockoutBracket.champion.teamOvr || 85}
                      </p>
                    </div>
                  )}

                  {/* Knockout Matches Tree */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Final */}
                    {tournamentState?.knockoutBracket?.finalMatch && (
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                          <span>🏆 決勝戦 (FINAL)</span>
                          <span className="text-[10px] text-slate-400">90分 終了</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                            <span className="text-xs font-bold text-white">
                              {tournamentState.knockoutBracket.finalMatch.homeDisplayName || 'チームA'}
                            </span>
                            <span className="text-sm font-mono font-black text-amber-400">
                              {tournamentState.knockoutBracket.finalMatch.homeScore ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                            <span className="text-xs font-bold text-white">
                              {tournamentState.knockoutBracket.finalMatch.awayDisplayName || 'チームB'}
                            </span>
                            <span className="text-sm font-mono font-black text-amber-400">
                              {tournamentState.knockoutBracket.finalMatch.awayScore ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3rd Place Match */}
                    {tournamentState?.knockoutBracket?.thirdPlaceMatch && (
                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span>🥉 3位決定戦</span>
                          <span className="text-[10px] text-slate-400">90分 終了</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                            <span className="text-xs font-bold text-white">
                              {tournamentState.knockoutBracket.thirdPlaceMatch.homeDisplayName || 'チームC'}
                            </span>
                            <span className="text-sm font-mono font-bold text-slate-200">
                              {tournamentState.knockoutBracket.thirdPlaceMatch.homeScore ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                            <span className="text-xs font-bold text-white">
                              {tournamentState.knockoutBracket.thirdPlaceMatch.awayDisplayName || 'チームD'}
                            </span>
                            <span className="text-sm font-mono font-bold text-slate-200">
                              {tournamentState.knockoutBracket.thirdPlaceMatch.awayScore ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MATCHES & RESULTS */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              {(tournamentState?.matches?.length || 0) === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400">
                  まだ試合は行われていません。
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tournamentState?.matches?.map((m) => (
                    <div
                      key={m.matchId}
                      onClick={() => setSelectedMatch(m)}
                      className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {m.stageNameJa}
                        </span>
                        <div className="text-xs sm:text-sm font-bold text-white">
                          <span>{m.homeDisplayName}</span>
                          <span className="mx-2 font-mono text-amber-400">
                            {m.homeScore} - {m.awayScore}
                          </span>
                          <span>{m.awayDisplayName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 group-hover:text-amber-400 transition-colors">
                          戦評を見る
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Match Details Modal Drawer */}
              {selectedMatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
                  <div className="w-full max-w-lg bg-slate-950 border border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Swords className="w-4 h-4 text-amber-400" />
                        <span>試合詳細 & 戦術分析</span>
                      </h4>
                      <button
                        onClick={() => setSelectedMatch(null)}
                        className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-center py-2 space-y-1">
                      <div className="text-xs font-mono text-slate-400">{selectedMatch.stageNameJa}</div>
                      <div className="text-lg font-black text-white flex items-center justify-center gap-3">
                        <span>{selectedMatch.homeDisplayName}</span>
                        <span className="text-2xl font-mono text-amber-400">
                          {selectedMatch.homeScore} - {selectedMatch.awayScore}
                        </span>
                        <span>{selectedMatch.awayDisplayName}</span>
                      </div>
                    </div>

                    {/* Timeline Events */}
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <h5 className="text-[11px] font-bold text-slate-300">タイムライン & ゴール詳細</h5>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {(selectedMatch.events || []).map((ev, i) => (
                          <div key={i} className="text-xs flex items-start gap-2 text-slate-300">
                            <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 w-8">
                              {ev.minute}'
                            </span>
                            <span className="leading-tight">{ev.textJa}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tactical Analysis */}
                    {selectedMatch.tacticalAnalysisJa && (
                      <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                        <h5 className="text-[11px] font-bold text-indigo-300">戦術マッチアップ分析</h5>
                        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                          {selectedMatch.tacticalAnalysisJa}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: RANKINGS & REWARDS */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>公式大会 順位報酬一覧</span>
                  </h3>
                  {onOpenGiftBox && (
                    <button
                      onClick={() => {
                        soundManager.playButtonClick();
                        onClose();
                        onOpenGiftBox();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>BOXを確認</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1st Place */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/50 to-slate-950 border border-amber-500/40 text-center space-y-2">
                    <div className="text-2xl">🥇</div>
                    <div className="text-xs font-bold text-amber-300">優勝 (1位)</div>
                    <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-black">
                      レジェンド確定スカウト ×2
                    </div>
                  </div>

                  {/* 2nd Place */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 text-center space-y-2">
                    <div className="text-2xl">🥈</div>
                    <div className="text-xs font-bold text-slate-300">準優勝 (2位)</div>
                    <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-black">
                      レジェンド確定スカウト ×1
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/50 to-slate-950 border border-purple-500/40 text-center space-y-2">
                    <div className="text-2xl">🥉</div>
                    <div className="text-xs font-bold text-purple-300">第3位</div>
                    <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs font-black">
                      紫確定スカウト ×1
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div className="font-bold text-slate-300">【報酬配布について】</div>
                  <div>・大会終了時、順位確定後にサーバー側で自動的にプレゼントボックスへ配布されます。</div>
                  <div>・獲得した確定チケットは「報酬スカウト」画面で使用できます。</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DEV / TEST SIMULATOR (Requirement 35) */}
          {activeTab === 'test' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-purple-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>お試し大会 開発・検証シミュレーター</span>
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    TEST RUNNER
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  大会の進行（参加者生成、総当たり／グループステージ、決勝トーナメント、報酬配布）をいつでもワンタップでシミュレーション・検証できます。
                </p>

                {testNotice && (
                  <div className="p-3 rounded-xl bg-purple-900/50 border border-purple-400/50 text-purple-200 text-xs flex items-center gap-2 animate-fadeIn">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{testNotice}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Generate 8 participants (Round-Robin) */}
                  <button
                    onClick={() => handleTestPopulate(8)}
                    disabled={isTestRunning}
                    className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-left space-y-1 transition-all"
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>参加者8人を生成 (総当たり戦)</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      8チームを生成して総当たりリーグ戦を準備
                    </div>
                  </button>

                  {/* 2. Generate 12 participants (Groups + Knockout) */}
                  <button
                    onClick={() => handleTestPopulate(12)}
                    disabled={isTestRunning}
                    className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-left space-y-1 transition-all"
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      <span>参加者12人を生成 (グループ予選)</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      グループステージから決勝T進出のフローを検証
                    </div>
                  </button>

                  {/* 3. Advance Stage */}
                  <button
                    onClick={handleTestAdvance}
                    disabled={isTestRunning}
                    className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950 to-purple-950 hover:from-indigo-900 hover:to-purple-900 border border-indigo-500/50 text-left space-y-1 transition-all"
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-indigo-300" />
                      <span>大会ステージを進める (試合実行・決勝T・報酬)</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      試合結果をシミュレートし、優勝者を決定して報酬を自動配布
                    </div>
                  </button>

                  {/* 4. Reset Tournament */}
                  <button
                    onClick={handleTestReset}
                    disabled={isTestRunning}
                    className="p-3.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/30 text-left space-y-1 transition-all"
                  >
                    <div className="text-xs font-bold text-rose-300 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-rose-400" />
                      <span>大会データを初期化 (リセット)</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      エントリー受付中の初期状態に戻します
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
