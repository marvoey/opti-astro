import type { APIRoute } from 'astro';
import { OptiCmsClient } from '@optimarvin/opti-cms-client';

/**
 * Test endpoint for creating an ArticlePage using the OptiCmsClient
 *
 * Usage: POST to /webhook/cmp/test
 */
export const POST: APIRoute = async () => {
    console.log('Test endpoint: Creating ArticlePage');

    try {
        // Validate required environment variables for CMS client
        const OPTIMIZELY_CLIENT_ID = import.meta.env.OPTIMIZELY_CLIENT_ID;
        const OPTIMIZELY_CLIENT_SECRET = import.meta.env.OPTIMIZELY_CLIENT_SECRET;

        if (!OPTIMIZELY_CLIENT_ID) {
            console.error('OPTIMIZELY_CLIENT_ID is not defined in environment variables');
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
            console.error('OPTIMIZELY_CLIENT_SECRET is not defined in environment variables');
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

        // Initialize CMS client
        console.log('Initializing OptiCmsClient...');
        const CMSClient = new OptiCmsClient({
            credentials: {
                clientId: OPTIMIZELY_CLIENT_ID,
                clientSecret: OPTIMIZELY_CLIENT_SECRET,
            },
            version: 'preview3', // optional, defaults to 'preview3'
        });
        console.log('OptiCmsClient initialized successfully');

        // Define the ArticlePage payload
        const articlePagePayload = {
            displayName: "API Made ArticlePage",
            contentType: "ArticlePage",
            owner: null,
            container: "66876bb6a3504576a654e7ae5c05e789",
            locale: "en",
            properties: {
                heading: "Hello!",
                SeoSettings: {
                    GraphType: "-"
                }
            }
        };

        console.log('Creating ArticlePage with payload:', JSON.stringify(articlePagePayload, null, 2));
        console.log('CMS Client Base URL:', CMSClient.getBaseUrl());
        console.log('CMS Client Version:', CMSClient.getVersion());
        console.log('Full endpoint URL will be:', `${CMSClient.getBaseUrl()}/experimental/content`);

        // Test authentication first
        console.log('Testing authentication...');
        console.log('Has credentials:', CMSClient.hasCredentials());
        console.log('Has access token:', CMSClient.hasAccessToken());

        try {
            const authResult = await CMSClient.authenticate();
            console.log('Authentication successful, token expires in:', authResult.expires_in, 'seconds');
        } catch (authError) {
            console.error('Authentication failed:', authError);
            return new Response(
                JSON.stringify({
                    error: 'Authentication failed',
                    details: authError,
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        // Create the content using the CMS client
        const createResponse = await CMSClient.createContent(articlePagePayload);

        console.log('Creation response - Status:', createResponse.status);
        console.log('Creation response - Data:', JSON.stringify(createResponse.data, null, 2));

        // Check if creation was successful
        if (createResponse.status >= 400) {
            console.error('Failed to create ArticlePage:', createResponse.status, createResponse.data);
            return new Response(
                JSON.stringify({
                    error: 'Failed to create ArticlePage',
                    status: createResponse.status,
                    details: createResponse.data,
                }),
                {
                    status: createResponse.status,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }

        console.log('Successfully created ArticlePage');

        // Return success response
        return new Response(
            JSON.stringify({
                message: 'ArticlePage created successfully',
                status: createResponse.status,
                data: createResponse.data,
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

    } catch (error) {
        console.error('Exception during ArticlePage creation:', error);
        console.error('Error type:', error?.constructor?.name);
        console.error('Error details:', JSON.stringify(error, null, 2));

        // Build error response with available details
        const errorResponse: any = {
            error: 'Exception during ArticlePage creation',
            details: error instanceof Error ? error.message : String(error),
        };

        if (typeof error === 'object' && error !== null) {
            if ('status' in error) errorResponse.status = error.status;
            if ('title' in error) errorResponse.title = error.title;
            if ('type' in error) errorResponse.type = error.type;
            if ('details' in error) errorResponse.apiDetails = error.details;
            if ('errors' in error) errorResponse.errors = error.errors;
        }

        return new Response(
            JSON.stringify(errorResponse),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
};
