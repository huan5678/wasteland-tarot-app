"""
Test the actual API endpoint with Gemini provider
"""
import asyncio
import aiohttp
import json

async def test_api():
    url = "http://localhost:8000/api/v1/test-ai/interpret/stream"

    # Simulate frontend request
    payload = {
        "question": "我的事業會成功嗎？",
        "character_voice": "wasteland_trader",
        "faction_alignment": "vault_dweller",
        "spread_type": "three_card",
        "card_ids": [
            "1294b21c-6dd2-4e4a-a308-3c94ab5ca911",  # Card 1
            "4839eebc-a8ff-4cce-9632-64329e759384",  # Card 2
            "0dc4a0d2-8bb4-491c-bec1-492817ad47b0"   # Card 3
        ],
        "provider": "gemini"
    }

    print(f"Testing API endpoint: {url}")
    print(f"Provider: {payload['provider']}")
    print(f"Question: {payload['question']}")
    print(f"Card count: {len(payload['card_ids'])}\n")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                print(f"Status: {response.status}")

                if response.status != 200:
                    text = await response.text()
                    print(f"❌ Error response: {text}")
                    return

                # Read streaming response
                print("\n=== Streaming Response ===")
                chunk_count = 0
                full_text = ""

                async for line in response.content:
                    if line:
                        chunk_count += 1
                        text = line.decode('utf-8').strip()
                        if text:
                            full_text += text
                            # Print first 100 chars of each chunk
                            print(f"Chunk {chunk_count}: {text[:100]}...")

                print(f"\n✅ Received {chunk_count} chunks")
                print(f"Total response length: {len(full_text)} chars")
                print(f"\nFull response:\n{full_text}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_api())
