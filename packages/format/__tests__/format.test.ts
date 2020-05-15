/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as axe from 'axe-core';
import { a11yResultsFormatter } from '..';
import { beforeEachSetup, domWithA11yIssues } from '@sa11y/test-utils';
import { readTemplate } from '../src/format';

beforeEach(beforeEachSetup);

describe('a11y Results Formatter', () => {
    it('should load compiled template', async () => {
        expect(await readTemplate()).toMatchSnapshot();
    });

    it('should format a11y issues as expected', async () => {
        expect.assertions(2);
        document.body.innerHTML = domWithA11yIssues;
        await axe.run(document).then((results) => {
            expect(results).toBeDefined();
            expect(a11yResultsFormatter(results.violations)).toMatchSnapshot();
        });
    });
});
