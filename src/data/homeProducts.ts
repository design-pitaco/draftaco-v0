import type {
  Banner,
  CasinoGameSection,
  CasinoRailItem,
  NavbarConfig,
  ProductMode,
  ProductRailSection,
  Promotion,
} from '../types/home'

import bg1x2 from '../assets/bg1x2.png'
import bgAumentada from '../assets/bgAumentada.png'
import bgVirtuais from '../assets/bgVirtuais.png'
import bgAoVivoBasquete from '../assets/aoVivoBasquete.png'
import bgAoVivoTenis from '../assets/bgAoVivoTenis.png'
import bgCombinada from '../assets/combinada.png'
import escudoKnicksGde from '../assets/escudoKnicksGde.png'
import escudoMagicGde from '../assets/escudoMagicGde.png'
import escudoBarcelonaGde from '../assets/escudoBarcelonaGde.png'
import escudoRealGde from '../assets/escudoRealGde.png'
import flagRussia from '../assets/iconPaises/russia.png'
import flagUSA from '../assets/iconPaises/estados-unidos.png'

import imgMissaoVerdao from '../assets/imgMissaoVerdao.png'
import imgPagamentoAntecipado from '../assets/img-promo-pagamento-antecipado-futebol.png'
import imgFlamengo from '../assets/bgFlamengo.png'
import imgTesouroRei from '../assets/img-promo-tesouro-do-rei.png'
import imgPromoPiggy from '../assets/img-promo-piggy.png'
import imgPromoRabbit from '../assets/img-promo-rabbit.png'
import imgMissao100k from '../assets/img-missao-100k.png'
import imgTorneioWazdan from '../assets/img-torneio-wazdan.png'
import imgJogoFortune from '../assets/img-jogo-fortune.png'
import imgJogoMacaco from '../assets/img-jogo-macaco.png'
import imgAviator from '../assets/imgAviator.png'
import imgRoletaSorte from '../assets/imgRoletaSorte.png'
import imgFutebolStudio from '../assets/imgFutebolStudio.png'
import imgRabbit from '../assets/imgRabbit.png'
import imgTigrinho from '../assets/imgTigrinho.png'
import imgRatinho from '../assets/img-ratinho.png'

import iconBlackjack from '../assets/iconSports/blackjack.png'
import iconCasino from '../assets/iconSports/casino.png'
import iconCrash from '../assets/iconSports/crash.png'
import iconDestaque from '../assets/iconSports/fire.png'
import iconMore from '../assets/iconSports/more.png'
import iconProvedores from '../assets/iconSports/provedores.png'
import iconRoleta from '../assets/iconSports/roleta.png'
import iconSlots from '../assets/iconSports/slots.png'

import navApostas from '../assets/navApostas.svg'
import navBusca from '../assets/navBusca.svg'
import navHistorico from '../assets/navHistorico.svg'
import navHome from '../assets/navHome.svg'
import navLive from '../assets/navLive.svg'
import navMeusJogos from '../assets/navMeusJogos.svg'
import navPromo from '../assets/navPromo.svg'

export const productLabels: Record<ProductMode, string> = {
  apostas: 'APOSTAS',
  cassino: 'CASSINO',
}

export const productNavbarConfigs: Record<ProductMode, NavbarConfig> = {
  apostas: {
    activeItemId: 'home',
    mainItems: [
      { id: 'home', icon: navHome, label: 'Início' },
      { id: 'ao-vivo', icon: navLive, label: 'Ao Vivo' },
      { id: 'promocoes', icon: navPromo, label: 'Promoções' },
      { id: 'apostas', icon: navApostas, label: 'Entradas' },
    ],
    searchItem: { id: 'buscar', icon: navBusca, label: 'Buscar' },
  },
  cassino: {
    activeItemId: 'home',
    mainItems: [
      { id: 'home', icon: navHome, label: 'Início' },
      { id: 'meus-jogos', icon: navMeusJogos, label: 'Frequentes' },
      { id: 'promocoes', icon: navPromo, label: 'Promoções' },
      { id: 'historico', icon: navHistorico, label: 'Histórico' },
    ],
    searchItem: { id: 'buscar', icon: navBusca, label: 'Buscar' },
  },
}

export const sportsBanners: Banner[] = [
  {
    id: 7,
    type: 'aoVivoTenis',
    headerLeft: 'Ao Vivo',
    headerRight: 'Aberto de Madrid',
    showTimer: true,
    background: bgAoVivoTenis,
    title: '',
    description: '',
    tennisMatch: {
      player1: {
        name: 'A. Sabalenka',
        sets: 5,
        games: 5,
        points: '40',
        isServing: true,
        flag: flagRussia,
      },
      player2: {
        name: 'P. Stearns',
        sets: 2,
        games: 2,
        points: '15',
        isServing: false,
        flag: flagUSA,
      },
      currentSet: '1º set',
      setScore: '1 x 0',
      odds: { player1: '1.22x', player2: '4.75x' },
    },
  },
  {
    id: 9,
    type: 'combinada',
    headerLeft: 'Hoje, 17:00',
    headerRight: 'Chelsea x Arsenal',
    background: bgCombinada,
    title: 'Super Combo',
    description: '',
    comboStats: [
      { value: 'CHE', label: 'Resultado Final' },
      { value: 'CHE +2', label: 'Total de Gols' },
      { value: 'ARS +4', label: 'Total de Escanteios' },
    ],
    oddBoosted: { old: '7.50x', new: '10.50x' },
  },
  {
    id: 6,
    type: 'aoVivo',
    headerLeft: 'Ao Vivo',
    headerRight: 'NBA',
    showTimer: true,
    background: bgAoVivoBasquete,
    title: '',
    description: '',
    liveMatch: {
      homeTeam: {
        name: 'Knicks',
        shortName: 'NYK',
        badge: escudoKnicksGde,
        score: 42,
      },
      awayTeam: {
        name: 'Magic',
        shortName: 'ORL',
        badge: escudoMagicGde,
        score: 38,
      },
      matchTime: 'Q2 05:00',
      odds: { home: '1.72x', draw: '', away: '2.15x' },
    },
  },
  {
    id: 2,
    type: '1x2',
    headerLeft: 'Hoje, 17:00',
    headerRight: 'Champions League',
    background: bg1x2,
    title: '',
    description: '',
    odds: [
      { team: 'Real Madrid', value: '1.78x', badge: escudoRealGde },
      { team: 'Empate', value: '3.50x' },
      { team: 'Barcelona', value: '2.10x', badge: escudoBarcelonaGde },
    ],
  },
  {
    id: 4,
    type: 'aumentada',
    headerLeft: '11/09, 16:00',
    headerRight: 'Flamengo vs Racing',
    background: bgAumentada,
    title: 'Aumentada',
    description: 'Pedro\nMais de 3.5\nFinalizações ao gol',
    oddBoosted: { old: '3.87x', new: '4.50x' },
  },
  {
    id: 5,
    type: 'virtuais',
    headerLeft: 'Novidade no Rei',
    headerRight: 'Virtuais',
    background: bgVirtuais,
    title: 'Chegou Virtuais!',
    description: 'Jogos a todo minuto para você não parar de se divertir.',
    buttonText: 'Jogue Agora',
  },
]

export const casinoBanners: Banner[] = [
  {
    id: 101,
    type: 'virtuais',
    headerLeft: 'Slots',
    headerRight: 'Pragmatic Play',
    background: imgJogoFortune,
    title: '',
    description: '',
    hideContent: true,
    casinoGameId: 'fortune-tiger',
  },
  {
    id: 102,
    type: 'virtuais',
    headerLeft: 'Slots',
    headerRight: 'Pragmatic Play',
    background: imgJogoMacaco,
    title: '',
    description: '',
    hideContent: true,
    casinoGameId: 'lucky-monkey',
  },
  {
    id: 103,
    type: 'missao',
    headerLeft: 'Missão',
    headerRight: 'Termina em 3 dias',
    background: imgMissao100k,
    title: 'R$ 100 MIL na\u00a0hora!',
    description: 'Quanto mais você aposta,\nmaiores são as chances de\nver um prêmio!',
    buttonText: 'Ativar Missão',
    showInfoBtn: true,
    noWrapTitle: true,
  },
  {
    id: 104,
    type: 'torneio',
    headerLeft: 'Torneio',
    headerRight: 'Termina em 3 dias',
    background: imgTorneioWazdan,
    title: 'R$ 450.000!',
    description: 'Drop de Prêmios Wazdan.\nTorneio recheado de\nprêmios para você.',
    buttonText: 'Jogar Torneio',
    showInfoBtn: true,
  },
]

export const sportsPromotions: Promotion[] = [
  {
    id: '1',
    type: 'missao',
    timeLabel: 'Termina em 3 dias',
    hasTimer: true,
    label: ['Missão'],
    title: 'Aposte no Verdão e ganhe R$50!',
    description: 'Aposte R$50 no jogo do Palmeiras na Liberta e ganhe R$10 em créditos.',
    image: imgMissaoVerdao,
  },
  {
    id: '2',
    type: 'vantagem',
    timeLabel: 'Só no Rei',
    hasTimer: false,
    label: ['Pagamento', 'Antecipado'],
    title: 'Fature até 200% na múltipla.',
    description: 'Se o time abrir dois gols, seu pagamento já cai na conta.',
    image: imgPagamentoAntecipado,
  },
  {
    id: '3',
    type: 'missao',
    timeLabel: 'Termina em 3 dias',
    hasTimer: true,
    label: ['Missão'],
    title: 'Ganhe R$5 no brasileirão.',
    description: 'Aposte R$50 no jogo do Flamengo e ganhe mais 20 coroas.',
    image: imgFlamengo,
  },
  {
    id: '5',
    type: 'vantagem',
    timeLabel: 'Só no Rei',
    hasTimer: false,
    label: ['Tesouro', 'do Pitaco'],
    title: 'Tesouro do Pitaco',
    description: 'Quanto mais você jogar mais chaves irá conseguir.',
    image: imgTesouroRei,
  },
]

export const casinoPromotions: Promotion[] = [
  {
    id: 'casino-1',
    type: 'missao',
    timeLabel: 'Missão',
    hasTimer: true,
    label: ['Progresso:', 'R$0 de R$100'],
    title: 'Fortune Rabbit',
    description: 'Aposte R$100 no jogo Fortune Rabbit e ganhe mais 50 coroas.',
    image: imgPromoRabbit,
  },
  {
    id: 'casino-2',
    type: 'missao',
    timeLabel: 'Missão',
    hasTimer: true,
    label: ['Missão'],
    title: 'Lucky Piggy',
    description: 'Aposte R$100 no jogo Lucky Piggy e ganhe 20 coroas.',
    image: imgPromoPiggy,
  },
  {
    id: 'casino-3',
    type: 'missao',
    timeLabel: 'Missão',
    hasTimer: true,
    label: ['Missão'],
    title: 'Ratinho Sortudo',
    description: 'Aposte R$20 no jogo do Ratinho Sortudo e ganhe 5 Rodadas Grátis.',
    image: imgRatinho,
  },
  {
    id: 'casino-4',
    type: 'vantagem',
    timeLabel: 'Só no Rei',
    hasTimer: false,
    label: ['Tesouro', 'do Pitaco'],
    title: 'Tesouro do Pitaco',
    description: 'Quanto mais você jogar mais chaves irá conseguir.',
    image: imgTesouroRei,
  },
]

export const casinoRailSections: ProductRailSection<CasinoRailItem>[] = [
  {
    id: 'destaques',
    className: 'sport-rail__section--lead',
    items: [
      {
        id: 'casino:destaques',
        categoryId: 'destaques',
        icon: iconDestaque,
        label: 'Destaques',
        clickable: true,
      },
    ],
  },
  {
    id: 'cassino',
    className: 'sport-rail__section--divided',
    items: [
      {
        id: 'casino:slots',
        categoryId: 'slots',
        icon: iconSlots,
        label: 'Slots',
        clickable: true,
      },
      {
        id: 'casino:crash',
        categoryId: 'crash',
        icon: iconCrash,
        label: 'Crash',
        clickable: true,
      },
    ],
  },
  {
    id: 'cassino-ao-vivo',
    className: 'sport-rail__section--divided',
    items: [
      {
        id: 'casino:ao-vivo',
        categoryId: 'ao-vivo',
        icon: iconCasino,
        label: 'Ao Vivo',
        clickable: true,
      },
      {
        id: 'casino:roletas',
        categoryId: 'roletas',
        icon: iconRoleta,
        label: 'Roleta',
        clickable: true,
      },
      {
        id: 'casino:blackjack',
        categoryId: 'blackjack',
        icon: iconBlackjack,
        label: 'BlackJack',
        clickable: true,
      },
    ],
  },
  {
    id: 'provedores',
    className: 'sport-rail__section--divided',
    items: [
      {
        id: 'casino:provedores',
        categoryId: 'provedores',
        icon: iconProvedores,
        label: 'Provedores',
        clickable: true,
      },
    ],
  },
  {
    id: 'mais-cassino',
    className: 'sport-rail__section--tail',
    items: [
      {
        id: 'casino:mais',
        categoryId: 'destaques',
        icon: iconMore,
        label: 'Mais',
        clickable: true,
        isMore: true,
      },
    ],
  },
]

export const casinoGameSections: CasinoGameSection[] = [
  {
    id: 'mais-jogados',
    title: 'Mais jogados',
    categoryIds: ['destaques', 'slots'],
    games: [
      { id: 'fortune-tiger', name: 'Fortune Tiger', provider: 'PG Soft', image: imgTigrinho, categoryIds: ['destaques', 'slots'] },
      { id: 'fortune-rabbit', name: 'Fortune Rabbit', provider: 'PG Soft', image: imgRabbit, categoryIds: ['destaques', 'slots'] },
      { id: 'aviator', name: 'Aviator', provider: 'Spribe', image: imgAviator, categoryIds: ['destaques', 'crash'] },
      { id: 'ratinho', name: 'Ratinho Sortudo', provider: 'Pragmatic', image: imgRatinho, categoryIds: ['destaques', 'slots'] },
    ],
  },
  {
    id: 'cassino-ao-vivo',
    title: 'Cassino ao vivo',
    categoryIds: ['destaques', 'ao-vivo', 'roletas'],
    games: [
      { id: 'roleta-sorte', name: 'Roleta da Sorte', provider: 'Evolution', image: imgRoletaSorte, categoryIds: ['destaques', 'ao-vivo', 'roletas'], isLive: true },
      { id: 'futebol-studio', name: 'Futebol Studio', provider: 'Evolution', image: imgFutebolStudio, categoryIds: ['destaques', 'ao-vivo'], isLive: true },
      { id: 'fortune-live', name: 'Fortune Ao Vivo', provider: 'Playtech', image: imgJogoFortune, categoryIds: ['ao-vivo', 'slots'], isLive: true },
    ],
  },
  {
    id: 'crash-e-rapidos',
    title: 'Crash e jogos rápidos',
    categoryIds: ['destaques', 'crash'],
    games: [
      { id: 'aviator-rapido', name: 'Aviator Turbo', provider: 'Spribe', image: imgAviator, categoryIds: ['destaques', 'crash'] },
      { id: 'macaco-sortudo', name: 'Macaco Sortudo', provider: 'Rei Games', image: imgJogoMacaco, categoryIds: ['crash', 'slots'] },
      { id: 'fortune-rush', name: 'Fortune Rush', provider: 'Wazdan', image: imgJogoFortune, categoryIds: ['crash', 'promocoes'] },
    ],
  },
  {
    id: 'promocoes-cassino',
    title: 'Jogos com promoção',
    categoryIds: ['destaques', 'promocoes'],
    games: [
      { id: 'rabbit-bonus', name: 'Rabbit Bonus', provider: 'PG Soft', image: imgPromoRabbit, categoryIds: ['destaques', 'promocoes', 'slots'] },
      { id: 'piggy-bank', name: 'Piggy Bank', provider: 'Wazdan', image: imgPromoPiggy, categoryIds: ['promocoes', 'slots'] },
      { id: 'wazdan-torneio', name: 'Wazdan Torneio', provider: 'Wazdan', image: imgTorneioWazdan, categoryIds: ['promocoes'] },
    ],
  },
]
