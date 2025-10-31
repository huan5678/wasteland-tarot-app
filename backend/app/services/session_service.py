"""
Session Service - Business logic for reading session save/resume feature

Handles creation, retrieval, update, and deletion of incomplete reading sessions.
Supports offline-first architecture with conflict resolution strategies.
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.attributes import flag_modified

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

        # Create session (mapping schema fields to model fields)
        session = ReadingSession(
            user_id=session_data.user_id,
            spread_type=session_data.spread_type,
            question=session_data.question,
            # Map session_state to session_data (model field)
            session_data={
                "spread_config": session_data.spread_config,
                "session_state": session_data.session_state,
            },
            # Extract selected_cards and current_position from session_state
            selected_cards=session_data.session_state.get("cards_drawn", []),
            current_position=session_data.session_state.get("current_position", 0),
            status=session_data.status,
        )

        try:
            self.db.add(session)
            await self.db.commit()
            await self.db.refresh(session)
        except IntegrityError as e:
            await self.db.rollback()
            raise InvalidRequestError(f"Failed to create session: {str(e)}")

        # Convert with proper UUID handling and field mapping
        session_dict = {
            "id": str(session.id),
            "user_id": str(session.user_id),
            "spread_type": session.spread_type,
            # Extract spread_config and session_state from session_data
            "spread_config": session.session_data.get("spread_config") if session.session_data else None,
            "question": session.question,
            "session_state": session.session_data.get("session_state", {}) if session.session_data else {},
            "status": session.status,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "last_accessed_at": session.last_accessed_at
        }

        # Cache in Redis with 15-minute TTL
        await self._cache_session(session)

        return SessionResponseSchema(**session_dict)

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
        # Check Redis cache first
        cached = await self._get_cached_session(session_id)
        if cached:
            return cached

        # Fetch from database
        result = await self.db.execute(
            select(ReadingSession).where(ReadingSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            return None

        # Convert with proper UUID handling and field mapping
        session_dict = {
            "id": str(session.id),
            "user_id": str(session.user_id),
            "spread_type": session.spread_type,
            # Extract spread_config and session_state from session_data
            "spread_config": session.session_data.get("spread_config") if session.session_data else None,
            "question": session.question,
            "session_state": session.session_data.get("session_state", {}) if session.session_data else {},
            "status": session.status,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "last_accessed_at": session.last_accessed_at
        }

        # Cache the result
        await self._cache_session(session)

        return SessionResponseSchema(**session_dict)

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

        # Apply status filter if provided, otherwise exclude completed sessions by default
        if status:
            query = query.where(ReadingSession.status == status)
        else:
            # Default: only show incomplete sessions (exclude 'complete' status)
            query = query.where(ReadingSession.status != 'complete')

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total_count = total_result.scalar() or 0

        # Apply pagination and ordering
        query = query.order_by(ReadingSession.updated_at.desc()).limit(limit).offset(offset)

        # Execute query
        result = await self.db.execute(query)
        sessions = result.scalars().all()

        # Convert to metadata schemas with proper UUID handling
        session_list = []
        for s in sessions:
            try:
                # Ensure UUIDs are converted to strings for Pydantic
                session_dict = {
                    "id": str(s.id),
                    "user_id": str(s.user_id),
                    "spread_type": s.spread_type,
                    "question": s.question,
                    "status": s.status,
                    "created_at": s.created_at,
                    "updated_at": s.updated_at,
                    "last_accessed_at": s.last_accessed_at
                }
                session_list.append(SessionMetadataSchema(**session_dict))
            except Exception as e:
                # Log error but continue processing other sessions
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error converting session {s.id}: {str(e)}")
                continue

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

        # Apply updates (mapping schema fields to model fields)
        update_dict = update_data.model_dump(exclude_unset=True)

        # Handle special field mappings
        if "session_state" in update_dict or "spread_config" in update_dict:
            # Merge updates into session_data
            current_session_data = session.session_data or {}
            if "spread_config" in update_dict:
                current_session_data["spread_config"] = update_dict.pop("spread_config")
            if "session_state" in update_dict:
                new_session_state = update_dict.pop("session_state")
                current_session_data["session_state"] = new_session_state
                # Update selected_cards and current_position
                session.selected_cards = new_session_state.get("cards_drawn", session.selected_cards)
                session.current_position = new_session_state.get("current_position", session.current_position)
            session.session_data = current_session_data
            # CRITICAL FIX: Mark JSONB field as modified for SQLAlchemy change tracking
            flag_modified(session, "session_data")

        # Apply remaining updates
        for field, value in update_dict.items():
            if hasattr(session, field):
                setattr(session, field, value)

        try:
            await self.db.commit()
            await self.db.refresh(session)
        except IntegrityError as e:
            await self.db.rollback()
            raise InvalidRequestError(f"Failed to update session: {str(e)}")

        # Convert with proper UUID handling and field mapping
        session_dict = {
            "id": str(session.id),
            "user_id": str(session.user_id),
            "spread_type": session.spread_type,
            # Extract spread_config and session_state from session_data
            "spread_config": session.session_data.get("spread_config") if session.session_data else None,
            "question": session.question,
            "session_state": session.session_data.get("session_state", {}) if session.session_data else {},
            "status": session.status,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "last_accessed_at": session.last_accessed_at
        }

        # Invalidate cache (will be updated on next read)
        await self._invalidate_cache(session_id)

        return SessionResponseSchema(**session_dict)

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

        # Invalidate cache
        await self._invalidate_cache(session_id)

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
        creates a corresponding Reading record with normalized card positions,
        and preserves all session data.

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

        # Import Reading models here to avoid circular dependency
        from app.models.reading_enhanced import CompletedReading as Reading, ReadingCardPosition
        from app.models.wasteland_card import WastelandCard

        # Extract session state and cards_drawn
        session_state = session.session_data.get("session_state", {}) if session.session_data else {}
        cards_drawn = session_state.get("cards_drawn", [])

        # DEBUG: Log the cards_drawn data
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"[complete_session] Session {session_id}: Found {len(cards_drawn)} cards_drawn")
        for idx, card in enumerate(cards_drawn):
            logger.info(f"[complete_session] Card {idx}: {card}")

        # Build reading data WITHOUT cards_drawn field (normalized design)
        reading_data = {
            "user_id": session.user_id,
            "question": session.question,
            # NOTE: spread_type is tracked via spread_template_id, not directly in CompletedReading
            "overall_interpretation": interpretation or session_state.get("interpretation", ""),
            # Extract optional fields from reading_metadata
            "spread_template_id": reading_metadata.get("spread_template_id") if reading_metadata else None,
            "interpretation_template_id": reading_metadata.get("interpretation_template_id") if reading_metadata else None,
            "focus_area": reading_metadata.get("focus_area") if reading_metadata else None,
            "context_notes": reading_metadata.get("context_notes") if reading_metadata else None,
            # Default required fields
            "character_voice_used": reading_metadata.get("character_voice_used", "pip_boy") if reading_metadata else "pip_boy",
            "karma_context": reading_metadata.get("karma_context", "neutral") if reading_metadata else "neutral",
            # Optional fields from reading_metadata
            "faction_influence": reading_metadata.get("faction_influence") if reading_metadata else None,
            "radiation_factor": reading_metadata.get("radiation_factor", 0.5) if reading_metadata else 0.5,
            "summary_message": reading_metadata.get("summary_message") if reading_metadata else None,
            "prediction_confidence": reading_metadata.get("prediction_confidence") if reading_metadata else None,
            "energy_reading": reading_metadata.get("energy_reading") if reading_metadata else None,
            "session_duration": reading_metadata.get("session_duration") if reading_metadata else None,
            "start_time": reading_metadata.get("start_time") if reading_metadata else None,
            "end_time": reading_metadata.get("end_time") if reading_metadata else None,
            "location": reading_metadata.get("location") if reading_metadata else None,
            "mood_before": reading_metadata.get("mood_before") if reading_metadata else None,
            "mood_after": reading_metadata.get("mood_after") if reading_metadata else None,
            "privacy_level": reading_metadata.get("privacy_level", "private") if reading_metadata else "private",
            "allow_public_sharing": reading_metadata.get("allow_public_sharing", False) if reading_metadata else False,
            "is_favorite": reading_metadata.get("is_favorite", False) if reading_metadata else False,
        }

        # Create the CompletedReading record
        reading = Reading(**reading_data)

        try:
            # Add reading to database first to get its ID
            self.db.add(reading)
            await self.db.flush()  # Flush to get reading.id without committing

            # Create ReadingCardPosition records for each card
            for idx, card_data in enumerate(cards_drawn):
                # Handle different card_data formats
                # Format 1: Dict with card_id/id field
                # Format 2: String UUID directly
                # Format 3: Empty or None

                if not card_data:
                    # Skip empty cards
                    continue

                # If card_data is a string, treat it as card_id
                if isinstance(card_data, str):
                    card_id = card_data
                    is_reversed = False
                    position_number = idx
                    position_name = None
                    position_meaning = None
                    extra_fields = {}
                elif isinstance(card_data, dict):
                    # card_data expected format from frontend:
                    # {
                    #   "card_id": "uuid",
                    #   "card_name": "...",
                    #   "suit": "...",
                    #   "position": "upright" | "reversed",  ← THIS IS CARD ORIENTATION, NOT POSITION NUMBER!
                    #   "positionName": "自己",
                    #   "positionMeaning": "你在這個情境中的位置"
                    # }
                    card_id = card_data.get("card_id") or card_data.get("id")

                    # Check card orientation from both "position" (string) and "is_reversed" (boolean)
                    position_str = card_data.get("position")  # "upright" | "reversed"
                    is_reversed_bool = card_data.get("is_reversed") or card_data.get("isReversed")

                    # Determine is_reversed: prioritize boolean, fallback to string check
                    if is_reversed_bool is not None:
                        is_reversed = bool(is_reversed_bool)
                    elif position_str:
                        is_reversed = position_str.lower() == "reversed"
                    else:
                        is_reversed = False

                    # position_number is ALWAYS the index in the spread (0, 1, 2, ...)
                    position_number = idx

                    # position_name and position_meaning from spread template
                    position_name = card_data.get("position_name") or card_data.get("positionName")
                    position_meaning = card_data.get("position_meaning") or card_data.get("positionMeaning")
                    # Extract optional fields
                    extra_fields = {
                        "position_interpretation": card_data.get("position_interpretation"),
                        "card_significance": card_data.get("card_significance"),
                        "connection_to_question": card_data.get("connection_to_question"),
                        "radiation_influence": card_data.get("radiation_influence", 0.0),
                        "visual_effects": card_data.get("visual_effects"),
                        "audio_cue": card_data.get("audio_cue"),
                        "reveal_delay": card_data.get("reveal_delay", 0.0),
                        "user_resonance": card_data.get("user_resonance"),
                        "interpretation_confidence": card_data.get("interpretation_confidence"),
                    }
                else:
                    # Unknown format, skip
                    continue

                if not card_id:
                    # Skip cards without valid ID
                    continue

                # Check if card_id is a UUID or a name/slug
                # If it's not a valid UUID format, try to look it up by name
                try:
                    from uuid import UUID
                    UUID(card_id)  # Validate UUID format
                    resolved_card_id = card_id
                except (ValueError, AttributeError, TypeError):
                    # card_id is likely a name or slug (e.g., "the-fool", "The Fool")
                    # Try to look up by name (case-insensitive)
                    # Convert slug format to title format: "the-fool" -> "The Fool"
                    card_name = card_id.replace('-', ' ').title()
                    card_result = await self.db.execute(
                        select(WastelandCard).where(
                            func.lower(WastelandCard.name) == func.lower(card_name)
                        )
                    )
                    card = card_result.scalar_one_or_none()
                    if not card:
                        # Also try the original string as-is
                        card_result2 = await self.db.execute(
                            select(WastelandCard).where(
                                func.lower(WastelandCard.name) == func.lower(card_id)
                            )
                        )
                        card = card_result2.scalar_one_or_none()
                        if not card:
                            # Skip cards that can't be found
                            continue
                    resolved_card_id = str(card.id)

                card_position = ReadingCardPosition(
                    completed_reading_id=reading.id,
                    card_id=resolved_card_id,  # Use resolved UUID
                    position_number=position_number,
                    position_name=position_name or f"Position {position_number + 1}",  # Fallback if not provided
                    position_meaning=position_meaning or "",  # Required field
                    is_reversed=is_reversed,
                    draw_order=idx,
                    # Optional fields (only for dict format)
                    **extra_fields
                )
                self.db.add(card_position)

            # Update session status to complete
            session.status = "complete"

            # Commit all changes atomically
            await self.db.commit()
            await self.db.refresh(session)
            await self.db.refresh(reading)
        except IntegrityError as e:
            await self.db.rollback()
            raise InvalidRequestError(f"Failed to complete session: {str(e)}")

        # Invalidate cache (session is now completed)
        await self._invalidate_cache(session_id)

        return {
            "session_id": str(session.id),
            "reading_id": str(reading.id),
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
                # Convert with proper UUID handling and field mapping
                session_dict = {
                    "id": str(existing_session.id),
                    "user_id": str(existing_session.user_id),
                    "spread_type": existing_session.spread_type,
                    # Extract spread_config and session_state from session_data
                    "spread_config": existing_session.session_data.get("spread_config") if existing_session.session_data else None,
                    "question": existing_session.question,
                    "session_state": existing_session.session_data.get("session_state", {}) if existing_session.session_data else {},
                    "status": existing_session.status,
                    "created_at": existing_session.created_at,
                    "updated_at": existing_session.updated_at,
                    "last_accessed_at": existing_session.last_accessed_at
                }
                return (
                    SessionResponseSchema(**session_dict),
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
        server_session_state = server_session.session_data.get("session_state", {}) if server_session.session_data else {}
        if server_session_state != offline_data.session_state:
            conflicts.append(
                ConflictInfoSchema(
                    field="session_state",
                    server_value=server_session_state,
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
            server_session.question = client_data.question
            server_session.status = client_data.status
            # Update session_data with client data
            server_session.session_data = {
                "spread_config": client_data.spread_config,
                "session_state": client_data.session_state,
            }
            # CRITICAL FIX: Mark JSONB field as modified for SQLAlchemy change tracking
            flag_modified(server_session, "session_data")
            # Update selected_cards and current_position
            server_session.selected_cards = client_data.session_state.get("cards_drawn", [])
            server_session.current_position = client_data.session_state.get("current_position", 0)

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

        # Convert with proper UUID handling and field mapping
        session_dict = {
            "id": str(server_session.id),
            "user_id": str(server_session.user_id),
            "spread_type": server_session.spread_type,
            # Extract spread_config and session_state from session_data
            "spread_config": server_session.session_data.get("spread_config") if server_session.session_data else None,
            "question": server_session.question,
            "session_state": server_session.session_data.get("session_state", {}) if server_session.session_data else {},
            "status": server_session.status,
            "created_at": server_session.created_at,
            "updated_at": server_session.updated_at,
            "last_accessed_at": server_session.last_accessed_at
        }

        # Invalidate cache (session has been updated via conflict resolution)
        await self._invalidate_cache(resolution_data.session_id)

        return SessionResponseSchema(**session_dict)

    # Helper methods for Redis caching
    async def _cache_session(self, session: ReadingSession) -> None:
        """
        Cache session in Redis with 15-minute TTL.

        Args:
            session: ReadingSession model instance to cache
        """
        if not self.redis:
            return

        try:
            import json
            from datetime import datetime

            cache_key = f"session:{session.id}"

            # Serialize session to JSON
            session_data = {
                "id": str(session.id),
                "user_id": str(session.user_id),
                "spread_type": session.spread_type,
                "spread_config": session.session_data.get("spread_config") if session.session_data else None,
                "question": session.question,
                "session_state": session.session_data.get("session_state", {}) if session.session_data else {},
                "status": session.status,
                "created_at": session.created_at.isoformat() if session.created_at else None,
                "updated_at": session.updated_at.isoformat() if session.updated_at else None,
                "last_accessed_at": session.last_accessed_at.isoformat() if session.last_accessed_at else None,
            }

            # Store in Redis with TTL
            await self.redis.setex(
                cache_key,
                self.cache_ttl,  # 15 minutes
                json.dumps(session_data)
            )

        except Exception as e:
            # Log error but don't fail the operation
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to cache session {session.id}: {e}")

    async def _get_cached_session(self, session_id: str) -> Optional[SessionResponseSchema]:
        """
        Retrieve session from Redis cache.

        Args:
            session_id: UUID of the session to retrieve

        Returns:
            SessionResponseSchema if found in cache, None otherwise
        """
        if not self.redis:
            return None

        try:
            import json
            from datetime import datetime

            cache_key = f"session:{session_id}"
            cached_data = await self.redis.get(cache_key)

            if not cached_data:
                return None

            # Deserialize from JSON
            session_dict = json.loads(cached_data)

            # Convert ISO format strings back to datetime objects
            if session_dict.get("created_at"):
                session_dict["created_at"] = datetime.fromisoformat(session_dict["created_at"])
            if session_dict.get("updated_at"):
                session_dict["updated_at"] = datetime.fromisoformat(session_dict["updated_at"])
            if session_dict.get("last_accessed_at"):
                session_dict["last_accessed_at"] = datetime.fromisoformat(session_dict["last_accessed_at"])

            return SessionResponseSchema(**session_dict)

        except Exception as e:
            # Log error but don't fail the operation
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to retrieve cached session {session_id}: {e}")
            return None

    async def _invalidate_cache(self, session_id: str) -> None:
        """
        Remove session from Redis cache.

        Args:
            session_id: UUID of the session to invalidate
        """
        if not self.redis:
            return

        try:
            cache_key = f"session:{session_id}"
            await self.redis.delete(cache_key)

        except Exception as e:
            # Log error but don't fail the operation
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to invalidate cache for session {session_id}: {e}")
