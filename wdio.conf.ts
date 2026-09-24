import { ConfigManager } from './Core/Config/ConfigManager';
import Report, { ALLURE_RESULTS_DIRECTORY } from './Core/Reporting/Report';
import MobileFixture from './Fixtures/Mobile/MobileFixture';
import DriverFactory from './Mobile/Driver/DriverFactory';
import DriverManager from './Mobile/Driver/DriverManager';

const { name: environment, appium, timeouts, mobile } = ConfigManager.get();

/**
 * One capability per configured device (Core/Config/Environments/<env>.json).
 * Every spec runs on every device; each device runs one session at a time.
 */
const capabilities = DriverFactory.createCapabilities();

export const config: WebdriverIO.Config = {

    // ==================
    // Runner
    // ==================
    runner: 'local',
    tsConfigPath: './tsconfig.e2e.json',

    // Appium server. Only used for the connection when the appium service
    // below is disabled (e.g. a remote Appium); otherwise the service
    // starts Appium on this address/port and connects each session to it.
    hostname: appium.host,
    port: appium.port,

    // ==================
    // Specs
    // ==================
    specs: [
        // Only *.spec.ts files are tests; helpers/data under test/ are never run.
        './test/specs/**/*.spec.ts'
    ],

    // ==================
    // Capabilities / parallelism
    // ==================
    capabilities,

    // Total parallel sessions = number of devices.
    maxInstances: capabilities.length,

    // Never run two sessions on the same device.
    maxInstancesPerCapability: 1,

    // ==================
    // Test configuration
    // ==================
    logLevel: 'info',

    bail: 0,

    // Default timeout for all waitFor* commands (ms).
    waitforTimeout: timeouts.waitForElement,

    // Timeout for a single WebDriver request (ms).
    connectionRetryTimeout: timeouts.command,

    connectionRetryCount: 3,

    services: [
        [
            'appium',
            {
                args: {
                    address: appium.host,
                    port: appium.port
                },
                // Appium server log: Reports/Logs/wdio-appium.log
                logPath: './Reports/Logs'
            }
        ]
    ],

    framework: 'mocha',

    reporters: [
        'spec',
        [
            'allure',
            {
                outputDir: ALLURE_RESULTS_DIRECTORY,

                disableWebdriverStepsReporting: true,

                disableWebdriverScreenshotsReporting: false,

                addConsoleLogs: true,

                // What actually ran, from the loaded configuration.
                reportedEnvironmentVars: {
                    ENVIRONMENT: environment,
                    PLATFORM: DriverManager.platform,
                    APP: mobile.android.appPackage,
                    DEVICES: mobile.android.devices
                        .map(device => `${device.deviceName} (Android ${device.platformVersion}, ${device.udid})`)
                        .join('; '),
                    NODE_VERSION: process.version
                }
            }
        ]
    ],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },

    // ==================
    // Hooks (delegate to fixtures; no test logic here)
    // ==================

    // Once per run, in the launcher, before any worker starts:
    // each Allure report then contains only the latest run.
    onPrepare: function () {
        Report.resetResults();
    },

    // Once per worker, after the session is created.
    before: async function () {
        await MobileFixture.before();
    },

    // Before every test: activates the app.
    beforeTest: async function (test) {
        await MobileFixture.beforeTest(test);
    },

    // After every test: result log, failure screenshot, terminates the app.
    afterTest: async function (test, _context, result) {
        await MobileFixture.afterTest(test, result);
    },

    // Once per worker, before the session is closed.
    after: async function () {
        await MobileFixture.after();
    }
};
