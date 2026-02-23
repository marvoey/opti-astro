/**
 * Domain alias resolution for multi-domain / local development support.
 *
 * Optimizely Graph stores content under the domain registered in the CMS app.
 * When this app is accessed from a different host (e.g. localhost:4321, a staging
 * alias), content lookups by URL would fail because the incoming origin doesn't
 * match any registered app domain.
 *
 * Set CMS_ORIGIN to the canonical domain registered in Optimizely, and
 * DOMAIN_ALIASES to a comma-separated list of incoming hosts that should resolve
 * to it:
 *
 *   CMS_ORIGIN=https://nice.optimarvin.com
 *   DOMAIN_ALIASES=localhost:4321,staging.mysite.com
 */

const CMS_ORIGIN = import.meta.env.CMS_ORIGIN as string | undefined;
const DOMAIN_ALIASES_RAW = import.meta.env.DOMAIN_ALIASES as string | undefined;

function buildAliasSet(): Set<string> {
    if (!DOMAIN_ALIASES_RAW) return new Set();
    return new Set(DOMAIN_ALIASES_RAW.split(',').map((h) => h.trim()).filter(Boolean));
}

const aliasSet = buildAliasSet();

/**
 * Resolve the CMS origin for a given request origin.
 *
 * If the incoming host is listed in DOMAIN_ALIASES, returns CMS_ORIGIN.
 * Otherwise returns the original request origin unchanged (production case).
 *
 * @param requestOrigin - Full origin of the incoming request e.g. "http://localhost:4321"
 * @returns CMS origin to use in GraphQL $base queries e.g. "https://nice.optimarvin.com"
 */
export function resolveCmsOrigin(requestOrigin: string): string {
    if (!CMS_ORIGIN) return requestOrigin;
    try {
        const host = new URL(requestOrigin).host;
        return aliasSet.has(host) ? CMS_ORIGIN : requestOrigin;
    } catch {
        return requestOrigin;
    }
}

/**
 * Resolve the CMS host (no scheme) for a given request host.
 * Convenience wrapper for callers that need just the host portion
 * (e.g. middleware placeholder queries).
 *
 * @param requestHost - Host of the incoming request e.g. "localhost:4321"
 * @returns CMS host to use in GraphQL queries e.g. "nice.optimarvin.com"
 */
export function resolveCmsHost(requestHost: string): string {
    if (!CMS_ORIGIN || !aliasSet.has(requestHost)) return requestHost;
    try {
        return new URL(CMS_ORIGIN).host;
    } catch {
        return requestHost;
    }
}
