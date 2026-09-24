/**
 * Structured details attached to a framework error, e.g. the element,
 * app package, device or timeout involved.
 */
export type ErrorContext = Record<string, string | number | boolean | undefined>;

export interface FrameworkErrorOptions {
    /** The original error being wrapped. Preserved as `cause` and in the stack. */
    cause?: unknown;
    context?: ErrorContext;
}

/**
 * Base class for all errors raised by the framework.
 *
 * Preserves the original error (as `cause` and appended to `stack`, because
 * Mocha and Allure only print `stack`) and carries structured context.
 */
export class FrameworkError extends Error {

    public readonly context: ErrorContext;

    constructor(
        message: string,
        options: FrameworkErrorOptions = {}
    ) {
        super(message, { cause: options.cause });

        this.name = new.target.name;
        this.context = options.context ?? {};

        const cause = options.cause;

        if (cause instanceof Error && cause.stack) {
            this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
        } else if (cause !== undefined) {
            this.stack = `${this.stack}\nCaused by: ${String(cause)}`;
        }
    }
}

/** Invalid or missing environment configuration. */
export class ConfigError extends FrameworkError {}

/** Failure in session or application lifecycle operations. */
export class DriverError extends FrameworkError {}

/** An explicit wait did not reach its condition in time. */
export class WaitError extends FrameworkError {}

/**
 * Normalise an unknown thrown value into an Error without losing it.
 */
export function toError(value: unknown): Error {
    return value instanceof Error
        ? value
        : new Error(String(value));
}
