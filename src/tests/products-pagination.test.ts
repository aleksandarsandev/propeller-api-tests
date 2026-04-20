import {getClient} from "../helpers/client";
import {gql} from "graphql-request";

const client = getClient("tenant-a");

describe("Products - Pagination", () => {
    it("should return default page size of 10 products", async () => {
        const query = gql`
            query {
                products {
                    id
                    name
                }
            }
        `;

        const data: any = await client.request(query);
        expect(data.products.length).toBeLessThanOrEqual(10);
    });

    it("should return correct products for page 1", async () => {
        const query = gql`
            query {
                products(page: 1, pageSize: 5) {
                    id
                    name
                }
            }
        `;

        const data: any = await client.request(query);
        expect(data.products.length).toBeLessThanOrEqual(5);
        expect(data.products.length).toBeGreaterThan(0);
    });

    it("should return different products on page 2", async () => {
        const page1Query = gql`
            query {
                products(page: 1, pageSize: 5) {
                    id
                    name
                }
            }
        `;

        const page2Query = gql`
            query {
                products(page: 2, pageSize: 5) {
                    id
                    name
                }
            }
        `;

        const page1Data: any = await client.request(page1Query);
        const page2Data: any = await client.request(page2Query);

        const page1Ids = page1Data.products.map((p: any) => p.id);
        const page2Ids = page2Data.products.map((p: any) => p.id);

        // No overlap between pages
        const overlap = page1Ids.filter((id: any) => page2Ids.includes(id));
        expect(overlap.length).toBe(0);
    });

    it("should return empty array when page exceeds total products", async () => {
        const query = gql`
            query {
                products(page: 999, pageSize: 10) {
                    id
                    name
                }
            }
        `;

        const data: any = await client.request(query);
        expect(data.products).toEqual([]);
    });

    it("should respect custom pageSize", async () => {
        const query = gql`
            query {
                products(page: 1, pageSize: 3) {
                    id
                    name
                }
            }
        `;

        const data: any = await client.request(query);
        expect(data.products.length).toBeLessThanOrEqual(3);
    });

    it("should return remaining products on last page", async () => {
        // First get total count from page 1
        const page1: any = await client.request(gql`query { products(page: 1, pageSize: 100) { id } }`);
        const total = page1.products.length;

        const pageSize = 5;
        const lastPage = Math.ceil(total / pageSize);
        const expectedRemaining = total % pageSize === 0 ? pageSize : total % pageSize;

        const query = gql`
            query GetPage($page: Int!) {
                products(page: $page, pageSize: 5) {
                    id
                    name
                }
            }
        `;

        const data: any = await client.request(query, {page: lastPage});
        expect(data.products.length).toBe(expectedRemaining);
    });

    it("should return all products across all pages without duplicates", async () => {
        // Get total first
        const allData: any = await client.request(gql`query { products(page: 1, pageSize: 100) { id } }`);
        const total = allData.products.length;

        const pageSize = 5;
        const totalPages = Math.ceil(total / pageSize);

        let allIds: string[] = [];

        for (let page = 1; page <= totalPages; page++) {
            const query = gql`
                query GetPage($page: Int!) {
                    products(page: $page, pageSize: 5) { id }
                }
            `;
            const data: any = await client.request(query, {page});
            allIds = [...allIds, ...data.products.map((p: any) => p.id)];
        }

        expect(allIds.length).toBe(total);

        const uniqueIds = new Set(allIds);
        expect(uniqueIds.size).toBe(total);
    });
});