"""
Session Service - Business logic for reading session save/resume feature

Handles creation, retrieval, update, and deletion of incomplete reading sessions.
Supports offline-first architecture with conflict resolution strategies.
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.exc import IntegrityError

from app.models.reading_session import ReadingSession
from app.models.session_event import SessionEvent
from app.models.user import User
from app.schemas.sessions import (
    SessionCreateSchema,
    SessionUpdateSchema,
    SessionResponseSchema,
    SessionMetadataSchema,
    OfflineSessionSchema,
    ConflictResolutionSchema,
    ConflictInfoSchema,
)
from app.core.exceptions import (
    UserNotFoundError,
    InvalidRequestError,
    ConflictError,
)


class SessionService:
    """
    Service for managing reading session save/resume operations.

    Implements cache-first strategy with Redis (15-minute TTL) and
    timestamp-based conflict detection for offline sync.
    """

    def __init__(self, db_session: AsyncSession, redis_client=None):
        """
        Initialize SessionService.

        Args:
            db_session: SQLAlchemy async database session
            redis_client: Optional Redis client for caching (future implementation)
        """
        self.db = db_session
        self.redis = redis_client
        self.cache_ttl = 900  # 15 minutes in seconds

    # Task 3.2: Create Session
    async def create_session(
        self,
        session_data: SessionCreateSchema
    ) -> SessionResponseSchema:
        """
        Create a new reading session.

        Validates user exists and creates a new session record in the database.

        Args:
            session_data: Validated session creation data

        Returns:
            SessionResponseSchema with created session data

        Raises:
            UserNotFoundError: If user_id doesn't exist
            InvalidRequestError: If session creation fails
        """
        # Validate user exists
        user_result = await self.db.execute(
            select(User).where(User.id == session_data.user_id)
        )
        user = user_result.scalar_one_or_none()
        if not user:
            raise UserNotFoundError(f"User with ID '{session_data.user_id}' not found")

        # Create session
        session = ReadingSession(
            user_id=session_data.user_id,
            spread_type=session_data.spread_type,
            spread_config=session_data.spread_config,
            question=session_data.question,
            session_state=session_data.session_state,
            status=session_data.status,
        )

        try:
            self.db.add(session)
            await self.db.commit()
            await self.db.refresh(session)
        except IntegrityError as e:
            await self.db.rollback()
            raise InvalidRequestError(f"Failed to create session: {str(e)}")

        # TODO: Cache in Redis with 15-minute TTL
        # if self.redis:
        #     await self._cache_session(session)

        return SessionResponseSchema.model_validate(session)

    # Task 3.3: Get Session
    async def get_session(self, session_id: str) -> Optional[SessionResponseSchema]:
        """
        Retrieve a session by ID with cache-first strategy.

        Checks Redis cache first (if available), falls back to database.
        Updates cache on database hit.

        Args:
            session_id: UUID of the session to retrieve

        Returns:
            SessionResponseSchema if found, None otherwise
        """
        # TODO: Check Redis cache first
        # if self.redis:
        #     cached = await self._get_cached_session(session_id)
        #     if cached:
        #         return cached

        # Fetch from database
        result = await self.db.execute(
            select(ReadingSession).where(ReadingSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            return None

        # TODO: Cache the result
        # if self.redis:
        #     await self._cache_session(session)

        return SessionResponseSchema.model_validate(session)

    # Task 3.4: List Incomplete Sessions
    async def list_incomplete_sessions(
        self,
        user_id: str,
        limit: int = 10,
        offset: int = 0,
        status: Optional[str] = None
    ) -> Tuple[List[SessionMetadataSchema], int]:
        """
        List incomplete sessions for a user with pagination.

        Returns lightweight metadata without large fields (session_state, spread_config).
        Supports filtering by status.

        Args:
            user_id: UUID of the user
            limit: Maximum number of sessions to return (default: 10)
            offset: Number of sessions to skip for pagination (default: 0)
            status: Optional status filter ('active', 'paused', 'complete')

        Returns:
            Tuple of (list of SessionMetadataSchema, total count)
        """
        # Build query
        query = select(ReadingSession).where(ReadingSession.user_id == user_id)

        # Apply status filter if provided
        if status:
            query = query.where(ReadingSession.status == status)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total_count = total_result.scalar() or 0

        # Apply pagination and ordering
        query = query.order_by(ReadingSession.updated_at.desc()).limit(limit).offset(offset)

        # Execute query
        result = await self.db.execute(query)
        sessions = result.scalars().all()

        # Convert to metadata schemas
        session_list = [SessionMetadataSchema.model_validate(s) for s in sessions]

        return session_list, total_count

    # Task 3.5: Update Session
    async def update_session(
        self,
        session_id: str,
        update_data: SessionUpdateSchema,
        expected_updated_at: Optional[datetime] = None
    ) -> SessionResponseSchema:
        """
        Update a session with timestamp-based conflict detection.

        If expected_updated_at is provided, checks for conflicts and raises
        409 error if timestamps don't match (indicating concurrent modification).

        Args:
            session_id: UUID of the session to update
            update_data: Fields to update
            expected_updated_at: Optional timestamp for conflict detection

        Returns:
            SessionResponseSchema with updated session data

        Raises:
            InvalidRequestError: If session not found or update fails
            ConflictError: If timestamp mismatch detected (409 status)
        """
        # Fetch session
        result = await self.db.execute(
            select(ReadingSession).where(ReadingSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise InvalidRequestError(f"Session with ID '{session_id}' not found")

        # Check for conflicts if expected_updated_at is provided
        if expected_updated_at:
            if session.updated_at != expected_updated_at:
                raise ConflictError(
                    f"Session has been modified. "
                    f"Expected updated_at: {expected_updated_at}, "
                    f"Actual updated_at: {session.updated_at}"
                )

        # Apply updates
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if hasattr(session, field):
                setattr(session, field, value)

        try:
            await self.db.commit()
            await self.db.refresh(session)
        except IntegrityError as e:
            await self.db.rollback()
            raise InvalidRequestError(f"Failed to update session: {str(e)}")

        # TODO: Invalidate cache
        # if self.redis:
        #     await self._invalidate_cache(session_id)

        return SessionResponseSchema.model_validate(session)

    # Task 3.6: Delete Session
    async def delete_session(self, session_id: str) -> bool:
        """
        Delete a session and invalidate cache.

        Args:
            session_id: UUID of the session to delete

        Returns:
            True if deleted successfully

        Raises:
            InvalidRequestError: If session not found
        """
        # Fetch session
        result = await self.db.execute(
            select(ReadingSession).where(ReadingSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise InvalidRequestError(f"Session with ID '{session_id}' not found")

        try:
            await self.db.delete(session)
            await self.db.commit()
        except IntegrityError as e:
            await self.db.rollback()
            raise InvalidRequestError(f"Failed to delete session: {str(e)}")

        # TODO: Invalidate cache
        # if self.redis:
        #     await self._invalidate_cache(session_id)

        return True

    # Task 4.1: Complete Session
    async def complete_session(
        self,
        session_id: str,
        interpretation: Optional[str] = None,
        reading_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Convert an incomplete session to a completed Reading atomically.

        Transitions the session from 'active'/'paused' to 'complete' status,
        creates a corresponding Reading record, and preserves all session data.

        Args:
            session_id: UUID of the session to complete
            interpretation: Optional AI-generated interpretation
            reading_metadata: Additional metadata for the Reading record

        Returns:
            Dict containing both session_id and reading_id

        Raises:
            InvalidRequestError: If session not found or already completed
        """
        # Fetch session
        result = await self.db.execute(
            select(ReadingSession).where(ReadingSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise InvalidRequestError(f"Session with ID '{session_id}' not found")

        if session.status == "complete":
            raise InvalidRequestError(f"Session '{session_id}' is already completed")

        # Import Reading model here to avoid circular dependency
        from app.models.reading_enhanced import CompletedReading as Reading

        # Create Reading from session data
        reading_data = {
            "user_id": session.user_id,
            "question": session.question,
            "spread_type": session.spread_type,
            "cards_drawn": session.session_state.get("cards_drawn", []),
            "interpretation": interpretation or session.session_state.get("interpretation", ""),
            **(reading_metadata or {})
        }

        reading = Reading(**reading_data)

        try:
            # Update session status to complete
            session.status = "complete"

            # Add reading to database
            self.db.add(reading)

            # Commit both changes atomically
            await self.db.commit()
            await self.db.refresh(session)
            await self.db.refresh(reading)
        except IntegrityError as e:
            await self.db.rollback()
            raise InvalidRequestError(f"Failed to complete session: {str(e)}")

        # TODO: Invalidate cache
        # if self.redis:
        #     await self._invalidate_cache(session_id)

        return {
            "session_id": session.id,
            "reading_id": reading.id,
            "status": "completed"
        }

    # Task 4.3: Sync Offline Session
    async def sync_offline_session(
        self,
        offline_data: OfflineSessionSchema
    ) -> Tuple[SessionResponseSchema, Optional[List[ConflictInfoSchema]]]:
        """
        Sync an offline session with the server.

        Handles ID remapping from client-side temporary IDs to server-side UUIDs.
        Detects conflicts by comparing timestamps and returns conflict information
        if server data is newer.

        Args:
            offline_data: Offline session data with client_id

        Returns:
            Tuple of (SessionResponseSchema, Optional list of conflicts)
            If conflicts detected, returns conflict information for resolution

        Raises:
            InvalidRequestError: If sync fails
        """
        # Check if a session with matching characteristics already exists
        # (same user_id, similar created_at timestamp)
        conflicts = await self.check_session_conflicts(offline_data)

        if conflicts:
            # Return existing session with conflict information
            result = await self.db.execute(
                select(ReadingSession).where(
                    and_(
                        ReadingSession.user_id == offline_data.user_id,
                        ReadingSession.question == offline_data.question
                    )
                ).order_by(ReadingSession.created_at.desc()).limit(1)
            )
            existing_session = result.scalar_one_or_none()

            if existing_session:
                return (
                    SessionResponseSchema.model_validate(existing_session),
                    conflicts
                )

        # No conflicts or no existing session - create new session
        session_create = SessionCreateSchema(
            user_id=offline_data.user_id,
            spread_type=offline_data.spread_type,
            spread_config=offline_data.spread_config,
            question=offline_data.question,
            session_state=offline_data.session_state,
            status=offline_data.status,
        )

        # Create session (this will generate server-side UUID)
        new_session = await self.create_session(session_create)

        # TODO: Store client_id -> server_id mapping for client reference
        # This allows client to update local references

        return (new_session, None)

    # Task 4.4: Check Session Conflicts
    async def check_session_conflicts(
        self,
        offline_data: OfflineSessionSchema
    ) -> Optional[List[ConflictInfoSchema]]:
        """
        Check for conflicts between offline session and server data.

        Compares timestamps and session state to detect concurrent modifications.

        Args:
            offline_data: Offline session data

        Returns:
            List of ConflictInfoSchema if conflicts found, None otherwise
        """
        # Find potential matching session on server
        # (same user, same question, created within 1 hour window)
        time_window = timedelta(hours=1)
        result = await self.db.execute(
            select(ReadingSession).where(
                and_(
                    ReadingSession.user_id == offline_data.user_id,
                    ReadingSession.question == offline_data.question,
                    ReadingSession.created_at >= offline_data.created_at - time_window,
                    ReadingSession.created_at <= offline_data.created_at + time_window
                )
            )
        )
        server_session = result.scalar_one_or_none()

        if not server_session:
            return None

        # Check if server data is newer
        if server_session.updated_at <= offline_data.updated_at:
            return None

        # Conflicts detected - build conflict information
        conflicts = []

        # Check session_state conflicts
        if server_session.session_state != offline_data.session_state:
            conflicts.append(
                ConflictInfoSchema(
                    field="session_state",
                    server_value=server_session.session_state,
                    client_value=offline_data.session_state,
                    server_updated_at=server_session.updated_at,
                    client_updated_at=offline_data.updated_at
                )
            )

        # Check status conflicts
        if server_session.status != offline_data.status:
            conflicts.append(
                ConflictInfoSchema(
                    field="status",
                    server_value=server_session.status,
                    client_value=offline_data.status,
                    server_updated_at=server_session.updated_at,
                    client_updated_at=offline_data.updated_at
                )
            )

        return conflicts if conflicts else None

    # Task 4.5: Resolve Conflict
    async def resolve_conflict(
        self,
        resolution_data: ConflictResolutionSchema
    ) -> SessionResponseSchema:
        """
        Resolve session sync conflicts using specified strategy.

        Supports three resolution strategies:
        - last-write-wins: Use data with latest timestamp
        - server-wins: Always prefer server data
        - client-wins: Always prefer client data

        Args:
            resolution_data: Conflict resolution request with strategy

        Returns:
            SessionResponseSchema with resolved session data

        Raises:
            InvalidRequestError: If resolution fails
        """
        # Fetch server session
        result = await self.db.execute(
            select(ReadingSession).where(ReadingSession.id == resolution_data.session_id)
        )
        server_session = result.scalar_one_or_none()

        if not server_session:
            raise InvalidRequestError(
                f"Session with ID '{resolution_data.session_id}' not found"
            )

        client_data = resolution_data.client_data

        # Apply resolution strategy
        if resolution_data.strategy == "server-wins":
            # Keep server data, no changes needed
            pass

        elif resolution_data.strategy == "client-wins":
            # Overwrite server with client data
            server_session.spread_type = client_data.spread_type
            server_session.spread_config = client_data.spread_config
            server_session.question = client_data.question
            server_session.session_state = client_data.session_state
            server_session.status = client_data.status

        elif resolution_data.strategy == "last-write-wins":
            # Compare timestamps for each conflicting field
            for conflict in resolution_data.conflicts:
                if conflict.client_updated_at > conflict.server_updated_at:
                    # Client data is newer, use it
                    setattr(server_session, conflict.field, conflict.client_value)
                # Otherwise keep server data (already has newer value)

        try:
            await self.db.commit()
            await self.db.refresh(server_session)
        except IntegrityError as e:
            await self.db.rollback()
            raise InvalidRequestError(f"Failed to resolve conflict: {str(e)}")

        # TODO: Invalidate cache
        # if self.redis:
        #     await self._invalidate_cache(resolution_data.session_id)

        return SessionResponseSchema.model_validate(server_session)

    # Helper methods for Redis caching (to be implemented when Redis is added)
    # async def _cache_session(self, session: ReadingSession) -> None:
    #     """Cache session in Redis with TTL."""
    #     pass
    #
    # async def _get_cached_session(self, session_id: str) -> Optional[SessionResponseSchema]:
    #     """Retrieve session from Redis cache."""
    #     pass
    #
    # async def _invalidate_cache(self, session_id: str) -> None:
    #     """Remove session from Redis cache."""
    #     pass
