/**
 * VirtualizedReadingList Usage Example
 *
 * This file demonstrates how to use the VirtualizedReadingList component
 * in various scenarios.
 */

'use client';

import React, { useState } from 'react';
import { VirtualizedReadingList } from './VirtualizedReadingList';
import type { Reading } from '@/types/database';

// Example: Generate mock reading data for testing
function generateMockReadings(count: number): Reading[] {
  return Array(count)
    .fill(null)
    .map((_, i) => ({
      id: `reading-${i + 1}`,
      user_id: 'user-123',
      question: `我的問題 ${i + 1}：關於${['愛情', '事業', '健康', '財富', '人際關係'][i % 5]}的未來`,
      spread_type: ['single_card', 'three_card', 'wasteland_survival', 'celtic_cross'][i % 4],
      spread_template_id: `template-${i % 4 + 1}`,
      cards_drawn: Array(Math.floor(Math.random() * 5) + 1)
        .fill(null)
        .map((_, cardIndex) => ({
          id: `card-${cardIndex}`,
          name: ['The Fool', 'The Magician', 'The Empress', 'The Emperor'][cardIndex % 4],
          suit: 'major_arcana',
          position: Math.random() > 0.5 ? 'upright' : 'reversed',
          image_url: `/cards/card-${cardIndex}.png`,
          positionIndex: cardIndex,
        })),
      interpretation: `這是解讀 ${i + 1} 的詳細內容...`,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      updated_at: new Date(Date.now() - i * 86400000).toISOString(),
      is_favorite: Math.random() > 0.7,
      archived: false,
    }));
}

/**
 * Example 1: Small List (Simple Rendering)
 *
 * When you have less than 100 readings, the component
 * automatically uses simple list rendering for best simplicity.
 */
export function SmallListExample() {
  const [readings] = useState(() => generateMockReadings(25));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-pip-boy-green mb-4">
        小型列表示例 (25 筆記錄)
      </h2>
      <p className="text-pip-boy-green/60 mb-4">
        使用簡單列表渲染，適合少量記錄。
      </p>
      <VirtualizedReadingList
        readings={readings}
        onSelect={(id) => console.log('Selected reading:', id)}
      />
    </div>
  );
}

/**
 * Example 2: Large List (Virtual Scrolling)
 *
 * When you have 100+ readings, the component automatically
 * enables virtual scrolling for optimal performance.
 */
export function LargeListExample() {
  const [readings] = useState(() => generateMockReadings(500));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-pip-boy-green mb-4">
        大型列表示例 (500 筆記錄)
      </h2>
      <p className="text-pip-boy-green/60 mb-4">
        自動啟用虛擬捲動，保持流暢效能。
      </p>
      <VirtualizedReadingList
        readings={readings}
        onSelect={(id) => console.log('Selected reading:', id)}
      />
    </div>
  );
}

/**
 * Example 3: Loading State
 *
 * Shows skeleton loading animation while fetching data.
 */
export function LoadingStateExample() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-pip-boy-green mb-4">
        載入狀態示例
      </h2>
      <VirtualizedReadingList readings={[]} isLoading={true} />
    </div>
  );
}

/**
 * Example 4: Empty State
 *
 * Shows friendly message when no readings are available.
 */
export function EmptyStateExample() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-pip-boy-green mb-4">
        空狀態示例
      </h2>
      <VirtualizedReadingList readings={[]} isLoading={false} />
    </div>
  );
}

/**
 * Example 5: With Selection Handler
 *
 * Demonstrates handling reading selection events.
 */
export function WithSelectionExample() {
  const [readings] = useState(() => generateMockReadings(10));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-pip-boy-green mb-4">
        選擇處理示例
      </h2>
      {selectedId && (
        <div className="mb-4 p-4 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded">
          <p className="text-pip-boy-green">已選擇解讀: {selectedId}</p>
        </div>
      )}
      <VirtualizedReadingList
        readings={readings}
        onSelect={setSelectedId}
      />
    </div>
  );
}

/**
 * Example 6: Force Disable Virtualization
 *
 * You can manually disable virtualization even for large lists.
 * Useful for debugging or when you need all items in DOM.
 */
export function DisabledVirtualizationExample() {
  const [readings] = useState(() => generateMockReadings(150));

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-pip-boy-green mb-4">
        禁用虛擬捲動示例 (150 筆記錄)
      </h2>
      <p className="text-pip-boy-green/60 mb-4">
        即使超過 100 筆，仍使用簡單列表。
      </p>
      <VirtualizedReadingList
        readings={readings}
        enableVirtualization={false}
        onSelect={(id) => console.log('Selected reading:', id)}
      />
    </div>
  );
}

/**
 * Example 7: Variable Card Counts
 *
 * Demonstrates how the component handles readings with
 * different numbers of cards (variable height estimation).
 */
export function VariableHeightExample() {
  const [readings] = useState(() =>
    Array(20)
      .fill(null)
      .map((_, i) => ({
        id: `reading-${i + 1}`,
        user_id: 'user-123',
        question: `解讀 ${i + 1}`,
        spread_type: 'celtic_cross',
        spread_template_id: 'template-1',
        // Varying card counts: 1, 3, 5, 7, 10
        cards_drawn: Array((i % 5) + 1 + (i % 3) * 2)
          .fill(null)
          .map((_, cardIndex) => ({
            id: `card-${cardIndex}`,
            name: 'The Fool',
            suit: 'major_arcana',
            position: 'upright',
            image_url: '/cards/fool.png',
            positionIndex: cardIndex,
          })),
        interpretation: '解讀內容...',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false,
        archived: false,
      }))
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-pip-boy-green mb-4">
        變動高度示例
      </h2>
      <p className="text-pip-boy-green/60 mb-4">
        不同卡片數量的解讀項目，高度自動估算。
      </p>
      <VirtualizedReadingList readings={readings} />
    </div>
  );
}

/**
 * Complete Demo Component
 *
 * Shows all examples in a tabbed interface.
 */
export function VirtualizedReadingListDemo() {
  const [activeTab, setActiveTab] = useState('small');

  const tabs = [
    { id: 'small', label: '小型列表', component: SmallListExample },
    { id: 'large', label: '大型列表', component: LargeListExample },
    { id: 'loading', label: '載入狀態', component: LoadingStateExample },
    { id: 'empty', label: '空狀態', component: EmptyStateExample },
    { id: 'selection', label: '選擇處理', component: WithSelectionExample },
    { id: 'disabled', label: '禁用虛擬', component: DisabledVirtualizationExample },
    { id: 'variable', label: '變動高度', component: VariableHeightExample },
  ];

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component || SmallListExample;

  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-4xl font-bold text-pip-boy-green mb-8 text-center">
        VirtualizedReadingList 組件示例
      </h1>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded font-mono whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-pip-boy-green text-black'
                : 'bg-pip-boy-green/20 text-pip-boy-green hover:bg-pip-boy-green/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Example */}
      <div className="bg-black/50 border border-pip-boy-green/30 rounded-lg p-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
