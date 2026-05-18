import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import './Navbar.css'

import { productNavbarConfigs } from '../../data/homeProducts'
import type { ProductMode } from '../../types/home'

interface NavbarProps {
  activeProduct?: ProductMode
  isV2?: boolean
  activeItemId?: string
  onItemSelect?: (itemId: string) => void
}

const navbarActiveMotionMs = 520

export function Navbar({
  activeProduct = 'apostas',
  isV2 = false,
  activeItemId: controlledActiveItemId,
  onItemSelect,
}: NavbarProps = {}) {
  const navbarConfig = productNavbarConfigs[activeProduct]
  const isControlledActiveItem = controlledActiveItemId !== undefined
  const configuredActiveItemId = controlledActiveItemId ?? navbarConfig.activeItemId
  const [selectedItemId, setSelectedItemId] = useState(configuredActiveItemId)
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const activeBackgroundRef = useRef<HTMLSpanElement | null>(null)
  const previousActiveRectRef = useRef<DOMRect | null>(null)
  const activeBackgroundAnimationRef = useRef<Animation | null>(null)
  const pointerItemSelectionRef = useRef<string | null>(null)
  const pointerItemSelectionResetTimerRef = useRef<number | null>(null)
  const availableItemIds = [
    ...navbarConfig.mainItems.map((item) => item.id),
    navbarConfig.searchItem.id,
  ]
  const activeItemId = availableItemIds.includes(selectedItemId)
    ? selectedItemId
    : navbarConfig.activeItemId
  const navClassName = [
    'navbar',
    isV2 ? 'navbar--liquid-v2' : '',
    isV2 ? 'navbar--liquid-v2-casino' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const panelClassName = ['navbar__panel', isV2 ? 'navbar__panel--liquid-v2' : '']
    .filter(Boolean)
    .join(' ')

  const clearPointerItemSelectionResetTimer = useCallback(() => {
    if (pointerItemSelectionResetTimerRef.current === null) return

    window.clearTimeout(pointerItemSelectionResetTimerRef.current)
    pointerItemSelectionResetTimerRef.current = null
  }, [])

  const selectNavbarItem = useCallback((itemId: string) => {
    if (isV2 && itemId !== activeItemId) {
      previousActiveRectRef.current = itemRefs.current[activeItemId]?.getBoundingClientRect() ?? null
    }

    if (!isControlledActiveItem) {
      setSelectedItemId(itemId)
    }
    onItemSelect?.(itemId)
  }, [activeItemId, isControlledActiveItem, isV2, onItemSelect])

  useEffect(() => {
    setSelectedItemId(configuredActiveItemId)
  }, [configuredActiveItemId])

  const handleItemPointerDown = (itemId: string) => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    pointerItemSelectionRef.current = itemId
    clearPointerItemSelectionResetTimer()
    pointerItemSelectionResetTimerRef.current = window.setTimeout(() => {
      pointerItemSelectionRef.current = null
      pointerItemSelectionResetTimerRef.current = null
    }, 800)

    selectNavbarItem(itemId)
  }

  const handleItemClick = (itemId: string) => () => {
    if (pointerItemSelectionRef.current === itemId) {
      pointerItemSelectionRef.current = null
      clearPointerItemSelectionResetTimer()
      return
    }

    selectNavbarItem(itemId)
  }

  useLayoutEffect(() => {
    if (!isV2) return

    const activeBackgroundEl = activeBackgroundRef.current
    const previousActiveRect = previousActiveRectRef.current
    previousActiveRectRef.current = null

    if (!activeBackgroundEl || !previousActiveRect) return

    const activeRect = activeBackgroundEl.getBoundingClientRect()
    if (!activeRect.width || !activeRect.height) return

    activeBackgroundAnimationRef.current?.cancel()
    activeBackgroundAnimationRef.current = activeBackgroundEl.animate(
      [
        {
          transform: `translate3d(${previousActiveRect.left - activeRect.left}px, ${previousActiveRect.top - activeRect.top}px, 0) scale(${previousActiveRect.width / activeRect.width}, ${previousActiveRect.height / activeRect.height})`,
        },
        { transform: 'translate3d(0, 0, 0) scale(1, 1)' },
      ],
      {
        duration: navbarActiveMotionMs,
        easing: 'cubic-bezier(0.2, 1, 0.28, 1)',
        fill: 'both',
      }
    )

    activeBackgroundAnimationRef.current.addEventListener('finish', () => {
      activeBackgroundAnimationRef.current = null
    }, { once: true })
  }, [activeItemId, isV2])

  useEffect(() => () => {
    clearPointerItemSelectionResetTimer()
    activeBackgroundAnimationRef.current?.cancel()
  }, [clearPointerItemSelectionResetTimer])

  const navbarShell = (
      <div className="navbar__shell">
        <div className={`${panelClassName} navbar__panel--main`}>
          <div className="navbar__items">
            {navbarConfig.mainItems.map((item) => {
              const isActive = activeItemId === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  ref={(node) => {
                    itemRefs.current[item.id] = node
                  }}
                  className={[
                    'navbar__item',
                    isActive ? 'navbar__item--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onPointerDown={handleItemPointerDown(item.id)}
                  onClick={handleItemClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  data-navbar-item-id={item.id}
                >
                  {isV2 && isActive ? (
                    <span
                      className="navbar__item-active-bg"
                      ref={activeBackgroundRef}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="navbar__icon-slot">
                    <img
                      src={item.icon}
                      alt=""
                      className="navbar__icon"
                    />
                  </span>
                  <span className="navbar__label">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className={`${panelClassName} navbar__panel--search`}>
          <button
            type="button"
            ref={(node) => {
              itemRefs.current[navbarConfig.searchItem.id] = node
            }}
            className={[
              'navbar__item',
              'navbar__item--search',
              activeItemId === navbarConfig.searchItem.id ? 'navbar__item--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onPointerDown={handleItemPointerDown(navbarConfig.searchItem.id)}
            onClick={handleItemClick(navbarConfig.searchItem.id)}
            aria-current={activeItemId === navbarConfig.searchItem.id ? 'page' : undefined}
            aria-label="Buscar"
            data-navbar-item-id={navbarConfig.searchItem.id}
          >
            {isV2 && activeItemId === navbarConfig.searchItem.id ? (
              <span
                className="navbar__item-active-bg"
                ref={activeBackgroundRef}
                aria-hidden="true"
              />
            ) : null}
            <span className="navbar__icon-slot">
              <img src={navbarConfig.searchItem.icon} alt="" className="navbar__icon" />
            </span>
            <span className="navbar__label">{navbarConfig.searchItem.label}</span>
          </button>
        </div>
      </div>
  )

  return (
    <nav className={navClassName}>
      {navbarShell}
    </nav>
  )
}
