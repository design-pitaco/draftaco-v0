import { useState, useRef, useEffect, type ReactNode, type RefObject } from 'react'
import { CaretRightIcon, CaretUpIcon } from '@phosphor-icons/react'
import '../PreMatchSection/PreMatchSection.css'
import './CalendarSection.css'
import { CompeticaoBottomSheet } from '../BottomSheet'
import { LiveMatchCard } from '../LiveMatchCard'
import {
  PreMatchPlayerPropCard,
  type MatchPlayerProp,
  type PlayerPropOption,
  type TeamPlayerProfile,
} from '../PreMatchSection/PreMatchSection'
import type { LiveEventMatch, LiveEventOpenPayload } from '../../pages/LiveEventPage'
import { getTeamLogo } from '../../data/teamLogos'
import { useHomeMarketStickyState } from '../../hooks/useHomeMarketStickyVisible'
import { createBetslipSelection, getBetslipEventId, getBetslipMarketGroupId } from '../../hooks/betslipUtils'
import { useOddSelection } from '../../hooks/useOddSelection'
import { useSportsDbTeamLogo } from '../../hooks/useSportsDbTeamLogo'
import { useSlidingActiveIndicator } from '../../hooks/useSlidingActiveIndicator'
import {
  getCompetitionLinkTarget,
  type CompetitionLinkTarget,
} from '../../utils/competitionNavigation'

import reiAntecipaFutebol from '../../assets/reiAntecipaFutebol.png'
import reiAntecipaBasquete from '../../assets/reiAntecipaBasquete.png'
import iconBasquete from '../../assets/iconSports/basketball.png'
import iconFutebol from '../../assets/iconSports/soccer.png'
import iconTenis from '../../assets/iconSports/tennis.png'
import playerAvatarFutebol from '../../assets/playerAvatarFutebol.svg'
import playerAvatarBasquete from '../../assets/playerAvatarBasquete.svg'
import { getCompetitionBadge } from '../../data/competitionBadges'
import { getTennisPlayerCountryIcon } from '../../data/tennisCountryIcons'
import {
  competicaoConfigBySport,
  findCompetition,
  isCompetitionEnabled,
} from '../SportFilterBar/competicaoData'
// Flags
import flagBrasil from '../../assets/iconPaises/brasil.png'
import flagMundo from '../../assets/iconPaises/mundo.png'
import flagInglaterra from '../../assets/iconPaises/inglaterra.png'
import flagEspanha from '../../assets/iconPaises/espanha.png'
import flagAlemanha from '../../assets/iconPaises/alemanha.png'
import flagUSA from '../../assets/iconPaises/estados-unidos.png'
// Escudos Futebol
import escudoBotafogo from '../../assets/escudoBotafogo.png'
import escudoFlamengo from '../../assets/escudoFlamengo.png'
import escudoCruzeiro from '../../assets/escudoCruzeiro.png'
import escudoInter from '../../assets/escudoInter.png'
import escudoBragantino from '../../assets/escudoBragantino.png'
import escudoMirasol from '../../assets/escudoMirasol.png'
import escudoSaoPaulo from '../../assets/escudoSaoPaulo.png'
import escudoAtleticoMadrid from '../../assets/escudoAtleticoMadrid.png'
import escudoInterItalia from '../../assets/escudoInterItalia.png'
import escudoPalmeiras from '../../assets/escudoPalmeiras.png'
import escudoFluminense from '../../assets/escudoFluminense.png'
import escudoReal from '../../assets/escudoReal.png'
import escudoBarca from '../../assets/escudoBarca.png'
import escudoLiverpool from '../../assets/escudoLiverpool.png'
import escudoManchesterCity from '../../assets/escudomanchesterCity.png'
import escudoBenfica from '../../assets/escudoBenfica.png'
import escudoAjax from '../../assets/escudoAjax.png'
import escudoArsenal from '../../assets/escudoArsenal.png'
import escudoChelsea from '../../assets/escudoChelsea.png'
import escudoBrighton from '../../assets/escudoBrighton.png'
import escudoWestHam from '../../assets/escudoWestHam.png'
import escudoLeeds from '../../assets/escudoLeeds.png'
import escudoBurnley from '../../assets/escudoBurnley.png'
import escudoGetafe from '../../assets/escudoGetafe.png'
import escudoElche from '../../assets/escudoElche.png'
import escudoAlaves from '../../assets/escudoAlaves.png'
import escudoEspanyol from '../../assets/escudoEspanyol.png'
import escudoMallorca from '../../assets/escudoMallorca.png'
import escudoLevante from '../../assets/escudoLevante.png'
import escudoBayerLeverkusen from '../../assets/escudoBayerLeverkusen.png'
import escudoBayerMunique from '../../assets/escudoBayerMunique.png'
import escudoWolfsburg from '../../assets/escudoWolfsburg.png'
import escudoEintracht from '../../assets/escudoEintracht.png'
import escudoAugsburg from '../../assets/escudoAugsburg.png'
import escudoHamburger from '../../assets/escudoHamburger.png'
import escudoAtlMineiro from '../../assets/escudoAtlMineiro.png'
import escudoSantos from '../../assets/escudoSantos.png'
import escudoPSG from '../../assets/escudoPSG.png'
import escudoLyon from '../../assets/escudoLyon.png'
import escudoNewcastle from '../../assets/escudoNewcastle.png'
import escudoNapoli from '../../assets/escudoNapoli.png'
// Escudos Basquete
import escudoBulls from '../../assets/escudoBullsGde.png'
import escudoMiami from '../../assets/escudoMiami.png'
import escudoJazz from '../../assets/escudoJazz.png'
import escudoThunder from '../../assets/escudoThunder.png'
import escudoCaxias from '../../assets/escudoCaxias.png'
import escudoDefaultBasquete from '../../assets/escudoDefaultBasquete.png'

interface MarketChip {
  id: string
  label: string
}

const footballMarketChips: MarketChip[] = [
  { id: 'resultado-final', label: 'Resultado Final' },
  { id: 'finalizacao-gol', label: 'Finalizações ao Gol' },
  { id: 'dupla-chance', label: 'Dupla Chance' },
  { id: 'assistencias', label: 'Assistências' },
  { id: 'ambos-marcam', label: 'Ambos Marcam' },
  { id: 'total-gols', label: 'Total de Gols' },
  { id: 'escanteios', label: 'Total de Escanteios' },
]

const basketballMarketChips: MarketChip[] = [
  { id: 'vencedor', label: 'Resultado Final' },
  { id: 'pontos-jogador', label: 'Pontos do Jogador' },
  { id: 'total-pontos', label: 'Total de Pontos' },
  { id: 'assistencias', label: 'Assistências' },
  { id: 'handicap', label: 'Handicap' },
  { id: 'q3-total', label: '3° Quarto - Total de Pontos' },
  { id: 'q4-total', label: '4° Quarto - Total de Pontos' },
]

const tennisMarketChips: MarketChip[] = [
  { id: 'vencedor', label: 'Vencedor' },
  { id: 'handicap-games', label: 'Handicap de Games' },
  { id: 'total-games', label: 'Total de Games' },
]

const SHORT_COMPETITION_EVENT_LIMIT = 3
const liveEventSports = new Set(['futebol', 'basquete'])
const CALENDAR_PLAYER_PROPS_PER_EVENT = 3
const CALENDAR_FOOTBALL_FINISHING_MARKET_ID = 'finalizacao-gol'
const CALENDAR_FOOTBALL_ASSISTS_MARKET_ID = 'assistencias'
const CALENDAR_BASKETBALL_POINTS_MARKET_ID = 'pontos-jogador'
const CALENDAR_BASKETBALL_ASSISTS_MARKET_ID = 'assistencias'

const getDefaultMarketId = (sport?: string | null) =>
  sport === 'basquete' || sport === 'tenis' ? 'vencedor' : 'resultado-final'

const calendarPlayerPropOptions = (values: Array<[string, string]>): PlayerPropOption[] =>
  values.map(([label, odd], index) => ({ label, odd, active: index === 1 }))

const calendarFootballFinishingOptionSets = [
  calendarPlayerPropOptions([['3.0+', '1.78x'], ['4.0+', '1.78x'], ['5.0+', '1.78x']]),
  calendarPlayerPropOptions([['2.0+', '1.55x'], ['3.0+', '1.92x'], ['4.0+', '2.70x']]),
  calendarPlayerPropOptions([['1.0+', '1.48x'], ['2.0+', '2.05x'], ['3.0+', '3.60x']]),
]

const calendarFootballAssistOptionSets = [
  calendarPlayerPropOptions([['1.0+', '1.68x'], ['2.0+', '2.35x'], ['3.0+', '4.20x']]),
  calendarPlayerPropOptions([['1.0+', '1.74x'], ['2.0+', '2.50x'], ['3.0+', '4.60x']]),
  calendarPlayerPropOptions([['1.0+', '1.82x'], ['2.0+', '2.70x'], ['3.0+', '5.10x']]),
]

const calendarBasketballPointOptionSets = [
  calendarPlayerPropOptions([['15.5+', '1.62x'], ['20.5+', '1.95x'], ['25.5+', '3.05x']]),
  calendarPlayerPropOptions([['12.5+', '1.58x'], ['17.5+', '1.88x'], ['22.5+', '2.80x']]),
  calendarPlayerPropOptions([['8.5+', '1.54x'], ['13.5+', '1.82x'], ['18.5+', '2.60x']]),
]

const calendarBasketballAssistOptionSets = [
  calendarPlayerPropOptions([['1.0+', '1.70x'], ['2.0+', '2.15x'], ['3.0+', '3.40x']]),
  calendarPlayerPropOptions([['1.0+', '1.62x'], ['2.0+', '1.95x'], ['3.0+', '2.90x']]),
  calendarPlayerPropOptions([['1.0+', '1.54x'], ['2.0+', '1.82x'], ['3.0+', '2.55x']]),
]

const calendarFootballFinishingPlayersByTeam: Record<string, TeamPlayerProfile[]> = {
  Flamengo: [
    { name: 'Pedro', position: 'ATA' },
    { name: 'Bruno Henrique', position: 'ATA' },
    { name: 'Everton Cebolinha', position: 'ATA' },
  ],
  Cruzeiro: [
    { name: 'Kaio Jorge', position: 'ATA' },
    { name: 'Gabigol', position: 'ATA' },
    { name: 'Lautaro Diaz', position: 'ATA' },
  ],
  Internacional: [
    { name: 'Rafael Borre', position: 'ATA' },
    { name: 'Enner Valencia', position: 'ATA' },
    { name: 'Wesley', position: 'ATA' },
  ],
  Bragantino: [
    { name: 'Eduardo Sasha', position: 'ATA' },
    { name: 'Helinho', position: 'ATA' },
    { name: 'Thiago Borbas', position: 'ATA' },
  ],
  Mirassol: [
    { name: 'Dellatorre', position: 'ATA' },
    { name: 'Negueba', position: 'ATA' },
    { name: 'Fernandinho', position: 'ATA' },
  ],
  'São Paulo': [
    { name: 'Calleri', position: 'ATA' },
    { name: 'Luciano', position: 'ATA' },
    { name: 'Lucas Moura', position: 'MEI' },
  ],
  Palmeiras: [
    { name: 'Flaco Lopez', position: 'ATA' },
    { name: 'Vitor Roque', position: 'ATA' },
    { name: 'Raphael Veiga', position: 'MEI' },
  ],
  Fluminense: [
    { name: 'Cano', position: 'ATA' },
    { name: 'Arias', position: 'MEI' },
    { name: 'Keno', position: 'ATA' },
  ],
  Botafogo: [
    { name: 'Igor Jesus', position: 'ATA' },
    { name: 'Savarino', position: 'MEI' },
    { name: 'Tiquinho Soares', position: 'ATA' },
  ],
  Bahia: [
    { name: 'Everaldo', position: 'ATA' },
    { name: 'Cauly', position: 'MEI' },
    { name: 'Biel', position: 'ATA' },
  ],
  'Atl. Mineiro': [
    { name: 'Hulk', position: 'ATA' },
    { name: 'Paulinho', position: 'ATA' },
    { name: 'Gustavo Scarpa', position: 'MEI' },
  ],
  Santos: [
    { name: 'Neymar Jr', position: 'ATA' },
    { name: 'Guilherme', position: 'ATA' },
    { name: 'Soteldo', position: 'MEI' },
  ],
  'Atlético Madrid': [
    { name: 'Julian Alvarez', position: 'ATA' },
    { name: 'Sorloth', position: 'ATA' },
    { name: 'Griezmann', position: 'ATA' },
  ],
  Inter: [
    { name: 'Lautaro Martinez', position: 'ATA' },
    { name: 'Thuram', position: 'ATA' },
    { name: 'Taremi', position: 'ATA' },
  ],
  PSG: [
    { name: 'Dembele', position: 'ATA' },
    { name: 'Kvaratskhelia', position: 'ATA' },
    { name: 'Goncalo Ramos', position: 'ATA' },
  ],
  Lyon: [
    { name: 'Lacazette', position: 'ATA' },
    { name: 'Mikautadze', position: 'ATA' },
    { name: 'Nuamah', position: 'ATA' },
  ],
  Newcastle: [
    { name: 'Isak', position: 'ATA' },
    { name: 'Gordon', position: 'ATA' },
    { name: 'Barnes', position: 'ATA' },
  ],
  Napoli: [
    { name: 'Osimhen', position: 'ATA' },
    { name: 'Politano', position: 'ATA' },
    { name: 'Raspadori', position: 'ATA' },
  ],
  'Real Madrid': [
    { name: 'Vini Jr', position: 'ATA' },
    { name: 'Mbappé', position: 'ATA' },
    { name: 'Bellingham', position: 'MEI' },
  ],
  Barcelona: [
    { name: 'Lewandowski', position: 'ATA' },
    { name: 'Yamal', position: 'ATA' },
    { name: 'Raphinha', position: 'ATA' },
  ],
  Liverpool: [
    { name: 'Salah', position: 'ATA' },
    { name: 'Núñez', position: 'ATA' },
    { name: 'Diaz', position: 'ATA' },
  ],
  'Man. City': [
    { name: 'Haaland', position: 'ATA' },
    { name: 'Foden', position: 'MEI' },
    { name: 'De Bruyne', position: 'MEI' },
  ],
  Benfica: [
    { name: 'Di Maria', position: 'ATA' },
    { name: 'Pavlidis', position: 'ATA' },
    { name: 'Schjelderup', position: 'ATA' },
  ],
  Ajax: [
    { name: 'Brobbey', position: 'ATA' },
    { name: 'Berghuis', position: 'MEI' },
    { name: 'Henderson', position: 'MEI' },
  ],
  Arsenal: [
    { name: 'Saka', position: 'ATA' },
    { name: 'Havertz', position: 'MEI' },
    { name: 'Martinelli', position: 'ATA' },
  ],
  Chelsea: [
    { name: 'Palmer', position: 'MEI' },
    { name: 'Jackson', position: 'ATA' },
    { name: 'Nkunku', position: 'ATA' },
  ],
  Tottenham: [
    { name: 'Son', position: 'ATA' },
    { name: 'Solanke', position: 'ATA' },
    { name: 'Maddison', position: 'MEI' },
  ],
  Wolves: [
    { name: 'Cunha', position: 'ATA' },
    { name: 'Hwang', position: 'ATA' },
    { name: 'Neto', position: 'ATA' },
  ],
  Brighton: [
    { name: 'Welbeck', position: 'ATA' },
    { name: 'Joao Pedro', position: 'ATA' },
    { name: 'Mitoma', position: 'ATA' },
  ],
  'West Ham': [
    { name: 'Bowen', position: 'ATA' },
    { name: 'Paqueta', position: 'MEI' },
    { name: 'Kudus', position: 'ATA' },
  ],
  Leeds: [
    { name: 'Piroe', position: 'ATA' },
    { name: 'Rutter', position: 'ATA' },
    { name: 'James', position: 'ATA' },
  ],
  Burnley: [
    { name: 'Foster', position: 'ATA' },
    { name: 'Rodriguez', position: 'ATA' },
    { name: 'Brownhill', position: 'MEI' },
  ],
  Getafe: [
    { name: 'Mayoral', position: 'ATA' },
    { name: 'Greenwood', position: 'ATA' },
    { name: 'Latasa', position: 'ATA' },
  ],
  Elche: [
    { name: 'Boye', position: 'ATA' },
    { name: 'Pere Milla', position: 'ATA' },
    { name: 'Mojica', position: 'LAT' },
  ],
  Sevilla: [
    { name: 'Isaac Romero', position: 'ATA' },
    { name: 'Lukebakio', position: 'ATA' },
    { name: 'Ocampos', position: 'ATA' },
  ],
  Villarreal: [
    { name: 'Gerard Moreno', position: 'ATA' },
    { name: 'Ayoze Perez', position: 'ATA' },
    { name: 'Baena', position: 'MEI' },
  ],
  Alavés: [
    { name: 'Samu Omorodion', position: 'ATA' },
    { name: 'Carlos Vicente', position: 'ATA' },
    { name: 'Rioja', position: 'ATA' },
  ],
  Espanyol: [
    { name: 'Puado', position: 'ATA' },
    { name: 'Joselu', position: 'ATA' },
    { name: 'Bare', position: 'MEI' },
  ],
  Mallorca: [
    { name: 'Muriqi', position: 'ATA' },
    { name: 'Larin', position: 'ATA' },
    { name: 'Darder', position: 'MEI' },
  ],
  Levante: [
    { name: 'Bouldini', position: 'ATA' },
    { name: 'Brugué', position: 'ATA' },
    { name: 'Iborra', position: 'MEI' },
  ],
  'B. Leverkusen': [
    { name: 'Wirtz', position: 'MEI' },
    { name: 'Boniface', position: 'ATA' },
    { name: 'Grimaldo', position: 'LAT' },
  ],
  Bayern: [
    { name: 'Harry Kane', position: 'ATA' },
    { name: 'Musiala', position: 'MEI' },
    { name: 'Sane', position: 'ATA' },
  ],
  'B. Dortmund': [
    { name: 'Adeyemi', position: 'ATA' },
    { name: 'Guirassy', position: 'ATA' },
    { name: 'Brandt', position: 'MEI' },
  ],
  'RB Leipzig': [
    { name: 'Sesko', position: 'ATA' },
    { name: 'Openda', position: 'ATA' },
    { name: 'Xavi Simons', position: 'MEI' },
  ],
  Wolfsburg: [
    { name: 'Wind', position: 'ATA' },
    { name: 'Wimmer', position: 'ATA' },
    { name: 'Majer', position: 'MEI' },
  ],
  Eintracht: [
    { name: 'Ekitike', position: 'ATA' },
    { name: 'Marmoush', position: 'ATA' },
    { name: 'Knauff', position: 'ALA' },
  ],
  Augsburg: [
    { name: 'Demirovic', position: 'ATA' },
    { name: 'Tietz', position: 'ATA' },
    { name: 'Vargas', position: 'ATA' },
  ],
  Hamburger: [
    { name: 'Glatzel', position: 'ATA' },
    { name: 'Selke', position: 'ATA' },
    { name: 'Königsdörffer', position: 'ATA' },
  ],
  Vitória: [
    { name: 'Osvaldo', position: 'ATA' },
    { name: 'Alerrandro', position: 'ATA' },
    { name: 'Matheuzinho', position: 'MEI' },
  ],
  Sport: [
    { name: 'Barletta', position: 'ATA' },
    { name: 'Gustavo Coutinho', position: 'ATA' },
    { name: 'Lucas Lima', position: 'MEI' },
  ],
  Grêmio: [
    { name: 'Braithwaite', position: 'ATA' },
    { name: 'Cristaldo', position: 'MEI' },
    { name: 'Pavon', position: 'ATA' },
  ],
  Juventude: [
    { name: 'Gilberto', position: 'ATA' },
    { name: 'Marcelinho', position: 'ATA' },
    { name: 'Nenê', position: 'MEI' },
  ],
}

const calendarFootballAssistPlayersByTeam: Record<string, TeamPlayerProfile[]> = {
  Flamengo: [
    { name: 'Arrascaeta', position: 'MEI' },
    { name: 'Gerson', position: 'MEI' },
    { name: 'De la Cruz', position: 'MEI' },
  ],
  Cruzeiro: [
    { name: 'Matheus Pereira', position: 'MEI' },
    { name: 'Lucas Silva', position: 'MEI' },
    { name: 'Ramiro', position: 'MEI' },
  ],
  Internacional: [
    { name: 'Alan Patrick', position: 'MEI' },
    { name: 'Bruno Henrique', position: 'MEI' },
    { name: 'Wanderson', position: 'MEI' },
  ],
  Bragantino: [
    { name: 'Lincoln', position: 'MEI' },
    { name: 'Jadsom', position: 'MEI' },
    { name: 'Eric Ramires', position: 'MEI' },
  ],
  Mirassol: [
    { name: 'Chico Kim', position: 'MEI' },
    { name: 'Gabriel', position: 'MEI' },
    { name: 'Danielzinho', position: 'MEI' },
  ],
  'São Paulo': [
    { name: 'Lucas Moura', position: 'MEI' },
    { name: 'Luciano', position: 'MEI' },
    { name: 'Alisson', position: 'MEI' },
  ],
  Palmeiras: [
    { name: 'Raphael Veiga', position: 'MEI' },
    { name: 'Mauricio', position: 'MEI' },
    { name: 'Richard Rios', position: 'MEI' },
  ],
  Fluminense: [
    { name: 'Arias', position: 'MEI' },
    { name: 'Ganso', position: 'MEI' },
    { name: 'Lima', position: 'MEI' },
  ],
  Botafogo: [
    { name: 'Savarino', position: 'MEI' },
    { name: 'Almada', position: 'MEI' },
    { name: 'Marlon Freitas', position: 'MEI' },
  ],
  Bahia: [
    { name: 'Cauly', position: 'MEI' },
    { name: 'Everton Ribeiro', position: 'MEI' },
    { name: 'Jean Lucas', position: 'MEI' },
  ],
  'Atl. Mineiro': [
    { name: 'Gustavo Scarpa', position: 'MEI' },
    { name: 'Zaracho', position: 'MEI' },
    { name: 'Bernard', position: 'MEI' },
  ],
  Santos: [
    { name: 'Lucas Lima', position: 'MEI' },
    { name: 'Soteldo', position: 'MEI' },
    { name: 'Pituca', position: 'MEI' },
  ],
  'Atlético Madrid': [
    { name: 'Griezmann', position: 'MEI' },
    { name: 'De Paul', position: 'MEI' },
    { name: 'Koke', position: 'MEI' },
  ],
  Inter: [
    { name: 'Barella', position: 'MEI' },
    { name: 'Calhanoglu', position: 'MEI' },
    { name: 'Mkhitaryan', position: 'MEI' },
  ],
  PSG: [
    { name: 'Vitinha', position: 'MEI' },
    { name: 'Zaire-Emery', position: 'MEI' },
    { name: 'Fabian Ruiz', position: 'MEI' },
  ],
  Lyon: [
    { name: 'Cherki', position: 'MEI' },
    { name: 'Tolisso', position: 'MEI' },
    { name: 'Caqueret', position: 'MEI' },
  ],
  Newcastle: [
    { name: 'Bruno Guimaraes', position: 'MEI' },
    { name: 'Tonali', position: 'MEI' },
    { name: 'Joelinton', position: 'MEI' },
  ],
  Napoli: [
    { name: 'Anguissa', position: 'MEI' },
    { name: 'Lobotka', position: 'MEI' },
    { name: 'Zielinski', position: 'MEI' },
  ],
  'Real Madrid': [
    { name: 'Bellingham', position: 'MEI' },
    { name: 'Modric', position: 'MEI' },
    { name: 'Valverde', position: 'MEI' },
  ],
  Barcelona: [
    { name: 'Pedri', position: 'MEI' },
    { name: 'Gavi', position: 'MEI' },
    { name: 'De Jong', position: 'MEI' },
  ],
  Liverpool: [
    { name: 'Szoboszlai', position: 'MEI' },
    { name: 'Mac Allister', position: 'MEI' },
    { name: 'Curtis Jones', position: 'MEI' },
  ],
  'Man. City': [
    { name: 'De Bruyne', position: 'MEI' },
    { name: 'Foden', position: 'MEI' },
    { name: 'Bernardo Silva', position: 'MEI' },
  ],
  Benfica: [
    { name: 'Kokcu', position: 'MEI' },
    { name: 'Aursnes', position: 'MEI' },
    { name: 'Florentino', position: 'MEI' },
  ],
  Ajax: [
    { name: 'Berghuis', position: 'MEI' },
    { name: 'Henderson', position: 'MEI' },
    { name: 'Taylor', position: 'MEI' },
  ],
  Arsenal: [
    { name: 'Odegaard', position: 'MEI' },
    { name: 'Rice', position: 'MEI' },
    { name: 'Havertz', position: 'MEI' },
  ],
  Chelsea: [
    { name: 'Palmer', position: 'MEI' },
    { name: 'Enzo Fernandez', position: 'MEI' },
    { name: 'Caicedo', position: 'MEI' },
  ],
  Tottenham: [
    { name: 'Maddison', position: 'MEI' },
    { name: 'Kulusevski', position: 'MEI' },
    { name: 'Bentancur', position: 'MEI' },
  ],
  Wolves: [
    { name: 'Cunha', position: 'MEI' },
    { name: 'Joao Gomes', position: 'MEI' },
    { name: 'Lemina', position: 'MEI' },
  ],
  Brighton: [
    { name: 'Joao Pedro', position: 'MEI' },
    { name: 'Mitoma', position: 'MEI' },
    { name: 'Gross', position: 'MEI' },
  ],
  'West Ham': [
    { name: 'Paqueta', position: 'MEI' },
    { name: 'Kudus', position: 'MEI' },
    { name: 'Ward-Prowse', position: 'MEI' },
  ],
  Leeds: [
    { name: 'Rutter', position: 'MEI' },
    { name: 'Gnonto', position: 'MEI' },
    { name: 'Ampadu', position: 'MEI' },
  ],
  Burnley: [
    { name: 'Brownhill', position: 'MEI' },
    { name: 'Gudmundsson', position: 'MEI' },
    { name: 'Koleosho', position: 'MEI' },
  ],
  Getafe: [
    { name: 'Maksimovic', position: 'MEI' },
    { name: 'Alena', position: 'MEI' },
    { name: 'Milla', position: 'MEI' },
  ],
  Elche: [
    { name: 'Fidel', position: 'MEI' },
    { name: 'Febas', position: 'MEI' },
    { name: 'Josan', position: 'MEI' },
  ],
  Sevilla: [
    { name: 'Rakitic', position: 'MEI' },
    { name: 'Suso', position: 'MEI' },
    { name: 'Oliver Torres', position: 'MEI' },
  ],
  Villarreal: [
    { name: 'Baena', position: 'MEI' },
    { name: 'Parejo', position: 'MEI' },
    { name: 'Trigueros', position: 'MEI' },
  ],
  Alavés: [
    { name: 'Guridi', position: 'MEI' },
    { name: 'Blanco', position: 'MEI' },
    { name: 'Carlos Vicente', position: 'MEI' },
  ],
  Espanyol: [
    { name: 'Darder', position: 'MEI' },
    { name: 'Bare', position: 'MEI' },
    { name: 'Melamed', position: 'MEI' },
  ],
  Mallorca: [
    { name: 'Darder', position: 'MEI' },
    { name: 'Dani Rodriguez', position: 'MEI' },
    { name: 'Antonio Sanchez', position: 'MEI' },
  ],
  Levante: [
    { name: 'Iborra', position: 'MEI' },
    { name: 'Pablo Martinez', position: 'MEI' },
    { name: 'Brugue', position: 'MEI' },
  ],
  'B. Leverkusen': [
    { name: 'Wirtz', position: 'MEI' },
    { name: 'Xhaka', position: 'MEI' },
    { name: 'Palacios', position: 'MEI' },
  ],
  Bayern: [
    { name: 'Musiala', position: 'MEI' },
    { name: 'Kimmich', position: 'MEI' },
    { name: 'Muller', position: 'MEI' },
  ],
  'B. Dortmund': [
    { name: 'Brandt', position: 'MEI' },
    { name: 'Reyna', position: 'MEI' },
    { name: 'Nmecha', position: 'MEI' },
  ],
  'RB Leipzig': [
    { name: 'Xavi Simons', position: 'MEI' },
    { name: 'Forsberg', position: 'MEI' },
    { name: 'Haidara', position: 'MEI' },
  ],
  Wolfsburg: [
    { name: 'Majer', position: 'MEI' },
    { name: 'Arnold', position: 'MEI' },
    { name: 'Wimmer', position: 'MEI' },
  ],
  Eintracht: [
    { name: 'Gotze', position: 'MEI' },
    { name: 'Skhiri', position: 'MEI' },
    { name: 'Knauff', position: 'MEI' },
  ],
  Augsburg: [
    { name: 'Vargas', position: 'MEI' },
    { name: 'Rexhbecaj', position: 'MEI' },
    { name: 'Maier', position: 'MEI' },
  ],
  Hamburger: [
    { name: 'Kittel', position: 'MEI' },
    { name: 'Reis', position: 'MEI' },
    { name: 'Königsdörffer', position: 'MEI' },
  ],
  Vitória: [
    { name: 'Matheuzinho', position: 'MEI' },
    { name: 'Wellington Rato', position: 'MEI' },
    { name: 'Luan', position: 'MEI' },
  ],
  Sport: [
    { name: 'Lucas Lima', position: 'MEI' },
    { name: 'Fabinho', position: 'MEI' },
    { name: 'Felipe', position: 'MEI' },
  ],
  Grêmio: [
    { name: 'Cristaldo', position: 'MEI' },
    { name: 'Villasanti', position: 'MEI' },
    { name: 'Pepê', position: 'MEI' },
  ],
  Juventude: [
    { name: 'Nenê', position: 'MEI' },
    { name: 'Jadson', position: 'MEI' },
    { name: 'Jean Carlos', position: 'MEI' },
  ],
}

const calendarBasketballPointPlayersByTeam: Record<string, TeamPlayerProfile[]> = {
  Jazz: [
    { name: 'Lauri Markkanen', position: 'ALA' },
    { name: 'Keyonte George', position: 'ARM' },
    { name: 'Collin Sexton', position: 'ARM' },
  ],
  Thunder: [
    { name: 'Shai Gilgeous-Alexander', position: 'ARM' },
    { name: 'Jalen Williams', position: 'ALA' },
    { name: 'Chet Holmgren', position: 'PIV' },
  ],
  Knicks: [
    { name: 'Jalen Brunson', position: 'ARM' },
    { name: 'Karl-Anthony Towns', position: 'PIV' },
    { name: 'Mikal Bridges', position: 'ALA' },
  ],
  Magic: [
    { name: 'Paolo Banchero', position: 'ALA' },
    { name: 'Franz Wagner', position: 'ALA' },
    { name: 'Jalen Suggs', position: 'ARM' },
  ],
  Bulls: [
    { name: 'Coby White', position: 'ARM' },
    { name: 'Josh Giddey', position: 'ARM' },
    { name: 'Nikola Vucevic', position: 'PIV' },
  ],
  Heat: [
    { name: 'Tyler Herro', position: 'ARM' },
    { name: 'Bam Adebayo', position: 'PIV' },
    { name: 'Jaime Jaquez Jr.', position: 'ALA' },
  ],
  '76ers': [
    { name: 'Tyrese Maxey', position: 'ARM' },
    { name: 'Joel Embiid', position: 'PIV' },
    { name: 'Paul George', position: 'ALA' },
  ],
  Celtics: [
    { name: 'Jayson Tatum', position: 'ALA' },
    { name: 'Jaylen Brown', position: 'ALA' },
    { name: 'Derrick White', position: 'ARM' },
  ],
  Nuggets: [
    { name: 'Nikola Jokic', position: 'PIV' },
    { name: 'Jamal Murray', position: 'ARM' },
    { name: 'Michael Porter Jr.', position: 'ALA' },
  ],
  Suns: [
    { name: 'Devin Booker', position: 'ARM' },
    { name: 'Kevin Durant', position: 'ALA' },
    { name: 'Bradley Beal', position: 'ARM' },
  ],
  Mavericks: [
    { name: 'Kyrie Irving', position: 'ARM' },
    { name: 'Anthony Davis', position: 'PIV' },
    { name: 'Klay Thompson', position: 'ALA' },
  ],
  Spurs: [
    { name: 'Victor Wembanyama', position: 'PIV' },
    { name: 'DeAaron Fox', position: 'ARM' },
    { name: 'Devin Vassell', position: 'ALA' },
  ],
  Clippers: [
    { name: 'Kawhi Leonard', position: 'ALA' },
    { name: 'James Harden', position: 'ARM' },
    { name: 'Norman Powell', position: 'ALA' },
  ],
  Kings: [
    { name: 'DeMar DeRozan', position: 'ALA' },
    { name: 'Zach LaVine', position: 'ALA' },
    { name: 'Domantas Sabonis', position: 'PIV' },
  ],
  'Southern Wesleyan': [
    { name: 'Jacob Smith', position: 'ARM' },
    { name: 'Marcus Brown', position: 'ALA' },
    { name: 'Tyler Johnson', position: 'PIV' },
  ],
  'Kennesaw State': [
    { name: 'Terrell Burden', position: 'ARM' },
    { name: 'Demond Robinson', position: 'PIV' },
    { name: 'Chris Youngblood', position: 'ALA' },
  ],
  Lafayette: [
    { name: 'Devin Hines', position: 'ARM' },
    { name: 'Kyle Jenkins', position: 'ALA' },
    { name: 'Ryan Pettit', position: 'PIV' },
  ],
  Pennsylvania: [
    { name: 'Clark Slajchert', position: 'ARM' },
    { name: 'Nick Spinoso', position: 'PIV' },
    { name: 'Sam Brown', position: 'ALA' },
  ],
  'South Carolina St.': [
    { name: 'Mitchel Taylor', position: 'ARM' },
    { name: 'Davion Everett', position: 'PIV' },
    { name: 'Michael Teal', position: 'ALA' },
  ],
  Charleston: [
    { name: 'Ante Brzovic', position: 'ALA' },
    { name: 'CJ Fulton', position: 'ARM' },
    { name: 'Kobe Rodgers', position: 'ALA' },
  ],
  Southern: [
    { name: 'Brandon Davis', position: 'ARM' },
    { name: 'Michael Jacobs', position: 'ALA' },
    { name: 'Tyrone Lyons', position: 'ALA' },
  ],
  Texas: [
    { name: 'Max Abmas', position: 'ARM' },
    { name: 'Dylan Disu', position: 'ALA' },
    { name: 'Tyrese Hunter', position: 'ARM' },
  ],
  Besiktas: [
    { name: 'Derek Needham', position: 'ARM' },
    { name: 'Matt Mitchell', position: 'ALA' },
    { name: 'Jonah Mathews', position: 'ARM' },
  ],
  Lietkabelis: [
    { name: 'Gediminas Orelik', position: 'ALA' },
    { name: 'Vytenis Lipkevicius', position: 'ALA' },
    { name: 'Kristupas Zemaitis', position: 'ARM' },
  ],
  'Chemnitz 99': [
    { name: 'Aher Uguak', position: 'ALA' },
    { name: 'Kaza Kajami-Keane', position: 'ARM' },
    { name: 'Wes van Beck', position: 'ALA' },
  ],
  Panionios: [
    { name: 'Kendrick Ray', position: 'ARM' },
    { name: 'Giorgos Tsalmpouris', position: 'PIV' },
    { name: 'Nikos Gikas', position: 'ARM' },
  ],
  'Hapoel Jerusalem': [
    { name: 'Levi Randolph', position: 'ALA' },
    { name: 'Khadeen Carrington', position: 'ARM' },
    { name: 'Austin Wiley', position: 'PIV' },
  ],
  'Hamburg Towers': [
    { name: 'Brae Ivey', position: 'ARM' },
    { name: 'Jordan Barnett', position: 'ALA' },
    { name: 'Nico Brauner', position: 'ARM' },
  ],
  Paulistano: [
    { name: 'Deryk Ramos', position: 'ARM' },
    { name: 'Eddy Carvalho', position: 'ALA' },
    { name: 'Victao', position: 'PIV' },
  ],
  Unifacisa: [
    { name: 'Trevor Gaskins', position: 'ARM' },
    { name: 'Gerson', position: 'ALA' },
    { name: 'Joao Vitor', position: 'PIV' },
  ],
  Botafogo: [
    { name: 'Coelho', position: 'ARM' },
    { name: 'Pastor', position: 'ALA' },
    { name: 'Machado', position: 'ALA' },
  ],
  'Caxias do Sul': [
    { name: 'Alexey', position: 'ARM' },
    { name: 'Enzo', position: 'ALA' },
    { name: 'Pedro', position: 'PIV' },
  ],
  Flamengo: [
    { name: 'Yago Santos', position: 'ARM' },
    { name: 'Gui Deodato', position: 'ALA' },
    { name: 'Gabriel Jau', position: 'PIV' },
  ],
  Minas: [
    { name: 'Elinho', position: 'ARM' },
    { name: 'Shaq Johnson', position: 'ALA' },
    { name: 'Renan Lenz', position: 'PIV' },
  ],
  'São Paulo': [
    { name: 'Georginho', position: 'ARM' },
    { name: 'Lucas Dias', position: 'ALA' },
    { name: 'Malcolm Miller', position: 'ALA' },
  ],
  Pinheiros: [
    { name: 'Ruivo', position: 'ARM' },
    { name: 'Munford', position: 'ALA' },
    { name: 'Dikembe', position: 'PIV' },
  ],
  Valencia: [
    { name: 'Raquel Carrera', position: 'ALA' },
    { name: 'Queralt Casas', position: 'ARM' },
    { name: 'Leticia Romero', position: 'ARM' },
  ],
  'USK Praha': [
    { name: 'Ezi Magbegor', position: 'PIV' },
    { name: 'Teja Oblak', position: 'ARM' },
    { name: 'Maria Conde', position: 'ALA' },
  ],
  Bourges: [
    { name: 'Alix Duchet', position: 'ARM' },
    { name: 'Pauline Astier', position: 'ARM' },
    { name: 'Artemis Spanou', position: 'ALA' },
  ],
  'Lyon ASVEL': [
    { name: 'Marine Johannes', position: 'ARM' },
    { name: 'Gabby Williams', position: 'ALA' },
    { name: 'Julie Allemand', position: 'ARM' },
  ],
  Fenerbahçe: [
    { name: 'Emma Meesseman', position: 'PIV' },
    { name: 'Satou Sabally', position: 'ALA' },
    { name: 'Kayla McBride', position: 'ARM' },
  ],
  Sopron: [
    { name: 'Yvonne Turner', position: 'ARM' },
    { name: 'Jelena Brooks', position: 'ALA' },
    { name: 'Brittney Sykes', position: 'ALA' },
  ],
  Schio: [
    { name: 'Arella Guirantes', position: 'ARM' },
    { name: 'Jasmine Keys', position: 'PIV' },
    { name: 'Giorgia Sottana', position: 'ARM' },
  ],
  Girona: [
    { name: 'Marianna Tolo', position: 'PIV' },
    { name: 'Laura Pena', position: 'ARM' },
    { name: 'Magali Mendy', position: 'ALA' },
  ],
}

const calendarBasketballAssistPlayersByTeam: Record<string, TeamPlayerProfile[]> = {
  Jazz: [
    { name: 'Keyonte George', position: 'ARM' },
    { name: 'Isaiah Collier', position: 'ARM' },
    { name: 'Collin Sexton', position: 'ARM' },
  ],
  Thunder: [
    { name: 'Shai Gilgeous-Alexander', position: 'ARM' },
    { name: 'Jalen Williams', position: 'ALA' },
    { name: 'Alex Caruso', position: 'ARM' },
  ],
  Knicks: [
    { name: 'Jalen Brunson', position: 'ARM' },
    { name: 'Josh Hart', position: 'ALA' },
    { name: 'Miles McBride', position: 'ARM' },
  ],
  Magic: [
    { name: 'Paolo Banchero', position: 'ALA' },
    { name: 'Jalen Suggs', position: 'ARM' },
    { name: 'Anthony Black', position: 'ARM' },
  ],
  Bulls: [
    { name: 'Josh Giddey', position: 'ARM' },
    { name: 'Coby White', position: 'ARM' },
    { name: 'Ayo Dosunmu', position: 'ARM' },
  ],
  Heat: [
    { name: 'Tyler Herro', position: 'ARM' },
    { name: 'Bam Adebayo', position: 'PIV' },
    { name: 'Terry Rozier', position: 'ARM' },
  ],
  Celtics: [
    { name: 'Derrick White', position: 'ARM' },
    { name: 'Jrue Holiday', position: 'ARM' },
    { name: 'Jayson Tatum', position: 'ALA' },
  ],
  Nuggets: [
    { name: 'Nikola Jokic', position: 'PIV' },
    { name: 'Jamal Murray', position: 'ARM' },
    { name: 'Aaron Gordon', position: 'ALA' },
  ],
  Suns: [
    { name: 'Devin Booker', position: 'ARM' },
    { name: 'Tyus Jones', position: 'ARM' },
    { name: 'Bradley Beal', position: 'ARM' },
  ],
  Clippers: [
    { name: 'James Harden', position: 'ARM' },
    { name: 'Kawhi Leonard', position: 'ALA' },
    { name: 'Kris Dunn', position: 'ARM' },
  ],
  Kings: [
    { name: 'Domantas Sabonis', position: 'PIV' },
    { name: 'Malik Monk', position: 'ARM' },
    { name: 'DeMar DeRozan', position: 'ALA' },
  ],
  Mavericks: [
    { name: 'Kyrie Irving', position: 'ARM' },
    { name: 'Spencer Dinwiddie', position: 'ARM' },
    { name: 'Anthony Davis', position: 'PIV' },
  ],
  Spurs: [
    { name: 'DeAaron Fox', position: 'ARM' },
    { name: 'Stephon Castle', position: 'ARM' },
    { name: 'Victor Wembanyama', position: 'PIV' },
  ],
  Lafayette: [
    { name: 'Devin Hines', position: 'ARM' },
    { name: 'Kyle Jenkins', position: 'ALA' },
    { name: 'Ryan Pettit', position: 'PIV' },
  ],
  Pennsylvania: [
    { name: 'Clark Slajchert', position: 'ARM' },
    { name: 'Nick Spinoso', position: 'PIV' },
    { name: 'Sam Brown', position: 'ALA' },
  ],
  'South Carolina St.': [
    { name: 'Mitchel Taylor', position: 'ARM' },
    { name: 'Michael Teal', position: 'ALA' },
    { name: 'Davion Everett', position: 'PIV' },
  ],
  Charleston: [
    { name: 'CJ Fulton', position: 'ARM' },
    { name: 'Ante Brzovic', position: 'ALA' },
    { name: 'Kobe Rodgers', position: 'ALA' },
  ],
  Southern: [
    { name: 'Brandon Davis', position: 'ARM' },
    { name: 'Michael Jacobs', position: 'ALA' },
    { name: 'Tyrone Lyons', position: 'ALA' },
  ],
  Texas: [
    { name: 'Max Abmas', position: 'ARM' },
    { name: 'Tyrese Hunter', position: 'ARM' },
    { name: 'Dylan Disu', position: 'ALA' },
  ],
}

const isCalendarFootballPlayerPropsMarket = (marketId: string) =>
  marketId === CALENDAR_FOOTBALL_FINISHING_MARKET_ID ||
  marketId === CALENDAR_FOOTBALL_ASSISTS_MARKET_ID

const isCalendarBasketballPlayerPropsMarket = (marketId: string) =>
  marketId === CALENDAR_BASKETBALL_POINTS_MARKET_ID ||
  marketId === CALENDAR_BASKETBALL_ASSISTS_MARKET_ID

const isCalendarPlayerPropsMarket = (sport: string, marketId: string) =>
  sport === 'basquete'
    ? isCalendarBasketballPlayerPropsMarket(marketId)
    : sport === 'futebol' && isCalendarFootballPlayerPropsMarket(marketId)

const getCalendarFootballPlayerProps = (
  event: CompetitionEvent,
  marketId: string,
  homeIcon: string,
  awayIcon: string
): MatchPlayerProp[] => {
  const optionSets = marketId === CALENDAR_FOOTBALL_ASSISTS_MARKET_ID
    ? calendarFootballAssistOptionSets
    : calendarFootballFinishingOptionSets
  const playersByTeam = marketId === CALENDAR_FOOTBALL_ASSISTS_MARKET_ID
    ? calendarFootballAssistPlayersByTeam
    : calendarFootballFinishingPlayersByTeam
  const homePlayers = playersByTeam[event.homeName] ?? []
  const awayPlayers = playersByTeam[event.awayName] ?? []
  const orderedPlayers = [
    ...homePlayers.slice(0, 1).map((player) => ({ ...player, teamName: event.homeName, teamIcon: homeIcon, teamSide: 'home' as const })),
    ...awayPlayers.slice(0, 1).map((player) => ({ ...player, teamName: event.awayName, teamIcon: awayIcon, teamSide: 'away' as const })),
    ...homePlayers.slice(1, 2).map((player) => ({ ...player, teamName: event.homeName, teamIcon: homeIcon, teamSide: 'home' as const })),
    ...awayPlayers.slice(1, 2).map((player) => ({ ...player, teamName: event.awayName, teamIcon: awayIcon, teamSide: 'away' as const })),
    ...homePlayers.slice(2).map((player) => ({ ...player, teamName: event.homeName, teamIcon: homeIcon, teamSide: 'home' as const })),
    ...awayPlayers.slice(2).map((player) => ({ ...player, teamName: event.awayName, teamIcon: awayIcon, teamSide: 'away' as const })),
  ]
  const uniquePlayerNames = new Set<string>()

  return orderedPlayers.reduce<MatchPlayerProp[]>((players, player) => {
    if (players.length >= CALENDAR_PLAYER_PROPS_PER_EVENT || uniquePlayerNames.has(player.name)) return players

    uniquePlayerNames.add(player.name)
    players.push({
      id: `${event.id}-${marketId}-${player.teamName}-${player.name}`,
      playerName: player.name,
      teamName: player.teamName,
      teamIcon: player.teamIcon,
      teamSide: player.teamSide,
      sport: 'futebol',
      position: player.position,
      image: playerAvatarFutebol,
      options: optionSets[players.length % optionSets.length],
    })
    return players
  }, [])
}

const getCalendarBasketballPlayerProps = (
  event: CompetitionEvent,
  marketId: string,
  homeIcon: string,
  awayIcon: string
): MatchPlayerProp[] => {
  const isAssistMarket = marketId === CALENDAR_BASKETBALL_ASSISTS_MARKET_ID
  const optionSets = isAssistMarket
    ? calendarBasketballAssistOptionSets
    : calendarBasketballPointOptionSets
  const homePlayers = (isAssistMarket
    ? calendarBasketballAssistPlayersByTeam[event.homeName]
    : calendarBasketballPointPlayersByTeam[event.homeName]) ?? calendarBasketballPointPlayersByTeam[event.homeName] ?? []
  const awayPlayers = (isAssistMarket
    ? calendarBasketballAssistPlayersByTeam[event.awayName]
    : calendarBasketballPointPlayersByTeam[event.awayName]) ?? calendarBasketballPointPlayersByTeam[event.awayName] ?? []
  const orderedPlayers = [
    ...homePlayers.slice(0, 1).map((player) => ({ ...player, teamName: event.homeName, teamIcon: homeIcon, teamSide: 'home' as const })),
    ...awayPlayers.slice(0, 1).map((player) => ({ ...player, teamName: event.awayName, teamIcon: awayIcon, teamSide: 'away' as const })),
    ...homePlayers.slice(1, 2).map((player) => ({ ...player, teamName: event.homeName, teamIcon: homeIcon, teamSide: 'home' as const })),
    ...awayPlayers.slice(1, 2).map((player) => ({ ...player, teamName: event.awayName, teamIcon: awayIcon, teamSide: 'away' as const })),
    ...homePlayers.slice(2).map((player) => ({ ...player, teamName: event.homeName, teamIcon: homeIcon, teamSide: 'home' as const })),
    ...awayPlayers.slice(2).map((player) => ({ ...player, teamName: event.awayName, teamIcon: awayIcon, teamSide: 'away' as const })),
  ]
  const uniquePlayerNames = new Set<string>()

  return orderedPlayers.reduce<MatchPlayerProp[]>((players, player) => {
    if (players.length >= CALENDAR_PLAYER_PROPS_PER_EVENT || uniquePlayerNames.has(player.name)) return players

    uniquePlayerNames.add(player.name)
    players.push({
      id: `${event.id}-${marketId}-${player.teamName}-${player.name}`,
      playerName: player.name,
      teamName: player.teamName,
      teamIcon: player.teamIcon,
      teamSide: player.teamSide,
      sport: 'basquete',
      position: player.position,
      image: playerAvatarBasquete,
      options: optionSets[players.length % optionSets.length],
    })
    return players
  }, [])
}

const getCalendarPlayerProps = (
  event: CompetitionEvent,
  sport: string,
  marketId: string,
  homeIcon: string,
  awayIcon: string
) =>
  sport === 'basquete'
    ? getCalendarBasketballPlayerProps(event, marketId, homeIcon, awayIcon)
    : getCalendarFootballPlayerProps(event, marketId, homeIcon, awayIcon)

function getCalendarSportFallbackIcon(sport: string): string {
  if (sport === 'basquete') return iconBasquete
  if (sport === 'futebol') return iconFutebol
  if (sport === 'tenis') return iconTenis
  return ''
}

function isCalendarSportFallbackIcon(icon: string | undefined, sport: string): boolean {
  if (!icon) return true
  if (sport === 'basquete') return icon === iconBasquete || icon === escudoDefaultBasquete
  return icon === getCalendarSportFallbackIcon(sport)
}

interface CalendarTeamIconProps {
  teamName: string
  currentIcon: string | undefined
  sport: string
  side: 'home' | 'away'
}

function CalendarTeamIcon({ teamName, currentIcon, sport, side }: CalendarTeamIconProps) {
  const fallbackIcon = getCalendarSportFallbackIcon(sport)
  const displayIcon = sport === 'tenis'
    ? getTennisPlayerCountryIcon(teamName, currentIcon)
    : currentIcon
  const resolvedIcon = useSportsDbTeamLogo(teamName, displayIcon, sport, fallbackIcon || undefined, {
    useCurrentLogoFallback: sport === 'tenis',
  })

  if (!resolvedIcon) return <div className="prematch-section__team-icon--placeholder" />

  if (isCalendarSportFallbackIcon(resolvedIcon, sport)) {
    const fallbackModifier = sport === 'basquete' ? 'basketball' : 'sport'

    return (
      <img
        src={fallbackIcon}
        alt=""
        className={`prematch-section__team-icon prematch-section__team-icon--${fallbackModifier}-${side}`}
      />
    )
  }

  return <img src={resolvedIcon} alt="" className="prematch-section__team-icon" />
}

export interface CompetitionEvent {
  id: string
  dateTime: string
  isLive?: boolean
  earlyPayout?: boolean
  homeScore?: number
  awayScore?: number
  homeName: string
  homeIcon: string
  awayName: string
  awayIcon: string
  odds: {
    home: string
    draw?: string
    away: string
  }
  doubleChanceOdds?: {
    homeOrDraw: string
    homeOrAway: string
    awayOrDraw: string
  }
  bothTeamsScoreOdds?: {
    yes: string
    no: string
  }
  totalGoalsOdds?: {
    line: number
    under: string
    over: string
  }
  totalCornersOdds?: {
    line: number
    under: string
    over: string
  }
  totalPointsOdds?: {
    line: number
    under: string
    over: string
  }
  totalGamesOdds?: {
    line: number
    under: string
    over: string
  }
  handicapOdds?: {
    line: number
    home: string
    away: string
  }
  q3TotalOdds?: {
    line: number
    under: string
    over: string
  }
  q4TotalOdds?: {
    line: number
    under: string
    over: string
  }
}

export interface Championship {
  id: string
  name: string
  flag: string
  sport: string
  events: CompetitionEvent[]
}

const oddNumber = (odd: string) => Number(odd.replace('x', ''))

const formatOdd = (odd: number) => `${Math.max(1.05, odd).toFixed(2)}x`

const tennisCompetitionEvent = (
  id: string,
  dateTime: string,
  homeName: string,
  awayName: string,
  homeOdd: string,
  awayOdd: string
): CompetitionEvent => ({
  id,
  dateTime,
  earlyPayout: false,
  homeName,
  homeIcon: getTennisPlayerCountryIcon(homeName, iconTenis),
  awayName,
  awayIcon: getTennisPlayerCountryIcon(awayName, iconTenis),
  odds: { home: homeOdd, away: awayOdd },
})

const eventSeed = (event: CompetitionEvent) =>
  event.id.split('').reduce((total, char) => total + char.charCodeAt(0), 0)

interface MarketOdds {
  doubleChance?: {
    homeOrDraw: string
    homeOrAway: string
    awayOrDraw: string
  }
  bothTeamsScore?: {
    yes: string
    no: string
  }
  totalGoals?: {
    line: number
    under: string
    over: string
  }
  totalCorners?: {
    line: number
    under: string
    over: string
  }
  totalPoints?: {
    line: number
    under: string
    over: string
  }
  totalGames?: {
    line: number
    under: string
    over: string
  }
  handicap?: {
    homeLine: number
    awayLine: number
    home: string
    away: string
  }
  q3Total?: {
    line: number
    under: string
    over: string
  }
  q4Total?: {
    line: number
    under: string
    over: string
  }
}

const getMarketOdds = (event: CompetitionEvent, sport: string): MarketOdds => {
  const seed = eventSeed(event)
  const homeOdd = oddNumber(event.odds.home)
  const drawOdd = event.odds.draw ? oddNumber(event.odds.draw) : 0
  const awayOdd = oddNumber(event.odds.away)
  const variation = (seed % 7) * 0.04

  if (sport === 'basquete') {
    const baseTotal = 164.5 + (seed % 9) * 2
    const quarterTotal = 39.5 + (seed % 5)
    const favoriteIsHome = homeOdd < awayOdd
    const handicapLine = Number((3.5 + (seed % 6)).toFixed(1))
    const eventHandicapLine = event.handicapOdds?.line

    return {
      totalPoints: event.totalPointsOdds ?? {
        line: baseTotal,
        under: formatOdd(1.78 + variation),
        over: formatOdd(2.04 - variation),
      },
      handicap: event.handicapOdds ? {
        homeLine: eventHandicapLine ?? 0,
        awayLine: eventHandicapLine ? -eventHandicapLine : 0,
        home: event.handicapOdds.home,
        away: event.handicapOdds.away,
      } : {
        homeLine: favoriteIsHome ? -handicapLine : handicapLine,
        awayLine: favoriteIsHome ? handicapLine : -handicapLine,
        home: formatOdd(1.82 + variation),
        away: formatOdd(1.98 - variation),
      },
      q3Total: event.q3TotalOdds ?? {
        line: quarterTotal,
        under: formatOdd(1.74 + variation),
        over: formatOdd(2.08 - variation),
      },
      q4Total: event.q4TotalOdds ?? {
        line: quarterTotal + 1,
        under: formatOdd(1.80 + variation),
        over: formatOdd(2.02 - variation),
      },
    }
  }

  if (sport === 'tenis') {
    const favoriteIsHome = homeOdd < awayOdd
    const handicapLine = Number((1.5 + (seed % 4)).toFixed(1))
    const eventHandicapLine = event.handicapOdds?.line
    const totalGamesLine = [19.5, 20.5, 21.5, 22.5][seed % 4]

    return {
      handicap: event.handicapOdds ? {
        homeLine: eventHandicapLine ?? 0,
        awayLine: eventHandicapLine ? -eventHandicapLine : 0,
        home: event.handicapOdds.home,
        away: event.handicapOdds.away,
      } : {
        homeLine: favoriteIsHome ? -handicapLine : handicapLine,
        awayLine: favoriteIsHome ? handicapLine : -handicapLine,
        home: formatOdd(1.84 + variation),
        away: formatOdd(1.96 - variation),
      },
      totalGames: event.totalGamesOdds ?? {
        line: totalGamesLine,
        under: formatOdd(1.78 + variation),
        over: formatOdd(2.04 - variation),
      },
    }
  }

  const totalGoalsLine = [1.5, 2.5, 3.5][seed % 3]
  const cornersLine = [8.5, 9.5, 10.5][seed % 3]

  return {
    doubleChance: event.doubleChanceOdds ?? {
      homeOrDraw: formatOdd(Math.min(homeOdd, drawOdd) - 0.36 + variation),
      homeOrAway: formatOdd(Math.min(homeOdd, awayOdd) - 0.28 + variation),
      awayOrDraw: formatOdd(Math.min(awayOdd, drawOdd) - 0.32 + variation),
    },
    bothTeamsScore: event.bothTeamsScoreOdds ?? {
      yes: formatOdd(1.62 + variation),
      no: formatOdd(2.28 - variation),
    },
    totalGoals: event.totalGoalsOdds ?? {
      line: totalGoalsLine,
      under: formatOdd(1.74 + variation),
      over: formatOdd(2.05 - variation),
    },
    totalCorners: event.totalCornersOdds ?? {
      line: cornersLine,
      under: formatOdd(1.78 + variation),
      over: formatOdd(2.00 - variation),
    },
  }
}

const parseMatchTime = (time: string) => {
  const quarterMatch = time.match(/Q(\d) (\d+):(\d+)/)
  if (quarterMatch) {
    return {
      period: Number(quarterMatch[1]),
      minutes: Number(quarterMatch[2]),
      seconds: Number(quarterMatch[3]),
      isQuarter: true,
    }
  }

  const halfMatch = time.match(/(\d)T (\d+):(\d+)/)
  if (halfMatch) {
    return {
      period: Number(halfMatch[1]),
      minutes: Number(halfMatch[2]),
      seconds: Number(halfMatch[3]),
      isQuarter: false,
    }
  }

  return null
}

// eslint-disable-next-line react-refresh/only-export-components
export const updateCompetitionMatchTime = (time: string) => {
  const parsed = parseMatchTime(time)
  if (!parsed) return time

  const { period, isQuarter } = parsed
  let { minutes, seconds } = parsed

  if (isQuarter) {
    seconds -= 1
    if (seconds < 0) {
      seconds = 59
      minutes = Math.max(0, minutes - 1)
    }
  } else {
    seconds += 1
    if (seconds >= 60) {
      seconds = 0
      minutes += 1
    }
  }

  const mins = String(minutes).padStart(2, '0')
  const secs = String(seconds).padStart(2, '0')
  return isQuarter ? `Q${period} ${mins}:${secs}` : `${period}T ${mins}:${secs}`
}

// eslint-disable-next-line react-refresh/only-export-components
export const championships: Championship[] = [
  // Futebol
  {
    id: 'brasil-serie-a',
    name: 'Brasil - Série A',
    flag: flagBrasil,
    sport: 'futebol',
    events: [
      {
        id: '1',
        dateTime: '2T 22:12',
        isLive: true,
        earlyPayout: false,
        homeScore: 2,
        awayScore: 1,
        homeName: 'Flamengo',
        homeIcon: escudoFlamengo,
        awayName: 'Cruzeiro',
        awayIcon: escudoCruzeiro,
        odds: { home: '1.25x', draw: '5.50x', away: '9.00x' },
        doubleChanceOdds: { homeOrDraw: '1.10x', homeOrAway: '1.15x', awayOrDraw: '3.20x' },
        bothTeamsScoreOdds: { yes: '1.45x', no: '2.60x' },
        totalGoalsOdds: { line: 3.5, under: '1.35x', over: '3.10x' },
        totalCornersOdds: { line: 9.5, under: '1.75x', over: '2.00x' },
      },
      {
        id: '2',
        dateTime: '1T 38:45',
        isLive: true,
        earlyPayout: false,
        homeScore: 1,
        awayScore: 1,
        homeName: 'Internacional',
        homeIcon: escudoInter,
        awayName: 'Bragantino',
        awayIcon: escudoBragantino,
        odds: { home: '2.10x', draw: '3.40x', away: '3.25x' },
        doubleChanceOdds: { homeOrDraw: '1.30x', homeOrAway: '1.28x', awayOrDraw: '1.65x' },
        bothTeamsScoreOdds: { yes: '1.55x', no: '2.30x' },
        totalGoalsOdds: { line: 2.5, under: '1.50x', over: '2.50x' },
        totalCornersOdds: { line: 9.5, under: '1.85x', over: '1.90x' },
      },
      {
        id: '11',
        dateTime: 'Intervalo',
        isLive: true,
        earlyPayout: false,
        homeScore: 0,
        awayScore: 1,
        homeName: 'Mirassol',
        homeIcon: escudoMirasol,
        awayName: 'São Paulo',
        awayIcon: escudoSaoPaulo,
        odds: { home: '4.50x', draw: '3.80x', away: '1.70x' },
        doubleChanceOdds: { homeOrDraw: '2.05x', homeOrAway: '1.25x', awayOrDraw: '1.18x' },
        bothTeamsScoreOdds: { yes: '1.85x', no: '1.90x' },
        totalGoalsOdds: { line: 2.5, under: '1.75x', over: '2.00x' },
        totalCornersOdds: { line: 9.5, under: '1.90x', over: '1.85x' },
      },
      {
        id: 'cal-f-1',
        dateTime: 'Hoje, 21:30',
        homeName: 'Palmeiras',
        homeIcon: escudoPalmeiras,
        awayName: 'Fluminense',
        awayIcon: escudoFluminense,
        odds: { home: '1.65x', draw: '3.80x', away: '5.00x' },
      },
      {
        id: 'cal-f-2',
        dateTime: 'Hoje, 21:30',
        homeName: 'Botafogo',
        homeIcon: escudoBotafogo,
        awayName: 'Bahia',
        awayIcon: iconFutebol,
        odds: { home: '1.85x', draw: '3.40x', away: '4.20x' },
      },
      {
        id: 'cal-f-3',
        dateTime: 'Amanhã, 20:00',
        homeName: 'Atl. Mineiro',
        homeIcon: escudoAtlMineiro,
        awayName: 'Santos',
        awayIcon: escudoSantos,
        odds: { home: '2.10x', draw: '3.25x', away: '3.50x' },
      },
      {
        id: 'cal-f-16',
        dateTime: 'Amanhã, 18:30',
        homeName: 'Vitória',
        homeIcon: iconFutebol,
        awayName: 'Sport',
        awayIcon: iconFutebol,
        odds: { home: '1.95x', draw: '3.40x', away: '3.50x' },
      },
      {
        id: 'cal-f-17',
        dateTime: 'Amanhã, 16:00',
        homeName: 'Grêmio',
        homeIcon: iconFutebol,
        awayName: 'Juventude',
        awayIcon: iconFutebol,
        odds: { home: '2.40x', draw: '3.20x', away: '2.85x' },
      },
    ],
  },
  {
    id: 'champions-league',
    name: 'Champions League',
    flag: flagMundo,
    sport: 'futebol',
    events: [
      {
        id: '3',
        dateTime: '1T 12:23',
        isLive: true,
        earlyPayout: false,
        homeScore: 0,
        awayScore: 0,
        homeName: 'Atlético Madrid',
        homeIcon: escudoAtleticoMadrid,
        awayName: 'Inter',
        awayIcon: escudoInterItalia,
        odds: { home: '2.35x', draw: '3.20x', away: '2.90x' },
        doubleChanceOdds: { homeOrDraw: '1.35x', homeOrAway: '1.30x', awayOrDraw: '1.52x' },
        bothTeamsScoreOdds: { yes: '1.70x', no: '2.05x' },
        totalGoalsOdds: { line: 2.5, under: '1.90x', over: '1.85x' },
        totalCornersOdds: { line: 10.5, under: '1.80x', over: '1.95x' },
      },
      {
        id: '4',
        dateTime: '2T 34:15',
        isLive: true,
        earlyPayout: false,
        homeScore: 2,
        awayScore: 2,
        homeName: 'PSG',
        homeIcon: escudoPSG,
        awayName: 'Lyon',
        awayIcon: escudoLyon,
        odds: { home: '1.65x', draw: '4.00x', away: '4.75x' },
        doubleChanceOdds: { homeOrDraw: '1.18x', homeOrAway: '1.22x', awayOrDraw: '2.15x' },
        bothTeamsScoreOdds: { yes: '1.40x', no: '2.85x' },
        totalGoalsOdds: { line: 4.5, under: '1.45x', over: '2.70x' },
        totalCornersOdds: { line: 10.5, under: '1.70x', over: '2.05x' },
      },
      {
        id: '12',
        dateTime: '1T 08:47',
        isLive: true,
        earlyPayout: false,
        homeScore: 0,
        awayScore: 0,
        homeName: 'Newcastle',
        homeIcon: escudoNewcastle,
        awayName: 'Napoli',
        awayIcon: escudoNapoli,
        odds: { home: '2.60x', draw: '3.30x', away: '2.70x' },
        doubleChanceOdds: { homeOrDraw: '1.45x', homeOrAway: '1.32x', awayOrDraw: '1.48x' },
        bothTeamsScoreOdds: { yes: '1.75x', no: '2.00x' },
        totalGoalsOdds: { line: 2.5, under: '1.85x', over: '1.90x' },
        totalCornersOdds: { line: 10.5, under: '1.88x', over: '1.88x' },
      },
      {
        id: 'cal-f-4',
        dateTime: 'Hoje, 16:00',
        homeName: 'Real Madrid',
        homeIcon: escudoReal,
        awayName: 'Barcelona',
        awayIcon: escudoBarca,
        odds: { home: '2.20x', draw: '3.40x', away: '3.10x' },
      },
      {
        id: 'cal-f-5',
        dateTime: 'Hoje, 16:00',
        homeName: 'Liverpool',
        homeIcon: escudoLiverpool,
        awayName: 'Man. City',
        awayIcon: escudoManchesterCity,
        odds: { home: '2.40x', draw: '3.50x', away: '2.80x' },
      },
      {
        id: 'cal-f-6',
        dateTime: 'Amanhã, 16:00',
        homeName: 'Benfica',
        homeIcon: escudoBenfica,
        awayName: 'Ajax',
        awayIcon: escudoAjax,
        odds: { home: '2.10x', draw: '3.40x', away: '3.30x' },
      },
    ],
  },
  {
    id: 'premier-league',
    name: 'Inglaterra - Premier League',
    flag: flagInglaterra,
    sport: 'futebol',
    events: [
      {
        id: 'premier-live-1',
        dateTime: '1T 18:34',
        isLive: true,
        earlyPayout: false,
        homeScore: 1,
        awayScore: 0,
        homeName: 'Arsenal',
        homeIcon: escudoArsenal,
        awayName: 'Chelsea',
        awayIcon: escudoChelsea,
        odds: { home: '1.72x', draw: '3.90x', away: '5.10x' },
        doubleChanceOdds: { homeOrDraw: '1.18x', homeOrAway: '1.24x', awayOrDraw: '2.10x' },
        bothTeamsScoreOdds: { yes: '1.82x', no: '1.92x' },
        totalGoalsOdds: { line: 2.5, under: '1.76x', over: '2.02x' },
        totalCornersOdds: { line: 9.5, under: '1.86x', over: '1.90x' },
      },
      {
        id: 'cal-f-7',
        dateTime: 'Hoje, 12:30',
        homeName: 'Tottenham',
        homeIcon: iconFutebol,
        awayName: 'Wolves',
        awayIcon: iconFutebol,
        odds: { home: '1.90x', draw: '3.60x', away: '3.80x' },
      },
      {
        id: 'cal-f-8',
        dateTime: 'Amanhã, 15:00',
        homeName: 'Brighton',
        homeIcon: escudoBrighton,
        awayName: 'West Ham',
        awayIcon: escudoWestHam,
        odds: { home: '2.00x', draw: '3.50x', away: '3.60x' },
      },
      {
        id: 'cal-f-9',
        dateTime: 'Amanhã, 17:00',
        homeName: 'Leeds',
        homeIcon: escudoLeeds,
        awayName: 'Burnley',
        awayIcon: escudoBurnley,
        odds: { home: '2.20x', draw: '3.30x', away: '3.20x' },
      },
    ],
  },
  {
    id: 'la-liga',
    name: 'Espanha - La Liga',
    flag: flagEspanha,
    sport: 'futebol',
    events: [
      {
        id: 'laliga-live-1',
        dateTime: '2T 07:41',
        isLive: true,
        earlyPayout: false,
        homeScore: 0,
        awayScore: 1,
        homeName: 'Getafe',
        homeIcon: escudoGetafe,
        awayName: 'Elche',
        awayIcon: escudoElche,
        odds: { home: '4.40x', draw: '3.15x', away: '1.88x' },
        doubleChanceOdds: { homeOrDraw: '1.86x', homeOrAway: '1.34x', awayOrDraw: '1.20x' },
        bothTeamsScoreOdds: { yes: '1.95x', no: '1.80x' },
        totalGoalsOdds: { line: 2.5, under: '1.62x', over: '2.22x' },
        totalCornersOdds: { line: 8.5, under: '1.82x', over: '1.94x' },
      },
      {
        id: 'cal-f-10',
        dateTime: 'Hoje, 14:00',
        homeName: 'Sevilla',
        homeIcon: iconFutebol,
        awayName: 'Villarreal',
        awayIcon: iconFutebol,
        odds: { home: '2.10x', draw: '3.20x', away: '3.50x' },
      },
      {
        id: 'cal-f-11',
        dateTime: 'Hoje, 16:00',
        homeName: 'Alavés',
        homeIcon: escudoAlaves,
        awayName: 'Espanyol',
        awayIcon: escudoEspanyol,
        odds: { home: '2.40x', draw: '3.10x', away: '2.95x' },
      },
      {
        id: 'cal-f-12',
        dateTime: 'Amanhã, 18:30',
        homeName: 'Mallorca',
        homeIcon: escudoMallorca,
        awayName: 'Levante',
        awayIcon: escudoLevante,
        odds: { home: '2.25x', draw: '3.30x', away: '3.15x' },
      },
    ],
  },
  {
    id: 'bundesliga',
    name: 'Alemanha - Bundesliga',
    flag: flagAlemanha,
    sport: 'futebol',
    events: [
      {
        id: 'bundesliga-live-1',
        dateTime: '1T 31:09',
        isLive: true,
        earlyPayout: false,
        homeScore: 1,
        awayScore: 1,
        homeName: 'B. Leverkusen',
        homeIcon: escudoBayerLeverkusen,
        awayName: 'Bayern',
        awayIcon: escudoBayerMunique,
        odds: { home: '2.70x', draw: '3.45x', away: '2.45x' },
        doubleChanceOdds: { homeOrDraw: '1.48x', homeOrAway: '1.30x', awayOrDraw: '1.36x' },
        bothTeamsScoreOdds: { yes: '1.42x', no: '2.80x' },
        totalGoalsOdds: { line: 3.5, under: '1.72x', over: '2.08x' },
        totalCornersOdds: { line: 10.5, under: '1.88x', over: '1.88x' },
      },
      {
        id: 'cal-f-13',
        dateTime: 'Hoje, 16:30',
        homeName: 'B. Dortmund',
        homeIcon: iconFutebol,
        awayName: 'RB Leipzig',
        awayIcon: iconFutebol,
        odds: { home: '2.40x', draw: '3.40x', away: '2.80x' },
      },
      {
        id: 'cal-f-14',
        dateTime: 'Amanhã, 13:30',
        homeName: 'Wolfsburg',
        homeIcon: escudoWolfsburg,
        awayName: 'Eintracht',
        awayIcon: escudoEintracht,
        odds: { home: '2.70x', draw: '3.30x', away: '2.55x' },
      },
      {
        id: 'cal-f-15',
        dateTime: 'Amanhã, 15:30',
        homeName: 'Augsburg',
        homeIcon: escudoAugsburg,
        awayName: 'Hamburger',
        awayIcon: escudoHamburger,
        odds: { home: '2.50x', draw: '3.20x', away: '2.85x' },
      },
    ],
  },
  {
    id: 'mls',
    name: 'EUA - MLS',
    flag: flagUSA,
    sport: 'futebol',
    events: [
      {
        id: 'mls-live-1',
        dateTime: '1T 28:14',
        isLive: true,
        earlyPayout: false,
        homeScore: 1,
        awayScore: 0,
        homeName: 'Inter Miami',
        homeIcon: getTeamLogo('Inter Miami', iconFutebol),
        awayName: 'Whitecaps',
        awayIcon: getTeamLogo('Whitecaps', iconFutebol),
        odds: { home: '1.40x', draw: '4.50x', away: '6.25x' },
        doubleChanceOdds: { homeOrDraw: '1.12x', homeOrAway: '1.18x', awayOrDraw: '2.55x' },
        bothTeamsScoreOdds: { yes: '1.95x', no: '1.80x' },
        totalGoalsOdds: { line: 2.5, under: '1.80x', over: '1.95x' },
        totalCornersOdds: { line: 9.5, under: '1.90x', over: '1.85x' },
      },
      {
        id: 'mls-live-2',
        dateTime: '1T 03:22',
        isLive: true,
        earlyPayout: false,
        homeScore: 0,
        awayScore: 0,
        homeName: 'Cincinnati',
        homeIcon: getTeamLogo('Cincinnati', iconFutebol),
        awayName: 'Chicago Fire',
        awayIcon: getTeamLogo('Chicago Fire', iconFutebol),
        odds: { home: '1.95x', draw: '3.60x', away: '3.80x' },
        doubleChanceOdds: { homeOrDraw: '1.28x', homeOrAway: '1.30x', awayOrDraw: '1.85x' },
        bothTeamsScoreOdds: { yes: '1.85x', no: '1.90x' },
        totalGoalsOdds: { line: 2.5, under: '1.90x', over: '1.85x' },
        totalCornersOdds: { line: 9.5, under: '1.88x', over: '1.88x' },
      },
      {
        id: 'mls-live-3',
        dateTime: '1T 32:05',
        isLive: true,
        earlyPayout: false,
        homeScore: 2,
        awayScore: 1,
        homeName: 'Nashville',
        homeIcon: getTeamLogo('Nashville', iconFutebol),
        awayName: 'New York City',
        awayIcon: getTeamLogo('New York City', iconFutebol),
        odds: { home: '1.85x', draw: '3.70x', away: '4.00x' },
        doubleChanceOdds: { homeOrDraw: '1.25x', homeOrAway: '1.28x', awayOrDraw: '1.92x' },
        bothTeamsScoreOdds: { yes: '1.50x', no: '2.45x' },
        totalGoalsOdds: { line: 3.5, under: '1.40x', over: '2.90x' },
        totalCornersOdds: { line: 9.5, under: '1.78x', over: '1.98x' },
      },
    ],
  },
  // Tênis
  {
    id: 'ten-roma-masters',
    name: 'Roma Masters',
    flag: getCompetitionBadge('ten-roma-masters', iconTenis),
    sport: 'tenis',
    events: [
      {
        id: 'ten-rm-1',
        dateTime: 'Ao vivo',
        isLive: true,
        earlyPayout: false,
        homeName: 'Andrey Rublev',
        homeIcon: getTennisPlayerCountryIcon('Andrey Rublev', iconTenis),
        awayName: 'Nikoloz Basilashvili',
        awayIcon: getTennisPlayerCountryIcon('Nikoloz Basilashvili', iconTenis),
        odds: { home: '2.42x', away: '1.55x' },
        handicapOdds: { line: 2.5, home: '1.88x', away: '1.92x' },
        totalGamesOdds: { line: 22.5, under: '1.86x', over: '1.94x' },
      },
      {
        id: 'ten-rm-2',
        dateTime: 'Hoje, 13:20',
        earlyPayout: false,
        homeName: 'Hamad Medjedovic',
        homeIcon: getTennisPlayerCountryIcon('Hamad Medjedovic', iconTenis),
        awayName: 'Martin Landaluce',
        awayIcon: getTennisPlayerCountryIcon('Martin Landaluce', iconTenis),
        odds: { home: '1.52x', away: '2.55x' },
        handicapOdds: { line: -3.5, home: '1.90x', away: '1.90x' },
        totalGamesOdds: { line: 21.5, under: '1.82x', over: '1.98x' },
      },
      {
        id: 'ten-rm-3',
        dateTime: 'Hoje, 15:30',
        earlyPayout: false,
        homeName: 'Thiago Agustin Tirante',
        homeIcon: getTennisPlayerCountryIcon('Thiago Agustin Tirante', iconTenis),
        awayName: 'Daniil Medvedev',
        awayIcon: getTennisPlayerCountryIcon('Daniil Medvedev', iconTenis),
        odds: { home: '2.27x', away: '1.65x' },
        handicapOdds: { line: 2.5, home: '1.86x', away: '1.94x' },
        totalGamesOdds: { line: 22.5, under: '1.88x', over: '1.92x' },
      },
    ],
  },
  {
    id: 'ten-roma-f',
    name: 'Roma (F)',
    flag: getCompetitionBadge('ten-roma-f', iconTenis),
    sport: 'tenis',
    events: [
      {
        id: 'ten-rf-1',
        dateTime: 'Hoje, 14:00',
        earlyPayout: false,
        homeName: 'Coco Gauff',
        homeIcon: getTennisPlayerCountryIcon('Coco Gauff', iconTenis),
        awayName: 'Mirra Andreeva',
        awayIcon: getTennisPlayerCountryIcon('Mirra Andreeva', iconTenis),
        odds: { home: '1.98x', away: '1.93x' },
        handicapOdds: { line: -0.5, home: '1.91x', away: '1.89x' },
        totalGamesOdds: { line: 21.5, under: '1.87x', over: '1.93x' },
      },
      {
        id: 'ten-rf-2',
        dateTime: 'Amanhã, 08:00',
        earlyPayout: false,
        homeName: 'Jessica Pegula',
        homeIcon: getTennisPlayerCountryIcon('Jessica Pegula', iconTenis),
        awayName: 'Iga Swiatek',
        awayIcon: getTennisPlayerCountryIcon('Iga Swiatek', iconTenis),
        odds: { home: '3.00x', away: '1.39x' },
        handicapOdds: { line: 4.5, home: '1.88x', away: '1.92x' },
        totalGamesOdds: { line: 20.5, under: '1.84x', over: '1.96x' },
      },
      {
        id: 'ten-rf-3',
        dateTime: 'Amanhã, 08:00',
        earlyPayout: false,
        homeName: 'Elina Svitolina',
        homeIcon: getTennisPlayerCountryIcon('Elina Svitolina', iconTenis),
        awayName: 'Elena Rybakina',
        awayIcon: getTennisPlayerCountryIcon('Elena Rybakina', iconTenis),
        odds: { home: '3.15x', away: '1.42x' },
        handicapOdds: { line: 4.5, home: '1.86x', away: '1.94x' },
        totalGamesOdds: { line: 21.5, under: '1.90x', over: '1.90x' },
      },
    ],
  },
  {
    id: 'ten-parma-f',
    name: 'Parma (F)',
    flag: getCompetitionBadge('ten-parma-f', iconTenis),
    sport: 'tenis',
    events: [
      {
        id: 'ten-pf-1',
        dateTime: 'Ao vivo',
        isLive: true,
        earlyPayout: false,
        homeName: 'Yue Yuan',
        homeIcon: getTennisPlayerCountryIcon('Yue Yuan', iconTenis),
        awayName: 'Mayar Sherif',
        awayIcon: getTennisPlayerCountryIcon('Mayar Sherif', iconTenis),
        odds: { home: '2.05x', away: '1.70x' },
        handicapOdds: { line: 1.5, home: '1.85x', away: '1.95x' },
        totalGamesOdds: { line: 22.5, under: '1.88x', over: '1.92x' },
      },
      {
        id: 'ten-pf-2',
        dateTime: 'Amanhã, 06:00',
        earlyPayout: false,
        homeName: 'Barbora Krejcikova',
        homeIcon: getTennisPlayerCountryIcon('Barbora Krejcikova', iconTenis),
        awayName: 'Anna-Lena Friedsam',
        awayIcon: getTennisPlayerCountryIcon('Anna-Lena Friedsam', iconTenis),
        odds: { home: '1.11x', away: '6.20x' },
        handicapOdds: { line: -5.5, home: '1.92x', away: '1.88x' },
        totalGamesOdds: { line: 18.5, under: '1.83x', over: '1.97x' },
      },
      {
        id: 'ten-pf-3',
        dateTime: 'Amanhã, 06:00',
        earlyPayout: false,
        homeName: 'Solana Sierra',
        homeIcon: getTennisPlayerCountryIcon('Solana Sierra', iconTenis),
        awayName: 'Kaja Juvan',
        awayIcon: getTennisPlayerCountryIcon('Kaja Juvan', iconTenis),
        odds: { home: '1.45x', away: '2.67x' },
        handicapOdds: { line: -3.5, home: '1.87x', away: '1.93x' },
        totalGamesOdds: { line: 20.5, under: '1.89x', over: '1.91x' },
      },
    ],
  },
  {
    id: 'ten-bordeaux',
    name: 'Bordeaux',
    flag: getCompetitionBadge('ten-bordeaux', iconTenis),
    sport: 'tenis',
    events: [
      {
        id: 'ten-bdx-1',
        dateTime: 'Ao vivo',
        isLive: true,
        earlyPayout: false,
        homeName: 'Moise Kouame',
        homeIcon: getTennisPlayerCountryIcon('Moise Kouame', iconTenis),
        awayName: 'Benjamin Bonzi',
        awayIcon: getTennisPlayerCountryIcon('Benjamin Bonzi', iconTenis),
        odds: { home: '2.27x', away: '1.57x' },
        handicapOdds: { line: 2.5, home: '1.86x', away: '1.94x' },
        totalGamesOdds: { line: 22.5, under: '1.85x', over: '1.95x' },
      },
      {
        id: 'ten-bdx-2',
        dateTime: 'Hoje, 15:00',
        earlyPayout: false,
        homeName: 'Alexander Shevchenko',
        homeIcon: getTennisPlayerCountryIcon('Alexander Shevchenko', iconTenis),
        awayName: 'Hugo Gaston',
        awayIcon: getTennisPlayerCountryIcon('Hugo Gaston', iconTenis),
        odds: { home: '1.57x', away: '2.37x' },
        handicapOdds: { line: -3.5, home: '1.91x', away: '1.89x' },
        totalGamesOdds: { line: 21.5, under: '1.84x', over: '1.96x' },
      },
      {
        id: 'ten-bdx-3',
        dateTime: 'Amanhã, 07:30',
        earlyPayout: false,
        homeName: 'Otto Virtanen',
        homeIcon: getTennisPlayerCountryIcon('Otto Virtanen', iconTenis),
        awayName: 'Giovanni Mpetshi Perricard',
        awayIcon: getTennisPlayerCountryIcon('Giovanni Mpetshi Perricard', iconTenis),
        odds: { home: '1.98x', away: '1.80x' },
        handicapOdds: { line: -0.5, home: '1.88x', away: '1.92x' },
        totalGamesOdds: { line: 23.5, under: '1.90x', over: '1.90x' },
      },
    ],
  },
  // Basquete
  {
    id: 'nba',
    name: 'NBA',
    flag: flagUSA,
    sport: 'basquete',
    events: [
      {
        id: 'nba-1',
        dateTime: 'Q1 08:22',
        isLive: true,
        earlyPayout: false,
        homeScore: 8,
        awayScore: 11,
        homeName: 'Jazz',
        homeIcon: escudoJazz,
        awayName: 'Thunder',
        awayIcon: escudoThunder,
        odds: { home: '2.35x', away: '1.58x' },
        totalPointsOdds: { line: 218.5, under: '1.90x', over: '1.90x' },
        handicapOdds: { line: 6.5, home: '1.88x', away: '1.92x' },
        q3TotalOdds: { line: 54.5, under: '1.85x', over: '1.95x' },
        q4TotalOdds: { line: 56.5, under: '1.90x', over: '1.90x' },
      },
      {
        id: 'nba-live-3',
        dateTime: 'Q3 02:41',
        isLive: true,
        earlyPayout: false,
        homeScore: 58,
        awayScore: 51,
        homeName: 'Knicks',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Magic',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '2.45x', away: '1.55x' },
      },
      {
        id: 'cal-b-1',
        dateTime: 'Hoje, 22:00',
        homeName: 'Bulls',
        homeIcon: escudoBulls,
        awayName: 'Heat',
        awayIcon: escudoMiami,
        odds: { home: '2.45x', away: '1.55x' },
      },
      {
        id: 'cal-b-2',
        dateTime: 'Amanhã, 21:30',
        homeName: '76ers',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Celtics',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.72x', away: '2.15x' },
      },
      {
        id: 'cal-b-3',
        dateTime: 'Amanhã, 23:00',
        homeName: 'Nuggets',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Suns',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '3.20x', away: '1.35x' },
      },
      {
        id: 'cal-b-16',
        dateTime: 'Amanhã, 20:30',
        homeName: 'Mavericks',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Spurs',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.48x', away: '2.70x' },
      },
      {
        id: 'cal-b-17',
        dateTime: 'Amanhã, 21:00',
        homeName: 'Clippers',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Kings',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.38x', away: '3.05x' },
      },
    ],
  },
  {
    id: 'ncaab',
    name: 'NCAAB',
    flag: flagUSA,
    sport: 'basquete',
    events: [
      {
        id: 'ncaab-1',
        dateTime: 'Q1 00:21',
        isLive: true,
        earlyPayout: false,
        homeScore: 22,
        awayScore: 65,
        homeName: 'Southern Wesleyan',
        homeIcon: '',
        awayName: 'Kennesaw State',
        awayIcon: '',
        odds: { home: '8.50x', away: '1.05x' },
        totalPointsOdds: { line: 145.5, under: '1.85x', over: '1.95x' },
        handicapOdds: { line: 42.5, home: '1.90x', away: '1.90x' },
        q3TotalOdds: { line: 35.5, under: '1.88x', over: '1.92x' },
        q4TotalOdds: { line: 36.5, under: '1.90x', over: '1.90x' },
      },
      {
        id: 'cal-b-4',
        dateTime: 'Hoje, 20:00',
        homeName: 'Lafayette',
        homeIcon: '',
        awayName: 'Pennsylvania',
        awayIcon: '',
        odds: { home: '2.85x', away: '1.42x' },
      },
      {
        id: 'cal-b-5',
        dateTime: 'Hoje, 21:00',
        homeName: 'South Carolina St.',
        homeIcon: '',
        awayName: 'Charleston',
        awayIcon: '',
        odds: { home: '1.95x', away: '1.85x' },
      },
      {
        id: 'cal-b-6',
        dateTime: 'Hoje, 22:00',
        homeName: 'Southern',
        homeIcon: '',
        awayName: 'Texas',
        awayIcon: '',
        odds: { home: '5.50x', away: '1.15x' },
      },
    ],
  },
  {
    id: 'euro-cup',
    name: 'Euro Cup',
    flag: flagMundo,
    sport: 'basquete',
    events: [
      {
        id: 'cal-b-7',
        dateTime: 'Amanhã, 14:00',
        homeName: 'Besiktas',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Lietkabelis',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.72x', away: '2.10x' },
      },
      {
        id: 'cal-b-8',
        dateTime: 'Amanhã, 15:00',
        homeName: 'Chemnitz 99',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Panionios',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.55x', away: '2.45x' },
      },
      {
        id: 'cal-b-9',
        dateTime: 'Amanhã, 15:00',
        homeName: 'Hapoel Jerusalem',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Hamburg Towers',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.65x', away: '2.25x' },
      },
    ],
  },
  {
    id: 'brasil-nbb',
    name: 'Brasil - NBB',
    flag: flagBrasil,
    sport: 'basquete',
    events: [
      {
        id: 'brasil-nbb-live-1',
        dateTime: 'Q3 02:41',
        isLive: true,
        earlyPayout: false,
        homeScore: 58,
        awayScore: 51,
        homeName: 'Paulistano',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Unifacisa',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.82x', away: '2.02x' },
        totalPointsOdds: { line: 168.5, under: '1.88x', over: '1.92x' },
        handicapOdds: { line: -7.5, home: '1.90x', away: '1.90x' },
        q3TotalOdds: { line: 42.5, under: '1.90x', over: '1.90x' },
        q4TotalOdds: { line: 43.5, under: '1.87x', over: '1.93x' },
      },
      {
        id: 'cal-b-10',
        dateTime: 'Hoje, 20:00',
        homeName: 'Botafogo',
        homeIcon: escudoBotafogo,
        awayName: 'Caxias do Sul',
        awayIcon: escudoCaxias,
        odds: { home: '1.55x', away: '2.45x' },
      },
      {
        id: 'cal-b-11',
        dateTime: 'Amanhã, 19:30',
        homeName: 'Flamengo',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Minas',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.45x', away: '2.65x' },
      },
      {
        id: 'cal-b-12',
        dateTime: 'Amanhã, 18:00',
        homeName: 'São Paulo',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Pinheiros',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '2.00x', away: '1.80x' },
      },
    ],
  },
  {
    id: 'eurocup-women',
    name: 'Europa - EuroCup Feminino',
    flag: flagMundo,
    sport: 'basquete',
    events: [
      {
        id: 'eurocup-women-live-1',
        dateTime: 'Q1 04:36',
        isLive: true,
        earlyPayout: false,
        homeScore: 16,
        awayScore: 12,
        homeName: 'Valencia',
        homeIcon: escudoDefaultBasquete,
        awayName: 'USK Praha',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.76x', away: '2.08x' },
        totalPointsOdds: { line: 153.5, under: '1.89x', over: '1.91x' },
        handicapOdds: { line: -2.5, home: '1.87x', away: '1.93x' },
        q3TotalOdds: { line: 37.5, under: '1.88x', over: '1.92x' },
        q4TotalOdds: { line: 38.5, under: '1.86x', over: '1.94x' },
      },
      {
        id: 'cal-b-13',
        dateTime: 'Amanhã, 13:00',
        homeName: 'Bourges',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Lyon ASVEL',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.80x', away: '2.00x' },
      },
      {
        id: 'cal-b-14',
        dateTime: 'Amanhã, 14:30',
        homeName: 'Fenerbahçe',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Sopron',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.60x', away: '2.35x' },
      },
      {
        id: 'cal-b-15',
        dateTime: 'Hoje, 15:00',
        homeName: 'Schio',
        homeIcon: escudoDefaultBasquete,
        awayName: 'Girona',
        awayIcon: escudoDefaultBasquete,
        odds: { home: '1.90x', away: '1.90x' },
      },
    ],
  },
]

// eslint-disable-next-line react-refresh/only-export-components
export const competitionToChampionship: Record<string, string> = {
  'fut-brasileiro': 'brasil-serie-a',
  'fut-brasileirao-a': 'brasil-serie-a',
  'fut-champions': 'champions-league',
  'fut-premier-league': 'premier-league',
  'fut-laliga': 'la-liga',
  'fut-mls': 'mls',
  'fut-bundesliga': 'bundesliga',
  'bsq-nba': 'nba',
  'bsq-nba-2': 'nba',
  'bsq-ncaab': 'ncaab',
  'bsq-nbb': 'brasil-nbb',
  'bsq-br-nbb': 'brasil-nbb',
  'bsq-euro-cup': 'euro-cup',
  'ten-roma-masters': 'ten-roma-masters',
  'ten-roma-f': 'ten-roma-f',
  'ten-parma-f': 'ten-parma-f',
  'ten-bordeaux': 'ten-bordeaux',
}

const competitionPageEventOverrides: Record<string, CompetitionEvent[]> = {
  'ten-roma-masters': [
    tennisCompetitionEvent('ten-rm-comp-1', 'Amanhã, 10:00', 'Casper Ruud', 'Karen Khachanov', '1.28x', '3.70x'),
    tennisCompetitionEvent('ten-rm-comp-2', 'Amanhã, 15:30', 'Rafael Jodar', 'Luciano Darderi', '1.44x', '2.80x'),
  ],
  'ten-parma-f': [
    tennisCompetitionEvent('ten-pf-comp-1', 'Amanhã, 07:10', 'Lucia Bronzetti', 'Maria Camila Osorio Serrano', '3.90x', '1.24x'),
    tennisCompetitionEvent('ten-pf-comp-2', 'Amanhã, 07:10', 'Hanne Vandewinkel', 'Dayana Yastremska', '2.18x', '1.65x'),
    tennisCompetitionEvent('ten-pf-comp-3', 'Amanhã, 11:10', 'Alycia Parks', 'Susan Bandecchi', '1.35x', '3.05x'),
  ],
  'ten-bordeaux': [
    tennisCompetitionEvent('ten-bdx-comp-1', 'Amanhã, 07:40', 'Raphael Collignon', 'Geoffrey Blancaneaux', '1.10x', '6.50x'),
    tennisCompetitionEvent('ten-bdx-comp-2', 'Amanhã, 15:00', 'Luca Van Assche', 'Juan Manuel Cerundolo', '1.98x', '1.80x'),
  ],
}

const getCompetitionPageLeague = (league: Championship, competitionId: string | null): Championship => {
  if (!competitionId) return league

  const overrideEvents = competitionPageEventOverrides[competitionId]
  return overrideEvents ? { ...league, events: overrideEvents } : league
}

interface CalendarSectionProps {
  sportFilter?: string | null
  competitionId?: string | null
  liveOnly?: boolean
  matchTimesOverride?: Record<string, string>
  onLiveMatchClick?: (payload: LiveEventOpenPayload) => void
  onOpenCompetition?: (target: CompetitionLinkTarget) => void
}

export interface DisplayedCompetitionEvent {
  league: Championship
  event: CompetitionEvent
}

export interface DisplayedCompetitionEventGroup {
  league: Championship
  events: CompetitionEvent[]
}

// eslint-disable-next-line react-refresh/only-export-components
export function getCalendarChampionships(
  sportFilter?: string | null,
  competitionId?: string | null
) {
  const mappedCompetitionId = competitionId
    ? competitionToChampionship[competitionId] ?? competitionId
    : null
  const filteredBySport = sportFilter
    ? championships.filter((c) => c.sport === sportFilter)
    : championships
  const filtered = mappedCompetitionId
    ? filteredBySport.filter((c) => c.id === mappedCompetitionId)
    : filteredBySport

  return { mappedCompetitionId, championships: filtered }
}

// eslint-disable-next-line react-refresh/only-export-components
export function getCalendarDisplayedEventGroups({
  sportFilter,
  competitionId,
  liveOnly = false,
  liveFilter = false,
}: {
  sportFilter?: string | null
  competitionId?: string | null
  liveOnly?: boolean
  liveFilter?: boolean
} = {}): {
  mappedCompetitionId: string | null
  groups: DisplayedCompetitionEventGroup[]
} {
  const { mappedCompetitionId, championships: filtered } = getCalendarChampionships(sportFilter, competitionId)
  const shouldFilterLive = liveOnly || liveFilter
  const competitionScoped = mappedCompetitionId
    ? filtered.map((league) => getCompetitionPageLeague(league, mappedCompetitionId))
    : filtered
  const filteredByLive = shouldFilterLive
    ? competitionScoped
        .map((championship) => ({
          ...championship,
          events: championship.events.filter((event) => event.isLive),
        }))
        .filter((championship) => championship.events.length > 0)
    : competitionScoped
  const leaguesToDisplay = filteredByLive.slice(0, mappedCompetitionId ? filteredByLive.length : 5)

  const groups = leaguesToDisplay.map((league) => {
    const events = shouldFilterLive
      ? league.events.filter((event) => event.isLive)
      : mappedCompetitionId
        ? [
            ...league.events.filter((event) => event.isLive).slice(0, 3),
            ...league.events.filter((event) => !event.isLive).slice(0, 5),
          ]
        : league.events.slice(0, 3)

    return { league, events }
  })

  return { mappedCompetitionId, groups }
}

// eslint-disable-next-line react-refresh/only-export-components
export function getCalendarDisplayedEvents({
  sportFilter,
  competitionId,
  liveOnly = false,
  liveFilter = false,
}: {
  sportFilter?: string | null
  competitionId?: string | null
  liveOnly?: boolean
  liveFilter?: boolean
} = {}): DisplayedCompetitionEvent[] {
  const { mappedCompetitionId, groups } = getCalendarDisplayedEventGroups({
    sportFilter,
    competitionId,
    liveOnly,
    liveFilter,
  })

  if (!mappedCompetitionId || liveOnly || liveFilter) {
    return groups.flatMap(({ league, events }) => events.map((event) => ({ league, event })))
  }

  const listedCompetitionGroups = groups
    .map(({ league, events }) => ({
      league,
      events: events.filter((event) => {
        const [dateLabel] = event.dateTime.split(',').map((part) => part.trim())
        return event.isLive || dateLabel === 'Hoje' || dateLabel === 'Amanhã'
      }),
    }))
    .filter(({ events }) => events.length > 0)

  const fallbackGroups = groups
    .map(({ league, events }) => ({
      league,
      events: events.filter((event) => !event.isLive),
    }))
    .filter(({ events }) => events.length > 0)

  const visibleGroups = listedCompetitionGroups.length > 0 ? listedCompetitionGroups : fallbackGroups
  return visibleGroups.flatMap(({ league, events }) => events.map((event) => ({ league, event })))
}

// eslint-disable-next-line react-refresh/only-export-components
export function getCompetitionPageEvents(
  sportFilter?: string | null,
  competitionId?: string | null,
  liveOnly = false
): DisplayedCompetitionEvent[] {
  const { mappedCompetitionId, championships: filtered } = getCalendarChampionships(sportFilter, competitionId)
  const competitionScoped = mappedCompetitionId
    ? filtered.map((league) => getCompetitionPageLeague(league, mappedCompetitionId))
    : filtered

  return competitionScoped.flatMap((league) => {
    const eventsToDisplay = liveOnly
      ? league.events.filter((event) => event.isLive)
      : [
          ...league.events.filter((event) => event.isLive).slice(0, 3),
          ...league.events.filter((event) => !event.isLive).slice(0, 5),
        ]

    return eventsToDisplay.map((event) => ({ league, event }))
  })
}

// eslint-disable-next-line react-refresh/only-export-components
export const getCompetitionLiveEventMatch = (
  event: CompetitionEvent,
  sport: string,
  matchTimes: Record<string, string> = {},
  league?: Championship
): LiveEventMatch => {
  const marketOdds = getMarketOdds(event, sport)
  const handicapOdds = event.handicapOdds ?? (marketOdds.handicap ? {
    line: marketOdds.handicap.homeLine,
    home: marketOdds.handicap.home,
    away: marketOdds.handicap.away,
  } : undefined)

  return {
    id: event.id,
    leagueId: league?.id,
    leagueName: league?.name,
    leagueFlag: league?.flag,
    sport,
    isLive: !!event.isLive,
    time: event.dateTime,
    dateTime: event.dateTime,
    currentTime: matchTimes[event.id] || event.dateTime,
    homeTeam: {
      name: event.homeName,
      icon: league?.sport === 'tenis'
        ? getTennisPlayerCountryIcon(event.homeName, event.homeIcon)
        : getTeamLogo(event.homeName),
      score: event.homeScore ?? 0,
    },
    awayTeam: {
      name: event.awayName,
      icon: league?.sport === 'tenis'
        ? getTennisPlayerCountryIcon(event.awayName, event.awayIcon)
        : getTeamLogo(event.awayName),
      score: event.awayScore ?? 0,
    },
    odds: event.odds,
    doubleChanceOdds: marketOdds.doubleChance,
    bothTeamsScoreOdds: marketOdds.bothTeamsScore,
    totalGoalsOdds: marketOdds.totalGoals,
    totalCornersOdds: marketOdds.totalCorners,
    totalPointsOdds: marketOdds.totalPoints,
    handicapOdds,
    q3TotalOdds: marketOdds.q3Total,
    q4TotalOdds: marketOdds.q4Total,
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export const getCompetitionLiveEventOpenPayload = ({
  league,
  selectedEventId,
  matchTimes = {},
}: {
  league: Championship
  selectedEventId: string
  matchTimes?: Record<string, string>
}): LiveEventOpenPayload | null => {
  if (!liveEventSports.has(league.sport)) return null

  const eventMatches = league.events
  const selectedIndex = Math.max(0, eventMatches.findIndex((event) => event.id === selectedEventId))
  const currentTimes = eventMatches.reduce<Record<string, string>>((times, event) => {
    times[event.id] = matchTimes[event.id] || event.dateTime
    return times
  }, {})

  return {
    matches: eventMatches.map((event) => getCompetitionLiveEventMatch(event, league.sport, matchTimes, league)),
    selectedIndex,
    leagueName: league.name,
    leagueFlag: league.flag,
    sport: league.sport,
    currentTimes,
  }
}

interface CompetitionCalendarDaySection {
  id: string
  title: string
  groups: DisplayedCompetitionEventGroup[]
}

const getCompetitionEventDateLabel = (event: CompetitionEvent) => {
  const [dateLabel] = event.dateTime.split(',').map((part) => part.trim())
  return dateLabel
}

const filterCompetitionGroupsByEvent = (
  groups: DisplayedCompetitionEventGroup[],
  predicate: (event: CompetitionEvent) => boolean
) =>
  groups
    .map(({ league, events }) => ({
      league,
      events: events.filter(predicate),
    }))
    .filter(({ events }) => events.length > 0)

const getCompetitionCalendarDaySections = (
  groups: DisplayedCompetitionEventGroup[],
  liveOnly: boolean
): CompetitionCalendarDaySection[] => {
  if (liveOnly) {
    const liveGroups = filterCompetitionGroupsByEvent(groups, (event) => !!event.isLive)
    return liveGroups.length > 0 ? [{ id: 'live', title: 'Ao vivo', groups: liveGroups }] : []
  }

  const sections = [
    {
      id: 'live',
      title: 'Ao vivo',
      groups: filterCompetitionGroupsByEvent(
        groups,
        (event) => !!event.isLive
      ),
    },
    {
      id: 'today',
      title: 'Hoje',
      groups: filterCompetitionGroupsByEvent(
        groups,
        (event) => !event.isLive && getCompetitionEventDateLabel(event) === 'Hoje'
      ),
    },
    {
      id: 'tomorrow',
      title: 'Amanhã',
      groups: filterCompetitionGroupsByEvent(
        groups,
        (event) => !event.isLive && getCompetitionEventDateLabel(event) === 'Amanhã'
      ),
    },
  ].filter(({ groups: sectionGroups }) => sectionGroups.length > 0)

  if (sections.length > 0) return sections

  const fallbackGroups = filterCompetitionGroupsByEvent(groups, (event) => !event.isLive)
  return fallbackGroups.length > 0 ? [{ id: 'next', title: 'Próximos', groups: fallbackGroups }] : []
}

const getCompetitionCalendarEventCount = (sections: CompetitionCalendarDaySection[]) =>
  sections.reduce((sectionTotal, section) => (
    sectionTotal + section.groups.reduce((groupTotal, group) => groupTotal + group.events.length, 0)
  ), 0)

const scrollChipElementIntoView = (chipEl: HTMLButtonElement) => {
  const containerEl = chipEl.parentElement
  if (!containerEl) return

  const chipLeft = chipEl.offsetLeft
  const chipWidth = chipEl.offsetWidth
  const containerWidth = containerEl.offsetWidth
  const containerScroll = containerEl.scrollLeft
  const padding = 20

  if (chipLeft + chipWidth > containerScroll + containerWidth - padding) {
    containerEl.scrollTo({ left: chipLeft - padding, behavior: 'smooth' })
  } else if (chipLeft < containerScroll + padding) {
    containerEl.scrollTo({ left: chipLeft - padding, behavior: 'smooth' })
  }
}

interface MarketChipsProps {
  activeMarketId: string
  chips: MarketChip[]
  className?: string
  containerRef?: RefObject<HTMLDivElement | null>
  onMarketChange: (marketId: string) => void
}

function MarketChips({
  activeMarketId,
  chips,
  className = '',
  containerRef,
  onMarketChange,
}: MarketChipsProps) {
  const internalRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
  const chipsRef = containerRef ?? internalRef
  const activeIndex = chips.findIndex((chip) => chip.id === activeMarketId)
  const activeIndicatorKey = `${activeMarketId}:${chips.map((chip) => chip.id).join('|')}`

  useSlidingActiveIndicator({
    activeKey: activeIndicatorKey,
    containerRef: chipsRef,
    getActiveElement: () => chipRefs.current[activeIndex],
  })

  return (
    <div
      className={`prematch-section__chips sliding-chip-group sliding-chip-group--indicator-ready${className ? ` ${className}` : ''}`}
      ref={chipsRef}
    >
      <span className="sliding-chip-indicator" aria-hidden="true" />
      {chips.map((chip, index) => (
        <button
          key={chip.id}
          ref={(el) => { chipRefs.current[index] = el }}
          className={`prematch-section__chip prematch-section__chip--market sliding-chip ${activeMarketId === chip.id ? 'prematch-section__chip--active' : ''}`}
          onClick={(event) => {
            onMarketChange(chip.id)
            scrollChipElementIntoView(event.currentTarget)
          }}
        >
          <span data-text={chip.label}>{chip.label}</span>
        </button>
      ))}
    </div>
  )
}

const getMarketStickyClassName = (
  stickyState: { isStuck: boolean; isVisible: boolean },
  className = ''
) => [
  'prematch-section__chips--sticky',
  className,
  stickyState.isStuck ? 'prematch-section__chips--sticky-stuck' : '',
  stickyState.isVisible ? '' : 'prematch-section__chips--sticky-hidden',
]
  .filter(Boolean)
  .join(' ')

export function CalendarSection({
  sportFilter,
  competitionId,
  liveOnly = false,
  matchTimesOverride,
  onLiveMatchClick,
  onOpenCompetition,
}: CalendarSectionProps = {}) {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeMarket, setActiveMarket] = useState(() => getDefaultMarketId(sportFilter))
  const getOddButtonProps = useOddSelection('prematch-section__odd-btn')
  const marketChipsRef = useRef<HTMLDivElement>(null)
  const marketStickyState = useHomeMarketStickyState(sectionRef, marketChipsRef)
  const [isCompetitionSheetOpen, setIsCompetitionSheetOpen] = useState(false)
  const [internalMatchTimes, setInternalMatchTimes] = useState<Record<string, string>>(() => {
    const times: Record<string, string> = {}
    championships.forEach((championship) => {
      championship.events.forEach((event) => {
        if (event.isLive) times[event.id] = event.dateTime
      })
    })
    return times
  })

  const hasMatchTimesOverride = Boolean(matchTimesOverride)
  const matchTimes = matchTimesOverride ?? internalMatchTimes
  const { mappedCompetitionId, groups: displayedEventGroups } = getCalendarDisplayedEventGroups({
    sportFilter,
    competitionId,
    liveOnly,
  })
  const topFive = displayedEventGroups.map(({ league }) => league)
  const isCompetitionPage = !!mappedCompetitionId

  const [openLeagues, setOpenLeagues] = useState<string[]>(
    topFive.map((c) => c.id)
  )

  useEffect(() => {
    setOpenLeagues(topFive.map((c) => c.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportFilter, competitionId, liveOnly])

  useEffect(() => {
    setActiveMarket(getDefaultMarketId(sportFilter))
    if (marketChipsRef.current) {
      marketChipsRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [sportFilter, competitionId])

  const toggleLeague = (id: string) => {
    setOpenLeagues((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const currentSport = topFive[0]?.sport ?? sportFilter
  const currentMarketChips = currentSport === 'basquete'
    ? basketballMarketChips
    : currentSport === 'tenis'
      ? tennisMarketChips
      : footballMarketChips
  const competitionSheetConfig = currentSport ? competicaoConfigBySport[currentSport] : null
  const canOpenCompetitionSheet = !!competitionSheetConfig && !!onOpenCompetition
  const showHeaderCompetitionAction = !isCompetitionPage && canOpenCompetitionSheet

  const openCompetitionFromLeague = (leagueId: string) => {
    const target = getCompetitionLinkTarget(leagueId)
    if (!target) return
    onOpenCompetition?.(target)
  }

  const handleSelectCompetitionFromSheet = (selectedCompetitionId: string) => {
    if (!competitionSheetConfig || !currentSport) return

    const competition = findCompetition(competitionSheetConfig, selectedCompetitionId)
    if (!competition) return

    onOpenCompetition?.({
      id: competition.id,
      name: competition.name,
      sport: currentSport,
    })
    setIsCompetitionSheetOpen(false)
  }

  const renderCompetitionSheetAction = () => {
    if (!canOpenCompetitionSheet) return null

    return (
      <div className="prematch-section__more prematch-section__more--competitions">
        <button
          type="button"
          className="prematch-section__more-btn"
          aria-haspopup="dialog"
          onClick={() => setIsCompetitionSheetOpen(true)}
        >
          <span>Mais campeonatos</span>
          <CaretUpIcon aria-hidden="true" className="prematch-section__more-icon" weight="bold" />
        </button>
      </div>
    )
  }

  const renderCompetitionSheet = () => {
    if (!competitionSheetConfig) return null

    return (
      <CompeticaoBottomSheet
        isOpen={isCompetitionSheetOpen}
        onClose={() => setIsCompetitionSheetOpen(false)}
        sportLabel={competitionSheetConfig.sportLabel}
        sportIcon={competitionSheetConfig.sportIcon}
        topCompetitions={competitionSheetConfig.topCompetitions}
        countries={competitionSheetConfig.countries}
        onSelectCompetition={handleSelectCompetitionFromSheet}
        isCompetitionEnabled={isCompetitionEnabled}
      />
    )
  }

  useEffect(() => {
    if (hasMatchTimesOverride) return

    const interval = setInterval(() => {
      setInternalMatchTimes((current) => {
        const next: Record<string, string> = {}
        Object.keys(current).forEach((id) => {
          next[id] = updateCompetitionMatchTime(current[id])
        })
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [hasMatchTimesOverride])

  const openLiveEvent = (league: Championship, selectedEventId: string) => {
    const payload = getCompetitionLiveEventOpenPayload({ league, selectedEventId, matchTimes })
    if (payload) onLiveMatchClick?.(payload)
  }

  const renderMarketChips = ({
    className = '',
    withRefs = false,
    activeMarketId = activeMarket,
    onMarketChange = setActiveMarket,
  }: {
    className?: string
    withRefs?: boolean
    activeMarketId?: string
    onMarketChange?: (marketId: string) => void
  } = {}) => (
    <MarketChips
      activeMarketId={activeMarketId}
      chips={currentMarketChips}
      className={className}
      containerRef={withRefs ? marketChipsRef : undefined}
      onMarketChange={onMarketChange}
    />
  )

  const renderEventCard = (league: Championship, event: CompetitionEvent, selectedMarket = activeMarket) => {
    const marketOdds = getMarketOdds(event, league.sport)
    const homeIcon = league.sport === 'tenis'
      ? getTennisPlayerCountryIcon(event.homeName, event.homeIcon)
      : getTeamLogo(event.homeName)
    const awayIcon = league.sport === 'tenis'
      ? getTennisPlayerCountryIcon(event.awayName, event.awayIcon)
      : getTeamLogo(event.awayName)
    const handicapOdds = event.handicapOdds ?? (marketOdds.handicap ? {
      line: marketOdds.handicap.homeLine,
      home: marketOdds.handicap.home,
      away: marketOdds.handicap.away,
    } : undefined)
    const eventId = getBetslipEventId({
      sport: league.sport,
      homeTeam: event.homeName,
      awayTeam: event.awayName,
    })
    const marketLabel = currentMarketChips.find((chip) => chip.id === selectedMarket)?.label
    const isPlayerPropsMarket = isCalendarPlayerPropsMarket(league.sport, selectedMarket)
    const matchPlayerProps = isPlayerPropsMarket
      ? getCalendarPlayerProps(event, league.sport, selectedMarket, homeIcon, awayIcon).map((player) => ({
        ...player,
        eventId,
        marketId: selectedMarket,
        marketLabel,
        eventStatus: 'prematch' as const,
        homeTeam: event.homeName,
        awayTeam: event.awayName,
        eventTimeLabel: event.dateTime,
      }))
      : []
    const oddGroupId = getBetslipMarketGroupId({ eventId, marketId: selectedMarket })
    const totalPointsLikeLine = selectedMarket === 'q3-total'
      ? marketOdds.q3Total?.line
      : selectedMarket === 'q4-total'
        ? marketOdds.q4Total?.line
        : marketOdds.totalPoints?.line
    const totalPointsLikeUnder = selectedMarket === 'q3-total'
      ? marketOdds.q3Total?.under
      : selectedMarket === 'q4-total'
        ? marketOdds.q4Total?.under
        : marketOdds.totalPoints?.under
    const totalPointsLikeOver = selectedMarket === 'q3-total'
      ? marketOdds.q3Total?.over
      : selectedMarket === 'q4-total'
        ? marketOdds.q4Total?.over
        : marketOdds.totalPoints?.over
    const totalPointsLikeUnderOutcomeId = selectedMarket === 'q3-total'
      ? 'under-q3'
      : selectedMarket === 'q4-total'
        ? 'under-q4'
        : 'under-points'
    const totalPointsLikeOverOutcomeId = selectedMarket === 'q3-total'
      ? 'over-q3'
      : selectedMarket === 'q4-total'
        ? 'over-q4'
        : 'over-points'
    const renderOddButton = (outcomeId: string, label: ReactNode, value: ReactNode) => (
      <button
        {...getOddButtonProps(
          `${oddGroupId}:${outcomeId}`,
          oddGroupId,
          'prematch-section__odd-btn',
          createBetslipSelection({
            eventId,
            marketId: selectedMarket,
            outcomeId,
            label,
            odd: value,
            marketLabel,
            eventStatus: 'prematch',
            sport: league.sport,
            homeTeam: event.homeName,
            awayTeam: event.awayName,
            eventTimeLabel: event.dateTime,
            badgeType: 'boost',
          })
        )}
      >
        <span className="prematch-section__odd-team">{label}</span>
        <span className="prematch-section__odd-value">{value}</span>
      </button>
    )

    if (event.isLive) {
      return (
        <LiveMatchCard
          key={event.id}
          sport={league.sport}
          activeMarket={selectedMarket}
          currentTime={matchTimes[event.id] || event.dateTime}
          match={{
            id: event.id,
            time: event.dateTime,
            homeTeam: {
              name: event.homeName,
              icon: homeIcon,
              score: event.homeScore ?? 0,
            },
            awayTeam: {
              name: event.awayName,
              icon: awayIcon,
              score: event.awayScore ?? 0,
            },
            odds: event.odds,
            doubleChanceOdds: marketOdds.doubleChance,
            bothTeamsScoreOdds: marketOdds.bothTeamsScore,
            totalGoalsOdds: marketOdds.totalGoals,
            totalCornersOdds: marketOdds.totalCorners,
            totalPointsOdds: marketOdds.totalPoints,
            handicapOdds,
            q3TotalOdds: marketOdds.q3Total,
            q4TotalOdds: marketOdds.q4Total,
            totalGamesOdds: marketOdds.totalGames,
          }}
          onClick={liveEventSports.has(league.sport) ? () => openLiveEvent(league, event.id) : undefined}
        />
      )
    }

    const reiAntecipa = league.sport === 'basquete' ? reiAntecipaBasquete : reiAntecipaFutebol

    return (
      <div
        key={event.id}
        className={`prematch-section__match${liveEventSports.has(league.sport) ? ' prematch-section__match--clickable' : ''}${isPlayerPropsMarket ? ' prematch-section__match--player-props' : ''}`}
        onClick={liveEventSports.has(league.sport) ? () => openLiveEvent(league, event.id) : undefined}
      >
        <div className="prematch-section__match-header">
          <div className="prematch-section__teams-compact">
            <div className="prematch-section__team-row">
              <CalendarTeamIcon
                teamName={event.homeName}
                currentIcon={homeIcon}
                sport={league.sport}
                side="home"
              />
              <span className="prematch-section__team-name">{event.homeName}</span>
            </div>
            <div className="prematch-section__team-row">
              <CalendarTeamIcon
                teamName={event.awayName}
                currentIcon={awayIcon}
                sport={league.sport}
                side="away"
              />
              <span className="prematch-section__team-name">{event.awayName}</span>
            </div>
          </div>
          <div className="prematch-section__match-info">
            <div className="prematch-section__match-info-content">
              {event.earlyPayout !== false && (
                <div className="prematch-section__pag-antecipado">
                  <span className="prematch-section__pag-antecipado-label">Pag. Antecipado</span>
                  <img src={reiAntecipa} alt="" className="prematch-section__rei-antecipa" />
                </div>
              )}
              <span className="prematch-section__match-datetime">{event.dateTime}</span>
            </div>
            <CaretRightIcon aria-hidden="true" className="prematch-section__match-arrow" weight="bold" />
          </div>
        </div>

        {isPlayerPropsMarket ? (
          <div
            key={`${event.id}-${selectedMarket}-player-props`}
            className="prematch-section__player-props"
            aria-label={`Jogadores de ${event.homeName} x ${event.awayName}`}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            {matchPlayerProps.map((player) => (
              <PreMatchPlayerPropCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
        <div key={`${event.id}-${selectedMarket}-odds`} className="prematch-section__odds">
          {selectedMarket === 'dupla-chance' ? (
            <>
              {renderOddButton('home-or-draw', 'Casa ou Empate', marketOdds.doubleChance?.homeOrDraw)}
              {renderOddButton('home-or-away', 'Casa ou Fora', marketOdds.doubleChance?.homeOrAway)}
              {renderOddButton('away-or-draw', 'Fora ou Empate', marketOdds.doubleChance?.awayOrDraw)}
            </>
          ) : selectedMarket === 'ambos-marcam' ? (
            <>
              {renderOddButton('yes', 'Sim', marketOdds.bothTeamsScore?.yes)}
              {renderOddButton('no', 'Não', marketOdds.bothTeamsScore?.no)}
            </>
          ) : selectedMarket === 'total-gols' ? (
            <>
              {renderOddButton('under', `Menos de ${marketOdds.totalGoals?.line}`, marketOdds.totalGoals?.under)}
              {renderOddButton('over', `Mais de ${marketOdds.totalGoals?.line}`, marketOdds.totalGoals?.over)}
            </>
          ) : selectedMarket === 'escanteios' ? (
            <>
              {renderOddButton('under-corners', `Menos de ${marketOdds.totalCorners?.line}`, marketOdds.totalCorners?.under)}
              {renderOddButton('over-corners', `Mais de ${marketOdds.totalCorners?.line}`, marketOdds.totalCorners?.over)}
            </>
          ) : selectedMarket === 'total-pontos' || selectedMarket === 'q3-total' || selectedMarket === 'q4-total' ? (
            <>
              {renderOddButton(totalPointsLikeUnderOutcomeId, `Menos de ${totalPointsLikeLine}`, totalPointsLikeUnder)}
              {renderOddButton(totalPointsLikeOverOutcomeId, `Mais de ${totalPointsLikeLine}`, totalPointsLikeOver)}
            </>
          ) : selectedMarket === 'handicap' ? (
            <>
              {renderOddButton('home-handicap', `${event.homeName} ${marketOdds.handicap && marketOdds.handicap.homeLine > 0 ? '+' : ''}${marketOdds.handicap?.homeLine}`, marketOdds.handicap?.home)}
              {renderOddButton('away-handicap', `${event.awayName} ${marketOdds.handicap && marketOdds.handicap.awayLine > 0 ? '+' : ''}${marketOdds.handicap?.awayLine}`, marketOdds.handicap?.away)}
            </>
          ) : selectedMarket === 'handicap-games' ? (
            <>
              {renderOddButton('home-handicap-games', `${event.homeName} ${marketOdds.handicap && marketOdds.handicap.homeLine > 0 ? '+' : ''}${marketOdds.handicap?.homeLine}`, marketOdds.handicap?.home)}
              {renderOddButton('away-handicap-games', `${event.awayName} ${marketOdds.handicap && marketOdds.handicap.awayLine > 0 ? '+' : ''}${marketOdds.handicap?.awayLine}`, marketOdds.handicap?.away)}
            </>
          ) : selectedMarket === 'total-games' ? (
            <>
              {renderOddButton('under-games', `Menos de ${marketOdds.totalGames?.line}`, marketOdds.totalGames?.under)}
              {renderOddButton('over-games', `Mais de ${marketOdds.totalGames?.line}`, marketOdds.totalGames?.over)}
            </>
          ) : league.sport === 'basquete' || league.sport === 'tenis' ? (
            <>
              {renderOddButton('home', event.homeName, event.odds.home)}
              {renderOddButton('away', event.awayName, event.odds.away)}
            </>
          ) : (
            <>
              {renderOddButton('home', event.homeName, event.odds.home)}
              {renderOddButton('draw', 'Empate', event.odds.draw)}
              {renderOddButton('away', event.awayName, event.odds.away)}
            </>
          )}
        </div>
        )}
      </div>
    )
  }

  const competitionDaySections = isCompetitionPage
    ? getCompetitionCalendarDaySections(displayedEventGroups, liveOnly)
    : []
  const competitionEventCount = getCompetitionCalendarEventCount(competitionDaySections)
  const competitionSectionClasses = [
    'prematch-section',
    'calendar-section',
    'calendar-section--competition',
    'calendar-section--competition-days',
    competitionEventCount > 0 && competitionEventCount <= SHORT_COMPETITION_EVENT_LIMIT
      ? 'calendar-section--short-competition-list'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (isCompetitionPage) {
    return (
      <>
        <section className={competitionSectionClasses} ref={sectionRef}>
          {renderMarketChips({
            className: getMarketStickyClassName(marketStickyState, 'calendar-section__competition-chips'),
            withRefs: true,
          })}
          {competitionDaySections.map((section) => (
            <div key={section.id} className="calendar-section__competition-day">
              <h2 className="calendar-section__competition-day-title">{section.title}</h2>
              <div className="prematch-section__matches calendar-section__competition-matches">
                {section.groups.flatMap(({ league, events }) =>
                  events.map((event) => renderEventCard(league, event, activeMarket))
                )}
              </div>
            </div>
          ))}
          {renderCompetitionSheetAction()}
        </section>
        {renderCompetitionSheet()}
      </>
    )
  }

  return (
    <>
      <section className={`prematch-section calendar-section${isCompetitionPage ? ' calendar-section--competition' : ''}`} ref={sectionRef}>
        {/* Header */}
        <div className="prematch-section__header prematch-section__header--with-action">
          <div className="prematch-section__title">
            <span>Jogos em destaque</span>
          </div>
          {showHeaderCompetitionAction && (
            <button
              type="button"
              className="prematch-section__header-more"
              aria-haspopup="dialog"
              onClick={() => setIsCompetitionSheetOpen(true)}
            >
              <span>Ver campeonatos</span>
              <CaretUpIcon aria-hidden="true" className="prematch-section__header-more-icon" weight="bold" />
            </button>
          )}
        </div>

        {/* Category chips */}
        {renderMarketChips({
          className: getMarketStickyClassName(marketStickyState),
          withRefs: true,
        })}

        {/* Leagues — same layout as PreMatchSection */}
        <div className="prematch-section__leagues">
          {displayedEventGroups.map(({ league, events: eventsToDisplay }) => {
            const isOpen = openLeagues.includes(league.id)
            return (
              <div key={league.id} className={`prematch-section__league ${isOpen ? 'prematch-section__league--open' : ''}`}>
                {!isCompetitionPage && (
                  <button className="prematch-section__league-header" onClick={() => toggleLeague(league.id)}>
                    <div className="prematch-section__league-title">
                      <img src={league.flag} alt="" className="prematch-section__league-flag" />
                      <span>{league.name}</span>
                    </div>
                    <CaretUpIcon
                      aria-hidden="true"
                      className={`prematch-section__accordion-icon ${isOpen ? 'prematch-section__accordion-icon--open' : ''}`}
                      weight="bold"
                    />
                  </button>
                )}

                <div className={`prematch-section__matches-wrapper ${isOpen || isCompetitionPage ? 'prematch-section__matches-wrapper--open' : ''}`}>
                  <div className="prematch-section__matches-inner">
                    <div className="prematch-section__matches">
                      {eventsToDisplay.map((event) => renderEventCard(league, event))}
                    </div>

                    {!isCompetitionPage && (
                      <button
                        type="button"
                        className="prematch-section__league-more"
                        onClick={() => openCompetitionFromLeague(league.id)}
                      >
                        <span>Veja mais {league.name}</span>
                        <CaretRightIcon aria-hidden="true" className="prematch-section__league-more-icon" weight="bold" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {renderCompetitionSheetAction()}
      </section>
      {renderCompetitionSheet()}
    </>
  )
}
