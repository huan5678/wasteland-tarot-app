'use client';

import React, { useState } from 'react';
import { DynamicHeroTitle } from '@/components/hero/DynamicHeroTitle';

export default function FontTestPage() {
  const [useNewFont, setUseNewFont] = useState(true);

  const sampleText = {
    zh: '廢土塔羅牌占卜系統 - Wasteland Tarot',
    en: 'The quick brown fox jumps over the lazy dog',
    numbers: '0123456789',
    special: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  return (
    <div className={`min-h-screen bg-wasteland-dark ${useNewFont ? 'font-cubic' : 'font-sans'}`}>
      {/* 控制面板 */}
      <div className="fixed top-4 right-4 z-50 bg-black/80 border border-pip-boy-green p-4 rounded backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-pip-boy-green text-sm">字體切換:</span>
          <button
            onClick={() => setUseNewFont(!useNewFont)}
            className={`px-4 py-2 border ${
              useNewFont
                ? 'bg-pip-boy-green text-black border-pip-boy-green'
                : 'bg-transparent text-pip-boy-green border-pip-boy-green'
            } hover:bg-pip-boy-green/20 transition-colors`}
          >
            {useNewFont ? 'Cubic 11 (新)' : 'Noto Sans TC (舊)'}
          </button>
        </div>
        <div className="mt-2 text-xs text-pip-boy-green/70">
          當前字體: {useNewFont ? 'Cubic 11' : 'Noto Sans TC'}
        </div>
      </div>

      {/* 主要內容 */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-pip-boy-green mb-8 text-center text-pip-boy">
          字體可辨識度測試頁面
        </h1>

        {/* 測試區塊 0: DynamicHeroTitle 元件測試 */}
        <section className="mb-12 bg-black/40 border border-pip-boy-green/30 p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6 interface-header">
            首頁 Hero 區塊效果測試 (DynamicHeroTitle)
          </h2>

          <div className="bg-wasteland-dark border border-pip-boy-green/50 p-8 rounded">
            <p className="text-sm text-pip-boy-green/70 mb-6 text-center">
              以下是首頁 Hero Section 的實際元件,包含打字動畫、CRT 特效和輪播功能:
            </p>
            <DynamicHeroTitle
              testMode={false}
              autoPlay={true}
              typingSpeed={60}
              deletingSpeed={20}
              waitBeforeDelete={4000}
            />
            <p className="text-xs text-pip-boy-green/50 text-center mt-6">
              💡 提示: 切換上方字體按鈕可看到此區塊使用 Cubic 11 或 Noto Sans TC 的效果差異
            </p>
          </div>
        </section>

        {/* 測試區塊 1: 標題尺寸 */}
        <section className="mb-12 bg-black/40 border border-pip-boy-green/30 p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6 interface-header">
            標題字級測試 (Heading Sizes)
          </h2>

          <div className="space-y-4">
            <div>
              <span className="text-sm text-pip-boy-green/70">text-6xl (60px)</span>
              <h1 className="text-6xl font-bold text-pip-boy-green text-pip-boy">
                {sampleText.zh}
              </h1>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">text-5xl (48px)</span>
              <h2 className="text-5xl font-bold text-pip-boy-green text-pip-boy">
                {sampleText.zh}
              </h2>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">text-4xl (36px)</span>
              <h3 className="text-4xl font-bold text-pip-boy-green text-pip-boy">
                {sampleText.zh}
              </h3>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">text-3xl (30px)</span>
              <h4 className="text-3xl font-bold text-pip-boy-green text-pip-boy">
                {sampleText.zh}
              </h4>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">text-2xl (24px)</span>
              <h5 className="text-2xl font-bold text-pip-boy-green text-pip-boy">
                {sampleText.zh}
              </h5>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">text-xl (20px)</span>
              <h6 className="text-xl font-bold text-pip-boy-green text-pip-boy">
                {sampleText.zh}
              </h6>
            </div>
          </div>
        </section>

        {/* 測試區塊 2: 本文尺寸 */}
        <section className="mb-12 bg-black/40 border border-pip-boy-green/30 p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6 interface-header">
            本文字級測試 (Body Text Sizes)
          </h2>

          <div className="space-y-4">
            <div>
              <span className="text-sm text-pip-boy-green/70">text-lg (18px)</span>
              <p className="text-lg text-pip-boy-green">
                {sampleText.zh}
              </p>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">text-base (16px)</span>
              <p className="text-base text-pip-boy-green">
                {sampleText.zh}
              </p>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">text-sm (14px)</span>
              <p className="text-sm text-pip-boy-green">
                {sampleText.zh}
              </p>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">text-xs (12px)</span>
              <p className="text-xs text-pip-boy-green">
                {sampleText.zh}
              </p>
            </div>
          </div>
        </section>

        {/* 測試區塊 3: 數字顯示 */}
        <section className="mb-12 bg-black/40 border border-pip-boy-green/30 p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6 interface-header">
            數字與特殊字元測試 (Numbers & Special Characters)
          </h2>

          <div className="space-y-6">
            <div>
              <span className="text-sm text-pip-boy-green/70">數字 - numeric class (tabular-nums)</span>
              <div className="text-4xl text-pip-boy-green numeric">
                {sampleText.numbers}
              </div>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">統計數字 - stat-number class</span>
              <div className="text-5xl text-pip-boy-green stat-number">
                Level: 99 | HP: 100/100 | Karma: +1000
              </div>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">計數器 - counter class</span>
              <div className="text-3xl text-pip-boy-green counter">
                Reading Count: 42 | Cards Drawn: 156
              </div>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">特殊字元</span>
              <div className="text-2xl text-pip-boy-green">
                {sampleText.special}
              </div>
            </div>
          </div>
        </section>

        {/* 測試區塊 4: Pip-Boy 特效文字 */}
        <section className="mb-12 bg-black/40 border border-pip-boy-green/30 p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6 interface-header">
            Pip-Boy 特效文字測試
          </h2>

          <div className="space-y-6">
            <div>
              <span className="text-sm text-pip-boy-green/70">text-pip-boy class (glow effect)</span>
              <div className="text-3xl text-pip-boy">
                {sampleText.zh}
              </div>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">interface-header class</span>
              <div className="text-2xl interface-header">
                {sampleText.zh}
              </div>
            </div>
          </div>
        </section>

        {/* 測試區塊 5: 混合內容 */}
        <section className="mb-12 bg-black/40 border border-pip-boy-green/30 p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6 interface-header">
            混合內容可辨識度測試
          </h2>

          <div className="space-y-4">
            <div className="text-lg text-pip-boy-green leading-relaxed">
              <p className="mb-4">
                歡迎來到 <span className="text-pip-boy font-bold">廢土塔羅牌占卜系統</span>，
                這是一個結合 Fallout 宇宙與傳統塔羅牌的創新平台。
              </p>
              <p className="mb-4">
                在這個後啟示錄的世界中，我們使用 <span className="numeric">78</span> 張
                <span className="font-bold">Wasteland 主題塔羅牌</span> 為您提供生存指引。
              </p>
              <p className="mb-4">
                The Wasteland Tarot system combines post-apocalyptic wisdom with modern AI technology.
                Our <span className="counter">156+</span> active users have drawn over
                <span className="stat-number">10,000</span> cards.
              </p>
              <p>
                特殊符號測試: ⚠️ ☢️ 💀 🎯 ⚔️ 🛡️ 📊 📈 ⚡ 🔥
              </p>
            </div>
          </div>
        </section>

        {/* 測試區塊 6: 長文本可讀性 */}
        <section className="mb-12 bg-black/40 border border-pip-boy-green/30 p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6 interface-header">
            長文本可讀性測試 (Paragraph Readability)
          </h2>

          <div className="space-y-6">
            <div>
              <span className="text-sm text-pip-boy-green/70">text-base - 標準段落</span>
              <p className="text-base text-pip-boy-green leading-relaxed">
                在核戰爆發後的兩百多年，人類文明已經崩塌，倖存者們在廢土上艱難求生。
                Vault-Tec 公司的避難所計畫雖然保護了部分人類，但也進行了許多不人道的實驗。
                Brotherhood of Steel 致力於保護和控制先進科技，而 NCR 則試圖重建舊世界的民主體制。
                在這個充滿輻射、變種生物和匪徒的危險世界中，每個決定都可能關乎生死。
                塔羅牌，這個古老的占卜工具，在廢土上獲得了新的意義，成為倖存者們尋求指引的方式之一。
              </p>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">text-sm - 小字段落</span>
              <p className="text-sm text-pip-boy-green leading-relaxed">
                After the Great War of 2077, the world was plunged into nuclear winter.
                The survivors who emerged from the Vaults found a harsh and unforgiving wasteland.
                Strange creatures, born from radiation, roam the ruins of once-great cities.
                Raiders and mercenaries prey on the weak, while factions vie for control of scarce resources.
                In this desolate landscape, the Wasteland Tarot serves as a beacon of hope and guidance,
                helping wanderers navigate the treacherous path ahead.
              </p>
            </div>
          </div>
        </section>

        {/* 測試區塊 7: 按鈕與 UI 元素 */}
        <section className="mb-12 bg-black/40 border border-pip-boy-green/30 p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6 interface-header">
            UI 元素測試 (Buttons & Interactive Elements)
          </h2>

          <div className="space-y-6">
            <div>
              <span className="text-sm text-pip-boy-green/70 block mb-3">按鈕尺寸測試</span>
              <div className="flex flex-wrap gap-4">
                <button className="px-6 py-3 bg-pip-boy-green text-black font-bold hover:bg-pip-boy-green/80 transition-colors text-lg">
                  Large Button
                </button>
                <button className="px-5 py-2 bg-pip-boy-green text-black font-bold hover:bg-pip-boy-green/80 transition-colors text-base">
                  Medium Button
                </button>
                <button className="px-4 py-2 bg-pip-boy-green text-black font-bold hover:bg-pip-boy-green/80 transition-colors text-sm">
                  Small Button
                </button>
                <button className="px-3 py-1 bg-pip-boy-green text-black font-bold hover:bg-pip-boy-green/80 transition-colors text-xs">
                  Extra Small
                </button>
              </div>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70 block mb-3">表單輸入框測試</span>
              <div className="space-y-3 max-w-md">
                <input
                  type="text"
                  placeholder="輸入你的名字 (text-base)"
                  className="w-full px-4 py-2 bg-black border border-pip-boy-green text-pip-boy-green text-base placeholder:text-pip-boy-green/50"
                />
                <input
                  type="email"
                  placeholder="your@email.com (text-sm)"
                  className="w-full px-3 py-2 bg-black border border-pip-boy-green text-pip-boy-green text-sm placeholder:text-pip-boy-green/50"
                />
                <textarea
                  placeholder="輸入你的問題... (text-base)"
                  rows={3}
                  className="w-full px-4 py-2 bg-black border border-pip-boy-green text-pip-boy-green text-base placeholder:text-pip-boy-green/50"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 測試區塊 8: 各種文字顏色與背景組合 */}
        <section className="mb-12 bg-black/40 border border-pip-boy-green/30 p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6 interface-header">
            顏色對比測試 (Color Contrast)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black p-4 border border-pip-boy-green">
              <h3 className="text-lg font-bold text-pip-boy-green mb-2">黑底綠字 (主要配色)</h3>
              <p className="text-base text-pip-boy-green">
                廢土塔羅牌占卜系統 | Wasteland Tarot System
              </p>
              <p className="text-sm text-pip-boy-green mt-2 numeric">
                Level: 50 | HP: 85/100 | Caps: 1,234
              </p>
            </div>

            <div className="bg-pip-boy-green p-4">
              <h3 className="text-lg font-bold text-black mb-2">綠底黑字 (反轉配色)</h3>
              <p className="text-base text-black">
                廢土塔羅牌占卜系統 | Wasteland Tarot System
              </p>
              <p className="text-sm text-black mt-2 numeric">
                Level: 50 | HP: 85/100 | Caps: 1,234
              </p>
            </div>

            <div className="bg-pip-boy-green/20 p-4 border border-pip-boy-green">
              <h3 className="text-lg font-bold text-pip-boy-green mb-2">半透明綠底</h3>
              <p className="text-base text-pip-boy-green">
                廢土塔羅牌占卜系統 | Wasteland Tarot System
              </p>
              <p className="text-sm text-pip-boy-green mt-2 numeric">
                Level: 50 | HP: 85/100 | Caps: 1,234
              </p>
            </div>

            <div className="bg-wasteland-dark p-4 border border-pip-boy-green">
              <h3 className="text-lg font-bold text-pip-boy-green mb-2 text-pip-boy">廢土深色背景 (發光效果)</h3>
              <p className="text-base text-pip-boy-green text-pip-boy">
                廢土塔羅牌占卜系統 | Wasteland Tarot System
              </p>
              <p className="text-sm text-pip-boy-green mt-2 numeric text-pip-boy">
                Level: 50 | HP: 85/100 | Caps: 1,234
              </p>
            </div>
          </div>
        </section>

        {/* 測試區塊 9: 小字號極限測試 */}
        <section className="mb-12 bg-black/40 border border-pip-boy-green/30 p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6 interface-header">
            小字號可辨識度測試 (Small Text Legibility)
          </h2>

          <div className="space-y-4">
            <div>
              <span className="text-sm text-pip-boy-green/70">text-xs (12px) - 最小建議字號</span>
              <p className="text-xs text-pip-boy-green">
                廢土塔羅牌占卜系統提供完整的 78 張 Fallout 主題塔羅牌，
                結合 AI 人工智慧為您提供個性化的生存指引與決策支援。
                Wasteland Tarot offers 78 Fallout-themed cards with AI-powered interpretations.
              </p>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70" style={{ fontSize: '11px' }}>11px - 極限測試</span>
              <p className="text-pip-boy-green" style={{ fontSize: '11px' }}>
                廢土塔羅牌占卜系統提供完整的 78 張 Fallout 主題塔羅牌，
                結合 AI 人工智慧為您提供個性化的生存指引與決策支援。
                Wasteland Tarot offers 78 Fallout-themed cards with AI-powered interpretations.
              </p>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70" style={{ fontSize: '10px' }}>10px - 最小極限</span>
              <p className="text-pip-boy-green" style={{ fontSize: '10px' }}>
                廢土塔羅牌占卜系統提供完整的 78 張 Fallout 主題塔羅牌，
                結合 AI 人工智慧為您提供個性化的生存指引與決策支援。
                Wasteland Tarot offers 78 Fallout-themed cards with AI-powered interpretations.
              </p>
            </div>
          </div>
        </section>

        {/* 測試區塊 10: 密集文字區塊 */}
        <section className="mb-12 bg-black/40 border border-pip-boy-green/30 p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-6 interface-header">
            密集文字可讀性測試 (Dense Text Blocks)
          </h2>

          <div className="space-y-4">
            <div>
              <span className="text-sm text-pip-boy-green/70">正常行距 (leading-normal)</span>
              <p className="text-base text-pip-boy-green leading-normal">
                塔羅牌起源於15世紀的義大利，最初是作為一種紙牌遊戲。
                到了18世紀，塔羅牌開始被用於占卜和靈性實踐。
                傳統的塔羅牌由78張牌組成，分為22張大阿爾克那牌和56張小阿爾克那牌。
                大阿爾克那牌代表人生的重大主題和靈性課題，
                而小阿爾克那牌則涉及日常生活的具體情況。
                在廢土塔羅牌系統中，我們將這些古老的智慧與Fallout宇宙的元素相結合，
                創造出一套獨特的占卜工具，幫助玩家在後啟示錄世界中做出明智的選擇。
              </p>
            </div>

            <div>
              <span className="text-sm text-pip-boy-green/70">寬鬆行距 (leading-relaxed)</span>
              <p className="text-base text-pip-boy-green leading-relaxed">
                塔羅牌起源於15世紀的義大利，最初是作為一種紙牌遊戲。
                到了18世紀，塔羅牌開始被用於占卜和靈性實踐。
                傳統的塔羅牌由78張牌組成，分為22張大阿爾克那牌和56張小阿爾克那牌。
                大阿爾克那牌代表人生的重大主題和靈性課題，
                而小阿爾克那牌則涉及日常生活的具體情況。
                在廢土塔羅牌系統中，我們將這些古老的智慧與Fallout宇宙的元素相結合，
                創造出一套獨特的占卜工具，幫助玩家在後啟示錄世界中做出明智的選擇。
              </p>
            </div>
          </div>
        </section>

        {/* 測試結論 */}
        <section className="bg-pip-boy-green/10 border-2 border-pip-boy-green p-6 rounded">
          <h2 className="text-2xl font-bold text-pip-boy-green mb-4 interface-header text-center">
            測試評估指南
          </h2>
          <div className="text-base text-pip-boy-green space-y-2">
            <p>✓ 檢查所有字號的中文字元是否清晰可辨</p>
            <p>✓ 檢查英文字母和數字的可讀性</p>
            <p>✓ 驗證特效文字（發光效果）是否影響辨識度</p>
            <p>✓ 測試不同背景色的對比度</p>
            <p>✓ 評估長文本的閱讀舒適度</p>
            <p>✓ 確認小字號（12px以下）的可用性</p>
            <p className="mt-4 font-bold text-pip-boy">
              切換上方按鈕比較 Cubic 11 與 Noto Sans TC 的差異！
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
