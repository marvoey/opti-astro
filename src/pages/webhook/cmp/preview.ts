import type { APIRoute } from 'astro';
import { CMPWebhookHandler } from '@optimarvin/opti-cmp-client';
import { OptiCmsClient } from '@optimarvin/opti-cms-client';
import { formatUuid } from '../../../lib/string-utils';
import {
    Locales,
    getSdk as optiGraph,
    type Requester,
} from '../../../../__generated/sdk';
import { GraphQLClient } from 'graphql-request';
import { print } from 'graphql';

/**
 * Optimizely CMP Preview Webhook Handler
 *
 * This endpoint implements the "Render Preview with Push Strategy" protocol for Optimizely CMP
 * using the @optimarvin/opti-cmp-client library.
 *
 * PROTOCOL OVERVIEW:
 * ------------------
 * Step 1: Webhook Delivery
 *   - CMP delivers a preview request webhook when content needs rendering preview
 *   - Webhook contains content data, version info, and preview ID
 *
 * Step 2: Acknowledgment
 *   - Preview generator acknowledges receipt after verifying it can handle the content type
 *   - Acknowledgment includes a content_hash from the webhook payload
 *   - CMP uses this hash as a digest signature to determine if previews have become outdated
 *
 * Step 3: Preview Generation
 *   - Generate preview URLs for multiple device types/channels
 *   - Preview types: default, mobile, desktop, tablet, signage
 *   - URLs follow pattern: CMP_PREVIEW_URL/preview/{type}/{contentId}
 *
 * Step 4: Completion
 *   - Submit preview links via the completion endpoint
 *   - Provide keyed_previews dictionary mapping preview types to URLs
 *
 * Step 5: Cleanup (TODO - not yet implemented)
 *   - Allow ~15 minutes before cleaning up draft content
 *   - CMP caches the URL for an indefinite period
 *
 * IMPLEMENTATION NOTES:
 * ---------------------
 * This implementation uses the @optimarvin/opti-cmp-client library which handles:
 * - OAuth token management with automatic caching
 * - Webhook payload parsing and validation
 * - Preview acknowledgment with CMP
 * - Preview URL generation for multiple device types
 * - Completion submission to CMP
 *
 * For the original 410-line implementation, see: cmp-preview-webhook.old.ts
 */

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

function validateEnvVar(name: string, value: string | undefined): string {
    if (!value) {
        throw new Error(`${name} is not defined in .env file.`);
    }
    return value;
}

const CMP_API_BASE_URL = validateEnvVar(
    'CMP_API_BASE_URL',
    import.meta.env.CMP_API_BASE_URL
);
const CMP_OAUTH_CLIENT_ID = validateEnvVar(
    'CMP_OAUTH_CLIENT_ID',
    import.meta.env.CMP_OAUTH_CLIENT_ID
);
const CMP_OAUTH_CLIENT_SECRET = validateEnvVar(
    'CMP_OAUTH_CLIENT_SECRET',
    import.meta.env.CMP_OAUTH_CLIENT_SECRET
);
const CMP_AUTH_SERVER_URL = validateEnvVar(
    'CMP_AUTH_SERVER_URL',
    import.meta.env.CMP_AUTH_SERVER_URL
);
const CMP_PREVIEW_URL = validateEnvVar(
    'CMP_PREVIEW_URL',
    import.meta.env.CMP_PREVIEW_URL
);
const OPTIMIZELY_GRAPH_APP_KEY = validateEnvVar(
    'OPTIMIZELY_GRAPH_APP_KEY',
    import.meta.env.OPTIMIZELY_GRAPH_APP_KEY
);
const OPTIMIZELY_GRAPH_SECRET = validateEnvVar(
    'OPTIMIZELY_GRAPH_SECRET',
    import.meta.env.OPTIMIZELY_GRAPH_SECRET
);
const OPTIMIZELY_GRAPH_GATEWAY = validateEnvVar(
    'OPTIMIZELY_GRAPH_GATEWAY',
    import.meta.env.OPTIMIZELY_GRAPH_GATEWAY
);
const OPTIMIZELY_CLIENT_ID = validateEnvVar(
    'OPTIMIZELY_CLIENT_ID',
    import.meta.env.OPTIMIZELY_CLIENT_ID
);
const OPTIMIZELY_CLIENT_SECRET = validateEnvVar(
    'OPTIMIZELY_CLIENT_SECRET',
    import.meta.env.OPTIMIZELY_CLIENT_SECRET
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Initialize and return a GraphQL SDK instance for querying Optimizely Graph
 */
function getGraphQLSdk() {
    const token = Buffer.from(
        `${OPTIMIZELY_GRAPH_APP_KEY}:${OPTIMIZELY_GRAPH_SECRET}`
    ).toString('base64');

    const client = new GraphQLClient(
        `${OPTIMIZELY_GRAPH_GATEWAY}/content/v2?stored=true`,
        {
            headers: {
                Authorization: `Basic ${token}`,
                'Content-Type': 'application/json',
                'cg-stored-query': 'template',
            },
        }
    );

    const requester: Requester = async (doc, vars) => {
        const response = await client.rawRequest(print(doc), vars as any);
        return response.data as any;
    };

    return optiGraph(requester);
}

/**
 * Initialize and return a CMS client instance
 */
function getCmsClient(): OptiCmsClient {
    return new OptiCmsClient({
        credentials: {
            clientId: OPTIMIZELY_CLIENT_ID,
            clientSecret: OPTIMIZELY_CLIENT_SECRET,
        },
        version: 'preview3',
    });
}

/**
 * Check if content already exists in the CMS by GUID
 */
async function contentExistsByGuid(
    sdk: ReturnType<typeof getGraphQLSdk>,
    guid: string
): Promise<boolean> {
    const formattedGuid = formatUuid(guid);
    const content = await sdk.articleByGuid({ guid: formattedGuid });
    return (content.ArticlePage?.total ?? 0) > 0;
}

/**
 * Create a draft ArticlePage in the CMS from CMP webhook fields
 */
async function createDraftArticle(
    cmsClient: OptiCmsClient,
    fields: any,
    contentGuid: string
): Promise<void> {
    const formattedGuid = formatUuid(contentGuid);

    const articlePageData = {
        contentType: 'ArticlePage',
        displayName:
            fields.heading?.[0]?.field_values?.[0]?.text_value || 'Untitled',
        status: 'draft',
        locale: Locales.En,
        owner: null,
        // container: '66876bb6a3504576a654e7ae5c05e789',
        container: 'ffc6498c45bc47c5a150e6e7d2a1d931',
        properties: {
            Heading: fields.heading?.[0]?.field_values?.[0]?.text_value || '',
            SubHeading:
                fields.subHeading?.[0]?.field_values?.[0]?.text_value || '',
            Body: fields.body?.[0]?.field_values?.[0]?.rich_text_value || '',
            Guid: formattedGuid,
            PromoImage: `cms://content/${fields.featuredImage?.[0]?.field_values?.[0]?.asset_guid}`,
            SeoSettings: {
                GraphType: '-',
            },
        },
    };

    console.log(
        'Creating draft ArticlePage:',
        JSON.stringify(articlePageData, null, 2)
    );

    const response = await cmsClient.createContent(articlePageData);

    if (response.status >= 400) {
        throw new Error(
            `Failed to create draft: ${response.status} - ${JSON.stringify(response.data)}`
        );
    }

    console.log(
        `Successfully created draft ArticlePage with GUID ${formattedGuid}`
    );
}

// ============================================================================
// CMP WEBHOOK HANDLER INITIALIZATION
// ============================================================================

/**
 * Initialize the CMP webhook handler with configuration from environment variables
 */
const webhookHandler = new CMPWebhookHandler({
    clientId: CMP_OAUTH_CLIENT_ID,
    clientSecret: CMP_OAUTH_CLIENT_SECRET,
    authServerUrl: CMP_AUTH_SERVER_URL,
    apiBaseUrl: CMP_API_BASE_URL,
    previewUrl: CMP_PREVIEW_URL,
});

// ============================================================================
// WEBHOOK ENDPOINT
// ============================================================================

/**
 * POST endpoint handler for CMP preview webhooks
 *
 * Flow:
 * 1. Parse webhook payload from CMP
 * 2. Validate structured_contents exists
 * 3. Validate content type is 'saas_cms_content'
 * 3.5. Acknowledge preview request with CMP
 * 4. Extract content GUID and fields
 * 5. Check if content already exists in CMS by GUID
 * 6. Create draft ArticlePage if it doesn't exist
 * 7. Return success response
 *
 * Returns:
 * - 200: Success - webhook processed and acknowledged
 * - 400: Invalid payload or missing required fields
 * - 500: Internal error during processing
 */
export const POST: APIRoute = async ({ request }) => {
    console.log('Received CMP preview webhook request');
    console.log('Content-Type:', request.headers.get('content-type'));

    try {
        // ========================================================================
        // STEP 1: Parse webhook payload
        // ========================================================================
        const rawBody = await request.text();
        console.log('Request body length:', rawBody.length);

        const parsedPayload = webhookHandler.parsePayload(rawBody);

        // ========================================================================
        // STEP 2: Validate structured_contents exists
        // ========================================================================
        if (
            !parsedPayload.data?.assets?.structured_contents ||
            parsedPayload.data.assets.structured_contents.length === 0
        ) {
            console.log(
                'Skipping webhook: structured_contents is empty or missing'
            );
            return new Response(null, { status: 200 });
        }

        const structuredContent =
            parsedPayload.data.assets.structured_contents[0];

        // ========================================================================
        // STEP 3: Only process saas_cms_content type
        // ========================================================================
        if (
            structuredContent?.content_body?.content_type?.api_identifier !==
            'saas_cms_content'
        ) {
            console.log(
                'Skipping webhook: content type is not saas_cms_content'
            );
            return new Response(null, { status: 200 });
        }

        console.log('Processing saas_cms_content type');

        // ========================================================================
        // STEP 3.5: Acknowledge preview request with CMP
        // ========================================================================
        try {
            // Extract required fields for acknowledgment
            const contentId = structuredContent.id;
            const versionId = structuredContent.version_id;
            const previewId = parsedPayload.data?.preview_id;
            const acknowledgedBy = structuredContent.content_body?.updated_by;
            const contentHash =
                structuredContent.content_body?.fields_version?.content_hash;

            // Log the extracted values for debugging
            console.log('Extracted acknowledgment fields:', {
                contentId,
                versionId,
                previewId,
                acknowledgedBy,
                contentHash: contentHash
                    ? `${contentHash.substring(0, 20)}...`
                    : undefined,
            });

            // Validate all required fields are present
            if (
                !contentId ||
                !versionId ||
                !previewId ||
                !acknowledgedBy ||
                !contentHash
            ) {
                console.error('Missing required fields for acknowledgment:', {
                    contentId,
                    versionId,
                    previewId,
                    acknowledgedBy,
                    contentHash,
                });
                return new Response(
                    JSON.stringify({
                        error: 'Invalid webhook payload: Missing required fields for acknowledgment',
                        missing: {
                            contentId: !contentId,
                            versionId: !versionId,
                            previewId: !previewId,
                            acknowledgedBy: !acknowledgedBy,
                            contentHash: !contentHash,
                        },
                    }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }

            console.log('Acknowledging preview request:', {
                contentId,
                versionId,
                previewId,
                acknowledgedBy,
                contentHash,
            });

            // Get CMP client and acknowledge the preview
            const cmpClient = webhookHandler.getClient();
            const acknowledgmentResult = await cmpClient.acknowledgePreview(
                contentId,
                versionId,
                previewId,
                acknowledgedBy,
                contentHash
            );

            console.log('Preview acknowledged successfully');
            console.log('Acknowledgment result:', acknowledgmentResult);
        } catch (error) {
            console.error(
                'Failed to acknowledge preview - Full error details:',
                {
                    error: error,
                    message:
                        error instanceof Error ? error.message : String(error),
                    name:
                        error instanceof Error
                            ? error.constructor.name
                            : typeof error,
                    statusCode: (error as any)?.statusCode,
                    status: (error as any)?.status,
                    response: (error as any)?.response,
                    details: (error as any)?.details,
                    stack: error instanceof Error ? error.stack : undefined,
                }
            );

            return new Response(
                JSON.stringify({
                    error: 'Failed to acknowledge preview with CMP',
                    message:
                        error instanceof Error ? error.message : String(error),
                    statusCode:
                        (error as any)?.statusCode || (error as any)?.status,
                    details: (error as any)?.details,
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // ========================================================================
        // STEP 4: Extract content GUID and fields
        // ========================================================================
        const contentGuid = structuredContent.content_body.content_guid;
        const fields = structuredContent.content_body?.fields_version?.fields;

        if (!contentGuid) {
            console.error('Content GUID is missing from webhook payload');
            return new Response(
                JSON.stringify({
                    error: 'Invalid webhook payload: Missing content_guid',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        if (!fields) {
            console.error('Fields are missing from webhook payload');
            return new Response(
                JSON.stringify({
                    error: 'Invalid webhook payload: Missing fields',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        console.log('Content GUID:', contentGuid);
        console.log('Formatted Content GUID:', formatUuid(contentGuid));

        // ========================================================================
        // STEP 5: Check if content already exists
        // ========================================================================
        const sdk = getGraphQLSdk();
        const exists = await contentExistsByGuid(sdk, contentGuid);

        if (exists) {
            console.log(
                `Content with GUID ${formatUuid(contentGuid)} already exists. Skipping draft creation.`
            );
        } else {
            console.log(
                `No content with GUID ${formatUuid(contentGuid)} exists. Creating draft.`
            );

            // ====================================================================
            // STEP 6: Create draft ArticlePage
            // ====================================================================
            const cmsClient = getCmsClient();
            await createDraftArticle(cmsClient, fields, contentGuid);
        }

        // ========================================================================
        // STEP 7: Return success response
        // ========================================================================
        return new Response(
            JSON.stringify({
                message: 'Webhook received and processed successfully',
                contentId: structuredContent.id,
                previewId: parsedPayload.data?.preview_id,
                guid: formatUuid(contentGuid),
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Unexpected error processing webhook:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to process webhook',
                details: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
};
