import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UserTeam,
  Player,
  FormationType,
  FORMATIONS,
  MainPosition,
  Language,
  TeamTactics,
  AttackTactics,
  DefenseTactics,
  CustomPlayerPosition,
} from '../types';
import {
  getTacticalDefenseSquad,
  saveTacticalDefenseSquad,
  getOVRDefenseSquad,
  saveOVRDefenseSquad,
  getTacticalDefenseTactics,
  saveTacticalDefenseTactics,
  cloneUserTeam,
} from '../utils/defenseSquadEngine';
import {
  getEFootballPositionFromCoords,
  evaluatePlayerAtPosition,
  normalizeRoleToEFootball,
  getTeamEffectiveOvr,
} from '../utils/positionEngine';
import {
  remapPlayerSlots,
  detectBasePresetFromSlots,
  getDisplayFormationName,
  getPositionCategory,
} from '../utils/formationUtils';
import { getLocalizedPlayerName } from '../utils/translations';
import { DEFAULT_TACTICS } from '../utils/pvpEngine';
import { soundManager } from '../utils/audio';
import {
  Shield,
  Zap,
  Brain,
  CheckCircle2,
  RotateCcw,
  ArrowLeftRight,
  Sparkles,
  Save,
  Copy,
  ChevronDown,
  Info,
  X,
  Lock,
} from 'lucide-react';

interface DefenseSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTeam: UserTeam;
  teams?: UserTeam[];
  language: Language;
}

type DefenseTab = 'tactical' | 'ovr';

interface DefensePitchSlot {
  id: string;
  role: string;
  pos: MainPosition;
  x: number;
  y: number;
}

export const DefenseSquadModal: React.FC<DefenseSquadModalProps> = ({
  isOpen,
  onClose,
  activeTeam,
  teams = [],
  language,
}) => {
  const [activeTab, setActiveTab] = useState<DefenseTab>('tactical');

  // Independent squads for each defense mode
  const [tacticalSquad, setTacticalSquad] = useState<UserTeam>(() => {
    return getTacticalDefenseSquad(activeTeam, teams) || cloneUserTeam(activeTeam, 'tactical_def');
  });

  const [ovrSquad, setOvrSquad] = useState<UserTeam>(() => {
    return getOVRDefenseSquad(activeTeam, teams) || cloneUserTeam(activeTeam, 'ovr_def');
  });

  // Tactics for tactical defense
  const [tactics, setTactics] = useState<TeamTactics>(() => getTacticalDefenseTactics());

  // Interactive UI state
  const [isSwapMode, setIsSwapMode] = useState<boolean>(false);
  const [selectedSwapSourceSlotId, setSelectedSwapSourceSlotId] = useState<string | null>(null);
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);
  const [dragCoord, setDragCoord] = useState<{ x: number; y: number } | null>(null);
  const [hoveredSwapSlotId, setHoveredSwapSlotId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const pitchRef = useRef<HTMLDivElement>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerStateRef = useRef<{
    startX: number;
    startY: number;
    slotId: string;
    isLongPressTriggered: boolean;
  } | null>(null);

  // Sync on modal open
  useEffect(() => {
    if (isOpen) {
      const tSquad = getTacticalDefenseSquad(activeTeam, teams);
      if (tSquad) setTacticalSquad(tSquad);
      const oSquad = getOVRDefenseSquad(activeTeam, teams);
      if (oSquad) setOvrSquad(oSquad);
      setTactics(getTacticalDefenseTactics());
      setIsSwapMode(false);
      setSelectedSwapSourceSlotId(null);
      setSaveSuccessNotice(null);
    }
  }, [isOpen, activeTeam, teams]);

  // Current working squad depending on tab
  const currentSquad = activeTab === 'tactical' ? tacticalSquad : ovrSquad;
  const setCurrentSquad = (updater: (prev: UserTeam) => UserTeam) => {
    if (activeTab === 'tactical') {
      setTacticalSquad(updater);
    } else {
      setOvrSquad(updater);
    }
  };

  const myTeam = currentSquad.players || [];
  const playerSlots = currentSquad.playerSlots || {};
  const customPositions = currentSquad.customPositions || {};
  const formation = currentSquad.formation || '4-3-3';

  // Base formation preset slots
  const currentPresetBase: Exclude<FormationType, 'CUSTOM'> =
    formation === 'CUSTOM'
      ? detectBasePresetFromSlots(Object.keys(playerSlots))
      : formation;
  const baseSlots = FORMATIONS[currentPresetBase]?.slots || FORMATIONS['4-3-3'].slots;

  // Active slots map: strictly 11 base slots
  const activeSlots: DefensePitchSlot[] = useMemo(() => {
    const slotsMap = new Map<string, DefensePitchSlot>();
    baseSlots.forEach((bSlot) => {
      const pId = playerSlots[bSlot.id];
      const custom = customPositions[bSlot.id] || (pId ? customPositions[pId] : undefined);
      if (custom) {
        const x = custom.x;
        const y = custom.y;
        const dynamicRole = custom.role || getEFootballPositionFromCoords(x, y);
        slotsMap.set(bSlot.id, {
          id: bSlot.id,
          role: dynamicRole,
          pos: getPositionCategory(dynamicRole),
          x,
          y,
        });
      } else {
        slotsMap.set(bSlot.id, { ...bSlot });
      }
    });

    return Array.from(slotsMap.values());
  }, [baseSlots, customPositions, playerSlots]);

  // Current squad effective OVR
  const effectiveOvr = useMemo(() => {
    return getTeamEffectiveOvr(currentSquad);
  }, [currentSquad]);

  // Save current defense squad
  const handleSaveCurrentSquad = () => {
    soundManager.playButtonClick();
    if (activeTab === 'tactical') {
      saveTacticalDefenseSquad(tacticalSquad);
      saveTacticalDefenseTactics(tactics);
      setSaveSuccessNotice('✅ 戦術対戦用守備スカッド＆戦術を保存しました！');
    } else {
      saveOVRDefenseSquad(ovrSquad);
      setSaveSuccessNotice('✅ OVR対戦用守備スカッドを保存しました！');
    }
    soundManager.playTeamCompleted();
    setTimeout(() => setSaveSuccessNotice(null), 3500);
  };

  // Copy from active MY TEAM
  const handleCopyFromActiveTeam = () => {
    soundManager.playButtonClick();
    const cloned = cloneUserTeam(activeTeam, `${activeTab}_def`);
    cloned.name = activeTab === 'tactical' ? '戦術対戦 守備スカッド' : 'OVR対戦 守備スカッド';
    setCurrentSquad(() => cloned);
    setToastMessage(`📥 現在のMY TEAM（TEAM ${activeTeam.teamNumber || 1}）からコピーしました`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load from a specific saved team
  const handleLoadFromSavedTeam = (teamId: string) => {
    const target = teams.find((t) => t.teamId === teamId);
    if (!target) return;
    soundManager.playButtonClick();
    const cloned = cloneUserTeam(target, `${activeTab}_def`);
    cloned.name = activeTab === 'tactical' ? '戦術対戦 守備スカッド' : 'OVR対戦 守備スカッド';
    setCurrentSquad(() => cloned);
    setToastMessage(`📥 「${target.name || `TEAM ${target.teamNumber}`}」から守備スカッドを読み込みました`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Reset formation
  const handleResetFormation = () => {
    soundManager.playButtonClick();
    const newSlots = remapPlayerSlots(myTeam, {}, formation);
    setCurrentSquad((prev) => ({
      ...prev,
      playerSlots: newSlots,
      customPositions: {},
    }));
    setToastMessage('🔄 フォーメーション配置を初期位置に戻しました');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Change formation
  const handleChangeFormation = (newFormation: FormationType) => {
    soundManager.playButtonClick();
    const newSlots = remapPlayerSlots(myTeam, playerSlots, newFormation, formation);
    setCurrentSquad((prev) => ({
      ...prev,
      formation: newFormation,
      playerSlots: newSlots,
      customPositions: newFormation === 'CUSTOM' ? prev.customPositions : {},
    }));
  };

  // Move player to empty slot
  const executeMoveToEmptySlot = (sourceSlotId: string, emptySlotId: string) => {
    const movingPlayerId = playerSlots[sourceSlotId];
    const movingPlayer = myTeam.find((p) => p.playerId === movingPlayerId);
    if (!movingPlayer) return;

    soundManager.playSlotStop();

    const updatedSlots = { ...playerSlots };
    delete updatedSlots[sourceSlotId];
    updatedSlots[emptySlotId] = movingPlayerId;

    const targetSlotObj = activeSlots.find((s) => s.id === emptySlotId);
    const nextCustom = { ...customPositions };
    delete nextCustom[movingPlayer.playerId];

    setCurrentSquad((prev) => ({
      ...prev,
      playerSlots: updatedSlots,
      customPositions: nextCustom,
    }));

    setToastMessage(`📍 ${movingPlayer.playerName} を ${targetSlotObj?.role || '空き枠'} へ移動しました（元の位置は空き枠）`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Swap 2 players
  const executeSwap = (slotAId: string, slotBId: string) => {
    const playerAId = playerSlots[slotAId];
    const playerBId = playerSlots[slotBId];
    const playerA = myTeam.find((p) => p.playerId === playerAId);
    const playerB = myTeam.find((p) => p.playerId === playerBId);
    if (!playerA || !playerB) return;

    soundManager.playSlotStop();

    const updatedSlots = {
      ...playerSlots,
      [slotAId]: playerBId,
      [slotBId]: playerAId,
    };

    const nextCustom = { ...customPositions };
    delete nextCustom[playerA.playerId];
    delete nextCustom[playerB.playerId];

    setCurrentSquad((prev) => ({
      ...prev,
      playerSlots: updatedSlots,
      customPositions: nextCustom,
    }));

    setToastMessage(`⇄ ${playerA.playerName} と ${playerB.playerName} を入れ替えました`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Commit Drop/Swap
  const commitDropOrSwap = () => {
    const slotIdToCommit = draggingSlotId;
    if (!slotIdToCommit) return;

    const targetSwapId = hoveredSwapSlotId;
    const targetCoord = dragCoord;

    setDraggingSlotId(null);
    setDragCoord(null);
    setHoveredSwapSlotId(null);

    const movingPlayerId = playerSlots[slotIdToCommit];
    const movingPlayer = myTeam.find((p) => p.playerId === movingPlayerId);
    if (!movingPlayer) return;

    let finalTargetSwapId = targetSwapId;
    if (!finalTargetSwapId && targetCoord) {
      let closestDist = Infinity;
      activeSlots.forEach((s) => {
        if (s.id === slotIdToCommit) return;
        const dist = Math.hypot(targetCoord.x - s.x, targetCoord.y - s.y);
        if (dist < 8.0 && dist < closestDist) {
          closestDist = dist;
          finalTargetSwapId = s.id;
        }
      });
    }

    if (finalTargetSwapId && finalTargetSwapId !== slotIdToCommit) {
      const otherPlayerId = playerSlots[finalTargetSwapId];
      const otherPlayer = otherPlayerId ? myTeam.find((p) => p.playerId === otherPlayerId) : null;
      if (otherPlayer) {
        executeSwap(slotIdToCommit, finalTargetSwapId);
      } else {
        executeMoveToEmptySlot(slotIdToCommit, finalTargetSwapId);
      }
    } else if (targetCoord) {
      const dynamicRole = getEFootballPositionFromCoords(targetCoord.x, targetCoord.y);
      const nextCustom = {
        ...customPositions,
        [slotIdToCommit]: {
          x: targetCoord.x,
          y: targetCoord.y,
          role: dynamicRole,
        },
      };
      delete nextCustom[movingPlayer.playerId];

      setCurrentSquad((prev) => ({
        ...prev,
        formation: 'CUSTOM',
        customPositions: nextCustom,
      }));

      soundManager.playSlotStop();
      setToastMessage(`📍 ${movingPlayer.playerName} を (${targetCoord.x}%, ${targetCoord.y}%) [${dynamicRole}] に自由配置しました`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Drag interaction handlers
  const startDragTimer = (slotId: string, clientX: number, clientY: number) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pointerStateRef.current = {
      startX: clientX,
      startY: clientY,
      slotId,
      isLongPressTriggered: false,
    };

    pressTimerRef.current = setTimeout(() => {
      if (!pointerStateRef.current) return;
      pointerStateRef.current.isLongPressTriggered = true;
      setDraggingSlotId(slotId);
      const sObj = activeSlots.find((s) => s.id === slotId);
      if (sObj) setDragCoord({ x: sObj.x, y: sObj.y });
      soundManager.playButtonClick();
    }, 260);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!pointerStateRef.current) return;
    const dist = Math.hypot(
      clientX - pointerStateRef.current.startX,
      clientY - pointerStateRef.current.startY
    );

    if (!pointerStateRef.current.isLongPressTriggered) {
      if (dist > 20) {
        if (pressTimerRef.current) {
          clearTimeout(pressTimerRef.current);
          pressTimerRef.current = null;
        }
        pointerStateRef.current = null;
      }
      return;
    }

    if (pitchRef.current && draggingSlotId) {
      const rect = pitchRef.current.getBoundingClientRect();
      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.round(Math.max(5, Math.min(95, rawX)));
      const clampedY = Math.round(Math.max(5, Math.min(95, rawY)));

      setDragCoord({ x: clampedX, y: clampedY });

      let overlapId: string | null = null;
      let minOverlap = Infinity;
      activeSlots.forEach((other) => {
        if (other.id === draggingSlotId) return;
        const dx = Math.abs(clampedX - other.x);
        const dy = Math.abs(clampedY - other.y);
        const d = Math.hypot(dx, dy);
        if (dx < 8.0 && dy < 9.0 && d < 8.5) {
          if (d < minOverlap) {
            minOverlap = d;
            overlapId = other.id;
          }
        }
      });
      setHoveredSwapSlotId(overlapId);
    }
  };

  const handlePointerUp = (slotId: string, clientX: number, clientY: number) => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    const pState = pointerStateRef.current;
    pointerStateRef.current = null;

    if (!pState) {
      if (draggingSlotId) commitDropOrSwap();
      return;
    }

    const dist = Math.hypot(clientX - pState.startX, clientY - pState.startY);

    // Tap detected (<260ms, <20px)
    if (!pState.isLongPressTriggered && dist < 20) {
      if (isSwapMode) {
        if (selectedSwapSourceSlotId) {
          if (selectedSwapSourceSlotId === slotId) {
            setSelectedSwapSourceSlotId(null);
          } else {
            const pAId = playerSlots[selectedSwapSourceSlotId];
            const pBId = playerSlots[slotId];
            if (pAId && pBId) {
              executeSwap(selectedSwapSourceSlotId, slotId);
            } else if (pAId && !pBId) {
              executeMoveToEmptySlot(selectedSwapSourceSlotId, slotId);
            } else if (!pAId && pBId) {
              executeMoveToEmptySlot(slotId, selectedSwapSourceSlotId);
            }
            setSelectedSwapSourceSlotId(null);
          }
        } else {
          setSelectedSwapSourceSlotId(slotId);
          const p = myTeam.find((pl) => pl.playerId === playerSlots[slotId]);
          setToastMessage(p ? `「${p.playerName}」を選択中。入替先の選手または空き枠をタップしてください` : `空き枠を選択中。移動させたい選手をタップしてください`);
        }
      } else {
        const p = myTeam.find((pl) => pl.playerId === playerSlots[slotId]);
        const s = activeSlots.find((sl) => sl.id === slotId);
        if (p) {
          setToastMessage(`👤 ${p.playerName} (OVR ${p.rating} / ${p.position}) - 長押しで自由配置`);
        } else {
          setToastMessage(`空き枠: ${s?.role || 'ポジション'} （選手をドラッグするか「⇄ 選手入替」で配置）`);
        }
        setTimeout(() => setToastMessage(null), 2500);
      }
      return;
    }

    if (pState.isLongPressTriggered || draggingSlotId) {
      commitDropOrSwap();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-indigo-500/60 rounded-3xl p-4 sm:p-6 max-w-5xl w-full shadow-2xl space-y-5 my-auto max-h-[96vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                  対戦用守備スカッド設定 (DEFENSE SQUAD)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold border border-indigo-500/30">
                  v1.2.5 INDEPENDENT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                戦術対戦・OVR対戦それぞれで相手と対戦する際の守備陣形を完全に独立して保存・管理します
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Tactical Defense vs OVR Defense */}
        <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('tactical');
              setSelectedSwapSourceSlotId(null);
            }}
            className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 font-heading font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
              activeTab === 'tactical'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>🧠 戦術対戦 守備設定</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              setActiveTab('ovr');
              setSelectedSwapSourceSlotId(null);
            }}
            className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 font-heading font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer ${
              activeTab === 'ovr'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>⚡ OVR対戦 守備設定</span>
          </button>
        </div>

        {/* Informative Sub-header */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              {activeTab === 'tactical'
                ? '相手が戦術対戦を挑んできた際に適用される守備陣形・戦術です（通常MY TEAM変更時も維持されます）'
                : '相手がOVR対戦を挑んできた際に適用される守備陣形・補正後OVRです（通常MY TEAM変更時も維持されます）'}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">チームOVR:</span>
              <span className="font-heading font-black text-sm text-amber-400">{effectiveOvr}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">選手数:</span>
              <span className="font-heading font-bold text-slate-200">{myTeam.length}/11</span>
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Copy from Active Team */}
            <button
              onClick={handleCopyFromActiveTeam}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              <span>現在のMY TEAMからコピー</span>
            </button>

            {/* Load from Saved Teams */}
            {teams.length > 1 && (
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) handleLoadFromSavedTeam(e.target.value);
                  }}
                  defaultValue=""
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer appearance-none pr-7"
                >
                  <option value="" disabled>
                    保存チームから選択...
                  </option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.name || `TEAM ${t.teamNumber}`} ({t.players?.length || 0}人)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Formation Selector */}
            <div className="relative">
              <select
                value={formation}
                onChange={(e) => handleChangeFormation(e.target.value as FormationType)}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-200 text-xs font-bold border border-slate-700 cursor-pointer appearance-none pr-7 font-mono"
              >
                {Object.keys(FORMATIONS).map((f) => (
                  <option key={f} value={f}>
                    {FORMATIONS[f as FormationType]?.name || f}
                  </option>
                ))}
                <option value="CUSTOM">カスタム自由配置</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Reset to Base Formation */}
            <button
              onClick={handleResetFormation}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>初期配置に戻す</span>
            </button>

            {/* Tap-to-Swap Mode Toggle */}
            <button
              onClick={() => {
                soundManager.playButtonClick();
                setIsSwapMode((prev) => !prev);
                setSelectedSwapSourceSlotId(null);
                setToastMessage(isSwapMode ? null : '⇄ 選手入替モード: 選手または空き枠を順にタップして配置を変更');
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isSwapMode
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-400 shadow-md animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{isSwapMode ? '⇄ 入替モード中' : '⇄ 選手入替'}</span>
            </button>

            {/* Save Button */}
            <button
              id="btn-save-defense-squad"
              onClick={handleSaveCurrentSquad}
              className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 text-xs font-heading font-black shadow-lg shadow-emerald-500/20 border border-emerald-400 flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>💾 守備設定を保存</span>
            </button>
          </div>
        </div>

        {/* Toasts */}
        {saveSuccessNotice && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border-2 border-emerald-500/70 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
        )}

        {toastMessage && (
          <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tactical settings panel (ONLY for Tactical Tab) */}
        {activeTab === 'tactical' && (
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-indigo-300 font-bold mb-1">
                ⚔️ 攻撃スタイル (相手ターン時)
              </label>
              <select
                value={tactics.attackTactic}
                onChange={(e) => setTactics((prev) => ({ ...prev, attackTactic: e.target.value as AttackTactics }))}
                className="w-full py-1.5 px-2.5 rounded-xl bg-slate-950 text-white font-bold border border-slate-700"
              >
                <option value="POSSESSION">ポゼッション</option>
                <option value="COUNTER">カウンター</option>
                <option value="LONG_COUNTER">ロングカウンター</option>
                <option value="CROSS_GAME">クロスゲー (空中戦特化)</option>
                <option value="TIKI_TAKA">ティキ・タカ</option>
                <option value="SHORT_PASS">ショートパス</option>
                <option value="DIRECT_PLAY">ダイレクトプレー</option>
                <option value="OVERLOAD">オーバーロード</option>
                <option value="FALSE_NINE">偽9番 (ゼロトップ)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-purple-300 font-bold mb-1">
                🛡️ 守備スタイル (最重要)
              </label>
              <select
                value={tactics.defenseTactic}
                onChange={(e) => setTactics((prev) => ({ ...prev, defenseTactic: e.target.value as DefenseTactics }))}
                className="w-full py-1.5 px-2.5 rounded-xl bg-slate-950 text-white font-bold border border-slate-700"
              >
                <option value="HIGH_PRESS">ハイプレス</option>
                <option value="GEGENPRESSING">ゲーゲンプレス</option>
                <option value="MID_BLOCK">ミドルブロック</option>
                <option value="LOW_BLOCK">ローブロック (堅守速攻)</option>
                <option value="MAN_MARK">マンマーク</option>
                <option value="ZONE_DEFENSE">ゾーンディフェンス</option>
                <option value="CENTRAL_CONTAIN">中央封鎖</option>
                <option value="WIDE_CONTAIN">サイド封鎖</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 font-bold mb-1">
                🧭 展開方向
              </label>
              <select
                value={tactics.attackDirection}
                onChange={(e) => setTactics((prev) => ({ ...prev, attackDirection: e.target.value as any }))}
                className="w-full py-1.5 px-2.5 rounded-xl bg-slate-950 text-white font-bold border border-slate-700"
              >
                <option value="BALANCED">バランス</option>
                <option value="CENTRAL">中央集中</option>
                <option value="WIDE">サイドワイド</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 font-bold mb-1">
                ⚡ プレッシング強度
              </label>
              <select
                value={tactics.pressIntensity}
                onChange={(e) => setTactics((prev) => ({ ...prev, pressIntensity: e.target.value as any }))}
                className="w-full py-1.5 px-2.5 rounded-xl bg-slate-950 text-white font-bold border border-slate-700"
              >
                <option value="AGGRESSIVE">アグレッシブ</option>
                <option value="BALANCED">通常</option>
                <option value="CONSERVATIVE">慎重</option>
              </select>
            </div>
          </div>
        )}

        {/* Interactive Pitch */}
        <div
          ref={pitchRef}
          id="defense-pitch-stage"
          onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          className="relative w-full aspect-[4/3] sm:aspect-[16/11] max-h-[500px] rounded-3xl border-4 border-emerald-600/40 shadow-2xl overflow-hidden p-2 select-none touch-none"
          style={{
            background: 'radial-gradient(ellipse at center, #065f46 0%, #064e3b 50%, #022c22 100%)',
          }}
        >
          {/* Pitch markings */}
          <div className="absolute inset-2 border-2 border-white/30 rounded-2xl pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-white/30 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-16 sm:h-20 border-b-2 border-x-2 border-white/30 rounded-b-xl" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-16 sm:h-20 border-t-2 border-x-2 border-white/30 rounded-t-xl" />
          </div>

          {/* Interactive Slots */}
          <div className="relative w-full h-full">
            {activeSlots.map((slot) => {
              const pId = playerSlots[slot.id];
              const player = myTeam.find((p) => p.playerId === pId);
              const isBeingDragged = draggingSlotId === slot.id;
              const isHovered = hoveredSwapSlotId === slot.id;
              const isSwapSource = selectedSwapSourceSlotId === slot.id;
              const isSwapTargetCandidate =
                isSwapMode && selectedSwapSourceSlotId !== null && selectedSwapSourceSlotId !== slot.id;

              const posX = isBeingDragged && dragCoord ? dragCoord.x : slot.x;
              const posY = isBeingDragged && dragCoord ? dragCoord.y : slot.y;

              // Check if an empty slot is physically overlapped by another player on the pitch
              const isCoveredByOtherPlayer =
                !player &&
                activeSlots.some((other) => {
                  if (other.id === slot.id) return false;
                  const otherPlayerId = playerSlots[other.id];
                  if (!otherPlayerId) return false;
                  const otherX = draggingSlotId === other.id && dragCoord ? dragCoord.x : other.x;
                  const otherY = draggingSlotId === other.id && dragCoord ? dragCoord.y : other.y;
                  return Math.hypot(otherX - slot.x, otherY - slot.y) < 7.0;
                });

              // If empty slot is covered by another player and not being hovered for drop, hide it completely to prevent overlap
              if (!player && isCoveredByOtherPlayer && !isHovered) {
                return null;
              }

              return (
                <div
                  key={slot.id}
                  onPointerDown={(e) => {
                    try {
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    } catch (err) {}
                    startDragTimer(slot.id, e.clientX, e.clientY);
                  }}
                  onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                  onPointerUp={(e) => {
                    try {
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                    } catch (err) {}
                    handlePointerUp(slot.id, e.clientX, e.clientY);
                  }}
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isBeingDragged ? 50 : isHovered || isSwapSource ? 40 : 10,
                  }}
                  className={`absolute cursor-pointer select-none touch-none ${
                    isBeingDragged
                      ? 'scale-115 ring-4 ring-amber-400 z-50'
                      : isHovered
                      ? 'scale-110 ring-4 ring-indigo-400 z-40'
                      : isSwapSource
                      ? 'scale-110 ring-4 ring-amber-400 z-40'
                      : isSwapTargetCandidate
                      ? 'ring-2 ring-emerald-400 hover:scale-105'
                      : 'hover:scale-105'
                  }`}
                >
                  {player ? (
                    (() => {
                      const targetPos = isBeingDragged && dragCoord
                        ? getEFootballPositionFromCoords(posX, posY)
                        : customPositions[slot.id]
                        ? getEFootballPositionFromCoords(slot.x, slot.y)
                        : normalizeRoleToEFootball(slot.role);
                      const evalResult = evaluatePlayerAtPosition(player, targetPos);
                      const displayedRole = isBeingDragged && dragCoord
                        ? targetPos
                        : customPositions[slot.id]?.role || slot.role;

                      return (
                        <div
                          className={`w-14 sm:w-20 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-xl border flex flex-col items-center justify-between text-center transition-all relative ${
                            isBeingDragged
                              ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400 shadow-amber-500/40'
                              : isHovered
                              ? 'bg-indigo-950 border-indigo-400 ring-2 ring-indigo-400'
                              : isSwapSource
                              ? 'bg-amber-950 border-amber-400'
                              : evalResult.ratingDelta < 0
                              ? 'bg-gradient-to-b from-rose-950 via-slate-900 to-slate-950 border-rose-500/80'
                              : player.rating >= 90
                              ? 'bg-gradient-to-b from-slate-900 via-amber-950/60 to-slate-950 border-amber-500/70'
                              : 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-emerald-500/50'
                          }`}
                        >
                          {/* Badges */}
                          {isBeingDragged && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[8px] font-black whitespace-nowrap shadow-md">
                              移動中
                            </div>
                          )}
                          {isHovered && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-1.5 py-0.2 rounded-full text-[8px] font-black whitespace-nowrap shadow-md">
                              ⇄ 入替
                            </div>
                          )}
                          {isSwapSource && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[8px] font-black whitespace-nowrap shadow-md">
                              選択中
                            </div>
                          )}

                          {/* Flag + Effective Rating */}
                          <div className="flex items-center justify-between w-full text-[9px] sm:text-xs">
                            <span>{player.nationalityFlag}</span>
                            <div className="flex items-center gap-0.5 font-heading font-black">
                              {evalResult.ratingDelta < 0 && (
                                <span className="text-[8px] text-rose-400 font-mono">
                                  {evalResult.ratingDelta}
                                </span>
                              )}
                              <span
                                className={
                                  evalResult.ratingDelta < 0
                                    ? 'text-rose-400'
                                    : player.rating >= 90
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }
                              >
                                {evalResult.effectiveRating}
                              </span>
                            </div>
                          </div>

                          {/* Player Name */}
                          <div className="my-0.5 w-full px-0.5">
                            <div className="font-heading font-bold text-[9px] sm:text-xs text-white truncate leading-tight">
                              {getLocalizedPlayerName(player, language)}
                            </div>
                          </div>

                          {/* Role Pill */}
                          <div className="w-full flex items-center justify-between pt-0.5 border-t border-slate-800 text-[7px] sm:text-[9px] font-mono">
                            <span
                              className={`font-bold ${
                                evalResult.ratingDelta < 0 ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                            >
                              {displayedRole}
                            </span>
                            <span className="text-slate-400">{player.joiningYear}</span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* Empty Position Slot */
                    <div
                      className={`w-14 sm:w-20 aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all relative ${
                        isHovered
                          ? 'border-emerald-400 bg-emerald-500/30 scale-115 ring-4 ring-emerald-400 shadow-2xl animate-pulse z-40'
                          : isSwapSource
                          ? 'border-amber-400 bg-amber-500/30 ring-4 ring-amber-400 scale-110 shadow-xl z-40'
                          : isSwapTargetCandidate
                          ? 'border-emerald-400/80 bg-emerald-950/40 ring-2 ring-emerald-400 hover:scale-105'
                          : 'border-white/40 bg-black/50 text-slate-300 hover:border-emerald-400/60'
                      }`}
                    >
                      {isHovered && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full text-[8px] font-black whitespace-nowrap shadow-lg flex items-center gap-1">
                          <span>⬇</span>
                          <span>ここに配置</span>
                        </div>
                      )}
                      {isSwapSource && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[8px] font-black whitespace-nowrap shadow-md">
                          選択中
                        </div>
                      )}
                      {isSwapTargetCandidate && !isHovered && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-1 py-0.2 rounded text-[7px] font-black whitespace-nowrap shadow-md">
                          タップで配置
                        </div>
                      )}
                      <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-emerald-400 drop-shadow">
                        {slot.role}
                      </span>
                      <span className="text-[8px] font-mono text-slate-400 font-bold">空き枠</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info & persistent save guarantee */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="text-slate-400 text-[11px]">
            ※ 各守備スカッドはローカルストレージに独立して永続保存されます。MY TEAMやドラフト変更で消えることはありません。
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
            >
              閉じる
            </button>
            <button
              onClick={handleSaveCurrentSquad}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-heading font-black shadow-lg shadow-emerald-500/20 border border-emerald-400 transition-all cursor-pointer"
            >
              💾 守備設定を保存する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
