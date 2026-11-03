import { describe, expect, it } from 'vitest';
import { DocsLinkBuilder } from './useDocsLink';

describe('DocsLinkBuilder.build', () => {
  it('adds the file extension before the anchor for repository docs', () => {
    expect(
      DocsLinkBuilder.build('https://github.com/o/r/blob/main/docs', '.md', 'alerts/slack#create-a-webhook'),
    ).toBe('https://github.com/o/r/blob/main/docs/alerts/slack.md#create-a-webhook');
  });

  it('uses clean urls for a docs site', () => {
    expect(DocsLinkBuilder.build('https://docs.example.com', '', 'alerts/email#add-your-smtp-settings')).toBe(
      'https://docs.example.com/alerts/email#add-your-smtp-settings',
    );
  });

  it('works without an anchor', () => {
    expect(DocsLinkBuilder.build('https://d.example.com', '', 'source-maps')).toBe('https://d.example.com/source-maps');
  });
});
