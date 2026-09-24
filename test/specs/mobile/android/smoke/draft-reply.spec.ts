import Report from '../../../../../Core/Reporting/Report';
import DraftReplyMacros from '../../../../../Macros/Mobile/DraftReplyMacros';
import DraftReplyScreen from '../../../../../Screens/Mobile/Android/DraftReplyScreen';

describe('Draft Reply - Android', () => {

    it('TC_002 @smoke @draft-reply should open Draft Reply with the Welcome greeting', async () => {

        await Report.testCase({
            feature: 'Draft Reply',
            story: 'Open Draft Reply from Focus',
            severity: 'critical'
        });

        await DraftReplyMacros.openDraftReply();

        await expect(DraftReplyScreen.container).toBeDisplayed();
        await expect(DraftReplyScreen.welcomeMessage).toHaveText('Welcome,');
    });
});
