import { Logger } from '../../Core/Logger/Logger';
import DraftReplyScreen from '../../Screens/Mobile/Android/DraftReplyScreen';
import FocusScreen from '../../Screens/Mobile/Android/FocusScreen';

/**
 * Reusable Draft Reply business actions for tests.
 *
 * Macro rules (apply to every file in Macros/):
 * - One file per feature: <Feature>Macros.ts with static methods.
 * - A macro is a business step ("open Draft Reply", "login", "create email"),
 *   built only from Screen methods — no selectors, no raw WebdriverIO calls.
 * - Test data comes in as parameters: up to 2 positional
 *   (login(username, password)); 3 or more as one typed options object
 *   (createEmail({ message, attendee, body })).
 * - Assertions stay in the tests; a macro may return data the test asserts on.
 */
export default class DraftReplyMacros {

    /**
     * From the Focus screen, open Draft Reply and wait until it is loaded.
     */
    public static async openDraftReply(): Promise<void> {

        Logger.info('Macro: open Draft Reply from the Focus screen');

        await FocusScreen.waitForLoaded();
        await FocusScreen.tapDraftReply();
        await DraftReplyScreen.waitForLoaded();
    }
}
