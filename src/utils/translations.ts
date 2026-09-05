import { Language, MainPosition, PlayerCategory } from '../types';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  home: string;
  play: string;
  playSpinDraft: string;
  selectMode: string;
  modeEurope: string;
  modeEuropeDesc: string;
  modeJ1: string;
  modeJ1Desc: string;
  modeActive: string;
  modeActiveDesc: string;
  spinDraft: string;
  spinLocked: string;
  spinDraftLockedNotice: string;
  spinning: string;
  skip: string;
  skipRemaining: string;
  skipNextDraft: string;
  draft: string;
  playerAcquired: string;
  playerAcquiredDesc: string;
  noPlayersFound: string;
  noPlayersFoundDesc: string;
  noPlayersSkipFree: string;
  myTeam: string;
  myTeamCount: string;
  myTeams: string;
  createNewTeam: string;
  teamCompletedBanner: string;
  teamCompletedBannerDesc: string;
  teamCompletedBadge: string;
  continueDraft: string;
  continueTeam: string;
  newDraft: string;
  changeFormation: string;
  formation: string;
  customFormation: string;
  resetFormation: string;
  resetFormationConfirmTitle: string;
  resetFormationConfirm: string;
  dragInstructions: string;
  dragHolding: string;
  swapWith: string;
  customPlacementActive: string;
  history: string;
  historyEmpty: string;
  searchPlaceholder: string;
  clearHistory: string;
  clearHistoryConfirmTitle: string;
  clearHistoryConfirm: string;
  settings: string;
  howToPlay: string;
  language: string;
  soundSfx: string;
  soundMusic: string;
  resetGame: string;
  resetConfirmTitle: string;
  resetConfirmDesc: string;
  cancel: string;
  confirm: string;
  close: string;
  blackBallTriggered: string;
  goldenBallonDorTriggered: string;
  goldenBallonDorDesc: string;
  blackBallDesc: string;
  blackBallTest: string;
  blackBallTestDesc: string;
  testBlackBall: string;
  testBlackBallLightning: string;
  testGoldenBallonDor?: string;
  testFullSequence: string;
  ballonDorAwardLabel?: string;
  legendPeakEraLabel?: string;
  backToHome: string;
  backToTest: string;
  testModeBadge: string;
  testComplete: string;
  retest: string;
  statPace: string;
  statShooting: string;
  statPassing: string;
  statDribbling: string;
  statDefending: string;
  statPhysical: string;
  overall: string;
  joiningYear: string;
  club: string;
  nationality: string;
  position: string;
  posGK: string;
  posDF: string;
  posMF: string;
  posFW: string;
  category: string;
  categoryYoung: string;
  categoryMid: string;
  categoryVeteran: string;
  categoryStar: string;
  categoryLegend: string;
  categoryNormal: string;
  tutorialSteps: {
    title: string;
    description: string;
  }[];
  blackBallNotice: string;
  teamChemistry: string;
  avgRating: string;
  shareTeam: string;
  shareTeamModalTitle: string;
  shareSubtitle: string;
  shareX: string;
  shareInstagram: string;
  shareFacebook: string;
  shareLine: string;
  shareOther: string;
  copyShareText: string;
  downloadCardImage: string;
  copiedToClipboard: string;
  copiedShareTextSuccess: string;
  teamSharedSuccess: string;
  imageDownloadedSuccess: string;
  ctaEveryonePlay: string;
  whoWouldBeInYourTeam: string;
  deleteTeam: string;
  deleteTeamConfirm: string;
  deleteHistoryItem: string;
  deleteHistoryItemConfirm: string;
  historyItemDeleted: string;
  draftInProgress: string;
  viewTeam: string;
  activeSquad: string;
  xCharLimitSetting: string;
  xCharLimitSettingDesc: string;
  xCharLimitFreePlan: string;
  xCharLimitCustom: string;
  xCharsCountLabel: string;
  xCharLimitNotice: string;
  xCharLimitExceededWarning: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  ja: {
    appTitle: 'FOOTBALL DRAFT',
    appSubtitle: '自分だけのベストイレブンを作ろう',
    home: 'HOME',
    play: 'PLAY',
    playSpinDraft: 'PLAY',
    selectMode: 'SELECT MODE (モード選択)',
    modeEurope: 'EUROPEAN CLUBS',
    modeEuropeDesc: 'レアル、バルサ、マンC、バイエルン、PSG等欧州メガクラブの歴代レジェンド＆現役スーパースター',
    modeJ1: 'J1 LEAGUE',
    modeJ1Desc: 'J1所属クラブの歴代レジェンド名選手＆現役実在選手',
    modeActive: 'ACTIVE PLAYERS (現役選手)',
    modeActiveDesc: '世界中の現役選手のみが登場する新モード。引退選手なし、現役最高峰のスーパースター達が競演。',
    spinDraft: '⚽ SPIN DRAFT',
    spinLocked: '🔒 SPIN DRAFT (選択中)',
    spinDraftLockedNotice: 'DRAFTまたはSKIPを選択するまで次のSPINはできません',
    spinning: '🎰 SPINNING...',
    skip: 'SKIP',
    skipRemaining: 'SKIP残数',
    skipNextDraft: '⚽ SKIP / NEXT DRAFT',
    draft: 'DRAFT',
    playerAcquired: 'PLAYER ACQUIRED!',
    playerAcquiredDesc: '選手を獲得しました！',
    noPlayersFound: 'NO PLAYERS FOUND',
    noPlayersFoundDesc: '該当する加入年・クラブの実在選手が存在しませんでした。',
    noPlayersSkipFree: '※該当選手なしのためSKIP回数は消費されません',
    myTeam: 'MY TEAM',
    myTeamCount: 'MY TEAM',
    myTeams: 'MY TEAMS (チーム一覧)',
    createNewTeam: '➕ 新規チーム作成',
    teamCompletedBanner: '🎉 TEAM COMPLETE! (BEST XI完成)',
    teamCompletedBannerDesc: '11人の選手が揃いました！ピッチで戦術を確認するか、2チーム目以降のドラフトを開始しましょう。',
    teamCompletedBadge: 'COMPLETE',
    continueDraft: 'ドラフトを続ける',
    continueTeam: 'ドラフト再開',
    newDraft: '新規ドラフト',
    changeFormation: 'フォーメーション変更',
    formation: 'フォーメーション',
    customFormation: 'カスタム配置',
    resetFormation: '初期配置に戻す',
    resetFormationConfirmTitle: 'フォーメーションの初期化',
    resetFormationConfirm: '選手の配置を現在のフォーメーションの標準位置に戻しますか？',
    dragInstructions: '※選手カードをドラッグしてピッチ上の好きな位置に自由に再配置できます',
    dragHolding: '配置したい場所までドラッグして離してください',
    swapWith: '選手を入れ替え',
    customPlacementActive: 'カスタム配置中',
    history: 'HISTORY (獲得履歴)',
    historyEmpty: 'まだドラフト履歴がありません。',
    searchPlaceholder: '選手名 / クラブ / 国籍 / ポジション / 年代で検索...',
    clearHistory: '履歴を消去',
    clearHistoryConfirmTitle: 'ドラフト履歴の消去',
    clearHistoryConfirm: 'すべてのドラフト獲得履歴を消去しますか？（現在のチームデータは保持されます）',
    settings: 'SETTINGS (設定)',
    howToPlay: 'HOW TO PLAY (遊び方)',
    language: 'LANGUAGE (言語)',
    soundSfx: '効果音 (SFX)',
    soundMusic: 'BGM / サウンド演出',
    resetGame: 'ゲームデータ初期化 (RESET GAME DATA)',
    resetConfirmTitle: 'ゲーム初期化の確認',
    resetConfirmDesc: '現在のチームおよび進行中のドラフトを初期化します。よろしいですか？（※獲得履歴は保持されます）',
    cancel: 'キャンセル',
    confirm: 'リセットする',
    close: '閉じる',
    blackBallTriggered: '⚡ ULTRA RARE EVENT TRIGGERED! ⚡',
    blackBallDesc: '1%の超激レア演出「BLACK BALL」が発生しました！実在レジェンドの象徴的活躍年度演出が発動！',
    goldenBallonDorTriggered: '✨ SUPREME GOLDEN EVENT ✨',
    goldenBallonDorDesc: '金色の雷光が降り注ぐ！伝説の黄金期特別演出が発動！',
    blackBallTest: 'BLACK BALL & GOLDEN 演出テスト',
    blackBallTestDesc: '1%の超激レア演出（黒玉・稲妻・GOLDEN演出）をテスト再生できます',
    testBlackBall: '黒玉演出（象徴的年度）を再生',
    testBlackBallLightning: '稲妻＆黒玉演出を再生',
    testGoldenBallonDor: '✨ GOLDEN演出（ゴールデン）を再生',
    testFullSequence: 'フル演出シーケンス',
    ballonDorAwardLabel: 'GOLDEN LEGEND',
    legendPeakEraLabel: 'ICONIC PEAK ERA',
    backToHome: 'ホームに戻る',
    backToTest: 'テスト選択に戻る',
    testModeBadge: 'TEST MODE',
    testComplete: '演出完了',
    retest: 'もう一度再生',
    statPace: 'PAC',
    statShooting: 'SHO',
    statPassing: 'PAS',
    statDribbling: 'DRI',
    statDefending: 'DEF',
    statPhysical: 'PHY',
    overall: 'OVR',
    joiningYear: '加入年',
    club: 'クラブ',
    nationality: '国籍',
    position: 'ポジション',
    posGK: 'GK (ゴールキーパー)',
    posDF: 'DF (ディフェンダー)',
    posMF: 'MF (ミッドフィールダー)',
    posFW: 'FW (フォワード)',
    category: '選手区分',
    categoryYoung: '若手',
    categoryMid: '中堅',
    categoryVeteran: 'ベテラン',
    categoryStar: 'スター',
    categoryLegend: 'レジェンド',
    categoryNormal: '所属選手',
    tutorialSteps: [
      {
        title: '1. モード選択',
        description: '「EUROPEAN CLUBS（欧州主要クラブ）」または「J1 LEAGUE（2026 J1）」を選んでスタートします。',
      },
      {
        title: '2. ⚽ SPIN DRAFT をタップ',
        description: 'SPIN DRAFTボタンを押すと、年度（2000〜2026年）とクラブがルーレットで同時に決定されます。',
      },
      {
        title: '3. DRAFT または SKIP を選択（ルーレットロック機能）',
        description: '結果が出た後は、候補から選手を1名【DRAFT】するか、【SKIP】するまで次のSPINはロックされます。',
      },
      {
        title: '4. SKIP機能 (最大3回)',
        description: '候補が気に入らない場合はSKIP（最大3回）が可能。※NO PLAYERS FOUND時はSKIPを消費しません。',
      },
      {
        title: '5. 複数チーム作成可能！',
        description: '11人集めてTEAM 1を完成させた後も「CREATE NEW TEAM」でTEAM 2、TEAM 3と無制限にベストイレブンを作成できます！',
      },
      {
        title: '6. 🔒 チーム編成ロック機能',
        description: 'MY TEAMで鍵アイコンをタップするとチームがロックされ、誤タップによる入れ替えやフォーメーション変更を防止できます。',
      },
      {
        title: '7. 🔍 選手詳細確認',
        description: 'MY TEAM内の選手カードをタップすると、公式の適正ポジション・能力値・所属クラブ・身長などの詳細情報を確認できます。',
      },
      {
        title: '8. ⚔️ PvP対戦＆週間ランキング (Supabase)',
        description: 'Supabaseに登録された実在プレイヤーとOVR対戦・戦術対戦で勝負！ 月曜〜日曜(JST)の週間ランキング上位を目指しましょう。',
      },
    ],
    blackBallNotice: '※ドラフト時に対象選手のみ、1.8%の確率で「黒玉演出（漆黒の稲妻）」または「ゴールデン演出（黄金の輝き）」が発生します。',
    teamChemistry: 'チームケミストリー',
    avgRating: '平均レート',
    shareTeam: 'SHARE TEAM (チーム共有)',
    shareTeamModalTitle: 'SHARE YOUR BEST XI',
    shareSubtitle: '完成したマイチームをSNSでみんなに共有しよう！',
    shareX: 'X でポスト',
    shareInstagram: 'Instagram',
    shareFacebook: 'Facebook',
    shareLine: 'LINE',
    shareOther: 'その他SNS / 端末で共有',
    copyShareText: '共有文章をコピー',
    downloadCardImage: 'チームカード画像を保存',
    copiedToClipboard: 'チーム編成テキストをクリップボードにコピーしました！',
    copiedShareTextSuccess: '共有文章をコピーしました！',
    teamSharedSuccess: 'TEAM SHARED! (共有しました)',
    imageDownloadedSuccess: 'チームカード画像を保存しました！',
    ctaEveryonePlay: 'みんなもFOOTBALL DRAFTで遊ぼう！',
    whoWouldBeInYourTeam: 'あなたならどんなチームを作る？🔥',
    deleteTeam: 'チームを削除',
    deleteTeamConfirm: 'このチームを削除しますか？',
    deleteHistoryItem: 'この獲得履歴を削除',
    deleteHistoryItemConfirm: 'この獲得履歴を削除しますか？',
    historyItemDeleted: '獲得履歴を削除しました',
    draftInProgress: 'ドラフト進行中',
    viewTeam: 'チームを表示',
    activeSquad: '現在の進行中チーム',
    xCharLimitSetting: 'X共有 文字数上限 (X CHAR LIMIT)',
    xCharLimitSettingDesc: 'X（旧Twitter）無料プランの文字数上限に合わせて自動調整します（全角140文字 / 半角280文字）。',
    xCharLimitFreePlan: '無料プラン標準 (280字 / 全角140字)',
    xCharLimitCustom: 'カスタム上限',
    xCharsCountLabel: '文字数',
    xCharLimitNotice: '※X無料プランの文字数制限（280文字相当）に収まるよう自動調整されています。',
    xCharLimitExceededWarning: '文字数上限を超過しています',
  },
  en: {
    appTitle: 'FOOTBALL DRAFT',
    appSubtitle: 'Build Your Ultimate Best XI',
    home: 'HOME',
    play: 'PLAY',
    playSpinDraft: 'PLAY',
    selectMode: 'SELECT MODE',
    modeEurope: 'EUROPEAN CLUBS',
    modeEuropeDesc: 'Top European giants: Real Madrid, Barcelona, Man City, Bayern, PSG & all-time legends + active superstars',
    modeJ1: 'J1 LEAGUE',
    modeJ1Desc: 'J1 League Clubs: Current stars and all-time legendary players',
    modeActive: 'ACTIVE PLAYERS',
    modeActiveDesc: 'Featuring exclusively active players worldwide. No retired players, drafting the current peak world superstars.',
    spinDraft: '⚽ SPIN DRAFT',
    spinLocked: '🔒 SPIN DRAFT (LOCKED)',
    spinDraftLockedNotice: 'Select DRAFT or SKIP to unlock the next spin',
    spinning: '🎰 SPINNING...',
    skip: 'SKIP',
    skipRemaining: 'SKIPS LEFT',
    skipNextDraft: '⚽ SKIP / NEXT DRAFT',
    draft: 'DRAFT',
    playerAcquired: 'PLAYER ACQUIRED!',
    playerAcquiredDesc: 'Player successfully added to your squad!',
    noPlayersFound: 'NO PLAYERS FOUND',
    noPlayersFoundDesc: 'No real players found matching this Year and Club combination.',
    noPlayersSkipFree: '* No candidates found: Skip count is NOT consumed',
    myTeam: 'MY TEAM',
    myTeamCount: 'MY TEAM',
    myTeams: 'MY TEAMS',
    createNewTeam: '➕ CREATE NEW TEAM',
    teamCompletedBanner: '🎉 TEAM COMPLETE!',
    teamCompletedBannerDesc: 'You have drafted all 11 players! Inspect your tactics or start drafting Team 2, Team 3 & beyond.',
    teamCompletedBadge: 'COMPLETED',
    continueDraft: 'Continue Draft',
    continueTeam: 'Resume Team',
    newDraft: 'New Draft',
    changeFormation: 'Change Formation',
    formation: 'Formation',
    customFormation: 'Custom Drag & Drop',
    resetFormation: 'Reset Positions',
    resetFormationConfirmTitle: 'Reset Formation Positions',
    resetFormationConfirm: 'Do you want to reset all player positions back to standard layout?',
    dragInstructions: '* Drag any player card to adjust tactical position on the pitch',
    dragHolding: 'Drop player on pitch or swap position',
    swapWith: 'Swap Player',
    customPlacementActive: 'Custom Layout Active',
    history: 'DRAFT HISTORY',
    historyEmpty: 'No draft history recorded yet.',
    searchPlaceholder: 'Search player / club / country / position / era...',
    clearHistory: 'Clear History',
    clearHistoryConfirmTitle: 'Clear Draft History',
    clearHistoryConfirm: 'Are you sure you want to clear all draft history? (Active teams will be preserved)',
    settings: 'SETTINGS',
    howToPlay: 'HOW TO PLAY',
    language: 'LANGUAGE',
    soundSfx: 'Sound FX',
    soundMusic: 'BGM & Audio Effects',
    resetGame: 'RESET GAME DATA',
    resetConfirmTitle: 'Confirm Reset',
    resetConfirmDesc: 'This will reset your current squads and in-progress drafts. History will be kept.',
    cancel: 'Cancel',
    confirm: 'Reset All',
    close: 'Close',
    blackBallTriggered: '⚡ ULTRA RARE EVENT TRIGGERED! ⚡',
    blackBallDesc: '1% Ultra-rare "BLACK BALL" sequence activated! Legendary iconic peak era presentation!',
    goldenBallonDorTriggered: '✨ SUPREME GOLDEN EVENT ✨',
    goldenBallonDorDesc: 'Golden lightning cascades down! The Golden Era sequence is unleashed!',
    blackBallTest: 'BLACK BALL & GOLDEN TEST BENCH',
    blackBallTestDesc: 'Preview the 1% ultra-rare cinematic sequences (Black Ball, Lightning & Golden Special)',
    testBlackBall: 'Play Standard Black Ball (Peak Era)',
    testBlackBallLightning: 'Play Lightning + Black Ball',
    testGoldenBallonDor: '✨ Play GOLDEN Sequence',
    testFullSequence: 'Play Full Cinematic',
    ballonDorAwardLabel: 'GOLDEN LEGEND',
    legendPeakEraLabel: 'ICONIC PEAK ERA',
    backToHome: 'Back to Home',
    backToTest: 'Back to Test Selection',
    testModeBadge: 'TEST MODE',
    testComplete: 'Sequence Complete',
    retest: 'Replay Sequence',
    statPace: 'PAC',
    statShooting: 'SHO',
    statPassing: 'PAS',
    statDribbling: 'DRI',
    statDefending: 'DEF',
    statPhysical: 'PHY',
    overall: 'OVR',
    joiningYear: 'Signed Year',
    club: 'Club',
    nationality: 'Nationality',
    position: 'Position',
    posGK: 'GK (Goalkeeper)',
    posDF: 'DF (Defender)',
    posMF: 'MF (Midfielder)',
    posFW: 'FW (Forward)',
    category: 'Category',
    categoryYoung: 'Young',
    categoryMid: 'Mid',
    categoryVeteran: 'Veteran',
    categoryStar: 'Star',
    categoryLegend: 'Legend',
    categoryNormal: 'Regular',
    tutorialSteps: [
      {
        title: '1. Select Mode',
        description: 'Choose between "EUROPEAN CLUBS" or "J1 LEAGUE" to begin your draft session.',
      },
      {
        title: '2. Tap ⚽ SPIN DRAFT',
        description: 'Hitting SPIN DRAFT spins both Year (2000-2026) and Club simultaneously on the dual reels.',
      },
      {
        title: '3. Pick DRAFT or SKIP (Spin Lock)',
        description: 'Once results appear, you cannot spin again until you either DRAFT a player or use SKIP.',
      },
      {
        title: '4. Use SKIP (Max 3)',
        description: 'You can pass up to 3 times per squad. If NO PLAYERS FOUND appears, it will not consume your skip.',
      },
      {
        title: '5. Build Multiple Squads!',
        description: 'After completing TEAM 1 (11 players), tap "CREATE NEW TEAM" to draft Team 2, Team 3 and more!',
      },
      {
        title: '6. 🔒 Squad Lock Protection',
        description: 'Tap the lock icon in MY TEAM to secure your lineup against accidental swaps or formation changes.',
      },
      {
        title: '7. 🔍 Detailed Player Profiles',
        description: 'Tap any player card in MY TEAM to inspect official verified positions, ratings, attributes, club, and height.',
      },
      {
        title: '8. ⚔️ PvP & Weekly Standings (Supabase)',
        description: 'Battle real Supabase managers in OVR or Tactical matches and climb the weekly leaderboard (Mon-Sun JST).',
      },
    ],
    blackBallNotice: '* In rare cases (1.8% each), eligible players trigger special "BLACK BALL" (dark lightning) or "GOLDEN BALL" (radiant gold) sequences.',
    teamChemistry: 'Team Chemistry',
    avgRating: 'Squad OVR',
    shareTeam: 'SHARE TEAM',
    shareTeamModalTitle: 'SHARE YOUR BEST XI',
    shareSubtitle: 'Share your dream team with friends across all social platforms!',
    shareX: 'Post to X',
    shareInstagram: 'Instagram',
    shareFacebook: 'Facebook',
    shareLine: 'LINE',
    shareOther: 'More SNS / Device Share',
    copyShareText: 'Copy Share Text',
    downloadCardImage: 'Save Card Image',
    copiedToClipboard: 'Squad lineup copied to clipboard!',
    copiedShareTextSuccess: 'Share text copied to clipboard!',
    teamSharedSuccess: 'TEAM SHARED!',
    imageDownloadedSuccess: 'Team card image saved!',
    ctaEveryonePlay: 'Come play FOOTBALL DRAFT and create your own team!',
    whoWouldBeInYourTeam: 'Who would be in your Dream Team?🔥',
    deleteTeam: 'Delete Team',
    deleteTeamConfirm: 'Are you sure you want to delete this team?',
    deleteHistoryItem: 'Delete Entry',
    deleteHistoryItemConfirm: 'Delete this draft record from history?',
    historyItemDeleted: 'History entry deleted',
    draftInProgress: 'DRAFT IN PROGRESS',
    viewTeam: 'VIEW TEAM',
    activeSquad: 'Current Active Team',
    xCharLimitSetting: 'X (Twitter) Share Char Limit',
    xCharLimitSettingDesc: 'Automatically fits within X Free Tier limits (280 single-byte / 140 double-byte chars).',
    xCharLimitFreePlan: 'Free Plan Standard (280 chars)',
    xCharLimitCustom: 'Custom Limit',
    xCharsCountLabel: 'Characters',
    xCharLimitNotice: '* Auto-formatted to fit within X Free Tier character limit (280 chars).',
    xCharLimitExceededWarning: 'Character limit exceeded',
  },
  es: {
    appTitle: 'FOOTBALL DRAFT',
    appSubtitle: 'Crea tu BEST XI Definitivo',
    home: 'HOME',
    play: 'PLAY',
    playSpinDraft: 'PLAY',
    selectMode: 'SELECCIONAR MODO',
    modeEurope: 'CLUBES EUROPEOS',
    modeEuropeDesc: 'Gigantes europeos: Real Madrid, Barcelona, Man City, Bayern & leyendas históricas + cracks en activo',
    modeJ1: 'LIGA J1',
    modeJ1Desc: 'Clubes J1: Jugadores reales históricos y estrellas actuales en activo',
    modeActive: 'JUGADORES EN ACTIVO',
    modeActiveDesc: 'Modo exclusivo con jugadores en activo de todo el mundo. Sin leyendas retiradas, los mejores cracks del momento.',
    spinDraft: '⚽ SPIN DRAFT',
    spinLocked: '🔒 SPIN DRAFT (BLOQUEADO)',
    spinDraftLockedNotice: 'Selecciona DRAFT o SKIP para desbloquear el siguiente giro',
    spinning: '🎰 GIRANDO RULETA...',
    skip: 'SKIP',
    skipRemaining: 'SKIPS DISPONIBLES',
    skipNextDraft: '⚽ SKIP / NEXT DRAFT',
    draft: 'DRAFT',
    playerAcquired: '¡JUGADOR FICHADO!',
    playerAcquiredDesc: '¡Jugador incorporado a tu plantilla!',
    noPlayersFound: 'NO PLAYERS FOUND',
    noPlayersFoundDesc: 'No se encontraron jugadores que coincidan con este año y club.',
    noPlayersSkipFree: '* Sin jugadores no consume intentos de SKIP.',
    myTeam: 'MI EQUIPO',
    myTeamCount: 'MI EQUIPO',
    myTeams: 'MIS EQUIPOS',
    createNewTeam: '➕ CREAR NUEVO EQUIPO',
    teamCompletedBanner: '🎉 ¡EQUIPO COMPLETADO!',
    teamCompletedBannerDesc: '¡Has reunido a 11 futbolistas! Revisa tu pizarra táctica o crea el Equipo 2, Equipo 3 y más.',
    teamCompletedBadge: 'COMPLETADO',
    continueDraft: 'Continuar Draft',
    continueTeam: 'Reanudar Equipo',
    newDraft: 'Nuevo Draft',
    changeFormation: 'Cambiar Alineación',
    formation: 'Alineación',
    customFormation: 'Arrastrar y Soltar Táctico',
    resetFormation: 'Restablecer Posiciones',
    resetFormationConfirmTitle: 'Restablecer Pizarra',
    resetFormationConfirm: '¿Deseas restablecer todas las posiciones a la formación predeterminada?',
    dragInstructions: '* Arrastra cualquier carta de jugador para ajustar la posición en el campo',
    dragHolding: 'Suelta al jugador en el campo o intercambia su posición',
    swapWith: 'Intercambiar',
    customPlacementActive: 'Alineación Personalizada',
    history: 'HISTORIAL DE DRAFTS',
    historyEmpty: 'Aún no hay historial de jugadores fichados.',
    searchPlaceholder: 'Buscar jugador / club / país / posición / año...',
    clearHistory: 'Borrar Historial',
    clearHistoryConfirmTitle: 'Borrar Historial de Draft',
    clearHistoryConfirm: '¿Seguro que deseas eliminar todo el historial? (Los equipos activos se conservarán)',
    settings: 'AJUSTES',
    howToPlay: 'CÓMO JUGAR',
    language: 'IDIOMA',
    soundSfx: 'Efectos de Sonido (SFX)',
    soundMusic: 'Música y Efectos de Audio',
    resetGame: 'REINICIAR DATOS DEL JUEGO',
    resetConfirmTitle: 'Confirmar Reinicio',
    resetConfirmDesc: 'Esto restablecerá tus equipos actuales y el draft en curso. El historial se conservará.',
    cancel: 'Cancelar',
    confirm: 'Reiniciar Todo',
    close: 'Cerrar',
    blackBallTriggered: '⚡ ¡EVENTO ULTRA RARO ACTIVADO! ⚡',
    blackBallDesc: '¡Se ha activado la animación especial "BLACK BALL" (1%)! ¡Presentación de la época cumbre legendaria!',
    goldenBallonDorTriggered: '✨ ¡EVENTO SUPREMO DORADO! ✨',
    goldenBallonDorDesc: '¡Rayos dorados descienden! ¡Se activa la cinemática de la Era Dorada Legendaria!',
    blackBallTest: 'BANCO DE PRUEBAS BLACK BALL Y GOLDEN',
    blackBallTestDesc: 'Prueba las cinemáticas ultra raras del 1% (Black Ball, Truenos y GOLDEN Especial)',
    testBlackBall: 'Probar Black Ball (Época Cumbre)',
    testBlackBallLightning: 'Probar Trueno + Black Ball',
    testGoldenBallonDor: '✨ Probar GOLDEN (Especial)',
    testFullSequence: 'Probar Cinemática Completa',
    ballonDorAwardLabel: 'LEYENDA GOLDEN',
    legendPeakEraLabel: 'ÉPOCA DORADA ICONICA',
    backToHome: 'Volver a Inicio',
    backToTest: 'Volver a Pruebas',
    testModeBadge: 'MODO PRUEBA',
    testComplete: 'Secuencia Completa',
    retest: 'Repetir Secuencia',
    statPace: 'RIT',
    statShooting: 'TIR',
    statPassing: 'PAS',
    statDribbling: 'REG',
    statDefending: 'DEF',
    statPhysical: 'FÍS',
    overall: 'MED',
    joiningYear: 'Año de Fichaje',
    club: 'Club',
    nationality: 'Nacionalidad',
    position: 'Posición',
    posGK: 'POR (Portero)',
    posDF: 'DEF (Defensa)',
    posMF: 'MED (Centrocampista)',
    posFW: 'DEL (Delantero)',
    category: 'Categoría',
    categoryYoung: 'Joven',
    categoryMid: 'Consolidado',
    categoryVeteran: 'Veterano',
    categoryStar: 'Estrella',
    categoryLegend: 'Leyenda',
    categoryNormal: 'Plantilla',
    tutorialSteps: [
      {
        title: '1. Elige el Modo',
        description: 'Selecciona "CLUBES EUROPEOS" o "LIGA J1" para comenzar el draft.',
      },
      {
        title: '2. Toca ⚽ SPIN DRAFT',
        description: 'Al pulsar SPIN DRAFT, el AÑO y el CLUB giran simultáneamente.',
      },
      {
        title: '3. Elige DRAFT o SKIP (Bloqueo de giro)',
        description: 'Una vez que aparecen los resultados, no puedes volver a girar hasta que elijas DRAFT o SKIP.',
      },
      {
        title: '4. Usa SKIP (Máximo 3)',
        description: 'Puedes pasar hasta 3 veces. Si sale "NO PLAYERS FOUND", no consume tu SKIP.',
      },
      {
        title: '5. Múltiples Equipos',
        description: '¡Al completar el EQUIPO 1 (11 jugadores), pulsa "CREAR NUEVO EQUIPO" para formar el Equipo 2, Equipo 3 y más!',
      },
      {
        title: '6. 🔒 Bloqueo de Equipo',
        description: 'Toca el icono del candado en MI EQUIPO para asegurar tu alineación contra cambios o modificaciones accidentales.',
      },
      {
        title: '7. 🔍 Detalles del Jugador',
        description: 'Toca cualquier carta de jugador en MI EQUIPO para consultar sus posiciones aptas, estadísticas, club y altura.',
      },
      {
        title: '8. ⚔️ PvP y Clasificaciones Semanales (Supabase)',
        description: 'Compite contra mánagers reales de Supabase en partidos OVR o tácticos y sube en la clasificación semanal (JST).',
      },
    ],
    blackBallNotice: '* En ocasiones raras (1.8% cada una), jugadores seleccionados activan la cinemática "BALÓN NEGRO" o "DORADO".',
    teamChemistry: 'Química de Equipo',
    avgRating: 'Media de Equipo',
    shareTeam: 'SHARE TEAM',
    shareTeamModalTitle: 'COMPARTE TU MEJOR ONCE',
    shareSubtitle: '¡Comparte tu equipo de ensueño con tus amigos en todas las redes!',
    shareX: 'Publicar en X',
    shareInstagram: 'Instagram',
    shareFacebook: 'Facebook',
    shareLine: 'LINE',
    shareOther: 'Más Redes / Menú del Móvil',
    copyShareText: 'Copiar Texto de Compartir',
    downloadCardImage: 'Guardar Imagen de la Carta',
    copiedToClipboard: '¡Alineación copiada al portapapeles!',
    copiedShareTextSuccess: '¡Texto de compartir copiado al portapapeles!',
    teamSharedSuccess: '¡EQUIPO COMPARTIDO!',
    imageDownloadedSuccess: '¡Imagen del equipo guardada!',
    ctaEveryonePlay: '¡Juega a FOOTBALL DRAFT y crea tu propio equipo!',
    whoWouldBeInYourTeam: '¿Cuál sería tu equipo soñado?🔥',
    deleteTeam: 'Eliminar Equipo',
    deleteTeamConfirm: '¿Deseas eliminar este equipo?',
    deleteHistoryItem: 'Eliminar Registro',
    deleteHistoryItemConfirm: '¿Deseas eliminar este registro del historial?',
    historyItemDeleted: 'Registro eliminado del historial',
    draftInProgress: 'DRAFT EN CURSO',
    viewTeam: 'VER EQUIPO',
    activeSquad: 'Equipo Activo Actual',
    xCharLimitSetting: 'Límite de Caracteres en X',
    xCharLimitSettingDesc: 'Ajuste automático para el plan gratuito de X (280 caracteres simples / 140 dobles).',
    xCharLimitFreePlan: 'Estándar Plan Gratuito (280 car.)',
    xCharLimitCustom: 'Límite Personalizado',
    xCharsCountLabel: 'Caracteres',
    xCharLimitNotice: '* Formato ajustado automáticamente para no exceder el límite gratuito de X (280 car.).',
    xCharLimitExceededWarning: 'Límite de caracteres excedido',
  },
};

export function getLocalizedCategory(category: PlayerCategory | undefined, lang: Language): string {
  const t = TRANSLATIONS[lang];
  if (!category) return t.categoryNormal;
  switch (category) {
    case 'YOUNG': return t.categoryYoung;
    case 'MID': return t.categoryMid;
    case 'VETERAN': return t.categoryVeteran;
    case 'STAR': return t.categoryStar;
    case 'LEGEND': return t.categoryLegend;
    case 'NORMAL': return t.categoryNormal;
    default: return t.categoryNormal;
  }
}

export function getLocalizedPlayerName(player: { nameJa?: string; nameEn?: string; nameEs?: string; playerName: string }, lang: Language): string {
  if (lang === 'ja') return player.nameJa || player.playerName;
  if (lang === 'es') return player.nameEs || player.playerName;
  return player.nameEn || player.playerName;
}

export function getLocalizedClubName(club: { nameJa?: string; nameEn?: string; nameEs?: string; name?: string }, lang: Language): string {
  if (lang === 'ja') return club.nameJa || club.name || '';
  if (lang === 'es') return club.nameEs || club.name || '';
  return club.nameEn || club.name || '';
}

export function getLocalizedNationality(player: { nationalityJa?: string; nationalityEn?: string; nationalityEs?: string; nationality?: string }, lang: Language): string {
  if (lang === 'ja') return player.nationalityJa || player.nationality || '';
  if (lang === 'es') return player.nationalityEs || player.nationality || '';
  return player.nationalityEn || player.nationality || '';
}

export function getLocalizedPosition(pos: MainPosition, lang: Language): string {
  const t = TRANSLATIONS[lang];
  switch (pos) {
    case 'GK': return t.posGK.split(' ')[0];
    case 'DF': return t.posDF.split(' ')[0];
    case 'MF': return t.posMF.split(' ')[0];
    case 'FW': return t.posFW.split(' ')[0];
    default: return pos;
  }
}
