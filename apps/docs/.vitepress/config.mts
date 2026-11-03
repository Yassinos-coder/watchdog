import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Watchdog',
  description: 'Self-hosted error tracking, performance monitoring and session replay.',
  base: process.env.DOCS_BASE || '/',
  srcDir: '../../docs',
  cleanUrls: true,
  ignoreDeadLinks: true,
  srcExclude: ['**/CHANGELOG.md'],
  rewrites: { 'README.md': 'index.md' },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'GitHub', link: 'https://github.com/Yassinos-coder/watchdog' },
    ],
    sidebar: [
      {
        text: 'Start here',
        items: [
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Deploy to Railway', link: '/railway' },
          { text: 'Configuration', link: '/configuration' },
        ],
      },
      {
        text: 'SDKs',
        items: [
          { text: 'React Native and Expo', link: '/react-native' },
          { text: 'Tracing and metrics', link: '/tracing-and-metrics' },
          { text: 'Session replay', link: '/session-replay' },
          { text: 'Source maps', link: '/source-maps' },
        ],
      },
      {
        text: 'Alerts',
        items: [
          { text: 'Overview', link: '/alerts/overview' },
          { text: 'Slack', link: '/alerts/slack' },
          { text: 'Discord', link: '/alerts/discord' },
          { text: 'Telegram', link: '/alerts/telegram' },
          { text: 'Email and SMTP', link: '/alerts/email' },
        ],
      },
      {
        text: 'Access',
        items: [
          { text: 'Authentication', link: '/authentication' },
          { text: 'Team, invites and roles', link: '/team' },
          { text: 'Sign in with Google or GitHub', link: '/oauth' },
        ],
      },
      {
        text: 'Operations',
        items: [{ text: 'Data retention', link: '/retention' }],
      },
    ],
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Yassinos-coder/watchdog' }],
  },
});
