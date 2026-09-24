import '../Config/EnvLoader';
import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import { FrameworkError } from '../Error/FrameworkError';

const DEFAULT_LOG_LEVEL = 'info';

const ALLOWED_LOG_LEVELS = Object.keys(
    winston.config.npm.levels
);

const logDirectory = path.resolve(
    process.cwd(),
    'Reports',
    'Logs'
);

if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, {
        recursive: true
    });
}

const logFile = path.join(
    logDirectory,
    'automation.log'
);

/**
 * An unknown level makes winston drop every message (errors included),
 * so fall back to the default and warn once the logger exists.
 */
const requestedLogLevel =
    process.env.LOG_LEVEL?.trim().toLowerCase();

const isRequestedLogLevelValid =
    !requestedLogLevel ||
    ALLOWED_LOG_LEVELS.includes(requestedLogLevel);

const logLevel =
    requestedLogLevel && isRequestedLogLevelValid
        ? requestedLogLevel
        : DEFAULT_LOG_LEVEL;

/**
 * WDIO sets WDIO_WORKER_ID (e.g. "0-0") in each worker process;
 * the launcher process has none.
 */
function workerLabel(): string {
    return process.env.WDIO_WORKER_ID ?? 'launcher';
}

const { combine, timestamp, printf, errors } =
    winston.format;

const logFormat = printf(
    ({
        timestamp,
        level,
        message,
        stack
    }) => {

        return `${String(timestamp)} | ${level.toUpperCase()} | [${workerLabel()}] | ${String(stack || message)}`;
    }
);

const logger = winston.createLogger({

    level: logLevel,

    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        errors({
            stack: true
        }),
        logFormat
    ),

    transports: [

        new winston.transports.Console(),

        new winston.transports.File({
            filename: logFile,
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5
        })
    ]
});

if (!isRequestedLogLevelValid) {
    logger.warn(
        `Invalid LOG_LEVEL "${requestedLogLevel}". Allowed: ${ALLOWED_LOG_LEVELS.join(', ')}. Falling back to "${DEFAULT_LOG_LEVEL}".`
    );
}

export class Logger {

    /**
     * Log debug information.
     */
    public static debug(
        message: string
    ): void {

        logger.debug(message);
    }

    /**
     * Log informational message.
     */
    public static info(
        message: string
    ): void {

        logger.info(message);
    }

    /**
     * Log warning.
     */
    public static warn(
        message: string
    ): void {

        logger.warn(message);
    }

    /**
     * Log error. For a FrameworkError, its context is appended.
     */
    public static error(
        message: string | Error
    ): void {

        if (message instanceof Error) {

            const context =
                message instanceof FrameworkError &&
                Object.keys(message.context).length > 0
                    ? `\nContext: ${JSON.stringify(message.context)}`
                    : '';

            logger.error(
                message.message,
                {
                    stack: `${message.stack ?? message.message}${context}`
                }
            );

            return;
        }

        logger.error(message);
    }
}
