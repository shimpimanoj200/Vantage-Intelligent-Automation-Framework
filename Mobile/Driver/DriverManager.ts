import { browser } from '@wdio/globals';
import { ConfigError } from '../../Core/Error/FrameworkError';

export const SUPPORTED_PLATFORMS = ['android'] as const;

export type Platform = typeof SUPPORTED_PLATFORMS[number];

const DEFAULT_PLATFORM: Platform = 'android';

function isSupportedPlatform(value: string): value is Platform {
    return (SUPPORTED_PLATFORMS as readonly string[]).includes(value);
}

/**
 * Owns the WebdriverIO session of the current worker and its state.
 *
 * The session itself is created by the WDIO runner from the capabilities
 * built by DriverFactory; this class only exposes it and answers
 * "which platform / device / session am I on?".
 */
export default class DriverManager {

    /**
     * Target platform, from PLATFORM (set by the npm scripts). Default: android.
     * Adding iOS means adding it to SUPPORTED_PLATFORMS and to DriverFactory.
     */
    public static get platform(): Platform {

        const requested =
            process.env.PLATFORM?.trim().toLowerCase() || DEFAULT_PLATFORM;

        if (!isSupportedPlatform(requested)) {

            throw new ConfigError(
                `Unsupported PLATFORM "${requested}". Supported: ${SUPPORTED_PLATFORMS.join(', ')}.`,
                { context: { platform: requested } }
            );
        }

        return requested;
    }

    /**
     * The active session. Only available inside a worker (hooks, tests, screens).
     */
    public static get driver(): WebdriverIO.Browser {

        return browser;
    }

    /**
     * Whether this process has an active session.
     */
    public static isSessionActive(): boolean {

        return DriverManager.hasSession();
    }

    /**
     * Session id of the active session, if any.
     */
    public static get sessionId(): string | undefined {

        return DriverManager.hasSession()
            ? browser.sessionId
            : undefined;
    }

    /**
     * UDID of the device this worker's session was requested for, if any.
     */
    public static get deviceId(): string | undefined {

        if (!DriverManager.hasSession()) {
            return undefined;
        }

        const udid =
            browser.requestedCapabilities?.['appium:udid'];

        return typeof udid === 'string'
            ? udid
            : undefined;
    }

    private static hasSession(): boolean {

        try {

            return Boolean(browser.sessionId);

        } catch {

            // @wdio/globals throws "No browser instance registered" outside a
            // worker (e.g. in the launcher process). That is the only error this
            // getter raises, and it simply means: no session.
            return false;
        }
    }
}
