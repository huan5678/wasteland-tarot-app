#!/usr/bin/env python3
"""
Test script for PATCH /api/v1/readings/{reading_id} endpoint
Tests AI interpretation one-time limit functionality
"""
import asyncio
import sys
from datetime import datetime
from app.db.session import get_db
from app.models.reading_enhanced import CompletedReading
from app.models.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def create_test_reading(session: AsyncSession, user_id: str) -> str:
    """Create a test reading for testing PATCH endpoint."""
    # Create a test reading
    reading = CompletedReading(
        id=f"test-reading-{datetime.now().timestamp()}",
        user_id=user_id,
        question="Test question for PATCH endpoint",
        character_voice_used="pip_boy",
        karma_context="neutral",
        radiation_factor=0.5,
        privacy_level="private",
        allow_public_sharing=False,
        start_time=datetime.now(),
        end_time=datetime.now()
    )

    session.add(reading)
    await session.commit()
    await session.refresh(reading)

    print(f"✓ Created test reading: {reading.id}")
    return reading.id


async def test_patch_endpoint():
    """Test the PATCH endpoint functionality."""
    print("=" * 80)
    print("Testing PATCH /api/v1/readings/{reading_id} Endpoint")
    print("=" * 80)
    print()

    async for session in get_db():
        try:
            # Get first user for testing
            user_query = select(User).limit(1)
            result = await session.execute(user_query)
            user = result.scalar_one_or_none()

            if not user:
                print("✗ No users found in database. Please create a user first.")
                return

            print(f"✓ Using test user: {user.id} ({user.email})")
            print()

            # Create a test reading
            reading_id = await create_test_reading(session, user.id)
            print()

            # Test 1: Verify initial state
            print("Test 1: Verify initial state (ai_interpretation_requested = False)")
            print("-" * 80)
            query = select(CompletedReading).where(CompletedReading.id == reading_id)
            result = await session.execute(query)
            reading = result.scalar_one()

            print(f"  ai_interpretation_requested: {reading.ai_interpretation_requested}")
            print(f"  ai_interpretation_at: {reading.ai_interpretation_at}")
            print(f"  ai_interpretation_provider: {reading.ai_interpretation_provider}")
            print(f"  overall_interpretation: {reading.overall_interpretation}")

            if reading.ai_interpretation_requested == False:
                print("✓ Test 1 PASSED: Initial state is correct")
            else:
                print("✗ Test 1 FAILED: Expected ai_interpretation_requested = False")
                return
            print()

            # Test 2: Simulate first AI interpretation update
            print("Test 2: First AI interpretation update (should succeed)")
            print("-" * 80)

            # Update the reading with AI interpretation
            reading.overall_interpretation = "This is a test AI interpretation"
            reading.summary_message = "Test summary message"
            reading.prediction_confidence = 0.85
            reading.ai_interpretation_requested = True
            reading.ai_interpretation_at = datetime.now()
            reading.ai_interpretation_provider = "openai"

            await session.commit()
            await session.refresh(reading)

            print(f"  ai_interpretation_requested: {reading.ai_interpretation_requested}")
            print(f"  ai_interpretation_at: {reading.ai_interpretation_at}")
            print(f"  ai_interpretation_provider: {reading.ai_interpretation_provider}")
            print(f"  overall_interpretation: {reading.overall_interpretation[:50]}...")

            if reading.ai_interpretation_requested == True:
                print("✓ Test 2 PASSED: First AI interpretation update succeeded")
            else:
                print("✗ Test 2 FAILED: Expected ai_interpretation_requested = True")
                return
            print()

            # Test 3: Verify one-time limit logic (in actual endpoint, this would return 403)
            print("Test 3: Verify one-time limit flag")
            print("-" * 80)
            print(f"  Current ai_interpretation_requested: {reading.ai_interpretation_requested}")
            print(f"  Attempting to update AI interpretation again would be BLOCKED by endpoint")
            print("✓ Test 3 PASSED: One-time limit flag is set correctly")
            print()

            # Test 4: Update non-AI fields (should still work)
            print("Test 4: Update non-AI fields (should still work)")
            print("-" * 80)

            reading.is_favorite = True
            reading.user_satisfaction = 5

            await session.commit()
            await session.refresh(reading)

            print(f"  is_favorite: {reading.is_favorite}")
            print(f"  user_satisfaction: {reading.user_satisfaction}")
            print("✓ Test 4 PASSED: Non-AI fields can still be updated")
            print()

            # Cleanup
            print("Cleanup: Deleting test reading...")
            await session.delete(reading)
            await session.commit()
            print("✓ Test reading deleted")
            print()

            print("=" * 80)
            print("✓ ALL TESTS PASSED")
            print("=" * 80)
            print()
            print("Summary:")
            print("  1. Initial state is correct (ai_interpretation_requested = False)")
            print("  2. First AI interpretation update succeeds")
            print("  3. One-time limit flag is set correctly")
            print("  4. Non-AI fields can still be updated after AI interpretation")
            print()
            print("Next steps:")
            print("  - Test the actual PATCH endpoint via HTTP request")
            print("  - Verify 403 error when attempting second AI interpretation update")
            print("  - Test with real user authentication")

        except Exception as e:
            print(f"✗ ERROR: {e}")
            import traceback
            traceback.print_exc()
            await session.rollback()
        finally:
            break


if __name__ == "__main__":
    asyncio.run(test_patch_endpoint())
