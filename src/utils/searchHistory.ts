import { DraftHistoryEntry, Language } from '../types';
import { findAnyPlayerById } from '../data/playerDatabase';
import { ALL_CLUBS } from '../data/clubs';
import { NATIONAL_TEAMS } from '../data/nationalEraDatabase';

// Club alias keywords across English, Japanese, and Spanish
const CLUB_ALIASES: Record<string, string[]> = {
  barcelona: ['barca', 'バルサ', 'バルセロナ', 'barça', 'blaugrana'],
  real_madrid: ['real', 'レアル', 'マドリー', 'マドリード', 'madrid', 'merengue', 'los blancos'],
  atletico_madrid: ['atletico', 'アトレティコ', 'アトレチコ', 'colchoneros', 'atm'],
  villarreal: ['villarreal', 'ビジャレアル', 'submarino'],
  real_sociedad: ['sociedad', 'ソシエダ', 'レアルソシエダ', 'la real', 'txuri-urdin'],
  sevilla: ['sevilla', 'セビージャ', 'セビリア'],
  valencia: ['valencia', 'バレンシア', 'los che'],
  man_city: ['man city', 'city', 'マンc', 'マンチェスターc', 'シティ', 'citizens'],
  man_united: ['man united', 'man u', 'マンu', 'マンチェスターu', 'ユナイテッド', 'red devils'],
  liverpool: ['liverpool', 'リヴァプール', 'リバプール', 'reds'],
  arsenal: ['arsenal', 'アーセナル', 'gunners', 'ガナーズ'],
  chelsea: ['chelsea', 'チェルシー', 'blues'],
  tottenham: ['tottenham', 'spurs', 'トッテナム', 'スパーズ'],
  bayern: ['bayern', 'バイエルン', 'ミュンヘン', 'bavaria', 'bavarians'],
  dortmund: ['dortmund', 'ドルトムント', 'bvb', 'borussia'],
  bayer_leverkusen: ['leverkusen', 'レヴァークーゼン', 'レバークーゼン', 'werkself'],
  inter: ['inter', 'インテル', 'nerazzurri'],
  milan: ['milan', 'ac milan', 'ミラン', 'acミラン', 'rossoneri'],
  juventus: ['juve', 'juventus', 'ユヴェントス', 'ユベントス', 'bianconeri', 'vecchia signora'],
  roma: ['roma', 'ローマ', 'giallorossi'],
  napoli: ['napoli', 'ナポリ', 'partenopei'],
  psg: ['psg', 'paris', 'パリ', 'パリサンジェルマン'],
  monaco: ['monaco', 'モナコ'],
  ajax: ['ajax', 'アヤックス', 'godenzonen'],
  benfica: ['benfica', 'ベンフィカ', 'as aguias'],
  porto: ['porto', 'ポルト', 'dragoes'],
  sporting_cp: ['sporting', 'スポルティング', 'leões'],
  celtic: ['celtic', 'セルティック', 'bhoys'],
  // J1 Clubs
  vissel_kobe: ['vissel', 'kobe', 'ヴィッセル', '神戸'],
  sanfrecce_hiroshima: ['sanfrecce', 'hiroshima', 'サンフレッチェ', '広島'],
  fc_machida_zelvia: ['machida', 'zelvia', '町田', 'ゼルビア'],
  gamba_osaka: ['gamba', 'osaka', 'ガンバ', 'g大阪', 'ガンバ大阪'],
  kashima_antlers: ['antlers', 'kashima', 'アントラーズ', '鹿島'],
  tokyo_verdy: ['verdy', 'tokyo verdy', 'ヴェルディ', '東京v'],
  cerezo_osaka: ['cerezo', 'セレッソ', 'c大阪', 'セレッソ大阪'],
  fc_tokyo: ['fc tokyo', 'fc東京', '東京'],
  kawasaki_frontale: ['frontale', 'kawasaki', 'フロンターレ', '川崎'],
  nagoya_grampus: ['grampus', 'nagoya', 'グランパス', '名古屋'],
  urawa_reds: ['urawa', 'reds', '浦和', '浦和レッズ', 'レッズ'],
  yokohama_f_marinos: ['marinos', 'yokohama', 'マリノス', '横浜', '横浜fマリノス', 'fマリノス'],
  kyoto_sanga: ['sanga', 'kyoto', 'サンガ', '京都'],
  shonan_bellmare: ['bellmare', 'shonan', 'ベルマーレ', '湘南'],
  kashiwa_reysol: ['reysol', 'kashiwa', 'レイソル', '柏'],
  albirex_niigata: ['albirex', 'niigata', 'アルビレックス', '新潟'],
  jubilo_iwata: ['jubilo', 'iwata', 'ジュビロ', '磐田'],
  sagan_tosu: ['tosu', 'sagan', 'サガン', '鳥栖'],
  avispa_fukuoka: ['avispa', 'fukuoka', 'アビスパ', '福岡'],
  consadole_sapporo: ['consadole', 'sapporo', 'コンサドーレ', '札幌'],
};

// Normalize text for flexible multi-language comparison
function normalizeSearchText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFKC') // Normalize full-width/half-width katakana and latin chars
    .replace(/[\s\-_・·\.]/g, '') // remove spaces and separators
    .trim();
}

/**
 * Multi-language search function matching player/manager name, club/nation name, nationality,
 * position, joining year, era decade, team number, rating across Japanese, English, and Spanish.
 */
export function searchDraftHistory(
  history: DraftHistoryEntry[],
  rawQuery: string,
  _currentLang: Language
): DraftHistoryEntry[] {
  if (!rawQuery || !rawQuery.trim()) {
    return history;
  }

  const query = rawQuery.trim();
  const normalizedQuery = normalizeSearchText(query);

  return history.filter((entry) => {
    // Manager entries
    if (entry.entryType === 'manager' && entry.manager) {
      const m = entry.manager;
      const mgrTargets = [
        m.name,
        m.nameJa,
        m.nameEn,
        m.nameEs,
        m.nationality,
        m.nationalityJa,
        m.nationalityEn,
        m.nationalityEs,
        ...m.clubsCoached,
        String(m.maxAffinity),
        entry.teamName || '',
        '監督',
        'manager',
        'director tecnico',
      ];
      for (const target of mgrTargets) {
        if (
          target &&
          (target.toLowerCase().includes(query.toLowerCase()) ||
            normalizeSearchText(target).includes(normalizedQuery))
        ) {
          return true;
        }
      }
      return false;
    }

    // 1. Enrich with database player/club/national-team definitions
    const dbPlayer = findAnyPlayerById(entry.playerId, entry.playerName);
    const dbClub = ALL_CLUBS.find((c) => c.id === entry.clubId || c.name === entry.clubName);
    const dbNation = NATIONAL_TEAMS.find((n) => n.id === entry.nationalTeamId || n.id === entry.clubId);

    const nameJa = entry.nameJa || dbPlayer?.nameJa || '';
    const nameEn = entry.nameEn || dbPlayer?.nameEn || entry.playerName || '';
    const nameEs = entry.nameEs || dbPlayer?.nameEs || entry.playerName || '';
    const playerName = entry.playerName || '';

    const clubNameJa = entry.clubNameJa || dbClub?.nameJa || dbNation?.nameJa || '';
    const clubNameEn = entry.clubNameEn || dbClub?.nameEn || dbNation?.nameEn || entry.clubName || '';
    const clubNameEs = entry.clubNameEs || dbClub?.nameEs || dbNation?.nameEs || entry.clubName || '';
    const clubName = entry.clubName || '';
    const clubShort = dbClub?.shortName || '';
    const clubId = entry.clubId || dbClub?.id || '';

    const natJa = entry.nationalityJa || dbPlayer?.nationalityJa || '';
    const natEn = entry.nationalityEn || dbPlayer?.nationalityEn || entry.nationality || '';
    const natEs = entry.nationalityEs || dbPlayer?.nationalityEs || entry.nationality || '';
    const nat = entry.nationality || dbPlayer?.nationality || '';

    const yearStr = String(entry.joiningYear);
    const eraStr = entry.eraDecade || dbPlayer?.eraDecade || '';
    const pos = entry.position;
    const subPos = entry.subPosition || dbPlayer?.subPosition || '';
    const teamNumStr = entry.teamNumber ? String(entry.teamNumber) : '';
    const teamNameStr = entry.teamName || (entry.teamNumber ? `TEAM ${entry.teamNumber}` : '');
    const ratingStr = String(entry.rating);

    const matchTargets = [
      playerName,
      nameJa,
      nameEn,
      nameEs,
      clubName,
      clubNameJa,
      clubNameEn,
      clubNameEs,
      clubShort,
      nat,
      natJa,
      natEn,
      natEs,
      pos,
      subPos,
      yearStr,
      eraStr,
      teamNumStr,
      teamNameStr,
      ratingStr,
    ];

    for (const target of matchTargets) {
      if (target && target.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }
    }

    for (const target of matchTargets) {
      if (target && normalizeSearchText(target).includes(normalizedQuery)) {
        return true;
      }
    }

    const aliases = CLUB_ALIASES[clubId] || [];
    for (const alias of aliases) {
      if (
        alias.toLowerCase().includes(query.toLowerCase()) ||
        normalizeSearchText(alias).includes(normalizedQuery)
      ) {
        return true;
      }
    }

    if (
      (pos === 'GK' && (query.toLowerCase() === 'gk' || query.includes('キーパー') || query.toLowerCase().includes('portero') || query.toLowerCase().includes('goalkeeper'))) ||
      (pos === 'DF' && (query.toLowerCase() === 'df' || query.includes('ディフェンダー') || query.toLowerCase().includes('defensa') || query.toLowerCase().includes('defender'))) ||
      (pos === 'MF' && (query.toLowerCase() === 'mf' || query.includes('ミッドフィールダー') || query.toLowerCase().includes('mediocampista') || query.toLowerCase().includes('midfielder'))) ||
      (pos === 'FW' && (query.toLowerCase() === 'fw' || query.includes('フォワード') || query.toLowerCase().includes('delantero') || query.toLowerCase().includes('forward')))
    ) {
      return true;
    }

    if (entry.isLegendary && (query.toLowerCase().includes('legend') || query.includes('レジェンド') || query.toLowerCase().includes('leyenda'))) {
      return true;
    }

    return false;
  });
}
