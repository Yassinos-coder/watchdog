import { defineConfig, type HeadConfig } from 'vitepress';

const SITE_URL = 'https://yassinos-coder.github.io/watchdog/';
const SITE_NAME = 'Watchdog';
const SITE_TITLE = 'Watchdog: open-source Sentry alternative, self-hosted error tracking';
const SITE_DESCRIPTION =
  'Watchdog is an open-source, self-hosted Sentry alternative: error tracking, performance tracing and session replay for web, Node.js and React Native apps. One container plus PostgreSQL, deployed on Railway in a click.';
const KEYWORDS =
  'Sentry alternative, open source error tracking, self-hosted error tracking, self-hosted Sentry alternative, error monitoring, crash reporting, session replay, performance monitoring, React Native error tracking, Railway template';
const OG_IMAGE = `${SITE_URL}og-image.png`;
const BASE = process.env.DOCS_BASE || '/';

const pageUrl = (relativePath: string): string => {
  const path = relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');
  return `${SITE_URL}${path}`;
};

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Linux, Docker',
  url: SITE_URL,
  image: OG_IMAGE,
  license: 'https://opensource.org/licenses/MIT',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  codeRepository: 'https://github.com/Yassinos-coder/watchdog',
  author: { '@type': 'Person', name: 'Yassine Castro', url: 'https://yassinecastro.com' },
};

export default defineConfig({
  lang: 'en-US',
  title: SITE_NAME,
  titleTemplate: ':title | Watchdog',
  description: SITE_DESCRIPTION,
  base: BASE,
  srcDir: '../../docs',
  cleanUrls: true,
  ignoreDeadLinks: true,
  srcExclude: ['README.md', '**/CHANGELOG.md'],
  sitemap: { hostname: SITE_URL },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#0a1a1f' }],
    ['meta', { name: 'keywords', content: KEYWORDS }],
    ['meta', { name: 'author', content: 'Yassine Castro' }],
    ['meta', { name: 'robots', content: 'index, follow, max-image-preview:large' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: SITE_NAME }],
    ['meta', { property: 'og:image', content: OG_IMAGE }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: 'Watchdog: the open-source Sentry alternative' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: OG_IMAGE }],
  ],
  transformPageData(pageData) {
    const isHome = pageData.relativePath === 'index.md';
    const title = isHome ? SITE_TITLE : `${pageData.title} | ${SITE_NAME}`;
    const description = pageData.frontmatter.description ?? pageData.description ?? SITE_DESCRIPTION;
    const url = pageUrl(pageData.relativePath);
    const extra: HeadConfig[] = [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
    ];
    if (isHome) {
      extra.push(['script', { type: 'application/ld+json' }, JSON.stringify(softwareSchema)]);
    }
    pageData.frontmatter.head = [...(pageData.frontmatter.head ?? []), ...extra];
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Watchdog',
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Sentry alternative', link: '/sentry-alternative' },
      { text: 'GitHub', link: 'https://github.com/Yassinos-coder/watchdog' },
    ],
    sidebar: [
      {
        text: 'Start here',
        items: [
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Deploy to Railway', link: '/railway' },
          { text: 'Configuration', link: '/configuration' },
          { text: 'Watchdog vs Sentry', link: '/sentry-alternative' },
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
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Watchdog is an open-source project by Yassine Castro.',
    },
  },
});
