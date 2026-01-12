import type { APIRoute } from 'astro';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Webhook Capture Endpoint
 *
 * This endpoint captures incoming webhook requests and stores them for inspection.
 * Useful for exploring webhook payload structures from external services.
 *
 * Usage:
 * 1. Point your webhook to: http://your-domain.com/webhook/capture
 * 2. View captured webhooks at: http://your-domain.com/webhook/capture/viewer
 *
 * Features:
 * - Captures all HTTP methods (POST, PUT, GET, etc.)
 * - Stores headers, body, query params, method, and timestamp
 * - In-memory storage with optional file persistence
 * - Auto-cleanup of old entries (keeps last 50)
 */

interface CapturedWebhook {
    id: string;
    timestamp: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: any;
    rawBody: string;
    contentType: string | null;
    userAgent: string | null;
}

// In-memory storage
let capturedWebhooks: CapturedWebhook[] = [];
const MAX_WEBHOOKS = 50;

// File storage path (optional persistence)
const STORAGE_DIR = join(process.cwd(), 'data', 'webhook-captures');
const STORAGE_FILE = join(STORAGE_DIR, 'webhooks.json');

/**
 * Load webhooks from file storage
 */
async function loadWebhooks(): Promise<void> {
    try {
        if (existsSync(STORAGE_FILE)) {
            const data = await readFile(STORAGE_FILE, 'utf-8');
            capturedWebhooks = JSON.parse(data);
            console.log(`[Webhook Capture] Loaded ${capturedWebhooks.length} webhooks from storage`);
        }
    } catch (error) {
        console.error('[Webhook Capture] Failed to load webhooks from storage:', error);
    }
}

/**
 * Save webhooks to file storage
 */
async function saveWebhooks(): Promise<void> {
    try {
        if (!existsSync(STORAGE_DIR)) {
            await mkdir(STORAGE_DIR, { recursive: true });
        }
        await writeFile(STORAGE_FILE, JSON.stringify(capturedWebhooks, null, 2), 'utf-8');
        console.log(`[Webhook Capture] Saved ${capturedWebhooks.length} webhooks to storage`);
    } catch (error) {
        console.error('[Webhook Capture] Failed to save webhooks to storage:', error);
    }
}

// Load webhooks on startup
loadWebhooks();

/**
 * Generate a unique ID for the webhook
 */
function generateId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Handle incoming webhook requests
 */
async function captureWebhook(request: Request): Promise<CapturedWebhook> {
    const url = new URL(request.url);

    // Extract headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
        headers[key] = value;
    });

    // Extract query parameters
    const query: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
        query[key] = value;
    });

    // Get raw body as text
    const rawBody = await request.text();

    // Try to parse body as JSON
    let parsedBody: any = rawBody;
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('application/json') && rawBody) {
        try {
            parsedBody = JSON.parse(rawBody);
        } catch (error) {
            console.log('[Webhook Capture] Body is not valid JSON, storing as text');
        }
    } else if (contentType?.includes('application/x-www-form-urlencoded') && rawBody) {
        // Parse form data
        const formData = new URLSearchParams(rawBody);
        parsedBody = Object.fromEntries(formData.entries());
    }

    const captured: CapturedWebhook = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        method: request.method,
        url: url.pathname + url.search,
        headers,
        query,
        body: parsedBody,
        rawBody,
        contentType,
        userAgent: request.headers.get('user-agent'),
    };

    // Add to captured webhooks
    capturedWebhooks.unshift(captured);

    // Keep only last MAX_WEBHOOKS
    if (capturedWebhooks.length > MAX_WEBHOOKS) {
        capturedWebhooks = capturedWebhooks.slice(0, MAX_WEBHOOKS);
    }

    // Save to file (async, don't wait)
    saveWebhooks();

    console.log(`[Webhook Capture] Captured webhook: ${captured.method} ${captured.url} (ID: ${captured.id})`);

    return captured;
}

/**
 * POST handler - captures webhook
 */
export const POST: APIRoute = async ({ request }) => {
    const captured = await captureWebhook(request);

    return new Response(
        JSON.stringify({
            success: true,
            message: 'Webhook captured successfully',
            webhookId: captured.id,
            timestamp: captured.timestamp,
            viewUrl: `/webhook/capture/viewer`,
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
 * PUT handler - captures webhook
 */
export const PUT: APIRoute = async ({ request }) => {
    const captured = await captureWebhook(request);

    return new Response(
        JSON.stringify({
            success: true,
            message: 'Webhook captured successfully',
            webhookId: captured.id,
            timestamp: captured.timestamp,
            viewUrl: `/webhook/capture/viewer`,
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
 * PATCH handler - captures webhook
 */
export const PATCH: APIRoute = async ({ request }) => {
    const captured = await captureWebhook(request);

    return new Response(
        JSON.stringify({
            success: true,
            message: 'Webhook captured successfully',
            webhookId: captured.id,
            timestamp: captured.timestamp,
            viewUrl: `/webhook/capture/viewer`,
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
 * GET handler - lists captured webhooks or returns specific webhook
 */
export const GET: APIRoute = async ({ url }) => {
    const webhookId = url.searchParams.get('id');

    if (webhookId) {
        // Return specific webhook
        const webhook = capturedWebhooks.find(w => w.id === webhookId);

        if (!webhook) {
            return new Response(
                JSON.stringify({
                    error: 'Webhook not found',
                    webhookId,
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                webhook,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    // Return list of all webhooks
    return new Response(
        JSON.stringify({
            success: true,
            count: capturedWebhooks.length,
            webhooks: capturedWebhooks,
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
 * DELETE handler - clears all captured webhooks
 */
export const DELETE: APIRoute = async ({ url }) => {
    const webhookId = url.searchParams.get('id');

    if (webhookId) {
        // Delete specific webhook
        const index = capturedWebhooks.findIndex(w => w.id === webhookId);

        if (index === -1) {
            return new Response(
                JSON.stringify({
                    error: 'Webhook not found',
                    webhookId,
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        capturedWebhooks.splice(index, 1);
        await saveWebhooks();

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Webhook deleted successfully',
                webhookId,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }

    // Clear all webhooks
    const count = capturedWebhooks.length;
    capturedWebhooks = [];
    await saveWebhooks();

    return new Response(
        JSON.stringify({
            success: true,
            message: `Cleared ${count} captured webhooks`,
            count,
        }),
        {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
};
