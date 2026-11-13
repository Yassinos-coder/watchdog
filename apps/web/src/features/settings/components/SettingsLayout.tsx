import { Database, FolderKanban, KeyRound, MonitorSmartphone, Settings2, ShieldCheck, User, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SettingsLink {
  to: string;
  label: string;
  icon: typeof User;
  end?: boolean;
}

const GROUPS: { title: string; links: SettingsLink[] }[] = [
  {
    title: 'User settings',
    links: [
      { to: '/settings/profile', label: 'Profile', icon: User },
      { to: '/settings/security', label: 'Security', icon: ShieldCheck },
      { to: '/settings/sessions', label: 'Sessions', icon: MonitorSmartphone },
    ],
  },
  {
    title: 'Account settings',
    links: [
      { to: '/settings/account', label: 'General', icon: Settings2, end: true },
      { to: '/settings/account/projects', label: 'Projects', icon: FolderKanban },
      { to: '/settings/account/team', label: 'Team', icon: Users },
      { to: '/settings/account/data', label: 'Data and retention', icon: Database },
      { to: '/integrations/mcp', label: 'API keys', icon: KeyRound },
    ],
  },
];

export function SettingsLayout() {
  return (
    <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label="Settings" className="lg:sticky lg:top-8 lg:self-start">
        <div className="flex gap-6 overflow-x-auto pb-2 lg:grid lg:gap-6 lg:overflow-visible lg:pb-0">
          {GROUPS.map((group) => (
            <div key={group.title} className="shrink-0 lg:shrink">
              <p className="mb-1.5 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.title}
              </p>
              <ul className="flex gap-0.5 lg:grid">
                {group.links.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                          isActive && 'bg-accent text-foreground',
                        )
                      }
                    >
                      <Icon className="size-4 shrink-0" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
