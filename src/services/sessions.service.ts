/**
 * Sessions Service
 * 處理占卜會話保存與恢復相關的 API 請求
 */

import { api } from '@/lib/apiClient';
import type { ReadingSession } from '@/types/api';
import type {
  SessionListResponse,
  SessionCreateRequest,
  SessionUpdateRequest,
  OfflineSessionSync,
  SyncResponse,
  ConflictResolution,
  SessionCompletionResult,
} from '@/types/session';

export const SessionsService = {
  /**
   * Create new session
   */
  async create(data: SessionCreateRequest): Promise<ReadingSession> {
    return api.post<ReadingSession>('/sessions', data);
  },

  /**
   * List user's incomplete sessions
   */
  async list(params?: { limit?: number; offset?: number; status?: string }): Promise<SessionListResponse> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.offset) query.append('offset', params.offset.toString());
    if (params?.status) query.append('status_filter', params.status);
    return api.get(`/sessions?${query.toString()}`);
  },

  /**
   * Get session by ID
   */
  async getById(id: string): Promise<ReadingSession> {
    return api.get<ReadingSession>(`/sessions/${id}`);
  },

  /**
   * Update session (auto-save)
   */
  async update(
    id: string, 
    data: SessionUpdateRequest, 
    expectedUpdatedAt?: string
  ): Promise<ReadingSession> {
    // Include expected_updated_at in request body for optimistic locking
    const requestBody = expectedUpdatedAt
      ? { ...data, expected_updated_at: expectedUpdatedAt }
      : data;

    return api.patch<ReadingSession>(`/sessions/${id}`, requestBody);
  },

  /**
   * Delete session
   */
  async delete(id: string): Promise<void> {
    return api.delete(`/sessions/${id}`);
  },

  /**
   * Complete session (convert to Reading)
   */
  async complete(id: string, data?: {
    interpretation?: string
    character_voice?: string
    karma_context?: string
    faction_influence?: string
  }): Promise<SessionCompletionResult> {
    return api.post<SessionCompletionResult>(`/sessions/${id}/complete`, data);
  },

  /**
   * Sync offline session
   */
  async syncOffline(data: OfflineSessionSync): Promise<SyncResponse> {
    return api.post<SyncResponse>('/sessions/sync', data);
  },

  /**
   * Resolve conflict
   */
  async resolveConflict(data: ConflictResolution): Promise<ReadingSession> {
    return api.post<ReadingSession>('/sessions/resolve-conflict', data);
  }
};
