import { Outlet, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/integrations', label: 'Channels', end: true },
  { to: '/integrations/mcp', label: 'MCP', end: false },
  { to: '/integrations/webhooks', label: 'Webhooks', end: false },
];

export function IntegrationsLayout() {
  return (
    <>
      <nav aria-label="Integrations" className="mb-6 flex gap-1 overflow-x-auto border-b">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                isActive ? 'border-lantern text-foreground' : 'border-transparent',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  );
}
