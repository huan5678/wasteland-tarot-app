/**
 * FAQ Section Component with Framer Motion Animations
 * Tasks 12.1-12.6: FAQ展開動畫
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/lib/animations/useReducedMotion';
import {
  faqExpandVariants,
  faqArrowVariants,
  reducedMotionTransition,
} from '@/lib/animations/motionVariants';
import { PixelIcon } from '@/components/ui/icons';

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  items: FAQItem[];
}

/**
 * FAQ Section Component
 *
 * Features:
 * - Task 12.1: Accordion behavior (only one FAQ expanded at a time)
 * - Task 12.2: Smooth expand/collapse animation with Framer Motion
 * - Task 12.3: Arrow rotation animation (0° <-> 180°)
 * - Task 12.4: Overflow hidden to prevent layout shift
 * - Task 12.5: Reduced-motion support
 */
export function FAQSection({ items }: FAQSectionProps) {
  // Task 12.1: State management for expand/collapse
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Task 12.5: Detect reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Task 12.1: Toggle FAQ expand/collapse (Accordion behavior)
  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {items.map((faq) => (
        <div
          key={faq.id}
          className="border-2 border-pip-boy-green bg-[var(--color-pip-boy-green-10)]"
        >
          {/* Question Button */}
          <button
            onClick={() => toggleFaq(faq.id)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-pip-boy-green-20)] transition-colors"
            aria-expanded={expandedFaq === faq.id}
          >
            <span className="font-semibold text-pip-boy-green pr-4">
              {faq.question}
            </span>

            {/* Task 12.3: Animated Arrow Icon with rotation */}
            <motion.div
              variants={faqArrowVariants}
              initial="collapsed"
              animate={expandedFaq === faq.id ? 'expanded' : 'collapsed'}
              transition={
                prefersReducedMotion
                  ? reducedMotionTransition
                  : { duration: 0.3 }
              }
            >
              <PixelIcon
                name="arrow-down-s"
                sizePreset="sm"
                className="flex-shrink-0 text-pip-boy-green"
                aria-hidden="true"
              />
            </motion.div>
          </button>

          {/* Task 12.2: Answer Panel with AnimatePresence for exit animation */}
          <AnimatePresence initial={false}>
            {expandedFaq === faq.id && (
              <motion.div
                variants={faqExpandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                transition={
                  prefersReducedMotion ? reducedMotionTransition : undefined
                }
                className="border-t-2 border-pip-boy-green overflow-hidden" // Task 12.4: overflow-hidden prevents layout shift
              >
                <div className="p-4 bg-black/20">
                  <p className="text-pip-boy-green/80 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
