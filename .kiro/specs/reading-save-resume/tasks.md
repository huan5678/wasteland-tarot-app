# Implementation Tasks - Reading Save and Resume

## Backend Foundation

### 1. Create database schema and models
- [x] 1.1 Create Alembic migration for reading_sessions table with all columns, indexes, and constraints
- [x] 1.2 Create Alembic migration for session_events table with indexes for analytics queries
- [x] 1.3 Implement SQLAlchemy ReadingSession model in backend/app/models/reading_session.py with relationships (implemented as SessionSave to avoid naming conflict)
- [x] 1.4 Implement SQLAlchemy SessionEvent model in backend/app/models/session_event.py
- [x] 1.5 Create database trigger and function for automatic updated_at timestamp management
- _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

### 2. Create Pydantic schemas for validation
- [x] 2.1 Create SessionCreateSchema in backend/app/schemas/sessions.py with field validation
- [x] 2.2 Create SessionUpdateSchema with optional fields and sanitization validators
- [x] 2.3 Create SessionResponseSchema for API responses
- [x] 2.4 Create SessionMetadataSchema for lightweight list responses
- [x] 2.5 Create OfflineSessionSchema for offline sync requests
- [x] 2.6 Create ConflictResolutionSchema and ConflictInfoSchema
- _Requirements: 1.9, 2.10, 6.7, 8.1, 8.2, 8.3_

### 3. Implement SessionService core logic
- [x] 3.1 Create SessionService class in backend/app/services/session_service.py with constructor
- [x] 3.2 Implement create_session() method with user validation and database insert
- [x] 3.3 Implement get_session() method with Redis cache-first strategy and 15-minute TTL (Redis support reserved for future)
- [x] 3.4 Implement list_incomplete_sessions() with pagination and user filtering
- [x] 3.5 Implement update_session() with timestamp-based conflict detection (409 on mismatch)
- [x] 3.6 Implement delete_session() with cache invalidation
- _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 3.1, 3.2, 3.3, 3.10, 4.6, 4.7, 8.1, 8.2, 8.3, 8.7_

### 4. Implement session completion and sync
- [x] 4.1 Implement complete_session() in SessionService to convert session to Reading atomically
- [x] 4.2 Extend ReadingService.create_reading_from_session() to preserve all session data (integrated into complete_session())
- [x] 4.3 Implement sync_offline_session() with ID remapping and conflict resolution
- [x] 4.4 Implement check_session_conflicts() for timestamp comparison
- [x] 4.5 Implement resolve_conflict() with last-write-wins, server-wins, client-wins strategies
- _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 6.2, 6.3, 6.4, 6.7, 7.3, 7.4, 7.8_
