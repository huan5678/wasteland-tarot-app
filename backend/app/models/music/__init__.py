"""Music models package."""

from .music_track import (
    MusicTrack,
    MusicTrackCreate,
    MusicTrackUpdate,
    MusicTrackResponse,
    MusicListResponse,
    MusicParameters,
)
from .playlist import (
    Playlist,
    PlaylistCreate,
    PlaylistUpdate,
    PlaylistResponse,
    PlaylistTrack,
    AddTrackRequest,
    ReorderTracksRequest,
)
from .quota import (
    UserAIQuota,
    QuotaResponse,
)

__all__ = [
    # Music Track Models
    "MusicTrack",
    "MusicTrackCreate",
    "MusicTrackUpdate",
    "MusicTrackResponse",
    "MusicListResponse",
    "MusicParameters",
    # Playlist Models
    "Playlist",
    "PlaylistCreate",
    "PlaylistUpdate",
    "PlaylistResponse",
    "PlaylistTrack",
    "AddTrackRequest",
    "ReorderTracksRequest",
    # Quota Models
    "UserAIQuota",
    "QuotaResponse",
]
