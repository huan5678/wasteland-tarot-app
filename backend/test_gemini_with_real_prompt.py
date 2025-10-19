"""
Test Gemini API with a prompt similar to what the app sends
"""
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

async def test_with_real_prompt():
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    print(f"Testing with real-world prompt")
    print(f"Model: {model_name}\n")

    try:
        genai.configure(api_key=api_key)
        client = genai.GenerativeModel(model_name)

        # Simulate a real system prompt
        system_prompt = """你是一位廢土商人塔羅解讀者，精通塔羅牌與廢土生存智慧。
你的解讀風格務實、直接，帶有商人的精明與對利益的敏銳洞察。
請用繁體中文 (zh-TW) 提供解讀。"""

        # Simulate a real user prompt
        user_prompt = """【問題】我的事業會成功嗎？

【抽到的牌】
1. 愚者 (The Fool)
2. 魔術師 (The Magician)
3. 女祭司 (The High Priestess)

【解讀指引】用繁體中文 (zh-TW) 提供完整牌陣解讀：
1. 直接回答問題：針對「我的事業會成功嗎？」給出明確的核心洞見
2. 講述故事：將 3 張牌組合成連貫的敘事，展示它們如何共同回應問題
3. 位置意義：根據每張牌在牌陣中的位置（過去, 現在, 未來）解釋其意義
4. 牌間關係：說明卡牌之間如何互相影響、支持或挑戰
5. 具體建議：基於整體牌陣，給出可行的行動方向或警示
6. 廢土風格：融入 Fallout 世界觀、業力/陣營情境，保持角色扮演
7. 字數限制：300字以內

請提供深刻、實用的解讀，將所有牌組成一個完整的答案，幫助問卜者理解當前處境並找到方向。"""

        combined_prompt = f"{system_prompt}\n\n{user_prompt}"

        print("Combined prompt length:", len(combined_prompt))
        print("\nGenerating response...\n")

        generation_config = genai.types.GenerationConfig(
            max_output_tokens=1000,
            temperature=0.8,
        )

        # Configure safety settings to be more permissive
        safety_settings = {
            genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
        }

        response = await client.generate_content_async(
            combined_prompt,
            generation_config=generation_config,
            safety_settings=safety_settings,
            stream=True
        )

        print("Response chunks:")
        chunk_count = 0
        full_text = ""
        async for chunk in response:
            chunk_count += 1
            if chunk.text:
                full_text += chunk.text
                print(f"Chunk {chunk_count}: {len(chunk.text)} chars")

        print(f"\n✅ Received {chunk_count} chunks")
        print(f"Total response length: {len(full_text)} chars")
        print(f"\nFull response:\n{full_text}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_with_real_prompt())
