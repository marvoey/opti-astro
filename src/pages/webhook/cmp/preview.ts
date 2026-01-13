import type { APIRoute } from 'astro';
import { CMPWebhookHandler } from '@optimarvin/opti-cmp-client';
import { formatUuid } from '../../../lib/string-utils';
import {
    CMP_API_BASE_URL,
    CMP_OAUTH_CLIENT_ID,
    CMP_OAUTH_CLIENT_SECRET,
    CMP_AUTH_SERVER_URL,
    CMP_PREVIEW_URL,
} from './env-config';
import { getGraphQLSdk } from './graphql-client';
import { getCmsClient } from './cms-client';
import { contentExistsByGuid, createDraftArticle } from './content-operations';

/**
 * Optimizely CMP Preview Webhook Handler
 *
 * This endpoint handles preview request webhooks from Optimizely CMP, creates
 * draft content in the Optimizely CMS, and submits preview URLs back to CMP.
 *
 * WEBHOOK FLOW:
 * -------------
 * 1. Webhook Delivery
 *    - CMP delivers a preview request webhook containing content data, version info, and preview ID
 *    - Webhook includes structured_contents with content type and field values
 *
 * 2. Payload Validation
 *    - Validates structured_contents exists in payload
 *    - Only processes content with type 'saas_cms_content'
 *    - Skips other content types with 200 OK response
 *
 * 3. Preview Acknowledgment
 *    - Acknowledges receipt with CMP using content_hash, content_id, version_id, and preview_id
 *    - CMP uses content_hash as digest signature to detect outdated previews
 *    - Returns 400 if required acknowledgment fields are missing
 *    - Returns 500 if acknowledgment request to CMP fails
 *
 * 4. Content GUID & Locale Extraction
 *    - Extracts content_guid and field values from webhook payload
 *    - Formats GUID to match CMS format (with hyphens)
 *    - Extracts locale from webhook field values (defaults to 'en')
 *
 * 5. Duplicate Check
 *    - Queries Optimizely Graph to check if content with GUID already exists
 *    - Skips draft creation if content already exists in CMS
 *
 * 6. Draft Content Creation
 *    - Creates draft ArticlePage in CMS with content from CMP fields:
 *      * Heading (displayName and Heading property)
 *      * SubHeading
 *      * Body (rich text)
 *      * Featured Image (as PromoImage)
 *      * GUID (for tracking)
 *    - Sets status to 'draft' and locale from webhook
 *    - Places content in configured container
 *    - Returns the created content with ID and URL
 *
 * 7. Task Details Retrieval
 *    - Extracts task ID from webhook payload (data.task.id)
 *    - Calls CMP API GET /tasks/{id} to fetch task details
 *    - Extracts preview domain from task data (checks multiple field names)
 *    - Validates domain includes protocol, normalizes if needed
 *    - Returns 400 if task ID missing, 500 if API call fails
 *
 * 8. Preview URL Generation & Submission
 *    - Uses domain from task data to generate preview URLs:
 *      * Draft: {domain}/preview?key={contentId}&ver=&loc={locale}&ctx=edit
 *      * Published: {domain}{contentUrl} (from CMS response)
 *    - Submits preview URLs to CMP with keys 'draft' and 'published'
 *    - Non-blocking: Does not fail request if preview submission fails
 *
 * 9. Success Response
 *    - Returns 200 OK with content_id, preview_id, and formatted GUID
 *
 * IMPLEMENTATION NOTES:
 * ---------------------
 * This implementation uses the @optimarvin/opti-cmp-client library which provides:
 * - CMPWebhookHandler: Handles OAuth token management and webhook payload parsing
 * - CMPClient: Provides acknowledgePreview() and submitPreviewCompletion() methods
 *
 * Additionally uses:
 * - @optimarvin/opti-cms-client: OptiCmsClient for creating draft content in CMS
 * - GraphQL SDK: Queries Optimizely Graph to check for existing content
 *
 * LIMITATIONS:
 * ------------
 * - Currently only creates ArticlePage content type
 * - Only processes 'saas_cms_content' type from CMP
 * - Does not generate device-specific preview URLs (mobile, desktop, tablet, etc.)
 * - Does not clean up draft content after preview period
 */


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
 * 4. Extract content GUID, fields, and locale
 * 5. Check if content already exists in CMS by GUID
 * 6. Create draft ArticlePage if it doesn't exist
 * 7. Fetch task details from CMP API to get preview domain
 * 8. Generate preview URLs using task domain and submit to CMP
 * 9. Return success response
 *
 * Returns:
 * - 200: Success - webhook processed, draft created, and preview URLs submitted
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
            // console.log('Extracted acknowledgment fields:', {
            //     contentId,
            //     versionId,
            //     previewId,
            //     acknowledgedBy,
            //     contentHash: contentHash
            //         ? `${contentHash.substring(0, 20)}...`
            //         : undefined,
            // });

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

        // Extract locale from webhook fields (default to 'en' if not found)
        let locale =
            fields.heading?.[0]?.locale ||
            fields.subHeading?.[0]?.locale ||
            fields.body?.[0]?.locale ||
            'en';

        // Transform en_US to en for CMS compatibility
        if (locale === 'en_US') {
            locale = 'en';
        }

        console.log('Extracted locale:', locale);

        // ========================================================================
        // STEP 5: Check if content already exists
        // ========================================================================
        const sdk = getGraphQLSdk();
        const exists = await contentExistsByGuid(sdk, contentGuid);

        let createdContent: any = null;

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
            // container: '66876bb6a3504576a654e7ae5c05e789',
            // container: 'ffc6498c45bc47c5a150e6e7d2a1d931',
            const containerId = '2f85d26075e54a168a74b10a9c33fbdd';
            createdContent = await createDraftArticle(
                cmsClient,
                fields,
                contentGuid,
                locale,
                containerId
            );
            console.log('Draft content created:', JSON.stringify(createdContent, null, 2));
            const contentCreatedId = createdContent.id;
            console.log('Draft content ID:', contentCreatedId); 
            const contentCreatedRouteSegment = createdContent.routeSegment;
            console.log('Draft content route segment:', contentCreatedRouteSegment);
        }

        // ========================================================================
        // STEP 7: Fetch task details to get preview domain
        // ========================================================================
        const taskId = parsedPayload.data?.task?.id;

        if (!taskId) {
            console.error('Task ID is missing from webhook payload');
            return new Response(
                JSON.stringify({
                    error: 'Invalid webhook payload: Missing task ID',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        console.log('Fetching task details for ID:', taskId);

        let taskData;
        try {
            const cmpClient = webhookHandler.getClient();
            taskData = await cmpClient.getTask(taskId);
            console.log('Task data received - checking for domain field', JSON.stringify(taskData, null, 2));
        } catch (error) {
            console.error('Failed to fetch task details:', error);
            return new Response(
                JSON.stringify({
                    error: 'Failed to fetch task details from CMP',
                    message:
                        error instanceof Error ? error.message : String(error),
                    taskId: taskId,
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Extract domain from task data labels
        // Find the label with group.name === "Saas CMS Domain"
        const domainLabel = taskData.labels?.find(
            (label: any) => label.group?.name === 'Saas CMS Domain'
        );

        const previewDomain: unknown = domainLabel?.values?.[0]?.name;

        if (!previewDomain || typeof previewDomain !== 'string') {
            console.error(
                'Preview domain not found in task labels. Looking for label with group.name = "Saas CMS Domain"',
                { labels: taskData.labels }
            );
            return new Response(
                JSON.stringify({
                    error: 'Task data does not contain a valid preview domain in labels',
                    taskId: taskId,
                    labels: taskData.labels,
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // Ensure domain includes protocol (previewDomain is now confirmed to be a string)
        const normalizedDomain = (previewDomain as string).startsWith('http')
            ? previewDomain
            : `https://${previewDomain}`;

        console.log('Using preview domain:', normalizedDomain);

        // ========================================================================
        // STEP 8: Generate and submit preview URLs to CMP
        // ========================================================================

        if (createdContent) {
            console.log('Generating preview URLs...');

            const key = createdContent.key;
            const version = createdContent.version;
            const loc = createdContent.locale;
            const ctx = "ext_preview";
            
            // Build preview URLs using domain from task data
            // {host}/preview?key={key}&ver={version}&loc={locale}&ctx={context}
            const draftPreviewUrl = `${normalizedDomain}/preview?key=${key}&ver=${version}&loc=${loc}&ctx=${ctx}`;
            const publishedPreviewUrl = `${normalizedDomain}/cmp/${createdContent.routeSegment}`;
            
            console.log('Draft preview URL:', draftPreviewUrl);
            
            // Submit preview completion to CMP
            try {
                const cmpClient = webhookHandler.getClient();
                await cmpClient.submitPreviewCompletion(
                    structuredContent.id,
                    structuredContent.version_id,
                    parsedPayload.data?.preview_id,
                    {
                        draft: draftPreviewUrl,
                        published: publishedPreviewUrl,
                    }
                );

                console.log('Preview completion submitted successfully to CMP');
            } catch (error) {
                console.error('Failed to submit preview completion:', error);
                // Don't fail the entire request if preview submission fails
                // The content has already been created successfully
            }
        }

        // ========================================================================
        // STEP 9: Return success response
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
