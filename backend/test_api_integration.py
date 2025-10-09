#!/usr/bin/env python3
"""
快速 API 整合測試
測試完整的用戶流程：註冊 -> 登入 -> 抽牌 -> AI 解釋
"""

import asyncio
import httpx
import json
from typing import Dict, Any


BASE_URL = "http://localhost:8000"  # 假設 API 運行在此


async def test_full_user_workflow():
    """測試完整的用戶工作流程"""

    async with httpx.AsyncClient() as client:
        print("🚀 開始完整 API 整合測試...")

        # 1. 用戶註冊
        print("\n1️⃣  測試用戶註冊...")
        register_data = {
            "username": "test_vault_dweller",
            "email": "test@vault111.com",
            "password": "SecurePassword123!",
            "karma_alignment": "GOOD",
            "faction_alignment": "VAULT_DWELLER",
            "character_voice": "PIP_BOY"
        }

        try:
            response = await client.post(f"{BASE_URL}/api/auth/register", json=register_data)
            if response.status_code == 201:
                print("✅ 用戶註冊成功")
                user_data = response.json()
                print(f"   用戶 ID: {user_data.get('user', {}).get('id', 'N/A')}")
            else:
                print(f"❌ 註冊失敗: {response.status_code} - {response.text}")
                return
        except Exception as e:
            print(f"❌ 註冊請求失敗: {e}")
            return

        # 2. 用戶登入
        print("\n2️⃣  測試用戶登入...")
        login_data = {
            "username": register_data["username"],
            "password": register_data["password"]
        }

        try:
            response = await client.post(f"{BASE_URL}/api/auth/login", json=login_data)
            if response.status_code == 200:
                print("✅ 用戶登入成功")
                auth_data = response.json()
                access_token = auth_data.get("access_token")
                headers = {"Authorization": f"Bearer {access_token}"}
                print(f"   獲得 access token: {access_token[:30]}...")
            else:
                print(f"❌ 登入失敗: {response.status_code} - {response.text}")
                return
        except Exception as e:
            print(f"❌ 登入請求失敗: {e}")
            return

        # 3. 獲取可用卡牌
        print("\n3️⃣  測試獲取卡牌...")
        try:
            response = await client.get(f"{BASE_URL}/api/cards")
            if response.status_code == 200:
                cards_data = response.json()
                cards = cards_data.get("cards", [])
                print(f"✅ 成功獲取 {len(cards)} 張卡牌")
                if cards:
                    print(f"   範例卡牌: {cards[0].get('name', 'N/A')}")
            else:
                print(f"❌ 獲取卡牌失敗: {response.status_code} - {response.text}")
                return
        except Exception as e:
            print(f"❌ 獲取卡牌請求失敗: {e}")
            return

        # 4. 創建占卜記錄
        print("\n4️⃣  測試創建占卜...")
        reading_data = {
            "question": "我今天在廢土中應該如何生存？",
            "spread_type": "SINGLE_CARD",
            "character_voice": "PIP_BOY",
            "is_public": False
        }

        try:
            response = await client.post(
                f"{BASE_URL}/api/readings",
                json=reading_data,
                headers=headers
            )
            if response.status_code == 201:
                print("✅ 成功創建占卜記錄")
                reading_response = response.json()
                reading = reading_response.get("reading", {})
                print(f"   占卜 ID: {reading.get('id', 'N/A')}")
                print(f"   抽到的卡牌: {reading.get('cards_drawn', [])}")
                print(f"   AI 解釋長度: {len(reading.get('interpretation_result', ''))}")

                # 顯示部分解釋內容
                interpretation = reading.get('interpretation_result', '')
                if interpretation:
                    print(f"   解釋預覽: {interpretation[:100]}...")

            else:
                print(f"❌ 創建占卜失敗: {response.status_code} - {response.text}")
                return
        except Exception as e:
            print(f"❌ 創建占卜請求失敗: {e}")
            return

        # 5. 獲取占卜歷史
        print("\n5️⃣  測試獲取占卜歷史...")
        try:
            response = await client.get(f"{BASE_URL}/api/readings", headers=headers)
            if response.status_code == 200:
                history_data = response.json()
                readings = history_data.get("readings", [])
                print(f"✅ 成功獲取 {len(readings)} 筆占卜記錄")
                if readings:
                    latest = readings[0]
                    print(f"   最新占卜: {latest.get('question', 'N/A')[:50]}...")
            else:
                print(f"❌ 獲取歷史失敗: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ 獲取歷史請求失敗: {e}")

        print("\n🎉 整合測試完成！")


async def test_api_health():
    """測試 API 健康狀態"""
    print("🔍 檢查 API 健康狀態...")

    async with httpx.AsyncClient() as client:
        try:
            # 測試基本健康檢查
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print("✅ API 健康檢查通過")
                return True
            else:
                print(f"❌ API 健康檢查失敗: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ 無法連接到 API: {e}")
            print("💡 請確保 FastAPI 服務正在運行 (uvicorn app.main:app --reload)")
            return False


def print_test_summary():
    """列印測試摘要"""
    print("\n" + "="*60)
    print("📋 Wasteland Tarot API 整合測試摘要")
    print("="*60)
    print()
    print("✅ 已完成功能：")
    print("   • 用戶註冊和認證系統")
    print("   • JWT 令牌管理")
    print("   • 卡牌資料檢索")
    print("   • Supabase 資料庫整合")
    print("   • 基本 API 端點")
    print()
    print("🚀 準備測試功能：")
    print("   • 完整用戶工作流程")
    print("   • 抽牌和 AI 解釋")
    print("   • 占卜記錄管理")
    print("   • 個人化功能")
    print()
    print("🎯 測試目標：")
    print("   • 驗證所有 API 端點正常運行")
    print("   • 確認資料庫整合無誤")
    print("   • 測試完整業務流程")
    print("   • 驗證 Fallout 主題一致性")
    print()


async def main():
    """主測試函數"""
    print_test_summary()

    # 首先檢查 API 是否運行
    if await test_api_health():
        # 如果 API 運行，執行完整測試
        await test_full_user_workflow()
    else:
        print("\n💡 要運行完整測試，請先啟動 API 服務：")
        print("   cd backend")
        print("   uv run uvicorn app.main:app --reload")
        print("   然後重新運行此測試腳本")


if __name__ == "__main__":
    asyncio.run(main())