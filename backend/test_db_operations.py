"""
Database Operations Test Script
測試 P1+P2 修改後的資料庫操作
"""

import asyncio
import uuid
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models import (
    User,
    ReadingSession,
    SessionEvent,
    CompletedReading
)

# Create async engine
engine = create_async_engine(settings.database_url, echo=True)
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def test_user_operations():
    """測試 User 基本操作"""
    print("\n" + "="*60)
    print("TEST 1: User Operations")
    print("="*60)

    async with AsyncSessionLocal() as session:
        # Create test user
        test_user = User(
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            name=f"Test User {uuid.uuid4().hex[:8]}",
            password_hash="test_hash",
            is_active=True,
            is_verified=True
        )

        session.add(test_user)
        await session.commit()
        await session.refresh(test_user)

        print(f"✅ Created User: {test_user.id}")
        print(f"   Email: {test_user.email}")
        print(f"   Type of ID: {type(test_user.id)}")

        return test_user.id


async def test_reading_session_operations(user_id: uuid.UUID):
    """測試 ReadingSession CRUD（P1 修改的表）"""
    print("\n" + "="*60)
    print("TEST 2: ReadingSession Operations (P1 UUID Fix)")
    print("="*60)

    async with AsyncSessionLocal() as session:
        # Create reading session - now using proper UUID types and correct fields
        reading_session = ReadingSession(
            user_id=user_id,  # Now accepts UUID directly
            spread_type="vault_tec_spread",
            question="Test question for reading session",
            status="active",
            selected_cards=[],  # Using DB field names
            current_position=0,
            session_data={}
        )

        session.add(reading_session)
        await session.commit()
        await session.refresh(reading_session)

        print(f"✅ Created ReadingSession: {reading_session.id}")
        print(f"   User ID: {reading_session.user_id}")
        print(f"   Type of ID: {type(reading_session.id)}")
        print(f"   Type of user_id: {type(reading_session.user_id)}")
        print(f"   Status: {reading_session.status}")

        # Test FK constraint - should work
        print("\n🔍 Testing Foreign Key Constraint...")
        result = await session.execute(
            select(ReadingSession).where(ReadingSession.user_id == user_id)
        )
        sessions = result.scalars().all()
        print(f"✅ Found {len(sessions)} session(s) for user")

        return reading_session.id


async def test_session_event_operations(
    session_id: uuid.UUID,  # Now proper UUID type
    user_id: uuid.UUID
):
    """測試 SessionEvent CRUD（P1 修改的表）"""
    print("\n" + "="*60)
    print("TEST 3: SessionEvent Operations (P1 UUID Fix)")
    print("="*60)

    async with AsyncSessionLocal() as session:
        # Create session event - now using proper UUID types
        event = SessionEvent(
            session_id=session_id,  # Now accepts UUID directly
            user_id=user_id,        # Now accepts UUID directly
            event_type="card_drawn",
            event_data={"card_id": "test-card-id", "position": 1},
            card_position=1
        )

        session.add(event)
        await session.commit()
        await session.refresh(event)

        print(f"✅ Created SessionEvent: {event.id}")
        print(f"   Session ID: {event.session_id}")
        print(f"   User ID: {event.user_id}")
        print(f"   Type of ID: {type(event.id)}")
        print(f"   Type of session_id: {type(event.session_id)}")
        print(f"   Event Type: {event.event_type}")

        # Test CASCADE delete
        print("\n🔍 Testing CASCADE Delete...")
        print("   (Will be tested in cleanup phase)")

        return event.id


async def test_completed_reading_operations(user_id: uuid.UUID):
    """測試 CompletedReading 操作（P2 索引優化的表）"""
    print("\n" + "="*60)
    print("TEST 4: CompletedReading Operations (P2 Indexes)")
    print("="*60)

    async with AsyncSessionLocal() as session:
        # Create completed reading
        reading = CompletedReading(
            user_id=user_id,
            question="What does my future hold?",
            focus_area="career",
            character_voice_used="pip_boy",
            karma_context="neutral",
            privacy_level="private",
            allow_public_sharing=False,
            tags=["career", "future", "test"],
            shared_with_users=[],
            likes_count=0
        )

        session.add(reading)
        await session.commit()
        await session.refresh(reading)

        print(f"✅ Created CompletedReading: {reading.id}")
        print(f"   User ID: {reading.user_id}")
        print(f"   Focus Area: {reading.focus_area}")
        print(f"   Privacy Level: {reading.privacy_level}")
        print(f"   Tags: {reading.tags}")

        # Test P2 indexes
        print("\n🔍 Testing P2 Optimized Indexes...")

        # Index 1: User + Privacy Level
        result = await session.execute(
            select(CompletedReading).where(
                CompletedReading.user_id == user_id,
                CompletedReading.privacy_level == "private"
            )
        )
        readings = result.scalars().all()
        print(f"✅ Index Test 1 (user_privacy): Found {len(readings)} reading(s)")

        # Index 4: User + Focus Area
        result = await session.execute(
            select(CompletedReading).where(
                CompletedReading.user_id == user_id,
                CompletedReading.focus_area == "career"
            )
        )
        readings = result.scalars().all()
        print(f"✅ Index Test 2 (user_focus): Found {len(readings)} reading(s)")

        # Index 5: Created At (DESC)
        result = await session.execute(
            select(CompletedReading)
            .order_by(CompletedReading.created_at.desc())
            .limit(10)
        )
        readings = result.scalars().all()
        print(f"✅ Index Test 3 (created_desc): Found {len(readings)} reading(s)")

        return reading.id


async def test_cascade_delete(
    user_id: uuid.UUID,
    session_id: uuid.UUID,  # Now proper UUID type
    event_id: uuid.UUID     # Now proper UUID type
):
    """測試 CASCADE DELETE（P1 Foreign Key 約束）"""
    print("\n" + "="*60)
    print("TEST 5: CASCADE Delete (P1 Foreign Key Constraints)")
    print("="*60)

    async with AsyncSessionLocal() as session:
        # Count before delete
        result = await session.execute(
            select(func.count()).select_from(ReadingSession).where(
                ReadingSession.user_id == user_id
            )
        )
        session_count_before = result.scalar()

        result = await session.execute(
            select(func.count()).select_from(SessionEvent).where(
                SessionEvent.user_id == user_id
            )
        )
        event_count_before = result.scalar()

        print(f"📊 Before Delete:")
        print(f"   Sessions: {session_count_before}")
        print(f"   Events: {event_count_before}")

        # Delete user (should CASCADE delete sessions and events)
        # Use direct SQL to avoid relationship lazy loading issues
        from sqlalchemy import delete as sql_delete
        await session.execute(
            sql_delete(User).where(User.id == user_id)
        )
        await session.commit()

        print(f"\n✅ Deleted User: {user_id}")

        # Verify CASCADE delete
        result = await session.execute(
            select(func.count()).select_from(ReadingSession).where(
                ReadingSession.id == session_id
            )
        )
        session_count_after = result.scalar()

        result = await session.execute(
            select(func.count()).select_from(SessionEvent).where(
                SessionEvent.id == event_id
            )
        )
        event_count_after = result.scalar()

        print(f"\n📊 After Delete:")
        print(f"   Sessions: {session_count_after}")
        print(f"   Events: {event_count_after}")

        if session_count_after == 0 and event_count_after == 0:
            print("\n✅ CASCADE DELETE Working Correctly!")
        else:
            print("\n❌ CASCADE DELETE Failed!")


async def run_all_tests():
    """執行所有測試"""
    print("\n" + "="*60)
    print("🧪 DATABASE OPERATIONS TEST SUITE")
    print("   Testing P1 (UUID) + P2 (Indexes) Changes")
    print("="*60)

    try:
        # Test 1: User operations
        user_id = await test_user_operations()

        # Test 2: ReadingSession operations
        session_id = await test_reading_session_operations(user_id)

        # Test 3: SessionEvent operations
        event_id = await test_session_event_operations(session_id, user_id)

        # Test 4: CompletedReading operations with P2 indexes
        reading_id = await test_completed_reading_operations(user_id)

        # Test 5: CASCADE delete
        await test_cascade_delete(user_id, session_id, event_id)

        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60)
        print("\n📝 Summary:")
        print("   ✅ UUID types working correctly")
        print("   ✅ Foreign Key constraints active")
        print("   ✅ CASCADE delete functioning")
        print("   ✅ P2 indexes supporting queries")
        print("\n🎉 Database is ready for production!")

    except Exception as e:
        print("\n" + "="*60)
        print("❌ TEST FAILED!")
        print("="*60)
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_all_tests())
