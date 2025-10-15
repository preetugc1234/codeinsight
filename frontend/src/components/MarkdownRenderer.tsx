'use client';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Remove **text** patterns and convert to clean markdown
  const cleanContent = content
    // Remove bold markers but keep content
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Clean up any remaining markdown artifacts that look weird
    .replace(/\*([^*]+)\*/g, '$1');

  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-white mb-4 mt-6 tracking-tight border-b border-[#27273a] pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-white mb-3 mt-5 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-white mb-2 mt-4 tracking-tight">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium text-white mb-2 mt-3 tracking-tight">
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-[#a1a1aa] leading-relaxed mb-4">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-none space-y-2 mb-4 ml-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 mb-4 ml-4 text-[#a1a1aa]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[#a1a1aa] flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),

          // Code blocks
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="px-2 py-0.5 bg-[#1a1a24] text-purple-300 rounded text-sm font-mono border border-[#27273a]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-4">
                <div className="bg-[#1a1a24] border border-[#27273a] rounded-xl overflow-hidden">
                  <div className="bg-[#13131a] px-4 py-2 border-b border-[#27273a] flex items-center justify-between">
                    <span className="text-xs text-[#71717a] font-medium uppercase tracking-wide">
                      {className?.replace('language-', '') || 'code'}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(String(children));
                      }}
                      className="text-xs text-[#a1a1aa] hover:text-purple-400 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              </div>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 bg-purple-500/5 pl-4 py-2 my-4 italic text-[#a1a1aa]">
              {children}
            </blockquote>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline transition-colors"
            >
              {children}
            </a>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="border-t border-[#27273a] my-6" />
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse border border-[#27273a] rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#1a1a24]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-[#27273a] px-4 py-2 text-left text-white font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[#27273a] px-4 py-2 text-[#a1a1aa]">
              {children}
            </td>
          ),

          // Strong/Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),

          // Emphasis/Italic
          em: ({ children }) => (
            <em className="italic text-purple-300">
              {children}
            </em>
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}
