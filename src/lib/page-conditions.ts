import type { Page } from '@optimarvin/opti-webex-api-client';

/**
 * Represents a condition rule for URL matching
 */
interface ConditionRule {
    type: string;
    match_type: 'simple' | 'exact' | 'regex' | 'substring' | 'contains';
    value: string;
}

/**
 * Represents a logical condition tree (can be nested with and/or operators)
 */
type ConditionTree = ConditionRule | ['and' | 'or', ...ConditionTree[]];

/**
 * Evaluates a single condition rule against a URL
 */
function evaluateRule(rule: ConditionRule, url: string): boolean {
    if (rule.type !== 'url') {
        // Only URL type conditions are supported for now
        // Other types (device_type, etc.) would need additional context
        return false;
    }

    const { match_type, value } = rule;
    const normalizedUrl = url.toLowerCase();
    const normalizedValue = value.toLowerCase();

    switch (match_type) {
        case 'exact':
            return normalizedUrl === normalizedValue;

        case 'simple':
        case 'substring':
        case 'contains':
            // Simple match checks if the URL contains the value
            return normalizedUrl.includes(normalizedValue);

        case 'regex':
            try {
                const regex = new RegExp(value, 'i');
                return regex.test(url);
            } catch (error) {
                console.error('Invalid regex pattern:', value, error);
                return false;
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
