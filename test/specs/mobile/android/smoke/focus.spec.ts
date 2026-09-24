import Report from '../../../../../Core/Reporting/Report';
import FocusScreen from '../../../../../Screens/Mobile/Android/FocusScreen';

describe('Focus Screen - Android', () => {

    it('TC_001 @smoke @focus should show the Focus screen with the Draft Reply action', async () => {

        await Report.testCase({
            feature: 'Focus',
            story: 'Landing screen',
            severity: 'critical'
        });

        await expect(FocusScreen.container).toBeDisplayed();
        await expect(FocusScreen.draftReplyButton).toBeDisplayed();
    });
});
