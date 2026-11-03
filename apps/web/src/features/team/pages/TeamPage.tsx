import { UserPlus, Users, X } from 'lucide-react';
import { useState } from 'react';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthSession } from '@/features/auth/hooks/useAuthQueries';
import { Format } from '@/lib/format';
import { InviteDialog } from '../components/InviteDialog';
import { MemberRow } from '../components/MemberRow';
import { useChangeRole, useRemoveMember, useRevokeInvite } from '../hooks/useTeamMutations';
import { useInvites, useTeamMembers } from '../hooks/useTeamQueries';

export function TeamPage() {
  const { data: session } = useAuthSession();
  const actor = session?.user;
  const [inviting, setInviting] = useState(false);
  const members = useTeamMembers();
  const invites = useInvites();
  const changeRole = useChangeRole();
  const removeMember = useRemoveMember();
  const revoke = useRevokeInvite();

  if (!actor || actor.role === 'MEMBER') {
    return <ErrorState message="Only admins can manage the team." />;
  }
  if (members.error) {
    return <ErrorState message={members.error.message} onRetry={() => void members.refetch()} />;
  }

  return (
    <>
      <PageHeader
        title="Team"
        description="Who can sign in to this Watchdog instance, and what they can do."
        actions={
          <Button onClick={() => setInviting(true)}>
            <UserPlus className="size-4" /> Invite
          </Button>
        }
      />

      {members.isLoading && <Skeleton className="h-40 w-full" />}

      {members.data && (
        <ul className="overflow-hidden rounded-lg border">
          {members.data.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              actorRole={actor.role}
              isSelf={member.id === actor.id}
              onChangeRole={(role) => changeRole.mutate({ userId: member.id, role })}
              onRemove={() => {
                if (window.confirm(`Remove ${member.name}? They will lose access immediately.`)) {
                  removeMember.mutate(member.id);
                }
              }}
            />
          ))}
        </ul>
      )}

      {invites.data && invites.data.length > 0 && (
        <section className="mt-8 space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <Users className="size-4" /> Pending invites
          </h2>
          <ul className="overflow-hidden rounded-lg border">
            {invites.data.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {invite.role.toLowerCase()} · expires {Format.timeUntil(invite.expiresAt)}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => revoke.mutate(invite.id)}
                  aria-label={`Revoke invite for ${invite.email}`}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <InviteDialog open={inviting} onOpenChange={setInviting} canInviteAdmins={actor.role === 'OWNER'} />
    </>
  );
}
