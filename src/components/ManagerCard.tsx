import React from 'react';
import { Manager, Language, TacticType } from '../types';
import {
  getLocalizedManagerName,
  getLocalizedManagerNationality,
  getLocalizedManagerAchievements,
  getLocalizedTacticName,
} from '../data/managersDatabase';
import { soundManager } from '../utils/audio';
import { Award, Briefcase, Check, Shield, Sparkles, Trophy, X } from 'lucide-react';

export const ManagerPortraitSvg: React.FC<{ manager: Manager; size?: 'sm' | 'md' | 'lg' }> = ({
  manager,
  size = 'md',
}) => {
  const { avatarStyle } = manager;
  const dimClass =
    size === 'sm' ? 'w-14 h-16' : size === 'lg' ? 'w-24 h-28' : 'w-20 h-24';

  return (
    <div
      className={`relative ${dimClass} rounded-2xl overflow-hidden border-2 border-amber-400/60 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 shadow-inner shrink-0 flex items-end justify-center`}
    >
      {/* Subtle tactical grid lines behind portrait */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 35%, rgba(251,191,36,0.45), transparent 70%)',
        }}
      />
      <svg
        viewBox="0 0 100 112"
        className="w-full h-full relative z-10"
        aria-label={manager.nameEn}
      >
        {/* Shoulders & Suit */}
        <path
          d="M12 112 C14 82, 32 76, 50 76 C68 76, 86 82, 88 112 Z"
          fill={avatarStyle.suitColor}
        />
        {/* White Shirt Collar */}
        <polygon points="39,76 50,94 61,76" fill="#f8fafc" />
        {/* Tie */}
        <polygon points="47,81 53,81 52,107 50,111 48,107" fill={avatarStyle.tieColor} />
        {/* Suit Lapels */}
        <polygon points="34,77 45,98 39,106 28,85" fill="#0f172a" opacity="0.45" />
        <polygon points="66,77 55,98 61,106 72,85" fill="#0f172a" opacity="0.45" />

        {/* Neck */}
        <rect x="42" y="64" width="16" height="16" rx="6" fill={avatarStyle.skinColor} />

        {/* Ears */}
        <ellipse cx="29" cy="48" rx="4" ry="6" fill={avatarStyle.skinColor} />
        <ellipse cx="71" cy="48" rx="4" ry="6" fill={avatarStyle.skinColor} />

        {/* Face */}
        <ellipse cx="50" cy="46" rx="20" ry="24" fill={avatarStyle.skinColor} />

        {/* Hair / Cap */}
        {avatarStyle.hasCap ? (
          <>
            <path d="M29 36 C30 16, 70 16, 71 36 Z" fill="#1e293b" />
            <path d="M25 35 C38 29, 64 29, 79 37 L74 40 C60 35, 38 35, 25 38 Z" fill="#0f172a" />
          </>
        ) : avatarStyle.hairStyle === 'bald' ? (
          <path
            d="M31 38 C32 23, 68 23, 69 38 C65 30, 35 30, 31 38 Z"
            fill={avatarStyle.skinColor}
          />
        ) : avatarStyle.hairStyle === 'wavy' ? (
          <path
            d="M28 42 C26 20, 44 16, 54 18 C66 19, 73 27, 71 42 C67 31, 57 28, 48 30 C39 32, 33 35, 28 42 Z"
            fill={avatarStyle.hairColor}
          />
        ) : avatarStyle.hairStyle === 'parted' || avatarStyle.hairStyle === 'silver' ? (
          <path
            d="M29 40 C28 19, 72 19, 71 40 C66 28, 52 26, 42 29 C35 31, 31 35, 29 40 Z"
            fill={avatarStyle.hairColor}
          />
        ) : (
          <path
            d="M30 40 C30 20, 70 20, 70 40 C64 29, 36 29, 30 40 Z"
            fill={avatarStyle.hairColor}
          />
        )}

        {/* Eyebrows & Eyes */}
        <line x1="37" y1="41" x2="45" y2="41" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="55" y1="41" x2="63" y2="41" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="41" cy="46" r="2.2" fill="#0f172a" />
        <circle cx="59" cy="46" r="2.2" fill="#0f172a" />

        {/* Glasses */}
        {avatarStyle.hasGlasses && (
          <g stroke="#cbd5e1" strokeWidth="1.6" fill="rgba(255,255,255,0.08)">
            <rect x="35" y="42" width="12" height="8" rx="2.5" />
            <rect x="53" y="42" width="12" height="8" rx="2.5" />
            <line x1="47" y1="46" x2="53" y2="46" />
          </g>
        )}

        {/* Nose */}
        <path d="M50 45 L48 54 L52 54" fill="none" stroke="#b47d56" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />

        {/* Beard */}
        {avatarStyle.hasBeard && (
          <path
            d="M32 52 C33 66, 42 71, 50 71 C58 71, 67 66, 68 52 C63 59, 57 61, 50 61 C43 61, 37 59, 32 52 Z"
            fill={avatarStyle.hairColor}
            opacity="0.82"
          />
        )}

        {/* Mouth */}
        <path d="M44 59 Q50 62 56 59" fill="none" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
      </svg>

      {/* Flag Pill */}
      <div className="absolute bottom-1 right-1 z-20 px-1.5 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-xs leading-none shadow">
        {manager.nationalityFlag}
      </div>
    </div>
  );
};

const TACTIC_ORDER: TacticType[] = [
  'possession',
  'shortCounter',
  'longCounter',
  'sideAttack',
  'longBall',
];

interface ManagerCardProps {
  manager: Manager;
  language: Language;
  onSelect?: (manager: Manager) => void;
  disabled?: boolean;
  actionLabel?: string;
  compact?: boolean;
}

export const ManagerCard: React.FC<ManagerCardProps> = ({
  manager,
  language,
  onSelect,
  disabled = false,
  actionLabel,
  compact = false,
}) => {
  const name = getLocalizedManagerName(manager, language);
  const nationality = getLocalizedManagerNationality(manager, language);
  const achievements = getLocalizedManagerAchievements(manager, language);
  const eraLabel =
    language === 'ja'
      ? manager.eraLabelJa
      : language === 'es'
      ? manager.eraLabelEs
      : manager.eraLabelEn;

  const isLegend = manager.eraOrStatus === 'LEGEND';

  return (
    <div
      id={`manager-card-${manager.id}`}
      className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      } ${
        isLegend
          ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 border-amber-400/70 shadow-xl shadow-amber-950/40'
          : 'bg-gradient-to-br from-sky-950/70 via-slate-900 to-slate-950 border-sky-400/60 shadow-xl shadow-sky-950/40'
      }`}
    >
      {/* Distinct Tactical Clipboard Top Accent Strip */}
      <div
        className={`absolute top-0 inset-x-0 h-1.5 ${
          isLegend
            ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500'
            : 'bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400'
        }`}
      />

      {/* Manager Badge Row */}
      <div className="flex items-center justify-between gap-2 pt-1 mb-3">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider border ${
            isLegend
              ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
              : 'bg-sky-500/20 text-sky-300 border-sky-400/40'
          }`}
        >
          <Briefcase className="w-3 h-3" />
          <span>MANAGER • {eraLabel}</span>
        </span>

        {/* Max Tactical Affinity Badge */}
        <div className="px-2.5 py-0.5 rounded-lg bg-slate-950 border border-amber-400/50 text-right flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-slate-400 uppercase">
            {language === 'ja' ? '最高適性' : 'MAX'}
          </span>
          <span className="font-heading font-black text-base text-amber-300 leading-none">
            {manager.maxAffinity}
          </span>
        </div>
      </div>

      {/* Header: Portrait + Identity */}
      <div className="flex items-start gap-3.5 mb-3">
        <ManagerPortraitSvg manager={manager} size={compact ? 'sm' : 'md'} />

        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="font-heading font-black text-base sm:text-lg text-white leading-snug">
            {name}
          </h4>
          {name !== manager.nameEn && (
            <div className="text-[11px] text-slate-400 font-medium truncate">
              {manager.nameEn}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
            <span>{manager.nationalityFlag}</span>
            <span>{nationality}</span>
          </div>

          {/* Specialty Tactics Pills */}
          <div className="flex flex-wrap gap-1 pt-1">
            {manager.specialtyTactics.map((tac) => (
              <span
                key={tac}
                className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold"
              >
                ★ {getLocalizedTacticName(tac, language)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements & History */}
      <div className="mb-3 p-2.5 rounded-xl bg-slate-950/75 border border-slate-800/90 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
          <Trophy className="w-3 h-3" />
          <span>{language === 'ja' ? '監督実績・キャリア' : 'ACHIEVEMENTS & CAREER'}</span>
        </div>
        <ul className="space-y-1">
          {achievements.slice(0, compact ? 2 : 3).map((ach, i) => (
            <li key={i} className="text-[11px] text-slate-300 leading-snug flex items-start gap-1.5">
              <span className="text-amber-400 shrink-0">•</span>
              <span>{ach}</span>
            </li>
          ))}
        </ul>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/70 truncate">
          <span className="text-slate-500 font-semibold">
            {language === 'ja' ? '歴任: ' : 'Clubs: '}
          </span>
          {manager.clubsCoached.join(' → ')}
        </div>
      </div>

      {/* 5 Tactical Affinities Grid */}
      <div className="p-2.5 rounded-xl bg-slate-950/85 border border-slate-800/90 space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-sky-400" />
            <span>{language === 'ja' ? '戦術適性 (0〜99)' : 'TACTICAL AFFINITIES'}</span>
          </span>
          <span className="text-amber-300">MAX {manager.maxAffinity}/99</span>
        </div>

        {TACTIC_ORDER.map((tacticKey) => {
          const val = manager.tactics[tacticKey];
          const isSpecialty = manager.specialtyTactics.includes(tacticKey);
          const isTop = val === manager.maxAffinity;
          return (
            <div key={tacticKey} className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span
                  className={`font-bold ${
                    isTop
                      ? 'text-amber-300'
                      : isSpecialty
                      ? 'text-emerald-300'
                      : 'text-slate-300'
                  }`}
                >
                  {isTop ? '👑 ' : isSpecialty ? '★ ' : ''}
                  {getLocalizedTacticName(tacticKey, language)}
                </span>
                <span
                  className={`font-mono font-black ${
                    val >= 90
                      ? 'text-amber-300'
                      : val >= 80
                      ? 'text-emerald-300'
                      : val >= 65
                      ? 'text-sky-300'
                      : 'text-slate-400'
                  }`}
                >
                  {val}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    val >= 90
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                      : val >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : val >= 65
                      ? 'bg-gradient-to-r from-sky-500 to-cyan-400'
                      : 'bg-slate-600'
                  }`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      {onSelect && (
        <button
          id={`btn-draft-manager-${manager.id}`}
          disabled={disabled}
          onClick={() => {
            soundManager.playDraftAcquired();
            onSelect(manager);
          }}
          className={`w-full py-2.5 px-4 rounded-xl font-heading font-black text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg cursor-pointer ${
            disabled
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isLegend
              ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-slate-950'
              : 'bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white'
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{actionLabel || (language === 'ja' ? 'この監督に決定する' : 'HIRE MANAGER')}</span>
        </button>
      )}
    </div>
  );
};

export const ManagerProfileModal: React.FC<{
  manager: Manager | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}> = ({ manager, isOpen, onClose, language }) => {
  if (!isOpen || !manager) return null;

  return (
    <div
      id="manager-profile-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fade-in">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2 text-amber-300 font-heading font-black text-base">
            <Award className="w-5 h-5" />
            <span>{language === 'ja' ? '監督プロフィール・戦術適性' : 'MANAGER PROFILE'}</span>
          </div>
          <button
            onClick={() => {
              soundManager.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          <ManagerCard manager={manager} language={language} />
        </div>
      </div>
    </div>
  );
};
