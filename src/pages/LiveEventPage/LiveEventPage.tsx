import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode, type UIEvent, type WheelEvent } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { CaretRightIcon, CourtBasketballIcon, MonitorPlayIcon, SoccerBallIcon } from '@phosphor-icons/react'
import './LiveEventPage.css'

import { PreMatchPlayerPropCard, getMatchPlayerProps, type MatchPlayerProp } from '../../components/PreMatchSection/PreMatchSection'
import { getLivePlayerProps } from '../../components/LiveMatchCard'
import iconAoVivo from '../../assets/iconAoVivo.png'
import reiAntecipaFutebol from '../../assets/reiAntecipaFutebol.png'
import reiAntecipaBasquete from '../../assets/reiAntecipaBasquete.png'
import substituicaoGarantida from '../../assets/substituicaoGarantida.png'
import multiplaTurbinada from '../../assets/multiplaTurbinada.png'
import streamingFutebol from '../../assets/streamingFutebol.png'
import streamingBasquete from '../../assets/streamingBasquete.png'
import iconBasquete from '../../assets/iconSports/basketball.png'
import iconFutebol from '../../assets/iconSports/soccer.png'
import escudoDefaultBasquete from '../../assets/escudoDefaultBasquete.png'
import playerAvatarFutebol from '../../assets/playerAvatarFutebol.svg'
import playerAvatarBasquete from '../../assets/playerAvatarBasquete.svg'
import arrascaetaProps from '../../assets/arrascaetaProps.png'
import pedroProps from '../../assets/pedroProps.png'
import depayProps from '../../assets/depayProps.png'
import yuriProps from '../../assets/yuriProps.png'
import flacoLopezProps from '../../assets/flacoLopezProps.png'
import { useOddSelection } from '../../hooks/useOddSelection'
import { createBetslipSelection, getBetslipEventId, getBetslipMarketGroupId } from '../../hooks/betslipUtils'
import { useSportsDbTeamLogo } from '../../hooks/useSportsDbTeamLogo'

export interface LiveEventMatch {
  id?: string
  leagueId?: string
  leagueName?: string
  leagueFlag?: string
  sport?: string
  isLive?: boolean
  time?: string
  dateTime?: string
  currentTime?: string
  homeTeam: { name: string; icon: string; score: number }
  awayTeam: { name: string; icon: string; score: number }
  odds: { home: string; draw?: string; away: string }
  doubleChanceOdds?: { homeOrDraw: string; homeOrAway: string; awayOrDraw: string }
  bothTeamsScoreOdds?: { yes: string; no: string }
  totalGoalsOdds?: { line: number; under: string; over: string }
  totalCornersOdds?: { line: number; under: string; over: string }
  totalPointsOdds?: { line: number; under: string; over: string }
  handicapOdds?: { line: number; home: string; away: string }
  q3TotalOdds?: { line: number; under: string; over: string }
  q4TotalOdds?: { line: number; under: string; over: string }
  extraBets?: number
}

export interface LiveEventRailItem {
  id: string
  leagueId?: string
  leagueName: string
  leagueFlag?: string
  sport: string
  isLive?: boolean
  dateTime: string
  currentTime?: string
  headerPrimary?: string
  headerSecondary?: string
  homeTeam: { name: string; icon: string; score?: number }
  awayTeam: { name: string; icon: string; score?: number }
  odds?: { home: string; draw?: string; away: string }
}

export interface LiveEventPageProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettled?: () => void
  onCloseStart?: () => void
  match?: LiveEventMatch
  matches?: LiveEventMatch[]
  railEvents?: LiveEventRailItem[]
  selectedIndex?: number
  currentTimes?: Record<string, string>
  leagueName: string
  leagueFlag?: string
  sport: string
  currentTime?: string
}

export interface LiveEventOpenPayload {
  matches: LiveEventMatch[]
  selectedIndex: number
  leagueName: string
  leagueFlag?: string
  sport: string
  currentTimes: Record<string, string>
  railEvents?: LiveEventRailItem[]
}

interface LiveEventCloseOptions {
  force?: boolean
}

interface LiveEventContentProps {
  match: LiveEventMatch
  leagueName: string
  sport: string
  currentTime: string
  isExpanded: boolean
  expansionProgress: number
  onRequestClose: (options?: LiveEventCloseOptions) => void
  onRequestExpand: () => void
  onRequestCollapse: () => void
  onExpansionProgressChange: (progress: number, options?: { deferSettle?: boolean }) => void
  onExpansionGestureEnd: (progress: number) => void
  onCompactPullChange: (distance: number) => void
  onCompactPullEnd: (distance: number) => void
  onBlockNextClose: () => void
  onSwipeStart: () => void
  onSwipeMove: (dx: number) => void
  onSwipeEnd: (dx: number, velocity: number) => void
}

type TabId = 'transmissao' | 'campo'
type DetailTabId = 'destaques' | 'criar-aposta' | 'times' | 'jogadores'

const detailTabs: Array<{ id: DetailTabId; label: string }> = [
  { id: 'destaques', label: 'Destaques' },
  { id: 'criar-aposta', label: 'Criar Aposta' },
  { id: 'times', label: 'Times' },
  { id: 'jogadores', label: 'Jogadores' },
]

interface ShotOutcome {
  label: string
  odd: string
  labelParts?: [string, string]
}

interface PlayerShotMarket {
  id: string
  player: string
  team: string
  image?: string
  outcomes: ShotOutcome[]
}

interface TotalGoalsMarketRow {
  id: string
  under: ShotOutcome
  over: ShotOutcome
}

interface ThreeWayMarketRow {
  id: string
  options: ShotOutcome[]
}

const shotOutcomes = (values: Array<[string, string]>): ShotOutcome[] =>
  values.map(([label, odd]) => ({ label, odd }))

const doubleChanceDisplayNames: Record<string, string> = {
  Internacional: 'Inter',
  Bragantino: 'Braga',
  'Red Bull Bragantino': 'Braga',
  'Atlético Madrid': 'Atl. Madrid',
  'Boca Juniors': 'Boca',
  'Argentinos Jrs': 'Argentinos',
  'River Plate': 'River',
  'New York City': 'NYC',
  'Chicago Fire': 'Chicago',
  Panathinaikos: 'Panath.',
}

const LIVE_EVENT_HOME_FALLBACK_GLOW = '#00a0dd'
const LIVE_EVENT_AWAY_FALLBACK_GLOW = '#ad0924'
const LIVE_EVENT_LOGO_COLOR_CANVAS_MAX_SIZE = 72
const logoDominantColorCache = new Map<string, string | null>()
const pendingLogoDominantColorRequests = new Map<string, Promise<string | null>>()

const teamGlowFallbackColors: Record<string, string> = {
  Flamengo: '#e31b23',
  Cruzeiro: '#2f6dff',
  Internacional: '#d71920',
  Inter: '#2d7dff',
  Bragantino: '#f4f4f4',
  'Red Bull Bragantino': '#f4f4f4',
  Vasco: '#f4f4f4',
  Corinthians: '#f4f4f4',
  Palmeiras: '#1f9f55',
  Fluminense: '#8d1230',
  Botafogo: '#f4f4f4',
  'Atl. Mineiro': '#f4f4f4',
  'Atlético-MG': '#f4f4f4',
  'São Paulo': '#e63232',
  Mirassol: '#ffd23a',
  Barcelona: '#a31745',
  Bayern: '#dc052d',
  PSG: '#2d5eff',
  'Real Madrid': '#f4f4f4',
  Liverpool: '#d00027',
  Arsenal: '#ef0107',
  Chelsea: '#034694',
  'Manchester City': '#6cabdd',
  Jazz: '#002b5c',
  Thunder: '#007ac1',
  Knicks: '#f58426',
  Magic: '#0077c0',
  Bulls: '#ce1141',
  Heat: '#98002e',
  Warriors: '#1d428a',
  Lakers: '#552583',
  Pistons: '#1d42ba',
  Cavaliers: '#860038',
  '76ers': '#006bb6',
  Celtics: '#007a33',
  Nuggets: '#0e2240',
  Suns: '#1d1160',
  Mavericks: '#00538c',
  Spurs: '#c4ced4',
  Clippers: '#c8102e',
  Kings: '#5a2d81',
  'Kennesaw State': '#fdb927',
  'Southern Wesleyan': '#005eb8',
  Paulistano: '#d71920',
  Unifacisa: '#004b93',
  Minas: '#f4c430',
  Pinheiros: '#005baa',
  Valencia: '#f37021',
  'Virtus Bologna': '#000000',
  Varese: '#c8102e',
  Tortona: '#111111',
  Fenerbahçe: '#f6c500',
}

interface LogoColorBucket {
  r: number
  g: number
  b: number
  count: number
  score: number
}

function getLogoGlowStyle(glowColor: string): CSSProperties {
  return {
    ['--live-event-team-glow' as string]: glowColor,
  } as CSSProperties
}

function getTeamGlowFallbackColor(teamName: string): string {
  const trimmedName = teamName.trim()
  if (teamGlowFallbackColors[trimmedName]) return teamGlowFallbackColors[trimmedName]

  let hash = 0
  for (let i = 0; i < trimmedName.length; i++) {
    hash = (hash * 31 + trimmedName.charCodeAt(i)) >>> 0
  }

  return `hsl(${hash % 360} 72% 58%)`
}

function rgbToHslStats(r: number, g: number, b: number) {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const lightness = (max + min) / 2

  if (max === min) {
    return { saturation: 0, lightness }
  }

  const delta = max - min
  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min)

  return { saturation, lightness }
}

function getLogoPixelScore(r: number, g: number, b: number, a: number) {
  const alpha = a / 255
  if (alpha < 0.25) return 0

  const { saturation, lightness } = rgbToHslStats(r, g, b)
  const neutralPenalty = saturation < 0.16 ? 0.32 : 1
  const nearWhitePenalty = saturation < 0.12 && lightness > 0.82 ? 0.18 : 1
  const nearBlackPenalty = saturation < 0.12 && lightness < 0.14 ? 0.08 : 1
  const lightnessWeight = Math.max(0.4, 1 - Math.abs(lightness - 0.55) * 0.55)

  return alpha * (0.32 + saturation * 2.4) * neutralPenalty * nearWhitePenalty * nearBlackPenalty * lightnessWeight
}

function formatLogoColorBucket(bucket: LogoColorBucket) {
  const r = Math.round(bucket.r / bucket.count)
  const g = Math.round(bucket.g / bucket.count)
  const b = Math.round(bucket.b / bucket.count)

  return `rgb(${r}, ${g}, ${b})`
}

function getDominantLogoColorFromPixels(pixels: Uint8ClampedArray) {
  const buckets = new Map<string, LogoColorBucket>()

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index]
    const g = pixels[index + 1]
    const b = pixels[index + 2]
    const a = pixels[index + 3]
    const score = getLogoPixelScore(r, g, b, a)

    if (score <= 0) continue

    const bucketKey = `${Math.floor(r / 24)}-${Math.floor(g / 24)}-${Math.floor(b / 24)}`
    const bucket = buckets.get(bucketKey)

    if (bucket) {
      bucket.r += r
      bucket.g += g
      bucket.b += b
      bucket.count += 1
      bucket.score += score
    } else {
      buckets.set(bucketKey, { r, g, b, count: 1, score })
    }
  }

  let dominantBucket: LogoColorBucket | null = null

  buckets.forEach((bucket) => {
    if (!dominantBucket || bucket.score > dominantBucket.score) {
      dominantBucket = bucket
    }
  })

  return dominantBucket ? formatLogoColorBucket(dominantBucket) : null
}

function loadLogoImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Unable to load logo image: ${src}`))
    image.src = src
  })
}

async function extractDominantLogoColor(src: string): Promise<string | null> {
  if (logoDominantColorCache.has(src)) return logoDominantColorCache.get(src) ?? null

  const pendingRequest = pendingLogoDominantColorRequests.get(src)
  if (pendingRequest) return pendingRequest

  const request = loadLogoImage(src)
    .then((image) => {
      const maxDimension = Math.max(image.naturalWidth, image.naturalHeight)
      if (maxDimension <= 0) return null

      const scale = Math.min(1, LIVE_EVENT_LOGO_COLOR_CANVAS_MAX_SIZE / maxDimension)
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { willReadFrequently: true })

      if (!context) return null

      canvas.width = width
      canvas.height = height
      context.clearRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)

      return getDominantLogoColorFromPixels(context.getImageData(0, 0, width, height).data)
    })
    .catch(() => null)
    .then((color) => {
      logoDominantColorCache.set(src, color)
      pendingLogoDominantColorRequests.delete(src)
      return color
    })

  pendingLogoDominantColorRequests.set(src, request)
  return request
}

function useLogoGlowColor(src: string | undefined, teamName: string, isFallback: boolean, fallbackGlowColor: string) {
  const [resolvedLogoColor, setResolvedLogoColor] = useState<{ src: string; color: string | null } | null>(null)
  const teamGlowFallbackColor = getTeamGlowFallbackColor(teamName)

  useEffect(() => {
    if (!src || isFallback || logoDominantColorCache.has(src)) return

    let isCancelled = false

    void extractDominantLogoColor(src).then((dominantColor) => {
      if (!isCancelled) {
        setResolvedLogoColor({ src, color: dominantColor })
      }
    })

    return () => {
      isCancelled = true
    }
  }, [isFallback, src])

  if (!src || isFallback) return fallbackGlowColor
  if (logoDominantColorCache.has(src)) return logoDominantColorCache.get(src) ?? teamGlowFallbackColor
  if (resolvedLogoColor?.src === src) return resolvedLogoColor.color ?? teamGlowFallbackColor

  return teamGlowFallbackColor
}

function getDoubleChanceDisplayName(teamName: string): string {
  const trimmedName = teamName.trim()

  if (doubleChanceDisplayNames[trimmedName]) {
    return doubleChanceDisplayNames[trimmedName]
  }

  const [firstWord] = trimmedName.split(/\s+/)
  if (trimmedName.length > 10 && firstWord.length >= 4 && firstWord.length <= 9) {
    return firstWord
  }

  return trimmedName
}

const teamShotMarkets: Record<string, PlayerShotMarket[]> = {
  Flamengo: [
    { id: 'flamengo-arrascaeta', player: 'Arrascaeta', team: 'Flamengo', image: arrascaetaProps, outcomes: shotOutcomes([['0.5+', '1.55x'], ['1.5+', '2.05x'], ['2.5+', '3.80x']]) },
    { id: 'flamengo-pedro', player: 'Pedro', team: 'Flamengo', image: pedroProps, outcomes: shotOutcomes([['1.0+', '1.45x'], ['2.0+', '1.95x'], ['3.0+', '3.55x']]) },
  ],
  Cruzeiro: [
    { id: 'cruzeiro-matheus-pereira', player: 'Matheus Pereira', team: 'Cruzeiro', outcomes: shotOutcomes([['0.5+', '1.72x'], ['1.5+', '2.45x'], ['2.5+', '5.20x']]) },
    { id: 'cruzeiro-kaio-jorge', player: 'Kaio Jorge', team: 'Cruzeiro', outcomes: shotOutcomes([['0.5+', '1.82x'], ['1.5+', '2.65x'], ['2.5+', '5.80x']]) },
  ],
  Vasco: [
    { id: 'vasco-vegetti', player: 'Vegetti', team: 'Vasco', outcomes: shotOutcomes([['0.5+', '1.62x'], ['1.5+', '2.28x'], ['2.5+', '4.75x']]) },
    { id: 'vasco-payet', player: 'Payet', team: 'Vasco', outcomes: shotOutcomes([['0.5+', '1.95x'], ['1.5+', '3.10x'], ['2.5+', '7.00x']]) },
  ],
  Corinthians: [
    { id: 'corinthians-memphis', player: 'Memphis Depay', team: 'Corinthians', image: depayProps, outcomes: shotOutcomes([['1.0+', '1.62x'], ['2.0+', '2.18x'], ['3.0+', '4.10x']]) },
    { id: 'corinthians-yuri', player: 'Yuri Alberto', team: 'Corinthians', image: yuriProps, outcomes: shotOutcomes([['1.0+', '1.58x'], ['2.0+', '2.12x'], ['3.0+', '3.95x']]) },
  ],
  Internacional: [
    { id: 'internacional-alan-patrick', player: 'Alan Patrick', team: 'Internacional', outcomes: shotOutcomes([['0.5+', '1.78x'], ['1.5+', '2.55x'], ['2.5+', '5.60x']]) },
    { id: 'internacional-valencia', player: 'Enner Valencia', team: 'Internacional', outcomes: shotOutcomes([['0.5+', '1.66x'], ['1.5+', '2.32x'], ['2.5+', '4.90x']]) },
  ],
  Bragantino: [
    { id: 'bragantino-sasha', player: 'Eduardo Sasha', team: 'Bragantino', outcomes: shotOutcomes([['0.5+', '1.82x'], ['1.5+', '2.72x'], ['2.5+', '6.00x']]) },
    { id: 'bragantino-jhon-jhon', player: 'Jhon Jhon', team: 'Bragantino', outcomes: shotOutcomes([['0.5+', '2.05x'], ['1.5+', '3.30x'], ['2.5+', '8.00x']]) },
  ],
  Mirassol: [
    { id: 'mirassol-negueba', player: 'Negueba', team: 'Mirassol', outcomes: shotOutcomes([['0.5+', '2.10x'], ['1.5+', '3.55x'], ['2.5+', '8.50x']]) },
    { id: 'mirassol-reinaldo', player: 'Reinaldo', team: 'Mirassol', outcomes: shotOutcomes([['0.5+', '2.22x'], ['1.5+', '3.80x'], ['2.5+', '9.00x']]) },
  ],
  'São Paulo': [
    { id: 'sao-paulo-calleri', player: 'Calleri', team: 'São Paulo', outcomes: shotOutcomes([['0.5+', '1.62x'], ['1.5+', '2.24x'], ['2.5+', '4.65x']]) },
    { id: 'sao-paulo-luciano', player: 'Luciano', team: 'São Paulo', outcomes: shotOutcomes([['0.5+', '1.84x'], ['1.5+', '2.78x'], ['2.5+', '6.20x']]) },
  ],
  Palmeiras: [
    { id: 'palmeiras-flaco', player: 'Flaco Lopez', team: 'Palmeiras', image: flacoLopezProps, outcomes: shotOutcomes([['1.0+', '1.42x'], ['2.0+', '1.88x'], ['3.0+', '3.25x']]) },
    { id: 'palmeiras-veiga', player: 'Raphael Veiga', team: 'Palmeiras', outcomes: shotOutcomes([['0.5+', '1.74x'], ['1.5+', '2.48x'], ['2.5+', '5.40x']]) },
  ],
  Fluminense: [
    { id: 'fluminense-cano', player: 'Cano', team: 'Fluminense', outcomes: shotOutcomes([['0.5+', '1.70x'], ['1.5+', '2.40x'], ['2.5+', '5.10x']]) },
    { id: 'fluminense-arias', player: 'Arias', team: 'Fluminense', outcomes: shotOutcomes([['0.5+', '1.88x'], ['1.5+', '2.90x'], ['2.5+', '6.75x']]) },
  ],
  Botafogo: [
    { id: 'botafogo-igor-jesus', player: 'Igor Jesus', team: 'Botafogo', outcomes: shotOutcomes([['0.5+', '1.68x'], ['1.5+', '2.35x'], ['2.5+', '5.00x']]) },
    { id: 'botafogo-savarino', player: 'Savarino', team: 'Botafogo', outcomes: shotOutcomes([['0.5+', '1.92x'], ['1.5+', '3.05x'], ['2.5+', '7.25x']]) },
  ],
  'Atl. Mineiro': [
    { id: 'atletico-mg-hulk', player: 'Hulk', team: 'Atl. Mineiro', outcomes: shotOutcomes([['0.5+', '1.48x'], ['1.5+', '2.02x'], ['2.5+', '4.10x']]) },
    { id: 'atletico-mg-paulinho', player: 'Paulinho', team: 'Atl. Mineiro', outcomes: shotOutcomes([['0.5+', '1.70x'], ['1.5+', '2.48x'], ['2.5+', '5.40x']]) },
  ],
  'Atlético-MG': [
    { id: 'atletico-mg-hulk-alt', player: 'Hulk', team: 'Atlético-MG', outcomes: shotOutcomes([['0.5+', '1.48x'], ['1.5+', '2.02x'], ['2.5+', '4.10x']]) },
    { id: 'atletico-mg-paulinho-alt', player: 'Paulinho', team: 'Atlético-MG', outcomes: shotOutcomes([['0.5+', '1.70x'], ['1.5+', '2.48x'], ['2.5+', '5.40x']]) },
  ],
  Barcelona: [
    { id: 'barcelona-lewandowski', player: 'Lewandowski', team: 'Barcelona', outcomes: shotOutcomes([['0.5+', '1.38x'], ['1.5+', '1.78x'], ['2.5+', '3.10x']]) },
    { id: 'barcelona-raphinha', player: 'Raphinha', team: 'Barcelona', outcomes: shotOutcomes([['0.5+', '1.66x'], ['1.5+', '2.28x'], ['2.5+', '4.60x']]) },
  ],
  Bayern: [
    { id: 'bayern-kane', player: 'Harry Kane', team: 'Bayern', outcomes: shotOutcomes([['0.5+', '1.32x'], ['1.5+', '1.70x'], ['2.5+', '2.95x']]) },
    { id: 'bayern-musiala', player: 'Musiala', team: 'Bayern', outcomes: shotOutcomes([['0.5+', '1.78x'], ['1.5+', '2.70x'], ['2.5+', '6.00x']]) },
  ],
  PSG: [
    { id: 'psg-dembele', player: 'Dembélé', team: 'PSG', outcomes: shotOutcomes([['0.5+', '1.62x'], ['1.5+', '2.24x'], ['2.5+', '4.85x']]) },
    { id: 'psg-ramos', player: 'Gonçalo Ramos', team: 'PSG', outcomes: shotOutcomes([['0.5+', '1.58x'], ['1.5+', '2.20x'], ['2.5+', '4.70x']]) },
  ],
  Inter: [
    { id: 'inter-lautaro', player: 'Lautaro Martínez', team: 'Inter', outcomes: shotOutcomes([['0.5+', '1.50x'], ['1.5+', '2.08x'], ['2.5+', '4.35x']]) },
    { id: 'inter-thuram', player: 'Thuram', team: 'Inter', outcomes: shotOutcomes([['0.5+', '1.72x'], ['1.5+', '2.52x'], ['2.5+', '5.70x']]) },
  ],
}

const basketballTeamPlayers: Record<string, string[]> = {
  Jazz: ['Lauri Markkanen', 'Keyonte George', 'John Collins', 'Walker Kessler'],
  Thunder: ['Shai Gilgeous-Alexander', 'Jalen Williams', 'Chet Holmgren', 'Luguentz Dort'],
  Knicks: ['Jalen Brunson', 'Karl-Anthony Towns', 'Mikal Bridges', 'Josh Hart'],
  Magic: ['Paolo Banchero', 'Franz Wagner', 'Jalen Suggs', 'Wendell Carter Jr.'],
  Bulls: ['Coby White', 'Zach LaVine', 'Nikola Vucevic', 'Josh Giddey'],
  Heat: ['Tyler Herro', 'Bam Adebayo', 'Jimmy Butler', 'Jaime Jaquez Jr.'],
  Warriors: ['Stephen Curry', 'Jonathan Kuminga', 'Draymond Green', 'Brandin Podziemski'],
  Lakers: ['LeBron James', 'Luka Doncic', 'Austin Reaves', 'Rui Hachimura'],
  '76ers': ['Tyrese Maxey', 'Joel Embiid', 'Paul George', 'Kelly Oubre Jr.'],
  Celtics: ['Jayson Tatum', 'Jaylen Brown', 'Derrick White', 'Kristaps Porzingis'],
  Nuggets: ['Nikola Jokic', 'Jamal Murray', 'Michael Porter Jr.', 'Aaron Gordon'],
  Suns: ['Devin Booker', 'Kevin Durant', 'Bradley Beal', 'Grayson Allen'],
  Mavericks: ['Luka Doncic', 'Kyrie Irving', 'Klay Thompson', 'Dereck Lively II'],
  Spurs: ['Victor Wembanyama', 'Devin Vassell', 'Keldon Johnson', 'Jeremy Sochan'],
  Clippers: ['Kawhi Leonard', 'James Harden', 'Ivica Zubac', 'Norman Powell'],
  Kings: ['DeAaron Fox', 'Domantas Sabonis', 'Keegan Murray', 'Malik Monk'],
  'Southern Wesleyan': ['Julian Cameron', 'Marcus Reed', 'Tyler Harris', 'Noah Brooks'],
  'Kennesaw State': ['Terrell Burden', 'Demond Robinson', 'Simeon Cottle', 'Adrian Wooley'],
  'AEPS Machitis': ['Nikos Pappas', 'Dimitris Kosmas', 'Giorgos Theodorou', 'Alexandros Ioannou'],
  'ASA Koroivos': ['Vasilis Mouratos', 'Kostas Papadakis', 'Antonis Koniaris', 'Marios Georgiou'],
  'Vanoli Cremona': ['Trevor Lacey', 'Peyton Willis', 'Davide Denegri', 'Paul Eboua'],
  Varese: ['Nico Mannion', 'Davide Alviti', 'Skylar Spencer', 'Jordan Harris'],
  'Virtus Bologna': ['Tornike Shengelia', 'Marco Belinelli', 'Daniel Hackett', 'Ante Zizic'],
  Tortona: ['Tommaso Baldasso', 'Kyle Weems', 'Chris Dowe', 'Ismael Kamagate'],
  Beroe: ['Ivan Lilov', 'Pavel Marinov', 'Nikolay Stoyanov', 'Martin Georgiev'],
  'Balkan Botevgrad': ['Dimitur Dimitrov', 'Manny Suarez', 'Pavlin Ivanov', 'Mihailo Vasic'],
  Lafayette: ['Devin Hines', 'Kyle Jenkins', 'Ryan Pettit', 'Caleb Williams'],
  Pennsylvania: ['Clark Slajchert', 'Nick Spinoso', 'Sam Brown', 'Ethan Roberts'],
  'South Carolina St.': ['Mitchel Taylor', 'Davion Everett', 'Michael Teal', 'Jordan Simpson'],
  Charleston: ['Ante Brzovic', 'Reyne Smith', 'Ben Burnham', 'CJ Fulton'],
  Southern: ['Brandon Davis', 'Michael Jacobs', 'Tyrone Lyons', 'Kendal Coleman'],
  Texas: ['Max Abmas', 'Dylan Disu', 'Tyrese Hunter', 'Kadin Shedrick'],
  Besiktas: ['Derek Needham', 'Matt Mitchell', 'Jonah Mathews', 'Kerem Konan'],
  Lietkabelis: ['Gediminas Orelik', 'Vytenis Lipkevicius', 'Kristupas Zemaitis', 'Deividas Sirvydis'],
  'Chemnitz 99': ['Aher Uguak', 'Kaza Kajami-Keane', 'Wes van Beck', 'Jeff Garrett'],
  Panionios: ['Kendrick Ray', 'Giorgos Tsalmpouris', 'Nikos Gikas', 'Stelios Poulianitis'],
  'Hapoel Jerusalem': ['Levi Randolph', 'Khadeen Carrington', 'Austin Wiley', 'Yovel Zoosman'],
  'Hamburg Towers': ['Brae Ivey', 'Jordan Barnett', 'Jonas Wohlfarth-Bottermann', 'Nico Brauner'],
  Paulistano: ['Dalaqua', 'Gemadinha', 'Victao', 'Ruiz'],
  Unifacisa: ['Trevor Gaskins', 'Barnes', 'Gerson', 'Nesbitt'],
  Botafogo: ['Coelho', 'Pastor', 'Machado', 'Maique'],
  'Caxias do Sul': ['Alexey', 'Miller', 'Enzo', 'Pedro'],
  Flamengo: ['Didi Louzada', 'Gabriel Jaú', 'Olivinha', 'Alexey Borges'],
  Minas: ['Shaq Johnson', 'Gui Deodato', 'Danilo Fuzaro', 'Renan Lenz'],
  'São Paulo': ['Miller', 'Tyrone', 'Coelho', 'Maique'],
  Pinheiros: ['Ruivo', 'Munford', 'André Góes', 'Renan'],
  Valencia: ['Chris Jones', 'Brandon Davies', 'Semi Ojeleye', 'Xabi Lopez-Arostegui'],
  'USK Praha': ['Ondrej Sehnal', 'Matej Vanka', 'David Bohm', 'Martin Peterka'],
  Bourges: ['Sarah Michel', 'Laetitia Guapo', 'Kayla Alexander', 'Alix Duchet'],
  'Lyon ASVEL': ['Marine Johannes', 'Gabby Williams', 'Julie Allemand', 'Dominique Malonga'],
  Fenerbahçe: ['Emma Meesseman', 'Kayla McBride', 'Satou Sabally', 'Alina Iagupova'],
  Sopron: ['Briann January', 'Virag Kiss', 'Zsofia Fegyverneky', 'Megan Walker'],
  Schio: ['Marina Mabrey', 'Astou Ndour', 'Dorka Juhasz', 'Costanza Verona'],
  Girona: ['Marianna Tolo', 'Regan Magarity', 'Laura Pena', 'Carolina Guerrero'],
}

const BASKETBALL_FALLBACK_PLAYERS = ['Armador Titular', 'Ala Principal', 'Pivo', 'Sexto Homem']

function slugifyTeamName(teamName: string): string {
  return teamName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function buildFallbackShotMarkets(teamName: string): PlayerShotMarket[] {
  const slug = slugifyTeamName(teamName)
  const mappedPlayers = Array.from(
    new Set((TEAM_EVENTS[teamName] ?? []).map((event) => event.player))
  )
  const [primaryPlayer = 'Jogador', secondaryPlayer = 'Atacante'] = mappedPlayers

  return [
    { id: `${slug}-principal`, player: primaryPlayer, team: teamName, outcomes: shotOutcomes([['0.5+', '1.78x'], ['1.5+', '2.60x'], ['2.5+', '5.75x']]) },
    { id: `${slug}-atacante`, player: secondaryPlayer, team: teamName, outcomes: shotOutcomes([['0.5+', '1.88x'], ['1.5+', '2.85x'], ['2.5+', '6.40x']]) },
  ]
}

const supplementalShotOutcomes = [
  shotOutcomes([['0.5+', '1.78x'], ['1.5+', '2.60x'], ['2.5+', '5.75x']]),
  shotOutcomes([['0.5+', '1.88x'], ['1.5+', '2.85x'], ['2.5+', '6.40x']]),
  shotOutcomes([['0.5+', '2.05x'], ['1.5+', '3.25x'], ['2.5+', '7.50x']]),
  shotOutcomes([['0.5+', '2.22x'], ['1.5+', '3.70x'], ['2.5+', '8.80x']]),
]

function normalizePlayerName(playerName: string): string {
  return slugifyTeamName(playerName.replace(/\s+/g, ' '))
}

function hasPlayer(rows: PlayerShotMarket[], playerName: string): boolean {
  const normalizedPlayer = normalizePlayerName(playerName)
  return rows.some((row) => normalizePlayerName(row.player) === normalizedPlayer)
}

function buildSupplementalShotMarket(teamName: string, playerName: string, index: number): PlayerShotMarket {
  return {
    id: `${slugifyTeamName(teamName)}-${normalizePlayerName(playerName)}-${index}`,
    player: playerName,
    team: teamName,
    outcomes: supplementalShotOutcomes[index % supplementalShotOutcomes.length],
  }
}

function getTeamShotMarketRows(teamName: string): PlayerShotMarket[] {
  const rows = [...(teamShotMarkets[teamName] ?? buildFallbackShotMarkets(teamName))]
  const mappedPlayers = Array.from(new Set((TEAM_EVENTS[teamName] ?? []).map((event) => event.player)))
  const fallbackPlayers = FALLBACK_PLAYERS.map((player) => `${player}`)
  const candidates = [...mappedPlayers, ...fallbackPlayers]

  for (const playerName of candidates) {
    if (rows.length >= 4) break
    if (hasPlayer(rows, playerName)) continue
    rows.push(buildSupplementalShotMarket(teamName, playerName, rows.length))
  }

  return rows.slice(0, 4)
}

function getShotsOnGoalRows(match: LiveEventMatch, isExpanded: boolean): PlayerShotMarket[] {
  const rows = [
    ...getTeamShotMarketRows(match.homeTeam.name),
    ...getTeamShotMarketRows(match.awayTeam.name),
  ]
  return rows.slice(0, isExpanded ? 8 : 4)
}

function formatMarketLine(line: number): string {
  return Number.isInteger(line) ? `${line}.0` : `${line}`
}

function getBasketballTeamPlayers(teamName: string): string[] {
  return basketballTeamPlayers[teamName] ?? BASKETBALL_FALLBACK_PLAYERS
}

function buildBasketballPlayerPointMarket(teamName: string, playerName: string, index: number): PlayerShotMarket {
  const baseLine = 8.5 + index * 2

  return {
    id: `${slugifyTeamName(teamName)}-${normalizePlayerName(playerName)}-points`,
    player: playerName,
    team: teamName,
    outcomes: shotOutcomes([
      [`${formatMarketLine(baseLine)}+`, `${(1.48 + index * 0.08).toFixed(2)}x`],
      [`${formatMarketLine(baseLine + 5)}+`, `${(2.05 + index * 0.16).toFixed(2)}x`],
      [`${formatMarketLine(baseLine + 10)}+`, `${(3.20 + index * 0.28).toFixed(2)}x`],
    ]),
  }
}

function getBasketballTeamPlayerRows(teamName: string): PlayerShotMarket[] {
  return getBasketballTeamPlayers(teamName)
    .slice(0, 4)
    .map((playerName, index) => buildBasketballPlayerPointMarket(teamName, playerName, index))
}

function getBasketballPlayerPointRows(match: LiveEventMatch, isExpanded: boolean): PlayerShotMarket[] {
  const rows = [
    ...getBasketballTeamPlayerRows(match.homeTeam.name),
    ...getBasketballTeamPlayerRows(match.awayTeam.name),
  ]
  return rows.slice(0, isExpanded ? 8 : 4)
}

function getPlayerPropRows(match: LiveEventMatch, isBasketball: boolean, isExpanded: boolean): PlayerShotMarket[] {
  return isBasketball
    ? getBasketballPlayerPointRows(match, isExpanded)
    : getShotsOnGoalRows(match, isExpanded)
}

const liveEventMidfieldPlayerNames = new Set([
  'arrascaeta',
  'de-la-cruz',
  'matheus-pereira',
  'payet',
  'alan-patrick',
  'jhon-jhon',
  'raphael-veiga',
  'arias',
  'savarino',
  'musiala',
  'dembele',
  'raphinha',
])

function getPlayerPropCardPosition(playerName: string, isBasketball: boolean): string {
  if (isBasketball) return 'PTS'
  return liveEventMidfieldPlayerNames.has(normalizePlayerName(playerName)) ? 'MEI' : 'ATA'
}

function getTotalGoalsRows(match: LiveEventMatch, isExpanded: boolean): TotalGoalsMarketRow[] {
  const currentLine = match.totalGoalsOdds?.line ?? 2.5
  const lines = [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5]
  const normalizedLines = lines.includes(currentLine) ? lines : [currentLine, ...lines]
  const visibleLines = normalizedLines.slice(0, isExpanded ? 8 : 4)
  const underFallbackOdds = ['1.42x', '1.78x', '2.15x', '2.65x', '3.10x', '3.80x', '4.60x', '5.40x']
  const overFallbackOdds = ['2.70x', '1.98x', '1.62x', '1.38x', '1.24x', '1.16x', '1.10x', '1.06x']

  return visibleLines.map((line, index) => {
    const isCurrentLine = line === currentLine && match.totalGoalsOdds
    const underOdd = isCurrentLine ? match.totalGoalsOdds!.under : underFallbackOdds[index]
    const overOdd = isCurrentLine ? match.totalGoalsOdds!.over : overFallbackOdds[index]
    const formattedLine = formatMarketLine(line)

    return {
      id: `total-goals-${formattedLine}`,
      under: { label: `Menos de ${formattedLine}`, odd: underOdd },
      over: { label: `Mais de ${formattedLine}`, odd: overOdd },
    }
  })
}

function buildLineMarketRows(
  market: { line: number; under: string; over: string } | undefined,
  lines: number[],
  underFallbackOdds: string[],
  overFallbackOdds: string[],
  underLabel: string,
  overLabel: string
): TotalGoalsMarketRow[] {
  const currentLine = market?.line ?? lines[0]
  const normalizedLines = lines.includes(currentLine) ? lines : [currentLine, ...lines]

  return normalizedLines.slice(0, 4).map((line, index) => {
    const isCurrentLine = line === currentLine && market
    const formattedLine = formatMarketLine(line)

    return {
      id: `${underLabel}-${formattedLine}`,
      under: {
        label: `${underLabel} ${formattedLine}`,
        odd: isCurrentLine ? market.under : underFallbackOdds[index],
      },
      over: {
        label: `${overLabel} ${formattedLine}`,
        odd: isCurrentLine ? market.over : overFallbackOdds[index],
      },
    }
  })
}

function getTotalCornersRows(match: LiveEventMatch): TotalGoalsMarketRow[] {
  return buildLineMarketRows(
    match.totalCornersOdds,
    [8.5, 9.5, 10.5, 11.5],
    ['1.70x', '1.88x', '2.10x', '2.45x'],
    ['2.05x', '1.86x', '1.66x', '1.48x'],
    'Menos de',
    'Mais de'
  )
}

function getTotalPointsRows(match: LiveEventMatch): TotalGoalsMarketRow[] {
  const currentLine = match.totalPointsOdds?.line ?? 164.5
  return buildLineMarketRows(
    match.totalPointsOdds,
    [currentLine, currentLine + 4, currentLine + 8, currentLine + 12],
    ['1.78x', '1.92x', '2.08x', '2.26x'],
    ['2.04x', '1.88x', '1.72x', '1.58x'],
    'Menos de',
    'Mais de'
  )
}

function formatSignedLine(line: number): string {
  if (line === 0) return '0.0'
  return `${line > 0 ? '+' : ''}${formatMarketLine(line)}`
}

function getHandicapRows(match: LiveEventMatch): TotalGoalsMarketRow[] {
  const currentLine = match.handicapOdds?.line ?? 1.5
  const lines = [currentLine, currentLine + 2, currentLine - 2, currentLine + 4]

  return lines.slice(0, 4).map((line, index) => {
    const isCurrentLine = line === currentLine && match.handicapOdds
    const homeOdd = isCurrentLine ? match.handicapOdds!.home : ['1.88x', '1.94x', '1.82x', '2.02x'][index]
    const awayOdd = isCurrentLine ? match.handicapOdds!.away : ['1.92x', '1.86x', '1.98x', '1.78x'][index]

    return {
      id: `handicap-${formatSignedLine(line)}`,
      under: {
        label: `${match.homeTeam.name} ${formatSignedLine(line)}`,
        odd: homeOdd,
      },
      over: {
        label: `${match.awayTeam.name} ${formatSignedLine(-line)}`,
        odd: awayOdd,
      },
    }
  })
}

function getQuarterTotalRows(market: LiveEventMatch['q3TotalOdds'] | LiveEventMatch['q4TotalOdds']): TotalGoalsMarketRow[] {
  const currentLine = market?.line ?? 42.5
  return buildLineMarketRows(
    market,
    [currentLine, currentLine + 2, currentLine + 4, currentLine + 6],
    ['1.82x', '1.94x', '2.12x', '2.34x'],
    ['1.98x', '1.86x', '1.68x', '1.52x'],
    'Menos de',
    'Mais de'
  )
}

function getTotalCardsRows(): TotalGoalsMarketRow[] {
  return buildLineMarketRows(
    undefined,
    [3.5, 4.5, 5.5, 6.5],
    ['1.62x', '1.88x', '2.25x', '2.85x'],
    ['2.18x', '1.82x', '1.58x', '1.34x'],
    'Menos de',
    'Mais de'
  )
}

function isLineMarketCurrentRow(row: TotalGoalsMarketRow, line: number | undefined): boolean {
  return line !== undefined && row.id.endsWith(`-${formatMarketLine(line)}`)
}

function isHandicapCurrentRow(row: TotalGoalsMarketRow, line: number | undefined): boolean {
  return line !== undefined && row.id === `handicap-${formatSignedLine(line)}`
}

function getLiveEventLineOutcomeId(row: TotalGoalsMarketRow, isCurrentRow: boolean, outcomeId: string): string {
  return isCurrentRow ? outcomeId : `${outcomeId}-${row.id}`
}

const liveEventDoubleChanceOutcomeIds = ['home-or-draw', 'home-or-away', 'away-or-draw']

function getDoubleChanceRows(match: LiveEventMatch): ThreeWayMarketRow[] {
  const homeDisplayName = getDoubleChanceDisplayName(match.homeTeam.name)
  const awayDisplayName = getDoubleChanceDisplayName(match.awayTeam.name)

  return [
    {
      id: 'double-chance-main',
      options: [
        {
          label: `${match.homeTeam.name} ou Empate`,
          labelParts: [homeDisplayName, 'Empate'],
          odd: match.doubleChanceOdds?.homeOrDraw ?? '1.30x',
        },
        {
          label: `${match.homeTeam.name} ou ${match.awayTeam.name}`,
          labelParts: [homeDisplayName, awayDisplayName],
          odd: match.doubleChanceOdds?.homeOrAway ?? '1.28x',
        },
        {
          label: `Empate ou ${match.awayTeam.name}`,
          labelParts: ['Empate', awayDisplayName],
          odd: match.doubleChanceOdds?.awayOrDraw ?? '1.65x',
        },
      ],
    },
  ]
}

function parseLiveTime(timeStr: string): { prefix: string; totalSeconds: number; isQuarter: boolean } | null {
  const match = timeStr.match(/^(.+?)\s+(\d+):(\d+)$/)
  if (!match) return null
  return {
    prefix: match[1],
    totalSeconds: parseInt(match[2]) * 60 + parseInt(match[3]),
    isQuarter: /^Q\d+$/.test(match[1]),
  }
}

function formatLiveTime(prefix: string, totalSeconds: number): string {
  const normalizedSeconds = Math.max(0, totalSeconds)
  const m = Math.floor(normalizedSeconds / 60)
  const s = normalizedSeconds % 60
  return `${prefix} ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getNextLiveTime(parsed: { prefix: string; totalSeconds: number; isQuarter: boolean }): string {
  return formatLiveTime(
    parsed.prefix,
    parsed.isQuarter ? parsed.totalSeconds - 1 : parsed.totalSeconds + 1
  )
}

function getLiveEventMatchKey(match: LiveEventMatch, index: number): string {
  return match.id ?? `${match.homeTeam.name}-${match.awayTeam.name}-${index}`
}

function getLiveEventMatchIdentity(match: LiveEventMatch, index: number): string {
  const matchKey = getLiveEventMatchKey(match, index)
  return match.leagueId ? `${match.leagueId}:${matchKey}` : matchKey
}

function getLiveEventRailIdentity(item: LiveEventRailItem): string {
  return item.leagueId ? `${item.leagueId}:${item.id}` : item.id
}

function getLiveEventMatchTime(match: LiveEventMatch, index: number, currentTimes: Record<string, string> | undefined, fallback?: string): string {
  const key = getLiveEventMatchKey(match, index)
  return currentTimes?.[key] ?? match.currentTime ?? fallback ?? match.dateTime ?? match.time ?? 'Ao vivo'
}

function getLiveEventSportFallbackIcon(sport: string): string {
  return sport === 'basquete' ? iconBasquete : iconFutebol
}

function isLiveEventFallbackTeamIcon(icon: string | undefined, sport: string): boolean {
  if (!icon) return true
  if (sport === 'basquete') return icon === escudoDefaultBasquete || icon === iconBasquete
  if (sport === 'futebol') return icon === iconFutebol
  return false
}

function getLiveEventTeamIconView(icon: string | undefined, sport: string) {
  const isFallback = isLiveEventFallbackTeamIcon(icon, sport)

  return {
    src: isFallback ? getLiveEventSportFallbackIcon(sport) : icon,
    isFallback,
  }
}

function getLiveEventRailFallbackItems({
  matches,
  currentTimes,
  leagueName,
  leagueFlag,
  sport,
}: {
  matches: LiveEventMatch[]
  currentTimes?: Record<string, string>
  leagueName: string
  leagueFlag?: string
  sport: string
}): LiveEventRailItem[] {
  return matches.map((match, index) => {
    const id = getLiveEventMatchKey(match, index)
    const displayTime = getLiveEventMatchTime(match, index, currentTimes)

    return {
      id,
      leagueId: match.leagueId,
      leagueName: match.leagueName ?? leagueName,
      leagueFlag: match.leagueFlag ?? leagueFlag,
      sport: match.sport ?? sport,
      isLive: match.isLive ?? true,
      dateTime: match.dateTime ?? match.time ?? displayTime,
      currentTime: displayTime,
      headerPrimary: (match.isLive ?? true) ? displayTime : undefined,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      odds: match.odds,
    }
  })
}

function getLiveEventRailPreMatchHeader(item: LiveEventRailItem) {
  if (item.headerPrimary) {
    return {
      primary: item.headerPrimary,
      secondary: item.headerSecondary ?? item.leagueName,
    }
  }

  const [datePart, timePart] = item.dateTime.split(',').map((part) => part.trim())
  return {
    primary: timePart || datePart,
    secondary: datePart || item.leagueName,
  }
}

interface LiveEventRailTeamIconProps {
  team: LiveEventRailItem['homeTeam']
  sport: string
  side: 'home' | 'away'
}

function LiveEventRailTeamIcon({ team, sport, side }: LiveEventRailTeamIconProps) {
  const resolvedIcon = useSportsDbTeamLogo(team.name, team.icon, sport, getLiveEventSportFallbackIcon(sport), {
    useCurrentLogoFallback: false,
  })
  const teamIcon = getLiveEventTeamIconView(resolvedIcon, sport)

  if (!teamIcon.src) {
    return <span className="live-event-page__rail-team-icon live-event-page__rail-team-icon--placeholder" />
  }

  return (
    <img
      src={teamIcon.src}
      alt=""
      className={[
        'live-event-page__rail-team-icon',
        teamIcon.isFallback ? `live-event-page__rail-team-icon--sport-fallback live-event-page__rail-team-icon--sport-${side}` : '',
      ].filter(Boolean).join(' ')}
    />
  )
}

interface LiveEventMatchRailProps {
  items: LiveEventRailItem[]
  activeIdentity: string
  activeRailIndex: number
  railTimes: Record<string, string>
  selectableIdentities: Set<string>
  isExpanded: boolean
  onSelect: (item: LiveEventRailItem, railIndex: number) => void
}

function LiveEventMatchRail({
  items,
  activeIdentity,
  activeRailIndex,
  railTimes,
  selectableIdentities,
  isExpanded,
  onSelect,
}: LiveEventMatchRailProps) {
  const railRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const lastPositionedIndexRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    if (isExpanded || activeRailIndex < 0) return

    const railEl = railRef.current
    const itemEl = itemRefs.current[activeRailIndex]
    if (!railEl || !itemEl) return

    const maxScrollLeft = Math.max(0, railEl.scrollWidth - railEl.clientWidth)
    const centeredLeft = itemEl.offsetLeft - (railEl.clientWidth - itemEl.offsetWidth) / 2
    const targetLeft = activeRailIndex === 0
      ? 0
      : activeRailIndex === items.length - 1
        ? maxScrollLeft
        : Math.min(maxScrollLeft, Math.max(0, centeredLeft))
    const isFirstPosition = lastPositionedIndexRef.current === null
    const didActiveIndexChange = lastPositionedIndexRef.current !== activeRailIndex

    railEl.scrollTo({
      left: targetLeft,
      top: 0,
      behavior: isFirstPosition || !didActiveIndexChange ? 'auto' : 'smooth',
    })
    lastPositionedIndexRef.current = activeRailIndex
  }, [activeRailIndex, isExpanded, items.length])

  const handleCardKeyDown = (event: KeyboardEvent<HTMLButtonElement>, item: LiveEventRailItem, railIndex: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelect(item, railIndex)
  }

  return (
    <div className="live-event-page__compact-rail" ref={railRef} aria-label="Jogos">
      <div className="live-event-page__compact-rail-track">
        {items.map((item, index) => {
          const identity = getLiveEventRailIdentity(item)
          const isActive = identity === activeIdentity
          const isSelectable = selectableIdentities.has(identity)
          const displayTime = railTimes[identity] ?? item.currentTime ?? item.headerPrimary ?? item.dateTime
          const preMatchHeader = getLiveEventRailPreMatchHeader(item)

          return (
            <button
              key={identity}
              ref={(element) => { itemRefs.current[index] = element }}
              type="button"
              className={[
                'live-event-page__rail-card',
                item.isLive ? 'live-event-page__rail-card--live' : 'live-event-page__rail-card--prematch',
                isActive ? 'live-event-page__rail-card--active' : '',
                isSelectable ? 'live-event-page__rail-card--selectable' : 'live-event-page__rail-card--disabled',
              ].filter(Boolean).join(' ')}
              aria-label={`${item.homeTeam.name} contra ${item.awayTeam.name}`}
              aria-pressed={isActive && isSelectable ? true : undefined}
              disabled={!isSelectable}
              onClick={() => onSelect(item, index)}
              onKeyDown={(event) => handleCardKeyDown(event, item, index)}
            >
              <span className="live-event-page__rail-active-line" aria-hidden="true" />
              <span className="live-event-page__rail-card-header">
                {item.isLive ? (
                  <>
                    <span className="live-event-page__rail-live-meta">
                      <span className="live-event-page__rail-live-icon-wrap" aria-hidden="true">
                        <img src={iconAoVivo} alt="" className="live-event-page__rail-live-icon" />
                      </span>
                      <span className="live-event-page__rail-header-primary">{displayTime}</span>
                    </span>
                    <MonitorPlayIcon aria-hidden="true" className="live-event-page__rail-stream-icon" weight="bold" />
                  </>
                ) : (
                  <>
                    <span className="live-event-page__rail-header-primary">{preMatchHeader.primary}</span>
                    <span className="live-event-page__rail-header-secondary">{preMatchHeader.secondary}</span>
                  </>
                )}
              </span>

              <span className="live-event-page__rail-teams">
                <span className="live-event-page__rail-team-list">
                  <span className="live-event-page__rail-team-row">
                    <LiveEventRailTeamIcon team={item.homeTeam} sport={item.sport} side="home" />
                    <span className="live-event-page__rail-team-name">{item.homeTeam.name}</span>
                  </span>
                  <span className="live-event-page__rail-team-row">
                    <LiveEventRailTeamIcon team={item.awayTeam} sport={item.sport} side="away" />
                    <span className="live-event-page__rail-team-name">{item.awayTeam.name}</span>
                  </span>
                </span>
                {item.isLive && (
                  <span className="live-event-page__rail-score-column" aria-label="Placar">
                    <span className="live-event-page__rail-team-score">{item.homeTeam.score ?? 0}</span>
                    <span className="live-event-page__rail-team-score">{item.awayTeam.score ?? 0}</span>
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PauseIcon() {
  return (
    <svg className="live-event-page__stream-icon" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="3" y="2.25" width="2" height="7.5" rx="0.5" fill="currentColor" />
      <rect x="7" y="2.25" width="2" height="7.5" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function MuteIcon() {
  return (
    <svg className="live-event-page__stream-icon" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M5.6 2.3 3.4 4.1H1.7a.5.5 0 0 0-.5.5v2.8a.5.5 0 0 0 .5.5h1.7l2.2 1.8a.4.4 0 0 0 .65-.31V2.6a.4.4 0 0 0-.65-.3Z"
        fill="currentColor"
      />
      <path
        d="m8 4.5 2.5 3M10.5 4.5 8 7.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg className="live-event-page__stream-icon live-event-page__stream-icon--lg" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

function CloseStreamIcon() {
  return (
    <svg className="live-event-page__stream-icon live-event-page__stream-icon--lg" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="m4.5 4.5 7 7M11.5 4.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

interface MatchEvent {
  type: 'yellow' | 'red' | 'goal'
  player: string
  minute?: number
  detail?: string
}

// Events ordered by minute; include enough goals per team to cover any realistic score
const TEAM_EVENTS: Record<string, MatchEvent[]> = {
  // Brasil
  'Flamengo':         [{ type: 'yellow', player: 'Arrascaeta', minute: 20 }, { type: 'goal', player: 'Pedro', minute: 38 }, { type: 'goal', player: 'Gabigol', minute: 57 }, { type: 'goal', player: 'De La Cruz', minute: 72 }],
  'Cruzeiro':         [{ type: 'goal', player: 'Matheus Pereira', minute: 7 }, { type: 'yellow', player: 'Zé Ivaldo', minute: 31 }, { type: 'goal', player: 'Kaique Rocha', minute: 65 }, { type: 'goal', player: 'Eduardo', minute: 80 }],
  'Internacional':    [{ type: 'yellow', player: 'Thiago Maia', minute: 14 }, { type: 'goal', player: 'Valencia', minute: 42 }, { type: 'goal', player: 'Wesley', minute: 58 }, { type: 'goal', player: 'Bernabei', minute: 74 }],
  'Bragantino':       [{ type: 'goal', player: 'Jhon Jhon', minute: 9 }, { type: 'yellow', player: 'Laquintana', minute: 33 }, { type: 'goal', player: 'Vinicinho', minute: 61 }, { type: 'goal', player: 'Sasha', minute: 79 }],
  'Mirassol':         [{ type: 'yellow', player: 'Lucas Ramon', minute: 22 }, { type: 'goal', player: 'Cristian', minute: 41 }, { type: 'goal', player: 'Reinaldo', minute: 60 }, { type: 'goal', player: 'Negueba', minute: 75 }],
  'Palmeiras':        [{ type: 'goal', player: 'Flaco López', minute: 18 }, { type: 'yellow', player: 'Aníbal Moreno', minute: 35 }, { type: 'goal', player: 'Estêvão', minute: 54 }, { type: 'goal', player: 'Raphael Veiga', minute: 70 }],
  'Fluminense':       [{ type: 'yellow', player: 'Felipe Melo', minute: 19 }, { type: 'goal', player: 'Cano', minute: 36 }, { type: 'goal', player: 'Arias', minute: 58 }, { type: 'goal', player: 'Keno', minute: 74 }],
  'São Paulo':        [{ type: 'yellow', player: 'Luiz Gustavo', minute: 27 }, { type: 'goal', player: 'Calleri', minute: 43 }, { type: 'goal', player: 'André Silva', minute: 62 }, { type: 'goal', player: 'Luciano', minute: 77 }],
  'Corinthians':      [{ type: 'yellow', player: 'André Ramalho', minute: 22 }, { type: 'goal', player: 'Memphis', minute: 49 }, { type: 'goal', player: 'Romero', minute: 64 }, { type: 'goal', player: 'Yuri Alberto', minute: 81 }],
  'Grêmio':           [{ type: 'yellow', player: 'Kannemann', minute: 16 }, { type: 'goal', player: 'Soteldo', minute: 32 }, { type: 'goal', player: 'Cristaldo', minute: 55 }, { type: 'goal', player: 'Arezo', minute: 71 }],
  'Atlético-MG':      [{ type: 'goal', player: 'Hulk', minute: 24 }, { type: 'yellow', player: 'Otávio', minute: 40 }, { type: 'goal', player: 'Paulinho', minute: 58 }, { type: 'goal', player: 'Vargas', minute: 75 }],
  'Atl. Mineiro':     [{ type: 'goal', player: 'Hulk', minute: 24 }, { type: 'yellow', player: 'Otávio', minute: 40 }, { type: 'goal', player: 'Paulinho', minute: 58 }, { type: 'goal', player: 'Vargas', minute: 75 }],
  'Botafogo':         [{ type: 'goal', player: 'Tiquinho Soares', minute: 13 }, { type: 'yellow', player: 'Marçal', minute: 44 }, { type: 'goal', player: 'Savarino', minute: 60 }, { type: 'goal', player: 'Igor Jesus', minute: 78 }],
  'Vasco':            [{ type: 'yellow', player: 'Hugo Moura', minute: 19 }, { type: 'goal', player: 'Vegetti', minute: 37 }, { type: 'goal', player: 'Payet', minute: 56 }, { type: 'goal', player: 'Léo', minute: 73 }],
  'Athletico-PR':     [{ type: 'goal', player: 'Cuello', minute: 8 }, { type: 'yellow', player: 'Thiago Heleno', minute: 41 }, { type: 'goal', player: 'Canobbio', minute: 59 }, { type: 'goal', player: 'Pablo', minute: 76 }],
  'Fortaleza':        [{ type: 'yellow', player: 'Titi', minute: 31 }, { type: 'goal', player: 'Moisés', minute: 47 }, { type: 'goal', player: 'Lucero', minute: 63 }, { type: 'goal', player: 'Pochettino', minute: 80 }],
  'Bahia':            [{ type: 'goal', player: 'Everaldo', minute: 17 }, { type: 'yellow', player: 'Rezende', minute: 38 }, { type: 'goal', player: 'Cauly', minute: 60 }, { type: 'goal', player: 'Biel', minute: 77 }],
  'Santos':           [{ type: 'goal', player: 'Guilherme', minute: 11 }, { type: 'yellow', player: 'João Paulo', minute: 37 }, { type: 'goal', player: 'Soteldo', minute: 53 }, { type: 'goal', player: 'Morelos', minute: 70 }],
  // Europa — Champions / Top
  'PSG':              [{ type: 'goal', player: 'Dembélé', minute: 12 }, { type: 'yellow', player: 'Nuno Mendes', minute: 28 }, { type: 'goal', player: 'Vitinha', minute: 47 }, { type: 'goal', player: 'Ramos', minute: 67 }],
  'Lyon':             [{ type: 'yellow', player: 'Tolisso', minute: 18 }, { type: 'goal', player: 'Lacazette', minute: 35 }, { type: 'goal', player: 'Cherki', minute: 55 }, { type: 'goal', player: 'Nuamah', minute: 73 }],
  'Newcastle':        [{ type: 'yellow', player: 'Bruno Guimarães', minute: 21 }, { type: 'goal', player: 'Isak', minute: 39 }, { type: 'goal', player: 'Gordon', minute: 58 }, { type: 'goal', player: 'Wilson', minute: 76 }],
  'Napoli':           [{ type: 'goal', player: 'Kvaratskhelia', minute: 10 }, { type: 'yellow', player: 'Lobotka', minute: 34 }, { type: 'goal', player: 'Lukaku', minute: 52 }, { type: 'goal', player: 'Di Lorenzo', minute: 69 }],
  'Barcelona':        [{ type: 'goal', player: 'Lewandowski', minute: 15 }, { type: 'yellow', player: 'Koundé', minute: 32 }, { type: 'goal', player: 'Yamal', minute: 53 }, { type: 'goal', player: 'Raphinha', minute: 71 }],
  'Bayern':           [{ type: 'goal', player: 'Harry Kane', minute: 7 }, { type: 'yellow', player: 'Goretzka', minute: 30 }, { type: 'goal', player: 'Musiala', minute: 50 }, { type: 'goal', player: 'Sané', minute: 68 }],
  'Real Madrid':      [{ type: 'goal', player: 'Vini Jr', minute: 14 }, { type: 'yellow', player: 'Camavinga', minute: 36 }, { type: 'goal', player: 'Bellingham', minute: 54 }, { type: 'goal', player: 'Mbappé', minute: 72 }],
  'Manchester City':  [{ type: 'goal', player: 'Haaland', minute: 11 }, { type: 'yellow', player: 'Rodri', minute: 29 }, { type: 'goal', player: 'De Bruyne', minute: 49 }, { type: 'goal', player: 'Foden', minute: 66 }],
  'Man. City':        [{ type: 'goal', player: 'Haaland', minute: 11 }, { type: 'yellow', player: 'Rodri', minute: 29 }, { type: 'goal', player: 'De Bruyne', minute: 49 }, { type: 'goal', player: 'Foden', minute: 66 }],
  'Arsenal':          [{ type: 'yellow', player: 'Partey', minute: 23 }, { type: 'goal', player: 'Saka', minute: 41 }, { type: 'goal', player: 'Havertz', minute: 60 }, { type: 'goal', player: 'Martinelli', minute: 78 }],
  'Liverpool':        [{ type: 'goal', player: 'Salah', minute: 9 }, { type: 'yellow', player: 'Mac Allister', minute: 33 }, { type: 'goal', player: 'Núñez', minute: 51 }, { type: 'goal', player: 'Diaz', minute: 70 }],
  'Chelsea':          [{ type: 'yellow', player: 'Caicedo', minute: 17 }, { type: 'goal', player: 'Palmer', minute: 38 }, { type: 'goal', player: 'Jackson', minute: 57 }, { type: 'goal', player: 'Nkunku', minute: 74 }],
  'Inter':            [{ type: 'goal', player: 'Thuram', minute: 16 }, { type: 'yellow', player: 'Barella', minute: 37 }, { type: 'goal', player: 'Lautaro', minute: 55 }, { type: 'goal', player: 'Çalhanoğlu', minute: 73 }],
  'Milan':            [{ type: 'yellow', player: 'Tomori', minute: 20 }, { type: 'goal', player: 'Giroud', minute: 40 }, { type: 'goal', player: 'Leão', minute: 59 }, { type: 'goal', player: 'Pulisic', minute: 76 }],
  'Juventus':         [{ type: 'goal', player: 'Vlahović', minute: 13 }, { type: 'yellow', player: 'Bremer', minute: 35 }, { type: 'goal', player: 'Yildiz', minute: 53 }, { type: 'goal', player: 'Chiesa', minute: 70 }],
  'Atlético Madrid':  [{ type: 'yellow', player: 'Koke', minute: 24 }, { type: 'goal', player: 'Griezmann', minute: 44 }, { type: 'goal', player: 'Morata', minute: 62 }, { type: 'goal', player: 'Riquelme', minute: 79 }],
  'Borussia Dortmund':[{ type: 'goal', player: 'Füllkrug', minute: 18 }, { type: 'yellow', player: 'Hummels', minute: 39 }, { type: 'goal', player: 'Brandt', minute: 57 }, { type: 'goal', player: 'Adeyemi', minute: 74 }],
  'Aston Villa':      [{ type: 'yellow', player: 'McGinn', minute: 21 }, { type: 'goal', player: 'Watkins', minute: 38 }, { type: 'goal', player: 'Bailey', minute: 56 }, { type: 'goal', player: 'Rogers', minute: 73 }],
  'Brighton':         [{ type: 'goal', player: 'Welbeck', minute: 14 }, { type: 'yellow', player: 'Estupiñán', minute: 34 }, { type: 'goal', player: 'João Pedro', minute: 52 }, { type: 'goal', player: 'Mitoma', minute: 69 }],
  'West Ham':         [{ type: 'yellow', player: 'Soucek', minute: 23 }, { type: 'goal', player: 'Bowen', minute: 42 }, { type: 'goal', player: 'Paquetá', minute: 60 }, { type: 'goal', player: 'Kudus', minute: 77 }],
  'Nottingham':       [{ type: 'goal', player: 'Wood', minute: 16 }, { type: 'yellow', player: 'Yates', minute: 35 }, { type: 'goal', player: 'Hudson-Odoi', minute: 54 }, { type: 'goal', player: 'Awoniyi', minute: 72 }],
  'Leeds':            [{ type: 'yellow', player: 'Ampadu', minute: 19 }, { type: 'goal', player: 'Piroe', minute: 38 }, { type: 'goal', player: 'Rutter', minute: 57 }, { type: 'goal', player: 'James', minute: 74 }],
  'Burnley':          [{ type: 'goal', player: 'Foster', minute: 21 }, { type: 'yellow', player: 'O\'Shea', minute: 41 }, { type: 'goal', player: 'Rodríguez', minute: 60 }, { type: 'goal', player: 'Brownhill', minute: 76 }],
  'Getafe':           [{ type: 'yellow', player: 'Mauro Arambarri', minute: 25 }, { type: 'goal', player: 'Mayoral', minute: 44 }, { type: 'goal', player: 'Greenwood', minute: 62 }, { type: 'goal', player: 'Latasa', minute: 78 }],
  'Elche':            [{ type: 'goal', player: 'Pere Milla', minute: 18 }, { type: 'yellow', player: 'Bigas', minute: 39 }, { type: 'goal', player: 'Boyé', minute: 57 }, { type: 'goal', player: 'Mojica', minute: 75 }],
  'Alavés':           [{ type: 'yellow', player: 'Tenaglia', minute: 20 }, { type: 'goal', player: 'Samu Omorodion', minute: 41 }, { type: 'goal', player: 'Carlos Vicente', minute: 59 }, { type: 'goal', player: 'Rioja', minute: 76 }],
  'Espanyol':         [{ type: 'goal', player: 'Joselu', minute: 13 }, { type: 'yellow', player: 'Calero', minute: 33 }, { type: 'goal', player: 'Puado', minute: 52 }, { type: 'goal', player: 'Bare', minute: 71 }],
  'Mallorca':         [{ type: 'yellow', player: 'Antonio Raíllo', minute: 22 }, { type: 'goal', player: 'Muriqi', minute: 40 }, { type: 'goal', player: 'Larin', minute: 60 }, { type: 'goal', player: 'Darder', minute: 76 }],
  'Levante':          [{ type: 'goal', player: 'Iborra', minute: 16 }, { type: 'yellow', player: 'Postigo', minute: 36 }, { type: 'goal', player: 'Bouldini', minute: 55 }, { type: 'goal', player: 'Brugué', minute: 72 }],
  'B. Leverkusen':    [{ type: 'goal', player: 'Wirtz', minute: 12 }, { type: 'yellow', player: 'Tah', minute: 32 }, { type: 'goal', player: 'Boniface', minute: 50 }, { type: 'goal', player: 'Grimaldo', minute: 68 }],
  'Wolfsburg':        [{ type: 'yellow', player: 'Arnold', minute: 24 }, { type: 'goal', player: 'Wind', minute: 43 }, { type: 'goal', player: 'Wimmer', minute: 60 }, { type: 'goal', player: 'Majer', minute: 77 }],
  'Eintracht':        [{ type: 'goal', player: 'Ekitiké', minute: 17 }, { type: 'yellow', player: 'Koch', minute: 38 }, { type: 'goal', player: 'Marmoush', minute: 56 }, { type: 'goal', player: 'Knauff', minute: 73 }],
  'Augsburg':         [{ type: 'yellow', player: 'Gouweleeuw', minute: 23 }, { type: 'goal', player: 'Demirović', minute: 42 }, { type: 'goal', player: 'Tietz', minute: 60 }, { type: 'goal', player: 'Vargas', minute: 77 }],
  'Hamburger':        [{ type: 'goal', player: 'Glatzel', minute: 15 }, { type: 'yellow', player: 'Schonlau', minute: 35 }, { type: 'goal', player: 'Königsdörffer', minute: 54 }, { type: 'goal', player: 'Selke', minute: 71 }],
  'Benfica':          [{ type: 'goal', player: 'Di María', minute: 14 }, { type: 'yellow', player: 'Otamendi', minute: 35 }, { type: 'goal', player: 'Pavlidis', minute: 52 }, { type: 'goal', player: 'Schjelderup', minute: 70 }],
  'Ajax':             [{ type: 'yellow', player: 'Henderson', minute: 20 }, { type: 'goal', player: 'Brobbey', minute: 39 }, { type: 'goal', player: 'Berghuis', minute: 56 }, { type: 'goal', player: 'Tahirović', minute: 73 }],
  'Fenerbahçe':       [{ type: 'goal', player: 'Dzeko', minute: 12 }, { type: 'yellow', player: 'İrfan Can', minute: 32 }, { type: 'goal', player: 'Tadić', minute: 51 }, { type: 'goal', player: 'En-Nesyri', minute: 69 }],
  'Porto':            [{ type: 'yellow', player: 'Otávio', minute: 22 }, { type: 'goal', player: 'Galeno', minute: 41 }, { type: 'goal', player: 'Taremi', minute: 59 }, { type: 'goal', player: 'Pepê', minute: 76 }],
  'Panathinaikos':    [{ type: 'yellow', player: 'Maksimović', minute: 24 }, { type: 'goal', player: 'Ioannidis', minute: 43 }, { type: 'goal', player: 'Mancini', minute: 61 }, { type: 'goal', player: 'Bakasetas', minute: 78 }],
  'Dinamo':           [{ type: 'goal', player: 'Petković', minute: 16 }, { type: 'yellow', player: 'Šutalo', minute: 37 }, { type: 'goal', player: 'Baturina', minute: 55 }, { type: 'goal', player: 'Špikić', minute: 73 }],
  // América do Sul
  'Boca Juniors':     [{ type: 'goal', player: 'Cavani', minute: 11 }, { type: 'yellow', player: 'Fabra', minute: 31 }, { type: 'goal', player: 'Merentiel', minute: 49 }, { type: 'goal', player: 'Janson', minute: 68 }],
  'Argentinos Jrs':   [{ type: 'yellow', player: 'Hauche', minute: 25 }, { type: 'goal', player: 'Verón', minute: 44 }, { type: 'goal', player: 'Cabrera', minute: 62 }, { type: 'goal', player: 'Castro', minute: 79 }],
  'Racing':           [{ type: 'goal', player: 'Maravilla Martínez', minute: 13 }, { type: 'yellow', player: 'Sigali', minute: 33 }, { type: 'goal', player: 'Solari', minute: 52 }, { type: 'goal', player: 'Quintero', minute: 70 }],
  'River Plate':      [{ type: 'yellow', player: 'Pérez', minute: 21 }, { type: 'goal', player: 'Borja', minute: 40 }, { type: 'goal', player: 'Colidio', minute: 58 }, { type: 'goal', player: 'Lanzini', minute: 75 }],
  'San Lorenzo':      [{ type: 'goal', player: 'Cuello', minute: 17 }, { type: 'yellow', player: 'Romaña', minute: 38 }, { type: 'goal', player: 'Adam Bareiro', minute: 56 }, { type: 'goal', player: 'Ferro', minute: 74 }],
  'Córdoba':          [{ type: 'yellow', player: 'Galván', minute: 23 }, { type: 'goal', player: 'Garro', minute: 42 }, { type: 'goal', player: 'Bustos', minute: 60 }, { type: 'goal', player: 'Requena', minute: 77 }],
  // MLS
  'Inter Miami':      [{ type: 'goal', player: 'Messi', minute: 11 }, { type: 'yellow', player: 'Busquets', minute: 30 }, { type: 'goal', player: 'Suárez', minute: 49 }, { type: 'goal', player: 'Alba', minute: 68 }],
  'Whitecaps':        [{ type: 'yellow', player: 'Cubas', minute: 22 }, { type: 'goal', player: 'White', minute: 41 }, { type: 'goal', player: 'Gauld', minute: 59 }, { type: 'goal', player: 'Vite', minute: 76 }],
  'Cincinnati':       [{ type: 'goal', player: 'Boupendza', minute: 14 }, { type: 'yellow', player: 'Miazga', minute: 34 }, { type: 'goal', player: 'Acosta', minute: 52 }, { type: 'goal', player: 'Vázquez', minute: 70 }],
  'Chicago Fire':     [{ type: 'yellow', player: 'Souquet', minute: 25 }, { type: 'goal', player: 'Shaqiri', minute: 43 }, { type: 'goal', player: 'Cuypers', minute: 61 }, { type: 'goal', player: 'Haile-Selassie', minute: 78 }],
  'Nashville':        [{ type: 'goal', player: 'Mukhtar', minute: 13 }, { type: 'yellow', player: 'Zimmerman', minute: 33 }, { type: 'goal', player: 'Surridge', minute: 51 }, { type: 'goal', player: 'Bunbury', minute: 69 }],
  'New York City':    [{ type: 'yellow', player: 'Martins', minute: 20 }, { type: 'goal', player: 'Talles Magno', minute: 39 }, { type: 'goal', player: 'Wolf', minute: 57 }, { type: 'goal', player: 'Rodríguez', minute: 74 }],
}

// Generic player names used for unmapped teams
const FALLBACK_PLAYERS = ['Silva', 'Rodríguez', 'Martínez', 'García', 'López', 'Müller', 'Schmidt', 'Smith', 'Johnson']

function getTeamEvents(teamName: string, score: number): MatchEvent[] {
  const mapped = TEAM_EVENTS[teamName]
  const allEvents = mapped
    ? mapped.slice().sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
    : buildFallbackEvents(teamName, score)
  let goalsAdded = 0
  const result: MatchEvent[] = []
  for (const event of allEvents) {
    if (event.type === 'goal') {
      if (goalsAdded < score) {
        result.push(event)
        goalsAdded++
      }
    } else {
      result.push(event)
    }
  }
  return result
}

function buildFallbackEvents(teamName: string, score: number): MatchEvent[] {
  // deterministic seed from team name so the same team always gets the same names
  let seed = 0
  for (let i = 0; i < teamName.length; i++) seed = (seed * 31 + teamName.charCodeAt(i)) >>> 0
  const pick = (offset: number) => FALLBACK_PLAYERS[(seed + offset) % FALLBACK_PLAYERS.length]
  const events: MatchEvent[] = [{ type: 'yellow', player: pick(0), minute: 18 + (seed % 10) }]
  const goals = Math.max(score, 0)
  const baseMinute = 25
  for (let i = 0; i < goals; i++) {
    events.push({ type: 'goal', player: pick(i + 1), minute: baseMinute + i * 18 })
  }
  return events.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
}

function getBasketballTeamEvents(teamName: string, score: number): MatchEvent[] {
  if (score <= 0) return []

  const players = getBasketballTeamPlayers(teamName)
  const topPoints = Math.max(2, Math.round(score * 0.34))
  const secondPoints = Math.max(2, Math.round(score * 0.24))
  const thirdPoints = Math.max(1, Math.round(score * 0.18))

  const events: MatchEvent[] = [
    { type: 'goal', player: players[0], detail: `${topPoints} pts` },
    { type: 'goal', player: players[1], detail: `${secondPoints} pts` },
    { type: 'goal', player: players[2], detail: `${thirdPoints} pts` },
  ]

  return events.filter((event) => Boolean(event.player))
}

function getMatchEvents(teamName: string, score: number, isBasketball: boolean): MatchEvent[] {
  return isBasketball
    ? getBasketballTeamEvents(teamName, score)
    : getTeamEvents(teamName, score)
}

function getMatchEventLabel(event: MatchEvent): string {
  if (event.detail) return `${event.player} ${event.detail}`
  return `${event.player} ${event.minute ?? 0}'`
}

function LiveEventContent({
  onRequestClose,
  onRequestExpand,
  onRequestCollapse,
  onExpansionProgressChange,
  onExpansionGestureEnd,
  onCompactPullChange,
  onCompactPullEnd,
  onBlockNextClose,
  onSwipeStart,
  onSwipeMove,
  onSwipeEnd,
  isExpanded,
  expansionProgress,
  match,
  leagueName,
  sport,
  currentTime,
}: LiveEventContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>('transmissao')
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabId>('destaques')
  const [isResultMarketOpen, setIsResultMarketOpen] = useState(true)
  const [isShotsMarketOpen, setIsShotsMarketOpen] = useState(true)
  const [isAssistsMarketOpen, setIsAssistsMarketOpen] = useState(true)
  const [isTotalGoalsMarketOpen, setIsTotalGoalsMarketOpen] = useState(true)
  const [isCornersMarketOpen, setIsCornersMarketOpen] = useState(true)
  const [isCardsMarketOpen, setIsCardsMarketOpen] = useState(true)
  const [isDoubleChanceMarketOpen, setIsDoubleChanceMarketOpen] = useState(true)
  const [displayTime, setDisplayTime] = useState(currentTime)
  const [isStickyScoreHeaderVisible, setIsStickyScoreHeaderVisible] = useState(false)
  const getOddButtonProps = useOddSelection('live-event-page__market-odd')
  const scrollRef = useRef<HTMLDivElement>(null)
  const scoreBoxRef = useRef<HTMLDivElement>(null)
  const stickyScoreHeaderVisibleRef = useRef(false)
  const dragStartYRef = useRef<number | null>(null)
  const stickyCollapseGestureRef = useRef<{
    startY: number
    startProgress: number
    lastProgress: number
    isDragging: boolean
  } | null>(null)
  const expansionProgressRef = useRef(expansionProgress)
  const scrollAnimationFrameRef = useRef<number | null>(null)
  const lastScrollTopRef = useRef(0)
  const pendingScrollTopRef = useRef(0)
  const expansionGestureRef = useRef<{
    startX: number
    startY: number
    startProgress: number
    startedAtScrollTop: boolean
    isControlling: boolean
    pullDistance: number
    lastProgress: number
    startedAt: number
    horizontalLocked: boolean
    lastX: number
    lastT: number
    startedOnHorizontalScroller: boolean
    canCloseFromPull: boolean
  } | null>(null)
  const contentSport = match.sport ?? sport
  const isBasketball = contentSport === 'basquete'
  const isLiveMatch = match.isLive ?? true
  const scheduledDateTime = match.dateTime ?? match.time ?? currentTime
  const liveStreamImage = isBasketball ? streamingBasquete : streamingFutebol
  const eventBallIcon = isBasketball ? iconBasquete : iconFutebol
  const playerAvatarFallback = isBasketball ? playerAvatarBasquete : playerAvatarFutebol
  const earlyPayoutImage = isBasketball ? reiAntecipaBasquete : reiAntecipaFutebol
  const resultMarketTitle = isBasketball ? 'Vencedor - Pagamento Antecipado' : 'Resultado final - Pagamento Antecipado'
  const fieldTabLabel = isBasketball ? 'Quadra' : 'Campo'
  const fieldViewLabel = isBasketball ? 'Visão da Quadra' : 'Visão do Campo'
  const playerMarketTitle = isBasketball ? 'Pontos do Jogador' : 'Finalizações ao Gol'
  const playerPropsMarketId = isBasketball ? 'pontos-jogador' : 'finalizacao-gol'
  const assistsMarketId = 'assistencias'
  const primaryTotalMarketTitle = isBasketball ? 'Total de Pontos' : 'Total de Gols'
  const secondaryMarketTitle = isBasketball ? 'Handicap' : 'Total de Escanteios'
  const tertiaryMarketTitle = isBasketball ? '3° Quarto - Total de Pontos' : 'Total de Cartões'
  const finalMarketTitle = isBasketball ? '4° Quarto - Total de Pontos' : 'Dupla Chance'
  const eventId = getBetslipEventId({
    sport: contentSport,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
  })
  const buildEventPlayerPropCards = (marketId: string, fallbackRows: PlayerShotMarket[] = []): MatchPlayerProp[] => {
    const syncedCards = isLiveMatch
      ? getLivePlayerProps({
        ...match,
        id: match.id ?? 'live-event',
        time: match.time ?? scheduledDateTime,
      }, contentSport, marketId)
      : getMatchPlayerProps({
        id: match.id ?? 'live-event',
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
      }, contentSport, marketId)
    const fallbackCards: MatchPlayerProp[] = fallbackRows.map((row) => {
      const teamSide = row.team === match.awayTeam.name ? 'away' : 'home'

      return {
        id: `${match.id ?? 'live-event'}-${row.id}`,
        playerName: row.player,
        teamName: row.team,
        teamIcon: teamSide === 'away' ? match.awayTeam.icon : match.homeTeam.icon,
        teamSide,
        sport: contentSport,
        position: getPlayerPropCardPosition(row.player, isBasketball),
        image: row.image ?? playerAvatarFallback,
        options: row.outcomes.map((outcome, outcomeIndex) => ({
          label: outcome.label,
          odd: outcome.odd,
          active: outcomeIndex === Math.min(1, row.outcomes.length - 1),
        })),
      }
    })

    return (syncedCards.length > 0 ? syncedCards : fallbackCards).map((player) => ({
      ...player,
      eventId,
      marketId,
      eventStatus: isLiveMatch ? 'live' as const : 'prematch' as const,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      eventTimeLabel: isLiveMatch ? displayTime : scheduledDateTime,
      liveClock: isLiveMatch ? displayTime : undefined,
      homeScore: match.homeTeam.score,
      awayScore: match.awayTeam.score,
    }))
  }
  const playerPropCards = buildEventPlayerPropCards(playerPropsMarketId, getPlayerPropRows(match, isBasketball, true))
  const assistPlayerPropCards = buildEventPlayerPropCards(assistsMarketId)
  const primaryTotalRows = isBasketball ? getTotalPointsRows(match) : getTotalGoalsRows(match, false)
  const secondaryRows = isBasketball ? getHandicapRows(match) : getTotalCornersRows(match)
  const tertiaryRows = isBasketball ? getQuarterTotalRows(match.q3TotalOdds) : getTotalCardsRows()
  const finalRows = isBasketball ? getQuarterTotalRows(match.q4TotalOdds) : []
  const doubleChanceRows = isBasketball ? [] : getDoubleChanceRows(match)
  const resolvedHomeTeamIcon = useSportsDbTeamLogo(match.homeTeam.name, match.homeTeam.icon, contentSport, getLiveEventSportFallbackIcon(contentSport), {
    useCurrentLogoFallback: false,
  })
  const resolvedAwayTeamIcon = useSportsDbTeamLogo(match.awayTeam.name, match.awayTeam.icon, contentSport, getLiveEventSportFallbackIcon(contentSport), {
    useCurrentLogoFallback: false,
  })
  const homeTeamIcon = getLiveEventTeamIconView(resolvedHomeTeamIcon, contentSport)
  const awayTeamIcon = getLiveEventTeamIconView(resolvedAwayTeamIcon, contentSport)
  const homeLogoGlowColor = useLogoGlowColor(
    homeTeamIcon.src,
    match.homeTeam.name,
    homeTeamIcon.isFallback,
    LIVE_EVENT_HOME_FALLBACK_GLOW
  )
  const awayLogoGlowColor = useLogoGlowColor(
    awayTeamIcon.src,
    match.awayTeam.name,
    awayTeamIcon.isFallback,
    LIVE_EVENT_AWAY_FALLBACK_GLOW
  )
  const homeEvents = isLiveMatch ? getMatchEvents(match.homeTeam.name, match.homeTeam.score, isBasketball) : []
  const awayEvents = isLiveMatch ? getMatchEvents(match.awayTeam.name, match.awayTeam.score, isBasketball) : []
  const homePrimaryEvent = homeEvents[0]
  const awayPrimaryEvent = awayEvents[0]
  const homeExtraEventsCount = Math.max(0, homeEvents.length - 1)
  const awayExtraEventsCount = Math.max(0, awayEvents.length - 1)
  const resultMarketId = isBasketball ? 'vencedor' : 'resultado-final'
  const primaryTotalMarketId = isBasketball ? 'total-pontos' : 'total-gols'
  const secondaryMarketId = isBasketball ? 'handicap' : 'escanteios'
  const tertiaryMarketId = isBasketball ? 'q3-total' : 'total-cartoes'
  const finalMarketId = isBasketball ? 'q4-total' : 'dupla-chance'
  const getMarketTitle = (marketId: string) => {
    if (marketId === resultMarketId) return resultMarketTitle
    if (marketId === playerPropsMarketId) return playerMarketTitle
    if (marketId === assistsMarketId) return 'Assistências'
    if (marketId === primaryTotalMarketId) return primaryTotalMarketTitle
    if (marketId === secondaryMarketId) return secondaryMarketTitle
    if (marketId === tertiaryMarketId) return tertiaryMarketTitle
    if (marketId === finalMarketId) return finalMarketTitle

    return marketId
  }
  const renderMarketOddButton = (
    marketId: string,
    outcomeId: string,
    label: ReactNode,
    odd: ReactNode,
    className = 'live-event-page__market-odd',
    labelClassName?: string,
    labelAriaLabel?: string
  ) => {
    const groupId = getBetslipMarketGroupId({ eventId, marketId })

    return (
      <button
        key={`${groupId}:${outcomeId}`}
        {...getOddButtonProps(
          `${groupId}:${outcomeId}`,
          groupId,
          className,
          createBetslipSelection({
            eventId,
            marketId,
            outcomeId,
            label,
            odd,
            marketLabel: getMarketTitle(marketId),
            eventStatus: isLiveMatch ? 'live' : 'prematch',
            sport: contentSport,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            eventTimeLabel: isLiveMatch ? displayTime : scheduledDateTime,
            liveClock: isLiveMatch ? displayTime : undefined,
            homeScore: match.homeTeam.score,
            awayScore: match.awayTeam.score,
            badgeType: marketId === resultMarketId ? 'boost' : 'substitution',
          })
        )}
      >
        <span className={labelClassName} aria-label={labelAriaLabel}>{label}</span>
        <strong>{odd}</strong>
      </button>
    )
  }

  useEffect(() => {
    expansionProgressRef.current = expansionProgress
  }, [expansionProgress])

  const syncStickyScoreHeaderVisibility = useCallback((isVisible: boolean) => {
    if (stickyScoreHeaderVisibleRef.current === isVisible) return

    stickyScoreHeaderVisibleRef.current = isVisible
    setIsStickyScoreHeaderVisible(isVisible)
  }, [])

  const updateStickyScoreHeaderVisibility = useCallback(() => {
    const scrollElement = scrollRef.current
    const scoreElement = scoreBoxRef.current

    if (!scrollElement || !scoreElement) {
      syncStickyScoreHeaderVisibility(false)
      return
    }

    const scoreRect = scoreElement.getBoundingClientRect()
    const scrollRect = scrollElement.getBoundingClientRect()
    syncStickyScoreHeaderVisibility(scoreRect.bottom <= scrollRect.top + 1)
  }, [syncStickyScoreHeaderVisibility])

  const handleContentScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    pendingScrollTopRef.current = event.currentTarget.scrollTop

    if (scrollAnimationFrameRef.current !== null) return

    scrollAnimationFrameRef.current = window.requestAnimationFrame(() => {
      scrollAnimationFrameRef.current = null

      const scrollTop = pendingScrollTopRef.current

      lastScrollTopRef.current = scrollTop
      updateStickyScoreHeaderVisibility()
    })
  }, [updateStickyScoreHeaderVisibility])

  const handleContentWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    const verticalDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : 0
    if (verticalDelta === 0) return

    const scrollElement = event.currentTarget
    const currentProgress = expansionProgressRef.current
    const isAtScrollTop = scrollElement.scrollTop <= LIVE_EVENT_PULL_TOP_THRESHOLD
    const shouldExpand = verticalDelta > 0 && currentProgress < 1
    const shouldCollapse = verticalDelta < 0 && (currentProgress < 1 || isAtScrollTop)

    if (!shouldExpand && !shouldCollapse) return

    event.preventDefault()
    event.stopPropagation()

    onCompactPullChange(0)

    const nextProgress = clampLiveEventExpansionProgress(
      currentProgress + verticalDelta / LIVE_EVENT_EXPANSION_WHEEL_DISTANCE
    )

    expansionProgressRef.current = nextProgress
    onExpansionProgressChange(nextProgress, { deferSettle: true })
  }, [onCompactPullChange, onExpansionProgressChange])

  useEffect(() => {
    const syncTimer = window.setTimeout(() => setDisplayTime(currentTime), 0)
    if (!isLiveMatch) return () => window.clearTimeout(syncTimer)
    const parsed = parseLiveTime(currentTime)
    if (!parsed) return () => window.clearTimeout(syncTimer)
    let totalSeconds = parsed.totalSeconds
    const interval = setInterval(() => {
      totalSeconds = parsed.isQuarter ? totalSeconds - 1 : totalSeconds + 1
      setDisplayTime(formatLiveTime(parsed.prefix, totalSeconds))
    }, 1000)
    return () => {
      window.clearTimeout(syncTimer)
      clearInterval(interval)
    }
  }, [currentTime, isLiveMatch])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsResultMarketOpen(true)
      setIsShotsMarketOpen(true)
      setIsTotalGoalsMarketOpen(true)
      setIsCornersMarketOpen(true)
      setIsCardsMarketOpen(true)
      setIsDoubleChanceMarketOpen(true)
      syncStickyScoreHeaderVisibility(false)
      scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [match, syncStickyScoreHeaderVisibility])

  useEffect(() => () => {
    if (scrollAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollAnimationFrameRef.current)
      scrollAnimationFrameRef.current = null
    }
  }, [])

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(updateStickyScoreHeaderVisibility)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [isExpanded, updateStickyScoreHeaderVisibility])

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(updateStickyScoreHeaderVisibility)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [match, updateStickyScoreHeaderVisibility])

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement || !isMobileTouchScreen()) return

    const handleTouchStart = (event: globalThis.TouchEvent) => {
      if (event.touches.length !== 1) {
        expansionGestureRef.current = null
        return
      }

      const touch = event.touches[0]
      if (!touch) return

      const currentProgress = expansionProgressRef.current
      if (currentProgress > 0) onBlockNextClose()

      const target = event.target as Element | null
      const startedOnHorizontalScroller = !!target?.closest('.live-event-page__player-odds-row')
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()

      expansionGestureRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startProgress: currentProgress,
        startedAtScrollTop: scrollElement.scrollTop <= LIVE_EVENT_PULL_TOP_THRESHOLD,
        isControlling: false,
        pullDistance: 0,
        lastProgress: currentProgress,
        startedAt: now,
        horizontalLocked: false,
        lastX: touch.clientX,
        lastT: now,
        startedOnHorizontalScroller,
        canCloseFromPull: currentProgress <= 0 && !isExpanded,
      }
    }

    const handleTouchMove = (event: globalThis.TouchEvent) => {
      const gesture = expansionGestureRef.current
      const touch = event.touches[0]
      if (!gesture || !touch) return

      const dx = touch.clientX - gesture.startX
      const dy = touch.clientY - gesture.startY
      const currentProgress = expansionProgressRef.current
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()

      if (gesture.startProgress > 0) onBlockNextClose()

      gesture.lastX = touch.clientX
      gesture.lastT = now

      if (gesture.horizontalLocked) {
        if (event.cancelable) event.preventDefault()
        event.stopPropagation()
        onSwipeMove(dx)
        return
      }

      const hasVerticalIntent = Math.abs(dy) >= LIVE_EVENT_PULL_START_THRESHOLD && Math.abs(dy) > Math.abs(dx)
      const hasHorizontalIntent = currentProgress < 1
        && Math.abs(dx) >= LIVE_EVENT_SWIPE_INTENT_THRESHOLD
        && Math.abs(dx) > Math.abs(dy)

      if (!gesture.isControlling) {
        if (hasHorizontalIntent && !gesture.startedOnHorizontalScroller) {
          gesture.horizontalLocked = true
          if (event.cancelable) event.preventDefault()
          event.stopPropagation()
          onSwipeStart()
          onSwipeMove(dx)
          return
        }

        const wantsExpand = dy <= -LIVE_EVENT_PULL_START_THRESHOLD && currentProgress < 1
        const wantsCollapse = dy >= LIVE_EVENT_PULL_START_THRESHOLD
          && (
            currentProgress < 1
            || (currentProgress >= 1 && gesture.startedAtScrollTop)
          )

        if (!hasVerticalIntent || (!wantsExpand && !wantsCollapse)) return

        gesture.isControlling = true
      }

      if (event.cancelable) event.preventDefault()
      event.stopPropagation()

      const nextProgress = clampLiveEventExpansionProgress(
        gesture.startProgress - dy / LIVE_EVENT_EXPANSION_TOUCH_DISTANCE
      )
      const distanceToCompact = gesture.startProgress * LIVE_EVENT_EXPANSION_TOUCH_DISTANCE
      const compactPullDistance = dy > distanceToCompact
        ? getCompactPullDistance(dy - distanceToCompact)
        : 0

      gesture.lastProgress = nextProgress
      gesture.pullDistance = nextProgress <= 0 ? compactPullDistance : 0
      expansionProgressRef.current = nextProgress

      onExpansionProgressChange(nextProgress)
      onCompactPullChange(gesture.pullDistance)
    }

    const finishGesture = () => {
      const gesture = expansionGestureRef.current
      expansionGestureRef.current = null
      if (!gesture) return

      if (gesture.horizontalLocked) {
        const dx = gesture.lastX - gesture.startX
        const dt = Math.max(1, gesture.lastT - gesture.startedAt)
        onSwipeEnd(dx, dx / dt)
        return
      }

      if (!gesture.isControlling) return

      if (gesture.pullDistance > 0) {
        const didPullPastCloseThreshold = gesture.pullDistance >= LIVE_EVENT_CLOSE_PULL_THRESHOLD

        if (gesture.canCloseFromPull || didPullPastCloseThreshold) {
          onCompactPullEnd(gesture.pullDistance)
          if (didPullPastCloseThreshold) return
        } else {
          onCompactPullChange(0)
        }
      } else {
        onCompactPullChange(0)
      }

      onExpansionGestureEnd(gesture.lastProgress)
    }

    scrollElement.addEventListener('touchstart', handleTouchStart, { passive: true })
    scrollElement.addEventListener('touchmove', handleTouchMove, { passive: false })
    scrollElement.addEventListener('touchend', finishGesture)
    scrollElement.addEventListener('touchcancel', finishGesture)

    return () => {
      scrollElement.removeEventListener('touchstart', handleTouchStart)
      scrollElement.removeEventListener('touchmove', handleTouchMove)
      scrollElement.removeEventListener('touchend', finishGesture)
      scrollElement.removeEventListener('touchcancel', finishGesture)
    }
  }, [isExpanded, onBlockNextClose, onCompactPullChange, onCompactPullEnd, onExpansionGestureEnd, onExpansionProgressChange, onSwipeStart, onSwipeMove, onSwipeEnd])

  const handleCloseHandlePointerDown = (event: PointerEvent<HTMLSpanElement>) => {
    if (expansionProgressRef.current > 0) onBlockNextClose()
    dragStartYRef.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleCloseHandlePointerUp = (event: PointerEvent<HTMLSpanElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const dragStartY = dragStartYRef.current
    dragStartYRef.current = null
    const dragDistance = dragStartY === null ? 0 : event.clientY - dragStartY

    if (Math.abs(dragDistance) <= 8) {
      if (isExpanded || expansionProgressRef.current > 0) {
        onRequestClose()
      } else {
        onRequestClose({ force: true })
      }
      return
    }

    if (dragDistance >= 32) {
      if (isExpanded) {
        onRequestCollapse()
      } else {
        onRequestClose({ force: true })
      }
    } else if (dragDistance <= -32 && !isExpanded) {
      onRequestExpand()
    }
  }

  const handleCloseHandlePointerCancel = () => {
    dragStartYRef.current = null
  }

  const handleStickyCollapsePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isExpanded) return

    onBlockNextClose()
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    stickyCollapseGestureRef.current = {
      startY: event.clientY,
      startProgress: expansionProgressRef.current,
      lastProgress: expansionProgressRef.current,
      isDragging: false,
    }
  }

  const handleStickyCollapsePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = stickyCollapseGestureRef.current
    if (!gesture) return

    event.preventDefault()
    event.stopPropagation()
    onBlockNextClose()

    const dy = Math.max(0, event.clientY - gesture.startY)
    if (dy < LIVE_EVENT_PULL_START_THRESHOLD && !gesture.isDragging) return

    gesture.isDragging = true
    const nextProgress = clampLiveEventExpansionProgress(
      gesture.startProgress - dy / LIVE_EVENT_EXPANSION_TOUCH_DISTANCE
    )

    gesture.lastProgress = nextProgress
    expansionProgressRef.current = nextProgress
    onExpansionProgressChange(nextProgress)
  }

  const handleStickyCollapsePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = stickyCollapseGestureRef.current
    stickyCollapseGestureRef.current = null

    if (!gesture) return

    event.preventDefault()
    event.stopPropagation()

    if (!gesture.isDragging) {
      onRequestCollapse()
      return
    }

    onExpansionGestureEnd(gesture.lastProgress)
  }

  const handleStickyCollapsePointerCancel = () => {
    const gesture = stickyCollapseGestureRef.current
    stickyCollapseGestureRef.current = null

    if (!gesture?.isDragging) return
    onExpansionGestureEnd(gesture.lastProgress)
  }

  const handleTopAreaClick = () => {
    if (isExpanded || expansionProgressRef.current > 0) {
      onRequestClose()
      return
    }

    onRequestClose({ force: true })
  }

  return (
    <div
      className={`live-event-page__content${isLiveMatch ? '' : ' live-event-page__content--prematch'}`}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={[
          'live-event-page__sticky-score-header',
          isLiveMatch ? '' : 'live-event-page__sticky-score-header--prematch',
          isStickyScoreHeaderVisible ? 'live-event-page__sticky-score-header--visible' : '',
        ].filter(Boolean).join(' ')}
        aria-hidden={!isStickyScoreHeaderVisible}
        onPointerDown={handleStickyCollapsePointerDown}
        onPointerMove={handleStickyCollapsePointerMove}
        onPointerUp={handleStickyCollapsePointerUp}
        onPointerCancel={handleStickyCollapsePointerCancel}
      >
        <span className="live-event-page__sticky-collapse-handle" aria-hidden="true">
          <span />
        </span>
        <div className="live-event-page__sticky-score-inner">
          <div className="live-event-page__sticky-score-team">
            {homeTeamIcon.src && (
              <img
                src={homeTeamIcon.src}
                alt=""
                className={[
                  'live-event-page__sticky-score-logo',
                  homeTeamIcon.isFallback ? 'live-event-page__sticky-score-logo--sport-fallback live-event-page__sticky-score-logo--sport-home' : '',
                ].filter(Boolean).join(' ')}
              />
            )}
          </div>
          <div
            className={`live-event-page__sticky-score-board${isLiveMatch ? '' : ' live-event-page__sticky-score-board--prematch'}`}
            aria-label={isLiveMatch
              ? `Placar: ${match.homeTeam.score} a ${match.awayTeam.score}, ${displayTime}`
              : `${match.homeTeam.name} contra ${match.awayTeam.name}, ${scheduledDateTime}`}
          >
            {isLiveMatch ? (
              <div className="live-event-page__sticky-score-row">
                <span className="live-event-page__sticky-score-value">{match.homeTeam.score}</span>
                <span className="live-event-page__sticky-score-separator">:</span>
                <span className="live-event-page__sticky-score-value">{match.awayTeam.score}</span>
              </div>
            ) : (
              <span className="live-event-page__sticky-matchup-separator">x</span>
            )}
            <span className="live-event-page__sticky-score-time">
              {isLiveMatch ? displayTime : scheduledDateTime}
            </span>
          </div>
          <div className="live-event-page__sticky-score-team">
            {awayTeamIcon.src && (
              <img
                src={awayTeamIcon.src}
                alt=""
                className={[
                  'live-event-page__sticky-score-logo',
                  awayTeamIcon.isFallback ? 'live-event-page__sticky-score-logo--sport-fallback live-event-page__sticky-score-logo--sport-away' : '',
                ].filter(Boolean).join(' ')}
              />
            )}
          </div>
        </div>
      </div>
      {/* Scrollable content */}
      <div
        className="live-event-page__scroll"
        ref={scrollRef}
        onScroll={handleContentScroll}
        onWheel={handleContentWheel}
      >
        <div className="live-event-page__scroll-body">
        <button
          type="button"
          className="live-event-page__top-close-area"
          aria-label="Fechar evento"
          onClick={handleTopAreaClick}
        >
          <span
            className="live-event-page__drag-handle"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={handleCloseHandlePointerDown}
            onPointerUp={handleCloseHandlePointerUp}
            onPointerCancel={handleCloseHandlePointerCancel}
          >
            <span />
          </span>
        </button>

        {/* ── Match card ── */}
        <div className={`live-event-page__match-card${isLiveMatch ? '' : ' live-event-page__match-card--prematch'}`}>

          {/* League name */}
          <span className="live-event-page__league-name">{leagueName}</span>

          {isLiveMatch ? (
            <div className="live-event-page__live-row">
              <div className="live-event-page__tag-aovivo">
                <div className="live-event-page__tag-icon-wrapper">
                  <img src={iconAoVivo} alt="" className="live-event-page__tag-icon" />
                </div>
                <span>Ao Vivo</span>
              </div>
              <span className="live-event-page__match-time">{displayTime}</span>
            </div>
          ) : (
            <div className="live-event-page__prematch-date-row">
              <span className="live-event-page__prematch-date">{scheduledDateTime}</span>
            </div>
          )}

          {/* Confronto — logos + placar */}
          <div
            className={`live-event-page__confronto${isLiveMatch ? '' : ' live-event-page__confronto--prematch'}`}
            ref={scoreBoxRef}
          >

            {/* Home */}
            <div className="live-event-page__team-block live-event-page__team-block--home">
              <div className="live-event-page__team-info">
                <div className="live-event-page__logo-container">
                  {homeTeamIcon.src ? (
                    <>
                      <span
                        className="live-event-page__logo-glow"
                        style={getLogoGlowStyle(homeLogoGlowColor)}
                        aria-hidden="true"
                      />
                      <img
                        src={homeTeamIcon.src}
                        alt={match.homeTeam.name}
                        className={[
                          'live-event-page__logo',
                          homeTeamIcon.isFallback ? 'live-event-page__logo--sport-fallback live-event-page__logo--sport-home' : '',
                        ].filter(Boolean).join(' ')}
                      />
                    </>
                  ) : (
                    <div className="live-event-page__logo-placeholder" />
                  )}
                </div>
                <span className="live-event-page__team-name">{match.homeTeam.name}</span>
              </div>
              {isLiveMatch && <div className="live-event-page__score">{match.homeTeam.score}</div>}
            </div>

            {isLiveMatch ? (
              <div className="live-event-page__score-separator">:</div>
            ) : (
              <div className="live-event-page__matchup-separator">x</div>
            )}

            {/* Away */}
            <div className="live-event-page__team-block live-event-page__team-block--away">
              {isLiveMatch && <div className="live-event-page__score">{match.awayTeam.score}</div>}
              <div className="live-event-page__team-info">
                <div className="live-event-page__logo-container">
                  {awayTeamIcon.src ? (
                    <>
                      <span
                        className="live-event-page__logo-glow"
                        style={getLogoGlowStyle(awayLogoGlowColor)}
                        aria-hidden="true"
                      />
                      <img
                        src={awayTeamIcon.src}
                        alt={match.awayTeam.name}
                        className={[
                          'live-event-page__logo',
                          awayTeamIcon.isFallback ? 'live-event-page__logo--sport-fallback live-event-page__logo--sport-away' : '',
                        ].filter(Boolean).join(' ')}
                      />
                    </>
                  ) : (
                    <div className="live-event-page__logo-placeholder" />
                  )}
                </div>
                <span className="live-event-page__team-name">{match.awayTeam.name}</span>
              </div>
            </div>
          </div>

          {isLiveMatch && (
            <>
              {/* Eventos da partida */}
              <div className="live-event-page__events">
                <div className="live-event-page__events-side-frame">
                  <div className="live-event-page__events-side live-event-page__events-side--home">
                    {homePrimaryEvent && (
                      <div className="live-event-page__event">
                        {homePrimaryEvent.type === 'goal' ? (
                          <img src={eventBallIcon} alt="" className="live-event-page__event-ball" />
                        ) : (
                          <div className={`live-event-page__event-icon live-event-page__event-icon--${homePrimaryEvent.type}`} />
                        )}
                        <span className="live-event-page__event-text">
                          {getMatchEventLabel(homePrimaryEvent)}
                        </span>
                      </div>
                    )}
                    {homeExtraEventsCount > 0 && (
                      <span className="live-event-page__event-more">[+{homeExtraEventsCount}]</span>
                    )}
                  </div>
                </div>
                <div className="live-event-page__events-side-frame live-event-page__events-side-frame--away">
                  <div className="live-event-page__events-side live-event-page__events-side--away">
                    {awayPrimaryEvent && (
                      <div className="live-event-page__event">
                        <span className="live-event-page__event-text">
                          {getMatchEventLabel(awayPrimaryEvent)}
                        </span>
                        {awayPrimaryEvent.type === 'goal' ? (
                          <img src={eventBallIcon} alt="" className="live-event-page__event-ball" />
                        ) : (
                          <div className={`live-event-page__event-icon live-event-page__event-icon--${awayPrimaryEvent.type}`} />
                        )}
                      </div>
                    )}
                    {awayExtraEventsCount > 0 && (
                      <span className="live-event-page__event-more">[+{awayExtraEventsCount}]</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats link */}
              <button className="live-event-page__stats-btn">
                <span>Ver mais estatísticas</span>
              </button>
            </>
          )}
        </div>

        {/* ── Tabs ── */}
        {isLiveMatch && (
          <>
            <div className="live-event-page__tabs">
              <button
                className={`live-event-page__tab${activeTab === 'transmissao' ? ' live-event-page__tab--active' : ''}`}
                onClick={() => setActiveTab('transmissao')}
              >
                <MonitorPlayIcon aria-hidden="true" className="live-event-page__tab-icon" weight="bold" />
                <span>Transmissão</span>
              </button>
              <button
                className={`live-event-page__tab${activeTab === 'campo' ? ' live-event-page__tab--active' : ''}`}
                onClick={() => setActiveTab('campo')}
              >
                {isBasketball ? (
                  <CourtBasketballIcon aria-hidden="true" className="live-event-page__tab-field-icon" weight="bold" />
                ) : (
                  <SoccerBallIcon aria-hidden="true" className="live-event-page__tab-field-icon" weight="bold" />
                )}
                <span>{fieldTabLabel}</span>
              </button>
            </div>

            {/* ── Streaming / Campo ── */}
            {activeTab === 'transmissao' ? (
              <div className="live-event-page__streaming">
                {/* TODO: substituir por player real */}
                <img src={liveStreamImage} alt="Transmissão ao vivo" className="live-event-page__stream-img" />
                <div className="live-event-page__live-badge">LIVE</div>
                <button className="live-event-page__stream-btn live-event-page__stream-btn--top-right" aria-label="Fechar">
                  <CloseStreamIcon />
                </button>
                <div className="live-event-page__stream-controls">
                  <button className="live-event-page__stream-btn" aria-label="Pausar">
                    <PauseIcon />
                  </button>
                  <button className="live-event-page__stream-btn" aria-label="Mudo">
                    <MuteIcon />
                  </button>
                </div>
                <button className="live-event-page__stream-btn live-event-page__stream-btn--fullscreen" aria-label="Tela cheia">
                  <FullscreenIcon />
                </button>
              </div>
            ) : (
              <div className="live-event-page__campo">
                {/* TODO: adicionar visão do campo */}
                <span className="live-event-page__campo-label">{fieldViewLabel}</span>
                <span className="live-event-page__campo-sub">Em breve</span>
              </div>
            )}
          </>
        )}

        <div className="live-event-page__detail-tabs" aria-label="Navegação do evento">
          {detailTabs.map((tab) => (
            <button
              key={tab.id}
              className={`live-event-page__detail-tab${activeDetailTab === tab.id ? ' live-event-page__detail-tab--active' : ''}`}
              onClick={() => setActiveDetailTab(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Market card (Resultado Final) ── */}
        <div className={`live-event-page__market-card${isResultMarketOpen ? '' : ' live-event-page__market-card--closed'}`}>
          <div className="live-event-page__market-header">
            <span className="live-event-page__market-title">{resultMarketTitle}</span>
            <div className="live-event-page__market-actions">
              <div className="live-event-page__market-ca-box">
                <span className="live-event-page__market-ca">CA</span>
              </div>
              <button
                type="button"
                className="live-event-page__market-toggle"
                aria-label={isResultMarketOpen ? 'Recolher mercado' : 'Expandir mercado'}
                aria-expanded={isResultMarketOpen}
                onClick={() => setIsResultMarketOpen((current) => !current)}
              >
                <CaretRightIcon
                  aria-hidden="true"
                  className={`live-event-page__market-chevron${isResultMarketOpen ? '' : ' live-event-page__market-chevron--closed'}`}
                  weight="bold"
                />
              </button>
            </div>
          </div>

          <div className="live-event-page__market-tags">
            <div className="live-event-page__market-tag">
              <span>Pag. Antecipado</span>
              <span className="live-event-page__market-tag-badge">
                <img src={earlyPayoutImage} alt="" className="live-event-page__market-tag-img" />
              </span>
            </div>
            <div className="live-event-page__market-tag">
              <span>Múltipla Turbinada</span>
              <span className="live-event-page__market-tag-badge">
                <img src={multiplaTurbinada} alt="" className="live-event-page__market-tag-img" />
              </span>
            </div>
          </div>

          <div className={`live-event-page__market-collapse${isResultMarketOpen ? ' live-event-page__market-collapse--open' : ''}`}>
            <div className="live-event-page__market-collapse-inner">
              <div className="live-event-page__market-odds">
                {renderMarketOddButton(resultMarketId, 'home', match.homeTeam.name, match.odds.home)}
                {match.odds.draw && (
                  renderMarketOddButton(resultMarketId, 'draw', 'Empate', match.odds.draw)
                )}
                {renderMarketOddButton(resultMarketId, 'away', match.awayTeam.name, match.odds.away)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Market card (Finalizações ao Gol) ── */}
        <div className={`live-event-page__market-card live-event-page__market-card--player-props${isShotsMarketOpen ? '' : ' live-event-page__market-card--closed'}`}>
          <div className="live-event-page__market-header">
            <span className="live-event-page__market-title">{playerMarketTitle}</span>
            <div className="live-event-page__market-actions">
              <div className="live-event-page__market-ca-box">
                <span className="live-event-page__market-ca">CA</span>
              </div>
              <button
                type="button"
                className="live-event-page__market-toggle"
                aria-label={isShotsMarketOpen ? 'Recolher mercado' : 'Expandir mercado'}
                aria-expanded={isShotsMarketOpen}
                onClick={() => setIsShotsMarketOpen((current) => !current)}
              >
                <CaretRightIcon
                  aria-hidden="true"
                  className={`live-event-page__market-chevron${isShotsMarketOpen ? '' : ' live-event-page__market-chevron--closed'}`}
                  weight="bold"
                />
              </button>
            </div>
          </div>

          <div className="live-event-page__market-tags">
            <div className="live-event-page__market-tag">
              <span>Substituição Garantida</span>
              <span className="live-event-page__market-tag-badge">
                <img src={substituicaoGarantida} alt="" className="live-event-page__market-tag-img" />
              </span>
            </div>
            <div className="live-event-page__market-tag">
              <span>Múltipla Turbinada</span>
              <span className="live-event-page__market-tag-badge">
                <img src={multiplaTurbinada} alt="" className="live-event-page__market-tag-img" />
              </span>
            </div>
          </div>

          <div className={`live-event-page__market-collapse${isShotsMarketOpen ? ' live-event-page__market-collapse--open' : ''}`}>
            <div className="live-event-page__market-collapse-inner">
              <div
                className="prematch-section__player-props live-event-page__player-props-slider"
                aria-label={`Cards de ${playerMarketTitle}`}
              >
                {playerPropCards.map((player) => (
                  <PreMatchPlayerPropCard key={player.id} player={player} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {assistPlayerPropCards.length > 0 && (
          <div className={`live-event-page__market-card live-event-page__market-card--player-props${isAssistsMarketOpen ? '' : ' live-event-page__market-card--closed'}`}>
            <div className="live-event-page__market-header">
              <span className="live-event-page__market-title">Assistências</span>
              <div className="live-event-page__market-actions">
                <div className="live-event-page__market-ca-box">
                  <span className="live-event-page__market-ca">CA</span>
                </div>
                <button
                  type="button"
                  className="live-event-page__market-toggle"
                  aria-label={isAssistsMarketOpen ? 'Recolher mercado' : 'Expandir mercado'}
                  aria-expanded={isAssistsMarketOpen}
                  onClick={() => setIsAssistsMarketOpen((current) => !current)}
                >
                  <CaretRightIcon
                    aria-hidden="true"
                    className={`live-event-page__market-chevron${isAssistsMarketOpen ? '' : ' live-event-page__market-chevron--closed'}`}
                    weight="bold"
                  />
                </button>
              </div>
            </div>

            <div className="live-event-page__market-tags">
              <div className="live-event-page__market-tag">
                <span>Substituição Garantida</span>
                <span className="live-event-page__market-tag-badge">
                  <img src={substituicaoGarantida} alt="" className="live-event-page__market-tag-img" />
                </span>
              </div>
              <div className="live-event-page__market-tag">
                <span>Múltipla Turbinada</span>
                <span className="live-event-page__market-tag-badge">
                  <img src={multiplaTurbinada} alt="" className="live-event-page__market-tag-img" />
                </span>
              </div>
            </div>

            <div className={`live-event-page__market-collapse${isAssistsMarketOpen ? ' live-event-page__market-collapse--open' : ''}`}>
              <div className="live-event-page__market-collapse-inner">
                <div
                  className="prematch-section__player-props live-event-page__player-props-slider"
                  aria-label="Cards de Assistências"
                >
                  {assistPlayerPropCards.map((player) => (
                    <PreMatchPlayerPropCard key={player.id} player={player} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Market card (Total de Gols) ── */}
        <div className={`live-event-page__market-card${isTotalGoalsMarketOpen ? '' : ' live-event-page__market-card--closed'}`}>
          <div className="live-event-page__market-header">
            <span className="live-event-page__market-title">{primaryTotalMarketTitle}</span>
            <div className="live-event-page__market-actions">
              <div className="live-event-page__market-ca-box">
                <span className="live-event-page__market-ca">CA</span>
              </div>
              <button
                type="button"
                className="live-event-page__market-toggle"
                aria-label={isTotalGoalsMarketOpen ? 'Recolher mercado' : 'Expandir mercado'}
                aria-expanded={isTotalGoalsMarketOpen}
                onClick={() => setIsTotalGoalsMarketOpen((current) => !current)}
              >
                <CaretRightIcon
                  aria-hidden="true"
                  className={`live-event-page__market-chevron${isTotalGoalsMarketOpen ? '' : ' live-event-page__market-chevron--closed'}`}
                  weight="bold"
                />
              </button>
            </div>
          </div>

          <div className="live-event-page__market-tags">
            <div className="live-event-page__market-tag">
              <span>Múltipla Turbinada</span>
              <span className="live-event-page__market-tag-badge">
                <img src={multiplaTurbinada} alt="" className="live-event-page__market-tag-img" />
              </span>
            </div>
          </div>

          <div className={`live-event-page__market-collapse${isTotalGoalsMarketOpen ? ' live-event-page__market-collapse--open' : ''}`}>
            <div className="live-event-page__market-collapse-inner">
              <div className="live-event-page__total-goals-list">
                {primaryTotalRows.map((row) => {
                  const isCurrentRow = isLineMarketCurrentRow(row, isBasketball ? match.totalPointsOdds?.line : match.totalGoalsOdds?.line)
                  const underOutcomeId = getLiveEventLineOutcomeId(row, isCurrentRow, isBasketball ? 'under-points' : 'under')
                  const overOutcomeId = getLiveEventLineOutcomeId(row, isCurrentRow, isBasketball ? 'over-points' : 'over')

                  return (
                    <div key={row.id} className="live-event-page__total-goals-row">
                      {renderMarketOddButton(primaryTotalMarketId, underOutcomeId, row.under.label, row.under.odd)}
                      {renderMarketOddButton(primaryTotalMarketId, overOutcomeId, row.over.label, row.over.odd)}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Market card (Total de Escanteios) ── */}
        <div className={`live-event-page__market-card${isCornersMarketOpen ? '' : ' live-event-page__market-card--closed'}`}>
          <div className="live-event-page__market-header">
            <span className="live-event-page__market-title">{secondaryMarketTitle}</span>
            <div className="live-event-page__market-actions">
              <div className="live-event-page__market-ca-box">
                <span className="live-event-page__market-ca">CA</span>
              </div>
              <button
                type="button"
                className="live-event-page__market-toggle"
                aria-label={isCornersMarketOpen ? 'Recolher mercado' : 'Expandir mercado'}
                aria-expanded={isCornersMarketOpen}
                onClick={() => setIsCornersMarketOpen((current) => !current)}
              >
                <CaretRightIcon
                  aria-hidden="true"
                  className={`live-event-page__market-chevron${isCornersMarketOpen ? '' : ' live-event-page__market-chevron--closed'}`}
                  weight="bold"
                />
              </button>
            </div>
          </div>

          <div className="live-event-page__market-tags">
            <div className="live-event-page__market-tag">
              <span>Múltipla Turbinada</span>
              <span className="live-event-page__market-tag-badge">
                <img src={multiplaTurbinada} alt="" className="live-event-page__market-tag-img" />
              </span>
            </div>
          </div>

          <div className={`live-event-page__market-collapse${isCornersMarketOpen ? ' live-event-page__market-collapse--open' : ''}`}>
            <div className="live-event-page__market-collapse-inner">
              <div className="live-event-page__total-goals-list">
                {secondaryRows.map((row) => {
                  const isCurrentRow = isBasketball
                    ? isHandicapCurrentRow(row, match.handicapOdds?.line)
                    : isLineMarketCurrentRow(row, match.totalCornersOdds?.line)
                  const underOutcomeId = getLiveEventLineOutcomeId(row, isCurrentRow, isBasketball ? 'home-handicap' : 'under-corners')
                  const overOutcomeId = getLiveEventLineOutcomeId(row, isCurrentRow, isBasketball ? 'away-handicap' : 'over-corners')

                  return (
                    <div key={row.id} className="live-event-page__total-goals-row">
                      {renderMarketOddButton(secondaryMarketId, underOutcomeId, row.under.label, row.under.odd)}
                      {renderMarketOddButton(secondaryMarketId, overOutcomeId, row.over.label, row.over.odd)}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Market card (Total de Cartões) ── */}
        <div className={`live-event-page__market-card${isCardsMarketOpen ? '' : ' live-event-page__market-card--closed'}`}>
          <div className="live-event-page__market-header">
            <span className="live-event-page__market-title">{tertiaryMarketTitle}</span>
            <div className="live-event-page__market-actions">
              <div className="live-event-page__market-ca-box">
                <span className="live-event-page__market-ca">CA</span>
              </div>
              <button
                type="button"
                className="live-event-page__market-toggle"
                aria-label={isCardsMarketOpen ? 'Recolher mercado' : 'Expandir mercado'}
                aria-expanded={isCardsMarketOpen}
                onClick={() => setIsCardsMarketOpen((current) => !current)}
              >
                <CaretRightIcon
                  aria-hidden="true"
                  className={`live-event-page__market-chevron${isCardsMarketOpen ? '' : ' live-event-page__market-chevron--closed'}`}
                  weight="bold"
                />
              </button>
            </div>
          </div>

          <div className="live-event-page__market-tags">
            <div className="live-event-page__market-tag">
              <span>Múltipla Turbinada</span>
              <span className="live-event-page__market-tag-badge">
                <img src={multiplaTurbinada} alt="" className="live-event-page__market-tag-img" />
              </span>
            </div>
          </div>

          <div className={`live-event-page__market-collapse${isCardsMarketOpen ? ' live-event-page__market-collapse--open' : ''}`}>
            <div className="live-event-page__market-collapse-inner">
              <div className="live-event-page__total-goals-list">
                {tertiaryRows.map((row) => {
                  const isCurrentRow = isBasketball && isLineMarketCurrentRow(row, match.q3TotalOdds?.line)
                  const underOutcomeId = getLiveEventLineOutcomeId(row, isCurrentRow, isBasketball ? 'under-q3' : 'under')
                  const overOutcomeId = getLiveEventLineOutcomeId(row, isCurrentRow, isBasketball ? 'over-q3' : 'over')

                  return (
                    <div key={row.id} className="live-event-page__total-goals-row">
                      {renderMarketOddButton(tertiaryMarketId, underOutcomeId, row.under.label, row.under.odd)}
                      {renderMarketOddButton(tertiaryMarketId, overOutcomeId, row.over.label, row.over.odd)}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Market card (Dupla Chance) ── */}
        <div className={`live-event-page__market-card live-event-page__market-card--double-chance${isDoubleChanceMarketOpen ? '' : ' live-event-page__market-card--closed'}`}>
          <div className="live-event-page__market-header">
            <span className="live-event-page__market-title">{finalMarketTitle}</span>
            <div className="live-event-page__market-actions">
              <div className="live-event-page__market-ca-box">
                <span className="live-event-page__market-ca">CA</span>
              </div>
              <button
                type="button"
                className="live-event-page__market-toggle"
                aria-label={isDoubleChanceMarketOpen ? 'Recolher mercado' : 'Expandir mercado'}
                aria-expanded={isDoubleChanceMarketOpen}
                onClick={() => setIsDoubleChanceMarketOpen((current) => !current)}
              >
                <CaretRightIcon
                  aria-hidden="true"
                  className={`live-event-page__market-chevron${isDoubleChanceMarketOpen ? '' : ' live-event-page__market-chevron--closed'}`}
                  weight="bold"
                />
              </button>
            </div>
          </div>

          <div className="live-event-page__market-tags">
            <div className="live-event-page__market-tag">
              <span>Múltipla Turbinada</span>
              <span className="live-event-page__market-tag-badge">
                <img src={multiplaTurbinada} alt="" className="live-event-page__market-tag-img" />
              </span>
            </div>
          </div>

          <div className={`live-event-page__market-collapse${isDoubleChanceMarketOpen ? ' live-event-page__market-collapse--open' : ''}`}>
            <div className="live-event-page__market-collapse-inner">
              {isBasketball ? (
                <div className="live-event-page__total-goals-list">
                  {finalRows.map((row) => {
                    const isCurrentRow = isLineMarketCurrentRow(row, match.q4TotalOdds?.line)
                    const underOutcomeId = getLiveEventLineOutcomeId(row, isCurrentRow, 'under-q4')
                    const overOutcomeId = getLiveEventLineOutcomeId(row, isCurrentRow, 'over-q4')

                    return (
                      <div key={row.id} className="live-event-page__total-goals-row">
                        {renderMarketOddButton(finalMarketId, underOutcomeId, row.under.label, row.under.odd)}
                        {renderMarketOddButton(finalMarketId, overOutcomeId, row.over.label, row.over.odd)}
                      </div>
                    )
                  })}
                </div>
              ) : (
                doubleChanceRows.map((row) => (
                  <div key={row.id} className="live-event-page__market-odds live-event-page__market-odds--double-chance">
                    {row.options.map((option, optionIndex) => (
                      renderMarketOddButton(
                        finalMarketId,
                        liveEventDoubleChanceOutcomeIds[optionIndex] ?? option.label,
                        option.labelParts ? `${option.labelParts[0]} ou ${option.labelParts[1]}` : option.label,
                        option.odd,
                        'live-event-page__market-odd live-event-page__market-odd--double-chance',
                        'live-event-page__market-odd-label',
                        option.label
                      )
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  )
}

const MemoLiveEventContent = memo(LiveEventContent, (previous, next) => (
  previous.match === next.match
  && previous.leagueName === next.leagueName
  && previous.sport === next.sport
  && previous.currentTime === next.currentTime
  && previous.isExpanded === next.isExpanded
  && previous.expansionProgress === next.expansionProgress
))

const LIVE_EVENT_COMPACT_SIDE_MARGIN = 24
const LIVE_EVENT_COMPACT_TOP = 106
const LIVE_EVENT_TRANSITION_MS = 360
const LIVE_EVENT_CONTENT_SWITCH_MS = 380
const LIVE_EVENT_CLOSE_GUARD_MS = 900
const LIVE_EVENT_PULL_TOP_THRESHOLD = 1
const LIVE_EVENT_PULL_START_THRESHOLD = 6
const LIVE_EVENT_PULL_RESISTANCE = 0.56
const LIVE_EVENT_MAX_COMPACT_PULL = 132
const LIVE_EVENT_CLOSE_PULL_THRESHOLD = 72
const LIVE_EVENT_EXPANSION_TOUCH_DISTANCE = 180
const LIVE_EVENT_EXPANSION_WHEEL_DISTANCE = 260
const LIVE_EVENT_EXPANSION_SETTLE_THRESHOLD = 0.5
const LIVE_EVENT_WHEEL_SETTLE_DELAY_MS = 140
const LIVE_EVENT_SWIPE_INTENT_THRESHOLD = 8
const LIVE_EVENT_SWIPE_COMMIT_RATIO = 0.25
const LIVE_EVENT_SWIPE_COMMIT_VELOCITY = 0.45
const LIVE_EVENT_SWIPE_SNAP_MS = 220
const LIVE_EVENT_SWIPE_EDGE_RESISTANCE = 0.28
const LIVE_EVENT_SWIPE_PAGE_GAP = 24
type LiveEventSwitchDirection = 'next' | 'previous'

interface SwipeState {
  direction: LiveEventSwitchDirection
  isSnapping: boolean
}

interface LiveEventContentTransition {
  matchesKey: string
  previousIndex: number
  activeIndex: number
  direction: LiveEventSwitchDirection
  key: number
}

interface ActiveMatchState {
  matchesKey: string
  requestedIndex: number
  index: number
}

const isMobileTouchScreen = () => (
  typeof window !== 'undefined'
  && (
    window.matchMedia?.('(hover: none) and (pointer: coarse)').matches
    || navigator.maxTouchPoints > 0
  )
)

const getCompactPullDistance = (distance: number) => (
  Math.min(LIVE_EVENT_MAX_COMPACT_PULL, Math.max(0, distance * LIVE_EVENT_PULL_RESISTANCE))
)

const clampLiveEventExpansionProgress = (progress: number) => (
  Math.min(1, Math.max(0, progress))
)

interface SheetMetrics {
  viewportWidth: number
  viewportHeight: number
  compactScale: number
}

function measureSheetMetrics(): SheetMetrics {
  if (typeof window === 'undefined') {
    return {
      viewportWidth: 390,
      viewportHeight: 844,
      compactScale: 342 / 390,
    }
  }

  const viewportWidth = window.visualViewport?.width ?? window.innerWidth ?? 390
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight ?? 844
  const availableWidth = Math.max(1, viewportWidth - LIVE_EVENT_COMPACT_SIDE_MARGIN * 2)
  const compactScale = Math.min(1, availableWidth / viewportWidth)

  return {
    viewportWidth,
    viewportHeight,
    compactScale,
  }
}

export function LiveEventPage({
  isOpen,
  onClose,
  onOpenSettled,
  onCloseStart,
  match,
  matches,
  railEvents,
  selectedIndex = 0,
  currentTimes,
  leagueName,
  leagueFlag,
  sport,
  currentTime,
}: LiveEventPageProps) {
  const eventMatches = useMemo(
    () => matches?.length ? matches : match ? [match] : [],
    [match, matches]
  )
  const eventMatchesKey = useMemo(
    () => eventMatches.map((eventMatch, index) => getLiveEventMatchIdentity(eventMatch, index)).join('|'),
    [eventMatches]
  )
  const requestedSelectedMatchIndex = Math.min(Math.max(selectedIndex, 0), Math.max(eventMatches.length - 1, 0))
  const [activeMatchState, setActiveMatchState] = useState<ActiveMatchState>(() => ({
    matchesKey: eventMatchesKey,
    requestedIndex: requestedSelectedMatchIndex,
    index: requestedSelectedMatchIndex,
  }))
  const [contentTransition, setContentTransition] = useState<LiveEventContentTransition | null>(null)
  const activeMatchIndex = (
    activeMatchState.matchesKey === eventMatchesKey
    && activeMatchState.requestedIndex === requestedSelectedMatchIndex
  )
    ? activeMatchState.index
    : requestedSelectedMatchIndex
  const activeContentTransition = contentTransition?.matchesKey === eventMatchesKey
    ? contentTransition
    : null
  const selectedMatchIndex = Math.min(Math.max(activeMatchIndex, 0), Math.max(eventMatches.length - 1, 0))
  const selectedMatch = eventMatches[selectedMatchIndex]
  const selectedMatchIdentity = selectedMatch ? getLiveEventMatchIdentity(selectedMatch, selectedMatchIndex) : ''
  const railItems = useMemo(
    () => railEvents?.length
      ? railEvents
      : getLiveEventRailFallbackItems({
          matches: eventMatches,
          currentTimes,
          leagueName,
          leagueFlag,
          sport,
        }),
    [currentTimes, eventMatches, leagueFlag, leagueName, railEvents, sport]
  )
  const railItemsKey = useMemo(
    () => railItems.map((item) => getLiveEventRailIdentity(item)).join('|'),
    [railItems]
  )
  const matchIndexByIdentity = useMemo(() => {
    const indexByIdentity = new Map<string, number>()
    eventMatches.forEach((eventMatch, index) => {
      indexByIdentity.set(getLiveEventMatchIdentity(eventMatch, index), index)
    })
    return indexByIdentity
  }, [eventMatches])
  const selectableIdentities = useMemo(
    () => new Set(matchIndexByIdentity.keys()),
    [matchIndexByIdentity]
  )
  const activeRailIndex = railItems.findIndex((item) => getLiveEventRailIdentity(item) === selectedMatchIdentity)
  const initialRailTimes = useMemo(
    () => railItems.reduce<Record<string, string>>((times, item) => {
      times[getLiveEventRailIdentity(item)] = item.currentTime ?? item.headerPrimary ?? item.dateTime
      return times
    }, {}),
    [railItems]
  )
  const [railTimesState, setRailTimesState] = useState(() => ({
    key: railItemsKey,
    times: initialRailTimes,
  }))
  const railTimes = railTimesState.key === railItemsKey ? railTimesState.times : initialRailTimes
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [expansionProgress, setExpansionProgress] = useState(0)
  const isExpanded = expansionProgress >= 1
  const hasExpansionStarted = expansionProgress > 0
  const [isExpansionGestureActive, setIsExpansionGestureActive] = useState(false)
  const [compactPullY, setCompactPullY] = useState(0)
  const [isCompactPulling, setIsCompactPulling] = useState(false)
  const [sheetMetrics, setSheetMetrics] = useState<SheetMetrics>(() => measureSheetMetrics())
  const [swipeState, setSwipeState] = useState<SwipeState | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const compactCloseGuardTimerRef = useRef<number | null>(null)
  const compactCloseGuardRef = useRef(false)
  const switchTimerRef = useRef<number | null>(null)
  const expansionSettleTimerRef = useRef<number | null>(null)
  const swipeSnapTimerRef = useRef<number | null>(null)
  const pageRootRef = useRef<HTMLDivElement | null>(null)
  const swipeRuntimeRef = useRef({
    selectedMatchIndex,
    eventMatchesLength: eventMatches.length,
    eventMatchesKey,
    requestedSelectedMatchIndex,
    sheetMetrics,
    expansionProgress,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isOpen && !isClosing) {
        if (closeTimerRef.current !== null) {
          window.clearTimeout(closeTimerRef.current)
          closeTimerRef.current = null
        }
        setSheetMetrics(measureSheetMetrics())
        setExpansionProgress(0)
        setIsExpansionGestureActive(false)
        setCompactPullY(0)
        setIsCompactPulling(false)
        setShouldRender(true)
        setIsClosing(false)
      } else if (shouldRender && !isClosing) {
        setIsClosing(true)
        setExpansionProgress(0)
        setIsExpansionGestureActive(false)
        setCompactPullY(0)
        setIsCompactPulling(false)
        closeTimerRef.current = window.setTimeout(() => {
          setShouldRender(false)
          setIsClosing(false)
          closeTimerRef.current = null
        }, LIVE_EVENT_TRANSITION_MS)
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isOpen, shouldRender, isClosing])

  useEffect(() => () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    if (compactCloseGuardTimerRef.current !== null) {
      window.clearTimeout(compactCloseGuardTimerRef.current)
      compactCloseGuardTimerRef.current = null
    }
    if (switchTimerRef.current !== null) {
      window.clearTimeout(switchTimerRef.current)
      switchTimerRef.current = null
    }
    if (expansionSettleTimerRef.current !== null) {
      window.clearTimeout(expansionSettleTimerRef.current)
      expansionSettleTimerRef.current = null
    }
    if (swipeSnapTimerRef.current !== null) {
      window.clearTimeout(swipeSnapTimerRef.current)
      swipeSnapTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!shouldRender || isClosing) return undefined

    const timer = window.setTimeout(() => {
      onOpenSettled?.()
    }, LIVE_EVENT_TRANSITION_MS)

    return () => window.clearTimeout(timer)
  }, [isClosing, onOpenSettled, shouldRender])

  const armCompactCloseGuard = useCallback(() => {
    compactCloseGuardRef.current = true

    if (compactCloseGuardTimerRef.current !== null) {
      window.clearTimeout(compactCloseGuardTimerRef.current)
    }

    compactCloseGuardTimerRef.current = window.setTimeout(() => {
      compactCloseGuardRef.current = false
      compactCloseGuardTimerRef.current = null
    }, LIVE_EVENT_CLOSE_GUARD_MS)
  }, [])

  const clearCompactCloseGuard = useCallback(() => {
    compactCloseGuardRef.current = false

    if (compactCloseGuardTimerRef.current !== null) {
      window.clearTimeout(compactCloseGuardTimerRef.current)
      compactCloseGuardTimerRef.current = null
    }
  }, [])

  useLayoutEffect(() => {
    swipeRuntimeRef.current = {
      selectedMatchIndex,
      eventMatchesLength: eventMatches.length,
      eventMatchesKey,
      requestedSelectedMatchIndex,
      sheetMetrics,
      expansionProgress,
    }
  }, [
    eventMatches.length,
    eventMatchesKey,
    expansionProgress,
    requestedSelectedMatchIndex,
    selectedMatchIndex,
    sheetMetrics,
  ])

  useEffect(() => {
    if (!shouldRender || railItems.length === 0 || !railItems.some((item) => item.isLive)) return

    const interval = window.setInterval(() => {
      setRailTimesState((current) => {
        const sourceTimes = current.key === railItemsKey ? current.times : initialRailTimes
        const next = { ...sourceTimes }

        railItems.forEach((item) => {
          if (!item.isLive) return

          const identity = getLiveEventRailIdentity(item)
          const sourceTime = next[identity] ?? item.currentTime ?? item.headerPrimary ?? item.dateTime
          const parsed = parseLiveTime(sourceTime)
          if (parsed) {
            next[identity] = getNextLiveTime(parsed)
          }
        })

        return { key: railItemsKey, times: next }
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [initialRailTimes, railItems, railItemsKey, shouldRender])

  useEffect(() => {
    if (!shouldRender) return

    const scrollY = window.scrollY
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [shouldRender])

  useEffect(() => {
    if (!shouldRender) return

    const updateSheetMetrics = () => setSheetMetrics(measureSheetMetrics())

    updateSheetMetrics()
    window.addEventListener('resize', updateSheetMetrics)
    window.visualViewport?.addEventListener('resize', updateSheetMetrics)

    return () => {
      window.removeEventListener('resize', updateSheetMetrics)
      window.visualViewport?.removeEventListener('resize', updateSheetMetrics)
    }
  }, [shouldRender])

  const clearExpansionSettleTimer = useCallback(() => {
    if (expansionSettleTimerRef.current !== null) {
      window.clearTimeout(expansionSettleTimerRef.current)
      expansionSettleTimerRef.current = null
    }
  }, [])

  const settleExpansionProgress = useCallback((progress: number) => {
    clearExpansionSettleTimer()

    const clampedProgress = clampLiveEventExpansionProgress(progress)
    const settledProgress = clampedProgress <= 0
      ? 0
      : clampedProgress >= 1
        ? 1
        : clampedProgress >= LIVE_EVENT_EXPANSION_SETTLE_THRESHOLD
          ? 1
          : 0

    setExpansionProgress(settledProgress)
    setIsExpansionGestureActive(false)
    setCompactPullY(0)
    setIsCompactPulling(false)
  }, [clearExpansionSettleTimer])

  const handleExpansionProgressChange = useCallback((
    progress: number,
    options: { deferSettle?: boolean } = {}
  ) => {
    const nextProgress = clampLiveEventExpansionProgress(progress)

    clearExpansionSettleTimer()
    setIsExpansionGestureActive(true)
    setExpansionProgress(nextProgress)

    if (nextProgress > 0) {
      setCompactPullY(0)
      setIsCompactPulling(false)
    }

    if (options.deferSettle) {
      expansionSettleTimerRef.current = window.setTimeout(() => {
        settleExpansionProgress(nextProgress)
      }, LIVE_EVENT_WHEEL_SETTLE_DELAY_MS)
    }
  }, [clearExpansionSettleTimer, settleExpansionProgress])

  const handleExpansionGestureEnd = useCallback((progress: number) => {
    const nextProgress = clampLiveEventExpansionProgress(progress)
    if (nextProgress <= 0) armCompactCloseGuard()
    settleExpansionProgress(nextProgress)
  }, [armCompactCloseGuard, settleExpansionProgress])

  const requestClose = useCallback((options: LiveEventCloseOptions = {}) => {
    if (isClosing) return
    const shouldForceClose = options.force === true

    clearExpansionSettleTimer()
    if (!shouldForceClose && expansionProgress > 0) {
      armCompactCloseGuard()
      setExpansionProgress(0)
      setIsExpansionGestureActive(false)
      setCompactPullY(0)
      setIsCompactPulling(false)
      return
    }
    if (!shouldForceClose && compactCloseGuardRef.current) return

    if (shouldForceClose) clearCompactCloseGuard()

    onCloseStart?.()
    setIsClosing(true)
    setExpansionProgress(0)
    setIsExpansionGestureActive(false)
    setCompactPullY(0)
    setIsCompactPulling(false)
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
    }
    closeTimerRef.current = window.setTimeout(() => {
      setShouldRender(false)
      setIsClosing(false)
      closeTimerRef.current = null
      onClose()
    }, LIVE_EVENT_TRANSITION_MS)
  }, [armCompactCloseGuard, clearCompactCloseGuard, clearExpansionSettleTimer, expansionProgress, isClosing, onClose, onCloseStart])

  const requestExpand = useCallback(() => {
    clearExpansionSettleTimer()
    setCompactPullY(0)
    setIsCompactPulling(false)
    setIsExpansionGestureActive(false)
    setExpansionProgress(1)
  }, [clearExpansionSettleTimer])

  const requestCollapse = useCallback(() => {
    armCompactCloseGuard()
    clearExpansionSettleTimer()
    setCompactPullY(0)
    setIsCompactPulling(false)
    setIsExpansionGestureActive(false)
    setExpansionProgress(0)
  }, [armCompactCloseGuard, clearExpansionSettleTimer])

  const handleCompactPullChange = useCallback((distance: number) => {
    if (isClosing) return
    if (distance <= 0) {
      setIsCompactPulling(false)
      setCompactPullY(0)
      return
    }

    setIsCompactPulling(true)
    setCompactPullY(distance)
  }, [isClosing])

  const handleCompactPullEnd = useCallback((distance: number) => {
    if (distance >= LIVE_EVENT_CLOSE_PULL_THRESHOLD) {
      requestClose({ force: true })
      return
    }

    setIsCompactPulling(false)
    setCompactPullY(0)
  }, [requestClose])

  const commitMatchSwitch = useCallback((nextMatchIndex: number, direction: LiveEventSwitchDirection) => {
    if (switchTimerRef.current !== null) {
      window.clearTimeout(switchTimerRef.current)
      switchTimerRef.current = null
    }

    setContentTransition((current) => {
      const canContinueTransition = current?.matchesKey === eventMatchesKey

      return {
        matchesKey: eventMatchesKey,
        previousIndex: canContinueTransition ? current.activeIndex : selectedMatchIndex,
        activeIndex: nextMatchIndex,
        direction,
        key: (canContinueTransition ? current.key : 0) + 1,
      }
    })
    setActiveMatchState({
      matchesKey: eventMatchesKey,
      requestedIndex: requestedSelectedMatchIndex,
      index: nextMatchIndex,
    })
    setCompactPullY(0)
    setIsCompactPulling(false)

    switchTimerRef.current = window.setTimeout(() => {
      setContentTransition(null)
      switchTimerRef.current = null
    }, LIVE_EVENT_CONTENT_SWITCH_MS)
  }, [eventMatchesKey, requestedSelectedMatchIndex, selectedMatchIndex])

  const handleRailItemSelect = useCallback((item: LiveEventRailItem, railIndex: number) => {
    const nextMatchIndex = matchIndexByIdentity.get(getLiveEventRailIdentity(item))
    if (nextMatchIndex === undefined || nextMatchIndex === selectedMatchIndex) return

    const currentRailIndex = activeRailIndex >= 0 ? activeRailIndex : selectedMatchIndex
    const direction: LiveEventSwitchDirection = railIndex > currentRailIndex ? 'next' : 'previous'

    commitMatchSwitch(nextMatchIndex, direction)
  }, [activeRailIndex, commitMatchSwitch, matchIndexByIdentity, selectedMatchIndex])

  const handleSwipeStart = useCallback(() => {
    if (swipeSnapTimerRef.current !== null) return

    pageRootRef.current?.style.setProperty('--live-event-swipe-x', '0px')
    setSwipeState({ direction: 'next', isSnapping: false })
  }, [])

  const handleSwipeMove = useCallback((dx: number) => {
    if (swipeSnapTimerRef.current !== null) return

    const {
      selectedMatchIndex: currentMatchIndex,
      eventMatchesLength,
    } = swipeRuntimeRef.current
    const direction: LiveEventSwitchDirection = dx < 0 ? 'next' : 'previous'
    const hasNeighbor = direction === 'next'
      ? currentMatchIndex < eventMatchesLength - 1
      : currentMatchIndex > 0
    const adjustedDx = hasNeighbor ? dx : dx * LIVE_EVENT_SWIPE_EDGE_RESISTANCE
    pageRootRef.current?.style.setProperty('--live-event-swipe-x', `${adjustedDx}px`)

    setSwipeState((current) => {
      if (current && current.direction === direction && !current.isSnapping) return current
      return { direction, isSnapping: false }
    })
  }, [])

  const handleSwipeEnd = useCallback((dx: number, velocity: number) => {
    if (swipeSnapTimerRef.current !== null) return

    const {
      selectedMatchIndex: currentMatchIndex,
      eventMatchesLength,
      eventMatchesKey: currentEventMatchesKey,
      requestedSelectedMatchIndex: currentRequestedSelectedMatchIndex,
      sheetMetrics: currentSheetMetrics,
      expansionProgress: currentExpansionProgress,
    } = swipeRuntimeRef.current
    const direction: LiveEventSwitchDirection = dx < 0 ? 'next' : 'previous'
    const hasNeighbor = direction === 'next'
      ? currentMatchIndex < eventMatchesLength - 1
      : currentMatchIndex > 0
    const viewportWidth = currentSheetMetrics.viewportWidth
    const currentSheetScale = currentSheetMetrics.compactScale + (1 - currentSheetMetrics.compactScale) * currentExpansionProgress
    const swipePageDistance = viewportWidth * currentSheetScale + LIVE_EVENT_SWIPE_PAGE_GAP
    const passedDistance = Math.abs(dx) >= swipePageDistance * LIVE_EVENT_SWIPE_COMMIT_RATIO
    const passedVelocity = Math.abs(velocity) >= LIVE_EVENT_SWIPE_COMMIT_VELOCITY
      && Math.abs(dx) >= LIVE_EVENT_SWIPE_INTENT_THRESHOLD * 2
    const shouldCommit = hasNeighbor && (passedDistance || passedVelocity)

    if (swipeSnapTimerRef.current !== null) {
      window.clearTimeout(swipeSnapTimerRef.current)
      swipeSnapTimerRef.current = null
    }

    if (shouldCommit) {
      const nextIndex = currentMatchIndex + (direction === 'next' ? 1 : -1)
      const targetPx = (direction === 'next' ? -1 : 1) * swipePageDistance
      pageRootRef.current?.style.setProperty('--live-event-swipe-x', `${targetPx}px`)
      setSwipeState({ direction, isSnapping: true })

      swipeSnapTimerRef.current = window.setTimeout(() => {
        flushSync(() => {
          setActiveMatchState({
            matchesKey: currentEventMatchesKey,
            requestedIndex: currentRequestedSelectedMatchIndex,
            index: nextIndex,
          })
          setSwipeState(null)
        })
        pageRootRef.current?.style.setProperty('--live-event-swipe-x', '0px')
        swipeSnapTimerRef.current = null
      }, LIVE_EVENT_SWIPE_SNAP_MS)
    } else {
      pageRootRef.current?.style.setProperty('--live-event-swipe-x', '0px')
      setSwipeState({ direction, isSnapping: true })
      swipeSnapTimerRef.current = window.setTimeout(() => {
        setSwipeState(null)
        swipeSnapTimerRef.current = null
      }, LIVE_EVENT_SWIPE_SNAP_MS)
    }
  }, [])

  if (!shouldRender || !selectedMatch) return null

  const selectedMatchTime = getLiveEventMatchTime(
    selectedMatch,
    selectedMatchIndex,
    currentTimes,
    selectedMatchIndex === selectedIndex ? currentTime : undefined
  )
  const previousTransitionMatch = activeContentTransition
    ? eventMatches[activeContentTransition.previousIndex]
    : undefined
  const previousTransitionMatchTime = previousTransitionMatch
    ? getLiveEventMatchTime(previousTransitionMatch, activeContentTransition!.previousIndex, currentTimes)
    : ''
  const pageClasses = [
    'live-event-page',
    isClosing ? 'live-event-page--closing' : '',
    isExpanded ? 'live-event-page--expanded' : '',
    hasExpansionStarted ? 'live-event-page--expansion-started' : '',
    isExpansionGestureActive ? 'live-event-page--gesture-resizing' : '',
    isCompactPulling ? 'live-event-page--compact-pulling' : '',
    activeContentTransition ? 'live-event-page--content-switching' : '',
    swipeState ? 'live-event-page--swiping' : '',
    swipeState?.isSnapping ? 'live-event-page--swipe-snapping' : '',
  ].filter(Boolean).join(' ')
  const swipeNeighborIndex = swipeState
    ? (swipeState.direction === 'next'
        ? (selectedMatchIndex < eventMatches.length - 1 ? selectedMatchIndex + 1 : null)
        : (selectedMatchIndex > 0 ? selectedMatchIndex - 1 : null))
    : null
  const swipeNeighborMatch = swipeNeighborIndex !== null ? eventMatches[swipeNeighborIndex] : null
  const showSwipeNeighbor = !!swipeState
    && swipeNeighborMatch !== null
    && swipeNeighborMatch !== undefined
    && !activeContentTransition
  const sheetOffsetY = LIVE_EVENT_COMPACT_TOP * (1 - expansionProgress) + compactPullY
  const sheetScale = sheetMetrics.compactScale + (1 - sheetMetrics.compactScale) * expansionProgress
  const sheetRadius = 28 * (1 - expansionProgress)
  const rootStyle = {
    ['--live-event-sheet-width' as string]: `${sheetMetrics.viewportWidth}px`,
    ['--live-event-sheet-height' as string]: `${sheetMetrics.viewportHeight}px`,
    ['--live-event-compact-scale' as string]: String(sheetMetrics.compactScale),
    ['--live-event-compact-top' as string]: `${LIVE_EVENT_COMPACT_TOP}px`,
    ['--live-event-compact-pull-y' as string]: `${compactPullY}px`,
    ['--live-event-expansion-progress' as string]: String(expansionProgress),
    ['--live-event-sheet-offset-y' as string]: `${sheetOffsetY}px`,
    ['--live-event-sheet-scale' as string]: String(sheetScale),
    ['--live-event-sheet-radius' as string]: `${sheetRadius}px`,
    ['--live-event-swipe-page-gap' as string]: `${LIVE_EVENT_SWIPE_PAGE_GAP}px`,
  } as CSSProperties

  return createPortal(
    <div ref={pageRootRef} className={pageClasses} style={rootStyle}>
      <div className="live-event-page__overlay" onClick={() => requestClose()} />
      <div className="live-event-page__sheet-layer">
        {railItems.length > 0 && (
          <div className="live-event-page__compact-rail-shell">
            <LiveEventMatchRail
              items={railItems}
              activeIdentity={selectedMatchIdentity}
              activeRailIndex={activeRailIndex}
              railTimes={railTimes}
              selectableIdentities={selectableIdentities}
              isExpanded={isExpanded}
              onSelect={handleRailItemSelect}
            />
          </div>
        )}
        <div className="live-event-page__sheet-slide">
          <div className="live-event-page__sheet-center">
            <div className="live-event-page__sheet-scale">
              <div className="live-event-page__content-stage">
                {activeContentTransition && previousTransitionMatch && (
                  <div
                    key={getLiveEventMatchIdentity(previousTransitionMatch, activeContentTransition.previousIndex)}
                    className={[
                      'live-event-page__content-pane',
                      'live-event-page__content-pane--previous',
                      `live-event-page__content-pane--exit-${activeContentTransition.direction}`,
                    ].join(' ')}
                  >
                    <MemoLiveEventContent
                      match={previousTransitionMatch}
                      leagueName={previousTransitionMatch.leagueName ?? leagueName}
                      sport={previousTransitionMatch.sport ?? sport}
                      currentTime={previousTransitionMatchTime}
                      isExpanded={isExpanded}
                      expansionProgress={expansionProgress}
                      onRequestClose={requestClose}
                      onRequestExpand={requestExpand}
                      onRequestCollapse={requestCollapse}
                      onExpansionProgressChange={handleExpansionProgressChange}
                      onExpansionGestureEnd={handleExpansionGestureEnd}
                      onCompactPullChange={handleCompactPullChange}
                      onCompactPullEnd={handleCompactPullEnd}
                      onBlockNextClose={armCompactCloseGuard}
                      onSwipeStart={handleSwipeStart}
                      onSwipeMove={handleSwipeMove}
                      onSwipeEnd={handleSwipeEnd}
                    />
                  </div>
                )}
                <div
                  key={selectedMatchIdentity}
                  className={[
                    'live-event-page__content-pane',
                    'live-event-page__content-pane--active',
                    activeContentTransition ? `live-event-page__content-pane--enter-${activeContentTransition.direction}` : '',
                  ].filter(Boolean).join(' ')}
                >
                  <MemoLiveEventContent
                    match={selectedMatch}
                    leagueName={selectedMatch.leagueName ?? leagueName}
                    sport={selectedMatch.sport ?? sport}
                    currentTime={selectedMatchTime}
                    isExpanded={isExpanded}
                    expansionProgress={expansionProgress}
                    onRequestClose={requestClose}
                    onRequestExpand={requestExpand}
                    onRequestCollapse={requestCollapse}
                    onExpansionProgressChange={handleExpansionProgressChange}
                    onExpansionGestureEnd={handleExpansionGestureEnd}
                    onCompactPullChange={handleCompactPullChange}
                    onCompactPullEnd={handleCompactPullEnd}
                    onBlockNextClose={armCompactCloseGuard}
                    onSwipeStart={handleSwipeStart}
                    onSwipeMove={handleSwipeMove}
                    onSwipeEnd={handleSwipeEnd}
                  />
                </div>
                {showSwipeNeighbor && swipeNeighborMatch && swipeState && (
                  <div
                    key={getLiveEventMatchIdentity(swipeNeighborMatch, swipeNeighborIndex!)}
                    className={[
                      'live-event-page__content-pane',
                      'live-event-page__content-pane--swipe-neighbor',
                      `live-event-page__content-pane--swipe-neighbor-${swipeState.direction}`,
                    ].join(' ')}
                    aria-hidden
                  >
                    <MemoLiveEventContent
                      match={swipeNeighborMatch}
                      leagueName={swipeNeighborMatch.leagueName ?? leagueName}
                      sport={swipeNeighborMatch.sport ?? sport}
                      currentTime={getLiveEventMatchTime(swipeNeighborMatch, swipeNeighborIndex!, currentTimes)}
                      isExpanded={isExpanded}
                      expansionProgress={expansionProgress}
                      onRequestClose={requestClose}
                      onRequestExpand={requestExpand}
                      onRequestCollapse={requestCollapse}
                      onExpansionProgressChange={handleExpansionProgressChange}
                      onExpansionGestureEnd={handleExpansionGestureEnd}
                      onCompactPullChange={handleCompactPullChange}
                      onCompactPullEnd={handleCompactPullEnd}
                      onBlockNextClose={armCompactCloseGuard}
                      onSwipeStart={handleSwipeStart}
                      onSwipeMove={handleSwipeMove}
                      onSwipeEnd={handleSwipeEnd}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
