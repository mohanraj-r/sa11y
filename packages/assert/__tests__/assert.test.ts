/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { assertAccessible } from '../src/assert';
import { recommended, getA11yConfig, base } from '@sa11y/preset-rules';
import {
    beforeEachSetup,
    checkA11yError,
    audioURL,
    videoURL,
    domWithA11yIssues,
    domWithNoA11yIssues,
    shadowDomID,
} from '@sa11y/test-utils';
import { axeRuntimeExceptionMsgPrefix } from '@sa11y/common';

beforeEach(() => {
    beforeEachSetup();
});

/**
 * Test util to test DOM with a11y issues
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function testDOMWithA11yIssues() {
    document.body.innerHTML = domWithA11yIssues;
    expect.assertions(3);
    await assertAccessible(document, recommended).catch((e: Error) => {
        checkA11yError(e);
    });
}

describe('assertAccessible API', () => {
    it('should trigger axe runtime exception for non existent rule', async () => {
        const errConfig = getA11yConfig(['non-existent-rule']);
        expect.assertions(2);
        await assertAccessible(document, errConfig).catch((e: Error) => {
            expect(e).toBeTruthy();
            expect(e.toString()).toContain(axeRuntimeExceptionMsgPrefix);
        });
    });

    // eslint-disable-next-line jest/expect-expect
    it.each([base, recommended])(
        'should throw no errors for dom with no a11y issues with config %#',
        async (config) => {
            document.body.innerHTML = domWithNoA11yIssues;
            await assertAccessible(document, config); // No error thrown
        }
    );

    it.each([
        // DOM to test, expected assertions
        [domWithNoA11yIssues, 0],
        [domWithA11yIssues, 3],
    ])(
        'should use default document, ruleset, formatter when called with no args - expecting %# assertion',
        async (testDOM: string, expectedAssertions: number) => {
            expect.assertions(expectedAssertions);
            document.body.innerHTML = testDOM;
            await assertAccessible().catch((e) => checkA11yError(e));
        }
    );

    // eslint-disable-next-line jest/expect-expect
    it('should throw an error with a11y issues found for dom with a11y issues', testDOMWithA11yIssues);

    it('should not throw error with HTML element with no a11y issues', async () => {
        document.body.innerHTML = domWithNoA11yIssues;
        const elem = document.getElementById(shadowDomID);
        expect(elem).toBeTruthy();
        await assertAccessible(elem); // No error thrown
    });

    it('should throw error with HTML element with a11y issues', async () => {
        expect.assertions(5);
        document.body.innerHTML = domWithA11yIssues;
        const elements = document.getElementsByTagName('body');
        expect(elements).toHaveLength(1);
        const elem = elements[0];
        expect(elem).toBeTruthy();
        await assertAccessible(elem).catch((e) => checkA11yError(e));
    });

    it.each(['', 'non-existent-audio.mp3', audioURL])(
        'should test audio without timing-out using src %#',
        async (source: string) => {
            document.body.innerHTML = `<audio src=${source}>Audio test</audio>`;
            await assertAccessible(document, getA11yConfig(['audio-caption', 'no-autoplay-audio']));
        }
    );

    it.each(['', 'non-existent-video.webm', videoURL])(
        'should test video without timing-out using src %#',
        async (source: string) => {
            document.body.innerHTML = `<video src=${source}>Video test</video>`;
            await assertAccessible(document, getA11yConfig(['video-caption', 'no-autoplay-audio']));
        }
    );
});
