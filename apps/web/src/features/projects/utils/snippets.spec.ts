import { describe, expect, it } from 'vitest';
import { PLATFORMS } from '../constants/platforms';
import { SnippetBuilder } from './snippets';

const DSN = 'https://key@watchdog.test/11111111-1111-4111-8111-111111111111';

describe('SnippetBuilder', () => {
  const snippets = SnippetBuilder.build(DSN, 'project-id', 'https://watchdog.test');

  it('puts the DSN into every setup snippet', () => {
    for (const key of ['react', 'browser', 'node', 'nestjs', 'python', 'reactNative'] as const) {
      expect(snippets[key]).toContain(DSN);
    }
  });

  it('shows how to install and start the Python SDK', () => {
    expect(snippets.python).toContain('pip install watchdog-sdk');
    expect(snippets.python).toContain('import watchdog_sdk as watchdog');
  });

  it('shows how to install and start the React Native SDK', () => {
    expect(snippets.reactNative).toContain('@watchdog-sdk/react-native');
  });

  it('opens each platform on its own snippet and falls back to the browser one', () => {
    expect(SnippetBuilder.defaultTab('python')).toBe('python');
    expect(SnippetBuilder.defaultTab('react-native')).toBe('reactNative');
    expect(SnippetBuilder.defaultTab('node')).toBe('node');
    expect(SnippetBuilder.defaultTab('other')).toBe('browser');
  });

  it('gives every platform a snippet tab that exists', () => {
    for (const platform of PLATFORMS) {
      expect(Object.keys(snippets)).toContain(SnippetBuilder.defaultTab(platform.value));
    }
  });
});
