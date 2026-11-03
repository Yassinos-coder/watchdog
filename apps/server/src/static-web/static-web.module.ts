import { existsSync } from 'node:fs';
import { DynamicModule, Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({})
export class StaticWebModule {
  static register(): DynamicModule {
    const rootPath = process.env.WEB_DIST_PATH;
    if (!rootPath || !existsSync(rootPath)) {
      return { module: StaticWebModule };
    }
    return {
      module: StaticWebModule,
      imports: [
        ServeStaticModule.forRoot({
          rootPath,
          exclude: [`/${process.env.API_PREFIX || 'api'}/{*path}`],
        }),
      ],
    };
  }
}
