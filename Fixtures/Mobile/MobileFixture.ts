import { ConfigManager } from '../../Core/Config/ConfigManager';
import { Logger } from '../../Core/Logger/Logger';
import Report from '../../Core/Reporting/Report';
import DriverFactory from '../../Mobile/Driver/DriverFactory';
import DriverManager from '../../Mobile/Driver/DriverManager';

/** The parts of WDIO's test object the fixture uses. */
export interface TestInfo {
    title: string;
    parent: string;
}

/** The parts of WDIO's afterTest result the fixture uses. */
export interface TestResultInfo {
    passed: boolean;
    duration: number;
    error?: unknown;
}

/**
 * Mobile test lifecycle. Each method is called from the wdio hook of the same
 * name in wdio.conf.ts; no test logic lives here.
 *
 * Every test starts with the app activated and ends with it terminated, so
 * tests do not depend on each other's app state.
 *
 * Note: WDIO logs errors thrown in these hooks instead of failing the test.
 * A failed app activation is therefore logged here (DriverError) and the test
 * then fails on its first wait.
 */
export default class MobileFixture {

    /**
     * wdio `before`: once per worker, after the session is created.
     */
    public static async before(): Promise<void> {

        Logger.setDevice(DriverManager.deviceId);

        Logger.info(
            `Session started on ${DriverManager.platform} device ${DriverManager.deviceId ?? 'unknown'} ` +
            `(session ${DriverManager.sessionId ?? 'unknown'})`
        );
    }

    /**
     * wdio `beforeTest`: before every test.
     */
    public static async beforeTest(
        test: TestInfo
    ): Promise<void> {

        Logger.info(
            `START ${MobileFixture.name(test)}`
        );

        await Report.fromTitle(test.title);

        await DriverFactory.activateApp(
            MobileFixture.appId()
        );
    }

    /**
     * wdio `afterTest`: after every test, pass or fail.
     */
    public static async afterTest(
        test: TestInfo,
        result: TestResultInfo
    ): Promise<void> {

        const seconds = (result.duration / 1000).toFixed(1);

        if (result.passed) {

            Logger.info(
                `PASSED ${MobileFixture.name(test)} in ${seconds}s`
            );

        } else {

            Logger.error(
                `FAILED ${MobileFixture.name(test)} in ${seconds}s: ${MobileFixture.firstLine(result.error)}`
            );

            await MobileFixture.captureFailureScreenshot(test);
        }

        await DriverFactory.terminateApp(
            MobileFixture.appId()
        );
    }

    /**
     * wdio `after`: once per worker, before the session is closed.
     */
    public static async after(): Promise<void> {

        Logger.info(
            `Session finished on device ${DriverManager.deviceId ?? 'unknown'}`
        );
    }

    /**
     * Screenshot of the failing screen: saved under Reports/Screenshots and,
     * because the test is still running, attached to it in Allure.
     * If it cannot be taken (e.g. the session died), teardown continues.
     */
    private static async captureFailureScreenshot(
        test: TestInfo
    ): Promise<void> {

        try {

            const file = await DriverFactory.takeScreenshot(
                `FAILED-${test.title}`
            );

            Logger.info(`Failure screenshot: ${file}`);

        } catch {

            // DriverFactory has already logged the DriverError with its cause.
            Logger.warn(
                `No failure screenshot for ${MobileFixture.name(test)}; continuing teardown.`
            );
        }
    }

    /**
     * Application under test for the current platform.
     */
    private static appId(): string {

        switch (DriverManager.platform) {

            case 'android':
                return ConfigManager.getAndroid().appPackage;
        }
    }

    private static name(
        test: TestInfo
    ): string {

        return `${test.parent} > ${test.title}`;
    }

    private static firstLine(
        error: unknown
    ): string {

        const message = error instanceof Error
            ? error.message
            : String(error);

        return message.split('\n')[0];
    }
}
