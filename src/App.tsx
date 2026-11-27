import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  GameMode,
  Language,
  Player,
  Club,
  Manager,
  NationalDecade,
  MainPosition,
  DraftHistoryEntry,
  FormationType,
  CustomPlayerPosition,
  FORMATIONS,
  UserTeam,
  CurrentDraftState,
  BlackBallSpinType,
} from './types';
import { ALL_CLUBS } from './data/clubs';
import {
  ALL_PLAYERS,
  getClubsByMode,
  getAvailableYears,
  findCandidatePlayers,
  getBlackBallOver100Players,
} from './data/playerDatabase';
import { findOver100BlackBallCandidates } from './data/legendaryEraDatabase';
import { findPurpleCandidates } from './data/purpleActivePlayers';
import {
  findNationalEraCandidates,
  pickRandomNationalEraCombo,
  getNationalTeamById,
  getLocalizedNationalTeamName,
  getDecadeLabel,
} from './data/nationalEraDatabase';
import {
  getDisallowedPositions,
  canDraftPlayerByPositionLimit,
  filterCandidatesByPositionLimits,
} from './utils/positionEngine';
import {
  UnifiedRarity,
  selectLeadCandidateByRarity,
  rollDraftStagingEvent,
} from './utils/rarityEngine';
import { drawManagerCandidates } from './data/managersDatabase';
import { TRANSLATIONS, getLocalizedPlayerName } from './utils/translations';
import { soundManager } from './utils/audio';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { SlotMachine } from './components/SlotMachine';
import { CandidateCard, NoCandidatesCard } from './components/CandidateCard';
import { PitchView } from './components/PitchView';
import { PvPView } from './components/PvPView';
import { PositionCountsBar } from './components/PositionCountsBar';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ModeSelectModal } from './components/ModeSelectModal';
import { ManagerDraftModal } from './components/ManagerDraftModal';
import { DraftRevealOverlay, DraftRevealTier, RevealStagingEvent } from './components/BlackBallAnimation';
import { getDefenseSquadId, setDefenseSquad } from './utils/pvpEngine';
import { saveLockedTeamToSupabase } from './utils/supabasePvP';
import { CelebrationModal } from './components/CelebrationModal';
import { ShareModal } from './components/ShareModal';
import { UpdateNotesModal } from './components/UpdateNotesModal';
import { GiftBoxModal } from './components/GiftBoxModal';
import { RewardScoutModal } from './components/RewardScoutModal';
import { LoginBonusModal } from './components/LoginBonusModal';
import { ItemBoxModal } from './components/ItemBoxModal';
import { ManagerSelectModal } from './components/ManagerSelectModal';
import { OnlineSyncDebugModal } from './components/OnlineSyncDebugModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  getStoredUserTickets,
  getStoredPresents,
  ensureApologyGiftDistributed,
  getTotalTicketsCount,
  PresentBoxItem,
  UserRewardTickets,
} from './utils/rewardScoutEngine';
import { RewardTicketType } from './types';
import {
  fetchUserProgress,
  fetchUserPresents,
  claimPresent,
  claimAllPresents,
  recordDraftedManager,
  ServerUserProgressPayload,
  getCachedUserProgress,
} from './utils/backendApi';
import { canClaimLoginBonusToday } from './utils/loginBonusEngine';
import {
  ensurePlayerTrainingDefaults,
  mergePlayerWithPersistedState,
  applyStateMapToTeams,
  updatePlayerAcrossTeams,
} from './utils/playerTrainingEngine';
import { checkAndPerformV132RankingReset } from './utils/supabasePvP';
import { getCurrentUserProfile } from './utils/pvpEngine';
import { initOnlineSyncManager } from './utils/onlineSyncManager';
import { CURRENT_VERSION } from './data/versionConfig';
import { DEFAULT_X_CHAR_LIMIT, STORAGE_KEY_X_CHAR_LIMIT } from './utils/shareUtils';
import { autoAssignSlot, remapPlayerSlots } from './utils/formationUtils';
import confetti from 'canvas-confetti';
import { CheckCircle2, Share2 } from 'lucide-react';

// Dedicated LocalStorage Keys
const STORAGE_KEY_TEAMS = 'footballDraft_teams';
const STORAGE_KEY_CURRENT_DRAFT = 'footballDraft_currentDraft';
const STORAGE_KEY_HISTORY = 'footballDraft_history';
const STORAGE_KEY_SETTINGS = 'footballDraft_settings';

// Legacy keys for backward compatibility migration
const LEGACY_STORAGE_KEY_HISTORY = 'football_draft_history_v1';
const LEGACY_STORAGE_KEY_SAVED_SQUAD = 'football_draft_current_squad_v1';
const LEGACY_STORAGE_KEY_LANG = 'football_draft_lang';

function createDefaultTeam(teamNumber = 1, mode: GameMode = 'europe'): UserTeam {
  return {
    teamId: `team_${Date.now()}_${teamNumber}`,
    teamNumber,
    name: `TEAM ${teamNumber}`,
    mode,
    players: [],
    formation: '4-3-3',
    playerSlots: {},
    customPositions: {},
    isCompleted: false,
    draftSkipsRemaining: 3,
    createdAt: Date.now(),
  };
}

export default function App() {
  // 1. Settings state (Language & Sound)
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.language) return parsed.language;
        }
        const legacyLang = localStorage.getItem(LEGACY_STORAGE_KEY_LANG);
        if (legacyLang === 'ja' || legacyLang === 'en' || legacyLang === 'es') return legacyLang;
      } catch (e) {
        // ignore
      }
    }
    return 'ja';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (typeof parsed.soundEnabled === 'boolean') return parsed.soundEnabled;
        }
      } catch (e) {
        // ignore
      }
    }
    return true;
  });

  const [xCharLimit, setXCharLimit] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedLimit = localStorage.getItem(STORAGE_KEY_X_CHAR_LIMIT);
        if (savedLimit) {
          const val = Number(savedLimit);
          if (!isNaN(val) && val > 0) return val;
        }
        const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (typeof parsed.xCharLimit === 'number' && parsed.xCharLimit > 0) return parsed.xCharLimit;
        }
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_X_CHAR_LIMIT;
  });

  const t = TRANSLATIONS[language];

  // 2. Navigation tab: 'home' | 'draft' | 'team' | 'history' | 'pvp'
  const [currentView, setCurrentView] = useState<'home' | 'draft' | 'team' | 'history' | 'pvp'>('home');

  // 3. Multi-Team Management state
  const [teams, setTeams] = useState<UserTeam[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_TEAMS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        // Check legacy squad
        const legacySquad = localStorage.getItem(LEGACY_STORAGE_KEY_SAVED_SQUAD);
        if (legacySquad) {
          const parsed = JSON.parse(legacySquad);
          if (Array.isArray(parsed.myTeam)) {
            const migratedTeam: UserTeam = {
              teamId: `team_migrated_${Date.now()}`,
              teamNumber: 1,
              name: 'TEAM 1',
              mode: 'europe',
              players: parsed.myTeam,
              formation: parsed.formation || '4-3-3',
              playerSlots: parsed.playerSlots || {},
              customPositions: parsed.customPositions || {},
              isCompleted: parsed.myTeam.length === 11,
              createdAt: Date.now(),
            };
            return [migratedTeam];
          }
        }
      } catch (e) {
        console.error('Failed to load teams', e);
      }
    }
    return [createDefaultTeam(1, 'europe')];
  });

  const [activeTeamId, setActiveTeamId] = useState<string>(() => {
    return teams[0]?.teamId || 'team_default';
  });

  // Defense Squad ID state
  const [defenseSquadId, setDefenseSquadId] = useState<string>(() => {
    return getDefenseSquadId(teams);
  });

  const handleSetDefenseSquad = (teamId: string) => {
    setDefenseSquad(teamId, teams);
    setDefenseSquadId(teamId);
  };

  // Keep activeTeam strictly synchronized
  const activeTeam = useMemo(() => {
    return teams.find((tItem) => tItem.teamId === activeTeamId) || teams[0] || createDefaultTeam(1, 'europe');
  }, [teams, activeTeamId]);

  // Mode derived from active team
  const mode = activeTeam.mode || 'europe';

  // 4. Draft state with persistent draft tracking
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedDecade, setSelectedDecade] = useState<NationalDecade | null>(null);
  const [selectedNationalTeamId, setSelectedNationalTeamId] = useState<string | null>(null);
  const [candidatePlayers, setCandidatePlayers] = useState<Player[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [hasCurrentDraft, setHasCurrentDraft] = useState<boolean>(false);
  const [skipsRemaining, setSkipsRemaining] = useState<number>(3);
  const [acquiredPlayerBanner, setAcquiredPlayerBanner] = useState<Player | null>(null);
  const [celebratingTeam, setCelebratingTeam] = useState<UserTeam | null>(null);
  const [lockedRarity, setLockedRarity] = useState<UnifiedRarity | null>(null);

  // Manager Draft & Tiered Reveal Overlay State
  const [isManagerDraftOpen, setIsManagerDraftOpen] = useState<boolean>(false);
  const [activeReveal, setActiveReveal] = useState<{
    tier: DraftRevealTier;
    stagingEvent?: RevealStagingEvent;
    player?: Player | null;
    manager?: Manager | null;
    rarityOverride?: UnifiedRarity | null;
    candidateCount?: number;
    onDone: () => void;
  } | null>(null);

  // Ref-managed spin timers so re-renders never leak or orphan timeouts
  const spinTimersRef = useRef<number[]>([]);
  const clearSpinTimers = useCallback(() => {
    spinTimersRef.current.forEach((id) => window.clearTimeout(id));
    spinTimersRef.current = [];
  }, []);

  const scheduleSpinTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    spinTimersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      clearSpinTimers();
    };
  }, [clearSpinTimers]);

  // Dynamic disallowed positions based on current squad (FW max 3, GK max 1, 11th must be GK if 0)
  const disallowedPositions = useMemo(
    () => getDisallowedPositions(activeTeam.players),
    [activeTeam.players]
  );

  // Black Ball, Golden Event & Purple Special State
  const [blackBallSpinType, setBlackBallSpinType] = useState<BlackBallSpinType>('none');
  const [blackBallStage, setBlackBallStage] = useState<
    'spinning-normal' | 'lightning-striking' | 'blackball-spinning' | 'golden-rain' | 'revealed'
  >('revealed');
  const [isBlackBallResult, setIsBlackBallResult] = useState<boolean>(false);
  const [isGoldenResult, setIsGoldenResult] = useState<boolean>(false);
  const [isPurpleResult, setIsPurpleResult] = useState<boolean>(false);
  const [isPurpleSpin, setIsPurpleSpin] = useState<boolean>(false);

  // Restore active draft state on boot
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY_CURRENT_DRAFT);
      if (savedDraft) {
        const parsed: CurrentDraftState = JSON.parse(savedDraft);
        if (parsed.hasCurrentDraft) {
          setSelectedYear(parsed.selectedYear);
          setSelectedClub(parsed.selectedClub);
          if (parsed.selectedDecade) setSelectedDecade(parsed.selectedDecade);
          if (parsed.selectedNationalTeamId) setSelectedNationalTeamId(parsed.selectedNationalTeamId);
          setCandidatePlayers(parsed.candidatePlayers || []);
          setHasCurrentDraft(parsed.hasCurrentDraft);
          const matchedTeam = parsed.activeTeamId ? teams.find((tItem) => tItem.teamId === parsed.activeTeamId) : activeTeam;
          setSkipsRemaining(matchedTeam?.draftSkipsRemaining ?? parsed.skipsRemaining ?? 3);
          setBlackBallSpinType(parsed.blackBallSpinType || 'none');
          setBlackBallStage(parsed.blackBallStage || 'revealed');
          setIsBlackBallResult(parsed.isBlackBallResult || false);
          setIsGoldenResult(parsed.isGoldenResult || false);
          setIsPurpleResult(parsed.isPurpleResult || false);
          setLockedRarity(parsed.lockedRarity || null);
          if (parsed.activeTeamId && teams.some((tItem) => tItem.teamId === parsed.activeTeamId)) {
            setActiveTeamId(parsed.activeTeamId);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load current draft state', e);
    }
  }, []);

  // Save current draft state to localStorage
  useEffect(() => {
    try {
      const draftState: CurrentDraftState = {
        activeTeamId: activeTeam.teamId,
        mode: activeTeam.mode,
        selectedYear,
        selectedClub,
        selectedDecade,
        selectedNationalTeamId,
        candidatePlayers,
        isSpinning,
        hasCurrentDraft,
        skipsRemaining,
        blackBallSpinType,
        blackBallStage,
        isBlackBallResult,
        isGoldenResult,
        isPurpleResult,
        lockedRarity: lockedRarity || undefined,
      };
      localStorage.setItem(STORAGE_KEY_CURRENT_DRAFT, JSON.stringify(draftState));
    } catch (e) {
      console.error('Failed to save current draft state', e);
    }
  }, [
    activeTeam.teamId,
    activeTeam.mode,
    selectedYear,
    selectedClub,
    selectedDecade,
    selectedNationalTeamId,
    candidatePlayers,
    isSpinning,
    hasCurrentDraft,
    skipsRemaining,
    blackBallSpinType,
    blackBallStage,
    isBlackBallResult,
    isGoldenResult,
    isPurpleResult,
    lockedRarity,
  ]);

  // 5. Persistent History state (never wiped on game reset)
  const [draftHistory, setDraftHistory] = useState<DraftHistoryEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (saved) return JSON.parse(saved);
        const legacyHistory = localStorage.getItem(LEGACY_STORAGE_KEY_HISTORY);
        if (legacyHistory) return JSON.parse(legacyHistory);
      } catch (e) {
        console.error('Failed to load draft history', e);
      }
    }
    return [];
  });

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(draftHistory));
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, [draftHistory]);

  // Save teams to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
    } catch (e) {
      console.error('Failed to save teams', e);
    }
  }, [teams]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_SETTINGS,
        JSON.stringify({ language, soundEnabled, xCharLimit })
      );
      localStorage.setItem(STORAGE_KEY_X_CHAR_LIMIT, String(xCharLimit));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [language, soundEnabled, xCharLimit]);

  // Modals
  const [isModeSelectOpen, setIsModeSelectOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isUpdateNotesOpen, setIsUpdateNotesOpen] = useState<boolean>(false);
  const [sharingTeam, setSharingTeam] = useState<UserTeam | null>(null);

  // Modals for Gift Box, Reward Scout, Item Box, Login Bonus & Manager Select
  const [isGiftBoxOpen, setIsGiftBoxOpen] = useState<boolean>(false);
  const [isRewardScoutOpen, setIsRewardScoutOpen] = useState<boolean>(false);
  const [isItemBoxOpen, setIsItemBoxOpen] = useState<boolean>(false);
  const [isLoginBonusOpen, setIsLoginBonusOpen] = useState<boolean>(false);
  const [isManagerSelectOpen, setIsManagerSelectOpen] = useState<boolean>(false);
  const [scoutInitialTicketType, setScoutInitialTicketType] = useState<RewardTicketType | null>(null);
  const [isSyncDebugOpen, setIsSyncDebugOpen] = useState<boolean>(false);
  const [rewardTickets, setRewardTickets] = useState<UserRewardTickets>(() => getStoredUserTickets());
  const [presents, setPresents] = useState<PresentBoxItem[]>([]);

  // User Profile for persistent rewards & Ver.1.6.0 inventory/training progress
  const userProfile = useMemo(() => getCurrentUserProfile(activeTeam, teams), [activeTeam, teams]);
  const effectiveUserId = userProfile.userId || 'local_guest';

  const [userProgress, setUserProgress] = useState<ServerUserProgressPayload>(() =>
    getCachedUserProgress('local_guest')
  );

  const applyServerProgress = useCallback((nextProgress: ServerUserProgressPayload) => {
    setUserProgress(nextProgress);
    setRewardTickets({
      normal_ticket: nextProgress.inventory.normal_ticket || 0,
      legend_10: nextProgress.inventory.legend_10 || 0,
      legend_20: nextProgress.inventory.legend_20 || 0,
      legend_50: nextProgress.inventory.legend_50 || 0,
      legend_70: nextProgress.inventory.legend_70 || 0,
      legend_guaranteed: nextProgress.inventory.legend_guaranteed || 0,
      purple_20: nextProgress.inventory.purple_20 || 0,
      purple_50: nextProgress.inventory.purple_50 || 0,
      purple_guaranteed: nextProgress.inventory.purple_guaranteed || 0,
      legend_purple_50: nextProgress.inventory.legend_purple_50 || 0,
      legend_purple_guaranteed: nextProgress.inventory.legend_purple_guaranteed || 0,
      japan_star_guaranteed: nextProgress.inventory.japan_star_guaranteed || 0,
      japan_legend_50: nextProgress.inventory.japan_legend_50 || 0,
      japan_legend_guaranteed: nextProgress.inventory.japan_legend_guaranteed || 0,
    });
    if (nextProgress.playerStates && Object.keys(nextProgress.playerStates).length > 0) {
      setTeams((prev) => applyStateMapToTeams(prev, nextProgress.playerStates));
    }
  }, []);

  const totalItemBoxCount = useMemo(
    () =>
      Object.values(userProgress.inventory || {}).reduce<number>(
        (sum, count) => sum + (Number(count) || 0),
        0
      ),
    [userProgress.inventory]
  );

  const canClaimLoginBonus = useMemo(
    () => canClaimLoginBonusToday(userProgress.loginBonus),
    [userProgress.loginBonus]
  );

  const presentsMutationEpochRef = useRef<number>(0);

  // Initial mount: v1.3.2 ranking reset, Ver.1.6.0 server presents & inventory/training sync
  useEffect(() => {
    let cancelled = false;
    const mountEpoch = presentsMutationEpochRef.current;
    checkAndPerformV132RankingReset();

    const cachedProgress = getCachedUserProgress(effectiveUserId);
    applyServerProgress(cachedProgress);
    const initialLocalPresents = ensureApologyGiftDistributed(effectiveUserId);
    setPresents(initialLocalPresents);

    Promise.all([
      fetchUserPresents(effectiveUserId),
      fetchUserProgress(effectiveUserId),
    ])
      .then(([serverPresents, progressRes]) => {
        if (cancelled || presentsMutationEpochRef.current !== mountEpoch) return;
        setPresents(serverPresents);
        applyServerProgress(progressRes.progress);
      })
      .catch((err) => {
        console.warn('Initial Ver.1.6.0 server sync fallback:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveUserId, applyServerProgress]);

  // Version 1.5.0 Online Sync Heartbeat & Automatic 10-Minute Periodic Sync
  useEffect(() => {
    const cleanup = initOnlineSyncManager();
    return cleanup;
  }, []);

  const refreshPresentsFromServer = useCallback(async () => {
    const epochBefore = presentsMutationEpochRef.current;
    const serverPresents = await fetchUserPresents(effectiveUserId);
    if (presentsMutationEpochRef.current === epochBefore) {
      setPresents(serverPresents);
    }
  }, [effectiveUserId]);

  const handleClaimGift = async (giftId: string) => {
    presentsMutationEpochRef.current += 1;
    const res = await claimPresent(effectiveUserId, giftId, presents);
    if (Array.isArray(res.updatedPresents)) {
      setPresents(res.updatedPresents);
    }
    if (res.progress) {
      applyServerProgress(res.progress);
    } else if (res.success && res.updatedTickets) {
      setRewardTickets((prev) => ({ ...prev, ...res.updatedTickets }));
    }
    if (!res.success) {
      return {
        ok: false,
        message: res.error || 'プレゼントの受け取りに失敗しました。',
      };
    }
    return {
      ok: true,
      message: res.claimedItem ? `「${res.claimedItem.title}」を受け取りました！` : 'プレゼントを受け取りました！',
    };
  };

  const handleClaimAllGifts = async () => {
    presentsMutationEpochRef.current += 1;
    const res = await claimAllPresents(effectiveUserId, presents);
    if (Array.isArray(res.updatedPresents)) {
      setPresents(res.updatedPresents);
    }
    if (res.progress) {
      applyServerProgress(res.progress);
    } else if (res.success && res.updatedTickets) {
      setRewardTickets((prev) => ({ ...prev, ...res.updatedTickets }));
    }
    if (!res.success) {
      return {
        ok: false,
        claimedCount: 0,
        message: res.error || '一括受取に失敗しました。',
      };
    }
    if (res.claimedCount <= 0) {
      return {
        ok: false,
        claimedCount: 0,
        message: '受取可能なプレゼントはありません。',
      };
    }
    return {
      ok: true,
      claimedCount: res.claimedCount,
      message: `${res.claimedCount}件のプレゼントを一括で受け取りました！`,
    };
  };

  // Language & Sound handlers
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.sfxEnabled = next;
  };

  // Mutate active team properties in teams state (prevent mutation if locked)
  const updateActiveTeam = (updater: (prevTeam: UserTeam) => UserTeam) => {
    if (activeTeam.isLocked) {
      console.warn('Cannot edit locked team');
      return;
    }
    setTeams((prevTeams) =>
      prevTeams.map((tItem) => {
        if (tItem.teamId === activeTeam.teamId) {
          return updater(tItem);
        }
        return tItem;
      })
    );
  };

  // Team Lock handler (v1.2.0)
  const handleToggleTeamLock = (teamId: string, willLock: boolean) => {
    let updatedList: UserTeam[] = [];
    setTeams((prevTeams) => {
      updatedList = prevTeams.map((tItem) =>
        tItem.teamId === teamId ? { ...tItem, isLocked: willLock } : tItem
      );
      return updatedList;
    });

    const target = (updatedList.length > 0 ? updatedList : teams).find((t) => t.teamId === teamId);
    if (target) {
      if (willLock) {
        handleSetDefenseSquad(teamId);
      }
      saveLockedTeamToSupabase({ ...target, isLocked: willLock }).catch((err) => {
        console.warn('Sync locked team to Supabase failed:', err);
      });
    }
  };

  // SWITCH ACTIVE TEAM (Strictly preserves each team's own skips & draft state)
  const switchActiveTeam = (targetTeamId: string) => {
    if (targetTeamId === activeTeamId) return;
    clearSpinTimers();
    setActiveReveal(null);

    // Snapshot current active team's draft state
    const currentDraftStateSnapshot: CurrentDraftState = {
      activeTeamId,
      mode: activeTeam.mode,
      selectedYear,
      selectedClub,
      selectedDecade,
      selectedNationalTeamId,
      candidatePlayers,
      isSpinning: false,
      hasCurrentDraft,
      skipsRemaining,
      blackBallSpinType,
      blackBallStage,
      isBlackBallResult,
      isGoldenResult,
      isPurpleResult,
      lockedRarity: lockedRarity || undefined,
    };

    // Save snapshot to current active team
    setTeams((prev) =>
      prev.map((t) => {
        if (t.teamId === activeTeamId) {
          return {
            ...t,
            draftSkipsRemaining: skipsRemaining,
            draftState: currentDraftStateSnapshot,
          };
        }
        return t;
      })
    );

    // Find and switch to target team
    const targetTeam = teams.find((t) => t.teamId === targetTeamId);
    if (targetTeam) {
      setActiveTeamId(targetTeamId);

      if (targetTeam.draftState && !targetTeam.isCompleted) {
        const ds = targetTeam.draftState;
        setSelectedYear(ds.selectedYear);
        setSelectedClub(ds.selectedClub);
        setSelectedDecade(ds.selectedDecade ?? null);
        setSelectedNationalTeamId(ds.selectedNationalTeamId ?? null);
        setCandidatePlayers(ds.candidatePlayers || []);
        setIsSpinning(false);
        setHasCurrentDraft(ds.hasCurrentDraft || false);
        setSkipsRemaining(targetTeam.draftSkipsRemaining ?? ds.skipsRemaining ?? 3);
        setBlackBallSpinType(ds.blackBallSpinType || 'none');
        setBlackBallStage(ds.blackBallStage || 'revealed');
        setIsBlackBallResult(ds.isBlackBallResult || false);
        setIsGoldenResult(ds.isGoldenResult || false);
        setIsPurpleResult(ds.isPurpleResult || false);
        setLockedRarity(ds.lockedRarity ?? null);
      } else {
        setSelectedYear(null);
        setSelectedClub(null);
        setSelectedDecade(null);
        setSelectedNationalTeamId(null);
        setCandidatePlayers([]);
        setIsSpinning(false);
        setHasCurrentDraft(false);
        // Use team's recorded skips or initial 3
        setSkipsRemaining(targetTeam.draftSkipsRemaining ?? 3);
        setBlackBallSpinType('none');
        setBlackBallStage('revealed');
        setIsBlackBallResult(false);
        setIsGoldenResult(false);
        setIsPurpleResult(false);
        setLockedRarity(null);
      }
    }
  };

  // CREATE NEW TEAM (Team 2, Team 3, etc.) — unlocks Manager Draft for the new game/team
  const handleCreateNewTeam = () => {
    clearSpinTimers();
    setActiveReveal(null);
    // Save current active team state before switching
    setTeams((prev) =>
      prev.map((t) => {
        if (t.teamId === activeTeamId) {
          return {
            ...t,
            draftSkipsRemaining: skipsRemaining,
          };
        }
        return t;
      })
    );

    const nextTeamNumber = teams.length + 1;
    const newTeam = createDefaultTeam(nextTeamNumber, mode);
    setTeams((prev) => [...prev, newTeam]);
    setActiveTeamId(newTeam.teamId);

    // Reset draft state for new team
    setSelectedYear(null);
    setSelectedClub(null);
    setSelectedDecade(null);
    setSelectedNationalTeamId(null);
    setCandidatePlayers([]);
    setIsSpinning(false);
    setHasCurrentDraft(false);
    setSkipsRemaining(3);
    setAcquiredPlayerBanner(null);
    setBlackBallSpinType('none');
    setBlackBallStage('revealed');
    setIsBlackBallResult(false);
    setIsGoldenResult(false);
    setIsPurpleResult(false);
    setIsPurpleSpin(false);
    setLockedRarity(null);

    setCurrentView('draft');
  };

  // DELETE TEAM (Strictly protect locked teams)
  const handleDeleteTeam = (teamId: string) => {
    const target = teams.find((tItem) => tItem.teamId === teamId);
    if (!target) return;
    if (target.isLocked) {
      console.warn('Cannot delete locked team:', teamId);
      return;
    }
    if (teams.length <= 1) return;
    const filtered = teams.filter((tItem) => tItem.teamId !== teamId);
    setTeams(filtered);
    if (activeTeamId === teamId) {
      setActiveTeamId(filtered[0].teamId);
    }
  };

  // SELECT ACTIVE TEAM
  const handleSelectTeam = (teamId: string) => {
    switchActiveTeam(teamId);
  };

  // CONTINUE DRAFT FOR A SPECIFIC TEAM
  const handleContinueDraft = (teamId: string) => {
    switchActiveTeam(teamId);
    setCurrentView('draft');
  };

  // Change mode for active team or start fresh mode
  const handleSelectMode = (newMode: GameMode) => {
    clearSpinTimers();
    setActiveReveal(null);
    updateActiveTeam((prev) => ({
      ...prev,
      mode: newMode,
    }));
    setSelectedYear(null);
    setSelectedClub(null);
    setSelectedDecade(null);
    setSelectedNationalTeamId(null);
    setCandidatePlayers([]);
    setIsSpinning(false);
    setHasCurrentDraft(false);
    setSkipsRemaining(3);
    setAcquiredPlayerBanner(null);
    setBlackBallSpinType('none');
    setBlackBallStage('revealed');
    setIsBlackBallResult(false);
    setIsGoldenResult(false);
    setIsPurpleResult(false);
    setIsPurpleSpin(false);
    setLockedRarity(null);
  };

  // Reset ALL game data (Teams + Draft). HISTORY remains completely preserved! Locked teams are strictly protected!
  const handleResetGame = () => {
    clearSpinTimers();
    setActiveReveal(null);
    const lockedTeams = teams.filter((t) => t.isLocked);
    let nextTeams: UserTeam[];
    if (lockedTeams.length > 0) {
      nextTeams = lockedTeams;
    } else {
      nextTeams = [createDefaultTeam(1, mode)];
    }
    setTeams(nextTeams);
    setActiveTeamId(nextTeams[0].teamId);

    setSelectedYear(null);
    setSelectedClub(null);
    setSelectedDecade(null);
    setSelectedNationalTeamId(null);
    setCandidatePlayers([]);
    setIsSpinning(false);
    setHasCurrentDraft(false);
    setSkipsRemaining(3);
    setAcquiredPlayerBanner(null);
    setBlackBallSpinType('none');
    setBlackBallStage('revealed');
    setIsBlackBallResult(false);
    setIsGoldenResult(false);
    setIsPurpleResult(false);
    setIsPurpleSpin(false);
    setLockedRarity(null);

    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_DRAFT);
      if (lockedTeams.length > 0) {
        localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(lockedTeams));
      } else {
        localStorage.removeItem(STORAGE_KEY_TEAMS);
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY_SAVED_SQUAD);
    } catch (e) {
      // ignore
    }
  };

  // Clear History only
  const handleClearHistory = () => {
    setDraftHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
      localStorage.removeItem(LEGACY_STORAGE_KEY_HISTORY);
    } catch (e) {
      // ignore
    }
  };

  // Delete a single entry from history
  const handleDeleteHistoryEntry = (entryId: string) => {
    setDraftHistory((prev) => prev.filter((item) => item.id !== entryId));
  };

  // CORE ROULETTE SPIN LOGIC (Unified rarity resolution across Draw -> Staging -> Card)
  const handleSpinDraft = () => {
    if (isSpinning || hasCurrentDraft || activeTeam.players.length >= 11) return;

    clearSpinTimers();
    setActiveReveal(null);
    soundManager.playButtonClick();
    setIsSpinning(true);
    setHasCurrentDraft(true);
    setCandidatePlayers([]);
    setAcquiredPlayerBanner(null);
    setIsBlackBallResult(false);
    setIsGoldenResult(false);
    setIsPurpleResult(false);
    setIsPurpleSpin(false);
    setLockedRarity(null);

    const currentTeamPlayerIds = activeTeam.players.map((p) => p.playerId);
    const currentTeamPersonIds = activeTeam.players.map((p) => p.personId);
    const disallowed = getDisallowedPositions(activeTeam.players);
    const disallowedSet = new Set<MainPosition>(disallowed);

    // 🌍 MODE 3: ERA × NATIONAL TEAM ROULETTE (Pure random draw; empty combos excluded)
    if (mode === 'national_era') {
      setBlackBallSpinType('none');
      setBlackBallStage('spinning-normal');

      scheduleSpinTimer(() => {
        const combo = pickRandomNationalEraCombo(
          currentTeamPlayerIds,
          currentTeamPersonIds,
          disallowed
        );
        const rawCandidates = findNationalEraCandidates(
          combo.decade,
          combo.team.id,
          currentTeamPlayerIds,
          currentTeamPersonIds,
          disallowed
        );
        const candidates = filterCandidatesByPositionLimits(rawCandidates, activeTeam.players);

        setSelectedDecade(combo.decade);
        setSelectedNationalTeamId(combo.team.id);
        soundManager.playSlotStop();

        if (candidates.length > 0) {
          const { leadPlayer, rarity } = selectLeadCandidateByRarity(candidates);
          const normalTier: DraftRevealTier =
            leadPlayer && (leadPlayer.rating >= 85 || leadPlayer.isLegendary) ? 'high' : 'normal';
          setLockedRarity(rarity === 'black' || rarity === 'golden' || rarity === 'purple' ? 'star' : rarity);
          setIsBlackBallResult(false);
          setIsGoldenResult(false);
          setIsPurpleResult(false);
          setIsSpinning(false);

          setActiveReveal({
            tier: normalTier,
            stagingEvent: 'normal',
            player: leadPlayer,
            rarityOverride: rarity,
            candidateCount: candidates.length,
            onDone: () => {
              setActiveReveal(null);
              setCandidatePlayers(candidates);
              setBlackBallStage('revealed');
            },
          });
        } else {
          setCandidatePlayers([]);
          setIsSpinning(false);
          setBlackBallStage('revealed');
        }
      }, 1050);
      return;
    }

    const clubs = getClubsByMode(mode);
    const years = getAvailableYears(mode);

    // Mutually exclusive per-spin draw roll:
    // 1.8% Black Ball (All candidates strictly OVR 100+) | 3.0% Purple | 95.2% Normal
    const stagingEventRoll = rollDraftStagingEvent();

    // ⚫ 1.8% ULTRA RARE: BLACK BALL (All candidates MUST have OVR >= 100 and NEVER Purple)
    if (stagingEventRoll === 'blackball') {
      const over100Candidates = filterCandidatesByPositionLimits(
        findOver100BlackBallCandidates(
          mode,
          getBlackBallOver100Players(),
          currentTeamPlayerIds,
          currentTeamPersonIds,
          3,
          disallowed
        ),
        activeTeam.players
      ).filter((p) => p.rating >= 100 && !p.playerId.startsWith('purple_'));

      if (over100Candidates.length > 0) {
        const isLightning = Math.random() < 0.7;
        const spinType: BlackBallSpinType = isLightning ? 'lightning-blackball' : 'normal-blackball';

        setIsPurpleSpin(false);
        setBlackBallSpinType(spinType);
        setBlackBallStage('spinning-normal');
        soundManager.playBlackBallAura();

        if (isLightning) {
          scheduleSpinTimer(() => {
            setBlackBallStage('lightning-striking');
            soundManager.playLightningElectricBuzz();
          }, 360);
          scheduleSpinTimer(() => {
            setBlackBallStage('blackball-spinning');
          }, 720);
        } else {
          scheduleSpinTimer(() => {
            setBlackBallStage('blackball-spinning');
          }, 480);
        }

        scheduleSpinTimer(() => {
          const { leadPlayer } = selectLeadCandidateByRarity(over100Candidates);
          const primaryPlayer = leadPlayer || over100Candidates[0];
          const matchedClub =
            clubs.find((c) => c.id === primaryPlayer.clubId) ||
            ALL_CLUBS.find((c) => c.id === primaryPlayer.clubId) ||
            clubs[0];

          setSelectedYear(primaryPlayer.joiningYear);
          setSelectedClub(matchedClub);
          setIsSpinning(false);
          setLockedRarity('black');
          setIsBlackBallResult(true);
          setIsGoldenResult(false);
          setIsPurpleResult(false);
          soundManager.playSlotStop();

          setActiveReveal({
            tier: 'supreme',
            stagingEvent: 'blackball',
            player: primaryPlayer,
            rarityOverride: 'black',
            candidateCount: over100Candidates.length,
            onDone: () => {
              setActiveReveal(null);
              setBlackBallStage('revealed');
              setCandidatePlayers(over100Candidates);
              soundManager.playGoldenFanfare();
              confetti({
                particleCount: 180,
                spread: 110,
                origin: { y: 0.5 },
                colors: ['#fde047', '#fbbf24', '#ffffff', '#18181b'],
              });
            },
          });
        }, 1250);
        return;
      }
    }

    // 🟣 3.0% PURPLE SPECIAL EVENT (Active Superstars, 3 distinct positions)
    if (stagingEventRoll === 'purple') {
      const purpleCandidates = filterCandidatesByPositionLimits(
        findPurpleCandidates(currentTeamPlayerIds, currentTeamPersonIds, 3, disallowed),
        activeTeam.players
      );

      if (purpleCandidates.length > 0) {
        setIsPurpleSpin(true);
        setBlackBallSpinType('none');
        setBlackBallStage('spinning-normal');
        soundManager.playBlackBallAura();

        scheduleSpinTimer(() => {
          setBlackBallStage('lightning-striking');
          soundManager.playGoldenLightning();
        }, 380);

        scheduleSpinTimer(() => {
          setBlackBallStage('blackball-spinning');
        }, 780);

        scheduleSpinTimer(() => {
          const { leadPlayer } = selectLeadCandidateByRarity(purpleCandidates);
          const primaryPlayer = leadPlayer || purpleCandidates[0];
          setSelectedYear(primaryPlayer.joiningYear);
          const matchedClub = clubs.find((c) => c.id === primaryPlayer.clubId) || {
            id: primaryPlayer.clubId || 'special_purple',
            name: primaryPlayer.clubName,
            nameJa: primaryPlayer.clubName,
            nameEn: primaryPlayer.clubName,
            nameEs: primaryPlayer.clubName,
            shortName: (primaryPlayer.clubName || 'SPL').slice(0, 3).toUpperCase(),
            league: 'Active Superstars',
            country: 'World',
            countryFlag: primaryPlayer.nationalityFlag || '🌐',
            badgeSymbol: '🟣',
            primaryColor: '#a855f7',
            secondaryColor: '#ec4899',
          };
          setSelectedClub(matchedClub);
          setIsSpinning(false);
          setIsPurpleSpin(false);
          setLockedRarity('purple');
          setIsBlackBallResult(false);
          setIsGoldenResult(false);
          setIsPurpleResult(true);
          soundManager.playSlotStop();

          setActiveReveal({
            tier: 'supreme',
            stagingEvent: 'purple',
            player: primaryPlayer,
            rarityOverride: 'purple',
            candidateCount: purpleCandidates.length,
            onDone: () => {
              setActiveReveal(null);
              setBlackBallStage('revealed');
              setCandidatePlayers(purpleCandidates);
              soundManager.playVictory();
              confetti({
                particleCount: 160,
                spread: 100,
                origin: { y: 0.5 },
                colors: ['#d946ef', '#a855f7', '#8b5cf6', '#ffffff', '#ec4899', '#f0abfc'],
              });
            },
          });
        }, 1250);
        return;
      }
    }

    // ⚽ 95.2% NORMAL ROULETTE SPIN (Strictly NEVER triggers Black Ball or Purple staging)
    setBlackBallSpinType('none');
    setBlackBallStage('spinning-normal');
    setIsBlackBallResult(false);
    setIsGoldenResult(false);
    setIsPurpleResult(false);
    setIsPurpleSpin(false);

    scheduleSpinTimer(() => {
      // 80% weighted selection toward populated normal combinations that obey position limits
      const matchingPlayers = ALL_PLAYERS.filter(
        (p) =>
          p.rating < 100 &&
          !p.playerId.startsWith('bd_special_') &&
          !p.playerId.startsWith('purple_') &&
          p.clubId &&
          clubs.some((c) => c.id === p.clubId) &&
          !disallowedSet.has(p.position) &&
          !currentTeamPlayerIds.includes(p.playerId) &&
          !currentTeamPersonIds.includes(p.personId)
      );

      let targetYear: number;
      let targetClub: Club;

      if (matchingPlayers.length > 0 && Math.random() < 0.8) {
        const totalWeight = matchingPlayers.reduce(
          (acc, p) => acc + (p.isLegendary ? 1.15 : 1.0),
          0
        );
        let randomWeight = Math.random() * totalWeight;
        let pickedPlayer = matchingPlayers[0];
        for (const p of matchingPlayers) {
          const weight = p.isLegendary ? 1.15 : 1.0;
          if (randomWeight < weight) {
            pickedPlayer = p;
            break;
          }
          randomWeight -= weight;
        }
        targetYear = pickedPlayer.joiningYear;
        targetClub = clubs.find((c) => c.id === pickedPlayer.clubId) || clubs[0];
      } else {
        targetYear = years[Math.floor(Math.random() * years.length)];
        targetClub = clubs[Math.floor(Math.random() * clubs.length)];
      }

      setSelectedYear(targetYear);
      setSelectedClub(targetClub);
      soundManager.playSlotStop();

      // Search matching real candidates strictly obeying disallowed positions
      const candidates = filterCandidatesByPositionLimits(
        findCandidatePlayers(
          mode,
          targetYear,
          targetClub.id,
          currentTeamPlayerIds,
          currentTeamPersonIds,
          disallowed
        ),
        activeTeam.players
      );

      setIsSpinning(false);

      if (candidates.length > 0) {
        const { leadPlayer, rarity } = selectLeadCandidateByRarity(candidates);
        const normalTier: DraftRevealTier =
          leadPlayer && (leadPlayer.rating >= 85 || leadPlayer.isLegendary) ? 'high' : 'normal';
        setLockedRarity(rarity === 'black' || rarity === 'golden' || rarity === 'purple' ? 'star' : rarity);
        setIsBlackBallResult(false);
        setIsGoldenResult(false);
        setIsPurpleResult(false);

        setActiveReveal({
          tier: normalTier,
          stagingEvent: 'normal',
          player: leadPlayer,
          rarityOverride: rarity,
          candidateCount: candidates.length,
          onDone: () => {
            setActiveReveal(null);
            setCandidatePlayers(candidates);
            setBlackBallStage('revealed');
          },
        });
      } else {
        setCandidatePlayers([]);
        setBlackBallStage('revealed');
      }
    }, 1050);
  };

  // Handle Skip (consumes 1 skip count and unlocks next spin)
  const handleSkip = () => {
    if (skipsRemaining <= 0 || isSpinning) return;
    clearSpinTimers();
    setActiveReveal(null);
    soundManager.playSkip();
    const nextSkips = Math.max(0, skipsRemaining - 1);
    setSkipsRemaining(nextSkips);
    updateActiveTeam((prev) => ({
      ...prev,
      draftSkipsRemaining: nextSkips,
    }));
    setCandidatePlayers([]);
    setSelectedYear(null);
    setSelectedClub(null);
    setSelectedDecade(null);
    setSelectedNationalTeamId(null);
    setHasCurrentDraft(false);
    setIsBlackBallResult(false);
    setIsGoldenResult(false);
    setIsPurpleResult(false);
    setIsPurpleSpin(false);
    setBlackBallSpinType('none');
    setLockedRarity(null);
  };

  // Handle Free Skip / Next Draft (When No Players Found)
  const handleNextDraftFree = () => {
    clearSpinTimers();
    setActiveReveal(null);
    soundManager.playButtonClick();
    setCandidatePlayers([]);
    setSelectedYear(null);
    setSelectedClub(null);
    setSelectedDecade(null);
    setSelectedNationalTeamId(null);
    setHasCurrentDraft(false);
    setIsBlackBallResult(false);
    setIsGoldenResult(false);
    setIsPurpleResult(false);
    setIsPurpleSpin(false);
    setBlackBallSpinType('none');
    setLockedRarity(null);
  };

  // Handle Draft Player Selection (with FW<=3 / GK<=1 enforcement; finalized immediately without undo)
  const handleDraftPlayer = (rawPlayer: Player) => {
    if (activeTeam.isLocked || activeTeam.players.length >= 11) return;

    const player = mergePlayerWithPersistedState(
      ensurePlayerTrainingDefaults(rawPlayer),
      userProgress.playerStates?.[rawPlayer.playerId]
    );

    const limitCheck = canDraftPlayerByPositionLimit(activeTeam.players, player);
    if (!limitCheck.allowed) {
      soundManager.playError();
      return;
    }

    const newPlayers = [...activeTeam.players, player];
    const newSlots = autoAssignSlot(player, activeTeam.playerSlots, activeTeam.formation);

    // Double safeguard: ensure player.playerId is 100% assigned in newSlots
    if (!Object.values(newSlots).includes(player.playerId)) {
      const basePreset = activeTeam.formation === 'CUSTOM' ? '4-3-3' : activeTeam.formation;
      const fSlots = FORMATIONS[basePreset]?.slots || FORMATIONS['4-3-3'].slots;
      const openSlot = fSlots.find((s) => !newSlots[s.id]);
      if (openSlot) {
        newSlots[openSlot.id] = player.playerId;
      } else {
        newSlots[`slot_extra_${Date.now()}`] = player.playerId;
      }
    }

    const isCompleted = newPlayers.length === 11;

    const updatedTeam: UserTeam = {
      ...activeTeam,
      players: newPlayers,
      playerSlots: newSlots,
      isCompleted,
      completedAt: isCompleted ? Date.now() : activeTeam.completedAt,
      draftSkipsRemaining: skipsRemaining,
    };

    updateActiveTeam(() => updatedTeam);

    // Record to persistent Draft History with multilingual & national era metadata
    const dbClub = ALL_CLUBS.find((c) => c.id === player.clubId);
    const historyEntry: DraftHistoryEntry = {
      id: `${Date.now()}_${player.playerId}`,
      entryType: 'player',
      playerId: player.playerId,
      playerName: player.playerName,
      nameJa: player.nameJa,
      nameEn: player.nameEn,
      nameEs: player.nameEs,
      clubId: player.clubId,
      clubName: player.clubName,
      clubNameJa: dbClub?.nameJa,
      clubNameEn: dbClub?.nameEn,
      clubNameEs: dbClub?.nameEs,
      joiningYear: player.joiningYear,
      position: player.position,
      subPosition: player.subPosition,
      nationality: player.nationality,
      nationalityJa: player.nationalityJa,
      nationalityEn: player.nationalityEn,
      nationalityEs: player.nationalityEs,
      nationalityFlag: player.nationalityFlag,
      rating: player.rating,
      isLegendary: !!player.isLegendary,
      timestamp: Date.now(),
      mode,
      teamId: activeTeam.teamId,
      teamNumber: activeTeam.teamNumber,
      teamName: activeTeam.name,
      eraDecade: player.eraDecade,
      nationalTeamId: player.nationalTeamId,
    };
    setDraftHistory((prev) => [historyEntry, ...prev]);

    // Show "PLAYER ACQUIRED" notice
    setAcquiredPlayerBanner(player);
    setCandidatePlayers([]);

    // Check if 11 players completed!
    if (isCompleted) {
      soundManager.playVictory();
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        setAcquiredPlayerBanner(null);
        setHasCurrentDraft(false);
        setIsPurpleResult(false);
        setSelectedDecade(null);
        setSelectedNationalTeamId(null);
        setLockedRarity(null);
        setCelebratingTeam(updatedTeam);
      }, 1800);
    } else {
      setTimeout(() => {
        setAcquiredPlayerBanner(null);
        setSelectedYear(null);
        setSelectedClub(null);
        setSelectedDecade(null);
        setSelectedNationalTeamId(null);
        setHasCurrentDraft(false);
        setIsBlackBallResult(false);
        setIsGoldenResult(false);
        setIsPurpleResult(false);
        setBlackBallSpinType('none');
        setLockedRarity(null);
      }, 2000);
    }
  };

  // Manager Gacha Spin (Draws 3 unique real managers, persists them immediately so re-roll is impossible)
  const handleStartManagerGacha = () => {
    if (activeTeam.isLocked || activeTeam.managerDrafted || activeTeam.manager || isSpinning) {
      soundManager.playError();
      return;
    }

    // Never re-roll if 3 candidates are already drawn and waiting for selection
    if (activeTeam.pendingManagerCandidates && activeTeam.pendingManagerCandidates.length > 0) {
      soundManager.playButtonClick();
      setIsManagerDraftOpen(true);
      return;
    }

    clearSpinTimers();
    soundManager.playButtonClick();
    const drawn = drawManagerCandidates(3);
    if (drawn.length === 0) return;

    updateActiveTeam((prev) => ({
      ...prev,
      pendingManagerCandidates: drawn,
    }));

    setActiveReveal({
      tier: 'manager',
      manager: drawn[0],
      candidateCount: drawn.length,
      onDone: () => {
        setActiveReveal(null);
        setIsManagerDraftOpen(true);
      },
    });
  };

  // Opens Manager Draft — launches unified Gacha immediately if not spun yet, or opens the persisted 3-candidate picker / summary
  const handleOpenManagerDraft = () => {
    if (
      !activeTeam.isLocked &&
      !activeTeam.managerDrafted &&
      !activeTeam.manager &&
      !(activeTeam.pendingManagerCandidates && activeTeam.pendingManagerCandidates.length > 0)
    ) {
      handleStartManagerGacha();
      return;
    }
    soundManager.playButtonClick();
    setIsManagerDraftOpen(true);
  };

  // Draft Manager (Strictly 1 manager per team/game; recorded in MY TEAM & HISTORY)
  const handleDraftManager = (manager: Manager) => {
    if (activeTeam.isLocked || activeTeam.managerDrafted || activeTeam.manager) {
      soundManager.playError();
      return;
    }

    updateActiveTeam((prev) => ({
      ...prev,
      manager,
      managerDrafted: true,
      pendingManagerCandidates: [],
    }));

    const historyEntry: DraftHistoryEntry = {
      id: `manager_${Date.now()}_${manager.id}`,
      entryType: 'manager',
      manager,
      playerId: manager.id,
      playerName: manager.name,
      nameJa: manager.nameJa,
      nameEn: manager.nameEn,
      nameEs: manager.nameEs,
      clubId: 'manager',
      clubName: manager.clubsCoached.join(' / '),
      joiningYear: 2026,
      position: 'MF',
      nationality: manager.nationality,
      nationalityJa: manager.nationalityJa,
      nationalityEn: manager.nationalityEn,
      nationalityEs: manager.nationalityEs,
      nationalityFlag: manager.nationalityFlag,
      rating: manager.maxAffinity,
      isLegendary: manager.eraOrStatus === 'LEGEND',
      timestamp: Date.now(),
      mode,
      teamId: activeTeam.teamId,
      teamNumber: activeTeam.teamNumber,
      teamName: activeTeam.name,
    };
    setDraftHistory((prev) => [historyEntry, ...prev]);

    soundManager.playVictory();
    confetti({
      particleCount: 110,
      spread: 85,
      origin: { y: 0.55 },
      colors: ['#f59e0b', '#fbbf24', '#06b6d4', '#ffffff'],
    });

    recordDraftedManager(effectiveUserId, manager.id)
      .then(() => fetchUserProgress(effectiveUserId))
      .then((res) => applyServerProgress(res.progress))
      .catch(() => {});
  };

  const handleAssignManagerToTeam = (teamId: string, manager: Manager) => {
    setTeams((prev) =>
      prev.map((tItem) => {
        if (tItem.teamId !== teamId || tItem.isLocked) return tItem;
        return {
          ...tItem,
          manager,
        };
      })
    );
  };

  const handleAcquireScoutPlayer = (rawPlayer: Player) => {
    const player = mergePlayerWithPersistedState(
      ensurePlayerTrainingDefaults(rawPlayer),
      userProgress.playerStates?.[rawPlayer.playerId]
    );
    soundManager.playFanfare();
    let targetTeam = activeTeam;
    if (activeTeam.players.length < 11) {
      handleDraftPlayer(player);
      targetTeam = activeTeam;
    } else {
      const incompleteTeam = teams.find((t) => t.players.length < 11 && !t.isLocked);
      if (incompleteTeam) {
        targetTeam = incompleteTeam;
        setActiveTeamId(incompleteTeam.teamId);
        const newPlayers = [...incompleteTeam.players, player];
        const newSlots = autoAssignSlot(player, incompleteTeam.playerSlots, incompleteTeam.formation);
        const isCompleted = newPlayers.length === 11;
        const updated: UserTeam = {
          ...incompleteTeam,
          players: newPlayers,
          playerSlots: newSlots,
          isCompleted,
          completedAt: isCompleted ? Date.now() : incompleteTeam.completedAt,
        };
        setTeams((prev) => prev.map((t) => (t.teamId === incompleteTeam.teamId ? updated : t)));
      } else {
        const newTeamNum = teams.length + 1;
        const newTeam = createDefaultTeam(newTeamNum, activeTeam.mode);
        newTeam.players = [player];
        newTeam.playerSlots = autoAssignSlot(player, {}, newTeam.formation);
        setTeams((prev) => [...prev, newTeam]);
        setActiveTeamId(newTeam.teamId);
        targetTeam = newTeam;
      }

      // Record in draft history
      const historyEntry: DraftHistoryEntry = {
        id: `scout_history_${Date.now()}_${player.playerId}`,
        playerId: player.playerId,
        playerName: player.playerName,
        nameJa: player.nameJa,
        nameEn: player.nameEn,
        nameEs: player.nameEs,
        clubId: player.clubId,
        clubName: player.clubName,
        joiningYear: player.joiningYear,
        position: player.position,
        subPosition: player.subPosition,
        nationality: player.nationality,
        nationalityJa: player.nationalityJa,
        nationalityEn: player.nationalityEn,
        nationalityEs: player.nationalityEs,
        nationalityFlag: player.nationalityFlag,
        rating: player.rating,
        isLegendary: !!player.isLegendary,
        timestamp: Date.now(),
        mode,
        teamId: targetTeam.teamId,
        teamNumber: targetTeam.teamNumber,
        teamName: targetTeam.name,
      };
      setDraftHistory((prev) => [historyEntry, ...prev]);
    }
    setAcquiredPlayerBanner(player);
    setTimeout(() => {
      setAcquiredPlayerBanner(null);
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Main Top Header */}
      <Header
        mode={mode}
        onSelectMode={(m) => {
          handleSelectMode(m);
        }}
        language={language}
        onLanguageChange={handleLanguageChange}
        activeTab={currentView}
        onTabChange={setCurrentView}
        teamCount={activeTeam.players.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenGiftBox={() => setIsGiftBoxOpen(true)}
        onOpenScoutModal={() => {
          setScoutInitialTicketType(null);
          setIsRewardScoutOpen(true);
        }}
        onOpenItemBox={() => setIsItemBoxOpen(true)}
        onOpenLoginBonus={() => setIsLoginBonusOpen(true)}
        onOpenSyncDebug={() => setIsSyncDebugOpen(true)}
        unclaimedGiftsCount={presents.filter((p) => !p.isClaimed && (!p.expiresAt || Date.now() <= p.expiresAt)).length}
        totalTicketsCount={getTotalTicketsCount(rewardTickets)}
        itemBoxTotalCount={totalItemBoxCount}
        canClaimLoginBonus={canClaimLoginBonus}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* VIEW 1: HOME SCREEN */}
        {currentView === 'home' && (
          <HomeScreen
            mode={mode}
            onOpenModeSelect={() => setIsModeSelectOpen(true)}
            onNavigate={setCurrentView}
            onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenUpdateNotes={() => setIsUpdateNotesOpen(true)}
            onOpenGiftBox={() => setIsGiftBoxOpen(true)}
            onOpenScoutModal={() => {
              setScoutInitialTicketType(null);
              setIsRewardScoutOpen(true);
            }}
            onOpenItemBox={() => setIsItemBoxOpen(true)}
            onOpenLoginBonus={() => setIsLoginBonusOpen(true)}
            unclaimedGiftsCount={presents.filter((p) => !p.isClaimed && (!p.expiresAt || Date.now() <= p.expiresAt)).length}
            totalTicketsCount={getTotalTicketsCount(rewardTickets)}
            itemBoxTotalCount={totalItemBoxCount}
            canClaimLoginBonus={canClaimLoginBonus}
            teams={teams}
            activeTeam={activeTeam}
            myTeam={activeTeam.players}
            historyCount={draftHistory.length}
            language={language}
            onCreateNewTeam={handleCreateNewTeam}
            hasActiveSpin={hasCurrentDraft}
          />
        )}

        {/* VIEW 2: DRAFT WORKSPACE */}
        {currentView === 'draft' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Slot Machine Roulette Component */}
            <SlotMachine
              mode={mode}
              language={language}
              selectedYear={selectedYear}
              selectedClub={selectedClub}
              selectedDecade={selectedDecade}
              selectedNationalTeamId={selectedNationalTeamId}
              isSpinning={isSpinning}
              blackBallSpinType={blackBallSpinType}
              blackBallStage={blackBallStage}
              isBlackBallResult={isBlackBallResult}
              isGoldenResult={isGoldenResult}
              isPurpleResult={isPurpleResult}
              isPurpleSpin={isPurpleSpin}
              hasCurrentDraft={hasCurrentDraft}
              skipsRemaining={skipsRemaining}
              onSpin={handleSpinDraft}
              onSkip={handleSkip}
              disabled={isSpinning}
              isTeamFull={activeTeam.players.length >= 11}
              managerDrafted={Boolean(activeTeam.managerDrafted || activeTeam.manager)}
              pendingManagerCount={activeTeam.pendingManagerCandidates?.length || 0}
              draftedManager={activeTeam.manager || null}
              onOpenManagerDraft={handleOpenManagerDraft}
            />

            {/* Acquired Player Flash Banner (Displayed for 2 seconds) */}
            {acquiredPlayerBanner && (
              <div
                id="player-acquired-banner"
                className="max-w-xl mx-auto bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-slate-950 p-4 rounded-2xl shadow-2xl shadow-emerald-500/40 border border-emerald-300 flex items-center justify-between animate-bounce"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 text-emerald-400 flex items-center justify-center font-black text-xl">
                    <CheckCircle2 className="w-6 h-6 stroke-[3]" />
                  </div>
                  <div>
                    <div className="font-heading font-black text-base sm:text-lg leading-tight">
                      {t.playerAcquired}
                    </div>
                    <div className="text-xs font-bold text-slate-950/80">
                      {getLocalizedPlayerName(acquiredPlayerBanner, language)} ({acquiredPlayerBanner.clubName} • {acquiredPlayerBanner.position})
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-black px-2.5 py-1 rounded-full bg-slate-950 text-emerald-400">
                  {activeTeam.players.length}/11
                </span>
              </div>
            )}

            {/* Squad Position Counts Bar + Confirmed Roster Summary (Read-Only, No Undo) */}
            {(activeTeam.players.length > 0 || hasCurrentDraft) && (
              <div className="max-w-3xl mx-auto space-y-2.5">
                <PositionCountsBar players={activeTeam.players} language={language} />

                {activeTeam.players.length > 0 && (
                  <div
                    id="draft-squad-status-strip"
                    className="bg-slate-900/75 border border-slate-800 rounded-xl p-2.5 sm:p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
                      <span className="font-bold text-slate-300">
                        {language === 'ja'
                          ? `📋 確定済みメンバー (${activeTeam.players.length}/11)`
                          : `📋 CONFIRMED SQUAD (${activeTeam.players.length}/11)`}
                      </span>
                      <span className="text-[10px] text-emerald-400/90 font-semibold">
                        {language === 'ja' ? '選択後は即時確定' : 'Picks are final'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTeam.players.map((p) => (
                        <div
                          key={p.playerId}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200"
                        >
                          <span
                            className={`text-[9px] font-black px-1 rounded ${
                              p.position === 'GK'
                                ? 'bg-amber-500/20 text-amber-300'
                                : p.position === 'DF'
                                ? 'bg-sky-500/20 text-sky-300'
                                : p.position === 'MF'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {p.position}
                          </span>
                          <span className="font-bold truncate max-w-[115px]">
                            {getLocalizedPlayerName(p, language)}
                          </span>
                          <span className="font-mono text-[10px] text-emerald-400 font-bold">
                            {p.rating}
                          </span>
                          {(p.level ?? 1) > 1 && (
                            <span className="font-mono text-[9px] text-amber-300 font-bold">
                              Lv.{p.level}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Candidates Section */}
            {hasCurrentDraft && !isSpinning && !acquiredPlayerBanner && (
              <div id="candidates-container" className="space-y-4 pt-1">
                <div className="flex items-center justify-between max-w-3xl mx-auto px-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-heading font-black text-base sm:text-lg">
                      🎯 CANDIDATES
                    </span>
                    <span className="text-xs bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                      {candidatePlayers.length} FOUND
                    </span>
                    {mode === 'national_era' && selectedNationalTeamId && selectedDecade && (
                      <span className="text-[11px] bg-cyan-500/15 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                        {(() => {
                          const nt = getNationalTeamById(selectedNationalTeamId);
                          return nt
                            ? `${nt.flag} ${getLocalizedNationalTeamName(nt, language)} • ${getDecadeLabel(selectedDecade, language)}`
                            : selectedDecade;
                        })()}
                      </span>
                    )}
                  </div>
                  {candidatePlayers.length > 0 && (
                    <span className="text-xs text-slate-400 font-medium">
                      Select 1 player to DRAFT into {activeTeam.name}
                    </span>
                  )}
                </div>

                {candidatePlayers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {candidatePlayers.map((player) => {
                      const limitCheck = canDraftPlayerByPositionLimit(activeTeam.players, player);
                      const isPosBlocked = !limitCheck.allowed;
                      const blockedMsg = isPosBlocked
                        ? language === 'ja'
                          ? limitCheck.reasonJa
                          : limitCheck.reasonEn
                        : undefined;
                      return (
                        <CandidateCard
                          key={player.playerId}
                          player={player}
                          language={language}
                          onDraft={handleDraftPlayer}
                          isDrafting={isSpinning}
                          disabled={activeTeam.players.length >= 11 || Boolean(activeTeam.isLocked) || isPosBlocked}
                          disabledReason={blockedMsg}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <NoCandidatesCard
                    language={language}
                    onNextDraft={handleNextDraftFree}
                    titleOverride={mode === 'national_era' ? t.noDataFound : undefined}
                    descOverride={
                      mode === 'national_era'
                        ? language === 'ja'
                          ? '選択された代表×年代の組み合わせに登録対象選手がいません（例：ベルギー1990s/2000sなど）。別の年代または代表を選択するか再抽選してください。'
                          : 'No verified players match this National Team × Decade combination. Select another era/team or spin again.'
                        : undefined
                    }
                  />
                )}
              </div>
            )}

            {/* Best XI 11/11 Celebration Alert in Draft Tab */}
            {activeTeam.players.length === 11 && (
              <div className="max-w-xl mx-auto bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-400/50 rounded-2xl p-5 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 mx-auto flex items-center justify-center font-black text-2xl shadow-lg">
                  🏆
                </div>
                <h3 className="font-heading font-black text-xl text-white">
                  {t.teamCompletedBanner}
                </h3>
                <p className="text-xs text-slate-300">
                  {t.teamCompletedBannerDesc}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      soundManager.playButtonClick();
                      setSharingTeam(activeTeam);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-black text-xs tracking-wider shadow-lg flex items-center justify-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <Share2 className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{t.shareTeam}</span>
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playButtonClick();
                      setCurrentView('team');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                  >
                    {t.viewTeam}
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playButtonClick();
                      handleCreateNewTeam();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-heading font-black text-xs tracking-wider border border-amber-500/30 transition-colors"
                  >
                    {t.createNewTeam} (TEAM {teams.length + 1})
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: MY TEAM & TACTICAL PITCH */}
        {currentView === 'team' && (
          <PitchView
            teams={teams}
            activeTeamId={activeTeam.teamId}
            defenseSquadId={defenseSquadId}
            onSetDefenseSquad={handleSetDefenseSquad}
            onSelectTeam={handleSelectTeam}
            onCreateNewTeam={handleCreateNewTeam}
            onDeleteTeam={handleDeleteTeam}
            onContinueDraft={handleContinueDraft}
            onOpenShare={(teamToShare) => setSharingTeam(teamToShare)}
            myTeam={activeTeam.players}
            playerSlots={activeTeam.playerSlots}
            onUpdateSlotAssignment={(newSlots) => {
              updateActiveTeam((prev) => ({ ...prev, playerSlots: newSlots }));
            }}
            formation={activeTeam.formation}
            onChangeFormation={(newFormation) => {
              updateActiveTeam((prev) => {
                const newSlots = remapPlayerSlots(
                  prev.players,
                  prev.playerSlots,
                  newFormation,
                  prev.formation
                );
                return {
                  ...prev,
                  formation: newFormation,
                  playerSlots: newSlots,
                  customPositions: newFormation === 'CUSTOM' ? prev.customPositions : {},
                };
              });
            }}
            customPositions={activeTeam.customPositions}
            onUpdateCustomPositions={(newPos) => {
              updateActiveTeam((prev) => ({ ...prev, customPositions: newPos }));
            }}
            isLocked={activeTeam.isLocked}
            onToggleLock={handleToggleTeamLock}
            onOpenManagerDraft={handleOpenManagerDraft}
            language={language}
          />
        )}

        {/* VIEW 4: DRAFT HISTORY */}
        {currentView === 'history' && (
          <div className="max-w-3xl mx-auto">
            <HistoryModal
              isOpen={true}
              onClose={() => setCurrentView('home')}
              history={draftHistory}
              language={language}
              onClearHistory={handleClearHistory}
              onDeleteEntry={handleDeleteHistoryEntry}
            />
          </div>
        )}

        {/* VIEW 5: ONLINE PvP BATTLE (BETA) */}
        {currentView === 'pvp' && (
          <PvPView
            activeTeam={activeTeam}
            teams={teams}
            language={language}
            onBackToDraft={() => setCurrentView('draft')}
            onNavigate={(tab) => setCurrentView(tab)}
            onOpenSyncDebug={() => setIsSyncDebugOpen(true)}
          />
        )}
      </main>

      {/* Gift Box Modal */}
      <GiftBoxModal
        isOpen={isGiftBoxOpen}
        onClose={() => setIsGiftBoxOpen(false)}
        presents={Array.isArray(presents) ? presents : []}
        onClaimItem={handleClaimGift}
        onClaimAll={handleClaimAllGifts}
        onRefresh={refreshPresentsFromServer}
        onOpenScoutModal={() => {
          setIsGiftBoxOpen(false);
          setIsRewardScoutOpen(true);
        }}
        language={language}
      />

      {/* Reward Scout Modal */}
      <RewardScoutModal
        isOpen={isRewardScoutOpen}
        onClose={() => {
          setIsRewardScoutOpen(false);
          setScoutInitialTicketType(null);
        }}
        language={language}
        userId={effectiveUserId}
        userTickets={rewardTickets}
        timedLots={userProgress.timedLots}
        initialTicketType={scoutInitialTicketType}
        onScoutConsumed={(nextProg) => applyServerProgress(nextProg)}
        activeTeam={activeTeam}
        onOpenGiftBox={() => {
          setIsRewardScoutOpen(false);
          setIsGiftBoxOpen(true);
        }}
        onAcquirePlayer={handleAcquireScoutPlayer}
      />

      {/* 15-Day Login Bonus Modal */}
      <LoginBonusModal
        isOpen={isLoginBonusOpen}
        onClose={() => setIsLoginBonusOpen(false)}
        language={language}
        userId={effectiveUserId}
        loginBonus={userProgress.loginBonus}
        onProgressUpdated={(nextProg) => applyServerProgress(nextProg)}
      />

      {/* 5-Category Item Box Modal */}
      <ItemBoxModal
        isOpen={isItemBoxOpen}
        onClose={() => setIsItemBoxOpen(false)}
        language={language}
        userId={effectiveUserId}
        progress={userProgress}
        teams={teams}
        activeTeamId={activeTeam.teamId}
        onProgressUpdated={(nextProg) => applyServerProgress(nextProg)}
        onPlayerUpdated={(updatedPlayer) =>
          setTeams((prev) => updatePlayerAcrossTeams(prev, updatedPlayer))
        }
        onOpenScoutWithTicket={(ticketType) => {
          setIsItemBoxOpen(false);
          setScoutInitialTicketType(ticketType);
          setIsRewardScoutOpen(true);
        }}
        onOpenManagerSelect={() => {
          setIsItemBoxOpen(false);
          setIsManagerSelectOpen(true);
        }}
        onOpenLoginBonus={() => {
          setIsItemBoxOpen(false);
          setIsLoginBonusOpen(true);
        }}
        onOpenGiftBox={() => {
          setIsItemBoxOpen(false);
          setIsGiftBoxOpen(true);
        }}
      />

      {/* Manager Select Modal (Uses Manager Select Ticket, separate from 1-per-game Gacha) */}
      <ManagerSelectModal
        isOpen={isManagerSelectOpen}
        onClose={() => setIsManagerSelectOpen(false)}
        language={language}
        userId={effectiveUserId}
        ticketCount={userProgress.inventory.manager_select_ticket || 0}
        ownedManagers={userProgress.ownedManagers}
        teams={teams}
        activeTeamId={activeTeam.teamId}
        onProgressUpdated={(nextProg) => applyServerProgress(nextProg)}
        onAssignManagerToTeam={handleAssignManagerToTeam}
      />

      {/* Mode Select Modal (Pop-up on "PLAY / SPIN DRAFT" or mode change) */}
      <ModeSelectModal
        isOpen={isModeSelectOpen}
        onClose={() => setIsModeSelectOpen(false)}
        currentMode={mode}
        onSelectMode={(selectedMode) => {
          handleSelectMode(selectedMode);
          setCurrentView('draft');
        }}
        language={language}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        language={language}
        onLanguageChange={handleLanguageChange}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onResetGame={handleResetGame}
        xCharLimit={xCharLimit}
        onXCharLimitChange={(limit) => setXCharLimit(limit)}
        onOpenUpdateNotes={() => {
          setIsSettingsOpen(false);
          setIsUpdateNotesOpen(true);
        }}
      />

      {/* How To Play Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
        language={language}
      />

      {/* Update Notes Modal */}
      <UpdateNotesModal
        isOpen={isUpdateNotesOpen}
        onClose={() => setIsUpdateNotesOpen(false)}
        language={language}
      />

      {/* Celebration Modal (When team finishes 11/11 players) */}
      {celebratingTeam && (
        <CelebrationModal
          isOpen={!!celebratingTeam}
          onClose={() => setCelebratingTeam(null)}
          team={celebratingTeam}
          language={language}
          onShareTeam={() => {
            const target = celebratingTeam;
            setCelebratingTeam(null);
            setSharingTeam(target);
          }}
          onViewTeam={() => {
            setCelebratingTeam(null);
            setCurrentView('team');
          }}
          onCreateNewTeam={() => {
            setCelebratingTeam(null);
            handleCreateNewTeam();
          }}
        />
      )}

      {/* SNS Share Modal */}
      {sharingTeam && (
        <ShareModal
          isOpen={!!sharingTeam}
          onClose={() => setSharingTeam(null)}
          team={sharingTeam}
          language={language}
          xCharLimit={xCharLimit}
        />
      )}

      {/* Online Sync Debug & Health Monitor Modal */}
      <OnlineSyncDebugModal
        isOpen={isSyncDebugOpen}
        onClose={() => setIsSyncDebugOpen(false)}
      />

      {/* Manager Draft Modal (1 per team/game Gacha) */}
      <ManagerDraftModal
        isOpen={isManagerDraftOpen}
        onClose={() => setIsManagerDraftOpen(false)}
        language={language}
        teamName={activeTeam.name}
        existingManager={activeTeam.manager || null}
        managerDrafted={Boolean(activeTeam.managerDrafted || activeTeam.manager)}
        pendingCandidates={activeTeam.pendingManagerCandidates || []}
        isTeamLocked={Boolean(activeTeam.isLocked)}
        onStartManagerGacha={handleStartManagerGacha}
        onDraftManager={handleDraftManager}
      />

      {/* Tiered Draft Reveal Overlay (Normal / High / Ultra / Supreme / Manager) */}
      {activeReveal && (
        <DraftRevealOverlay
          language={language}
          tier={activeReveal.tier}
          stagingEvent={activeReveal.stagingEvent}
          player={activeReveal.player}
          manager={activeReveal.manager}
          rarityOverride={activeReveal.rarityOverride}
          candidateCount={activeReveal.candidateCount}
          onAnimationEnd={activeReveal.onDone}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span>⚽ FOOTBALL DRAFT — Authentic Real Players Database</span>
            <button
              onClick={() => setIsUpdateNotesOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              <span>{CURRENT_VERSION}</span>
              <span>•</span>
              <span className="underline">UPDATE NOTES</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('home')}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {t.home}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsHowToPlayOpen(true)}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {t.howToPlay}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {t.history} ({draftHistory.length})
            </button>
          </div>
        </div>
      </footer>

      {/* Pop-up History Modal triggered from footer */}
      {isHistoryOpen && (
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          history={draftHistory}
          language={language}
          onClearHistory={handleClearHistory}
          onDeleteEntry={handleDeleteHistoryEntry}
        />
      )}
    </div>
  );
}
