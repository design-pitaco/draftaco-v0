import { useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { ListIcon } from '@phosphor-icons/react'
import './HeaderV2.css'
import logoReidoPitaco from '../../assets/logoReidoPitaco.svg'
import type { ProductMode } from '../../types/home'
import { productLabels } from '../../data/homeProducts'

interface HeaderV2Props {
  activeProduct?: ProductMode
  activeSport?: string | null
  rail?: ReactNode
  showMenuButton?: boolean
  changeProductOnPointerDown?: boolean
  onProductChange?: (product: ProductMode) => void
  children?: ReactNode
}

const balanceDisplayOptions = ['R$ 3.400,00', 'R$ 3.400', 'R$ 3.4k']
const headerLogoExpandedWidth = 103
const headerLogoCompactWidth = 96
const headerMinimumControlGap = 20

export function HeaderV2({
  activeProduct = 'apostas',
  activeSport,
  rail,
  showMenuButton = true,
  changeProductOnPointerDown = true,
  onProductChange,
  children,
}: HeaderV2Props = {}) {
  const isSportPage = !!activeSport && activeSport !== 'destaques'
  const [balanceDisplayValue, setBalanceDisplayValue] = useState(balanceDisplayOptions[0])
  const [accountActionsWidth, setAccountActionsWidth] = useState(() => showMenuButton ? 124 : 72)
  const [isLogoCompact, setIsLogoCompact] = useState(false)
  const [displayProduct, setDisplayProduct] = useState<ProductMode>(activeProduct)
  const [isToggleSwitching, setIsToggleSwitching] = useState(false)
  const headerTopRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const accountActionsRef = useRef<HTMLDivElement>(null)
  const balanceRef = useRef<HTMLDivElement>(null)
  const balanceLabelRef = useRef<HTMLSpanElement>(null)
  const balanceValueRef = useRef<HTMLSpanElement>(null)
  const balanceMeasureRefs = useRef<(HTMLSpanElement | null)[]>([])
  const pointerProductChangeRef = useRef<ProductMode | null>(null)
  const pointerProductChangeResetTimerRef = useRef<number | null>(null)
  const toggleSwitchingFrameRef = useRef<number | null>(null)
  const toggleSwitchingResetTimerRef = useRef<number | null>(null)

  const clearPointerProductChangeResetTimer = () => {
    if (pointerProductChangeResetTimerRef.current === null) return

    window.clearTimeout(pointerProductChangeResetTimerRef.current)
    pointerProductChangeResetTimerRef.current = null
  }

  const clearToggleSwitchingTimers = () => {
    if (toggleSwitchingFrameRef.current !== null) {
      window.cancelAnimationFrame(toggleSwitchingFrameRef.current)
      toggleSwitchingFrameRef.current = null
    }

    if (toggleSwitchingResetTimerRef.current !== null) {
      window.clearTimeout(toggleSwitchingResetTimerRef.current)
      toggleSwitchingResetTimerRef.current = null
    }
  }

  const restartLiquidToggleMotion = () => {
    clearToggleSwitchingTimers()
    setIsToggleSwitching(false)
    toggleSwitchingFrameRef.current = window.requestAnimationFrame(() => {
      toggleSwitchingFrameRef.current = null
      setIsToggleSwitching(true)
      toggleSwitchingResetTimerRef.current = window.setTimeout(() => {
        setIsToggleSwitching(false)
        toggleSwitchingResetTimerRef.current = null
      }, 560)
    })
  }

  const scheduleProductChange = (nextProduct: ProductMode) => {
    if (displayProduct !== nextProduct) {
      restartLiquidToggleMotion()
    }

    flushSync(() => {
      if (displayProduct !== nextProduct) {
        setDisplayProduct(nextProduct)
      }
      onProductChange?.(nextProduct)
    })
  }

  const handleTogglePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!changeProductOnPointerDown) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const nextProduct = displayProduct === 'apostas' ? 'cassino' : 'apostas'

    pointerProductChangeRef.current = nextProduct
    clearPointerProductChangeResetTimer()
    pointerProductChangeResetTimerRef.current = window.setTimeout(() => {
      pointerProductChangeRef.current = null
      pointerProductChangeResetTimerRef.current = null
    }, 800)

    scheduleProductChange(nextProduct)
  }

  const handleToggleClick = () => {
    if (pointerProductChangeRef.current !== null) {
      pointerProductChangeRef.current = null
      clearPointerProductChangeResetTimer()
      return
    }

    scheduleProductChange(displayProduct === 'apostas' ? 'cassino' : 'apostas')
  }

  useLayoutEffect(() => {
    const timer = window.setTimeout(() => {
      setDisplayProduct(activeProduct)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [activeProduct])

  useLayoutEffect(() => () => {
    clearPointerProductChangeResetTimer()
    clearToggleSwitchingTimers()
  }, [])

  useLayoutEffect(() => {
    let isDisposed = false

    const updateHeaderLayout = () => {
      const headerTopEl = headerTopRef.current
      const toggleEl = toggleRef.current
      const accountActionsEl = accountActionsRef.current
      const menuEl = accountActionsEl?.querySelector<HTMLElement>('.header__menu-btn')
      if (!headerTopEl || !toggleEl || !accountActionsEl) return
      if (showMenuButton && !menuEl) return

      const headerTopRect = headerTopEl.getBoundingClientRect()
      const headerTopStyle = window.getComputedStyle(headerTopEl)
      const accountActionsStyle = window.getComputedStyle(accountActionsEl)
      const contentWidth = headerTopRect.width
        - (parseFloat(headerTopStyle.paddingLeft) || 0)
        - (parseFloat(headerTopStyle.paddingRight) || 0)
      const toggleWidth = toggleEl.getBoundingClientRect().width
      const menuWidth = showMenuButton ? menuEl?.getBoundingClientRect().width ?? 0 : 0
      const accountGap = showMenuButton ? parseFloat(accountActionsStyle.columnGap || accountActionsStyle.gap) || 0 : 0
      const balanceLabelWidth = balanceLabelRef.current?.getBoundingClientRect().width ?? 0

      const getBalanceTextWidth = (option: string, index: number) => {
        const measureEl = balanceMeasureRefs.current[index]
        if (!measureEl) return 0

        measureEl.textContent = option
        return measureEl.getBoundingClientRect().width
      }

      const getLayoutOption = (logoWidth: number) => {
        for (let index = 0; index < balanceDisplayOptions.length; index += 1) {
          const option = balanceDisplayOptions[index]
          const balanceTextWidth = getBalanceTextWidth(option, index)
          const nextAccountActionsWidth = Math.ceil(Math.max(balanceTextWidth, balanceLabelWidth) + accountGap + menuWidth)
          const requiredWidth =
            logoWidth +
            toggleWidth +
            nextAccountActionsWidth +
            headerMinimumControlGap * 2

          if (contentWidth + 0.5 >= requiredWidth) {
            return {
              accountActionsWidth: nextAccountActionsWidth,
              balanceDisplayValue: option,
            }
          }
        }

        return null
      }

      const expandedLayout = getLayoutOption(headerLogoExpandedWidth)
      const compactLayout = expandedLayout ?? getLayoutOption(headerLogoCompactWidth)
      const fallbackLayout = compactLayout ?? {
        accountActionsWidth: Math.ceil(
          Math.max(
            getBalanceTextWidth(balanceDisplayOptions[balanceDisplayOptions.length - 1], balanceDisplayOptions.length - 1),
            balanceLabelWidth
          ) + accountGap + menuWidth
        ),
        balanceDisplayValue: balanceDisplayOptions[balanceDisplayOptions.length - 1],
      }

      setIsLogoCompact((currentValue) => (
        currentValue === !expandedLayout ? currentValue : !expandedLayout
      ))
      setAccountActionsWidth((currentValue) => (
        currentValue === fallbackLayout.accountActionsWidth ? currentValue : fallbackLayout.accountActionsWidth
      ))
      setBalanceDisplayValue((currentValue) => (
        currentValue === fallbackLayout.balanceDisplayValue ? currentValue : fallbackLayout.balanceDisplayValue
      ))
    }

    updateHeaderLayout()

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateHeaderLayout)
      : null

    if (headerTopRef.current) resizeObserver?.observe(headerTopRef.current)
    if (toggleRef.current) resizeObserver?.observe(toggleRef.current)
    if (accountActionsRef.current) resizeObserver?.observe(accountActionsRef.current)
    window.addEventListener('resize', updateHeaderLayout)
    void document.fonts?.ready.then(() => {
      if (!isDisposed) updateHeaderLayout()
    })

    return () => {
      isDisposed = true
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateHeaderLayout)
    }
  }, [showMenuButton])

  return (
    <header
      className={[
        'header',
        'header--v2',
        isSportPage ? 'header--sport-active' : 'header--competition-rail',
        'header--liquid-glass',
        'header--liquid-glass-new',
        !showMenuButton ? 'header--balance-only' : '',
        isLogoCompact ? 'header--compact-logo' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="header__bg-dark" />
      <div className="header__bg-gradient" />

      <div className="header__top" ref={headerTopRef}>
        <div className="header__logo">
          <img src={logoReidoPitaco} alt="Rei do Pitaco" />
        </div>

        <button
          ref={toggleRef}
          type="button"
          className={[
            'header__toggle',
            `header__toggle--${displayProduct}`,
            isToggleSwitching ? 'header__toggle--liquid-switching' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={`Alternar para ${productLabels[displayProduct === 'apostas' ? 'cassino' : 'apostas'].toLowerCase()}`}
          aria-pressed={displayProduct === 'cassino'}
          onPointerDown={handleTogglePointerDown}
          onClick={handleToggleClick}
        >
          <span className="header__toggle-indicator" aria-hidden="true" />
          <span
            className={`header__toggle-btn${displayProduct === 'apostas' ? ' header__toggle-btn--active' : ''}`}
          >
            {productLabels.apostas}
          </span>
          <span
            className={`header__toggle-btn${displayProduct === 'cassino' ? ' header__toggle-btn--active' : ''}`}
          >
            {productLabels.cassino}
          </span>
        </button>

        <div
          className="header__account-actions"
          ref={accountActionsRef}
          style={{ width: `${accountActionsWidth}px` }}
        >
          <div className="header__balance" aria-label={`Saldo disponível: ${balanceDisplayOptions[0]}`} ref={balanceRef}>
            <span className="header__balance-label" ref={balanceLabelRef}>Saldo</span>
            <span className="header__balance-value" ref={balanceValueRef}>{balanceDisplayValue}</span>
            <span className="header__balance-measure" aria-hidden="true">
              {balanceDisplayOptions.map((option, index) => (
                <span
                  key={option}
                  className="header__balance-measure-option"
                  ref={(el) => { balanceMeasureRefs.current[index] = el }}
                >
                  {option}
                </span>
              ))}
            </span>
          </div>
          {showMenuButton && (
            <button type="button" className="header__menu-btn" aria-label="Abrir menu">
              <ListIcon aria-hidden="true" className="header__menu-icon" weight="bold" />
            </button>
          )}
        </div>
      </div>

      {rail}
      {children}
    </header>
  )
}
