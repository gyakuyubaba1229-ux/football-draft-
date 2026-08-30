import React from 'react';
import { GameMode, Language } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { soundManager } from '../utils/audio';
import { Volume2, VolumeX, Settings, HelpCircle, History, Shield, Users, Home, Zap } from 'lucide-react';

interface HeaderProps {
  mode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'home' | 'draft' | 'team' | 'history';
  onTabChange: (tab: 'home' | 'draft' | 'team' | 'history') => void;
  teamCount: number;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onSelectMode,
  language,
  onLanguageChange,
  activeTab,
  onTabChange,
  teamCount,
  onOpenSettings,
  onOpenHowToPlay,
  soundEnabled,
  onToggleSound,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-emerald-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Left: Brand & Home / Mode button */}
        <div className="flex items-center gap-2.5">
          <div
            id="brand-logo"
            onClick={() => {
              soundManager.playButtonClick();
              onTabChange('home');
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-0.5 shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-lg">⚽</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-amber-300">
                  FOOTBALL DRAFT
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {mode === 'europe' ? 'EUROPE' : 'J1'}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 font-medium -mt-0.5">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Mode Switch Pills */}
          <div id="mode-selector-pills" className="hidden lg:flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            <button
              id="mode-btn-europe"
              onClick={() => {
                soundManager.playButtonClick();
                onSelectMode('europe');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                mode === 'europe'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇪🇺 EUROPE
            </button>
            <button
              id="mode-btn-j1"
              onClick={() => {
                soundManager.playButtonClick();
                onSelectMode('j1');
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                mode === 'j1'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇯🇵 J1 LEAGUE
            </button>
          </div>
        </div>

        {/* Center / Nav Tabs */}
        <div id="nav-tabs-group" className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
          {/* HOME Tab */}
          <button
            id="tab-btn-home"
            onClick={() => {
              soundManager.playButtonClick();
              onTabChange('home');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'home'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{t.home}</span>
          </button>

          {/* DRAFT Tab */}
          <button
            id="tab-btn-draft"
            onClick={() => {
              soundManager.playButtonClick();
              onTabChange('draft');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'draft'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🎰</span>
            <span className="hidden xs:inline">DRAFT</span>
          </button>

          {/* MY TEAM Tab */}
          <button
            id="tab-btn-team"
            onClick={() => {
              soundManager.playButtonClick();
              onTabChange('team');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'team'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.myTeam}</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
                teamCount === 11
                  ? 'bg-amber-400 text-slate-950 animate-pulse'
                  : 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {teamCount}/11
            </span>
          </button>

          {/* HISTORY Tab */}
          <button
            id="tab-btn-history"
            onClick={() => {
              soundManager.playButtonClick();
              onTabChange('history');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.history}</span>
          </button>
        </div>

        {/* Right: Sound, Language, Help, Settings */}
        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            id="sound-toggle-btn"
            onClick={() => {
              soundManager.playButtonClick();
              onToggleSound();
            }}
            title="Toggle Sound"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Language Selector */}
          <div className="relative">
            <select
              id="language-select"
              value={language}
              onChange={(e) => {
                soundManager.playButtonClick();
                onLanguageChange(e.target.value as Language);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs py-1.5 px-2 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ja">🇯🇵 日本語</option>
              <option value="en">🇬🇧 English</option>
              <option value="es">🇪🇸 Español</option>
            </select>
          </div>

          {/* How to Play */}
          <button
            id="help-btn"
            onClick={() => {
              soundManager.playButtonClick();
              onOpenHowToPlay();
            }}
            title={t.howToPlay}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            id="settings-btn"
            onClick={() => {
              soundManager.playButtonClick();
              onOpenSettings();
            }}
            title={t.settings}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

