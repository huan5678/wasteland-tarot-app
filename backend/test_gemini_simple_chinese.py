"""
Test with progressively complex prompts to find the issue
"""
import asyncio
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

async def test_prompts():
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    genai.configure(api_key=api_key)

    # Configure safety settings
    safety_settings = {
        genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
        genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
        genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
        genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
    }

    prompts = [
        "請用繁體中文說：你好",
        "你是一位塔羅解讀者。請用繁體中文說：你好",
        "你是一位塔羅解讀者。請用繁體中文解讀愚者牌。",
        """你是一位塔羅解讀者。
請用繁體中文解讀以下問題：
問題：我的事業會成功嗎？
牌：愚者""",
    ]

    for i, prompt in enumerate(prompts, 1):
        print(f"\n{'='*60}")
        print(f"Test {i}: {len(prompt)} chars")
        print(f"Prompt: {prompt[:100]}...")
        print(f"{'='*60}")

        try:
            client = genai.GenerativeModel(model_name)

            response = await client.generate_content_async(
                prompt,
                safety_settings=safety_settings,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=2000,
                    temperature=0.8,
                ),
                stream=False
            )

            if response.candidates:
                candidate = response.candidates[0]
                print(f"✅ Finish reason: {candidate.finish_reason.name}")

                if candidate.content and candidate.content.parts:
                    text = candidate.content.parts[0].text
                    print(f"✅ Response ({len(text)} chars): {text[:200]}...")
                else:
                    print(f"❌ No content parts")
            else:
                print(f"❌ No candidates")

        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_prompts())
