import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CopyButton } from '@/components/CopyButton';
import { FieldRow } from '@/components/FieldRow';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateInvite } from '../hooks/useTeamMutations';
import type { CreatedInvite, InvitableRole } from '../types/team.types';

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canInviteAdmins: boolean;
}

export function InviteDialog({ open, onOpenChange, canInviteAdmins }: InviteDialogProps) {
  const create = useCreateInvite();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitableRole>('MEMBER');
  const [created, setCreated] = useState<CreatedInvite | null>(null);

  const close = (next: boolean): void => {
    onOpenChange(next);
    if (!next) {
      setEmail('');
      setRole('MEMBER');
      setCreated(null);
    }
  };

  const submit = (): void => {
    create.mutate(
      { email: email.trim(), role },
      {
        onSuccess: (result) => {
          setCreated(result);
          toast.success(result.emailSent ? 'Invite emailed' : 'Invite created, share the link');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a teammate</DialogTitle>
          <DialogDescription>They get a link valid for 7 days to set a password.</DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              {created.emailSent
                ? `We emailed ${created.invite.email}. You can also share this link:`
                : 'Email is not configured, so share this link yourself:'}
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={created.link} onFocus={(event) => event.target.select()} />
              <CopyButton value={created.link} />
            </div>
            <DialogFooter>
              <Button onClick={() => close(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="grid gap-4">
            <FieldRow label="Email" htmlFor="invite-email">
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="off"
              />
            </FieldRow>
            <FieldRow
              label="Role"
              htmlFor="invite-role"
              hint="Admins manage alerts, projects and the team. Members can view and triage."
            >
              <Select value={role} onValueChange={(value) => setRole(value as InvitableRole)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  {canInviteAdmins && <SelectItem value="ADMIN">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </FieldRow>
            <DialogFooter>
              <Button disabled={!email.trim() || create.isPending} onClick={submit}>
                {create.isPending && <Loader2 className="size-4 animate-spin" />}
                Send invite
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
