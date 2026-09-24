import type { ChainablePromiseElement } from 'webdriverio';
import BaseScreen from '../BaseScreen';

/**
 * Login screen.
 *
 * UNVERIFIED: the testIDs below are placeholders and have not been checked
 * against the app yet. Confirm them (Appium Inspector / Appium MCP) before
 * using this screen in a test.
 */
export class LoginScreen extends BaseScreen {

    public get usernameInput(): ChainablePromiseElement {
        return this.byTestId('username');
    }

    public get passwordInput(): ChainablePromiseElement {
        return this.byTestId('password');
    }

    public get loginButton(): ChainablePromiseElement {
        return this.byTestId('login-button');
    }

    public async waitForLoaded(): Promise<void> {
        await this.waitForDisplayed(this.usernameInput);
    }

    public async enterUsername(username: string): Promise<void> {
        await this.enterText(this.usernameInput, username);
    }

    public async enterPassword(password: string): Promise<void> {
        await this.enterText(this.passwordInput, password);
    }

    public async tapLogin(): Promise<void> {
        await this.hideKeyboard();
        await this.tap(this.loginButton);
    }
}

export default new LoginScreen();
