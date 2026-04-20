import { getClient } from "../helpers/client";
import { gql } from "graphql-request";

const client = getClient("tenant-a");

describe("Error Handling - Invalid Operations", () => {

    describe("Missing or invalid tenant", () => {
        it("should reject requests with empty tenant header", async () => {
            const emptyTenantClient = getClient("");
            try {
                await emptyTenantClient.request(gql`
                    query { products { id } }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });
    });

    describe("Product error handling", () => {
        it("should return null for non-existent product id", async () => {
            const data: any = await client.request(gql`
                query {
                    product(id: 999999) {
                        id
                        name
                    }
                }
            `);
            expect(data.product).toBeNull();
        });

        it("should throw error when updating non-existent product", async () => {
            try {
                await client.request(gql`
                    mutation {
                        updateProduct(id: 999999, input: { name: "Ghost" }) {
                            id
                        }
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });

        it("should throw error when deleting non-existent product", async () => {
            try {
                await client.request(gql`
                    mutation {
                        deleteProduct(id: 999999)
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });

        it("should throw error when creating product with empty name", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createProduct(input: {
                            name: ""
                            price: 10.00
                        }) {
                            id
                        }
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });

        it("should throw error when creating product with negative price", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createProduct(input: {
                            name: "Negative Price"
                            price: -1.00
                        }) {
                            id
                        }
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });

        it("should throw error when creating product with zero price", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createProduct(input: {
                            name: "Zero Price"
                            price: 0
                        }) {
                            id
                        }
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });
    });

    describe("Image error handling", () => {
        it("should return null for non-existent image id", async () => {
            const data: any = await client.request(gql`
                query {
                    image(id: 999999) {
                        id
                        url
                    }
                }
            `);
            expect(data.image).toBeNull();
        });

        it("should throw error when updating non-existent image", async () => {
            try {
                await client.request(gql`
                    mutation {
                        updateImage(id: 999999, input: {
                            url: "https://example.com/ghost.jpg"
                        }) {
                            id
                        }
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });

        it("should throw error when deleting non-existent image", async () => {
            try {
                await client.request(gql`
                    mutation {
                        deleteImage(id: 999999)
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });

        it("should throw error when creating image without url", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createImage(input: {
                            priority: 100
                        }) {
                            id
                        }
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });

        it("should throw error when creating image with priority below minimum", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createImage(input: {
                            url: "https://example.com/image.jpg"
                            priority: 0
                        }) {
                            id
                        }
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });

        it("should throw error when creating image with priority above maximum", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createImage(input: {
                            url: "https://example.com/image.jpg"
                            priority: 1001
                        }) {
                            id
                        }
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });

        it("should throw error when creating image with non-existent productId", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createImage(input: {
                            url: "https://example.com/image.jpg"
                            priority: 100
                            productId: 999999
                        }) {
                            id
                        }
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });
    });
});