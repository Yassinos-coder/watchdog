import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UserRole } from '@/features/auth/types/auth.types';
import type { InvitableRole, TeamMember } from '../types/team.types';

interface MemberRowProps {
  member: TeamMember;
  actorRole: UserRole;
  isSelf: boolean;
  onChangeRole: (role: InvitableRole) => void;
  onRemove: () => void;
}

const RANK: Record<UserRole, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

export function MemberRow({ member, actorRole, isSelf, onChangeRole, onRemove }: MemberRowProps) {
  const manageable = !isSelf && RANK[actorRole] > RANK[member.role];

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {member.name} {isSelf && <span className="text-muted-foreground">(you)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>
      <div className="flex items-center gap-2">
        {!member.mfaEnabled && member.role !== 'MEMBER' && <Badge variant="outline">No 2FA yet</Badge>}
        {manageable ? (
          <>
            <Select value={member.role} onValueChange={(value) => onChangeRole(value as InvitableRole)}>
              <SelectTrigger className="w-28" aria-label={`Role for ${member.name}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                {actorRole === 'OWNER' && <SelectItem value="ADMIN">Admin</SelectItem>}
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" onClick={onRemove} aria-label={`Remove ${member.name}`}>
              <Trash2 className="size-4" />
            </Button>
          </>
        ) : (
          <Badge variant="secondary">{member.role.toLowerCase()}</Badge>
        )}
      </div>
    </li>
  );
}
