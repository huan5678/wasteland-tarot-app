/**
 * Session Types - Reading Save & Resume Feature
 *
 * TypeScript interfaces for managing incomplete reading sessions
 * with automatic saving, offline sync, and multi-device support.
 */

/**
 * Complete reading session state
 */
export interface ReadingSession {
  id: string
  user_id?: string

  // Session configuration
  spread_type: string
  spread_config?: Record<string, any>
  question: string

  // Reading state
  session_state: SessionState

  // Metadata
  status: 'active' | 'paused' | 'complete'
  created_at: string
  updated_at: string
  last_accessed_at?: string

  // AI Interpretation (NEW)
  overall_interpretation?: string
  summary_message?: string
  prediction_confidence?: number
  ai_interpretation_requested?: boolean
  ai_interpretation_at?: string
  ai_interpretation_provider?: string

  // Sync state (client-side only)
  _offline?: boolean
  _pending_sync?: boolean
  _conflict?: boolean
  _local_only?: boolean
}

/**
 * Session state structure
 */
export interface SessionState {
  cards_drawn: CardDraw[]
  current_card_index: number
  interpretation_progress: InterpretationProgress

  // UI state
  scroll_position?: number
  active_tab?: string
  ui_preferences?: Record<string, any>

  // User context
  karma_level?: string
  faction_alignments?: Record<string, number>
  character_voice?: string
  ai_provider?: string
}

/**
 * Card draw with position metadata
 */
export interface CardDraw {
  card_id: string
  card_name: string
  suit: string
  position: 'upright' | 'reversed'  // Card orientation (upright/reversed)
  drawn_at: string
  // Position metadata (牌位資訊)
  positionName?: string      // e.g., "過去", "現在", "未來"
  positionMeaning?: string   // e.g., "過去的影響與根源"
}

/**
 * AI interpretation generation progress
 */
export interface InterpretationProgress {
  current_card: number
  total_cards: number
  cards_interpreted: Record<number, string> // position -> interpretation text
  overall_synthesis?: string
  is_streaming: boolean
  stream_position?: number
  estimated_completion?: string
}

/**
 * Lightweight session metadata for lists
 */
export interface SessionMetadata {
  id: string
  user_id: string
  spread_type: string
  question: string
  status: string
  created_at: string
  updated_at: string
  last_accessed_at?: string
}

/**
 * Session list response from API
 */
export interface SessionListResponse {
  sessions: SessionMetadata[]
  total: number
  limit: number
  offset: number
}

/**
 * Session creation request
 */
export interface SessionCreateRequest {
  user_id: string
  spread_type: string
  spread_config?: Record<string, any>
  question: string
  session_state: SessionState
  status?: 'active' | 'paused' | 'complete'
}

/**
 * Session update request (partial)
 */
export interface SessionUpdateRequest {
  spread_type?: string
  spread_config?: Record<string, any>
  question?: string
  session_state?: SessionState
  status?: 'active' | 'paused' | 'complete'
  last_accessed_at?: string
}

/**
 * Offline session sync request
 */
export interface OfflineSessionSync {
  client_id: string
  user_id: string
  spread_type: string
  spread_config?: Record<string, any>
  question: string
  session_state: SessionState
  status: 'active' | 'paused' | 'complete'
  created_at: string
  updated_at: string
}

/**
 * Sync response from server
 */
export interface SyncResponse {
  status: 'synced' | 'conflict'
  session: ReadingSession
  conflicts?: ConflictInfo[]
  client_id: string
  server_id: string
}

/**
 * Multi-device conflict information
 */
export interface ConflictInfo {
  field: string
  server_value: any
  client_value: any
  server_updated_at: string
  client_updated_at: string
}

/**
 * Conflict resolution request
 */
export interface ConflictResolution {
  session_id: string
  strategy: 'last-write-wins' | 'server-wins' | 'client-wins'
  conflicts: ConflictInfo[]
  client_data: OfflineSessionSync
}

/**
 * Session completion result
 */
export interface SessionCompletionResult {
  session_id: string
  reading_id: string
  status: 'completed'
}

/**
 * Offline sync queue item
 */
export interface SyncQueueItem {
  id: string
  session_id: string
  action: 'create' | 'update' | 'delete'
  data: Partial<ReadingSession>
  retry_count: number
  last_attempt?: string
  error?: string
}

/**
 * Device information for sync
 */
export interface DeviceInfo {
  device_id: string
  device_type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  last_active: string
}

/**
 * Auto-save status
 */
export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline'

/**
 * Session store state
 */
export interface SessionStoreState {
  // Active session
  activeSession: ReadingSession | null
  autoSaveEnabled: boolean
  autoSaveStatus: AutoSaveStatus
  lastSavedAt: Date | null

  // Incomplete sessions list
  incompleteSessions: SessionMetadata[]
  totalSessions: number

  // Sync state
  isOnline: boolean
  syncQueue: SyncQueueItem[]
  pendingSyncs: number

  // Conflict resolution
  activeConflict: ConflictInfo[] | null

  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
}

/**
 * Session store actions
 */
export interface SessionStoreActions {
  // Session CRUD
  createSession: (data: SessionCreateRequest) => Promise<ReadingSession>
  getSession: (id: string) => Promise<ReadingSession | null>
  updateSession: (id: string, data: SessionUpdateRequest) => Promise<ReadingSession>
  deleteSession: (id: string) => Promise<void>
  completeSession: (id: string, data?: {
    interpretation?: string
    character_voice?: string
    karma_context?: string
    faction_influence?: string
  }) => Promise<SessionCompletionResult>

  // Session list
  loadIncompleteSessions: (limit?: number, offset?: number) => Promise<void>
  refreshSessions: () => Promise<void>

  // Active session management
  setActiveSession: (session: ReadingSession | null) => void
  resumeSession: (id: string) => Promise<void>
  pauseSession: () => Promise<void>

  // Auto-save
  enableAutoSave: () => void
  disableAutoSave: () => void
  triggerAutoSave: () => Promise<void>

  // Offline sync
  syncOfflineSession: (data: OfflineSessionSync) => Promise<SyncResponse>
  resolveConflict: (resolution: ConflictResolution) => Promise<ReadingSession>
  processSyncQueue: () => Promise<void>

  // Network status
  setOnline: (online: boolean) => void

  // Error handling
  clearError: () => void
  setError: (error: string) => void
}
