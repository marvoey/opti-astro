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
 * Initialize the CMP webhook handler with configuration from environment variables
 */
const webhookHandler = new CMPWebhookHandler({
    clientId: CMP_OAUTH_CLIENT_ID,
    clientSecret: CMP_OAUTH_CLIENT_SECRET,
    authServerUrl: CMP_AUTH_SERVER_URL,
    apiBaseUrl: CMP_API_BASE_URL,
    previewUrl: CMP_PREVIEW_URL,
});

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
            const fetchedContent = await sdk.articleByGuid({ guid: formatUuid(contentGuid) });
            createdContent = {
                key: fetchedContent.ArticlePage?.item?._metadata?.key,
                version: fetchedContent.ArticlePage?.item?._metadata?.version,
                locale: fetchedContent.ArticlePage?.item?._metadata?.locale,
                routeSegment: fetchedContent.ArticlePage?.item?._metadata?.url?.default
            }
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

            // Log error but continue processing webhook
            console.warn('Continuing webhook processing despite acknowledgment failure');
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
            const publishedPreviewUrl = `${normalizedDomain}/${createdContent.routeSegment}`;
            
            console.log('Draft preview URL:', draftPreviewUrl);
            console.log('Published preview URL:', publishedPreviewUrl);
            
            // Submit preview completion to CMP
            try {
                const cmpClient = webhookHandler.getClient();
                const previewId = parsedPayload.data?.preview_id;
                const keyedPreviews = {
                    [`draft-${previewId}`]: draftPreviewUrl,
                    // [`published-${previewId}`]: publishedPreviewUrl,
                }
                console.log('Submitting preview completion with URLs:', keyedPreviews);
                await cmpClient.submitPreviewCompletion(
                    structuredContent.id,
                    structuredContent.version_id,
                    previewId,
                    {
                        [`draft-${previewId}`]: draftPreviewUrl,
                        [`published-${previewId}`]: publishedPreviewUrl,
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
