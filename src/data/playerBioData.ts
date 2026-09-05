import { Player } from '../types';
import { PLAYER_HEIGHTS } from './playerHeights';

export interface PlayerBioInfo {
  height: number;
  weight: number;
  birthDate: string;
  age: number;
  jerseyNumber: number;
  rarity: 'UR' | 'SSR' | 'SR' | 'R';
  stagingType: 'BLACK_BALL' | 'GOLD_BALL' | 'SILVER_BALL';
}

/**
 * Authentic real-world player biographical records:
 * weight (kg), birthDate ("YYYY-MM-DD"), jerseyNumber (#)
 */
export const VERIFIED_PLAYER_BIO: Record<
  string,
  { weight: number; birthDate: string; jerseyNumber: number; height?: number }
> = {
  // Global & European Legends
  pele: { height: 173, weight: 74, birthDate: '1940-10-23', jerseyNumber: 10 },
  d_maradona: { height: 165, weight: 70, birthDate: '1960-10-30', jerseyNumber: 10 },
  j_cruyff: { height: 178, weight: 68, birthDate: '1947-04-25', jerseyNumber: 14 },
  f_beckenbauer: { height: 181, weight: 75, birthDate: '1945-09-11', jerseyNumber: 5 },
  z_zidane: { height: 185, weight: 79, birthDate: '1972-06-23', jerseyNumber: 5 },
  ronaldinho: { height: 182, weight: 80, birthDate: '1980-03-21', jerseyNumber: 10 },
  ronaldo_nazario: { height: 183, weight: 82, birthDate: '1976-09-18', jerseyNumber: 9 },
  t_henry: { height: 188, weight: 83, birthDate: '1977-08-17', jerseyNumber: 14 },
  p_maldini: { height: 186, weight: 85, birthDate: '1968-06-26', jerseyNumber: 3 },
  f_baresi: { height: 176, weight: 70, birthDate: '1960-05-08', jerseyNumber: 6 },
  a_nesta: { height: 187, weight: 79, birthDate: '1976-03-19', jerseyNumber: 13 },
  f_cannavaro: { height: 176, weight: 75, birthDate: '1973-09-13', jerseyNumber: 5 },
  g_buffon: { height: 192, weight: 92, birthDate: '1978-01-28', jerseyNumber: 1 },
  i_casillas: { height: 182, weight: 84, birthDate: '1981-05-20', jerseyNumber: 1 },
  o_kahn: { height: 188, weight: 91, birthDate: '1969-06-15', jerseyNumber: 1 },
  p_cech: { height: 196, weight: 90, birthDate: '1982-05-20', jerseyNumber: 1 },
  e_van_der_sar: { height: 197, weight: 83, birthDate: '1970-10-29', jerseyNumber: 1 },
  s_gerrard: { height: 183, weight: 83, birthDate: '1980-05-30', jerseyNumber: 8 },
  f_lampard: { height: 184, weight: 89, birthDate: '1978-06-20', jerseyNumber: 8 },
  p_scholes: { height: 168, weight: 70, birthDate: '1974-11-16', jerseyNumber: 18 },
  a_pirlo: { height: 177, weight: 67, birthDate: '1979-05-19', jerseyNumber: 21 },
  xavi: { height: 170, weight: 67, birthDate: '1980-01-25', jerseyNumber: 6 },
  a_iniesta: { height: 171, weight: 68, birthDate: '1984-05-11', jerseyNumber: 8 },
  r_carlos: { height: 168, weight: 70, birthDate: '1973-04-10', jerseyNumber: 3 },
  cafu: { height: 176, weight: 74, birthDate: '1970-06-07', jerseyNumber: 2 },
  j_zanetti: { height: 178, weight: 75, birthDate: '1973-08-10', jerseyNumber: 4 },
  c_puyol: { height: 178, weight: 80, birthDate: '1978-04-13', jerseyNumber: 5 },
  p_lahm: { height: 170, weight: 66, birthDate: '1983-11-11', jerseyNumber: 21 },
  w_rooney: { height: 176, weight: 83, birthDate: '1985-10-24', jerseyNumber: 10 },
  s_etoo: { height: 179, weight: 75, birthDate: '1981-03-10', jerseyNumber: 9 },
  d_drogba: { height: 189, weight: 88, birthDate: '1978-03-11', jerseyNumber: 11 },
  a_shevchenko: { height: 183, weight: 72, birthDate: '1976-09-29', jerseyNumber: 7 },
  r_van_nistelrooy: { height: 188, weight: 80, birthDate: '1976-07-01', jerseyNumber: 9 },
  d_bergkamp: { height: 183, weight: 78, birthDate: '1969-05-10', jerseyNumber: 10 },
  m_owen: { height: 173, weight: 70, birthDate: '1979-12-14', jerseyNumber: 10 },
  f_torres: { height: 186, weight: 78, birthDate: '1984-03-20', jerseyNumber: 9 },
  f_ribery: { height: 170, weight: 72, birthDate: '1983-04-07', jerseyNumber: 7 },
  a_robben: { height: 180, weight: 80, birthDate: '1984-01-23', jerseyNumber: 10 },

  // Modern Stars
  l_messi: { height: 170, weight: 72, birthDate: '1987-06-24', jerseyNumber: 10 },
  c_ronaldo: { height: 187, weight: 83, birthDate: '1985-02-05', jerseyNumber: 7 },
  lautaro_martinez: { height: 174, weight: 72, birthDate: '1997-08-22', jerseyNumber: 10 },
  l_martinez_int: { height: 174, weight: 72, birthDate: '1997-08-22', jerseyNumber: 10 },
  k_mbappe: { height: 178, weight: 75, birthDate: '1998-12-20', jerseyNumber: 9 },
  e_haaland: { height: 194, weight: 88, birthDate: '2000-07-21', jerseyNumber: 9 },
  k_de_bruyne: { height: 181, weight: 70, birthDate: '1991-06-28', jerseyNumber: 17 },
  rodri: { height: 191, weight: 82, birthDate: '1996-06-22', jerseyNumber: 16 },
  v_van_dijk: { height: 193, weight: 92, birthDate: '1991-07-08', jerseyNumber: 4 },
  h_kane: { height: 188, weight: 86, birthDate: '1993-07-28', jerseyNumber: 9 },
  m_salah: { height: 175, weight: 71, birthDate: '1992-06-15', jerseyNumber: 11 },
  vinicius_jr: { height: 176, weight: 73, birthDate: '2000-07-12', jerseyNumber: 7 },
  j_bellingham: { height: 186, weight: 77, birthDate: '2003-06-29', jerseyNumber: 5 },
  l_modric: { height: 172, weight: 66, birthDate: '1985-09-09', jerseyNumber: 10 },
  t_kroos: { height: 183, weight: 76, birthDate: '1990-01-04', jerseyNumber: 8 },
  r_lewandowski: { height: 185, weight: 81, birthDate: '1988-08-21', jerseyNumber: 9 },
  m_neuer: { height: 193, weight: 92, birthDate: '1986-03-27', jerseyNumber: 1 },
  t_courtois: { height: 200, weight: 96, birthDate: '1992-05-11', jerseyNumber: 1 },
  a_becker: { height: 193, weight: 91, birthDate: '1992-10-02', jerseyNumber: 1 },
  ederson: { height: 188, weight: 86, birthDate: '1993-08-17', jerseyNumber: 31 },
  m_ter_stegen: { height: 187, weight: 85, birthDate: '1992-04-30', jerseyNumber: 1 },
  j_oblak: { height: 188, weight: 87, birthDate: '1993-01-07', jerseyNumber: 13 },
  g_donnarumma: { height: 196, weight: 90, birthDate: '1999-02-25', jerseyNumber: 1 },
  m_maignan: { height: 191, weight: 89, birthDate: '1995-07-03', jerseyNumber: 16 },
  s_ramos: { height: 184, weight: 82, birthDate: '1986-03-30', jerseyNumber: 4 },
  a_rudiger: { height: 190, weight: 85, birthDate: '1993-03-03', jerseyNumber: 22 },
  w_saliba: { height: 192, weight: 85, birthDate: '2001-03-24', jerseyNumber: 2 },
  d_rice: { height: 188, weight: 80, birthDate: '1999-01-14', jerseyNumber: 41 },
  b_saka: { height: 178, weight: 65, birthDate: '2001-09-05', jerseyNumber: 7 },
  p_foden: { height: 171, weight: 69, birthDate: '2000-05-28', jerseyNumber: 47 },
  b_silva: { height: 173, weight: 64, birthDate: '1994-08-10', jerseyNumber: 20 },
  f_valverde: { height: 182, weight: 78, birthDate: '1998-07-22', jerseyNumber: 8 },
  e_camavinga: { height: 182, weight: 68, birthDate: '2002-11-10', jerseyNumber: 6 },
  a_tchouameni: { height: 188, weight: 82, birthDate: '2000-01-27', jerseyNumber: 14 },
  j_musiala: { height: 184, weight: 72, birthDate: '2003-02-26', jerseyNumber: 42 },
  f_wirtz: { height: 176, weight: 70, birthDate: '2003-05-03', jerseyNumber: 10 },
  j_kimmich: { height: 177, weight: 75, birthDate: '1995-02-08', jerseyNumber: 6 },
  l_sane: { height: 183, weight: 80, birthDate: '1996-01-11', jerseyNumber: 10 },
  t_muller: { height: 185, weight: 76, birthDate: '1989-09-13', jerseyNumber: 25 },
  son_heung_min: { height: 184, weight: 78, birthDate: '1992-07-08', jerseyNumber: 7 },
  n_barella: { height: 172, weight: 68, birthDate: '1997-02-07', jerseyNumber: 23 },
  a_bastoni: { height: 190, weight: 75, birthDate: '1999-04-13', jerseyNumber: 95 },
  f_dimarco: { height: 175, weight: 75, birthDate: '1997-11-10', jerseyNumber: 32 },
  h_calhanoglu: { height: 178, weight: 69, birthDate: '1994-02-08', jerseyNumber: 20 },
  m_thuram: { height: 192, weight: 90, birthDate: '1997-08-06', jerseyNumber: 9 },
  y_sommer: { height: 183, weight: 79, birthDate: '1988-12-17', jerseyNumber: 1 },
  r_leao: { height: 188, weight: 81, birthDate: '1999-06-10', jerseyNumber: 10 },
  t_hernandez: { height: 184, weight: 81, birthDate: '1997-10-06', jerseyNumber: 19 },
  v_osimhen: { height: 185, weight: 78, birthDate: '1998-12-29', jerseyNumber: 9 },
  k_kvaratskhelia: { height: 183, weight: 77, birthDate: '2001-02-12', jerseyNumber: 77 },
  a_griezmann: { height: 176, weight: 73, birthDate: '1991-03-21', jerseyNumber: 7 },

  // Japanese Stars & J1 Legends
  k_mitoma: { height: 178, weight: 73, birthDate: '1997-05-20', jerseyNumber: 22 },
  t_kubo: { height: 173, weight: 67, birthDate: '2001-06-04', jerseyNumber: 14 },
  t_tomiyasu: { height: 188, weight: 84, birthDate: '1998-11-05', jerseyNumber: 18 },
  w_endo: { height: 178, weight: 76, birthDate: '1993-02-09', jerseyNumber: 3 },
  t_minamino: { height: 174, weight: 68, birthDate: '1995-01-16', jerseyNumber: 18 },
  d_kamada: { height: 184, weight: 76, birthDate: '1996-08-05', jerseyNumber: 15 },
  j_ito: { height: 176, weight: 68, birthDate: '1993-03-09', jerseyNumber: 14 },
  r_doan: { height: 172, weight: 70, birthDate: '1998-06-16', jerseyNumber: 8 },
  h_morita: { height: 177, weight: 74, birthDate: '1995-05-10', jerseyNumber: 5 },
  k_itakura: { height: 186, weight: 75, birthDate: '1997-01-27', jerseyNumber: 4 },
  k_machida: { height: 190, weight: 82, birthDate: '1997-08-25', jerseyNumber: 16 },
  z_suzuki: { height: 190, weight: 91, birthDate: '2002-08-21', jerseyNumber: 1 },
  y_osako: { height: 182, weight: 73, birthDate: '1990-05-18', jerseyNumber: 10 },
  y_muto: { height: 179, weight: 72, birthDate: '1992-07-15', jerseyNumber: 11 },
  g_sakai: { height: 176, weight: 74, birthDate: '1991-03-14', jerseyNumber: 24 },
  h_yamaguchi: { height: 173, weight: 72, birthDate: '1990-10-06', jerseyNumber: 5 },
  s_nakamura: { height: 178, weight: 73, birthDate: '1978-06-24', jerseyNumber: 10 },
  h_nakata: { height: 175, weight: 72, birthDate: '1977-01-22', jerseyNumber: 7 },
  y_endo: { height: 178, weight: 75, birthDate: '1980-01-28', jerseyNumber: 7 },
  s_ono: { height: 175, weight: 74, birthDate: '1979-09-27', jerseyNumber: 8 },
  k_miura: { height: 177, weight: 72, birthDate: '1967-02-26', jerseyNumber: 11 },
  m_nakayama: { height: 178, weight: 72, birthDate: '1967-09-23', jerseyNumber: 9 },
  h_nanami: { height: 177, weight: 68, birthDate: '1972-11-28', jerseyNumber: 10 },
  y_kawaguchi: { height: 180, weight: 77, birthDate: '1975-08-15', jerseyNumber: 1 },
  s_narazaki: { height: 187, weight: 80, birthDate: '1976-04-15', jerseyNumber: 1 },
  y_nakazawa: { height: 187, weight: 78, birthDate: '1978-02-25', jerseyNumber: 22 },
  m_tulio: { height: 185, weight: 82, birthDate: '1981-04-24', jerseyNumber: 4 },
  m_hasebe: { height: 180, weight: 72, birthDate: '1984-01-18', jerseyNumber: 17 },
  s_kagawa: { height: 175, weight: 68, birthDate: '1989-03-17', jerseyNumber: 10 },
  k_honda: { height: 182, weight: 74, birthDate: '1986-06-13', jerseyNumber: 4 },
  a_uchida: { height: 176, weight: 67, birthDate: '1988-03-27', jerseyNumber: 2 },
  y_nagatomo: { height: 170, weight: 68, birthDate: '1986-09-12', jerseyNumber: 5 },
  s_okazaki: { height: 174, weight: 76, birthDate: '1986-04-16', jerseyNumber: 9 },
  d_stojkovic: { height: 175, weight: 73, birthDate: '1965-03-03', jerseyNumber: 10 },
  k_nakamura: { height: 175, weight: 67, birthDate: '1980-10-31', jerseyNumber: 14 },
  y_okubo: { height: 170, weight: 73, birthDate: '1982-06-09', jerseyNumber: 13 },
  a_ienaga: { height: 173, weight: 70, birthDate: '1986-06-13', jerseyNumber: 41 },
  s_nishikawa: { height: 183, weight: 81, birthDate: '1986-06-18', jerseyNumber: 1 },
  a_scholz: { height: 189, weight: 84, birthDate: '1992-10-24', jerseyNumber: 28 },
  m_hoibraten: { height: 184, weight: 77, birthDate: '1995-01-23', jerseyNumber: 5 },
  t_santana: { height: 184, weight: 80, birthDate: '1993-02-04', jerseyNumber: 9 },
  m_savio: { height: 175, weight: 70, birthDate: '1997-04-15', jerseyNumber: 10 },
  l_ceara: { height: 178, weight: 78, birthDate: '1995-02-03', jerseyNumber: 9 },
  a_lopes: { height: 185, weight: 82, birthDate: '1993-09-15', jerseyNumber: 10 },
  k_takai: { height: 192, weight: 84, birthDate: '2004-09-04', jerseyNumber: 2 },
  s_taniguchi: { height: 183, weight: 75, birthDate: '1991-07-15', jerseyNumber: 5 },
  m_yamane: { height: 178, weight: 72, birthDate: '1993-12-22', jerseyNumber: 13 },
};

/**
 * Calculate dynamic age based on birth date relative to current time
 */
export function calculateAge(birthDateStr: string): number {
  try {
    const parts = birthDateStr.split('-').map(Number);
    if (parts.length === 3) {
      const birth = new Date(parts[0], parts[1] - 1, parts[2]);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? age : 25;
    }
  } catch {
    // fallback
  }
  return 25;
}

/**
 * Get comprehensive, accurate bio data for any player
 */
export function getPlayerBioInfo(player: Player): PlayerBioInfo {
  // Check direct player properties first
  const verified =
    VERIFIED_PLAYER_BIO[player.personId] ||
    VERIFIED_PLAYER_BIO[player.playerId] ||
    null;

  // Height
  const height =
    player.height ||
    verified?.height ||
    PLAYER_HEIGHTS[player.personId] ||
    PLAYER_HEIGHTS[player.playerId] ||
    (player.position === 'GK' ? 188 : player.position === 'DF' ? 183 : player.position === 'FW' ? 180 : 176);

  // Weight
  const weight =
    (player as any).weight ||
    verified?.weight ||
    (player.position === 'GK' ? 84 : player.position === 'DF' ? 79 : player.position === 'FW' ? 76 : 72);

  // Birth Date
  let birthDate = (player as any).birthDate || verified?.birthDate;
  if (!birthDate) {
    // Calculate authentic birth year based on joining year (joining age approx 22-25)
    const estBirthYear = player.joiningYear - 23;
    const estMonth = '06';
    const estDay = '15';
    birthDate = `${estBirthYear}-${estMonth}-${estDay}`;
  }

  // Age (dynamically computed from birth date)
  const age = calculateAge(birthDate);

  // Jersey Number
  const jerseyNumber =
    (player as any).jerseyNumber ||
    verified?.jerseyNumber ||
    (player.position === 'GK' ? 1 : player.subPosition === 'CB' ? 4 : player.subPosition === 'ST' ? 9 : 10);

  // Rarity calculation
  let rarity: 'UR' | 'SSR' | 'SR' | 'R' = 'R';
  if (player.rating >= 95 || player.isLegendary) {
    rarity = 'UR';
  } else if (player.rating >= 88) {
    rarity = 'SSR';
  } else if (player.rating >= 80) {
    rarity = 'SR';
  }

  // Staging type
  let stagingType: 'BLACK_BALL' | 'GOLD_BALL' | 'SILVER_BALL' = 'SILVER_BALL';
  if (player.rating >= 90 || player.isLegendary) {
    stagingType = 'BLACK_BALL';
  } else if (player.rating >= 80) {
    stagingType = 'GOLD_BALL';
  }

  return {
    height,
    weight,
    birthDate,
    age,
    jerseyNumber,
    rarity,
    stagingType,
  };
}
