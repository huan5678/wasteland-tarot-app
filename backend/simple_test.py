import asyncio
from httpx import AsyncClient
from app.main import app
from app.models.wasteland_card import CharacterVoice

async def test_simple():
    async with AsyncClient(app=app, base_url="http://test") as client:
        reading_data = {
            "question": "Test question",
            "spread_type": "single_card",
            "num_cards": 1,
            "character_voice": CharacterVoice.CODSWORTH.value,
            "radiation_factor": 0.7
        }

        response = await client.post("/api/v1/readings/create", json=reading_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_simple())
