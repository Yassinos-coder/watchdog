import type { ReactNode } from 'react';
import type { IssueEvent } from '../types/issue.types';

interface EventDetailsProps {
  event: IssueEvent;
}

export function EventDetails({ event }: EventDetailsProps) {
  const { payload } = event;
  const tags = { ...payload.tags, ...(event.environment ? { environment: event.environment } : {}), ...(event.release ? { release: event.release } : {}) };
  const sections: { title: string; content: ReactNode }[] = [];

  if (Object.keys(tags).length > 0) {
    sections.push({ title: 'Tags', content: <PairList pairs={tags} /> });
  }
  if (payload.user && Object.keys(payload.user).length > 0) {
    sections.push({ title: 'User', content: <PairList pairs={payload.user} /> });
  }
  if (payload.request) {
    const { url, method, headers } = payload.request;
    sections.push({ title: 'Request', content: <PairList pairs={{ ...(method ? { method } : {}), ...(url ? { url } : {}), ...headers }} /> });
  }
  for (const [name, value] of Object.entries(payload.contexts ?? {})) {
    if (value && typeof value === 'object') {
      sections.push({ title: name.charAt(0).toUpperCase() + name.slice(1), content: <PairList pairs={value as Record<string, unknown>} /> });
    }
  }
  if (payload.extra && Object.keys(payload.extra).length > 0) {
    sections.push({ title: 'Additional data', content: <PairList pairs={payload.extra} /> });
  }
  if (payload.sdk) {
    sections.push({ title: 'SDK', content: <PairList pairs={{ name: payload.sdk.name, version: payload.sdk.version }} /> });
  }

  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">No extra details were sent with this event.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {sections.map((section) => (
        <section key={section.title} aria-label={section.title}>
          <h3 className="mb-2 font-sans text-sm font-semibold tracking-normal">{section.title}</h3>
          {section.content}
        </section>
      ))}
    </div>
  );
}

function PairList({ pairs }: { pairs: Record<string, unknown> }) {
  return (
    <dl className="divide-y overflow-hidden rounded-lg border text-sm">
      {Object.entries(pairs).map(([key, value]) => (
        <div key={key} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-3 py-2">
          <dt className="truncate text-muted-foreground" title={key}>
            {key}
          </dt>
          <dd className="break-words font-mono text-xs leading-5">
            {typeof value === 'string' ? value : JSON.stringify(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
