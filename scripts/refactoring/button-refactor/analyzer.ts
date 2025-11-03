/**
 * Style Analyzer - Analyze button styles and infer variants
 *
 * Purpose: Analyze className, extract style semantics, infer variant and size
 * Requirements: 2.1-2.12
 */

import type {
  ButtonInfo,
  StyleAnalysis,
  ButtonVariant,
  ButtonSize,
  MappingConfidence,
} from './types';

/**
 * Mapping rule for className keywords to variants
 */
interface VariantRule {
  keywords: string[];
  variant: ButtonVariant;
  priority: number;
}

/**
 * Style Analyzer class
 */
export class StyleAnalyzer {
  private variantRules: VariantRule[];

  constructor() {
    // Define variant mapping rules (ordered by priority)
    this.variantRules = [
      // High priority - specific actions
      {
        keywords: ['destructive', 'danger', 'delete', 'remove'],
        variant: 'destructive',
        priority: 100,
      },
      {
        keywords: ['success', 'confirm', 'complete'],
        variant: 'success',
        priority: 100,
      },
      {
        keywords: ['warning', 'alert', 'caution'],
        variant: 'warning',
        priority: 100,
      },
      // Medium priority - style variants
      {
        keywords: ['primary', 'submit'],
        variant: 'default',
        priority: 50,
      },
      {
        keywords: ['outline', 'secondary', 'bordered', 'border-'],
        variant: 'outline',
        priority: 50,
      },
      {
        keywords: ['ghost', 'transparent', 'flat'],
        variant: 'ghost',
        priority: 50,
      },
      {
        keywords: ['link', 'text', 'anchor'],
        variant: 'link',
        priority: 50,
      },
      // Low priority - informational
      {
        keywords: ['info', 'help', 'tooltip'],
        variant: 'info',
        priority: 10,
      },
    ];
  }

  /**
   * Analyze button style and suggest variant/size
   */
  analyze(buttonInfo: ButtonInfo): StyleAnalysis {
    const className = buttonInfo.className || '';
    const onClick = buttonInfo.onClick;

    // Try className-based matching first
    const classNameMatch = this.matchVariantFromClassName(className);

    if (classNameMatch) {
      const size = this.inferSize(className, buttonInfo.children);
      const remainingClassNames = this.filterLayoutClasses(className);

      return {
        suggestedVariant: classNameMatch.variant,
        suggestedSize: size,
        remainingClassNames,
        confidence: 'high',
        reasoning: `className contains ${classNameMatch.matched} keyword`,
      };
    }

    // Try heuristic analysis (onClick handler or button type)
    const heuristicMatch = this.matchVariantFromHeuristics(buttonInfo);

    if (heuristicMatch) {
      const size = this.inferSize(className, buttonInfo.children);
      const remainingClassNames = this.filterLayoutClasses(className);

      return {
        suggestedVariant: heuristicMatch.variant,
        suggestedSize: size,
        remainingClassNames,
        confidence: 'medium',
        reasoning: heuristicMatch.reasoning,
      };
    }

    // Fallback to default
    const size = this.inferSize(className, buttonInfo.children);
    const remainingClassNames = this.filterLayoutClasses(className);

    return {
      suggestedVariant: 'default',
      suggestedSize: size,
      remainingClassNames,
      confidence: 'low',
      reasoning: 'No matching keywords found, fallback to default variant',
    };
  }

  /**
   * Match variant based on className keywords
   */
  private matchVariantFromClassName(
    className: string
  ): { variant: ButtonVariant; matched: string } | null {
    const lowerClassName = className.toLowerCase();

    // Sort rules by priority (highest first)
    const sortedRules = [...this.variantRules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      for (const keyword of rule.keywords) {
        if (lowerClassName.includes(keyword.toLowerCase())) {
          return { variant: rule.variant, matched: keyword };
        }
      }
    }

    return null;
  }

  /**
   * Match variant based on heuristics (onClick name, button type)
   */
  private matchVariantFromHeuristics(
    buttonInfo: ButtonInfo
  ): { variant: ButtonVariant; reasoning: string } | null {
    const onClick = buttonInfo.onClick?.toLowerCase() || '';
    const buttonType = buttonInfo.attributes?.type;

    // Check onClick handler name
    if (onClick.includes('delete') || onClick.includes('remove')) {
      return {
        variant: 'destructive',
        reasoning: `onClick handler name "${buttonInfo.onClick}" suggests destructive action`,
      };
    }

    if (onClick.includes('confirm') || onClick.includes('success')) {
      return {
        variant: 'success',
        reasoning: `onClick handler name "${buttonInfo.onClick}" suggests success action`,
      };
    }

    if (onClick.includes('submit') || onClick.includes('save')) {
      return {
        variant: 'default',
        reasoning: `onClick handler name "${buttonInfo.onClick}" suggests primary action`,
      };
    }

    // Check button type
    if (buttonType === 'submit') {
      return {
        variant: 'default',
        reasoning: 'type="submit" suggests primary action',
      };
    }

    return null;
  }

  /**
   * Infer button size from className and content
   */
  private inferSize(className: string, children: string): ButtonSize {
    const lowerClassName = className.toLowerCase();

    // Check if button has no text content (icon-only)
    if (!children || children.trim() === '') {
      return 'icon';
    }

    // Check for size keywords in className
    if (
      lowerClassName.includes('h-7') ||
      lowerClassName.includes('px-2') ||
      lowerClassName.includes('text-xs')
    ) {
      return 'xs';
    }

    if (
      lowerClassName.includes('h-8') ||
      lowerClassName.includes('px-3') ||
      lowerClassName.includes('text-sm')
    ) {
      return 'sm';
    }

    if (
      lowerClassName.includes('h-12') ||
      lowerClassName.includes('px-6') ||
      lowerClassName.includes('text-base')
    ) {
      return 'lg';
    }

    if (
      lowerClassName.includes('h-14') ||
      lowerClassName.includes('px-8') ||
      lowerClassName.includes('text-lg')
    ) {
      return 'xl';
    }

    // Default size
    return 'default';
  }

  /**
   * Filter className to preserve only layout-related classes
   */
  private filterLayoutClasses(className: string): string[] {
    if (!className) return [];

    const classes = className.split(' ').filter(c => c.trim());

    // Layout prefixes to preserve
    const layoutPrefixes = [
      'flex',
      'grid',
      'items-',
      'justify-',
      'gap-',
      'm-', 'mt-', 'mr-', 'mb-', 'ml-', 'mx-', 'my-',
      'p-', 'pt-', 'pr-', 'pb-', 'pl-', 'px-', 'py-',
      'w-', 'h-',
      'max-w-', 'max-h-',
      'min-w-', 'min-h-',
      'space-',
      'col-',
      'row-',
      'absolute', 'relative', 'fixed', 'sticky',
      'top-', 'right-', 'bottom-', 'left-',
      'z-',
    ];

    // Filter out style-related classes (colors, borders, etc.)
    const stylePrefixes = [
      'bg-', 'text-', 'border-',
      'rounded-',
      'shadow-',
      'hover:', 'focus:', 'active:',
      'btn-', 'button-',
    ];

    return classes.filter(cls => {
      const lowerCls = cls.toLowerCase();

      // Preserve layout classes
      for (const prefix of layoutPrefixes) {
        if (lowerCls.startsWith(prefix)) {
          return true;
        }
      }

      // Remove style classes
      for (const prefix of stylePrefixes) {
        if (lowerCls.includes(prefix)) {
          return false;
        }
      }

      // Preserve other utility classes (could be layout-related)
      return true;
    });
  }
}
