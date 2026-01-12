import type { APIRoute } from 'astro';

/**
 * CMS Preview API Endpoint
 *
 * This endpoint accepts raw content/properties JSON via POST request and either:
 * 1. Returns the preview HTML directly
 * 2. Stores the data and returns a preview URL
 *
 * Expected POST body format:
 * {
 *   "contentType": "ArticlePage" | "Button" | "Hero" | etc.,
 *   "properties": { ... content properties ... },
 *   "locale": "en" (optional, defaults to "en"),
 *   "displayName": "My Content" (optional),
 *   "renderMode": "html" | "url" (optional, defaults to "url")
 * }
 *
 * Response formats:
 * - If renderMode === "url": { "previewUrl": "/cms/preview/render?id=..." }
 * - If renderMode === "html": HTML content directly
 */

// In-memory cache for preview data
// In production, consider using Redis or another persistent store
const previewCache = new Map<string, {
    data: PreviewData;
    expiresAt: number;
}>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of previewCache.entries()) {
        if (value.expiresAt < now) {
            previewCache.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface PreviewData {
    contentType: string;
    properties: Record<string, any>;
    locale?: string;
    displayName?: string;
}

interface PreviewRequest extends PreviewData {
    renderMode?: 'html' | 'url';
}

/**
 * POST endpoint handler
 */
export const POST: APIRoute = async ({ request, url }) => {
    console.log('[CMS Preview] Received POST request');

    try {
        // Parse the JSON body
        let requestData: PreviewRequest;
        try {
            requestData = await request.json();
        } catch (error) {
            console.error('[CMS Preview] Failed to parse JSON body:', error);
            return new Response(
                JSON.stringify({
                    error: 'Invalid JSON in request body',
                    details: error instanceof Error ? error.message : String(error),
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        // Validate required fields
        if (!requestData.contentType) {
            return new Response(
                JSON.stringify({
                    error: 'Missing required field: contentType',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        if (!requestData.properties || typeof requestData.properties !== 'object') {
            return new Response(
                JSON.stringify({
                    error: 'Missing or invalid required field: properties (must be an object)',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        // Extract data
        const {
            contentType,
            properties,
            locale = 'en',
            displayName = `Preview: ${contentType}`,
            renderMode = 'url',
        } = requestData;

        const previewData: PreviewData = {
            contentType,
            properties,
            locale,
            displayName,
        };

        console.log('[CMS Preview] Preview data:', {
            contentType,
            locale,
            displayName,
            propertiesKeys: Object.keys(properties),
        });

        // Generate a unique preview ID
        const previewId = generatePreviewId();

        // Store the preview data (expires in 15 minutes)
        const expiresAt = Date.now() + (15 * 60 * 1000);
        previewCache.set(previewId, {
            data: previewData,
            expiresAt,
        });

        console.log(`[CMS Preview] Stored preview data with ID: ${previewId}`);
        console.log(`[CMS Preview] Preview expires at: ${new Date(expiresAt).toISOString()}`);

        // Build the preview URL
        const previewUrl = `${url.origin}/cms/preview/render?id=${previewId}`;

        if (renderMode === 'html') {
            // TODO: Implement direct HTML rendering
            // For now, redirect to the preview URL
            return Response.redirect(previewUrl, 302);
        }

        // Return the preview URL
        return new Response(
            JSON.stringify({
                success: true,
                previewUrl,
                previewId,
                expiresAt: new Date(expiresAt).toISOString(),
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

    } catch (error) {
        console.error('[CMS Preview] Unexpected error:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to process preview request',
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

/**
 * GET endpoint handler - retrieves preview data by ID
 */
export const GET: APIRoute = async ({ url }) => {
    const previewId = url.searchParams.get('id');

    if (!previewId) {
        return new Response(
            JSON.stringify({
                error: 'Missing required parameter: id',
            }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    const cached = previewCache.get(previewId);

    if (!cached) {
        return new Response(
            JSON.stringify({
                error: 'Preview not found or expired',
                previewId,
            }),
            {
                status: 404,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    // Check if expired
    if (cached.expiresAt < Date.now()) {
        previewCache.delete(previewId);
        return new Response(
            JSON.stringify({
                error: 'Preview has expired',
                previewId,
            }),
            {
                status: 410,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    // Return the preview data as JSON
    return new Response(
        JSON.stringify({
            success: true,
            data: cached.data,
            expiresAt: new Date(cached.expiresAt).toISOString(),
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
};

/**
 * Generate a unique preview ID
 */
function generatePreviewId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomStr}`;
}
