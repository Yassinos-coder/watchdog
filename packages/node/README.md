# @watchdog-sdk/node

Watchdog for Node.js. It captures uncaught exceptions and unhandled rejections, reads the source lines around each failing frame from disk, and integrates with Express and NestJS.

```bash
bun add @watchdog-sdk/node
```

```ts
import * as Watchdog from '@watchdog-sdk/node';

Watchdog.init({
  dsn: 'https://<key>@your-watchdog-host/<project-id>',
  release: process.env.APP_VERSION,
  environment: process.env.NODE_ENV,
});

// Express
app.use(Watchdog.expressErrorHandler());
```

## NestJS

```ts
import { APP_FILTER } from '@nestjs/core';
import { WatchdogExceptionFilter } from '@watchdog-sdk/node/nest';

@Module({
  providers: [{ provide: APP_FILTER, useClass: WatchdogExceptionFilter }],
})
export class AppModule {}
```

Client errors (4xx) are not reported. Request headers such as `authorization` and `cookie` are never sent.

Watchdog is an open source, self-hosted error tracker. Documentation and server: https://github.com/Yassinos-coder/watchdog
