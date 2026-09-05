import React, { useState } from 'react';
import { Player, Language, PlayerCategory } from '../types';
import {
  TRANSLATIONS,
  getLocalizedPlayerName,
  getLocalizedNationality,
  getLocalizedPosition,
  getLocalizedCategory,
} from '../utils/translations';
import { soundManager } from '../utils/audio';
import { getBallonDorWinner, getLegendPeakEra } from '../data/legendaryEraDatabase';
import { getPlayerHeight } from '../data/playerHeights';
import { EFootballPositionGrid } from './PositionBadge';
import { Sparkles, Plus, AlertCircle, Award, Shield, Zap, Sprout, Trophy, Crown, MapPin, Ruler } from 'lucide-react';

interface CandidateCardProps {
  player: Player;
  language: Language;
  onDraft: (player: Player) => void;
  isDrafting: boolean;
  disabled?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  player,
  language,
  onDraft,
  isDrafting,
  disabled,
}) => {
  const t = TRANSLATIONS[language];
  const ballonDor = getBallonDorWinner(player);
  const legendPeak = getLegendPeakEra(player);
  const playerHeight = getPlayerHeight(player);
  const [showPositionMap, setShowPositionMap] = useState(false);

  // Helper to determine effective category
  const category: PlayerCategory =
    ballonDor || player.isLegendary
      ? 'LEGEND'
      : player.category ||
        (player.rating >= 85
          ? 'STAR'
          : player.rating >= 78
          ? 'MID'
          : 'NORMAL');

  const getPositionBadgeColor = (pos: string) => {
    switch (pos) {
      case 'GK':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'DF':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'MF':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'FW':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const renderCategoryBadge = () => {
    switch (category) {
      case 'LEGEND':
        return (
          <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-[10px] tracking-widest uppercase px-2.5 py-0.5 rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-1 border border-amber-200 animate-pulse">
            <Award className="w-3 h-3" />
            <span>⭐ {getLocalizedCategory('LEGEND', language)}</span>
          </div>
        );
      case 'STAR':
        return (
          <div className="absolute -top-3 right-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 text-white font-black text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md shadow-purple-500/20 flex items-center gap-1 border border-purple-300/40">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span>✨ {getLocalizedCategory('STAR', language)}</span>
          </div>
        );
      case 'YOUNG':
        return (
          <div className="absolute -top-3 right-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 border border-cyan-400/40">
            <Sprout className="w-3 h-3 text-lime-300" />
            <span>🌱 {getLocalizedCategory('YOUNG', language)}</span>
          </div>
        );
      case 'MID':
        return (
          <div className="absolute -top-3 right-4 bg-gradient-to-r from-emerald-700 to-teal-700 text-emerald-100 font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 border border-emerald-400/30">
            <Zap className="w-3 h-3 text-emerald-300" />
            <span>⚔️ {getLocalizedCategory('MID', language)}</span>
          </div>
        );
      case 'VETERAN':
        return (
          <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-700 to-orange-700 text-amber-100 font-bold text-[10px] tracking-wide uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 border border-amber-400/30">
            <Shield className="w-3 h-3 text-amber-300" />
            <span>🛡️ {getLocalizedCategory('VETERAN', language)}</span>
          </div>
        );
      case 'NORMAL':
      default:
        return (
          <div className="absolute -top-2.5 right-4 bg-slate-800 text-slate-300 font-medium text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-full border border-slate-700">
            <span>📋 {getLocalizedCategory('NORMAL', language)}</span>
          </div>
        );
    }
  };

  const getCardBorderClasses = () => {
    switch (category) {
      case 'LEGEND':
        return 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-amber-400/60 shadow-xl shadow-amber-900/20 hover:border-amber-400 hover:shadow-amber-500/30';
      case 'STAR':
        return 'bg-gradient-to-b from-purple-950/30 via-slate-900 to-slate-950 border-purple-500/50 shadow-lg shadow-purple-950/30 hover:border-purple-400 hover:shadow-purple-900/40';
      case 'YOUNG':
        return 'bg-gradient-to-b from-cyan-950/20 via-slate-900 to-slate-950 border-cyan-500/30 shadow-md hover:border-cyan-400 hover:shadow-cyan-950/40';
      case 'MID':
        return 'bg-gradient-to-b from-emerald-950/20 via-slate-900 to-slate-950 border-slate-800 hover:border-emerald-500/50 shadow-md hover:shadow-emerald-950/30';
      case 'VETERAN':
        return 'bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950 border-slate-800 hover:border-amber-500/50 shadow-md hover:shadow-amber-950/30';
      case 'NORMAL':
      default:
        return 'bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 hover:border-slate-700 shadow-md hover:shadow-slate-950/50';
    }
  };

  return (
    <div
      id={`candidate-card-${player.playerId}`}
      className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-300 ${getCardBorderClasses()}`}
    >
      {/* Category Badge */}
      {renderCategoryBadge()}

      {/* Top Header: Rating, Position, Nationality & Height */}
      <div className="flex items-start justify-between gap-2 mb-3 mt-1">
        <div className="flex items-center gap-2.5">
          {/* OVR Rating Shield */}
          <div
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-heading font-black border shadow-inner ${
              player.rating >= 90
                ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 border-amber-300'
                : player.rating >= 84
                ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-purple-400/50'
                : player.rating >= 78
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-400/50'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            <span className="text-xl leading-none">{player.rating}</span>
            <span className="text-[8px] uppercase tracking-tighter opacity-80">{t.overall}</span>
          </div>

          <div>
            {/* Position + SubPosition + Height Badge */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span
                className={`text-xs font-black px-2 py-0.5 rounded-md border ${getPositionBadgeColor(
                  player.position
                )}`}
              >
                {player.position}
                {player.subPosition && ` (${player.subPosition})`}
              </span>

              {/* Height Tag */}
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                <Ruler className="w-3 h-3 text-amber-400" />
                <span>{playerHeight}cm</span>
              </span>

              <span className="text-xs text-slate-400 font-medium">
                {getLocalizedPosition(player.position, language)}
              </span>
            </div>

            {/* Nationality Flag + Name */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <span className="text-base">{player.nationalityFlag}</span>
              <span>{getLocalizedNationality(player, language)}</span>
            </div>
          </div>
        </div>

        {/* Signing Year Badge */}
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase text-slate-400">{t.joiningYear}</div>
          <div className="font-mono font-black text-sm text-emerald-400">{player.joiningYear}</div>
        </div>
      </div>

      {/* Player Name */}
      <div className="mb-3">
        <h3 className="font-heading font-black text-lg sm:text-xl text-white tracking-wide group-hover:text-emerald-300 transition-colors">
          {getLocalizedPlayerName(player, language)}
        </h3>
        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
          <span className="text-emerald-400 font-semibold">{player.clubName}</span>
        </div>

        {/* Golden Special / Legend Peak Era Highlight */}
        {ballonDor ? (
          <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border border-yellow-400/50 flex items-center gap-2 text-[11px] text-yellow-300">
            <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="font-extrabold truncate">
              ⭐ GOLDEN LEGEND SPECIAL ({ballonDor.winningYears.join(', ')})
            </span>
          </div>
        ) : legendPeak ? (
          <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center gap-2 text-[11px] text-amber-300">
            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold truncate">
              ⭐ {legendPeak.seasonLabel}: {language === 'ja' ? legendPeak.eraTitleJa : language === 'es' ? legendPeak.eraTitleEs : legendPeak.eraTitleEn}
            </span>
          </div>
        ) : null}
      </div>

      {/* 6 Key Stats Grid (PAC, SHO, PAS, DRI, DEF, PHY) */}
      <div className="grid grid-cols-6 gap-1 bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 mb-4">
        {[
          { label: t.statPace, value: player.stats.pace },
          { label: t.statShooting, value: player.stats.shooting },
          { label: t.statPassing, value: player.stats.passing },
          { label: t.statDribbling, value: player.stats.dribbling },
          { label: t.statDefending, value: player.stats.defending },
          { label: t.statPhysical, value: player.stats.physical },
        ].map((stat, idx) => (
          <div key={idx} className="text-center">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
              {stat.label}
            </div>
            <div
              className={`text-xs sm:text-sm font-black font-mono mt-0.5 ${
                stat.value >= 85
                  ? 'text-amber-400'
                  : stat.value >= 78
                  ? 'text-emerald-400'
                  : stat.value >= 70
                  ? 'text-teal-300'
                  : 'text-slate-300'
              }`}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Position Suitability Grid Toggle */}
      <div className="mb-3">
        <button
          type="button"
          onClick={() => {
            soundManager.playButtonClick();
            setShowPositionMap((prev) => !prev);
          }}
          className="w-full py-1.5 px-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-[11px] font-bold text-slate-300 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>📋 ポジション適性マップ確認</span>
          </div>
          <span className="text-[10px] text-emerald-400">
            {showPositionMap ? '▲ 閉じる' : '▼ 表示する'}
          </span>
        </button>

        {showPositionMap && (
          <div className="mt-2 animate-fadeIn">
            <EFootballPositionGrid player={player} />
          </div>
        )}
      </div>

      {/* Draft Action Button */}
      <button
        id={`btn-draft-player-${player.playerId}`}
        disabled={isDrafting || disabled}
        onClick={() => {
          soundManager.playDraftAcquired();
          onDraft(player);
        }}
        className={`w-full py-2.5 px-4 rounded-xl font-heading font-black text-sm tracking-wider flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-md ${
          category === 'LEGEND'
            ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20'
            : category === 'STAR'
            ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/30'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30'
        }`}
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>{t.draft}</span>
      </button>
    </div>
  );
};

export const NoCandidatesCard: React.FC<{ language: Language; onNextDraft: () => void }> = ({
  language,
  onNextDraft,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div
      id="no-candidates-card"
      className="w-full max-w-lg mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center backdrop-blur-sm shadow-xl"
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="font-heading font-black text-base sm:text-lg text-slate-200 tracking-wide">
        {t.noPlayersFound}
      </h4>
      <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
        {t.noPlayersFoundDesc}
      </p>
      <div className="mt-2 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 py-1 px-3 rounded-full inline-block border border-emerald-500/20">
        {t.noPlayersSkipFree}
      </div>
      <div className="mt-5">
        <button
          id="btn-skip-next-draft-free"
          onClick={() => {
            soundManager.playButtonClick();
            onNextDraft();
          }}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-black text-xs tracking-wider transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mx-auto"
        >
          <span>{t.skipNextDraft}</span>
        </button>
      </div>
    </div>
  );
};
