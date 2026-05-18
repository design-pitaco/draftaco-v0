import { Fragment, useCallback, useRef, useState, useLayoutEffect, useMemo, type ComponentType, type ReactNode } from 'react'
import { Header } from '../../components/Header'
import { TrilhoEBanner } from '../../components/TrilhoEBanner'
import { PromotionSection } from '../../components/PromotionSection'
import { OffersSection } from '../../components/OffersSection'
import { LiveSection } from '../../components/LiveSection'
import { PreMatchSection } from '../../components/PreMatchSection'
import { TreasureSection } from '../../components/TreasureSection'
import { CalendarSection, getCalendarDisplayedEvents } from '../../components/CalendarSection'
import { SportsMatchCarousel } from '../../components/SportsMatchCarousel'
import { CompetitionPage } from '../../components/CompetitionPage'
import { SportRail } from '../../components/SportRail'
import { CasinoRail } from '../../components/CasinoRail'
import { CasinoContent, casinoCarouselSections } from '../../components/CasinoContent'
import { LiveEventPage } from '../LiveEventPage'
import { CasinoGamePage } from '../CasinoGamePage'
import { casinoBanners, casinoPromotions, sportsPromotions } from '../../data/homeProducts'
import type { LiveEventOpenPayload } from '../LiveEventPage'
import type { CasinoGameOpenPayload } from '../../components/CasinoContent'
import type { Banner, CasinoCategoryId, ProductMode } from '../../types/home'
import type { CompetitionLinkTarget } from '../../utils/competitionNavigation'
import './Home.css'

const HEADER_COMPACT_SCROLL_TOP = 28
const HEADER_EXPAND_SCROLL_TOP = 4
const HEADER_MORPH_SCROLL_START = 64
const HEADER_EVENT_RAIL_MORPH_SCROLL_START = 0
const HEADER_MORPH_SCROLL_END = 190
const HEADER_COMPETITION_MORPH_SCROLL_END = 112
const HEADER_SNAP_IDLE_MS = 160
const HEADER_SNAP_SETTLE_MS = 420
const HEADER_CONTENT_GAP = 24
const EVENT_RAIL_HEIGHT = 112
const EVENT_RAIL_PADDING_BOTTOM = 24
const EVENT_RAIL_COLLAPSE_TRANSLATE_Y = -28
const EVENT_RAIL_VISUAL_COLLAPSE_SCROLL_END = 72
const EVENT_RAIL_DISABLE_INTERACTION_PROGRESS = 0.9
const HEADER_TOP_EXPANDED_PADDING_Y = 20
const HEADER_TOP_COMPACT_PADDING_Y = 12
const SPORT_RAIL_EXPANDED_PADDING_BOTTOM = 24
const SPORT_RAIL_COMPACT_PADDING_BOTTOM = 10
const SPORTS_CAROUSEL_EXPANDED_TEAMS_GAP = 4
const SPORTS_CAROUSEL_COMPACT_TEAMS_GAP = 3
const SPORTS_CAROUSEL_EXPANDED_TEAMS_MIN_HEIGHT = 40
const SPORTS_CAROUSEL_COMPACT_TEAMS_MIN_HEIGHT = 34
const SPORTS_CAROUSEL_EXPANDED_TEAM_ROW_HEIGHT = 13
const SPORTS_CAROUSEL_COMPACT_TEAM_ROW_HEIGHT = 12
const MARKET_STICKY_GAP = 12
const MARKET_STICKY_ROW_HEIGHT = 24
const MARKET_STICKY_BG_GAP = 16
const HEADER_BG_TOP_OFFSET = 72
const HIGHLIGHT_HEADER_SCROLLED_BG_HEIGHT = 210

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const smoothStep = (value: number) => value * value * (3 - 2 * value)
const roundCssNumber = (value: number) => Math.round(value * 1000) / 1000
const getScrollProgress = (scrollTop: number, start: number, end: number) =>
  clamp((scrollTop - start) / (end - start), 0, 1)
const interpolate = (from: number, to: number, progress: number) => from + (to - from) * progress
const marketStickySelector = [
  '.live-section__chips--sticky:not([data-market-sticky-visible="false"])',
  '.prematch-section__chips--sticky:not([data-market-sticky-visible="false"])',
].join(', ')

const SPORT_HEADER_EXPANDED_BG_HEIGHT_SHORTCUT = 210
const SPORT_HEADER_COMPACT_BG_HEIGHT_SHORTCUT = 182
const SHOW_TOP_GAMES_RAIL = false

interface HeaderComponentProps {
  activeProduct?: ProductMode
  activeSport?: string | null
  rail?: ReactNode
  onProductChange?: (product: ProductMode) => void
  children?: ReactNode
}

interface HomeProps {
  activeProduct?: ProductMode
  HeaderComponent?: ComponentType<HeaderComponentProps>
  isV2?: boolean
  onProductChange?: (product: ProductMode) => void
  onLiveEventOpenChange?: (isOpen: boolean) => void
  onLiveEventOpenSettled?: () => void
  onLiveEventCloseStart?: () => void
}

export function Home({
  activeProduct = 'apostas',
  HeaderComponent = Header,
  isV2 = false,
  onProductChange,
  onLiveEventOpenChange,
  onLiveEventOpenSettled,
  onLiveEventCloseStart,
}: HomeProps = {}) {
  const homeRef = useRef<HTMLDivElement>(null)
  const previousProductRef = useRef(activeProduct)
  const sportHeaderExpandedBgHeight = SPORT_HEADER_EXPANDED_BG_HEIGHT_SHORTCUT
  const sportHeaderCompactBgHeight = SPORT_HEADER_COMPACT_BG_HEIGHT_SHORTCUT
  const [activeSport, setActiveSport] = useState<string | null>(null)
  const [activeCasinoCategory, setActiveCasinoCategory] = useState<CasinoCategoryId>('destaques')
  const [isSportHeaderCompact, setIsSportHeaderCompact] = useState(false)
  const [isSportsMatchCarouselCollapsed, setIsSportsMatchCarouselCollapsed] = useState(false)
  const [contentResetKey, setContentResetKey] = useState(0)
  const [selectedCompetition, setSelectedCompetition] = useState<{ id: string; name: string } | null>(null)
  const [extraRailCompetitions, setExtraRailCompetitions] = useState<CompetitionLinkTarget[]>([])
  const [selectedLiveMatch, setSelectedLiveMatch] = useState<LiveEventOpenPayload | null>(null)
  const [selectedCasinoGame, setSelectedCasinoGame] = useState<CasinoGameOpenPayload | null>(null)
  const isBetsProduct = activeProduct === 'apostas'
  const isCasinoCrashPage = !isBetsProduct && activeCasinoCategory === 'crash'
  const displayActiveSport = isBetsProduct ? activeSport : null
  const sportsCarouselEvents = useMemo(
    () => isBetsProduct && activeSport
      ? getCalendarDisplayedEvents({
          sportFilter: activeSport,
          competitionId: selectedCompetition?.id ?? null,
        })
      : [],
    [activeSport, isBetsProduct, selectedCompetition?.id]
  )
  const sportsCarouselResetKey = `${activeSport ?? 'destaques'}:${selectedCompetition?.id ?? 'todas'}`
  const isCompetitionMode = isBetsProduct && !!selectedCompetition
  const hasSportsCarouselEvents = isBetsProduct && !!activeSport && sportsCarouselEvents.length > 0
  const shouldRenderTopGamesRail = SHOW_TOP_GAMES_RAIL && hasSportsCarouselEvents
  const usesContentEventRail = shouldRenderTopGamesRail
  const usesHeaderEventRail = shouldRenderTopGamesRail && !usesContentEventRail
  const shouldHideBetsBanner = isBetsProduct && !!displayActiveSport

  const handleLiveMatchClick = useCallback((payload: LiveEventOpenPayload) => {
    onLiveEventOpenChange?.(true)
    setSelectedLiveMatch(payload)
  }, [onLiveEventOpenChange])

  const handleLiveEventClose = useCallback(() => {
    setSelectedLiveMatch(null)
    onLiveEventOpenChange?.(false)
  }, [onLiveEventOpenChange])

  const handleLiveEventCloseStart = useCallback(() => {
    onLiveEventCloseStart?.()
  }, [onLiveEventCloseStart])

  const handleCasinoGameOpen = (payload: CasinoGameOpenPayload) => {
    setSelectedCasinoGame(payload)
  }

  const handleCasinoBannerClick = (banner: Banner) => {
    if (!banner.casinoGameId) return

    const popularSection = casinoCarouselSections.find((section) => section.id === '10-mais-populares')
    const selectedIndex = popularSection?.games.findIndex((game) => game.id === banner.casinoGameId) ?? -1

    if (!popularSection || selectedIndex < 0) return

    handleCasinoGameOpen({ section: popularSection, selectedIndex })
  }

  const syncCurrentHeaderContentPaddingTop = useCallback(() => {
    const homeEl = homeRef.current
    const headerEl = homeEl?.querySelector<HTMLElement>('.header')
    const headerContentEndEl =
      headerEl?.querySelector<HTMLElement>('.sport-rail__list') ??
      headerEl?.querySelector<HTMLElement>('.sport-rail') ??
      headerEl?.querySelector<HTMLElement>('.header__top')

    if (!homeEl || !headerContentEndEl) return

    const contentOffset = headerContentEndEl.getBoundingClientRect().bottom -
      homeEl.getBoundingClientRect().top +
      HEADER_CONTENT_GAP

    homeEl.style.setProperty(
      '--home-header-content-padding-top',
      `${roundCssNumber(Math.max(contentOffset, 0))}px`
    )
  }, [])

  const resetEventRailCollapse = useCallback(() => {
    const homeEl = homeRef.current
    if (!homeEl) return

    homeEl.style.setProperty('--sports-carousel-collapse-max-height', `${EVENT_RAIL_HEIGHT}px`)
    homeEl.style.setProperty('--sports-carousel-collapse-padding-bottom', `${EVENT_RAIL_PADDING_BOTTOM}px`)
    homeEl.style.setProperty('--sports-carousel-collapse-opacity', '1')
    homeEl.style.setProperty('--sports-carousel-collapse-translate-y', '0px')
    homeEl.style.removeProperty('--highlight-header-bg-height')
    homeEl.style.removeProperty('--header-top-padding-y')
    homeEl.style.removeProperty('--sport-header-bg-height')
    homeEl.style.removeProperty('--sport-rail-padding-bottom')
    homeEl.removeAttribute('data-header-morph-complete')
    homeEl.style.removeProperty('--sports-carousel-teams-gap')
    homeEl.style.removeProperty('--sports-carousel-teams-min-height')
    homeEl.style.removeProperty('--sports-carousel-team-row-height')
    syncCurrentHeaderContentPaddingTop()
  }, [syncCurrentHeaderContentPaddingTop])

  const scrollToTop = useCallback(() => {
    setIsSportHeaderCompact(false)
    setIsSportsMatchCarouselCollapsed(false)
    resetEventRailCollapse()

    window.requestAnimationFrame(() => {
      homeRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      syncCurrentHeaderContentPaddingTop()
    })
  }, [resetEventRailCollapse, syncCurrentHeaderContentPaddingTop])

  useLayoutEffect(() => {
    if (previousProductRef.current === activeProduct) return

    previousProductRef.current = activeProduct
    const timer = window.setTimeout(() => {
      setActiveSport(null)
      setSelectedCompetition(null)
      setSelectedLiveMatch(null)
      setSelectedCasinoGame(null)
      setActiveCasinoCategory('destaques')
      scrollToTop()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [activeProduct, scrollToTop])

  useLayoutEffect(() => {
    onLiveEventOpenChange?.(!!selectedLiveMatch)
  }, [onLiveEventOpenChange, selectedLiveMatch])

  useLayoutEffect(() => () => {
    onLiveEventOpenChange?.(false)
  }, [onLiveEventOpenChange])

  useLayoutEffect(() => {
    const homeEl = homeRef.current
    if (!homeEl) return

    const getScrollTop = () =>
      Math.max(
        homeEl.scrollTop,
        window.scrollY,
        document.documentElement.scrollTop,
        document.body.scrollTop
      )

    let frame: number | null = null
    let headerSnapTimer: number | null = null
    let headerSnapSettleTimer: number | null = null
    let isHeaderSnapScrolling = false
    const headerEl = homeEl.querySelector<HTMLElement>('.header')

    const clearHeaderSnapTimer = () => {
      if (headerSnapTimer === null) return
      window.clearTimeout(headerSnapTimer)
      headerSnapTimer = null
    }

    const clearHeaderSnapSettleTimer = () => {
      if (headerSnapSettleTimer === null) return
      window.clearTimeout(headerSnapSettleTimer)
      headerSnapSettleTimer = null
    }

    const hasEventRailHeader = () => !!activeSport && shouldRenderTopGamesRail && !usesContentEventRail
    const canSnapHeaderMorph = () => {
      if (!activeSport) return false
      if (usesContentEventRail) return true
      return !activeSport || hasEventRailHeader()
    }
    const getHeaderMorphScrollStart = () => {
      if (usesContentEventRail) return HEADER_EVENT_RAIL_MORPH_SCROLL_START
      if (hasEventRailHeader()) return HEADER_EVENT_RAIL_MORPH_SCROLL_START
      return HEADER_MORPH_SCROLL_START
    }
    const getHeaderMorphScrollEnd = () => {
      if (isCompetitionMode) return HEADER_COMPETITION_MORPH_SCROLL_END
      return HEADER_MORPH_SCROLL_END
    }

    const scrollToHeaderMorphTarget = (targetScrollTop: number) => {
      homeEl.scrollTo({ top: targetScrollTop, left: 0, behavior: 'smooth' })
      window.scrollTo({ top: targetScrollTop, left: 0, behavior: 'smooth' })
    }

    const scheduleHeaderMorphSnap = () => {
      clearHeaderSnapTimer()

      if (!canSnapHeaderMorph()) return

      headerSnapTimer = window.setTimeout(() => {
        headerSnapTimer = null

        if (!canSnapHeaderMorph()) return

        const scrollTop = getScrollTop()
        const morphProgress = getScrollProgress(
          scrollTop,
          getHeaderMorphScrollStart(),
          getHeaderMorphScrollEnd()
        )

        if (morphProgress <= 0 || morphProgress >= 1) return

        const targetScrollTop = getHeaderMorphScrollEnd()

        if (Math.abs(scrollTop - targetScrollTop) < 1) return

        isHeaderSnapScrolling = true
        clearHeaderSnapSettleTimer()
        scrollToHeaderMorphTarget(targetScrollTop)

        headerSnapSettleTimer = window.setTimeout(() => {
          headerSnapSettleTimer = null
          isHeaderSnapScrolling = false
          scheduleUpdate()
          scheduleHeaderMorphSnap()
        }, HEADER_SNAP_SETTLE_MS)
      }, HEADER_SNAP_IDLE_MS)
    }

    const syncMarketStickyTop = () => {
      if (!headerEl) return
      const stickyAnchorEl =
        headerEl.querySelector<HTMLElement>('.sport-rail__item--active') ??
        headerEl.querySelector<HTMLElement>('.sport-rail__item') ??
        headerEl
      const desiredStickyTop = stickyAnchorEl.getBoundingClientRect().bottom + MARKET_STICKY_GAP
      const homeStyle = window.getComputedStyle(homeEl)
      const homePaddingTop = parseFloat(homeStyle.paddingTop) || 0
      const usesHomeScroll = (
        homeStyle.position === 'fixed' &&
        (homeStyle.overflowY === 'auto' || homeStyle.overflowY === 'scroll')
      )
      const stickyTop = usesHomeScroll
        ? isCompetitionMode
          ? MARKET_STICKY_GAP - HEADER_CONTENT_GAP
          : desiredStickyTop -
            homeEl.getBoundingClientRect().top -
            homePaddingTop
        : desiredStickyTop

      homeEl.style.setProperty(
        '--home-market-sticky-top',
        `${roundCssNumber(stickyTop)}px`
      )
      homeEl.style.setProperty(
        '--home-market-sticky-bg-height',
        `${roundCssNumber(desiredStickyTop + MARKET_STICKY_ROW_HEIGHT + MARKET_STICKY_BG_GAP + HEADER_BG_TOP_OFFSET)}px`
      )
    }

    const getVisibleMarketStickyEl = (stuckOnly = false) => {
      const stickyEls = Array.from(homeEl.querySelectorAll<HTMLElement>(marketStickySelector))
      const visibleStickyEls = stickyEls
        .map((stickyEl) => ({
          stickyEl,
          rect: stickyEl.getBoundingClientRect(),
          style: window.getComputedStyle(stickyEl),
        }))
        .filter(({ rect, stickyEl, style }) => (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          (!stuckOnly || stickyEl.getAttribute('data-market-sticky-stuck') === 'true') &&
          rect.width > 0 &&
          rect.height > 1
        ))
        .sort((first, second) => first.rect.top - second.rect.top)

      return visibleStickyEls[0] ?? null
    }

    const getFirstVisibleContentEl = () => {
      const contentEls = Array.from(homeEl.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement)
        .filter((child) => !child.classList.contains('header'))
        .map((contentEl) => ({
          contentEl,
          rect: contentEl.getBoundingClientRect(),
          style: window.getComputedStyle(contentEl),
        }))
        .filter(({ rect, style }) => (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 1
        ))

      return contentEls[0] ?? null
    }

    const getSportsCarouselMetrics = (naturalMaxHeight: number, naturalPaddingBottom: number) => {
      const carouselEl = headerEl?.querySelector<HTMLElement>('.sports-match-carousel')
      const clipTarget = isCompetitionMode
        ? getVisibleMarketStickyEl()
        : getFirstVisibleContentEl()

      if (!carouselEl || !clipTarget) {
        return {
          maxHeight: naturalMaxHeight,
          paddingBottom: naturalPaddingBottom,
          isClipped: false,
        }
      }

      const carouselRect = carouselEl.getBoundingClientRect()
      const clipHeight = clamp(
        clipTarget.rect.top - carouselRect.top,
        0,
        naturalMaxHeight
      )
      const trackRect = carouselEl
        .querySelector<HTMLElement>('.sports-match-carousel__track')
        ?.getBoundingClientRect()
      const clippedPaddingBottom = trackRect
        ? clamp(clipHeight - trackRect.height, 0, naturalPaddingBottom)
        : Math.min(clipHeight, naturalPaddingBottom)

      return {
        maxHeight: clipHeight,
        paddingBottom: clippedPaddingBottom,
        isClipped: clipHeight < naturalMaxHeight,
      }
    }

    const getSportRailHeaderBgHeight = () => {
      if (!headerEl) return sportHeaderCompactBgHeight

      const sportHeaderAnchorEl =
        headerEl.querySelector<HTMLElement>('.sport-rail') ??
        headerEl

      return Math.max(
        sportHeaderCompactBgHeight,
        sportHeaderAnchorEl.getBoundingClientRect().bottom + HEADER_BG_TOP_OFFSET
      )
    }

    const syncHomeHeaderContentPaddingTop = ({
      eventRailMaxHeight = 0,
      eventRailPaddingBottom = 0,
      hasEventRail,
    }: {
      eventRailMaxHeight?: number
      eventRailPaddingBottom?: number
      hasEventRail: boolean
    }) => {
      if (!headerEl) return

      const homeTop = homeEl.getBoundingClientRect().top

      if (hasEventRail) {
        const carouselEl = headerEl.querySelector<HTMLElement>('.sports-match-carousel')
        if (carouselEl) {
          const trackHeight = carouselEl
            .querySelector<HTMLElement>('.sports-match-carousel__track')
            ?.getBoundingClientRect()
            .height ?? eventRailMaxHeight
          const visibleEventRailHeight = Math.min(trackHeight, eventRailMaxHeight)
          const contentOffset = carouselEl.getBoundingClientRect().top - homeTop +
            visibleEventRailHeight +
            eventRailPaddingBottom

          homeEl.style.setProperty(
            '--home-header-content-padding-top',
            `${roundCssNumber(Math.max(contentOffset, 0))}px`
          )
          return
        }
      }

      const headerContentEndEl =
        headerEl.querySelector<HTMLElement>('.sport-rail__list') ??
        headerEl.querySelector<HTMLElement>('.sport-rail') ??
        headerEl.querySelector<HTMLElement>('.header__top')

      if (!headerContentEndEl) return

      const contentOffset = headerContentEndEl.getBoundingClientRect().bottom - homeTop + HEADER_CONTENT_GAP
      homeEl.style.setProperty(
        '--home-header-content-padding-top',
        `${roundCssNumber(Math.max(contentOffset, 0))}px`
      )
    }

    const syncHeaderMorph = (scrollTop: number) => {
      const hasHeaderEventRail = hasEventRailHeader()
      const morphScrollStart = hasHeaderEventRail
        ? HEADER_EVENT_RAIL_MORPH_SCROLL_START
        : usesContentEventRail
          ? HEADER_EVENT_RAIL_MORPH_SCROLL_START
          : HEADER_MORPH_SCROLL_START
      const morphScrollEnd = getHeaderMorphScrollEnd()
      const requestedMorphProgress = smoothStep(
        getScrollProgress(scrollTop, morphScrollStart, morphScrollEnd)
      )
      const morphProgress = requestedMorphProgress
      homeEl.toggleAttribute('data-header-morph-complete', morphProgress >= 1)
      homeEl.dispatchEvent(new CustomEvent('home-header-morph-change'))
      const sportRailPaddingBottom = interpolate(
        SPORT_RAIL_EXPANDED_PADDING_BOTTOM,
        SPORT_RAIL_COMPACT_PADDING_BOTTOM,
        morphProgress
      )
      const headerTopPaddingY = interpolate(
        HEADER_TOP_EXPANDED_PADDING_Y,
        HEADER_TOP_COMPACT_PADDING_Y,
        morphProgress
      )
      const sportRailHeaderBgHeight = getSportRailHeaderBgHeight()
      const highlightHeaderBgHeight = hasHeaderEventRail || usesContentEventRail
        ? scrollTop > HEADER_EXPAND_SCROLL_TOP
          ? HIGHLIGHT_HEADER_SCROLLED_BG_HEIGHT
          : sportRailHeaderBgHeight
        : HIGHLIGHT_HEADER_SCROLLED_BG_HEIGHT
      const hasMarketStickyEngaged = homeEl.getAttribute('data-market-sticky-engaged') === 'true'
      const sportHeaderBgHeight = hasHeaderEventRail || usesContentEventRail
        ? sportRailHeaderBgHeight
        : hasMarketStickyEngaged
          ? interpolate(sportHeaderExpandedBgHeight, sportHeaderCompactBgHeight, morphProgress)
          : sportHeaderExpandedBgHeight
      const eventRailVisualStart = HEADER_EVENT_RAIL_MORPH_SCROLL_START
      const eventRailVisualProgress = hasHeaderEventRail
        ? smoothStep(
            getScrollProgress(
              scrollTop,
              eventRailVisualStart,
              eventRailVisualStart + EVENT_RAIL_VISUAL_COLLAPSE_SCROLL_END
            )
          )
        : morphProgress

      homeEl.style.setProperty(
        '--highlight-header-bg-height',
        `${roundCssNumber(highlightHeaderBgHeight)}px`
      )
      homeEl.style.setProperty(
        '--header-top-padding-y',
        `${roundCssNumber(headerTopPaddingY)}px`
      )
      homeEl.style.setProperty(
        '--sport-rail-padding-bottom',
        `${roundCssNumber(sportRailPaddingBottom)}px`
      )
      homeEl.style.setProperty(
        '--sport-header-bg-height',
        `${roundCssNumber(sportHeaderBgHeight)}px`
      )
      homeEl.style.setProperty(
        '--sports-carousel-teams-gap',
        `${roundCssNumber(interpolate(SPORTS_CAROUSEL_EXPANDED_TEAMS_GAP, SPORTS_CAROUSEL_COMPACT_TEAMS_GAP, morphProgress))}px`
      )
      homeEl.style.setProperty(
        '--sports-carousel-teams-min-height',
        `${roundCssNumber(interpolate(SPORTS_CAROUSEL_EXPANDED_TEAMS_MIN_HEIGHT, SPORTS_CAROUSEL_COMPACT_TEAMS_MIN_HEIGHT, morphProgress))}px`
      )
      homeEl.style.setProperty(
        '--sports-carousel-team-row-height',
        `${roundCssNumber(interpolate(SPORTS_CAROUSEL_EXPANDED_TEAM_ROW_HEIGHT, SPORTS_CAROUSEL_COMPACT_TEAM_ROW_HEIGHT, morphProgress))}px`
      )

      syncMarketStickyTop()

      if (hasHeaderEventRail) {
        const naturalMaxHeight = EVENT_RAIL_HEIGHT * (1 - morphProgress)
        const naturalPaddingBottom = EVENT_RAIL_PADDING_BOTTOM * (1 - morphProgress)
        syncHomeHeaderContentPaddingTop({
          eventRailMaxHeight: naturalMaxHeight,
          eventRailPaddingBottom: naturalPaddingBottom,
          hasEventRail: hasHeaderEventRail,
        })
        const sportsCarouselMetrics = getSportsCarouselMetrics(naturalMaxHeight, naturalPaddingBottom)

        homeEl.style.setProperty(
          '--sports-carousel-collapse-max-height',
          `${roundCssNumber(sportsCarouselMetrics.maxHeight)}px`
        )
        homeEl.style.setProperty(
          '--sports-carousel-collapse-padding-bottom',
          `${roundCssNumber(sportsCarouselMetrics.paddingBottom)}px`
        )
        homeEl.style.setProperty(
          '--sports-carousel-collapse-opacity',
          `${roundCssNumber(1 - eventRailVisualProgress)}`
        )
        homeEl.style.setProperty(
          '--sports-carousel-collapse-translate-y',
          `${roundCssNumber(interpolate(0, EVENT_RAIL_COLLAPSE_TRANSLATE_Y, eventRailVisualProgress))}px`
        )
        homeEl.toggleAttribute('data-market-sticky-rail-clipped', sportsCarouselMetrics.isClipped)
      } else {
        homeEl.style.setProperty('--sports-carousel-collapse-max-height', `${EVENT_RAIL_HEIGHT}px`)
        homeEl.style.setProperty('--sports-carousel-collapse-padding-bottom', `${EVENT_RAIL_PADDING_BOTTOM}px`)
        homeEl.style.setProperty('--sports-carousel-collapse-opacity', '1')
        homeEl.style.setProperty('--sports-carousel-collapse-translate-y', '0px')
        homeEl.removeAttribute('data-market-sticky-rail-clipped')
        syncHomeHeaderContentPaddingTop({ hasEventRail: hasHeaderEventRail })
      }

      setIsSportsMatchCarouselCollapsed((isCollapsed) => {
        const shouldCollapse = hasHeaderEventRail && morphProgress >= EVENT_RAIL_DISABLE_INTERACTION_PROGRESS
        return isCollapsed === shouldCollapse ? isCollapsed : shouldCollapse
      })
    }

    const updateCompactState = () => {
      frame = null
      const scrollTop = getScrollTop()

      syncHeaderMorph(scrollTop)

      setIsSportHeaderCompact((isCompact) => {
        if (!isCompact && scrollTop > HEADER_COMPACT_SCROLL_TOP) return true
        if (isCompact && scrollTop < HEADER_EXPAND_SCROLL_TOP) return false
        return isCompact
      })
    }

    const scheduleUpdate = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(updateCompactState)
    }

    const handleScroll = () => {
      scheduleUpdate()
      if (!isHeaderSnapScrolling) scheduleHeaderMorphSnap()
    }

    scheduleUpdate()
    homeEl.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', scheduleUpdate, { passive: true })

    const resizeObserver = headerEl && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(scheduleUpdate)
      : null

    if (headerEl) resizeObserver?.observe(headerEl)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      clearHeaderSnapTimer()
      clearHeaderSnapSettleTimer()
      homeEl.removeAttribute('data-market-sticky-rail-clipped')
      homeEl.removeAttribute('data-header-morph-complete')
      homeEl.removeEventListener('scroll', handleScroll)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', scheduleUpdate)
      resizeObserver?.disconnect()
    }
  }, [
    activeSport,
    isCompetitionMode,
    resetEventRailCollapse,
    sportHeaderCompactBgHeight,
    sportHeaderExpandedBgHeight,
    shouldRenderTopGamesRail,
    sportsCarouselEvents.length,
    usesContentEventRail,
  ])

  const handleSportChange = (sportId: string) => {
    setContentResetKey((current) => current + 1)
    setSelectedCompetition(null)

    if (sportId === 'destaques') {
      setActiveSport(null)
    } else {
      setActiveSport(sportId)
    }

    scrollToTop()
  }

  const handleOpenCompetition = (target: CompetitionLinkTarget) => {
    setExtraRailCompetitions((currentCompetitions) => {
      const existingIndex = currentCompetitions.findIndex((competition) => competition.id === target.id)
      if (existingIndex < 0) return [...currentCompetitions, target]

      const existingCompetition = currentCompetitions[existingIndex]
      if (
        existingCompetition.name === target.name &&
        existingCompetition.sport === target.sport
      ) {
        return currentCompetitions
      }

      const nextCompetitions = [...currentCompetitions]
      nextCompetitions[existingIndex] = target
      return nextCompetitions
    })
    setActiveSport(target.sport)
    setSelectedCompetition({ id: target.id, name: target.name })
    setContentResetKey((c) => c + 1)
    scrollToTop()
  }

  const handleCasinoCategoryChange = (categoryId: CasinoCategoryId) => {
    setActiveCasinoCategory(categoryId)
    setContentResetKey((current) => current + 1)
    scrollToTop()
  }

  const headerRail = isBetsProduct ? (
    <SportRail
      activeSport={activeSport}
      selectedCompetitionId={selectedCompetition?.id ?? null}
      selectedCompetitionName={selectedCompetition?.name ?? null}
      extraCompetitions={extraRailCompetitions}
      onSportChange={handleSportChange}
      onOpenCompetition={handleOpenCompetition}
    />
  ) : (
    <CasinoRail
      activeCategory={activeCasinoCategory}
      onCategoryChange={handleCasinoCategoryChange}
    />
  )

  const homeClasses = [
    'home',
    'home--header-morph-active',
    'home--novo-trilho',
    'home--no-dividers',
    'home--liquid-glass-new',
    isV2 ? 'home--v2' : '',
    activeProduct === 'cassino' ? 'home--casino-active' : '',
    displayActiveSport ? 'home--sport-active' : '',
    usesHeaderEventRail ? 'home--event-rail-active' : '',
    usesContentEventRail ? 'home--content-event-rail-active' : '',
    isCompetitionMode ? 'home--competition-active' : '',
    isSportHeaderCompact ? 'home--header-compact' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={homeClasses} ref={homeRef}>
      <HeaderComponent
        activeProduct={activeProduct}
        activeSport={displayActiveSport}
        onProductChange={onProductChange}
        rail={headerRail}
      >
        {displayActiveSport && shouldRenderTopGamesRail && (
          <>
            {!usesContentEventRail && (
              <SportsMatchCarousel
                events={sportsCarouselEvents}
                resetKey={sportsCarouselResetKey}
                competitionMode={isCompetitionMode}
                isCollapsed={isSportsMatchCarouselCollapsed}
                onLiveMatchClick={handleLiveMatchClick}
              />
            )}
          </>
        )}
      </HeaderComponent>
      {shouldRenderTopGamesRail && usesContentEventRail && (
        <div className="home__content-event-rail">
          <SportsMatchCarousel
            events={sportsCarouselEvents}
            resetKey={sportsCarouselResetKey}
            competitionMode={isCompetitionMode}
            isCollapsed={false}
            onLiveMatchClick={handleLiveMatchClick}
          />
        </div>
      )}
      <TrilhoEBanner
        hideBanner={shouldHideBetsBanner || isCasinoCrashPage}
        banners={isBetsProduct ? undefined : casinoBanners}
        onBannerClick={isBetsProduct ? undefined : handleCasinoBannerClick}
      />
      {!isBetsProduct ? (
        <Fragment key={`casino-${activeCasinoCategory}-${contentResetKey}`}>
          {!isCasinoCrashPage && <PromotionSection promotions={casinoPromotions} />}
          <CasinoContent
            activeCategory={activeCasinoCategory}
            onGameOpen={handleCasinoGameOpen}
          />
        </Fragment>
      ) : displayActiveSport ? (
        <Fragment key={`sport-${activeSport}-${contentResetKey}`}>
          {selectedCompetition ? (
            <CompetitionPage
              sport={displayActiveSport}
              competitionId={selectedCompetition.id}
              onLiveMatchClick={handleLiveMatchClick}
            />
          ) : (
            <>
              <OffersSection sportFilter={displayActiveSport} />
              <CalendarSection
                sportFilter={displayActiveSport}
                onLiveMatchClick={handleLiveMatchClick}
                onOpenCompetition={handleOpenCompetition}
              />
            </>
          )}
        </Fragment>
      ) : (
        <Fragment key={`destaques-${contentResetKey}`}>
          {/* <ContentTabs /> */}
          <PromotionSection promotions={sportsPromotions} />
          <LiveSection
            onMatchClick={handleLiveMatchClick}
            onOpenCompetition={handleOpenCompetition}
          />
          <OffersSection />
          <PreMatchSection
            onOpenCompetition={handleOpenCompetition}
            onMatchClick={handleLiveMatchClick}
          />
          <TreasureSection />
          {/* <WinningNowSection /> */}
        </Fragment>
      )}
      {selectedLiveMatch && (
        <LiveEventPage
          isOpen={true}
          onClose={handleLiveEventClose}
          onOpenSettled={onLiveEventOpenSettled}
          onCloseStart={handleLiveEventCloseStart}
          matches={selectedLiveMatch.matches}
          railEvents={selectedLiveMatch.railEvents}
          selectedIndex={selectedLiveMatch.selectedIndex}
          currentTimes={selectedLiveMatch.currentTimes}
          leagueName={selectedLiveMatch.leagueName}
          leagueFlag={selectedLiveMatch.leagueFlag}
          sport={selectedLiveMatch.sport}
        />
      )}
      {selectedCasinoGame && (
        <CasinoGamePage
          isOpen={true}
          onClose={() => setSelectedCasinoGame(null)}
          games={selectedCasinoGame.section.games}
          selectedIndex={selectedCasinoGame.selectedIndex}
          sectionTitle={selectedCasinoGame.section.title}
        />
      )}
    </div>
  )
}
