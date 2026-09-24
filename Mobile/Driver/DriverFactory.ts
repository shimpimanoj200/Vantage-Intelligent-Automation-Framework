import { browser } from '@wdio/globals';
import { Logger } from '../../Core/Logger/Logger';

export default class DriverFactory {

    /**
     * Get the active WebdriverIO browser session.
     */
    public static getDriver() {

        Logger.debug(
            'Returning active WebdriverIO driver session.'
        );

        return browser;
    }

    /**
     * Launch Android application.
     */
    public static async activateApp(
        appPackage: string
    ): Promise<void> {

        Logger.info(
            `Activating Android application: ${appPackage}`
        );

        try {

            await browser.activateApp(
                appPackage
            );

            Logger.info(
                `Android application activated successfully: ${appPackage}`
            );

        } catch (error) {

            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }

    /**
     * Terminate Android application.
     */
    public static async terminateApp(
        appPackage: string
    ): Promise<void> {

        Logger.info(
            `Terminating Android application: ${appPackage}`
        );

        try {

            await browser.terminateApp(
                appPackage
            );

            Logger.info(
                `Android application terminated successfully: ${appPackage}`
            );

        } catch (error) {

            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }

    /**
     * Reset current WebdriverIO session.
     */
    public static async resetSession(): Promise<void> {

        Logger.info(
            'Reloading WebdriverIO session.'
        );

        try {

            await browser.reloadSession();

            Logger.info(
                'WebdriverIO session reloaded successfully.'
            );

        } catch (error) {

            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }

    /**
     * Take screenshot.
     */
    public static async takeScreenshot(
        screenshotPath: string
    ): Promise<void> {

        Logger.info(
            `Taking screenshot: ${screenshotPath}`
        );

        try {

            await browser.saveScreenshot(
                screenshotPath
            );

            Logger.info(
                `Screenshot saved successfully: ${screenshotPath}`
            );

        } catch (error) {

            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }
}