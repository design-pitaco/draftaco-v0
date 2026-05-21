import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
  PixLogoIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { StakeKeyboard, type StakeKeyboardKey } from '../StakeKeyboard'
import './DepositPanel.css'

interface DepositPanelProps {
  isOpen: boolean
  onClose: () => void
}

type PanelMotionState = 'entering' | 'open' | 'closing'
type DepositView = 'form' | 'pix'

const contentTransitionDurationMs = 180
const pixGenerationDelayMs = 3000
const pixCountdownInitialSeconds = 60 * 60 + 60
const maxDepositCents = 99999999
const animatedDepositAmountDurationMs = 520
const pixCode = '00020101021226850014br.gov.bcb.pix0123deposito-teste-sem-link'
const quickDepositOptions = [
  { label: 'R$25', amountCents: 2500 },
  { label: 'R$50', amountCents: 5000 },
  { label: 'R$150', amountCents: 15000 },
  { label: 'R$250', amountCents: 25000 },
]

const formatDepositAmount = (amountCents: number) => (
  (amountCents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
)

const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3

const formatPixCountdown = (remainingSeconds: number) => {
  if (remainingSeconds > 60 * 60) {
    return `60min ${remainingSeconds - 60 * 60}s restantes`
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return `${minutes}min ${seconds}s restantes`
}

const pixPaymentSteps = [
  'Copie o código Pix',
  'Abra o app do seu banco ou instituição financeira e acesse a área do Pix',
  'Escolha a opção "Pix Copia e Cola"',
  'Cole o código e confirme o pagamento',
]

function TestQrCode() {
  const moduleSize = 4
  const quietZone = 10
  const moduleCount = 25
  const modules = []

  const isFinderModule = (x: number, y: number, originX: number, originY: number) => {
    const localX = x - originX
    const localY = y - originY
    if (localX < 0 || localY < 0 || localX > 6 || localY > 6) return false

    return (
      localX === 0
      || localY === 0
      || localX === 6
      || localY === 6
      || (localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4)
    )
  }

  const isFinderClearance = (x: number, y: number, originX: number, originY: number) => (
    x >= originX && x <= originX + 6 && y >= originY && y <= originY + 6
  )

  for (let y = 0; y < moduleCount; y += 1) {
    for (let x = 0; x < moduleCount; x += 1) {
      const isFinder = (
        isFinderModule(x, y, 0, 0)
        || isFinderModule(x, y, 18, 0)
        || isFinderModule(x, y, 0, 18)
      )
      const isReserved = (
        isFinderClearance(x, y, 0, 0)
        || isFinderClearance(x, y, 18, 0)
        || isFinderClearance(x, y, 0, 18)
      )
      const isData = !isReserved && (
        ((x * 7 + y * 11 + x * y) % 5 === 0)
        || ((x + y * 3) % 7 === 0)
        || (x % 4 === 0 && y % 3 === 1)
      )

      if (!isFinder && !isData) continue

      modules.push(
        <rect
          key={`${x}-${y}`}
          x={quietZone + x * moduleSize}
          y={quietZone + y * moduleSize}
          width={moduleSize}
          height={moduleSize}
        />
      )
    }
  }

  return (
    <svg
      className="deposit-panel__qr"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      role="img"
      aria-label="QR Code Pix de teste"
    >
      <rect width="120" height="120" fill="#ffffff" />
      <g fill="#111111">{modules}</g>
    </svg>
  )
}

function AnimatedDepositAmount({
  animationKey,
  isFilled,
  targetValue,
}: {
  animationKey: number
  isFilled: boolean
  targetValue: number
}) {
  const valueRef = useRef<HTMLSpanElement>(null)
  const [initialValue] = useState(targetValue)
  const displayedValue = useRef(targetValue)
  const previousAnimationKey = useRef(animationKey)

  useEffect(() => {
    let frameId: number | null = null
    const startValue = displayedValue.current
    const difference = targetValue - startValue
    const shouldAnimate = animationKey !== previousAnimationKey.current
    previousAnimationKey.current = animationKey

    const setValue = (value: number) => {
      displayedValue.current = value

      if (valueRef.current) {
        valueRef.current.textContent = formatDepositAmount(value)
      }
    }

    if (!shouldAnimate || Math.abs(difference) < 0.005) {
      setValue(targetValue)
      return undefined
    }

    const startedAt = performance.now()

    const tick = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - startedAt) / animatedDepositAmountDurationMs)
      const easedProgress = easeOutCubic(progress)
      const jitter = progress < 0.72
        ? Math.sin(progress * Math.PI * 18) * difference * 0.012
        : 0
      const nextValue = startValue + difference * easedProgress + jitter

      setValue(progress >= 1 ? targetValue : nextValue)

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId)
    }
  }, [animationKey, targetValue])

  return (
    <span
      ref={valueRef}
      className={`deposit-panel__amount${isFilled ? ' deposit-panel__amount--filled' : ''}`}
    >
      {formatDepositAmount(initialValue)}
    </span>
  )
}

export function DepositPanel({ isOpen, onClose }: DepositPanelProps) {
  const [shouldRender, setShouldRender] = useState(false)
  const [motionState, setMotionState] = useState<PanelMotionState>('entering')
  const [view, setView] = useState<DepositView>('form')
  const [amountCents, setAmountCents] = useState(0)
  const [amountAnimationKey, setAmountAnimationKey] = useState(0)
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false)
  const [isGeneratingPix, setIsGeneratingPix] = useState(false)
  const [isContentTransitioning, setIsContentTransitioning] = useState(false)
  const [isPixSummaryExpanded, setIsPixSummaryExpanded] = useState(false)
  const [pixCountdownSeconds, setPixCountdownSeconds] = useState(pixCountdownInitialSeconds)
  const closeTimerRef = useRef<number | null>(null)
  const generateTimerRef = useRef<number | null>(null)
  const openTimerRef = useRef<number | null>(null)
  const openFrameRef = useRef<number | null>(null)
  const shouldRenderRef = useRef(false)
  const swapTimerRef = useRef<number | null>(null)

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current === null) return

    window.clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }, [])

  const clearOpenFrame = useCallback(() => {
    if (openFrameRef.current === null) return

    window.cancelAnimationFrame(openFrameRef.current)
    openFrameRef.current = null
  }, [])

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current === null) return

    window.clearTimeout(openTimerRef.current)
    openTimerRef.current = null
  }, [])

  const clearGenerateTimer = useCallback(() => {
    if (generateTimerRef.current === null) return

    window.clearTimeout(generateTimerRef.current)
    generateTimerRef.current = null
  }, [])

  const clearSwapTimer = useCallback(() => {
    if (swapTimerRef.current === null) return

    window.clearTimeout(swapTimerRef.current)
    swapTimerRef.current = null
  }, [])

  const requestClose = useCallback(() => {
    if (motionState === 'closing') return
    onClose()
  }, [motionState, onClose])

  const applyNumberKey = (key: string) => {
    setAmountCents((currentAmountCents) => {
      const nextDigits = `${currentAmountCents}${key}`.replace(/^0+(?=\d)/, '')
      const nextAmountCents = Math.min(Number(nextDigits), maxDepositCents)

      return Number.isFinite(nextAmountCents) ? nextAmountCents : currentAmountCents
    })
  }

  const removeNumberKey = () => {
    setAmountCents((currentAmountCents) => Math.floor(currentAmountCents / 10))
  }

  const openCalculator = () => {
    setIsCalculatorVisible(true)
  }

  const handleAmountPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    openCalculator()
  }

  const handleAmountClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail === 0) openCalculator()
  }

  const handleQuickOption = (amountCents: number) => {
    setAmountCents(amountCents)
    setAmountAnimationKey((currentAnimationKey) => currentAnimationKey + 1)
    openCalculator()
  }

  const handleQuickOptionPointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    amountCents: number
  ) => {
    event.preventDefault()
    handleQuickOption(amountCents)
  }

  const handleQuickOptionClick = (
    event: MouseEvent<HTMLButtonElement>,
    amountCents: number
  ) => {
    if (event.detail === 0) handleQuickOption(amountCents)
  }

  const handleKeypadKey = (key: StakeKeyboardKey) => {
    if (key === 'ok') {
      setIsCalculatorVisible(false)
      return
    }

    openCalculator()

    if (key === 'backspace') {
      removeNumberKey()
      return
    }

    applyNumberKey(key)
  }

  const handleKeyPointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    key: StakeKeyboardKey
  ) => {
    event.preventDefault()
    handleKeypadKey(key)
  }

  const handleKeyClick = (
    event: MouseEvent<HTMLButtonElement>,
    key: StakeKeyboardKey
  ) => {
    if (event.detail === 0) handleKeypadKey(key)
  }

  const handleCopyPixCode = () => {
    navigator.clipboard?.writeText(pixCode).catch(() => undefined)
  }

  const handleGeneratePix = () => {
    if (!amountCents || isGeneratingPix) return

    clearGenerateTimer()
    clearSwapTimer()
    setIsCalculatorVisible(false)
    setIsGeneratingPix(true)

    generateTimerRef.current = window.setTimeout(() => {
      generateTimerRef.current = null
      setIsContentTransitioning(true)

      swapTimerRef.current = window.setTimeout(() => {
        swapTimerRef.current = null
        setView('pix')
        setIsGeneratingPix(false)
        setIsPixSummaryExpanded(false)
        setPixCountdownSeconds(pixCountdownInitialSeconds)

        window.requestAnimationFrame(() => {
          setIsContentTransitioning(false)
        })
      }, contentTransitionDurationMs)
    }, pixGenerationDelayMs)
  }

  useEffect(() => {
    shouldRenderRef.current = shouldRender
  }, [shouldRender])

  useEffect(() => {
    clearCloseTimer()
    clearGenerateTimer()
    clearOpenFrame()
    clearOpenTimer()
    clearSwapTimer()

    if (isOpen) {
      openTimerRef.current = window.setTimeout(() => {
        openTimerRef.current = null
        setShouldRender(true)
        setMotionState('entering')
        openFrameRef.current = window.requestAnimationFrame(() => {
          openFrameRef.current = window.requestAnimationFrame(() => {
            openFrameRef.current = null
            setMotionState('open')
          })
        })
      }, 0)
      return () => {
        clearCloseTimer()
        clearGenerateTimer()
        clearOpenFrame()
        clearOpenTimer()
        clearSwapTimer()
      }
    }

    if (!shouldRenderRef.current) return undefined

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      setMotionState('closing')
      closeTimerRef.current = window.setTimeout(() => {
        setShouldRender(false)
        setMotionState('entering')
        setView('form')
        setAmountCents(0)
        setIsCalculatorVisible(false)
        setIsGeneratingPix(false)
        setIsContentTransitioning(false)
        setIsPixSummaryExpanded(false)
        setPixCountdownSeconds(pixCountdownInitialSeconds)
        closeTimerRef.current = null
      }, 320)
    }, 0)

    return () => {
      clearCloseTimer()
      clearGenerateTimer()
      clearOpenFrame()
      clearOpenTimer()
      clearSwapTimer()
    }
  }, [clearCloseTimer, clearGenerateTimer, clearOpenFrame, clearOpenTimer, clearSwapTimer, isOpen])

  useEffect(() => () => {
    clearCloseTimer()
    clearGenerateTimer()
    clearOpenFrame()
    clearOpenTimer()
    clearSwapTimer()
  }, [clearCloseTimer, clearGenerateTimer, clearOpenFrame, clearOpenTimer, clearSwapTimer])

  useEffect(() => {
    if (!shouldRender) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [shouldRender])

  useEffect(() => {
    if (!shouldRender) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestClose()
        return
      }

      if (!isCalculatorVisible) return

      if (/^[0-9]$/.test(event.key)) {
        applyNumberKey(event.key)
        return
      }

      if (event.key === 'Backspace') {
        removeNumberKey()
        return
      }

      if (event.key === 'Enter') {
        setIsCalculatorVisible(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCalculatorVisible, requestClose, shouldRender])

  useEffect(() => {
    if (!shouldRender || view !== 'pix') return undefined

    const countdownInterval = window.setInterval(() => {
      setPixCountdownSeconds((currentSeconds) => Math.max(0, currentSeconds - 1))
    }, 1000)

    return () => window.clearInterval(countdownInterval)
  }, [shouldRender, view])

  if (!shouldRender) return null

  const amount = formatDepositAmount(amountCents)
  const hasAmount = amountCents > 0

  return createPortal(
    <div className="deposit-panel__container">
      <div
        className={`deposit-panel__overlay deposit-panel__overlay--${motionState}`}
        onClick={requestClose}
      />
      <aside
        className={[
          'deposit-panel',
          `deposit-panel--${motionState}`,
          isCalculatorVisible ? 'deposit-panel--calculator-visible' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Depositar"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="deposit-panel__header header--gradient-v3">
          <div className="header__bg-light" aria-hidden="true" />
          <div className="header__bg-dark" aria-hidden="true" />
          <div className="header__bg-gradient" aria-hidden="true" />
          <button type="button" className="deposit-panel__back" aria-label="Voltar" onClick={requestClose}>
            <CaretLeftIcon aria-hidden="true" weight="bold" />
          </button>
          <h2 className="deposit-panel__title">Depositar</h2>
        </header>

        <div className="deposit-panel__content">
          <div
            className={[
              'deposit-panel__view',
              view === 'pix' ? 'deposit-panel__view--pix' : 'deposit-panel__view--form',
              isContentTransitioning ? 'deposit-panel__view--transitioning' : '',
              isPixSummaryExpanded ? 'deposit-panel__view--summary-expanded' : '',
            ].filter(Boolean).join(' ')}
          >
            {view === 'form' ? (
              <>
                <section className="deposit-panel__amount-section" aria-label="Valor do depósito">
                  <button
                    type="button"
                    className="deposit-panel__amount-display"
                    aria-label={`Editar valor do depósito: R$ ${amount}`}
                    onPointerDown={handleAmountPointerDown}
                    onClick={handleAmountClick}
                  >
                    <span className="deposit-panel__currency">R$</span>
                    <AnimatedDepositAmount
                      animationKey={amountAnimationKey}
                      isFilled={hasAmount}
                      targetValue={amountCents}
                    />
                  </button>

                  <div className="deposit-panel__quick-options" aria-label="Valores rápidos">
                    {quickDepositOptions.map((option) => (
                      <button
                        type="button"
                        className="deposit-panel__quick-option"
                        key={option.amountCents}
                        onPointerDown={(event) => handleQuickOptionPointerDown(event, option.amountCents)}
                        onClick={(event) => handleQuickOptionClick(event, option.amountCents)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </section>

                <footer className="deposit-panel__footer">
                  <div className="deposit-panel__payment-method">
                    <span>Método de pagamento</span>
                    <span className="deposit-panel__pix">
                      <PixLogoIcon aria-hidden="true" weight="fill" />
                      Pix
                    </span>
                  </div>

                  <div className="deposit-panel__keyboard-stage">
                    <StakeKeyboard
                      isOpen={isCalculatorVisible}
                      ariaLabel="Teclado de depósito"
                      className="deposit-panel__stake-keyboard"
                      onKeyPointerDown={handleKeyPointerDown}
                      onKeyClick={handleKeyClick}
                    />
                  </div>

                  <div className="deposit-panel__confirm-area">
                    <button
                      type="button"
                      className={[
                        'deposit-panel__confirm',
                        isGeneratingPix ? 'deposit-panel__confirm--loading' : '',
                      ].filter(Boolean).join(' ')}
                      disabled={!hasAmount || isGeneratingPix}
                      aria-busy={isGeneratingPix}
                      onClick={handleGeneratePix}
                    >
                      <span className="deposit-panel__confirm-label">Gerar código Pix</span>
                      <span className="deposit-panel__confirm-spinner-wrap" aria-hidden="true">
                        <span className="deposit-panel__confirm-spinner" />
                      </span>
                    </button>
                    <p className="deposit-panel__legal">
                      O Rei do Pitaco é autorizado e em conformidade com as leis
                    </p>
                  </div>
                </footer>
              </>
            ) : (
              <>
                <main className="deposit-panel__pix-main" aria-label="Código Pix gerado">
                  <section className="deposit-panel__pix-intro">
                    <div className="deposit-panel__pix-title-row">
                      <h3>Conclua o Pix de R$ {amount}</h3>
                      <span className="deposit-panel__pix-countdown">
                        {formatPixCountdown(pixCountdownSeconds)}
                      </span>
                    </div>
                    <p>
                      Copie o código abaixo, acesse seu banco ou carteira digital e
                      utilize a opção Pix Copia e Cola.
                    </p>
                  </section>

                  <div className="deposit-panel__qr-wrap">
                    <TestQrCode />
                  </div>

                  <div className="deposit-panel__pix-code-card">
                    <span>{pixCode}</span>
                    <button type="button" onClick={handleCopyPixCode}>
                      Copiar
                      <CaretRightIcon aria-hidden="true" weight="bold" />
                    </button>
                  </div>

                  <div className="deposit-panel__pix-warning">
                    <WarningCircleIcon aria-hidden="true" weight="regular" />
                    <span>
                      Somente serão aceitos depósitos realizados pelo mesmo titular do
                      CPF cadastrado no Rei.
                    </span>
                  </div>

                  <section className="deposit-panel__pix-steps">
                    <h3>Como pagar com Pix?</h3>
                    <ol>
                      {pixPaymentSteps.map((step, index) => (
                        <li key={step}>
                          <span>{index + 1}</span>
                          <p>{step}</p>
                        </li>
                      ))}
                    </ol>
                  </section>
                </main>

                <footer className="deposit-panel__pix-footer">
                  <div className="deposit-panel__pix-summary-header">
                    <strong>Resumo</strong>
                    <button
                      type="button"
                      onClick={() => setIsPixSummaryExpanded((current) => !current)}
                    >
                      {isPixSummaryExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                      {isPixSummaryExpanded ? (
                        <CaretUpIcon aria-hidden="true" weight="bold" />
                      ) : (
                        <CaretDownIcon aria-hidden="true" weight="bold" />
                      )}
                    </button>
                  </div>

                  <div className="deposit-panel__pix-summary-details" aria-hidden={!isPixSummaryExpanded}>
                    <div>
                      <span>Valor do depósito</span>
                      <strong>R$ {amount}</strong>
                    </div>
                    <div>
                      <span>Bônus e ofertas</span>
                      <strong>Não aplicado</strong>
                    </div>
                    <div>
                      <span>Total a pagar</span>
                      <strong>R$ {amount}</strong>
                    </div>
                  </div>

                  <button type="button" className="deposit-panel__bank-button">
                    Abrir aplicativo do banco
                  </button>
                  <p className="deposit-panel__legal deposit-panel__pix-footer-legal">
                    O Rei do Pitaco é autorizado e em conformidade com as leis
                  </p>
                </footer>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>,
    document.body
  )
}
