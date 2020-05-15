/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Result } from 'axe-core';
import * as Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

/**
 * Formatter defines the function signature to format accessibility violations found by axe
 */
export interface Formatter {
    (violations: Result[]): string;
}

/**
 * Read template from filesystem and pre-compile it
 */
export async function readTemplate() {
    // TODO (type):  error TS2304: Cannot find name 'TemplateSpecification'
    // export async function readTemplate(): Promise<TemplateSpecification> {
    return new Promise((resolve, reject) => {
        // TODO (Debug): Loading in compiled template file instead without needing to use 'fs' module doesn't work
        // TODO (script): Add run script to generate compiled template: "yarn handlebars `pwd`/template.mustache -f `pwd`/template.compiled.js --knownOnly"
        // return require('./template.compiled.js');
        // TODO (Refactor): When bundling for browser use https://handlebarsjs.com/installation/integrations.html
        fs.readFile(path.resolve(__dirname, './template.mustache'), (err, data) => {
            if (err) reject(err);
            resolve(Handlebars.precompile(data.toString()));
        });
    });
}

/**
 * Format accessibility results from axe
 * @param violations - Result list from axe
 * */
// TODO: Add handlebars template for formatting
// TODO: Add support for different output formats console(colored), plain text, HTML, xUnit
export function a11yResultsFormatter(violations: Result[]): string {
    return violations
        .map((violation) => {
            return violation.nodes
                .map((node) => {
                    const selectors = node.target.join(', ');
                    return `${violation.help} (${violation.id}): ${selectors}\n  - More info: ${violation.helpUrl}`;
                })
                .join('\n\n');
        })
        .join('\n\n');
}
