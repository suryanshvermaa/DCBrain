'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-renderer text-sm leading-relaxed text-[var(--color-text-primary)] space-y-3 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-[var(--color-text-primary)] mt-6 mb-3 pb-2 border-b border-[var(--color-divider)]">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-[var(--color-text-primary)] mt-5 mb-2.5 pb-1.5 border-b border-[var(--color-divider)]">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-[var(--color-text-primary)] mt-4 mb-2">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mt-3 mb-1.5">{children}</h4>,
          p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--color-link)] hover:text-[var(--color-link-hover)] underline font-medium">
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[var(--color-primary)] bg-[var(--color-surface-raised)] pl-4 py-2 my-3 italic text-[var(--color-text-secondary)] rounded-r-lg">
              {children}
            </blockquote>
          ),
          code: ({ className: codeClassName, children, ...props }: any) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded text-[13px] font-mono text-[var(--color-text-primary)]" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={`${codeClassName || ''} text-[13px] font-mono text-[var(--color-text-primary)] block overflow-x-auto`} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-xl p-4 my-3 overflow-x-auto shadow-sm">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-[var(--color-border)] shadow-sm">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-[var(--color-divider)]">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-[var(--color-surface-hover)] transition-colors">{children}</tr>,
          th: ({ children }) => <th className="p-3 font-semibold text-[var(--color-text-primary)]">{children}</th>,
          td: ({ children }) => <td className="p-3 text-[var(--color-text-secondary)]">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
