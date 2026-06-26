import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import type { LiveEventOpenPayload } from './pages/LiveEventPage'
import { MobileOnly } from './components/MobileOnly'
import { Navbar } from './components/Navbar'
import { Betslip } from './components/Betslip'
import { HeaderV2 } from './components/HeaderV2'
import { DepositPanel } from './components/DepositPanel'
import { FeatureFlagsPanel } from './components/FeatureFlagsPanel'
import { BetslipProvider } from './hooks/BetslipProvider'
import { FeatureFlagsProvider } from './hooks/FeatureFlagsProvider'
import { useFeatureFlags } from './hooks/useFeatureFlags'
import { useBetslip } from './hooks/useBetslip'
import { getBetslipTurboEligibleSelectionCount } from './hooks/betslipTurboBonus'
import type { ProductMode } from './types/home'
import { BETSLIP_LIVE_EVENT_OPEN_EVENT } from './utils/betslipLiveEvent'
import { BrandLocalizationEffect } from './i18n/brandLocalization'

const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
const PromotionsPage = lazy(() => import('./pages/PromotionsPage').then((m) => ({ default: m.PromotionsPage })))
const BetslipPageV2 = lazy(() => import('./pages/BetslipPageV2').then((m) => ({ default: m.BetslipPageV2 })))
const LiveEventPage = lazy(() => import('./pages/LiveEventPage').then((m) => ({ default: m.LiveEventPage })))
const HandoffPage = lazy(() => import('./pages/Handoff').then((m) => ({ default: m.HandoffPage })))

const RouteFallback = () => (
  <div
    style={{ minHeight: '100dvh', background: 'var(--ds-background-app, var(--tokens-background-background))' }}
    aria-busy="true"
  />
)

const defaultProduct: ProductMode = 'apostas'
const productRoutes: ProductMode[] = ['apostas', 'cassino']
const promotionsRouteSegment = 'promocoes'
const handoffRouteSegment = 'handoff'
const deployedBasePath = '/draftaco-v0'
const ENABLE_APP_PROMOTIONS_NAV_LINK = false
const brasileiraoLeagueIdPattern = /(?:brasil-serie-a|fut-brasileir|fut-brasileirao-a)/
const brasileiraoLeagueNamePattern = /(?:brasileir|brasileir[aã]o|brasil\s*-\s*s[eé]rie\s*a|s[eé]rie\s*a)/i

const getBasePath = () => {
  const baseUrl = import.meta.env.BASE_URL || '/'
  if (baseUrl !== '/') return baseUrl.replace(/\/+$/, '')

  return window.location.pathname === deployedBasePath || window.location.pathname.startsWith(`${deployedBasePath}/`)
    ? deployedBasePath
    : ''
}

const stripBasePath = (pathname: string) => {
  const basePath = getBasePath()
  if (!basePath) return pathname || '/'

  if (pathname === basePath) return '/'
  if (pathname.startsWith(`${basePath}/`)) return pathname.slice(basePath.length) || '/'

  return pathname || '/'
}

const getNormalizedAppPath = (pathname: string) => stripBasePath(pathname).replace(/\/+$/, '') || '/'

const getRouteSegments = (pathname: string) => getNormalizedAppPath(pathname).split('/').filter(Boolean)

const isPromotionsPath = (pathname: string) => {
  const routeSegments = getRouteSegments(pathname)

  return (
    routeSegments[0] === promotionsRouteSegment &&
    routeSegments.length <= 2
  )
}

const isHandoffPath = (pathname: string) => {
  const routeSegments = getRouteSegments(pathname)

  return routeSegments.length === 1 && routeSegments[0] === handoffRouteSegment
}

const isCanonicalPromotionsPath = (pathname: string) => {
  const routeSegments = getRouteSegments(pathname)
  return routeSegments.length === 1 && routeSegments[0] === promotionsRouteSegment
}

const resolveProductFromPath = (pathname: string) => {
  const routeSegments = getRouteSegments(pathname)
  const routeProduct = productRoutes.find((route) => route === routeSegments[0])
  const product = routeProduct ?? defaultProduct
  const isCanonicalProductRoute = routeSegments.length === 1 && routeSegments[0] === product

  return {
    product,
    isCanonicalProductRoute,
  }
}

const buildProductPath = (product: ProductMode) => {
  const basePath = getBasePath()
  return `${basePath}/${product}`
}

const buildPromotionsPath = () => {
  const basePath = getBasePath()
  return `${basePath}/${promotionsRouteSegment}`
}

function AppContent() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const { selections: betslipSelections, summary: betslipSummary } = useBetslip()
  const { brandMode, isFeatureEnabled } = useFeatureFlags()
  const betslipTurboEligibleSelectionCount = useMemo(
    () => getBetslipTurboEligibleSelectionCount(betslipSelections),
    [betslipSelections]
  )
  const hasOnlyBrasileiraoSelections = useMemo(() => (
    betslipSelections.length > 0 && betslipSelections.every((selection) => (
      (!!selection.leagueId && brasileiraoLeagueIdPattern.test(selection.leagueId)) ||
      (!!selection.leagueName && brasileiraoLeagueNamePattern.test(selection.leagueName))
    ))
  ), [betslipSelections])
  const productRoute = useMemo(() => resolveProductFromPath(pathname), [pathname])
  const isPromotionsPage = useMemo(() => isPromotionsPath(pathname), [pathname])
  const isHandoffPage = useMemo(() => isHandoffPath(pathname), [pathname])
  const [promotionsProduct, setPromotionsProduct] = useState<ProductMode>(() => productRoute.product)
  const [isFullBetslipOpen, setIsFullBetslipOpen] = useState(false)
  const [isCompactBetslipSuppressed, setIsCompactBetslipSuppressed] = useState(false)
  const [isDepositPanelOpen, setIsDepositPanelOpen] = useState(false)
  const [isFeatureFlagsPanelOpen, setIsFeatureFlagsPanelOpen] = useState(false)
  const [liveEventUi, setLiveEventUi] = useState({
    isOpen: false,
    isEventBetslipVisible: false,
    betslipMotionKey: 0,
  })
  const [betslipOriginLiveEvent, setBetslipOriginLiveEvent] = useState<{
    isOpen: boolean
    payload: LiveEventOpenPayload
  } | null>(null)
  const activeProduct = isPromotionsPage ? promotionsProduct : productRoute.product

  useEffect(() => {
    if (isPromotionsPage) return
    if (isHandoffPage) return
    if (productRoute.isCanonicalProductRoute) return

    const nextPath = buildProductPath(productRoute.product)
    window.history.replaceState({}, '', nextPath)
    const timer = window.setTimeout(() => {
      setPathname(window.location.pathname)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isHandoffPage, isPromotionsPage, productRoute])

  useEffect(() => {
    if (!isPromotionsPage) return
    if (isCanonicalPromotionsPath(pathname)) return

    const nextPath = buildPromotionsPath()
    window.history.replaceState({}, '', nextPath)
    const timer = window.setTimeout(() => {
      setPathname(window.location.pathname)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isPromotionsPage, pathname])

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleProductChange = useCallback((product: ProductMode) => {
    if (isPromotionsPage) {
      setPromotionsProduct(product)
      const nextPath = buildProductPath(product)

      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath)
      }

      setPathname(window.location.pathname)
      return
    }

    const nextPath = buildProductPath(product)

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }

    setPathname(window.location.pathname)
  }, [isPromotionsPage])

  const handleNavbarItemSelect = useCallback((itemId: string) => {
    if (itemId === promotionsRouteSegment) {
      if (!ENABLE_APP_PROMOTIONS_NAV_LINK) return

      const nextPath = buildPromotionsPath()
      setPromotionsProduct(activeProduct)

      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath)
      }

      setPathname(window.location.pathname)
      return
    }

    if (isPromotionsPage && itemId === 'home') {
      const nextPath = buildProductPath(activeProduct)

      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath)
      }

      setPathname(window.location.pathname)
    }
  }, [activeProduct, isPromotionsPage])

  const handleBetslipClose = useCallback(() => {
    setIsFullBetslipOpen(false)
  }, [])

  const handleBetslipOpen = useCallback(() => {
    setIsCompactBetslipSuppressed(false)
    setIsFullBetslipOpen(true)
    setLiveEventUi((current) => (
      current.isOpen
        ? {
            ...current,
            isOpen: false,
            isEventBetslipVisible: false,
          }
        : current
    ))
  }, [])

  const handleCompactBetslipSuppress = useCallback(() => {
    setIsCompactBetslipSuppressed(true)
  }, [])

  const handleDepositPanelOpen = useCallback(() => {
    setIsDepositPanelOpen(true)
  }, [])

  const handleDepositPanelClose = useCallback(() => {
    setIsDepositPanelOpen(false)
  }, [])

  const handleFeatureFlagsPanelClose = useCallback(() => {
    setIsFeatureFlagsPanelOpen(false)
  }, [])

  const handleLiveEventOpenChange = useCallback((isOpen: boolean) => {
    setLiveEventUi((current) => {
      if (current.isOpen === isOpen) return current

      if (isOpen) {
        return {
          isOpen: true,
          isEventBetslipVisible: false,
          betslipMotionKey: current.betslipMotionKey,
        }
      }

      return {
        ...current,
        isOpen: false,
        isEventBetslipVisible: false,
      }
    })
  }, [])

  const handleLiveEventOpenSettled = useCallback(() => {
    setLiveEventUi((current) => {
      if (!current.isOpen || current.isEventBetslipVisible) return current

      return {
        ...current,
        isEventBetslipVisible: true,
        betslipMotionKey: current.betslipMotionKey + 1,
      }
    })
  }, [])

  const handleLiveEventCloseStart = useCallback(() => {
    setLiveEventUi((current) => {
      if (!current.isEventBetslipVisible) return current

      return {
        ...current,
        isEventBetslipVisible: false,
      }
    })
  }, [])

  useEffect(() => {
    const handleBetslipLiveEventOpen = (event: Event) => {
      const payload = (event as CustomEvent<LiveEventOpenPayload>).detail
      if (!payload?.matches?.length) return

      setIsFullBetslipOpen(true)
      setBetslipOriginLiveEvent({ isOpen: true, payload })
      handleLiveEventOpenChange(true)
    }

    window.addEventListener(BETSLIP_LIVE_EVENT_OPEN_EVENT, handleBetslipLiveEventOpen)
    return () => window.removeEventListener(BETSLIP_LIVE_EVENT_OPEN_EVENT, handleBetslipLiveEventOpen)
  }, [handleLiveEventOpenChange])

  const handleBetslipOriginLiveEventClose = useCallback(() => {
    setBetslipOriginLiveEvent(null)
    handleLiveEventOpenChange(false)
  }, [handleLiveEventOpenChange])

  const handleEventBetslipOpen = useCallback(() => {
    if (!betslipOriginLiveEvent) {
      handleBetslipOpen()
      return
    }

    setIsFullBetslipOpen(true)
    handleLiveEventCloseStart()
    setBetslipOriginLiveEvent((current) => (
      current ? { ...current, isOpen: false } : current
    ))
  }, [betslipOriginLiveEvent, handleBetslipOpen, handleLiveEventCloseStart])

  useEffect(() => {
    if (!isCompactBetslipSuppressed || betslipSummary.hasSelections) return

    setIsCompactBetslipSuppressed(false)
  }, [betslipSummary.hasSelections, isCompactBetslipSuppressed])

  useEffect(() => {
    if (!betslipSummary.hasSelections) return

    void import('./pages/BetslipPageV2')
  }, [betslipSummary.hasSelections])

  const showCompactBetslip = activeProduct === 'apostas'
    && !isPromotionsPage
    && !isHandoffPage
    && betslipSummary.hasSelections
    && !isCompactBetslipSuppressed
  const shouldShowEventBetslip = showCompactBetslip && liveEventUi.isOpen && liveEventUi.isEventBetslipVisible
  const showFreeBetTag = isFeatureEnabled('freeBetsAvailable') && hasOnlyBrasileiraoSelections

  useEffect(() => {
    document.documentElement.toggleAttribute('data-betslip-compact-visible', showCompactBetslip)
    document.documentElement.toggleAttribute('data-live-event-betslip-visible', shouldShowEventBetslip)
  }, [showCompactBetslip, shouldShowEventBetslip])

  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute('data-betslip-compact-visible')
      document.documentElement.removeAttribute('data-live-event-betslip-visible')
    }
  }, [])

  return (
    <div className="app-shell">
      <BrandLocalizationEffect brandMode={brandMode} />
      {!isHandoffPage ? <MobileOnly /> : null}
      <Suspense fallback={<RouteFallback />}>
        {isHandoffPage ? (
          <HandoffPage />
        ) : isPromotionsPage ? (
          <PromotionsPage
            activeProduct={activeProduct}
            HeaderComponent={HeaderV2}
            onDepositOpen={handleDepositPanelOpen}
            onProductChange={handleProductChange}
          />
        ) : (
          <Home
            activeProduct={activeProduct}
            HeaderComponent={HeaderV2}
            isLiveEventSuppressed={isFullBetslipOpen}
            onDepositOpen={handleDepositPanelOpen}
            onProductChange={handleProductChange}
            onLiveEventOpenChange={handleLiveEventOpenChange}
            onLiveEventOpenSettled={handleLiveEventOpenSettled}
            onLiveEventCloseStart={handleLiveEventCloseStart}
          />
        )}
      </Suspense>
      {!isHandoffPage && isFullBetslipOpen ? (
        <Suspense fallback={null}>
          <BetslipPageV2
            isCoveredByEvent={!!betslipOriginLiveEvent}
            onClose={handleBetslipClose}
            onSelectionsEmptyExitStart={handleCompactBetslipSuppress}
          />
        </Suspense>
      ) : null}
      {!isHandoffPage && betslipOriginLiveEvent ? (
        <Suspense fallback={null}>
          <LiveEventPage
            isOpen={betslipOriginLiveEvent.isOpen}
            onClose={handleBetslipOriginLiveEventClose}
            onOpenSettled={handleLiveEventOpenSettled}
            onCloseStart={handleLiveEventCloseStart}
            matches={betslipOriginLiveEvent.payload.matches}
            railEvents={betslipOriginLiveEvent.payload.railEvents}
            selectedIndex={betslipOriginLiveEvent.payload.selectedIndex}
            currentTimes={betslipOriginLiveEvent.payload.currentTimes}
            leagueName={betslipOriginLiveEvent.payload.leagueName}
            leagueFlag={betslipOriginLiveEvent.payload.leagueFlag}
            sport={betslipOriginLiveEvent.payload.sport}
          />
        </Suspense>
      ) : null}
      {!isHandoffPage ? (
        <DepositPanel isOpen={isDepositPanelOpen} onClose={handleDepositPanelClose} />
      ) : null}
      {!isHandoffPage ? (
        <FeatureFlagsPanel isOpen={isFeatureFlagsPanelOpen} onClose={handleFeatureFlagsPanelClose} />
      ) : null}
      {!isHandoffPage ? (
        <>
          <Betslip
            visible={showCompactBetslip}
            summary={betslipSummary}
            turboEligibleSelectionCount={betslipTurboEligibleSelectionCount}
            showFreeBetTag={showFreeBetTag && !shouldShowEventBetslip}
            presentationKey="base"
            onOpen={handleBetslipOpen}
          />
          <Betslip
            visible={shouldShowEventBetslip}
            summary={betslipSummary}
            turboEligibleSelectionCount={betslipTurboEligibleSelectionCount}
            compactOnly={true}
            showFreeBetTag={showFreeBetTag && shouldShowEventBetslip}
            presentationKey={`live-event-${liveEventUi.betslipMotionKey}`}
            onOpen={handleEventBetslipOpen}
          />
          <Navbar
            activeProduct={activeProduct}
            activeItemId={isPromotionsPage ? promotionsRouteSegment : undefined}
            onItemSelect={handleNavbarItemSelect}
          />
        </>
      ) : null}
    </div>
  )
}

function App() {
  return (
    <FeatureFlagsProvider>
      <BetslipProvider>
        <AppContent />
      </BetslipProvider>
    </FeatureFlagsProvider>
  )
}

export default App
