import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type TransitionEvent } from 'react'
import { CaretRightIcon } from '@phosphor-icons/react'
import './Betslip.css'

import multiplaTurbinadaIcon from '../../assets/multiplaTurbinada.png'
import {
  formatBetslipCurrency,
  formatBetslipOdd,
  type BetslipSummary,
} from '../../hooks/betslipUtils'
import {
  getBetslipTurboBonusCents,
  getBetslipTurboBonusPercent,
} from '../../hooks/betslipTurboBonus'
import { useAnimatedBetslipNumber } from '../../hooks/useAnimatedBetslipNumber'

interface BetslipProps {
  summary?: BetslipSummary
  visible?: boolean
  compactOnly?: boolean
  turboEligibleSelectionCount?: number
  presentationKey?: string | number
  onOpen?: () => void
}

type CountMotionDirection = 'idle' | 'add' | 'remove'

const formatBetslipTurboBonus = (value: number) => `+${Math.max(0, Math.round(value))}%`
const shouldAnimateTurboBonusChange = (startValue: number, targetValue: number) => (
  startValue > 0 && targetValue > 0
)

export function Betslip({
  summary,
  visible = false,
  compactOnly = false,
  turboEligibleSelectionCount,
  presentationKey = 'default',
  onOpen,
}: BetslipProps) {
  const shouldShow = visible && !!summary
  const [isRendered, setIsRendered] = useState(shouldShow)
  const [isPresented, setIsPresented] = useState(false)
  const [presentationCycle, setPresentationCycle] = useState(0)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const presentationStateFrameRef = useRef<number | null>(null)
  const enterFrameRef = useRef<number | null>(null)
  const exitTimeoutRef = useRef<number | null>(null)
  const previousPresentationKeyRef = useRef(presentationKey)
  const previousTurboBonusPercentRef = useRef<number | null>(null)
  const shouldShowRef = useRef(shouldShow)
  const isRenderedRef = useRef(isRendered)
  const isPresentedRef = useRef(isPresented)
  const [turboIconPulseKey, setTurboIconPulseKey] = useState(0)
  const [lastVisibleSummary, setLastVisibleSummary] = useState<BetslipSummary | undefined>(
    summary?.hasSelections ? summary : undefined
  )
  const [lastVisibleTurboEligibleSelectionCount, setLastVisibleTurboEligibleSelectionCount] = useState(
    turboEligibleSelectionCount ?? summary?.selectionCount ?? 0
  )
  const [selectionMotion, setSelectionMotion] = useState({
    direction: 'idle' as CountMotionDirection,
    motionKey: 0,
    selectedOddsCount: summary?.selectedOddsCount ?? 0,
  })

  useLayoutEffect(() => {
    shouldShowRef.current = shouldShow
    isRenderedRef.current = isRendered
    isPresentedRef.current = isPresented
  }, [isPresented, isRendered, shouldShow])

  useEffect(() => {
    const hasPresentationKeyChanged = previousPresentationKeyRef.current !== presentationKey
    previousPresentationKeyRef.current = presentationKey

    if (presentationStateFrameRef.current !== null) {
      window.cancelAnimationFrame(presentationStateFrameRef.current)
      presentationStateFrameRef.current = null
    }

    if (exitTimeoutRef.current !== null) {
      window.clearTimeout(exitTimeoutRef.current)
      exitTimeoutRef.current = null
    }

    if (shouldShow && summary) {
      const shouldRestartPresentation = (
        hasPresentationKeyChanged
        || !isRenderedRef.current
        || !isPresentedRef.current
      )

      presentationStateFrameRef.current = window.requestAnimationFrame(() => {
        presentationStateFrameRef.current = null
        setLastVisibleSummary(summary)
        setLastVisibleTurboEligibleSelectionCount(turboEligibleSelectionCount ?? summary.selectionCount)

        if (shouldRestartPresentation) {
          if (enterFrameRef.current !== null) {
            window.cancelAnimationFrame(enterFrameRef.current)
            enterFrameRef.current = null
          }

          setIsRendered(true)
          setIsPresented(false)
          setPresentationCycle((current) => current + 1)
        }
      })

      return
    }

    if (enterFrameRef.current !== null) {
      window.cancelAnimationFrame(enterFrameRef.current)
      enterFrameRef.current = null
    }

    if (isRenderedRef.current || isPresentedRef.current) {
      presentationStateFrameRef.current = window.requestAnimationFrame(() => {
        presentationStateFrameRef.current = null
        setIsPresented(false)

        exitTimeoutRef.current = window.setTimeout(() => {
          if (!shouldShowRef.current) {
            setIsRendered(false)
          }

          exitTimeoutRef.current = null
        }, 420)
      })
    }
  }, [presentationKey, shouldShow, summary, turboEligibleSelectionCount])

  useLayoutEffect(() => {
    if (!isRendered || !shouldShow || isPresented) return undefined

    const surface = surfaceRef.current
    if (!surface) return undefined

    if (enterFrameRef.current !== null) {
      window.cancelAnimationFrame(enterFrameRef.current)
      enterFrameRef.current = null
    }

    surface.getBoundingClientRect()
    enterFrameRef.current = window.requestAnimationFrame(() => {
      enterFrameRef.current = null

      if (shouldShowRef.current) {
        setIsPresented(true)
      }
    })

    return () => {
      if (enterFrameRef.current !== null) {
        window.cancelAnimationFrame(enterFrameRef.current)
        enterFrameRef.current = null
      }
    }
  }, [isRendered, isPresented, presentationCycle, shouldShow])

  useEffect(() => {
    return () => {
      if (presentationStateFrameRef.current !== null) {
        window.cancelAnimationFrame(presentationStateFrameRef.current)
      }

      if (enterFrameRef.current !== null) {
        window.cancelAnimationFrame(enterFrameRef.current)
      }

      if (exitTimeoutRef.current !== null) {
        window.clearTimeout(exitTimeoutRef.current)
      }
    }
  }, [])

  const handleSurfaceTransitionEnd = useCallback((event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.propertyName !== 'transform') return
    if (shouldShowRef.current) return

    if (exitTimeoutRef.current !== null) {
      window.clearTimeout(exitTimeoutRef.current)
      exitTimeoutRef.current = null
    }

    setIsRendered(false)
  }, [])

  const handleCompactKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    onOpen?.()
  }, [onOpen])

  const renderedSummary = shouldShow ? summary : lastVisibleSummary
  const renderedTurboEligibleSelectionCount = shouldShow
    ? turboEligibleSelectionCount ?? summary?.selectionCount ?? 0
    : lastVisibleTurboEligibleSelectionCount
  const visibleSelectedOddsCount = shouldShow ? summary?.selectedOddsCount ?? 0 : 0
  const animatedTotalOddsLabel = useAnimatedBetslipNumber(
    renderedSummary?.totalOdds ?? 0,
    formatBetslipOdd,
    isPresented && !!renderedSummary
  )
  const turboBonusPercent = getBetslipTurboBonusPercent(renderedTurboEligibleSelectionCount)
  const turboBonusCents = renderedSummary
    ? getBetslipTurboBonusCents({
        bonusPercent: turboBonusPercent,
        potentialWinCents: Math.round(renderedSummary.potentialWin * 100),
        stakeCents: Math.round(renderedSummary.stake * 100),
      })
    : 0
  const boostedPotentialWin = (renderedSummary?.potentialWin ?? 0) + (turboBonusCents / 100)
  const boostedPotentialWinLabel = formatBetslipCurrency(boostedPotentialWin)
  const animatedPotentialWinLabel = useAnimatedBetslipNumber(
    boostedPotentialWin,
    formatBetslipCurrency,
    isPresented && !!renderedSummary
  )
  const animatedTurboBonusLabel = useAnimatedBetslipNumber(
    turboBonusPercent ?? 0,
    formatBetslipTurboBonus,
    isPresented && !!renderedSummary && !!turboBonusPercent,
    shouldAnimateTurboBonusChange
  )
  useEffect(() => {
    let frameId: number | null = null
    const previousTurboBonusPercent = previousTurboBonusPercentRef.current

    if (!turboBonusPercent) {
      previousTurboBonusPercentRef.current = null
      return undefined
    }

    if (
      isPresented
      && previousTurboBonusPercent
      && previousTurboBonusPercent !== turboBonusPercent
    ) {
      frameId = window.requestAnimationFrame(() => {
        setTurboIconPulseKey((current) => current + 1)
      })
    }

    previousTurboBonusPercentRef.current = turboBonusPercent

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId)
    }
  }, [isPresented, turboBonusPercent])

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setSelectionMotion((current) => {
        if (!shouldShow || visibleSelectedOddsCount === 0) {
          if (
            current.selectedOddsCount === 0
            && current.motionKey === 0
            && current.direction === 'idle'
          ) {
            return current
          }

          return {
            direction: 'idle',
            motionKey: 0,
            selectedOddsCount: 0,
          }
        }

        if (current.selectedOddsCount === visibleSelectedOddsCount) return current

        const direction = visibleSelectedOddsCount > current.selectedOddsCount
          ? 'add'
          : 'remove'
        const shouldAnimate = current.selectedOddsCount > 0

        return {
          direction: shouldAnimate ? direction : 'idle',
          motionKey: shouldAnimate ? current.motionKey + 1 : current.motionKey,
          selectedOddsCount: visibleSelectedOddsCount,
        }
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [shouldShow, visibleSelectedOddsCount])

  if (!isRendered || !renderedSummary) return null

  const turboAssistiveLabel = turboBonusPercent
    ? ` Múltipla Turbinada com bônus de ${turboBonusPercent} por cento sobre o lucro se a aposta vencer.`
    : ''

  const presentationClassName = isPresented
    ? 'betslip--visible'
    : shouldShow
      ? 'betslip--pre-enter'
      : 'betslip--hidden'
  const shouldRenderCountBurst = shouldShow
    && selectionMotion.motionKey > 0
    && selectionMotion.direction !== 'idle'
    && selectionMotion.selectedOddsCount === visibleSelectedOddsCount
  const countNumberClassName = [
    'betslip__count-number',
    shouldRenderCountBurst ? `betslip__count-number--${selectionMotion.direction}` : '',
  ]
    .filter(Boolean)
    .join(' ')
  const className = [
    'betslip',
    presentationClassName,
    compactOnly ? 'betslip--compact-only' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className}>
      <div className="betslip__surface" ref={surfaceRef} onTransitionEnd={handleSurfaceTransitionEnd}>
        <div
          className="betslip__compact"
          role="button"
          tabIndex={0}
          aria-label={`Bilhete com ${renderedSummary.selectionCount} seleções. Odds totais ${renderedSummary.totalOddsLabel}. Aposta ${renderedSummary.stakeLabel}. Para ganhar ${boostedPotentialWinLabel}.${turboAssistiveLabel}`}
          onClick={onOpen}
          onKeyDown={handleCompactKeyDown}
        >
          <span className="betslip__metrics" aria-hidden="true">
            <span className="betslip__metric betslip__metric--bets">
              <strong className="betslip__value betslip__count-value">
                <span className="betslip__count-anchor">
                  {shouldRenderCountBurst ? (
                    <span
                      key={`orb-${selectionMotion.motionKey}-${selectionMotion.direction}`}
                      className={`betslip__count-orb betslip__count-orb--${selectionMotion.direction}`}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    key={`count-${selectionMotion.motionKey}-${renderedSummary.selectionCount}`}
                    className={countNumberClassName}
                  >
                    {renderedSummary.selectionCount}
                  </span>
                </span>
              </strong>
              <span className="betslip__label">Bets</span>
            </span>
            <span className="betslip__metric">
              <strong className="betslip__value betslip__value--rolling">{animatedTotalOddsLabel}</strong>
              <span className="betslip__label">Odds</span>
            </span>
            <span className="betslip__metric betslip__metric--stake">
              <strong className="betslip__value">{renderedSummary.stakeLabel}</strong>
              <span className="betslip__label">Aposta</span>
            </span>
          </span>
          <span className="betslip__payout">
            <span className="betslip__payout-button">
              <strong className="betslip__value betslip__value--rolling betslip__value--potential-win" aria-hidden="true">{animatedPotentialWinLabel}</strong>
              <span className={`betslip__payout-label${turboBonusPercent ? ' betslip__payout-label--turbo' : ''}`}>
                {turboBonusPercent ? (
                  <span
                    className="betslip__turbo-tag"
                    aria-hidden="true"
                  >
                    <span className="betslip__turbo-value">{animatedTurboBonusLabel}</span>
                    <img
                      key={`turbo-icon-${turboIconPulseKey}`}
                      src={multiplaTurbinadaIcon}
                      alt=""
                      className={[
                        'betslip__turbo-icon',
                        turboIconPulseKey > 0 ? 'betslip__turbo-icon--pulse' : '',
                      ].filter(Boolean).join(' ')}
                      draggable="false"
                    />
                  </span>
                ) : (
                  <>
                    <span aria-hidden="true">Para ganhar</span>
                    <CaretRightIcon aria-hidden="true" className="betslip__icon" weight="bold" />
                  </>
                )}
              </span>
            </span>
          </span>
        </div>
      </div>
    </div>
  )
}
