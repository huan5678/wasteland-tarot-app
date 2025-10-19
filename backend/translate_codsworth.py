"""
使用 OpenAI API 將 Codsworth 解讀轉換為純繁體中文
保持 Codsworth 優雅的英式管家風格
"""
import asyncio
import sys
import json
from pathlib import Path
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))


SYSTEM_PROMPT = """你是一位專業的翻譯專家，專門將文字轉換為繁體中文。

## 角色背景
Codsworth 是 Fallout 系列中的機器人管家，特點是：
- 優雅的英式管家風格
- 禮貌、正式的措辭
- 經常使用「先生/女士」、「恕我冒昧」等敬語
- 會提到「戰前」的美好時光
- 保持專業且略帶懷舊的語氣

## 翻譯要求
1. 將所有英文內容翻譯為繁體中文
2. 保留專有名詞（如：Nuka-Cola、Pip-Boy、Vault-Tec 等）
3. 保持 Codsworth 的禮貌、正式語氣
4. 使用「先生/女士」、「恕我冒昧」、「戰前」等符合角色的詞彙
5. 語氣要優雅、正式但親切
6. 避免過於口語化的表達

## 範例
原文: "Pardon me, sir/madam, 新開始 appears to be upon us. In the old days, 冒險、純真、可能性 was handled with 戰前禮儀."

翻譯: "恕我冒昧，先生/女士，新的開始似乎即將到來。在戰前的美好時光裡，冒險、純真與可能性都是以最得體的禮儀來對待的。"

請只回傳翻譯後的文字，不要加任何說明或備註。"""


def translate_interpretation(client: OpenAI, card_name: str, original_text: str) -> str:
    """使用 OpenAI API 翻譯單一解讀"""

    user_prompt = f"""卡牌名稱：{card_name}

原文：
{original_text}

請將上述 Codsworth 的解讀完全轉換為純繁體中文，保持他優雅的英式管家風格。"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # 使用 gpt-4o-mini 模型
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        max_tokens=500,
        temperature=0.3
    )

    return response.choices[0].message.content.strip()


async def main():
    """主函式"""
    # 讀取 JSON 檔案
    json_file = Path(__file__).parent / "codsworth_interpretations.json"
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"📚 讀取 {len(data)} 個解讀")

    # 初始化 OpenAI client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ 找不到 OPENAI_API_KEY 環境變數")
        return

    client = OpenAI(api_key=api_key)
    print(f"✅ OpenAI API 已初始化 (使用模型: gpt-4o-mini)")

    # 批次翻譯（每 10 個暫停 1 秒避免 rate limit）
    print("\n開始翻譯...")
    success_count = 0
    fail_count = 0

    for i, item in enumerate(data, 1):
        try:
            print(f"\n[{i}/{len(data)}] 翻譯: {item['card_name']}")
            print(f"   原文: {item['original_text'][:80]}...")

            translated = translate_interpretation(
                client,
                item['card_name'],
                item['original_text']
            )

            item['translated_text'] = translated
            success_count += 1
            print(f"   ✅ 譯文: {translated[:80]}...")

            # 每 10 個暫停 1 秒
            if i % 10 == 0:
                print("   ⏸️  暫停 1 秒...")
                await asyncio.sleep(1)

        except Exception as e:
            fail_count += 1
            print(f"   ❌ 翻譯失敗: {str(e)}")
            continue

    # 儲存翻譯結果
    output_file = Path(__file__).parent / "codsworth_interpretations_translated.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*80}")
    print(f"✅ 翻譯完成！")
    print(f"📁 檔案位置: {output_file}")

    # 統計
    print(f"\n📊 統計：")
    print(f"   - 總數: {len(data)}")
    print(f"   - 成功: {success_count}")
    print(f"   - 失敗: {fail_count}")

    # 顯示前 3 個翻譯範例
    print(f"\n{'='*80}")
    print("翻譯範例（前 3 個）：")
    print(f"{'='*80}")
    for i, item in enumerate(data[:3], 1):
        if item['translated_text']:
            print(f"\n{i}. {item['card_name']}")
            print(f"   原文: {item['original_text']}")
            print(f"   譯文: {item['translated_text']}")
            print("-" * 80)


if __name__ == "__main__":
    asyncio.run(main())
