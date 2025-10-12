"""
Music system main router

整合所有音樂相關的 API 端點:
- /music - 音樂管理
- /playlists - 播放清單管理
- /ai - AI 音樂生成
"""

from fastapi import APIRouter

from app.api.v1.endpoints import music, playlists, ai

# 建立主路由
router = APIRouter()

# 註冊子路由
router.include_router(music.router, prefix="/music", tags=["Music"])
router.include_router(playlists.router, prefix="/playlists", tags=["Playlists"])
router.include_router(ai.router, prefix="/ai", tags=["AI Music Generation"])
