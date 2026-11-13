import {
  BellRing,
  Bug,
  ChartLine,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Settings2,
  UserCog,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLogout } from '@/features/auth/hooks/useAuthMutations';
import { useAuthSession } from '@/features/auth/hooks/useAuthQueries';
import { useDashboardPrefetch } from '@/features/performance/hooks/useDashboardPrefetch';
import { DashboardCache } from '@/features/performance/utils/dashboardCache';
import { useUpdateNotice } from '@/features/updates/hooks/useUpdateNotice';
import { useProjects } from '@/features/projects/hooks/useProjectQueries';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebarStore';

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggle = useSidebarStore((state) => state.toggle);
  useUpdateNotice();
  useDashboardPrefetch();

  return (
    <div
      className={cn(
        'min-h-dvh lg:grid lg:transition-[grid-template-columns] lg:duration-200',
        collapsed ? 'lg:grid-cols-[4.5rem_minmax(0,1fr)]' : 'lg:grid-cols-[17rem_minmax(0,1fr)]',
      )}
    >
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-hidden border-r bg-card/50 lg:flex">
        <SidebarContent collapsed={collapsed} onToggle={toggle} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <Link to="/" aria-label="Watchdog home">
            <Logo />
          </Link>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-72 flex-col p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Navigate Watchdog</SheetDescription>
              </SheetHeader>
              <SidebarContent collapsed={false} onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  onNavigate?: () => void;
  onToggle?: () => void;
}

function SidebarContent({ collapsed, onNavigate, onToggle }: SidebarContentProps) {
  const navigate = useNavigate();
  const projectMatch = useMatch('/projects/:projectId/*');
  const projectId = projectMatch?.params.projectId;
  const { data: projects } = useProjects();
  const { data: session } = useAuthSession();
  const logout = useLogout();

  const projectLinks = projectId
    ? [
        { to: `/projects/${projectId}`, label: 'Overview', icon: LayoutDashboard, end: true },
        { to: `/projects/${projectId}/issues`, label: 'Issues', icon: Bug, end: false },
        { to: `/projects/${projectId}/performance`, label: 'Performance', icon: Gauge, end: false },
        { to: `/projects/${projectId}/dashboards`, label: 'Dashboards', icon: ChartLine, end: false },
        { to: `/projects/${projectId}/replays`, label: 'Replays', icon: Video, end: false },
        { to: `/projects/${projectId}/alerts`, label: 'Alerts', icon: BellRing, end: false },
        { to: `/projects/${projectId}/settings`, label: 'Project settings', icon: Settings2, end: false },
      ]
    : [];

  const signOut = (): void =>
    logout.mutate(undefined, {
      onSettled: () => {
        DashboardCache.clear();
        navigate('/login', { replace: true });
      },
    });

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex pb-3 pt-5',
          collapsed ? 'flex-col items-center gap-3 px-2' : 'items-center justify-between px-5',
        )}
      >
        <Link to="/" onClick={onNavigate} aria-label="Watchdog home" className="shrink-0">
          <Logo showWordmark={!collapsed} />
        </Link>
        {onToggle && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-expanded={!collapsed}
                onClick={onToggle}
              >
                {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {!collapsed && projects && projects.length > 0 && (
        <div className="px-3 pb-2">
          <Select
            value={projectId ?? ''}
            onValueChange={(value) => {
              navigate(`/projects/${value}`);
              onNavigate?.();
            }}
          >
            <SelectTrigger className="w-full" aria-label="Switch project">
              <SelectValue placeholder="Choose a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <nav aria-label="Main" className={cn('flex-1 overflow-y-auto py-2', collapsed ? 'px-2' : 'px-3')}>
        <ul className="grid gap-0.5">
          {projectLinks.map((link) => (
            <NavItem key={link.to} {...link} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
          {projectLinks.length > 0 && <li role="separator" className="my-2 border-t" />}
          <NavItem to="/projects" label="All projects" icon={FolderKanban} end collapsed={collapsed} onNavigate={onNavigate} />
          <IntegrationsNav collapsed={collapsed} onNavigate={onNavigate} />
          <NavItem to="/settings" label="Settings" icon={UserCog} end={false} collapsed={collapsed} onNavigate={onNavigate} />
        </ul>
      </nav>

      <div className={cn('border-t p-3', collapsed && 'flex flex-col items-center gap-1 px-2')}>
        {collapsed ? (
          <>
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Sign out" disabled={logout.isPending} onClick={signOut}>
                  <LogOut className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between gap-2 px-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{session?.user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
              <ThemeToggle />
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start" disabled={logout.isPending} onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

interface NavItemProps {
  to: string;
  label: string;
  icon: typeof Bug;
  end: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavItem({ to, label, icon: Icon, end, collapsed, onNavigate }: NavItemProps) {
  const link = (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
          collapsed && 'justify-center px-0',
          isActive &&
            'bg-accent text-foreground before:absolute before:inset-y-1.5 before:-left-0.5 before:w-[3px] before:rounded-full before:bg-lantern',
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && label}
    </NavLink>
  );

  return (
    <li>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ) : (
        link
      )}
    </li>
  );
}

const INTEGRATION_LINKS = [
  { to: '/integrations', label: 'Channels', end: true },
  { to: '/integrations/mcp', label: 'MCP', end: false },
  { to: '/integrations/webhooks', label: 'Webhooks', end: false },
];

function IntegrationsNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const open = !collapsed && pathname.startsWith('/integrations');

  return (
    <>
      <NavItem to="/integrations" label="Integrations" icon={Plug} end={false} collapsed={collapsed} onNavigate={onNavigate} />
      {open && (
        <li>
          <ul className="ml-5 grid gap-0.5 border-l pl-2">
            {INTEGRATION_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                      isActive && 'font-medium text-foreground',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </li>
      )}
    </>
  );
}
