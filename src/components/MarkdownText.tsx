import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/cn'

type MarkdownTextProps = {
  content: string
  className?: string
}

export function MarkdownText({ content, className }: MarkdownTextProps) {
  return (
    <div className={cn('space-y-2 text-sm leading-relaxed text-muted', className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h3 className="text-base font-bold text-fg">{children}</h3>,
          h2: ({ children }) => <h3 className="text-sm font-bold text-fg">{children}</h3>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-fg">{children}</h3>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
          em: ({ children }) => <em className="italic text-muted">{children}</em>,
          code: ({ children }) => (
            <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.9em] text-fg">
              {children}
            </code>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-solo-300 underline underline-offset-2"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
