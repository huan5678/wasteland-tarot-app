import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

/**
 * Markdown Renderer Props
 * Markdown 渲染元件屬性
 */
export interface MarkdownRendererProps {
  /** Markdown content to render (要渲染的 Markdown 內容) */
  content: string;

  /** Optional className for container (容器的可選類名) */
  className?: string;
}

/**
 * Custom Markdown Components with Terminal Styling
 * 自訂 Markdown 元件，套用終端機風格
 */
const markdownComponents: Components = {
  // Heading Level 1
  h1: ({ children }) => (
    <h1 className="mb-6 mt-8 border-b-2 border-green-800 pb-2 text-3xl font-bold text-green-400">
      <span className="text-green-700" aria-hidden="true">
        &gt;&gt;{' '}
      </span>
      {children}
    </h1>
  ),

  // Heading Level 2
  h2: ({ children, id }) => (
    <h2
      id={id}
      className="mb-4 mt-8 border-l-4 border-green-700 pl-3 text-2xl font-bold text-green-400"
    >
      <span className="text-green-700" aria-hidden="true">
        ##{' '}
      </span>
      {children}
    </h2>
  ),

  // Heading Level 3
  h3: ({ children, id }) => (
    <h3
      id={id}
      className="mb-3 mt-6 text-xl font-semibold text-green-500"
    >
      <span className="text-green-700" aria-hidden="true">
        ###{' '}
      </span>
      {children}
    </h3>
  ),

  // Heading Level 4
  h4: ({ children, id }) => (
    <h4
      id={id}
      className="mb-2 mt-4 text-lg font-semibold text-green-600"
    >
      <span className="text-green-800" aria-hidden="true">
        ####{'  '}
      </span>
      {children}
    </h4>
  ),

  // Paragraph
  p: ({ children }) => (
    <p className="mb-4 leading-relaxed text-green-500">
      {children}
    </p>
  ),

  // Unordered List
  ul: ({ children }) => (
    <ul className="mb-4 ml-6 space-y-2 list-none">
      {children}
    </ul>
  ),

  // Ordered List
  ol: ({ children }) => (
    <ol className="mb-4 ml-6 space-y-2 list-none counter-reset-[item]">
      {children}
    </ol>
  ),

  // List Item
  li: ({ children, ordered }) => {
    if (ordered) {
      return (
        <li className="relative pl-6 text-green-500 before:absolute before:left-0 before:text-green-700 before:content-[counter(item)_'._'] before:counter-increment-[item]">
          {children}
        </li>
      );
    }
    return (
      <li className="relative pl-6 text-green-500 before:absolute before:left-0 before:text-green-700 before:content-['►_']">
        {children}
      </li>
    );
  },

  // Link
  a: ({ href, children }) => {
    // External link detection
    const isExternal = href?.startsWith('http') || href?.startsWith('//');

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-400 underline decoration-dotted hover:text-green-300 transition-colors"
        >
          {children}
          <span className="ml-1 text-xs" aria-label="開啟新視窗">
            ↗
          </span>
        </a>
      );
    }

    // Internal link
    return (
      <Link
        href={href || '#'}
        className="text-green-400 underline decoration-dotted hover:text-green-300 transition-colors"
      >
        {children}
      </Link>
    );
  },

  // Blockquote (Fallout-style annotation)
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-4 border-green-600 bg-green-950/30 p-4 italic">
      <div className="mb-2 flex items-center text-xs text-green-600">
        <span className="mr-2 text-yellow-600" aria-hidden="true">
          ☢
        </span>
        <span className="font-bold">WASTELAND NOTE</span>
      </div>
      <div className="text-green-400">{children}</div>
    </blockquote>
  ),

  // Horizontal Rule
  hr: () => (
    <div className="my-8 text-center text-green-700" aria-hidden="true">
      ═══════════════════════════════════
    </div>
  ),

  // Inline Code
  code: ({ children, className }) => {
    // Check if it's a code block (has language class)
    const isCodeBlock = className?.startsWith('language-');

    if (isCodeBlock) {
      // Code block - preserve formatting
      return (
        <code className="block overflow-x-auto rounded bg-green-950/50 p-4 text-sm text-green-400 border border-green-900">
          {children}
        </code>
      );
    }

    // Inline code
    return (
      <code className="rounded bg-green-950/50 px-2 py-1 text-sm text-green-400 border border-green-900">
        {children}
      </code>
    );
  },

  // Pre (code block container)
  pre: ({ children }) => (
    <pre className="mb-4 overflow-x-auto rounded border-2 border-green-800 bg-black/80 p-4">
      {children}
    </pre>
  ),

  // Strong (bold)
  strong: ({ children }) => (
    <strong className="font-bold text-green-400">
      {children}
    </strong>
  ),

  // Emphasis (italic)
  em: ({ children }) => (
    <em className="italic text-green-400">
      {children}
    </em>
  ),

  // Table (GitHub Flavored Markdown)
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-2 border-green-800 text-left">
        {children}
      </table>
    </div>
  ),

  // Table Head
  thead: ({ children }) => (
    <thead className="border-b-2 border-green-700 bg-green-950/50">
      {children}
    </thead>
  ),

  // Table Body
  tbody: ({ children }) => (
    <tbody className="divide-y divide-green-900">
      {children}
    </tbody>
  ),

  // Table Row
  tr: ({ children }) => (
    <tr className="hover:bg-green-950/30 transition-colors">
      {children}
    </tr>
  ),

  // Table Header Cell
  th: ({ children }) => (
    <th className="px-4 py-2 font-bold text-green-400">
      {children}
    </th>
  ),

  // Table Data Cell
  td: ({ children }) => (
    <td className="px-4 py-2 text-green-500">
      {children}
    </td>
  ),
};

/**
 * Markdown Renderer Component
 * Markdown 渲染元件
 *
 * @description
 * Renders Markdown content with custom terminal-style components:
 * - Headings with ASCII decorations
 * - Green-themed lists with custom bullets
 * - External links with security attributes
 * - Fallout-style blockquotes with radiation symbols
 * - Terminal-style horizontal rules
 * - GitHub Flavored Markdown support (tables, etc.)
 * - Built-in XSS protection via react-markdown
 *
 * @example
 * ```tsx
 * <MarkdownRenderer
 *   content="# Hello\n\nThis is **bold** text."
 *   className="my-custom-class"
 * />
 * ```
 *
 * @component
 * @since 1.0.0
 */
export default function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
