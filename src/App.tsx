import React, { useState, useEffect, useMemo } from 'react';
import {
  GameMode,
  Language,
  Player,
  Club,
  DraftHistoryEntry,
  FormationType,
  CustomPlayerPosition,
  FORMATIONS,
  UserTeam,
  CurrentDraftState,
} from './types';
import { ALL_CLUBS } from './data/clubs';
import {
  ALL_PLAYERS,
  getClubsByMode,
  getAvailableYears,
  findCandidatePlayers,
  getLegendaryCombination,
} from './data/playerDatabase';
import { TRANSLATIONS } from './utils/translations';
import { soundManager } from './utils/audio';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { SlotMachine, BlackBallSpinType } from './components/SlotMachine';
import { CandidateCard, NoCandidatesCard } from './components/CandidateCard';
import { PitchView } from './components/PitchView';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { ModeSelectModal } from './components/ModeSelectModal';
import { CelebrationModal } from './components/CelebrationModal';
import { ShareModal } from './components/ShareModal';
import { DEFAULT_X_CHAR_LIMIT, STORAGE_KEY_X_CHAR_LIMIT } from './utils/shareUtils';
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

  // 2. Navigation tab: 'home' | 'draft' | 'team' | 'history'
  const [currentView, setCurrentView] = useState<'home' | 'draft' | 'team' | 'history'>('home');

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

  // Keep activeTeam strictly synchronized
  const activeTeam = useMemo(() => {
    return teams.find((tItem) => tItem.teamId === activeTeamId) || teams[0] || createDefaultTeam(1, 'europe');
  }, [teams, activeTeamId]);

  // Mode derived from active team
  const mode = activeTeam.mode || 'europe';

  // 4. Draft state with persistent draft tracking
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [candidatePlayers, setCandidatePlayers] = useState<Player[]>([]);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [hasCurrentDraft, setHasCurrentDraft] = useState<boolean>(false);
  const [skipsRemaining, setSkipsRemaining] = useState<number>(3);
  const [acquiredPlayerBanner, setAcquiredPlayerBanner] = useState<Player | null>(null);
  const [celebratingTeam, setCelebratingTeam] = useState<UserTeam | null>(null);

  // Black Ball Event State (0.001% ultra-rare)
  const [blackBallSpinType, setBlackBallSpinType] = useState<BlackBallSpinType>('none');
  const [blackBallStage, setBlackBallStage] = useState<'spinning-normal' | 'lightning-striking' | 'blackball-spinning' | 'revealed'>('revealed');
  const [isBlackBallResult, setIsBlackBallResult] = useState<boolean>(false);

  // Restore active draft state on boot
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY_CURRENT_DRAFT);
      if (savedDraft) {
        const parsed: CurrentDraftState = JSON.parse(savedDraft);
        if (parsed.hasCurrentDraft) {
          setSelectedYear(parsed.selectedYear);
          setSelectedClub(parsed.selectedClub);
          setCandidatePlayers(parsed.candidatePlayers || []);
          setHasCurrentDraft(parsed.hasCurrentDraft);
          setSkipsRemaining(parsed.skipsRemaining ?? 3);
          setBlackBallSpinType(parsed.blackBallSpinType || 'none');
          setBlackBallStage(parsed.blackBallStage || 'revealed');
          setIsBlackBallResult(parsed.isBlackBallResult || false);
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
        candidatePlayers,
        isSpinning,
        hasCurrentDraft,
        skipsRemaining,
        blackBallSpinType,
        blackBallStage,
        isBlackBallResult,
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
    candidatePlayers,
    isSpinning,
    hasCurrentDraft,
    skipsRemaining,
    blackBallSpinType,
    blackBallStage,
    isBlackBallResult,
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
  const [sharingTeam, setSharingTeam] = useState<UserTeam | null>(null);

  // Language & Sound handlers
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.sfxEnabled = next;
  };

  // Mutate active team properties in teams state
  const updateActiveTeam = (updater: (prevTeam: UserTeam) => UserTeam) => {
    setTeams((prevTeams) =>
      prevTeams.map((tItem) => {
        if (tItem.teamId === activeTeam.teamId) {
          return updater(tItem);
        }
        return tItem;
      })
    );
  };

  // Helper to assign player to first open compatible slot in current formation
  const autoAssignSlot = (player: Player, currentSlots: Record<string, string>, currentFormation: FormationType) => {
    const basePreset = currentFormation === 'CUSTOM' ? '4-3-3' : currentFormation;
    const formationSlots = FORMATIONS[basePreset].slots;
    const assignedIds = new Set(Object.values(currentSlots));

    // 1. Try matching role
    let emptySlot = formationSlots.find((s) => {
      if (assignedIds.has(currentSlots[s.id])) return false;
      if (player.position === 'GK' && s.role === 'GK') return true;
      if (player.position === 'DF' && ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(s.role)) return true;
      if (player.position === 'MF' && ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(s.role)) return true;
      if (player.position === 'FW' && ['ST', 'CF', 'LW', 'RW'].includes(s.role)) return true;
      return false;
    });

    // 2. If no role-matched slot is empty, take any available empty slot
    if (!emptySlot) {
      emptySlot = formationSlots.find((s) => !currentSlots[s.id]);
    }

    if (emptySlot) {
      return { ...currentSlots, [emptySlot.id]: player.playerId };
    }

    return currentSlots;
  };

  // CREATE NEW TEAM (Team 2, Team 3, etc.)
  const handleCreateNewTeam = () => {
    const nextTeamNumber = teams.length + 1;
    const newTeam = createDefaultTeam(nextTeamNumber, mode);
    setTeams((prev) => [...prev, newTeam]);
    setActiveTeamId(newTeam.teamId);

    // Reset draft state for new team
    setSelectedYear(null);
    setSelectedClub(null);
    setCandidatePlayers([]);
    setIsSpinning(false);
    setHasCurrentDraft(false);
    setSkipsRemaining(3);
    setAcquiredPlayerBanner(null);
    setBlackBallSpinType('none');
    setBlackBallStage('revealed');
    setIsBlackBallResult(false);

    setCurrentView('draft');
  };

  // DELETE TEAM
  const handleDeleteTeam = (teamId: string) => {
    if (teams.length <= 1) return;
    const filtered = teams.filter((tItem) => tItem.teamId !== teamId);
    setTeams(filtered);
    if (activeTeamId === teamId) {
      setActiveTeamId(filtered[0].teamId);
    }
  };

  // SELECT ACTIVE TEAM
  const handleSelectTeam = (teamId: string) => {
    setActiveTeamId(teamId);
  };

  // CONTINUE DRAFT FOR A SPECIFIC TEAM
  const handleContinueDraft = (teamId: string) => {
    setActiveTeamId(teamId);
    setCurrentView('draft');
  };

  // Change mode for active team or start fresh mode
  const handleSelectMode = (newMode: GameMode) => {
    updateActiveTeam((prev) => ({
      ...prev,
      mode: newMode,
    }));
    setSelectedYear(null);
    setSelectedClub(null);
    setCandidatePlayers([]);
    setIsSpinning(false);
    setHasCurrentDraft(false);
    setSkipsRemaining(3);
    setAcquiredPlayerBanner(null);
  };

  // Reset ALL game data (Teams + Draft). HISTORY remains completely preserved!
  const handleResetGame = () => {
    const freshTeam = createDefaultTeam(1, mode);
    setTeams([freshTeam]);
    setActiveTeamId(freshTeam.teamId);

    setSelectedYear(null);
    setSelectedClub(null);
    setCandidatePlayers([]);
    setIsSpinning(false);
    setHasCurrentDraft(false);
    setSkipsRemaining(3);
    setAcquiredPlayerBanner(null);
    setBlackBallSpinType('none');
    setBlackBallStage('revealed');
    setIsBlackBallResult(false);

    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_DRAFT);
      localStorage.removeItem(STORAGE_KEY_TEAMS);
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

  // CORE ROULETTE SPIN LOGIC
  const handleSpinDraft = () => {
    if (isSpinning || hasCurrentDraft || activeTeam.players.length >= 11) return;

    soundManager.playButtonClick();
    setIsSpinning(true);
    setHasCurrentDraft(true);
    setCandidatePlayers([]);
    setAcquiredPlayerBanner(null);
    setIsBlackBallResult(false);

    const clubs = getClubsByMode(mode);
    const years = getAvailableYears(mode);
    const currentTeamPlayerIds = activeTeam.players.map((p) => p.playerId);
    const currentTeamPersonIds = activeTeam.players.map((p) => p.personId);

    // 0.001% ultra-rare Black Ball trigger (1 in 100,000)
    const isBlackBallTrigger = Math.random() < 0.00001;

    if (isBlackBallTrigger) {
      const combo = getLegendaryCombination(mode, currentTeamPlayerIds, currentTeamPersonIds);
      const targetYear = combo ? combo.year : 2018;
      const targetClub = combo ? (clubs.find((c) => c.id === combo.clubId) || clubs[0]) : clubs[0];
      const isLightning = Math.random() < 0.5;

      if (isLightning) {
        setBlackBallSpinType('lightning-blackball');
        setBlackBallStage('spinning-normal');

        setTimeout(() => {
          setBlackBallStage('lightning-striking');
          soundManager.playLightningElectricBuzz();
        }, 450);

        setTimeout(() => {
          setBlackBallStage('blackball-spinning');
          soundManager.playBlackBallAura();
        }, 650);

        setTimeout(() => {
          setSelectedYear(targetYear);
          setSelectedClub(targetClub);
          setIsSpinning(false);
          setBlackBallStage('revealed');
          setIsBlackBallResult(true);
          soundManager.playSlotStop();
          soundManager.playVictory();

          const candidates = findCandidatePlayers(
            mode,
            targetYear,
            targetClub.id,
            currentTeamPlayerIds,
            currentTeamPersonIds
          );
          setCandidatePlayers(candidates.length > 0 ? candidates : (combo ? [combo.player] : []));
        }, 2300);
      } else {
        setBlackBallSpinType('normal-blackball');
        setBlackBallStage('spinning-normal');

        setTimeout(() => {
          setBlackBallStage('blackball-spinning');
          soundManager.playBlackBallAura();
        }, 600);

        setTimeout(() => {
          setSelectedYear(targetYear);
          setSelectedClub(targetClub);
          setIsSpinning(false);
          setBlackBallStage('revealed');
          setIsBlackBallResult(true);
          soundManager.playSlotStop();
          soundManager.playVictory();

          const candidates = findCandidatePlayers(
            mode,
            targetYear,
            targetClub.id,
            currentTeamPlayerIds,
            currentTeamPersonIds
          );
          setCandidatePlayers(candidates.length > 0 ? candidates : (combo ? [combo.player] : []));
        }, 2100);
      }
      return;
    }

    // Normal regular spin
    setBlackBallSpinType('none');
    setBlackBallStage('spinning-normal');

    setTimeout(() => {
      // 80% weighted selection toward populated combinations
      const matchingPlayers = ALL_PLAYERS.filter(
        (p) =>
          p.clubId &&
          clubs.some((c) => c.id === p.clubId) &&
          !currentTeamPlayerIds.includes(p.playerId) &&
          !currentTeamPersonIds.includes(p.personId)
      );

      let targetYear: number;
      let targetClub: Club;

      if (matchingPlayers.length > 0 && Math.random() < 0.8) {
        const pickedPlayer = matchingPlayers[Math.floor(Math.random() * matchingPlayers.length)];
        targetYear = pickedPlayer.joiningYear;
        targetClub = clubs.find((c) => c.id === pickedPlayer.clubId) || clubs[0];
      } else {
        targetYear = years[Math.floor(Math.random() * years.length)];
        targetClub = clubs[Math.floor(Math.random() * clubs.length)];
      }

      setSelectedYear(targetYear);
      setSelectedClub(targetClub);
      soundManager.playSlotStop();

      // Search matching real candidates
      const candidates = findCandidatePlayers(
        mode,
        targetYear,
        targetClub.id,
        currentTeamPlayerIds,
        currentTeamPersonIds
      );

      setCandidatePlayers(candidates);
      setIsSpinning(false);
      setBlackBallStage('revealed');
    }, 1200);
  };

  // Handle Skip (consumes 1 skip count and unlocks next spin)
  const handleSkip = () => {
    if (skipsRemaining <= 0 || isSpinning) return;
    soundManager.playSkip();
    setSkipsRemaining((prev) => Math.max(0, prev - 1));
    setCandidatePlayers([]);
    setSelectedYear(null);
    setSelectedClub(null);
    setHasCurrentDraft(false);
    setIsBlackBallResult(false);
    setBlackBallSpinType('none');
  };

  // Handle Free Skip / Next Draft (When No Players Found)
  const handleNextDraftFree = () => {
    soundManager.playButtonClick();
    setCandidatePlayers([]);
    setSelectedYear(null);
    setSelectedClub(null);
    setHasCurrentDraft(false);
    setIsBlackBallResult(false);
    setBlackBallSpinType('none');
  };

  // Handle Draft Player Selection
  const handleDraftPlayer = (player: Player) => {
    if (activeTeam.players.length >= 11) return;

    const newPlayers = [...activeTeam.players, player];
    const newSlots = autoAssignSlot(player, activeTeam.playerSlots, activeTeam.formation);
    const isCompleted = newPlayers.length === 11;

    const updatedTeam: UserTeam = {
      ...activeTeam,
      players: newPlayers,
      playerSlots: newSlots,
      isCompleted,
      completedAt: isCompleted ? Date.now() : activeTeam.completedAt,
    };

    updateActiveTeam(() => updatedTeam);

    // Record to persistent Draft History with multilingual metadata
    const dbClub = ALL_CLUBS.find((c) => c.id === player.clubId);
    const historyEntry: DraftHistoryEntry = {
      id: `${Date.now()}_${player.playerId}`,
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
        setCelebratingTeam(updatedTeam);
      }, 1800);
    } else {
      setTimeout(() => {
        setAcquiredPlayerBanner(null);
        setSelectedYear(null);
        setSelectedClub(null);
        setHasCurrentDraft(false);
        setIsBlackBallResult(false);
        setBlackBallSpinType('none');
      }, 2000);
    }
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
              isSpinning={isSpinning}
              blackBallSpinType={blackBallSpinType}
              blackBallStage={blackBallStage}
              isBlackBallResult={isBlackBallResult}
              hasCurrentDraft={hasCurrentDraft}
              skipsRemaining={skipsRemaining}
              onSpin={handleSpinDraft}
              onSkip={handleSkip}
              disabled={isSpinning}
              isTeamFull={activeTeam.players.length >= 11}
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
                      {acquiredPlayerBanner.playerName} ({acquiredPlayerBanner.clubName} • {acquiredPlayerBanner.position})
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-black px-2.5 py-1 rounded-full bg-slate-950 text-emerald-400">
                  {activeTeam.players.length}/11
                </span>
              </div>
            )}

            {/* Candidates Section */}
            {hasCurrentDraft && !isSpinning && !acquiredPlayerBanner && (
              <div id="candidates-container" className="space-y-4 pt-2">
                <div className="flex items-center justify-between max-w-3xl mx-auto px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-heading font-black text-base sm:text-lg">
                      🎯 CANDIDATES
                    </span>
                    <span className="text-xs bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                      {candidatePlayers.length} FOUND
                    </span>
                  </div>
                  {candidatePlayers.length > 0 && (
                    <span className="text-xs text-slate-400 font-medium">
                      Select 1 player to DRAFT into {activeTeam.name}
                    </span>
                  )}
                </div>

                {candidatePlayers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {candidatePlayers.map((player) => (
                      <CandidateCard
                        key={player.playerId}
                        player={player}
                        language={language}
                        onDraft={handleDraftPlayer}
                        isDrafting={isSpinning}
                        disabled={activeTeam.players.length >= 11}
                      />
                    ))}
                  </div>
                ) : (
                  <NoCandidatesCard
                    language={language}
                    onNextDraft={handleNextDraftFree}
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
              updateActiveTeam((prev) => ({ ...prev, formation: newFormation }));
            }}
            customPositions={activeTeam.customPositions}
            onUpdateCustomPositions={(newPos) => {
              updateActiveTeam((prev) => ({ ...prev, customPositions: newPos }));
            }}
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
            />
          </div>
        )}
      </main>

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
      />

      {/* How To Play Modal */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
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

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>⚽ FOOTBALL DRAFT — Authentic Real Players Database (Europe & 2026 J1)</span>
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
        />
      )}
    </div>
  );
}
