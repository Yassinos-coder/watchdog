import { Breadcrumb, UserContext } from './interfaces';

export class Scope {
  user?: UserContext;
  tags: Record<string, string> = {};
  extra: Record<string, unknown> = {};
  contexts: Record<string, unknown> = {};
  private breadcrumbs: Breadcrumb[] = [];

  constructor(private readonly maxBreadcrumbs: number) {}

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push({ timestamp: Date.now(), ...breadcrumb });
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }
}
