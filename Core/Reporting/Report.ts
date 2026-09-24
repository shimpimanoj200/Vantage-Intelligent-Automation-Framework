import fs from 'node:fs';
import path from 'node:path';
import {
    addFeature,
    addSeverity,
    addStory,
    addTag,
    addTestId
} from '@wdio/allure-reporter';
import { Logger } from '../Logger/Logger';

/** Where the Allure reporter writes raw results (used by wdio.conf.ts). */
export const ALLURE_RESULTS_DIRECTORY = './Reports/Allure/allure-results';

export type Severity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';

export interface TestCaseMetadata {
    feature?: string;
    story?: string;
    severity?: Severity;
}

/** "TC_001 @smoke @focus should ..." → id "TC_001" */
const TEST_CASE_ID_PATTERN = /^([A-Z][A-Z0-9]*[_-]\d+)\b/;

/** "... @smoke @focus ..." → ["smoke", "focus"] */
const TAG_PATTERN = /@([\w-]+)/g;

/**
 * Thin facade over the Allure reporter, so tests and fixtures depend on this
 * small API rather than on a reporter package.
 */
export default class Report {

    /**
     * Empty the Allure results directory so each report shows only the
     * latest run. Called once per run from wdio `onPrepare`.
     */
    public static resetResults(): void {

        const directory = path.resolve(ALLURE_RESULTS_DIRECTORY);

        fs.rmSync(directory, { recursive: true, force: true });

        Logger.info(`Cleared previous Allure results: ${directory}`);
    }

    /**
     * Describe the current test in Allure. Call at the start of a test.
     *
     * @example
     * await Report.testCase({ feature: 'Draft Reply', story: 'Open from Focus', severity: 'critical' });
     */
    public static async testCase(
        metadata: TestCaseMetadata
    ): Promise<void> {

        if (metadata.feature) {
            await addFeature(metadata.feature);
        }

        if (metadata.story) {
            await addStory(metadata.story);
        }

        if (metadata.severity) {
            await addSeverity(metadata.severity);
        }
    }

    /**
     * Add the test case ID and tags found in a test title
     * (convention: "TC_001 @smoke @focus should ..."). Called by the fixture
     * for every test, so tests get this without writing any code.
     */
    public static async fromTitle(
        title: string
    ): Promise<void> {

        const testCaseId = TEST_CASE_ID_PATTERN.exec(title)?.[1];

        if (testCaseId) {
            await addTestId(testCaseId);
        }

        for (const [, tag] of title.matchAll(TAG_PATTERN)) {
            await addTag(tag);
        }
    }
}
