import React, { useState, useEffect, useRef } from 'react';
import {
  UserTeam,
  Language,
  BetaUserProfile,
  BetaMatchRecord,
  BetaMatchEvent,
  BetaStandingEntry,
  TeamTactics,
  AttackTactics,
  DefenseTactics,
} from '../types';
import {
  getCurrentUserProfile,
  simulateOVRMatch,
  simulateTacticalMatchHalf,
  computeWeeklyStandings,
  DEFAULT_TACTICS,
} from '../utils/pvpEngine';
import {
  getCurrentSeasonInfo,
  getSeasonInfo,
  formatSeasonPeriod,
  getHistoricalSeasons,
} from '../utils/seasonEngine';
import {
  initSupabasePvP,
  registerOrUpdateUserInSupabase,
  saveBestXIToSupabase,
  fetchOnlineUsersFromSupabase,
  fetchAllRegisteredUsersFromSupabase,
  searchUsersFromSupabase,
  fetchOpponentBestXIFromSupabase,
  saveMatchRecordToSupabase,
  fetchMatchHistoryFromSupabase,
  fetchWeeklyStandingsFromSupabase,
  checkAndPerformV113Migration,
} from '../utils/supabasePvP';
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
  Wifi,
  WifiOff,
  Cloud,
  RefreshCw,
  Calendar,
  Medal,
  Award,
} from 'lucide-react';

interface PvPViewProps {
  activeTeam: UserTeam;
  teams?: UserTeam[];
  language: Language;
  onBackToDraft?: () => void;
  onNavigate?: (tab: 'home' | 'draft' | 'team' | 'history' | 'pvp') => void;
}

type PvPTab = 'lobby' | 'tactics' | 'friends' | 'standings' | 'history';

function formatRelativeTime(timestamp: number, lang: Language): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (lang === 'ja') {
    if (seconds < 60) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return `${days}日前`;
  } else {
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    return `${days} d ago`;
  }
}

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
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingBestXI, setIsSavingBestXI] = useState(false);
  const [bestXISuccess, setBestXISuccess] = useState(false);

  // Tactics State
  const [tactics, setTactics] = useState<TeamTactics>(userProfile.tactics || DEFAULT_TACTICS);

  // Community Users & Online Presence from Supabase
  const [onlineUsers, setOnlineUsers] = useState<BetaUserProfile[]>([]);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<BetaUserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  // User Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BetaUserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Pre-Match Confirmation & Squad Selection State
  const [isPreMatchOpen, setIsPreMatchOpen] = useState<boolean>(false);
  const [preMatchOpponent, setPreMatchOpponent] = useState<BetaUserProfile | null>(null);
  const [preMatchMode, setPreMatchMode] = useState<'OVR' | 'TACTICAL'>('OVR');
  const [preMatchCategory, setPreMatchCategory] = useState<'REALTIME' | 'ASYNC'>('ASYNC');
  const [selectedPlayingSquadId, setSelectedPlayingSquadId] = useState<string>(activeTeam.teamId);
  const [isLoadingOpponentTeam, setIsLoadingOpponentTeam] = useState(false);

  // Derive the actively selected playing squad
  const activePlayingSquad =
    teams.find((t) => t.teamId === selectedPlayingSquadId) || activeTeam;

  // Match Simulation State
  const [activeOpponent, setActiveOpponent] = useState<BetaUserProfile | null>(null);
  const [currentPlayingSquad, setCurrentPlayingSquad] = useState<UserTeam>(activeTeam);
  const [matchMode, setMatchMode] = useState<'OVR' | 'TACTICAL' | null>(null);
  const [matchCategory, setMatchCategory] = useState<'REALTIME' | 'ASYNC'>('ASYNC');
  const [isMatchRunning, setIsMatchRunning] = useState(false);
  const [matchPhase, setMatchPhase] = useState<'1st_half' | 'halftime' | '2nd_half' | 'finished'>('1st_half');
  const [matchTimerSeconds, setMatchTimerSeconds] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<[number, number]>([0, 0]);
  const [liveEvents, setLiveEvents] = useState<BetaMatchEvent[]>([]);
  const [finalMatchRecord, setFinalMatchRecord] = useState<BetaMatchRecord | null>(null);

  // Match History
  const [matchHistory, setMatchHistory] = useState<BetaMatchRecord[]>([]);

  // Weekly Season & Standings State
  const currentSeasonInfo = getCurrentSeasonInfo();
  const [selectedSeason, setSelectedSeason] = useState<number>(currentSeasonInfo.seasonNumber);
  const [standingsFilter, setStandingsFilter] = useState<'ALL' | 'OVR' | 'TACTICAL'>('ALL');
  const [weeklyStandings, setWeeklyStandings] = useState<BetaStandingEntry[]>([]);
  const [isLoadingStandings, setIsLoadingStandings] = useState<boolean>(false);

  // Halftime modified tactics
  const [halftimeTactics, setHalftimeTactics] = useState<TeamTactics>(tactics);

  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Supabase PvP connection & Presence and perform v1.1.3 migration
  useEffect(() => {
    checkAndPerformV113Migration();

    initSupabasePvP(
      userProfile,
      (liveOnline) => {
        setOnlineUsers(liveOnline);
      },
      (invite) => {
        console.log('Received match invite:', invite);
      }
    );

    refreshCommunityData(selectedSeason);
  }, [userProfile.userId, userProfile.username]);

  // Refresh Online and Registered Users and Match History from Supabase
  const refreshCommunityData = async (seasonToLoad = selectedSeason) => {
    setIsLoadingUsers(true);
    try {
      const [online, all, hist] = await Promise.all([
        fetchOnlineUsersFromSupabase(userProfile.userId),
        fetchAllRegisteredUsersFromSupabase(userProfile.userId),
        fetchMatchHistoryFromSupabase(userProfile.userId),
      ]);
      setOnlineUsers(online);
      setAllRegisteredUsers(all);
      setMatchHistory(hist);
      loadStandingsData(seasonToLoad, standingsFilter, all, hist);
    } catch (e) {
      console.warn('Failed to refresh Supabase PvP data', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load Weekly Standings from Supabase with smart fallback
  const loadStandingsData = async (
    season: number,
    filter: 'ALL' | 'OVR' | 'TACTICAL',
    knownUsers = allRegisteredUsers,
    knownHistory = matchHistory
  ) => {
    setIsLoadingStandings(true);
    try {
      const realStandings = await fetchWeeklyStandingsFromSupabase(season, filter, userProfile);
      if (realStandings && realStandings.length > 0) {
        setWeeklyStandings(realStandings);
      } else {
        const fallback = computeWeeklyStandings(knownUsers, userProfile, knownHistory, season, filter);
        setWeeklyStandings(fallback);
      }
    } catch (e) {
      console.warn('Failed to fetch weekly standings', e);
      const fallback = computeWeeklyStandings(knownUsers, userProfile, knownHistory, season, filter);
      setWeeklyStandings(fallback);
    } finally {
      setIsLoadingStandings(false);
    }
  };

  // Re-fetch standings when season, filter or tab changes
  useEffect(() => {
    if (activeTab === 'standings') {
      loadStandingsData(selectedSeason, standingsFilter);
    }
  }, [activeTab, selectedSeason, standingsFilter]);

  // Register / Save Username to Supabase
  const handleSaveUsername = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(false);

    const trimmed = usernameInput.trim();
    if (!trimmed || trimmed.length < 3) {
      setUsernameError('ユーザーネームは3文字以上で入力してください。');
      return;
    }

    setIsSavingUser(true);
    const updatedProfile: BetaUserProfile = {
      ...userProfile,
      username: trimmed,
      team: activePlayingSquad,
      tactics,
      updatedAt: Date.now(),
      isOnline: true,
    };

    const res = await registerOrUpdateUserInSupabase(updatedProfile);
    setIsSavingUser(false);

    if (!res.success) {
      setUsernameError(res.error || '保存に失敗しました。');
      soundManager.playButtonClick();
    } else {
      setUserProfile(updatedProfile);
      setUsernameSuccess(true);
      soundManager.playDraftAcquired();
      setTimeout(() => setUsernameSuccess(false), 4000);
      refreshCommunityData(selectedSeason);
    }
  };

  // Save Best XI Team to Supabase
  const handleSaveBestXICloud = async () => {
    if (!userProfile.username) {
      setUsernameError('Best XIを保存する前に、まずPvPユーザーネームを登録してください。');
      return;
    }

    setIsSavingBestXI(true);
    const res = await saveBestXIToSupabase(userProfile, activePlayingSquad, tactics);
    setIsSavingBestXI(false);

    if (res.success) {
      setBestXISuccess(true);
      soundManager.playTeamCompleted();
      setTimeout(() => setBestXISuccess(false), 4000);
      refreshCommunityData(selectedSeason);
    }
  };

  // Save tactics
  const handleSaveTactics = async (newTactics: TeamTactics) => {
    setTactics(newTactics);
    setHalftimeTactics(newTactics);
    const updatedProfile: BetaUserProfile = {
      ...userProfile,
      tactics: newTactics,
      team: activePlayingSquad,
    };
    setUserProfile(updatedProfile);
    soundManager.playButtonClick();

    if (userProfile.username) {
      await saveBestXIToSupabase(updatedProfile, activePlayingSquad, newTactics);
    }
  };

  // Search real users in Supabase
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchUsersFromSupabase(q, userProfile.userId);
      setSearchResults(results);
      setIsSearching(false);
    }, 250);
  };

  // Open Pre-Match Confirmation Screen
  const handleOpenPreMatch = async (
    opponent: BetaUserProfile,
    mode: 'OVR' | 'TACTICAL',
    category?: 'REALTIME' | 'ASYNC'
  ) => {
    if (!userProfile.username) {
      setActiveTab('lobby');
      setUsernameError('対戦を開始する前にユーザーネームを設定・登録してください。');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    soundManager.playButtonClick();
    setIsLoadingOpponentTeam(true);

    const isOppOnline = onlineUsers.some((u) => u.userId === opponent.userId);
    const chosenCategory = category || (isOppOnline ? 'REALTIME' : 'ASYNC');

    // Fetch opponent's saved Best XI from Supabase if not loaded
    let fullOpponent = opponent;
    if (!opponent.team || !opponent.team.players || opponent.team.players.length === 0) {
      const fetchedTeam = await fetchOpponentBestXIFromSupabase(opponent.userId);
      if (fetchedTeam) {
        fullOpponent = { ...opponent, team: fetchedTeam };
      }
    }

    setIsLoadingOpponentTeam(false);
    setPreMatchOpponent(fullOpponent);
    setPreMatchMode(mode);
    setPreMatchCategory(chosenCategory);
    setIsPreMatchOpen(true);
  };

  // ─────────────────────────────────────────────────────────────
  // OVR MATCH (30s simulation with Selected Playing Squad)
  // ─────────────────────────────────────────────────────────────
  const startOVRMatch = (
    opponent: BetaUserProfile,
    playingSquad: UserTeam,
    category: 'REALTIME' | 'ASYNC'
  ) => {
    soundManager.playButtonClick();
    setIsPreMatchOpen(false);
    setActiveOpponent(opponent);
    setCurrentPlayingSquad(playingSquad);
    setMatchMode('OVR');
    setMatchCategory(category);
    setIsMatchRunning(true);
    setMatchPhase('1st_half');
    setMatchTimerSeconds(0);
    setCurrentScore([0, 0]);
    setLiveEvents([]);
    setFinalMatchRecord(null);

    const { record, events } = simulateOVRMatch(
      userProfile,
      opponent,
      playingSquad,
      category
    );
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

        // Save to Supabase and update state
        saveMatchRecordToSupabase(record);
        setMatchHistory((prev) => [record, ...prev]);
        loadStandingsData(selectedSeason, standingsFilter);

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
  const startTacticalMatch = (
    opponent: BetaUserProfile,
    playingSquad: UserTeam,
    category: 'REALTIME' | 'ASYNC'
  ) => {
    soundManager.playButtonClick();
    setIsPreMatchOpen(false);
    setActiveOpponent(opponent);
    setCurrentPlayingSquad(playingSquad);
    setMatchMode('TACTICAL');
    setMatchCategory(category);
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
          matchCategory,
          challengerScore: fullScore[0],
          opponentScore: fullScore[1],
          result: res,
          points: pts,
          challengerOvr: cOvr,
          opponentOvr: oOvr,
          challengerTeamName: currentPlayingSquad.name,
          opponentTeamName: activeOpponent.team?.name || 'Defense Squad',
          timestamp: Date.now(),
          season: getCurrentSeasonInfo().seasonNumber,
          events: liveEvents.concat(secondHalfSim.events),
          fullTimeScore: fullScore,
          challengerTactics: halftimeTactics,
          opponentTactics: activeOpponent.tactics,
        };

        setFinalMatchRecord(record);
        saveMatchRecordToSupabase(record);
        setMatchHistory((prev) => [record, ...prev]);
        loadStandingsData(selectedSeason, standingsFilter);

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

  // Determine current active team OVR
  const myTeamOvr = activePlayingSquad.players.length
    ? Math.round(
        activePlayingSquad.players.reduce((s, p) => s + p.rating, 0) /
          activePlayingSquad.players.length
      )
    : 85;

  const historicalSeasons = getHistoricalSeasons();
  const selectedSeasonMeta = getSeasonInfo(selectedSeason);

  return (
    <div id="pvp-view-container" className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Top Banner with Supabase Cloud Status */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black border border-emerald-500/40 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>SUPABASE ONLINE</span>
              </span>
              <span className="text-xs font-mono text-indigo-300 font-bold">WEEKLY RANKING & ASYNC ENGINE</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-wide flex items-center gap-2">
              <Swords className="w-7 h-7 text-indigo-400" />
              <span>PvP 対戦＆週間ランキング (v1.1.3)</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Supabaseに登録された実在プレイヤーと対戦！ 毎週月曜0:00〜日曜23:59(JST)の週間ランキングを開催中。
              OVR対戦・戦術対戦の2つのランキングで上位を目指しましょう！
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => refreshCommunityData(selectedSeason)}
              disabled={isLoadingUsers}
              title="データを更新"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">更新</span>
            </button>
            <button
              onClick={onBackToDraft}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              ← Back to Draft
            </button>
          </div>
        </div>

        {/* User Registration Form & Current Handle Badge */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-bold text-sm shadow-inner">
              👤
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
                <span>YOUR PVP HANDLE</span>
                {userProfile.username && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <Cloud className="w-3 h-3" />
                    <span>Cloud Synced</span>
                  </span>
                )}
              </div>
              <div className="text-base font-black text-white flex items-center gap-2">
                <span>{userProfile.username ? `@${userProfile.username}` : '(未登録・設定してください)'}</span>
                {userProfile.username && (
                  <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30">
                    OVR {myTeamOvr}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <form onSubmit={handleSaveUsername} className="flex items-center gap-2">
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="ユーザー名 (例: LeoChampion)"
                maxLength={18}
                disabled={isSavingUser}
                className="bg-slate-950 border border-slate-700 focus:border-indigo-400 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none w-full sm:w-52 font-medium"
              />
              <button
                type="submit"
                disabled={isSavingUser}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-heading font-black text-xs tracking-wider shadow-md shrink-0 transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSavingUser ? '保存中...' : '登録・保存'}
              </button>
            </form>

            <button
              onClick={handleSaveBestXICloud}
              disabled={isSavingBestXI || !userProfile.username}
              title="現在のBest XIチームをSupabaseに保存して対戦相手に公開します"
              className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSavingBestXI ? '保存中...' : 'Best XI 保存'}</span>
            </button>
          </div>
        </div>

        {usernameError && (
          <div className="mt-3 text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30 flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{usernameError}</span>
          </div>
        )}
        {usernameSuccess && (
          <div className="mt-3 text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>PvPハンドル「@{userProfile.username}」とチームデータをSupabaseに正常保存しました！</span>
          </div>
        )}
        {bestXISuccess && (
          <div className="mt-3 text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Best XI（{activePlayingSquad.name} / OVR {myTeamOvr}）をSupabaseクラウドに保存しました！</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'lobby', label: '⚔️ 対戦ロビー', icon: Swords },
          { id: 'tactics', label: '🧠 戦術設定', icon: Sliders },
          { id: 'friends', label: '🔍 ユーザー検索', icon: Search },
          { id: 'standings', label: '🏆 週間ランキング (JST)', icon: Trophy },
          { id: 'history', label: '📜 MATCH HISTORY', icon: History },
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

      {/* PRE-MATCH CONFIRMATION & SQUAD SELECTION MODAL */}
      {isPreMatchOpen && preMatchOpponent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-indigo-500/60 rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl space-y-6 animate-scaleUp my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-black border border-indigo-500/40">
                    {preMatchMode === 'OVR' ? '⚡ 総合値マッチ (30s)' : '🧠 戦術マッチ (前後半40s)'}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                    preMatchCategory === 'REALTIME'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {preMatchCategory === 'REALTIME' ? '🟢 REALTIME MATCH' : '⚡ ASYNC MATCH (非同期)'}
                  </span>
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
                        @{userProfile.username || 'YOU'}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                    CHALLENGER
                  </span>
                </div>

                {/* Squad Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>使用するスカッドを選択:</span>
                    <span className="text-[10px] font-mono text-slate-400">{teams.length} スカッド</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
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

                {/* Selected Squad OVR and Formation */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">FORMATION</div>
                    <div className="font-bold text-xs text-white">{activePlayingSquad.formation || '4-3-3'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono">TEAM OVR</div>
                    <div className="font-heading font-black text-base text-amber-400">
                      {activePlayingSquad.players.length
                        ? Math.round(
                            activePlayingSquad.players.reduce((s, p) => s + p.rating, 0) /
                              activePlayingSquad.players.length
                          )
                        : 80}
                    </div>
                  </div>
                </div>

                {/* Tactics Summary */}
                <div className="text-xs space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">TACTICS</div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-bold">⚽ 攻撃: {tactics.attackTactic}</span>
                    <span className="text-indigo-400 font-bold">🛡️ 守備: {tactics.defenseTactic}</span>
                  </div>
                </div>
              </div>

              {/* VS Emblem */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-2 text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center font-heading font-black text-white text-base shadow-lg shadow-rose-900/40">
                  VS
                </div>
                <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                  {preMatchMode} MATCH
                </span>
              </div>

              {/* Right Column: Opponent Designated Defense Squad */}
              <div className="lg:col-span-5 bg-slate-900/90 border-2 border-rose-500/40 rounded-2xl p-4 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛡️</span>
                    <div>
                      <div className="text-[10px] font-mono text-rose-400 font-bold uppercase">
                        DEFENSE SQUAD (相手守備陣形)
                      </div>
                      <div className="font-heading font-black text-sm text-white">
                        @{preMatchOpponent.username}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                    OPPONENT
                  </span>
                </div>

                {/* Opponent Squad Info */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono">OPPONENT SQUAD</div>
                    <div className="font-bold text-xs text-white truncate max-w-[140px]">
                      {preMatchOpponent.team?.name || 'Defense Squad'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {preMatchOpponent.team?.formation || '4-3-3'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono">OPPONENT OVR</div>
                    <div className="font-heading font-black text-base text-amber-400">
                      {preMatchOpponent.team?.players?.length
                        ? Math.round(
                            preMatchOpponent.team.players.reduce((s, p) => s + p.rating, 0) /
                              preMatchOpponent.team.players.length
                          )
                        : 85}
                    </div>
                  </div>
                </div>

                {/* Opponent Tactics Summary */}
                <div className="text-xs space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">SET TACTICS</div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-bold">
                      ⚽ {preMatchOpponent.tactics?.attackTactic || 'POSSESSION'}
                    </span>
                    <span className="text-indigo-400 font-bold">
                      🛡️ {preMatchOpponent.tactics?.defenseTactic || 'MID_BLOCK'}
                    </span>
                  </div>
                </div>

                {/* Opponent Players preview */}
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                  <span>登録選手数: {preMatchOpponent.team?.players?.length || 11} 名</span>
                  <span className="text-emerald-400 font-bold">
                    {onlineUsers.some((u) => u.userId === preMatchOpponent.userId) ? '🟢 相手オンライン' : '⚫ 非同期対戦'}
                  </span>
                </div>
              </div>
            </div>

            {/* Kick Off Button */}
            <div className="pt-2">
              <button
                id="btn-confirm-kickoff"
                onClick={() => {
                  if (preMatchMode === 'OVR') {
                    startOVRMatch(preMatchOpponent, activePlayingSquad, preMatchCategory);
                  } else {
                    startTacticalMatch(preMatchOpponent, activePlayingSquad, preMatchCategory);
                  }
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-black text-base tracking-wider shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>KICK OFF (試合開始)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE MATCH SIMULATION SCREEN */}
      {matchMode && activeOpponent && (
        <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 space-y-6 shadow-2xl animate-scaleUp">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-black border border-indigo-500/40">
                {matchMode === 'OVR' ? '⚡ 総合値マッチ (30s)' : '🧠 戦術マッチ'}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {matchPhase === '1st_half'
                  ? '前半進行中'
                  : matchPhase === 'halftime'
                  ? '⏸️ ハーフタイム'
                  : matchPhase === '2nd_half'
                  ? '後半進行中'
                  : '🏁 試合終了'}
              </span>
            </div>

            <div className="text-xs font-mono font-bold text-amber-400">
              ⏱️ {matchTimerSeconds}s
            </div>
          </div>

          {/* Scoreboard */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex items-center justify-between gap-4 shadow-inner">
            <div className="text-left space-y-1 flex-1">
              <div className="text-[10px] font-mono text-indigo-400 font-bold uppercase">
                {currentPlayingSquad.name}
              </div>
              <div className="font-heading font-black text-lg sm:text-xl text-white truncate">
                @{userProfile.username || 'YOU'}
              </div>
              <div className="text-xs text-slate-400">
                OVR {currentPlayingSquad.players.length ? Math.round(currentPlayingSquad.players.reduce((s, p) => s + p.rating, 0) / currentPlayingSquad.players.length) : 80}
              </div>
            </div>

            <div className="font-heading font-black text-4xl sm:text-6xl text-white font-mono tracking-widest px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              {currentScore[0]} - {currentScore[1]}
            </div>

            <div className="text-right space-y-1 flex-1">
              <div className="text-[10px] font-mono text-rose-400 font-bold uppercase">
                {activeOpponent.team?.name || 'Defense Squad'}
              </div>
              <div className="font-heading font-black text-lg sm:text-xl text-white truncate">
                @{activeOpponent.username}
              </div>
              <div className="text-xs text-slate-400">
                OVR {activeOpponent.team?.players?.length ? Math.round(activeOpponent.team.players.reduce((s, p) => s + p.rating, 0) / activeOpponent.team.players.length) : 85}
              </div>
            </div>
          </div>

          {/* Half-Time Tactics Adjustment Panel */}
          {matchPhase === 'halftime' && (
            <div className="bg-gradient-to-r from-indigo-950/80 to-blue-950/80 border-2 border-indigo-400 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏸️</span>
                  <h4 className="font-heading font-black text-base text-white">
                    ハーフタイム戦術指示 (Half-Time Tactics)
                  </h4>
                </div>
                <span className="text-xs text-amber-300 font-bold">後半の展開に合わせて修正！</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    後半の攻撃戦術:
                  </label>
                  <select
                    value={halftimeTactics.attackTactic}
                    onChange={(e) =>
                      setHalftimeTactics({
                        ...halftimeTactics,
                        attackTactic: e.target.value as AttackTactics,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-indigo-400 font-medium"
                  >
                    <option value="POSSESSION">⚽ ポゼッション (Possession)</option>
                    <option value="SHORT_PASS">🎯 ショートパス (Short Pass)</option>
                    <option value="DIRECT_PLAY">⚡ ダイレクトプレー (Direct Play)</option>
                    <option value="COUNTER">🚀 カウンター (Counter)</option>
                    <option value="LONG_BALL">🏹 ロングボール (Long Ball)</option>
                    <option value="WIDE_ATTACK">🌊 サイド攻撃 (Wide Attack)</option>
                    <option value="CROSS_GAME">👑 クロスゲーム (Cross Game)</option>
                    <option value="CENTRAL_ATTACK">🗡️ 中央突破 (Central Attack)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    後半の守備戦術:
                  </label>
                  <select
                    value={halftimeTactics.defenseTactic}
                    onChange={(e) =>
                      setHalftimeTactics({
                        ...halftimeTactics,
                        defenseTactic: e.target.value as DefenseTactics,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-indigo-400 font-medium"
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
                  refreshCommunityData(selectedSeason);
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
          {/* Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                OVRが高いチームが有利となる厳格な勝率シミュレーションで30秒間の試合が展開されます。
              </p>
            </div>

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
                戦術相性・身長・選手個性が勝敗を左右する本格モード。
                OVRが低いチームでも、相性やハーフタイムの戦術変更次第で高OVRチームに大逆転勝利が可能です。
              </p>
            </div>
          </div>

          {/* ONLINE PLAYERS SECTION */}
          <div className="bg-gradient-to-b from-slate-900/95 to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
                <h4 className="font-heading font-black text-base text-white">
                  ONLINE PLAYERS (現在オンライン中のプレイヤー)
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                {onlineUsers.length} ONLINE
              </span>
            </div>

            {onlineUsers.length === 0 ? (
              <div className="text-center py-8 px-4 space-y-2 bg-slate-950/70 rounded-2xl border border-dashed border-slate-800">
                <div className="text-2xl">🟢</div>
                <div className="font-heading font-bold text-sm text-slate-200">
                  現在、他のオンラインプレイヤーは待機中またはオフラインです
                </div>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  {userProfile.username ? (
                    <>
                      あなた（<span className="text-emerald-300 font-bold">@{userProfile.username}</span>）はオンライン状態です。<br />
                      下記の一覧または検索タブから、登録済みユーザーのBest XIと<span className="text-amber-300 font-bold">非同期対戦（ASYNC MATCH）</span>が可能です！
                    </>
                  ) : (
                    <>
                      上のフォームでユーザーネームを登録すると、オンライン一覧に表示され対戦を受け付けられます！
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {onlineUsers.map((opp) => {
                  const oppOvr = opp.team?.players?.length
                    ? Math.round(
                        opp.team.players.reduce((s, p) => s + p.rating, 0) / opp.team.players.length
                      )
                    : 85;

                  return (
                    <div
                      key={opp.userId}
                      className="p-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 hover:border-emerald-400 transition-all flex flex-col justify-between gap-3 shadow-lg group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-emerald-900/50 border border-emerald-400/40 flex items-center justify-center font-heading font-black text-base text-emerald-300">
                              {opp.username.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                          </div>
                          <div>
                            <div className="font-heading font-black text-sm text-white flex items-center gap-1.5">
                              <span>@{opp.username}</span>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold">ONLINE</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {opp.team?.name || 'Best XI'} · {opp.team?.players?.length || 11} Players
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] font-mono text-slate-400">OVR</div>
                          <div className="font-mono font-black text-base text-amber-400">{oppOvr}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          onClick={() => handleOpenPreMatch(opp, 'OVR', 'REALTIME')}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs tracking-wider shadow-md transition-all flex items-center justify-center gap-1"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          <span>CHALLENGE</span>
                        </button>
                        <button
                          onClick={() => handleOpenPreMatch(opp, 'TACTICAL', 'REALTIME')}
                          className="py-2 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>戦術</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ALL REGISTERED OPPONENTS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h4 className="font-heading font-black text-base text-white">
                  ALL REGISTERED MANAGERS (登録ユーザー一覧 · 非同期対戦対応)
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {allRegisteredUsers.length} Registered
              </span>
            </div>

            {allRegisteredUsers.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-3 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-xl">
                  👥
                </div>
                <div className="font-heading font-bold text-sm text-white">
                  まだ他のマネージャーが登録されていません
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  上のフォームからご自身のユーザーネームとBest XIチームを登録してください。<br />
                  検索バーにお友達のハンドルを入力して検索・対戦も可能です！
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {allRegisteredUsers.map((opp) => {
                  const oppOvr = opp.team?.players?.length
                    ? Math.round(
                        opp.team.players.reduce((s, p) => s + p.rating, 0) / opp.team.players.length
                      )
                    : 85;

                  const isOnline = onlineUsers.some((u) => u.userId === opp.userId);

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
                            <div className="font-heading font-black text-sm text-white flex items-center gap-1.5">
                              <span>@{opp.username}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                isOnline
                                  ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30'
                                  : 'text-slate-400 bg-slate-800'
                              }`}>
                                {isOnline ? '🟢 ONLINE' : '⚫ OFFLINE'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {opp.team?.name || 'Best XI'} · {opp.team?.formation || '4-3-3'}
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
                          onClick={() => handleOpenPreMatch(opp, 'OVR', isOnline ? 'REALTIME' : 'ASYNC')}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                            isOnline
                              ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40'
                              : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{isOnline ? 'CHALLENGE' : 'ASYNC MATCH'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenPreMatch(opp, 'TACTICAL', isOnline ? 'REALTIME' : 'ASYNC')}
                          className="py-2 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>戦術対戦</span>
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
              多彩な攻撃・守備スタイルを設定して試合を有利に進めましょう。設定した戦術はSupabaseに保存されます。
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
                  { id: 'CROSS_GAME', name: 'クロスゲーム', desc: '大型ターゲットの制空権とウイングのクロス精度' },
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

      {/* TAB 3: USER SEARCH */}
      {activeTab === 'friends' && !matchMode && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="font-heading font-black text-xl text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              <span>🔍 ユーザー検索 (Search Players)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Supabaseに登録されているプレイヤーを検索し、オンライン対戦または非同期対戦（ASYNC MATCH）を開始できます。
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="🔍 Search players... (例: Leo, Champion, King)"
              className="w-full bg-slate-950 border border-slate-700 pl-10 pr-4 py-3 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-3">
            {isSearching ? (
              <div className="text-center py-8 text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Supabaseを検索中...</span>
              </div>
            ) : searchQuery && searchResults.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-slate-800 p-6">
                「{searchQuery}」に一致する登録ユーザーは見つかりませんでした。
              </div>
            ) : !searchQuery && allRegisteredUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 p-6">
                登録ユーザーがまだいません。検索バーにユーザーネームを入力して検索してください。
              </div>
            ) : (
              (searchQuery ? searchResults : allRegisteredUsers).map((user) => {
                const isOnline = onlineUsers.some((u) => u.userId === user.userId) || user.isOnline;
                const userOvr = user.team?.players?.length
                  ? Math.round(
                      user.team.players.reduce((s, p) => s + p.rating, 0) / user.team.players.length
                    )
                  : 85;

                return (
                  <div
                    key={user.userId}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4 hover:border-indigo-500/40 transition-all shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center font-heading font-black text-indigo-300 text-sm">
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-600'
                        }`} />
                      </div>
                      <div>
                        <div className="font-heading font-black text-sm text-white flex items-center gap-2">
                          <span>@{user.username}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            isOnline
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isOnline ? '🟢 ONLINE' : '⚫ OFFLINE'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{user.team?.name || 'Best XI'}</span>
                          <span>•</span>
                          <span className="font-mono text-amber-400 font-bold">OVR {userOvr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPreMatch(user, 'OVR', isOnline ? 'REALTIME' : 'ASYNC')}
                        className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-md ${
                          isOnline
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white font-heading font-black'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>{isOnline ? 'CHALLENGE' : 'ASYNC MATCH'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: WEEKLY STANDINGS (Requirement 2 & 3) */}
      {activeTab === 'standings' && !matchMode && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          {/* Header & Season Selector */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-black border border-amber-500/40 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>WEEKLY RANKINGS (JST)</span>
                </span>
                {selectedSeason === currentSeasonInfo.seasonNumber ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>開催中 (ACTIVE)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono font-bold">
                    過去シーズン (ARCHIVE)
                  </span>
                )}
              </div>
              <h3 className="font-heading font-black text-xl sm:text-2xl text-white">
                🏆 週間シーズンランキング
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-mono text-indigo-200">
                  {formatSeasonPeriod(selectedSeason, language)}
                </span>
              </p>
            </div>

            {/* Season Selector & Refresh */}
            <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <label className="text-[11px] font-bold text-slate-400 px-2 font-mono">SEASON:</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => {
                    const sNum = Number(e.target.value);
                    setSelectedSeason(sNum);
                    loadStandingsData(sNum, standingsFilter);
                  }}
                  className="bg-slate-900 border border-slate-700 text-white text-xs font-bold font-mono py-1.5 px-3 rounded-xl focus:outline-none focus:border-amber-400"
                >
                  {historicalSeasons.map((s) => (
                    <option key={s.seasonNumber} value={s.seasonNumber}>
                      Season {s.seasonNumber} ({s.seasonNameJa})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => loadStandingsData(selectedSeason, standingsFilter)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="ランキングを再取得"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingStandings ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Ranking Type Filter (OVR vs Tactical vs All) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  setStandingsFilter('ALL');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  standingsFilter === 'ALL'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                総合 (ALL)
              </button>
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  setStandingsFilter('OVR');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  standingsFilter === 'OVR'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ OVR対戦ランキング</span>
              </button>
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  setStandingsFilter('TACTICAL');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  standingsFilter === 'TACTICAL'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>🧠 戦術対戦ランキング</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              集計対象: {weeklyStandings.length} 名のマネージャー (勝利 3pt / 引分 1pt / 敗北 0pt)
            </div>
          </div>

          {/* Standings Table */}
          {isLoadingStandings ? (
            <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span>Supabaseより実在ユーザーの週間ランキングを集計中...</span>
            </div>
          ) : weeklyStandings.length === 0 ? (
            <div className="text-center py-14 px-4 space-y-3 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto text-xl">
                🏆
              </div>
              <div className="font-heading font-bold text-sm text-white">
                Season {selectedSeason} の対戦記録はまだありません
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                対戦ロビーから試合を行うと、週間ランキングに自動登録・反映されます！
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/90 text-slate-400 font-mono uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-16 text-center">Rank</th>
                    <th className="p-3">Manager / Best XI</th>
                    <th className="p-3 text-center">Matches</th>
                    <th className="p-3 text-center">W - D - L</th>
                    <th className="p-3 text-center">GD</th>
                    <th className="p-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {weeklyStandings.map((st) => {
                    const isMe = st.userId === userProfile.userId;

                    const getMedalBadge = (rank: number) => {
                      if (rank === 1) return '🥇 #1';
                      if (rank === 2) return '🥈 #2';
                      if (rank === 3) return '🥉 #3';
                      return `#${rank}`;
                    };

                    return (
                      <tr
                        key={st.userId}
                        className={
                          isMe
                            ? 'bg-indigo-950/50 text-indigo-100 font-bold border-l-4 border-indigo-400'
                            : st.rank <= 3
                            ? 'bg-slate-950/60 hover:bg-slate-900/60 text-slate-200'
                            : 'hover:bg-slate-950/40 text-slate-300'
                        }
                      >
                        <td className="p-3 text-center font-mono font-black">
                          <span className={
                            st.rank === 1
                              ? 'text-yellow-400 text-sm font-black'
                              : st.rank === 2
                              ? 'text-slate-300 text-sm font-black'
                              : st.rank === 3
                              ? 'text-amber-600 text-sm font-black'
                              : 'text-slate-400'
                          }>
                            {getMedalBadge(st.rank)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-black text-white">@{st.username}</span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-400/30">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {st.teamName} · <span className="font-mono text-amber-400 font-bold">OVR {st.teamOvr}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-300">
                          {st.matchesCount}
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span className="text-emerald-400 font-bold">{st.wins}</span>
                          <span className="text-slate-500 mx-1">-</span>
                          <span className="text-amber-400">{st.draws}</span>
                          <span className="text-slate-500 mx-1">-</span>
                          <span className="text-rose-400">{st.losses}</span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span className={st.goalDifference > 0 ? 'text-emerald-400' : st.goalDifference < 0 ? 'text-rose-400' : 'text-slate-400'}>
                            {st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference}
                          </span>
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
          )}
        </div>
      )}

      {/* TAB 5: MATCH HISTORY */}
      {activeTab === 'history' && !matchMode && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-heading font-black text-xl text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                <span>MATCH HISTORY (対戦履歴)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Supabaseクラウドに保存されたあなたの対戦履歴です（v1.1.3以降の週間シーズン対応）。
              </p>
            </div>
            <button
              onClick={() => refreshCommunityData(selectedSeason)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              <span>再読み込み</span>
            </button>
          </div>

          {matchHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 p-6">
              対戦履歴はまだありません。対戦ロビーから試合を行ってください。
            </div>
          ) : (
            <div className="space-y-3">
              {matchHistory.map((rec) => {
                const isWin = rec.result === 'WIN';
                const isDraw = rec.result === 'DRAW';

                return (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-md"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase font-mono tracking-wider flex items-center gap-1 ${
                            isWin
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : isDraw
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          {isWin ? '🏆 WIN' : isDraw ? '🤝 DRAW' : '❌ LOSS'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {rec.matchCategory || 'ASYNC'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {rec.matchType === 'OVR' ? '⚡ 総合値マッチ' : '🧠 戦術マッチ'}
                        </span>
                        {rec.season && (
                          <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-500/30">
                            Season {rec.season}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-white">
                        vs @{rec.opponentUsername}
                        <span className="text-xs font-normal text-slate-400 ml-1.5">
                          ({rec.opponentTeamName || 'Opponent Squad'})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {formatRelativeTime(rec.timestamp, language)} · {new Date(rec.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <div className={`font-heading font-black text-2xl sm:text-3xl font-mono tracking-wider ${
                        isWin ? 'text-emerald-400' : isDraw ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {rec.challengerScore} - {rec.opponentScore}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {rec.points > 0 ? `+${rec.points} pt` : '0 pt'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
