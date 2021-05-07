/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as axe from 'axe-core';
import { beforeEachSetup, domWithA11yIssues, domWithNoA11yIssues } from '@sa11y/test-utils';
import { A11yError, sortViolations } from '../src/format';
import { AxeResults } from '@sa11y/common';
import { ConsolidatedResults } from '../src';

const a11yIssues = [
    { impact: undefined },
    { impact: undefined },
    { impact: 'moderate' },
    { impact: 'minor' },
    { impact: 'critical' },
    { impact: 'critical' },
] as AxeResults;

async function getA11yError(dom: string): Promise<A11yError> {
    document.body.innerHTML = dom;
    const violations = await axe.run(document).then((results) => results.violations);
    return new A11yError(violations);
}

// TODO (refactor): Move to common test-utils
//  - without creating circular dep due to "A11yError"
// eslint-disable-next-line jest/no-export
export async function getViolations(): Promise<AxeResults> {
    const a11yError = await getA11yError(domWithA11yIssues);
    return a11yError.violations;
}

beforeEach(() => {
    beforeEachSetup();
    ConsolidatedResults.clear();
});

describe('a11y Results Formatter', () => {
    it.each([domWithA11yIssues, domWithNoA11yIssues])(
        'should format a11y issues as expected with default options for dom %#',
        async (dom) => {
            const a11yError = await getA11yError(dom);
            expect(a11yError.format()).toMatchSnapshot();
            expect(a11yError.length).toMatchSnapshot();
            expect(a11yError.message).toMatchSnapshot();
        }
    );

    it.each([{ formatter: JSON.stringify }, { highlighter: (text: string) => `"${text}"` }, {}, undefined, null])(
        'should format using specified options: %#',
        async (formatOptions) => {
            expect((await getA11yError(domWithA11yIssues)).format(formatOptions)).toMatchSnapshot();
        }
    );

    it('should sort a11y issues by impact', () => {
        sortViolations(a11yIssues);
        expect(a11yIssues[0].impact).toEqual('critical');
        expect(a11yIssues[1].impact).toEqual('critical');
        expect(a11yIssues[2].impact).toEqual('moderate');
        expect(a11yIssues[3].impact).toBeUndefined(); // Sort by "defaultImpact"
        expect(a11yIssues[4].impact).toBeUndefined();
        expect(a11yIssues[5].impact).toEqual('minor');
    });

    it('should not throw error when no violations are present', async () => {
        const a11yError = await getA11yError(domWithNoA11yIssues);
        expect(() => A11yError.checkAndThrow(a11yError.violations)).not.toThrow();
    });

    it('should throw error when violations are present', async () => {
        const a11yError = await getA11yError(domWithA11yIssues);
        expect(() => A11yError.checkAndThrow(a11yError.violations)).toThrowErrorMatchingSnapshot();
    });

    it('should not throw error for repeated violations with consolidation', async () => {
        const a11yError = await getA11yError(domWithA11yIssues);
        const violations = a11yError.violations;
        // Should throw error for the first time
        expect(() => A11yError.checkAndThrow(violations, true)).toThrowErrorMatchingSnapshot();
        // Should not throw error for repeated violations with consolidation
        expect(() => A11yError.checkAndThrow(violations, true)).not.toThrow();
        // Should throw error for repeated violations without consolidation
        expect(() => A11yError.checkAndThrow(violations, false)).toThrowErrorMatchingSnapshot();
    });
});
