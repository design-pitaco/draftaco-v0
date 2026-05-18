import { useCallback, useEffect, useMemo, useState } from 'react'
import { Home } from './pages/Home'
import { PromotionsPage } from './pages/PromotionsPage'
import { BetslipPage } from './pages/BetslipPage'
import { MobileOnly } from './components/MobileOnly'
import { Navbar } from './components/Navbar'
import { Betslip } from './components/Betslip'
import { HeaderV2 } from './components/HeaderV2'
import { BetslipProvider } from './hooks/BetslipProvider'
import { useBetslip } from './hooks/useBetslip'
import type { ProductMode } from './types/home'

type AppRouteVersion = 'v1' | 'v2'

const defaultProduct: ProductMode = 'apostas'
const defaultVersion: AppRouteVersion = 'v1'
const productRoutes: ProductMode[] = ['apostas', 'cassino']
const versionRouteSegments: AppRouteVersion[] = ['v1', 'v2']
const promotionsRouteSegment = 'promocoes'
const deployedBasePath = '/pitaquinho'

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

const getRouteVersion = (routeSegments: string[]): AppRouteVersion => {
  const routeVersion = versionRouteSegments.find((version) => version === routeSegments[1])
  return routeVersion ?? defaultVersion
}

const isPromotionsPath = (pathname: string) => {
  const routeSegments = getNormalizedAppPath(pathname).split('/').filter(Boolean)

  return (
    routeSegments[0] === promotionsRouteSegment &&
    versionRouteSegments.some((version) => version === routeSegments[1]) &&
    routeSegments.length === 2
  )
}

const resolveProductFromPath = (pathname: string) => {
  const appPath = getNormalizedAppPath(pathname)
  const routeSegments = appPath.split('/').filter(Boolean)
  const routeProduct = productRoutes.find((route) => route === routeSegments[0])
  const version = getRouteVersion(routeSegments)
  const product = routeProduct ?? defaultProduct
  const expectedSegments = [product, version]

  return {
    product,
    version,
    isCanonicalProductRoute: routeSegments.join('/') === expectedSegments.join('/'),
  }
}

const buildProductPath = (product: ProductMode, version: AppRouteVersion) => {
  const basePath = getBasePath()
  return `${basePath}/${product}/${version}`
}

const buildPromotionsPath = (version: AppRouteVersion) => {
  const basePath = getBasePath()
  return `${basePath}/${promotionsRouteSegment}/${version}`
}

function AppContent() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  const { summary: betslipSummary } = useBetslip()
  const productRoute = useMemo(() => resolveProductFromPath(pathname), [pathname])
  const isPromotionsPage = useMemo(() => isPromotionsPath(pathname), [pathname])
  const [promotionsProduct, setPromotionsProduct] = useState<ProductMode>(() => productRoute.product)
  const [isFullBetslipOpen, setIsFullBetslipOpen] = useState(false)
  const [liveEventUi, setLiveEventUi] = useState({
    isOpen: false,
    isEventBetslipVisible: false,
    betslipMotionKey: 0,
  })
  const activeProduct = isPromotionsPage ? promotionsProduct : productRoute.product

  useEffect(() => {
    if (isPromotionsPage) return
    if (productRoute.isCanonicalProductRoute) return

    const nextPath = buildProductPath(productRoute.product, productRoute.version)
    window.history.replaceState({}, '', nextPath)
    const timer = window.setTimeout(() => {
      setPathname(window.location.pathname)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isPromotionsPage, productRoute])

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
      const nextPath = buildProductPath(product, productRoute.version)

      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath)
      }

      setPathname(window.location.pathname)
      return
    }

    const nextPath = buildProductPath(product, productRoute.version)

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath)
    }

    setPathname(window.location.pathname)
  }, [isPromotionsPage, productRoute.version])

  const handleNavbarItemSelect = useCallback((itemId: string) => {
    if (itemId === promotionsRouteSegment) {
      const nextPath = buildPromotionsPath(productRoute.version)
      setPromotionsProduct(activeProduct)

      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath)
      }

      setPathname(window.location.pathname)
      return
    }

    if (isPromotionsPage && itemId === 'home') {
      const nextPath = buildProductPath(activeProduct, productRoute.version)

      if (window.location.pathname !== nextPath) {
        window.history.pushState({}, '', nextPath)
      }

      setPathname(window.location.pathname)
    }
  }, [activeProduct, isPromotionsPage, productRoute.version])

  const handleBetslipClose = useCallback(() => {
    setIsFullBetslipOpen(false)
  }, [])

  const handleBetslipOpen = useCallback(() => {
    setIsFullBetslipOpen(true)
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

  const isV2 = productRoute.version === 'v2'
  const headerComponent = isV2 ? HeaderV2 : undefined
  const showCompactBetslip = activeProduct === 'apostas' && !isPromotionsPage && betslipSummary.hasSelections
  const shouldShowEventBetslip = showCompactBetslip && liveEventUi.isOpen && liveEventUi.isEventBetslipVisible

  return (
    <div className="app-shell">
      <MobileOnly />
      {isPromotionsPage ? (
        <PromotionsPage
          activeProduct={activeProduct}
          HeaderComponent={headerComponent}
          isV2={isV2}
          onProductChange={handleProductChange}
        />
      ) : (
        <Home
          activeProduct={activeProduct}
          HeaderComponent={headerComponent}
          isV2={isV2}
          onProductChange={handleProductChange}
          onLiveEventOpenChange={handleLiveEventOpenChange}
          onLiveEventOpenSettled={handleLiveEventOpenSettled}
          onLiveEventCloseStart={handleLiveEventCloseStart}
        />
      )}
      {isFullBetslipOpen ? (
        <BetslipPage onClose={handleBetslipClose} />
      ) : null}
      <Betslip
        visible={showCompactBetslip}
        summary={betslipSummary}
        presentationKey="base"
        onOpen={handleBetslipOpen}
      />
      <Betslip
        visible={shouldShowEventBetslip}
        summary={betslipSummary}
        compactOnly={true}
        presentationKey={`live-event-${liveEventUi.betslipMotionKey}`}
        onOpen={handleBetslipOpen}
      />
      <Navbar
        activeProduct={activeProduct}
        isV2={isV2}
        activeItemId={isPromotionsPage ? promotionsRouteSegment : undefined}
        onItemSelect={handleNavbarItemSelect}
      />
    </div>
  )
}

function App() {
  return (
    <BetslipProvider>
      <AppContent />
    </BetslipProvider>
  )
}

export default App
