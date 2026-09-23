describe('Vintage Smoke Test', () => {

it('should open Draft Reply chat and verify Welcome', async () => {

    await driver.activateApp('com.inception42.vantage');

    const draftReply = $(
        'android=new UiSelector().resourceId("home-brief-action-0-0")'
    );

    await draftReply.waitForDisplayed({ timeout: 10000 });
    await draftReply.click();

    await expect(
        $('android=new UiSelector().resourceId("ask-screen")')
    ).toBeDisplayed();

    await expect(
        $('android=new UiSelector().resourceId("ask-empty-title")')
    ).toHaveText('Welcome,');
});

});