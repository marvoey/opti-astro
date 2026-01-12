import type { APIRoute } from 'astro';
import { CMPWebhookHandler } from '@optimarvin/opti-cmp-client';
import { OptiCmsClient } from '@optimarvin/opti-cms-client';
import { formatUuid, removeDashes } from '../../../lib/string-utils';
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

// Validate environment variables at module load time
// This ensures failures happen early rather than during webhook processing
const CMP_API_BASE_URL = import.meta.env.CMP_API_BASE_URL;
const CMP_OAUTH_CLIENT_ID = import.meta.env.CMP_OAUTH_CLIENT_ID;
const CMP_OAUTH_CLIENT_SECRET = import.meta.env.CMP_OAUTH_CLIENT_SECRET;
const CMP_AUTH_SERVER_URL = import.meta.env.CMP_AUTH_SERVER_URL;
const CMP_PREVIEW_URL = import.meta.env.CMP_PREVIEW_URL;
const OPTIMIZELY_GRAPH_APP_KEY = import.meta.env.OPTIMIZELY_GRAPH_APP_KEY;
const OPTIMIZELY_GRAPH_SECRET = import.meta.env.OPTIMIZELY_GRAPH_SECRET;
const OPTIMIZELY_GRAPH_GATEWAY = import.meta.env.OPTIMIZELY_GRAPH_GATEWAY;

if (!CMP_API_BASE_URL) {
    throw new Error('CMP_API_BASE_URL is not defined in .env file.');
}

if (!CMP_OAUTH_CLIENT_ID) {
    throw new Error('CMP_OAUTH_CLIENT_ID is not defined in .env file.');
}

if (!CMP_OAUTH_CLIENT_SECRET) {
    throw new Error('CMP_OAUTH_CLIENT_SECRET is not defined in .env file.');
}

if (!CMP_AUTH_SERVER_URL) {
    throw new Error('CMP_AUTH_SERVER_URL is not defined in .env file.');
}

if (!CMP_PREVIEW_URL) {
    throw new Error('CMP_PREVIEW_URL is not defined in .env file.');
}

/**
 * Initialize the CMP webhook handler with configuration from environment variables
 *
 * The handler encapsulates:
 * - OAuth client (for token management)
 * - CMP API client (for preview acknowledgment and completion)
 * - Preview URL generation logic
 *
 * Token caching is handled automatically by the library, avoiding unnecessary
 * OAuth requests on each webhook.
 */
const webhookHandler = new CMPWebhookHandler({
    clientId: CMP_OAUTH_CLIENT_ID,
    clientSecret: CMP_OAUTH_CLIENT_SECRET,
    authServerUrl: CMP_AUTH_SERVER_URL,
    apiBaseUrl: CMP_API_BASE_URL,
    previewUrl: CMP_PREVIEW_URL,
    // Optional: customize preview types if needed
    // previewTypes: ['default', 'mobile', 'desktop', 'tablet', 'signage']
});

/**
 * POST endpoint handler for CMP preview webhooks
 *
 * Webhook Payload Structure:
 * - data.preview_id: Unique identifier for this preview request
 * - data.assets.structured_contents[0].id: Content ID
 * - data.assets.structured_contents[0].version_id: Content version ID
 * - data.assets.structured_contents[0].content_body.updated_by: User who triggered the preview
 * - data.assets.structured_contents[0].content_body.fields_version.content_hash: Hash for tracking content changes
 * - data.assets.structured_contents[0].content_body.fields: The actual content fields to preview
 *
 * The handler processes all protocol steps automatically:
 * 1. Parses and validates the webhook payload
 * 2. Acknowledges the preview request with CMP
 * 3. Generates preview URLs for all device types
 * 4. Submits completion with the generated URLs
 *
 * Returns:
 * - 200: Success with preview data (contentId, versionId, previewId, keyedPreviews)
 * - 400: Invalid payload or missing required fields
 * - 500: Internal error during processing (OAuth, API calls, etc.)
 */
export const POST: APIRoute = async ({ request }) => {
    console.log('Received CMP preview webhook request');
    console.log('Content-Type:', request.headers.get('content-type'));

    try {
        // Get the raw body text from the request
        const rawBody = await request.text();
        console.log('Request body length:', rawBody.length);

        // Process the webhook using the handler
        // The handler will:
        // 1. Parse and validate the JSON payload
        // 2. Extract required fields (contentId, versionId, previewId, updatedBy, contentHash)
        // 3. Call CMP acknowledgment API
        // 4. Generate preview URLs for all device types
        // 5. Call CMP completion API with the URLs
        // const result = await webhookHandler.handleWebhook(rawBody);

        const parsedPayload = webhookHandler.parsePayload(rawBody);
        // console.log('Parsed payload:', parsedPayload);
        // console.log('Parsed payload:', JSON.stringify(parsedPayload, null, 2));
        // console.log('Content type:', JSON.stringify(parsedPayload.data?.assets?.structured_contents?.[0]?.content_body?.fields_version?.fields, null, 2));

        // Verify structured_contents is not empty
        if (
            !parsedPayload.data?.assets?.structured_contents ||
            parsedPayload.data.assets.structured_contents.length === 0
        ) {
            console.log(
                'Skipping webhook: structured_contents is empty or missing'
            );
            return new Response(null, { status: 200 });
        }

        // Only acknowledge for saas_cms_content
        if (
            parsedPayload.data?.assets?.structured_contents?.[0]?.content_body
                ?.content_type?.api_identifier !== 'saas_cms_content'
        ) {
            console.log(
                'Skipping webhook: content type is not saas_cms_content'
            );
            return new Response(null, { status: 200 });
        }

        console.log(
            'Acknowledge preview for Content type:',
            parsedPayload.data?.assets?.structured_contents?.[0]?.content_body
                ?.content_type.api_identifier
        );

        // Take the preview requested payload and create draft content for the CMS.

        // Validate required environment variables for CMS client
        const OPTIMIZELY_CLIENT_ID = import.meta.env.OPTIMIZELY_CLIENT_ID;
        const OPTIMIZELY_CLIENT_SECRET = import.meta.env
            .OPTIMIZELY_CLIENT_SECRET;

        if (!OPTIMIZELY_CLIENT_ID) {
            console.error(
                'OPTIMIZELY_CLIENT_ID is not defined in environment variables'
            );
            return new Response(
                JSON.stringify({
                    error: 'Server configuration error: Missing CMS client ID',
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        if (!OPTIMIZELY_CLIENT_SECRET) {
            console.error(
                'OPTIMIZELY_CLIENT_SECRET is not defined in environment variables'
            );
            return new Response(
                JSON.stringify({
                    error: 'Server configuration error: Missing CMS client secret',
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        // Initialize CMS client with error handling
        let CMSClient: OptiCmsClient;
        try {
            console.log('Initializing OptiCmsClient...');
            CMSClient = new OptiCmsClient({
                credentials: {
                    clientId: OPTIMIZELY_CLIENT_ID,
                    clientSecret: OPTIMIZELY_CLIENT_SECRET,
                },
                version: 'preview3', // optional, defaults to 'preview3'
            });
            console.log('OptiCmsClient initialized successfully');
        } catch (error) {
            console.error('Failed to initialize OptiCmsClient:', error);
            return new Response(
                JSON.stringify({
                    error: 'Failed to initialize CMS client',
                    details:
                        error instanceof Error ? error.message : String(error),
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        // Now that we have a CMS client, we can proceed creating a draft in the CMS.
        // It is important to make sure we do not create multiple drafts for the same content version.
        // I am guessing we can use some sort of an id.
        const content_guid =
            parsedPayload.data?.assets?.structured_contents?.[0]?.content_body
                .content_guid;
        const formatted_content_guid = formatUuid(content_guid);
        console.log('Content GUID:', content_guid);
        console.log('Formatted Content GUID:', formatted_content_guid);

        // We have to first check and make sure the content does not already exist
        const contentId = removeDashes('945b9089-d5c8-4d1b-be25-31ca0adf8f60');

        console.log('Attempting to fetch content with ID:', contentId);

        // 1. Create a GraphQL client
        const extprevToken = Buffer.from(
            `${OPTIMIZELY_GRAPH_APP_KEY}:${OPTIMIZELY_GRAPH_SECRET}`
        ).toString('base64');
        console.log('Extprev Token (base64):', extprevToken);
        const optiGraphClient = new GraphQLClient(
            `${OPTIMIZELY_GRAPH_GATEWAY}/content/v2` + `?stored=true`, // enable cached templates
            {
                headers: {
                    Authorization: `Basic ${extprevToken}`,
                    'Content-Type': 'application/json',
                    'cg-stored-query': 'template',
                },
            }
        );

        // 2. Create a requester function
        const requester: Requester = async (doc, vars) => {
            const response = await optiGraphClient.rawRequest(
                print(doc),
                vars as any
            );
            return response.data as any;
        };

        // 3. Get the SDK
        const sdk = optiGraph(requester);

        // 4. Use the SDK methods to see if an articlePage already exists with the given guid
        const content = await sdk.articleByGuid({
            guid: formatted_content_guid,
        });
        if (content.ArticlePage?.total === 0) {
            console.log(
                `No content with GUID ${formatted_content_guid} exists. Begin draft creation.`
            );

            // Create draft content in the CMS based on the webhook payload
            try {
                // Extract fields from the webhook payload
                const fields =
                    parsedPayload.data?.assets?.structured_contents?.[0]
                        ?.content_body?.fields_version?.fields;

                if (!fields) {
                    console.error('No fields found in webhook payload');
                    return new Response(
                        JSON.stringify({
                            error: 'Invalid webhook payload: Missing fields',
                        }),
                        {
                            status: 400,
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                }

                // Build the ArticlePage content structure
                console.log('Fields:', JSON.stringify(fields, null, 2));
                const articlePageData = {
                    contentType: 'ArticlePage',
                    displayName: fields.heading[0].field_values[0].text_value,
                    status: 'draft',
                    locale: Locales.En,
                    owner: null,
                    container: '66876bb6a3504576a654e7ae5c05e789',
                    properties: {
                        Heading:
                            fields.heading[0].field_values[0].text_value || '',
                        SubHeading:
                            fields.subHeading[0].field_values[0].text_value ||
                            '',
                        Body:
                            fields.body[0].field_values[0].rich_text_value ||
                            '',
                        Guid: formatted_content_guid,
                        SeoSettings: {
                            GraphType: '-',
                        },
                    },
                };

                console.log(
                    'Creating draft ArticlePage:',
                    JSON.stringify(articlePageData, null, 2)
                );
                console.log('CMS Client Base URL:', CMSClient.getBaseUrl());
                console.log('CMS Client Version:', CMSClient.getVersion());
                console.log(
                    'Full endpoint URL will be:',
                    `${CMSClient.getBaseUrl()}/experimental/content`
                );

                // Create the draft content using the CMS client
                const createResponse =
                    await CMSClient.createContent(articlePageData);

                console.log(
                    'Draft creation response - Status:',
                    createResponse.status
                );
                console.log(
                    'Draft creation response - Data:',
                    JSON.stringify(createResponse.data, null, 2)
                );

                if (createResponse.status >= 400) {
                    console.error(
                        'Failed to create draft:',
                        createResponse.status,
                        createResponse.data
                    );
                    return new Response(
                        JSON.stringify({
                            error: 'Failed to create draft content',
                            status: createResponse.status,
                            details: createResponse.data,
                        }),
                        {
                            status: 500,
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                }

                console.log(
                    `Successfully created draft ArticlePage with GUID ${formatted_content_guid}`
                );
            } catch (error) {
                console.error('Exception during draft creation:', error);
                console.error('Error type:', error?.constructor?.name);
                console.error('Error details:', JSON.stringify(error, null, 2));

                // If it's an API error with status, include that info
                const errorResponse: any = {
                    error: 'Exception during draft creation',
                    details:
                        error instanceof Error ? error.message : String(error),
                };

                if (typeof error === 'object' && error !== null) {
                    if ('status' in error) errorResponse.status = error.status;
                    if ('title' in error) errorResponse.title = error.title;
                    if ('type' in error) errorResponse.type = error.type;
                    if ('details' in error)
                        errorResponse.apiDetails = error.details;
                    if ('errors' in error) errorResponse.errors = error.errors;
                }

                return new Response(JSON.stringify(errorResponse), {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            }
        } else {
            console.log(
                `Content with GUID ${formatted_content_guid} already exists. Skipping draft creation.`
            );
        }

        console.log('Fetched content:', JSON.stringify(content, null, 2));

        let articleContent;
        try {
            articleContent = await CMSClient.getContent(contentId);
            console.log('Fetch response - Status:', articleContent.status);
            console.log(
                'Fetch response - Data:',
                JSON.stringify(articleContent.data, null, 2)
            );
            console.log('Fetch response - ETag:', articleContent.etag);

            if (articleContent.status >= 400) {
                console.error(
                    'CMS returned error status:',
                    articleContent.status
                );
                console.error('Error data:', articleContent.data);
            }
        } catch (error) {
            console.error('Exception during getContent:', error);
            console.error('Error type:', error?.constructor?.name);
            console.error(
                'Error message:',
                error instanceof Error ? error.message : String(error)
            );
            console.error(
                'Error stack:',
                error instanceof Error ? error.stack : 'N/A'
            );

            // Check if it's a network timeout error
            if (
                error instanceof Error &&
                error.message.includes('fetch failed')
            ) {
                console.error(
                    'Network error detected - check authentication endpoint and credentials'
                );
            }

            return new Response(
                JSON.stringify({
                    error: 'Exception during CMS fetch',
                    details:
                        error instanceof Error ? error.message : String(error),
                    contentId: contentId,
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        // Get the content_hash
        const contentHash =
            parsedPayload.data?.assets?.structured_contents?.[0]?.content_body
                ?.fields_version?.content_hash;

        if (!contentHash) {
            console.error('Content hash is missing from webhook payload');
            return new Response(
                JSON.stringify({
                    error: 'Invalid webhook payload: Missing content_hash',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        console.log('Content hash:', contentHash);

        return new Response(
            JSON.stringify({
                message: 'Webhook received and parsed successfully',
                contentId:
                    parsedPayload.data?.assets?.structured_contents?.[0]?.id,
                previewId: parsedPayload.data?.preview_id,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const previewRequest =
            webhookHandler.parseWebhookPayload(parsedPayload);

        const result = {
            success: true,
            status: 200,
            error: null,
            data: {
                contentId: previewRequest.contentId,
                versionId: previewRequest.versionId,
                previewId: previewRequest.previewId,
            },
        };

        // Log the result for debugging
        if (result.success) {
            console.log('Preview webhook processed successfully:', result.data);
        } else {
            console.error('Preview webhook processing failed:', result.error);
        }

        // Return response based on result
        if (result.success) {
            return new Response(
                JSON.stringify({
                    message:
                        'Webhook received, preview acknowledged and completed successfully',
                    acknowledged: true,
                    completed: true,
                    contentId: result.data?.contentId,
                    versionId: result.data?.versionId,
                    previewId: result.data?.previewId,
                    keyedPreviews: result.data?.keyedPreviews,
                }),
                {
                    status: result.status,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        } else {
            return new Response(
                JSON.stringify({
                    error: result.error,
                }),
                {
                    status: result.status,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }
    } catch (error) {
        // Catch any unexpected errors not handled by the library
        console.error('Unexpected error processing webhook:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to process webhook',
                details: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
};
