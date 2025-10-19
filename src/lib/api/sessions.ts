/**
 * Session API Client
 *
 * Client-side API functions for reading session save/resume functionality.
 * Communicates with backend SessionService endpoints via Next.js API proxy.
 *
 * IMPORTANT: All requests use '/api/v1/...' paths to go through Next.js proxy,
 * ensuring cookies work correctly and avoiding CORS issues.
 */

// Use relative paths to go through Next.js API proxy (/src/app/api/v1/[...path]/route.ts)
const API_BASE_URL = '';

export interface SessionState {
  cards_drawn?: string[];
  current_position?: number;
  total_positions?: number;
  [key: string]: any;
}

export interface SessionCreateData {
  user_id: string;
  spread_type: string;
  spread_config?: Record<string, any>;
  question: string;
  session_state: SessionState;
  status: 'active' | 'paused' | 'complete';
}

export interface SessionUpdateData {
  spread_type?: string;
  spread_config?: Record<string, any>;
  question?: string;
  session_state?: SessionState;
  status?: 'active' | 'paused' | 'complete';
  last_accessed_at?: string;
}

export interface SessionResponse {
  id: string;
  user_id: string;
  spread_type: string;
  spread_config?: Record<string, any>;
  question: string;
  session_state: SessionState;
  status: string;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
}

export interface SessionMetadata {
  id: string;
  user_id: string;
  spread_type: string;
  question: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
}

export interface SessionListResponse {
  sessions: SessionMetadata[];
  total: number;
}

export interface OfflineSessionData {
  client_id: string;
  user_id: string;
  spread_type: string;
  spread_config?: Record<string, any>;
  question: string;
  session_state: SessionState;
  status: 'active' | 'paused' | 'complete';
  created_at: string;
  updated_at: string;
}

export interface ConflictInfo {
  field: string;
  server_value: any;
  client_value: any;
  server_updated_at: string;
  client_updated_at: string;
}

export interface SyncSessionResponse {
  session: SessionResponse;
  conflicts: ConflictInfo[] | null;
}

export interface CompleteSessionResponse {
  session_id: string;
  reading_id: string;
  status: string;
}

/**
 * Get authentication token from storage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Create headers with authentication
 */
function createHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Custom API Error with status code
 */
class APIError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

/**
 * Handle API response and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new APIError(
      error.message || `HTTP ${response.status}`,
      response.status
    );
  }
  return response.json();
}

/**
 * Create a new reading session
 */
export async function createSession(data: SessionCreateData): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/sessions`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<SessionResponse>(response);
}

/**
 * Get a session by ID
 */
export async function getSession(sessionId: string): Promise<SessionResponse | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}`, {
    method: 'GET',
    headers: createHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  return handleResponse<SessionResponse>(response);
}

/**
 * List incomplete sessions for a user
 */
export async function listIncompleteSessions(
  userId: string,
  options: { limit?: number; offset?: number; status?: string } = {}
): Promise<SessionListResponse> {
  const { limit = 10, offset = 0, status } = options;
  const params = new URLSearchParams({
    user_id: userId,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (status) {
    params.append('status', status);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/sessions?${params}`, {
    method: 'GET',
    headers: createHeaders(),
  });

  return handleResponse<SessionListResponse>(response);
}

/**
 * Update a session
 */
export async function updateSession(
  sessionId: string,
  data: SessionUpdateData,
  expectedUpdatedAt?: string
): Promise<SessionResponse> {
  // Build URL with query parameter if expectedUpdatedAt is provided
  let url = `${API_BASE_URL}/api/v1/sessions/${sessionId}`;
  if (expectedUpdatedAt) {
    const params = new URLSearchParams({ expected_updated_at: expectedUpdatedAt });
    url += `?${params.toString()}`;
  }

  const response = await fetch(url, {
    method: 'PATCH',
    headers: createHeaders(),
    body: JSON.stringify(data),  // Only include SessionUpdateData in body
  });

  return handleResponse<SessionResponse>(response);
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: createHeaders(),
  });

  await handleResponse<{ success: boolean }>(response);
  return true;
}

export interface SessionCompleteData {
  interpretation?: string;
  spread_template_id?: string;
  character_voice?: string;
  karma_context?: string;
  faction_influence?: string;
}

/**
 * Complete a session and create reading
 */
export async function completeSession(
  sessionId: string,
  data: SessionCompleteData
): Promise<CompleteSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<CompleteSessionResponse>(response);
}

/**
 * Sync offline session with server
 */
export async function syncOfflineSession(
  data: OfflineSessionData
): Promise<SyncSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/sessions/sync`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<SyncSessionResponse>(response);
}

/**
 * Resolve conflicts for offline session
 */
export async function resolveConflict(
  sessionId: string,
  strategy: 'last-write-wins' | 'server-wins' | 'client-wins',
  conflicts: ConflictInfo[],
  clientData: OfflineSessionData
): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/sessions/${sessionId}/resolve`, {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify({
      session_id: sessionId,
      strategy,
      conflicts,
      client_data: clientData,
    }),
  });

  return handleResponse<SessionResponse>(response);
}

/**
 * Sessions API - Default export object with aliased method names
 * This object provides the API interface expected by sessionStore
 */
export default {
  create: createSession,
  getById: getSession,
  list: listIncompleteSessions,
  update: updateSession,
  delete: deleteSession,
  complete: completeSession,
  syncOffline: syncOfflineSession,
  resolveConflict: resolveConflict,
}
