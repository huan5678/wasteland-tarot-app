/**
 * FAQ Section Component with Radix UI Accordion
 * Refactored to use shadcn/ui Accordion for better stability
 */

'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
 * - Radix UI Accordion (single selection mode)
 * - Pip-Boy green theme styling
 * - No manual ScrollTrigger refresh (Radix UI handles DOM updates automatically)
 * - Accessibility compliant (ARIA attributes built-in)
 */
export function FAQSection({ items }: FAQSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="space-y-4"
    >
      {items.map((faq) => (
        <AccordionItem
          key={faq.id}
          value={String(faq.id)}
          className="border-2 border-pip-boy-green bg-[var(--color-pip-boy-green-10)] data-[state=open]:bg-[var(--color-pip-boy-green-15)]"
        >
          <AccordionTrigger className="px-4 py-4 text-left hover:bg-[var(--color-pip-boy-green-20)] transition-colors [&[data-state=open]>svg]:rotate-180">
            <span className="font-semibold text-pip-boy-green pr-4">
              {faq.question}
            </span>
          </AccordionTrigger>
          <AccordionContent className="border-t-2 border-pip-boy-green bg-black/20 px-4 pt-4 pb-4">
            <p className="text-pip-boy-green/80 text-sm leading-relaxed">
              {faq.answer}
            </p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
