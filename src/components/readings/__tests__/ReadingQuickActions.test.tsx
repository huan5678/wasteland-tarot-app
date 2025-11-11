import { render, screen, fireEvent } from '@testing-library/react';
import { ReadingQuickActions } from '../ReadingQuickActions';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ReadingQuickActions', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  const defaultProps = {
    readingId: 'test-reading-123',
    voiceSettings: { voice: 'pip-boy' },
    categorySettings: { category: 'love' },
  };

  it('should render all action buttons', () => {
    render(<ReadingQuickActions {...defaultProps} />);

    expect(screen.getByRole('button', { name: /再抽一次/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /查看歷史/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /分享此解讀/ })).toBeInTheDocument();
  });

  describe('Draw Again Button', () => {
    it('should navigate to spread selection', () => {
      render(<ReadingQuickActions {...defaultProps} />);

      const drawAgainButton = screen.getByRole('button', { name: /再抽一次/ });
      fireEvent.click(drawAgainButton);

      expect(mockPush).toHaveBeenCalledWith('/readings/new');
    });

    it('should preserve voice and category settings in sessionStorage', () => {
      const storageSpy = jest.spyOn(Storage.prototype, 'setItem');

      render(<ReadingQuickActions {...defaultProps} />);

      const drawAgainButton = screen.getByRole('button', { name: /再抽一次/ });
      fireEvent.click(drawAgainButton);

      expect(storageSpy).toHaveBeenCalledWith(
        'preserved-reading-settings',
        expect.stringContaining('"voice":"pip-boy"')
      );
      expect(storageSpy).toHaveBeenCalledWith(
        'preserved-reading-settings',
        expect.stringContaining('"category":"love"')
      );

      storageSpy.mockRestore();
    });
  });

  describe('View History Button', () => {
    it('should navigate to reading history', () => {
      render(<ReadingQuickActions {...defaultProps} />);

      const viewHistoryButton = screen.getByRole('button', { name: /查看歷史/ });
      fireEvent.click(viewHistoryButton);

      expect(mockPush).toHaveBeenCalledWith('/readings/history');
    });

    it('should store scroll target for latest reading', () => {
      const storageSpy = jest.spyOn(Storage.prototype, 'setItem');

      render(<ReadingQuickActions {...defaultProps} />);

      const viewHistoryButton = screen.getByRole('button', { name: /查看歷史/ });
      fireEvent.click(viewHistoryButton);

      expect(storageSpy).toHaveBeenCalledWith(
        'scroll-to-reading',
        'test-reading-123'
      );

      storageSpy.mockRestore();
    });
  });

  describe('Share Button', () => {
    it('should open share dialog', () => {
      const onShare = jest.fn();
      render(<ReadingQuickActions {...defaultProps} onShare={onShare} />);

      const shareButton = screen.getByRole('button', { name: /分享此解讀/ });
      fireEvent.click(shareButton);

      expect(onShare).toHaveBeenCalledWith('test-reading-123');
    });

    it('should handle missing onShare callback', () => {
      render(<ReadingQuickActions {...defaultProps} />);

      const shareButton = screen.getByRole('button', { name: /分享此解讀/ });

      // Should not throw
      expect(() => fireEvent.click(shareButton)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ReadingQuickActions {...defaultProps} />);

      const container = screen.getByRole('group', { name: /快速操作/ });
      expect(container).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<ReadingQuickActions {...defaultProps} />);

      const drawAgainButton = screen.getByRole('button', { name: /再抽一次/ });
      drawAgainButton.focus();

      fireEvent.keyDown(drawAgainButton, { key: 'Enter' });
      expect(mockPush).toHaveBeenCalledWith('/readings/new');
    });
  });

  describe('Responsive Layout', () => {
    it('should render in horizontal layout by default', () => {
      const { container } = render(<ReadingQuickActions {...defaultProps} />);

      const group = container.querySelector('[role="group"]');
      expect(group).toHaveClass('flex-row');
    });

    it('should support vertical layout', () => {
      const { container } = render(
        <ReadingQuickActions {...defaultProps} layout="vertical" />
      );

      const group = container.querySelector('[role="group"]');
      expect(group).toHaveClass('flex-col');
    });
  });
});
