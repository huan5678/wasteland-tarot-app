import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryToNewReadingFlow } from '../HistoryToNewReadingFlow';

// Mock useRouter
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPathname = '/readings/history';
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

describe('HistoryToNewReadingFlow', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockSearchParams.delete('tags');
    mockSearchParams.delete('category');
    mockSearchParams.delete('search');
  });

  it('should render new reading button', () => {
    render(<HistoryToNewReadingFlow />);

    expect(screen.getByRole('button', { name: /開始新解讀/ })).toBeInTheDocument();
  });

  it('should preserve active filters in URL when navigating', () => {
    mockSearchParams.set('tags', 'love,future');
    mockSearchParams.set('category', 'romance');
    mockSearchParams.set('search', 'relationship');

    render(<HistoryToNewReadingFlow />);

    const newReadingButton = screen.getByRole('button', { name: /開始新解讀/ });
    fireEvent.click(newReadingButton);

    expect(mockPush).toHaveBeenCalledWith('/readings/new');
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('tags=love,future')
    );
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('category=romance')
    );
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('search=relationship')
    );
  });

  it('should store filters in sessionStorage', () => {
    const storageSpy = jest.spyOn(Storage.prototype, 'setItem');
    mockSearchParams.set('tags', 'career');
    mockSearchParams.set('favoriteOnly', 'true');

    render(<HistoryToNewReadingFlow />);

    const newReadingButton = screen.getByRole('button', { name: /開始新解讀/ });
    fireEvent.click(newReadingButton);

    expect(storageSpy).toHaveBeenCalledWith(
      'reading-history-filters',
      expect.stringContaining('"tags":"career"')
    );
    expect(storageSpy).toHaveBeenCalledWith(
      'reading-history-filters',
      expect.stringContaining('"favoriteOnly":"true"')
    );

    storageSpy.mockRestore();
  });

  it('should restore filters from sessionStorage when returning', () => {
    sessionStorage.setItem(
      'reading-history-filters',
      JSON.stringify({
        tags: 'health',
        category: 'wellness',
        search: 'meditation',
      })
    );

    render(<HistoryToNewReadingFlow />);

    // Component should restore filters from sessionStorage on mount
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('tags=health')
    );
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('category=wellness')
    );
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('search=meditation')
    );
  });

  it('should clear filter storage after restoration', () => {
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem');
    sessionStorage.setItem('reading-history-filters', JSON.stringify({ tags: 'test' }));

    render(<HistoryToNewReadingFlow />);

    expect(removeSpy).toHaveBeenCalledWith('reading-history-filters');

    removeSpy.mockRestore();
  });

  it('should handle empty filters gracefully', () => {
    render(<HistoryToNewReadingFlow />);

    const newReadingButton = screen.getByRole('button', { name: /開始新解讀/ });

    // Should not throw
    expect(() => fireEvent.click(newReadingButton)).not.toThrow();
  });

  it('should show filter indicator when active filters exist', () => {
    mockSearchParams.set('tags', 'love');

    render(<HistoryToNewReadingFlow />);

    expect(screen.getByText(/1 個篩選器已啟用/)).toBeInTheDocument();
  });

  it('should show clear filters option', () => {
    mockSearchParams.set('tags', 'love');
    mockSearchParams.set('category', 'romance');

    render(<HistoryToNewReadingFlow />);

    const clearButton = screen.getByRole('button', { name: /清除篩選器/ });
    fireEvent.click(clearButton);

    expect(mockReplace).toHaveBeenCalledWith('/readings/history');
  });
});
