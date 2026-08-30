import React, { useState, useRef } from 'react';
import { UserTeam, Language, FORMATIONS, FormationType, Player } from '../types';
import { TRANSLATIONS, getLocalizedPlayerName, getLocalizedClubName } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { generateShareData, DEFAULT_X_CHAR_LIMIT } from '../utils/shareUtils';
import { ALL_PLAYERS } from '../data/playerDatabase';
import { ALL_CLUBS } from '../data/clubs';
import { toPng } from 'html-to-image';
import {
  X,
  Share2,
  Copy,
  Download,
  Check,
  Sparkles,
  MessageCircle,
  Smartphone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: UserTeam;
  language: Language;
  xCharLimit?: number;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  team,
  language,
  xCharLimit = DEFAULT_X_CHAR_LIMIT,
}) => {
  const t = TRANSLATIONS[language];
  const cardRef = useRef<HTMLDivElement>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'x' | 'full'>('x');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  if (!isOpen) return null;

  const avgRating =
    team.players.length > 0
      ? Math.round(team.players.reduce((acc, p) => acc + p.rating, 0) / team.players.length)
      : 0;

  // Build active slots with coordinates
  const presetBase: Exclude<FormationType, 'CUSTOM'> =
    team.formation === 'CUSTOM' ? '4-3-3' : (team.formation as Exclude<FormationType, 'CUSTOM'>) || '4-3-3';
  const baseSlots = FORMATIONS[presetBase]?.slots || FORMATIONS['4-3-3'].slots;

  const pitchSlots = baseSlots.map((baseSlot) => {
    if (team.formation === 'CUSTOM' && team.customPositions?.[baseSlot.id]) {
      return {
        ...baseSlot,
        x: team.customPositions[baseSlot.id].x,
        y: team.customPositions[baseSlot.id].y,
      };
    }
    return baseSlot;
  });

  const playersById = new Map<string, Player>();
  for (const p of team.players) {
    playersById.set(p.playerId, p);
  }

  // Grouped position list for the card
  const gks: { player: Player; role: string }[] = [];
  const dfs: { player: Player; role: string }[] = [];
  const mfs: { player: Player; role: string }[] = [];
  const fws: { player: Player; role: string }[] = [];

  const assigned = new Set<string>();

  for (const slot of baseSlots) {
    const pId = team.playerSlots?.[slot.id];
    if (pId && playersById.has(pId)) {
      const p = playersById.get(pId)!;
      assigned.add(p.playerId);
      if (slot.pos === 'GK') gks.push({ player: p, role: slot.role });
      else if (slot.pos === 'DF') dfs.push({ player: p, role: slot.role });
      else if (slot.pos === 'MF') mfs.push({ player: p, role: slot.role });
      else fws.push({ player: p, role: slot.role });
    }
  }

  for (const p of team.players) {
    if (!assigned.has(p.playerId)) {
      if (p.position === 'GK') gks.push({ player: p, role: 'GK' });
      else if (p.position === 'DF') dfs.push({ player: p, role: 'DF' });
      else if (p.position === 'MF') mfs.push({ player: p, role: 'MF' });
      else fws.push({ player: p, role: 'FW' });
    }
  }

  const shareData = generateShareData(team, language, undefined, xCharLimit);

  // 1. Share to X (Twitter) - Guarantees limit calculation beforehand
  const handleShareX = () => {
    soundManager.playButtonClick();
    if (!shareData.isWithinXLimit) {
      showToast(t.xCharLimitExceededWarning);
    } else {
      showToast(t.teamSharedSuccess);
    }
    window.open(shareData.xShareUrl, '_blank', 'noopener,noreferrer');
  };

  // 2. Share to LINE
  const handleShareLine = () => {
    soundManager.playButtonClick();
    showToast(t.teamSharedSuccess);
    window.open(shareData.lineShareUrl, '_blank', 'noopener,noreferrer');
  };

  // 3. Share to Facebook
  const handleShareFacebook = () => {
    soundManager.playButtonClick();
    showToast(t.teamSharedSuccess);
    window.open(shareData.facebookShareUrl, '_blank', 'noopener,noreferrer');
  };

  // 4. Share to Instagram (Copy text + offer image download / Web Share)
  const handleShareInstagram = async () => {
    soundManager.playButtonClick();
    try {
      await navigator.clipboard.writeText(shareData.xShareText);
      showToast(`${t.copiedShareTextSuccess} (Instagram用)`);
    } catch {
      showToast(t.teamSharedSuccess);
    }

    if (navigator.share && typeof navigator.canShare === 'function') {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.xShareText,
          url: shareData.url,
        });
        return;
      } catch {
        // user dismissed
      }
    }
  };

  // 5. Native OS Share Sheet (Web Share API for TikTok, Discord, WhatsApp, Threads, etc.)
  const handleNativeShare = async () => {
    soundManager.playButtonClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.xShareText,
          url: shareData.url,
        });
        showToast(t.teamSharedSuccess);
      } catch {
        // dismissed
      }
    } else {
      // Fallback to clipboard copy
      handleCopyText(shareData.xShareText);
    }
  };

  // 6. Copy Full Share Text
  const handleCopyText = async (textToCopy: string) => {
    soundManager.playButtonClick();
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast(t.copiedShareTextSuccess);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(t.copiedShareTextSuccess);
    }
  };

  // 7. Download Card Image (.PNG)
  const handleDownloadCard = async () => {
    if (!cardRef.current || isGeneratingImage) return;
    soundManager.playButtonClick();
    setIsGeneratingImage(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 0.95,
      });

      const link = document.createElement('a');
      link.download = `FOOTBALL_DRAFT_${team.name.replace(/\s+/g, '_')}_BEST_XI.png`;
      link.href = dataUrl;
      link.click();

      showToast(t.imageDownloadedSuccess);
    } catch (err) {
      console.error('Image capture failed', err);
      handleCopyText(shareData.xShareText);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div
      id="share-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-heading font-black text-sm shadow-2xl shadow-emerald-500/50 flex items-center gap-2 border border-emerald-300 animate-bounce">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div
        id="share-modal-content"
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md flex items-center justify-center text-slate-950">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base sm:text-lg text-white tracking-wide">
                {t.shareTeamModalTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.shareSubtitle}
              </p>
            </div>
          </div>

          <button
            id="btn-close-share-modal"
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* ======================================================== */}
          {/* THE SHAREABLE CARD (Target for Screenshot / High-Res PNG) */}
          {/* ======================================================== */}
          <div
            ref={cardRef}
            id="shareable-team-card"
            className="w-full rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/40 p-4 sm:p-5 shadow-2xl relative overflow-hidden text-white space-y-4"
          >
            {/* Background Stadium Glow Elements */}
            <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⚽</span>
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                    FOOTBALL DRAFT • {team.mode === 'europe' ? 'EUROPE' : 'J1 LEAGUE'}
                  </div>
                  <h4 className="font-heading font-black text-xl text-white tracking-wider">
                    {team.name || `TEAM ${team.teamNumber}`}
                  </h4>
                </div>
              </div>

              {/* Stats Chips */}
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-400/40 text-center">
                  <div className="text-[9px] uppercase font-bold text-amber-300">OVR</div>
                  <div className="font-heading font-black text-sm text-amber-400 leading-none">{avgRating}</div>
                </div>
                <div className="px-3 py-1 rounded-xl bg-teal-400/20 border border-teal-400/40 text-center">
                  <div className="text-[9px] uppercase font-bold text-teal-300">FORM</div>
                  <div className="font-heading font-black text-sm text-teal-400 leading-none">{team.formation}</div>
                </div>
              </div>
            </div>

            {/* Mini Tactical Pitch Preview */}
            <div className="w-full h-36 sm:h-40 rounded-2xl bg-gradient-to-b from-emerald-950/80 via-green-900/60 to-emerald-950/80 border border-emerald-500/30 relative overflow-hidden shadow-inner flex items-center justify-center">
              <div className="absolute inset-2 border border-white/20 rounded-xl pointer-events-none" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20 -translate-y-1/2 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/20 pointer-events-none" />

              {/* Player Dots on Pitch */}
              {pitchSlots.map((slot) => {
                const pId = team.playerSlots?.[slot.id];
                const player = team.players.find((p) => p.playerId === pId);
                const dbPlayer = player ? ALL_PLAYERS.find((dp) => dp.playerId === player.playerId) || player : null;
                const playerName = dbPlayer ? getLocalizedPlayerName(dbPlayer, language) : (player?.playerName || slot.role);

                return (
                  <div
                    key={slot.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border shadow-md ${
                        player?.isLegendary
                          ? 'bg-amber-400 text-slate-950 border-white'
                          : player
                          ? 'bg-emerald-500 text-slate-950 border-white'
                          : 'bg-slate-800 text-slate-400 border-slate-600'
                      }`}
                    >
                      {player?.position || slot.role}
                    </div>
                    {player && (
                      <span className="text-[8px] font-bold text-white drop-shadow-md truncate max-w-[50px] leading-tight mt-0.5">
                        {playerName}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Structured Squad Positions (GK, DF, MF, FW) */}
            <div className="space-y-2 text-xs relative z-10">
              {/* GK */}
              {gks.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                  <span className="font-heading font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30">
                    GK
                  </span>
                  <div className="flex-1 flex flex-wrap gap-x-3 gap-y-1">
                    {gks.map(({ player }) => {
                      const dbPlayer = ALL_PLAYERS.find((dp) => dp.playerId === player.playerId) || player;
                      const name = getLocalizedPlayerName(dbPlayer, language);
                      const club = getLocalizedClubName(ALL_CLUBS.find((c) => c.id === player.clubId) || { name: player.clubName }, language);
                      return (
                        <span key={player.playerId} className="font-semibold text-slate-200">
                          {player.nationalityFlag} {name}{' '}
                          <span className="text-slate-400 font-normal">({club}, &apos;{String(player.joiningYear).slice(-2)})</span>{' '}
                          <span className="text-amber-400 font-mono font-bold">{player.rating}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DF */}
              {dfs.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                  <span className="font-heading font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] border border-blue-500/30">
                    DF
                  </span>
                  <div className="flex-1 flex flex-wrap gap-x-3 gap-y-1">
                    {dfs.map(({ player }) => {
                      const dbPlayer = ALL_PLAYERS.find((dp) => dp.playerId === player.playerId) || player;
                      const name = getLocalizedPlayerName(dbPlayer, language);
                      const club = getLocalizedClubName(ALL_CLUBS.find((c) => c.id === player.clubId) || { name: player.clubName }, language);
                      return (
                        <span key={player.playerId} className="font-semibold text-slate-200">
                          {player.nationalityFlag} {name}{' '}
                          <span className="text-slate-400 font-normal">({club})</span>{' '}
                          <span className="text-emerald-400 font-mono font-bold">{player.rating}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MF */}
              {mfs.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                  <span className="font-heading font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/30">
                    MF
                  </span>
                  <div className="flex-1 flex flex-wrap gap-x-3 gap-y-1">
                    {mfs.map(({ player }) => {
                      const dbPlayer = ALL_PLAYERS.find((dp) => dp.playerId === player.playerId) || player;
                      const name = getLocalizedPlayerName(dbPlayer, language);
                      const club = getLocalizedClubName(ALL_CLUBS.find((c) => c.id === player.clubId) || { name: player.clubName }, language);
                      return (
                        <span key={player.playerId} className="font-semibold text-slate-200">
                          {player.nationalityFlag} {name}{' '}
                          <span className="text-slate-400 font-normal">({club})</span>{' '}
                          <span className="text-emerald-400 font-mono font-bold">{player.rating}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FW */}
              {fws.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5">
                  <span className="font-heading font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] border border-rose-500/30">
                    FW
                  </span>
                  <div className="flex-1 flex flex-wrap gap-x-3 gap-y-1">
                    {fws.map(({ player }) => {
                      const dbPlayer = ALL_PLAYERS.find((dp) => dp.playerId === player.playerId) || player;
                      const name = getLocalizedPlayerName(dbPlayer, language);
                      const club = getLocalizedClubName(ALL_CLUBS.find((c) => c.id === player.clubId) || { name: player.clubName }, language);
                      return (
                        <span key={player.playerId} className="font-semibold text-slate-200">
                          {player.nationalityFlag} {name}{' '}
                          <span className="text-slate-400 font-normal">({club})</span>{' '}
                          <span className="text-amber-400 font-mono font-bold">{player.rating}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Card Footer Call to Action */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.ctaEveryonePlay}</span>
              </div>
              <span className="font-mono text-slate-500">#FOOTBALLDRAFT</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SNS SHARING BUTTONS GRID */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-heading font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SNS SHARE (SNSで共有)</span>
              </div>
              {/* Character Limit Badge */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="text-slate-400">𝕏 {t.xCharsCountLabel}:</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-black ${
                    shareData.isWithinXLimit
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {shareData.xCharCount} / {shareData.xCharLimit}
                </span>
                {shareData.isWithinXLimit ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
            </div>

            {/* Grid of major SNS Share Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. X (Twitter) */}
              <button
                id="btn-share-x"
                onClick={handleShareX}
                className="p-3 rounded-2xl bg-black hover:bg-slate-900 border border-slate-700 text-white font-heading font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-md hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
              >
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center text-sm font-black group-hover:rotate-6 transition-transform">
                  𝕏
                </div>
                <span>{t.shareX}</span>
                <span className="text-[9px] text-emerald-400 font-mono font-normal">
                  {shareData.xCharCount}/{shareData.xCharLimit}
                </span>
              </button>

              {/* 2. LINE */}
              <button
                id="btn-share-line"
                onClick={handleShareLine}
                className="p-3 rounded-2xl bg-[#06C755]/15 hover:bg-[#06C755]/25 border border-[#06C755]/40 text-[#06C755] font-heading font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-md hover:scale-[1.02] active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#06C755] text-white flex items-center justify-center font-bold text-xs group-hover:rotate-6 transition-transform">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <span className="text-white font-black">{t.shareLine}</span>
              </button>

              {/* 3. Instagram */}
              <button
                id="btn-share-instagram"
                onClick={handleShareInstagram}
                className="p-3 rounded-2xl bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-amber-600/20 hover:from-purple-600/30 hover:to-amber-600/30 border border-pink-500/40 text-pink-300 font-heading font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-md hover:scale-[1.02] active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold group-hover:rotate-6 transition-transform">
                  📸
                </div>
                <span className="text-white font-black">{t.shareInstagram}</span>
              </button>

              {/* 4. Facebook */}
              <button
                id="btn-share-facebook"
                onClick={handleShareFacebook}
                className="p-3 rounded-2xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-[#1877F2] font-heading font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all shadow-md hover:scale-[1.02] active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#1877F2] text-white flex items-center justify-center font-bold text-base group-hover:rotate-6 transition-transform">
                  f
                </div>
                <span className="text-white font-black">{t.shareFacebook}</span>
              </button>
            </div>

            {/* Other Popular Apps (Web Share API for TikTok, Discord, Threads, WhatsApp, etc.) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Native OS Share Sheet */}
              <button
                id="btn-share-native"
                onClick={handleNativeShare}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>{t.shareOther}</span>
              </button>

              {/* Copy Share Text */}
              <button
                id="btn-copy-share-text"
                onClick={() => handleCopyText(activeTab === 'x' ? shareData.xShareText : shareData.fullMessage)}
                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Copy className="w-4 h-4 text-amber-400" />
                <span>{t.copyShareText}</span>
              </button>

              {/* Download Card Image */}
              <button
                id="btn-download-card-image"
                onClick={handleDownloadCard}
                disabled={isGeneratingImage}
                className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.01] disabled:opacity-50"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{isGeneratingImage ? 'GENERATING...' : t.downloadCardImage}</span>
              </button>
            </div>
          </div>

          {/* Share Preview Text Display with Tabs (X Short / Full) */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('x')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'x'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  𝕏 {t.shareX} ({shareData.xCharCount}/{shareData.xCharLimit})
                </button>
                <button
                  onClick={() => setActiveTab('full')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'full'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  FULL TEXT
                </button>
              </div>

              <button
                onClick={() => handleCopyText(activeTab === 'x' ? shareData.xShareText : shareData.fullMessage)}
                className="text-[11px] text-emerald-400 hover:underline font-bold inline-flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{t.copyShareText}</span>
              </button>
            </div>

            <div className="text-[10px] text-slate-400 italic">
              {activeTab === 'x' ? t.xCharLimitNotice : ''}
            </div>

            <pre className="text-[11px] text-slate-300 font-sans whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/80 font-mono">
              {activeTab === 'x' ? shareData.xShareText : shareData.fullMessage}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
