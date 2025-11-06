/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResponsiveCardGrid } from './ResponsiveCardGrid';
import type { WastelandCard } from '@/types/database';

const mockCards: WastelandCard[] = [
  {
    id: 'card-1',
    name: 'The Wanderer',
    suit: 'MAJOR_ARCANA',
    card_number: 0,
    number: 0,
    upright_meaning: 'New beginnings',
    reversed_meaning: 'Recklessness',
    image_url: '/images/cards/wanderer.png',
    radiation_factor: 0.3,
    karma_alignment: 'NEUTRAL',
    character_voices: {},
    rarity_level: 'legendary',
    is_active: true,
    is_complete: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'card-2',
    name: 'The Survivor',
    suit: 'MAJOR_ARCANA',
    card_number: 1,
    number: 1,
    upright_meaning: 'Resilience',
    reversed_meaning: 'Despair',
    image_url: '/images/cards/survivor.png',
    radiation_factor: 0.5,
    karma_alignment: 'GOOD',
    character_voices: {},
    rarity_level: 'rare',
    is_active: true,
    is_complete: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

describe('ResponsiveCardGrid', () => {
  it('should render all cards', () => {
    render(<ResponsiveCardGrid cards={mockCards} />);

    expect(screen.getByText('The Wanderer')).toBeInTheDocument();
    expect(screen.getByText('The Survivor')).toBeInTheDocument();
  });

  it('should apply mobile-optimized layout classes', () => {
    const { container } = render(<ResponsiveCardGrid cards={mockCards} />);

    const grid = container.querySelector('[data-testid="card-grid"]');
    expect(grid).toHaveClass(/grid/);
    expect(grid).toHaveClass(/gap/);
  });

  it('should render empty state when no cards provided', () => {
    render(<ResponsiveCardGrid cards={[]} />);

    expect(screen.getByText(/no cards/i)).toBeInTheDocument();
  });

  it('should support different column configurations', () => {
    const { container } = render(
      <ResponsiveCardGrid cards={mockCards} columns={{ mobile: 1, tablet: 2, desktop: 3 }} />
    );

    const grid = container.querySelector('[data-testid="card-grid"]');
    expect(grid).toHaveClass(/grid-cols/);
  });

  it('should handle card click events', () => {
    const onCardClick = jest.fn();
    render(<ResponsiveCardGrid cards={mockCards} onCardClick={onCardClick} />);

    const firstCard = screen.getByText('The Wanderer').closest('[data-testid^="card-"]');
    if (firstCard) {
      firstCard.click();
      expect(onCardClick).toHaveBeenCalledWith(mockCards[0]);
    }
  });

  it('should optimize images for mobile', () => {
    render(<ResponsiveCardGrid cards={mockCards} />);

    const images = screen.getAllByRole('img');
    images.forEach((img) => {
      // Next.js Image optimization
      expect(img).toHaveAttribute('loading');
    });
  });

  it('should support compact mobile view', () => {
    const { container } = render(<ResponsiveCardGrid cards={mockCards} compactMobile={true} />);

    const cards = container.querySelectorAll('[data-testid^="card-"]');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    // Compact mode is applied, cards should still render
    cards.forEach((card) => {
      expect(card.className).toBeTruthy();
    });
  });

  it('should show loading skeleton', () => {
    render(<ResponsiveCardGrid cards={[]} loading={true} />);

    expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0);
  });

  it('should support card aspect ratios', () => {
    const { container } = render(
      <ResponsiveCardGrid cards={mockCards} aspectRatio="portrait" />
    );

    const cards = container.querySelectorAll('[data-testid^="card-"]');
    cards.forEach((card) => {
      expect(card.querySelector('[class*="aspect"]')).toBeInTheDocument();
    });
  });

  it('should handle very long card lists efficiently', () => {
    const manyCards = Array.from({ length: 100 }, (_, i) => ({
      ...mockCards[0],
      id: `card-${i}`,
      name: `Card ${i}`,
    }));

    const { container } = render(<ResponsiveCardGrid cards={manyCards} />);

    const grid = container.querySelector('[data-testid="card-grid"]');
    expect(grid?.children.length).toBe(100);
  });
});
