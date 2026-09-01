import React, { useState, useEffect, useRef } from 'react';
import {
  UserTeam,
  Language,
  BetaUserProfile,
  BetaMatchRecord,
  BetaMatchEvent,
  TeamTactics,
  AttackTactics,
  DefenseTactics,
} from '../types';
import {
  getCurrentUserProfile,
  saveRegisteredUser,
  getRegisteredUsers,
  searchUsersByUsername,
  getMyMatchHistory,
  saveMyMatchRecord,
  computePast10Standings,
  simulateOVRMatch,
  simulateTacticalMatchHalf,
  DEFAULT_TACTICS,
} from '../utils/pvpEngine';
import { soundManager } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Swords,
  Shield,
  Zap,
  Users,
  Trophy,
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sliders,
  ChevronRight,
  Flame,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';

interface PvPViewProps {
  activeTeam: UserTeam;
  teams?: UserTeam[];
  language: Language;
  onBackToDraft?: () => void;
  onNavigate?: (tab: 'home' | 'draft' | 'team' | 'history' | 'pvp') => void;
}

type PvPTab = 'lobby' | 'tactics' | 'friends' | 'standings' | 'history';

export const PvPView: React.FC<PvPViewProps> = ({
  activeTeam,
  teams = [activeTeam],
  language,
  onBackToDraft,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<PvPTab>('lobby');

  // User Profile State
  const [userProfile, setUserProfile] = useState<BetaUserProfile>(() =>
    getCurrentUserProfile(activeTeam, teams)
  );
  const [usernameInput, setUsernameInput] = useState(userProfile.username || '');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // Tactics State
  const [tactics, setTactics] = useState<TeamTactics>(userProfile.tactics || DEFAULT_TACTICS);

  // Community Users & Friends
  const [communityUsers, setCommunityUsers] = useState<BetaUserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BetaUserProfile[]>([]);

  // Pre-Match Confirmation & Squad Selection State
  const [isPreMatchOpen, setIsPreMatchOpen] = useState<boolean>(false);
  const [preMatchOpponent, setPreMatchOpponent] = useState<BetaUserProfile | null>(null);
  const [preMatchMode, setPreMatchMode] = useState<'OVR' | 'TACTICAL'>('OVR');
  const [selectedPlayingSquadId, setSelectedPlayingSquadId] = useState<string>(activeTeam.teamId);

  // Derive the actively selected playing squad
  const activePlayingSquad =
    teams.find((t) => t.teamId === selectedPlayingSquadId) || activeTeam;

  // Match Simulation State
  const [activeOpponent, setActiveOpponent] = useState<BetaUserProfile | null>(null);
  const [currentPlayingSquad, setCurrentPlayingSquad] = useState<UserTeam>(activeTeam);
  const [matchMode, setMatchMode] = useState<'OVR' | 'TACTICAL' | null>(null);
  const [isMatchRunning, setIsMatchRunning] = useState(false);
  const [matchPhase, setMatchPhase] = useState<'1st_half' | 'halftime' | '2nd_half' | 'finished'>('1st_half');
  const [matchTimerSeconds, setMatchTimerSeconds] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<[number, number]>([0, 0]);
  const [liveEvents, setLiveEvents] = useState<BetaMatchEvent[]>([]);
  const [finalMatchRecord, setFinalMatchRecord] = useState<BetaMatchRecord | null>(null);

  // Match History & Standings
  const [matchHistory, setMatchHistory] = useState<BetaMatchRecord[]>([]);

  // Halftime modified tactics
  const [halftimeTactics, setHalftimeTactics] = useState<TeamTactics>(tactics);

  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Refresh user list and match history
    const allUsers = getRegisteredUsers();
    setCommunityUsers(allUsers.filter((u) => u.userId !== userProfile.userId));
    const hist = getMyMatchHistory();
    setMatchHistory(hist);
  }, [userProfile.userId]);

  const handleSaveUsername = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(false);

    const updatedProfile: BetaUserProfile = {
      ...userProfile,
      username: usernameInput.trim(),
      team: activePlayingSquad,
      tactics,
    };

    const res = saveRegisteredUser(updatedProfile);
    if (!res.success) {
      setUsernameError(res.error || 'Failed to save username.');
    } else {
      setUserProfile(updatedProfile);
      setUsernameSuccess(true);
      soundManager.playDraftAcquired();
      setTimeout(() => setUsernameSuccess(false), 3000);
    }
  };

  const handleSaveTactics = (newTactics: TeamTactics) => {
    setTactics(newTactics);
    setHalftimeTactics(newTactics);
    const updatedProfile: BetaUserProfile = {
      ...userProfile,
      tactics: newTactics,
      team: activePlayingSquad,
    };
    saveRegisteredUser(updatedProfile);
    setUserProfile(updatedProfile);
    soundManager.playButtonClick();
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const results = searchUsersByUsername(q, userProfile.userId);
    setSearchResults(results);
  };

  /**
   * Open Pre-Match Confirmation Screen (Feature 28, 30, 31, 32)
   */
  const handleOpenPreMatch = (opponent: BetaUserProfile, mode: 'OVR' | 'TACTICAL') => {
    if (!userProfile.username) {
      setActiveTab('lobby');
      setUsernameError('対戦を開始する前にユーザーネームを設定してください。');
      return;
    }
    soundManager.playButtonClick();
    setPreMatchOpponent(opponent);
    setPreMatchMode(mode);
    setIsPreMatchOpen(true);
  };

  // ─────────────────────────────────────────────────────────────
  // OVR MATCH (30s simulation with Selected Playing Squad)
  // ─────────────────────────────────────────────────────────────
  const startOVRMatch = (opponent: BetaUserProfile, playingSquad: UserTeam) => {
    soundManager.playButtonClick();
    setIsPreMatchOpen(false);
    setActiveOpponent(opponent);
    setCurrentPlayingSquad(playingSquad);
    setMatchMode('OVR');
    setIsMatchRunning(true);
    setMatchPhase('1st_half');
    setMatchTimerSeconds(0);
    setCurrentScore([0, 0]);
    setLiveEvents([]);
    setFinalMatchRecord(null);

    const { record, events } = simulateOVRMatch(userProfile, opponent, playingSquad);
    setFinalMatchRecord(record);

    let sec = 0;
    simulationIntervalRef.current = setInterval(() => {
      sec++;
      setMatchTimerSeconds(sec);

      // Event triggers at 3s, 8s, 15s, 23s
      if (sec === 3) {
        setLiveEvents((prev) => [...prev, events[0]]);
      } else if (sec === 8 && events[1]) {
        setLiveEvents((prev) => [...prev, events[1]]);
      } else if (sec === 15 && events[2]) {
        setLiveEvents((prev) => [...prev, events[2]]);
        if (events[2].isChallengerGoal) setCurrentScore((s) => [s[0] + 1, s[1]]);
        if (events[2].isOpponentGoal) setCurrentScore((s) => [s[0], s[1] + 1]);
        soundManager.playGoldenFanfare();
      } else if (sec === 23 && events[3]) {
        setLiveEvents((prev) => [...prev, events[3]]);
        if (events[3].isChallengerGoal) setCurrentScore((s) => [s[0] + 1, s[1]]);
        if (events[3].isOpponentGoal) setCurrentScore((s) => [s[0], s[1] + 1]);
        soundManager.playGoldenFanfare();
      } else if (sec >= 30) {
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        setMatchPhase('finished');
        setIsMatchRunning(false);
        setLiveEvents((prev) => [...prev, events[events.length - 1]]);
        saveMyMatchRecord(record);
        setMatchHistory((prev) => [record, ...prev]);

        if (record.result === 'WIN') {
          soundManager.playTeamCompleted();
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
      }
    }, 1000);
  };

  // ─────────────────────────────────────────────────────────────
  // TACTICAL MATCH (40s 1st Half -> Halftime -> 40s 2nd Half)
  // ─────────────────────────────────────────────────────────────
  const startTacticalMatch = (opponent: BetaUserProfile, playingSquad: UserTeam) => {
    soundManager.playButtonClick();
    setIsPreMatchOpen(false);
    setActiveOpponent(opponent);
    setCurrentPlayingSquad(playingSquad);
    setMatchMode('TACTICAL');
    setIsMatchRunning(true);
    setMatchPhase('1st_half');
    setMatchTimerSeconds(0);
    setCurrentScore([0, 0]);
    setLiveEvents([]);
    setFinalMatchRecord(null);

    const firstHalfSim = simulateTacticalMatchHalf(
      1,
      userProfile,
      opponent,
      [0, 0],
      tactics,
      playingSquad
    );

    let sec = 0;
    simulationIntervalRef.current = setInterval(() => {
      sec++;
      setMatchTimerSeconds(sec);

      if (sec === 3) {
        setLiveEvents((prev) => [...prev, firstHalfSim.events[0]]);
      } else if (sec === 15) {
        setLiveEvents((prev) => [...prev, firstHalfSim.events[1]]);
      } else if (sec === 28 && firstHalfSim.events[2]) {
        setLiveEvents((prev) => [...prev, firstHalfSim.events[2]]);
        setCurrentScore(firstHalfSim.halfScore);
        if (firstHalfSim.events[2].isChallengerGoal || firstHalfSim.events[2].isOpponentGoal) {
          soundManager.playGoldenFanfare();
        }
      } else if (sec >= 40) {
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        setMatchPhase('halftime');
        setIsMatchRunning(false);
        setLiveEvents((prev) => [
          ...prev,
          firstHalfSim.events[firstHalfSim.events.length - 1],
        ]);
        soundManager.playSlotStop();
      }
    }, 1000);
  };

  const resumeSecondHalf = () => {
    if (!activeOpponent) return;
    soundManager.playButtonClick();
    setIsMatchRunning(true);
    setMatchPhase('2nd_half');
    setMatchTimerSeconds(0);

    const secondHalfSim = simulateTacticalMatchHalf(
      2,
      userProfile,
      activeOpponent,
      currentScore,
      halftimeTactics,
      currentPlayingSquad
    );

    let sec = 0;
    simulationIntervalRef.current = setInterval(() => {
      sec++;
      setMatchTimerSeconds(sec);

      if (sec === 3) {
        setLiveEvents((prev) => [...prev, secondHalfSim.events[0]]);
      } else if (sec === 15) {
        setLiveEvents((prev) => [...prev, secondHalfSim.events[1]]);
      } else if (sec === 28 && secondHalfSim.events[2]) {
        setLiveEvents((prev) => [...prev, secondHalfSim.events[2]]);
        setCurrentScore(secondHalfSim.halfScore);
        if (secondHalfSim.events[2].isChallengerGoal || secondHalfSim.events[2].isOpponentGoal) {
          soundManager.playGoldenFanfare();
        }
      } else if (sec >= 40) {
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        setMatchPhase('finished');
        setIsMatchRunning(false);
        setLiveEvents((prev) => [
          ...prev,
          secondHalfSim.events[secondHalfSim.events.length - 1],
        ]);

        const fullScore = secondHalfSim.halfScore;
        const res: 'WIN' | 'DRAW' | 'LOSS' =
          fullScore[0] > fullScore[1] ? 'WIN' : fullScore[0] === fullScore[1] ? 'DRAW' : 'LOSS';
        const pts = res === 'WIN' ? 3 : res === 'DRAW' ? 1 : 0;

        const cOvr = currentPlayingSquad.players.length
          ? Math.round(
              currentPlayingSquad.players.reduce((s, p) => s + p.rating, 0) /
                currentPlayingSquad.players.length
            )
          : 85;
        const oOvr = activeOpponent.team?.players.length
          ? Math.round(
              activeOpponent.team.players.reduce((s, p) => s + p.rating, 0) /
                activeOpponent.team.players.length
            )
          : 85;

        const record: BetaMatchRecord = {
          id: 'tac_match_' + Date.now(),
          challengerUserId: userProfile.userId,
          challengerUsername: userProfile.username || 'You',
          opponentUserId: activeOpponent.userId,
          opponentUsername: activeOpponent.username,
          matchType: 'TACTICAL',
          challengerScore: fullScore[0],
          opponentScore: fullScore[1],
          result: res,
          points: pts,
          challengerOvr: cOvr,
          opponentOvr: oOvr,
          challengerTeamName: currentPlayingSquad.name,
          opponentTeamName: activeOpponent.team?.name || 'Defense Squad',
          timestamp: Date.now(),
          events: liveEvents.concat(secondHalfSim.events),
          fullTimeScore: fullScore,
          challengerTactics: halftimeTactics,
          opponentTactics: activeOpponent.tactics,
        };

        setFinalMatchRecord(record);
        saveMyMatchRecord(record);
        setMatchHistory((prev) => [record, ...prev]);

        if (res === 'WIN') {
          soundManager.playTeamCompleted();
          confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
        }
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, []);

  const standings = computePast10Standings(userProfile, matchHistory);

  return (
    <div id="pvp-view-container" className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Top Banner with BETA Badge */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-xs tracking-wider shadow-md animate-pulse">
                EXPERIMENTAL BETA
              </span>
              <span className="text-xs font-mono text-indigo-300 font-bold">PvP ASYNC ENGINE</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-wide flex items-center gap-2">
              <Swords className="w-7 h-7 text-indigo-400" />
              <span>PvP 対戦モード (BETA)</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              実在プレイヤーが作成したチームと対戦！ 総合値で勝負する「総合値マッチ (30秒)」と、
              ハーフタイムで戦術修正が勝敗を分ける「戦術マッチ (前後半40秒)」を体験できます。
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onBackToDraft}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              ← Back to Draft
            </button>
          </div>
        </div>

        {/* User Registration Form */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
              👤
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Your PvP Handle</div>
              <div className="text-sm font-black text-white">
                {userProfile.username || '(未登録・設定してください)'}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveUsername} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="ユーザーネーム (例: LeoChampion)"
              maxLength={18}
              className="bg-slate-950 border border-slate-700 focus:border-indigo-400 px-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none w-full sm:w-56"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-heading font-black text-xs tracking-wider shadow-md shrink-0 transition-transform active:scale-95"
            >
              登録・保存
            </button>
          </form>
        </div>

        {usernameError && (
          <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2 rounded-xl border border-rose-500/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{usernameError}</span>
          </div>
        )}
        {usernameSuccess && (
          <div className="mt-2 text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>ユーザーネームとチームデータを正常に登録しました！</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'lobby', label: '⚔️ 対戦ロビー', icon: Swords },
          { id: 'tactics', label: '🧠 戦術設定', icon: Sliders },
          { id: 'friends', label: '🔍 フレンド・ユーザー検索', icon: Search },
          { id: 'standings', label: '🏆 ランキング (過去10試合)', icon: Trophy },
          { id: 'history', label: '📜 対戦履歴', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundManager.playButtonClick();
                setActiveTab(tab.id as PvPTab);
              }}
              className={`px-4 py-2.5 rounded-2xl font-heading font-extrabold text-xs tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* PRE-MATCH CONFIRMATION & SQUAD SELECTION MODAL (Feature 28, 30, 31, 32) */}
      {isPreMatchOpen && preMatchOpponent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-indigo-500/60 rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl space-y-6 animate-scaleUp my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-black border border-indigo-500/40">
                    {preMatchMode === 'OVR' ? '⚡ 総合値マッチ (30s)' : '🧠 戦術マッチ (前後半40s)'}
                  </span>
                  <span className="text-xs font-bold text-amber-400">対戦前確認 & スカッド選択</span>
                </div>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-white">
                  MATCH PREVIEW (対戦前マッチアップ)
                </h3>
              </div>

              <button
                onClick={() => setIsPreMatchOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-xs font-bold"
              >
                ✕ 閉じる
              </button>
            </div>

            {/* Matchup Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              {/* Left Column: Challenger / Your Playing Squad */}
              <div className="lg:col-span-5 bg-slate-900/90 border-2 border-indigo-500/50 rounded-2xl p-4 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👤</span>
                    <div>
                      <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase">
                        YOUR SQUAD (使用スカッド)
                      </div>
                      <div className="font-heading font-black text-sm text-white">
                        {userProfile.username || 'YOU'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                    CHALLENGER
                  </span>
                </div>

                {/* Squad Selector for user's squads */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>使用するスカッドを選択:</span>
                    <span className="text-[10px] font-mono text-slate-400">{teams.length} スカッド</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {teams.map((t) => {
                      const isSelected = t.teamId === activePlayingSquad.teamId;
                      const sOvr = t.players.length
                        ? Math.round(t.players.reduce((s, p) => s + p.rating, 0) / t.players.length)
                        : 80;

                      return (
                        <button
                          key={t.teamId}
                          type="button"
                          onClick={() => {
                            soundManager.playButtonClick();
                            setSelectedPlayingSquadId(t.teamId);
                          }}
                          className={`p-2 rounded-xl text-left transition-all border ${
                            isSelected
                              ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md ring-1 ring-indigo-400'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-heading font-black text-xs truncate">{t.name}</span>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0" />}
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-slate-400">
                            <span>{t.formation || '4-3-3'}</span>
                            <span className="text-amber-400 font-bold">OVR {sOvr}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Squad Details Card */}
                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{activePlayingSquad.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {activePlayingSquad.players.length}/11 選手登録
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>フォーメーション:</span>
                    <span className="font-bold text-white">{activePlayingSquad.formation || '4-3-3'}</span>
                  </div>

                  {/* Key Players */}
                  <div className="space-y-1 pt-1 border-t border-slate-800/60">
                    <div className="text-[10px] font-mono text-slate-400">KEY PLAYERS</div>
                    <div className="flex flex-wrap gap-1.5">
                      {activePlayingSquad.players.slice(0, 4).map((p) => (
                        <span
                          key={p.id}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-slate-300 flex items-center gap-1"
                        >
                          <span className="font-bold text-white truncate max-w-[80px]">{p.name}</span>
                          <span className="font-mono font-bold text-amber-400">{p.rating}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Center: VS Badge */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-600 flex items-center justify-center font-heading font-black text-xl text-white shadow-xl ring-4 ring-slate-900 animate-pulse">
                  VS
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-2">
                  {preMatchMode === 'OVR' ? 'OVR MATCH' : 'TACTICAL MATCH'}
                </div>
              </div>

              {/* Right Column: Opponent Defense Squad (Feature 29, 30, 31) */}
              <div className="lg:col-span-5 bg-slate-900/90 border-2 border-rose-500/50 rounded-2xl p-4 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛡️</span>
                    <div>
                      <div className="text-[10px] font-mono text-rose-400 font-bold uppercase">
                        OPPONENT DEFENSE SQUAD
                      </div>
                      <div className="font-heading font-black text-sm text-white">
                        {preMatchOpponent.username}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                    DEFENDER
                  </span>
                </div>

                {/* Opponent Squad Card */}
                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {preMatchOpponent.team?.name || 'Defense Squad'}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      TEAM OVR{' '}
                      {preMatchOpponent.team?.players?.length
                        ? Math.round(
                            preMatchOpponent.team.players.reduce((s, p) => s + p.rating, 0) /
                              preMatchOpponent.team.players.length
                          )
                        : 85}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>フォーメーション:</span>
                    <span className="font-bold text-white">
                      {preMatchOpponent.team?.formation || '4-3-3'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                    <span>守備戦術スタイル:</span>
                    <span className="font-bold text-rose-300">
                      {preMatchOpponent.tactics?.defenseTactic || 'MID_BLOCK'}
                    </span>
                  </div>

                  {/* Defense Squad Offline Notice */}
                  <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 text-[10px] text-rose-300/90 leading-relaxed flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>相手が設定した守備時スカッドと自動対戦します（CPU置き換えなし）。</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPreMatchOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                キャンセル
              </button>

              <button
                type="button"
                onClick={() => {
                  if (preMatchMode === 'OVR') {
                    startOVRMatch(preMatchOpponent, activePlayingSquad);
                  } else {
                    startTacticalMatch(preMatchOpponent, activePlayingSquad);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-rose-500 hover:from-indigo-400 hover:to-rose-400 text-white font-heading font-black text-xs tracking-wider shadow-lg flex items-center gap-2 transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>⚡ 対戦キックオフ (START MATCH)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE MATCH SIMULATION SCREEN (Overlay) */}
      {(isMatchRunning || matchPhase === 'halftime' || (matchMode && matchPhase === 'finished')) &&
        activeOpponent && (
          <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-indigo-400 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 animate-scaleUp">
            {/* Match Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-black border border-indigo-500/40">
                  {matchMode === 'OVR' ? '⚡ 総合値マッチ (30s)' : '🧠 戦術マッチ (前後半40s)'}
                </span>
                <span className="text-xs text-slate-400">
                  {matchPhase === '1st_half'
                    ? '前半進行中'
                    : matchPhase === 'halftime'
                    ? '⏸️ ハーフタイム'
                    : matchPhase === '2nd_half'
                    ? '後半進行中'
                    : '🏁 試合終了'}
                </span>
              </div>

              <div className="font-mono text-base sm:text-lg font-black text-amber-400">
                ⏱️ {matchTimerSeconds}s
              </div>
            </div>

            {/* Live Scoreboard */}
            <div className="grid grid-cols-3 gap-2 items-center bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-center">
              {/* Home / Challenger */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-heading font-black text-indigo-300 truncate">
                  {userProfile.username || 'YOU'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{currentPlayingSquad.name}</div>
                <div className="text-xs font-mono font-bold text-slate-300">
                  Tactics: {halftimeTactics.attackTactic}
                </div>
              </div>

              {/* Big Score */}
              <div className="font-heading font-black text-4xl sm:text-6xl text-white tracking-widest flex items-center justify-center gap-3">
                <span className="text-indigo-400">{currentScore[0]}</span>
                <span className="text-slate-600">-</span>
                <span className="text-rose-400">{currentScore[1]}</span>
              </div>

              {/* Away / Opponent */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-heading font-black text-rose-300 truncate">
                  {activeOpponent.username}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {activeOpponent.team?.name || 'Defense Squad'}
                </div>
                <div className="text-xs font-mono font-bold text-slate-300">
                  Tactics: {activeOpponent.tactics?.attackTactic || 'POSSESSION'}
                </div>
              </div>
            </div>

            {/* HALFTIME TACTICAL INTERVENTION SCREEN */}
            {matchPhase === 'halftime' && (
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border-2 border-amber-400/60 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    <div>
                      <h4 className="font-heading font-black text-lg text-white">
                        HALFTIME TACTICAL ADJUSTMENT (ハーフタイム戦術指示)
                      </h4>
                      <p className="text-xs text-amber-300/90">
                        前半の試合展開をもとに戦術を変更し、後半の逆転・追加点を狙いましょう！
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Attack Style */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">攻撃戦術 (Attack Style)</label>
                    <select
                      value={halftimeTactics.attackTactic}
                      onChange={(e) =>
                        setHalftimeTactics((prev) => ({
                          ...prev,
                          attackTactic: e.target.value as AttackTactics,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-xs p-2.5 rounded-xl focus:border-amber-400 focus:outline-none"
                    >
                      <option value="POSSESSION">⚽ ポゼッション (Possession)</option>
                      <option value="SHORT_PASS">🎯 ショートパス (Short Pass)</option>
                      <option value="DIRECT_PLAY">⚡ ダイレクトプレー (Direct Play)</option>
                      <option value="COUNTER">🏃 カウンター (Counter Attack)</option>
                      <option value="LONG_BALL">🚀 ロングボール (Long Ball)</option>
                      <option value="WIDE_ATTACK">↔️ サイド攻撃 (Wide Attack)</option>
                      <option value="CENTRAL_ATTACK">🎯 中央突破 (Central Attack)</option>
                    </select>
                  </div>

                  {/* Defense Style */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">守備戦術 (Defense Style)</label>
                    <select
                      value={halftimeTactics.defenseTactic}
                      onChange={(e) =>
                        setHalftimeTactics((prev) => ({
                          ...prev,
                          defenseTactic: e.target.value as DefenseTactics,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-xs p-2.5 rounded-xl focus:border-amber-400 focus:outline-none"
                    >
                      <option value="HIGH_PRESS">🔥 ハイプレス (High Press)</option>
                      <option value="MID_BLOCK">🛡️ ミドルブロック (Mid Block)</option>
                      <option value="LOW_BLOCK">🧱 ローブロック (Low Block)</option>
                      <option value="HIGH_LINE">⚡ ハイライン (High Line)</option>
                      <option value="DEFENSIVE_FOCUS">🔒 守備重視 (Defensive Focus)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={resumeSecondHalf}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-black text-sm tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>戦術を適用して後半開始 (Start 2nd Half)</span>
                </button>
              </div>
            )}

            {/* Live Event Feed */}
            <div className="space-y-2 max-h-56 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
              {liveEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2.5 animate-fadeIn ${
                    evt.type === 'goal'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 font-bold'
                      : evt.type === 'tactic'
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  <span className="font-mono font-bold text-slate-400 min-w-8">{evt.minute}'</span>
                  <span className="flex-1">{language === 'ja' ? evt.textJa : evt.textEn}</span>
                </div>
              ))}
            </div>

            {/* Final Match Finished Action */}
            {matchPhase === 'finished' && (
              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    soundManager.playButtonClick();
                    setMatchMode(null);
                    setActiveOpponent(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-heading font-black text-xs tracking-wider shadow-lg"
                >
                  対戦ロビーに戻る
                </button>
              </div>
            )}
          </div>
        )}

      {/* TAB 1: MATCH LOBBY */}
      {activeTab === 'lobby' && !matchMode && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mode 1: OVR Match Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-xs border border-indigo-500/40 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>30秒ダイジェスト</span>
                </span>
                <span className="text-xs font-mono text-slate-400">FAST SIMULATION</span>
              </div>
              <h3 className="font-heading font-black text-xl text-white">
                ① 総合値マッチ (OVR Match)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                作成したBest XIチームの総合値・選手能力を軸にした高速対戦モード。
                30秒間のダイジェスト演出でゴールシーンを体験できます。
              </p>
            </div>

            {/* Mode 2: Tactical Match Card */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950/60 border border-blue-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-black text-xs border border-blue-500/40 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>前後半40秒 + ハーフタイム</span>
                </span>
                <span className="text-xs font-mono text-slate-400">TACTICAL ENGINE</span>
              </div>
              <h3 className="font-heading font-black text-xl text-white">
                ② 戦術マッチ (Tactical Match)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                戦術相性とリアルタイムな戦術変更が勝敗を左右する本格モード。
                前半40秒終了後のハーフタイムで戦術修正を行い、後半40秒で決着をつけます。
              </p>
            </div>
          </div>

          {/* Real Community Opponents Roster */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h4 className="font-heading font-black text-base text-white">
                  対戦相手一覧（実在ユーザー・コミュニティ）
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {communityUsers.length} Users Ready to Challenge
              </span>
            </div>

            {communityUsers.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-3 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-xl">
                  👥
                </div>
                <div className="font-heading font-bold text-sm text-white">
                  まだ他のプレイヤーが登録されていません
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  上のフォームからご自身のユーザーネームとチームを登録してください。<br />
                  お友達や他プレイヤーにユーザーネームを共有すると、直接検索・対戦が可能になります！
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {communityUsers.map((opp) => {
                  const oppOvr = opp.team?.players?.length
                    ? Math.round(
                        opp.team.players.reduce((s, p) => s + p.rating, 0) / opp.team.players.length
                      )
                    : 85;

                  return (
                    <div
                      key={opp.userId}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-indigo-900 flex items-center justify-center font-heading font-black text-base text-indigo-300 border border-indigo-500/30">
                            {opp.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-heading font-black text-sm text-white">
                              {opp.username}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {opp.team?.name || 'Best XI Squad'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] font-mono text-slate-400">TEAM OVR</div>
                          <div className="font-mono font-black text-base text-amber-400">{oppOvr}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => handleOpenPreMatch(opp, 'OVR')}
                          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>総合値マッチ</span>
                        </button>
                        <button
                          onClick={() => handleOpenPreMatch(opp, 'TACTICAL')}
                          className="flex-1 py-2 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>戦術マッチ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TACTICAL BOARD */}
      {activeTab === 'tactics' && !matchMode && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="font-heading font-black text-xl text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <span>チーム戦術ボード (Tactical Settings)</span>
            </h3>
            <p className="text-xs text-slate-400">
              多彩な攻撃・守備スタイルを設定して試合を有利に進めましょう。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Attack Tactics */}
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <h4 className="font-heading font-bold text-sm text-emerald-400">
                ⚽ 攻撃戦術 (Attack Tactic)
              </h4>
              <div className="space-y-2">
                {[
                  { id: 'POSSESSION', name: 'ポゼッション', desc: 'パスをつなぎ主導権を握る' },
                  { id: 'SHORT_PASS', name: 'ショートパス', desc: '細かな連携で崩す' },
                  { id: 'DIRECT_PLAY', name: 'ダイレクトプレー', desc: '素早く前線へ運ぶ' },
                  { id: 'COUNTER', name: 'カウンター', desc: 'ハイラインの裏を突く' },
                  { id: 'LONG_BALL', name: 'ロングボール', desc: '前線ターゲットへ一気に供給' },
                  { id: 'WIDE_ATTACK', name: 'サイド攻撃', desc: 'ウイングを活用したクロス' },
                  { id: 'CENTRAL_ATTACK', name: '中央突破', desc: '中央密集をコンビネーションで攻略' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleSaveTactics({ ...tactics, attackTactic: item.id as AttackTactics })
                    }
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                      tactics.attackTactic === item.id
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-black shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-[10px] opacity-70">{item.desc}</div>
                    </div>
                    {tactics.attackTactic === item.id && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Defense Tactics */}
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <h4 className="font-heading font-bold text-sm text-indigo-400">
                🛡️ 守備戦術 (Defense Tactic)
              </h4>
              <div className="space-y-2">
                {[
                  { id: 'HIGH_PRESS', name: 'ハイプレス', desc: '前線から激しくボールを奪取' },
                  { id: 'MID_BLOCK', name: 'ミドルブロック', desc: '中盤で安定した陣形を維持' },
                  { id: 'LOW_BLOCK', name: 'ローブロック', desc: '自陣ゴール前を固めて封鎖' },
                  { id: 'HIGH_LINE', name: 'ハイライン', desc: 'オフサイドトラップと積極奪回' },
                  { id: 'DEFENSIVE_FOCUS', name: '守備重視', desc: 'リスクを徹底的に排除' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleSaveTactics({ ...tactics, defenseTactic: item.id as DefenseTactics })
                    }
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                      tactics.defenseTactic === item.id
                        ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 font-black shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{item.name}</div>
                      <div className="text-[10px] opacity-70">{item.desc}</div>
                    </div>
                    {tactics.defenseTactic === item.id && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FRIENDS & USER SEARCH */}
      {activeTab === 'friends' && !matchMode && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="font-heading font-black text-xl text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              <span>フレンド・ユーザー検索 (Friend Search)</span>
            </h3>
            <p className="text-xs text-slate-400">
              特定のユーザーネームを検索して、そのユーザーのチームと非同期対戦が行えます。
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="ユーザーネームを検索 (例: Striker99, LeoAce)"
              className="w-full bg-slate-950 border border-slate-700 pl-10 pr-4 py-3 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            {searchQuery && searchResults.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                「{searchQuery}」に一致するユーザーは見つかりませんでした。
              </div>
            ) : !searchQuery && communityUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 p-6">
                登録済みのフレンドがまだいません。検索バーにお友達のユーザーネームを入力して検索・対戦してください。
              </div>
            ) : (
              (searchQuery ? searchResults : communityUsers).map((user) => (
                <div
                  key={user.userId}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center font-heading font-black text-indigo-300">
                      {user.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-heading font-black text-sm text-white">
                        {user.username}
                      </div>
                      <div className="text-[11px] text-slate-400">{user.team?.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenPreMatch(user, 'OVR')}
                      className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                    >
                      総合値マッチ
                    </button>
                    <button
                      onClick={() => handleOpenPreMatch(user, 'TACTICAL')}
                      className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
                    >
                      戦術マッチ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: STANDINGS (Past 10 Matches) */}
      {activeTab === 'standings' && !matchMode && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="font-heading font-black text-xl text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>過去10試合 ランキング (Past 10 Matches Points)</span>
            </h3>
            <p className="text-xs text-slate-400">
              直近10試合の対戦成績に基づくポイント制順位表（勝利 3pt / 引分 1pt / 敗北 0pt）。
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">User / Team</th>
                  <th className="p-3 text-center">Matches</th>
                  <th className="p-3 text-center">W - D - L</th>
                  <th className="p-3 text-center">GD</th>
                  <th className="p-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {standings.map((st) => {
                  const isMe = st.userId === userProfile.userId;
                  return (
                    <tr
                      key={st.userId}
                      className={
                        isMe
                          ? 'bg-indigo-950/40 text-indigo-200 font-bold border-l-4 border-indigo-400'
                          : 'hover:bg-slate-950/40 text-slate-300'
                      }
                    >
                      <td className="p-3 font-mono font-black text-amber-400">#{st.rank}</td>
                      <td className="p-3">
                        <div className="font-black text-white">{st.username} {isMe && '(YOU)'}</div>
                        <div className="text-[10px] text-slate-400">{st.teamName}</div>
                      </td>
                      <td className="p-3 text-center font-mono">{st.matchesCount}/10</td>
                      <td className="p-3 text-center font-mono">
                        {st.wins} - {st.draws} - {st.losses}
                      </td>
                      <td className="p-3 text-center font-mono">
                        {st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-sm text-amber-300">
                        {st.points} pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MY MATCH HISTORY */}
      {activeTab === 'history' && !matchMode && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="font-heading font-black text-xl text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <span>対戦履歴（自分が仕掛けた試合のみ）</span>
            </h3>
            <p className="text-xs text-slate-400">
              あなたが対戦を申し込んで実行した試合の履歴です。
            </p>
          </div>

          {matchHistory.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              対戦履歴はまだありません。対戦ロビーから試合を行ってください。
            </div>
          ) : (
            <div className="space-y-3">
              {matchHistory.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono ${
                          rec.result === 'WIN'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : rec.result === 'DRAW'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}
                      >
                        {rec.result} (+{rec.points}pt)
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {rec.matchType === 'OVR' ? '総合値マッチ' : '戦術マッチ'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">
                      vs {rec.opponentUsername} ({rec.opponentTeamName})
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {new Date(rec.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-heading font-black text-2xl text-white font-mono">
                      {rec.challengerScore} - {rec.opponentScore}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
