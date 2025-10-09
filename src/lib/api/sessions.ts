/**
 * Session API Client
 *
 * Client-side API functions for reading session save/resume functionality.
 * Communicates with backend SessionService endpoints.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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
 * Handle API response and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Create a new reading session
 */
export async function createSession(data: SessionCreateData): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions`, {
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
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
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

  const response = await fetch(`${API_BASE_URL}/api/sessions?${params}`, {
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
  const body: any = { ...data };
  if (expectedUpdatedAt) {
    body.expected_updated_at = expectedUpdatedAt;
  }

  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: createHeaders(),
    body: JSON.stringify(body),
  });

  return handleResponse<SessionResponse>(response);
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: createHeaders(),
  });

  await handleResponse<{ success: boolean }>(response);
  return true;
}

/**
 * Complete a session and create reading
 */
export async function completeSession(
  sessionId: string,
  data: { interpretation?: string; reading_metadata?: Record<string, any> }
): Promise<CompleteSessionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/complete`, {
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
  const response = await fetch(`${API_BASE_URL}/api/sessions/sync`, {
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
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/resolve`, {
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
