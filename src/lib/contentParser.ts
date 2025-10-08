import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * Metadata extracted from Markdown frontmatter
 */
export interface StaticPageMetadata {
  title: string;
  lastUpdated?: string;
  effectiveDate?: string;
  version?: string;
  lang: string;
  [key: string]: any; // Support additional frontmatter fields
}

/**
 * Complete static page content with metadata and Markdown body
 */
export interface StaticPageContent {
  metadata: StaticPageMetadata;
  content: string; // Markdown raw content
}

/**
 * Parse a Markdown file and extract frontmatter metadata and content
 *
 * @param slug - The file slug (without .md extension)
 * @returns Parsed content with metadata and Markdown body
 * @throws Error if file doesn't exist or required fields are missing
 *
 * @example
 * ```typescript
 * const content = getStaticPageContent('about');
 * console.log(content.metadata.title); // "關於我們"
 * console.log(content.content); // "# 關於我們\n\n..."
 * ```
 */
export function getStaticPageContent(slug: string): StaticPageContent {
  try {
    const filePath = path.join(process.cwd(), 'src/data/static-pages', `${slug}.md`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    // Validate required frontmatter fields if frontmatter exists
    if (data && Object.keys(data).length > 0) {
      // If frontmatter exists, both title and lang must be present
      if (!data.title || !data.lang) {
        throw new Error(
          'Missing required frontmatter fields: title and lang are required when frontmatter is present'
        );
      }
    }

    return {
      metadata: data as StaticPageMetadata,
      content,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
        throw new Error(`Static page file not found: ${slug}.md`);
      }
      throw error;
    }
    throw new Error(`Failed to parse static page: ${slug}`);
  }
}
