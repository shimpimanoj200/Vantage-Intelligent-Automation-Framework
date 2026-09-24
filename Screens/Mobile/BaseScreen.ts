import { $, browser } from '@wdio/globals';
import type { ChainablePromiseElement } from 'webdriverio';
import { DriverError } from '../../Core/Error/FrameworkError';
import { Logger } from '../../Core/Logger/Logger';
import WaitUtils from '../../Core/Waits/WaitUtils';
import DriverFactory from '../../Mobile/Driver/DriverFactory';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export interface SwipeOptions {
    /** Fraction (0-1) of the screen/element to swipe across. Default: WebdriverIO's. */
    percent?: number;
    /** Swipe inside this element instead of the whole screen. */
    scrollableElement?: ChainablePromiseElement;
}

export interface ScrollIntoViewOptions extends SwipeOptions {
    /** Direction to scroll while searching. Default: down. */
    direction?: SwipeDirection;
    /** Give up after this many scrolls. Default: WebdriverIO's (10). */
    maxScrolls?: number;
}

/**
 * Base class for all mobile screen objects (Android and iOS).
 *
 * Holds only generic, reusable interactions. Every interaction waits via
 * WaitUtils first; timeouts default to `timeouts.waitForElement` from config.
 * Screen-specific locators, actions and checks belong in the subclasses.
 */
export default abstract class BaseScreen {

    // ==================
    // Locators
    // ==================

    /**
     * Locate an element by its React Native testID:
     * Android resource-id, iOS accessibility id.
     */
    protected byTestId(
        testId: string
    ): ChainablePromiseElement {

        return browser.isAndroid
            ? $(`android=new UiSelector().resourceId("${testId}")`)
            : $(`~${testId}`);
    }

    // ==================
    // Waits
    // ==================

    protected async waitForDisplayed(
        element: ChainablePromiseElement,
        timeout?: number
    ): Promise<void> {

        await WaitUtils.waitForDisplayed(element, timeout);
    }

    protected async waitForNotDisplayed(
        element: ChainablePromiseElement,
        timeout?: number
    ): Promise<void> {

        await WaitUtils.waitForNotDisplayed(element, timeout);
    }

    protected async waitForExist(
        element: ChainablePromiseElement,
        timeout?: number
    ): Promise<void> {

        await WaitUtils.waitForExist(element, timeout);
    }

    protected async waitForEnabled(
        element: ChainablePromiseElement,
        timeout?: number
    ): Promise<void> {

        await WaitUtils.waitForEnabled(element, timeout);
    }

    // ==================
    // Interactions
    // ==================

    /**
     * Wait until the element can be tapped, then tap it.
     */
    protected async tap(
        element: ChainablePromiseElement,
        timeout?: number
    ): Promise<void> {

        await WaitUtils.waitForClickable(element, timeout);

        await element.click();
    }

    /**
     * Replace the element's text. The text itself is never logged
     * (it may be a password); only its length is.
     */
    protected async enterText(
        element: ChainablePromiseElement,
        text: string,
        timeout?: number
    ): Promise<void> {

        await WaitUtils.waitForDisplayed(element, timeout);

        Logger.debug(
            `Entering ${text.length} characters into ${await BaseScreen.describe(element)}`
        );

        await element.setValue(text);
    }

    protected async clearText(
        element: ChainablePromiseElement,
        timeout?: number
    ): Promise<void> {

        await WaitUtils.waitForDisplayed(element, timeout);

        await element.clearValue();
    }

    /**
     * Wait until displayed, then return the element's text.
     */
    protected async getText(
        element: ChainablePromiseElement,
        timeout?: number
    ): Promise<string> {

        await WaitUtils.waitForDisplayed(element, timeout);

        return element.getText();
    }

    // ==================
    // Immediate state checks (no waiting)
    // ==================

    /**
     * Whether the element is displayed right now. False if it does not exist.
     */
    protected async isDisplayed(
        element: ChainablePromiseElement
    ): Promise<boolean> {

        return element.isDisplayed();
    }

    /**
     * Whether the element is enabled right now. False if it does not exist.
     */
    protected async isEnabled(
        element: ChainablePromiseElement
    ): Promise<boolean> {

        return await element.isExisting() && await element.isEnabled();
    }

    // ==================
    // Gestures and device
    // ==================

    protected async swipe(
        direction: SwipeDirection,
        options: SwipeOptions = {}
    ): Promise<void> {

        Logger.debug(`Swiping ${direction}`);

        await browser.swipe({ direction, ...options });
    }

    /**
     * Scroll until the element is visible (native apps).
     */
    protected async scrollIntoView(
        element: ChainablePromiseElement,
        options: ScrollIntoViewOptions = {}
    ): Promise<void> {

        Logger.debug(
            `Scrolling ${await BaseScreen.describe(element)} into view`
        );

        await element.scrollIntoView(options);
    }

    /**
     * Android system Back. iOS has no system back button, so this fails
     * clearly there; use the screen's own back control instead.
     */
    protected async pressBack(): Promise<void> {

        if (!browser.isAndroid) {

            throw new DriverError(
                'pressBack() is Android-only: iOS has no system back button. Tap the screen\'s back control instead.'
            );
        }

        await browser.back();
    }

    /**
     * Hide the on-screen keyboard if it is shown.
     */
    protected async hideKeyboard(): Promise<void> {

        if (await browser.isKeyboardShown()) {
            await browser.hideKeyboard();
        }
    }

    /**
     * Save a screenshot to Reports/Screenshots/<name>-<timestamp>.png.
     * Returns the absolute file path.
     */
    protected async takeScreenshot(
        name: string
    ): Promise<string> {

        return DriverFactory.takeScreenshot(name);
    }

    /**
     * Locator of the element for log messages. `.selector` must be read from
     * the resolved element; on a chainable `$()` it is not the selector string.
     */
    private static async describe(
        element: ChainablePromiseElement
    ): Promise<string> {

        const { selector } = await element.getElement();

        return typeof selector === 'string'
            ? selector
            : 'element';
    }
}
