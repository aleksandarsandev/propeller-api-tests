import { getClient } from "../helpers/client";
import { gql } from "graphql-request";

const client = getClient("tenant-a");

describe("Products - Filtering", () => {
    it("should filter products by name (partial, case-insensitive)", async () => {
        const query = gql`
      query {
        products(filter: { name: "bolt" }) {
          id
          name
        }
      }
    `;

        const data: any = await client.request(query);
        expect(data.products.length).toBeGreaterThan(0);
        data.products.forEach((p: any) => {
            expect(p.name.toLowerCase()).toContain("bolt");
        });
    });

    it("should filter products by ACTIVE status", async () => {
        const query = gql`
      query {
        products(filter: { status: ACTIVE }) {
          id
          name
          status
        }
      }
    `;

        const data: any = await client.request(query);
        expect(data.products.length).toBeGreaterThan(0);
        data.products.forEach((p: any) => {
            expect(p.status).toBe("ACTIVE");
        });
    });

    it("should filter products by INACTIVE status", async () => {
        const query = gql`
      query {
        products(filter: { status: INACTIVE }) {
          id
          name
          status
        }
      }
    `;

        const data: any = await client.request(query);
        expect(data.products.length).toBeGreaterThan(0);
        data.products.forEach((p: any) => {
            expect(p.status).toBe("INACTIVE");
        });
    });

    it("should filter products by minPrice", async () => {
        const query = gql`
      query {
        products(filter: { minPrice: 50 }) {
          id
          name
          price
        }
      }
    `;

        const data: any = await client.request(query);
        expect(data.products.length).toBeGreaterThan(0);
        data.products.forEach((p: any) => {
            expect(p.price).toBeGreaterThanOrEqual(50);
        });
    });

    it("should filter products by maxPrice", async () => {
        const query = gql`
      query {
        products(filter: { maxPrice: 30 }) {
          id
          name
          price
        }
      }
    `;

        const data: any = await client.request(query);
        expect(data.products.length).toBeGreaterThan(0);
        data.products.forEach((p: any) => {
            expect(p.price).toBeLessThanOrEqual(30);
        });
    });

    it("should filter products by price range (minPrice + maxPrice)", async () => {
        const query = gql`
      query {
        products(filter: { minPrice: 20, maxPrice: 50 }) {
          id
          name
          price
        }
      }
    `;

        const data: any = await client.request(query);
        expect(data.products.length).toBeGreaterThan(0);
        data.products.forEach((p: any) => {
            expect(p.price).toBeGreaterThanOrEqual(20);
            expect(p.price).toBeLessThanOrEqual(50);
        });
    });

    it("should return empty array when no products match filter", async () => {
        const query = gql`
      query {
        products(filter: { name: "xyznonexistentproduct" }) {
          id
          name
        }
      }
    `;

        const data: any = await client.request(query);
        expect(data.products).toEqual([]);
    });
});