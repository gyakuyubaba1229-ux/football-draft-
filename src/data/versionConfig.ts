export interface UpdateNote {
  version: string;
  releaseDate: string;
  titleJa: string;
  titleEn: string;
  titleEs: string;
  notesJa: string[];
  notesEn: string[];
  notesEs: string[];
  isLatest?: boolean;
}

export interface VersionConfig {
  currentVersion: string;
  updateNotes: UpdateNote[];
}

/**
 * =========================================================================
 * VERSION & UPDATE NOTES CONFIGURATION
 * 
 * To update the version and update notes in future updates:
 * 1. Change `CURRENT_VERSION` below (e.g. 'VERSION 1.0.2').
 * 2. Add the new entry at the top of the `UPDATE_NOTES_HISTORY` array.
 * =========================================================================
 */

export const CURRENT_VERSION = 'VERSION 1.0.1';

export const UPDATE_NOTES_HISTORY: UpdateNote[] = [
  {
    version: 'VERSION 1.0.1',
    releaseDate: '2026.08',
    isLatest: true,
    titleJa: 'レジェンド選手＆名手・カルトヒーロー大幅拡充アップデート',
    titleEn: 'Expanded Legends, Cult Heroes & Era-Specific Roster Update',
    titleEs: 'Actualización Masiva de Leyendas y Héroes de Culto',
    notesJa: [
      'カスタム配置やフォーメーション変更（4-2-3-1、4-4-2等）時に選手がピッチから消えてしまう不具合を修正',
      'フォーメーション変更時も獲得した全11選手のポジション適性を維持したまま自動再配置するよう最適化',
      'マイナーなレジェンド選手や往年の名手・カルトヒーローを大幅に追加',
      '超有名スターだけでなく、各クラブの歴史を彩った実力派レジェンド選手も幅広く候補に登場',
      '所属年代と所属クラブを厳密に考慮し、実際にそのクラブに在籍していた年代と紐付け',
      '同じ選手でも所属クラブ・年代ごとに当時の能力値・総合値（OVR）を設定',
      'Jリーグ・ヨーロッパクラブの両方で多彩なレジェンド選手を追加',
      'レジェンドだけに偏らず、若手・中堅・ベテラン・現役選手もバランス良く候補に登場',
    ],
    notesEn: [
      'Fixed an issue where players disappeared from the pitch when changing formations (e.g., 4-2-3-1) or switching from Custom Placement',
      'Optimized automatic squad repositioning so all 11 drafted players smoothly transition across all formations',
      'Massive expansion of minor legends, cult heroes, and classic iconic players',
      'Broadened candidate pool to include both world superstars and beloved club icons',
      'Strict historical accuracy matching real club tenures and joining years',
      'Era-specific ratings and stats reflecting players’ peak abilities during each tenure',
      'Rich legend rosters added across both European giants and J1 League clubs',
      'Balanced candidate distribution maintaining active stars, veterans, and young talents',
    ],
    notesEs: [
      'Corrección del error por el cual los jugadores desaparecían al cambiar de formación (ej. 4-2-3-1) o desde la colocación personalizada',
      'Optimización de recolocación automática para mantener a los 11 jugadores en cancha en todas las formaciones',
      'Gran expansión de leyendas clásicas, héroes de culto y figuras históricas',
      'Mayor variedad de candidatos incluyendo estrellas mundiales e ídolos de club',
      'Precisión histórica rigurosa según los años reales de permanencia en cada club',
      'Estadísticas y valoraciones adaptadas al rendimiento de cada época específica',
      'Nuevas leyendas añadidas tanto para clubes europeos como de la J1 League',
      'Equilibrio óptimo entre leyendas, veteranos, promesas y jugadores actuales',
    ],
  },
  {
    version: 'VERSION 1.0.0',
    releaseDate: '2026.08',
    isLatest: false,
    titleJa: '公式初回リリース',
    titleEn: 'Official Initial Release',
    titleEs: 'Lanzamiento Inicial Oficial',
    notesJa: [
      'Year × Club ルーレットドラフトシステムの実装',
      'ヨーロッパ主要クラブ＆J1リーグクラブ対応',
      '超レア黒玉（Black Ball）確率演出機能',
      '11人編成タクティカルピッチビュー＆シェア機能',
    ],
    notesEn: [
      'Year × Club roulette draft system release',
      'Support for top European clubs and J1 League',
      'Ultra-rare Black Ball special animation sequence',
      '11-player tactical pitch formation and social sharing',
    ],
    notesEs: [
      'Lanzamiento del sistema de ruleta Año × Club',
      'Soporte para grandes clubes europeos y J1 League',
      'Efecto especial de Balón Negro de alta rareza',
      'Formación táctica de 11 jugadores y compartir en redes',
    ],
  },
];
