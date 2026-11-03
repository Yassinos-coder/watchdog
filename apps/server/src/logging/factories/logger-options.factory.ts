import { utilities as nestWinstonUtilities } from 'nest-winston';
import { format, LoggerOptions, transports } from 'winston';

const APP_NAME = 'Watchdog';
const SILENT_LEVEL = 'silent';

export class LoggerOptionsFactory {
  static fromEnvironment(env: NodeJS.ProcessEnv = process.env): LoggerOptions {
    const isProduction = env.NODE_ENV === 'production';
    const requestedLevel = env.LOG_LEVEL?.toLowerCase() || (isProduction ? 'info' : 'debug');
    const silent = requestedLevel === SILENT_LEVEL;

    return {
      level: silent ? 'error' : requestedLevel,
      silent,
      transports: [
        new transports.Console({
          format: isProduction
            ? format.combine(format.timestamp(), format.errors({ stack: true }), format.json())
            : format.combine(
                format.timestamp(),
                format.errors({ stack: true }),
                nestWinstonUtilities.format.nestLike(APP_NAME, { colors: true, prettyPrint: true }),
              ),
        }),
      ],
    };
  }
}
