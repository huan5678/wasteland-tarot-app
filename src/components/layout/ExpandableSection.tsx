'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Expandable Section Props
 * 可展開章節元件屬性
 */
export interface ExpandableSectionProps {
  /** Section title (章節標題) */
  title: string;

  /** Section content (章節內容) */
  children: React.ReactNode;

  /** Unique ID for URL hash navigation (用於 URL hash 導航的唯一 ID) */
  id: string;

  /** Whether section is expanded by default (是否預設展開) */
  defaultExpanded?: boolean;

  /** Optional heading level (可選的標題層級，預設為 h3) */
  headingLevel?: 'h2' | 'h3' | 'h4';

  /** Optional className for container (容器的可選類名) */
  className?: string;
}

/**
 * Expandable Section Component
 * 可展開章節元件
 *
 * @description
 * Client-side expandable section component for long documents with:
 * - Click-to-expand/collapse functionality
 * - URL hash auto-expansion (e.g., #data-collection)
 * - Smooth scroll to expanded section
 * - Terminal-style expand indicators (+/−)
 * - Smooth height transition animations
 * - Keyboard navigation support
 * - Semantic heading structure
 *
 * @example
 * ```tsx
 * <ExpandableSection
 *   id="data-collection"
 *   title="1. 個人資料蒐集項目"
 *   defaultExpanded={false}
 * >
 *   <p>Content here...</p>
 * </ExpandableSection>
 * ```
 *
 * @component
 * @since 1.0.0
 */
export default function ExpandableSection({
  title,
  children,
  id,
  defaultExpanded = false,
  headingLevel = 'h3',
  className = '',
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [height, setHeight] = useState<number | undefined>(
    defaultExpanded ? undefined : 0
  );

  // Handle URL hash navigation
  useEffect(() => {
    // Check if this section should be auto-expanded based on URL hash
    const hash = window.location.hash.slice(1); // Remove # prefix
    if (hash === id && !isExpanded) {
      setIsExpanded(true);

      // Smooth scroll to section after a short delay (for animation)
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 300);
    }
  }, [id, isExpanded]);

  // Update height when expanded state changes
  useEffect(() => {
    if (isExpanded && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isExpanded]);

  // Toggle expansion
  const handleToggle = () => {
    setIsExpanded((prev) => !prev);

    // Update URL hash without scrolling
    if (!isExpanded) {
      window.history.pushState(null, '', `#${id}`);
    }
  };

  // Handle keyboard interaction
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Dynamic heading component
  const HeadingTag = headingLevel;

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`border-b-2 border-green-900 last:border-b-0 ${className}`}
    >
      {/* Section Header */}
      <HeadingTag className="m-0">
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={isExpanded}
          aria-controls={`section-content-${id}`}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-green-950/30 focus:bg-green-950/30 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-black"
        >
          {/* Title */}
          <span className="flex-1 text-base font-bold text-green-500 sm:text-lg">
            {title}
          </span>

          {/* Expand/Collapse Indicator */}
          <span
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 border-green-700 text-green-600 transition-all duration-200"
            aria-hidden="true"
          >
            {isExpanded ? '−' : '+'}
          </span>
        </button>
      </HeadingTag>

      {/* Section Content (Collapsible) */}
      <div
        id={`section-content-${id}`}
        ref={contentRef}
        role="region"
        aria-labelledby={id}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ height: isExpanded ? height : 0 }}
      >
        <div className="border-t border-green-900 px-4 py-6 text-green-500">
          {children}
        </div>
      </div>
    </section>
  );
}
