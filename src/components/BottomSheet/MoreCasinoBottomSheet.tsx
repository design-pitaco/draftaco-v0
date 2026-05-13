import { BottomSheet } from './BottomSheet'
import './MoreSportsBottomSheet.css'
import './MoreCasinoBottomSheet.css'

import iconBrazil from '../../assets/iconPaises/brasil.png'
import iconPlaceholder from '../../assets/iconSports/casino-placeholder.svg'
import iconCrash from '../../assets/iconSports/crash.png'
import iconSlots from '../../assets/iconSports/slots.png'
import iconTable from '../../assets/iconSports/table.png'
import type { CasinoCategoryId } from '../../types/home'

interface MoreCasinoBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  activeCategory?: CasinoCategoryId
  onSelectCategory?: (categoryId: CasinoCategoryId) => void
}

interface MoreCasinoItem {
  id: string
  label: string
  icon: string
  categoryId?: CasinoCategoryId
}

interface MoreCasinoSection {
  id: string
  title: string
  items: MoreCasinoItem[]
}

const casinoSections: MoreCasinoSection[] = [
  {
    id: 'cassino-ao-vivo',
    title: 'Cassino Ao Vivo',
    items: [
      { id: 'brasileiros', label: 'Brasileiros', icon: iconBrazil },
      { id: 'blackjack', label: 'Blackjack', icon: iconTable, categoryId: 'blackjack' },
      { id: 'roleta', label: 'Roleta', icon: iconPlaceholder, categoryId: 'roletas' },
      { id: 'bac-bo-dados', label: 'Bac Bo & Dados', icon: iconPlaceholder },
      { id: 'game-show', label: 'Game Show', icon: iconPlaceholder },
      { id: 'baccarat', label: 'Baccarat', icon: iconPlaceholder },
    ],
  },
  {
    id: 'cassino',
    title: 'Cassino',
    items: [
      { id: 'slots', label: 'Slots', icon: iconSlots, categoryId: 'slots' },
      { id: 'crash', label: 'Crash', icon: iconCrash, categoryId: 'crash' },
      { id: 'poker', label: 'Poker', icon: iconPlaceholder },
      { id: 'video-bingo', label: 'Video Bingo', icon: iconPlaceholder },
      { id: 'jogos-de-mesa', label: 'Mesa', icon: iconPlaceholder },
    ],
  },
]

export function MoreCasinoBottomSheet({
  isOpen,
  onClose,
  activeCategory,
  onSelectCategory,
}: MoreCasinoBottomSheetProps) {
  const handleSelectCategory = (categoryId: CasinoCategoryId | undefined) => {
    if (!categoryId) return
    onSelectCategory?.(categoryId)
    onClose()
  }

  const footer = (
    <button type="button" className="more-sports-bs__footer-btn" onClick={onClose}>
      Fechar
    </button>
  )

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Mais categorias"
      sheetClassName="more-sports-bs more-casino-bs"
      bodyClassName="more-sports-bs__body more-casino-bs__body"
      footerContent={footer}
      blurBackdrop
    >
      <div className="more-casino-bs__sections">
        {casinoSections.map((section) => (
          <section key={section.id} className="more-casino-bs__section">
            <h3 className="more-casino-bs__section-title">{section.title}</h3>
            <div className="more-sports-bs__grid">
              {section.items.map((item) => {
                const isActive = activeCategory === item.categoryId

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`more-sports-bs__card${isActive ? ' more-sports-bs__card--active' : ''}`}
                    onClick={() => handleSelectCategory(item.categoryId)}
                    disabled={!item.categoryId}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <img src={item.icon} alt="" className="more-sports-bs__icon" />
                    <span className="more-sports-bs__label">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </BottomSheet>
  )
}
