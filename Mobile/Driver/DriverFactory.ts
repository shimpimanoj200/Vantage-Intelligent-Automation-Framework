import fs from 'node:fs';
import path from 'node:path';
import { browser } from '@wdio/globals';
import {
    ConfigManager,
    type AndroidConfig,
    type AndroidDeviceConfig
} from '../../Core/Config/ConfigManager';
import { DriverError, type ErrorContext } from '../../Core/Error/FrameworkError';
import { Logger } from '../../Core/Logger/Logger';
import DriverManager from './DriverManager';

const SCREENSHOT_DIRECTORY = path.resolve('Reports', 'Screenshots');

/**
 * Creates session capabilities from configuration and performs
 * application/session operations on the active session.
 */
export default class DriverFactory {

    /**
     * One capability per configured device for the current platform.
     * WDIO runs every spec on every capability, one session per device.
     */
    public static createCapabilities(): WebdriverIO.Capabilities[] {

        const platform = DriverManager.platform;

        switch (platform) {

            case 'android': {

                const android = ConfigManager.getAndroid();

                return android.devices.map(device =>
                    DriverFactory.createAndroidCapability(android, device)
                );
            }
        }
    }

    /**
     * Bring the application to the foreground (launching it if needed).
     */
    public static async activateApp(
        appPackage: string
    ): Promise<void> {

        await DriverFactory.execute(
            `Activate application ${appPackage}`,
            { appPackage },
            () => browser.activateApp(appPackage)
        );
    }

    /**
     * Stop the application.
     */
    public static async terminateApp(
        appPackage: string
    ): Promise<void> {

        await DriverFactory.execute(
            `Terminate application ${appPackage}`,
            { appPackage },
            () => browser.terminateApp(appPackage)
        );
    }

    /**
     * Save a PNG screenshot to Reports/Screenshots/<name>-<timestamp>.png and
     * return its absolute path. Taken during a test, the Allure reporter also
     * attaches it to that test automatically.
     */
    public static async takeScreenshot(
        name: string
    ): Promise<string> {

        const safeName = name.replace(/[^a-zA-Z0-9-_]+/g, '_').slice(0, 100);

        const absolutePath = path.join(
            SCREENSHOT_DIRECTORY,
            `${safeName}-${Date.now()}.png`
        );

        await DriverFactory.execute(
            `Save screenshot ${absolutePath}`,
            { screenshotPath: absolutePath },
            async () => {
                fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
                await browser.saveScreenshot(absolutePath);
            }
        );

        return absolutePath;
    }

    private static createAndroidCapability(
        android: AndroidConfig,
        device: AndroidDeviceConfig
    ): WebdriverIO.Capabilities {

        return {
            platformName: 'Android',
            'appium:automationName': android.automationName,
            'appium:deviceName': device.deviceName,
            'appium:udid': device.udid,
            'appium:platformVersion': device.platformVersion,
            // Unset by default: the UiAutomator2 driver then allocates a free port itself.
            ...(device.systemPort ? { 'appium:systemPort': device.systemPort } : {}),
            'appium:appPackage': android.appPackage,
            'appium:appActivity': android.appActivity,
            'appium:autoGrantPermissions': android.autoGrantPermissions,
            'appium:noReset': android.noReset,
            'appium:fullReset': android.fullReset,
            'appium:newCommandTimeout': ConfigManager.getTimeouts().newCommandSeconds
        };
    }

    /**
     * Log, run and, on failure, rethrow as DriverError (original error kept as
     * cause) with the device of the current session attached.
     */
    private static async execute(
        action: string,
        context: ErrorContext,
        operation: () => Promise<unknown>
    ): Promise<void> {

        Logger.info(action);

        try {

            await operation();

            Logger.info(`${action}: done`);

        } catch (error) {

            const driverError = new DriverError(
                `${action}: failed`,
                {
                    cause: error,
                    context: { ...context, device: DriverManager.deviceId }
                }
            );

            Logger.error(driverError);

            throw driverError;
        }
    }
}
