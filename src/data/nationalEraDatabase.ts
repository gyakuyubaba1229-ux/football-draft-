import {
  Player,
  NationalDecade,
  NationalTeam,
  MainPosition,
  SubPosition,
  Language,
  PlayerCategory,
} from '../types';

export const NATIONAL_DECADES: {
  id: NationalDecade;
  labelJa: string;
  labelEn: string;
  labelEs: string;
  range: string;
  representativeYear: number;
}[] = [
  { id: '1990s', labelJa: '1990年代', labelEn: '1990s', labelEs: 'Años 1990', range: '1990–1999', representativeYear: 1998 },
  { id: '2000s', labelJa: '2000年代', labelEn: '2000s', labelEs: 'Años 2000', range: '2000–2009', representativeYear: 2006 },
  { id: '2010s', labelJa: '2010年代', labelEn: '2010s', labelEs: 'Años 2010', range: '2010–2019', representativeYear: 2014 },
  { id: '2020s', labelJa: '2020年代', labelEn: '2020s', labelEs: 'Años 2020', range: '2020–2026', representativeYear: 2022 },
];

export const NATIONAL_TEAMS: NationalTeam[] = [
  {
    id: 'nt_brazil',
    name: 'Brazil',
    nameJa: 'ブラジル代表',
    nameEn: 'Brazil',
    nameEs: 'Brasil',
    flag: '🇧🇷',
    confederation: 'CONMEBOL',
    primaryColor: '#eab308',
    secondaryColor: '#16a34a',
  },
  {
    id: 'nt_argentina',
    name: 'Argentina',
    nameJa: 'アルゼンチン代表',
    nameEn: 'Argentina',
    nameEs: 'Argentina',
    flag: '🇦🇷',
    confederation: 'CONMEBOL',
    primaryColor: '#38bdf8',
    secondaryColor: '#f8fafc',
  },
  {
    id: 'nt_france',
    name: 'France',
    nameJa: 'フランス代表',
    nameEn: 'France',
    nameEs: 'Francia',
    flag: '🇫🇷',
    confederation: 'UEFA',
    primaryColor: '#2563eb',
    secondaryColor: '#dc2626',
  },
  {
    id: 'nt_germany',
    name: 'Germany',
    nameJa: 'ドイツ代表',
    nameEn: 'Germany',
    nameEs: 'Alemania',
    flag: '🇩🇪',
    confederation: 'UEFA',
    primaryColor: '#e2e8f0',
    secondaryColor: '#1e293b',
  },
  {
    id: 'nt_spain',
    name: 'Spain',
    nameJa: 'スペイン代表',
    nameEn: 'Spain',
    nameEs: 'España',
    flag: '🇪🇸',
    confederation: 'UEFA',
    primaryColor: '#dc2626',
    secondaryColor: '#facc15',
  },
  {
    id: 'nt_italy',
    name: 'Italy',
    nameJa: 'イタリア代表',
    nameEn: 'Italy',
    nameEs: 'Italia',
    flag: '🇮🇹',
    confederation: 'UEFA',
    primaryColor: '#2563eb',
    secondaryColor: '#ffffff',
  },
  {
    id: 'nt_england',
    name: 'England',
    nameJa: 'イングランド代表',
    nameEn: 'England',
    nameEs: 'Inglaterra',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    confederation: 'UEFA',
    primaryColor: '#f8fafc',
    secondaryColor: '#dc2626',
  },
  {
    id: 'nt_netherlands',
    name: 'Netherlands',
    nameJa: 'オランダ代表',
    nameEn: 'Netherlands',
    nameEs: 'Países Bajos',
    flag: '🇳🇱',
    confederation: 'UEFA',
    primaryColor: '#f97316',
    secondaryColor: '#1e293b',
  },
  {
    id: 'nt_portugal',
    name: 'Portugal',
    nameJa: 'ポルトガル代表',
    nameEn: 'Portugal',
    nameEs: 'Portugal',
    flag: '🇵🇹',
    confederation: 'UEFA',
    primaryColor: '#b91c1c',
    secondaryColor: '#15803d',
  },
  {
    id: 'nt_japan',
    name: 'Japan',
    nameJa: '日本代表',
    nameEn: 'Japan',
    nameEs: 'Japón',
    flag: '🇯🇵',
    confederation: 'AFC',
    primaryColor: '#1d4ed8',
    secondaryColor: '#ffffff',
  },
  {
    id: 'nt_croatia',
    name: 'Croatia',
    nameJa: 'クロアチア代表',
    nameEn: 'Croatia',
    nameEs: 'Croacia',
    flag: '🇭🇷',
    confederation: 'UEFA',
    primaryColor: '#ef4444',
    secondaryColor: '#ffffff',
  },
  {
    id: 'nt_belgium',
    name: 'Belgium',
    nameJa: 'ベルギー代表',
    nameEn: 'Belgium',
    nameEs: 'Bélgica',
    flag: '🇧🇪',
    confederation: 'UEFA',
    primaryColor: '#dc2626',
    secondaryColor: '#facc15',
  },
];

export function getDecadeLabel(decade: NationalDecade, lang: Language): string {
  const found = NATIONAL_DECADES.find((d) => d.id === decade);
  if (!found) return decade;
  if (lang === 'ja') return found.labelJa;
  if (lang === 'es') return found.labelEs;
  return found.labelEn;
}

export function getNationalTeamById(id?: string | null): NationalTeam | undefined {
  if (!id) return undefined;
  return NATIONAL_TEAMS.find((t) => t.id === id);
}

export function getLocalizedNationalTeamName(team: NationalTeam, lang: Language): string {
  if (lang === 'ja') return team.nameJa;
  if (lang === 'es') return team.nameEs;
  return team.nameEn;
}

interface RawNationalSeed {
  id: string;
  personId: string;
  nameJa: string;
  nameEn: string;
  nameEs?: string;
  teamId: string;
  decade: NationalDecade;
  year: number;
  position: MainPosition;
  subPosition: SubPosition;
  rating: number;
  isLegendary?: boolean;
  height?: number;
  stats?: [number, number, number, number, number, number]; // pac, sho, pas, dri, def, phy
}

function buildDefaultStats(pos: MainPosition, rating: number): [number, number, number, number, number, number] {
  const r = Math.min(99, Math.max(70, rating));
  switch (pos) {
    case 'GK':
      return [Math.max(45, r - 35), Math.max(40, r - 40), Math.max(68, r - 12), Math.max(55, r - 25), Math.max(65, r - 15), r - 4];
    case 'DF':
      return [Math.max(68, r - 10), Math.max(52, r - 28), Math.max(70, r - 10), Math.max(66, r - 14), r, Math.max(74, r - 4)];
    case 'MF':
      return [Math.max(70, r - 10), Math.max(70, r - 10), r, Math.max(76, r - 3), Math.max(62, r - 18), Math.max(68, r - 12)];
    case 'FW':
    default:
      return [Math.max(76, r - 5), r, Math.max(72, r - 12), Math.max(78, r - 4), Math.max(38, r - 46), Math.max(68, r - 14)];
  }
}

function toPlayer(seed: RawNationalSeed): Player {
  const team = NATIONAL_TEAMS.find((t) => t.id === seed.teamId)!;
  const rating = Math.min(99, Math.max(72, seed.rating));
  const isLegend = seed.isLegendary ?? (seed.decade !== '2020s' && rating >= 86);
  const category: PlayerCategory = isLegend
    ? 'LEGEND'
    : rating >= 85
    ? 'STAR'
    : rating >= 78
    ? 'MID'
    : 'NORMAL';
  const [pace, shooting, passing, dribbling, defending, physical] =
    seed.stats || buildDefaultStats(seed.position, rating);

  return {
    playerId: `nt_${seed.id}`,
    personId: seed.personId,
    playerName: seed.nameEn,
    nameJa: seed.nameJa,
    nameEn: seed.nameEn,
    nameEs: seed.nameEs || seed.nameEn,
    clubId: team.id,
    clubName: `${team.nameJa} (${seed.decade})`,
    joiningYear: seed.year,
    position: seed.position,
    subPosition: seed.subPosition,
    nationality: team.nameEn,
    nationalityJa: team.nameJa.replace('代表', ''),
    nationalityEn: team.nameEn,
    nationalityEs: team.nameEs,
    nationalityFlag: team.flag,
    rating,
    category,
    isLegendary: isLegend,
    height: seed.height,
    eraDecade: seed.decade,
    nationalTeamId: team.id,
    stats: { pace, shooting, passing, dribbling, defending, physical },
  };
}

// Verified real national-team rosters grouped by Nation × Decade.
// Note: Belgium 1990s & 2000s are intentionally omitted so selecting them accurately displays "該当データなし" without inventing data.
const RAW_NATIONAL_SEEDS: RawNationalSeed[] = [
  // ==================== BRAZIL 🇧🇷 ====================
  // 1990s
  { id: 'bra90_taffarel', personId: 'taffarel', nameJa: 'クラウディオ・タファレル', nameEn: 'Cláudio Taffarel', teamId: 'nt_brazil', decade: '1990s', year: 1994, position: 'GK', subPosition: 'GK', rating: 88, isLegendary: true, height: 180 },
  { id: 'bra90_cafu', personId: 'cafu', nameJa: 'カフー', nameEn: 'Cafu', teamId: 'nt_brazil', decade: '1990s', year: 1998, position: 'DF', subPosition: 'RB', rating: 91, isLegendary: true, height: 176 },
  { id: 'bra90_rcarlos', personId: 'roberto_carlos', nameJa: 'ロベルト・カルロス', nameEn: 'Roberto Carlos', teamId: 'nt_brazil', decade: '1990s', year: 1998, position: 'DF', subPosition: 'LB', rating: 92, isLegendary: true, height: 168 },
  { id: 'bra90_aldair', personId: 'aldair', nameJa: 'アウダイール', nameEn: 'Aldair', teamId: 'nt_brazil', decade: '1990s', year: 1994, position: 'DF', subPosition: 'CB', rating: 88, isLegendary: true, height: 183 },
  { id: 'bra90_dunga', personId: 'dunga', nameJa: 'ドゥンガ', nameEn: 'Dunga', teamId: 'nt_brazil', decade: '1990s', year: 1994, position: 'MF', subPosition: 'DMF', rating: 89, isLegendary: true, height: 177 },
  { id: 'bra90_leonardo', personId: 'leonardo', nameJa: 'レオナルド', nameEn: 'Leonardo', teamId: 'nt_brazil', decade: '1990s', year: 1994, position: 'MF', subPosition: 'AMF', rating: 87, isLegendary: true, height: 177 },
  { id: 'bra90_romario', personId: 'romario', nameJa: 'ロマーリオ', nameEn: 'Romário', teamId: 'nt_brazil', decade: '1990s', year: 1994, position: 'FW', subPosition: 'CF', rating: 95, isLegendary: true, height: 167 },
  { id: 'bra90_bebeto', personId: 'bebeto', nameJa: 'ベベット', nameEn: 'Bebeto', teamId: 'nt_brazil', decade: '1990s', year: 1994, position: 'FW', subPosition: 'SS', rating: 89, isLegendary: true, height: 177 },

  // 2000s
  { id: 'bra00_dida', personId: 'dida', nameJa: 'ジーダ', nameEn: 'Dida', teamId: 'nt_brazil', decade: '2000s', year: 2006, position: 'GK', subPosition: 'GK', rating: 89, isLegendary: true, height: 195 },
  { id: 'bra00_lucio', personId: 'lucio', nameJa: 'ルシオ', nameEn: 'Lúcio', teamId: 'nt_brazil', decade: '2000s', year: 2002, position: 'DF', subPosition: 'CB', rating: 90, isLegendary: true, height: 188 },
  { id: 'bra00_maicon', personId: 'maicon', nameJa: 'マイコン', nameEn: 'Maicon', teamId: 'nt_brazil', decade: '2000s', year: 2009, position: 'DF', subPosition: 'RB', rating: 89, isLegendary: true, height: 184 },
  { id: 'bra00_kaka', personId: 'kaka', nameJa: 'カカ', nameEn: 'Kaká', teamId: 'nt_brazil', decade: '2000s', year: 2007, position: 'MF', subPosition: 'AMF', rating: 94, isLegendary: true, height: 186 },
  { id: 'bra00_gilberto', personId: 'gilberto_silva', nameJa: 'ジウベルト・シウバ', nameEn: 'Gilberto Silva', teamId: 'nt_brazil', decade: '2000s', year: 2002, position: 'MF', subPosition: 'DMF', rating: 88, isLegendary: true, height: 185 },
  { id: 'bra00_ronaldo', personId: 'ronaldo_nazario', nameJa: 'ロナウド', nameEn: 'Ronaldo', teamId: 'nt_brazil', decade: '2000s', year: 2002, position: 'FW', subPosition: 'CF', rating: 97, isLegendary: true, height: 183 },
  { id: 'bra00_ronaldinho', personId: 'ronaldinho', nameJa: 'ロナウジーニョ', nameEn: 'Ronaldinho', teamId: 'nt_brazil', decade: '2000s', year: 2005, position: 'FW', subPosition: 'LWG', rating: 96, isLegendary: true, height: 182 },
  { id: 'bra00_rivaldo', personId: 'rivaldo', nameJa: 'リバウド', nameEn: 'Rivaldo', teamId: 'nt_brazil', decade: '2000s', year: 2002, position: 'FW', subPosition: 'SS', rating: 94, isLegendary: true, height: 186 },

  // 2010s
  { id: 'bra10_julio_cesar', personId: 'julio_cesar', nameJa: 'ジュリオ・セザール', nameEn: 'Júlio César', teamId: 'nt_brazil', decade: '2010s', year: 2010, position: 'GK', subPosition: 'GK', rating: 88, isLegendary: true, height: 186 },
  { id: 'bra10_tsilva', personId: 'thiago_silva', nameJa: 'チアゴ・シウバ', nameEn: 'Thiago Silva', teamId: 'nt_brazil', decade: '2010s', year: 2014, position: 'DF', subPosition: 'CB', rating: 91, isLegendary: false, height: 181 },
  { id: 'bra10_marcelo', personId: 'marcelo', nameJa: 'マルセロ', nameEn: 'Marcelo', teamId: 'nt_brazil', decade: '2010s', year: 2018, position: 'DF', subPosition: 'LB', rating: 90, isLegendary: false, height: 174 },
  { id: 'bra10_danialves', personId: 'dani_alves', nameJa: 'ダニエウ・アウヴェス', nameEn: 'Dani Alves', teamId: 'nt_brazil', decade: '2010s', year: 2019, position: 'DF', subPosition: 'RB', rating: 89, isLegendary: true, height: 172 },
  { id: 'bra10_casemiro', personId: 'casemiro', nameJa: 'カゼミーロ', nameEn: 'Casemiro', teamId: 'nt_brazil', decade: '2010s', year: 2018, position: 'MF', subPosition: 'DMF', rating: 89, isLegendary: false, height: 185 },
  { id: 'bra10_coutinho', personId: 'philippe_coutinho', nameJa: 'フィリペ・コウチーニョ', nameEn: 'Philippe Coutinho', teamId: 'nt_brazil', decade: '2010s', year: 2018, position: 'MF', subPosition: 'AMF', rating: 88, isLegendary: false, height: 172 },
  { id: 'bra10_neymar', personId: 'neymar', nameJa: 'ネイマール', nameEn: 'Neymar Jr', teamId: 'nt_brazil', decade: '2010s', year: 2014, position: 'FW', subPosition: 'LWG', rating: 94, isLegendary: false, height: 175 },
  { id: 'bra10_firmino', personId: 'roberto_firmino', nameJa: 'ロベルト・フィルミーノ', nameEn: 'Roberto Firmino', teamId: 'nt_brazil', decade: '2010s', year: 2019, position: 'FW', subPosition: 'CF', rating: 87, isLegendary: false, height: 181 },

  // 2020s
  { id: 'bra20_alisson', personId: 'alisson', nameJa: 'アリソン・ベッカー', nameEn: 'Alisson Becker', teamId: 'nt_brazil', decade: '2020s', year: 2022, position: 'GK', subPosition: 'GK', rating: 90, isLegendary: false, height: 193 },
  { id: 'bra20_marquinhos', personId: 'marquinhos', nameJa: 'マルキーニョス', nameEn: 'Marquinhos', teamId: 'nt_brazil', decade: '2020s', year: 2022, position: 'DF', subPosition: 'CB', rating: 88, isLegendary: false, height: 183 },
  { id: 'bra20_gabriel', personId: 'gabriel_magalhaes', nameJa: 'ガブリエウ・マガリャンイス', nameEn: 'Gabriel Magalhães', teamId: 'nt_brazil', decade: '2020s', year: 2024, position: 'DF', subPosition: 'CB', rating: 87, isLegendary: false, height: 190 },
  { id: 'bra20_guimaraes', personId: 'bruno_guimaraes', nameJa: 'ブルーノ・ギマランイス', nameEn: 'Bruno Guimarães', teamId: 'nt_brazil', decade: '2020s', year: 2024, position: 'MF', subPosition: 'CMF', rating: 86, isLegendary: false, height: 182 },
  { id: 'bra20_paqueta', personId: 'lucas_paqueta', nameJa: 'ルーカス・パケタ', nameEn: 'Lucas Paquetá', teamId: 'nt_brazil', decade: '2020s', year: 2022, position: 'MF', subPosition: 'AMF', rating: 85, isLegendary: false, height: 180 },
  { id: 'bra20_vinicius', personId: 'vinicius_jr', nameJa: 'ヴィニシウス・ジュニオール', nameEn: 'Vinícius Júnior', teamId: 'nt_brazil', decade: '2020s', year: 2024, position: 'FW', subPosition: 'LWG', rating: 92, isLegendary: false, height: 176 },
  { id: 'bra20_rodrygo', personId: 'rodrygo', nameJa: 'ロドリゴ', nameEn: 'Rodrygo', teamId: 'nt_brazil', decade: '2020s', year: 2024, position: 'FW', subPosition: 'RWG', rating: 87, isLegendary: false, height: 174 },
  { id: 'bra20_raphinha', personId: 'raphinha', nameJa: 'ハフィーニャ', nameEn: 'Raphinha', teamId: 'nt_brazil', decade: '2020s', year: 2025, position: 'FW', subPosition: 'RWG', rating: 88, isLegendary: false, height: 176 },

  // ==================== ARGENTINA 🇦🇷 ====================
  // 1990s
  { id: 'arg90_goycochea', personId: 'goycochea', nameJa: 'セルヒオ・ゴイコチェア', nameEn: 'Sergio Goycochea', teamId: 'nt_argentina', decade: '1990s', year: 1990, position: 'GK', subPosition: 'GK', rating: 86, isLegendary: true, height: 185 },
  { id: 'arg90_rugge', personId: 'ruggeri', nameJa: 'オスカル・ルジェリ', nameEn: 'Oscar Ruggeri', teamId: 'nt_argentina', decade: '1990s', year: 1993, position: 'DF', subPosition: 'CB', rating: 87, isLegendary: true, height: 183 },
  { id: 'arg90_zanetti', personId: 'javier_zanetti', nameJa: 'ハビエル・サネッティ', nameEn: 'Javier Zanetti', teamId: 'nt_argentina', decade: '1990s', year: 1998, position: 'DF', subPosition: 'RB', rating: 90, isLegendary: true, height: 178 },
  { id: 'arg90_redondo', personId: 'fernando_redondo', nameJa: 'フェルナンド・レドンド', nameEn: 'Fernando Redondo', teamId: 'nt_argentina', decade: '1990s', year: 1994, position: 'MF', subPosition: 'DMF', rating: 90, isLegendary: true, height: 186 },
  { id: 'arg90_simeone', personId: 'diego_simeone', nameJa: 'ディエゴ・シメオネ', nameEn: 'Diego Simeone', teamId: 'nt_argentina', decade: '1990s', year: 1998, position: 'MF', subPosition: 'CMF', rating: 88, isLegendary: true, height: 177 },
  { id: 'arg90_batistuta', personId: 'batistuta', nameJa: 'ガブリエル・バティストゥータ', nameEn: 'Gabriel Batistuta', teamId: 'nt_argentina', decade: '1990s', year: 1998, position: 'FW', subPosition: 'CF', rating: 93, isLegendary: true, height: 185 },
  { id: 'arg90_caniggia', personId: 'caniggia', nameJa: 'クラウディオ・カニーヒア', nameEn: 'Claudio Caniggia', teamId: 'nt_argentina', decade: '1990s', year: 1990, position: 'FW', subPosition: 'RWG', rating: 88, isLegendary: true, height: 172 },

  // 2000s
  { id: 'arg00_abbondanzieri', personId: 'abbondanzieri', nameJa: 'ロベルト・アボンダンシエリ', nameEn: 'Roberto Abbondanzieri', teamId: 'nt_argentina', decade: '2000s', year: 2006, position: 'GK', subPosition: 'GK', rating: 85, isLegendary: true, height: 186 },
  { id: 'arg00_ayala', personId: 'roberto_ayala', nameJa: 'ロベルト・アジャラ', nameEn: 'Roberto Ayala', teamId: 'nt_argentina', decade: '2000s', year: 2006, position: 'DF', subPosition: 'CB', rating: 89, isLegendary: true, height: 177 },
  { id: 'arg00_samuel', personId: 'walter_samuel', nameJa: 'ワルテル・サムエル', nameEn: 'Walter Samuel', teamId: 'nt_argentina', decade: '2000s', year: 2002, position: 'DF', subPosition: 'CB', rating: 88, isLegendary: true, height: 183 },
  { id: 'arg00_riquelme', personId: 'riquelme', nameJa: 'フアン・ロマン・リケルメ', nameEn: 'Juan Román Riquelme', teamId: 'nt_argentina', decade: '2000s', year: 2006, position: 'MF', subPosition: 'AMF', rating: 91, isLegendary: true, height: 182 },
  { id: 'arg00_veron', personId: 'veron', nameJa: 'フアン・セバスティアン・ベロン', nameEn: 'Juan Sebastián Verón', teamId: 'nt_argentina', decade: '2000s', year: 2002, position: 'MF', subPosition: 'CMF', rating: 89, isLegendary: true, height: 186 },
  { id: 'arg00_cambiasso', personId: 'cambiasso', nameJa: 'エステバン・カンビアッソ', nameEn: 'Esteban Cambiasso', teamId: 'nt_argentina', decade: '2000s', year: 2006, position: 'MF', subPosition: 'DMF', rating: 88, isLegendary: true, height: 177 },
  { id: 'arg00_crespo', personId: 'hernan_crespo', nameJa: 'エルナン・クレスポ', nameEn: 'Hernán Crespo', teamId: 'nt_argentina', decade: '2000s', year: 2006, position: 'FW', subPosition: 'CF', rating: 90, isLegendary: true, height: 184 },
  { id: 'arg00_tevez', personId: 'carlos_tevez', nameJa: 'カルロス・テベス', nameEn: 'Carlos Tevez', teamId: 'nt_argentina', decade: '2000s', year: 2007, position: 'FW', subPosition: 'CF', rating: 89, isLegendary: true, height: 173 },

  // 2010s
  { id: 'arg10_romero', personId: 'sergio_romero', nameJa: 'セルヒオ・ロメロ', nameEn: 'Sergio Romero', teamId: 'nt_argentina', decade: '2010s', year: 2014, position: 'GK', subPosition: 'GK', rating: 84, isLegendary: false, height: 192 },
  { id: 'arg10_zabaleta', personId: 'pablo_zabaleta', nameJa: 'パブロ・サバレタ', nameEn: 'Pablo Zabaleta', teamId: 'nt_argentina', decade: '2010s', year: 2014, position: 'DF', subPosition: 'RB', rating: 85, isLegendary: false, height: 174 },
  { id: 'arg10_garay', personId: 'ezequiel_garay', nameJa: 'エセキエル・ガライ', nameEn: 'Ezequiel Garay', teamId: 'nt_argentina', decade: '2010s', year: 2014, position: 'DF', subPosition: 'CB', rating: 85, isLegendary: false, height: 189 },
  { id: 'arg10_mascherano', personId: 'mascherano', nameJa: 'ハビエル・マスチェラーノ', nameEn: 'Javier Mascherano', teamId: 'nt_argentina', decade: '2010s', year: 2014, position: 'MF', subPosition: 'DMF', rating: 89, isLegendary: true, height: 174 },
  { id: 'arg10_dimaria', personId: 'di_maria', nameJa: 'アンヘル・ディ・マリア', nameEn: 'Ángel Di María', teamId: 'nt_argentina', decade: '2010s', year: 2014, position: 'MF', subPosition: 'RWG', rating: 90, isLegendary: false, height: 180 },
  { id: 'arg10_messi', personId: 'lionel_messi', nameJa: 'リオネル・メッシ', nameEn: 'Lionel Messi', teamId: 'nt_argentina', decade: '2010s', year: 2014, position: 'FW', subPosition: 'RWG', rating: 98, isLegendary: false, height: 170 },
  { id: 'arg10_aguero', personId: 'sergio_aguero', nameJa: 'セルヒオ・アグエロ', nameEn: 'Sergio Agüero', teamId: 'nt_argentina', decade: '2010s', year: 2014, position: 'FW', subPosition: 'CF', rating: 91, isLegendary: true, height: 173 },
  { id: 'arg10_higuain', personId: 'higuain', nameJa: 'ゴンサロ・イグアイン', nameEn: 'Gonzalo Higuaín', teamId: 'nt_argentina', decade: '2010s', year: 2014, position: 'FW', subPosition: 'CF', rating: 89, isLegendary: true, height: 186 },

  // 2020s
  { id: 'arg20_emartinez', personId: 'emi_martinez', nameJa: 'エミリアーノ・マルティネス', nameEn: 'Emiliano Martínez', teamId: 'nt_argentina', decade: '2020s', year: 2022, position: 'GK', subPosition: 'GK', rating: 89, isLegendary: false, height: 195 },
  { id: 'arg20_cromero', personId: 'cristian_romero', nameJa: 'クリスティアン・ロメロ', nameEn: 'Cristian Romero', teamId: 'nt_argentina', decade: '2020s', year: 2022, position: 'DF', subPosition: 'CB', rating: 88, isLegendary: false, height: 185 },
  { id: 'arg20_lmartinez', personId: 'lisandro_martinez', nameJa: 'リサンドロ・マルティネス', nameEn: 'Lisandro Martínez', teamId: 'nt_argentina', decade: '2020s', year: 2024, position: 'DF', subPosition: 'CB', rating: 86, isLegendary: false, height: 175 },
  { id: 'arg20_depaul', personId: 'rodrigo_de_paul', nameJa: 'ロドリゴ・デ・パウル', nameEn: 'Rodrigo De Paul', teamId: 'nt_argentina', decade: '2020s', year: 2022, position: 'MF', subPosition: 'CMF', rating: 87, isLegendary: false, height: 180 },
  { id: 'arg20_macallister', personId: 'alexis_mac_allister', nameJa: 'アレクシス・マック・アリスター', nameEn: 'Alexis Mac Allister', teamId: 'nt_argentina', decade: '2020s', year: 2024, position: 'MF', subPosition: 'CMF', rating: 88, isLegendary: false, height: 176 },
  { id: 'arg20_enzo', personId: 'enzo_fernandez', nameJa: 'エンソ・フェルナンデス', nameEn: 'Enzo Fernández', teamId: 'nt_argentina', decade: '2020s', year: 2022, position: 'MF', subPosition: 'CMF', rating: 87, isLegendary: false, height: 178 },
  { id: 'arg20_alvarez', personId: 'julian_alvarez', nameJa: 'フリアン・アルバレス', nameEn: 'Julián Álvarez', teamId: 'nt_argentina', decade: '2020s', year: 2024, position: 'FW', subPosition: 'CF', rating: 88, isLegendary: false, height: 170 },
  { id: 'arg20_lautaro', personId: 'lautaro_martinez', nameJa: 'ラウタロ・マルティネス', nameEn: 'Lautaro Martínez', teamId: 'nt_argentina', decade: '2020s', year: 2024, position: 'FW', subPosition: 'CF', rating: 90, isLegendary: false, height: 174 },

  // ==================== FRANCE 🇫🇷 ====================
  // 1990s
  { id: 'fra90_barthez', personId: 'fabien_barthez', nameJa: 'ファビアン・バルテズ', nameEn: 'Fabien Barthez', teamId: 'nt_france', decade: '1990s', year: 1998, position: 'GK', subPosition: 'GK', rating: 89, isLegendary: true, height: 180 },
  { id: 'fra90_thuram', personId: 'lilian_thuram', nameJa: 'リリアン・テュラム', nameEn: 'Lilian Thuram', teamId: 'nt_france', decade: '1990s', year: 1998, position: 'DF', subPosition: 'RB', rating: 91, isLegendary: true, height: 182 },
  { id: 'fra90_desailly', personId: 'marcel_desailly', nameJa: 'マルセル・デサイー', nameEn: 'Marcel Desailly', teamId: 'nt_france', decade: '1990s', year: 1998, position: 'DF', subPosition: 'CB', rating: 91, isLegendary: true, height: 185 },
  { id: 'fra90_blanc', personId: 'laurent_blanc', nameJa: 'ローラン・ブラン', nameEn: 'Laurent Blanc', teamId: 'nt_france', decade: '1990s', year: 1998, position: 'DF', subPosition: 'CB', rating: 90, isLegendary: true, height: 192 },
  { id: 'fra90_zidane', personId: 'zidane', nameJa: 'ジネディーヌ・ジダン', nameEn: 'Zinedine Zidane', teamId: 'nt_france', decade: '1990s', year: 1998, position: 'MF', subPosition: 'AMF', rating: 96, isLegendary: true, height: 185 },
  { id: 'fra90_deschamps', personId: 'deschamps', nameJa: 'ディディエ・デシャン', nameEn: 'Didier Deschamps', teamId: 'nt_france', decade: '1990s', year: 1998, position: 'MF', subPosition: 'DMF', rating: 88, isLegendary: true, height: 174 },
  { id: 'fra90_djorkaeff', personId: 'djorkaeff', nameJa: 'ユーリ・ジョルカエフ', nameEn: 'Youri Djorkaeff', teamId: 'nt_france', decade: '1990s', year: 1998, position: 'FW', subPosition: 'SS', rating: 88, isLegendary: true, height: 179 },

  // 2000s
  { id: 'fra00_coupet', personId: 'gregory_coupet', nameJa: 'グレゴリー・クペ', nameEn: 'Grégory Coupet', teamId: 'nt_france', decade: '2000s', year: 2006, position: 'GK', subPosition: 'GK', rating: 86, isLegendary: true, height: 181 },
  { id: 'fra00_lizarazu', personId: 'lizarazu', nameJa: 'ビセンテ・リザラズ', nameEn: 'Bixente Lizarazu', teamId: 'nt_france', decade: '2000s', year: 2000, position: 'DF', subPosition: 'LB', rating: 89, isLegendary: true, height: 169 },
  { id: 'fra00_abidal', personId: 'eric_abidal', nameJa: 'エリック・アビダル', nameEn: 'Éric Abidal', teamId: 'nt_france', decade: '2000s', year: 2006, position: 'DF', subPosition: 'LB', rating: 87, isLegendary: true, height: 186 },
  { id: 'fra00_vieira', personId: 'patrick_vieira', nameJa: 'パトリック・ヴィエラ', nameEn: 'Patrick Vieira', teamId: 'nt_france', decade: '2000s', year: 2006, position: 'MF', subPosition: 'DMF', rating: 92, isLegendary: true, height: 192 },
  { id: 'fra00_makelele', personId: 'makelele', nameJa: 'クロード・マケレレ', nameEn: 'Claude Makélélé', teamId: 'nt_france', decade: '2000s', year: 2006, position: 'MF', subPosition: 'DMF', rating: 91, isLegendary: true, height: 174 },
  { id: 'fra00_henry', personId: 'thierry_henry', nameJa: 'ティエリ・アンリ', nameEn: 'Thierry Henry', teamId: 'nt_france', decade: '2000s', year: 2006, position: 'FW', subPosition: 'CF', rating: 95, isLegendary: true, height: 188 },
  { id: 'fra00_trezeguet', personId: 'trezeguet', nameJa: 'ダヴィド・トレゼゲ', nameEn: 'David Trezeguet', teamId: 'nt_france', decade: '2000s', year: 2000, position: 'FW', subPosition: 'CF', rating: 90, isLegendary: true, height: 190 },

  // 2010s
  { id: 'fra10_lloris', personId: 'hugo_lloris', nameJa: 'ウーゴ・ロリス', nameEn: 'Hugo Lloris', teamId: 'nt_france', decade: '2010s', year: 2018, position: 'GK', subPosition: 'GK', rating: 89, isLegendary: false, height: 188 },
  { id: 'fra10_varane', personId: 'raphael_varane', nameJa: 'ラファエル・ヴァラン', nameEn: 'Raphaël Varane', teamId: 'nt_france', decade: '2010s', year: 2018, position: 'DF', subPosition: 'CB', rating: 90, isLegendary: false, height: 191 },
  { id: 'fra10_kante', personId: 'ngolo_kante', nameJa: 'エンゴロ・カンテ', nameEn: "N'Golo Kanté", teamId: 'nt_france', decade: '2010s', year: 2018, position: 'MF', subPosition: 'DMF', rating: 91, isLegendary: false, height: 168 },
  { id: 'fra10_pogba', personId: 'paul_pogba', nameJa: 'ポール・ポグバ', nameEn: 'Paul Pogba', teamId: 'nt_france', decade: '2010s', year: 2018, position: 'MF', subPosition: 'CMF', rating: 90, isLegendary: false, height: 191 },
  { id: 'fra10_griezmann', personId: 'antoine_griezmann', nameJa: 'アントワーヌ・グリーズマン', nameEn: 'Antoine Griezmann', teamId: 'nt_france', decade: '2010s', year: 2018, position: 'FW', subPosition: 'SS', rating: 91, isLegendary: false, height: 176 },
  { id: 'fra10_benzema', personId: 'karim_benzema', nameJa: 'カリム・ベンゼマ', nameEn: 'Karim Benzema', teamId: 'nt_france', decade: '2010s', year: 2014, position: 'FW', subPosition: 'CF', rating: 90, isLegendary: false, height: 185 },

  // 2020s
  { id: 'fra20_maignan', personId: 'mike_maignan', nameJa: 'マイク・メニャン', nameEn: 'Mike Maignan', teamId: 'nt_france', decade: '2020s', year: 2024, position: 'GK', subPosition: 'GK', rating: 89, isLegendary: false, height: 191 },
  { id: 'fra20_saliba', personId: 'william_saliba', nameJa: 'ウィリアム・サリバ', nameEn: 'William Saliba', teamId: 'nt_france', decade: '2020s', year: 2024, position: 'DF', subPosition: 'CB', rating: 89, isLegendary: false, height: 192 },
  { id: 'fra20_theohernandez', personId: 'theo_hernandez', nameJa: 'テオ・エルナンデス', nameEn: 'Theo Hernández', teamId: 'nt_france', decade: '2020s', year: 2022, position: 'DF', subPosition: 'LB', rating: 88, isLegendary: false, height: 184 },
  { id: 'fra20_tchouameni', personId: 'tchouameni', nameJa: 'オーレリアン・チュアメニ', nameEn: 'Aurélien Tchouaméni', teamId: 'nt_france', decade: '2020s', year: 2022, position: 'MF', subPosition: 'DMF', rating: 87, isLegendary: false, height: 187 },
  { id: 'fra20_camavinga', personId: 'eduardo_camavinga', nameJa: 'エドゥアルド・カマヴィンガ', nameEn: 'Eduardo Camavinga', teamId: 'nt_france', decade: '2020s', year: 2024, position: 'MF', subPosition: 'CMF', rating: 86, isLegendary: false, height: 182 },
  { id: 'fra20_mbappe', personId: 'kylian_mbappe', nameJa: 'キリアン・エムバペ', nameEn: 'Kylian Mbappé', teamId: 'nt_france', decade: '2020s', year: 2022, position: 'FW', subPosition: 'CF', rating: 95, isLegendary: false, height: 178 },
  { id: 'fra20_dembele', personId: 'ousmane_dembele', nameJa: 'ウスマン・デンベレ', nameEn: 'Ousmane Dembélé', teamId: 'nt_france', decade: '2020s', year: 2025, position: 'FW', subPosition: 'RWG', rating: 90, isLegendary: false, height: 178 },

  // ==================== GERMANY 🇩🇪 ====================
  // 1990s
  { id: 'ger90_kopke', personId: 'andreas_kopke', nameJa: 'アンドレアス・ケプケ', nameEn: 'Andreas Köpke', teamId: 'nt_germany', decade: '1990s', year: 1996, position: 'GK', subPosition: 'GK', rating: 87, isLegendary: true, height: 182 },
  { id: 'ger90_matthaus', personId: 'matthaus', nameJa: 'ローター・マテウス', nameEn: 'Lothar Matthäus', teamId: 'nt_germany', decade: '1990s', year: 1990, position: 'MF', subPosition: 'CMF', rating: 95, isLegendary: true, height: 174 },
  { id: 'ger90_brehme', personId: 'andreas_brehme', nameJa: 'アンドレアス・ブレーメ', nameEn: 'Andreas Brehme', teamId: 'nt_germany', decade: '1990s', year: 1990, position: 'DF', subPosition: 'LB', rating: 90, isLegendary: true, height: 176 },
  { id: 'ger90_sammer', personId: 'matthias_sammer', nameJa: 'マティアス・ザマー', nameEn: 'Matthias Sammer', teamId: 'nt_germany', decade: '1990s', year: 1996, position: 'DF', subPosition: 'CB', rating: 91, isLegendary: true, height: 181 },
  { id: 'ger90_klinsmann', personId: 'jurgen_klinsmann', nameJa: 'ユルゲン・クリンスマン', nameEn: 'Jürgen Klinsmann', teamId: 'nt_germany', decade: '1990s', year: 1996, position: 'FW', subPosition: 'CF', rating: 91, isLegendary: true, height: 181 },
  { id: 'ger90_voller', personId: 'rudi_voller', nameJa: 'ルディ・フェラー', nameEn: 'Rudi Völler', teamId: 'nt_germany', decade: '1990s', year: 1990, position: 'FW', subPosition: 'CF', rating: 90, isLegendary: true, height: 180 },

  // 2000s
  { id: 'ger00_kahn', personId: 'oliver_kahn', nameJa: 'オリヴァー・カーン', nameEn: 'Oliver Kahn', teamId: 'nt_germany', decade: '2000s', year: 2002, position: 'GK', subPosition: 'GK', rating: 94, isLegendary: true, height: 188 },
  { id: 'ger00_lahm', personId: 'philipp_lahm', nameJa: 'フィリップ・ラーム', nameEn: 'Philipp Lahm', teamId: 'nt_germany', decade: '2000s', year: 2006, position: 'DF', subPosition: 'LB', rating: 91, isLegendary: true, height: 170 },
  { id: 'ger00_ballack', personId: 'michael_ballack', nameJa: 'ミヒャエル・バラック', nameEn: 'Michael Ballack', teamId: 'nt_germany', decade: '2000s', year: 2006, position: 'MF', subPosition: 'CMF', rating: 91, isLegendary: true, height: 188 },
  { id: 'ger00_schweinsteiger', personId: 'schweinsteiger', nameJa: 'バスティアン・シュヴァインシュタイガー', nameEn: 'Bastian Schweinsteiger', teamId: 'nt_germany', decade: '2000s', year: 2006, position: 'MF', subPosition: 'CMF', rating: 88, isLegendary: true, height: 183 },
  { id: 'ger00_klose', personId: 'miroslav_klose', nameJa: 'ミロスラフ・クローゼ', nameEn: 'Miroslav Klose', teamId: 'nt_germany', decade: '2000s', year: 2006, position: 'FW', subPosition: 'CF', rating: 90, isLegendary: true, height: 184 },
  { id: 'ger00_podolski', personId: 'lukas_podolski', nameJa: 'ルーカス・ポドルスキ', nameEn: 'Lukas Podolski', teamId: 'nt_germany', decade: '2000s', year: 2006, position: 'FW', subPosition: 'SS', rating: 86, isLegendary: true, height: 182 },

  // 2010s
  { id: 'ger10_neuer', personId: 'manuel_neuer', nameJa: 'マヌエル・ノイアー', nameEn: 'Manuel Neuer', teamId: 'nt_germany', decade: '2010s', year: 2014, position: 'GK', subPosition: 'GK', rating: 94, isLegendary: false, height: 193 },
  { id: 'ger10_hummels', personId: 'mats_hummels', nameJa: 'マッツ・フンメルス', nameEn: 'Mats Hummels', teamId: 'nt_germany', decade: '2010s', year: 2014, position: 'DF', subPosition: 'CB', rating: 89, isLegendary: false, height: 191 },
  { id: 'ger10_kroos', personId: 'toni_kroos', nameJa: 'トニ・クロース', nameEn: 'Toni Kroos', teamId: 'nt_germany', decade: '2010s', year: 2014, position: 'MF', subPosition: 'CMF', rating: 92, isLegendary: false, height: 183 },
  { id: 'ger10_ozil', personId: 'mesut_ozil', nameJa: 'メスト・エジル', nameEn: 'Mesut Özil', teamId: 'nt_germany', decade: '2010s', year: 2014, position: 'MF', subPosition: 'AMF', rating: 90, isLegendary: true, height: 180 },
  { id: 'ger10_muller', personId: 'thomas_muller', nameJa: 'トーマス・ミュラー', nameEn: 'Thomas Müller', teamId: 'nt_germany', decade: '2010s', year: 2014, position: 'FW', subPosition: 'SS', rating: 90, isLegendary: false, height: 185 },

  // 2020s
  { id: 'ger20_terstegen', personId: 'ter_stegen', nameJa: 'マルク＝アンドレ・テア・シュテーゲン', nameEn: 'Marc-André ter Stegen', teamId: 'nt_germany', decade: '2020s', year: 2024, position: 'GK', subPosition: 'GK', rating: 88, isLegendary: false, height: 187 },
  { id: 'ger20_rudiger', personId: 'antonio_rudiger', nameJa: 'アントニオ・リュディガー', nameEn: 'Antonio Rüdiger', teamId: 'nt_germany', decade: '2020s', year: 2024, position: 'DF', subPosition: 'CB', rating: 88, isLegendary: false, height: 190 },
  { id: 'ger20_kimmich', personId: 'joshua_kimmich', nameJa: 'ヨシュア・キミッヒ', nameEn: 'Joshua Kimmich', teamId: 'nt_germany', decade: '2020s', year: 2024, position: 'MF', subPosition: 'DMF', rating: 89, isLegendary: false, height: 177 },
  { id: 'ger20_musiala', personId: 'jamal_musiala', nameJa: 'ジャマル・ムシアラ', nameEn: 'Jamal Musiala', teamId: 'nt_germany', decade: '2020s', year: 2024, position: 'MF', subPosition: 'AMF', rating: 89, isLegendary: false, height: 184 },
  { id: 'ger20_wirtz', personId: 'florian_wirtz', nameJa: 'フロリアン・ヴィルツ', nameEn: 'Florian Wirtz', teamId: 'nt_germany', decade: '2020s', year: 2024, position: 'MF', subPosition: 'AMF', rating: 89, isLegendary: false, height: 177 },
  { id: 'ger20_havertz', personId: 'kai_havertz', nameJa: 'カイ・ハフェルツ', nameEn: 'Kai Havertz', teamId: 'nt_germany', decade: '2020s', year: 2024, position: 'FW', subPosition: 'CF', rating: 85, isLegendary: false, height: 193 },

  // ==================== SPAIN 🇪🇸 ====================
  // 1990s
  { id: 'esp90_zubizarreta', personId: 'zubizarreta', nameJa: 'アンドニ・スビサレッタ', nameEn: 'Andoni Zubizarreta', teamId: 'nt_spain', decade: '1990s', year: 1994, position: 'GK', subPosition: 'GK', rating: 86, isLegendary: true, height: 187 },
  { id: 'esp90_hierro', personId: 'fernando_hierro', nameJa: 'フェルナンド・イエロ', nameEn: 'Fernando Hierro', teamId: 'nt_spain', decade: '1990s', year: 1998, position: 'DF', subPosition: 'CB', rating: 90, isLegendary: true, height: 187 },
  { id: 'esp90_guardiola', personId: 'pep_guardiola', nameJa: 'ジョゼップ・グアルディオラ', nameEn: 'Pep Guardiola', teamId: 'nt_spain', decade: '1990s', year: 1994, position: 'MF', subPosition: 'DMF', rating: 88, isLegendary: true, height: 180 },
  { id: 'esp90_luisenrique', personId: 'luis_enrique', nameJa: 'ルイス・エンリケ', nameEn: 'Luis Enrique', teamId: 'nt_spain', decade: '1990s', year: 1998, position: 'MF', subPosition: 'CMF', rating: 87, isLegendary: true, height: 180 },
  { id: 'esp90_raul', personId: 'raul_gonzalez', nameJa: 'ラウール・ゴンサレス', nameEn: 'Raúl González', teamId: 'nt_spain', decade: '1990s', year: 1998, position: 'FW', subPosition: 'SS', rating: 91, isLegendary: true, height: 180 },

  // 2000s
  { id: 'esp00_casillas', personId: 'iker_casillas', nameJa: 'イケル・カシージャス', nameEn: 'Iker Casillas', teamId: 'nt_spain', decade: '2000s', year: 2008, position: 'GK', subPosition: 'GK', rating: 93, isLegendary: true, height: 182 },
  { id: 'esp00_puyol', personId: 'carles_puyol', nameJa: 'カルレス・プジョル', nameEn: 'Carles Puyol', teamId: 'nt_spain', decade: '2000s', year: 2008, position: 'DF', subPosition: 'CB', rating: 92, isLegendary: true, height: 178 },
  { id: 'esp00_xavi', personId: 'xavi_hernandez', nameJa: 'シャビ・エルナンデス', nameEn: 'Xavi Hernández', teamId: 'nt_spain', decade: '2000s', year: 2008, position: 'MF', subPosition: 'CMF', rating: 94, isLegendary: true, height: 170 },
  { id: 'esp00_fabregas', personId: 'cesc_fabregas', nameJa: 'セスク・ファブレガス', nameEn: 'Cesc Fàbregas', teamId: 'nt_spain', decade: '2000s', year: 2008, position: 'MF', subPosition: 'CMF', rating: 89, isLegendary: true, height: 179 },
  { id: 'esp00_torres', personId: 'fernando_torres', nameJa: 'フェルナンド・トーレス', nameEn: 'Fernando Torres', teamId: 'nt_spain', decade: '2000s', year: 2008, position: 'FW', subPosition: 'CF', rating: 91, isLegendary: true, height: 186 },

  // 2010s
  { id: 'esp10_ramos', personId: 'sergio_ramos', nameJa: 'セルヒオ・ラモス', nameEn: 'Sergio Ramos', teamId: 'nt_spain', decade: '2010s', year: 2012, position: 'DF', subPosition: 'CB', rating: 93, isLegendary: false, height: 184 },
  { id: 'esp10_pique', personId: 'gerard_pique', nameJa: 'ジェラール・ピケ', nameEn: 'Gerard Piqué', teamId: 'nt_spain', decade: '2010s', year: 2010, position: 'DF', subPosition: 'CB', rating: 90, isLegendary: true, height: 194 },
  { id: 'esp10_iniesta', personId: 'andres_iniesta', nameJa: 'アンドレス・イニエスタ', nameEn: 'Andrés Iniesta', teamId: 'nt_spain', decade: '2010s', year: 2010, position: 'MF', subPosition: 'CMF', rating: 95, isLegendary: true, height: 171 },
  { id: 'esp10_busquets', personId: 'sergio_busquets', nameJa: 'セルヒオ・ブスケツ', nameEn: 'Sergio Busquets', teamId: 'nt_spain', decade: '2010s', year: 2012, position: 'MF', subPosition: 'DMF', rating: 91, isLegendary: false, height: 189 },
  { id: 'esp10_villa', personId: 'david_villa', nameJa: 'ダビド・ビジャ', nameEn: 'David Villa', teamId: 'nt_spain', decade: '2010s', year: 2010, position: 'FW', subPosition: 'CF', rating: 92, isLegendary: true, height: 175 },
  { id: 'esp10_degea', personId: 'david_de_gea', nameJa: 'ダビド・デ・ヘア', nameEn: 'David de Gea', teamId: 'nt_spain', decade: '2010s', year: 2016, position: 'GK', subPosition: 'GK', rating: 88, isLegendary: false, height: 192 },

  // 2020s
  { id: 'esp20_unaisimon', personId: 'unai_simon', nameJa: 'ウナイ・シモン', nameEn: 'Unai Simón', teamId: 'nt_spain', decade: '2020s', year: 2024, position: 'GK', subPosition: 'GK', rating: 86, isLegendary: false, height: 190 },
  { id: 'esp20_carvajal', personId: 'dani_carvajal', nameJa: 'ダニ・カルバハル', nameEn: 'Dani Carvajal', teamId: 'nt_spain', decade: '2020s', year: 2024, position: 'DF', subPosition: 'RB', rating: 88, isLegendary: false, height: 173 },
  { id: 'esp20_rodri', personId: 'rodri', nameJa: 'ロドリ', nameEn: 'Rodri', teamId: 'nt_spain', decade: '2020s', year: 2024, position: 'MF', subPosition: 'DMF', rating: 93, isLegendary: false, height: 191 },
  { id: 'esp20_pedri', personId: 'pedri', nameJa: 'ペドリ', nameEn: 'Pedri', teamId: 'nt_spain', decade: '2020s', year: 2024, position: 'MF', subPosition: 'CMF', rating: 89, isLegendary: false, height: 174 },
  { id: 'esp20_yamal', personId: 'lamine_yamal', nameJa: 'ラミン・ヤマル', nameEn: 'Lamine Yamal', teamId: 'nt_spain', decade: '2020s', year: 2024, position: 'FW', subPosition: 'RWG', rating: 88, isLegendary: false, height: 180 },
  { id: 'esp20_nicowilliams', personId: 'nico_williams', nameJa: 'ニコ・ウィリアムズ', nameEn: 'Nico Williams', teamId: 'nt_spain', decade: '2020s', year: 2024, position: 'FW', subPosition: 'LWG', rating: 87, isLegendary: false, height: 181 },

  // ==================== ITALY 🇮🇹 ====================
  // 1990s
  { id: 'ita90_pagliuca', personId: 'pagliuca', nameJa: 'ジャンルカ・パリュウカ', nameEn: 'Gianluca Pagliuca', teamId: 'nt_italy', decade: '1990s', year: 1994, position: 'GK', subPosition: 'GK', rating: 88, isLegendary: true, height: 190 },
  { id: 'ita90_maldini', personId: 'paolo_maldini', nameJa: 'パオロ・マルディーニ', nameEn: 'Paolo Maldini', teamId: 'nt_italy', decade: '1990s', year: 1994, position: 'DF', subPosition: 'LB', rating: 96, isLegendary: true, height: 186 },
  { id: 'ita90_baresi', personId: 'franco_baresi', nameJa: 'フランコ・バレージ', nameEn: 'Franco Baresi', teamId: 'nt_italy', decade: '1990s', year: 1994, position: 'DF', subPosition: 'CB', rating: 95, isLegendary: true, height: 176 },
  { id: 'ita90_albertini', personId: 'albertini', nameJa: 'デメトリオ・アルベルティーニ', nameEn: 'Demetrio Albertini', teamId: 'nt_italy', decade: '1990s', year: 1994, position: 'MF', subPosition: 'CMF', rating: 88, isLegendary: true, height: 180 },
  { id: 'ita90_baggio', personId: 'roberto_baggio', nameJa: 'ロベルト・バッジョ', nameEn: 'Roberto Baggio', teamId: 'nt_italy', decade: '1990s', year: 1994, position: 'FW', subPosition: 'SS', rating: 95, isLegendary: true, height: 174 },

  // 2000s
  { id: 'ita00_buffon', personId: 'gianluigi_buffon', nameJa: 'ジャンルイジ・ブッフォン', nameEn: 'Gianluigi Buffon', teamId: 'nt_italy', decade: '2000s', year: 2006, position: 'GK', subPosition: 'GK', rating: 95, isLegendary: true, height: 192 },
  { id: 'ita00_cannavaro', personId: 'fabio_cannavaro', nameJa: 'ファビオ・カンナヴァーロ', nameEn: 'Fabio Cannavaro', teamId: 'nt_italy', decade: '2000s', year: 2006, position: 'DF', subPosition: 'CB', rating: 94, isLegendary: true, height: 176 },
  { id: 'ita00_nesta', personId: 'alessandro_nesta', nameJa: 'アレッサンドロ・ネスタ', nameEn: 'Alessandro Nesta', teamId: 'nt_italy', decade: '2000s', year: 2006, position: 'DF', subPosition: 'CB', rating: 93, isLegendary: true, height: 187 },
  { id: 'ita00_pirlo', personId: 'andrea_pirlo', nameJa: 'アンドレア・ピルロ', nameEn: 'Andrea Pirlo', teamId: 'nt_italy', decade: '2000s', year: 2006, position: 'MF', subPosition: 'DMF', rating: 94, isLegendary: true, height: 177 },
  { id: 'ita00_totti', personId: 'francesco_totti', nameJa: 'フランチェスコ・トッティ', nameEn: 'Francesco Totti', teamId: 'nt_italy', decade: '2000s', year: 2006, position: 'FW', subPosition: 'SS', rating: 93, isLegendary: true, height: 180 },
  { id: 'ita00_delpiero', personId: 'del_piero', nameJa: 'アレッサンドロ・デル・ピエロ', nameEn: 'Alessandro Del Piero', teamId: 'nt_italy', decade: '2000s', year: 2006, position: 'FW', subPosition: 'SS', rating: 92, isLegendary: true, height: 174 },

  // 2010s
  { id: 'ita10_sirigu', personId: 'salvatore_sirigu', nameJa: 'サルヴァトーレ・シリグ', nameEn: 'Salvatore Sirigu', teamId: 'nt_italy', decade: '2010s', year: 2014, position: 'GK', subPosition: 'GK', rating: 84, isLegendary: false, height: 192 },
  { id: 'ita10_chiellini', personId: 'chiellini', nameJa: 'ジョルジョ・キエッリーニ', nameEn: 'Giorgio Chiellini', teamId: 'nt_italy', decade: '2010s', year: 2016, position: 'DF', subPosition: 'CB', rating: 91, isLegendary: true, height: 187 },
  { id: 'ita10_bonucci', personId: 'leonardo_bonucci', nameJa: 'レオナルド・ボヌッチ', nameEn: 'Leonardo Bonucci', teamId: 'nt_italy', decade: '2010s', year: 2016, position: 'DF', subPosition: 'CB', rating: 89, isLegendary: true, height: 190 },
  { id: 'ita10_derossi', personId: 'daniele_de_rossi', nameJa: 'ダニエレ・デ・ロッシ', nameEn: 'Daniele De Rossi', teamId: 'nt_italy', decade: '2010s', year: 2012, position: 'MF', subPosition: 'DMF', rating: 88, isLegendary: true, height: 184 },
  { id: 'ita10_balotelli', personId: 'mario_balotelli', nameJa: 'マリオ・バロテッリ', nameEn: 'Mario Balotelli', teamId: 'nt_italy', decade: '2010s', year: 2012, position: 'FW', subPosition: 'CF', rating: 86, isLegendary: false, height: 189 },

  // 2020s
  { id: 'ita20_donnarumma', personId: 'donnarumma', nameJa: 'ジャンルイジ・ドンナルンマ', nameEn: 'Gianluigi Donnarumma', teamId: 'nt_italy', decade: '2020s', year: 2021, position: 'GK', subPosition: 'GK', rating: 90, isLegendary: false, height: 196 },
  { id: 'ita20_bastoni', personId: 'alessandro_bastoni', nameJa: 'アレッサンドロ・バストーニ', nameEn: 'Alessandro Bastoni', teamId: 'nt_italy', decade: '2020s', year: 2024, position: 'DF', subPosition: 'CB', rating: 88, isLegendary: false, height: 190 },
  { id: 'ita20_barella', personId: 'nicolo_barella', nameJa: 'ニコロ・バレッラ', nameEn: 'Nicolò Barella', teamId: 'nt_italy', decade: '2020s', year: 2021, position: 'MF', subPosition: 'CMF', rating: 89, isLegendary: false, height: 175 },
  { id: 'ita20_jorginho', personId: 'jorginho', nameJa: 'ジョルジーニョ', nameEn: 'Jorginho', teamId: 'nt_italy', decade: '2020s', year: 2021, position: 'MF', subPosition: 'DMF', rating: 88, isLegendary: false, height: 180 },
  { id: 'ita20_chiesa', personId: 'federico_chiesa', nameJa: 'フェデリコ・キエーザ', nameEn: 'Federico Chiesa', teamId: 'nt_italy', decade: '2020s', year: 2021, position: 'FW', subPosition: 'RWG', rating: 86, isLegendary: false, height: 175 },

  // ==================== ENGLAND 🏴󠁧󠁢󠁥󠁮󠁧󠁿 ====================
  // 1990s
  { id: 'eng90_seaman', personId: 'david_seaman', nameJa: 'デビッド・シーマン', nameEn: 'David Seaman', teamId: 'nt_england', decade: '1990s', year: 1996, position: 'GK', subPosition: 'GK', rating: 87, isLegendary: true, height: 191 },
  { id: 'eng90_adams', personId: 'tony_adams', nameJa: 'トニー・アダムス', nameEn: 'Tony Adams', teamId: 'nt_england', decade: '1990s', year: 1996, position: 'DF', subPosition: 'CB', rating: 89, isLegendary: true, height: 191 },
  { id: 'eng90_gascoigne', personId: 'paul_gascoigne', nameJa: 'ポール・ガスコイン', nameEn: 'Paul Gascoigne', teamId: 'nt_england', decade: '1990s', year: 1996, position: 'MF', subPosition: 'AMF', rating: 89, isLegendary: true, height: 177 },
  { id: 'eng90_shearer', personId: 'alan_shearer', nameJa: 'アラン・シアラー', nameEn: 'Alan Shearer', teamId: 'nt_england', decade: '1990s', year: 1996, position: 'FW', subPosition: 'CF', rating: 92, isLegendary: true, height: 183 },
  { id: 'eng90_owen', personId: 'michael_owen', nameJa: 'マイケル・オーウェン', nameEn: 'Michael Owen', teamId: 'nt_england', decade: '1990s', year: 1998, position: 'FW', subPosition: 'CF', rating: 89, isLegendary: true, height: 173 },

  // 2000s
  { id: 'eng00_james', personId: 'david_james', nameJa: 'デビッド・ジェームズ', nameEn: 'David James', teamId: 'nt_england', decade: '2000s', year: 2004, position: 'GK', subPosition: 'GK', rating: 84, isLegendary: true, height: 196 },
  { id: 'eng00_terry', personId: 'john_terry', nameJa: 'ジョン・テリー', nameEn: 'John Terry', teamId: 'nt_england', decade: '2000s', year: 2006, position: 'DF', subPosition: 'CB', rating: 91, isLegendary: true, height: 187 },
  { id: 'eng00_rio', personId: 'rio_ferdinand', nameJa: 'リオ・ファーディナンド', nameEn: 'Rio Ferdinand', teamId: 'nt_england', decade: '2000s', year: 2006, position: 'DF', subPosition: 'CB', rating: 91, isLegendary: true, height: 189 },
  { id: 'eng00_ashleycole', personId: 'ashley_cole', nameJa: 'アシュリー・コール', nameEn: 'Ashley Cole', teamId: 'nt_england', decade: '2000s', year: 2006, position: 'DF', subPosition: 'LB', rating: 89, isLegendary: true, height: 176 },
  { id: 'eng00_beckham', personId: 'david_beckham', nameJa: 'デイヴィッド・ベッカム', nameEn: 'David Beckham', teamId: 'nt_england', decade: '2000s', year: 2002, position: 'MF', subPosition: 'RMF', rating: 92, isLegendary: true, height: 183 },
  { id: 'eng00_gerrard', personId: 'steven_gerrard', nameJa: 'スティーヴン・ジェラード', nameEn: 'Steven Gerrard', teamId: 'nt_england', decade: '2000s', year: 2006, position: 'MF', subPosition: 'CMF', rating: 92, isLegendary: true, height: 183 },
  { id: 'eng00_lampard', personId: 'frank_lampard', nameJa: 'フランク・ランパード', nameEn: 'Frank Lampard', teamId: 'nt_england', decade: '2000s', year: 2006, position: 'MF', subPosition: 'CMF', rating: 91, isLegendary: true, height: 184 },
  { id: 'eng00_rooney', personId: 'wayne_rooney', nameJa: 'ウェイン・ルーニー', nameEn: 'Wayne Rooney', teamId: 'nt_england', decade: '2000s', year: 2004, position: 'FW', subPosition: 'CF', rating: 91, isLegendary: true, height: 176 },

  // 2010s
  { id: 'eng10_hart', personId: 'joe_hart', nameJa: 'ジョー・ハート', nameEn: 'Joe Hart', teamId: 'nt_england', decade: '2010s', year: 2014, position: 'GK', subPosition: 'GK', rating: 85, isLegendary: false, height: 196 },
  { id: 'eng10_walker', personId: 'kyle_walker', nameJa: 'カイル・ウォーカー', nameEn: 'Kyle Walker', teamId: 'nt_england', decade: '2010s', year: 2018, position: 'DF', subPosition: 'RB', rating: 87, isLegendary: false, height: 183 },
  { id: 'eng10_henderson', personId: 'jordan_henderson', nameJa: 'ジョーダン・ヘンダーソン', nameEn: 'Jordan Henderson', teamId: 'nt_england', decade: '2010s', year: 2018, position: 'MF', subPosition: 'CMF', rating: 86, isLegendary: false, height: 182 },
  { id: 'eng10_sterling', personId: 'raheem_sterling', nameJa: 'ラヒーム・スターリング', nameEn: 'Raheem Sterling', teamId: 'nt_england', decade: '2010s', year: 2018, position: 'FW', subPosition: 'LWG', rating: 88, isLegendary: false, height: 170 },
  { id: 'eng10_kane', personId: 'harry_kane', nameJa: 'ハリー・ケイン', nameEn: 'Harry Kane', teamId: 'nt_england', decade: '2010s', year: 2018, position: 'FW', subPosition: 'CF', rating: 91, isLegendary: false, height: 188 },

  // 2020s
  { id: 'eng20_pickford', personId: 'jordan_pickford', nameJa: 'ジョーダン・ピックフォード', nameEn: 'Jordan Pickford', teamId: 'nt_england', decade: '2020s', year: 2024, position: 'GK', subPosition: 'GK', rating: 86, isLegendary: false, height: 185 },
  { id: 'eng20_stones', personId: 'john_stones', nameJa: 'ジョン・ストーンズ', nameEn: 'John Stones', teamId: 'nt_england', decade: '2020s', year: 2024, position: 'DF', subPosition: 'CB', rating: 88, isLegendary: false, height: 188 },
  { id: 'eng20_rice', personId: 'declan_rice', nameJa: 'デクラン・ライス', nameEn: 'Declan Rice', teamId: 'nt_england', decade: '2020s', year: 2024, position: 'MF', subPosition: 'DMF', rating: 89, isLegendary: false, height: 185 },
  { id: 'eng20_bellingham', personId: 'jude_bellingham', nameJa: 'ジュード・ベリンガム', nameEn: 'Jude Bellingham', teamId: 'nt_england', decade: '2020s', year: 2024, position: 'MF', subPosition: 'AMF', rating: 91, isLegendary: false, height: 186 },
  { id: 'eng20_foden', personId: 'phil_foden', nameJa: 'フィル・フォーデン', nameEn: 'Phil Foden', teamId: 'nt_england', decade: '2020s', year: 2024, position: 'MF', subPosition: 'AMF', rating: 89, isLegendary: false, height: 171 },
  { id: 'eng20_saka', personId: 'bukayo_saka', nameJa: 'ブカヨ・サカ', nameEn: 'Bukayo Saka', teamId: 'nt_england', decade: '2020s', year: 2024, position: 'FW', subPosition: 'RWG', rating: 89, isLegendary: false, height: 178 },

  // ==================== NETHERLANDS 🇳🇱 ====================
  // 1990s
  { id: 'ned90_vandersar', personId: 'van_der_sar', nameJa: 'エドウィン・ファン・デル・サール', nameEn: 'Edwin van der Sar', teamId: 'nt_netherlands', decade: '1990s', year: 1998, position: 'GK', subPosition: 'GK', rating: 91, isLegendary: true, height: 197 },
  { id: 'ned90_stam', personId: 'jaap_stam', nameJa: 'ヤープ・スタム', nameEn: 'Jaap Stam', teamId: 'nt_netherlands', decade: '1990s', year: 1998, position: 'DF', subPosition: 'CB', rating: 91, isLegendary: true, height: 191 },
  { id: 'ned90_seedorf', personId: 'clarence_seedorf', nameJa: 'クラレンス・セードルフ', nameEn: 'Clarence Seedorf', teamId: 'nt_netherlands', decade: '1990s', year: 1998, position: 'MF', subPosition: 'CMF', rating: 90, isLegendary: true, height: 176 },
  { id: 'ned90_bergkamp', personId: 'dennis_bergkamp', nameJa: 'デニス・ベルカンプ', nameEn: 'Dennis Bergkamp', teamId: 'nt_netherlands', decade: '1990s', year: 1998, position: 'FW', subPosition: 'SS', rating: 93, isLegendary: true, height: 183 },
  { id: 'ned90_kluivert', personId: 'patrick_kluivert', nameJa: 'パトリック・クライファート', nameEn: 'Patrick Kluivert', teamId: 'nt_netherlands', decade: '1990s', year: 1998, position: 'FW', subPosition: 'CF', rating: 90, isLegendary: true, height: 188 },

  // 2000s
  { id: 'ned00_steekelenburg', personId: 'stekelenburg', nameJa: 'マールテン・ステケレンブルフ', nameEn: 'Maarten Stekelenburg', teamId: 'nt_netherlands', decade: '2000s', year: 2009, position: 'GK', subPosition: 'GK', rating: 84, isLegendary: false, height: 197 },
  { id: 'ned00_bronckhorst', personId: 'van_bronckhorst', nameJa: 'ジョバンニ・ファン・ブロンクホルスト', nameEn: 'Giovanni van Bronckhorst', teamId: 'nt_netherlands', decade: '2000s', year: 2008, position: 'DF', subPosition: 'LB', rating: 86, isLegendary: true, height: 178 },
  { id: 'ned00_sneijder', personId: 'wesley_sneijder', nameJa: 'ウェズレイ・スナイデル', nameEn: 'Wesley Sneijder', teamId: 'nt_netherlands', decade: '2000s', year: 2008, position: 'MF', subPosition: 'AMF', rating: 91, isLegendary: true, height: 170 },
  { id: 'ned00_vannistelrooy', personId: 'van_nistelrooy', nameJa: 'ルート・ファン・ニステルローイ', nameEn: 'Ruud van Nistelrooy', teamId: 'nt_netherlands', decade: '2000s', year: 2004, position: 'FW', subPosition: 'CF', rating: 92, isLegendary: true, height: 188 },
  { id: 'ned00_robben', personId: 'arjen_robben', nameJa: 'アリエン・ロッベン', nameEn: 'Arjen Robben', teamId: 'nt_netherlands', decade: '2000s', year: 2008, position: 'FW', subPosition: 'RWG', rating: 92, isLegendary: true, height: 180 },

  // 2010s
  { id: 'ned10_cillessen', personId: 'jasper_cillessen', nameJa: 'ヤスパー・シレッセン', nameEn: 'Jasper Cillessen', teamId: 'nt_netherlands', decade: '2010s', year: 2014, position: 'GK', subPosition: 'GK', rating: 84, isLegendary: false, height: 185 },
  { id: 'ned10_dejong_n', personId: 'nigel_de_jong', nameJa: 'ナイジェル・デ・ヨング', nameEn: 'Nigel de Jong', teamId: 'nt_netherlands', decade: '2010s', year: 2010, position: 'MF', subPosition: 'DMF', rating: 85, isLegendary: false, height: 174 },
  { id: 'ned10_vanpersie', personId: 'robin_van_persie', nameJa: 'ロビン・ファン・ペルシ', nameEn: 'Robin van Persie', teamId: 'nt_netherlands', decade: '2010s', year: 2014, position: 'FW', subPosition: 'CF', rating: 91, isLegendary: true, height: 183 },
  { id: 'ned10_vandijk', personId: 'virgil_van_dijk', nameJa: 'フィルジル・ファン・ダイク', nameEn: 'Virgil van Dijk', teamId: 'nt_netherlands', decade: '2010s', year: 2019, position: 'DF', subPosition: 'CB', rating: 93, isLegendary: false, height: 195 },

  // 2020s
  { id: 'ned20_verbruggen', personId: 'bart_verbruggen', nameJa: 'バルト・フェルブルッヘン', nameEn: 'Bart Verbruggen', teamId: 'nt_netherlands', decade: '2020s', year: 2024, position: 'GK', subPosition: 'GK', rating: 83, isLegendary: false, height: 193 },
  { id: 'ned20_ake', personId: 'nathan_ake', nameJa: 'ナタン・アケ', nameEn: 'Nathan Aké', teamId: 'nt_netherlands', decade: '2020s', year: 2024, position: 'DF', subPosition: 'CB', rating: 86, isLegendary: false, height: 180 },
  { id: 'ned20_dejong_f', personId: 'frenkie_de_jong', nameJa: 'フレンキー・デ・ヨング', nameEn: 'Frenkie de Jong', teamId: 'nt_netherlands', decade: '2020s', year: 2022, position: 'MF', subPosition: 'CMF', rating: 88, isLegendary: false, height: 181 },
  { id: 'ned20_reijnders', personId: 'tijjani_reijnders', nameJa: 'ティジャニ・ラインデルス', nameEn: 'Tijjani Reijnders', teamId: 'nt_netherlands', decade: '2020s', year: 2024, position: 'MF', subPosition: 'CMF', rating: 86, isLegendary: false, height: 185 },
  { id: 'ned20_gakpo', personId: 'cody_gakpo', nameJa: 'コーディ・ガクポ', nameEn: 'Cody Gakpo', teamId: 'nt_netherlands', decade: '2020s', year: 2024, position: 'FW', subPosition: 'LWG', rating: 86, isLegendary: false, height: 193 },

  // ==================== PORTUGAL 🇵🇹 ====================
  // 1990s
  { id: 'por90_baia', personId: 'vitor_baia', nameJa: 'ヴィトール・バイーア', nameEn: 'Vítor Baía', teamId: 'nt_portugal', decade: '1990s', year: 1996, position: 'GK', subPosition: 'GK', rating: 87, isLegendary: true, height: 184 },
  { id: 'por90_couto', personId: 'fernando_couto', nameJa: 'フェルナンド・コウト', nameEn: 'Fernando Couto', teamId: 'nt_portugal', decade: '1990s', year: 1996, position: 'DF', subPosition: 'CB', rating: 87, isLegendary: true, height: 187 },
  { id: 'por90_ruicosta', personId: 'rui_costa', nameJa: 'ルイ・コスタ', nameEn: 'Rui Costa', teamId: 'nt_portugal', decade: '1990s', year: 1996, position: 'MF', subPosition: 'AMF', rating: 90, isLegendary: true, height: 180 },
  { id: 'por90_figo', personId: 'luis_figo', nameJa: 'ルイス・フィーゴ', nameEn: 'Luís Figo', teamId: 'nt_portugal', decade: '1990s', year: 1999, position: 'FW', subPosition: 'RWG', rating: 94, isLegendary: true, height: 180 },
  { id: 'por90_joaopinto', personId: 'joao_pinto', nameJa: 'ジョアン・ピント', nameEn: 'João Pinto', teamId: 'nt_portugal', decade: '1990s', year: 1996, position: 'FW', subPosition: 'SS', rating: 86, isLegendary: true, height: 171 },

  // 2000s
  { id: 'por00_ricardo', personId: 'ricardo_pereira_gk', nameJa: 'リカルド', nameEn: 'Ricardo', teamId: 'nt_portugal', decade: '2000s', year: 2004, position: 'GK', subPosition: 'GK', rating: 85, isLegendary: true, height: 185 },
  { id: 'por00_carvalho', personId: 'ricardo_carvalho', nameJa: 'リカルド・カルヴァーリョ', nameEn: 'Ricardo Carvalho', teamId: 'nt_portugal', decade: '2000s', year: 2004, position: 'DF', subPosition: 'CB', rating: 90, isLegendary: true, height: 183 },
  { id: 'por00_deco', personId: 'deco', nameJa: 'デコ', nameEn: 'Deco', teamId: 'nt_portugal', decade: '2000s', year: 2004, position: 'MF', subPosition: 'AMF', rating: 91, isLegendary: true, height: 174 },
  { id: 'por00_pauleta', personId: 'pauleta', nameJa: 'ペドロ・パウレタ', nameEn: 'Pauleta', teamId: 'nt_portugal', decade: '2000s', year: 2006, position: 'FW', subPosition: 'CF', rating: 87, isLegendary: true, height: 180 },

  // 2010s
  { id: 'por10_patricio', personId: 'rui_patricio', nameJa: 'ルイ・パトリシオ', nameEn: 'Rui Patrício', teamId: 'nt_portugal', decade: '2010s', year: 2016, position: 'GK', subPosition: 'GK', rating: 86, isLegendary: false, height: 190 },
  { id: 'por10_pepe', personId: 'pepe', nameJa: 'ペペ', nameEn: 'Pepe', teamId: 'nt_portugal', decade: '2010s', year: 2016, position: 'DF', subPosition: 'CB', rating: 90, isLegendary: false, height: 188 },
  { id: 'por10_moutinho', personId: 'joao_moutinho', nameJa: 'ジョアン・モウティーニョ', nameEn: 'João Moutinho', teamId: 'nt_portugal', decade: '2010s', year: 2016, position: 'MF', subPosition: 'CMF', rating: 86, isLegendary: false, height: 170 },
  { id: 'por10_cronaldo', personId: 'c_ronaldo', nameJa: 'クリスティアーノ・ロナウド', nameEn: 'Cristiano Ronaldo', teamId: 'nt_portugal', decade: '2010s', year: 2016, position: 'FW', subPosition: 'CF', rating: 97, isLegendary: false, height: 187 },

  // 2020s
  { id: 'por20_diogocosta', personId: 'diogo_costa', nameJa: 'ディオゴ・コスタ', nameEn: 'Diogo Costa', teamId: 'nt_portugal', decade: '2020s', year: 2024, position: 'GK', subPosition: 'GK', rating: 86, isLegendary: false, height: 186 },
  { id: 'por20_rubendias', personId: 'ruben_dias', nameJa: 'ルベン・ディアス', nameEn: 'Rúben Dias', teamId: 'nt_portugal', decade: '2020s', year: 2024, position: 'DF', subPosition: 'CB', rating: 90, isLegendary: false, height: 187 },
  { id: 'por20_bruno', personId: 'bruno_fernandes', nameJa: 'ブルーノ・フェルナンデス', nameEn: 'Bruno Fernandes', teamId: 'nt_portugal', decade: '2020s', year: 2024, position: 'MF', subPosition: 'AMF', rating: 89, isLegendary: false, height: 179 },
  { id: 'por20_bernardo', personId: 'bernardo_silva', nameJa: 'ベルナルド・シウバ', nameEn: 'Bernardo Silva', teamId: 'nt_portugal', decade: '2020s', year: 2024, position: 'MF', subPosition: 'AMF', rating: 89, isLegendary: false, height: 173 },
  { id: 'por20_vitinha', personId: 'vitinha', nameJa: 'ヴィティーニャ', nameEn: 'Vitinha', teamId: 'nt_portugal', decade: '2020s', year: 2025, position: 'MF', subPosition: 'CMF', rating: 89, isLegendary: false, height: 172 },
  { id: 'por20_leao', personId: 'rafael_leao', nameJa: 'ラファエル・レオン', nameEn: 'Rafael Leão', teamId: 'nt_portugal', decade: '2020s', year: 2024, position: 'FW', subPosition: 'LWG', rating: 87, isLegendary: false, height: 188 },

  // ==================== JAPAN 🇯🇵 ====================
  // 1990s
  { id: 'jpn90_kawaguchi', personId: 'yoshikatsu_kawaguchi', nameJa: '川口能活', nameEn: 'Yoshikatsu Kawaguchi', teamId: 'nt_japan', decade: '1990s', year: 1998, position: 'GK', subPosition: 'GK', rating: 83, isLegendary: true, height: 180 },
  { id: 'jpn90_ihara', personId: 'masami_ihara', nameJa: '井原正巳', nameEn: 'Masami Ihara', teamId: 'nt_japan', decade: '1990s', year: 1998, position: 'DF', subPosition: 'CB', rating: 83, isLegendary: true, height: 182 },
  { id: 'jpn90_akita', personId: 'yutaka_akita', nameJa: '秋田豊', nameEn: 'Yutaka Akita', teamId: 'nt_japan', decade: '1990s', year: 1998, position: 'DF', subPosition: 'CB', rating: 81, isLegendary: true, height: 180 },
  { id: 'jpn90_nakata', personId: 'hidetoshi_nakata', nameJa: '中田英寿', nameEn: 'Hidetoshi Nakata', teamId: 'nt_japan', decade: '1990s', year: 1998, position: 'MF', subPosition: 'AMF', rating: 87, isLegendary: true, height: 175 },
  { id: 'jpn90_nanami', personId: 'hiroshi_nanami', nameJa: '名波浩', nameEn: 'Hiroshi Nanami', teamId: 'nt_japan', decade: '1990s', year: 1998, position: 'MF', subPosition: 'CMF', rating: 84, isLegendary: true, height: 177 },
  { id: 'jpn90_miura', personId: 'kazuyoshi_miura', nameJa: '三浦知良', nameEn: 'Kazuyoshi Miura', teamId: 'nt_japan', decade: '1990s', year: 1993, position: 'FW', subPosition: 'CF', rating: 84, isLegendary: false, height: 177 },

  // 2000s
  { id: 'jpn00_narazaki', personId: 'seigo_narazaki', nameJa: '楢崎正剛', nameEn: 'Seigo Narazaki', teamId: 'nt_japan', decade: '2000s', year: 2002, position: 'GK', subPosition: 'GK', rating: 83, isLegendary: true, height: 187 },
  { id: 'jpn00_miyamoto', personId: 'tsuneyasu_miyamoto', nameJa: '宮本恒靖', nameEn: 'Tsuneyasu Miyamoto', teamId: 'nt_japan', decade: '2000s', year: 2002, position: 'DF', subPosition: 'CB', rating: 82, isLegendary: true, height: 176 },
  { id: 'jpn00_nakazawa', personId: 'yuji_nakazawa', nameJa: '中澤佑二', nameEn: 'Yuji Nakazawa', teamId: 'nt_japan', decade: '2000s', year: 2006, position: 'DF', subPosition: 'CB', rating: 84, isLegendary: true, height: 187 },
  { id: 'jpn00_nakamura', personId: 'shunsuke_nakamura', nameJa: '中村俊輔', nameEn: 'Shunsuke Nakamura', teamId: 'nt_japan', decade: '2000s', year: 2006, position: 'MF', subPosition: 'AMF', rating: 87, isLegendary: true, height: 178 },
  { id: 'jpn00_ono', personId: 'shinji_ono', nameJa: '小野伸二', nameEn: 'Shinji Ono', teamId: 'nt_japan', decade: '2000s', year: 2002, position: 'MF', subPosition: 'CMF', rating: 86, isLegendary: true, height: 175 },
  { id: 'jpn00_inamoto', personId: 'junichi_inamoto', nameJa: '稲本潤一', nameEn: 'Junichi Inamoto', teamId: 'nt_japan', decade: '2000s', year: 2002, position: 'MF', subPosition: 'DMF', rating: 82, isLegendary: true, height: 181 },
  { id: 'jpn00_takahara', personId: 'naohiro_takahara', nameJa: '高原直泰', nameEn: 'Naohiro Takahara', teamId: 'nt_japan', decade: '2000s', year: 2006, position: 'FW', subPosition: 'CF', rating: 83, isLegendary: true, height: 181 },

  // 2010s
  { id: 'jpn10_kawashima', personId: 'eiji_kawashima', nameJa: '川島永嗣', nameEn: 'Eiji Kawashima', teamId: 'nt_japan', decade: '2010s', year: 2010, position: 'GK', subPosition: 'GK', rating: 82, isLegendary: false, height: 185 },
  { id: 'jpn10_nagatomo', personId: 'yuto_nagatomo', nameJa: '長友佑都', nameEn: 'Yuto Nagatomo', teamId: 'nt_japan', decade: '2010s', year: 2014, position: 'DF', subPosition: 'LB', rating: 84, isLegendary: false, height: 170 },
  { id: 'jpn10_uchida', personId: 'atsuto_uchida', nameJa: '内田篤人', nameEn: 'Atsuto Uchida', teamId: 'nt_japan', decade: '2010s', year: 2014, position: 'DF', subPosition: 'RB', rating: 83, isLegendary: true, height: 176 },
  { id: 'jpn10_yoshida', personId: 'maya_yoshida', nameJa: '吉田麻也', nameEn: 'Maya Yoshida', teamId: 'nt_japan', decade: '2010s', year: 2018, position: 'DF', subPosition: 'CB', rating: 83, isLegendary: false, height: 189 },
  { id: 'jpn10_hasebe', personId: 'makoto_hasebe', nameJa: '長谷部誠', nameEn: 'Makoto Hasebe', teamId: 'nt_japan', decade: '2010s', year: 2018, position: 'MF', subPosition: 'DMF', rating: 84, isLegendary: true, height: 180 },
  { id: 'jpn10_honda', personId: 'keisuke_honda', nameJa: '本田圭佑', nameEn: 'Keisuke Honda', teamId: 'nt_japan', decade: '2010s', year: 2010, position: 'MF', subPosition: 'AMF', rating: 86, isLegendary: true, height: 182 },
  { id: 'jpn10_kagawa', personId: 'shinji_kagawa', nameJa: '香川真司', nameEn: 'Shinji Kagawa', teamId: 'nt_japan', decade: '2010s', year: 2012, position: 'MF', subPosition: 'AMF', rating: 87, isLegendary: false, height: 175 },
  { id: 'jpn10_okazaki', personId: 'shinji_okazaki', nameJa: '岡崎慎司', nameEn: 'Shinji Okazaki', teamId: 'nt_japan', decade: '2010s', year: 2016, position: 'FW', subPosition: 'CF', rating: 84, isLegendary: true, height: 174 },

  // 2020s (Current SAMURAI BLUE Star Squad)
  { id: 'jpn20_suzuki', personId: 'zion_suzuki', nameJa: '鈴木彩艶', nameEn: 'Zion Suzuki', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'GK', subPosition: 'GK', rating: 85, isLegendary: false, height: 190 },
  { id: 'jpn20_tomiyasu', personId: 'takehiro_tomiyasu', nameJa: '冨安健洋', nameEn: 'Takehiro Tomiyasu', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'DF', subPosition: 'CB', rating: 85, isLegendary: false, height: 188 },
  { id: 'jpn20_itakura', personId: 'ko_itakura', nameJa: '板倉滉', nameEn: 'Ko Itakura', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'DF', subPosition: 'CB', rating: 85, isLegendary: false, height: 188 },
  { id: 'jpn20_endo', personId: 'wataru_endo', nameJa: '遠藤航', nameEn: 'Wataru Endo', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'MF', subPosition: 'DMF', rating: 86, isLegendary: false, height: 178 },
  { id: 'jpn20_morita', personId: 'hidemasa_morita', nameJa: '守田英正', nameEn: 'Hidemasa Morita', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'MF', subPosition: 'CMF', rating: 85, isLegendary: false, height: 177 },
  { id: 'jpn20_minamino', personId: 'takumi_minamino', nameJa: '南野拓実', nameEn: 'Takumi Minamino', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'MF', subPosition: 'AMF', rating: 85, isLegendary: false, height: 174 },
  { id: 'jpn20_kamada', personId: 'daichi_kamada', nameJa: '鎌田大地', nameEn: 'Daichi Kamada', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'MF', subPosition: 'AMF', rating: 85, isLegendary: false, height: 184 },
  { id: 'jpn20_mitoma', personId: 'kaoru_mitoma', nameJa: '三笘薫', nameEn: 'Kaoru Mitoma', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'FW', subPosition: 'LWG', rating: 86, isLegendary: false, height: 178 },
  { id: 'jpn20_kubo', personId: 'takefusa_kubo', nameJa: '久保建英', nameEn: 'Takefusa Kubo', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'FW', subPosition: 'RWG', rating: 86, isLegendary: false, height: 173 },
  { id: 'jpn20_doan', personId: 'ritsu_doan', nameJa: '堂安律', nameEn: 'Ritsu Doan', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'FW', subPosition: 'RWG', rating: 85, isLegendary: false, height: 172 },
  { id: 'jpn20_ito', personId: 'junya_ito', nameJa: '伊東純也', nameEn: 'Junya Ito', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'FW', subPosition: 'RWG', rating: 85, isLegendary: false, height: 176 },
  { id: 'jpn20_ueda', personId: 'ayase_ueda', nameJa: '上田綺世', nameEn: 'Ayase Ueda', teamId: 'nt_japan', decade: '2020s', year: 2025, position: 'FW', subPosition: 'CF', rating: 85, isLegendary: false, height: 182 },

  // ==================== CROATIA 🇭🇷 ====================
  // 1990s
  { id: 'cro90_ladic', personId: 'drazen_ladic', nameJa: 'ドラジェン・ラディッチ', nameEn: 'Dražen Ladić', teamId: 'nt_croatia', decade: '1990s', year: 1998, position: 'GK', subPosition: 'GK', rating: 83, isLegendary: true, height: 186 },
  { id: 'cro90_bilic', personId: 'slaven_bilic', nameJa: 'スラヴェン・ビリッチ', nameEn: 'Slaven Bilić', teamId: 'nt_croatia', decade: '1990s', year: 1998, position: 'DF', subPosition: 'CB', rating: 84, isLegendary: true, height: 189 },
  { id: 'cro90_boban', personId: 'zvonimir_boban', nameJa: 'ズボニミール・ボバン', nameEn: 'Zvonimir Boban', teamId: 'nt_croatia', decade: '1990s', year: 1998, position: 'MF', subPosition: 'AMF', rating: 90, isLegendary: true, height: 185 },
  { id: 'cro90_prosinecki', personId: 'prosinecki', nameJa: 'ロベルト・プロシネツキ', nameEn: 'Robert Prosinečki', teamId: 'nt_croatia', decade: '1990s', year: 1998, position: 'MF', subPosition: 'CMF', rating: 88, isLegendary: true, height: 182 },
  { id: 'cro90_suker', personId: 'davor_suker', nameJa: 'ダヴォール・シュケル', nameEn: 'Davor Šuker', teamId: 'nt_croatia', decade: '1990s', year: 1998, position: 'FW', subPosition: 'CF', rating: 92, isLegendary: true, height: 183 },

  // 2000s
  { id: 'cro00_pletikosa', personId: 'stipe_pletikosa', nameJa: 'スティペ・プレティコサ', nameEn: 'Stipe Pletikosa', teamId: 'nt_croatia', decade: '2000s', year: 2008, position: 'GK', subPosition: 'GK', rating: 82, isLegendary: true, height: 193 },
  { id: 'cro00_srna', personId: 'darijo_srna', nameJa: 'ダリヨ・スルナ', nameEn: 'Darijo Srna', teamId: 'nt_croatia', decade: '2000s', year: 2008, position: 'DF', subPosition: 'RB', rating: 86, isLegendary: true, height: 182 },
  { id: 'cro00_kovac_n', personId: 'niko_kovac', nameJa: 'ニコ・コヴァチ', nameEn: 'Niko Kovač', teamId: 'nt_croatia', decade: '2000s', year: 2006, position: 'MF', subPosition: 'DMF', rating: 84, isLegendary: true, height: 176 },
  { id: 'cro00_prso', personId: 'dado_prso', nameJa: 'ダド・プルショ', nameEn: 'Dado Pršo', teamId: 'nt_croatia', decade: '2000s', year: 2004, position: 'FW', subPosition: 'CF', rating: 84, isLegendary: true, height: 190 },

  // 2010s
  { id: 'cro10_subasic', personId: 'danijel_subasic', nameJa: 'ダニエル・スバシッチ', nameEn: 'Danijel Subašić', teamId: 'nt_croatia', decade: '2010s', year: 2018, position: 'GK', subPosition: 'GK', rating: 86, isLegendary: true, height: 191 },
  { id: 'cro10_modric', personId: 'luka_modric', nameJa: 'ルカ・モドリッチ', nameEn: 'Luka Modrić', teamId: 'nt_croatia', decade: '2010s', year: 2018, position: 'MF', subPosition: 'CMF', rating: 95, isLegendary: false, height: 172 },
  { id: 'cro10_rakitic', personId: 'ivan_rakitic', nameJa: 'イヴァン・ラキティッチ', nameEn: 'Ivan Rakitić', teamId: 'nt_croatia', decade: '2010s', year: 2018, position: 'MF', subPosition: 'CMF', rating: 89, isLegendary: false, height: 184 },
  { id: 'cro10_perisic', personId: 'ivan_perisic', nameJa: 'イヴァン・ペリシッチ', nameEn: 'Ivan Perišić', teamId: 'nt_croatia', decade: '2010s', year: 2018, position: 'FW', subPosition: 'LWG', rating: 88, isLegendary: false, height: 186 },
  { id: 'cro10_mandzukic', personId: 'mario_mandzukic', nameJa: 'マリオ・マンジュキッチ', nameEn: 'Mario Mandžukić', teamId: 'nt_croatia', decade: '2010s', year: 2018, position: 'FW', subPosition: 'CF', rating: 88, isLegendary: true, height: 190 },

  // 2020s
  { id: 'cro20_livakovic', personId: 'livakovic', nameJa: 'ドミニク・リヴァコヴィッチ', nameEn: 'Dominik Livaković', teamId: 'nt_croatia', decade: '2020s', year: 2022, position: 'GK', subPosition: 'GK', rating: 85, isLegendary: false, height: 188 },
  { id: 'cro20_gvardiol', personId: 'josko_gvardiol', nameJa: 'ヨシュコ・グヴァルディオル', nameEn: 'Joško Gvardiol', teamId: 'nt_croatia', decade: '2020s', year: 2024, position: 'DF', subPosition: 'CB', rating: 87, isLegendary: false, height: 185 },
  { id: 'cro20_kovacic', personId: 'mateo_kovacic', nameJa: 'マテオ・コヴァチッチ', nameEn: 'Mateo Kovačić', teamId: 'nt_croatia', decade: '2020s', year: 2022, position: 'MF', subPosition: 'CMF', rating: 86, isLegendary: false, height: 177 },
  { id: 'cro20_brozovic', personId: 'marcelo_brozovic', nameJa: 'マルセロ・ブロゾヴィッチ', nameEn: 'Marcelo Brozović', teamId: 'nt_croatia', decade: '2020s', year: 2022, position: 'MF', subPosition: 'DMF', rating: 86, isLegendary: false, height: 181 },

  // ==================== BELGIUM 🇧🇪 (2010s & 2020s ONLY — 1990s & 2000s intentionally empty) ====================
  // 2010s
  { id: 'bel10_courtois', personId: 'thibaut_courtois', nameJa: 'ティボ・クルトゥワ', nameEn: 'Thibaut Courtois', teamId: 'nt_belgium', decade: '2010s', year: 2018, position: 'GK', subPosition: 'GK', rating: 92, isLegendary: false, height: 200 },
  { id: 'bel10_kompany', personId: 'vincent_kompany', nameJa: 'ヴァンサン・コンパニ', nameEn: 'Vincent Kompany', teamId: 'nt_belgium', decade: '2010s', year: 2018, position: 'DF', subPosition: 'CB', rating: 90, isLegendary: true, height: 190 },
  { id: 'bel10_vertonghen', personId: 'jan_vertonghen', nameJa: 'ヤン・フェルトンゲン', nameEn: 'Jan Vertonghen', teamId: 'nt_belgium', decade: '2010s', year: 2018, position: 'DF', subPosition: 'CB', rating: 87, isLegendary: false, height: 189 },
  { id: 'bel10_debruyne', personId: 'kevin_de_bruyne', nameJa: 'ケヴィン・デ・ブライネ', nameEn: 'Kevin De Bruyne', teamId: 'nt_belgium', decade: '2010s', year: 2018, position: 'MF', subPosition: 'AMF', rating: 93, isLegendary: false, height: 181 },
  { id: 'bel10_hazard', personId: 'eden_hazard', nameJa: 'エデン・アザール', nameEn: 'Eden Hazard', teamId: 'nt_belgium', decade: '2010s', year: 2018, position: 'FW', subPosition: 'LWG', rating: 93, isLegendary: true, height: 175 },
  { id: 'bel10_lukaku', personId: 'romelu_lukaku', nameJa: 'ロメル・ルカク', nameEn: 'Romelu Lukaku', teamId: 'nt_belgium', decade: '2010s', year: 2018, position: 'FW', subPosition: 'CF', rating: 88, isLegendary: false, height: 191 },

  // 2020s
  { id: 'bel20_casteels', personId: 'koen_casteels', nameJa: 'クーン・カステールス', nameEn: 'Koen Casteels', teamId: 'nt_belgium', decade: '2020s', year: 2024, position: 'GK', subPosition: 'GK', rating: 84, isLegendary: false, height: 197 },
  { id: 'bel20_theate', personId: 'arthur_theate', nameJa: 'アルトゥール・テアテ', nameEn: 'Arthur Theate', teamId: 'nt_belgium', decade: '2020s', year: 2024, position: 'DF', subPosition: 'CB', rating: 82, isLegendary: false, height: 185 },
  { id: 'bel20_onana', personId: 'amadou_onana', nameJa: 'アマドゥ・オナナ', nameEn: 'Amadou Onana', teamId: 'nt_belgium', decade: '2020s', year: 2024, position: 'MF', subPosition: 'DMF', rating: 84, isLegendary: false, height: 195 },
  { id: 'bel20_trossard', personId: 'leandro_trossard', nameJa: 'レアンドロ・トロサール', nameEn: 'Leandro Trossard', teamId: 'nt_belgium', decade: '2020s', year: 2024, position: 'FW', subPosition: 'LWG', rating: 85, isLegendary: false, height: 172 },
  { id: 'bel20_doku', personId: 'jeremy_doku', nameJa: 'ジェレミー・ドク', nameEn: 'Jérémy Doku', teamId: 'nt_belgium', decade: '2020s', year: 2024, position: 'FW', subPosition: 'LWG', rating: 85, isLegendary: false, height: 173 },
];

// Deduplicate & materialize
export const NATIONAL_ERA_PLAYERS: Player[] = (() => {
  const seen = new Set<string>();
  const result: Player[] = [];
  for (const seed of RAW_NATIONAL_SEEDS) {
    const p = toPlayer(seed);
    if (!seen.has(p.playerId)) {
      seen.add(p.playerId);
      result.push(p);
    }
  }
  return result;
})();

export function getNationalPlayers(decade: NationalDecade, nationalTeamId: string): Player[] {
  return NATIONAL_ERA_PLAYERS.filter(
    (p) => p.eraDecade === decade && p.nationalTeamId === nationalTeamId
  );
}

/**
 * Returns strictly active, current-era (2020s) Japan National Team STAR players.
 * Excludes retired legends, non-selected players, and non-STAR players.
 */
export function getCurrentJapanStarPool(): Player[] {
  return NATIONAL_ERA_PLAYERS.filter(
    (p) =>
      p.nationalTeamId === 'nt_japan' &&
      p.eraDecade === '2020s' &&
      p.nationalityEn === 'Japan' &&
      p.category === 'STAR' &&
      !p.isLegendary
  );
}

export function findNationalEraCandidates(
  decade: NationalDecade,
  nationalTeamId: string,
  excludePlayerIds: string[] = [],
  excludePersonIds: string[] = [],
  disallowedPositions: MainPosition[] = []
): Player[] {
  const excludedPlayerSet = new Set(excludePlayerIds);
  const excludedPersonSet = new Set(excludePersonIds);
  const disallowedSet = new Set<MainPosition>(disallowedPositions);

  const matching = NATIONAL_ERA_PLAYERS.filter((p) => {
    if (p.eraDecade !== decade || p.nationalTeamId !== nationalTeamId) return false;
    if (disallowedSet.has(p.position)) return false;
    if (excludedPlayerSet.has(p.playerId) || excludedPersonSet.has(p.personId)) return false;
    return true;
  });

  // Return up to 4 shuffled candidates for clean UI presentation
  return [...matching].sort(() => Math.random() - 0.5).slice(0, 4);
}

export const MIN_NATIONAL_ERA_COMBO_PLAYERS = 4;

export function getPopulatedNationalEraCombos(
  excludePlayerIds: string[] = [],
  excludePersonIds: string[] = [],
  disallowedPositions: MainPosition[] = []
): { decade: NationalDecade; team: NationalTeam; remainingCount: number; totalCount: number }[] {
  const excludedPlayerSet = new Set(excludePlayerIds);
  const excludedPersonSet = new Set(excludePersonIds);
  const disallowedSet = new Set<MainPosition>(disallowedPositions);

  const combos: { decade: NationalDecade; team: NationalTeam; remainingCount: number; totalCount: number }[] = [];

  for (const dec of NATIONAL_DECADES) {
    for (const team of NATIONAL_TEAMS) {
      const roster = NATIONAL_ERA_PLAYERS.filter(
        (p) => p.eraDecade === dec.id && p.nationalTeamId === team.id
      );
      if (roster.length < MIN_NATIONAL_ERA_COMBO_PLAYERS) {
        continue;
      }
      const eligible = roster.filter(
        (p) =>
          !disallowedSet.has(p.position) &&
          !excludedPlayerSet.has(p.playerId) &&
          !excludedPersonSet.has(p.personId)
      );
      if (eligible.length > 0) {
        combos.push({
          decade: dec.id,
          team,
          remainingCount: eligible.length,
          totalCount: roster.length,
        });
      }
    }
  }

  return combos;
}

export function pickRandomNationalEraCombo(
  excludePlayerIds: string[] = [],
  excludePersonIds: string[] = [],
  disallowedPositions: MainPosition[] = []
): { decade: NationalDecade; team: NationalTeam } {
  const validCombos = getPopulatedNationalEraCombos(
    excludePlayerIds,
    excludePersonIds,
    disallowedPositions
  );

  // Prefer combinations with >= 2 eligible players remaining so picks feel rich
  const richCombos = validCombos.filter((c) => c.remainingCount >= 2);
  const pool = richCombos.length > 0 ? richCombos : validCombos;

  if (pool.length > 0) {
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return {
      decade: picked.decade,
      team: picked.team,
    };
  }

  // Fallback strictly from verified populated combos (>= MIN_NATIONAL_ERA_COMBO_PLAYERS)
  const allPopulated = getPopulatedNationalEraCombos([], [], []);
  const fallback = allPopulated[Math.floor(Math.random() * allPopulated.length)];
  return {
    decade: fallback.decade,
    team: fallback.team,
  };
}
