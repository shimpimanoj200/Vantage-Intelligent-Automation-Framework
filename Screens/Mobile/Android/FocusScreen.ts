import type { ChainablePromiseElement } from 'webdriverio';
import BaseScreen from '../BaseScreen';

/**
 * Focus (home) screen: the app's landing screen with the brief actions.
 */
export class FocusScreen extends BaseScreen {

    /** Root element of the Focus screen. */
    public get container(): ChainablePromiseElement {
        return this.byTestId('home-screen');
    }

    /**
     * First brief action (row 0, column 0), currently "Draft Reply".
     * Index-based testID: if the order of brief actions changes, update it here.
     */
    public get draftReplyButton(): ChainablePromiseElement {
        return this.byTestId('home-brief-action-0-0');
    }

    /**
     * Wait until the Focus screen is shown.
     */
    public async waitForLoaded(): Promise<void> {
        await this.waitForDisplayed(this.container);
    }

    /**
     * Tap the Draft Reply brief action.
     */
    public async tapDraftReply(): Promise<void> {
        await this.tap(this.draftReplyButton);
    }
}

export default new FocusScreen();
