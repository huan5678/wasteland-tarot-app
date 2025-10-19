"""
Test Gemini API directly to diagnose the issue
"""
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

async def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

    print(f"Testing Gemini API")
    print(f"API Key: {api_key[:10]}..." if api_key else "No API key")
    print(f"Model: {model_name}")

    try:
        # Configure API
        genai.configure(api_key=api_key)

        # List available models
        print("\nListing available models:")
        for model in genai.list_models():
            if "gemini" in model.name.lower():
                print(f"  - {model.name}")

        # Test with the specified model
        print(f"\nTesting model: {model_name}")
        client = genai.GenerativeModel(model_name)

        # Test simple prompt
        prompt = "請用繁體中文說：你好，這是測試訊息。"
        print(f"\nPrompt: {prompt}")

        response = await client.generate_content_async(
            prompt,
            stream=True
        )

        print("\nResponse chunks:")
        chunk_count = 0
        async for chunk in response:
            chunk_count += 1
            print(f"Chunk {chunk_count}: {chunk.text}")

        if chunk_count == 0:
            print("❌ No chunks received!")
        else:
            print(f"✅ Received {chunk_count} chunks")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_gemini())
