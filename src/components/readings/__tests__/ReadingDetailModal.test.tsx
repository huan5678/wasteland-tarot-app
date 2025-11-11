/**
 * Tests for ReadingDetailModal Component
 *
 * Requirements Coverage: 3.3
 * - Display full interpretation text
 * - Show all drawn cards with positions
 * - Display Karma and faction status at reading time
 * - Show creation timestamp
 * - Add favorite toggle
 * - Integrate tag and category editors
 * - Show reading statistics (if available)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReadingDetailModal } from '../ReadingDetailModal';
import { useReadingsStore } from '@/lib/readingsStore';
import { useSpreadTemplatesStore } from '@/lib/spreadTemplatesStore';

// Mock stores
jest.mock('@/lib/readingsStore', () => ({
  useReadingsStore: jest.fn(),
}));

jest.mock('@/lib/spreadTemplatesStore', () => ({
  useSpreadTemplatesStore: jest.fn(),
}));

// Mock PixelIcon
jest.mock('@/components/ui/icons', () => ({
  PixelIcon: ({ name, className }: { name: string; className?: string }) => (
    <span data-testid={`icon-${name}`} className={className}>
      {name}
    </span>
  ),
}));

// Mock子元件
jest.mock('../ReadingNotesSystem', () => ({
  ReadingNotesSystem: ({ readingId }: { readingId: string }) => (
    <div data-testid="reading-notes-system">ReadingNotesSystem: {readingId}</div>
  ),
}));

jest.mock('../ExportShareTools', () => ({
  ExportShareTools: ({ selectedReadingIds }: { selectedReadingIds: string[] }) => (
    <div data-testid="export-share-tools">
      ExportShareTools: {selectedReadingIds.join(',')}
    </div>
  ),
}));

describe('ReadingDetailModal', () => {
  const mockReading = {
    id: 'reading-123',
    question: '我的事業未來如何？',
    spread_type: 'three_card',
    spread_template_id: 'template-1',
    character_voice: 'pip_boy',
    karma_context: '中立',
    faction_influence: '鋼鐵兄弟會',
    interpretation: '你的事業正處於轉型期。卡片顯示新機會即將來臨。',
    cards_drawn: [
      {
        id: 'card-1',
        name: '愚者',
        slug: 'the-fool',
        suit: '大阿爾克那',
        position: 'upright',
      },
      {
        id: 'card-2',
        name: '魔術師',
        slug: 'the-magician',
        suit: '大阿爾克那',
        position: 'upright',
      },
      {
        id: 'card-3',
        name: '女祭司',
        slug: 'the-high-priestess',
        suit: '大阿爾克那',
        position: 'reversed',
      },
    ],
    created_at: '2025-11-11T10:30:00Z',
    is_favorite: false,
    archived: false,
    detailed_notes: [],
  };

  const mockSpreadTemplate = {
    id: 'template-1',
    name: 'three_card',
    display_name: '三張卡牌',
    positions: [
      { name: 'past', chinese_name: '過去' },
      { name: 'present', chinese_name: '現在' },
      { name: 'future', chinese_name: '未來' },
    ],
  };

  const mockToggleFavorite = jest.fn();
  const mockToggleArchived = jest.fn();
  const mockFetchTemplates = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup store mocks
    (useReadingsStore as unknown as jest.Mock).mockReturnValue({
      byId: { 'reading-123': mockReading },
      toggleFavorite: mockToggleFavorite,
      toggleArchived: mockToggleArchived,
    });

    (useSpreadTemplatesStore as unknown as jest.Mock).mockReturnValue({
      templates: [mockSpreadTemplate],
      fetchTemplates: mockFetchTemplates,
    });
  });

  describe('Requirement 3.3.1: Display full interpretation text', () => {
    it('should display the full interpretation text', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByText(/你的事業正處於轉型期/)).toBeInTheDocument();
    });

    it('should preserve whitespace and line breaks in interpretation', () => {
      const readingWithLineBreaks = {
        ...mockReading,
        interpretation: '第一段\n\n第二段\n第三段',
      };

      (useReadingsStore as unknown as jest.Mock).mockReturnValue({
        byId: { 'reading-123': readingWithLineBreaks },
        toggleFavorite: mockToggleFavorite,
        toggleArchived: mockToggleArchived,
      });

      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      const interpretationElement = screen.getByText(/第一段/);
      expect(interpretationElement).toHaveClass('whitespace-pre-line');
    });
  });

  describe('Requirement 3.3.2: Show all drawn cards with positions', () => {
    it('should display all drawn cards', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByText('愚者')).toBeInTheDocument();
      expect(screen.getByText('魔術師')).toBeInTheDocument();
      expect(screen.getByText('女祭司')).toBeInTheDocument();
    });

    it('should display position labels from spread template', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByText('過去')).toBeInTheDocument();
      expect(screen.getByText('現在')).toBeInTheDocument();
      expect(screen.getByText('未來')).toBeInTheDocument();
    });

    it('should display card images with correct paths', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', '/images/cards/the-fool.jpg');
      expect(images[1]).toHaveAttribute('src', '/images/cards/the-magician.jpg');
      expect(images[2]).toHaveAttribute('src', '/images/cards/the-high-priestess.jpg');
    });

    it('should handle missing card images gracefully', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      const images = screen.getAllByRole('img');
      fireEvent.error(images[0]);

      expect(images[0]).toHaveAttribute('src', '/images/cards/back.jpg');
    });
  });

  describe('Requirement 3.3.3: Display Karma and faction status', () => {
    it('should display character voice when present', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByText('pip_boy')).toBeInTheDocument();
    });

    it('should display karma context when present', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByText('中立')).toBeInTheDocument();
    });

    it('should display faction influence when present', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByText('鋼鐵兄弟會')).toBeInTheDocument();
    });

    it('should not display sections when data is missing', () => {
      const readingWithoutContext = {
        ...mockReading,
        character_voice: null,
        karma_context: null,
        faction_influence: null,
      };

      (useReadingsStore as unknown as jest.Mock).mockReturnValue({
        byId: { 'reading-123': readingWithoutContext },
        toggleFavorite: mockToggleFavorite,
        toggleArchived: mockToggleArchived,
      });

      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.queryByText('角色觀點：')).not.toBeInTheDocument();
      expect(screen.queryByText('業力脈絡：')).not.toBeInTheDocument();
      expect(screen.queryByText('派系影響：')).not.toBeInTheDocument();
    });
  });

  describe('Requirement 3.3.4: Show creation timestamp', () => {
    it('should display formatted creation timestamp', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      // The timestamp should be formatted in locale string
      const timestampElement = screen.getByText(
        new Date('2025-11-11T10:30:00Z').toLocaleString()
      );
      expect(timestampElement).toBeInTheDocument();
    });
  });

  describe('Requirement 3.3.5: Add favorite toggle', () => {
    it('should display favorite star icon when reading is favorited', () => {
      const favoritedReading = { ...mockReading, is_favorite: true };

      (useReadingsStore as unknown as jest.Mock).mockReturnValue({
        byId: { 'reading-123': favoritedReading },
        toggleFavorite: mockToggleFavorite,
        toggleArchived: mockToggleArchived,
      });

      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByTestId('icon-star')).toBeInTheDocument();
    });

    it('should toggle favorite when favorite button is clicked', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      const favoriteButton = screen.getByTitle('加入最愛');
      fireEvent.click(favoriteButton);

      expect(mockToggleFavorite).toHaveBeenCalledWith('reading-123');
    });

    it('should show correct tooltip for favorited reading', () => {
      const favoritedReading = { ...mockReading, is_favorite: true };

      (useReadingsStore as unknown as jest.Mock).mockReturnValue({
        byId: { 'reading-123': favoritedReading },
        toggleFavorite: mockToggleFavorite,
        toggleArchived: mockToggleArchived,
      });

      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByTitle('移除最愛')).toBeInTheDocument();
    });
  });

  describe('Requirement 3.3.6: Archive functionality', () => {
    it('should display archived indicator when reading is archived', () => {
      const archivedReading = { ...mockReading, archived: true };

      (useReadingsStore as unknown as jest.Mock).mockReturnValue({
        byId: { 'reading-123': archivedReading },
        toggleFavorite: mockToggleFavorite,
        toggleArchived: mockToggleArchived,
      });

      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByTestId('icon-archive')).toBeInTheDocument();
    });

    it('should toggle archive when archive button is clicked', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      const archiveButton = screen.getByTitle('封存');
      fireEvent.click(archiveButton);

      expect(mockToggleArchived).toHaveBeenCalledWith('reading-123');
    });
  });

  describe('Tab Navigation', () => {
    it('should display all three tabs', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByText('總覽')).toBeInTheDocument();
      expect(screen.getByText('筆記')).toBeInTheDocument();
      expect(screen.getByText('分享')).toBeInTheDocument();
    });

    it('should switch to notes tab when clicked', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      const notesTab = screen.getByText('筆記');
      fireEvent.click(notesTab);

      expect(screen.getByTestId('reading-notes-system')).toBeInTheDocument();
    });

    it('should switch to export tab when clicked', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      const exportTab = screen.getByText('分享');
      fireEvent.click(exportTab);

      expect(screen.getByTestId('export-share-tools')).toBeInTheDocument();
    });

    it('should display note count badge when notes exist', () => {
      const readingWithNotes = {
        ...mockReading,
        detailed_notes: [{ id: '1' }, { id: '2' }, { id: '3' }],
      };

      (useReadingsStore as unknown as jest.Mock).mockReturnValue({
        byId: { 'reading-123': readingWithNotes },
        toggleFavorite: mockToggleFavorite,
        toggleArchived: mockToggleArchived,
      });

      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Modal behavior', () => {
    it('should call onClose when close button is clicked', () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not render when id is null', () => {
      const { container } = render(
        <ReadingDetailModal id={null} onClose={mockOnClose} />
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should not render when reading is not found', () => {
      (useReadingsStore as unknown as jest.Mock).mockReturnValue({
        byId: {},
        toggleFavorite: mockToggleFavorite,
        toggleArchived: mockToggleArchived,
      });

      const { container } = render(
        <ReadingDetailModal id="reading-999" onClose={mockOnClose} />
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Offline indicator', () => {
    it('should display offline badge when reading is offline', () => {
      const offlineReading = { ...mockReading, _offline: true };

      (useReadingsStore as unknown as jest.Mock).mockReturnValue({
        byId: { 'reading-123': offlineReading },
        toggleFavorite: mockToggleFavorite,
        toggleArchived: mockToggleArchived,
      });

      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByText('離線')).toBeInTheDocument();
    });
  });

  describe('Spread template fetching', () => {
    it('should fetch spread templates on mount', async () => {
      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      await waitFor(() => {
        expect(mockFetchTemplates).toHaveBeenCalled();
      });
    });

    it('should display fallback position labels when template is missing', () => {
      (useSpreadTemplatesStore as unknown as jest.Mock).mockReturnValue({
        templates: [],
        fetchTemplates: mockFetchTemplates,
      });

      render(<ReadingDetailModal id="reading-123" onClose={mockOnClose} />);

      expect(screen.getByText('位置 1')).toBeInTheDocument();
      expect(screen.getByText('位置 2')).toBeInTheDocument();
      expect(screen.getByText('位置 3')).toBeInTheDocument();
    });
  });
});
