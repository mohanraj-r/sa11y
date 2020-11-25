/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as axe from 'axe-core';
import { BrowserObject, MultiRemoteBrowserObject } from 'webdriverio';
import { A11yConfig, recommended } from '@sa11y/preset-rules';
import { A11yError } from '@sa11y/format';
import { AxeResults, getViolations } from '@sa11y/common';

export const axeVersion: string | undefined = axe.version;

type WDIOBrowser = BrowserObject | MultiRemoteBrowserObject;

/**
 * Return version of axe injected into browser
 */
export async function getAxeVersion(driver: WDIOBrowser): Promise<typeof axeVersion> {
    return driver.execute(() => {
        return typeof axe === 'object' ? axe.version : undefined;
    });
}

/**
 * Load axe source into browser if it is not already loaded and return version of axe
 */
export async function loadAxe(driver: WDIOBrowser): Promise<void> {
    if ((await getAxeVersion(driver)) !== axeVersion) {
        await driver.execute(axe.source);
    }

    if ((await getAxeVersion(driver)) !== axeVersion) {
        throw new Error('Unable to load axe');
    }
}

/**
 * Load and run axe in given WDIO instance and return the accessibility violations found.
 */
export async function runAxe(driver: WDIOBrowser, rules: A11yConfig = recommended): Promise<AxeResults> {
    await loadAxe(driver);

    // TODO (chore): Fix lint error
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    //   error TS2345: Argument of type
    //      '(rules: A11yConfig, done: CallableFunction) => void' is not assignable to
    //      parameter of type 'string | ((arguments_0: A11yConfig) => void)'.
    //   Type '(rules: A11yConfig, done: CallableFunction) => void' is not assignable to
    //      type '(arguments_0: A11yConfig) => void'.
    // run axe inside browser and return violations
    return (await driver.executeAsync((rules: A11yConfig, done: CallableFunction) => {
        axe.run(document, rules, (err: Error, results: axe.AxeResults) => {
            if (err) throw err;
            done(results.violations);
        });
    }, rules)) as AxeResults;
}

/**
 * Verify that the currently loaded page in the browser is accessible.
 * Throw an error with the accessibility issues found if it is not accessible.
 * Asynchronous version of {@link assertAccessibleSync}
 * @param driver - WDIO browser instance navigated to page to be checked
 * @param rules - a11y preset-rules to be used for checking accessibility
 */
export async function assertAccessible(driver: WDIOBrowser = browser, rules: A11yConfig = recommended): Promise<void> {
    // TODO (feat): Add as custom commands to both browser for page level and elem
    //      https://webdriver.io/docs/customcommands.html
    const violations = await getViolations(() => runAxe(driver, rules));
    A11yError.checkAndThrow(violations);
}

/**
 * Verify that the currently loaded page in the browser is accessible.
 * Throw an error with the accessibility issues found if it is not accessible.
 * Synchronous version of {@link assertAccessible}
 * @param driver - WDIO browser instance navigated to page to be checked
 * @param rules - a11y preset-rules to be used for checking accessibility
 */
export function assertAccessibleSync(driver: WDIOBrowser = browser, rules: A11yConfig = recommended): void {
    // Note: https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-sync#switching-between-sync-and-async
    void driver.call(async () => {
        await assertAccessible(driver, rules);
    });
}
