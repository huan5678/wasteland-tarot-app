/**
 * CharacterVoiceSelector Component Tests (TDD - Red Phase)
 * Tests for character voice selection component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { CharacterVoiceSelector } from '../CharacterVoiceSelector'

describe('CharacterVoiceSelector', () => {
  const mockCharacters = ['brotherhood_scribe', 'ncr_ranger', 'pip_boy']
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render all available characters', () => {
    render(
      <CharacterVoiceSelector
        characters={mockCharacters}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('Brotherhood Scribe')).toBeInTheDocument()
    expect(screen.getByText('Ncr Ranger')).toBeInTheDocument()
    expect(screen.getByText('Pip Boy')).toBeInTheDocument()
  })

  it('should call onSelect when character clicked', () => {
    render(
      <CharacterVoiceSelector
        characters={mockCharacters}
        onSelect={mockOnSelect}
      />
    )

    const scribeButton = screen.getByRole('radio', { name: /Brotherhood Scribe/i })
    fireEvent.click(scribeButton)

    expect(mockOnSelect).toHaveBeenCalledWith('brotherhood_scribe')
    expect(mockOnSelect).toHaveBeenCalledTimes(1)
  })

  it('should highlight selected character', () => {
    render(
      <CharacterVoiceSelector
        characters={mockCharacters}
        selectedCharacter="pip_boy"
        onSelect={mockOnSelect}
      />
    )

    const pipBoyButton = screen.getByRole('radio', { name: /Pip Boy/i })
    expect(pipBoyButton).toHaveAttribute('aria-checked', 'true')
  })

  it('should not highlight unselected characters', () => {
    render(
      <CharacterVoiceSelector
        characters={mockCharacters}
        selectedCharacter="pip_boy"
        onSelect={mockOnSelect}
      />
    )

    const scribeButton = screen.getByRole('radio', { name: /Brotherhood Scribe/i })
    expect(scribeButton).toHaveAttribute('aria-checked', 'false')
  })

  it('should render heading text', () => {
    render(
      <CharacterVoiceSelector
        characters={mockCharacters}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('選擇角色語音')).toBeInTheDocument()
  })

  it('should format character names correctly', () => {
    render(
      <CharacterVoiceSelector
        characters={['wasteland_trader', 'super_mutant']}
        onSelect={mockOnSelect}
      />
    )

    expect(screen.getByText('Wasteland Trader')).toBeInTheDocument()
    expect(screen.getByText('Super Mutant')).toBeInTheDocument()
  })
})
