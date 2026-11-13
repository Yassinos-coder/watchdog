import { ProjectView } from '../../projects/interfaces/project.interfaces';

const INSTALL: Record<string, string> = {
  javascript: 'npm install @watchdog-sdk/browser',
  react: 'npm install @watchdog-sdk/react',
  node: 'npm install @watchdog-sdk/node',
  python: 'pip install watchdog-sdk',
  'react-native': 'npm install @watchdog-sdk/react-native',
};

const INIT: Record<string, string> = {
  javascript: "import { init } from '@watchdog-sdk/browser';\ninit({ dsn: import.meta.env.VITE_WATCHDOG_DSN, release: APP_VERSION, environment: import.meta.env.MODE });",
  react: "import { init } from '@watchdog-sdk/react';\ninit({ dsn: import.meta.env.VITE_WATCHDOG_DSN, release: APP_VERSION, environment: import.meta.env.MODE });",
  node: "import { init } from '@watchdog-sdk/node';\ninit({ dsn: process.env.WATCHDOG_DSN, release: process.env.APP_VERSION, environment: process.env.NODE_ENV });",
  python: 'import watchdog_sdk\nwatchdog_sdk.init(os.environ["WATCHDOG_DSN"], release=RELEASE, environment=ENVIRONMENT)',
  'react-native': "import { init } from '@watchdog-sdk/react-native';\ninit({ dsn: process.env.EXPO_PUBLIC_WATCHDOG_DSN, release: APP_VERSION });",
};

export class McpSetupMapper {
  static setup(project: ProjectView, appUrl: string, uploadToken?: string): Record<string, unknown> {
    const key = project.keys.find((entry) => entry.active) ?? project.keys[0];
    const platform = INSTALL[project.platform] ? project.platform : 'javascript';
    const dsn = key?.dsn ?? '';
    return {
      project: { id: project.id, name: project.name, platform: project.platform },
      dsn,
      url: appUrl,
      envFile: McpSetupMapper.envFile(project, appUrl, dsn, platform, uploadToken),
      install: INSTALL[platform],
      initExample: INIT[platform],
      sourceMaps: {
        note: 'Build with source maps on, then upload them after every build with the same release string the SDK reports.',
        command: 'bunx @watchdog-sdk/cli sourcemaps upload ./dist --release <release>',
        needs: 'WATCHDOG_URL, WATCHDOG_PROJECT_ID and WATCHDOG_UPLOAD_TOKEN in the build environment',
      },
      secrets: [
        'The DSN is a public identifier meant to ship inside client apps, but treat it as configuration.',
        'WATCHDOG_UPLOAD_TOKEN is a secret. Never commit it or put it in client code. Keep the .env file out of git.',
        uploadToken
          ? 'This upload token is shown once. Any earlier token for this project stopped working.'
          : 'The existing upload token cannot be read back. Call rotate_upload_token for a new one, which replaces the old.',
      ],
    };
  }

  private static envFile(project: ProjectView, appUrl: string, dsn: string, platform: string, uploadToken?: string): string {
    const dsnName = platform === 'javascript' || platform === 'react' ? 'VITE_WATCHDOG_DSN' : 'WATCHDOG_DSN';
    return [
      `${dsnName}=${dsn}`,
      `WATCHDOG_URL=${appUrl}`,
      `WATCHDOG_PROJECT_ID=${project.id}`,
      `WATCHDOG_UPLOAD_TOKEN=${uploadToken ?? '<call rotate_upload_token to create one>'}`,
    ].join('\n');
  }
}
