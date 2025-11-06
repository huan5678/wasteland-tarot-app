/**
 * WastelandCard Component Tests
 * Fallout-themed tarot card display component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WastelandCard } from '../WastelandCard'

// Mock card data
const mockCard = {
  id: '1',
  name: 'The Vault Dweller',
  description: 'A figure emerging from the safety of underground into the harsh wasteland above.',
  suit: 'MAJOR_ARCANA',
  value: 0,
  card_number: 0,
  image_url: '/cards/vault-dweller.png',
  upright_meaning: 'New beginnings, innocence, potential, fresh start in the wasteland',
  reversed_meaning: 'Recklessness, naivety, poor judgment, unpreparedness for the wasteland',
  fallout_reference: 'Represents the player character leaving Vault 111',
  character_voices: {
    'PIP_BOY': 'New adventure detected! Your journey begins now, user.',
    'SUPER_MUTANT': 'TINY HUMAN LEAVE METAL CAVE. WASTELAND TEACH TINY HUMAN HARD LESSONS.',
    'GHOUL': 'Fresh meat stepping into the sun. Hope you got more luck than sense, smoothskin.',
  },
  radiation_factor: 0.1,
  karma_alignment: 'NEUTRAL'
}

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />
  }
})

describe('WastelandCard', () => {
  describe('Card Display', () => {
    it('should render card with Fallout theme styling', () => {
      render(<WastelandCard card={mockCard} />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHavePipBoyStyle()
      expect(cardElement).toHaveClass('bg-wasteland-dark', 'border-pip-boy-green')
    })

    it('should display card name and number', () => {
      render(<WastelandCard card={mockCard} />)

      expect(screen.getByText('The Vault Dweller')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should show card image with proper alt text', () => {
      render(<WastelandCard card={mockCard} />)

      const cardImage = screen.getByAltText('The Vault Dweller - Wasteland Tarot Card')
      expect(cardImage).toHaveAttribute('src', '/cards/vault-dweller.png')
    })

    it('should display suit badge', () => {
      render(<WastelandCard card={mockCard} />)

      expect(screen.getByText('MAJOR ARCANA')).toBeInTheDocument()
    })
  })

  describe('Radiation Effects', () => {
    it('should show radiation warning for high radiation cards', () => {
      const highRadCard = { ...mockCard, radiation_factor: 0.8 }
      render(<WastelandCard card={highRadCard} />)

      expect(screen.getByTestId('radiation-warning')).toBeInTheDocument()
      expect(screen.getByText(/high radiation detected/i)).toBeInTheDocument()
    })

    it('should apply radiation glow effect for contaminated cards', () => {
      const contaminatedCard = { ...mockCard, radiation_factor: 0.9 }
      render(<WastelandCard card={contaminatedCard} />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHaveRadiationEffect()
    })

    it('should not show radiation effects for clean cards', () => {
      const cleanCard = { ...mockCard, radiation_factor: 0.1 }
      render(<WastelandCard card={cleanCard} />)

      expect(screen.queryByTestId('radiation-warning')).not.toBeInTheDocument()
    })
  })

  describe('Card Orientation', () => {
    it('should display upright card normally', () => {
      render(<WastelandCard card={mockCard} isReversed={false} />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).not.toHaveClass('transform', 'rotate-180')
      expect(screen.getByText(mockCard.upright_meaning)).toBeInTheDocument()
    })

    it('should display reversed card upside down', () => {
      render(<WastelandCard card={mockCard} isReversed={true} />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHaveClass('transform', 'rotate-180')
      expect(screen.getByText(mockCard.reversed_meaning)).toBeInTheDocument()
    })

    it('should show reversed indicator', () => {
      render(<WastelandCard card={mockCard} isReversed={true} />)

      expect(screen.getByText(/reversed/i)).toBeInTheDocument()
      expect(screen.getByTestId('reversed-indicator')).toBeInTheDocument()
    })
  })

  describe('Interactive Features', () => {
    it('should show tooltip on hover with card details', async () => {
      const user = userEvent.setup()
      render(<WastelandCard card={mockCard} showTooltip={true} />)

      const cardElement = screen.getByTestId('wasteland-card')
      await user.hover(cardElement)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
        expect(screen.getByText(mockCard.description)).toBeInTheDocument()
        expect(screen.getByText(mockCard.fallout_reference)).toBeInTheDocument()
      })
    })

    it('should call onClick when card is clickable', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()

      render(<WastelandCard card={mockCard} onClick={mockOnClick} />)

      const cardElement = screen.getByTestId('wasteland-card')
      await user.click(cardElement)

      expect(mockOnClick).toHaveBeenCalledWith(mockCard)
    })

    it('should show click cursor when clickable', () => {
      const mockOnClick = jest.fn()
      render(<WastelandCard card={mockCard} onClick={mockOnClick} />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHaveClass('cursor-pointer')
    })

    it('should not be clickable when disabled', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()

      render(<WastelandCard card={mockCard} onClick={mockOnClick} disabled={true} />)

      const cardElement = screen.getByTestId('wasteland-card')
      await user.click(cardElement)

      expect(mockOnClick).not.toHaveBeenCalled()
      expect(cardElement).toHaveClass('opacity-50', 'cursor-not-allowed')
    })
  })

  describe('Animation Effects', () => {
    it('should animate card reveal like vault door opening', async () => {
      render(<WastelandCard card={mockCard} animate="reveal" />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHaveClass('animate-vault-door-open')

      // Check for scanline effect
      expect(screen.getByTestId('scanline-effect')).toBeInTheDocument()
    })

    it('should animate card flip for revealing', async () => {
      render(<WastelandCard card={mockCard} animate="flip" />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHaveClass('animate-card-flip')
    })

    it('should pulse when selected', () => {
      render(<WastelandCard card={mockCard} isSelected={true} />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHaveClass('animate-pulse', 'ring-2', 'ring-pip-boy-green')
    })
  })

  describe('Character Voice Integration', () => {
    it('should show character interpretation when expanded', () => {
      render(
        <WastelandCard
          card={mockCard}
          characterVoice="PIP_BOY"
          showInterpretation={true}
        />
      )

      expect(screen.getByText(mockCard.character_voices.PIP_BOY)).toBeInTheDocument()
      expect(screen.getByText(/pip-boy says/i)).toBeInTheDocument()
    })

    it('should switch interpretation based on character voice', () => {
      const { rerender } = render(
        <WastelandCard
          card={mockCard}
          characterVoice="GHOUL"
          showInterpretation={true}
        />
      )

      expect(screen.getByText(mockCard.character_voices.GHOUL)).toBeInTheDocument()

      rerender(
        <WastelandCard
          card={mockCard}
          characterVoice="SUPER_MUTANT"
          showInterpretation={true}
        />
      )

      expect(screen.getByText(mockCard.character_voices.SUPER_MUTANT)).toBeInTheDocument()
    })
  })

  describe('Karma Alignment', () => {
    it('should show karma indicator for card alignment', () => {
      const goodKarmaCard = { ...mockCard, karma_alignment: 'GOOD' }
      render(<WastelandCard card={goodKarmaCard} showKarmaIndicator={true} />)

      expect(screen.getByTestId('karma-indicator')).toBeInTheDocument()
      expect(screen.getByText(/good karma/i)).toBeInTheDocument()
    })

    it('should style card border based on karma alignment', () => {
      const evilKarmaCard = { ...mockCard, karma_alignment: 'EVIL' }
      render(<WastelandCard card={evilKarmaCard} />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHaveClass('border-red-500')
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading skeleton when card is loading', () => {
      render(<WastelandCard card={null} loading={true} />)

      expect(screen.getByTestId('card-skeleton')).toBeInTheDocument()
      expect(screen.getByText(/loading card data/i)).toBeInTheDocument()
    })

    it('should handle missing card image gracefully', () => {
      const cardWithoutImage = { ...mockCard, image_url: '' }
      render(<WastelandCard card={cardWithoutImage} />)

      expect(screen.getByTestId('placeholder-image')).toBeInTheDocument()
      expect(screen.getByText(/image not available/i)).toBeInTheDocument()
    })

    it('should show error state for corrupted card data', () => {
      render(<WastelandCard card={null} error="Card data corrupted by radiation" />)

      expect(screen.getByTestId('card-error')).toBeInTheDocument()
      expect(screen.getByText(/card data corrupted by radiation/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible for vault dwellers with disabilities', () => {
      render(<WastelandCard card={mockCard} />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toBeAccessibleInVault()
      expect(cardElement).toHaveAttribute('role', 'img')
      expect(cardElement).toHaveAttribute('aria-label', 'The Vault Dweller - Wasteland Tarot Card')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      const mockOnClick = jest.fn()

      render(<WastelandCard card={mockCard} onClick={mockOnClick} />)

      const cardElement = screen.getByTestId('wasteland-card')
      await user.tab()
      expect(cardElement).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(mockOnClick).toHaveBeenCalled()
    })

    it('should announce card state changes', async () => {
      const { rerender } = render(<WastelandCard card={mockCard} isSelected={false} />)

      rerender(<WastelandCard card={mockCard} isSelected={true} />)

      expect(screen.getByRole('status')).toHaveTextContent(/selected/i)
    })
  })

  describe('Sound Effects', () => {
    it('should play card flip sound on interaction', async () => {
      const user = userEvent.setup()
      const mockPlaySound = jest.fn()
      global.WastelandTarot.PipBoyInterface.playSound = mockPlaySound

      render(<WastelandCard card={mockCard} onClick={jest.fn()} />)

      const cardElement = screen.getByTestId('wasteland-card')
      await user.click(cardElement)

      expect(mockPlaySound).toHaveBeenCalledWith('card-flip')
    })

    it('should play radiation warning sound for contaminated cards', () => {
      const mockPlaySound = jest.fn()
      global.WastelandTarot.PipBoyInterface.playSound = mockPlaySound

      const contaminatedCard = { ...mockCard, radiation_factor: 0.9 }
      render(<WastelandCard card={contaminatedCard} />)

      expect(mockPlaySound).toHaveBeenCalledWith('radiation-warning')
    })
  })

  describe('Size Variants', () => {
    it('should render in different sizes', () => {
      const { rerender } = render(<WastelandCard card={mockCard} size="small" />)

      let cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHaveClass('w-24', 'h-36')

      rerender(<WastelandCard card={mockCard} size="large" />)

      cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHaveClass('w-64', 'h-96')
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom CSS classes', () => {
      render(<WastelandCard card={mockCard} className="custom-card-style" />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHaveClass('custom-card-style')
    })

    it('should support custom styling based on position', () => {
      render(<WastelandCard card={mockCard} position="past" />)

      const cardElement = screen.getByTestId('wasteland-card')
      expect(cardElement).toHaveClass('position-past')
      expect(screen.getByText(/past/i)).toBeInTheDocument()
    })
  })
})