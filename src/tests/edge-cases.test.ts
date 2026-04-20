import { getClient } from "../helpers/client";
import { gql } from "graphql-request";

const client = getClient("tenant-a");

describe("Edge Cases", () => {

    describe("Products", () => {
        it("should create a product with minimum valid price (0.01)", async () => {
            const data: any = await client.request(gql`
                mutation {
                    createProduct(input: {
                        name: "Cheap Product"
                        price: 0.01
                        status: ACTIVE
                    }) {
                        id
                        price
                    }
                }
            `);

            expect(data.createProduct.price).toBe(0.01);

            // Clean up
            await client.request(gql`
                mutation DeleteProduct($id: Int!) { deleteProduct(id: $id) }
            `, { id: parseInt(data.createProduct.id) });
        });

        it("should create a product with default ACTIVE status when status not provided", async () => {
            const data: any = await client.request(gql`
                mutation {
                    createProduct(input: {
                        name: "Default Status Product"
                        price: 10.00
                    }) {
                        id
                        status
                    }
                }
            `);

            expect(data.createProduct.status).toBe("ACTIVE");

            // Clean up
            await client.request(gql`
                mutation DeleteProduct($id: Int!) { deleteProduct(id: $id) }
            `, { id: parseInt(data.createProduct.id) });
        });

        it("should update only the fields provided (partial update)", async () => {
            // Create product
            const createData: any = await client.request(gql`
                mutation {
                    createProduct(input: {
                        name: "Partial Update Product"
                        price: 50.00
                        status: ACTIVE
                    }) {
                        id
                        name
                        price
                        status
                    }
                }
            `);
            const id = parseInt(createData.createProduct.id);

            // Update only name
            const updateData: any = await client.request(gql`
                mutation UpdateProduct($id: Int!) {
                    updateProduct(id: $id, input: {
                        name: "Updated Name Only"
                    }) {
                        id
                        name
                        price
                        status
                    }
                }
            `, { id });

            expect(updateData.updateProduct.name).toBe("Updated Name Only");
            expect(updateData.updateProduct.price).toBe(50.00); // unchanged
            expect(updateData.updateProduct.status).toBe("ACTIVE"); // unchanged

            // Clean up
            await client.request(gql`
                mutation DeleteProduct($id: Int!) { deleteProduct(id: $id) }
            `, { id });
        });

        it("should handle very large price values", async () => {
            const data: any = await client.request(gql`
                mutation {
                    createProduct(input: {
                        name: "Expensive Product"
                        price: 999999.99
                        status: ACTIVE
                    }) {
                        id
                        price
                    }
                }
            `);

            expect(data.createProduct.price).toBe(999999.99);

            // Clean up
            await client.request(gql`
                mutation DeleteProduct($id: Int!) { deleteProduct(id: $id) }
            `, { id: parseInt(data.createProduct.id) });
        });

        it("should filter products combining name and status", async () => {
            const data: any = await client.request(gql`
                query {
                    products(filter: { name: "bolt", status: ACTIVE }) {
                        id
                        name
                        status
                    }
                }
            `);

            data.products.forEach((p: any) => {
                expect(p.name.toLowerCase()).toContain("bolt");
                expect(p.status).toBe("ACTIVE");
            });
        });

        it("should return products list with images relationship", async () => {
            const data: any = await client.request(gql`
                query {
                    products {
                        id
                        name
                        images {
                            id
                            url
                        }
                    }
                }
            `);

            expect(data.products.length).toBeGreaterThan(0);
            data.products.forEach((p: any) => {
                expect(Array.isArray(p.images)).toBe(true);
            });
        });
    });

    describe("Images", () => {
        it("should update only url without changing priority (partial update)", async () => {
            // Create image
            const createData: any = await client.request(gql`
                mutation {
                    createImage(input: {
                        url: "https://example.com/original.jpg"
                        priority: 500
                    }) {
                        id
                        url
                        priority
                    }
                }
            `);
            const id = parseInt(createData.createImage.id);

            // Update only url
            const updateData: any = await client.request(gql`
                mutation UpdateImage($id: Int!) {
                    updateImage(id: $id, input: {
                        url: "https://example.com/new.jpg"
                    }) {
                        id
                        url
                        priority
                    }
                }
            `, { id });

            expect(updateData.updateImage.url).toBe("https://example.com/new.jpg");
            expect(updateData.updateImage.priority).toBe(500); // unchanged

            // Clean up
            await client.request(gql`
                mutation DeleteImage($id: Int!) { deleteImage(id: $id) }
            `, { id });
        });

        it("should fetch images without productId filter returns all tenant images", async () => {
            const data: any = await client.request(gql`
                query {
                    images {
                        id
                        tenantId
                    }
                }
            `);

            expect(data.images.length).toBeGreaterThan(0);
            data.images.forEach((img: any) => {
                expect(img.tenantId).toBe("tenant-a");
            });
        });

        it("should return empty array when filtering images by non-existent productId", async () => {
            const data: any = await client.request(gql`
                query {
                    images(productId: 999999) {
                        id
                    }
                }
            `);

            expect(data.images).toEqual([]);
        });
    });
});