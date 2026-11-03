import type { ReactNode } from 'react';
import { CodeFrame } from '@/components/CodeFrame';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const SAMPLE_LINES = [
  { number: 38, text: 'async function checkout(userId: string) {' },
  { number: 39, text: '  const cart = await loadCart(userId);' },
  { number: 40, text: '  const total = cart.items.reduce((s, i) => s + i.price, 0);', failing: true },
  { number: 41, text: '  return total.toFixed(2);' },
  { number: 42, text: '}' },
];

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>

      <aside
        className="relative hidden flex-col justify-center overflow-hidden border-l border-[#1e3a43] bg-[#0a1a1f] px-12 text-[#e8eeec] lg:flex"
        aria-hidden="true"
      >
        <div className="dark mx-auto w-full max-w-xl">
          <p className="font-display text-2xl font-semibold leading-snug tracking-tight">
            See the exact line that broke, not just that something did.
          </p>
          <p className="mt-3 max-w-md text-sm text-[#8fa9af]">
            Watchdog groups your errors, maps minified stack traces back to your source, and shows the
            code around every failure.
          </p>
          <div className="mt-8">
            <CodeFrame filename="src/checkout/total.ts" functionName="checkout" lines={SAMPLE_LINES} />
            <p className="mt-3 rounded-md border border-[#1e3a43] bg-[#102830] px-4 py-3 font-mono text-xs text-[#f05a5a]">
              TypeError: Cannot read properties of undefined (reading &apos;price&apos;)
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
