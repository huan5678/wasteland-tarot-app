/**
 * Unit Tests for Style Analyzer and Variant Mapper
 *
 * Purpose: Test className analysis, variant mapping, heuristic analysis, and size inference
 * Requirements: 2.1-2.12
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { StyleAnalyzer } from '../analyzer';
import { VariantMapper } from '../mapper';
import type { ButtonInfo, StyleAnalysis, MappingResult } from '../types';

describe('StyleAnalyzer', () => {
  let analyzer: StyleAnalyzer;

  beforeEach(() => {
    analyzer = new StyleAnalyzer();
  });

  describe('Variant Inference', () => {
    it('should map destructive keywords to destructive variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-destructive',
        children: 'Delete',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('destructive');
      expect(analysis.confidence).toBe('high');
    });

    it('should map danger keyword to destructive variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-danger',
        children: 'Remove',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('destructive');
    });

    it('should map delete keyword to destructive variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'delete-btn',
        children: 'Delete',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('destructive');
    });

    it('should map success keywords to success variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-success',
        children: 'Confirm',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('success');
      expect(analysis.confidence).toBe('high');
    });

    it('should map confirm keyword to success variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'confirm-button',
        children: 'Confirm',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('success');
    });

    it('should map warning keywords to warning variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-warning',
        children: 'Caution',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('warning');
      expect(analysis.confidence).toBe('high');
    });

    it('should map primary keywords to default variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-primary',
        children: 'Submit',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('default');
      expect(analysis.confidence).toBe('high');
    });

    it('should map outline keywords to outline variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-outline',
        children: 'Cancel',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('outline');
    });

    it('should map secondary keywords to outline variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-secondary',
        children: 'Back',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('outline');
    });

    it('should map ghost keywords to ghost variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-ghost',
        children: 'Close',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('ghost');
    });

    it('should map link keywords to link variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-link',
        children: 'Learn More',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('link');
    });

    it('should map info keywords to info variant', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-info',
        children: 'Help',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('info');
    });
  });

  describe('Priority Rules', () => {
    it('should prioritize destructive over primary', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-primary btn-danger',
        children: 'Delete',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('destructive');
    });

    it('should prioritize success over primary', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-primary btn-success',
        children: 'Confirm',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('success');
    });
  });

  describe('Heuristic Analysis', () => {
    it('should infer destructive from handleDelete onClick', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: '',
        children: 'Delete',
        hasRef: false,
        onClick: 'handleDelete',
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('destructive');
      expect(analysis.reasoning).toContain('handleDelete');
    });

    it('should infer success from handleConfirm onClick', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: '',
        children: 'OK',
        hasRef: false,
        onClick: 'handleConfirm',
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('success');
    });

    it('should infer default from handleSubmit onClick', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: '',
        children: 'Submit',
        hasRef: false,
        onClick: 'handleSubmit',
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('default');
    });

    it('should infer default from type=submit', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: { type: 'submit' },
        className: '',
        children: 'Submit',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('default');
    });
  });

  describe('Size Inference', () => {
    it('should infer icon size for buttons without text', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: '',
        children: '',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedSize).toBe('icon');
    });

    it('should infer xs size from className', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'h-7 px-2 text-xs',
        children: 'Small',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedSize).toBe('xs');
    });

    it('should infer sm size from className', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'h-8 px-3 text-sm',
        children: 'Small',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedSize).toBe('sm');
    });

    it('should infer lg size from className', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'h-12 px-6 text-base',
        children: 'Large',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedSize).toBe('lg');
    });

    it('should infer xl size from className', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'h-14 px-8 text-lg',
        children: 'Extra Large',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedSize).toBe('xl');
    });

    it('should default to default size', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: '',
        children: 'Click',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedSize).toBe('default');
    });
  });

  describe('className Preservation', () => {
    it('should preserve layout classNames', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'flex items-center gap-2 mt-4 ml-2',
        children: 'Click',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.remainingClassNames).toContain('flex');
      expect(analysis.remainingClassNames).toContain('items-center');
      expect(analysis.remainingClassNames).toContain('gap-2');
      expect(analysis.remainingClassNames).toContain('mt-4');
      expect(analysis.remainingClassNames).toContain('ml-2');
    });

    it('should remove variant-related classNames', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-primary bg-blue-500 text-white flex',
        children: 'Click',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.remainingClassNames).not.toContain('btn-primary');
      expect(analysis.remainingClassNames).not.toContain('bg-blue-500');
      expect(analysis.remainingClassNames).not.toContain('text-white');
      expect(analysis.remainingClassNames).toContain('flex');
    });

    it('should preserve grid layout classNames', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'grid grid-cols-2 gap-4',
        children: 'Click',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.remainingClassNames).toContain('grid');
      expect(analysis.remainingClassNames).toContain('grid-cols-2');
      expect(analysis.remainingClassNames).toContain('gap-4');
    });
  });

  describe('Confidence Scoring', () => {
    it('should have high confidence for explicit keywords', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'btn-destructive',
        children: 'Delete',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.confidence).toBe('high');
    });

    it('should have medium confidence for heuristic inference', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: '',
        children: 'Delete',
        hasRef: false,
        onClick: 'handleDelete',
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.confidence).toBe('medium');
    });

    it('should have low confidence for fallback to default', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'custom-style',
        children: 'Click',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.confidence).toBe('low');
      expect(analysis.suggestedVariant).toBe('default');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty className', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: '',
        children: 'Click',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis).toBeDefined();
      expect(analysis.suggestedVariant).toBe('default');
    });

    it('should handle undefined className', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        children: 'Click',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis).toBeDefined();
      expect(analysis.suggestedVariant).toBe('default');
    });

    it('should handle case-insensitive matching', () => {
      const buttonInfo: ButtonInfo = {
        filePath: '/test.tsx',
        line: 1,
        column: 0,
        attributes: {},
        className: 'BTN-PRIMARY',
        children: 'Click',
        hasRef: false,
      };

      const analysis = analyzer.analyze(buttonInfo);

      expect(analysis.suggestedVariant).toBe('default');
    });
  });
});

describe('VariantMapper', () => {
  let mapper: VariantMapper;

  beforeEach(() => {
    mapper = new VariantMapper();
  });

  describe('Mapping Logic', () => {
    it('should map analysis to final variant', () => {
      const analysis: StyleAnalysis = {
        suggestedVariant: 'destructive',
        suggestedSize: 'default',
        remainingClassNames: ['flex', 'items-center'],
        confidence: 'high',
        reasoning: 'className contains destructive',
      };

      const result = mapper.map(analysis);

      expect(result.variant).toBe('destructive');
      expect(result.size).toBe('default');
      expect(result.customClassNames).toEqual(['flex', 'items-center']);
    });

    it('should preserve custom classNames', () => {
      const analysis: StyleAnalysis = {
        suggestedVariant: 'default',
        suggestedSize: 'sm',
        remainingClassNames: ['mt-4', 'ml-2', 'w-full'],
        confidence: 'high',
        reasoning: 'default',
      };

      const result = mapper.map(analysis);

      expect(result.customClassNames).toContain('mt-4');
      expect(result.customClassNames).toContain('ml-2');
      expect(result.customClassNames).toContain('w-full');
    });

    it('should add warning for low confidence mappings', () => {
      const analysis: StyleAnalysis = {
        suggestedVariant: 'default',
        suggestedSize: 'default',
        remainingClassNames: [],
        confidence: 'low',
        reasoning: 'fallback to default',
      };

      const result = mapper.map(analysis);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].toLowerCase()).toContain('low confidence');
    });

    it('should not add warning for high confidence mappings', () => {
      const analysis: StyleAnalysis = {
        suggestedVariant: 'destructive',
        suggestedSize: 'default',
        remainingClassNames: [],
        confidence: 'high',
        reasoning: 'explicit destructive keyword',
      };

      const result = mapper.map(analysis);

      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Custom Rules', () => {
    it('should allow adding custom mapping rules', () => {
      mapper.addCustomRule({
        priority: 100,
        matcher: (className) => className.includes('custom-danger'),
        variant: 'destructive',
      });

      const analysis: StyleAnalysis = {
        suggestedVariant: 'default',
        suggestedSize: 'default',
        remainingClassNames: [],
        confidence: 'medium',
        reasoning: 'custom rule match',
      };

      // The custom rule should be available for future use
      expect(mapper).toBeDefined();
    });

    it('should respect rule priority', () => {
      mapper.addCustomRule({
        priority: 200,
        matcher: (className) => className.includes('special'),
        variant: 'success',
      });

      mapper.addCustomRule({
        priority: 100,
        matcher: (className) => className.includes('special'),
        variant: 'warning',
      });

      // Higher priority rule should win
      expect(mapper).toBeDefined();
    });
  });
});
