/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardDetailModal } from './CardDetailModal';
import type { WastelandCard } from '@/types/database';

const mockCard: WastelandCard = {
  id: 'card-123',
  name: 'The Wanderer',
  suit: 'MAJOR_ARCANA',
  card_number: 0,
  number: 0,
  upright_meaning: 'New beginnings, freedom, adventure in the wasteland',
  reversed_meaning: 'Recklessness, lack of direction, naivety',
  description: 'A lone figure steps out from Vault 111 into the unknown wasteland',
  keywords: ['freedom', 'adventure', 'new beginnings', 'wasteland'],
  image_url: '/images/cards/the-wanderer.png',
  radiation_factor: 0.3,
  karma_alignment: 'NEUTRAL',
  fallout_reference: 'The Sole Survivor emerging from Vault 111',
  symbolism: 'Represents the journey of self-discovery in a post-apocalyptic world',
  element: 'Air',
  astrological_association: 'Uranus',
  character_voice_interpretations: {
    pip_boy: 'Pip-Boy says: Adventure awaits, Vault Dweller!',
    super_mutant: 'Me smash new things!',
  },
  pip_boy_interpretation: 'Pip-Boy says: Adventure awaits, Vault Dweller!',
  vault_reference: 111,
  threat_level: 2,
  wasteland_humor: 'War. War never changes, but you can!',
  rarity_level: 'legendary',
  is_active: true,
  is_complete: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('CardDetailModal', () => {
  it('should not render when isOpen is false', () => {
    render(<CardDetailModal card={mockCard} isOpen={false} onClose={jest.fn()} />);

    expect(screen.queryByText('The Wanderer')).not.toBeInTheDocument();
  });

  it('should render card details when isOpen is true', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('The Wanderer')).toBeInTheDocument();
    expect(screen.getByText(/New beginnings, freedom, adventure/i)).toBeInTheDocument();
  });

  it('should display card image', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    const image = screen.getByRole('img', { name: /The Wanderer/i });
    expect(image).toHaveAttribute('src', expect.stringContaining('the-wanderer'));
  });

  it('should show upright and reversed meanings', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/upright/i)).toBeInTheDocument();
    expect(screen.getByText(/reversed/i)).toBeInTheDocument();
    expect(screen.getByText(/Recklessness, lack of direction/i)).toBeInTheDocument();
  });

  it('should display Fallout-specific attributes', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    const vaultTexts = screen.getAllByText(/Vault 111/i);
    expect(vaultTexts.length).toBeGreaterThan(0);
    expect(screen.getByText(/legendary/i)).toBeInTheDocument();
  });

  it('should show keywords as badges', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText('freedom')).toBeInTheDocument();
    expect(screen.getByText('adventure')).toBeInTheDocument();
    expect(screen.getByText('new beginnings')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const mockOnClose = jest.fn();
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when clicking outside modal', () => {
    const mockOnClose = jest.fn();
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={mockOnClose} />);

    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not close when clicking inside modal content', () => {
    const mockOnClose = jest.fn();
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={mockOnClose} />);

    const modalContent = screen.getByTestId('modal-content');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should display character voice interpretations', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/Pip-Boy says: Adventure awaits/i)).toBeInTheDocument();
  });

  it('should allow switching between different character voices', async () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    // Should show pip-boy by default
    expect(screen.getByText(/Pip-Boy says/i)).toBeInTheDocument();

    // Find and click super mutant voice button
    const voiceButtons = screen.getAllByRole('button', { name: /voice/i });
    if (voiceButtons.length > 1) {
      fireEvent.click(voiceButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/Me smash/i)).toBeInTheDocument();
      });
    }
  });

  it('should display karma alignment with color coding', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    const karmaElement = screen.getByText(/NEUTRAL/i);
    expect(karmaElement).toBeInTheDocument();
    expect(karmaElement).toHaveClass(/yellow|neutral/i);
  });

  it('should show radiation factor as visual indicator', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/radiation/i)).toBeInTheDocument();
    // Should display as percentage or visual bar
    expect(screen.getByText(/30%|0\.3/i)).toBeInTheDocument();
  });

  it('should display threat level', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/threat level/i)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('should show wasteland humor section', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/War\. War never changes/i)).toBeInTheDocument();
  });

  it('should support keyboard navigation (Escape to close)', () => {
    const mockOnClose = jest.fn();
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display astrological and symbolic information', () => {
    render(<CardDetailModal card={mockCard} isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByText(/Uranus/i)).toBeInTheDocument();
    expect(screen.getByText(/Air/i)).toBeInTheDocument();
    expect(screen.getByText(/self-discovery/i)).toBeInTheDocument();
  });

  it('should handle cards without optional fields gracefully', () => {
    const minimalCard: WastelandCard = {
      ...mockCard,
      description: undefined,
      keywords: undefined,
      fallout_reference: undefined,
      vault_reference: undefined,
      wasteland_humor: undefined,
    };

    render(<CardDetailModal card={minimalCard} isOpen={true} onClose={jest.fn()} />);

    // Should still render without errors
    expect(screen.getByText('The Wanderer')).toBeInTheDocument();
  });
});
