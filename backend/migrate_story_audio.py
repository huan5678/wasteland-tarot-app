#!/usr/bin/env python
"""
遷移本地故事音檔到 Supabase Storage
將 static/audio/stories/ 中的音檔上傳到 Supabase 並建立資料庫記錄
"""
import asyncio
import os
from pathlib import Path
from uuid import UUID
import hashlib
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.wasteland_card import WastelandCard
from app.models.character_voice import Character
from app.models.audio_file import AudioFile, AudioType, GenerationStatus
from app.core.supabase import get_supabase_client
from app.config import get_settings


# 預設角色（用於這批 gTTS 生成的音檔）
DEFAULT_CHARACTER_KEY = "pip_boy"


async def get_character_id(session, character_key: str) -> UUID:
    """取得角色 ID"""
    result = await session.execute(
        select(Character.id).where(
            Character.key == character_key,
            Character.is_active == True
        )
    )
    character_id = result.scalar_one_or_none()
    if not character_id:
        raise Exception(f"角色 '{character_key}' 不存在或未啟用")
    return character_id


async def upload_audio_to_storage(
    supabase_client,
    local_path: Path,
    storage_path: str
) -> str:
    """
    上傳音檔到 Supabase Storage

    Returns:
        公開 URL
    """
    settings = get_settings()
    bucket_name = getattr(settings, 'SUPABASE_STORAGE_BUCKET', 'audio-files')

    # 讀取檔案
    with open(local_path, 'rb') as f:
        audio_content = f.read()

    # 上傳到 Supabase Storage
    try:
        response = supabase_client.storage.from_(bucket_name).upload(
            path=storage_path,
            file=audio_content,
            file_options={
                "content-type": "audio/mpeg",
                "cache-control": "3600",
                "upsert": "true"  # 允許覆寫
            }
        )

        # 取得公開 URL
        public_url = supabase_client.storage.from_(bucket_name).get_public_url(
            storage_path
        )

        return public_url

    except Exception as e:
        raise Exception(f"上傳失敗: {str(e)}")


async def migrate_audio_file(
    session,
    supabase_client,
    card_id: UUID,
    character_id: UUID,
    local_path: Path,
    dry_run: bool = False
) -> dict:
    """
    遷移單一音檔

    Returns:
        遷移結果統計
    """
    stats = {
        "card_id": str(card_id),
        "success": False,
        "skipped": False,
        "error": None
    }

    try:
        # 檢查是否已存在記錄
        existing = await session.execute(
            select(AudioFile).where(
                AudioFile.card_id == card_id,
                AudioFile.character_id == character_id,
                AudioFile.audio_type == AudioType.STATIC_CARD
            )
        )
        if existing.scalar_one_or_none():
            stats["skipped"] = True
            print(f"    ⏭️  已存在，跳過")
            return stats

        # 讀取檔案資訊
        file_size = local_path.stat().st_size

        # 生成 storage path
        storage_path = f"static/{card_id}/{DEFAULT_CHARACTER_KEY}.mp3"

        if dry_run:
            print(f"    [DRY RUN] 會上傳到: {storage_path}")
            stats["success"] = True
            return stats

        # 上傳到 Supabase Storage
        storage_url = await upload_audio_to_storage(
            supabase_client,
            local_path,
            storage_path
        )

        # 讀取音檔內容計算 hash
        with open(local_path, 'rb') as f:
            content = f.read()
            text_hash = hashlib.md5(content).hexdigest()

        # 建立資料庫記錄
        audio_file = AudioFile(
            card_id=card_id,
            character_id=character_id,
            storage_path=storage_path,
            storage_url=storage_url,
            file_size=file_size,
            duration_seconds=0.0,  # gTTS 沒有 duration metadata
            text_length=0,  # 未知
            text_hash=text_hash,
            language_code="zh-TW",
            voice_name="gTTS-zh-TW",
            ssml_params={},
            audio_type=AudioType.STATIC_CARD,
            generation_status=GenerationStatus.COMPLETED,
            access_count=0
        )

        session.add(audio_file)
        await session.commit()

        stats["success"] = True
        print(f"    ✅ 遷移成功 ({file_size / 1024:.1f} KB)")

    except Exception as e:
        await session.rollback()
        stats["error"] = str(e)
        print(f"    ❌ 遷移失敗: {str(e)}")

    return stats


async def migrate_all_story_audio(
    local_dir: str = "static/audio/stories",
    dry_run: bool = False
):
    """
    遷移所有故事音檔

    Args:
        local_dir: 本地音檔目錄
        dry_run: 僅模擬，不實際上傳
    """
    local_path = Path(local_dir)

    if not local_path.exists():
        print(f"❌ 目錄不存在: {local_path.absolute()}")
        return

    print("=" * 80)
    print("🎙️  Wasteland Tarot 故事音檔遷移工具")
    print("=" * 80)
    print(f"本地目錄: {local_path.absolute()}")
    print(f"預設角色: {DEFAULT_CHARACTER_KEY}")
    print(f"模式: {'DRY RUN（模擬）' if dry_run else '實際遷移'}")
    print("=" * 80 + "\n")

    total_stats = {
        "total_files": 0,
        "total_success": 0,
        "total_skipped": 0,
        "total_errors": 0,
        "results": []
    }

    # 取得 Supabase client
    supabase_client = get_supabase_client()

    async with AsyncSessionLocal() as session:
        # 取得角色 ID
        try:
            character_id = await get_character_id(session, DEFAULT_CHARACTER_KEY)
            print(f"✅ 角色 ID: {character_id}\n")
        except Exception as e:
            print(f"❌ 無法取得角色: {e}")
            return

        # 掃描所有音檔
        audio_files = list(local_path.glob("*_story.mp3"))
        print(f"📋 找到 {len(audio_files)} 個故事音檔\n")

        for idx, audio_file in enumerate(audio_files, 1):
            # 從檔名提取 card_id
            filename = audio_file.stem  # 去除 .mp3
            card_id_str = filename.replace("_story", "")

            try:
                card_id = UUID(card_id_str)
            except ValueError:
                print(f"[{idx}/{len(audio_files)}] ❌ 無效的 card_id: {card_id_str}")
                total_stats["total_errors"] += 1
                continue

            # 驗證卡片存在
            card_result = await session.execute(
                select(WastelandCard.name).where(WastelandCard.id == card_id)
            )
            card_name = card_result.scalar_one_or_none()

            if not card_name:
                print(f"[{idx}/{len(audio_files)}] ❌ 卡片不存在: {card_id}")
                total_stats["total_errors"] += 1
                continue

            print(f"🎴 [{idx}/{len(audio_files)}] {card_name}")
            print(f"   ID: {card_id}")

            # 遷移音檔
            result = await migrate_audio_file(
                session,
                supabase_client,
                card_id,
                character_id,
                audio_file,
                dry_run=dry_run
            )

            total_stats["total_files"] += 1
            if result["success"]:
                total_stats["total_success"] += 1
            if result["skipped"]:
                total_stats["total_skipped"] += 1
            if result["error"]:
                total_stats["total_errors"] += 1

            total_stats["results"].append(result)
            print()

    # 顯示統計
    print("=" * 80)
    print("📊 遷移統計")
    print("=" * 80)
    print(f"處理檔案數: {total_stats['total_files']}")
    print(f"成功遷移: {total_stats['total_success']}")
    print(f"跳過（已存在）: {total_stats['total_skipped']}")
    print(f"錯誤數量: {total_stats['total_errors']}")
    print()

    success_rate = total_stats['total_success'] + total_stats['total_skipped']
    expected = total_stats['total_files']
    print(f"完成率: {success_rate}/{expected} "
          f"({100 * success_rate // expected if expected > 0 else 0}%)")

    print("\n" + "=" * 80)
    if total_stats['total_errors'] == 0 and success_rate == expected:
        print("🎉 所有音檔遷移成功！")
    elif total_stats['total_success'] > 0:
        print("✅ 部分音檔遷移成功")
    else:
        print("❌ 遷移失敗")
    print("=" * 80)


async def main():
    """主執行函數"""
    import sys

    # 檢查命令列參數
    dry_run = "--dry-run" in sys.argv or "-d" in sys.argv

    await migrate_all_story_audio(dry_run=dry_run)


if __name__ == "__main__":
    asyncio.run(main())
