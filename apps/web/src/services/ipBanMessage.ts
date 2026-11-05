const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

export class IpBanMessage {
  static describe(retryAfterSeconds: number | undefined): string {
    const wait = IpBanMessage.formatWait(retryAfterSeconds);
    return `Too many requests came from your network address, so Watchdog blocked it ${wait}. Wait and reload the page. If you host Watchdog yourself, you can lift the block sooner by restarting the service or from the shield dashboard (see the Authentication docs).`;
  }

  private static formatWait(seconds: number | undefined): string {
    if (!seconds || seconds <= 0) {
      return 'for a while';
    }
    if (seconds < SECONDS_PER_MINUTE) {
      return `for about ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    }
    if (seconds < SECONDS_PER_HOUR) {
      const minutes = Math.ceil(seconds / SECONDS_PER_MINUTE);
      return `for about ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
    const hours = Math.ceil(seconds / SECONDS_PER_HOUR);
    return `for about ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
}
