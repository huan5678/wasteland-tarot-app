#!/usr/bin/env python3
"""
Debug script to test reading creation
"""

import asyncio
import httpx
from app.main import app
from app.models.wasteland_card import CharacterVoice
from app.services.user_service import UserService
from app.core.security import create_access_token
from app.db.database import get_db
import uuid

async def test_reading_creation():
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        # Generate unique user data
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "username": f"test_user_{unique_id}",
            "email": f"test_{unique_id}@vault.com",
            "password": "TestPassword123!",
            "display_name": f"Test User {unique_id}"
        }

        # Create user
        from sqlalchemy.ext.asyncio import AsyncSession
        db = next(get_db())

        # Test reading creation
        reading_data = {
            "question": "Past, present, future in the wasteland",
            "spread_type": "three_card",
            "num_cards": 3,
            "character_voice": CharacterVoice.CODSWORTH.value,
            "radiation_factor": 0.7
        }

        response = await client.post("/api/v1/readings/create", json=reading_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_reading_creation())