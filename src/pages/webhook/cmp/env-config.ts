/**
 * Environment Configuration Module
 *
 * Validates and exports environment variables required for CMP and CMS integration
 */

/**
 * Validates that an environment variable is defined
 * @throws Error if the environment variable is not defined
 */
function validateEnvVar(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(`${name} is not defined in .env file.`);
    }
    return value;
}

// CMP Configuration
export const CMP_API_BASE_URL = validateEnvVar(
    'CMP_API_BASE_URL',
    import.meta.env.CMP_API_BASE_URL
);

export const CMP_OAUTH_CLIENT_ID = validateEnvVar(
    'CMP_OAUTH_CLIENT_ID',
    import.meta.env.CMP_OAUTH_CLIENT_ID
);

export const CMP_OAUTH_CLIENT_SECRET = validateEnvVar(
    'CMP_OAUTH_CLIENT_SECRET',
    import.meta.env.CMP_OAUTH_CLIENT_SECRET
);

export const CMP_AUTH_SERVER_URL = validateEnvVar(
    'CMP_AUTH_SERVER_URL',
    import.meta.env.CMP_AUTH_SERVER_URL
);

export const CMP_PREVIEW_URL = validateEnvVar(
    'CMP_PREVIEW_URL',
    import.meta.env.CMP_PREVIEW_URL
);

// Optimizely Graph Configuration
export const OPTIMIZELY_GRAPH_APP_KEY = validateEnvVar(
    'OPTIMIZELY_GRAPH_APP_KEY',
    import.meta.env.OPTIMIZELY_GRAPH_APP_KEY
);

export const OPTIMIZELY_GRAPH_SECRET = validateEnvVar(
    'OPTIMIZELY_GRAPH_SECRET',
    import.meta.env.OPTIMIZELY_GRAPH_SECRET
);

export const OPTIMIZELY_GRAPH_GATEWAY = validateEnvVar(
    'OPTIMIZELY_GRAPH_GATEWAY',
    import.meta.env.OPTIMIZELY_GRAPH_GATEWAY
);

// Optimizely CMS Configuration
export const OPTIMIZELY_CLIENT_ID = validateEnvVar(
    'OPTIMIZELY_CLIENT_ID',
    import.meta.env.OPTIMIZELY_CLIENT_ID
);

export const OPTIMIZELY_CLIENT_SECRET = validateEnvVar(
    'OPTIMIZELY_CLIENT_SECRET',
    import.meta.env.OPTIMIZELY_CLIENT_SECRET
);
