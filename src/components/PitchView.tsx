import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Player, FormationType, Language, FORMATIONS, CustomPlayerPosition, MainPosition, UserTeam } from '../types';
import { TRANSLATIONS, getLocalizedPlayerName, getLocalizedPosition } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { remapPlayerSlots, detectBasePresetFromSlots, PRESET_FORMATIONS } from '../utils/formationUtils';
import { Share2, RotateCcw, Check, Award, Shield, Zap, Sparkles, Move, AlertTriangle, X, Plus, Play, Trash2, Users } from 'lucide-react';

interface PitchSlot {
  id: string;
  role: string;
  pos: MainPosition;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

interface PitchViewProps {
  teams?: UserTeam[];
  activeTeamId?: string;
  onSelectTeam?: (teamId: string) => void;
  onCreateNewTeam?: () => void;
  onDeleteTeam?: (teamId: string) => void;
  onContinueDraft?: (teamId: string) => void;
  onOpenShare?: (team: UserTeam) => void;
  myTeam: Player[];
  playerSlots: Record<string, string>; // slotId -> playerId
  onUpdateSlotAssignment: (newSlots: Record<string, string>) => void;
  formation: FormationType;
  onChangeFormation: (formation: FormationType) => void;
  customPositions: Record<string, CustomPlayerPosition>;
  onUpdateCustomPositions: (positions: Record<string, CustomPlayerPosition>) => void;
  language: Language;
}

export const PitchView: React.FC<PitchViewProps> = ({
  teams,
  activeTeamId,
  onSelectTeam,
  onCreateNewTeam,
  onDeleteTeam,
  onContinueDraft,
  onOpenShare,
  myTeam,
  playerSlots,
  onUpdateSlotAssignment,
  formation,
  onChangeFormation,
  customPositions,
  onUpdateCustomPositions,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const pitchRef = useRef<HTMLDivElement>(null);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  // Drag and Drop state
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);
  const [dragCoords, setDragCoords] = useState<{ x: number; y: number } | null>(null);
  const [hoveredTargetSlotId, setHoveredTargetSlotId] = useState<string | null>(null);
  const [isLongPressing, setIsLongPressing] = useState<string | null>(null);

  // References for handling pointer / touch events
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerStartPos = useRef<{ x: number; y: number; time: number } | null>(null);
  const activeDragIdRef = useRef<string | null>(null);
  activeDragIdRef.current = draggingSlotId;

  // Current active team record
  const currentTeam = teams?.find((t) => t.teamId === activeTeamId);
  const currentTeamNumber = currentTeam?.teamNumber || 1;

  // Determine base preset (dynamically detecting matching preset if in CUSTOM mode)
  const currentPresetBase: Exclude<FormationType, 'CUSTOM'> =
    formation === 'CUSTOM'
      ? detectBasePresetFromSlots(Object.keys(playerSlots))
      : formation;
  const baseSlots = FORMATIONS[currentPresetBase]?.slots || FORMATIONS['4-3-3'].slots;

  // Resolve player slots to guarantee NO player in myTeam is ever unmapped or lost
  const resolvedPlayerSlots = useMemo(() => {
    return remapPlayerSlots(myTeam, playerSlots, formation);
  }, [myTeam, playerSlots, formation]);

  // Keep parent playerSlots in sync if resolution assigned missing slots
  useEffect(() => {
    if (myTeam.length > 0) {
      const keysA = Object.keys(resolvedPlayerSlots);
      const keysB = Object.keys(playerSlots);
      const isIdentical =
        keysA.length === keysB.length && keysA.every((k) => resolvedPlayerSlots[k] === playerSlots[k]);
      if (!isIdentical) {
        onUpdateSlotAssignment(resolvedPlayerSlots);
      }
    }
  }, [resolvedPlayerSlots, playerSlots, onUpdateSlotAssignment, myTeam.length]);

  const activeSlots: PitchSlot[] = baseSlots.map((baseSlot) => {
    if (formation === 'CUSTOM' && customPositions[baseSlot.id]) {
      return {
        ...baseSlot,
        x: customPositions[baseSlot.id].x,
        y: customPositions[baseSlot.id].y,
      };
    }
    return {
      ...baseSlot,
    };
  });

  // Calculate stats
  const averageRating =
    myTeam.length > 0
      ? Math.round(myTeam.reduce((acc, p) => acc + p.rating, 0) / myTeam.length)
      : 0;

  // Chemistry calculation based on shared clubs and nationalities
  let chemistryPoints = 0;
  for (let i = 0; i < myTeam.length; i++) {
    for (let j = i + 1; j < myTeam.length; j++) {
      if (myTeam[i].clubId === myTeam[j].clubId) chemistryPoints += 8;
      if (myTeam[i].nationality === myTeam[j].nationality) chemistryPoints += 4;
    }
  }
  const maxChem = 100;
  const chemistry = Math.min(maxChem, Math.round(chemistryPoints * 1.5) + (myTeam.length === 11 ? 25 : 0));

  // Clean up press timer on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  // Global window listeners for drag & release
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent | TouchEvent) => {
      if (!activeDragIdRef.current || !pitchRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const rect = pitchRef.current.getBoundingClientRect();
      const relativeX = Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100));
      const relativeY = Math.max(10, Math.min(92, ((clientY - rect.top) / rect.height) * 100));

      setDragCoords({ x: relativeX, y: relativeY });

      // Check if hovering over any other slot for swap
      const currentSlotId = activeDragIdRef.current;
      let foundHover: string | null = null;

      for (const s of activeSlots) {
        if (s.id === currentSlotId) continue;
        const dist = Math.hypot(s.x - relativeX, s.y - relativeY);
        if (dist < 8.5) {
          foundHover = s.id;
          break;
        }
      }
      setHoveredTargetSlotId(foundHover);
    };

    const handleGlobalPointerUp = () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      setIsLongPressing(null);

      const dragId = activeDragIdRef.current;
      if (!dragId) return;

      soundManager.playButtonClick();

      // Finalize Drag or Swap
      if (hoveredTargetSlotId) {
        // Swap players between slots
        const sourcePlayerId = resolvedPlayerSlots[dragId];
        const targetPlayerId = resolvedPlayerSlots[hoveredTargetSlotId];

        const updatedSlots = { ...resolvedPlayerSlots };
        if (targetPlayerId) {
          updatedSlots[dragId] = targetPlayerId;
        } else {
          delete updatedSlots[dragId];
        }

        if (sourcePlayerId) {
          updatedSlots[hoveredTargetSlotId] = sourcePlayerId;
        } else {
          delete updatedSlots[hoveredTargetSlotId];
        }

        onUpdateSlotAssignment(updatedSlots);
      } else if (dragCoords) {
        // Freely set custom placement coordinates
        const newCustomPositions = { ...customPositions };

        // Ensure all slots have recorded default coordinates before switching to CUSTOM
        if (formation !== 'CUSTOM') {
          activeSlots.forEach((slot) => {
            if (!newCustomPositions[slot.id]) {
              newCustomPositions[slot.id] = { x: slot.x, y: slot.y };
            }
          });
          onChangeFormation('CUSTOM');
        }

        newCustomPositions[dragId] = {
          x: Math.round(dragCoords.x * 10) / 10,
          y: Math.round(dragCoords.y * 10) / 10,
        };

        onUpdateCustomPositions(newCustomPositions);
      }

      setDraggingSlotId(null);
      setDragCoords(null);
      setHoveredTargetSlotId(null);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('touchmove', handleGlobalPointerMove, { passive: false });
    window.addEventListener('touchend', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('touchmove', handleGlobalPointerMove);
      window.removeEventListener('touchend', handleGlobalPointerUp);
    };
  }, [activeSlots, playerSlots, hoveredTargetSlotId, dragCoords, customPositions, formation, onChangeFormation, onUpdateCustomPositions, onUpdateSlotAssignment]);

  // Handle pointer down on slot (Long press triggers free dragging)
  const handleSlotPointerDown = (slotId: string, e: React.PointerEvent) => {
    pointerStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };

    setIsLongPressing(slotId);

    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);

    pressTimerRef.current = setTimeout(() => {
      setDraggingSlotId(slotId);
      setIsLongPressing(null);
      soundManager.playButtonClick();

      if (pitchRef.current) {
        const rect = pitchRef.current.getBoundingClientRect();
        const relativeX = Math.max(8, Math.min(92, ((e.clientX - rect.left) / rect.width) * 100));
        const relativeY = Math.max(10, Math.min(92, ((e.clientY - rect.top) / rect.height) * 100));
        setDragCoords({ x: relativeX, y: relativeY });
      }
    }, 400); // 400ms long-press threshold
  };

  // Handle slot tap / click (When not dragged)
  const handleSlotClick = (slotId: string) => {
    if (draggingSlotId) return;

    soundManager.playButtonClick();

    if (selectedSlotId === null) {
      setSelectedSlotId(slotId);
    } else if (selectedSlotId === slotId) {
      setSelectedSlotId(null);
    } else {
      // Swap players between selectedSlotId and slotId
      const p1 = resolvedPlayerSlots[selectedSlotId];
      const p2 = resolvedPlayerSlots[slotId];

      const newSlots = { ...resolvedPlayerSlots };
      if (p2) newSlots[selectedSlotId] = p2;
      else delete newSlots[selectedSlotId];

      if (p1) newSlots[slotId] = p1;
      else delete newSlots[slotId];

      onUpdateSlotAssignment(newSlots);
      setSelectedSlotId(null);
    }
  };

  // Share Team (open rich SNS Share Modal or copy to clipboard)
  const handleShareTeam = () => {
    soundManager.playButtonClick();
    if (onOpenShare && currentTeam) {
      onOpenShare(currentTeam);
      return;
    }
    const lineupText = [
      `⚽ MY FOOTBALL DRAFT BEST XI (${currentTeam?.name || `TEAM ${currentTeamNumber}`})`,
      `Formation: ${formation}`,
      `Squad OVR: ${averageRating} | Chemistry: ${chemistry}%`,
      '--------------------------------',
      ...activeSlots.map((s, idx) => {
        const pId = resolvedPlayerSlots[s.id];
        const player = myTeam.find((p) => p.playerId === pId);
        return `${idx + 1}. [${s.role}] ${player ? `${player.playerName} (${player.clubName}, ${player.joiningYear}) OVR:${player.rating}` : 'EMPTY'}`;
      }),
      '--------------------------------',
      'Play Football Draft now!',
    ].join('\n');

    navigator.clipboard.writeText(lineupText).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    });
  };

  // Reset Custom Formation to Default Preset (4-3-3)
  const handleConfirmReset = () => {
    soundManager.playButtonClick();
    onUpdateCustomPositions({});
    onChangeFormation('4-3-3');
    setShowResetConfirm(false);
  };

  return (
    <div id="pitch-view-container" className="max-w-4xl mx-auto space-y-4 sm:space-y-6 select-none">
      {/* 1. Multi-Team Selector Tabs */}
      {teams && teams.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
            {teams.map((tItem) => {
              const isSelected = tItem.teamId === activeTeamId;
              const isFull = tItem.players.length === 11;
              return (
                <button
                  key={tItem.teamId}
                  onClick={() => {
                    soundManager.playButtonClick();
                    if (onSelectTeam) onSelectTeam(tItem.teamId);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-lg shadow-emerald-950/60'
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{tItem.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                      isFull
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {tItem.players.length}/11
                  </span>
                  {isFull && <span className="text-[10px]">👑</span>}
                </button>
              );
            })}

            {/* Create New Team button */}
            {onCreateNewTeam && (
              <button
                id="btn-create-new-team-tab"
                onClick={() => {
                  soundManager.playButtonClick();
                  onCreateNewTeam();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 transition-all shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t.createNewTeam}</span>
              </button>
            )}
          </div>

          {/* Delete Team Button (Only if more than 1 team exists) */}
          {onDeleteTeam && teams.length > 1 && activeTeamId && (
            <button
              onClick={() => setTeamToDelete(activeTeamId)}
              title={t.deleteTeam}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Delete Team Confirmation Modal */}
      {teamToDelete && onDeleteTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-base text-white">
              {t.deleteTeam}
            </h3>
            <p className="text-xs text-slate-300">
              {t.deleteTeamConfirm}
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setTeamToDelete(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  onDeleteTeam(teamToDelete);
                  setTeamToDelete(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Status Bar: Chemistry, OVR & Tactics Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Team Chemistry & Rating */}
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-around sm:justify-start">
            {/* Team Squad Count Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 font-black text-lg">
                🛡️
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {currentTeam?.name || t.myTeam}
                </div>
                <div className="font-heading font-black text-xl text-white">
                  <span className="text-emerald-400">{myTeam.length}</span> / 11
                </div>
              </div>
            </div>

            {/* Average Rating */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 font-heading font-black text-base">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t.avgRating}
                </div>
                <div className="font-heading font-black text-xl text-amber-400">
                  {averageRating > 0 ? averageRating : '--'}
                </div>
              </div>
            </div>

            {/* Team Chemistry */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                <Zap className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t.teamChemistry}
                </div>
                <div className="font-heading font-black text-xl text-teal-300">
                  {chemistry}%
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions: Share, Reset Formation, or Continue Draft */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* If In-Progress (< 11 players), prominent CONTINUE DRAFT button */}
            {myTeam.length < 11 && onContinueDraft && activeTeamId && (
              <button
                id="btn-continue-draft-pitch"
                onClick={() => {
                  soundManager.playButtonClick();
                  onContinueDraft(activeTeamId);
                }}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-heading font-black text-xs tracking-wider shadow-lg flex items-center gap-1.5 animate-pulse"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>{t.continueTeam} ({myTeam.length}/11)</span>
              </button>
            )}

            {/* Share Team Button */}
            <button
              id="btn-share-team"
              onClick={handleShareTeam}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedNotification ? t.copiedToClipboard : t.shareTeam}</span>
            </button>
          </div>
        </div>

        {/* Formation & Custom Placement Controls */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Formation Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400">{t.formation}:</span>
            <select
              value={formation}
              onChange={(e) => {
                soundManager.playButtonClick();
                onChangeFormation(e.target.value as FormationType);
              }}
              className="bg-slate-950 border border-slate-700 hover:border-emerald-500 text-emerald-300 font-bold text-xs py-1.5 px-3 rounded-xl focus:outline-none transition-colors cursor-pointer"
            >
              {PRESET_FORMATIONS.map((f) => (
                <option key={f} value={f}>
                  {f} {FORMATIONS[f].name}
                </option>
              ))}
              {formation === 'CUSTOM' && (
                <option value="CUSTOM">✨ {t.customFormation} (Free Placement)</option>
              )}
            </select>

            {formation === 'CUSTOM' && (
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>CUSTOM</span>
              </span>
            )}
          </div>

          {/* Reset Formation button */}
          <div className="flex items-center gap-2">
            {formation === 'CUSTOM' && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 underline flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.resetFormation}</span>
              </button>
            )}
          </div>
        </div>

        {/* Long Press Instructions notice */}
        <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 flex items-center gap-2">
          <Move className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t.dragInstructions}</span>
        </div>
      </div>

      {/* 3. Tactical Pitch Canvas */}
      <div
        ref={pitchRef}
        id="tactical-pitch-stage"
        className="relative w-full aspect-[4/3] sm:aspect-[16/11] max-h-[580px] bg-emerald-900/90 rounded-3xl border-4 border-emerald-600/40 shadow-2xl overflow-hidden p-2 select-none touch-none"
        style={{
          background:
            'radial-gradient(ellipse at center, #065f46 0%, #064e3b 50%, #022c22 100%)',
        }}
      >
        {/* Pitch Turf Stripes */}
        <div className="absolute inset-0 opacity-15 pointer-events-none flex flex-col">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${i % 2 === 0 ? 'bg-black/20' : 'bg-white/10'}`}
            />
          ))}
        </div>

        {/* Pitch Lines (White markings) */}
        <div className="absolute inset-2 border-2 border-white/30 rounded-2xl pointer-events-none">
          {/* Halfway line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2" />
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-white/30 -translate-x-1/2 -translate-y-1/2" />
          {/* Center spot */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white/50 -translate-x-1/2 -translate-y-1/2" />
          {/* Top Penalty Box */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-16 sm:h-20 border-b-2 border-x-2 border-white/30 rounded-b-xl" />
          {/* Top Goal Box */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-8 sm:h-10 border-b-2 border-x-2 border-white/30 rounded-b-lg" />
          {/* Bottom Penalty Box */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-16 sm:h-20 border-t-2 border-x-2 border-white/30 rounded-t-xl" />
          {/* Bottom Goal Box */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-8 sm:h-10 border-t-2 border-x-2 border-white/30 rounded-t-lg" />
        </div>

        {/* Pitch Interactive Slots (11 Players) */}
        <div className="relative w-full h-full">
          {activeSlots.map((slot) => {
            const playerId = resolvedPlayerSlots[slot.id];
            const player = myTeam.find((p) => p.playerId === playerId);
            const isSelected = selectedSlotId === slot.id;
            const isDraggingThis = draggingSlotId === slot.id;
            const isHoveredTarget = hoveredTargetSlotId === slot.id;
            const isPressingThis = isLongPressing === slot.id;

            // Compute Coordinates
            const displayX = isDraggingThis && dragCoords ? dragCoords.x : slot.x;
            const displayY = isDraggingThis && dragCoords ? dragCoords.y : slot.y;

            return (
              <div
                key={slot.id}
                onPointerDown={(e) => handleSlotPointerDown(slot.id, e)}
                onClick={() => handleSlotClick(slot.id)}
                style={{
                  left: `${displayX}%`,
                  top: `${displayY}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isDraggingThis ? 40 : isHoveredTarget ? 30 : isSelected ? 20 : 10,
                }}
                className={`absolute cursor-pointer transition-transform ${
                  isDraggingThis
                    ? 'scale-110 shadow-2xl ring-4 ring-amber-400 pointer-events-none'
                    : isHoveredTarget
                    ? 'scale-110 ring-4 ring-amber-400 bg-amber-500/30 rounded-2xl'
                    : isSelected
                    ? 'scale-105 ring-4 ring-emerald-400'
                    : isPressingThis
                    ? 'scale-95 brightness-125'
                    : 'hover:scale-105'
                }`}
              >
                {player ? (
                  /* Player Card on Pitch */
                  <div
                    className={`w-14 sm:w-20 rounded-xl sm:rounded-2xl p-1 sm:p-1.5 shadow-xl border flex flex-col items-center justify-between text-center transition-all ${
                      player.rating >= 90
                        ? 'bg-gradient-to-b from-slate-900 via-amber-950/60 to-slate-950 border-amber-500/70 shadow-amber-500/20'
                        : 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-emerald-500/50 shadow-emerald-950/50'
                    }`}
                  >
                    {/* Top flag + Rating */}
                    <div className="flex items-center justify-between w-full text-[9px] sm:text-xs">
                      <span className="leading-none">{player.nationalityFlag}</span>
                      <span
                        className={`font-heading font-black ${
                          player.rating >= 90 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {player.rating}
                      </span>
                    </div>

                    {/* Player Name */}
                    <div className="my-0.5 sm:my-1 w-full px-0.5">
                      <div className="font-heading font-bold text-[9px] sm:text-xs text-white truncate leading-tight">
                        {getLocalizedPlayerName(player, language)}
                      </div>
                      <div className="text-[7px] sm:text-[9px] text-slate-400 truncate">
                        {player.clubName}
                      </div>
                    </div>

                    {/* Role & Slot Position Pill */}
                    <div className="w-full flex items-center justify-between pt-0.5 border-t border-slate-800/80 text-[7px] sm:text-[9px] font-mono">
                      <span className="font-bold text-emerald-400">{slot.role}</span>
                      <span className="text-slate-400 font-sans">{player.joiningYear}</span>
                    </div>

                    {/* Hover swap indicator */}
                    {isHoveredTarget && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[8px] font-black whitespace-nowrap shadow-md flex items-center gap-0.5">
                        <span>🔄</span>
                        <span>SWAP</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty Slot on Pitch */
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all ${
                      isHoveredTarget
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : isSelected
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : 'border-white/30 bg-black/40 text-slate-300 hover:border-emerald-400/60 hover:bg-black/60'
                    }`}
                  >
                    {isHoveredTarget && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-950 text-amber-300 border border-amber-400 px-1 py-0.2 rounded text-[8px] font-black whitespace-nowrap shadow-md">
                        🔄 HERE
                      </div>
                    )}
                    <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase">
                      {slot.role}
                    </span>
                    <span className="text-[8px] opacity-60">EMPTY</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Squad Roster Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
        <h4 className="font-heading font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>📋</span>
            <span>{currentTeam?.name || `TEAM ${currentTeamNumber}`} SQUAD LIST ({myTeam.length}/11)</span>
          </div>
          {myTeam.length === 11 ? (
            <span className="text-xs text-amber-400 font-black px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30">
              COMPLETE 11 👑
            </span>
          ) : (
            <span className="text-xs text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              {t.draftInProgress}
            </span>
          )}
        </h4>

        {myTeam.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-xs text-slate-400 font-medium">
              No players drafted for this team yet. Spin the draft roulette to begin!
            </p>
            {onContinueDraft && activeTeamId && (
              <button
                onClick={() => onContinueDraft(activeTeamId)}
                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
              >
                ⚽ START DRAFT
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {myTeam.map((p, idx) => (
              <div
                key={p.playerId}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-slate-500 w-4">{idx + 1}</span>
                  <span className="text-base shrink-0">{p.nationalityFlag}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-white leading-none truncate">
                      {getLocalizedPlayerName(p, language)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      {p.clubName} ({p.joiningYear})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="font-mono font-black text-amber-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700">
                    {p.rating}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded-md">
                    {p.position}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESET FORMATION Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-black text-base text-white">
              {t.resetFormationConfirmTitle}
            </h3>

            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
              {t.resetFormationConfirm}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmReset}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs transition-all shadow-lg"
              >
                {t.resetFormation}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
