import { useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Header } from '../../components/Header'
import { useSlidingActiveIndicator } from '../../hooks/useSlidingActiveIndicator'
import type { ProductMode } from '../../types/home'
import { PromotionsMissionsSection } from './PromotionsMissionsSection'
import './PromotionsPage.css'

type PromotionsTabId = 'todas' | 'missoes' | 'torneios' | 'bolao'
type PromotionsFilterId = 'todos' | ProductMode

interface HeaderComponentProps {
  activeProduct?: ProductMode
  changeProductOnPointerDown?: boolean
  onProductChange?: (product: ProductMode) => void
  children?: ReactNode
}

interface PromotionsPageProps {
  activeProduct?: ProductMode
  HeaderComponent?: ComponentType<HeaderComponentProps>
  isV2?: boolean
  onProductChange?: (product: ProductMode) => void
}

const HEADER_COMPACT_SCROLL_TOP = 28
const HEADER_EXPAND_SCROLL_TOP = 4
const TAB_INDICATOR_ANIMATION_DURATION = 360

const promotionTabs: { id: PromotionsTabId; label: string }[] = [
  { id: 'todas', label: 'Todas as Promoções' },
  { id: 'missoes', label: 'Missões' },
  { id: 'torneios', label: 'Torneios' },
  { id: 'bolao', label: 'Bolão' },
]

const promotionFilters: { id: PromotionsFilterId; label: string }[] = [
  { id: 'todos', label: 'Todas' },
  { id: 'apostas', label: 'Apostas' },
  { id: 'cassino', label: 'Cassino' },
]

const getTranslateXFromTransform = (transform: string) => {
  if (!transform || transform === 'none') return 0

  try {
    return new DOMMatrixReadOnly(transform).m41
  } catch {
    const matrixValues = transform.match(/matrix\(([^)]+)\)/)?.[1]?.split(',') ?? []
    return Number(matrixValues[4]) || 0
  }
}

export function PromotionsPage({
  activeProduct = 'apostas',
  HeaderComponent = Header,
  isV2 = false,
  onProductChange,
}: PromotionsPageProps = {}) {
  const pageRef = useRef<HTMLDivElement>(null)
  const tabsTrackRef = useRef<HTMLDivElement>(null)
  const tabIndicatorRef = useRef<HTMLSpanElement>(null)
  const tabIndicatorReadyRef = useRef(false)
  const tabIndicatorAnimationRef = useRef<Animation | null>(null)
  const filtersRef = useRef<HTMLDivElement>(null)
  const tabLabelRefs = useRef<Record<PromotionsTabId, HTMLSpanElement | null>>({
    todas: null,
    missoes: null,
    torneios: null,
    bolao: null,
  })
  const filterRefs = useRef<Record<PromotionsFilterId, HTMLButtonElement | null>>({
    todos: null,
    apostas: null,
    cassino: null,
  })
  const [activeTab, setActiveTab] = useState<PromotionsTabId>('todas')
  const [activeFilter, setActiveFilter] = useState<PromotionsFilterId>('todos')
  const [isHeaderCompact, setIsHeaderCompact] = useState(false)

  const scrollPageToTop = () => {
    pageRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    setIsHeaderCompact(false)
  }

  const handleFilterClick = (filterId: PromotionsFilterId) => {
    setActiveFilter(filterId)
    scrollPageToTop()
  }

  useSlidingActiveIndicator({
    activeKey: activeFilter,
    refreshKey: isHeaderCompact,
    containerRef: filtersRef,
    getActiveElement: () => filterRefs.current[activeFilter],
  })

  useLayoutEffect(() => {
    const trackEl = tabsTrackRef.current
    const indicatorEl = tabIndicatorRef.current
    const activeLabelEl = tabLabelRefs.current[activeTab]

    if (!trackEl || !indicatorEl || !activeLabelEl) return

    const trackRect = trackEl.getBoundingClientRect()
    const labelRect = activeLabelEl.getBoundingClientRect()
    const nextX = labelRect.left - trackRect.left + trackEl.scrollLeft
    const nextWidth = labelRect.width
    const shouldAnimate = tabIndicatorReadyRef.current

    const currentStyle = window.getComputedStyle(indicatorEl)
    const currentX = shouldAnimate
      ? getTranslateXFromTransform(currentStyle.transform)
      : nextX
    const currentWidth = shouldAnimate
      ? parseFloat(currentStyle.width) || nextWidth
      : nextWidth

    tabIndicatorAnimationRef.current?.cancel()
    tabIndicatorAnimationRef.current = null

    const applyTarget = () => {
      indicatorEl.style.opacity = '1'
      indicatorEl.style.width = `${nextWidth}px`
      indicatorEl.style.transform = `translate3d(${nextX}px, 0, 0)`
    }

    if (!shouldAnimate) {
      applyTarget()
      tabIndicatorReadyRef.current = true
      return
    }

    if (typeof indicatorEl.animate !== 'function') {
      applyTarget()
      return
    }

    const distance = nextX - currentX
    const overshootX = nextX + Math.sign(distance) * Math.min(Math.abs(distance) * 0.08, 14)
    const animation = indicatorEl.animate(
      [
        {
          opacity: 1,
          transform: `translate3d(${currentX}px, 0, 0)`,
          width: `${currentWidth}px`,
          offset: 0,
          easing: 'cubic-bezier(0.24, 0, 0.28, 1)',
        },
        {
          opacity: 1,
          transform: `translate3d(${overshootX}px, 0, 0)`,
          width: `${nextWidth}px`,
          offset: 0.78,
          easing: 'cubic-bezier(0.18, 1, 0.28, 1)',
        },
        {
          opacity: 1,
          transform: `translate3d(${nextX}px, 0, 0)`,
          width: `${nextWidth}px`,
          offset: 1,
        },
      ],
      {
        duration: TAB_INDICATOR_ANIMATION_DURATION,
        fill: 'forwards',
      }
    )

    tabIndicatorAnimationRef.current = animation
    animation.onfinish = () => {
      if (tabIndicatorAnimationRef.current === animation) {
        tabIndicatorAnimationRef.current = null
        applyTarget()
        animation.cancel()
      }
    }
  }, [activeTab])

  useLayoutEffect(() => {
    const pageEl = pageRef.current
    if (!pageEl) return

    let frame: number | null = null

    const getScrollTop = () =>
      Math.max(
        pageEl.scrollTop,
        window.scrollY,
        document.documentElement.scrollTop,
        document.body.scrollTop
      )

    const updateCompactState = () => {
      frame = null
      const scrollTop = getScrollTop()

      setIsHeaderCompact((isCompact) => {
        if (!isCompact && scrollTop > HEADER_COMPACT_SCROLL_TOP) return true
        if (isCompact && scrollTop < HEADER_EXPAND_SCROLL_TOP) return false
        return isCompact
      })
    }

    const scheduleUpdate = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(updateCompactState)
    }

    scheduleUpdate()
    pageEl.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('scroll', scheduleUpdate, { passive: true })

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      pageEl.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate)
    }
  }, [])

  useLayoutEffect(() => () => {
    tabIndicatorAnimationRef.current?.cancel()
    tabIndicatorAnimationRef.current = null
  }, [])

  return (
    <div
      className={[
        'promotions-page',
        'promotions-page--liquid-glass-new',
        isV2 ? 'promotions-page--v2' : '',
        isHeaderCompact ? 'promotions-page--header-compact' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={pageRef}
    >
      <HeaderComponent
        activeProduct={activeProduct}
        changeProductOnPointerDown={false}
        onProductChange={onProductChange}
      >
        <nav className="promotions-page__tabs" aria-label="Seções de promoções">
          <div className="promotions-page__tabs-track" role="tablist" ref={tabsTrackRef}>
            <span className="promotions-page__tab-indicator" aria-hidden="true" ref={tabIndicatorRef} />
            {promotionTabs.map((tab) => {
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={[
                    'promotions-page__tab',
                    isActive ? 'promotions-page__tab--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                >
                  <span
                    className="promotions-page__tab-label"
                    ref={(el) => {
                      tabLabelRefs.current[tab.id] = el
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        <div
          className="promotions-page__filters sliding-chip-group"
          aria-label="Filtrar promoções"
          ref={filtersRef}
        >
          <span className="sliding-chip-indicator" aria-hidden="true" />
          {promotionFilters.map((filter) => {
            const isActive = activeFilter === filter.id

            return (
              <button
                key={filter.id}
                type="button"
                ref={(el) => {
                  filterRefs.current[filter.id] = el
                }}
                className={[
                  'promotions-page__filter-chip',
                  'sliding-chip',
                  isActive ? 'promotions-page__filter-chip--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleFilterClick(filter.id)}
                aria-pressed={isActive}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </HeaderComponent>

      <main className="promotions-page__content">
        <PromotionsMissionsSection activeFilter={activeFilter} />
      </main>
    </div>
  )
}
