import { useCallback, useEffect, useRef, useState, type AnimationEvent } from 'react'
import { CaretUpIcon } from '@phosphor-icons/react'
import './Betslip.css'

import {
  formatBetslipCurrency,
  formatBetslipOdd,
  type BetslipSummary,
} from '../../hooks/betslipUtils'
import { useAnimatedBetslipNumber } from '../../hooks/useAnimatedBetslipNumber'

interface BetslipProps {
  summary?: BetslipSummary
  visible?: boolean
  compactOnly?: boolean
  presentationKey?: string | number
  onOpen?: () => void
}

type CountMotionDirection = 'idle' | 'add' | 'remove'

export function Betslip({
  summary,
  visible = false,
  compactOnly = false,
  presentationKey = 'default',
  onOpen,
}: BetslipProps) {
  const shouldShow = visible && !!summary
  const [isRendered, setIsRendered] = useState(shouldShow)
  const [isPresented, setIsPresented] = useState(false)
  const previousPresentationKeyRef = useRef(presentationKey)
  const [lastVisibleSummary, setLastVisibleSummary] = useState<BetslipSummary | undefined>(
    summary?.hasSelections ? summary : undefined
  )
  const [selectionMotion, setSelectionMotion] = useState({
    direction: 'idle' as CountMotionDirection,
    motionKey: 0,
    selectedOddsCount: summary?.selectedOddsCount ?? 0,
  })

  useEffect(() => {
    let frameId: number | null = null
    let presentationFrameId: number | null = null

    if (shouldShow && summary) {
      frameId = window.requestAnimationFrame(() => {
        setLastVisibleSummary(summary)
        setIsRendered(true)

        presentationFrameId = window.requestAnimationFrame(() => {
          setIsPresented(true)
        })
      })

      return () => {
        if (frameId !== null) window.cancelAnimationFrame(frameId)
        if (presentationFrameId !== null) window.cancelAnimationFrame(presentationFrameId)
      }
    }

    frameId = window.requestAnimationFrame(() => {
      setIsPresented(false)
    })

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId)
    }
  }, [shouldShow, summary])

  useEffect(() => {
    if (previousPresentationKeyRef.current === presentationKey) return undefined

    previousPresentationKeyRef.current = presentationKey
    if (!shouldShow || !summary) return undefined

    let resetFrameId: number | null = null
    let presentationFrameId: number | null = null

    resetFrameId = window.requestAnimationFrame(() => {
      setLastVisibleSummary(summary)
      setIsRendered(true)
      setIsPresented(false)

      presentationFrameId = window.requestAnimationFrame(() => {
        setIsPresented(true)
      })
    })

    return () => {
      if (resetFrameId !== null) window.cancelAnimationFrame(resetFrameId)
      if (presentationFrameId !== null) window.cancelAnimationFrame(presentationFrameId)
    }
  }, [presentationKey, shouldShow, summary])

  const handleSurfaceAnimationEnd = useCallback((event: AnimationEvent<HTMLDivElement>) => {
    if (event.animationName !== 'betslipSurfaceOut') return
    if (shouldShow) return

    setIsRendered(false)
  }, [shouldShow])

  const renderedSummary = shouldShow ? summary : lastVisibleSummary
  const visibleSelectedOddsCount = shouldShow ? summary?.selectedOddsCount ?? 0 : 0
  const animatedTotalOddsLabel = useAnimatedBetslipNumber(
    renderedSummary?.totalOdds ?? 0,
    formatBetslipOdd,
    isPresented && !!renderedSummary
  )
  const animatedPotentialWinLabel = useAnimatedBetslipNumber(
    renderedSummary?.potentialWin ?? 0,
    formatBetslipCurrency,
    isPresented && !!renderedSummary
  )

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
      <div className="betslip__surface" onAnimationEnd={handleSurfaceAnimationEnd}>
        <button
          type="button"
          className="betslip__compact"
          aria-label={`Bilhete com ${renderedSummary.selectionCount} seleções. Odds totais ${renderedSummary.totalOddsLabel}. Aposta ${renderedSummary.stakeLabel}. Para ganhar ${renderedSummary.potentialWinLabel}.`}
          onClick={onOpen}
        >
          <span className="betslip__count">
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
          <span className="betslip__table" aria-hidden="true">
            <span className="betslip__cell">
              <span className="betslip__label">Total Odds</span>
              <strong className="betslip__value betslip__value--rolling">{animatedTotalOddsLabel}</strong>
            </span>
            <span className="betslip__cell">
              <span className="betslip__label">Aposta</span>
              <strong className="betslip__value">{renderedSummary.stakeLabel}</strong>
            </span>
            <span className="betslip__cell">
              <span className="betslip__label">Para Ganhar</span>
              <strong className="betslip__value betslip__value--rolling betslip__value--potential-win">{animatedPotentialWinLabel}</strong>
            </span>
          </span>
          <CaretUpIcon aria-hidden="true" className="betslip__icon" weight="bold" />
        </button>
      </div>
    </div>
  )
}
