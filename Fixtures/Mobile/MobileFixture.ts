import { ConfigManager } from '../../Core/Config/ConfigManager';
import { Logger } from '../../Core/Logger/Logger';
import DriverFactory from '../../Mobile/Driver/DriverFactory';

export default class MobileFixture {

    public static async beforeTest(): Promise<void> {

        const android = ConfigManager.getAndroid();

        Logger.info(
            `Starting mobile test fixture: ${android.appPackage}`
        );

        await DriverFactory.activateApp(
            android.appPackage
        );
    }

    public static async afterTest(): Promise<void> {

        const android = ConfigManager.getAndroid();

        Logger.info(
            `Cleaning up mobile test: ${android.appPackage}`
        );

        try {

            await DriverFactory.terminateApp(
                android.appPackage
            );

        } catch (error) {

            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );
        }
    }

    public static async afterAll(): Promise<void> {

        Logger.info(
            'Mobile test execution completed.'
        );
    }
}