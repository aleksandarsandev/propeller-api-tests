import { GraphQLClient } from "graphql-request";

const API_URL = "http://localhost:3000/graphql";

export function getClient(tenantId: string = "tenant-a"): GraphQLClient {
    return new GraphQLClient(API_URL, {
        headers: {
            "x-tenant-id": tenantId,
        },
    });
}