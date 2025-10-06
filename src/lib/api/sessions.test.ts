/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createSession,
  getSession,
  listIncompleteSessions,
  updateSession,
  deleteSession,
  completeSession,
  syncOfflineSession,
} from './sessions';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Session API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-456',
        spread_type: 'three-card',
        question: 'What should I focus on?',
        session_state: { cards_drawn: [], current_position: 0 },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      } as Response);

      const result = await createSession({
        user_id: 'user-456',
        spread_type: 'three-card',
        question: 'What should I focus on?',
        session_state: { cards_drawn: [], current_position: 0 },
        status: 'active',
      });

      expect(result).toEqual(mockSession);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should throw error when API fails', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid request' }),
      } as Response);

      await expect(
        createSession({
          user_id: 'user-456',
          spread_type: 'three-card',
          question: 'What should I focus on?',
          session_state: {},
          status: 'active',
        })
      ).rejects.toThrow('Invalid request');
    });
  });

  describe('getSession', () => {
    it('should fetch a session by id', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-456',
        spread_type: 'three-card',
        question: 'What should I focus on?',
        session_state: { cards_drawn: [] },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession,
      } as Response);

      const result = await getSession('session-123');

      expect(result).toEqual(mockSession);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-123'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should return null when session not found', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const result = await getSession('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listIncompleteSessions', () => {
    it('should list user sessions with pagination', async () => {
      const mockResponse = {
        sessions: [
          {
            id: 'session-1',
            user_id: 'user-456',
            spread_type: 'celtic-cross',
            question: 'Career guidance?',
            status: 'paused',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        total: 1,
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await listIncompleteSessions('user-456', { limit: 10, offset: 0 });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions?user_id=user-456&limit=10&offset=0'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('updateSession', () => {
    it('should update session with conflict detection', async () => {
      const mockUpdatedSession = {
        id: 'session-123',
        status: 'paused',
        updated_at: new Date().toISOString(),
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedSession,
      } as Response);

      const result = await updateSession('session-123', {
        status: 'paused',
      });

      expect(result).toEqual(mockUpdatedSession);
    });

    it('should throw conflict error when timestamps mismatch', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Conflict detected' }),
      } as Response);

      await expect(
        updateSession('session-123', { status: 'paused' })
      ).rejects.toThrow('Conflict detected');
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const result = await deleteSession('session-123');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sessions/session-123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('completeSession', () => {
    it('should complete a session and create reading', async () => {
      const mockResponse = {
        session_id: 'session-123',
        reading_id: 'reading-789',
        status: 'completed',
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await completeSession('session-123', {
        interpretation: 'Your reading interpretation...',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('syncOfflineSession', () => {
    it('should sync offline session without conflicts', async () => {
      const mockResponse = {
        session: {
          id: 'server-session-123',
          user_id: 'user-456',
          status: 'active',
        },
        conflicts: null,
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await syncOfflineSession({
        client_id: 'client-temp-123',
        user_id: 'user-456',
        spread_type: 'three-card',
        question: 'Offline question',
        session_state: {},
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      expect(result.conflicts).toBeNull();
      expect(result.session.id).toBe('server-session-123');
    });

    it('should return conflicts when detected', async () => {
      const mockResponse = {
        session: {
          id: 'server-session-123',
        },
        conflicts: [
          {
            field: 'session_state',
            server_value: { cards_drawn: ['card-1', 'card-2', 'card-3'] },
            client_value: { cards_drawn: ['card-1', 'card-2'] },
            server_updated_at: new Date().toISOString(),
            client_updated_at: new Date(Date.now() - 60000).toISOString(),
          },
        ],
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await syncOfflineSession({
        client_id: 'client-temp-123',
        user_id: 'user-456',
        spread_type: 'three-card',
        question: 'Offline question',
        session_state: { cards_drawn: ['card-1', 'card-2'] },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      expect(result.conflicts).not.toBeNull();
      expect(result.conflicts).toHaveLength(1);
    });
  });
});
