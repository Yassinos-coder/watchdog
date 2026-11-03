import { KeyRound, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CodeSnippet } from '@/components/CodeSnippet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Format } from '@/lib/format';
import { useRotateUploadToken } from '../hooks/useProjectMutations';
import { useReleases } from '../hooks/useProjectQueries';
import { SnippetBuilder } from '../utils/snippets';
import type { Project } from '../types/project.types';

interface SourceMapsSectionProps {
  project: Project;
}

export function SourceMapsSection({ project }: SourceMapsSectionProps) {
  const { data: releases, isLoading } = useReleases(project.id);
  const rotate = useRotateUploadToken(project.id);
  const [token, setToken] = useState<string | null>(null);
  const command = SnippetBuilder.build('', project.id, window.location.origin).sourceMaps;

  return (
    <section aria-labelledby="maps-heading" className="grid grid-cols-1 gap-4">
      <div>
        <h2 id="maps-heading" className="text-lg font-semibold">
          Source maps
        </h2>
        <p className="text-sm text-muted-foreground">
          Upload source maps from your build so minified stack traces show your original files and the
          code around each failing line.
        </p>
      </div>

      <CodeSnippet code={command} />

      <div className="grid gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Upload token</p>
            <p className="text-sm text-muted-foreground">
              Lets your build upload source maps for this project. Generating a new one revokes the old one.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={rotate.isPending}
            onClick={() => {
              if (!window.confirm('Generate a new upload token? Builds using the old one will fail.')) return;
              rotate.mutate(undefined, {
                onSuccess: (result) => setToken(result.uploadToken),
                onError: (error) => toast.error(error.message),
              });
            }}
          >
            {rotate.isPending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Generate new token
          </Button>
        </div>
        {token && (
          <div className="grid gap-1.5">
            <p className="text-sm text-muted-foreground">Copy it now. It will not be shown again.</p>
            <CodeSnippet code={token} />
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Releases with source maps</h3>
        {isLoading && <Skeleton className="h-16 w-full" />}
        {releases && releases.length === 0 && (
          <p className="text-sm text-muted-foreground">
            None yet. Run the upload command after your next build.
          </p>
        )}
        {releases && releases.length > 0 && (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card text-sm">
            {releases.map((release) => (
              <li key={release.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="truncate font-mono text-xs">{release.version}</span>
                <span className="shrink-0 text-muted-foreground">
                  {release.sourceMapCount} {release.sourceMapCount === 1 ? 'map' : 'maps'}
                  {' · '}
                  {Format.relativeTime(release.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
