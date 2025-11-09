/**
 * Streaming Interpretation Demo Page
 * Test page for demonstrating AI streaming functionality
 */

'use client';

import React, { useState } from 'react';
import { StreamingInterpretation, MultiCardStreamingInterpretation } from '@/components/readings/StreamingInterpretation';

export default function TestStreamingPage() {
  const [singleCardEnabled, setSingleCardEnabled] = useState(false);
  const [multiCardEnabled, setMultiCardEnabled] = useState(false);
  const [question, setQuestion] = useState('What does the wasteland hold for me?');
  const [characterVoice, setCharacterVoice] = useState('pip_boy');
  const [karmaAlignment, setKarmaAlignment] = useState('neutral');
  const [streamSpeed, setStreamSpeed] = useState(40);

  // Demo card IDs (replace with actual card IDs from your database)
  const demoCardId = 'the-fool';
  const demoCardIds = ['the-fool', 'the-magician', 'the-high-priestess'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-amber-900/20 border-b border-amber-600/30 py-6 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-amber-400 mb-2 font-mono">
            AI Streaming Test Lab
          </h1>
          <p className="text-gray-400 font-mono text-sm">
            Test real-time AI interpretation streaming with Fallout character voices
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Configuration Panel */}
        <div className="bg-gray-800/50 border border-amber-600/30 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-amber-400 mb-4 font-mono">
            Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Question */}
            <div className="md:col-span-2">
              <label className="block text-sm font-mono text-gray-300 mb-2">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-gray-900/50 border border-amber-600/30 rounded px-4 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:border-amber-500"
                placeholder="Ask the wasteland..."
              />
            </div>

            {/* Character Voice */}
            <div>
              <label className="block text-sm font-mono text-gray-300 mb-2">
                Character Voice
              </label>
              <select
                value={characterVoice}
                onChange={(e) => setCharacterVoice(e.target.value)}
                className="w-full bg-gray-900/50 border border-amber-600/30 rounded px-4 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="pip_boy">Pip-Boy 3000</option>
                <option value="vault_dweller">Vault Dweller</option>
                <option value="super_mutant">Super Mutant</option>
                <option value="wasteland_trader">Wasteland Trader</option>
                <option value="codsworth">Codsworth</option>
              </select>
            </div>

            {/* Karma Alignment */}
            <div>
              <label className="block text-sm font-mono text-gray-300 mb-2">
                Karma Alignment
              </label>
              <select
                value={karmaAlignment}
                onChange={(e) => setKarmaAlignment(e.target.value)}
                className="w-full bg-gray-900/50 border border-amber-600/30 rounded px-4 py-2 text-gray-200 font-mono text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="good">Good</option>
                <option value="neutral">Neutral</option>
                <option value="evil">Evil</option>
              </select>
            </div>

            {/* Stream Speed */}
            <div className="md:col-span-2">
              <label className="block text-sm font-mono text-gray-300 mb-2">
                Stream Speed: {streamSpeed} chars/sec
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={streamSpeed}
                onChange={(e) => setStreamSpeed(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Single Card Test */}
        <div className="bg-gray-800/50 border border-amber-600/30 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-amber-400 font-mono">
              Single Card Interpretation
            </h2>
            <button
              onClick={() => setSingleCardEnabled(!singleCardEnabled)}
              className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
                singleCardEnabled
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {singleCardEnabled ? 'Stop' : 'Start Streaming'}
            </button>
          </div>

          <div className="bg-gray-900/50 border border-amber-600/20 rounded p-4 min-h-[200px]">
            {singleCardEnabled ? (
              <StreamingInterpretation
                cardId={demoCardId}
                question={question}
                characterVoice={characterVoice}
                karmaAlignment={karmaAlignment}
                enabled={singleCardEnabled}
                charsPerSecond={streamSpeed}
                onComplete={(text) => {
                  console.log('Single card complete:', text);
                }}
                onError={(error) => {
                  console.error('Single card error:', error);
                }}
              />
            ) : (
              <div className="text-gray-500 font-mono text-sm">
                Click "Start Streaming" to test single card interpretation
              </div>
            )}
          </div>
        </div>

        {/* Multi-Card Test */}
        <div className="bg-gray-800/50 border border-amber-600/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-amber-400 font-mono">
              Multi-Card Spread Interpretation
            </h2>
            <button
              onClick={() => setMultiCardEnabled(!multiCardEnabled)}
              className={`px-4 py-2 rounded font-mono text-sm transition-colors ${
                multiCardEnabled
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {multiCardEnabled ? 'Stop' : 'Start Streaming'}
            </button>
          </div>

          <div className="bg-gray-900/50 border border-amber-600/20 rounded p-4 min-h-[300px]">
            {multiCardEnabled ? (
              <MultiCardStreamingInterpretation
                cardIds={demoCardIds}
                question={question}
                characterVoice={characterVoice}
                karmaAlignment={karmaAlignment}
                spreadType="three_card"
                enabled={multiCardEnabled}
                charsPerSecond={streamSpeed}
                onComplete={(text) => {
                  console.log('Multi-card complete:', text);
                }}
                onError={(error) => {
                  console.error('Multi-card error:', error);
                }}
              />
            ) : (
              <div className="text-gray-500 font-mono text-sm">
                Click "Start Streaming" to test multi-card spread interpretation
              </div>
            )}
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-8 bg-amber-900/10 border border-amber-600/20 rounded-lg p-6">
          <h3 className="text-lg font-bold text-amber-400 mb-3 font-mono">
            Test Information
          </h3>
          <ul className="space-y-2 text-sm text-gray-300 font-mono">
            <li>• Streaming uses Server-Sent Events (SSE) format</li>
            <li>• Backend supports OpenAI, Anthropic, and Gemini providers</li>
            <li>• Typewriter effect is configurable (10-100 chars/sec)</li>
            <li>• Skip button allows immediate full text display</li>
            <li>• Error handling includes retry and fallback mechanisms</li>
            <li>• API endpoint: <code className="text-amber-400">/api/v1/readings/interpretation/stream</code></li>
          </ul>
        </div>

        {/* Performance Metrics */}
        <div className="mt-4 bg-gray-800/30 border border-amber-600/20 rounded-lg p-4">
          <h4 className="text-sm font-bold text-amber-400 mb-2 font-mono">
            Performance Metrics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <div className="text-gray-500">Latency</div>
              <div className="text-green-400">~50-200ms</div>
            </div>
            <div>
              <div className="text-gray-500">Chunk Size</div>
              <div className="text-green-400">Variable</div>
            </div>
            <div>
              <div className="text-gray-500">Stream Speed</div>
              <div className="text-green-400">{streamSpeed} c/s</div>
            </div>
            <div>
              <div className="text-gray-500">Format</div>
              <div className="text-green-400">SSE</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}