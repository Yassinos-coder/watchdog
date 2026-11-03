import { CircleAlert, CircleCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Format } from '@/lib/format';
import { useDeliveries } from '../hooks/useAlertQueries';

export function DeliveriesSection() {
  const { data: deliveries, isLoading } = useDeliveries();

  return (
    <section aria-labelledby="deliveries-heading" className="grid grid-cols-1 gap-4">
      <div>
        <h2 id="deliveries-heading" className="text-lg font-semibold">
          Recent deliveries
        </h2>
        <p className="text-sm text-muted-foreground">
          Every alert Watchdog tried to send. If one did not arrive, the reason is here.
        </p>
      </div>
      {isLoading && <Skeleton className="h-24 w-full" />}
      {deliveries && deliveries.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nothing has been sent yet.
        </p>
      )}
      {deliveries && deliveries.length > 0 && (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card text-sm">
          {deliveries.map((delivery) => (
            <li key={delivery.id} className="flex items-start gap-3 px-4 py-3">
              {delivery.status === 'SENT' ? (
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-moss" aria-label="Sent" />
              ) : (
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-signal" aria-label="Failed" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  <span className="font-medium">{delivery.ruleName ?? 'Deleted rule'}</span>
                  <span className="text-muted-foreground"> to {delivery.channelName ?? 'a deleted channel'}</span>
                </p>
                {delivery.error && <p className="break-words text-xs text-signal">{delivery.error}</p>}
              </div>
              <time className="shrink-0 text-xs text-muted-foreground" dateTime={delivery.createdAt} title={Format.dateTime(delivery.createdAt)}>
                {Format.relativeTime(delivery.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
