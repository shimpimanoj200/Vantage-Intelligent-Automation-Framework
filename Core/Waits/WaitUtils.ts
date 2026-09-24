import { browser } from '@wdio/globals';
import type { ChainablePromiseElement } from 'webdriverio';
import { ConfigManager } from '../Config/ConfigManager';
import { WaitError } from '../Error/FrameworkError';
import { Logger } from '../Logger/Logger';

/**
 * An element as returned by `$()` (chainable, lazily resolved) or an
 * already-resolved element.
 */
export type ElementLike = WebdriverIO.Element | ChainablePromiseElement;

/**
 * Centralised, condition-based waits. All timeouts default to
 * `timeouts.waitForElement` from the environment configuration.
 */
export default class WaitUtils {

    /**
     * Default element wait timeout from environment configuration.
     */
    private static get defaultTimeout(): number {
        return ConfigManager.getTimeouts().waitForElement;
    }

    /**
     * Wait until an element exists in the UI hierarchy (it may be hidden).
     */
    public static async waitForExist(
        elementLike: ElementLike,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        await WaitUtils.waitFor(
            'exist',
            elementLike,
            timeout,
            element => element.waitForExist({ timeout })
        );
    }

    /**
     * Wait until an element is displayed.
     */
    public static async waitForDisplayed(
        elementLike: ElementLike,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        await WaitUtils.waitFor(
            'be displayed',
            elementLike,
            timeout,
            element => element.waitForDisplayed({ timeout })
        );
    }

    /**
     * Wait until an element is no longer displayed (or no longer exists).
     */
    public static async waitForNotDisplayed(
        elementLike: ElementLike,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        await WaitUtils.waitFor(
            'disappear',
            elementLike,
            timeout,
            element => element.waitForDisplayed({ timeout, reverse: true })
        );
    }

    /**
     * Wait until an element is enabled.
     */
    public static async waitForEnabled(
        elementLike: ElementLike,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        await WaitUtils.waitFor(
            'be enabled',
            elementLike,
            timeout,
            element => element.waitForEnabled({ timeout })
        );
    }

    /**
     * Wait until an element can be tapped/clicked.
     *
     * WebdriverIO's waitForClickable throws in a native mobile context, so
     * there it waits for "displayed AND enabled" instead.
     */
    public static async waitForClickable(
        elementLike: ElementLike,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        await WaitUtils.waitFor(
            'be clickable',
            elementLike,
            timeout,
            element => browser.isMobile && browser.isNativeContext
                ? element.waitUntil(
                    async () => await element.isDisplayed() && await element.isEnabled(),
                    { timeout }
                )
                : element.waitForClickable({ timeout })
        );
    }

    /**
     * Wait until an element's text contains the expected text.
     */
    public static async waitForText(
        elementLike: ElementLike,
        expectedText: string,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        await WaitUtils.waitFor(
            `contain text "${expectedText}"`,
            elementLike,
            timeout,
            element => element.waitUntil(
                async () => (await element.getText()).includes(expectedText),
                { timeout }
            )
        );
    }

    /**
     * Wait until an element attribute equals the expected value.
     */
    public static async waitForAttribute(
        elementLike: ElementLike,
        attribute: string,
        expectedValue: string,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        await WaitUtils.waitFor(
            `have attribute "${attribute}" = "${expectedValue}"`,
            elementLike,
            timeout,
            element => element.waitUntil(
                async () => await element.getAttribute(attribute) === expectedValue,
                { timeout }
            )
        );
    }

    /**
     * Wait for a custom condition.
     */
    public static async waitUntil(
        condition: () => Promise<boolean>,
        description: string,
        timeout: number = WaitUtils.defaultTimeout
    ): Promise<void> {

        Logger.debug(
            `Waiting up to ${timeout}ms for: ${description}`
        );

        try {

            await browser.waitUntil(
                condition,
                { timeout }
            );

        } catch (error) {

            throw WaitUtils.failure(
                `Waiting for "${description}" failed (timeout ${timeout}ms).`,
                error,
                { condition: description, timeout }
            );
        }
    }

    /**
     * Fixed delay. Prefer a condition-based wait; a reason is mandatory and
     * logged as a warning so every fixed sleep is visible and justified.
     */
    public static async pause(
        milliseconds: number,
        reason: string
    ): Promise<void> {

        Logger.warn(
            `Fixed pause of ${milliseconds}ms: ${reason}`
        );

        await browser.pause(milliseconds);
    }

    /**
     * Resolve the element, log the wait, run it, and convert any failure into
     * a WaitError that names the element, condition and timeout.
     */
    private static async waitFor(
        condition: string,
        elementLike: ElementLike,
        timeout: number,
        wait: (element: WebdriverIO.Element) => Promise<unknown>
    ): Promise<void> {

        // Typed WebdriverIO API to resolve a chainable `$()` into an element (no cast needed).
        const element = await elementLike.getElement();
        const target = WaitUtils.describe(element);

        Logger.debug(
            `Waiting up to ${timeout}ms for ${target} to ${condition}`
        );

        try {

            await wait(element);

        } catch (error) {

            throw WaitUtils.failure(
                `Waiting for ${target} to ${condition} failed (timeout ${timeout}ms).`,
                error,
                { selector: target, condition, timeout }
            );
        }
    }

    private static failure(
        message: string,
        cause: unknown,
        context: Record<string, string | number>
    ): WaitError {

        const waitError = new WaitError(
            message,
            { cause, context }
        );

        Logger.error(waitError);

        return waitError;
    }

    /**
     * Human-readable element description for logs and errors.
     */
    private static describe(
        element: WebdriverIO.Element
    ): string {

        return typeof element.selector === 'string'
            ? element.selector
            : 'element';
    }
}
