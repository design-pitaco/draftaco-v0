import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { CaretRightIcon } from '@phosphor-icons/react'
import './SportRail.css'

import iconAoVivo from '../../assets/iconAoVivo.png'
import iconDestaque from '../../assets/iconSports/fire.png'
import iconBasquete from '../../assets/iconSports/basketball.png'
import iconCsgo from '../../assets/iconSports/csgo.png'
import iconEsoccer from '../../assets/iconSports/e-soccer.png'
import iconFutebol from '../../assets/iconSports/soccer.png'
import iconMore from '../../assets/iconSports/more.png'
import iconTenis from '../../assets/iconSports/tennis.png'
import { getCompetitionRailBadge } from '../../data/competitionBadges'
import type { ProductRailBaseItem, ProductRailSection } from '../../types/home'
import type { CompetitionLinkTarget } from '../../utils/competitionNavigation'
import { MoreSportsBottomSheet } from '../BottomSheet'

interface SportRailBaseItem extends ProductRailBaseItem {
  type: 'sport' | 'competition' | 'more'
}

interface SportRailSportItem extends SportRailBaseItem {
  type: 'sport'
  sportId: string
}

interface SportRailCompetitionItem extends SportRailBaseItem {
  type: 'competition'
  sportId: string
  competitionId: string
  competitionName: string
}

interface SportRailMoreItem extends SportRailBaseItem {
  type: 'more'
  isMore: true
}

type SportRailItem = SportRailSportItem | SportRailCompetitionItem | SportRailMoreItem

interface SportRailProps {
  activeSport?: string | null
  selectedCompetitionId?: string | null
  selectedCompetitionName?: string | null
  extraCompetitions?: CompetitionLinkTarget[]
  onSportChange?: (sportId: string) => void
  onOpenCompetition?: (target: CompetitionLinkTarget) => void
}

interface ProductRailProps<TItem extends ProductRailBaseItem> {
  sections: ProductRailSection<TItem>[]
  activeItemId: string
  isSportPage?: boolean
  renderAfter?: ReactNode
  getScrollAnchorId?: (item: TItem | undefined) => string | null
  hasLiveIndicator?: (item: TItem) => boolean
  onSelectItem?: (item: TItem) => void
}

const competitionRailSections: ProductRailSection<SportRailItem>[] = [
  {
    id: 'destaques',
    className: 'sport-rail__section--lead',
    items: [
      {
        id: 'destaques',
        type: 'sport',
        sportId: 'destaques',
        icon: iconDestaque,
        label: 'Destaques',
        clickable: true,
      },
    ],
  },
  {
    id: 'futebol',
    className: 'sport-rail__section--divided',
    items: [
      {
        id: 'futebol',
        type: 'sport',
        sportId: 'futebol',
        icon: iconFutebol,
        label: 'Futebol',
        clickable: true,
      },
      {
        id: 'competition:fut-brasileiro',
        type: 'competition',
        sportId: 'futebol',
        competitionId: 'fut-brasileiro',
        competitionName: 'Brasileirão Série A',
        icon: getCompetitionRailBadge('fut-brasileiro', iconFutebol),
        label: 'Brasileirão',
        clickable: true,
      },
      {
        id: 'competition:fut-champions',
        type: 'competition',
        sportId: 'futebol',
        competitionId: 'fut-champions',
        competitionName: 'Champions League',
        icon: getCompetitionRailBadge('fut-champions', iconFutebol),
        label: 'Champions',
        clickable: true,
      },
      {
        id: 'competition:fut-premier-league',
        type: 'competition',
        sportId: 'futebol',
        competitionId: 'fut-premier-league',
        competitionName: 'Premier League',
        icon: getCompetitionRailBadge('fut-premier-league', iconFutebol),
        label: 'Premier',
        clickable: true,
      },
      {
        id: 'competition:fut-laliga',
        type: 'competition',
        sportId: 'futebol',
        competitionId: 'fut-laliga',
        competitionName: 'LaLiga',
        icon: getCompetitionRailBadge('fut-laliga', iconFutebol),
        label: 'La Liga',
        clickable: true,
      },
      {
        id: 'competition:fut-bundesliga',
        type: 'competition',
        sportId: 'futebol',
        competitionId: 'fut-bundesliga',
        competitionName: 'Bundesliga',
        icon: getCompetitionRailBadge('fut-bundesliga', iconFutebol),
        label: 'Bundesliga',
        clickable: true,
      },
    ],
  },
  {
    id: 'basquete',
    className: 'sport-rail__section--divided sport-rail__section--compact',
    items: [
      {
        id: 'basquete',
        type: 'sport',
        sportId: 'basquete',
        icon: iconBasquete,
        label: 'Basquete',
        clickable: true,
      },
      {
        id: 'competition:bsq-nba',
        type: 'competition',
        sportId: 'basquete',
        competitionId: 'bsq-nba',
        competitionName: 'NBA',
        icon: getCompetitionRailBadge('bsq-nba', iconBasquete),
        label: 'NBA',
        clickable: true,
      },
    ],
  },
  {
    id: 'tenis',
    className: 'sport-rail__section--divided',
    items: [
      {
        id: 'tenis',
        type: 'sport',
        sportId: 'tenis',
        icon: iconTenis,
        label: 'Tênis',
        clickable: false,
      },
      {
        id: 'competition:ten-roma-masters',
        type: 'competition',
        sportId: 'tenis',
        competitionId: 'ten-roma-masters',
        competitionName: 'Roma Masters',
        icon: getCompetitionRailBadge('ten-roma-masters', iconTenis),
        label: 'Roma',
        clickable: false,
      },
    ],
  },
  {
    id: 'esoccer',
    className: 'sport-rail__section--divided',
    items: [
      {
        id: 'esoccer',
        type: 'sport',
        sportId: 'esoccer',
        icon: iconEsoccer,
        label: 'Esoccer',
        clickable: false,
      },
    ],
  },
  {
    id: 'cs',
    className: 'sport-rail__section--divided',
    items: [
      {
        id: 'cs',
        type: 'sport',
        sportId: 'cs',
        icon: iconCsgo,
        label: 'CS',
        clickable: false,
      },
    ],
  },
  {
    id: 'outros',
    className: 'sport-rail__section--tail',
    items: [
      {
        id: 'outros',
        type: 'more',
        icon: iconMore,
        label: 'Mais',
        clickable: true,
        isMore: true,
      },
    ],
  },
]

const liveSports = ['futebol', 'basquete', 'tenis']

const liveCompetitionIds = new Set([
  'fut-brasileiro',
  'fut-brasileirao-a',
  'fut-champions',
  'fut-premier-league',
  'fut-laliga',
  'fut-mls',
  'fut-bundesliga',
  'brasil-serie-a',
  'champions-league',
  'premier-league',
  'la-liga',
  'mls',
  'bundesliga',
  'bsq-nba',
  'bsq-nba-2',
  'bsq-ncaab',
  'bsq-nbb',
  'bsq-br-nbb',
  'nba',
  'ncaab',
  'brasil-nbb',
  'eurocup-women',
  'ten-roma-masters',
  'ten-parma-f',
  'ten-bordeaux',
])

const hasSportRailLiveIndicator = (item: SportRailItem) => {
  if (item.type === 'sport') return liveSports.includes(item.sportId)
  if (item.type === 'competition') return liveCompetitionIds.has(item.competitionId)
  return false
}

const setProductRailActiveIndicator = (
  listEl: HTMLDivElement | null,
  activeItem: HTMLElement | null | undefined
): boolean => {
  const activeIcon = activeItem?.querySelector<HTMLElement>('.sport-rail__icon')

  if (!listEl || !activeIcon) {
    return false
  }

  const listRect = listEl.getBoundingClientRect()
  const iconRect = activeIcon.getBoundingClientRect()

  listEl.style.setProperty('--sport-rail-active-x', `${iconRect.left - listRect.left}px`)
  listEl.style.setProperty('--sport-rail-active-y', `${iconRect.top - listRect.top}px`)
  listEl.style.setProperty('--sport-rail-active-width', `${iconRect.width}px`)
  listEl.style.setProperty('--sport-rail-active-height', `${iconRect.height}px`)
  return true
}

const getDefaultProductRailScrollAnchorId = <TItem extends ProductRailBaseItem>(
  item: TItem | undefined
) => item?.id ?? null

const productRailItemWidth = 56
const productRailPaddingLeft = 12
const productRailFullVisibleItems = 5
const productRailVisibleItems = productRailFullVisibleItems + 0.5

const getProductRailGap = (viewportWidth: number) => Math.max(
  0,
  (
    viewportWidth -
    productRailPaddingLeft -
    productRailVisibleItems * productRailItemWidth
  ) / productRailFullVisibleItems
)

const getSportRailScrollAnchorId = (item: SportRailItem | undefined) => {
  if (!item) return null
  return item.id
}

const getSportRailFallbackIcon = (sportId: string) => {
  if (sportId === 'basquete') return iconBasquete
  if (sportId === 'tenis') return iconTenis
  if (sportId === 'futebol') return iconFutebol
  return ''
}

const getDynamicCompetitionLabel = (competitionName: string) =>
  competitionName.replace(/^.+ - /, '')

const createDynamicCompetitionItem = (
  competitionId: string,
  competitionName: string,
  sportId: string
): SportRailCompetitionItem => ({
  id: `competition:${competitionId}`,
  type: 'competition',
  sportId,
  competitionId,
  competitionName,
  icon: getCompetitionRailBadge(competitionId, getSportRailFallbackIcon(sportId)),
  label: getDynamicCompetitionLabel(competitionName),
  clickable: sportId !== 'tenis',
})

export function ProductRail<TItem extends ProductRailBaseItem>({
  sections,
  activeItemId,
  isSportPage = false,
  renderAfter,
  getScrollAnchorId = getDefaultProductRailScrollAnchorId,
  hasLiveIndicator,
  onSelectItem,
}: ProductRailProps<TItem>) {
  const [gap, setGap] = useState(() => getProductRailGap(
    typeof window === 'undefined' ? 390 : window.innerWidth
  ))
  const [hasMoreItemsLeft, setHasMoreItemsLeft] = useState(false)
  const [hasMoreItemsRight, setHasMoreItemsRight] = useState(false)
  const [hasUserScrolledRail, setHasUserScrolledRail] = useState(false)
  const [isRailScrolledFromStart, setIsRailScrolledFromStart] = useState(false)
  const [isActiveIndicatorReady, setIsActiveIndicatorReady] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const hasUserScrolledRailRef = useRef(false)
  const hasAlignedActiveScrollRef = useRef(false)
  const flatRailItems = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections]
  )
  const activeRailItemIndex = flatRailItems.findIndex((item) => item.id === activeItemId)
  const activeScrollAnchorItemId = getScrollAnchorId(flatRailItems[activeRailItemIndex])
  const activeScrollAnchorIndex = flatRailItems.findIndex((item) => item.id === activeScrollAnchorItemId)

  const resetRailUserScrollHint = useCallback(() => {
    hasUserScrolledRailRef.current = false
    setHasUserScrolledRail(false)
    setHasMoreItemsLeft(false)
  }, [])

  const updateActiveIndicator = useCallback(() => {
    const isReady = setProductRailActiveIndicator(
      listRef.current,
      itemRefs.current[activeRailItemIndex]
    )

    setIsActiveIndicatorReady((current) => (
      current === isReady ? current : isReady
    ))
  }, [activeRailItemIndex])

  useLayoutEffect(() => {
    const calculateGap = () => {
      const viewportWidth = listRef.current?.parentElement?.clientWidth || window.innerWidth

      setGap(getProductRailGap(viewportWidth))
    }

    calculateGap()
    window.addEventListener('resize', calculateGap)
    return () => window.removeEventListener('resize', calculateGap)
  }, [])

  useLayoutEffect(() => {
    updateActiveIndicator()
  }, [gap, updateActiveIndicator])

  useEffect(() => {
    const listEl = listRef.current
    const containerEl = listEl?.parentElement
    if (!listEl || !containerEl) return

    let frame: number | null = null

    const updateScrollHint = () => {
      frame = null
      const nextIsRailScrolledFromStart = containerEl.scrollLeft > 2
      const nextHasMoreItemsLeft =
        hasUserScrolledRailRef.current && nextIsRailScrolledFromStart
      const nextHasMoreItemsRight =
        containerEl.scrollLeft + containerEl.clientWidth < containerEl.scrollWidth - 2

      setIsRailScrolledFromStart((current) => (
        current === nextIsRailScrolledFromStart ? current : nextIsRailScrolledFromStart
      ))
      setHasMoreItemsLeft((current) => (
        current === nextHasMoreItemsLeft ? current : nextHasMoreItemsLeft
      ))
      setHasMoreItemsRight((current) => (
        current === nextHasMoreItemsRight ? current : nextHasMoreItemsRight
      ))
    }

    const scheduleUpdate = () => {
      if (frame !== null) return
      frame = window.requestAnimationFrame(updateScrollHint)
    }

    const markUserScrolledRail = () => {
      if (!hasUserScrolledRailRef.current) {
        hasUserScrolledRailRef.current = true
        setHasUserScrolledRail(true)
      }

      scheduleUpdate()
    }

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > 0 || (event.shiftKey && Math.abs(event.deltaY) > 0)) {
        markUserScrolledRail()
      }
    }

    let isPointerDown = false
    const handlePointerDown = () => {
      isPointerDown = true
    }
    const handlePointerMove = () => {
      if (isPointerDown) markUserScrolledRail()
    }
    const handlePointerUp = () => {
      isPointerDown = false
    }

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(scheduleUpdate)
      : null

    scheduleUpdate()
    containerEl.addEventListener('scroll', scheduleUpdate, { passive: true })
    containerEl.addEventListener('wheel', handleWheel, { passive: true })
    containerEl.addEventListener('touchmove', markUserScrolledRail, { passive: true })
    containerEl.addEventListener('pointerdown', handlePointerDown)
    containerEl.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    window.addEventListener('resize', scheduleUpdate)
    resizeObserver?.observe(containerEl)
    resizeObserver?.observe(listEl)

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame)
      containerEl.removeEventListener('scroll', scheduleUpdate)
      containerEl.removeEventListener('wheel', handleWheel)
      containerEl.removeEventListener('touchmove', markUserScrolledRail)
      containerEl.removeEventListener('pointerdown', handlePointerDown)
      containerEl.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      window.removeEventListener('resize', scheduleUpdate)
      resizeObserver?.disconnect()
    }
  }, [flatRailItems.length])

  useEffect(() => {
    const listEl = listRef.current
    if (!listEl) return

    const activeItem = itemRefs.current[activeRailItemIndex]
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateActiveIndicator)
      : null

    resizeObserver?.observe(listEl)
    if (activeItem) resizeObserver?.observe(activeItem)
    window.addEventListener('resize', updateActiveIndicator)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateActiveIndicator)
    }
  }, [activeRailItemIndex, updateActiveIndicator])

  const scrollRailItemToStart = useCallback((itemIndex: number, behavior: ScrollBehavior = 'smooth') => {
    const itemEl = itemRefs.current[itemIndex]
    const containerEl = listRef.current?.parentElement
    if (!itemEl || !containerEl) return

    const itemRect = itemEl.getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()
    const containerStyle = window.getComputedStyle(containerEl)
    const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0
    const targetLeft = containerEl.scrollLeft + itemRect.left - containerRect.left - paddingLeft
    const maxScrollLeft = Math.max(containerEl.scrollWidth - containerEl.clientWidth, 0)
    const nextScrollLeft = Math.min(Math.max(targetLeft, 0), maxScrollLeft)

    containerEl.scrollTo({ left: nextScrollLeft, behavior })
  }, [])

  const scrollRailItemToStartById = useCallback((itemId: string | null, behavior: ScrollBehavior = 'smooth') => {
    if (!itemId) return

    const itemIndex = flatRailItems.findIndex((item) => item.id === itemId)
    if (itemIndex < 0) return

    scrollRailItemToStart(itemIndex, behavior)
  }, [flatRailItems, scrollRailItemToStart])

  useLayoutEffect(() => {
    if (activeScrollAnchorIndex < 0) return

    scrollRailItemToStart(
      activeScrollAnchorIndex,
      hasAlignedActiveScrollRef.current ? 'smooth' : 'auto'
    )
    hasAlignedActiveScrollRef.current = true
  }, [
    activeScrollAnchorIndex,
    gap,
    scrollRailItemToStart,
  ])

  const getRailItemIndex = (item: TItem) =>
    flatRailItems.findIndex((railItem) => railItem.id === item.id)

  const handleItemClick = (item: TItem) => {
    const itemIndex = getRailItemIndex(item)
    const isActive = activeRailItemIndex === itemIndex

    if (isActive) return

    resetRailUserScrollHint()
    scrollRailItemToStartById(getScrollAnchorId(item))
    onSelectItem?.(item)
  }

  const renderIcon = (item: TItem, isActive: boolean) => (
    <div className={`sport-rail__icon${isActive ? ' sport-rail__icon--active' : ''}`}>
      {item.icon && <img src={item.icon} alt={item.label} />}
      {hasLiveIndicator?.(item) && (
        <span className="sport-rail__live-indicator" aria-label="Ao vivo">
          <img src={iconAoVivo} alt="" className="sport-rail__live-icon" />
        </span>
      )}
    </div>
  )

  const renderItem = (item: TItem) => {
    const itemIndex = getRailItemIndex(item)
    const isActive = activeRailItemIndex === itemIndex
    const isClickable = item.isMore || item.clickable !== false
    const isStatic = !isClickable || isActive
    const className = [
      'sport-rail__item',
      isActive ? 'sport-rail__item--active' : '',
      isStatic ? 'sport-rail__item--static' : '',
    ]
      .filter(Boolean)
      .join(' ')

    if (!isClickable) {
      return (
        <div
          key={item.id}
          ref={(el) => { itemRefs.current[itemIndex] = el }}
          className={className}
          aria-disabled="true"
        >
          {renderIcon(item, isActive)}
          <span className="sport-rail__label">{item.label}</span>
        </div>
      )
    }

    return (
      <button
        key={item.id}
        ref={(el) => { itemRefs.current[itemIndex] = el }}
        type="button"
        className={className}
        aria-pressed={item.isMore ? undefined : isActive}
        aria-haspopup={item.isMore ? 'dialog' : undefined}
        aria-current={isActive ? 'page' : undefined}
        onClick={() => handleItemClick(item)}
      >
        {renderIcon(item, isActive)}
        <span className="sport-rail__label">{item.label}</span>
      </button>
    )
  }

  const railListStyle = { '--sport-rail-competition-item-gap': `${gap}px` } as CSSProperties
  const railClasses = [
    'sport-rail',
    isSportPage ? 'sport-rail--sport-active' : '',
    'sport-rail--competitions',
    'sport-rail--liquid-glass-new',
    hasMoreItemsLeft ? 'sport-rail--show-left-fade' : '',
    hasMoreItemsRight ? 'sport-rail--show-right-fade' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const railShellClasses = [
    'sport-rail-shell',
    'sport-rail-shell--competitions',
    !hasUserScrolledRail && !isRailScrolledFromStart && hasMoreItemsRight
      ? 'sport-rail-shell--show-right-arrow'
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div className={railShellClasses}>
        <div className={railClasses}>
          <div
            className={[
              'sport-rail__list',
              'sport-rail__list--competitions',
              isActiveIndicatorReady ? 'sport-rail__list--indicator-ready' : '',
              'sport-rail__list--liquid-glass-new',
            ]
              .filter(Boolean)
              .join(' ')}
            ref={listRef}
            style={railListStyle}
          >
            <span className="sport-rail__active-indicator" aria-hidden="true" />
            {sections.map((section) => (
              <div
                key={section.id}
                className={`sport-rail__section${section.className ? ` ${section.className}` : ''}`}
              >
                {section.items.map(renderItem)}
              </div>
            ))}
          </div>
        </div>
        <span className="sport-rail__scroll-arrow" aria-hidden="true">
          <CaretRightIcon className="sport-rail__scroll-arrow-icon" weight="bold" />
        </span>
      </div>
      {renderAfter}
    </>
  )
}

export function SportRail({
  activeSport,
  selectedCompetitionId,
  selectedCompetitionName,
  extraCompetitions = [],
  onSportChange,
  onOpenCompetition,
}: SportRailProps = {}) {
  const [isMoreSportsOpen, setIsMoreSportsOpen] = useState(false)
  const activeSportId = activeSport ?? 'destaques'
  const defaultFlatRailItems = useMemo(
    () => competitionRailSections.flatMap((section) => section.items),
    []
  )
  const defaultRailItemIds = useMemo(
    () => new Set(defaultFlatRailItems.map((item) => item.id)),
    [defaultFlatRailItems]
  )
  const requestedActiveItemId = selectedCompetitionId
    ? `competition:${selectedCompetitionId}`
    : activeSportId
  const dynamicCompetitionItem = useMemo<SportRailCompetitionItem | null>(() => {
    if (!selectedCompetitionId || !selectedCompetitionName || activeSportId === 'destaques') return null
    if (defaultRailItemIds.has(requestedActiveItemId)) return null

    return createDynamicCompetitionItem(selectedCompetitionId, selectedCompetitionName, activeSportId)
  }, [
    activeSportId,
    defaultRailItemIds,
    requestedActiveItemId,
    selectedCompetitionId,
    selectedCompetitionName,
  ])
  const extraCompetitionItems = useMemo(() => {
    const itemIds = new Set<string>()

    return extraCompetitions
      .map((competition) => createDynamicCompetitionItem(competition.id, competition.name, competition.sport))
      .filter((item) => {
        if (defaultRailItemIds.has(item.id) || itemIds.has(item.id)) return false

        itemIds.add(item.id)
        return true
      })
  }, [defaultRailItemIds, extraCompetitions])
  const visibleCustomCompetitionItems = useMemo(() => {
    if (!dynamicCompetitionItem) return extraCompetitionItems
    if (extraCompetitionItems.some((item) => item.id === dynamicCompetitionItem.id)) {
      return extraCompetitionItems
    }

    return [...extraCompetitionItems, dynamicCompetitionItem]
  }, [dynamicCompetitionItem, extraCompetitionItems])

  const railSections = useMemo(() => {
    if (visibleCustomCompetitionItems.length === 0) return competitionRailSections

    return competitionRailSections.map((section) => (
      visibleCustomCompetitionItems.some((item) => item.sportId === section.id)
        ? {
            ...section,
            items: [
              ...section.items,
              ...visibleCustomCompetitionItems.filter((item) => item.sportId === section.id),
            ],
          }
        : section
    ))
  }, [visibleCustomCompetitionItems])
  const flatRailItems = useMemo(
    () => railSections.flatMap((section) => section.items),
    [railSections]
  )
  const activeRailItemId = flatRailItems.some((item) => item.id === requestedActiveItemId)
    ? requestedActiveItemId
    : activeSportId
  const isSportPage = !!activeSport && activeSport !== 'destaques'

  const handleSelectItem = (item: SportRailItem) => {
    if (item.type === 'more') {
      setIsMoreSportsOpen(true)
      return
    }

    if (item.type === 'sport') {
      if (item.clickable) onSportChange?.(item.sportId)
      return
    }

    if (item.type === 'competition' && item.clickable) {
      onOpenCompetition?.({
        id: item.competitionId,
        name: item.competitionName,
        sport: item.sportId,
      })
    }
  }

  return (
    <ProductRail
      sections={railSections}
      activeItemId={activeRailItemId}
      isSportPage={isSportPage}
      getScrollAnchorId={getSportRailScrollAnchorId}
      hasLiveIndicator={hasSportRailLiveIndicator}
      onSelectItem={handleSelectItem}
      renderAfter={(
        <MoreSportsBottomSheet
          isOpen={isMoreSportsOpen}
          onClose={() => setIsMoreSportsOpen(false)}
          activeSport={activeSport}
          onSelectSport={onSportChange}
        />
      )}
    />
  )
}
