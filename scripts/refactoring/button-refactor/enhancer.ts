/**
 * Accessibility Enhancer - Add accessibility attributes to buttons
 *
 * Purpose: Generate aria-label for icon buttons, map disabled to aria-disabled
 * Requirements: 4.1-4.7
 */

import type { ButtonInfo, AccessibilityAttributes } from './types';

/**
 * Accessibility Enhancer class
 */
export class AccessibilityEnhancer {
  /**
   * Enhance button with accessibility attributes
   */
  enhance(buttonInfo: ButtonInfo): AccessibilityAttributes {
    const attributes: AccessibilityAttributes = {
      reasoning: '',
    };

    // Check if button already has aria-label
    if (buttonInfo.attributes['aria-label']) {
      attributes.reasoning = 'Button already has aria-label';
      return attributes;
    }

    // Check if button has text content
    const hasTextContent = buttonInfo.children && buttonInfo.children.trim() !== '';

    if (!hasTextContent) {
      // Icon-only button needs aria-label
      const inferredLabel = this.inferAriaLabel(buttonInfo);
      attributes.ariaLabel = inferredLabel;
      attributes.reasoning = 'Icon-only button requires aria-label';
    }

    // Map disabled to aria-disabled
    if (buttonInfo.attributes.disabled === true) {
      attributes.ariaDisabled = true;
      attributes.reasoning += attributes.reasoning
        ? '; disabled attribute mapped to aria-disabled'
        : 'Disabled attribute mapped to aria-disabled';
    }

    return attributes;
  }

  /**
   * Infer aria-label from button context
   */
  private inferAriaLabel(buttonInfo: ButtonInfo): string {
    const onClick = buttonInfo.onClick?.toLowerCase() || '';
    const className = buttonInfo.className?.toLowerCase() || '';
    const buttonType = buttonInfo.attributes?.type;

    // Infer from onClick handler name
    if (onClick.includes('close')) {
      return 'Close';
    }

    if (onClick.includes('delete') || onClick.includes('remove')) {
      return 'Delete';
    }

    if (onClick.includes('save')) {
      return 'Save';
    }

    if (onClick.includes('submit')) {
      return 'Submit';
    }

    if (onClick.includes('cancel')) {
      return 'Cancel';
    }

    if (onClick.includes('confirm')) {
      return 'Confirm';
    }

    if (onClick.includes('edit')) {
      return 'Edit';
    }

    if (onClick.includes('add') || onClick.includes('create')) {
      return 'Add';
    }

    // Infer from className
    if (className.includes('close')) {
      return 'Close';
    }

    if (className.includes('delete')) {
      return 'Delete';
    }

    if (className.includes('save')) {
      return 'Save';
    }

    if (className.includes('cancel')) {
      return 'Cancel';
    }

    if (className.includes('edit')) {
      return 'Edit';
    }

    if (className.includes('modal') && className.includes('close')) {
      return 'Close modal';
    }

    // Infer from button type
    if (buttonType === 'submit') {
      return 'Submit form';
    }

    if (buttonType === 'reset') {
      return 'Reset form';
    }

    // Default fallback
    return 'Button';
  }
}
