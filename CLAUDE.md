# CLAUDE.md

Mobile test automation framework for the **Vantage** app (Android package `com.inception42.vantage`, a React Native app), built on **WebdriverIO 9 + Appium 3 (UiAutomator2) + Mocha + TypeScript 7**, with Winston logging and Allure 3 reporting. Currently Android on a Windows machine with one emulator (`emulator-5554`, `nightwatch-android-11`, Android 11). iOS is planned (see "Planned: iOS").

## Commands

```powershell
npm run test:android:qa        # all specs, qa env (qa is also the default TEST_ENV)
npm run test:android:dev       # also :staging, :prod
npx wdio run ./wdio.conf.ts --spec ./test/specs/mobile/android/smoke/focus.spec.ts   # one spec
npx wdio run ./wdio.conf.ts --mochaOpts.grep "@draft-reply"                           # by tag

npm run typecheck              # tsc --noEmit -p tsconfig.e2e.json (npx tsc --noEmit checks the same files)

npm run allure:generate        # Reports/Allure/allure-results -> Reports/Allure/allure-report (cleans the report dir first)
npm run allure:open            # serve the generated report
npm run allure:report          # generate + open
```

Current baseline: `npm run test:android:qa` → **2 passed, 2 total** (TC_001 focus, TC_002 draft-reply).

Prerequisites for a run: emulator visible in `adb devices`; Vantage installed **and already logged in** (see Gotchas). The wdio `appium` service starts Appium itself on the configured host/port (127.0.0.1:4723) — do not start one manually.

## Architecture

Each layer only calls the layer below it:

```
test/specs/**/*.spec.ts      describe/it + expect-webdriverio assertions ONLY (no selectors, waits, driver calls)
  → Macros/Mobile/           reusable parameterised business actions (<Feature>Macros.ts, static methods)
    → Screens/Mobile/Android/<Name>Screen.ts   locators (getters) + single-screen actions
      → Screens/Mobile/BaseScreen.ts           generic interactions; every action waits first
        → Core/Waits/WaitUtils.ts              condition-based waits → WaitError
          → Mobile/Driver/DriverFactory / DriverManager → WebdriverIO → Appium → device
```

| Path | Role |
|---|---|
| `wdio.conf.ts` | Wiring only: specs `./test/specs/**/*.spec.ts`, capabilities from `DriverFactory`, appium service (`args: {address, port}` from config, server log → `Reports/Logs/wdio-appium.log`), reporters `spec` + `allure`, hooks delegating to `MobileFixture` / `Report`. |
| `Core/Config/ConfigManager.ts` | Loads `Core/Config/Environments/<TEST_ENV>.json` (dev/qa/staging/prod, default qa), applies env-var overrides, validates with a **strict zod schema** (unknown keys rejected) → `ConfigError` listing every problem. `get()`, `getAndroid()`, `getAppium()`, `getTimeouts()`, `getEnvironment()`, `getAppPath()`. |
| `Core/Config/EnvLoader.ts` | Loads `.env` (quiet) — imported FIRST by Logger and ConfigManager. |
| `Core/Error/FrameworkError.ts` | `FrameworkError` (keeps `cause`, appends "Caused by:" stack, carries `context`) + `ConfigError`, `DriverError`, `WaitError`, `toError()`. |
| `Core/Logger/Logger.ts` | Winston: console + `Reports/Logs/automation.log`. Lines tagged `[worker|device]`, e.g. `[0-1|emulator-5554]`. Invalid `LOG_LEVEL` falls back to info with a warning. |
| `Core/Waits/WaitUtils.ts` | All waits (exist/displayed/notDisplayed/enabled/clickable/text/attribute/waitUntil). Default timeout `timeouts.waitForElement`. Failures → `WaitError` naming selector, condition, timeout. `pause(ms, reason)` requires a reason and logs a warning. |
| `Core/Reporting/Report.ts` | Allure facade: `Report.testCase({feature, story, severity})`; `fromTitle()` (auto, from fixture) adds test case ID + `@tags`; `resetResults()` (wdio `onPrepare`) so each report = latest run only. |
| `Core/Data/TestDataFactory.ts` | Empty placeholder for test data (credentials must come from `.env`). |
| `Mobile/Driver/DriverFactory.ts` | `createCapabilities()` (one per configured device), `activateApp`, `terminateApp`, `takeScreenshot(name)` → `Reports/Screenshots/<name>-<ts>.png`. Errors → `DriverError` with device. |
| `Mobile/Driver/DriverManager.ts` | Session state: `platform` (from `PLATFORM`, default android; unsupported → ConfigError), `driver`, `sessionId`, `deviceId`, `isSessionActive()`. |
| `Fixtures/Mobile/MobileFixture.ts` | One method per wdio hook: `before` (tag log with device), `beforeTest` (START log, Allure title metadata, **activate app**), `afterTest` (PASSED/FAILED log, **failure screenshot**, **terminate app**), `after`. |
| `Apps/app-release.apk` | App binary; not installed by the framework (app must be pre-installed). |

## Conventions

- **Screens**: `export class XScreen extends BaseScreen` + `export default new XScreen()`. Locators are getters via `this.byTestId('<testID>')` (Android → `android=new UiSelector().resourceId("<id>")`, iOS → `~<id>`). Each screen has `container` and `waitForLoaded()`. Actions use BaseScreen (`tap`, `enterText`, `clearText`, `getText`, `isDisplayed`, `isEnabled`, `swipe`, `scrollIntoView`, `pressBack` (Android only), `hideKeyboard`, `takeScreenshot`) — never raw `element.click()`. No business logic in BaseScreen.
- **Macros**: one `Macros/Mobile/<Feature>Macros.ts` per feature, static methods, built only from screen methods. Test data as parameters: ≤2 positional (`login(username, password)`), 3+ as one typed options object (`createEmail({ message, attendee, body })`). No assertions; may return data. Log one `Macro: …` info line.
- **Specs**: `test/specs/mobile/android/<suite>/<feature>.spec.ts`; one `it` per test case, title `TC_<id> @<suite> @<feature> should …` (ID and tags flow into Allure automatically); optional `Report.testCase({...})` first line; assertions with `expect(...)` (they auto-wait up to `waitforTimeout`). Tests must be independent — the app is (re)activated before and terminated after every test.
- **Selectors**: prefer testID/resource-id → accessibility id → stable text → UiSelector → XPath only if unavoidable. Don't change a working selector for style.
- **Errors**: throw `ConfigError`/`DriverError`/`WaitError` with `cause` + `context`; log once where handled; never `catch {}` silently.
- **Logging**: `Logger`, never `console.log`; never log entered text (passwords).
- **Imports**: relative, exact on-disk casing (`Screens/Mobile/Android`); `forceConsistentCasingInFileNames` enforces it.
- **Types**: no `any`, no casts to silence errors. Resolve a `$()` chainable with the typed `await el.getElement()`.

## Configuration

Env JSON shape (`Core/Config/Environments/<env>.json`):
```json
{ "name": "qa",
  "mobile": { "android": { "appPackage": "...", "appActivity": "...", "automationName": "UiAutomator2",
      "autoGrantPermissions": true, "noReset": true, "fullReset": false,
      "devices": [ { "deviceName": "nightwatch-android-11", "platformVersion": "11", "udid": "emulator-5554" } ] } },
  "appium":   { "host": "127.0.0.1", "port": 4723 },
  "timeouts": { "waitForElement": 10000, "command": 120000, "newCommandSeconds": 300 } }
```
Adding a key requires adding it to the zod schema in `ConfigManager.ts` (strict).

**Parallel devices**: every spec runs on every device in `devices[]`; `maxInstances` = number of devices, `maxInstancesPerCapability: 1` (never two sessions on one device). Add a second emulator entry to run in parallel. Do **not** set `systemPort` (optional in schema) — the UiAutomator2 driver allocates free ports 8200-8299 under a lock, which is parallel-safe.

Env vars (see `.env.example`): `TEST_ENV`, `LOG_LEVEL`, `PLATFORM` (android; set by npm scripts), `ANDROID_DEVICE_NAME` / `ANDROID_PLATFORM_VERSION` / `ANDROID_UDID` (any set ⇒ run on that single device), `APPIUM_HOST`, `APPIUM_PORT`, `ANDROID_APP_PATH` (only for `getAppPath()`, unused).

## Reporting

- Allure results: `Reports/Allure/allure-results` (**cleared at the start of every run**); report: `Reports/Allure/allure-report`. Environment block (env, platform, app, devices) comes from the loaded config.
- Test case ID is stored as an Allure **TMS link** (`addTestId` → `tms`), not a label. For clickable Jira links, configure a tms URL template in the allure reporter options.
- Failure screenshots: taken in `afterTest` via `DriverFactory.takeScreenshot` → saved in `Reports/Screenshots` and auto-attached to the failing test (the reporter attaches screenshots taken while a test is running).
- `Reports/Allure`, `Reports/Logs`, `Reports/Screenshots` are git-ignored.

## Gotchas

1. **Login is not automated.** `LoginScreen`/`LoginMacros` compile but their testIDs are UNVERIFIED placeholders; there is no login spec. All specs rely on the app already being logged in (env JSONs `noReset: true`). Fresh device / cleared app data ⇒ every spec times out.
2. **WDIO swallows errors thrown in config hooks** (`beforeTest`/`afterTest`, `@wdio/utils` executeHooksWithArgs): they are logged, not test-failing. A failed app activation shows as a `DriverError` in `automation.log`, then the test fails on its first wait.
3. **Port 4723**: the Appium MCP server (`.mcp.json`) and the wdio appium service both use it — don't run tests while exploring via MCP. The port is fixed; a busy port fails the run instead of silently moving.
4. **`.selector` on a chainable `$()` is not the selector string** — read it from `(await el.getElement()).selector`.
5. **`ChainablePromiseElement` is not typed as awaitable** — use `getElement()`, not `await el as Element`.
6. **`waitForClickable` natively**: WebdriverIO's throws in native context; `WaitUtils.waitForClickable` already substitutes displayed+enabled.
7. **TypeScript 7** has no JS compiler API: `ts-node` and similar tools crash. wdio loads TS via `tsx`.
8. **Allure 3** has no `serve` command and does not clean its output dir — hence `allure:clean-report` inside `allure:generate`.
9. `FocusScreen.draftReplyButton` uses an index-based testID (`home-brief-action-0-0`); if the brief-action order changes, update it.
10. Test IDs `TC_001`/`TC_002` are placeholders until real IDs (Excel/Jira) are provided.

## Adding a test case

1. Explore the screen (Appium Inspector / Appium MCP — stop test runs first) and collect testIDs.
2. Add/extend `Screens/Mobile/Android/<Name>Screen.ts` (`byTestId` getters, `container`, `waitForLoaded()`, actions).
3. Put reusable or multi-screen steps in `Macros/Mobile/<Feature>Macros.ts`.
4. Write `test/specs/mobile/android/<suite>/<feature>.spec.ts`: `it('TC_<id> @<suite> @<feature> should …')`, macros/screen actions + `expect` assertions only.
5. `npm run typecheck`, run it with `--spec`, then the full suite.

## Planned: iOS (Phase 9, not started)

Decided design: one `test:smoke` run where `test/specs/mobile/shared/**` runs on all devices, `android/**` only on Android and `ios/**` only on iOS devices, both platforms in parallel, each device sequential. Route with per-capability `'wdio:exclude'` (not `'wdio:specs'` — `--suite` replaces capability specs, `@wdio/config` getSpecs). Needs `mobile.ios` config (`bundleId`, `XCUITest`, `devices[]`), `PLATFORM=all|android|ios`, `DriverFactory`/`MobileFixture.appId()` iOS branches. iOS requires macOS + Xcode + signed WebDriverAgent + a device build — the team will run everything from a Mac.
