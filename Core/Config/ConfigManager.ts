import './EnvLoader';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { Logger } from '../Logger/Logger';
import { ConfigError } from '../Error/FrameworkError';

const DEFAULT_ENVIRONMENT = 'qa';

const nonEmpty = z.string().trim().min(1, 'must not be empty');
const positiveInt = z.number().int().positive();
const port = positiveInt.max(65535);

const isUnique = (values: Array<string | number>): boolean =>
    new Set(values).size === values.length;

/**
 * Schema for Core/Config/Environments/<env>.json.
 * Strict: unknown keys (e.g. typos) are rejected rather than silently ignored.
 */
const AndroidDeviceSchema = z.strictObject({
    deviceName: nonEmpty,
    platformVersion: nonEmpty,
    udid: nonEmpty,
    /**
     * Optional host port of the UiAutomator2 server. Leave unset: the driver then
     * picks a free port in 8200-8299 under a lock, which is safe for parallel runs.
     * Set only for special setups (e.g. several Appium servers on one host).
     */
    systemPort: port.optional()
});

const AndroidConfigSchema = z.strictObject({
    appPackage: nonEmpty,
    appActivity: nonEmpty,
    automationName: nonEmpty,
    autoGrantPermissions: z.boolean(),
    noReset: z.boolean(),
    fullReset: z.boolean(),
    /** Every spec runs on every device listed here (one parallel session per device). */
    devices: z.array(AndroidDeviceSchema)
        .min(1, 'at least one device is required')
        .refine(
            devices => isUnique(devices.map(device => device.udid)),
            'each device must have a unique udid'
        )
        .refine(
            devices => isUnique(
                devices.flatMap(device => device.systemPort ?? [])
            ),
            'each device that sets systemPort must use a unique one'
        )
});

const AppiumConfigSchema = z.strictObject({
    host: nonEmpty,
    port
});

const TimeoutConfigSchema = z.strictObject({
    /** Default explicit-wait timeout, in milliseconds. */
    waitForElement: positiveInt,
    /** WebDriver request timeout (wdio connectionRetryTimeout), in milliseconds. */
    command: positiveInt,
    /** Appium idle session timeout (appium:newCommandTimeout), in SECONDS. */
    newCommandSeconds: positiveInt
});

const EnvironmentConfigSchema = z.strictObject({
    name: nonEmpty,
    mobile: z.strictObject({
        android: AndroidConfigSchema
    }),
    appium: AppiumConfigSchema,
    timeouts: TimeoutConfigSchema
});

export type AndroidDeviceConfig = z.infer<typeof AndroidDeviceSchema>;
export type AndroidConfig = z.infer<typeof AndroidConfigSchema>;
export type AppiumConfig = z.infer<typeof AppiumConfigSchema>;
export type TimeoutConfig = z.infer<typeof TimeoutConfigSchema>;
export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

export class ConfigManager {

    private static config: EnvironmentConfig | undefined;

    /**
     * Load, override and validate the configuration for TEST_ENV.
     */
    public static initialize(): EnvironmentConfig {

        const environment =
            process.env.TEST_ENV?.trim().toLowerCase() || DEFAULT_ENVIRONMENT;

        Logger.info(
            `Initializing configuration for environment: ${environment}`
        );

        const configPath = path.resolve(
            process.cwd(),
            'Core',
            'Config',
            'Environments',
            `${environment}.json`
        );

        Logger.debug(
            `Configuration file path: ${configPath}`
        );

        let config: EnvironmentConfig;

        try {

            const fileConfig = ConfigManager.validate(
                ConfigManager.readJson(configPath),
                configPath
            );

            config = ConfigManager.validate(
                ConfigManager.applyEnvironmentOverrides(fileConfig),
                `${configPath} + environment variable overrides`
            );

        } catch (error) {

            const configError = error instanceof ConfigError
                ? error
                : new ConfigError(
                    `Failed to load configuration for environment "${environment}".`,
                    { cause: error, context: { environment, configPath } }
                );

            Logger.error(configError);

            throw configError;
        }

        ConfigManager.config = config;

        const { android } = config.mobile;
        const { appium } = config;

        Logger.info(
            `Configuration loaded successfully for environment: ${environment}`
        );

        Logger.debug(
            `App ${android.appPackage}/${android.appActivity}, Appium ${appium.host}:${appium.port}, ` +
            `devices: ${android.devices
                .map(device => `${device.deviceName} (Android ${device.platformVersion}, udid ${device.udid}, systemPort ${device.systemPort ?? 'auto'})`)
                .join('; ')}`
        );

        return config;
    }

    /**
     * Read and parse the environment JSON file.
     */
    private static readJson(
        configPath: string
    ): unknown {

        if (!fs.existsSync(configPath)) {

            throw new ConfigError(
                `Environment configuration not found: ${configPath}`,
                { context: { configPath } }
            );
        }

        try {

            return JSON.parse(
                fs.readFileSync(configPath, 'utf-8')
            );

        } catch (error) {

            throw new ConfigError(
                `Environment configuration is not valid JSON: ${configPath}`,
                { cause: error, context: { configPath } }
            );
        }
    }

    /**
     * Validate a configuration object against the schema, reporting every problem.
     */
    private static validate(
        candidate: unknown,
        source: string
    ): EnvironmentConfig {

        const result = EnvironmentConfigSchema.safeParse(candidate);

        if (result.success) {
            return result.data;
        }

        const problems = result.error.issues
            .map(issue => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
            .join('\n');

        throw new ConfigError(
            `Invalid environment configuration (${source}):\n${problems}`,
            { context: { source } }
        );
    }

    /**
     * Apply environment variable overrides. Returns a new object; the
     * result is validated again by the caller.
     *
     * ANDROID_DEVICE_NAME / ANDROID_PLATFORM_VERSION / ANDROID_UDID describe ONE
     * device: when any is set, the run targets a single device built from the
     * first configured device plus the overrides.
     */
    private static applyEnvironmentOverrides(
        config: EnvironmentConfig
    ): EnvironmentConfig {

        const {
            ANDROID_DEVICE_NAME,
            ANDROID_PLATFORM_VERSION,
            ANDROID_UDID,
            APPIUM_HOST,
            APPIUM_PORT
        } = process.env;

        const android = { ...config.mobile.android };
        const appium = { ...config.appium };

        if (ANDROID_DEVICE_NAME || ANDROID_PLATFORM_VERSION || ANDROID_UDID) {

            const [firstDevice] = android.devices;

            Logger.debug(
                'ANDROID_* override set: running on a single device built from the first configured device.'
            );

            android.devices = [{
                ...firstDevice,
                deviceName: ANDROID_DEVICE_NAME || firstDevice.deviceName,
                platformVersion: ANDROID_PLATFORM_VERSION || firstDevice.platformVersion,
                udid: ANDROID_UDID || firstDevice.udid
            }];
        }

        if (APPIUM_HOST) {

            Logger.debug(
                'Overriding Appium host from environment variable APPIUM_HOST.'
            );

            appium.host = APPIUM_HOST;
        }

        if (APPIUM_PORT) {

            Logger.debug(
                'Overriding Appium port from environment variable APPIUM_PORT.'
            );

            appium.port = Number(APPIUM_PORT);
        }

        return {
            ...config,
            mobile: { ...config.mobile, android },
            appium
        };
    }

    /**
     * Get complete environment configuration (initialises lazily).
     */
    public static get(): EnvironmentConfig {

        return ConfigManager.config ?? ConfigManager.initialize();
    }

    /**
     * Get Android configuration.
     */
    public static getAndroid(): AndroidConfig {

        return ConfigManager.get().mobile.android;
    }

    /**
     * Get Appium configuration.
     */
    public static getAppium(): AppiumConfig {

        return ConfigManager.get().appium;
    }

    /**
     * Get timeout configuration.
     */
    public static getTimeouts(): TimeoutConfig {

        return ConfigManager.get().timeouts;
    }

    /**
     * Get current environment name.
     */
    public static getEnvironment(): string {

        return ConfigManager.get().name;
    }

    /**
     * Get Android application path.
     *
     * Used only when APK installation is required.
     */
    public static getAppPath(): string {

        const appPath =
            process.env.ANDROID_APP_PATH;

        if (!appPath) {

            throw new ConfigError(
                'ANDROID_APP_PATH environment variable is required.'
            );
        }

        return path.resolve(
            process.cwd(),
            appPath
        );
    }
}
