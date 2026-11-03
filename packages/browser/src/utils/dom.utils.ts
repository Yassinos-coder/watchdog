const MAX_CLASSES = 3;
const MAX_DEPTH = 4;

export class DomUtils {
  static describe(target: EventTarget | null): string {
    if (!(target instanceof Element)) {
      return 'unknown';
    }
    const parts: string[] = [];
    let current: Element | null = target;
    while (current && parts.length < MAX_DEPTH) {
      parts.unshift(DomUtils.describeElement(current));
      if (current.id) {
        break;
      }
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  private static describeElement(element: Element): string {
    const tag = element.tagName.toLowerCase();
    if (element.id) {
      return `${tag}#${element.id}`;
    }
    const classes = Array.from(element.classList).slice(0, MAX_CLASSES);
    return classes.length > 0 ? `${tag}.${classes.join('.')}` : tag;
  }
}
