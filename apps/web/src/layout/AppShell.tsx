import { FolderKanban, LayoutDashboard, LogOut, Menu, Settings2, ShieldCheck, Bug } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useMatch, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLogout } from '@/features/auth/hooks/useAuthMutations';
import { useAuthSession } from '@/features/auth/hooks/useAuthQueries';
import { useProjects } from '@/features/projects/hooks/useProjectQueries';
import { cn } from '@/lib/utils';

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-card/50 lg:flex">
        <SidebarContent />
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
              <SidebarContent onNavigate={() => setMenuOpen(false)} />
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
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
        { to: `/projects/${projectId}/settings`, label: 'Project settings', icon: Settings2, end: false },
      ]
    : [];

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-3 pt-5">
        <Link to="/" onClick={onNavigate} aria-label="Watchdog home">
          <Logo />
        </Link>
      </div>

      {projects && projects.length > 0 && (
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

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="grid gap-0.5">
          {projectLinks.map((link) => (
            <NavItem key={link.to} {...link} onNavigate={onNavigate} />
          ))}
          {projectLinks.length > 0 && <li role="separator" className="my-2 border-t" />}
          <NavItem to="/projects" label="All projects" icon={FolderKanban} end onNavigate={onNavigate} />
          <NavItem to="/security" label="Security" icon={ShieldCheck} end onNavigate={onNavigate} />
        </ul>
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 flex items-center justify-between gap-2 px-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{session?.user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
          </div>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          disabled={logout.isPending}
          onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

interface NavItemProps {
  to: string;
  label: string;
  icon: typeof Bug;
  end: boolean;
  onNavigate?: () => void;
}

function NavItem({ to, label, icon: Icon, end, onNavigate }: NavItemProps) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            isActive &&
              'bg-accent text-foreground before:absolute before:inset-y-1.5 before:-left-0.5 before:w-[3px] before:rounded-full before:bg-lantern',
          )
        }
      >
        <Icon className="size-4" />
        {label}
      </NavLink>
    </li>
  );
}
