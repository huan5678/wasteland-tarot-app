"use client";

import { useState, useEffect } from 'react';
import { PixelIcon } from '@/components/ui/icons';

// 角色選項
import { Button } from "@/components/ui/button";const CHARACTER_VOICES = [
{ value: 'pip_boy', label: 'Pip-Boy 3000', description: '技術分析、數據驅動' },
{ value: 'codsworth', label: 'Codsworth', description: '禮貌管家、英式風格' },
{ value: 'vault_dweller', label: 'Vault Dweller', description: '樂觀希望、社區導向' },
{ value: 'super_mutant', label: 'Super Mutant', description: '直接強悍、行動導向' },
{ value: 'wasteland_trader', label: 'Wasteland Trader', description: '務實商人、價值導向' }];


// 陣營選項
const FACTION_ALIGNMENTS = [
{ value: 'vault_dweller', label: 'Vault Dweller', description: '希望重建' },
{ value: 'brotherhood', label: 'Brotherhood of Steel', description: '紀律秩序' },
{ value: 'ncr', label: 'NCR', description: '民主法治' },
{ value: 'legion', label: "Caesar's Legion", description: '力量征服' },
{ value: 'raiders', label: 'Raiders', description: '混亂自由' },
{ value: 'minutemen', label: 'Minutemen', description: '社區互助' },
{ value: 'railroad', label: 'Railroad', description: '革命解放' },
{ value: 'institute', label: 'Institute', description: '科學理性' },
{ value: 'independent', label: 'Independent', description: '個人自由' }];


// AI Provider 選項
const AI_PROVIDERS = [
{ value: 'openai', label: 'OpenAI', description: 'GPT-5-nano - 最低成本、高吞吐量' },
{ value: 'gemini', label: 'Google Gemini', description: 'Gemini 2.5 Flash - 快速回應' }];


// 牌陣選項
const SPREAD_TYPES = [
{ value: 'three_card', label: '三張牌陣', description: '過去-現在-未來', cardCount: 3 },
{ value: 'relationship', label: '關係牌陣', description: '你-他們-關係', cardCount: 3 },
{ value: 'decision', label: '決策牌陣', description: '選項A-選項B-結果', cardCount: 4 },
{ value: 'celtic_cross', label: '凱爾特十字', description: '完整10張牌陣', cardCount: 10 }];


interface Card {
  id: string;
  name: string;
  number: number;
  suit: string;
  upright_meaning: string;
  reversed_meaning?: string;
  metadata?: {
    radiation_level?: number;
    threat_level?: number;
    vault_number?: number | null;
  };
}

export default function TestAIInterpretationPage() {
  const [question, setQuestion] = useState('What does my future hold in the wasteland?');
  const [character, setCharacter] = useState('pip_boy');
  const [faction, setFaction] = useState('vault_dweller');
  const [spreadType, setSpreadType] = useState('three_card');
  const [provider, setProvider] = useState('openai');
  const [cards, setCards] = useState<Card[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState('');

  // 抽牌
  const drawCards = async () => {
    setIsDrawing(true);
    setError('');
    setCards([]);
    setInterpretation('');

    try {
      const selectedSpread = SPREAD_TYPES.find((s) => s.value === spreadType);
      const cardCount = selectedSpread?.cardCount || 3;

      const response = await fetch(`/api/v1/cards/draw?count=${cardCount}`);

      if (!response.ok) {
        throw new Error(`Failed to draw cards: ${response.statusText}`);
      }

      const data = await response.json();
      // API returns array directly, not { cards: [...] }
      setCards(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to draw cards');
      console.error('Draw cards error:', err);
    } finally {
      setIsDrawing(false);
    }
  };

  // 獲取 AI 解讀
  const getInterpretation = async () => {
    if (cards.length === 0) {
      setError('Please draw cards first');
      return;
    }

    setIsLoading(true);
    setError('');
    setInterpretation('');

    try {
      const response = await fetch('/api/v1/test-ai/interpret/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question,
          character_voice: character,
          faction_alignment: faction,
          spread_type: spreadType,
          card_ids: cards.map((c) => c.id),
          provider: provider
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get interpretation: ${response.statusText}`);
      }

      // 讀取串流回應
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let accumulatedText = '';
      let isFirstChunk = true;
      let hasReceivedData = false;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        hasReceivedData = true;

        // 檢查第一個 chunk 是否為 JSON 錯誤訊息
        if (isFirstChunk && chunk.trim().startsWith('{')) {
          try {
            const errorData = JSON.parse(chunk);
            if (errorData.detail) {
              throw new Error(errorData.detail);
            }
          } catch (parseError) {

            // 如果不是有效的 JSON 或沒有 detail，繼續當作普通串流處理
          }isFirstChunk = false;
        }

        accumulatedText += chunk;
        setInterpretation(accumulatedText);
      }

      // 檢查是否收到任何資料
      if (!hasReceivedData || !accumulatedText.trim()) {
        throw new Error('AI服務沒有返回任何內容。請檢查 OpenAI API 設定。');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get interpretation');
      console.error('Interpretation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 自動抽牌（初始化）
  useEffect(() => {
    drawCards();
  }, [spreadType]); // 當牌陣類型改變時重新抽牌

  return (
    <div className="min-h-screen bg-gray-900 text-pip-boy-green p-8">
      <div className="max-w-6xl mx-auto">
        {/* 標題 */}
        <div className="mb-8 border-2 border-pip-boy-green p-6 bg-black/50">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <PixelIcon name="science" sizePreset="lg" variant="primary" />
            AI Interpretation Test Lab
          </h1>
          <p className="text-radiation-orange">
            Database-Driven AI Configuration Testing Interface
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：配置面板 */}
          <div className="space-y-6">
            {/* 問題輸入 */}
            <div className="border-2 border-pip-boy-green p-4 bg-black/50">
              <label className="block mb-2 font-bold flex items-center gap-2">
                <PixelIcon name="message" sizePreset="sm" variant="primary" />
                Your Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-black border-2 border-pip-boy-green text-pip-boy-green p-3 h-24 resize-none focus:outline-none focus:border-radiation-orange"
                placeholder="Ask the wasteland cards..." />

            </div>

            {/* AI Provider 選擇 */}
            <div className="border-2 border-radiation-orange p-4 bg-black/50">
              <label className="block mb-2 font-bold flex items-center gap-2">
                <PixelIcon name="science" sizePreset="sm" variant="secondary" />
                AI Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-black border-2 border-radiation-orange text-pip-boy-green p-3 focus:outline-none focus:border-pip-boy-green">

                {AI_PROVIDERS.map((prov) =>
                <option key={prov.value} value={prov.value}>
                    {prov.label} - {prov.description}
                  </option>
                )}
              </select>
            </div>

            {/* 角色選擇 */}
            <div className="border-2 border-pip-boy-green p-4 bg-black/50">
              <label className="block mb-2 font-bold flex items-center gap-2">
                <PixelIcon name="user" sizePreset="sm" variant="primary" />
                Character Voice
              </label>
              <select
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                className="w-full bg-black border-2 border-pip-boy-green text-pip-boy-green p-3 focus:outline-none focus:border-radiation-orange">

                {CHARACTER_VOICES.map((char) =>
                <option key={char.value} value={char.value}>
                    {char.label} - {char.description}
                  </option>
                )}
              </select>
            </div>

            {/* 陣營選擇 */}
            <div className="border-2 border-pip-boy-green p-4 bg-black/50">
              <label className="block mb-2 font-bold flex items-center gap-2">
                <PixelIcon name="flag" sizePreset="sm" variant="primary" />
                Faction Alignment
              </label>
              <select
                value={faction}
                onChange={(e) => setFaction(e.target.value)}
                className="w-full bg-black border-2 border-pip-boy-green text-pip-boy-green p-3 focus:outline-none focus:border-radiation-orange">

                {FACTION_ALIGNMENTS.map((fac) =>
                <option key={fac.value} value={fac.value}>
                    {fac.label} - {fac.description}
                  </option>
                )}
              </select>
            </div>

            {/* 牌陣選擇 */}
            <div className="border-2 border-pip-boy-green p-4 bg-black/50">
              <label className="block mb-2 font-bold flex items-center gap-2">
                <PixelIcon name="grid" sizePreset="sm" variant="primary" />
                Spread Type
              </label>
              <select
                value={spreadType}
                onChange={(e) => setSpreadType(e.target.value)}
                className="w-full bg-black border-2 border-pip-boy-green text-pip-boy-green p-3 focus:outline-none focus:border-radiation-orange">

                {SPREAD_TYPES.map((spread) =>
                <option key={spread.value} value={spread.value}>
                    {spread.label} ({spread.cardCount} cards) - {spread.description}
                  </option>
                )}
              </select>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-4">
              <Button size="icon" variant="outline"
              onClick={drawCards}
              disabled={isDrawing}
              className="flex-1 font-bold py-3 px-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">

                {isDrawing ?
                <>
                    <PixelIcon name="loader" animation="spin" sizePreset="sm" />
                    Drawing...
                  </> :

                <>
                    <PixelIcon name="shuffle" sizePreset="sm" />
                    Draw Cards
                  </>
                }
              </Button>

              <Button size="icon" variant="outline"
              onClick={getInterpretation}
              disabled={isLoading || cards.length === 0}
              className="flex-1 font-bold py-3 px-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">

                {isLoading ?
                <>
                    <PixelIcon name="loader" animation="spin" sizePreset="sm" />
                    Analyzing...
                  </> :

                <>
                    <PixelIcon name="science" sizePreset="sm" />
                    Get Interpretation
                  </>
                }
              </Button>
            </div>
          </div>

          {/* 右側：結果顯示 */}
          <div className="space-y-6">
            {/* 抽到的卡牌 */}
            <div className="border-2 border-pip-boy-green p-4 bg-black/50">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <PixelIcon name="archive" sizePreset="sm" variant="primary" />
                Drawn Cards ({cards.length})
              </h2>

              {cards.length === 0 ?
              <div className="text-center py-8 text-gray-500">
                  <PixelIcon name="package" sizePreset="xl" variant="muted" decorative />
                  <p className="mt-4">No cards drawn yet</p>
                </div> :

              <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cards.map((card, index) =>
                <div
                  key={card.id}
                  className="border border-pip-boy-green p-3 bg-black/30 hover:bg-black/50 transition-colors">

                      <div className="flex items-start gap-3">
                        <div className="text-radiation-orange font-bold text-xl">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-pip-boy-green">
                            {card.name}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {card.upright_meaning}
                          </div>
                          <div className="text-xs text-radiation-orange mt-1">
                            Suit: {card.suit} | Number: {card.number}
                          </div>
                        </div>
                      </div>
                    </div>
                )}
                </div>
              }
            </div>

            {/* AI 解讀結果 */}
            <div className="border-2 border-radiation-orange p-4 bg-black/50">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <PixelIcon name="cpu" sizePreset="sm" variant="secondary" />
                AI Interpretation
              </h2>

              {error &&
              <div className="bg-red-900/30 border border-red-500 text-red-400 p-4 mb-4 flex items-start gap-2">
                  <PixelIcon name="alert-triangle" sizePreset="sm" variant="error" />
                  <div className="flex-1">
                    <div className="font-bold">Error</div>
                    <div className="text-sm mt-1">{error}</div>
                  </div>
                </div>
              }

              {interpretation ?
              <div className="bg-black/50 border border-pip-boy-green p-4 max-h-96 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-pip-boy-green leading-relaxed">
                    {interpretation}
                  </div>

                  {isLoading &&
                <div className="mt-4 flex items-center gap-2 text-radiation-orange">
                      <PixelIcon name="loader" animation="pulse" sizePreset="sm" />
                      <span className="text-sm">Streaming response...</span>
                    </div>
                }
                </div> :

              <div className="text-center py-12 text-gray-500">
                  <PixelIcon name="message-question" sizePreset="xl" variant="muted" decorative />
                  <p className="mt-4">
                    {cards.length === 0 ?
                  'Draw cards to begin' :
                  'Click "Get Interpretation" to analyze the cards'}
                  </p>
                </div>
              }
            </div>
          </div>
        </div>

        {/* 配置資訊 */}
        <div className="mt-6 border-2 border-gray-700 p-4 bg-black/30 text-xs">
          <div className="font-bold mb-2 text-gray-400">Current Configuration:</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-gray-500">
            <div>
              <span className="text-gray-400">Provider:</span> <span className="text-radiation-orange">{provider}</span>
            </div>
            <div>
              <span className="text-gray-400">Character:</span> {character}
            </div>
            <div>
              <span className="text-gray-400">Faction:</span> {faction}
            </div>
            <div>
              <span className="text-gray-400">Spread:</span> {spreadType}
            </div>
            <div>
              <span className="text-gray-400">Cards:</span> {cards.length}
            </div>
          </div>
        </div>
      </div>
    </div>);

}