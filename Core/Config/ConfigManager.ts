import './EnvLoader';
import fs from 'node:fs';
import path from 'node:path';
import { Logger } from '../Logger/Logger';

export interface AndroidConfig {
    deviceName: string;
    platformVersion: string;
    udid: string;
    appPackage: string;
    appActivity: string;
    automationName: string;
    autoGrantPermissions: boolean;
    noReset: boolean;
    fullReset: boolean;
}

export interface AppiumConfig {
    host: string;
    port: number;
}

export interface TimeoutConfig {
    waitForElement: number;
    command: number;
}

export interface EnvironmentConfig {
    name: string;

    mobile: {
        android: AndroidConfig;
    };

    appium: AppiumConfig;

    timeouts: TimeoutConfig;
}

export class ConfigManager {

    private static config: EnvironmentConfig;

    /**
     * Initialize environment configuration.
     */
    public static initialize(): void {

        const environment =
            process.env.TEST_ENV?.toLowerCase() || 'qa';

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

        if (!fs.existsSync(configPath)) {

            const errorMessage =
                `Environment configuration not found: ${configPath}`;

            Logger.error(errorMessage);

            throw new Error(errorMessage);
        }

        try {

            const fileConfig = JSON.parse(
                fs.readFileSync(configPath, 'utf-8')
            ) as EnvironmentConfig;

            ConfigManager.config =
                ConfigManager.applyEnvironmentOverrides(
                    fileConfig
                );

            ConfigManager.validate();

            Logger.info(
                `Configuration loaded successfully for environment: ${environment}`
            );

            Logger.debug(
                `Android device: ${ConfigManager.config.mobile.android.deviceName}`
            );

            Logger.debug(
                `Android UDID: ${ConfigManager.config.mobile.android.udid}`
            );

            Logger.debug(
                `Android platform version: ${ConfigManager.config.mobile.android.platformVersion}`
            );

            Logger.debug(
                `App package: ${ConfigManager.config.mobile.android.appPackage}`
            );

            Logger.debug(
                `App activity: ${ConfigManager.config.mobile.android.appActivity}`
            );

            Logger.debug(
                `Appium server: ${ConfigManager.config.appium.host}:${ConfigManager.config.appium.port}`
            );

        } catch (error) {

            if (error instanceof Error) {
                Logger.error(error);
            } else {
                Logger.error(
                    new Error(String(error))
                );
            }

            throw error;
        }
    }

    /**
     * Apply environment variable overrides.
     */
    private static applyEnvironmentOverrides(
        config: EnvironmentConfig
    ): EnvironmentConfig {

        const android = config.mobile.android;

        if (process.env.ANDROID_DEVICE_NAME) {

            Logger.debug(
                'Overriding Android device name from environment variable.'
            );

            android.deviceName =
                process.env.ANDROID_DEVICE_NAME;
        }

        if (process.env.ANDROID_PLATFORM_VERSION) {

            Logger.debug(
                'Overriding Android platform version from environment variable.'
            );

            android.platformVersion =
                process.env.ANDROID_PLATFORM_VERSION;
        }

        if (process.env.ANDROID_UDID) {

            Logger.debug(
                'Overriding Android UDID from environment variable.'
            );

            android.udid =
                process.env.ANDROID_UDID;
        }

        if (process.env.APPIUM_HOST) {

            Logger.debug(
                'Overriding Appium host from environment variable.'
            );

            config.appium.host =
                process.env.APPIUM_HOST;
        }

        if (process.env.APPIUM_PORT) {

            Logger.debug(
                'Overriding Appium port from environment variable.'
            );

            const port =
                Number(process.env.APPIUM_PORT);

            if (Number.isNaN(port)) {

                throw new Error(
                    `Invalid APPIUM_PORT value: ${process.env.APPIUM_PORT}`
                );
            }

            config.appium.port = port;
        }

        return config;
    }

    /**
     * Validate mandatory configuration.
     */
    private static validate(): void {

        Logger.debug(
            'Validating environment configuration.'
        );

        if (!ConfigManager.config.name) {

            throw new Error(
                'Environment name is required.'
            );
        }

        if (!ConfigManager.config.mobile.android.deviceName) {

            throw new Error(
                'Android deviceName is required.'
            );
        }

        if (!ConfigManager.config.mobile.android.udid) {

            throw new Error(
                'Android UDID is required.'
            );
        }

        if (!ConfigManager.config.mobile.android.platformVersion) {

            throw new Error(
                'Android platformVersion is required.'
            );
        }

        if (!ConfigManager.config.mobile.android.automationName) {

            throw new Error(
                'Android automationName is required.'
            );
        }

        if (!ConfigManager.config.mobile.android.appPackage) {

            throw new Error(
                'Android appPackage is required.'
            );
        }

        if (!ConfigManager.config.mobile.android.appActivity) {

            throw new Error(
                'Android appActivity is required.'
            );
        }

        if (!ConfigManager.config.appium.host) {

            throw new Error(
                'Appium host is required.'
            );
        }

        if (!ConfigManager.config.appium.port) {

            throw new Error(
                'Appium port is required.'
            );
        }

        if (!ConfigManager.config.timeouts.waitForElement) {

            throw new Error(
                'waitForElement timeout is required.'
            );
        }

        if (!ConfigManager.config.timeouts.command) {

            throw new Error(
                'command timeout is required.'
            );
        }

        Logger.debug(
            'Environment configuration validation completed successfully.'
        );
    }

    /**
     * Get complete environment configuration.
     */
    public static get(): EnvironmentConfig {

        if (!ConfigManager.config) {
            ConfigManager.initialize();
        }

        return ConfigManager.config;
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

            throw new Error(
                'ANDROID_APP_PATH environment variable is required.'
            );
        }

        return path.resolve(
            process.cwd(),
            appPath
        );
    }
}