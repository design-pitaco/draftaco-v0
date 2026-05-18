import { useState, useRef, useEffect, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { CaretUpIcon } from '@phosphor-icons/react'
import './BannerCarousel.css'
import { Toast } from '../Toast'
import { TeamLogo } from '../TeamLogo'
import { 
  BottomSheet, 
  MissionObjective, 
  MissionInfoRow, 
  MissionFaqItem,
  MissionTimer 
} from '../BottomSheet'
import { sportsBanners } from '../../data/homeProducts'
import {
  BETSLIP_ODD_INTERACTION_EVENT,
  createBetslipSelection,
  getBetslipEventId,
  getBetslipMarketGroupId,
  type BetslipSelection,
} from '../../hooks/betslipUtils'
import { useBetslip } from '../../hooks/useBetslip'
import { useOddSelection } from '../../hooks/useOddSelection'
import type { Banner } from '../../types/home'

import iconSuperCombinada from '../../assets/iconSuperCombinada.png'
import iconAoVivo from '../../assets/iconAoVivo.png'
import iconTenis from '../../assets/iconSports/tennis.png'
import iconSaibaMais from '../../assets/iconSaibaMais.svg'
import iconBoostWhite from '../../assets/iconBoostWhite.svg'
import iconAumentada from '../../assets/iconAumentada.png'
import iconAtivo from '../../assets/iconAtivo.svg'
import imgMissaoRodadaGratis from '../../assets/imgMissaoRodadaGratis.png'
import pedroProps from '../../assets/pedroProps.png'

// Mission progress type
interface MissionProgress {
  current: number
  target: number
}

interface BannerCarouselProps {
  banners?: Banner[]
  onBannerClick?: (banner: Banner) => void
}

const AUTO_PLAY_INTERVAL = 10000 // 10 segundos

interface BannerAutoPlayRefs {
  autoPlayRef: { current: ReturnType<typeof setInterval> | null }
  bannerCountRef: { current: number }
  scrollRef: { current: HTMLDivElement | null }
}

interface BannerMatchTeams {
  homeTeam?: string
  awayTeam?: string
}

interface BannerBetslipEntry {
  groupId: string
  selection: BetslipSelection
}

const isBannerBetslipEntry = (entry: BannerBetslipEntry | undefined): entry is BannerBetslipEntry => !!entry

const resultMarketGroupIds = new Set(['regular', 'live', 'tennis-live', 'resultado-final', '1x2'])

const getReactNodeText = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getReactNodeText).join('')

  return ''
}

const getBannerMatchTeamsFromLabel = (label?: string): BannerMatchTeams | null => {
  if (!label) return null

  const parts = label.split(/\s+(?:vs|x)\s+/i).map((part) => part.trim()).filter(Boolean)
  if (parts.length !== 2) return null

  return {
    homeTeam: parts[0],
    awayTeam: parts[1],
  }
}

const getBannerMatchTeams = (banner: Banner): BannerMatchTeams => {
  if (banner.tennisMatch) {
    return {
      homeTeam: banner.tennisMatch.player1.name,
      awayTeam: banner.tennisMatch.player2.name,
    }
  }

  if (banner.liveMatch) {
    return {
      homeTeam: banner.liveMatch.homeTeam.name,
      awayTeam: banner.liveMatch.awayTeam.name,
    }
  }

  const headerTeams = getBannerMatchTeamsFromLabel(banner.headerRight)
  if (headerTeams) return headerTeams

  const regularTeams = banner.odds?.filter((odd) => odd.team !== 'Empate').map((odd) => odd.team) ?? []

  return {
    homeTeam: regularTeams[0] ?? banner.headerLeft,
    awayTeam: regularTeams[regularTeams.length - 1] ?? banner.headerRight,
  }
}

const getBannerSport = (banner: Banner) => {
  if (banner.tennisMatch) return 'tenis'
  if (banner.liveMatch) return 'basquete'

  return 'futebol'
}

const getBannerEventName = (banner: Banner, { homeTeam, awayTeam }: BannerMatchTeams) => {
  if (homeTeam && awayTeam) return `${homeTeam} x ${awayTeam}`

  return banner.headerRight
}

const getBannerHomeTeamIcon = (banner: Banner) => (
  banner.tennisMatch?.player1.flag
    ?? banner.liveMatch?.homeTeam.badge
    ?? banner.odds?.find((odd) => odd.team !== 'Empate')?.badge
)

const getBannerAwayTeamIcon = (banner: Banner) => {
  if (banner.tennisMatch?.player2.flag) return banner.tennisMatch.player2.flag
  if (banner.liveMatch?.awayTeam.badge) return banner.liveMatch.awayTeam.badge

  const regularTeamsWithBadges = banner.odds?.filter((odd) => odd.team !== 'Empate' && odd.badge) ?? []
  return regularTeamsWithBadges[regularTeamsWithBadges.length - 1]?.badge
}

const getBannerOutcomeIcon = (banner: Banner, outcomeId: string, label: ReactNode) => {
  const labelText = getReactNodeText(label)

  if (banner.tennisMatch) {
    if (outcomeId === 'player-1' || labelText === banner.tennisMatch.player1.name) {
      return banner.tennisMatch.player1.flag
    }

    if (outcomeId === 'player-2' || labelText === banner.tennisMatch.player2.name) {
      return banner.tennisMatch.player2.flag
    }
  }

  if (banner.liveMatch) {
    if (outcomeId === 'home' || labelText === banner.liveMatch.homeTeam.name) {
      return banner.liveMatch.homeTeam.badge
    }

    if (outcomeId === 'away' || labelText === banner.liveMatch.awayTeam.name) {
      return banner.liveMatch.awayTeam.badge
    }
  }

  return banner.odds?.find((odd) => odd.team === labelText)?.badge
}

const getBannerLiveTimeLabel = (banner: Banner, liveMatchTime: string) => {
  if (banner.type === 'aoVivo') return liveMatchTime
  if (banner.type === 'aoVivoTenis') return banner.tennisMatch?.currentSet ?? 'Ao vivo'

  return banner.headerLeft
}

const getBannerMarketInfo = (banner: Banner, groupId: string) => {
  if (resultMarketGroupIds.has(groupId) || banner.type === '1x2') {
    return {
      marketId: 'resultado-final',
      marketLabel: 'Resultado Final',
    }
  }

  return {
    marketId: groupId,
    marketLabel: groupId,
  }
}

const getBannerAumentadaDetails = (banner: Banner) => {
  if (banner.type !== 'aumentada') return null

  const [playerName, rawStatValue, rawMarketLabel] = banner.description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!playerName || !rawStatValue || !rawMarketLabel) return null

  const overValueMatch = rawStatValue.match(/^mais\s+de\s+(\d+(?:[,.]\d+)?)$/i)
  const statValue = overValueMatch ? `${overValueMatch[1].replace(',', '.')}+` : rawStatValue
  const marketLabel = rawMarketLabel.replace(/\bao gol\b/i, 'ao Gol')

  return {
    playerName,
    statValue,
    marketLabel,
    label: `${playerName} ${statValue}`,
  }
}

const getBannerTeamCode = (teamName?: string) => (
  teamName
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 3)
    .toUpperCase()
)

const expandBannerComboStatValue = (
  value: string,
  { homeTeam, awayTeam }: BannerMatchTeams
) => {
  const prefixMatch = value.match(/^([a-z]{2,4})(.*)$/i)
  if (!prefixMatch) return value

  const [, rawPrefix, suffix = ''] = prefixMatch
  const prefix = rawPrefix.toUpperCase()
  const homeCode = getBannerTeamCode(homeTeam)
  const awayCode = getBannerTeamCode(awayTeam)

  if (homeTeam && prefix === homeCode) return `${homeTeam}${suffix}`
  if (awayTeam && prefix === awayCode) return `${awayTeam}${suffix}`

  return value
}

function startBannerAutoPlay({ autoPlayRef, bannerCountRef, scrollRef }: BannerAutoPlayRefs) {
  if (autoPlayRef.current) {
    clearInterval(autoPlayRef.current)
  }

  autoPlayRef.current = setInterval(() => {
    const bannerCount = bannerCountRef.current
    if (!scrollRef.current || bannerCount <= 0) return

    const cardWidth = scrollRef.current.offsetWidth - 24 + 20
    const currentScroll = scrollRef.current.scrollLeft
    const currentIndex = Math.round(currentScroll / cardWidth)
    const nextIndex = (currentIndex + 1) % bannerCount

    scrollRef.current.scrollTo({
      left: nextIndex * cardWidth,
      behavior: 'smooth',
    })
  }, AUTO_PLAY_INTERVAL)
}

// Helper function to parse match time string
function parseMatchTime(timeStr: string): { period: number; minutes: number; seconds: number; isQuarter: boolean } {
  // Check for quarter format (basketball) - Q2 07:12
  const quarterMatch = timeStr.match(/Q(\d) (\d+):(\d+)/)
  if (quarterMatch) {
    return {
      period: parseInt(quarterMatch[1]),
      minutes: parseInt(quarterMatch[2]),
      seconds: parseInt(quarterMatch[3]),
      isQuarter: true,
    }
  }
  // Check for half format (football) - 2T 22:12
  const halfMatch = timeStr.match(/(\d)T (\d+):(\d+)/)
  if (halfMatch) {
    return {
      period: parseInt(halfMatch[1]),
      minutes: parseInt(halfMatch[2]),
      seconds: parseInt(halfMatch[3]),
      isQuarter: false,
    }
  }
  return { period: 1, minutes: 0, seconds: 0, isQuarter: false }
}

// Helper function to format time back to string
function formatMatchTime(period: number, minutes: number, seconds: number, isQuarter: boolean): string {
  const mins = minutes.toString().padStart(2, '0')
  const secs = seconds.toString().padStart(2, '0')
  // Basketball: Q1 07:12, Football: 1T 22:12
  return isQuarter ? `Q${period} ${mins}:${secs}` : `${period}T ${mins}:${secs}`
}

// Helper function to update time by 1 second (basketball: countdown, football: count up)
function updateMatchTime(timeStr: string): string {
  if (timeStr === 'Intervalo' || timeStr === 'INT') {
    return timeStr
  }

  const { period, minutes, seconds, isQuarter } = parseMatchTime(timeStr)

  if (isQuarter) {
    // Basketball: countdown (regressive)
    let newSeconds = seconds - 1
    let newMinutes = minutes

    if (newSeconds < 0) {
      newSeconds = 59
      newMinutes -= 1
    }

    // If time reaches 0:00, change to Intervalo
    if (newMinutes <= 0 && newSeconds <= 0) {
      return 'Intervalo'
    }

    return formatMatchTime(period, newMinutes, newSeconds, isQuarter)
  } else {
    // Football: count up (progressive)
    let newSeconds = seconds + 1
    let newMinutes = minutes

    if (newSeconds >= 60) {
      newSeconds = 0
      newMinutes += 1
    }

    return formatMatchTime(period, newMinutes, newSeconds, isQuarter)
  }
}

const getBannerBetslipEventId = (banner: Banner) => {
  if (banner.tennisMatch) {
    return getBetslipEventId({
      sport: 'tenis',
      homeTeam: banner.tennisMatch.player1.name,
      awayTeam: banner.tennisMatch.player2.name,
      fallbackId: `banner-${banner.id}`,
    })
  }

  if (banner.liveMatch) {
    return getBetslipEventId({
      sport: 'basquete',
      homeTeam: banner.liveMatch.homeTeam.name,
      awayTeam: banner.liveMatch.awayTeam.name,
      fallbackId: `banner-${banner.id}`,
    })
  }

  const { homeTeam, awayTeam } = getBannerMatchTeams(banner)

  return getBetslipEventId({
    sport: 'futebol',
    homeTeam,
    awayTeam,
    fallbackId: `banner-${banner.id}`,
  })
}

export function BannerCarousel({ banners = sportsBanners, onBannerClick }: BannerCarouselProps = {}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [activatedMissions, setActivatedMissions] = useState<Record<number, MissionProgress>>({})
  const [showToast, setShowToast] = useState(false)
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
  const [liveMatchTime, setLiveMatchTime] = useState("Q2 05:00")
  const getOddButtonProps = useOddSelection('banner-card__odd-btn')
  const { selectedSelectionIdsByGroup, toggleSelections } = useBetslip()
  const scrollRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const dragDistance = useRef(0)
  const touchStartScrollLeft = useRef(0)
  const bannerCountRef = useRef(banners.length)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleActivateMission = (bannerId: number, target: number) => {
    if (activatedMissions[bannerId]) return // Already activated
    
    setActivatedMissions(prev => ({
      ...prev,
      [bannerId]: { current: 0, target }
    }))
    setShowToast(true)
  }

  const isMissionActivated = (bannerId: number) => {
    return bannerId in activatedMissions
  }

  const getMissionProgress = (bannerId: number) => {
    return activatedMissions[bannerId]
  }

  const handleOpenMissionInfo = (banner: Banner) => {
    setSelectedBanner(banner)
    setIsBottomSheetOpen(true)
  }

  const closeBottomSheet = () => {
    setIsBottomSheetOpen(false)
    setTimeout(() => {
      setSelectedBanner(null)
    }, 350)
  }

  const handleActivateMissionFromBS = () => {
    if (selectedBanner) {
      const bannerId = selectedBanner.id
      const isAlreadyActivated = isMissionActivated(bannerId)
      
      setIsBottomSheetOpen(false)
      
      if (isAlreadyActivated) {
        setTimeout(() => {
          setSelectedBanner(null)
        }, 350)
        return
      }
      
      // Atualiza o estado imediatamente para o banner mudar
      setActivatedMissions(prev => ({
        ...prev,
        [bannerId]: { current: 0, target: 100 }
      }))
      setShowToast(true)
      
      setTimeout(() => {
        setSelectedBanner(null)
      }, 350)
    }
  }

  // Auto-play: inicia quando o componente monta
  useEffect(() => {
    bannerCountRef.current = banners.length
    startBannerAutoPlay({ autoPlayRef, bannerCountRef, scrollRef })

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [banners.length])

  // Atualiza o tempo do jogo ao vivo a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMatchTime(prev => updateMatchTime(prev))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Pausa o auto-play durante o drag
  const pauseAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = null
    }
  }

  // Reinicia o auto-play após interação manual - reseta completamente o timer
  const resetAutoPlay = () => {
    // Primeiro limpa qualquer intervalo existente
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current)
      autoPlayRef.current = null
    }
    // Inicia um novo ciclo de autoplay
    startBannerAutoPlay({ autoPlayRef, bannerCountRef, scrollRef })
  }

  const handleScroll = () => {
    if (scrollRef.current) {
      const currentScrollLeft = scrollRef.current.scrollLeft
      const cardWidth = scrollRef.current.offsetWidth - 24 + 20
      const newIndex = Math.round(currentScrollLeft / cardWidth)
      setActiveIndex(Math.min(newIndex, banners.length - 1))
    }
  }

  // Centraliza no banner mais próximo com sensibilidade ao arraste
  const snapToNearestBanner = (dragDelta: number = 0) => {
    if (!scrollRef.current) return
    const cardWidth = scrollRef.current.offsetWidth - 24 + 20
    const currentScroll = scrollRef.current.scrollLeft
    const currentIndex = currentScroll / cardWidth
    
    let targetIndex: number
    // Se arrastou mais que 30px, muda para o próximo/anterior
    if (dragDelta > 30) {
      targetIndex = Math.ceil(currentIndex)
    } else if (dragDelta < -30) {
      targetIndex = Math.floor(currentIndex)
    } else {
      targetIndex = Math.round(currentIndex)
    }
    
    // Limita ao range válido
    const maxIndex = Math.max(0, Math.ceil((scrollRef.current.scrollWidth - scrollRef.current.clientWidth) / cardWidth))
    targetIndex = Math.max(0, Math.min(targetIndex, maxIndex))
    
    const targetScroll = targetIndex * cardWidth
    
    scrollRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
  }

  // Drag to scroll para mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    pauseAutoPlay()
    dragDistance.current = 0
    startX.current = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    const delta = dragDistance.current
    setIsDragging(false)
    snapToNearestBanner(delta)
    resetAutoPlay()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.5
    dragDistance.current = -walk // Negativo porque walk é invertido
    scrollRef.current.scrollLeft = scrollLeft.current - walk
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      const delta = dragDistance.current
      setIsDragging(false)
      snapToNearestBanner(delta)
      resetAutoPlay()
    }
  }

  // Touch events para mobile
  const handleTouchStart = () => {
    pauseAutoPlay()
    dragDistance.current = 0
    touchStartScrollLeft.current = scrollRef.current?.scrollLeft ?? 0
  }

  const handleTouchEnd = () => {
    dragDistance.current = (scrollRef.current?.scrollLeft ?? 0) - touchStartScrollLeft.current
    // Aguarda o scroll terminar antes de reiniciar o autoplay
    setTimeout(() => {
    resetAutoPlay()
    }, 300)
  }

  const handleBannerClick = (banner: Banner) => {
    if (!banner.casinoGameId || Math.abs(dragDistance.current) > 8) return

    onBannerClick?.(banner)
  }

  const handleBannerKeyDown = (event: KeyboardEvent<HTMLDivElement>, banner: Banner) => {
    if (!banner.casinoGameId || !onBannerClick) return
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    onBannerClick(banner)
  }
  const getBannerOddButtonProps = (
    banner: Banner,
    groupId: string,
    outcomeId: string,
    className: string,
    label: ReactNode,
    value: ReactNode
  ) => {
    const matchTeams = getBannerMatchTeams(banner)
    const { homeTeam, awayTeam } = matchTeams
    const isLive = banner.type === 'aoVivo' || banner.type === 'aoVivoTenis'
    const marketInfo = getBannerMarketInfo(banner, groupId)
    const aumentadaDetails = groupId === 'boosted' ? getBannerAumentadaDetails(banner) : null
    const marketId = aumentadaDetails?.marketLabel ?? marketInfo.marketId
    const marketLabel = aumentadaDetails?.marketLabel ?? marketInfo.marketLabel
    const labelText = getReactNodeText(label)
    const selectionLabel = aumentadaDetails?.playerName ?? labelText
    const eventTimeLabel = getBannerLiveTimeLabel(banner, liveMatchTime)

    return getOddButtonProps(
      `banner:${banner.id}:${marketId}:${outcomeId}`,
      `banner:${banner.id}:${marketId}`,
      className,
      createBetslipSelection({
        eventId: getBannerBetslipEventId(banner),
        marketId,
        outcomeId,
        label: aumentadaDetails?.label ?? label,
        selectionLabel,
        odd: value,
        marketLabel,
        eventStatus: isLive ? 'live' : 'prematch',
        selectionType: aumentadaDetails
          ? 'player'
          : selectionLabel === homeTeam || selectionLabel === awayTeam ? 'team' : 'market',
        sport: getBannerSport(banner),
        homeTeam,
        awayTeam,
        eventName: getBannerEventName(banner, matchTeams),
        eventTimeLabel,
        liveClock: isLive ? eventTimeLabel : undefined,
        homeScore: banner.tennisMatch?.player1.games ?? banner.liveMatch?.homeTeam.score,
        awayScore: banner.tennisMatch?.player2.games ?? banner.liveMatch?.awayTeam.score,
        homeTeamIcon: getBannerHomeTeamIcon(banner),
        awayTeamIcon: getBannerAwayTeamIcon(banner),
        selectionIcon: aumentadaDetails ? undefined : getBannerOutcomeIcon(banner, outcomeId, label),
        playerName: aumentadaDetails?.playerName,
        playerImage: aumentadaDetails?.playerName === 'Pedro' ? pedroProps : undefined,
        badgeType: 'boost',
      })
    )
  }

  const getBannerComboBetslipEntries = (banner: Banner): BannerBetslipEntry[] => {
    if (banner.type !== 'combinada' || !banner.comboStats?.length || !banner.oddBoosted) return []

    const oddBoosted = banner.oddBoosted
    const matchTeams = getBannerMatchTeams(banner)
    const { homeTeam, awayTeam } = matchTeams
    const eventId = getBannerBetslipEventId(banner)
    const comboId = `banner-${banner.id}-combo`
    const comboLegCount = banner.comboStats.length
    const comboProps = {
      comboId,
      comboTitle: banner.title,
      comboTypeLabel: banner.title,
      comboTotalOddLabel: oddBoosted.new,
      comboLegCount,
    }

    return banner.comboStats.map((stat, index) => {
      const selectionLabel = expandBannerComboStatValue(stat.value, matchTeams)
      const marketId = `${stat.label}-${selectionLabel}-${index}`
      const selection = createBetslipSelection({
        eventId,
        marketId,
        outcomeId: `combo-${index}-${selectionLabel}`,
        label: selectionLabel,
        selectionLabel,
        odd: oddBoosted.new,
        marketLabel: stat.label,
        eventStatus: 'prematch',
        selectionType: selectionLabel === homeTeam || selectionLabel === awayTeam ? 'team' : 'market',
        sport: getBannerSport(banner),
        homeTeam,
        awayTeam,
        eventName: getBannerEventName(banner, matchTeams),
        eventTimeLabel: banner.headerLeft,
        homeTeamIcon: getBannerHomeTeamIcon(banner),
        awayTeamIcon: getBannerAwayTeamIcon(banner),
        badgeType: 'boost',
        comboLegIndex: index,
        ...comboProps,
      })

      return selection ? {
        groupId: getBetslipMarketGroupId({ eventId: selection.eventId, marketId: selection.marketId }),
        selection,
      } : undefined
    }).filter(isBannerBetslipEntry)
  }

  const getBannerComboOddButtonProps = (banner: Banner) => {
    const comboEntries = getBannerComboBetslipEntries(banner)
    const selectedSelectionIds = new Set(Object.values(selectedSelectionIdsByGroup))
    const isSelected = comboEntries.length > 0 && comboEntries.every(({ selection }) => selectedSelectionIds.has(selection.id))

    return {
      type: 'button' as const,
      className: `banner-card__combinada-btn${isSelected ? ' odd-button--selected' : ''}`,
      'aria-pressed': isSelected,
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation()
        window.dispatchEvent(new CustomEvent(BETSLIP_ODD_INTERACTION_EVENT))
        toggleSelections(comboEntries)
      },
    }
  }
  const renderBannerOddButton = (
    banner: Banner,
    groupId: string,
    outcomeId: string,
    className: string,
    labelClassName: string,
    valueClassName: string,
    label: ReactNode,
    value: ReactNode
  ) => (
    <button key={`banner:${banner.id}:${groupId}:${outcomeId}`} {...getBannerOddButtonProps(banner, groupId, outcomeId, className, label, value)}>
      <span className={labelClassName}>{label}</span>
      <span className={valueClassName}>{value}</span>
    </button>
  )

  return (
    <div className="banner-carousel">
      <div 
        className={`banner-carousel__list ${isDragging ? 'banner-carousel__list--dragging' : ''}`}
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {banners.map((banner) => {
          const isClickableBanner = !!banner.casinoGameId && !!onBannerClick

          return (
          <div
            key={banner.id}
            className={`banner-card${isClickableBanner ? ' banner-card--clickable' : ''}`}
            role={isClickableBanner ? 'button' : undefined}
            tabIndex={isClickableBanner ? 0 : undefined}
            onClick={() => handleBannerClick(banner)}
            onKeyDown={(event) => handleBannerKeyDown(event, banner)}
          >
            {/* Header */}
            <div className="banner-card__header">
              {banner.type === 'aoVivo' || banner.type === 'aoVivoTenis' ? (
                <>
                  <div className="banner-card__header-left-live">
                    <div className="banner-card__tag-aovivo">
                      <div className="banner-card__tag-icon-wrapper">
                        <img src={iconAoVivo} alt="" className="banner-card__tag-icon" />
                      </div>
                      <span>Ao Vivo</span>
                    </div>
                    {banner.type === 'aoVivoTenis' ? (
                      <>
                        <span className="banner-card__match-time">{banner.tennisMatch?.currentSet}</span>
                        <span className="banner-card__header-dot" />
                        <span className="banner-card__match-time">{banner.tennisMatch?.setScore}</span>
                      </>
                    ) : (
                      <span className="banner-card__match-time">{liveMatchTime}</span>
                    )}
                  </div>
                  <span className="banner-card__header-right-text">{banner.headerRight}</span>
                </>
              ) : (
                <>
              <span className="banner-card__header-left">{banner.headerLeft}</span>
              <div className="banner-card__header-right">
                {banner.showTimer && <span className="banner-card__timer-dot" />}
                <span>{banner.headerRight}</span>
              </div>
                </>
              )}
            </div>

            {/* Content */}
            <div 
              className={`banner-card__content ${banner.type === 'aoVivo' || banner.type === 'aoVivoTenis' ? 'banner-card__content--live' : ''}`}
              style={{ backgroundImage: `url(${banner.background})` }}
            >
              {/* Ao Vivo Tennis Content */}
              {banner.type === 'aoVivoTenis' && banner.tennisMatch && (
                <div className="banner-card__live-content">
                  <div className="banner-card__tennis-scores">
                    <div className="banner-card__tennis-player">
                      <div className="banner-card__tennis-score-group">
                        <div className="banner-card__tennis-score-box banner-card__tennis-score-box--filled">
                          {banner.tennisMatch.player1.isServing && (
                            <img src={iconTenis} alt="" className="banner-card__tennis-serve" />
                          )}
                          <span>{banner.tennisMatch.player1.games}</span>
                        </div>
                        <div className="banner-card__tennis-score-box">
                          <span>{banner.tennisMatch.player1.points}</span>
                        </div>
                      </div>
                      <span className="banner-card__tennis-dot" />
                      {banner.tennisMatch.player1.flag && (
                        <img src={banner.tennisMatch.player1.flag} alt="" className="banner-card__tennis-flag" />
                      )}
                      <span className="banner-card__tennis-player-name">{banner.tennisMatch.player1.name}</span>
                    </div>
                    <div className="banner-card__tennis-player">
                      <div className="banner-card__tennis-score-group">
                        <div className="banner-card__tennis-score-box banner-card__tennis-score-box--filled">
                          {banner.tennisMatch.player2.isServing && (
                            <img src={iconTenis} alt="" className="banner-card__tennis-serve" />
                          )}
                          <span>{banner.tennisMatch.player2.games}</span>
                        </div>
                        <div className="banner-card__tennis-score-box">
                          <span>{banner.tennisMatch.player2.points}</span>
                        </div>
                      </div>
                      <span className="banner-card__tennis-dot" />
                      {banner.tennisMatch.player2.flag && (
                        <img src={banner.tennisMatch.player2.flag} alt="" className="banner-card__tennis-flag" />
                      )}
                      <span className="banner-card__tennis-player-name">{banner.tennisMatch.player2.name}</span>
                    </div>
                  </div>
                  <div className="banner-card__live-odds">
                    {renderBannerOddButton(banner, 'tennis-live', 'player-1', 'banner-card__live-odd-btn', 'banner-card__live-odd-team', 'banner-card__live-odd-value', banner.tennisMatch.player1.name, banner.tennisMatch.odds.player1)}
                    {renderBannerOddButton(banner, 'tennis-live', 'player-2', 'banner-card__live-odd-btn', 'banner-card__live-odd-team', 'banner-card__live-odd-value', banner.tennisMatch.player2.name, banner.tennisMatch.odds.player2)}
                  </div>
                </div>
              )}

              {/* Ao Vivo Content */}
              {banner.type === 'aoVivo' && banner.liveMatch && (
                <div className="banner-card__live-content">
                  <div className="banner-card__live-scores">
                    <div className="banner-card__live-team">
                      <span className="banner-card__live-score">{banner.liveMatch.homeTeam.score}</span>
                      <span className="banner-card__live-dot" />
                      <TeamLogo
                        teamName={banner.liveMatch.homeTeam.name}
                        currentLogo={banner.liveMatch.homeTeam.badge}
                        sport="basquete"
                        className="banner-card__live-badge"
                        fallbackClassName="banner-card__live-badge--sport"
                        placeholderClassName="banner-card__live-badge banner-card__live-badge--placeholder"
                      />
                      <span className="banner-card__live-team-name">{banner.liveMatch.homeTeam.name}</span>
                    </div>
                    <div className="banner-card__live-team">
                      <span className="banner-card__live-score">{banner.liveMatch.awayTeam.score}</span>
                      <span className="banner-card__live-dot" />
                      <TeamLogo
                        teamName={banner.liveMatch.awayTeam.name}
                        currentLogo={banner.liveMatch.awayTeam.badge}
                        sport="basquete"
                        className="banner-card__live-badge"
                        fallbackClassName="banner-card__live-badge--sport"
                        placeholderClassName="banner-card__live-badge banner-card__live-badge--placeholder"
                      />
                      <span className="banner-card__live-team-name">{banner.liveMatch.awayTeam.name}</span>
                    </div>
                  </div>
                  <div className="banner-card__live-odds">
                    {renderBannerOddButton(banner, 'live', 'home', 'banner-card__live-odd-btn', 'banner-card__live-odd-team', 'banner-card__live-odd-value', banner.liveMatch.homeTeam.name, banner.liveMatch.odds.home)}
                    {banner.liveMatch.odds.draw && (
                      renderBannerOddButton(banner, 'live', 'draw', 'banner-card__live-odd-btn', 'banner-card__live-odd-team', 'banner-card__live-odd-value', 'Empate', banner.liveMatch.odds.draw)
                    )}
                    {renderBannerOddButton(banner, 'live', 'away', 'banner-card__live-odd-btn', 'banner-card__live-odd-team', 'banner-card__live-odd-value', banner.liveMatch.awayTeam.name, banner.liveMatch.odds.away)}
                  </div>
                </div>
              )}

              {/* Combinada Content */}
              {banner.type === 'combinada' && banner.comboStats && (
                <div className="banner-card__combinada">
                  <div className="banner-card__combinada-text">
                    <div className="banner-card__combinada-title">
                      <img src={iconSuperCombinada} alt="" className="banner-card__combinada-icon" />
                      <span>{banner.title}</span>
                    </div>
                    <div className="banner-card__combinada-stats">
                      {banner.comboStats.map((stat, i) => (
                        <div key={i} className="banner-card__combinada-stat">
                          <span className="banner-card__combinada-stat-value">{stat.value}</span>
                          <span className="banner-card__combinada-stat-dot"> - </span>
                          <span className="banner-card__combinada-stat-label">{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {banner.oddBoosted && (
                    <button {...getBannerComboOddButtonProps(banner)}>
                      <span className="banner-card__combinada-old-odd">{banner.oddBoosted.old}</span>
                      <img src={iconBoostWhite} alt="" className="banner-card__combinada-arrow" />
                      <span className="banner-card__combinada-new-odd">{banner.oddBoosted.new}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Regular Content */}
              {!banner.hideContent && banner.type !== 'aoVivo' && banner.type !== 'aoVivoTenis' && banner.type !== 'combinada' && (
              <div className={`banner-card__info ${banner.odds ? 'banner-card__info--full' : ''}`}>

                {/* Times com escudo (1x2) */}
                {banner.type === '1x2' && banner.odds ? (
                  <div className="banner-card__teams">
                    {banner.odds.filter(o => o.badge).map((odd, i) => (
                      <div key={i} className="banner-card__live-team">
                        <TeamLogo
                          teamName={odd.team}
                          currentLogo={odd.badge}
                          sport="futebol"
                          className="banner-card__live-badge"
                          fallbackClassName="banner-card__live-badge--sport"
                          placeholderClassName="banner-card__live-badge banner-card__live-badge--placeholder"
                        />
                        <span className="banner-card__live-team-name">{odd.team}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="banner-card__text">
                  <h3
                    className={[
                      'banner-card__title',
                      ['aumentada', 'virtuais'].includes(banner.type) ? 'banner-card__title--aumentada' : '',
                      banner.noWrapTitle ? 'banner-card__title--nowrap' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {banner.type === 'aumentada' && (
                      <img src={iconAumentada} alt="" className="banner-card__boost-icon" />
                    )}
                    {banner.title}
                  </h3>
                  <p className="banner-card__description">
                    {banner.description.split('\n').map((line, i) => (
                      <span key={i}>{line}<br /></span>
                    ))}
                  </p>
                </div>
                )}

                {/* Botões padrão */}
                {banner.buttonText && (
                  <div className="banner-card__buttons">
                    {banner.type === 'missao' && isMissionActivated(banner.id) ? (
                      <button 
                        className="banner-card__btn-activated"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenMissionInfo(banner)
                        }}
                      >
                        <div className="banner-card__btn-activated-left">
                          <img src={iconAtivo} alt="" className="banner-card__btn-activated-icon" />
                          <span>Acompanhar</span>
                        </div>
                        <div className="banner-card__btn-activated-divider" />
                        <div className="banner-card__btn-activated-right">
                          <span className="banner-card__btn-activated-label">Progresso</span>
                          <span className="banner-card__btn-activated-value">
                            R${getMissionProgress(banner.id)?.current || 0} de R${getMissionProgress(banner.id)?.target || 100}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <>
                        <button 
                          className="banner-card__btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (banner.type === 'missao') {
                              handleActivateMission(banner.id, 100)
                            }
                          }}
                        >
                          {banner.buttonText}
                        </button>
                        {banner.showInfoBtn && (
                          <button 
                            className="banner-card__btn banner-card__btn--icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (banner.type === 'missao') {
                                handleOpenMissionInfo(banner)
                              }
                            }}
                          >
                            <img src={iconSaibaMais} alt="Saiba mais" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Odds 1x2 */}
                {banner.odds && (
                  <div className="banner-card__odds">
                    {banner.odds.map((odd, i) => (
                      renderBannerOddButton(banner, 'regular', `${odd.team}-${i}`, 'banner-card__odd-btn', 'banner-card__odd-team', 'banner-card__odd-value', odd.team, odd.value)
                    ))}
                  </div>
                )}

                {/* Odd aumentada */}
                {banner.oddBoosted && (
                  <button {...getBannerOddButtonProps(banner, 'boosted', 'boosted', 'banner-card__boosted-btn', banner.title, banner.oddBoosted.new)}>
                    <span className="banner-card__old-odd">{banner.oddBoosted.old}</span>
                    <img src={iconBoostWhite} alt="" className="banner-card__arrow" />
                    <span className="banner-card__new-odd">{banner.oddBoosted.new}</span>
                  </button>
                )}
              </div>
              )}
            </div>
          </div>
          )
        })}
      </div>

      {/* Bullets */}
      <div className="banner-carousel__bullets">
        {banners.map((_, index) => (
          <span 
            key={index} 
            className={`banner-carousel__bullet ${index === activeIndex ? 'banner-carousel__bullet--active' : ''}`}
          >
            {index === activeIndex && (
              <span 
                key={activeIndex}
                className="banner-carousel__bullet-progress" 
              />
            )}
          </span>
        ))}
      </div>

      {/* Success Toast */}
      <Toast
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        title="Missão Ativada"
        message="Cumpra os objetivos para ganhar o seu bônus!"
      />

      {/* Mission Bottom Sheet */}
      {selectedBanner && selectedBanner.type === 'missao' && (
        <BottomSheet
          isOpen={isBottomSheetOpen}
          onClose={closeBottomSheet}
          title={selectedBanner.title}
          titleIcon={imgMissaoRodadaGratis}
          footerContent={
            <button className="bottom-sheet__btn-primary" onClick={handleActivateMissionFromBS}>
              <span>{isMissionActivated(selectedBanner.id) ? 'Jogar' : 'Ativar Missão'}</span>
            </button>
          }
        >
          {/* Mission Description */}
          <p className="mission-description">{selectedBanner.description}</p>

          {/* Mission Box */}
          <div className="mission-box">
            <div className="mission-box__header">
              <MissionTimer text={selectedBanner.headerRight} />
            </div>
            <div className="mission-box__content">
              {isMissionActivated(selectedBanner.id) && (
                <div className="mission-progress">
                  <div className="mission-progress__header">
                    <span className="mission-progress__label">Progresso:</span>
                    <span className="mission-progress__value">
                      R${getMissionProgress(selectedBanner.id)?.current || 0} de R${getMissionProgress(selectedBanner.id)?.target || 100}
                    </span>
                  </div>
                  <div className="mission-progress__bar">
                    <div 
                      className="mission-progress__fill"
                      style={{ 
                        width: `${((getMissionProgress(selectedBanner.id)?.current || 0) / (getMissionProgress(selectedBanner.id)?.target || 100)) * 100}%` 
                      }}
                    />
                    <div 
                      className="mission-progress__dot"
                      style={{ 
                        left: `${((getMissionProgress(selectedBanner.id)?.current || 0) / (getMissionProgress(selectedBanner.id)?.target || 100)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              )}
              <p className="mission-box__title">Objetivos da missão</p>
              <MissionObjective text="Apostar R$100 no jogo SpaceMan" />
            </div>
          </div>

          {/* Mission Info Section */}
          <div className="mission-info-section">
            <div className="mission-info-header">
              <span className="mission-info-header__title">Informações sobre a Missão</span>
              <CaretUpIcon aria-hidden="true" className="mission-info-header__icon" weight="bold" />
            </div>
            <div className="mission-info-rows">
              <MissionInfoRow label="Tipo de Aposta" value="Jogo Crash" />
              <MissionInfoRow label="Valor Mínimo por Aposta" value="Pelo menos R$100" />
              <MissionInfoRow label="Valor do Bônus" value="40" />
              <MissionInfoRow label="Forma de Recebimento" value="Giros Grátis" />
              <MissionInfoRow label="Validade do Bônus" value="7 dias após o recebimento" />
            </div>

            {/* FAQ Section */}
            <div className="mission-faq">
              <MissionFaqItem question="Como posso participar da missão" />
              <MissionFaqItem question="Preciso ativar a missão para participar?" />
              <MissionFaqItem question="Quais jogos participam da promoção?" />
              <MissionFaqItem question="Quando recebo meu bônus?" />
              <MissionFaqItem question="Posso acumular essa missão com outras?" />
              <MissionFaqItem question="Termos e Condições" />
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
