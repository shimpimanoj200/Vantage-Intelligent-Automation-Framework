# CLAUDE.md

Mobile test automation framework for the **Vantage** Android app (`com.inception42.vantage`), built on **WebdriverIO 9 + Appium 3 (UiAutomator2) + Mocha + TypeScript**. Windows dev machine, local Android emulator.

## Commands

```powershell
npm run test:android:qa        # run all specs against qa env (qa is also the default)
npm run test:android:dev       # dev env
npm run test:android:staging   # staging env
npx wdio run ./wdio.conf.ts --spec ./test/specs/mobile/android/smoke/focus.spec.ts   # single spec
npx wdio run ./wdio.conf.ts --mochaOpts.grep "@smoke"                                 # by tag

npx tsc --noEmit -p tsconfig.e2e.json   # type-check (see "Type-check coverage" below)

npm run allure:serve           # open Allure report from Reports/Allure/allure-results
```

Prerequisites for any run: emulator running and visible in `adb devices` as `emulator-5554`, app already installed **and logged in** (see Gotchas). The `appium` wdio service starts the Appium server itself — do not start one manually.

## Architecture

Layering — each layer only calls the one below it:

```
test/specs/**            Mocha specs: describe/it + expect-webdriverio assertions
  → Workflows/Mobile/    multi-screen business flows (e.g. LoginWorkflow)   [currently stubs]
    → Screens/Mobile/Android/   screen objects: locators + single-screen actions
      → Core/Waits/WaitUtils    explicit waits (accept Element or `$()` chainable)
        → WebdriverIO globals ($, browser, driver)
```

| Folder | Role |
|---|---|
| `wdio.conf.ts` | Runner config. Builds the single Android capability **inline** from `ConfigManager`; specs glob `./test/specs/**/*.ts`; `maxInstances: 1`; services `appium`, `visual`; reporters `spec` + `allure` (→ `Reports/Allure/allure-results`); hooks delegate to `MobileFixture`. |
| `Core/Config/ConfigManager.ts` | Static singleton. Loads `Core/Config/Environments/<TEST_ENV>.json` (default `qa`, resolved from `process.cwd()`), applies env-var overrides, validates. Accessors: `get()`, `getAndroid()`, `getAppium()`, `getTimeouts()`, `getEnvironment()`, `getAppPath()`. |
| `Core/Config/Environments/*.json` | Per-env device/app/appium/timeouts. All three must keep the same shape. |
| `Core/Logger/Logger.ts` | Static winston facade (`debug/info/warn/error`), console + `Reports/Logs/automation.log`. Level from `LOG_LEVEL`. |
| `Core/Waits/WaitUtils.ts` | Static wait helpers. Default timeout = `ConfigManager.getTimeouts().waitForElement`. |
| `Fixtures/Mobile/MobileFixture.ts` | Lifecycle: activate app / terminate app / final log. Called from wdio hooks. |
| `Mobile/Driver/DriverFactory.ts` | Despite the name, does **not** create sessions — thin logged wrappers over global `browser` (`activateApp`, `terminateApp`, `takeScreenshot`, ...). The session is owned by wdio. |
| `Apps/app-release.apk` | App binary (not wired into capabilities; app is assumed pre-installed). |

## Conventions

- **Screen objects**: one class per screen extending `BaseScreen`, exported as a singleton (`export default new FocusScreen()`). Locators are **getters** returning `$()` (lazy, re-queried on each access). Actions go through `BaseScreen.click()` / `waitForDisplayed()`, never raw `element.click()`.
- **Locators**: the app is React Native; use testIDs via UiAutomator resource-id with **no package prefix**:
  `$('android=new UiSelector().resourceId("home-screen")')`. Avoid XPath and index-based ids where a stable testID exists.
- **Specs**: file name `<feature>.spec.ts` under `test/specs/mobile/android/<suite>/`; tag test titles (`@smoke @mobile`) for `--mochaOpts.grep`. Assertions via `expect(...)` from expect-webdriverio (`toBeDisplayed`, `toHaveText`, ...). Use `expect.stringContaining` for partial text.
- **Waits**: always explicit via `WaitUtils` / `BaseScreen`; `WaitUtils.pause` only as last resort. Do **not** use `waitForClickable` — WebdriverIO throws in native mobile context; use displayed + enabled (what `BaseScreen.click` does).
- **Logging**: `Logger` from `Core/Logger/Logger`, not `console.log`.
- **Exports**: `Logger` and `ConfigManager` are named exports; `WaitUtils`, `DriverFactory`, `MobileFixture`, `BaseScreen`, screens are default exports.
- **Imports**: relative paths with the **exact on-disk casing** (`Screens/Mobile/Android`, capitalised). Windows hides casing mistakes; Linux CI will not.
- **Secrets / test data**: credentials come from `.env` (git-ignored), never hard-coded in specs. `Core/Data/TestDataFactory.ts` is the intended home for test data (currently empty).

## Configuration & environment variables

`.env` is loaded by dotenv (and by the wdio CLI). Variables actually read by code:

| Var | Read in | Effect |
|---|---|---|
| `TEST_ENV` | ConfigManager | Selects env JSON (`dev`/`qa`/`staging`, default `qa`) |
| `ANDROID_DEVICE_NAME`, `ANDROID_PLATFORM_VERSION`, `ANDROID_UDID` | ConfigManager | Override env JSON android fields |
| `APPIUM_HOST`, `APPIUM_PORT` | ConfigManager | Override appium block — **but see Gotchas: currently has no effect on the connection** |
| `ANDROID_APP_PATH` | `ConfigManager.getAppPath()` | Not called anywhere yet |
| `LOG_LEVEL` | Logger | winston level (`error`/`warn`/`info`/`debug`); an invalid value silences all logs |

`PLATFORM` is set by npm scripts and listed in `.env.example` but nothing reads it; there is no iOS path (`ios.capabilities.ts` is empty).

## Gotchas (known issues — check before debugging)

1. **App lifecycle mismatch**: `wdio.conf.ts` wires `MobileFixture.beforeTest()` (activate app) to the once-per-spec-file `before` hook, but `MobileFixture.afterTest()` (terminate app) to per-test `afterTest`. Any spec with 2+ `it` blocks will have the app killed before the second test. Fix by moving activation to the `beforeTest` hook.
2. **Login is not automated**: `LoginScreen.ts`, `LoginWorkflow.ts`, `login.spec.ts` are fully commented out. All specs assume the app is already logged in on the emulator; this persists only because env JSONs set `noReset: true`. Fresh device / cleared data ⇒ every spec times out.
3. **Casing bug**: `test/specs/mobile/android/smoke/focus.spec.ts` imports `Screens/mobile/android/FocusScreen` (lowercase) — fails on case-sensitive filesystems.
4. **Appium host/port overrides are ignored**: `services: ['appium']` has no `args`, so appium-service picks its own port (4723 or random) and writes it into the capability. To honour config: `['appium', { args: { address, port } }]`.
5. **Port 4723 conflicts**: the Appium MCP server (`.mcp.json`) and wdio's appium service both use Appium on 4723 — don't run a wdio test run while exploring the app via MCP.
6. **Hard-coded timeout**: `BaseScreen.DEFAULT_TIMEOUT = 10000` overrides the config-driven `timeouts.waitForElement`; editing the env JSON won't change screen waits.
7. **Type-check coverage**: `tsconfig.json` `include` lists non-existent `src/` and `config/`; framework folders are only type-checked when a spec (or `wdio.conf.ts`, via `tsconfig.e2e.json`) imports them. Unimported files (e.g. `LoginScreen.ts`, `Mobile/Capabilities/*`) are never checked — a green `tsc` doesn't cover them.
8. **TypeScript 7** is installed: it has no JS compiler API, so `ts-node` crashes. wdio loads TS via `tsx`; don't add tooling that needs `require('typescript')`.
9. **Dead / duplicate config**: `Mobile/Capabilities/android.capabilities.ts` + `Mobile/Constants/AndroidConstants.ts` are not imported and disagree with the env JSONs. The live capability is built in `wdio.conf.ts`. `qa.json` describes Android 11 / `nightwatch-android-11` while dev/staging say Pixel_9a / Android 16 — same udid.
10. **Empty placeholders**: `Core/Data/TestDataFactory.ts`, `Core/Error/FrameworkError.ts`, `Mobile/Capabilities/ios.capabilities.ts`, `test/specs/.../draft-reply.spec.ts` are 0 bytes. Empty/all-comment spec files are silently skipped by wdio and look like a pass.
11. `test/specs/mobile/android/smoke/appium-smoke.ts` bypasses screen objects (raw selectors) and uses exact-match `toHaveText('Welcome,')`; it's the Draft Reply flow and is meant to move into `draft-reply.spec.ts`.

## Adding a new test case

1. Explore the screen (Appium MCP / Appium Inspector) and collect testIDs.
2. Add or extend a screen object in `Screens/Mobile/Android/<Name>Screen.ts` (extends `BaseScreen`, getter locators, action methods).
3. If the flow spans screens, add a method in `Workflows/Mobile/<Flow>Workflow.ts`.
4. Write `test/specs/mobile/android/<suite>/<feature>.spec.ts` — one `it` per test case, title prefixed with the test-case ID and tags, e.g. `it('TC_001 @smoke user can open Draft Reply', ...)`.
5. Run it alone with `--spec`, then `npx tsc --noEmit -p tsconfig.e2e.json`.
