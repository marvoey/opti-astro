/**
 * CMS Client Module
 *
 * Provides CMS client initialization for interacting with Optimizely CMS
 */

import { OptiCmsClient } from '@optimarvin/opti-cms-client';
import {
    OPTIMIZELY_CLIENT_ID,
    OPTIMIZELY_CLIENT_SECRET,
} from './env-config';

/**
 * Initialize and return a CMS client instance
 */
export function getCmsClient(): OptiCmsClient {
    return new OptiCmsClient({
        credentials: {
            clientId: OPTIMIZELY_CLIENT_ID,
            clientSecret: OPTIMIZELY_CLIENT_SECRET,
        },
        version: 'preview3',
    });
}
