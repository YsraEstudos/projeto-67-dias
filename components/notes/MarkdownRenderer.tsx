import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    className?: string;
    compact?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({
    content,
    className = '',
    compact = false
}) => {
    const components = useMemo(() => ({
        h1: ({ children }: any) => (
            <h1 className="text-2xl font-bold text-white mb-3 mt-4 first:mt-0 border-b border-slate-700 pb-2">
                {children}
            </h1>
        ),
        h2: ({ children }: any) => (
            <h2 className="text-xl font-bold text-white mb-2 mt-4 first:mt-0">
                {children}
            </h2>
        ),
        h3: ({ children }: any) => (
            <h3 className="text-lg font-semibold text-white mb-2 mt-3 first:mt-0">
                {children}
            </h3>
        ),
        h4: ({ children }: any) => (
            <h4 className="text-base font-semibold text-slate-200 mb-2 mt-2">
                {children}
            </h4>
        ),
        p: ({ children }: any) => (
            <p className="text-slate-300 leading-relaxed mb-3 last:mb-0">
                {children}
            </p>
        ),
        a: ({ href, children }: any) => (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
            >
                {children}
            </a>
        ),
        ul: ({ children }: any) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-slate-300 ml-2">
                {children}
            </ul>
        ),
        ol: ({ children }: any) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-slate-300 ml-2">
                {children}
            </ol>
        ),
        li: ({ children }: any) => (
            <li className="text-slate-300 leading-relaxed">
                {children}
            </li>
        ),
        code: ({ className: codeClassName, children, ...props }: any) => {
            const isInline = !codeClassName;
            if (isInline) {
                return (
                    <code className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                    </code>
                );
            }
            return (
                <code className={`${codeClassName} block`} {...props}>
                    {children}
                </code>
            );
        },
        pre: ({ children }: any) => (
            <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-3 overflow-x-auto text-sm font-mono text-slate-300">
                {children}
            </pre>
        ),
        blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-purple-500 pl-4 py-1 my-3 bg-purple-500/5 rounded-r-lg italic text-slate-400">
                {children}
            </blockquote>
        ),
        hr: () => (
            <hr className="border-slate-700 my-4" />
        ),
        strong: ({ children }: any) => (
            <strong className="font-bold text-white">{children}</strong>
        ),
        em: ({ children }: any) => (
            <em className="italic text-slate-200">{children}</em>
        ),
        del: ({ children }: any) => (
            <del className="line-through text-slate-500">{children}</del>
        ),
        table: ({ children }: any) => (
            <div className="overflow-x-auto mb-3">
                <table className="min-w-full border border-slate-700 rounded-lg overflow-hidden">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }: any) => (
            <thead className="bg-slate-800">{children}</thead>
        ),
        tbody: ({ children }: any) => (
            <tbody className="bg-slate-900">{children}</tbody>
        ),
        tr: ({ children }: any) => (
            <tr className="border-b border-slate-700 last:border-0">{children}</tr>
        ),
        th: ({ children }: any) => (
            <th className="px-4 py-2 text-left text-sm font-semibold text-slate-200">
                {children}
            </th>
        ),
        td: ({ children }: any) => (
            <td className="px-4 py-2 text-sm text-slate-300">
                {children}
            </td>
        ),
        input: ({ type, checked, ...props }: any) => {
            if (type === 'checkbox') {
                return (
                    <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                        className="mr-2 accent-purple-500"
                        {...props}
                    />
                );
            }
            return <input type={type} {...props} />;
        },
        img: ({ src, alt }: any) => (
            <img
                src={src}
                alt={alt || ''}
                className="max-w-full rounded-lg my-3 border border-slate-700"
            />
        ),
    }), []);

    return (
        <div className={`markdown-content ${compact ? 'markdown-compact' : ''} ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
