import { Player } from '../types';

/**
 * =========================================================================
 * GOLDEN ERA TARGET PLAYERS DEFINITION (2000 - 2025)
 * 
 * In v1.2.0:
 * - Ballon d'Or animation is abolished.
 * - Only TWO special animations exist:
 *   1. 黒玉演出 (Black Ball): Rare / Legend players (1.8% probability)
 *   2. ゴールデン演出 (Golden): Designated Golden player for that year (1.8% probability)
 * =========================================================================
 */

export interface GoldenTargetPlayer {
  year: number;
  personId: string;
  nameJa: string;
  nameEn: string;
  clubId: string;
  clubName: string;
  rating: number;
  position: 'FW' | 'MF' | 'DF' | 'GK';
  subPosition: string;
}

export const GOLDEN_ERA_TARGETS: Record<number, GoldenTargetPlayer> = {
  2000: {
    year: 2000,
    personId: 'figo',
    nameJa: 'フィーゴ',
    nameEn: 'Luís Figo',
    clubId: 'real_madrid',
    clubName: 'Real Madrid',
    rating: 94,
    position: 'MF',
    subPosition: 'RWG',
  },
  2001: {
    year: 2001,
    personId: 'owen',
    nameJa: 'オーウェン',
    nameEn: 'Michael Owen',
    clubId: 'liverpool',
    clubName: 'Liverpool',
    rating: 94,
    position: 'FW',
    subPosition: 'CF',
  },
  2002: {
    year: 2002,
    personId: 'ronaldo_nazario',
    nameJa: '怪物ロナウド',
    nameEn: 'Ronaldo Nazário',
    clubId: 'real_madrid',
    clubName: 'Real Madrid',
    rating: 96,
    position: 'FW',
    subPosition: 'CF',
  },
  2003: {
    year: 2003,
    personId: 'p_nedved',
    nameJa: 'ネドヴェド',
    nameEn: 'Pavel Nedvěd',
    clubId: 'juventus',
    clubName: 'Juventus',
    rating: 94,
    position: 'MF',
    subPosition: 'LMF',
  },
  2004: {
    year: 2004,
    personId: 'a_shevchenko',
    nameJa: 'シェフチェンコ',
    nameEn: 'Andriy Shevchenko',
    clubId: 'ac_milan',
    clubName: 'AC Milan',
    rating: 94,
    position: 'FW',
    subPosition: 'CF',
  },
  2005: {
    year: 2005,
    personId: 'ronaldinho',
    nameJa: 'ロナウジーニョ',
    nameEn: 'Ronaldinho',
    clubId: 'barcelona',
    clubName: 'Barcelona',
    rating: 96,
    position: 'FW',
    subPosition: 'LWG',
  },
  2006: {
    year: 2006,
    personId: 'f_cannavaro',
    nameJa: 'カンナヴァーロ',
    nameEn: 'Fabio Cannavaro',
    clubId: 'real_madrid',
    clubName: 'Real Madrid',
    rating: 95,
    position: 'DF',
    subPosition: 'CB',
  },
  2007: {
    year: 2007,
    personId: 'kaka',
    nameJa: 'カカ',
    nameEn: 'Kaká',
    clubId: 'ac_milan',
    clubName: 'AC Milan',
    rating: 95,
    position: 'MF',
    subPosition: 'AMF',
  },
  2008: {
    year: 2008,
    personId: 'c_ronaldo',
    nameJa: 'ロナウド',
    nameEn: 'Cristiano Ronaldo',
    clubId: 'man_united',
    clubName: 'Manchester United',
    rating: 96,
    position: 'FW',
    subPosition: 'LWG',
  },
  2009: {
    year: 2009,
    personId: 'xavi',
    nameJa: 'シャビエルナンデス',
    nameEn: 'Xavi Hernández',
    clubId: 'barcelona',
    clubName: 'Barcelona',
    rating: 95,
    position: 'MF',
    subPosition: 'CMF',
  },
  2010: {
    year: 2010,
    personId: 'iniesta',
    nameJa: 'イニエスタ',
    nameEn: 'Andrés Iniesta',
    clubId: 'barcelona',
    clubName: 'Barcelona',
    rating: 95,
    position: 'MF',
    subPosition: 'CMF',
  },
  2011: {
    year: 2011,
    personId: 'w_rooney',
    nameJa: 'ルーニー',
    nameEn: 'Wayne Rooney',
    clubId: 'man_united',
    clubName: 'Manchester United',
    rating: 94,
    position: 'FW',
    subPosition: 'CF',
  },
  2012: {
    year: 2012,
    personId: 'l_messi',
    nameJa: 'メッシ',
    nameEn: 'Lionel Messi',
    clubId: 'barcelona',
    clubName: 'Barcelona',
    rating: 97,
    position: 'FW',
    subPosition: 'RWG',
  },
  2013: {
    year: 2013,
    personId: 'f_ribery',
    nameJa: 'リベリ',
    nameEn: 'Franck Ribéry',
    clubId: 'bayern_munich',
    clubName: 'Bayern Munich',
    rating: 94,
    position: 'MF',
    subPosition: 'LMF',
  },
  2014: {
    year: 2014,
    personId: 'm_neuer',
    nameJa: 'ノイアー',
    nameEn: 'Manuel Neuer',
    clubId: 'bayern_munich',
    clubName: 'Bayern Munich',
    rating: 94,
    position: 'GK',
    subPosition: 'GK',
  },
  2015: {
    year: 2015,
    personId: 'neymar_jr',
    nameJa: 'ネイマール',
    nameEn: 'Neymar',
    clubId: 'barcelona',
    clubName: 'Barcelona',
    rating: 94,
    position: 'FW',
    subPosition: 'LWG',
  },
  2016: {
    year: 2016,
    personId: 'a_griezmann',
    nameJa: 'グリーズマン',
    nameEn: 'Antoine Griezmann',
    clubId: 'atletico_madrid',
    clubName: 'Atlético Madrid',
    rating: 93,
    position: 'FW',
    subPosition: 'SS',
  },
  2017: {
    year: 2017,
    personId: 'g_buffon',
    nameJa: 'ブッフォン',
    nameEn: 'Gianluigi Buffon',
    clubId: 'juventus',
    clubName: 'Juventus',
    rating: 94,
    position: 'GK',
    subPosition: 'GK',
  },
  2018: {
    year: 2018,
    personId: 'l_modric',
    nameJa: 'モドリッチ',
    nameEn: 'Luka Modrić',
    clubId: 'real_madrid',
    clubName: 'Real Madrid',
    rating: 95,
    position: 'MF',
    subPosition: 'CMF',
  },
  2019: {
    year: 2019,
    personId: 'v_vandijk',
    nameJa: 'ファンダイク',
    nameEn: 'Virgil van Dijk',
    clubId: 'liverpool',
    clubName: 'Liverpool',
    rating: 94,
    position: 'DF',
    subPosition: 'CB',
  },
  2020: {
    year: 2020,
    personId: 'r_lewandowski',
    nameJa: 'レバンドフスキ',
    nameEn: 'Robert Lewandowski',
    clubId: 'bayern_munich',
    clubName: 'Bayern Munich',
    rating: 95,
    position: 'FW',
    subPosition: 'CF',
  },
  2021: {
    year: 2021,
    personId: 'n_kante',
    nameJa: 'カンテ',
    nameEn: "N'Golo Kanté",
    clubId: 'chelsea',
    clubName: 'Chelsea',
    rating: 93,
    position: 'MF',
    subPosition: 'DMF',
  },
  2022: {
    year: 2022,
    personId: 'k_benzema',
    nameJa: 'ベンゼマ',
    nameEn: 'Karim Benzema',
    clubId: 'real_madrid',
    clubName: 'Real Madrid',
    rating: 95,
    position: 'FW',
    subPosition: 'CF',
  },
  2023: {
    year: 2023,
    personId: 'e_haaland',
    nameJa: 'ハーランド',
    nameEn: 'Erling Haaland',
    clubId: 'man_city',
    clubName: 'Manchester City',
    rating: 94,
    position: 'FW',
    subPosition: 'CF',
  },
  2024: {
    year: 2024,
    personId: 'rodri_h',
    nameJa: 'ロドリ',
    nameEn: 'Rodri',
    clubId: 'man_city',
    clubName: 'Manchester City',
    rating: 95,
    position: 'MF',
    subPosition: 'DMF',
  },
  2025: {
    year: 2025,
    personId: 'o_dembele',
    nameJa: 'デンベレ',
    nameEn: 'Ousmane Dembélé',
    clubId: 'psg',
    clubName: 'Paris Saint-Germain',
    rating: 92,
    position: 'FW',
    subPosition: 'RWG',
  },
};

/**
 * Get Golden designated target for a specific year
 */
export function getGoldenTargetForYear(year: number): GoldenTargetPlayer | undefined {
  return GOLDEN_ERA_TARGETS[year];
}

/**
 * Checks if a player qualifies as the designated Golden player for a given year or across all golden targets
 */
export function isGoldenTargetPlayer(player: Player, year?: number): boolean {
  if (!player) return false;
  
  if (year !== undefined) {
    const target = GOLDEN_ERA_TARGETS[year];
    if (!target) return false;
    return (
      player.personId === target.personId ||
      player.playerName.toLowerCase().includes(target.nameEn.toLowerCase()) ||
      (player.nameJa && player.nameJa.includes(target.nameJa))
    );
  }

  // Check if matches ANY golden target
  return Object.values(GOLDEN_ERA_TARGETS).some(
    (target) =>
      player.personId === target.personId ||
      player.playerName.toLowerCase().includes(target.nameEn.toLowerCase()) ||
      (player.nameJa && player.nameJa.includes(target.nameJa))
  );
}

/**
 * Checks if a player qualifies as a truly rare Black Ball candidate (Rating >= 92 or LEGEND)
 */
export function isBlackBallCandidate(player: Player): boolean {
  if (!player) return false;
  return player.rating >= 92 || player.category === 'LEGEND' || Boolean(player.isLegendary);
}
