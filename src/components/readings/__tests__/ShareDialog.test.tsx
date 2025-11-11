/**
 * ShareDialog Component Tests
 *
 * Task 16.1: Create share dialog component
 * Requirements: 10.1
 *
 * Test Suite covering:
 * - Dialog rendering and visibility
 * - Social media buttons (Facebook, Twitter/X)
 * - Copy link functionality
 * - Export as image functionality
 * - Accessibility (ARIA labels, keyboard navigation)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShareDialog } from '../ShareDialog';

describe('ShareDialog Component', () => {
  const mockReading = {
    id: 'reading-123',
    question: '我的未來如何？',
    cards_drawn: [
      {
        id: 'the-fool',
        name: '愚者',
        suit: 'major_arcana',
        position: 'upright' as const,
        imageUrl: '/cards/the-fool.png',
        positionIndex: 0,
      },
    ],
    interpretation: '根據愚者牌的指引，你正處於新旅程的開始...',
    created_at: '2025-11-12T10:00:00Z',
  };

  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    reading: mockReading,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dialog when open prop is true', () => {
      render(<ShareDialog {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('分享解讀')).toBeInTheDocument();
    });

    it('does not render dialog when open prop is false', () => {
      render(<ShareDialog {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders all share options', () => {
      render(<ShareDialog {...defaultProps} />);
      expect(screen.getByText('Facebook')).toBeInTheDocument();
      expect(screen.getByText('Twitter/X')).toBeInTheDocument();
      expect(screen.getByText('複製連結')).toBeInTheDocument();
      expect(screen.getByText('匯出為圖片')).toBeInTheDocument();
    });
  });

  describe('Social Media Sharing', () => {
    it('renders Facebook share button with correct ARIA label', () => {
      render(<ShareDialog {...defaultProps} />);
      const facebookButton = screen.getByLabelText('分享到 Facebook');
      expect(facebookButton).toBeInTheDocument();
      expect(facebookButton).toHaveAttribute('type', 'button');
    });

    it('renders Twitter/X share button with correct ARIA label', () => {
      render(<ShareDialog {...defaultProps} />);
      const twitterButton = screen.getByLabelText('分享到 Twitter/X');
      expect(twitterButton).toBeInTheDocument();
      expect(twitterButton).toHaveAttribute('type', 'button');
    });

    it('calls onShareToFacebook when Facebook button is clicked', () => {
      const onShareToFacebook = jest.fn();
      render(<ShareDialog {...defaultProps} onShareToFacebook={onShareToFacebook} />);

      const facebookButton = screen.getByLabelText('分享到 Facebook');
      fireEvent.click(facebookButton);

      expect(onShareToFacebook).toHaveBeenCalledWith(mockReading.id);
    });

    it('calls onShareToTwitter when Twitter/X button is clicked', () => {
      const onShareToTwitter = jest.fn();
      render(<ShareDialog {...defaultProps} onShareToTwitter={onShareToTwitter} />);

      const twitterButton = screen.getByLabelText('分享到 Twitter/X');
      fireEvent.click(twitterButton);

      expect(onShareToTwitter).toHaveBeenCalledWith(mockReading.id);
    });
  });

  describe('Copy Link Functionality', () => {
    it('renders copy link button', () => {
      render(<ShareDialog {...defaultProps} />);
      const copyButton = screen.getByLabelText('複製分享連結');
      expect(copyButton).toBeInTheDocument();
    });

    it('calls onCopyLink when copy button is clicked', async () => {
      const onCopyLink = jest.fn().mockResolvedValue('https://wasteland-tarot.com/share/uuid123');
      render(<ShareDialog {...defaultProps} onCopyLink={onCopyLink} />);

      const copyButton = screen.getByLabelText('複製分享連結');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(onCopyLink).toHaveBeenCalledWith(mockReading.id);
      });
    });

    it('shows success message after copying link', async () => {
      const onCopyLink = jest.fn().mockResolvedValue('https://wasteland-tarot.com/share/uuid123');

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });

      render(<ShareDialog {...defaultProps} onCopyLink={onCopyLink} />);

      const copyButton = screen.getByLabelText('複製分享連結');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('連結已複製')).toBeInTheDocument();
      });
    });

    it('shows error message if copying fails', async () => {
      const onCopyLink = jest.fn().mockRejectedValue(new Error('Failed to copy'));
      render(<ShareDialog {...defaultProps} onCopyLink={onCopyLink} />);

      const copyButton = screen.getByLabelText('複製分享連結');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('複製失敗，請稍後再試')).toBeInTheDocument();
      });
    });
  });

  describe('Export as Image Functionality', () => {
    it('renders export image button', () => {
      render(<ShareDialog {...defaultProps} />);
      const exportButton = screen.getByLabelText('匯出為圖片');
      expect(exportButton).toBeInTheDocument();
    });

    it('calls onExportImage when export button is clicked', () => {
      const onExportImage = jest.fn();
      render(<ShareDialog {...defaultProps} onExportImage={onExportImage} />);

      const exportButton = screen.getByLabelText('匯出為圖片');
      fireEvent.click(exportButton);

      expect(onExportImage).toHaveBeenCalledWith(mockReading.id);
    });

    it('shows loading state while exporting', async () => {
      const onExportImage = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ShareDialog {...defaultProps} onExportImage={onExportImage} />);

      const exportButton = screen.getByLabelText('匯出為圖片');
      fireEvent.click(exportButton);

      expect(screen.getByText('匯出中...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('匯出中...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dialog Controls', () => {
    it('calls onClose when close button is clicked', () => {
      render(<ShareDialog {...defaultProps} />);

      const closeButton = screen.getByLabelText('關閉對話框');
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', () => {
      render(<ShareDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('does not close when clicking inside dialog content', () => {
      render(<ShareDialog {...defaultProps} />);

      const dialogContent = screen.getByText('分享解讀');
      fireEvent.click(dialogContent);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA role for dialog', () => {
      render(<ShareDialog {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has accessible dialog title', () => {
      render(<ShareDialog {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');

      const titleId = dialog.getAttribute('aria-labelledby');
      const title = document.getElementById(titleId!);
      expect(title).toHaveTextContent('分享解讀');
    });

    it('all interactive elements are keyboard accessible', () => {
      render(<ShareDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('focuses first interactive element when opened', async () => {
      const { rerender } = render(<ShareDialog {...defaultProps} open={false} />);

      rerender(<ShareDialog {...defaultProps} open={true} />);

      await waitFor(() => {
        const focusedElement = document.activeElement;
        expect(focusedElement).toBeInstanceOf(HTMLElement);
        expect(focusedElement?.tagName).toBe('BUTTON');
      });
    });
  });

  describe('Password Protection Option', () => {
    it('renders password protection checkbox', () => {
      render(<ShareDialog {...defaultProps} />);
      expect(screen.getByText('需要密碼保護')).toBeInTheDocument();
    });

    it('shows password input when checkbox is checked', async () => {
      render(<ShareDialog {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: '需要密碼保護' });
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('請輸入 4-8 位數密碼')).toBeInTheDocument();
      });
    });

    it('hides password input when checkbox is unchecked', async () => {
      render(<ShareDialog {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: '需要密碼保護' });
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('請輸入 4-8 位數密碼')).toBeInTheDocument();
      });

      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('請輸入 4-8 位數密碼')).not.toBeInTheDocument();
      });
    });

    it('validates password length (4-8 digits)', async () => {
      render(<ShareDialog {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', { name: '需要密碼保護' });
      fireEvent.click(checkbox);

      const passwordInput = await screen.findByPlaceholderText('請輸入 4-8 位數密碼');

      // Test too short
      fireEvent.change(passwordInput, { target: { value: '123' } });
      expect(screen.getByText('密碼必須為 4-8 位數')).toBeInTheDocument();

      // Test too long
      fireEvent.change(passwordInput, { target: { value: '123456789' } });
      expect(screen.getByText('密碼必須為 4-8 位數')).toBeInTheDocument();

      // Test valid
      fireEvent.change(passwordInput, { target: { value: '1234' } });
      expect(screen.queryByText('密碼必須為 4-8 位數')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing reading gracefully', () => {
      const { container } = render(<ShareDialog {...defaultProps} reading={null} />);
      expect(screen.getByText('分享解讀')).toBeInTheDocument();
      // Should still render dialog but disable share actions
      const buttons = container.querySelectorAll('button:not([aria-label="關閉對話框"])');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('shows error state when share generation fails', async () => {
      const onCopyLink = jest.fn().mockRejectedValue(new Error('Network error'));
      render(<ShareDialog {...defaultProps} onCopyLink={onCopyLink} />);

      const copyButton = screen.getByLabelText('複製分享連結');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText('複製失敗，請稍後再試')).toBeInTheDocument();
      });
    });
  });
});
