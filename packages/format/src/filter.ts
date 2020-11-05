/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Result } from 'axe-core';

/**
 * Filter to post-process a11y results from axe
 */
export interface Filter {
    (violations: Result[], ...args: never[]): Result[];
}

// TODO (refactor): constrain rule id to known rule ids e.g using string literal, keyof, in etc
//  e.g. https://stackoverflow.com/a/54061487
// const ruleIDs = getRules().map((ruleObj) => ruleObj.ruleId);
// type RuleID = keyof ruleIDs;
// type RuleID = typeof ruleIDs[number];
type RuleID = string;
type CssSelectors = string[];

/**
 * Exception list of map of rule to corresponding css targets that needs to be filtered from a11y results.
 */
export type ExceptionList = Record<RuleID, CssSelectors>;

/**
 * Filter a11y violations from axe based on given {@link ExceptionList}
 * @param violations - List of violations found with axe
 * @param exceptionList - {@link ExceptionList} of map of rule to corresponding css targets that needs to be filtered from a11y results
 */
export function exceptionListFilter(violations: readonly Result[], exceptionList: ExceptionList = {}): Result[] {
    const exceptionRules = Object.keys(exceptionList);
    if (exceptionRules.length === 0) return violations as Result[];

    const filteredViolations: Result[] = [];

    for (const violation of violations) {
        if (!exceptionRules.includes(violation.id)) {
            filteredViolations.push(violation);
        } else {
            for (const result of violation.nodes) {
                const filteredResults = result.target.filter(
                    (cssSelector) => !exceptionList[violation.id].includes(cssSelector)
                );
                if (filteredResults.length > 0) {
                    filteredViolations.push(violation);
                }
            }
        }
    }

    return filteredViolations;
}
