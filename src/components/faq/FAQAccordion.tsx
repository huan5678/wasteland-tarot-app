'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * FAQ Item Data Structure
 * FAQ 項目資料結構
 */import { Button } from "@/components/ui/button";
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

/**
 * FAQ Accordion Props
 * FAQ 摺疊元件屬性
 */
export interface FAQAccordionProps {
  /** Array of FAQ items to display (FAQ 項目陣列) */
  items: FAQItem[];

  /** Index of item to expand by default (預設展開的項目索引，預設為 0) */
  defaultExpandedIndex?: number;

  /** Optional className for container (容器的可選類名) */
  className?: string;
}

/**
 * FAQ Accordion Item Component
 * FAQ 摺疊項目元件
 */
interface FAQAccordionItemProps {
  item: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

function FAQAccordionItem({
  item,
  isExpanded,
  onToggle,
  index
}: FAQAccordionItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  // Update height when expanded state changes
  useEffect(() => {
    if (isExpanded && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isExpanded]);

  // Handle keyboard interaction
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div className="border-b-2 border-green-900 last:border-b-0">
      {/* Question Header */}
      <Button size="default" variant="outline"
      type="button"
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      aria-expanded={isExpanded}
      aria-controls={`faq-answer-${item.id}`}
      className="flex w-full items-start gap-3 px-4 py-4 transition-colors">

        {/* Expand/Collapse Icon */}
        <span
          className="mt-1 flex-shrink-0 text-green-600 transition-transform duration-200"
          aria-hidden="true"
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>

          ▶
        </span>

        {/* Question Text */}
        <div className="flex-1">
          <span className="text-sm font-bold text-green-500">
            <span className="text-green-700">Q{index + 1}:</span>{' '}
            {item.question}
          </span>
          {item.category &&
          <span className="ml-2 rounded bg-green-950/50 px-2 py-0.5 text-xs text-green-700 border border-green-900">
              {item.category}
            </span>
          }
        </div>
      </Button>

      {/* Answer Content (Collapsible) */}
      <div
        id={`faq-answer-${item.id}`}
        ref={contentRef}
        role="region"
        aria-labelledby={`faq-question-${item.id}`}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ height }}>

        <div className="px-4 pb-4 pl-11">
          <div className="rounded border-l-2 border-green-800 bg-green-950/20 p-4">
            <p className="text-sm leading-relaxed text-green-400">
              <span className="font-bold text-green-600">A:</span>{' '}
              {item.answer}
            </p>
          </div>
        </div>
      </div>
    </div>);

}

/**
 * FAQ Accordion Component
 * FAQ 摺疊清單元件
 *
 * @description
 * Client-side accordion component for FAQ display with:
 * - Single expansion mode (only one item open at a time)
 * - Terminal-style expand/collapse icons
 * - Smooth height transition animations
 * - Keyboard navigation support (Enter/Space)
 * - First item expanded by default
 * - Full accessibility support
 *
 * @example
 * ```tsx
 * const faqs = [
 *   {
 *     id: 'karma-system',
 *     question: 'Karma 系統是如何運作的？',
 *     answer: 'Karma 系統追蹤你在廢土塔羅的行為與選擇...',
 *     category: 'Karma 系統'
 *   }
 * ];
 *
 * <FAQAccordion items={faqs} defaultExpandedIndex={0} />
 * ```
 *
 * @component
 * @since 1.0.0
 */
export default function FAQAccordion({
  items,
  defaultExpandedIndex = 0,
  className = ''
}: FAQAccordionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    defaultExpandedIndex
  );

  /**
   * Toggle accordion item
   * If clicking the same item, collapse it
   * If clicking a different item, expand it
   */
  const handleToggle = (index: number) => {
    setExpandedIndex((prev) => prev === index ? null : index);
  };

  return (
    <div
      className={`border-2 border-green-800 bg-black/80 ${className}`}>

      {/* Accordion Header */}
      <div className="border-b-2 border-green-800 bg-green-950/50 px-4 py-3">
        <h3 className="text-lg font-bold text-green-400">
          <span className="text-green-700" aria-hidden="true">
            [?]{' '}
          </span>
          常見問題
          <span className="ml-2 text-sm font-normal text-green-600">
            ({items.length} 個問題)
          </span>
        </h3>
        <p className="mt-1 text-xs text-green-700">
          點擊問題展開詳細解答
        </p>
      </div>

      {/* FAQ Items */}
      <div>
        {items.map((item, index) =>
        <FAQAccordionItem
          key={item.id}
          item={item}
          index={index}
          isExpanded={expandedIndex === index}
          onToggle={() => handleToggle(index)} />

        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-green-900 px-4 py-3 text-center text-xs text-green-700">
        <p>
          <span aria-hidden="true">&gt;</span> 找不到您的問題？
          <a
            href="/contact"
            className="ml-2 underline decoration-dotted hover:text-green-500">

            聯絡我們
          </a>
        </p>
      </div>
    </div>);

}