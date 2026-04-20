import {getClient} from "../helpers/client";
import {gql} from "graphql-request";

const client = getClient("tenant-a");

describe("Validation & Error Handling", () => {

    // PRODUCTS
    describe("Products", () => {
        it("should reject creating a product without a name", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createProduct(input: {
                            price: 10.00
                            status: ACTIVE
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

        it("should reject creating a product without a price", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createProduct(input: {
                            name: "No Price Product"
                            status: ACTIVE
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

        it("should reject creating a product with invalid status", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createProduct(input: {
                            name: "Bad Status Product"
                            price: 10.00
                            status: INVALID_STATUS
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

        it("should reject updating a non-existent product", async () => {
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

        it("should reject deleting a non-existent product", async () => {
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

        it("should reject negative price", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createProduct(input: {
                            name: "Negative Price"
                            price: -10.00
                            status: ACTIVE
                        }) {
                            id
                            price
                        }
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });

        it("should reject zero price", async () => {
            try {
                await client.request(gql`
                    mutation {
                        createProduct(input: {
                            name: "Zero Price"
                            price: 0
                            status: ACTIVE
                        }) {
                            id
                            price
                        }
                    }
                `);
                fail("Should have thrown an error");
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });
    });
// PRIORITY VALIDATION
    it("should use default priority of 100 when not specified", async () => {
        const mutation = gql`
            mutation {
                createImage(input: {
                    url: "https://example.com/default-priority.jpg"
                }) {
                    id
                    priority
                }
            }
        `;

        const data: any = await client.request(mutation);
        expect(data.createImage.priority).toBe(100);

        // Clean up
        await client.request(gql`
            mutation DeleteImage($id: Int!) { deleteImage(id: $id) }
        `, {id: parseInt(data.createImage.id)});
    });

    it("should accept priority at minimum boundary (1)", async () => {
        const mutation = gql`
            mutation {
                createImage(input: {
                    url: "https://example.com/min-priority.jpg"
                    priority: 1
                }) {
                    id
                    priority
                }
            }
        `;

        const data: any = await client.request(mutation);
        expect(data.createImage.priority).toBe(1);

        // Clean up
        await client.request(gql`
            mutation DeleteImage($id: Int!) { deleteImage(id: $id) }
        `, {id: parseInt(data.createImage.id)});
    });

    it("should accept priority at maximum boundary (1000)", async () => {
        const mutation = gql`
            mutation {
                createImage(input: {
                    url: "https://example.com/max-priority.jpg"
                    priority: 1000
                }) {
                    id
                    priority
                }
            }
        `;

        const data: any = await client.request(mutation);
        expect(data.createImage.priority).toBe(1000);

        // Clean up
        await client.request(gql`
            mutation DeleteImage($id: Int!) { deleteImage(id: $id) }
        `, {id: parseInt(data.createImage.id)});
    });

    it("should reject priority below minimum (0)", async () => {
        try {
            await client.request(gql`
                mutation {
                    createImage(input: {
                        url: "https://example.com/bad-priority.jpg"
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

    it("should reject priority above maximum (1001)", async () => {
        try {
            await client.request(gql`
                mutation {
                    createImage(input: {
                        url: "https://example.com/bad-priority.jpg"
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
    // IMAGES
    describe("Images", () => {
        it("should reject creating an image without a url", async () => {
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

        it("should reject image priority below minimum (1)", async () => {
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

        it("should reject image priority above maximum (1000)", async () => {
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

        it("should accept image priority at minimum boundary (1)", async () => {
            const data: any = await client.request(gql`
                mutation {
                    createImage(input: {
                        url: "https://example.com/image.jpg"
                        priority: 1
                    }) {
                        id
                        priority
                    }
                }
            `);

            expect(data.createImage.priority).toBe(1);

            // Clean up
            await client.request(gql`
                mutation DeleteImage($id: Int!) { deleteImage(id: $id) }
            `, {id: parseInt(data.createImage.id)});
        });

        it("should accept image priority at maximum boundary (1000)", async () => {
            const data: any = await client.request(gql`
                mutation {
                    createImage(input: {
                        url: "https://example.com/image.jpg"
                        priority: 1000
                    }) {
                        id
                        priority
                    }
                }
            `);

            expect(data.createImage.priority).toBe(1000);

            // Clean up
            await client.request(gql`
                mutation DeleteImage($id: Int!) { deleteImage(id: $id) }
            `, {id: parseInt(data.createImage.id)});
        });

        it("should reject updating a non-existent image", async () => {
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

        it("should reject deleting a non-existent image", async () => {
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
    });
});