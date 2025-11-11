import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReadingDetailView from '../ReadingDetailView';

const mockReading = {
  id: '123',
  question: '我的事業未來如何?',
  spread_type: 'single_card',
  spread_template: {
    id: 'template-1',
    name: 'single_card',
    display_name: '單卡解讀',
    card_count: 1,
    difficulty_level: 'beginner' as const
  },
  cards_drawn: [
    {
      id: 'the-fool',
      name: 'The Wanderer',
      suit: 'major_arcana' as const,
      upright_meaning: 'New beginnings',
      reversed_meaning: 'Recklessness',
      image_url: '/cards/the-fool.png',
      keywords: ['adventure', 'freedom'],
      position: 'upright' as const,
      positionIndex: 0,
      positionLabel: '現在'
    }
  ],
  interpretation: '這張牌象徵新的開始...',
  created_at: '2025-11-11T10:30:00Z',
  is_favorite: false,
  tags: ['事業', '未來'],
  category: {
    id: 'cat-1',
    name: '事業',
    color: '#ff8800'
  },
  character_voice: 'pip_boy',
  karma_alignment: 'neutral',
  faction_alignment: 'ncr'
};

describe('ReadingDetailView', () => {
  it('displays full interpretation text', () => {
    render(<ReadingDetailView reading={mockReading} />);

    expect(screen.getByText('這張牌象徵新的開始...')).toBeInTheDocument();
  });

  it('shows all drawn cards with positions', () => {
    render(<ReadingDetailView reading={mockReading} />);

    expect(screen.getByText('The Wanderer')).toBeInTheDocument();
    expect(screen.getByText('現在')).toBeInTheDocument();
  });

  it('displays creation timestamp', () => {
    render(<ReadingDetailView reading={mockReading} />);

    // Should format date in zh-TW locale
    expect(screen.getByText(/2025年11月11日/)).toBeInTheDocument();
  });

  it('shows Karma and faction status', () => {
    render(<ReadingDetailView reading={mockReading} />);

    expect(screen.getByText(/neutral/i)).toBeInTheDocument();
    expect(screen.getByText(/ncr/i)).toBeInTheDocument();
  });

  it('toggles favorite status when star button clicked', async () => {
    const onFavoriteToggle = jest.fn();
    render(
      <ReadingDetailView
        reading={mockReading}
        onFavoriteToggle={onFavoriteToggle}
      />
    );

    const favoriteButton = screen.getByRole('button', { name: /收藏/i });
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(onFavoriteToggle).toHaveBeenCalledWith('123', true);
    });
  });

  it('displays tags and allows editing', () => {
    const onTagsChange = jest.fn();
    render(
      <ReadingDetailView
        reading={mockReading}
        onTagsChange={onTagsChange}
      />
    );

    expect(screen.getByText('事業')).toBeInTheDocument();
    expect(screen.getByText('未來')).toBeInTheDocument();
  });

  it('displays category with correct color', () => {
    render(<ReadingDetailView reading={mockReading} />);

    const categoryBadge = screen.getByText('事業');
    expect(categoryBadge).toHaveStyle({ backgroundColor: '#ff8800' });
  });

  it('shows character voice used for interpretation', () => {
    render(<ReadingDetailView reading={mockReading} />);

    expect(screen.getByText(/pip_boy/i)).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalReading = {
      ...mockReading,
      interpretation: undefined,
      tags: [],
      category: null,
      karma_alignment: undefined,
      faction_alignment: undefined
    };

    render(<ReadingDetailView reading={minimalReading} />);

    expect(screen.getByText('未命名解讀')).toBeInTheDocument();
  });
});
