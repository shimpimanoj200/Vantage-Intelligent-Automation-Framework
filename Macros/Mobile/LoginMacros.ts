import { Logger } from '../../Core/Logger/Logger';
import FocusScreen from '../../Screens/Mobile/Android/FocusScreen';
import LoginScreen from '../../Screens/Mobile/Android/LoginScreen';

/**
 * Reusable login business actions for tests.
 *
 * UNVERIFIED: depends on LoginScreen, whose locators have not been checked
 * against the app yet. Not used by any test until they are.
 */
export default class LoginMacros {

    /**
     * Log in and wait until the Focus (home) screen is shown.
     * The password is never logged.
     */
    public static async login(
        username: string,
        password: string
    ): Promise<void> {

        Logger.info(`Macro: log in as "${username}"`);

        await LoginScreen.waitForLoaded();
        await LoginScreen.enterUsername(username);
        await LoginScreen.enterPassword(password);
        await LoginScreen.tapLogin();

        await FocusScreen.waitForLoaded();
    }
}
