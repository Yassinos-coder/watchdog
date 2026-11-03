import { BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { useDocsLink } from '@/hooks/useDocsLink';

interface DocsLinkProps {
  path: string;
  children: ReactNode;
}

export function DocsLink({ path, children }: DocsLinkProps) {
  const href = useDocsLink(path);
  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 hover:text-foreground"
    >
      <BookOpen className="size-4" />
      {children}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
