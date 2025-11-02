#!/usr/bin/env python3
"""
測試 AI Service 是否正確初始化
"""
import asyncio
from app.core.config import get_settings
from app.services.ai_interpretation_service import AIInterpretationService
from app.db.session import get_db

async def test_ai_service():
    print("=" * 60)
    print("Testing AI Interpretation Service")
    print("=" * 60)

    # Load settings
    settings = get_settings()
    print(f"\n1. Settings:")
    print(f"   AI_ENABLED: {settings.ai_enabled}")
    print(f"   AI_PROVIDER: {settings.ai_provider}")
    print(f"   OPENAI_API_KEY exists: {bool(settings.openai_api_key)}")
    print(f"   OPENAI_API_KEY length: {len(settings.openai_api_key) if settings.openai_api_key else 0}")
    print(f"   GEMINI_API_KEY exists: {bool(settings.gemini_api_key)}")
    print(f"   ANTHROPIC_API_KEY exists: {bool(settings.anthropic_api_key)}")

    # Initialize service
    print(f"\n2. Initializing AIInterpretationService...")
    async for db in get_db():
        service = AIInterpretationService(settings, db)

        print(f"\n3. Service Status:")
        print(f"   Provider initialized: {service.provider is not None}")

        if service.provider:
            print(f"   Provider available: {service.provider.is_available()}")
            provider_info = service.provider.get_provider_info()
            if provider_info:
                print(f"   Provider info:")
                print(f"     - Provider: {provider_info.get('provider')}")
                print(f"     - Model: {provider_info.get('model')}")
                print(f"     - Estimated cost: ${provider_info.get('estimated_cost', 0):.6f}/request")
        else:
            print(f"   ❌ Provider NOT initialized!")
            print(f"   Possible reasons:")
            print(f"      - AI_ENABLED=False")
            print(f"      - No API keys configured")
            print(f"      - API key invalid or expired")

        print(f"\n4. Overall Status:")
        print(f"   Service available: {service.is_available()}")

        if not service.is_available():
            print(f"\n❌ AI Service is NOT available!")
            print(f"\nTroubleshooting:")
            print(f"   1. Check .env file has correct API keys")
            print(f"   2. Ensure AI_ENABLED=True")
            print(f"   3. Verify API key is valid (test on OpenAI website)")
            print(f"   4. Check backend logs for initialization errors")
        else:
            print(f"\n✅ AI Service is ready!")

        break

if __name__ == "__main__":
    asyncio.run(test_ai_service())
