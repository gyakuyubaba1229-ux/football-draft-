import React from 'react';
import { Player, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import {
  getVerifiedPositionsForPlayer,
  evaluatePlayerAtPosition,
  normalizeRoleToEFootball,
} from '../utils/positionEngine';
import { getPlayerBioInfo } from '../data/playerBioData';
import { X, Shield, Award, Activity, CheckCircle, AlertTriangle, Calendar, User } from 'lucide-react';

interface PlayerDetailModalProps {
  player: Player | null;
  currentRole?: string;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  currentRole,
  isOpen,
  onClose,
  language,
}) => {
  const t = TRANSLATIONS[language];

  if (!isOpen || !player) return null;

  const bio = getPlayerBioInfo(player);

  const getLocalizedText = (ja?: string, en?: string, es?: string) => {
    if (language === 'ja') return ja || en || '';
    if (language === 'es') return es || en || '';
    return en || ja || '';
  };

  const playerName =
    getLocalizedText(player.nameJa, player.nameEn, player.nameEs) || player.playerName;
  const clubName =
    getLocalizedText(player.clubNameJa, player.clubNameEn, player.clubNameEs) || player.clubName;
  const nationalityName =
    getLocalizedText(player.nationalityJa, player.nationalityEn, player.nationalityEs) ||
    player.nationality;

  const verifiedPositions = getVerifiedPositionsForPlayer(player);

  const currentEPos = currentRole ? normalizeRoleToEFootball(currentRole) : null;
  const positionEval = currentEPos ? evaluatePlayerAtPosition(player, currentEPos) : null;

  return (
    <div
      id="player-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none"
    >
      <div
        id="player-detail-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fade-in"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{player.nationalityFlag}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {bio.rarity}
                </span>
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {player.category || (player.isLegendary ? 'LEGEND' : 'STANDARD')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  #{bio.jerseyNumber}
                </span>
              </div>
              <h3 className="font-heading font-black text-lg sm:text-xl text-white leading-tight mt-1">
                {playerName}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Main Quick Info Card */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <span className="text-white font-bold">{clubName}</span>
                <span>({player.joiningYear}年入団)</span>
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <span>{nationalityName}</span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-white font-bold">背番号 {bio.jerseyNumber}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                主ポジション: <span className="text-emerald-400 font-black">{player.position}</span>
                {player.subPosition && (
                  <span className="text-slate-300 ml-1">({player.subPosition})</span>
                )}
              </div>
            </div>

            {/* Base OVR Badge */}
            <div className="text-right">
              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                BASE OVR
              </div>
              <div className="text-3xl sm:text-4xl font-heading font-black text-amber-400 leading-none mt-0.5">
                {player.rating}
              </div>
            </div>
          </div>

          {/* Detailed Bio Specifications Grid */}
          <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>選手プロフィール・生体データ</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[9px] font-mono text-slate-400 uppercase">身長</div>
                <div className="text-sm font-mono font-bold text-white mt-0.5">
                  {bio.height} cm
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[9px] font-mono text-slate-400 uppercase">体重</div>
                <div className="text-sm font-mono font-bold text-white mt-0.5">
                  {bio.weight} kg
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[9px] font-mono text-slate-400 uppercase">生年月日</div>
                <div className="text-xs font-mono font-bold text-white mt-0.5">
                  {bio.birthDate}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[9px] font-mono text-slate-400 uppercase">年齢 (現在)</div>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                  {bio.age} 歳
                </div>
              </div>
            </div>

            {/* Rarity row */}
            <div className="pt-1">
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between px-3">
                <span className="text-[10px] text-slate-400 font-mono">レアリティ</span>
                <span className="text-xs font-mono font-black text-amber-300">{bio.rarity}</span>
              </div>
            </div>
          </div>

          {/* Current Pitch Placement Status */}
          {currentRole && positionEval && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                positionEval.isSuitable
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {positionEval.isSuitable ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold font-mono">
                    配置位置: {currentRole} ({currentEPos})
                  </div>
                  <div className="text-[11px] opacity-90">
                    {positionEval.isSuitable
                      ? '✅ 適正ポジション配置（能力100%発揮・低下なし）'
                      : `⚠️ 不慣れなポジション配置 (OVRペナルティ ${positionEval.ratingDelta})`}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[9px] font-mono opacity-80 uppercase">EFFECTIVE OVR</div>
                <div className="text-2xl font-mono font-black">
                  {positionEval.effectiveRating}
                </div>
              </div>
            </div>
          )}

          {/* Verified Suitable Positions Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>実際にプレーしたことがある適正ポジション</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {verifiedPositions.map((pos) => {
                const isCurrent = currentEPos === pos;
                return (
                  <span
                    key={pos}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800/80 text-emerald-400 border-slate-700'
                    }`}
                  >
                    {pos} {isCurrent && '★現在'}
                  </span>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ※実在選手の公式戦出場実績に基づき、プレイ可能な適正ポジションが判定されます。適正ポジション配置時は能力値が100%発揮されます。
            </p>
          </div>

          {/* Attributes / Stats */}
          {player.stats && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>選手能力パラメータ</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'PACE (スピード)', val: player.stats.pace },
                  { label: 'SHOOT (シュート)', val: player.stats.shooting },
                  { label: 'PASS (パス)', val: player.stats.passing },
                  { label: 'DRIBBLE (ドリブル)', val: player.stats.dribbling },
                  { label: 'DEFENSE (守備)', val: player.stats.defending },
                  { label: 'PHYSICAL (フィジカル)', val: player.stats.physical },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-[10px] font-mono text-slate-400">{stat.label}</span>
                    <span
                      className={`font-mono font-black text-xs ${
                        stat.val >= 90
                          ? 'text-amber-400'
                          : stat.val >= 80
                          ? 'text-emerald-400'
                          : stat.val >= 70
                          ? 'text-sky-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {stat.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 text-right">
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold tracking-wider transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
