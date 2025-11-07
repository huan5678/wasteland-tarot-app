"""Services package - Optimized with lazy loading."""

# DO NOT import services here - import them where needed
# This prevents loading heavy dependencies at module level
# from .music_service import MusicService
# from .playlist_service import PlaylistService
# from .ai_service import AIService
# from .journal_service import JournalService

__all__ = [
    # Services are imported on-demand by endpoints
]
