import { describe, expect, it } from 'vitest';
import { IpBanMessage } from './ipBanMessage';

describe('IpBanMessage.describe', () => {
  it('says how long the block lasts in the most natural unit', () => {
    expect(IpBanMessage.describe(30)).toContain('for about 30 seconds');
    expect(IpBanMessage.describe(61)).toContain('for about 2 minutes');
    expect(IpBanMessage.describe(300)).toContain('for about 5 minutes');
    expect(IpBanMessage.describe(3600)).toContain('for about 1 hour');
    expect(IpBanMessage.describe(7300)).toContain('for about 3 hours');
  });

  it('falls back to a vague duration when the server did not say', () => {
    expect(IpBanMessage.describe(undefined)).toContain('for a while');
  });

  it('tells the owner how to recover', () => {
    expect(IpBanMessage.describe(300)).toContain('restarting the service');
  });
});
