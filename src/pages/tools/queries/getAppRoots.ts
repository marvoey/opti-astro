import { graphql } from "../codegen/graphql/gql";

export const GetAppRoots = graphql(`
    query GetAppRoots{
        _Content(where: { _metadata: { url: { default: { eq: "/" } }, locale: {  } } }) {
            total
            
            items {
                _metadata {
                    displayName
                    types
                    url {
                        base
                    }
                }
                _id
            }
        }
    }`);