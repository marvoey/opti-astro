/**
 * Content Operations Module
 *
 * Provides functions for checking and creating content in Optimizely CMS
 */

import { OptiCmsClient } from '@optimarvin/opti-cms-client';
import { formatUuid } from '../../../lib/string-utils';
import { Locales } from '../../../../__generated/sdk';
import type { getGraphQLSdk } from './graphql-client';

/**
 * Check if content already exists in the CMS by GUID
 */
export async function contentExistsByGuid(
    sdk: ReturnType<typeof getGraphQLSdk>,
    guid: string
): Promise<boolean> {
    const formattedGuid = formatUuid(guid);
    const content = await sdk.articleByGuid({ guid: formattedGuid });
    return (content.ArticlePage?.total ?? 0) > 0;
}

/**
 * Create a draft ArticlePage in the CMS from CMP webhook fields
 * Returns the created content item from the CMS response
 */
export async function createDraftArticle(
    cmsClient: OptiCmsClient,
    fields: any,
    contentGuid: string,
    locale: string,
    containerId: string,
): Promise<any> {
    const formattedGuid = formatUuid(contentGuid);

    const articlePageData = {
        contentType: 'ArticlePage',
        displayName:
            fields.heading?.[0]?.field_values?.[0]?.text_value || 'Untitled',
        status: 'draft',
        locale: locale || Locales.En,
        owner: null,
        container: containerId,
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
    console.log('CMS Response:', JSON.stringify(response.data, null, 2));

    return response.data;
}
