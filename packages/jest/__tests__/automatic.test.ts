/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as automatic from '../src/automatic';
import { automaticCheck, registerSa11yAutomaticChecks } from '../src/automatic';
import { beforeEachSetup, checkA11yError, domWithA11yIssues } from '@sa11y/test-utils';
import { setup } from '../src';

describe('checks registration', () => {
    const registerAutomaticMock = jest.spyOn(automatic, 'registerSa11yAutomaticChecks');

    it('should not run by default', () => {
        setup();
        expect(registerAutomaticMock).toHaveBeenLastCalledWith({
            cleanupAfterEach: false,
            excludeTests: [],
            runAfterEach: false,
        });
    });

    it('should run when opted in', () => {
        setup({ autoCheckOpts: { runAfterEach: true } });
        expect(registerAutomaticMock).toHaveBeenLastCalledWith({ runAfterEach: true });
    });
});

describe('checks call', () => {
    // TODO (refactor): Not really required for the tests - just here for code coverage
    beforeAll(() => registerSa11yAutomaticChecks());
    beforeEach(beforeEachSetup);

    // TODO (fix): Debug and fix the failing test ?
    // it('should not raise a11y issues for DOM without a11y issues', () => {
    //     document.body.innerHTML = domWithNoA11yIssues;
    //     expect(async () => await automaticCheck()).not.toThrow();
    // });

    it('should raise a11y issues for DOM with a11y issues', async () => {
        document.body.innerHTML = domWithA11yIssues;
        await automaticCheck().catch((e) => checkA11yError(e));
    });
});
