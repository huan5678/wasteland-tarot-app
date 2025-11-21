import { api } from '@/lib/apiClient';
import type {
  ReadingSession,
  SessionCreateRequest,
  SessionUpdateRequest,
  OfflineSessionSync,
  ConflictResolution
} from '@/types/session';

const BASE_PATH = '/sessions';

export const sessionsAPI = {
  create: (data: SessionCreateRequest) => api.post<ReadingSession>(BASE_PATH, data),
  
  getById: (id: string) => api.get<ReadingSession>(`${BASE_PATH}/${id}`),
  
  update: (id: string, data: SessionUpdateRequest, expectedUpdatedAt?: string) => {
    const headers: Record<string, string> = {};
    if (expectedUpdatedAt) {
      headers['If-Unmodified-Since'] = expectedUpdatedAt;
    }
    return api.patch<ReadingSession>(`${BASE_PATH}/${id}`, data, { headers });
  },
  
  delete: (id: string) => api.delete(`${BASE_PATH}/${id}`),
  
  complete: (id: string, data: any) => api.post<ReadingSession>(`${BASE_PATH}/${id}/complete`, data),
  
  list: (params: { limit: number; offset: number }) => 
    api.get<{ sessions: ReadingSession[]; total: number }>(`${BASE_PATH}?limit=${params.limit}&offset=${params.offset}`),
  
  syncOffline: (data: OfflineSessionSync) => api.post<any>(`${BASE_PATH}/sync`, data),
  
  resolveConflict: (data: ConflictResolution) => api.post<ReadingSession>(`${BASE_PATH}/resolve-conflict`, data),
};
