import type { Page } from '@optimarvin/opti-webex-api-client';

/**
 * Represents a condition rule for URL matching
 */
interface ConditionRule {
    type: string;
    match_type: 'simple' | 'exact' | 'regex' | 'substring';
    value: string;
}

/**
 * Represents a logical condition tree (can be nested with and/or operators)
 */
type ConditionTree = ConditionRule | ['and' | 'or', ...ConditionTree[]];

/**
 * Normalizes a URL for simple match type:
 * - Removes protocol (http:// or https://)
 * - Removes query parameters
 * - Removes hash fragments
 * - Converts to lowercase
 */
function normalizeUrlForSimpleMatch(url: string): string {
    let normalized = url.toLowerCase();

    // Remove protocol
    normalized = normalized.replace(/^https?:\/\//, '');

    // Remove query parameters and hash
    normalized = normalized.split('?')[0].split('#')[0];

    return normalized;
}

/**
 * Normalizes a URL for substring match type:
 * - Removes protocol (http:// or https://)
 * - Removes trailing slashes
 * - Converts to lowercase
 * - Keeps subdomains, subdirectories, extensions, query and hash parameters
 */
function normalizeUrlForSubstringMatch(url: string): string {
    let normalized = url.toLowerCase();

    // Remove protocol
    normalized = normalized.replace(/^https?:\/\//, '');

    // Remove trailing slashes
    normalized = normalized.replace(/\/+$/, '');

    return normalized;
}

/**
 * Evaluates a single condition rule against a URL
 *
 * Match types:
 * - simple: Ignores protocol, query params, hash. Case-insensitive. For single pages.
 * - exact: Must match exactly. Case-insensitive.
 * - substring: Matches if URL contains value anywhere. Ignores protocol and trailing slashes. Case-insensitive.
 * - regex: Regular expression match. Case-sensitive.
 */
function evaluateRule(rule: ConditionRule, url: string): boolean {
    if (rule.type !== 'url') {
        // Only URL type conditions are supported for now
        // Other types (device_type, etc.) would need additional context
        return false;
    }

    const { match_type, value } = rule;

    switch (match_type) {
        case 'simple': {
            // Simple match: ignores protocol, query params, and hash
            const normalizedUrl = normalizeUrlForSimpleMatch(url);
            const normalizedValue = normalizeUrlForSimpleMatch(value);
            return normalizedUrl === normalizedValue;
        }

        case 'exact': {
            // Exact match: case-insensitive exact comparison
            return url.toLowerCase() === value.toLowerCase();
        }

        case 'substring': {
            // Substring match: ignores protocol and trailing slashes
            const normalizedUrl = normalizeUrlForSubstringMatch(url);
            const normalizedValue = normalizeUrlForSubstringMatch(value);
            return normalizedUrl.includes(normalizedValue);
        }

        case 'regex': {
            // RegEx match: case-sensitive
            try {
                const regex = new RegExp(value);
                return regex.test(url);
            } catch (error) {
                console.error('Invalid regex pattern:', value, error);
                return false;
            }
        }

        default:
            console.warn('Unknown match_type:', match_type);
            return false;
    }
}

/**
 * Evaluates a condition tree against a URL
 */
function evaluateConditionTree(conditions: ConditionTree, url: string): boolean {
    // If conditions is a simple rule object
    if (!Array.isArray(conditions)) {
        return evaluateRule(conditions as ConditionRule, url);
    }

    // If conditions is an array, first element should be an operator
    const [operator, ...children] = conditions;

    if (operator === 'and') {
        // All children must match
        return children.every(child => evaluateConditionTree(child, url));
    }

    if (operator === 'or') {
        // At least one child must match
        return children.some(child => evaluateConditionTree(child, url));
    }

    // Unknown operator or malformed condition
    console.warn('Unknown operator or malformed condition:', operator);
    return false;
}

/**
 * Filters pages to find those whose conditions match the given URL
 */
export function filterMatchingPages(pages: Page[], url: string): Page[] {
    return pages.filter(page => {
        // If no conditions, skip this page
        if (!page.conditions) {
            return false;
        }

        try {
            // Handle both object and string conditions
            let conditions = page.conditions;
            if (typeof conditions === 'string') {
                conditions = JSON.parse(conditions);
            }

            return evaluateConditionTree(conditions, url);
        } catch (error) {
            console.error('Error evaluating conditions for page:', page.name, error);
            return false;
        }
    });
}

/**
 * Checks if a single page matches the given URL
 */
export function doesPageMatch(page: Page, url: string): boolean {
    if (!page.conditions) {
        return false;
    }

    try {
        let conditions = page.conditions;
        if (typeof conditions === 'string') {
            conditions = JSON.parse(conditions);
        }

        return evaluateConditionTree(conditions, url);
    } catch (error) {
        console.error('Error evaluating conditions for page:', page.name, error);
        return false;
    }
}
