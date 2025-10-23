/**
 * Journal Store Tests
 * Testing Zustand store for journal state management
 * Follows TDD methodology
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useJournalStore } from '../journalStore';

// Mock fetch globally
global.fetch = vi.fn();

describe('Journal Store', () => {
  beforeEach(() => {
    // Reset store
    useJournalStore.getState().reset();
    // Clear mocks
    vi.clearAllMocks();
    // Mock localStorage
    Storage.prototype.getItem = vi.fn(() => 'mock-token');
  });

  afterEach(() => {
    useJournalStore.getState().reset();
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Initial State
  // ============================================================================

  describe('Initial State', () => {
    it('should initialize with empty journals list', () => {
      const store = useJournalStore.getState();

      expect(store.journals).toEqual([]);
      expect(store.currentJournal).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.pagination).toBeNull();
    });
  });

  // ============================================================================
  // fetchJournals - Get Journals List
  // ============================================================================

  describe('fetchJournals', () => {
    it('should fetch journals successfully', async () => {
      const mockJournals = [
        {
          id: 'journal-1',
          reading_id: 'reading-1',
          user_id: 'user-1',
          content: '# Journal 1',
          mood_tags: ['hopeful'],
          is_private: true,
          created_at: '2025-10-23T10:00:00Z',
          updated_at: '2025-10-23T10:00:00Z',
        },
        {
          id: 'journal-2',
          reading_id: 'reading-2',
          user_id: 'user-1',
          content: '# Journal 2',
          mood_tags: ['peaceful'],
          is_private: true,
          created_at: '2025-10-22T10:00:00Z',
          updated_at: '2025-10-22T10:00:00Z',
        },
      ];

      const mockResponse = {
        items: mockJournals,
        total: 2,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const store = useJournalStore.getState();
      await store.fetchJournals();

      expect(store.journals).toEqual(mockJournals);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.pagination).toEqual({ total: 2 });
    });

    it('should set loading state during fetch', async () => {
      (global.fetch as any).mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ items: [], total: 0 }),
        }), 100))
      );

      const store = useJournalStore.getState();
      const fetchPromise = store.fetchJournals();

      // Should be loading
      expect(store.isLoading).toBe(true);

      await fetchPromise;

      // Should finish loading
      expect(store.isLoading).toBe(false);
    });

    it('should handle fetch error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Server error' }),
      });

      const store = useJournalStore.getState();
      await expect(store.fetchJournals()).rejects.toThrow();

      expect(store.isLoading).toBe(false);
      expect(store.error).not.toBeNull();
    });

    it('should support pagination parameters', async () => {
      const mockResponse = {
        items: [],
        total: 0,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const store = useJournalStore.getState();
      await store.fetchJournals(10, 20);

      // Verify fetch was called with correct pagination params
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('skip=10&limit=20'),
        expect.any(Object)
      );
    });
  });

  // ============================================================================
  // fetchJournalById - Get Single Journal
  // ============================================================================

  describe('fetchJournalById', () => {
    it('should fetch journal by id successfully', async () => {
      const mockJournal = {
        id: 'journal-1',
        reading_id: 'reading-1',
        user_id: 'user-1',
        content: '# My Journal',
        mood_tags: ['hopeful', 'excited'],
        is_private: true,
        created_at: '2025-10-23T10:00:00Z',
        updated_at: '2025-10-23T10:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockJournal,
      });

      const store = useJournalStore.getState();
      await store.fetchJournalById('journal-1');

      expect(store.currentJournal).toEqual(mockJournal);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle 404 error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Journal not found' }),
      });

      const store = useJournalStore.getState();
      await expect(store.fetchJournalById('non-existent')).rejects.toThrow();

      expect(store.currentJournal).toBeNull();
      expect(store.error).not.toBeNull();
    });
  });

  // ============================================================================
  // createJournal - Create New Journal
  // ============================================================================

  describe('createJournal', () => {
    it('should create journal successfully', async () => {
      const newJournalData = {
        content: '# New Journal',
        mood_tags: ['hopeful'],
        is_private: true,
      };

      const createdJournal = {
        id: 'new-journal-1',
        reading_id: 'reading-1',
        user_id: 'user-1',
        ...newJournalData,
        created_at: '2025-10-23T10:00:00Z',
        updated_at: '2025-10-23T10:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => createdJournal,
      });

      const store = useJournalStore.getState();
      const result = await store.createJournal('reading-1', newJournalData);

      expect(result).toEqual(createdJournal);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle 409 conflict error (duplicate journal)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => ({ detail: 'Journal already exists for this reading' }),
      });

      const store = useJournalStore.getState();
      await expect(store.createJournal('reading-1', {
        content: 'Test',
        mood_tags: [],
        is_private: true,
      })).rejects.toThrow('Journal already exists');

      expect(store.error).not.toBeNull();
    });

    it('should handle validation error (content too long)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'Content too long' }),
      });

      const store = useJournalStore.getState();
      await expect(store.createJournal('reading-1', {
        content: 'A'.repeat(10001),
        mood_tags: [],
        is_private: true,
      })).rejects.toThrow();
    });
  });

  // ============================================================================
  // updateJournal - Update Existing Journal
  // ============================================================================

  describe('updateJournal', () => {
    it('should update journal successfully', async () => {
      const updateData = {
        content: '# Updated Journal',
        mood_tags: ['peaceful'],
        is_private: false,
      };

      const updatedJournal = {
        id: 'journal-1',
        reading_id: 'reading-1',
        user_id: 'user-1',
        ...updateData,
        created_at: '2025-10-23T10:00:00Z',
        updated_at: '2025-10-23T12:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedJournal,
      });

      const store = useJournalStore.getState();
      const result = await store.updateJournal('journal-1', updateData);

      expect(result).toEqual(updatedJournal);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should support partial update', async () => {
      const partialUpdate = {
        is_private: false,
      };

      const updatedJournal = {
        id: 'journal-1',
        reading_id: 'reading-1',
        user_id: 'user-1',
        content: '# Original Content',
        mood_tags: ['hopeful'],
        is_private: false,
        created_at: '2025-10-23T10:00:00Z',
        updated_at: '2025-10-23T12:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedJournal,
      });

      const store = useJournalStore.getState();
      const result = await store.updateJournal('journal-1', partialUpdate);

      expect(result.is_private).toBe(false);
    });

    it('should handle 403 forbidden error (not owner)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ detail: 'Not the owner of this journal' }),
      });

      const store = useJournalStore.getState();
      await expect(store.updateJournal('journal-1', {
        content: 'Updated',
      })).rejects.toThrow();

      expect(store.error).not.toBeNull();
    });
  });

  // ============================================================================
  // deleteJournal - Delete Journal
  // ============================================================================

  describe('deleteJournal', () => {
    it('should delete journal successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const store = useJournalStore.getState();
      // Set initial journals
      store.journals = [
        { id: 'journal-1', content: 'Test' } as any,
        { id: 'journal-2', content: 'Test 2' } as any,
      ];

      await store.deleteJournal('journal-1');

      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle 404 error when deleting non-existent journal', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Journal not found' }),
      });

      const store = useJournalStore.getState();
      await expect(store.deleteJournal('non-existent')).rejects.toThrow();

      expect(store.error).not.toBeNull();
    });
  });

  // ============================================================================
  // Utility Methods
  // ============================================================================

  describe('Utility Methods', () => {
    it('should clear error', () => {
      const store = useJournalStore.getState();

      // Set error
      store.error = new Error('Test error');
      expect(store.error).not.toBeNull();

      // Clear error
      store.clearError();
      expect(store.error).toBeNull();
    });

    it('should reset store to initial state', () => {
      const store = useJournalStore.getState();

      // Modify state
      store.journals = [{ id: 'test' } as any];
      store.currentJournal = { id: 'test' } as any;
      store.error = new Error('Test');
      store.isLoading = true;

      // Reset
      store.reset();

      // Verify reset
      expect(store.journals).toEqual([]);
      expect(store.currentJournal).toBeNull();
      expect(store.error).toBeNull();
      expect(store.isLoading).toBe(false);
    });
  });

  // ============================================================================
  // Authentication
  // ============================================================================

  describe('Authentication', () => {
    it('should include auth token in requests', async () => {
      Storage.prototype.getItem = vi.fn(() => 'test-token-123');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], total: 0 }),
      });

      const store = useJournalStore.getState();
      await store.fetchJournals();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should work without auth token', async () => {
      Storage.prototype.getItem = vi.fn(() => null);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], total: 0 }),
      });

      const store = useJournalStore.getState();
      await store.fetchJournals();

      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
