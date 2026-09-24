import { ConfigManager } from '../Config/ConfigManager';
import { Logger } from '../Logger/Logger';
import type { ChainablePromiseElement } from 'webdriverio';

type ElementLike = WebdriverIO.Element | ChainablePromiseElement;

export default class WaitUtils {

    /**
     * Default element wait timeout from environment configuration.
     */
    private static get defaultTimeout(): number {
        return ConfigManager.getTimeouts().waitForElement;
    }

    /**
     * Resolve a chainable element (e.g. from `$()`) to a concrete element.
     */
    private static async resolve(
        element: ElementLike
    ): Promise<WebdriverIO.Element> {
        return await element as WebdriverIO.Element;
    }

    /**
     * Wait until an element exists.
     */
    public static async waitForExist(
        elementLike: ElementLike,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        const element = await WaitUtils.resolve(elementLike);

        Logger.debug(
            `Waiting for element to exist. Timeout: ${timeout}ms`
        );

        try {
            await element.waitForExist({
                timeout
            });
        } catch (error) {
            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }

    /**
     * Wait until an element is displayed.
     */
    public static async waitForDisplayed(
        elementLike: ElementLike,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        const element = await WaitUtils.resolve(elementLike);

        Logger.debug(
            `Waiting for element to be displayed. Timeout: ${timeout}ms`
        );

        try {
            await element.waitForDisplayed({
                timeout
            });
        } catch (error) {
            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }

    /**
     * Wait until an element is no longer displayed.
     */
    public static async waitForNotDisplayed(
        elementLike: ElementLike,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        const element = await WaitUtils.resolve(elementLike);

        Logger.debug(
            `Waiting for element to disappear. Timeout: ${timeout}ms`
        );

        try {
            await element.waitForDisplayed({
                timeout,
                reverse: true
            });
        } catch (error) {
            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }

    /**
     * Wait until an element is enabled.
     */
    public static async waitForEnabled(
        elementLike: ElementLike,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        const element = await WaitUtils.resolve(elementLike);

        Logger.debug(
            `Waiting for element to be enabled. Timeout: ${timeout}ms`
        );

        try {
            await element.waitForEnabled({
                timeout
            });
        } catch (error) {
            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }

    /**
     * Wait until an element is clickable.
     */
    public static async waitForClickable(
        elementLike: ElementLike,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        const element = await WaitUtils.resolve(elementLike);

        Logger.debug(
            `Waiting for element to become clickable. Timeout: ${timeout}ms`
        );

        try {
            await element.waitForClickable({
                timeout
            });
        } catch (error) {
            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }

    /**
     * Wait until an element contains expected text.
     */
    public static async waitForText(
        elementLike: ElementLike,
        expectedText: string,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        const element = await WaitUtils.resolve(elementLike);

        Logger.debug(
            `Waiting for text "${expectedText}". Timeout: ${timeout}ms`
        );

        try {
            await element.waitUntil(
                async () => {
                    const actualText =
                        await element.getText();

                    return actualText.includes(expectedText);
                },
                {
                    timeout,
                    timeoutMsg:
                        `Expected text "${expectedText}" was not found within ${timeout}ms.`
                }
            );
        } catch (error) {
            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }

    /**
     * Wait until an element attribute reaches expected value.
     */
    public static async waitForAttribute(
        elementLike: ElementLike,
        attribute: string,
        expectedValue: string,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        const element = await WaitUtils.resolve(elementLike);

        Logger.debug(
            `Waiting for attribute "${attribute}" to equal "${expectedValue}".`
        );

        try {
            await element.waitUntil(
                async () => {
                    const actualValue =
                        await element.getAttribute(attribute);

                    return actualValue === expectedValue;
                },
                {
                    timeout,
                    timeoutMsg:
                        `Attribute "${attribute}" did not reach expected value "${expectedValue}" within ${timeout}ms.`
                }
            );
        } catch (error) {
            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }

    /**
     * Wait for a custom condition.
     */
    public static async waitUntil(
        condition: () => Promise<boolean>,
        timeout: number = WaitUtils.defaultTimeout,
        timeoutMsg =
            `Condition was not satisfied within ${timeout}ms.`
    ): Promise<void> {

        Logger.debug(
            `Waiting for custom condition. Timeout: ${timeout}ms`
        );

        try {
            await browser.waitUntil(
                condition,
                {
                    timeout,
                    timeoutMsg
                }
            );
        } catch (error) {
            Logger.error(
                error instanceof Error
                    ? error
                    : new Error(String(error))
            );

            throw error;
        }
    }

    /**
     * Explicit pause.
     *
     * Use only when a fixed delay is genuinely required.
     */
    public static async pause(
        milliseconds: number
    ): Promise<void> {

        Logger.debug(
            `Pausing execution for ${milliseconds}ms`
        );

        await browser.pause(milliseconds);
    }
}