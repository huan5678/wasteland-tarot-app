/**
 * Variant Mapper - Map style analysis to Button component props
 *
 * Purpose: Map analyzed styles to variant/size, apply custom rules, generate warnings
 * Requirements: 2.1-2.12
 */

import type {
  StyleAnalysis,
  MappingResult,
  MappingRule,
  ButtonVariant,
} from './types';

/**
 * Variant Mapper class
 */
export class VariantMapper {
  private customRules: MappingRule[] = [];

  /**
   * Map style analysis to final variant/size props
   */
  map(analysis: StyleAnalysis): MappingResult {
    let variant = analysis.suggestedVariant;
    const size = analysis.suggestedSize;
    const customClassNames = analysis.remainingClassNames;
    const warnings: string[] = [];

    // Apply custom rules (higher priority than analysis)
    const customRuleMatch = this.applyCustomRules(
      analysis.remainingClassNames.join(' '),
      undefined
    );

    if (customRuleMatch) {
      variant = customRuleMatch;
    }

    // Add warning for low confidence mappings
    if (analysis.confidence === 'low') {
      warnings.push(
        `Low confidence mapping: ${analysis.reasoning}. Please review manually.`
      );
    }

    // Add warning for medium confidence mappings (optional)
    if (analysis.confidence === 'medium') {
      warnings.push(
        `Medium confidence mapping: ${analysis.reasoning}. Review recommended.`
      );
    }

    return {
      variant,
      size,
      customClassNames,
      warnings,
    };
  }

  /**
   * Add a custom mapping rule
   */
  addCustomRule(rule: MappingRule): void {
    this.customRules.push(rule);
    // Sort by priority (highest first)
    this.customRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Apply custom rules to className
   */
  private applyCustomRules(
    className: string,
    onClick?: string
  ): ButtonVariant | null {
    for (const rule of this.customRules) {
      if (rule.matcher(className, onClick)) {
        return rule.variant;
      }
    }

    return null;
  }
}
