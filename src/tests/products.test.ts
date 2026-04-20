import { getClient } from "../helpers/client";
import { gql } from "graphql-request";

const client = getClient("tenant-a");

describe("Products - CRUD", () => {
    let createdProductId: number;

    afterAll(async () => {
        // Clean up in case any test failed before deletion
        if (createdProductId) {
            try {
                const mutation = gql`
                    mutation DeleteProduct($id: Int!) {
                        deleteProduct(id: $id)
                    }
                `;
                await client.request(mutation, { id: createdProductId });
            } catch {
                // Product may already be deleted, ignore
            }
        }
    });

    // CREATE
    it("should create a product", async () => {
        const mutation = gql`
            mutation {
                createProduct(input: {
                    name: "Test Product"
                    price: 29.99
                    status: ACTIVE
                }) {
                    id
                    name
                    price
                    status
                }
            }
        `;

        const data: any = await client.request(mutation);
        const product = data.createProduct;

        expect(product).toBeDefined();
        expect(product.id).toBeDefined();
        expect(product.name).toBe("Test Product");
        expect(product.price).toBe(29.99);
        expect(product.status).toBe("ACTIVE");

        createdProductId = parseInt(product.id);
    });

    // READ single
    it("should fetch a single product by id", async () => {
        const query = gql`
            query GetProduct($id: Int!) {
                product(id: $id) {
                    id
                    name
                    price
                    status
                }
            }
        `;

        const data: any = await client.request(query, { id: createdProductId });
        const product = data.product;

        expect(product).toBeDefined();
        expect(parseInt(product.id)).toBe(createdProductId);
        expect(product.name).toBe("Test Product");
    });

    // UPDATE
    it("should update a product", async () => {
        const mutation = gql`
            mutation UpdateProduct($id: Int!) {
                updateProduct(id: $id, input: {
                    name: "Updated Product"
                    price: 49.99
                    status: INACTIVE
                }) {
                    id
                    name
                    price
                    status
                }
            }
        `;

        const data: any = await client.request(mutation, { id: createdProductId });
        const product = data.updateProduct;

        expect(product.name).toBe("Updated Product");
        expect(product.price).toBe(49.99);
        expect(product.status).toBe("INACTIVE");
    });

    // DELETE
    it("should delete a product", async () => {
        const mutation = gql`
            mutation DeleteProduct($id: Int!) {
                deleteProduct(id: $id)
            }
        `;

        const data: any = await client.request(mutation, { id: createdProductId });
        expect(data.deleteProduct).toBe(true);
    });

    // CONFIRM DELETION
    it("should return null when fetching a deleted product", async () => {
        const query = gql`
            query GetProduct($id: Int!) {
                product(id: $id) {
                    id
                    name
                }
            }
        `;

        const data: any = await client.request(query, { id: createdProductId });
        expect(data.product).toBeNull();
    });
});