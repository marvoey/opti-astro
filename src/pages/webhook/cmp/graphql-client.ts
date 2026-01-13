/**
 * GraphQL Client Module
 *
 * Provides GraphQL SDK initialization for querying Optimizely Graph
 */

import { GraphQLClient } from 'graphql-request';
import { print } from 'graphql';
import {
    getSdk as optiGraph,
    type Requester,
} from '../../../../__generated/sdk';
import {
    OPTIMIZELY_GRAPH_APP_KEY,
    OPTIMIZELY_GRAPH_SECRET,
    OPTIMIZELY_GRAPH_GATEWAY,
} from './env-config';

/**
 * Initialize and return a GraphQL SDK instance for querying Optimizely Graph
 */
export function getGraphQLSdk() {
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
