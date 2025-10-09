/**
 * ZustandAuthProvider Integration Tests
 * Testing AsciiDonutLoading integration with auth provider
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ZustandAuthInitializer } from '../ZustandAuthProvider';
import { useAuthStore } from '@/lib/authStore';

// Mock the auth store
jest.mock('@/lib/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock requestAnimationFrame
beforeEach(() => {
  jest.useFakeTimers();
  global.requestAnimationFrame = jest.fn((cb) => {
    return setTimeout(cb, 16) as unknown as number;
  });
  global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('ZustandAuthInitializer', () => {
  describe('Loading State', () => {
    it('should show AsciiDonutLoading when not initialized', () => {
      // Mock uninitialized state
      (useAuthStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          initialize: jest.fn(),
          isInitialized: false,
        };
        return selector(state);
      });

      render(
        <ZustandAuthInitializer>
          <div>App Content</div>
        </ZustandAuthInitializer>
      );

      // Should show loading animation
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(
        screen.getByText('INITIALIZING VAULT RESIDENT STATUS...')
      ).toBeInTheDocument();

      // Should not show app content
      expect(screen.queryByText('App Content')).not.toBeInTheDocument();
    });

    it('should call initialize on mount', () => {
      const initializeMock = jest.fn();

      (useAuthStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          initialize: initializeMock,
          isInitialized: false,
        };
        return selector(state);
      });

      render(
        <ZustandAuthInitializer>
          <div>App Content</div>
        </ZustandAuthInitializer>
      );

      expect(initializeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Initialized State', () => {
    it('should show children when initialized', () => {
      // Mock initialized state
      (useAuthStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          initialize: jest.fn(),
          isInitialized: true,
        };
        return selector(state);
      });

      render(
        <ZustandAuthInitializer>
          <div>App Content</div>
        </ZustandAuthInitializer>
      );

      // Should show app content
      expect(screen.getByText('App Content')).toBeInTheDocument();

      // Should not show loading
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should render multiple children', () => {
      (useAuthStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          initialize: jest.fn(),
          isInitialized: true,
        };
        return selector(state);
      });

      render(
        <ZustandAuthInitializer>
          <div>First Child</div>
          <div>Second Child</div>
        </ZustandAuthInitializer>
      );

      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
    });
  });

  describe('State Transition', () => {
    it('should transition from loading to content when initialized', async () => {
      let isInitialized = false;
      const initializeMock = jest.fn(() => {
        // Simulate async initialization
        setTimeout(() => {
          isInitialized = true;
        }, 100);
      });

      (useAuthStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          initialize: initializeMock,
          isInitialized,
        };
        return selector(state);
      });

      const { rerender } = render(
        <ZustandAuthInitializer>
          <div>App Content</div>
        </ZustandAuthInitializer>
      );

      // Initially should show loading
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('App Content')).not.toBeInTheDocument();

      // Simulate state change
      isInitialized = true;
      (useAuthStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          initialize: initializeMock,
          isInitialized: true,
        };
        return selector(state);
      });

      rerender(
        <ZustandAuthInitializer>
          <div>App Content</div>
        </ZustandAuthInitializer>
      );

      // After initialization should show content
      await waitFor(() => {
        expect(screen.getByText('App Content')).toBeInTheDocument();
      });
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Provider Nesting', () => {
    it('should maintain provider structure', () => {
      (useAuthStore as jest.Mock).mockImplementation((selector) => {
        const state = {
          initialize: jest.fn(),
          isInitialized: true,
        };
        return selector(state);
      });

      render(
        <ZustandAuthInitializer>
          <div data-testid="nested-content">Nested Content</div>
        </ZustandAuthInitializer>
      );

      // Verify that nested content is rendered correctly
      const nestedContent = screen.getByTestId('nested-content');
      expect(nestedContent).toBeInTheDocument();
      expect(nestedContent).toHaveTextContent('Nested Content');
    });
  });
});
