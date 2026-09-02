import { Player } from '../types';

/**
 * Verified real-world player heights in centimeters (cm)
 */
export const PLAYER_HEIGHTS: Record<string, number> = {
  // Giant & Aerial Target Legends
  j_koller: 202,
  p_crouch: 201,
  t_courtois: 200,
  g_donnarumma: 196,
  z_ibrahimovic: 195,
  e_haaland: 194,
  v_van_dijk: 193,
  m_neuer: 193,
  g_buffon: 192,
  rodri: 191,
  d_de_gea: 192,
  a_becker: 193,
  p_cech: 196,
  e_van_der_sar: 197,
  o_kahn: 188,
  i_casillas: 182,
  d_seaman: 193,
  d_zoff: 182,
  g_banks: 183,
  l_yashin: 189,
  
  // Strikers & Forwards
  c_ronaldo: 187,
  t_henry: 188,
  r_van_nistelrooy: 188,
  d_drogba: 189,
  r_lewandowski: 185,
  h_kane: 188,
  k_benzema: 185,
  a_shevchenko: 183,
  ronaldo_nazario: 183,
  g_batistuta: 185,
  f_torres: 186,
  s_etoo: 179,
  d_trezeguet: 190,
  h_crespo: 184,
  f_inzaghi: 181,
  c_vieri: 185,
  m_klose: 184,
  r_van_persie: 183,
  l_suarez: 182,
  s_aguero: 173,
  w_rooney: 176,
  m_owen: 173,
  d_bergkamp: 183,
  e_cantona: 188,
  m_van_basten: 188,
  g_muller: 176,
  eusebio: 175,
  pele: 173,
  d_maradona: 165,
  l_messi: 170,
  k_mbappe: 178,
  vinicius_jr: 176,
  l_yamal: 180,
  b_saka: 178,
  m_salah: 175,
  s_mane: 174,
  son_heung_min: 183,
  neymar: 175,
  ronaldinho: 181,
  rivaldo: 186,
  romario: 167,
  h_stoichkov: 178,
  g_best: 175,
  k_rummenigge: 182,
  
  // Midfielders
  z_zidane: 185,
  kaka: 186,
  j_bellingham: 186,
  k_de_bruyne: 181,
  l_modric: 172,
  a_iniesta: 171,
  xavi: 170,
  a_pirlo: 177,
  p_vieira: 192,
  f_rijkaard: 190,
  r_gullit: 191,
  l_matthaus: 174,
  m_laudrup: 183,
  p_nedved: 177,
  s_gerrard: 183,
  f_lampard: 184,
  p_scholes: 168,
  d_beckham: 182,
  r_giggs: 179,
  b_charlton: 175,
  t_kroos: 183,
  casemiro: 185,
  n_kante: 168,
  s_busquets: 189,
  f_valverde: 182,
  pedri: 174,
  gavi: 173,
  f_de_jong: 181,
  m_odegaard: 178,
  b_fernandes: 179,
  d_rice: 188,
  c_palmer: 189,
  
  // Defenders
  p_maldini: 186,
  f_baresi: 176,
  a_nesta: 187,
  f_cannavaro: 175,
  r_ferdinand: 189,
  j_terry: 187,
  s_ramos: 184,
  c_puyol: 178,
  g_chiellini: 187,
  l_bonucci: 190,
  r_carlos: 168,
  cafu: 176,
  d_alves: 172,
  m_desailly: 185,
  l_thuram: 185,
  j_zanetti: 178,
  f_beckenbauer: 181,
  r_koeman: 181,
  j_stam: 191,
  r_dias: 187,
  a_rudiger: 190,
  w_saliba: 192,
  m_gabriel: 190,
  t_alexander_arnold: 175,
  a_robertson: 178,
  a_davies: 185,
  a_hakimi: 181,
  
  // J.League Stars & Japanese Legends
  k_miura: 177,
  h_nakata: 175,
  s_nakamura: 178,
  s_ono: 175,
  k_honda: 182,
  s_okazaki: 174,
  m_hasebe: 179,
  y_endo: 178,
  m_tulio_tanaka: 185,
  y_nakazawa: 187,
  m_ihara: 182,
  y_kawaguchi: 180,
  s_narazaki: 187,
  m_yoshida: 189,
  t_tomiyasu: 188,
  k_machida: 190,
  k_mitoma: 178,
  t_kubo: 173,
  w_endo: 178,
  d_kamada: 184,
  t_minamino: 174,
  r_doan: 172,
  k_itakura: 188,
  a_ueda: 182,
  k_ogawa: 186,
  z_suzuki: 190,
  s_gonda: 187,
  e_kawashima: 185,
  k_nakamura: 185,
  y_osako: 182,
  g_shibasaki: 175,
  h_sakai: 183,
  y_nagatomo: 170,
  a_uchida: 176,
  n_takahara: 181,
  a_yanagisawa: 177,
  m_nakayama: 178,
  t_takagi: 178,
  s_inui: 169,
  g_haraguchi: 179,
  t_morishima: 168,
  y_okubo: 170,
  h_sato: 175,
  k_sugimoto: 187,
  d_maeda: 173,
  k_furuhashi: 170,
  r_hatate: 171,
  a_tanaka: 180,
  h_ito: 188,
  y_sugawara: 179,
  k_matsuki: 180,
  y_kashif: 188,
  t_nishikawa: 183,
  a_tani: 190,
  k_osako: 187,
};

/**
 * Get height for any player in cm
 */
export function getPlayerHeight(player: Player): number {
  if (!player) return 180;
  
  // 1. Direct personId lookup
  if (player.personId && PLAYER_HEIGHTS[player.personId]) {
    return PLAYER_HEIGHTS[player.personId];
  }
  
  // 2. Direct playerId lookup
  if (player.playerId && PLAYER_HEIGHTS[player.playerId]) {
    return PLAYER_HEIGHTS[player.playerId];
  }

  // 3. Normalized Name matching lookup
  const cleanEn = (player.nameEn || player.playerName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
  
  for (const [key, height] of Object.entries(PLAYER_HEIGHTS)) {
    if (cleanEn.includes(key) || key.includes(cleanEn)) {
      return height;
    }
  }

  // 4. Special cases check
  if (player.nameEn?.toLowerCase().includes('koller') || player.nameJa?.includes('コレル')) {
    return 202;
  }
  if (player.nameEn?.toLowerCase().includes('crouch') || player.nameJa?.includes('クラウチ')) {
    return 201;
  }
  if (player.nameEn?.toLowerCase().includes('courtois') || player.nameJa?.includes('クルトワ')) {
    return 200;
  }
  if (player.nameEn?.toLowerCase().includes('haaland') || player.nameJa?.includes('ハーランド')) {
    return 194;
  }
  if (player.nameEn?.toLowerCase().includes('ibrahimovic') || player.nameJa?.includes('イブラヒモ')) {
    return 195;
  }
  if (player.nameEn?.toLowerCase().includes('van dijk') || player.nameJa?.includes('ファン・ダイク')) {
    return 193;
  }

  // 5. Positional & Physical stat-based natural height calculation
  const pos = player.subPosition || player.position;
  const phy = player.stats?.physical || player.rating || 80;
  const def = player.stats?.defending || 75;

  let baseHeight = 180;

  switch (pos) {
    case 'GK':
      baseHeight = 188 + Math.round((phy - 75) * 0.15);
      return Math.min(200, Math.max(182, baseHeight));
    case 'CB':
      baseHeight = 186 + Math.round((phy - 75) * 0.12) + Math.round((def - 75) * 0.08);
      return Math.min(196, Math.max(180, baseHeight));
    case 'LB':
    case 'RB':
    case 'LWB':
    case 'RWB':
      baseHeight = 176 + Math.round((phy - 75) * 0.08);
      return Math.min(186, Math.max(168, baseHeight));
    case 'CDM':
      baseHeight = 183 + Math.round((phy - 75) * 0.1);
      return Math.min(193, Math.max(174, baseHeight));
    case 'CM':
    case 'CAM':
      baseHeight = 178 + Math.round((phy - 75) * 0.08);
      return Math.min(188, Math.max(168, baseHeight));
    case 'LM':
    case 'RM':
    case 'LW':
    case 'RW':
      baseHeight = 176 + Math.round((phy - 75) * 0.06);
      return Math.min(186, Math.max(166, baseHeight));
    case 'CF':
    case 'ST':
      baseHeight = 182 + Math.round((phy - 75) * 0.14);
      return Math.min(198, Math.max(170, baseHeight));
    default:
      if (player.position === 'GK') return 189;
      if (player.position === 'DF') return 185;
      if (player.position === 'MF') return 178;
      if (player.position === 'FW') return 181;
      return 180;
  }
}
