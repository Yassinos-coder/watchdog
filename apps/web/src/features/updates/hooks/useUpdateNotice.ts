import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthSession } from '@/features/auth/hooks/useAuthQueries';
import { UpdateUtils } from '../utils/update.utils';
import { useUpdateStatus } from './useUpdateQueries';

const TOAST_ID = 'watchdog-update';

export function useUpdateNotice(): void {
  const { data: session } = useAuthSession();
  const role = session?.user?.role;
  const canSee = role === 'OWNER' || role === 'ADMIN';
  const { data: status } = useUpdateStatus(canSee);

  useEffect(() => {
    if (!status?.updateAvailable || !status.latestVersion) return;
    const latest = status.latestVersion;
    if (UpdateUtils.isDismissed(latest)) return;

    toast.info(`Watchdog ${latest} is available`, {
      id: TOAST_ID,
      description: `You are on ${status.currentVersion}. Update the server and your SDK packages to get the latest fixes and features.`,
      duration: Infinity,
      closeButton: true,
      action: {
        label: "What's new",
        onClick: () => window.open(status.changelogUrl, '_blank', 'noopener,noreferrer'),
      },
      onDismiss: () => UpdateUtils.dismiss(latest),
    });
  }, [status]);
}
