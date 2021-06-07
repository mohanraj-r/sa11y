/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { A11yResult, ConsolidatedResults } from '../src';
import { getViolations } from './format.test';
import { AxeResults } from '@sa11y/common';

const a11yIssues = [
    { impact: undefined },
    { impact: undefined },
    { impact: 'moderate' },
    { impact: 'minor' },
    { impact: 'critical' },
    { impact: 'critical' },
] as AxeResults;

let violations: AxeResults = [];
beforeAll(async () => {
    violations = await getViolations();
});
beforeEach(() => ConsolidatedResults.clear());

describe('a11y result', () => {
    it('should be serializable', () => {
        const deserializeResults = (a11yResults) => JSON.parse(JSON.stringify(a11yResults)) as A11yResult[];
        const a11yResults = A11yResult.convert(violations);
        expect(deserializeResults(a11yResults)).toEqual(a11yResults);

        // Add a non-serializable property to A11yResult (E.g. a function)
        a11yResults.map(
            (a11yResult) =>
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore TS2339: Property 'foo' does not exist on type 'A11yResult'.
                (a11yResult.foo = () => {
                    return 'foo';
                })
        );
        expect(deserializeResults(a11yResults)).not.toEqual(a11yResults);
    });
});

describe('a11y results processing', () => {
    it('should sort a11y issues by impact', () => {
        A11yResult.sort(a11yIssues);
        expect(a11yIssues[0].impact).toEqual('critical');
        expect(a11yIssues[1].impact).toEqual('critical');
        expect(a11yIssues[2].impact).toEqual('moderate');
        expect(a11yIssues[3].impact).toBeUndefined(); // Sort by "defaultImpact"
        expect(a11yIssues[4].impact).toBeUndefined();
        expect(a11yIssues[5].impact).toEqual('minor');
    });

    it('should consolidate violations', () => {
        expect(violations.length).toBeGreaterThan(0);
        expect(ConsolidatedResults.add(violations)).toHaveLength(violations.length);
    });

    it('should not add the same violations again', () => {
        expect(ConsolidatedResults.add(violations)).toHaveLength(violations.length);
        expect(ConsolidatedResults.add(violations)).toHaveLength(0);
        expect(ConsolidatedResults.add(violations.concat(violations))).toHaveLength(0);
    });

    it('should not add a single duplicate violation', () => {
        expect(ConsolidatedResults.add(violations)).toHaveLength(violations.length);
        const violation = violations.pop();
        // Shouldn't add an individual duplicate violation
        expect(ConsolidatedResults.add([violation])).toHaveLength(0);

        // Shouldn't add modified violations (after a result is removed)
        expect(ConsolidatedResults.add(violations)).toHaveLength(0);

        // Should add the result copy with diff id
        const newViolationId = { ...violation }; // Create a copy
        newViolationId.id = 'nonExistentID';
        expect(ConsolidatedResults.add([newViolationId])).toHaveLength(1);
        expect(ConsolidatedResults.add([newViolationId])).toHaveLength(0);

        // Should add the result copy with diff CSS selector
        expect(violation.nodes[0].target.length).toBeGreaterThan(0);
        const newViolationCss = JSON.parse(JSON.stringify(violation)) as typeof violation; // Create a copy
        // Copy should not get added as it is identical
        expect(ConsolidatedResults.add([newViolationCss])).toHaveLength(0);
        // Changing a CSS selector in the copy should add the violation
        newViolationCss.nodes[0].target.push('nonExistentCssSelector');
        expect(ConsolidatedResults.add([newViolationCss])).toHaveLength(1);
        expect(ConsolidatedResults.add([newViolationCss])).toHaveLength(0);
    });
});
