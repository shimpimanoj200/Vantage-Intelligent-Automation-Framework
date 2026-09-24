import BaseScreen from './BaseScreen';

class FocusScreen extends BaseScreen {

    public get focusScreen() {
        return $(
            'android=new UiSelector().resourceId("home-screen")'
        );
    }

    public get draftReplyButton() {
        return $(
            'android=new UiSelector().resourceId("home-brief-action-0-0")'
        );
    }

    async waitForFocusScreen(): Promise<void> {
        await this.waitForDisplayed(
            this.focusScreen
        );
    }

    async openDraftReply(): Promise<void> {
        await this.click(
            this.draftReplyButton
        );
    }
}

export default new FocusScreen();