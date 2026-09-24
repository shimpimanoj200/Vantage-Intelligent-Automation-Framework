import FocusScreen from '../../../../../Screens/Mobile/Android/FocusScreen';

describe('Focus Screen - Android', () => {

    it('should display Focus screen and Draft Reply action', async () => {

        await FocusScreen.waitForFocusScreen();

        await expect(FocusScreen.focusScreen).toBeDisplayed();

        await expect(FocusScreen.draftReplyButton).toBeDisplayed();
    });

});