import type { ChainablePromiseElement } from 'webdriverio';
import BaseScreen from '../BaseScreen';

/**
 * Draft Reply screen (the "Ask" chat), opened from the Focus screen's
 * Draft Reply brief action.
 */
export class DraftReplyScreen extends BaseScreen {

    /** Root element of the Draft Reply screen. */
    public get container(): ChainablePromiseElement {
        return this.byTestId('ask-screen');
    }

    /** Greeting shown while the chat is empty, e.g. "Welcome,". */
    public get welcomeMessage(): ChainablePromiseElement {
        return this.byTestId('ask-empty-title');
    }

    /**
     * Wait until the Draft Reply screen is shown.
     */
    public async waitForLoaded(): Promise<void> {
        await this.waitForDisplayed(this.container);
    }

    /**
     * Text of the empty-chat greeting.
     */
    public async getWelcomeText(): Promise<string> {
        return this.getText(this.welcomeMessage);
    }
}

export default new DraftReplyScreen();
