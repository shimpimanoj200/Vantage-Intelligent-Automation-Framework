import WaitUtils from '../../../Core/Waits/WaitUtils';

export default class BaseScreen {

    protected readonly DEFAULT_TIMEOUT = 10000;

    protected async waitForDisplayed(
        element: ReturnType<typeof $>,
        timeout: number = this.DEFAULT_TIMEOUT
    ): Promise<void> {

        await WaitUtils.waitForDisplayed(
            element,
            timeout
        );
    }

    protected async click(
        element: ReturnType<typeof $>,
        timeout: number = this.DEFAULT_TIMEOUT
    ): Promise<void> {

        await WaitUtils.waitForDisplayed(
            element,
            timeout
        );

        await WaitUtils.waitForEnabled(
            element,
            timeout
        );

        await element.click();
    }
}