import { getStaticPageContent } from '../contentParser';
import fs from 'fs';
import path from 'path';

describe('contentParser - Integration Tests', () => {
  const testDataDir = path.join(process.cwd(), 'src/data/static-pages/__test__');

  beforeAll(() => {
    // Create test data directory
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }

    // Create test files
    fs.writeFileSync(
      path.join(testDataDir, 'test.md'),
      `---
title: "Test Page"
lang: "zh-TW"
lastUpdated: "2025-10-08"
---

# Test Content

This is a test page.`
    );

    fs.writeFileSync(
      path.join(testDataDir, 'simple.md'),
      '# Simple Content\n\nNo frontmatter here.'
    );

    fs.writeFileSync(
      path.join(testDataDir, 'complex.md'),
      `---
title: "Complex Page"
lang: "zh-TW"
team:
  - name: "Test Member"
    role: "Developer"
  - name: "Another Member"
    role: "Designer"
---

# Complex Content`
    );

    fs.writeFileSync(
      path.join(testDataDir, 'invalid.md'),
      `---
description: "Missing required fields"
---

# Content`
    );
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe('getStaticPageContent', () => {
    it('should parse Markdown file with valid frontmatter', () => {
      const result = getStaticPageContent('__test__/test');

      expect(result).toEqual({
        metadata: {
          title: 'Test Page',
          lang: 'zh-TW',
          lastUpdated: '2025-10-08',
        },
        content: '\n# Test Content\n\nThis is a test page.',
      });
    });

    it('should throw error if file does not exist', () => {
      expect(() => getStaticPageContent('nonexistent')).toThrow('Static page file not found');
    });

    it('should handle Markdown without frontmatter', () => {
      const result = getStaticPageContent('__test__/simple');

      expect(result).toEqual({
        metadata: {},
        content: '# Simple Content\n\nNo frontmatter here.',
      });
    });

    it('should parse complex frontmatter with nested data', () => {
      const result = getStaticPageContent('__test__/complex');

      expect(result.metadata).toHaveProperty('title', 'Complex Page');
      expect(result.metadata).toHaveProperty('lang', 'zh-TW');
      expect(result.metadata.team).toHaveLength(2);
      expect(result.metadata.team[0]).toEqual({
        name: 'Test Member',
        role: 'Developer',
      });
    });

    it('should validate required frontmatter fields (title and lang)', () => {
      expect(() => getStaticPageContent('__test__/invalid')).toThrow(
        'Missing required frontmatter fields'
      );
    });
  });
});
