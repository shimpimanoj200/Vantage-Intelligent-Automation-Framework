import type { Capabilities } from '@wdio/types';
import { AndroidConstants } from '../Constants/AndroidConstants';

export const androidCapabilities: Capabilities.TestrunnerCapabilities = [
    {
        platformName: AndroidConstants.platformName,

        'appium:automationName':
            AndroidConstants.automationName,

        'appium:deviceName':
            AndroidConstants.deviceName,

        'appium:platformVersion':
            AndroidConstants.platformVersion,

        'appium:udid':
            AndroidConstants.udid,

        'appium:appPackage':
            AndroidConstants.appPackage,

        'appium:appActivity':
            AndroidConstants.appActivity,

        'appium:noReset': true,

        'appium:newCommandTimeout':
            AndroidConstants.newCommandTimeout
    }
];